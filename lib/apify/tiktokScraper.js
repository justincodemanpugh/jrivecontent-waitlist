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
