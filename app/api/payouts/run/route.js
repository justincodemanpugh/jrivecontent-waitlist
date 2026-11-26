// GET|POST /api/payouts/run
//
// Weekly cron (Mondays): charge each brand's saved card for its payable
// creator earnings and transfer each creator's share. Failed charges are
// retried by the daily /api/payouts/retry. See lib/payouts/run.js.
//
// Vercel Cron invokes with GET and `Authorization: Bearer <CRON_SECRET>`;
// POST with `x-cron-secret` is supported for manual runs.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runPayouts } from "@/lib/payouts/run";
import { isCronRequest } from "@/lib/payouts/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handler(request) {
  if (!isCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runPayouts(createAdminClient(), { mode: "weekly" });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[payouts/run]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
