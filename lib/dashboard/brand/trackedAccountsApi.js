// Brand-tracked TikTok accounts: any public account a brand wants metrics
// for, whether or not that person is a registered creator or in a program.
//
// Reads go straight through Supabase (RLS scopes rows to the signed-in
// brand). Writes go through /api/tracked-accounts so a newly added account is
// scraped immediately rather than sitting empty until the nightly cron.

import { createClient } from "@/lib/supabase/client";

export const VIDEO_LIMIT_OPTIONS = [10, 30, 50, 100];

function notifyTrackedAccountsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tracked-accounts:changed"));
  }
}

// One row per tracked account, with its videos rolled up into totals.
export async function fetchTrackedAccounts() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("tracked_accounts")
    .select(`
      id, platform, username, video_limit, status, last_error, last_synced_at, created_at,
      tracked_account_videos ( views, likes, comments, shares )
    `)
    .eq("brand_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => {
    const videos = row.tracked_account_videos || [];
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
      platform: row.platform,
      username: row.username,
      videoLimit: row.video_limit,
      status: row.status,
      lastError: row.last_error,
      lastSyncedAt: row.last_synced_at,
      createdAt: row.created_at,
      videoCount: videos.length,
      ...totals,
    };
  });
}

// One row per tracked video across all of the brand's tracked accounts.
export async function fetchTrackedAccountVideos() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("tracked_account_videos")
    .select(`
      id, platform_video_id, video_url, description, posted_at,
      views, likes, comments, shares, last_synced_at,
      tracked_accounts!inner ( id, username, brand_id )
    `)
    .eq("tracked_accounts.brand_id", user.id)
    .order("posted_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    platformVideoId: row.platform_video_id,
    videoUrl: row.video_url,
    description: row.description,
    postedAt: row.posted_at,
    views: row.views || 0,
    likes: row.likes || 0,
    comments: row.comments || 0,
    shares: row.shares || 0,
    lastSyncedAt: row.last_synced_at,
    accountId: row.tracked_accounts?.id,
    username: row.tracked_accounts?.username || "",
  }));
}

// `accounts` is the raw textarea content split into lines — usernames, @handles
// and full profile URLs are all accepted and normalized server-side.
export async function addTrackedAccounts(accounts, videoLimit = 30) {
  const res = await fetch("/api/tracked-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accounts, videoLimit }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Could not add accounts.");
  notifyTrackedAccountsChanged();
  return json;
}

export async function removeTrackedAccount(id) {
  const res = await fetch("/api/tracked-accounts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Could not remove account.");
  notifyTrackedAccountsChanged();
  return json;
}
