// Public "scan your app" endpoint behind the hero input on /vibecode.
//
//   POST /api/vibecode/scan  { url, niche? }
//
// Deliberately unauthenticated: the whole point of the page is that a
// developer who has never heard of us can paste a link and immediately see
// what is already working in their niche. What comes back is gated, not the
// scan — without an active subscription the video thumbnails and view counts
// show but the links are inert and creator identities are withheld.
//
// Nothing here bills. The store lookup is Apple's free endpoint, the web
// fallback is one page fetch, and the matches are one indexed Postgres query.
// The rate limit exists because the server fetches a URL the caller supplies,
// so it must not become a free proxy — see the SSRF guard in appScan.js,
// which is the real defence.
//
// `niche` lets the results page override our guess. Category inference is a
// lookup table (lib/vibecode/nicheMap.js) and it will sometimes be wrong; a
// dropdown that re-queries is a better answer than pretending otherwise.
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
// A store lookup or a single page fetch. Generous only so a slow origin
// can't take the request down with it.
export const maxDuration = 30;

// Metadata is cheap to refetch; this just avoids hammering Apple and other
// people's servers when a result link gets shared around.
const METADATA_CACHE_HOURS = 24;
const PER_IP_PER_HOUR = 20;

const TEASER_VIDEOS = 6;
const TEASER_CREATORS = 2;

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

// What someone without a subscription sees: enough of the evidence to judge
// whether this channel suits their app, not enough to skip signing up. The
// thumbnails and view counts stay — they are the proof, and hiding them would
// leave nothing to be convinced by. The links and the handles are the part
// being sold, so those are withheld rather than blurred.
function toTeaser(result) {
  const videos = result.videos || [];
  const creators = result.creators || [];
  return {
    locked: true,
    app: result.app,
    niches: result.niches,
    coverage: result.coverage,
    niche_matched: result.niche_matched,
    video_count: videos.length,
    videos: videos.slice(0, TEASER_VIDEOS).map((v) => ({
      thumbnail_url: v.thumbnail_url,
      views: v.views,
    })),
    creator_count: creators.length,
    creators: creators.slice(0, TEASER_CREATORS).map((c) => ({
      id: c.id,
      follower_count: c.follower_count,
      avg_likes_per_video: c.avg_likes_per_video,
      niche_tags: c.niche_tags,
      niche_matched: c.niche_matched,
      videos: (c.videos || []).map((v) => ({ thumbnail_url: v.thumbnail_url, views: v.views })),
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
    // straight into a niche_tags filter.
    const nicheOverride = CREATOR_NICHES.includes(body?.niche) ? body.niche : null;

    let normalizedUrl;
    try {
      normalizedUrl = normalizeAppUrl(input);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }

    const admin = createAdminClient();

    // Who's asking — decides how much comes back, not whether the scan runs.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const unlocked = user ? await brandHasActiveSubscription(supabase, user.id) : false;

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
      // Enough to infer a niche and render the header. The icon and
      // screenshots aren't stored — they're signed, expiring URLs.
      app = {
        source: cached.source,
        name: cached.app_name,
        category: cached.app_category,
        description: "",
        iconUrl: null,
        screenshots: [],
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
    const { creators, videos, coverage, niche_matched } = await matchCreators(admin, {
      nicheTags: niches,
    });

    const result = {
      // The description is only ever an input to niche inference — shipping
      // 1500 characters of store listing to the browser buys nothing.
      app: {
        source: app.source,
        name: app.name,
        category: app.category,
        iconUrl: app.iconUrl,
      },
      niches,
      creators,
      videos,
      coverage,
      niche_matched,
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
