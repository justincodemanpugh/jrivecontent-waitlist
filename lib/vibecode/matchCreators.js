// Pick creators and example videos for a scanned app out of the
// discovered_creators table.
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
// and hand keywords to the discovery cron instead.
//
// ---------------------------------------------------------------------------
// Why matching is two-tier
//
// Measured against the live directory: of 661 creators in the target follower
// band, only four niches have any coverage at all (Fashion & Beauty 133,
// Food & Drink 127, Health & Fitness 119, Lifestyle & Utilities 63). The
// other seven — Entertainment & Media, Finance & Commerce, Photo & Video,
// Social & Communication, Education & Learning, Travel & Local, Home &
// Family — are empty. A niche-only match would therefore return nothing for a
// game, a finance app, a photo app or a social app, which is most of what
// people will paste.
//
// But 234 of those creators are untagged, and they are not leftovers: they
// come from the intent-first keywords in lib/discovery/keywords.js ("ugc
// creator", "ugc portfolio", "product demo video") which that file notes
// surface "people who already make brand content and are open to more, which
// is exactly who this directory is for". For an app in an uncovered niche
// they are a better answer than an empty page — and arguably a better answer
// than a topical creator who has never done brand work.
//
// So: niche matches first, topped up from the general pool, and the response
// says which is which so the page can be honest about it rather than
// implying a topical match we didn't make.
// ---------------------------------------------------------------------------
import { redactContact } from "@/lib/discovery/directory";
import { keywordsForNiches } from "@/lib/vibecode/nicheMap";

// The target is the creator who posts constantly and will take $40 a video,
// not a name. Above this ceiling people quote agency rates; below the floor
// there is no audience to reach.
const MIN_FOLLOWERS = 1000;
const MAX_FOLLOWERS = 150000;

// How many clips the "what's working" grid shows. Each creator contributes at
// most 3, so a dozen spreads across several accounts rather than being one
// person's feed.
const VIDEO_GRID_SIZE = 12;

const SELECT =
  "id, username, nickname, avatar_url, bio, bio_link, follower_count, avg_likes_per_video, avg_views, verified, niche_tags";

function baseQuery(admin) {
  return admin
    .from("discovered_creators")
    .select(SELECT)
    .eq("platform", "tiktok")
    .eq("hidden", false)
    .gte("follower_count", MIN_FOLLOWERS)
    .lte("follower_count", MAX_FOLLOWERS)
    // Lifetime likes per post — the directory sorts on this for the same
    // reason: a sampled avg_views swings wildly on one dud video.
    .order("avg_likes_per_video", { ascending: false });
}

export async function matchCreators(admin, { nicheTags, limit = 12 }) {
  const tags = (nicheTags || []).filter(Boolean);

  // Tier 1 — creators actually tagged with this niche.
  let matched = [];
  if (tags.length > 0) {
    const { data, error } = await baseQuery(admin).overlaps("niche_tags", tags).limit(limit);
    if (error) throw error;
    matched = data || [];
  }

  // Tier 2 — top up from the untagged, brand-work-oriented pool.
  let general = [];
  if (matched.length < limit) {
    const seen = matched.map((c) => c.id);
    let q = baseQuery(admin)
      // Empty array literal: PostgREST renders this as niche_tags=eq.{}.
      .filter("niche_tags", "eq", "{}")
      .limit(limit - matched.length);
    if (seen.length > 0) q = q.not("id", "in", `(${seen.join(",")})`);

    const { data, error } = await q;
    if (error) throw error;
    general = data || [];
  }

  const creators = [...matched, ...general];
  const coverage =
    matched.length === 0 ? "general" : general.length === 0 ? "niche" : "mixed";

  // Only park keywords when the niche genuinely returned nothing — that is a
  // real gap in the rotation the seed cron should close.
  if (matched.length === 0 && tags.length > 0) await recordKeywords(admin, tags);

  if (creators.length === 0) {
    return { creators: [], videos: [], coverage, niche_matched: 0 };
  }

  const { data: clips } = await admin
    .from("discovered_creator_videos")
    .select("discovered_creator_id, video_url, thumbnail_url, views, position")
    .in("discovered_creator_id", creators.map((c) => c.id))
    .order("position", { ascending: true });

  const byCreator = new Map();
  for (const v of clips || []) {
    const list = byCreator.get(v.discovered_creator_id) || [];
    if (list.length < 3) list.push(v);
    byCreator.set(v.discovered_creator_id, list);
  }

  // The headline section: real posts from these creators, best-performing
  // first. This is the evidence a developer actually judges — "would a video
  // like that suit my app?" — so it leads the page rather than decorating a
  // card.
  const videos = (clips || [])
    .filter((v) => v.thumbnail_url)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, VIDEO_GRID_SIZE)
    .map((v) => ({
      creator_id: v.discovered_creator_id,
      video_url: v.video_url,
      thumbnail_url: v.thumbnail_url,
      views: v.views,
    }));

  const matchedIds = new Set(matched.map((c) => c.id));

  return {
    coverage,
    videos,
    niche_matched: matched.length,
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
      // Lets the card say "open to brand work" instead of implying we matched
      // them on topic when we didn't.
      niche_matched: matchedIds.has(c.id),
      videos: byCreator.get(c.id) || [],
    })),
  };
}

// A niche that returns nothing is a gap in the keyword rotation, not a dead
// end. Park searches for it in discovery_searches so the Monday seed cron
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
