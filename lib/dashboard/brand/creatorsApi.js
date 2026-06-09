// Browse-creators data + invitation actions for the brand dashboard.
// Reads use the directory-read RLS policies from schema.sql / migration 0007.

import { createClient } from "@/lib/supabase/client";
import { isBrandPro } from "@/lib/dashboard/brand/gigsApi";

function notifyInvitationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("invitations:changed"));
  }
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

// Returns onboarded creators with their portfolio video paths attached so the
// browse grid can show a preview thumbnail. We also pull avatar + cover so the
// card mirrors the social-network browse layout.
export async function fetchAllCreators() {
  const supabase = createClient();
  const { data: profiles, error } = await supabase
    .from("creator_profiles")
    .select(
      `user_id, display_name, handle, bio, avatar_url, cover_photo_url,
       niches, content_types, location, rate_min, rate_max,
       instagram_handle, tiktok_handle, youtube_handle, portfolio_url,
       instagram_verified, tiktok_verified, youtube_verified`,
    )
    .not("onboarded_at", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (profiles || []).map((p) => p.user_id);
  let videosByCreator = new Map();
  if (ids.length > 0) {
    const { data: vids, error: vErr } = await supabase
      .from("creator_portfolio_videos")
      .select("id, creator_id, platform, video_url, thumbnail_url, thumbnail_path, title, is_featured, storage_path, position, created_at")
      .in("creator_id", ids)
      .order("created_at", { ascending: false });
    if (vErr) throw vErr;
    for (const v of vids || []) {
      const list = videosByCreator.get(v.creator_id) || [];
      list.push(v);
      videosByCreator.set(v.creator_id, list);
    }
  }

  return (profiles || []).map((row) => ({
    id: row.user_id,
    name: row.display_name || row.handle || "Creator",
    handle: row.handle || "",
    bio: row.bio || "",
    avatarUrl: row.avatar_url || null,
    coverUrl: row.cover_photo_url || null,
    niches: row.niches || [],
    contentTypes: row.content_types || [],
    location: row.location || "",
    rateMin: row.rate_min || null,
    rateMax: row.rate_max || null,
    instagram: row.instagram_handle || "",
    tiktok: row.tiktok_handle || "",
    youtube: row.youtube_handle || "",
    portfolioUrl: row.portfolio_url || "",
    instagram_verified: row.instagram_verified || false,
    tiktok_verified: row.tiktok_verified || false,
    youtube_verified: row.youtube_verified || false,
    portfolioVideos: videosByCreator.get(row.user_id) || [],
  }));
}

// Single creator detail (used by the profile modal). Falls back to the list
// row when called with a hydrated object so we don't double-fetch on click.
export async function fetchCreatorById(creatorId) {
  const supabase = createClient();
  const [{ data, error }, { data: vids, error: vErr }] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select(
        `user_id, display_name, handle, bio, avatar_url, cover_photo_url,
         niches, content_types, location, rate_min, rate_max,
         instagram_handle, tiktok_handle, youtube_handle, portfolio_url,
         instagram_verified, tiktok_verified, youtube_verified`,
      )
      .eq("user_id", creatorId)
      .maybeSingle(),
    supabase
      .from("creator_portfolio_videos")
      .select("id, creator_id, platform, video_url, thumbnail_url, thumbnail_path, title, is_featured, storage_path, position, created_at")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw error;
  if (vErr) throw vErr;
  if (!data) return null;
  return {
    id: data.user_id,
    name: data.display_name || data.handle || "Creator",
    handle: data.handle || "",
    bio: data.bio || "",
    avatarUrl: data.avatar_url || null,
    coverUrl: data.cover_photo_url || null,
    niches: data.niches || [],
    contentTypes: data.content_types || [],
    location: data.location || "",
    rateMin: data.rate_min || null,
    rateMax: data.rate_max || null,
    instagram: data.instagram_handle || "",
    tiktok: data.tiktok_handle || "",
    youtube: data.youtube_handle || "",
    portfolioUrl: data.portfolio_url || "",
    instagram_verified: data.instagram_verified || false,
    tiktok_verified: data.tiktok_verified || false,
    youtube_verified: data.youtube_verified || false,
    portfolioVideos: vids || [],
  };
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

// Lightweight gigs list used by the invite dialog. Just the brand's own
// active, open gigs since you can only invite to gigs you own.
export async function fetchInvitableGigs() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gigs")
    .select("id, title, pay_per_video, status, is_active")
    .is("deleted_at", null)
    .eq("is_active", true)
    .in("status", ["open", "in_production"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// All invitations the current brand has sent for a given creator. Used by
// the card UI to show "Invited" once an invite has been delivered.
export async function fetchMyInvitationsForCreators(creatorIds) {
  if (!creatorIds || creatorIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gig_invitations")
    .select("id, gig_id, creator_id, status, created_at")
    .in("creator_id", creatorIds);
  if (error) throw error;
  return data || [];
}

export async function inviteCreatorToGig({ creatorId, gigId, message }) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  // Only Pro/trial brands can invite creators
  if (!(await isBrandPro(supabase, user.id))) {
    throw new Error(
      "Start your free 3-day trial to invite creators.",
    );
  }

  // Upsert by (gig_id, creator_id) — if a previous invite was declined or
  // cancelled, re-invite by resetting status to pending.
  const { data, error } = await supabase
    .from("gig_invitations")
    .upsert(
      {
        gig_id: gigId,
        brand_id: user.id,
        creator_id: creatorId,
        message: (message || "").trim(),
        status: "pending",
      },
      { onConflict: "gig_id,creator_id" },
    )
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error("You've already invited this creator to that gig.");
    }
    throw error;
  }
  notifyInvitationsChanged();
  return data;
}
