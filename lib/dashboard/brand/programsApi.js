// Programs API for the brand dashboard.
// A Program is an ongoing TikTok creator arrangement: "post N videos every
// week/month, get paid $X per video on a weekly/biweekly/monthly cycle."
// Unlike briefs (one-off), programs run continuously and their video
// performance (views/likes/comments/shares) is tracked automatically by the
// tiktok-sync cron job once a creator connects their TikTok account.

import { createClient } from "@/lib/supabase/client";
import {
  fetchTrackedAccounts,
  fetchTrackedAccountVideos,
} from "@/lib/dashboard/brand/trackedAccountsApi";
import {
  brandHasActiveSubscription,
  TRIAL_REQUIRED_MESSAGE,
} from "@/lib/billing/subscription";

export const PAYOUT_SCHEDULES = [
  { key: "weekly", label: "Weekly" },
  { key: "biweekly", label: "Biweekly" },
  { key: "monthly", label: "Monthly" },
];

export const PERIOD_TYPES = [
  { key: "week", label: "week" },
  { key: "month", label: "month" },
];

function notifyProgramsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("programs:changed"));
  }
}

function notifyConversationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("conversations:changed"));
  }
}

// Open a message thread for each creator invited to a program, so brands can
// reach the creators they're tracking. Unique (program_id, creator_id)
// prevents dupes when a creator is re-invited.
async function ensureProgramConversations(supabase, program, brandId, creatorIds) {
  for (const creatorId of creatorIds) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("program_id", program.id)
      .eq("creator_id", creatorId)
      .maybeSingle();
    if (existing) continue;

    const { data: conversation, error } = await supabase
      .from("conversations")
      .insert({
        program_id: program.id,
        brand_id: brandId,
        creator_id: creatorId,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: brandId,
      body: `You've been invited to "${program.title}" — say hi!`,
      kind: "system",
    });
  }
  notifyConversationsChanged();
}

function mapMember(row) {
  const p = row.creator_profiles;
  const videos = row.program_videos || [];
  const totals = videos.reduce(
    (acc, v) => {
      acc.views += v.views || 0;
      acc.likes += v.likes || 0;
      acc.comments += v.comments || 0;
      acc.shares += v.shares || 0;
      return acc;
    },
    { views: 0, likes: 0, comments: 0, shares: 0 },
  );
  return {
    id: row.id,
    creatorId: row.creator_id,
    status: row.status,
    invitedAt: row.invited_at,
    joinedAt: row.joined_at,
    name: p?.display_name || p?.handle || "Creator",
    handle: p?.handle || "",
    avatarUrl: p?.avatar_url || null,
    tiktokHandle: p?.tiktok_handle || "",
    videos: videos
      .map((v) => ({
        id: v.id,
        tiktokVideoId: v.tiktok_video_id,
        videoUrl: v.video_url,
        postedAt: v.posted_at,
        views: v.views || 0,
        likes: v.likes || 0,
        comments: v.comments || 0,
        shares: v.shares || 0,
        lastSyncedAt: v.last_synced_at,
      }))
      .sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0)),
    videoCount: videos.length,
    totals,
  };
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

export async function fetchMyPrograms() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("programs")
    .select(`
      id, title, description, platform, videos_per_period, period_type,
      pay_per_video_cents, payout_schedule, status, created_at, updated_at,
      program_members (
        id, creator_id, status, invited_at, joined_at,
        creator_profiles!program_members_creator_id_fkey_profile (
          display_name, handle, avatar_url, tiktok_handle
        ),
        program_videos ( id, views, likes, comments, shares )
      )
    `)
    .eq("brand_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((program) => {
    const members = (program.program_members || []).map(mapMember);
    return {
      id: program.id,
      title: program.title,
      description: program.description,
      platform: program.platform,
      videosPerPeriod: program.videos_per_period,
      periodType: program.period_type,
      payPerVideoCents: program.pay_per_video_cents,
      payoutSchedule: program.payout_schedule,
      status: program.status,
      createdAt: program.created_at,
      updatedAt: program.updated_at,
      members,
      activeMembersCount: members.filter((m) => m.status === "active").length,
      totalViews: members.reduce((sum, m) => sum + m.totals.views, 0),
    };
  });
}

