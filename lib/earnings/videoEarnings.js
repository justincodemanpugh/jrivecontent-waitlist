// Base pay and CPM accrual for campaign videos. Server-only; called by
// the daily /api/earnings/accrue cron and right after a brand approves a
// video (/api/programs/videos/review) so base pay shows up immediately.
import {
  BRAND_VOUCHED,
  cpmIncrement,
  looksSuspicious,
  viewWindowEnd,
} from "@/lib/earnings/calc";
import { addEarning } from "@/lib/earnings/ledger";
import { currentPeriod } from "@/lib/programs/periods";

const PROGRAM_COLUMNS = `id, brand_id, title, status, payout_schedule, created_at,
  videos_per_period, pay_per_video_cents, cpm_cents, max_payout_per_video_cents,
  view_window_days, monthly_cap_cents, ledger_started_at`;

// A video earns only if it was posted after the creator joined and after
// the campaign moved onto the ledger (see 0047 ledger_started_at).
export function videoIsEligible(video, member, program) {
  if (!video.posted_at) return false;
  const posted = new Date(video.posted_at);
  if (member.joined_at && posted < new Date(member.joined_at)) return false;
  if (program.ledger_started_at && posted < new Date(program.ledger_started_at)) return false;
  return true;
}

function earningRow(program, member, video, extra) {
  return {
    brand_id: program.brand_id,
    program_id: program.id,
    program_member_id: member.id,
    creator_id: member.creator_id,
    program_video_id: video.id,
    ...extra,
  };
}

// Base pay for one approved video, if the member is still under the
// campaign's per-period video target for the period the video was posted in.
export async function accrueBaseForVideo(admin, { program, member, video, now = new Date() }) {
  if (!program.pay_per_video_cents) return { inserted: false };
  if (video.review_status !== "approved") return { inserted: false };
  if (!videoIsEligible(video, member, program)) return { inserted: false };

  const period = currentPeriod(program, new Date(video.posted_at));

  // Approved videos in the same period that already earned base pay.
  const { data: earned, error } = await admin
    .from("creator_earnings")
    .select("id, program_video_id, meta")
    .eq("program_member_id", member.id)
    .eq("kind", "base")
    .neq("status", "reversed");
  if (error) throw error;

  if (earned.some((e) => e.program_video_id === video.id)) return { inserted: false };
  const inPeriod = earned.filter((e) => e.meta?.period_start === period.start.toISOString());
  if (inPeriod.length >= (program.videos_per_period || 0)) return { inserted: false, overTarget: true };

  return addEarning(
    admin,
    earningRow(program, member, video, {
      kind: "base",
      amount_cents: program.pay_per_video_cents,
      source_key: `base:${video.id}`,
      meta: { period_start: period.start.toISOString(), period_end: period.end.toISOString() },
    }),
    { program, now },
  );
}

// CPM for one approved video: credit the growth in its cumulative target
// since the last CPM row. Views after the view window closes don't count.
export async function accrueCpmForVideo(admin, { program, member, video, now = new Date() }) {
  if (!program.cpm_cents) return { inserted: false };
  if (video.review_status !== "approved") return { inserted: false };
  if (!videoIsEligible(video, member, program)) return { inserted: false };

  const windowEnd = viewWindowEnd(video.posted_at, program.view_window_days || 30);

  // Inside the window use the live count. Once it has closed, use the last
  // snapshot taken before it closed (the cron may have missed the exact day).
  let views = Number(video.views) || 0;
  if (now > windowEnd) {
    const { data: snap } = await admin
      .from("program_video_metric_snapshots")
      .select("views, captured_at")
      .eq("program_video_id", video.id)
      .lte("captured_at", windowEnd.toISOString())
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!snap) return { inserted: false };
    views = Number(snap.views) || 0;
  }

  const { data: prior, error } = await admin
    .from("creator_earnings")
    .select("kind, amount_cents, meta, status")
    .eq("program_video_id", video.id)
    .in("kind", ["base", "cpm"])
    .neq("status", "reversed");
  if (error) throw error;

  const previousTargetCents = prior
    .filter((e) => e.kind === "cpm")
    .reduce((max, e) => Math.max(max, Number(e.meta?.target_cents) || 0), 0);
  const baseEarnedCents = prior
    .filter((e) => e.kind === "base")
    .reduce((sum, e) => sum + e.amount_cents, 0);

  const { targetCents, incrementCents } = cpmIncrement({
    views,
    cpmCents: program.cpm_cents,
    previousTargetCents,
    maxPayoutPerVideoCents: program.max_payout_per_video_cents,
    baseEarnedCents,
  });
  if (incrementCents <= 0) return { inserted: false };

  const day = now.toISOString().slice(0, 10);
  return addEarning(
    admin,
    earningRow(program, member, video, {
      kind: "cpm",
      amount_cents: incrementCents,
      source_key: `cpm:${video.id}:${day}`,
      meta: { target_cents: targetCents, views },
    }),
    { program, now },
  );
}

async function videoLedger(admin, videoId) {
  const { data, error } = await admin
    .from("creator_earnings")
    .select("*")
    .eq("program_video_id", videoId)
    .in("kind", ["base", "cpm", "adjustment"]);
  if (error) throw error;
  return data || [];
}

// A row that hasn't moved any money: not paid and not part of a charge.
const unmoved = (e) => (e.status === "held" || e.status === "payable") && !e.payout_batch_id;

