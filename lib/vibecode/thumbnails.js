// Keep TikTok video thumbnails alive.
//
// The problem: discovered_creator_videos.thumbnail_url is a signed TikTok CDN
// URL carrying an `x-expires` timestamp. The seed cron writes it once and
// /api/discovery/refresh only ever renews the *creator's* avatar_url, never
// these. So they all quietly rot — measured on production, 881 of 882 stored
// thumbnails had expired and returned 403, which is why every tile on
// /vibecode (and in the dashboard's TikTok directory) rendered blank.
//
// The fix: TikTok's public oEmbed endpoint returns a freshly signed thumbnail
// for any public video URL. No key, no quota to sign up for, and it is the
// documented way to embed a post.
//
// This runs lazily on the handful of videos actually being shown, and writes
// what it gets back so the next reader — including the dashboard — gets a live
// URL for free. It is not a substitute for renewing them on the discovery
// cron; it is what makes the page correct today. See the note in
// /api/discovery/refresh.
const OEMBED_TIMEOUT_MS = 3500;

// A thumbnail is only worth re-fetching if it is actually dead. Anything with
// time left on the clock is left alone, so a scan usually makes zero outbound
// calls once a niche has been viewed.
export function isExpired(url) {
  if (!url) return true;
  const match = String(url).match(/[?&]x-expires=(\d+)/);
  if (!match) return false; // no expiry encoded — assume it is durable
  // A minute of headroom, so we don't hand the browser a URL that dies
  // between our check and the image request.
  return Number(match[1]) * 1000 <= Date.now() + 60_000;
}

async function fetchFreshThumbnail(videoUrl) {
  const res = await fetch(
    `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`,
    {
      signal: AbortSignal.timeout(OEMBED_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    },
  );
  if (!res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.thumbnail_url || null;
}

// Takes the video rows about to be rendered and returns them with live
// thumbnails. Never throws: a thumbnail we cannot refresh comes back null and
// the UI shows its placeholder tile, which is a much better outcome than
// failing the whole scan over a picture.
export async function refreshThumbnails(admin, videos) {
  const stale = (videos || []).filter((v) => v.video_url && isExpired(v.thumbnail_url));
  if (stale.length === 0) return videos;

  const results = await Promise.allSettled(
    stale.map(async (v) => ({ video: v, url: await fetchFreshThumbnail(v.video_url) })),
  );

  const refreshed = new Map();
  for (const r of results) {
    if (r.status !== "fulfilled" || !r.value.url) continue;
    refreshed.set(r.value.video.video_url, r.value.url);
  }

  if (refreshed.size > 0) {
    // Best-effort write-back, keyed on the row id we already hold. Failure
    // here just means the next viewer re-fetches from oEmbed.
    await Promise.allSettled(
      stale
        .filter((v) => refreshed.has(v.video_url) && v.id)
        .map((v) =>
          admin
            .from("discovered_creator_videos")
            .update({ thumbnail_url: refreshed.get(v.video_url) })
            .eq("id", v.id),
        ),
    );
  }

  return videos.map((v) => {
    if (!isExpired(v.thumbnail_url)) return v;
    const fresh = refreshed.get(v.video_url);
    // Null rather than a known-dead URL — the UI can render a real
    // placeholder, but only if we tell it the truth.
    return { ...v, thumbnail_url: fresh || null };
  });
}