export async function fetchProgramById(programId) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("programs")
    .select(`
      id, brand_id, title, description, platform, videos_per_period, period_type,
      pay_per_video_cents, payout_schedule, status, test_payout_amount_cents,
      created_at, updated_at,
      program_members (
        id, creator_id, status, invited_at, joined_at,
        creator_profiles!program_members_creator_id_fkey_profile (
          display_name, handle, avatar_url, tiktok_handle
        ),
        program_videos ( id, tiktok_video_id, video_url, posted_at, views, likes, comments, shares, last_synced_at ),
        program_payouts ( id, payout_type, period_start, period_end, video_count, amount_cents, platform_fee_cents, creator_payout_cents, status, created_at )
      )
    `)
    .eq("id", programId)
    .single();

  if (error) throw error;

  const members = (data.program_members || []).map((row) => ({
    ...mapMember(row),
    payouts: (row.program_payouts || [])
      .map((p) => ({
        id: p.id,
        payoutType: p.payout_type || "period",
        periodStart: p.period_start,
        periodEnd: p.period_end,
        videoCount: p.video_count,
        amountCents: p.amount_cents,
        platformFeeCents: p.platform_fee_cents,
        creatorPayoutCents: p.creator_payout_cents,
        status: p.status,
        createdAt: p.created_at,
      }))
      // Test payouts have no period; fall back to created_at so they sort.
      .sort(
        (a, b) =>
          new Date(b.periodStart || b.createdAt) -
          new Date(a.periodStart || a.createdAt),
      ),
  }));

  return {
    id: data.id,
    brandId: data.brand_id,
    title: data.title,
    description: data.description,
    platform: data.platform,
    videosPerPeriod: data.videos_per_period,
    periodType: data.period_type,
    payPerVideoCents: data.pay_per_video_cents,
    payoutSchedule: data.payout_schedule,
    status: data.status,
    testPayoutAmountCents: data.test_payout_amount_cents || 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    members,
  };
}

