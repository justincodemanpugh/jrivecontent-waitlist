// Immediate TikTok scrape for the signed-in creator's saved @handle.
//
//   POST /api/programs/member-sync   (no body)
//
// The creator saves their handle through the setCreatorTikTokHandle server
// action (fast DB write), then the client calls this route for the slow part:
// scrape the public profile once, and — for every active membership whose
// campaign brand has a paid subscription — write the videos into program_videos
// so the brand dashboard fills in right away instead of waiting for the 07:00
// UTC cron.
//
// Memberships whose brand is NOT subscribed are skipped here: the paid metrics
// view is a brand benefit (same rule as /api/programs/refresh and
// /api/tracked-accounts). The scrape still runs so the creator gets a truthful
// "found N videos" confirmation; status just lands on 'skipped'.
//
// Auth is the creator's own session. CRON_SECRET stays reserved for the
// scheduled routes.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncCreatorHandle } from "@/lib/apify/handleSync";
import { PAID_STATUSES } from "@/lib/billing/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The Apify actor runs synchronously and a profile scrape can take 1-3 min.
export const maxDuration = 300;

// Re-checking the same handle can't beat this window. Bypassed when the last
// attempt errored (let the creator retry a fix) and naturally bypassed on a
// handle change, because setCreatorTikTokHandle nulls tiktok_handle_synced_at
// whenever the value actually changes.
const COOLDOWN_MS = 10 * 60 * 1000;

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await supabase
      .from("creator_profiles")
      .select(
        "tiktok_handle, tiktok_handle_synced_at, tiktok_handle_sync_status, tiktok_handle_video_count",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileErr) throw profileErr;

    const handle = profile?.tiktok_handle?.trim() || "";
    const admin = createAdminClient();

    // Handle was cleared — reset the status columns, nothing to scrape.
    if (!handle) {
      await admin
        .from("creator_profiles")
        .update({
          tiktok_handle_synced_at: null,
          tiktok_handle_sync_status: null,
          tiktok_handle_sync_error: null,
          tiktok_handle_video_count: null,
        })
        .eq("user_id", user.id);
      return NextResponse.json({ ok: true, cleared: true });
    }

    // Cooldown, measured off the last attempt we recorded.
    const lastSynced = profile?.tiktok_handle_synced_at
      ? new Date(profile.tiktok_handle_synced_at).getTime()
      : 0;
    const elapsed = Date.now() - lastSynced;
    const lastErrored = profile?.tiktok_handle_sync_status === "error";
    if (lastSynced && !lastErrored && elapsed < COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        {
          error: `Just checked your profile. Try again in ${Math.ceil(retryAfterSeconds / 60)} min.`,
          retryAfterSeconds,
          syncStatus: profile?.tiktok_handle_sync_status || null,
          videoCount: profile?.tiktok_handle_video_count ?? null,
        },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

    if (!process.env.APIFY_API_TOKEN) {
      return NextResponse.json({ ok: true, apifyConfigured: false });
    }

    // Active memberships for this creator, plus the owning brand.
    const { data: rows, error: rowsErr } = await admin
      .from("program_members")
      .select("id, programs!inner ( brand_id )")
      .eq("creator_id", user.id)
      .eq("status", "active");
    if (rowsErr) throw rowsErr;

    // Only populate program_videos for memberships whose brand is subscribed.
    let memberIds = [];
    if (rows?.length) {
      const brandIds = [...new Set(rows.map((r) => r.programs.brand_id))];
      const { data: brands, error: brandsErr } = await admin
        .from("brand_profiles")
        .select("user_id, subscription_status")
        .in("user_id", brandIds);
      if (brandsErr) throw brandsErr;

      const paidBrandIds = new Set(
        (brands || [])
          .filter((b) => PAID_STATUSES.has(b.subscription_status || "free"))
          .map((b) => b.user_id),
      );
      memberIds = rows
        .filter((r) => paidBrandIds.has(r.programs.brand_id))
        .map((r) => r.id);
    }

    const res = await syncCreatorHandle(admin, {
      creatorId: user.id,
      handle,
      memberIds,
    });

    return NextResponse.json({
      ok: res.ok,
      apifyConfigured: true,
      videoCount: res.videoCount,
      membersSynced: res.membersSynced,
      skipped: res.skipped ?? memberIds.length === 0,
      error: res.error,
    });
  } catch (e) {
    console.error("[programs/member-sync] failed", e);
    return NextResponse.json(
      { error: e.message || "Could not check your profile." },
      { status: 500 },
    );
  }
}
