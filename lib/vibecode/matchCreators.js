// Pick creators and example videos for a scanned app.
//
// Two sources, deliberately kept apart rather than merged into one ranked
// list — the same rule app/dashboard/brand/creators/page.js already states:
// members can be connected, invited to a campaign and paid, while directory
// profiles are scraped public accounts with none of that, so "blending them
// into one grid would imply the second group is hireable here."
//
//   * platform  — creator_profiles, onboarded. These signed up to get brand
//                 work. They can be invited, briefed and paid in-app, so they
//                 lead and they are what the subscription actually buys.
//   * directory — discovered_creators, scraped by Apify. Extra reach, but you
//                 contact them yourself on TikTok.
//
// Measured on production, the split also fixes a coverage hole: the scraped
// pool has zero creators in seven of the twelve niches (Photo & Video, Social
// & Communication, Education & Learning, Home & Family, Entertainment & Media,
// Travel & Local, Finance & Commerce), while the signed-up roster covers all
// twelve. A directory-only match returned an empty page for most app
// categories.
//
// Nothing here calls Apify. A keyword search bills per video result and is
// cron-only for that reason; a public endpoint that could trigger one would be
// an open tap on the Apify bill.
import { redactContact } from "@/lib/discovery/directory";
import { keywordsForNiches } from "@/lib/vibecode/nicheMap";
import { refreshThumbnails } from "@/lib/vibecode/thumbnails";

// The target is the creator who posts constantly and will take $40 a video,
// not a name. Above this ceiling people quote agency rates; below the floor
// there is no audience to reach.
const MIN_FOLLOWERS = 1000;
const MAX_FOLLOWERS = 150000;

// How many clips the "what's working" grid shows. Each creator contributes at
// most 3, so a dozen spreads across several accounts rather than being one
// person's feed.
const VIDEO_GRID_SIZE = 12;

// ---------------------------------------------------------------------------

async function fetchPlatformCreators(admin, tags, limit) {
  if (tags.length === 0) return [];

  const { data, error } = await admin
    .from("creator_profiles")
    .select(
      "user_id, display_name, handle, bio, avatar_url, niches, content_types, location, rate_min, rate_max, tiktok_handle",
    )
    .not("onboarded_at", "is", null)
    .overlaps("niches", tags)
    .limit(limit);

  if (error) throw error;

  return (data || []).map((c) => ({
    id: c.user_id,
    source: "platform",
    name: c.display_name || c.handle || "Creator",
    handle: c.handle || "",
    bio: c.bio || "",
    avatar_url: c.avatar_url,
    niches: c.niches || [],
    content_types: c.content_types || [],
    location: c.location || "",
    // creator_profiles carries no follower/engagement data, so the card shows
    // what this creator charges instead — more useful to a buyer anyway.
    rate_min: c.rate_min,
    rate_max: c.rate_max,
    tiktok_handle: c.tiktok_handle || "",
  }));
}

