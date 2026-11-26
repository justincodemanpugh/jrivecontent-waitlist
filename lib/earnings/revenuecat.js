// Revenue share via RevenueCat webhooks. Server-only.
//
// Brand setup: in RevenueCat → Integrations → Webhooks they paste
//   URL:           {site}/api/integrations/revenuecat/{integrationId}
//   Authorization: Bearer {webhook_secret}
// and their app sets a subscriber attribute when a user enters a code:
//   Purchases.shared.attribution.setAttributes(["creator_code": "JUSTIN"])
//
// RevenueCat sends every subscriber attribute with every event, so the
// first event that carries a code attributes that app user to the creator.
// The attribution is locked from then on — a second code can't move an
// existing subscriber to another creator.
//
// Event fields used (RevenueCat webhook "event" object): id, type,
// app_user_id, original_app_user_id, price (USD, negative on refunds),
// takehome_percentage, transaction_id, environment, period_type,
// purchased_at_ms, event_timestamp_ms, cancel_reason,
// subscriber_attributes { name: { value, updated_at_ms } }.
import {
  revshareActive,
  revshareCents,
  revshareExpiresAt,
} from "@/lib/earnings/calc";
import { addEarning, reverseEarnings } from "@/lib/earnings/ledger";
import { normalizeCode } from "@/lib/earnings/codes";

export const CREATOR_CODE_ATTRIBUTE = "creator_code";

// Events where the subscriber paid money we should share.
const PAID_EVENTS = new Set(["INITIAL_PURCHASE", "RENEWAL", "NON_RENEWING_PURCHASE", "PRODUCT_CHANGE"]);

export function creatorCodeFromEvent(event) {
  const attrs = event?.subscriber_attributes || {};
  const raw = attrs[CREATOR_CODE_ATTRIBUTE]?.value ?? attrs.$campaign?.value;
  const code = normalizeCode(raw);
  return code.length >= 3 ? code : null;
}

function appUserId(event) {
  return event.original_app_user_id || event.app_user_id || null;
}

function isRefund(event) {
  return (
    (event.type === "CANCELLATION" && event.cancel_reason === "CUSTOMER_SUPPORT") ||
    Number(event.price) < 0
  );
}

function eventTime(event) {
  const ms = event.purchased_at_ms || event.event_timestamp_ms;
  return ms ? new Date(ms) : new Date();
}

// Find (or create) the attribution for this event's app user.
async function resolveAttribution(admin, integration, event) {
  const userId = appUserId(event);
  if (!userId) return null;

  const { data: existing } = await admin
    .from("revenue_attributions")
    .select("*")
    .eq("brand_id", integration.brand_id)
    .eq("app_user_id", userId)
    .maybeSingle();
  if (existing) return existing;

  const code = creatorCodeFromEvent(event);
  if (!code) return null;

  const { data: codeRow } = await admin
    .from("creator_codes")
    .select("creator_id, code")
    .eq("brand_id", integration.brand_id)
    .eq("code", code)
    .maybeSingle();
  if (!codeRow) return null;

  // The creator's most recent active rev-share campaign with this brand.
  const { data: memberships } = await admin
    .from("program_members")
    .select("id, status, programs!inner ( id, brand_id, status, revshare_bps, created_at )")
    .eq("creator_id", codeRow.creator_id)
    .eq("status", "active")
    .eq("programs.brand_id", integration.brand_id)
    .gt("programs.revshare_bps", 0);
  const membership = (memberships || [])
    .filter((m) => m.programs?.status === "active")
    .sort((a, b) => new Date(b.programs.created_at) - new Date(a.programs.created_at))[0];
  if (!membership) return null;

  const { data: created, error } = await admin
    .from("revenue_attributions")
    .insert({
      brand_id: integration.brand_id,
      app_user_id: userId,
      creator_id: codeRow.creator_id,
      program_id: membership.programs.id,
      program_member_id: membership.id,
      creator_code: code,
    })
    .select("*")
    .maybeSingle();
  if (error?.code === "23505") {
    const { data: raced } = await admin
      .from("revenue_attributions")
      .select("*")
      .eq("brand_id", integration.brand_id)
      .eq("app_user_id", userId)
      .maybeSingle();
    return raced;
  }
  if (error) throw error;
  return created;
}

// Process one RevenueCat event. Returns a short outcome string for the
// revenue_events audit row.
export async function processRevenueCatEvent(admin, integration, event) {
  if (event.type === "TEST") return "test";
  if (event.environment && event.environment !== "PRODUCTION") return "sandbox_ignored";

  const attribution = await resolveAttribution(admin, integration, event);
  if (!attribution) return "unattributed";

  // Refunds: undo the earning for that transaction.
  if (isRefund(event)) {
    if (!event.transaction_id) return "refund_without_transaction";
    const { data: earnings } = await admin
      .from("creator_earnings")
      .select("*")
      .eq("source_key", `rc:${integration.brand_id}:${event.transaction_id}`);
    if (!earnings?.length) return "refund_nothing_to_reverse";
    await reverseEarnings(admin, earnings, {
      reason: "refund",
      keyPrefix: `rc-refund:${event.transaction_id}`,
    });
    return "refund_reversed";
  }

  if (!PAID_EVENTS.has(event.type)) return "ignored_type";

  const when = eventTime(event);

  const { data: program } = await admin
    .from("programs")
    .select("id, brand_id, status, revshare_bps, revshare_months, monthly_cap_cents")
    .eq("id", attribution.program_id)
    .maybeSingle();
  if (!program || !program.revshare_bps) return "no_revshare_program";

  // The rev-share clock starts at the subscriber's first purchase.
  if (!attribution.first_purchase_at) {
    const firstPurchaseAt = when.toISOString();
    await admin
      .from("revenue_attributions")
      .update({
        first_purchase_at: firstPurchaseAt,
        expires_at: revshareExpiresAt(firstPurchaseAt, program.revshare_months)?.toISOString() || null,
      })
      .eq("id", attribution.id)
      .is("first_purchase_at", null);
    attribution.first_purchase_at = firstPurchaseAt;
  }

  if (
    !revshareActive({
      firstPurchaseAt: attribution.first_purchase_at,
      revshareMonths: program.revshare_months,
      at: when,
    })
  ) {
    return "revshare_expired";
  }

  // Free trials come through as INITIAL_PURCHASE with price 0.
  const takehome =
    event.takehome_percentage != null
      ? Number(event.takehome_percentage)
      : Number(integration.store_takehome_rate);
  const amount = revshareCents({
    priceUsd: event.price,
    takehomeRate: takehome,
    revshareBps: program.revshare_bps,
  });
  if (amount <= 0) return "zero_amount";
  if (!event.transaction_id) return "missing_transaction";

  const { inserted, capped } = await addEarning(
    admin,
    {
      brand_id: integration.brand_id,
      program_id: program.id,
      program_member_id: attribution.program_member_id,
      creator_id: attribution.creator_id,
      kind: "revshare",
      amount_cents: amount,
      source_key: `rc:${integration.brand_id}:${event.transaction_id}`,
      meta: {
        event_type: event.type,
        price_usd: Number(event.price),
        takehome_rate: takehome,
        revshare_bps: program.revshare_bps,
        product_id: event.product_id || null,
        app_user_id: attribution.app_user_id,
      },
    },
    { program, now: when },
  );
  if (capped && !inserted) return "capped";
  return inserted ? "earned" : "duplicate";
}