// Fallback series builder, used only until there are at least two days of
// metric snapshots to plot (see buildMetricsFromSnapshots, which is the real
// thing). Turns the flat list of tracked videos into a daily time series +
// trailing-window deltas. Pure/synchronous so it's easy to reason about.
//
// The view curve here is an approximation: each video's *current* view count
// is attributed to the day it was posted and cumulated. That's not real
// history — a video that grew to 3M over months shows as 3M on its post day —
// but it renders something sensible on a fresh install with no snapshots yet.
//
// The chart's own window (the `series`) and the "+X this period" stat badges
// (the `deltas`) are intentionally decoupled: deltas always reflect a fixed
// trailing `minDays`-day period, while the series window auto-expands back to
// the earliest tracked video (capped at `maxDays`) so accounts with
// pre-existing video history show a real growth curve instead of a flat line
// pinned at the top of a window with no in-window activity.
export function buildProgramMetrics(videos, { minDays = 30, maxDays = 180 } = {}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  // --- Fixed trailing-`minDays` deltas (stat badges) -----------------------
  const deltaStartMs = todayMs - (minDays - 1) * 86400000;
  const deltas = { views: 0, likes: 0, comments: 0, postedVideos: 0, activeAccounts: 0 };
  const creatorsThisWindow = new Set();

  for (const v of videos || []) {
    const posted = v.postedAt ? new Date(v.postedAt) : null;
    if (posted && posted.getTime() >= deltaStartMs) {
      deltas.views += v.views || 0;
      deltas.likes += v.likes || 0;
      deltas.comments += v.comments || 0;
      deltas.postedVideos += 1;
      if (v.creatorName) creatorsThisWindow.add(v.creatorName);
    }
  }
  deltas.activeAccounts = creatorsThisWindow.size;

  // --- Dynamic-length series window (chart) ---------------------------------
  let earliestMs = null;
  for (const v of videos || []) {
    if (!v.postedAt) continue;
    const ms = new Date(v.postedAt).getTime();
    if (earliestMs === null || ms < earliestMs) earliestMs = ms;
  }

  let days = minDays;
  if (earliestMs !== null) {
    const earliestDay = new Date(earliestMs);
    earliestDay.setHours(0, 0, 0, 0);
    const daysSinceEarliest = Math.round((todayMs - earliestDay.getTime()) / 86400000) + 1;
    days = Math.min(maxDays, Math.max(minDays, daysSinceEarliest));
  }

  const start = new Date(todayMs - (days - 1) * 86400000);
  const startMs = start.getTime();

  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(startMs + i * 86400000);
    return { date: d.toISOString(), addViews: 0, addLikes: 0, addComments: 0, addVideos: 0 };
  });

  let inWindowViews = 0;
  let inWindowLikes = 0;
  let inWindowComments = 0;
  let inWindowVideos = 0;
  for (const v of videos || []) {
    const posted = v.postedAt ? new Date(v.postedAt) : null;
    if (posted && posted.getTime() >= startMs) {
      inWindowViews += v.views || 0;
      inWindowLikes += v.likes || 0;
      inWindowComments += v.comments || 0;
      inWindowVideos += 1;
      const day = new Date(posted);
      day.setHours(0, 0, 0, 0);
      const i = Math.round((day.getTime() - startMs) / 86400000);
      if (i >= 0 && i < days) {
        buckets[i].addViews += v.views || 0;
        buckets[i].addLikes += v.likes || 0;
        buckets[i].addComments += v.comments || 0;
        buckets[i].addVideos += 1;
      }
    }
  }

  // Cumulative series seeded with what existed before the window opened.
  const total = (videos || []).reduce(
    (a, v) => ({
      views: a.views + (v.views || 0),
      likes: a.likes + (v.likes || 0),
      comments: a.comments + (v.comments || 0),
    }),
    { views: 0, likes: 0, comments: 0 },
  );
  let cumViews = total.views - inWindowViews;
  let cumLikes = total.likes - inWindowLikes;
  let cumComments = total.comments - inWindowComments;
  let cumVideos = (videos || []).length - inWindowVideos;

  const series = buckets.map((b) => {
    cumViews += b.addViews;
    cumLikes += b.addLikes;
    cumComments += b.addComments;
    cumVideos += b.addVideos;
    return {
      date: b.date,
      views: cumViews,
      likes: cumLikes,
      comments: cumComments,
      postedVideos: cumVideos,
    };
  });

  return { series, deltas, approximate: true };
}

// ---------------------------------------------------------------------------
// Real metric history, from the snapshot tables
// ---------------------------------------------------------------------------

const DAY_MS = 86400000;

function dayKey(iso) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Every metric snapshot recorded for this brand, across both program videos
// and brand-tracked accounts. These tables are append-only — the sync jobs
// insert one row per video per run — so they hold the actual view history that
// the video rows themselves (which only ever carry current totals) cannot.
export async function fetchMetricsHistory() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const [programRes, trackedRes] = await Promise.all([
    supabase
      .from("program_video_metric_snapshots")
      .select(`
        program_video_id, captured_at, views, likes, comments,
        program_videos!inner (
          id,
          program_members!inner (
            status,
            programs!inner ( brand_id )
          )
        )
      `)
      .eq("program_videos.program_members.programs.brand_id", user.id)
      .neq("program_videos.program_members.status", "removed")
      .order("captured_at", { ascending: true }),
    supabase
      .from("tracked_account_video_snapshots")
      .select(`
        tracked_account_video_id, captured_at, views, likes, comments,
        tracked_account_videos!inner (
          id,
          tracked_accounts!inner ( brand_id )
        )
      `)
      .eq("tracked_account_videos.tracked_accounts.brand_id", user.id)
      .order("captured_at", { ascending: true }),
  ]);

  if (programRes.error) throw programRes.error;
  if (trackedRes.error) throw trackedRes.error;

  const rows = [
    ...(programRes.data || []).map((r) => ({
      videoKey: `p:${r.program_video_id}`,
      capturedAt: r.captured_at,
      views: r.views || 0,
      likes: r.likes || 0,
      comments: r.comments || 0,
    })),
    ...(trackedRes.data || []).map((r) => ({
      videoKey: `t:${r.tracked_account_video_id}`,
      capturedAt: r.captured_at,
      views: r.views || 0,
      likes: r.likes || 0,
      comments: r.comments || 0,
    })),
  ];

  return rows.sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt));
}

