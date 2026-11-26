// POST /api/integrations/revenuecat/[integrationId]
//
// RevenueCat webhook receiver, one URL per brand. The brand pastes this URL
// and `Bearer <webhook_secret>` (the Authorization header value) into
// RevenueCat → Integrations → Webhooks. See lib/earnings/revenuecat.js for
// how events become rev-share earnings.
//
// Every event is stored in revenue_events first (unique on event id), so a
// redelivered event is acknowledged without being processed twice.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { processRevenueCatEvent } from "@/lib/earnings/revenuecat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secretMatches(header, secret) {
  if (!header || !secret) return false;
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request, { params }) {
  const admin = createAdminClient();

  const { data: integration } = await admin
    .from("brand_integrations")
    .select("id, brand_id, provider, webhook_secret, status, store_takehome_rate")
    .eq("id", params.integrationId)
    .eq("provider", "revenuecat")
    .maybeSingle();

  if (!integration || !secretMatches(request.headers.get("authorization"), integration.webhook_secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = body?.event;
  if (!event?.id || !event?.type) {
    return NextResponse.json({ error: "Missing event" }, { status: 400 });
  }

  const { error: insertErr } = await admin.from("revenue_events").insert({
    brand_id: integration.brand_id,
    provider: "revenuecat",
    event_id: event.id,
    event_type: event.type,
    environment: event.environment || null,
    app_user_id: event.original_app_user_id || event.app_user_id || null,
    transaction_id: event.transaction_id || null,
    payload: body,
  });
  if (insertErr?.code === "23505") {
    return NextResponse.json({ ok: true, duplicate: true });
  }
  if (insertErr) {
    console.error("[revenuecat] failed to store event", insertErr);
    return NextResponse.json({ error: "Storage failed" }, { status: 500 });
  }

  // Any authenticated event (including RevenueCat's "Send test event")
  // proves the webhook is wired up.
  await admin
    .from("brand_integrations")
    .update({ status: "connected", last_event_at: new Date().toISOString() })
    .eq("id", integration.id);

  try {
    const outcome = await processRevenueCatEvent(admin, integration, event);
    await admin
      .from("revenue_events")
      .update({ processed_at: new Date().toISOString(), error: null, payload: { ...body, _outcome: outcome } })
      .eq("provider", "revenuecat")
      .eq("event_id", event.id);
    return NextResponse.json({ ok: true, outcome });
  } catch (e) {
    console.error("[revenuecat] processing failed", event.id, e);
    // Delete the stored row so RevenueCat's retry gets a clean attempt.
    await admin
      .from("revenue_events")
      .delete()
      .eq("provider", "revenuecat")
      .eq("event_id", event.id);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
