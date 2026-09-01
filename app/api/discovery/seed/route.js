// GET|POST /api/discovery/seed
//
// Fills the public /creators directory by keyword-searching TikTok through
// Apify. Runs on a Vercel cron; POST with `x-cron-secret` for manual runs.
//
// Rotation, not one big run: each invocation takes the KEYWORDS_PER_RUN
// keywords with the oldest last_run_at, so the directory fills over several
// days and no single run can be expensive. Discovery bills ~$1.95 per 1000
// creators found (measured), so MAX_CREATORS_PER_RUN is the real spend cap —
// it is deliberately hardcoded rather than env-driven, because the failure
// mode of getting it wrong is a surprise invoice.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchCreators } from "@/lib/apify/tiktokScraper";
import {
  DISCOVERY_KEYWORDS,
  MIN_FOLLOWERS,
  MIN_VIDEO_COUNT,
} from "@/lib/discovery/keywords";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const KEYWORDS_PER_RUN = 4;
const RESULTS_PER_KEYWORD = 100;
// Hard ceiling per invocation. At ~$1.70/1000 billed video results this caps a
// single run at roughly $0.70 even if every keyword returns a full page.
const MAX_CREATORS_PER_RUN = 400;
const SAMPLE_VIDEOS_PER_CREATOR = 3;

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
  await ensureKeywordRows(admin);

  const { data: due, error: dueErr } = await admin
    .from("discovery_searches")
    .select("id, keyword, niche_tags")
    .order("last_run_at", { ascending: true, nullsFirst: true })
    .limit(KEYWORDS_PER_RUN);

  if (dueErr) {
    return NextResponse.json({ error: dueErr.message }, { status: 500 });
  }

  // Opted-out creators must never be re-listed, including ones who opted out
  // before we ever scraped them.
  const optedOut = await loadOptOuts(admin);

  const results = {
    keywordsProcessed: 0,
    billedResults: 0,
    creatorsUpserted: 0,
    skipped: { belowFloor: 0, private: 0, optedOut: 0, cap: 0 },
    errors: [],
  };

  for (const row of due || []) {
    if (results.creatorsUpserted >= MAX_CREATORS_PER_RUN) {
      results.skipped.cap += 1;
      continue;
    }

    try {
      const { creators, billedResults } = await searchCreators(row.keyword, {
        limit: RESULTS_PER_KEYWORD,
      });
      results.billedResults += billedResults;

      // A creator surfaces under several keywords over time. Load the tags
      // they already carry so the upsert below can union rather than replace
      // them — see the note in upsertCreator().
      const existingTags = await loadExistingTags(
        admin,
        creators.map((c) => c.username),
      );

      let kept = 0;
      for (const creator of creators) {
        if (results.creatorsUpserted >= MAX_CREATORS_PER_RUN) {
          results.skipped.cap += 1;
          break;
        }
        if (creator.private_account) { results.skipped.private += 1; continue; }
        if (optedOut.has(creator.username.toLowerCase())) {
          results.skipped.optedOut += 1;
          continue;
        }
        if (
          creator.follower_count < MIN_FOLLOWERS ||
          creator.video_count < MIN_VIDEO_COUNT
        ) {
          results.skipped.belowFloor += 1;
          continue;
        }

        const ok = await upsertCreator(admin, creator, row, existingTags);
        if (ok) { results.creatorsUpserted += 1; kept += 1; }
      }

      await admin
        .from("discovery_searches")
        .update({
          last_run_at: new Date().toISOString(),
          result_count: billedResults,
          creator_count: kept,
          last_error: null,
        })
        .eq("id", row.id);
      results.keywordsProcessed += 1;
    } catch (e) {
      console.error(`[discovery-seed] "${row.keyword}" failed`, e);
      results.errors.push({ keyword: row.keyword, error: e.message });
      // Still stamp last_run_at so one broken keyword can't wedge the rotation.
      await admin
        .from("discovery_searches")
        .update({ last_run_at: new Date().toISOString(), last_error: e.message })
        .eq("id", row.id);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}

// Keep discovery_searches in sync with the code-owned keyword list. New
// keywords land with last_run_at null, so the rotation picks them up first.
async function ensureKeywordRows(admin) {
  const rows = DISCOVERY_KEYWORDS.map((k) => ({
    keyword: k.keyword,
    niche_tags: k.niches.filter(Boolean),
  }));
  const { error } = await admin
    .from("discovery_searches")
    .upsert(rows, { onConflict: "keyword", ignoreDuplicates: true });
  if (error) console.error("[discovery-seed] keyword upsert failed", error);
}

async function loadOptOuts(admin) {
  const { data, error } = await admin
    .from("discovery_optouts")
    .select("username")
    .eq("platform", "tiktok");
  if (error) {
    // Fail closed: without the opt-out list we could re-list someone who asked
    // to be removed, so abort rather than scrape.
    throw new Error(`Could not load opt-outs: ${error.message}`);
  }
  return new Set((data || []).map((r) => r.username.toLowerCase()));
}

// Fetch the niche tags already stored for these usernames, one query for the
// whole keyword rather than one per creator.
async function loadExistingTags(admin, usernames) {
  if (usernames.length === 0) return new Map();
  const { data, error } = await admin
    .from("discovered_creators")
    .select("username, niche_tags")
    .eq("platform", "tiktok")
    .in("username", usernames);
  if (error) {
    // Non-fatal: worst case we fall back to this keyword's tags alone.
    console.error("[discovery-seed] could not load existing tags", error);
    return new Map();
  }
  return new Map((data || []).map((r) => [r.username.toLowerCase(), r.niche_tags || []]));
}

async function upsertCreator(admin, creator, keywordRow, existingTags) {
  const { videos, private_account, ...fields } = creator;

  // Union, never replace. Keywords rotate, so the same creator gets re-found
  // by a broader term with no niches attached; a plain overwrite would erase
  // the niche they were originally tagged with and quietly hollow out the
  // directory's niche filter over time.
  const nicheTags = [...new Set([
    ...(existingTags?.get(creator.username.toLowerCase()) || []),
    ...(keywordRow.niche_tags || []),
  ])];

  const { data, error } = await admin
    .from("discovered_creators")
    .upsert(
      {
        ...fields,
        platform: "tiktok",
        niche_tags: nicheTags,
        // Last keyword wins here, on purpose: it records how we most recently
        // found them, and unlike niche_tags nothing reads it as a filter.
        discovered_via: keywordRow.keyword,
        last_scraped_at: new Date().toISOString(),
      },
      { onConflict: "platform,username" },
    )
    .select("id, hidden")
    .single();

  if (error) {
    console.error(`[discovery-seed] upsert failed for @${creator.username}`, error);
    return false;
  }
  // `hidden` is never written by a sync, so an opted-out row that predates the
  // opt-out table stays hidden; don't bother storing sample videos for it.
  if (data.hidden) return false;

  const sample = (videos || []).slice(0, SAMPLE_VIDEOS_PER_CREATOR).map((v, i) => ({
    discovered_creator_id: data.id,
    platform_video_id: v.id,
    video_url: v.share_url,
    // Signed + expiring, so this is refreshed on every pass by design.
    thumbnail_url: v.cover_image_url,
    description: v.video_description,
    views: v.view_count,
    likes: v.like_count,
    posted_at: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
    position: i,
  }));

  if (sample.length > 0) {
    const { error: vErr } = await admin
      .from("discovered_creator_videos")
      .upsert(sample, { onConflict: "discovered_creator_id,platform_video_id" });
    if (vErr) console.error(`[discovery-seed] videos failed for @${creator.username}`, vErr);
  }
  return true;
}

export const GET = handler;
export const POST = handler;
