// POST /api/notify-creators-new-gig
// Supabase Database Webhook receiver. Fires on INSERT into public.gigs
// and sends all onboarded creators a notification about the new gig.
//
// Configure in Supabase: Database → Webhooks → new hook on `gigs`
// table, INSERT only, POST to this URL, with header `x-webhook-secret`
// set to SUPABASE_WEBHOOK_SECRET.

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  // 1. Auth: only Supabase (with the shared secret) can trigger this.
  const secret = process.env.SUPABASE_WEBHOOK_SECRET;
  const provided = request.headers.get("x-webhook-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse Supabase webhook payload.
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload?.type !== "INSERT" || payload?.table !== "gigs") {
    return NextResponse.json({ ok: true, skipped: "not an insert on gigs" });
  }

  const gig = payload.record;
  if (!gig?.id || !gig?.title) {
    return NextResponse.json({ ok: true, skipped: "missing gig fields" });
  }

  const { id: gigId, title: gigTitle, brand_name: brandName, pay_per_video: payPerVideo } = gig;

  const admin = createAdminClient();

  // 3. Get all onboarded creators.
  const { data: creators, error: creatorsErr } = await admin
    .from("creator_profiles")
    .select("user_id, display_name")
    .not("onboarded_at", "is", null);

  if (creatorsErr) {
    console.error("[notify-creators-new-gig] failed to fetch creators", creatorsErr);
    return NextResponse.json({ error: "Failed to fetch creators" }, { status: 500 });
  }

  if (!creators || creators.length === 0) {
    return NextResponse.json({ ok: true, notified: 0, message: "No creators to notify" });
  }

  // 4. Build notification body.
  const budget = payPerVideo ? `$${payPerVideo}/video` : "";
  const notificationBody = brandName
    ? `${brandName} just posted "${gigTitle}"${budget ? ` — ${budget}` : ""}. Check it out!`
    : `A new gig "${gigTitle}" was just posted${budget ? ` — ${budget}` : ""}. Check it out!`;

  // 5. Insert notifications for all creators.
  // The existing database webhook on `notifications` table will trigger
  // emails via /api/notifications/email.
  const notifications = creators.map((c) => ({
    user_id: c.user_id,
    type: "gig_new",
    title: gigTitle,
    body: notificationBody,
    link_url: `/dashboard/creator/explore/${gigId}`,
  }));

  // Batch insert in chunks to avoid hitting limits.
  const CHUNK_SIZE = 100;
  let inserted = 0;
  for (let i = 0; i < notifications.length; i += CHUNK_SIZE) {
    const chunk = notifications.slice(i, i + CHUNK_SIZE);
    const { error: insertErr } = await admin.from("notifications").insert(chunk);
    if (insertErr) {
      console.error("[notify-creators-new-gig] insert error", insertErr);
    } else {
      inserted += chunk.length;
    }
  }

  return NextResponse.json({
    ok: true,
    notified: inserted,
    total: creators.length,
  });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
