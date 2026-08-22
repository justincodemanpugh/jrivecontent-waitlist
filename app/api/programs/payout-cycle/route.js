// GET|POST /api/programs/payout-cycle
// Cron-triggered endpoint that closes out billing periods for active programs.
//
// Vercel Cron invokes with GET and an `Authorization: Bearer <CRON_SECRET>`
// header; POST with `x-cron-secret` is supported for manual runs.
//
// For each active member of each active program it looks at the period that
// just closed, counts the videos posted in that window (capped at the
// program's target), and creates a `pending` program_payouts row so the brand
// sees what's owed without hunting through each program. Funding stays manual:
// the brand still pays through Stripe Checkout from the Payouts page.
//
// Runs after both sync jobs so the video counts are current.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { feeBreakdown } from "@/lib/stripe/server";
import { previousPeriod, formatPeriod } from "@/lib/programs/periods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handler(request) {
  const secret = process.env.CRON_SECRET;
  const providedHeader = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const providedAuth = authHeader?.replace("Bearer ", "");

  if (!secret || (providedHeader !== secret && providedAuth !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results = {
    programsProcessed: 0,
    payoutsCreated: 0,
    skippedExisting: 0,
    skippedNoVideos: 0,
    errors: [],
  };

  const { data: programs, error: programsErr } = await admin
    .from("programs")
    .select(
      `id, brand_id, title, payout_schedule, videos_per_period,
       pay_per_video_cents, created_at,
       program_members ( id, creator_id, status )`,
    )
    .eq("status", "active");
  if (programsErr) {
    console.error("[payout-cycle] failed to load programs", programsErr);
    return NextResponse.json({ error: programsErr.message }, { status: 500 });
  }

  // Brands who got at least one new payout row this run, so we notify once
  // per brand rather than once per creator.
  const notifyByBrand = new Map();

  for (const program of programs || []) {
    try {
      const period = previousPeriod(program);
      const periodStart = period.start.toISOString();
      const periodEnd = period.end.toISOString();

      const members = (program.program_members || []).filter(
        (m) => m.status === "active",
      );
      if (!members.length) continue;
      results.programsProcessed += 1;

      // The brand's Connect account is recorded on the row so the funding
      // step doesn't have to re-resolve it. A brand who hasn't connected yet
      // still gets the row — they just can't fund it until they do.
      const { data: brandProfile } = await admin
        .from("brand_profiles")
        .select("stripe_account_id")
        .eq("user_id", program.brand_id)
        .maybeSingle();

      for (const member of members) {
        try {
          // Idempotency: never touch a period that already has a payout in
          // flight. A blind upsert would reset an escrowed row to 'pending'
          // and orphan its Stripe session.
          const { data: existing } = await admin
            .from("program_payouts")
            .select("id, status")
            .eq("program_member_id", member.id)
            .eq("period_start", periodStart)
            .eq("period_end", periodEnd)
            .maybeSingle();
          if (existing && existing.status !== "failed") {
            results.skippedExisting += 1;
            continue;
          }

          const { count: videoCount } = await admin
            .from("program_videos")
            .select("id", { count: "exact", head: true })
            .eq("program_member_id", member.id)
            .gte("posted_at", periodStart)
            .lt("posted_at", periodEnd);

          const billableVideos = Math.min(
            videoCount || 0,
            program.videos_per_period,
          );
          const amountCents = billableVideos * program.pay_per_video_cents;
          if (amountCents <= 0) {
            results.skippedNoVideos += 1;
            continue;
          }

          const breakdown = feeBreakdown(amountCents);
          const row = {
            program_member_id: member.id,
            program_id: program.id,
            brand_id: program.brand_id,
            creator_id: member.creator_id,
            payout_type: "period",
            period_start: periodStart,
            period_end: periodEnd,
            video_count: billableVideos,
            amount_cents: breakdown.amountCents,
            platform_fee_cents: breakdown.platformFeeCents,
            creator_payout_cents: breakdown.creatorPayoutCents,
            brand_stripe_account_id: brandProfile?.stripe_account_id || null,
            status: "pending",
          };

          const { error: writeErr } = existing
            ? await admin.from("program_payouts").update(row).eq("id", existing.id)
            : await admin.from("program_payouts").insert(row);
          if (writeErr) throw writeErr;

          results.payoutsCreated += 1;

          const tally = notifyByBrand.get(program.brand_id) || {
            count: 0,
            totalCents: 0,
            period,
          };
          tally.count += 1;
          tally.totalCents += breakdown.amountCents;
          notifyByBrand.set(program.brand_id, tally);
        } catch (e) {
          console.error("[payout-cycle] member failed", member.id, e);
          results.errors.push({ program_member_id: member.id, error: e.message });
        }
      }
    } catch (e) {
      console.error("[payout-cycle] program failed", program.id, e);
      results.errors.push({ program_id: program.id, error: e.message });
    }
  }

  // One in-app notification per brand. The Supabase database webhook on
  // `notifications` turns this into an email via /api/notifications/email.
  for (const [brandId, tally] of notifyByBrand) {
    try {
      const dollars = (tally.totalCents / 100).toFixed(2);
      await admin.from("notifications").insert({
        user_id: brandId,
        type: "program_payout_due",
        title: `${tally.count} creator payout${tally.count === 1 ? "" : "s"} ready to fund`,
        body: `${formatPeriod(tally.period)} closed with $${dollars} owed across ${tally.count} creator${tally.count === 1 ? "" : "s"}.`,
        link_url: "/dashboard/brand/programs/payouts",
      });
    } catch (e) {
      console.error("[payout-cycle] notification failed", brandId, e);
      results.errors.push({ brand_id: brandId, error: e.message });
    }
  }

  return NextResponse.json({ ok: true, ...results });
}

export const GET = handler;
export const POST = handler;