// Build the Overview series from real snapshots.
//
// A snapshot is a point-in-time reading for one video, and syncs don't
// necessarily cover every video every day. So for each day we carry each
// video's most recent reading forward (last-observation-carried-forward) and
// sum across videos — that gives the true tracked-view total as of that day,
// rather than a total that dips whenever a video was missed by a sync.
//
// The series starts at the first snapshot, not the earliest post date: there
// is no recorded history from before tracking began, and back-filling it would
// invent data.
export function buildMetricsFromSnapshots(snapshots, { minSnapshotDays = 2 } = {}) {
  const rows = snapshots || [];
  const days = [...new Set(rows.map((r) => dayKey(r.capturedAt)))].sort((a, b) => a - b);
  if (days.length < minSnapshotDays) return null;

  // Latest reading per video per day. Rows arrive sorted ascending, so a plain
  // overwrite leaves the last reading of each day in place.
  const latestPerDay = new Map(); // dayMs -> Map(videoKey -> {views, likes, comments})
  for (const r of rows) {
    const d = dayKey(r.capturedAt);
    if (!latestPerDay.has(d)) latestPerDay.set(d, new Map());
    latestPerDay.get(d).set(r.videoKey, {
      views: r.views,
      likes: r.likes,
      comments: r.comments,
    });
  }

  const startMs = days[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endMs = Math.max(days[days.length - 1], today.getTime());
  const span = Math.round((endMs - startMs) / DAY_MS) + 1;

  const carried = new Map(); // videoKey -> latest known {views, likes, comments}
  const series = [];

  for (let i = 0; i < span; i++) {
    const dayMs = startMs + i * DAY_MS;
    const readings = latestPerDay.get(dayMs);
    if (readings) {
      for (const [videoKey, stat] of readings) carried.set(videoKey, stat);
    }

    let views = 0;
    let likes = 0;
    let comments = 0;
    for (const stat of carried.values()) {
      views += stat.views;
      likes += stat.likes;
      comments += stat.comments;
    }

    series.push({
      date: new Date(dayMs).toISOString(),
      views,
      likes,
      comments,
      // Cumulative count of distinct videos seen by this day.
      postedVideos: carried.size,
    });
  }

  // "+X this period" badges: change over the trailing 30 days of the series.
  const first = series[Math.max(0, series.length - 30)];
  const last = series[series.length - 1];
  const deltas = {
    views: last.views - first.views,
    likes: last.likes - first.likes,
    comments: last.comments - first.comments,
    postedVideos: last.postedVideos - first.postedVideos,
    activeAccounts: 0,
  };

  return { series, deltas, approximate: false };
}

// Clip the metric series to a display window ending today.
//
// `days === null` means "All" — the series as recorded. Otherwise the window is
// always drawn in full, even when tracking only started a day or two ago: each
// day carries the most recent point at or before it, and days that predate the
// first recorded point are plotted as zero. That's honest (there genuinely was
// nothing tracked yet) and it makes the growth shape readable, instead of a
// two-point chart where both series sit pinned at their maximum.
export function windowSeries(series, days) {
  const src = series || [];
  if (!src.length) return [];
  if (!days) return src;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startMs = today.getTime() - (days - 1) * DAY_MS;

  const out = [];
  let cursor = 0;
  let carried = null;

  for (let i = 0; i < days; i++) {
    const dayMs = startMs + i * DAY_MS;
    while (cursor < src.length && dayKey(src[cursor].date) <= dayMs) {
      carried = src[cursor];
      cursor += 1;
    }
    out.push({
      date: new Date(dayMs).toISOString(),
      views: carried?.views || 0,
      likes: carried?.likes || 0,
      comments: carried?.comments || 0,
      postedVideos: carried?.postedVideos || 0,
    });
  }

  return out;
}

// "+X this period" badges, measured over whatever window is on screen, so the
// numbers on the stat cards always describe the chart next to them.
export function deltasFromSeries(windowed) {
  const s = windowed || [];
  if (s.length < 2) return { views: 0, likes: 0, comments: 0, postedVideos: 0 };
  const first = s[0];
  const last = s[s.length - 1];
  return {
    views: last.views - first.views,
    likes: last.likes - first.likes,
    comments: last.comments - first.comments,
    postedVideos: last.postedVideos - first.postedVideos,
  };
}

// One row per creator/program membership across all the brand's programs,
// for the ViralApp-style "Accounts" table. Status is inferred: a member with
// tracked videos is "tracking", otherwise "pending" (the brand can't read the
// creator's OAuth row directly, so video presence is the connection signal).
// creator_profiles.tiktok_handle is a self-typed field a creator can leave
// blank, but a creator who connected TikTok via OAuth still has videos
// syncing — those arrive through creator_social_accounts, which brands cannot
// read (it holds access tokens; RLS is creator-only, migration 0034). Rather
// than showing such a creator as having no TikTok, recover the username from a
// video URL the brand can already see:
//   https://www.tiktok.com/@sharedmood1/video/762...
function handleFromVideoUrl(videos) {
  for (const v of videos) {
    const m = String(v?.video_url || "").match(/tiktok\.com\/@([A-Za-z0-9._]+)/i);
    if (m) return m[1];
  }
  return "";
}

export async function fetchProgramAccounts() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("program_members")
    .select(`
      id, status, creator_id,
      programs!inner ( id, title, brand_id ),
      creator_profiles!program_members_creator_id_fkey_profile (
        display_name, handle, avatar_url, tiktok_handle
      ),
      program_videos ( views, likes, comments, shares, video_url )
    `)
    .eq("programs.brand_id", user.id)
    .neq("status", "removed");

  if (error) throw error;

  return (data || []).map((row) => {
    const p = row.creator_profiles;
    const videos = row.program_videos || [];
    const totals = videos.reduce(
      (acc, v) => {
        acc.views += v.views || 0;
        acc.likes += v.likes || 0;
        acc.comments += v.comments || 0;
        acc.shares += v.shares || 0;
        return acc;
      },
      { views: 0, likes: 0, comments: 0, shares: 0 },
    );
    return {
      memberId: row.id,
      status: row.status,
      creatorId: row.creator_id,
      name: p?.display_name || p?.handle || "Creator",
      handle: p?.handle || "",
      avatarUrl: p?.avatar_url || null,
      tiktokHandle: p?.tiktok_handle || handleFromVideoUrl(videos),
      programId: row.programs?.id,
      programTitle: row.programs?.title || "Campaign",
      videoCount: videos.length,
      tracking: videos.length > 0,
      ...totals,
    };
  });
}

