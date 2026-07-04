// Programs API for the brand dashboard.
// A Program is an ongoing TikTok creator arrangement: "post N videos every
// week/month, get paid $X per video on a weekly/biweekly/monthly cycle."
// Unlike briefs (one-off), programs run continuously and their video
// performance (views/likes/comments/shares) is tracked automatically by the
// tiktok-sync cron job once a creator connects their TikTok account.

import { createClient } from "@/lib/supabase/client";

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
      pay_per_video_cents, payout_schedule, status, created_at, updated_at,
      program_members (
        id, creator_id, status, invited_at, joined_at,
        creator_profiles!program_members_creator_id_fkey_profile (
          display_name, handle, avatar_url, tiktok_handle
        ),
        program_videos ( id, tiktok_video_id, video_url, posted_at, views, likes, comments, shares, last_synced_at ),
        program_payouts ( id, period_start, period_end, video_count, amount_cents, platform_fee_cents, creator_payout_cents, status, created_at )
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
        periodStart: p.period_start,
        periodEnd: p.period_end,
        videoCount: p.video_count,
        amountCents: p.amount_cents,
        platformFeeCents: p.platform_fee_cents,
        creatorPayoutCents: p.creator_payout_cents,
        status: p.status,
        createdAt: p.created_at,
      }))
      .sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart)),
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
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    members,
  };
}

// Aggregate stats across all of the brand's programs, for the ProgramStatStrip.
export async function fetchProgramStats() {
  const programs = await fetchMyPrograms();
  const activePrograms = programs.filter((p) => p.status === "active");

  const totals = programs.reduce(
    (acc, p) => {
      for (const m of p.members) {
        if (m.status === "active") acc.activeAccounts += 1;
        acc.postedVideos += m.videoCount;
        acc.views += m.totals.views;
        acc.likes += m.totals.likes;
        acc.comments += m.totals.comments;
      }
      return acc;
    },
    { activeAccounts: 0, postedVideos: 0, views: 0, likes: 0, comments: 0 },
  );

  const engagementRate = totals.views
    ? Math.round(((totals.likes + totals.comments) / totals.views) * 1000) / 10
    : 0;

  return {
    activePrograms: activePrograms.length,
    ...totals,
    engagementRate,
  };
}

// One row per creator/program membership across all the brand's programs,
// for the ViralApp-style "Accounts" table. Status is inferred: a member with
// tracked videos is "tracking", otherwise "pending" (the brand can't read the
// creator's OAuth row directly, so video presence is the connection signal).
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
      program_videos ( views, likes, comments, shares )
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
      tiktokHandle: p?.tiktok_handle || "",
      programId: row.programs?.id,
      programTitle: row.programs?.title || "Program",
      videoCount: videos.length,
      tracking: videos.length > 0,
      ...totals,
    };
  });
}

// One row per tracked video across all the brand's programs, for the
// ViralApp-style "Videos" table. Newest first.
export async function fetchProgramVideos() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("program_videos")
    .select(`
      id, tiktok_video_id, video_url, posted_at, views, likes, comments, shares, last_synced_at,
      program_members!inner (
        id,
        programs!inner ( id, title, brand_id ),
        creator_profiles!program_members_creator_id_fkey_profile (
          display_name, handle, avatar_url
        )
      )
    `)
    .eq("program_members.programs.brand_id", user.id)
    .order("posted_at", { ascending: false });

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
      creatorName: p.display_name || p.handle || "Creator",
      creatorAvatarUrl: p.avatar_url || null,
      programId: member.programs?.id,
      programTitle: member.programs?.title || "Program",
    };
  });
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
  memberCreatorIds = [],
}) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  if (!title?.trim()) throw new Error("Program name is required");
  if (!videosPerPeriod || videosPerPeriod < 1) {
    throw new Error("Set a video target per period");
  }
  if (!payPerVideoCents || payPerVideoCents < 1) {
    throw new Error("Set a pay-per-video amount");
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
  const { data, error } = await supabase
    .from("program_members")
    .upsert(
      { program_id: programId, creator_id: creatorId, status: "invited" },
      { onConflict: "program_id,creator_id" },
    )
    .select()
    .single();
  if (error) throw error;
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

// Fund escrow for one member's billing period. Returns a Stripe Checkout URL.
export async function fundProgramPayout({ programMemberId, periodStart, periodEnd }) {
  const res = await fetch("/api/programs/payouts/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ programMemberId, periodStart, periodEnd }),
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
      id, program_id, program_member_id, period_start, period_end, video_count,
      amount_cents, platform_fee_cents, creator_payout_cents, status, created_at,
      programs ( title ),
      program_members (
        creator_profiles!program_members_creator_id_fkey_profile ( display_name, handle, avatar_url )
      )
    `)
    .eq("brand_id", user.id)
    .order("period_start", { ascending: false });
  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    programId: row.program_id,
    programMemberId: row.program_member_id,
    programTitle: row.programs?.title || "Program",
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