// Cancel an unmoved row. source_key is renamed so the same earning can be
// recorded again if the brand later approves the video.
async function voidRow(admin, row, reason) {
  const { data, error } = await admin
    .from("creator_earnings")
    .update({
      status: "reversed",
      source_key: `void:${row.id}`,
      meta: { ...(row.meta || {}), reversed_reason: reason },
    })
    .eq("id", row.id)
    .in("status", ["held", "payable"])
    .is("payout_batch_id", null)
    .select("id");
  if (error) throw error;
  return !!data?.length;
}

// What the video's live rows add up to, and how many adjustments it has had
// (used to give each new one its own key).
async function videoBalance(admin, videoId) {
  const rows = await videoLedger(admin, videoId);
  const live = rows.filter((e) => e.status !== "reversed");
  return {
    live,
    adjustments: rows.filter((e) => e.kind === "adjustment").length,
    sum: (kinds) =>
      live.filter((e) => kinds.includes(e.kind)).reduce((s, e) => s + e.amount_cents, 0),
  };
}

function addVideoAdjustment(admin, like, amountCents, sourceKey, reason) {
  return addEarning(admin, {
    brand_id: like.brand_id,
    program_id: like.program_id,
    program_member_id: like.program_member_id,
    creator_id: like.creator_id,
    program_video_id: like.program_video_id,
    kind: "adjustment",
    amount_cents: amountCents,
    source_key: sourceKey,
    meta: { reason },
  });
}

// Brand rejected a video: bring what it earned back to zero. Money not yet
// moved is cancelled; money already paid (or being charged) is netted from
// the creator's next payout.
export async function reverseVideoEarnings(admin, videoId, reason) {
  let reversedCents = 0;
  for (const e of await videoLedger(admin, videoId)) {
    // Unpaid clawbacks stay: they offset money that has already moved.
    if (!unmoved(e) || (e.kind === "adjustment" && e.amount_cents < 0)) continue;
    if (await voidRow(admin, e, reason)) reversedCents += e.amount_cents;
  }

  const { live, adjustments, sum } = await videoBalance(admin, videoId);
  const owed = sum(["base", "cpm", "adjustment"]);
  if (owed <= 0) return { reversedCents, clawedBackCents: 0 };

  const { inserted } = await addVideoAdjustment(
    admin,
    live[0],
    -owed,
    `reject:${videoId}:${adjustments}`,
    reason,
  );
  return { reversedCents, clawedBackCents: inserted ? owed : 0 };
}

// Brand approved a video it had rejected: undo the clawbacks. Cancelled
// earnings are simply accrued again by the caller. A no-op for a video that
// was never rejected.
export async function restoreVideoEarnings(admin, videoId) {
  for (const e of await videoLedger(admin, videoId)) {
    if (e.kind === "adjustment" && e.amount_cents < 0 && unmoved(e)) {
      await voidRow(admin, e, "video_approved");
    }
  }

  // Clawbacks already netted out of a payout have to be paid back.
  const { live, adjustments, sum } = await videoBalance(admin, videoId);
  const clawedBack = -sum(["adjustment"]);
  if (clawedBack <= 0) return;
  await addVideoAdjustment(
    admin,
    live[0],
    clawedBack,
    `restore:${videoId}:${adjustments}`,
    "video_approved",
  );
}

// The daily pass over every active campaign:
//   1. flag videos whose views look bought
//   2. accrue base + CPM for videos the brand has approved
// Nothing earns until the brand approves it: every video a creator posts is
// synced, including ones that aren't about the app.
export async function accrueVideoEarnings(admin, { now = new Date() } = {}) {
  const results = { flagged: 0, base: 0, cpm: 0, cappedPrograms: new Set(), errors: [] };

  const { data: programs, error } = await admin
    .from("programs")
    .select(`${PROGRAM_COLUMNS}, program_members ( id, creator_id, status, joined_at )`)
    .eq("status", "active");
  if (error) throw error;

  for (const program of programs || []) {
    if (!program.pay_per_video_cents && !program.cpm_cents) continue;
    const members = (program.program_members || []).filter((m) => m.status === "active");

    for (const member of members) {
      try {
        const { data: videos, error: vErr } = await admin
          .from("program_videos")
          .select("id, posted_at, views, likes, review_status, flagged_reason")
          .eq("program_member_id", member.id)
          .in("review_status", ["pending", "approved"]);
        if (vErr) throw vErr;

        for (const video of videos || []) {
          if (!videoIsEligible(video, member, program)) continue;

          // Pending videos are flagged so the brand sees why; approved ones so
          // they stop earning until the brand looks again. Approving a video
          // that already looked suspicious vouches for it.
          if (video.flagged_reason !== BRAND_VOUCHED && looksSuspicious(video)) {
            await admin
              .from("program_videos")
              .update({ review_status: "flagged", flagged_reason: "low_engagement" })
              .eq("id", video.id)
              .eq("review_status", video.review_status);
            results.flagged += 1;
            continue;
          }

          if (video.review_status !== "approved") continue;

          const base = await accrueBaseForVideo(admin, { program, member, video, now });
          if (base.inserted) results.base += 1;
          if (base.capped) results.cappedPrograms.add(program.id);

          const cpm = await accrueCpmForVideo(admin, { program, member, video, now });
          if (cpm.inserted) results.cpm += 1;
          if (cpm.capped) results.cappedPrograms.add(program.id);
        }
      } catch (e) {
        console.error("[earnings] member accrual failed", member.id, e);
        results.errors.push({ program_member_id: member.id, error: e.message });
      }
    }
  }

  return results;
}

export { PROGRAM_COLUMNS };