// One row per tracked video across all the brand's programs, for the
// ViralApp-style "Videos" table. Newest first. Capped well above PostgREST's
// default 1000-row page so long-running programs don't silently truncate.
export async function fetchProgramVideos({ limit = 5000 } = {}) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("program_videos")
    .select(`
      id, tiktok_video_id, video_url, posted_at, views, likes, comments, shares,
      last_synced_at, description, cover_image_url, duration_seconds,
      program_members!inner (
        id,
        programs!inner ( id, title, brand_id ),
        creator_profiles!program_members_creator_id_fkey_profile (
          display_name, handle, avatar_url
        )
      )
    `)
    .eq("program_members.programs.brand_id", user.id)
    .neq("program_members.status", "removed")
    .order("posted_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((row) => {
    const member = row.program_members || {};
    const p = member.creator_profiles || {};
    return {
      id: row.id,
      tiktokVideoId: row.tiktok_video_id,
      videoUrl: row.video_url,
      postedAt: row.posted_at,
      views: row.views || 0,
      likes: row.likes || 0,
      comments: row.comments || 0,
      shares: row.shares || 0,
      lastSyncedAt: row.last_synced_at,
      caption: row.description || "",
      coverImageUrl: row.cover_image_url || null,
      durationSeconds: row.duration_seconds || null,
      creatorName: p.display_name || p.handle || "Creator",
      creatorAvatarUrl: p.avatar_url || null,
      programId: member.programs?.id,
      programTitle: member.programs?.title || "Campaign",
      source: "program",
      sourceLabel: member.programs?.title || "Campaign",
    };
  });
}

// ---------------------------------------------------------------------------
// Overview: programs + brand-tracked accounts, combined
// ---------------------------------------------------------------------------

