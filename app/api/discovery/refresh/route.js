// GET|POST /api/discovery/refresh
//
// Keeps follower counts and avatar URLs current for the public /creators
// directory. Runs monthly; POST with `x-cron-secret` for manual runs.
//
// Cost is the whole design constraint here. This uses the profile actor
// (fetchProfiles -> clockworks~tiktok-profile-scraper at $1.00/1000 with
// resultsPerPage:1, verified 1 billed result per profile). Refreshing through
// the keyword/video scraper instead would bill $1.70/1000 for the same data,
// and refreshing at 30 videos per profile the way apify-sync does for tracked
// accounts would cost ~50x. Do not "reuse" syncTrackedAccount here.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchProfiles } from "@/lib/apify/tiktokScraper";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Runs daily and refreshes roughly 1/CYCLE_DAYS of the directory each time, so
// the whole thing cycles once a month at ANY size while each run stays well
// inside maxDuration. A fixed cap cannot do both: 200/month never finishes a
// 3000-row directory, and a single 3000-profile run would time out.
//
// At $1.00/1000 profiles this is ~$0.50/month for today's ~480 creators and
// ~$3/month at 3000.
const CYCLE_DAYS = 30;
const MIN_PROFILES_PER_RUN = 25;
const MAX_PROFILES_PER_RUN = 400; // ceiling so one run can't run long
const BATCH_SIZE = 25;

function sliceSize(total) {
  return Math.min(
    MAX_PROFILES_PER_RUN,
    Math.max(MIN_PROFILES_PER_RUN, Math.ceil(total / CYCLE_DAYS)),
  );
}

async function handler(request) {
  const secret = process.env.CRON_SECRET;
  const providedHeader = request.headers.get("x-cron-secret");
  const providedAuth = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!secret || (providedHeader !== secret && providedAuth !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.APIFY_API_TOKEN) {
    return NextResponse.json(
      { error: "Apify is not configured (APIFY_API_TOKEN missing)." },
      { status: 500 },
    );
  }

  const admin = createAdminClient();

  // Size this run against the directory so a full cycle takes CYCLE_DAYS
  // regardless of how big the directory has grown.
  const { count: directorySize } = await admin
    .from("discovered_creators")
    .select("id", { count: "exact", head: true })
    .eq("platform", "tiktok")
    .eq("hidden", false);
  const limit = sliceSize(directorySize ?? 0);

  // Stalest first. Hidden rows are skipped: refreshing someone who opted out
  // means paying to scrape a profile we are contractually not showing.
  const { data: stale, error } = await admin
    .from("discovered_creators")
    .select("id, username")
    .eq("platform", "tiktok")
    .eq("hidden", false)
    .order("last_scraped_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = { directorySize: directorySize ?? 0, slice: limit, requested: 0, updated: 0, missing: [], errors: [] };
  const idByUsername = new Map(
    (stale || []).map((r) => [r.username.toLowerCase(), r.id]),
  );

  for (let i = 0; i < (stale || []).length; i += BATCH_SIZE) {
    const batch = stale.slice(i, i + BATCH_SIZE);
    const usernames = batch.map((r) => r.username);
    results.requested += usernames.length;

    let authors = [];
    try {
      authors = await fetchProfiles(usernames);
    } catch (e) {
      console.error("[discovery-refresh] batch failed", e);
      results.errors.push({ batch: i / BATCH_SIZE, error: e.message });
      continue;
    }

    const seen = new Set();
    for (const author of authors) {
      const id = idByUsername.get(author.username.toLowerCase());
      if (!id) continue;
      seen.add(author.username.toLowerCase());

      // Metrics + the expiring avatar URL only. Never touches niche_tags,
      // discovered_via, or hidden.
      const { error: uErr } = await admin
        .from("discovered_creators")
        .update({
          nickname: author.nickname,
          avatar_url: author.avatar_url,
          bio: author.bio,
          bio_link: author.bio_link,
          follower_count: author.follower_count,
          following_count: author.following_count,
          total_likes: author.total_likes,
          video_count: author.video_count,
          avg_likes_per_video: author.avg_likes_per_video,
          verified: author.verified,
          last_scraped_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (uErr) results.errors.push({ username: author.username, error: uErr.message });
      else results.updated += 1;
    }

    // Renamed, deleted, or gone private. Stamp last_scraped_at anyway so a
    // dead handle can't sit at the head of the queue and block the rotation
    // on every future run.
    const missed = batch.filter((r) => !seen.has(r.username.toLowerCase()));
    if (missed.length > 0) {
      results.missing.push(...missed.map((r) => r.username));
      await admin
        .from("discovered_creators")
        .update({ last_scraped_at: new Date().toISOString() })
        .in("id", missed.map((r) => r.id));
    }
  }

  return NextResponse.json({ ok: true, ...results });
}

export const GET = handler;
export const POST = handler;
