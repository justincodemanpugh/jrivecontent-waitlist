// GET|POST /api/programs/apify-sync
//
// OAuth-free counterpart to /api/programs/tiktok-sync. That route uses
// TikTok's official Display API, which needs every creator to authorize the
// app — and that only works once the app clears TikTok's app review. This one
// scrapes the same public numbers via Apify so brands see real metrics in the
// meantime.
//
// Vercel Cron invokes with GET and an `Authorization: Bearer <CRON_SECRET>`
// header; POST with `x-cron-secret` is supported for manual runs.
//
// It syncs two independent sets of accounts:
//   1. Program members whose creator saved a TikTok handle
//      (creator_profiles.tiktok_handle) -> program_videos +
//      program_video_metric_snapshots, i.e. the exact tables the official
//      sync writes, so the brand dashboard needs no changes.
//   2. Brand-tracked accounts (tracked_accounts, added from the brand
//      dashboard's "Track Accounts" dialog) -> tracked_account_videos +
//      tracked_account_video_snapshots.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncTrackedAccount } from "@/lib/apify/sync";
import { syncCreatorHandle } from "@/lib/apify/handleSync";
import { PAID_STATUSES } from "@/lib/billing/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Scrapes are slow (Apify runs the actor synchronously); give the whole batch
// room rather than letting a partial sync get killed mid-flight.
export const maxDuration = 300;

async function handler(request) {
  const secret = process.env.CRON_SECRET;
  const providedHeader = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");
  const providedAuth = authHeader?.replace("Bearer ", "");

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
  const results = {
    membersProcessed: 0,
    trackedAccountsProcessed: 0,
    videosUpserted: 0,
    errors: [],
  };

  await syncMembers(admin, results);
  await syncAccounts(admin, results);

  return NextResponse.json({ ok: true, ...results });
}

async function syncMembers(admin, results) {
  const { data: members, error: membersErr } = await admin
    .from("program_members")
    .select("id, creator_id, programs!inner ( brand_id )")
    .eq("status", "active");

  if (membersErr) {
    console.error("[apify-sync] failed to load program members", membersErr);
    results.errors.push({ scope: "program_members", error: membersErr.message });
    return;
  }
  if (!members?.length) return;

  // Only track members whose campaign brand has a paid subscription — the paid
  // metrics view is a brand benefit, same rule as /api/programs/refresh and the
  // immediate save in /api/programs/member-sync.
  const brandIds = [...new Set(members.map((m) => m.programs.brand_id))];
  const { data: brands, error: brandsErr } = await admin
    .from("brand_profiles")
    .select("user_id, subscription_status")
    .in("user_id", brandIds);
  if (brandsErr) {
    console.error("[apify-sync] failed to load brand subscriptions", brandsErr);
    results.errors.push({ scope: "brand_profiles", error: brandsErr.message });
    return;
  }
  const paidBrandIds = new Set(
    (brands || [])
      .filter((b) => PAID_STATUSES.has(b.subscription_status || "free"))
      .map((b) => b.user_id),
  );

  // Group the payable memberships by creator so a creator in several campaigns
  // is scraped once, not once per membership.
  const memberIdsByCreator = new Map();
  for (const m of members) {
    if (!paidBrandIds.has(m.programs.brand_id)) continue;
    const list = memberIdsByCreator.get(m.creator_id) || [];
    list.push(m.id);
    memberIdsByCreator.set(m.creator_id, list);
  }
  if (!memberIdsByCreator.size) return;

  // Resolve handles in one query. creator_profiles is keyed on user_id (see the
  // FKs at the bottom of migration 0034).
  const creatorIds = [...memberIdsByCreator.keys()];
  const { data: profiles, error: profilesErr } = await admin
    .from("creator_profiles")
    .select("user_id, tiktok_handle")
    .in("user_id", creatorIds);

  if (profilesErr) {
    console.error("[apify-sync] failed to load creator profiles", profilesErr);
    results.errors.push({ scope: "creator_profiles", error: profilesErr.message });
    return;
  }

  const handleByCreator = new Map(
    (profiles || [])
      .filter((p) => p.tiktok_handle?.trim())
      .map((p) => [p.user_id, p.tiktok_handle.trim()]),
  );

  for (const [creatorId, memberIds] of memberIdsByCreator) {
    const handle = handleByCreator.get(creatorId);
    if (!handle) continue; // creator hasn't given us a handle yet

    try {
      const res = await syncCreatorHandle(admin, { creatorId, handle, memberIds });
      results.videosUpserted += res.videosUpserted || 0;
      results.membersProcessed += res.membersSynced || 0;
      if (!res.ok) {
        results.errors.push({ creator_id: creatorId, error: res.error });
      }
    } catch (e) {
      console.error(`[apify-sync] failed for creator ${creatorId}`, e);
      results.errors.push({ creator_id: creatorId, error: e.message });
    }
  }
}

async function syncAccounts(admin, results) {
  const { data: accounts, error: accountsErr } = await admin
    .from("tracked_accounts")
    .select("id, username, video_limit")
    .eq("platform", "tiktok");

  if (accountsErr) {
    console.error("[apify-sync] failed to load tracked accounts", accountsErr);
    results.errors.push({ scope: "tracked_accounts", error: accountsErr.message });
    return;
  }

  for (const account of accounts || []) {
    // syncTrackedAccount records its own failures on the row, so a bad handle
    // never aborts the rest of the batch.
    const res = await syncTrackedAccount(admin, account);
    results.videosUpserted += res.videosUpserted;
    results.trackedAccountsProcessed += 1;
    if (!res.ok) {
      results.errors.push({ tracked_account_id: account.id, error: res.error });
    }
  }
}

export const GET = handler;
export const POST = handler;