// Everything the Overview page needs, merged across both things a brand can
// track: creators enrolled in a program, and standalone accounts added on the
// Accounts page. Previously Overview only ever saw the program side, so
// tracked accounts were invisible in the stats, chart and top-lists.
export async function fetchOverviewData() {
  const [programVideos, programAccounts, trackedVideos, trackedAccounts] =
    await Promise.all([
      fetchProgramVideos().catch(() => []),
      fetchProgramAccounts().catch(() => []),
      fetchTrackedAccountVideos().catch(() => []),
      fetchTrackedAccounts().catch(() => []),
    ]);

  // A creator can be both a program member and a separately tracked account.
  // Prefer the program row so their videos aren't counted twice.
  const programHandles = new Set(
    programAccounts
      .map((a) => (a.tiktokHandle || "").toLowerCase().replace(/^@/, ""))
      .filter(Boolean),
  );
  const isDuplicate = (username) =>
    programHandles.has((username || "").toLowerCase().replace(/^@/, ""));

  const videos = [
    ...programVideos,
    ...trackedVideos
      .filter((v) => !isDuplicate(v.username))
      .map((v) => ({
        id: v.id,
        tiktokVideoId: v.platformVideoId,
        videoUrl: v.videoUrl,
        postedAt: v.postedAt,
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        lastSyncedAt: v.lastSyncedAt,
        caption: v.description || "",
        coverImageUrl: v.coverImageUrl || null,
        durationSeconds: v.durationSeconds || null,
        creatorName: v.username ? `@${v.username}` : "Tracked account",
        creatorAvatarUrl: null,
        source: "tracked",
        sourceLabel: "Tracked account",
      })),
  ];

  const accounts = [
    ...programAccounts.map((a) => ({ ...a, id: a.memberId, source: "program" })),
    ...trackedAccounts
      .filter((a) => !isDuplicate(a.username))
      .map((a) => ({
        id: a.id,
        source: "tracked",
        status: a.status,
        name: a.username ? `@${a.username}` : "Tracked account",
        handle: a.username || "",
        avatarUrl: null,
        tiktokHandle: a.username || "",
        sourceLabel: "Tracked account",
        videoCount: a.videoCount,
        tracking: a.status === "tracking",
        views: a.views,
        likes: a.likes,
        comments: a.comments,
        shares: a.shares,
      })),
  ];

  const totals = videos.reduce(
    (acc, v) => {
      acc.postedVideos += 1;
      acc.views += v.views || 0;
      acc.likes += v.likes || 0;
      acc.comments += v.comments || 0;
      return acc;
    },
    { postedVideos: 0, views: 0, likes: 0, comments: 0 },
  );

  const activeAccounts = accounts.filter(
    (a) => a.source === "tracked" || a.status === "active",
  ).length;

  const engagementRate = totals.views
    ? Math.round(((totals.likes + totals.comments) / totals.views) * 1000) / 10
    : 0;

  // Most recent sync across everything, for the chart's "updated" label.
  const lastSyncedAt = videos.reduce((latest, v) => {
    if (!v.lastSyncedAt) return latest;
    return !latest || new Date(v.lastSyncedAt) > new Date(latest)
      ? v.lastSyncedAt
      : latest;
  }, null);

  return {
    videos,
    accounts,
    lastSyncedAt,
    stats: { ...totals, activeAccounts, engagementRate },
  };
}

// ---------------------------------------------------------------------------
// Create / manage programs
// ---------------------------------------------------------------------------