async function fetchDirectoryCreators(admin, tags, limit) {
  if (tags.length === 0) return [];

  const { data, error } = await admin
    .from("discovered_creators")
    .select(
      "id, username, nickname, avatar_url, bio, bio_link, follower_count, avg_likes_per_video, avg_views, verified, niche_tags",
    )
    .eq("platform", "tiktok")
    .eq("hidden", false)
    .overlaps("niche_tags", tags)
    .gte("follower_count", MIN_FOLLOWERS)
    .lte("follower_count", MAX_FOLLOWERS)
    // Lifetime likes per post — the directory sorts on this for the same
    // reason: a sampled avg_views swings wildly on one dud video.
    .order("avg_likes_per_video", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((c) => ({
    id: c.id,
    source: "directory",
    username: c.username,
    name: c.nickname || c.username,
    avatar_url: c.avatar_url,
    // Scraped from someone who never signed up — strip booking emails
    // everywhere, exactly as the dashboard does.
    bio: redactContact(c.bio),
    bio_link: c.bio_link,
    follower_count: c.follower_count,
    avg_likes_per_video: c.avg_likes_per_video,
    avg_views: c.avg_views,
    verified: c.verified,
    niches: c.niche_tags || [],
  }));
}

export async function matchCreators(admin, { nicheTags, limit = 12 }) {
  const tags = (nicheTags || []).filter(Boolean);

  const [platform, directory] = await Promise.all([
    fetchPlatformCreators(admin, tags, limit),
    fetchDirectoryCreators(admin, tags, limit),
  ]);

  // An empty directory tier for a niche is a real gap in the keyword rotation,
  // so hand it to the seed cron even when the platform tier carried the page.
  if (directory.length === 0 && tags.length > 0) await recordKeywords(admin, tags);

  const { videos, videosAreNiche } = await fetchVideos(admin, directory);

  return { platform, directory, videos, videosAreNiche };
}

// The "what's working" grid. Sourced from the scraped directory even when
// platform creators lead the page: signed-up creators have almost no video
// data yet (one synced TikTok handle, 52 portfolio videos across the whole
// roster), so this is the only place real posts exist in volume. The section
// is captioned as posts working in the niche, not as posts by the creators
// listed below, because that would not be true.
async function fetchVideos(admin, directoryCreators) {
  let clips = [];
  // Seven of the twelve niches have no scraped creators at all, and in those
  // the platform tier carries the page — but an empty video grid strips out
  // the most persuasive thing on it. So fall back to the directory's
  // best-performing posts generally. The caller gets `videosAreNiche: false`
  // and the UI re-captions the section, because calling these "your niche"
  // when they are not would be the one lie that makes the page untrustworthy.
  const niched = directoryCreators.length > 0;

  if (niched) {
    const { data } = await admin
      .from("discovered_creator_videos")
      .select("id, discovered_creator_id, video_url, thumbnail_url, views, position")
      .in("discovered_creator_id", directoryCreators.map((c) => c.id))
      .order("position", { ascending: true });
    clips = data || [];
  } else {
    const { data } = await admin
      .from("discovered_creator_videos")
      .select("id, discovered_creator_id, video_url, thumbnail_url, views, position")
      .order("views", { ascending: false })
      .limit(VIDEO_GRID_SIZE);
    clips = data || [];
  }

  if (clips.length === 0) return { videos: [], videosAreNiche: niched };

  const ranked = clips
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, VIDEO_GRID_SIZE);

  // Stored URLs are signed and expire; re-sign the handful we are about to
  // render. See lib/vibecode/thumbnails.js.
  const live = await refreshThumbnails(admin, ranked);

  return {
    videosAreNiche: niched,
    videos: live.map((v) => ({
      creator_id: v.discovered_creator_id,
      video_url: v.video_url,
      thumbnail_url: v.thumbnail_url,
      views: v.views,
    })),
  };
}

// A niche with no directory coverage is a gap in the keyword rotation, not a
// dead end. Park searches for it in discovery_searches so the Monday seed cron
// (app/api/discovery/seed) picks them up and the niche is covered by the time
// the next person scans a similar app.
//
// Best-effort: a failure here must never sink an otherwise good scan.
async function recordKeywords(admin, nicheTags) {
  const rows = keywordsForNiches(nicheTags)
    .map((k) => String(k || "").trim().toLowerCase())
    .filter((k) => k.length >= 3 && k.length <= 60)
    .slice(0, 6)
    .map((keyword) => ({ keyword, niche_tags: nicheTags }));

  if (rows.length === 0) return;

  try {
    // keyword is unique; ignoreDuplicates leaves an existing row (and its
    // rotation state) alone rather than resetting last_run_at.
    await admin
      .from("discovery_searches")
      .upsert(rows, { onConflict: "keyword", ignoreDuplicates: true });
  } catch (e) {
    console.error("[vibecode] could not record discovery keywords", e);
  }
}
