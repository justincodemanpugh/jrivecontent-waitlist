// On-demand metrics refresh for the signed-in brand.
//
//   POST /api/programs/refresh
//
// The scheduled syncs (/api/programs/apify-sync, /api/programs/tiktok-sync)
// only run once a day, so a video posted this morning stays invisible until
// tomorrow. This route runs the same sync helpers for just the caller's own
// creators and tracked accounts, on demand.
//
// Auth is the brand's own session — NOT CRON_SECRET, which stays reserved for
// the scheduled routes. A cooldown keeps a refresh-button masher from running
// up an unbounded Apify bill.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncTrackedAccount } from "@/lib/apify/sync";
import { syncCreatorHandle } from "@/lib/apify/handleSync";
import {
  brandHasActiveSubscription,
  TRIAL_REQUIRED_MESSAGE,
} from "@/lib/billing/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Scraping several accounts can take a couple of minutes.
export const maxDuration = 300;

const COOLDOWN_MS = 15 * 60 * 1000;

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    // Spends Apify credits, so it's gated like adding a tracked account.
    // Enforced here rather than in RLS because the sync below runs on the
    // service-role admin client.
    if (!(await brandHasActiveSubscription(supabase, user.id))) {
      return NextResponse.json({ error: TRIAL_REQUIRED_MESSAGE }, { status: 402 });
    }

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json(
        { error: "Tracking isn't configured on this deployment yet." },
        { status: 503 },
      );
    }

    const admin = createAdminClient();

    // Everything this brand tracks: standalone accounts, plus program members
    // who've given us a handle. Both scoped to the caller.
    const [accountsRes, membersRes] = await Promise.all([
      admin
        .from("tracked_accounts")
        .select("id, username, video_limit, last_synced_at")
        .eq("brand_id", user.id)
        .eq("platform", "tiktok"),
      admin
        .from("program_members")
        .select(`
          id,
          creator_id,
          programs!inner ( brand_id ),
          creator_profiles!program_members_creator_id_fkey_profile ( tiktok_handle )
        `)
        .eq("programs.brand_id", user.id)
        .eq("status", "active"),
    ]);
    if (accountsRes.error) throw accountsRes.error;
    if (membersRes.error) throw membersRes.error;

    const accounts = accountsRes.data || [];
    // Group by creator so someone in two of this brand's campaigns is scraped
    // once. Every row here is already a paid-brand membership (subscription
    // checked above), so all of them get their program_videos written.
    const membersByCreator = new Map();
    for (const m of membersRes.data || []) {
      const handle = m.creator_profiles?.tiktok_handle?.trim() || "";
      if (!handle) continue;
      const entry = membersByCreator.get(m.creator_id) || { creatorId: m.creator_id, handle, memberIds: [] };
      entry.memberIds.push(m.id);
      membersByCreator.set(m.creator_id, entry);
    }
    const members = [...membersByCreator.values()];

    if (accounts.length === 0 && members.length === 0) {
      return NextResponse.json(
        { error: "Nothing to refresh yet — add an account to track first." },
        { status: 400 },
      );
    }

    // Cooldown, measured off the most recent sync we actually recorded.
    const lastSynced = accounts.reduce((latest, a) => {
      if (!a.last_synced_at) return latest;
      const ms = new Date(a.last_synced_at).getTime();
      return ms > latest ? ms : latest;
    }, 0);
    const elapsed = Date.now() - lastSynced;
    if (lastSynced && elapsed < COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        {
          error: `Just refreshed. Try again in ${Math.ceil(retryAfterSeconds / 60)} min.`,
          retryAfterSeconds,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    // One bad handle shouldn't fail the whole refresh — syncTrackedAccount
    // records its own per-row error, and member failures are collected here.
    let videosUpserted = 0;
    const failures = [];

    for (const account of accounts) {
      const res = await syncTrackedAccount(admin, account);
      videosUpserted += res.videosUpserted;
      if (!res.ok) failures.push({ target: account.username, error: res.error });
    }

    for (const member of members) {
      try {
        const res = await syncCreatorHandle(admin, member);
        videosUpserted += res.videosUpserted || 0;
        if (!res.ok) failures.push({ target: member.handle, error: res.error });
      } catch (e) {
        failures.push({ target: member.handle, error: e.message });
      }
    }

    return NextResponse.json({
      ok: true,
      accountsSynced: accounts.length,
      membersSynced: members.length,
      videosUpserted,
      failures,
    });
  } catch (e) {
    console.error("[programs/refresh] failed", e);
    return NextResponse.json(
      { error: e.message || "Could not refresh metrics." },
      { status: 500 },
    );
  }
}