export async function createProgram({
  title,
  description,
  videosPerPeriod,
  periodType,
  payPerVideoCents,
  payoutSchedule,
  testPayoutAmountCents = 0,
  memberCreatorIds = [],
}) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  if (!title?.trim()) throw new Error("Campaign name is required");
  if (!videosPerPeriod || videosPerPeriod < 1) {
    throw new Error("Set a video target per period");
  }
  if (!payPerVideoCents || payPerVideoCents < 1) {
    throw new Error("Set a pay-per-video amount");
  }

  // UX only — the real gate is the "Programs: brand create own with
  // subscription" RLS policy, which this insert would hit anyway. Checking
  // here just turns an opaque row-level-security error into a clear message.
  if (!(await brandHasActiveSubscription(supabase, user.id))) {
    throw new Error(TRIAL_REQUIRED_MESSAGE);
  }

  const { data: program, error: programErr } = await supabase
    .from("programs")
    .insert({
      brand_id: user.id,
      title: title.trim(),
      description: (description || "").trim(),
      platform: "tiktok",
      videos_per_period: videosPerPeriod,
      period_type: periodType || "month",
      pay_per_video_cents: payPerVideoCents,
      payout_schedule: payoutSchedule || "monthly",
      test_payout_amount_cents: testPayoutAmountCents > 0 ? testPayoutAmountCents : null,
    })
    .select()
    .single();
  if (programErr) throw programErr;

  if (memberCreatorIds.length > 0) {
    const rows = memberCreatorIds.map((creatorId) => ({
      program_id: program.id,
      creator_id: creatorId,
      status: "invited",
    }));
    const { error: memErr } = await supabase.from("program_members").insert(rows);
    if (memErr) throw memErr;
    await ensureProgramConversations(supabase, program, user.id, memberCreatorIds);
  }

  notifyProgramsChanged();
  return program;
}

export async function archiveProgram(programId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("programs")
    .update({ status: "archived" })
    .eq("id", programId);
  if (error) throw error;
  notifyProgramsChanged();
}

export async function pauseProgram(programId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("programs")
    .update({ status: "paused" })
    .eq("id", programId);
  if (error) throw error;
  notifyProgramsChanged();
}

export async function reactivateProgram(programId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("programs")
    .update({ status: "active" })
    .eq("id", programId);
  if (error) throw error;
  notifyProgramsChanged();
}

export async function addProgramMember(programId, creatorId) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("program_members")
    .upsert(
      { program_id: programId, creator_id: creatorId, status: "invited" },
      { onConflict: "program_id,creator_id" },
    )
    .select()
    .single();
  if (error) throw error;

  const { data: program } = await supabase
    .from("programs")
    .select("id, title")
    .eq("id", programId)
    .single();
  if (program) {
    await ensureProgramConversations(supabase, program, user.id, [creatorId]);
  }

  notifyProgramsChanged();
  return data;
}

export async function removeProgramMember(memberId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("program_members")
    .update({ status: "removed" })
    .eq("id", memberId);
  if (error) throw error;
  notifyProgramsChanged();
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

// Fund escrow for one member's billing period — or, with `isTest`, the
// program's one-time flat test payout. Returns a Stripe Checkout URL.
export async function fundProgramPayout({
  programMemberId,
  periodStart,
  periodEnd,
  isTest = false,
}) {
  const res = await fetch("/api/programs/payouts/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ programMemberId, periodStart, periodEnd, isTest }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Could not start deposit.");
  return json.url;
}

// Release an escrowed payout to the creator.
export async function releaseProgramPayout(payoutId) {
  const res = await fetch("/api/programs/payouts/release", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payoutId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Could not release payment.");
  notifyProgramsChanged();
  return json;
}

// All payouts across all of the brand's programs, for the Payouts page.
export async function fetchMyProgramPayouts() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("program_payouts")
    .select(`
      id, program_id, program_member_id, payout_type, period_start, period_end,
      video_count, amount_cents, platform_fee_cents, creator_payout_cents,
      status, created_at,
      programs ( title ),
      program_members (
        creator_profiles!program_members_creator_id_fkey_profile ( display_name, handle, avatar_url )
      )
    `)
    .eq("brand_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    programId: row.program_id,
    programMemberId: row.program_member_id,
    payoutType: row.payout_type || "period",
    programTitle: row.programs?.title || "Campaign",
    creatorName:
      row.program_members?.creator_profiles?.display_name ||
      row.program_members?.creator_profiles?.handle ||
      "Creator",
    creatorAvatarUrl: row.program_members?.creator_profiles?.avatar_url || null,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    videoCount: row.video_count,
    amountCents: row.amount_cents,
    platformFeeCents: row.platform_fee_cents,
    creatorPayoutCents: row.creator_payout_cents,
    status: row.status,
    createdAt: row.created_at,
  }));
}
