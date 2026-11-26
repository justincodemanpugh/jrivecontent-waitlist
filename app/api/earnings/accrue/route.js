// GET|POST /api/earnings/accrue
//
// Daily cron, after the TikTok/Apify syncs so view counts are fresh:
//   1. flag videos whose views look bought
//   2. accrue base pay and CPM for approved videos into creator_earnings
//   3. move held earnings past their hold period to payable
//   4. tell brands whose campaign hit its monthly cap
//
// Vercel Cron invokes with GET and `Authorization: Bearer <CRON_SECRET>`;
// POST with `x-cron-secret` is supported for manual runs.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { accrueVideoEarnings } from "@/lib/earnings/videoEarnings";
import { promoteHeldEarnings } from "@/lib/earnings/ledger";
import { isCronRequest } from "@/lib/payouts/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handler(request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results = await accrueVideoEarnings(admin);
  const promoted = await promoteHeldEarnings(admin);

  const capped = [...results.cappedPrograms];
  if (capped.length) {
    const { data: programs } = await admin
      .from("programs")
      .select("id, brand_id, title, monthly_cap_cents")
      .in("id", capped);
    for (const p of programs || []) {
      await admin.from("notifications").insert({
        user_id: p.brand_id,
        type: "program_cap_reached",
        title: `${p.title} hit its monthly cap`,
        body: `This campaign reached its $${(p.monthly_cap_cents / 100).toFixed(2)} monthly cap. Creators stop earning until next month unless you raise it.`,
        link_url: `/dashboard/brand/programs/${p.id}`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    flagged: results.flagged,
    baseEarnings: results.base,
    cpmEarnings: results.cpm,
    promotedToPayable: promoted,
    cappedPrograms: capped.length,
    errors: results.errors,
  });
}

export const GET = handler;
export const POST = handler;
