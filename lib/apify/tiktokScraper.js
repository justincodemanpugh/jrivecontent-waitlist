// Thin wrapper around Apify's public TikTok scraper. Server-only.
//
// This is the OAuth-free counterpart to lib/tiktok/api.js: it pulls the same
// view/like/comment/share numbers from a public TikTok profile without the
// creator authorizing anything, which is what lets tracking work before the
// TikTok app clears TikTok's app review.
//
// fetchVideosForUsername() deliberately returns the same field names
// (`id`, `create_time`, `share_url`, `view_count`, ...) that
// lib/tiktok/api.js's fetchVideoList() returns, so the sync routes can treat
// the two sources interchangeably and swapping back later is a one-line change.
const ACTOR_ID = "clockworks~tiktok-scraper";
const RUN_SYNC_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

function token() {
  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    throw new Error("Apify is not configured (APIFY_API_TOKEN missing).");
  }
  return apiToken;
}

// Accepts "@name", "name", "https://www.tiktok.com/@name",
// "tiktok.com/@name/video/123", etc. Returns the bare username, or "" if
// nothing usable was found.
export function parseTikTokUsername(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";

  // Pull the @handle out of a URL if one is present.
  const urlMatch = raw.match(/tiktok\.com\/@([A-Za-z0-9._]+)/i);
  if (urlMatch) return urlMatch[1];

  // Otherwise treat it as a bare handle, tolerating a leading '@' and any
  // stray trailing path/query from a half-pasted URL.
  const handle = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^@/, "")
    .split(/[/?#\s]/)[0];

  return /^[A-Za-z0-9._]+$/.test(handle) ? handle : "";
}

function firstNumber(...values) {
  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

// Apify actor output has drifted across versions, so read each metric from
// any of the field names the scraper is known to emit rather than assuming one.
function normalizeVideo(item) {
  const id = item?.id ?? item?.videoId ?? item?.awemeId;
  if (!id) return null;

  const createSeconds = firstNumber(item?.createTime, item?.createTimeUnix);
  const createIso = item?.createTimeISO || item?.createTimeIso || null;

  return {
    id: String(id),
    video_description: item?.text ?? item?.desc ?? item?.description ?? "",
    // Seconds since epoch, matching TikTok's Display API shape. Fall back to
    // parsing the ISO string when the numeric field is absent.
    create_time: createSeconds || (createIso ? Math.floor(new Date(createIso).getTime() / 1000) : 0),
    share_url: item?.webVideoUrl || item?.shareUrl || item?.videoUrl || null,
    // Cover URLs are signed and expire; callers rewrite them on every sync.
    cover_image_url:
      item?.videoMeta?.coverUrl ??
      item?.videoMeta?.originalCoverUrl ??
      item?.covers?.[0] ??
      null,
    duration: firstNumber(item?.videoMeta?.duration) || null,
    view_count: firstNumber(item?.playCount, item?.viewCount, item?.stats?.playCount),
    like_count: firstNumber(item?.diggCount, item?.likeCount, item?.stats?.diggCount),
    comment_count: firstNumber(item?.commentCount, item?.stats?.commentCount),
    share_count: firstNumber(item?.shareCount, item?.stats?.shareCount),
  };
}

// Scrape the most recent public videos for one TikTok profile.
// Returns { videos: [...] } using Display-API-compatible field names.
export async function fetchVideosForUsername(username, { limit = 30, signal } = {}) {
  const handle = parseTikTokUsername(username);
  if (!handle) throw new Error(`"${username}" is not a valid TikTok username.`);

  const res = await fetch(`${RUN_SYNC_URL}?token=${encodeURIComponent(token())}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      profiles: [handle],
      resultsPerPage: limit,
      // We only ever need the metadata — downloading media would blow up both
      // the run time and the Apify bill.
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSubtitles: false,
      shouldDownloadSlideshowImages: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Apify scrape failed for @${handle} (${res.status}).${body ? ` ${body.slice(0, 200)}` : ""}`,
    );
  }

  const items = await res.json();
  if (!Array.isArray(items)) {
    throw new Error(`Apify returned an unexpected response for @${handle}.`);
  }

  // A private/nonexistent profile yields a single item carrying an error
  // field rather than an HTTP error, so surface that as a real failure.
  const errored = items.find((i) => i?.error);
  if (errored) {
    throw new Error(`Apify could not scrape @${handle}: ${errored.error}`);
  }

  const videos = items.map(normalizeVideo).filter(Boolean);
  return { videos, username: handle };
}

// ---------------------------------------------------------------------------
// Creator discovery (public /creators directory).
//
// The functions above track accounts we already know about. These find
// accounts we don't, and read the profile half of the payload that
// normalizeVideo() throws away.
//
// Two actors, deliberately:
//   * DISCOVERY_ACTOR (the same scraper used above) searches by keyword and
//     bills $1.70/1000 video results. Measured at ~1.15 videos per unique
//     creator, so ~$1.95 per 1000 creators found.
//   * PROFILE_ACTOR bills $1.00/1000 and honors resultsPerPage:1 exactly
//     (verified: 2 profiles in, 2 items out), so a refresh costs ~$1.00 per
//     1000 profiles. Refreshing through DISCOVERY_ACTOR instead would cost
//     nearly 2x for the same data — don't.
// ---------------------------------------------------------------------------

const DISCOVERY_ACTOR = ACTOR_ID;
const PROFILE_ACTOR = "clockworks~tiktok-profile-scraper";

// avg_views from a keyword search is meaningless below this many sampled
// videos: a search yields barely more than one video per creator, and a
// single dud post makes an 80k-follower account look like it gets 133 views.
export const MIN_VIEW_SAMPLE = 3;

async function runActor(actorId, input, { signal } = {}) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token())}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
        shouldDownloadSubtitles: false,
        shouldDownloadSlideshowImages: false,
        ...input,
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Apify actor ${actorId} failed (${res.status}).${body ? ` ${body.slice(0, 200)}` : ""}`,
    );
  }

  const items = await res.json();
  if (!Array.isArray(items)) {
    throw new Error(`Apify actor ${actorId} returned an unexpected response.`);
  }
  return items;
}

// Pull the profile half out of a video item. Field names confirmed against a
// live run: id, name, profileUrl, nickName, verified, signature, bioLink,
// avatar, privateAccount, following, friends, fans, heart, video, digg.
export function normalizeAuthor(item) {
  const a = item?.authorMeta;
  if (!a?.name) return null;

  const followers = firstNumber(a.fans);
  const totalLikes = firstNumber(a.heart);
  const videoCount = firstNumber(a.video);

  return {
    username: String(a.name),
    platform_user_id: a.id ? String(a.id) : null,
    nickname: a.nickName || null,
    // Signed and expiring, exactly like video cover URLs — re-store every pass
    // rather than treating it as stable.
    avatar_url: a.avatar || a.originalAvatarUrl || null,
    bio: a.signature || null,
    // Usually a linktree/stan.store — in practice how a brand contacts them.
    bio_link: a.bioLink || null,
    follower_count: followers,
    following_count: firstNumber(a.following),
    total_likes: totalLikes,
    video_count: videoCount,
    // Lifetime-derived, so it doesn't swing on which videos a search happened
    // to sample. This is the engagement number the directory sorts on.
    avg_likes_per_video: videoCount > 0 ? Math.round(totalLikes / videoCount) : 0,
    verified: Boolean(a.verified),
    private_account: Boolean(a.privateAccount),
  };
}

// Search TikTok by keyword and collapse the video results into one row per
// creator. Returns [{ ...author, avg_views, sample_video_count, videos }],
// plus the raw result count so callers can record what they were billed for.
export async function searchCreators(keyword, { limit = 100, signal } = {}) {
  const query = String(keyword || "").trim();
  if (!query) throw new Error("searchCreators requires a keyword.");

  const items = await runActor(
    DISCOVERY_ACTOR,
    { searchQueries: [query], resultsPerPage: limit },
    { signal },
  );

  const errored = items.find((i) => i?.error);
  if (errored) {
    throw new Error(`Apify search failed for "${query}": ${errored.error}`);
  }

  const byUsername = new Map();
  for (const item of items) {
    const author = normalizeAuthor(item);
    if (!author) continue;

    let entry = byUsername.get(author.username);
    if (!entry) {
      entry = { ...author, videos: [] };
      byUsername.set(author.username, entry);
    }
    const video = normalizeVideo(item);
    if (video) entry.videos.push(video);
  }

  const creators = [...byUsername.values()].map((c) => {
    const views = c.videos.map((v) => v.view_count).filter((n) => n > 0);
    return {
      ...c,
      sample_video_count: c.videos.length,
      // Left null below the sample floor rather than shown as a bad number.
      avg_views:
        views.length >= MIN_VIEW_SAMPLE
          ? Math.round(views.reduce((s, v) => s + v, 0) / views.length)
          : null,
    };
  });

  // billedResults is what the Apify invoice counts, not creators.length.
  return { creators, billedResults: items.length };
}

// Refresh follower/like counts and avatar URLs for known usernames. Uses the
// cheaper profile actor at one video per profile — see the note above.
export async function fetchProfiles(usernames, { signal } = {}) {
  const handles = [...new Set(
    (usernames || []).map((u) => parseTikTokUsername(u)).filter(Boolean),
  )];
  if (handles.length === 0) return [];

  const items = await runActor(
    PROFILE_ACTOR,
    {
      profiles: handles,
      resultsPerPage: 1,
      profileScrapeSections: ["videos"],
    },
    { signal },
  );

  // A dead or renamed handle comes back as an item carrying `error` rather
  // than as an HTTP failure. Skip those; the batch must survive one bad row.
  const authors = new Map();
  for (const item of items) {
    if (item?.error) continue;
    const author = normalizeAuthor(item);
    if (author) authors.set(author.username.toLowerCase(), author);
  }
  return [...authors.values()];
}
