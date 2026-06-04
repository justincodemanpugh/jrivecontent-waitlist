"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidCountry } from "@/lib/countries";

const MAX_PORTFOLIO_VIDEOS = 3;

function clean(s, max) {
  if (typeof s !== "string") return null;
  const v = s.trim();
  if (!v) return "";
  return v.slice(0, max);
}

// Update name, bio, and social handles.
export async function updateCreatorProfile(payload) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const display_name = clean(payload?.display_name, 80);
  if (!display_name) {
    return { ok: false, error: "Please enter a display name." };
  }

  const update = {
    display_name,
    bio: clean(payload?.bio, 500) ?? "",
    instagram_handle: (clean(payload?.instagram_handle, 60) ?? "").replace(/^@/, ""),
    youtube_handle: (clean(payload?.youtube_handle, 60) ?? "").replace(/^@/, ""),
    tiktok_handle: (clean(payload?.tiktok_handle, 60) ?? "").replace(/^@/, ""),
    portfolio_url: clean(payload?.portfolio_url, 240) ?? "",
  };

  // Country is the ISO 3166-1 alpha-2 code passed to Stripe at connected
  // account creation. Locked at account creation, so we validate here
  // before persisting.
  if ("country" in (payload || {})) {
    const raw = payload.country;
    if (raw === null || raw === "") {
      update.country = null;
    } else if (typeof raw === "string" && isValidCountry(raw)) {
      update.country = raw.toUpperCase();
    } else {
      return { ok: false, error: "Please pick a supported country." };
    }
  }

  const { error } = await supabase
    .from("creator_profiles")
    .update(update)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/creator/profile");
  revalidatePath("/dashboard/creator");
  return { ok: true };
}

// Persist the cover photo URL after the client uploads to storage.
export async function setCreatorCoverUrl(cover_photo_url) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("creator_profiles")
    .update({ cover_photo_url: cover_photo_url || null })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/creator/profile");
  revalidatePath("/dashboard/creator");
  return { ok: true };
}

// Persist the avatar URL after the client uploads to storage.
export async function setCreatorAvatarUrl(avatar_url) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("creator_profiles")
    .update({ avatar_url: avatar_url || null })
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/creator/profile");
  revalidatePath("/dashboard/creator");
  return { ok: true };
}

const ALLOWED_PLATFORMS = ["instagram", "tiktok", "youtube"];

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Insert a portfolio video row. Videos are links to the creator's original
// social posts, with a creator-uploaded thumbnail (uploaded to storage by the
// client, which passes the resulting `thumbnail_path` here).
export async function addPortfolioVideo({ platform, video_url, thumbnail_path, title }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!ALLOWED_PLATFORMS.includes(platform)) {
    return { ok: false, error: "Please pick a valid platform." };
  }
  if (!video_url || !isHttpUrl(video_url)) {
    return { ok: false, error: "Please enter a valid video link." };
  }

  const { count, error: countErr } = await supabase
    .from("creator_portfolio_videos")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", user.id);
  if (countErr) return { ok: false, error: countErr.message };
  if ((count || 0) >= MAX_PORTFOLIO_VIDEOS) {
    return { ok: false, error: `You can add at most ${MAX_PORTFOLIO_VIDEOS} videos.` };
  }

  const { data, error } = await supabase
    .from("creator_portfolio_videos")
    .insert({
      creator_id: user.id,
      platform,
      video_url: video_url.trim(),
      thumbnail_path: thumbnail_path || null,
      title: clean(title, 100) || null,
      position: count || 0,
    })
    .select("id, platform, video_url, thumbnail_path, title, position, created_at")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/creator/profile");
  return { ok: true, video: data };
}

export async function deletePortfolioVideo(videoId) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: existing, error: readErr } = await supabase
    .from("creator_portfolio_videos")
    .select("id, storage_path, thumbnail_path, creator_id")
    .eq("id", videoId)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!existing || existing.creator_id !== user.id) {
    return { ok: false, error: "Video not found." };
  }

  // Best-effort storage cleanup; row delete is the source of truth.
  // Covers both legacy uploaded videos and uploaded thumbnails.
  const paths = [existing.storage_path, existing.thumbnail_path].filter(Boolean);
  if (paths.length > 0) {
    await supabase.storage.from("creator-portfolio").remove(paths);
  }

  const { error } = await supabase
    .from("creator_portfolio_videos")
    .delete()
    .eq("id", videoId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/creator/profile");
  return { ok: true };
}
