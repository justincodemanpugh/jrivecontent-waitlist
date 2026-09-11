// Public "scan your app" endpoint behind the hero input on /vibecode.
//
//   POST /api/vibecode/scan  { url, niche?, stage? }
//
// Deliberately unauthenticated: the whole point of the page is that a
// developer who has never heard of us can paste a link and immediately see
// what is already working in their niche. What comes back is gated, not the
// scan — without an active subscription the video thumbnails and view counts
// show but the links are inert and creator identities are withheld.
//
// Two stages, because the two halves have very different latencies. The store
// lookup resolves in ~300ms; matching creators and re-signing thumbnails takes
// noticeably longer. Returning the app card on its own first means the visitor
// sees their own app almost immediately instead of watching a spinner, and the
// second call fills in underneath:
//
//   stage: "app"  -> { app, niches }              (fast)
//   stage: "full" -> { platform, directory, videos, ... }   (default)
//
// Nothing here bills. The store lookup is Apple's free endpoint, the web
// fallback is one page fetch, oEmbed is free, and the matches are indexed
// Postgres queries. The rate limit exists because the server fetches a URL the
// caller supplies, so it must not become a free proxy — see the SSRF guard in
// appScan.js, which is the real defence.
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandHasActiveSubscription } from "@/lib/billing/subscription";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";
import { scanApp, normalizeAppUrl, ScanError } from "@/lib/vibecode/appScan";
import { inferNiches } from "@/lib/vibecode/nicheMap";
import { matchCreators } from "@/lib/vibecode/matchCreators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Metadata is cheap to refetch; this just avoids hammering Apple and other
// people's servers when a result link gets shared around.
const METADATA_CACHE_HOURS = 24;
const PER_IP_PER_HOUR = 20;

const TEASER_VIDEOS = 6;
const TEASER_CREATORS = 3;

function hashIp(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || "unknown";
  // Salted so the table never holds anything that reverses to an address.
  // Falls back to the service-role key purely as salt material — it never
  // leaves the server, and an unset VIBECODE_IP_SALT shouldn't silently
  // downgrade this to an unsalted hash on a fresh deploy.
  const salt = process.env.VIBECODE_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

function since(ms) {
  return new Date(Date.now() - ms).toISOString();
}

// What someone without a subscription sees. The thumbnails and view counts
// stay — they are the proof, and hiding them would leave nothing to be
// convinced by. Identity is what the subscription buys, so names, handles,
// avatars and links are withheld for BOTH tiers: a signed-up creator must not
// become visible to an anonymous visitor when the dashboard directory that
// lists them is subscription-gated (migration 0043).
function toTeaser(result) {
  const strip = (c) => ({
    id: c.id,
    source: c.source,
    niches: c.niches,
    // Numbers only — enough to judge the roster, not enough to contact anyone.
    follower_count: c.follower_count,
    avg_likes_per_video: c.avg_likes_per_video,
    rate_min: c.rate_min,
    rate_max: c.rate_max,
  });

  return {
    locked: true,
    app: result.app,
    niches: result.niches,
    platform_count: result.platform.length,
    directory_count: result.directory.length,
    platform: result.platform.slice(0, TEASER_CREATORS).map(strip),
    directory: result.directory.slice(0, TEASER_CREATORS).map(strip),
    video_count: result.videos.length,
    videos_are_niche: result.videosAreNiche,
    videos: result.videos.slice(0, TEASER_VIDEOS).map((v) => ({
      thumbnail_url: v.thumbnail_url,
      views: v.views,
    })),
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = String(body?.url || "").trim();
    if (!input) {
      return NextResponse.json({ error: "Paste a link to your app first." }, { status: 400 });
    }

    // Only ever an exact member of the shared vocabulary — this value goes
    // straight into a niche filter.
    const nicheOverride = CREATOR_NICHES.includes(body?.niche) ? body.niche : null;
    const appOnly = body?.stage === "app";

    let normalizedUrl;
    try {
      normalizedUrl = normalizeAppUrl(input);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }

    const admin = createAdminClient();

    // Recent metadata means we can skip the outbound fetch entirely, so this
    // is checked before the rate limit and never counts against it.
    const { data: cached } = await admin
      .from("vibecode_scans")
      .select("source, app_name, app_category")
      .eq("normalized_url", normalizedUrl)
      .gte("scanned_at", since(METADATA_CACHE_HOURS * 60 * 60 * 1000))
      .maybeSingle();

    let app;
    if (cached?.app_name) {
      // Enough to infer a niche and render the header. The icon isn't stored —
      // it's a signed, expiring URL — so a cached scan re-fetches for it only
      // when we need to show the card.
      app = {
        source: cached.source,
        name: cached.app_name,
        category: cached.app_category,
        description: "",
        iconUrl: null,
        storeUrl: normalizedUrl,
      };
    } else {
      const ipHash = hashIp(request);
      const { count } = await admin
        .from("vibecode_scans")
        .select("id", { count: "exact", head: true })
        .eq("scanned_by_ip_hash", ipHash)
        .gte("scanned_at", since(60 * 60 * 1000));

      if ((count ?? 0) >= PER_IP_PER_HOUR) {
        return NextResponse.json(
          { error: "That's a lot of scans in one hour. Try again shortly." },
          { status: 429, headers: { "Retry-After": "3600" } },
        );
      }

      try {
        app = await scanApp(input);
      } catch (e) {
        if (e instanceof ScanError) {
          return NextResponse.json({ error: e.message }, { status: 422 });
        }
        throw e;
      }

      const { error: writeError } = await admin.from("vibecode_scans").upsert(
        {
          normalized_url: normalizedUrl,
          source: app.source,
          app_name: app.name,
          app_category: app.category,
          scanned_by_ip_hash: ipHash,
          scanned_at: new Date().toISOString(),
        },
        { onConflict: "normalized_url" },
      );
      // Losing the log entry shouldn't cost the caller their scan.
      if (writeError) console.error("[vibecode/scan] could not log scan", writeError);
    }

    const niches = nicheOverride ? [nicheOverride] : inferNiches(app);
    const appCard = {
      source: app.source,
      name: app.name,
      category: app.category,
      iconUrl: app.iconUrl,
    };

    // Stage one: hand back the app card and stop. No auth check, no creator
    // queries — this call exists purely to be fast.
    if (appOnly) {
      return NextResponse.json({ stage: "app", app: appCard, niches });
    }

    // Who's asking — decides how much comes back, not whether the scan runs.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const unlocked = user ? await brandHasActiveSubscription(supabase, user.id) : false;

    const { platform, directory, videos, videosAreNiche } = await matchCreators(admin, {
      nicheTags: niches,
    });

    const result = {
      app: appCard,
      niches,
      platform,
      directory,
      videos,
      videos_are_niche: videosAreNiche,
      videosAreNiche,
    };
    return NextResponse.json(unlocked ? { ...result, locked: false } : toTeaser(result));
  } catch (e) {
    console.error("[vibecode/scan] failed", e);
    return NextResponse.json(
      { error: "Something went wrong scanning that app. Try again in a minute." },
      { status: 500 },
    );
  }
}
