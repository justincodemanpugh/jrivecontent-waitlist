// Brand-owned TikTok accounts to track, independent of programs.
//
//   POST   /api/tracked-accounts  { accounts: string[], videoLimit?: number }
//   DELETE /api/tracked-accounts  { id }
//
// Reads go straight through Supabase from the client (RLS scopes rows to the
// brand) — see lib/dashboard/brand/trackedAccountsApi.js. Writes come through
// here so a newly added account is scraped immediately instead of sitting
// empty until the next nightly cron run.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTikTokUsername } from "@/lib/apify/tiktokScraper";
import { syncTrackedAccount } from "@/lib/apify/sync";
import {
  brandHasActiveSubscription,
  TRIAL_REQUIRED_MESSAGE,
} from "@/lib/billing/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// An immediate scrape of a handful of accounts can take a couple of minutes.
export const maxDuration = 300;

// Keeps one dialog submission from running up an unbounded Apify bill or
// blowing the function's time budget.
const MAX_ACCOUNTS_PER_REQUEST = 10;
const ALLOWED_VIDEO_LIMITS = [10, 30, 50, 100];

export async function POST(request) {
  try {
    const { accounts, videoLimit } = await request.json();

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ error: "Add at least one account." }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    // Tracking costs real money (Apify credits), so it's gated behind the
    // trial. This check must live here rather than in RLS: the insert below
    // uses the service-role admin client, which bypasses row-level security.
    if (!(await brandHasActiveSubscription(supabase, user.id))) {
      return NextResponse.json({ error: TRIAL_REQUIRED_MESSAGE }, { status: 402 });
    }

    // Normalize + dedupe before touching the DB so "@x", "x" and the full
    // profile URL can't create three rows for the same account.
    const usernames = [];
    const invalid = [];
    for (const raw of accounts) {
      const username = parseTikTokUsername(raw);
      if (!username) {
        if (String(raw || "").trim()) invalid.push(String(raw).trim());
        continue;
      }
      if (!usernames.includes(username)) usernames.push(username);
    }

    if (usernames.length === 0) {
      return NextResponse.json(
        { error: `No valid TikTok accounts found${invalid.length ? `: ${invalid.join(", ")}` : "."}` },
        { status: 400 },
      );
    }
    if (usernames.length > MAX_ACCOUNTS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Add up to ${MAX_ACCOUNTS_PER_REQUEST} accounts at a time.` },
        { status: 400 },
      );
    }

    const limit = ALLOWED_VIDEO_LIMITS.includes(Number(videoLimit))
      ? Number(videoLimit)
      : 30;

    const admin = createAdminClient();
    const { data: saved, error: upsertErr } = await admin
      .from("tracked_accounts")
      .upsert(
        usernames.map((username) => ({
          brand_id: user.id,
          platform: "tiktok",
          username,
          video_limit: limit,
          status: "pending",
        })),
        { onConflict: "brand_id,platform,username" },
      )
      .select("id, username, video_limit");
    if (upsertErr) throw upsertErr;

    // Scrape now so the brand sees numbers right away. Each account records
    // its own success/failure on its row, so one bad handle can't fail the
    // whole request — and anything that errors here is retried by the cron.
    let videosUpserted = 0;
    const failures = [];
    if (process.env.APIFY_API_TOKEN) {
      for (const account of saved || []) {
        const res = await syncTrackedAccount(admin, account);
        videosUpserted += res.videosUpserted;
        if (!res.ok) failures.push({ username: account.username, error: res.error });
      }
    }

    return NextResponse.json({
      ok: true,
      added: saved?.length || 0,
      videosUpserted,
      invalid,
      failures,
      // Nothing was scraped — surfaced so the UI can explain the empty table.
      apifyConfigured: Boolean(process.env.APIFY_API_TOKEN),
    });
  } catch (e) {
    console.error("[tracked-accounts] POST failed", e);
    return NextResponse.json({ error: e.message || "Could not add accounts." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    // Scoped to the caller so a brand can only ever delete its own row.
    const { error } = await supabase
      .from("tracked_accounts")
      .delete()
      .eq("id", id)
      .eq("brand_id", user.id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[tracked-accounts] DELETE failed", e);
    return NextResponse.json({ error: e.message || "Could not remove account." }, { status: 500 });
  }
}
