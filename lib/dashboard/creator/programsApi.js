// Programs API for the creator dashboard.
// A "program" is an ongoing arrangement with a brand: post N TikToks per
// week/month, get paid per video on a recurring schedule. Video discovery
// and metrics are pulled automatically from TikTok once the creator
// connects their account — creators don't manually submit links here.

import { createClient } from "@/lib/supabase/client";

function notifyProgramsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("creator-programs:changed"));
  }
}

// ---------------------------------------------------------------------------
// TikTok connection
// ---------------------------------------------------------------------------

// The creator's connected TikTok account, or null if not connected yet.
export async function fetchMyTikTokAccount() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("creator_social_accounts")
    .select("id, username, platform_user_id, connected_at")
    .eq("creator_id", user.id)
    .eq("platform", "tiktok")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    username: data.username,
    platformUserId: data.platform_user_id,
    connectedAt: data.connected_at,
  };
}

// The handle the creator typed in manually, as a fallback for the OAuth flow
// (which only works once the TikTok app clears app review). Saved via the
// setCreatorTikTokHandle server action in lib/dashboard/creator/profileActions.
// Returns the handle plus the last scrape's status (written by
// app/api/programs/member-sync and the daily cron) so the UI can show whether
// tracking is actually working.
export async function fetchMyTikTokHandle() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("creator_profiles")
    .select(
      "tiktok_handle, tiktok_handle_sync_status, tiktok_handle_synced_at, tiktok_handle_video_count, tiktok_handle_sync_error",
    )
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  return {
    handle: data?.tiktok_handle || "",
    syncStatus: data?.tiktok_handle_sync_status || null,
    syncedAt: data?.tiktok_handle_synced_at || null,
    videoCount: data?.tiktok_handle_video_count ?? null,
    syncError: data?.tiktok_handle_sync_error || null,
  };
}

export async function disconnectTikTok() {
  const supabase = createClient();
  const { error } = await supabase
    .from("creator_social_accounts")
    .delete()
    .eq("platform", "tiktok");
  if (error) throw error;
  notifyProgramsChanged();
}

// ---------------------------------------------------------------------------
// Program memberships
// ---------------------------------------------------------------------------

function mapMembership(row) {
  const program = row.programs || {};
  const videos = (row.program_videos || [])
    .slice()
    .sort((a, b) => new Date(b.posted_at || 0) - new Date(a.posted_at || 0));
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
  const payouts = (row.program_payouts || []).sort(
    (a, b) => new Date(b.period_start) - new Date(a.period_start),
  );

  return {
    id: row.id,
    status: row.status,
    invitedAt: row.invited_at,
    joinedAt: row.joined_at,
    programId: program.id,
    title: program.title || "Campaign",
    description: program.description || "",
    videosPerPeriod: program.videos_per_period,
    periodType: program.period_type,
    payPerVideoCents: program.pay_per_video_cents,
    payoutSchedule: program.payout_schedule,
    brandName: program.brand_profiles?.brand_name || "Brand",
    videos: videos.map((v) => ({
      id: v.id,
      tiktokVideoId: v.tiktok_video_id,
      videoUrl: v.video_url,
      postedAt: v.posted_at,
      views: v.views || 0,
      likes: v.likes || 0,
      comments: v.comments || 0,
      shares: v.shares || 0,
    })),
    videoCount: videos.length,
    totals,
    payouts: payouts.map((p) => ({
      id: p.id,
      periodStart: p.period_start,
      periodEnd: p.period_end,
      videoCount: p.video_count,
      creatorPayoutCents: p.creator_payout_cents,
      status: p.status,
    })),
  };
}

const MEMBERSHIP_SELECT = `
  id, status, invited_at, joined_at,
  programs (
    id, title, description, videos_per_period, period_type,
    pay_per_video_cents, payout_schedule,
    brand_profiles!programs_brand_id_fkey_profile ( brand_name )
  ),
  program_videos ( id, tiktok_video_id, video_url, posted_at, views, likes, comments, shares ),
  program_payouts ( id, period_start, period_end, video_count, creator_payout_cents, status )
`;

// All programs the current creator has been invited to or joined.
export async function fetchMyProgramMemberships() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("program_members")
    .select(MEMBERSHIP_SELECT)
    .eq("creator_id", user.id)
    .neq("status", "removed")
    .order("invited_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapMembership);
}

// Accept an invitation to join a program.
export async function acceptProgramInvite(memberId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("program_members")
    .update({ status: "active", joined_at: new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw error;
  notifyProgramsChanged();
}

// Decline an invitation, or leave an active program.
export async function leaveProgram(memberId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("program_members")
    .update({ status: "removed" })
    .eq("id", memberId);
  if (error) throw error;
  notifyProgramsChanged();
}
