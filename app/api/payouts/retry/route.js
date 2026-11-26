// GET|POST /api/payouts/retry
//
// Daily cron: retries the payout charge for brands whose last charge failed
// and whose retry date (3 days later) has passed. Same engine as the weekly
// /api/payouts/run, in "retry" mode.
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
    const result = await runPayouts(createAdminClient(), { mode: "retry" });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[payouts/retry]", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
