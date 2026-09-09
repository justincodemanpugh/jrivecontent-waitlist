// Pick creators for a scanned app out of the discovered_creators table.
//
// This reads the same scraped-prospect rows as the brand dashboard's creator
// directory (lib/dashboard/brand/discoveryApi.js), but through the
// service-role client rather than the browser client, because /vibecode
// serves a deliberately limited preview to people who have not signed up.
// The route — not this file — decides how much of the result a caller sees.
//
// Nothing here calls Apify. A keyword search bills per video result and is
// cron-only for that reason; a public endpoint that could trigger one would
// be an open tap on the Apify bill. When a niche has thin coverage we say so
// and hand the keywords to the discovery cron instead.
import { redactContact } from "@/lib/discovery/directory";

// The target is the creator who posts constantly and will take $40 a video,
// not a name. Above this ceiling people quote agency rates; below the floor
// there is no audience to reach.
const MIN_FOLLOWERS = 1000;
const MAX_FOLLOWERS = 150000;

// Fewer than this and the result reads as "we have nobody" — better to admit
// coverage is thin than to show two lonely cards as if they were a shortlist.
const THIN_COVERAGE_BELOW = 4;

export async function matchCreators(admin, { nicheTags, keywords, limit = 12 }) {
  const tags = (nicheTags || []).filter(Boolean);
  if (tags.length === 0) return { creators: [], coverage: "thin" };

  const { data: rows, error } = await admin
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

  const creators = rows || [];
  if (creators.length === 0) {
    await recordKeywords(admin, keywords, tags);
    return { creators: [], coverage: "thin" };
  }

  // Sample clips, for the card thumbnails.
  const { data: videos } = await admin
    .from("discovered_creator_videos")
    .select("discovered_creator_id, video_url, thumbnail_url, views, position")
    .in("discovered_creator_id", creators.map((c) => c.id))
    .order("position", { ascending: true });

  const byCreator = new Map();
  for (const v of videos || []) {
    const list = byCreator.get(v.discovered_creator_id) || [];
    if (list.length < 3) list.push(v);
    byCreator.set(v.discovered_creator_id, list);
  }

  const coverage = creators.length < THIN_COVERAGE_BELOW ? "thin" : "ok";
  if (coverage === "thin") await recordKeywords(admin, keywords, tags);

  return {
    coverage,
    creators: creators.map((c) => ({
      id: c.id,
      username: c.username,
      nickname: c.nickname,
      avatar_url: c.avatar_url,
      // Scraped from someone who never signed up — strip booking emails
      // everywhere, exactly as the dashboard does.
      bio: redactContact(c.bio),
      bio_link: c.bio_link,
      follower_count: c.follower_count,
      avg_likes_per_video: c.avg_likes_per_video,
      avg_views: c.avg_views,
      verified: c.verified,
      niche_tags: c.niche_tags,
      videos: byCreator.get(c.id) || [],
    })),
  };
}

// Thin coverage is a gap in the keyword rotation, not a dead end. Park the
// model's suggested searches in discovery_searches so the Monday seed cron
// (app/api/discovery/seed) picks them up on its next pass and the niche is
// covered by the time the next person scans a similar app.
//
// Best-effort: a failure here must never sink an otherwise good scan.
async function recordKeywords(admin, keywords, nicheTags) {
  const rows = (keywords || [])
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
