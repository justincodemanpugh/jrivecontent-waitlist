// Public "scan your app" endpoint behind the hero input on /vibecode.
//
//   POST /api/vibecode/scan  { url }
//
// Deliberately unauthenticated: the whole point of the page is that a
// developer who has never heard of us can paste a link and immediately see
// what we'd do for their app. What they get back is gated, not the scan
// itself — without an active subscription the response carries one video
// idea and two anonymised creator cards, and the rest unlocks on trial.
//
// Because it is public and it spends money (one Anthropic call per fresh
// scan), three ceilings apply, in order of how much they matter:
//
//   1. The URL cache. A link scanned recently replays for free, which also
//      makes shared result links free.
//   2. Per-caller limits. A visitor can trigger a handful of fresh scans an
//      hour, not thousands.
//   3. A global daily cap. The worst case is bounded no matter what.
//
// A link we cannot read is rejected *before* the model call, so garbage
// input costs nothing.
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { brandHasActiveSubscription } from "@/lib/billing/subscription";
import { scanApp, normalizeAppUrl, ScanError } from "@/lib/vibecode/appScan";
import { generatePlan } from "@/lib/vibecode/generatePlan";
import { matchCreators } from "@/lib/vibecode/matchCreators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Store lookup + page fetch + one model call. Comfortably under this, but a
// slow origin shouldn't take the request down with it.
export const maxDuration = 60;

const CACHE_DAYS = 7;
const PER_IP_PER_HOUR = 3;
const PER_IP_PER_DAY = 10;
const GLOBAL_PER_DAY = 300;

const TEASER_IDEAS = 1;
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

async function checkQuota(admin, ipHash) {
  const [hour, day, global] = await Promise.all([
    admin
      .from("vibecode_scans")
      .select("id", { count: "exact", head: true })
      .eq("scanned_by_ip_hash", ipHash)
      .gte("scanned_at", since(60 * 60 * 1000)),
    admin
      .from("vibecode_scans")
      .select("id", { count: "exact", head: true })
      .eq("scanned_by_ip_hash", ipHash)
      .gte("scanned_at", since(24 * 60 * 60 * 1000)),
    admin
      .from("vibecode_scans")
      .select("id", { count: "exact", head: true })
      .gte("scanned_at", since(24 * 60 * 60 * 1000)),
  ]);

  if ((hour.count ?? 0) >= PER_IP_PER_HOUR) {
    return { ok: false, retryAfter: 3600, message: "That's a few scans in an hour. Try again shortly." };
  }
  if ((day.count ?? 0) >= PER_IP_PER_DAY) {
    return { ok: false, retryAfter: 86400, message: "You've hit today's scan limit. Try again tomorrow." };
  }
  if ((global.count ?? 0) >= GLOBAL_PER_DAY) {
    return { ok: false, retryAfter: 3600, message: "Scans are busy right now — try again in a little while." };
  }
  return { ok: true };
}

// What someone without a subscription sees: enough to prove the thing works,
// not enough to skip signing up. Creator identity is withheld (that is the
// part being sold); the sample clips stay, because they are what makes the
// preview feel real.
function toTeaser(result) {
  const ideas = result.plan.video_ideas || [];
  return {
    locked: true,
    app: result.app,
    plan: {
      summary: result.plan.summary,
      audience: result.plan.audience,
      niche_tags: result.plan.niche_tags,
      video_ideas: ideas.slice(0, TEASER_IDEAS),
      locked_idea_count: Math.max(0, ideas.length - TEASER_IDEAS),
    },
    coverage: result.coverage,
    creator_count: result.creators.length,
    creators: result.creators.slice(0, TEASER_CREATORS).map((c) => ({
      id: c.id,
      follower_count: c.follower_count,
      avg_likes_per_video: c.avg_likes_per_video,
      niche_tags: c.niche_tags,
      videos: (c.videos || []).map((v) => ({ thumbnail_url: v.thumbnail_url, views: v.views })),
    })),
  };
}

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "App scanning isn't configured on this deployment yet." },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const input = String(body?.url || "").trim();
    if (!input) {
      return NextResponse.json({ error: "Paste a link to your app first." }, { status: 400 });
    }

    let normalizedUrl;
    try {
      normalizedUrl = normalizeAppUrl(input);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }

    const admin = createAdminClient();

    // Who's asking — decides how much of the result comes back, not whether
    // the scan runs.
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const unlocked = user ? await brandHasActiveSubscription(supabase, user.id) : false;

    // Cache first: a hit costs nothing, so it is checked before the quota and
    // never counts against it.
    const { data: cached } = await admin
      .from("vibecode_scans")
      .select("result, scanned_at")
      .eq("normalized_url", normalizedUrl)
      .gte("scanned_at", since(CACHE_DAYS * 24 * 60 * 60 * 1000))
      .maybeSingle();

    if (cached?.result) {
      return NextResponse.json(unlocked ? { ...cached.result, locked: false } : toTeaser(cached.result));
    }

    const ipHash = hashIp(request);
    const quota = await checkQuota(admin, ipHash);
    if (!quota.ok) {
      return NextResponse.json(
        { error: quota.message },
        { status: 429, headers: { "Retry-After": String(quota.retryAfter) } },
      );
    }

    // Reject unreadable links here, before anything bills.
    let app;
    try {
      app = await scanApp(input);
    } catch (e) {
      if (e instanceof ScanError) {
        return NextResponse.json({ error: e.message }, { status: 422 });
      }
      throw e;
    }

    const plan = await generatePlan(app);
    const { creators, coverage } = await matchCreators(admin, {
      nicheTags: plan.niche_tags,
      keywords: plan.keywords,
    });

    const result = { app, plan, creators, coverage };

    // onConflict on the unique URL so a re-scan after the cache expires
    // refreshes the row rather than failing.
    const { error: writeError } = await admin.from("vibecode_scans").upsert(
      {
        normalized_url: normalizedUrl,
        source: app.source,
        app_name: app.name,
        app_category: app.category,
        result,
        scanned_by_ip_hash: ipHash,
        scanned_at: new Date().toISOString(),
      },
      { onConflict: "normalized_url" },
    );
    // A cache/ledger write failure shouldn't cost the caller their scan —
    // they already paid for it in latency and we already paid for it in
    // tokens. Log and serve.
    if (writeError) console.error("[vibecode/scan] could not persist scan", writeError);

    return NextResponse.json(unlocked ? { ...result, locked: false } : toTeaser(result));
  } catch (e) {
    console.error("[vibecode/scan] failed", e);
    return NextResponse.json(
      { error: "Something went wrong scanning that app. Try again in a minute." },
      { status: 500 },
    );
  }
}
