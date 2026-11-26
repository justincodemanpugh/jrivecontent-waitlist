// The payout engine. Server-only.
//
// Once a week, for each brand with payable earnings:
//   1. lock the payable rows into a payout_batches row
//   2. charge the brand's saved card off-session (earnings + platform fee +
//      Stripe fee, see brandChargeBreakdown)
//   3. once the charge succeeds, transfer each creator's total to their
//      Connect account, using the charge as source_transaction so the
//      transfer doesn't wait for the funds to settle
//
// Step 3 runs inline when the charge succeeds synchronously and again from
// the payment_intent.succeeded webhook; Stripe idempotency keys and the
// row status checks make the second call a no-op.
//
// A failed charge releases the rows back to payable and schedules a retry
// in 3 days. Two failures in a row pause the brand's campaigns.
//
// If we can't tell whether a charge went through (network error, crash
// mid-run), the batch stays "charging" with its rows locked, and a later run
// asks Stripe what happened before anything is charged again.
import {
  stripe,
  getAccountCurrency,
  PLATFORM_FEE_RATE,
  STRIPE_FEE_PERCENT,
  STRIPE_FEE_FIXED_CENTS,
} from "@/lib/stripe/server";
import {
  brandChargeBreakdown,
  chargeOutcomeUnknown,
  reconcileAction,
} from "@/lib/earnings/calc";
import { promoteHeldEarnings } from "@/lib/earnings/ledger";

const DAY_MS = 86400000;
export const MIN_BATCH_EARNINGS_CENTS = 100;
const RETRY_AFTER_DAYS = 3;
const FAILURES_BEFORE_PAUSE = 2;
// Longer than any run can last (maxDuration 300s), so a batch still
// "charging" after this was abandoned.
const STALE_CHARGE_MINUTES = 30;

const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;

function sumBy(rows, key) {
  const totals = new Map();
  for (const r of rows) totals.set(r[key], (totals.get(r[key]) || 0) + r.amount_cents);
  return totals;
}

async function notify(admin, userId, { type, title, body, link }) {
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    link_url: link,
  });
  if (error) console.error("[payouts] notification failed", userId, error);
}

// The card the brand already pays their subscription with.
async function brandPaymentMethod(brand) {
  if (!brand?.stripe_customer_id) return null;
  const customer = await stripe.customers.retrieve(brand.stripe_customer_id);
  if (customer?.deleted) return null;

  const fromInvoice = customer.invoice_settings?.default_payment_method;
  if (fromInvoice) return typeof fromInvoice === "string" ? fromInvoice : fromInvoice.id;

  if (brand.stripe_subscription_id) {
    const sub = await stripe.subscriptions.retrieve(brand.stripe_subscription_id);
    const pm = sub.default_payment_method;
    if (pm) return typeof pm === "string" ? pm : pm.id;
  }

  const list = await stripe.paymentMethods.list({ customer: brand.stripe_customer_id, limit: 1 });
  return list.data[0]?.id || null;
}

// Brands with payable, unbatched earnings and no charge in flight.
async function brandsDueForPayout(admin) {
  const { data, error } = await admin
    .from("creator_earnings")
    .select("brand_id")
    .eq("status", "payable")
    .is("payout_batch_id", null);
  if (error) throw error;
  const brandIds = [...new Set((data || []).map((r) => r.brand_id))];
  if (!brandIds.length) return [];

  const { data: inFlight } = await admin
    .from("payout_batches")
    .select("brand_id")
    .in("brand_id", brandIds)
    .eq("status", "charging");
  const busy = new Set((inFlight || []).map((b) => b.brand_id));
  return brandIds.filter((id) => !busy.has(id));
}

// Brands whose latest batch failed and whose retry date has passed.
async function brandsDueForRetry(admin, now) {
  const { data, error } = await admin
    .from("payout_batches")
    .select("brand_id, status, next_retry_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const latest = new Map();
  for (const b of data || []) if (!latest.has(b.brand_id)) latest.set(b.brand_id, b);
  return [...latest.values()]
    .filter(
      (b) =>
        (b.status === "failed" || b.status === "requires_action") &&
        b.next_retry_at &&
        new Date(b.next_retry_at) <= now,
    )
    .map((b) => b.brand_id);
}

// Consecutive failed batches since the brand's last successful one.
async function consecutiveFailures(admin, brandId) {
  const { data } = await admin
    .from("payout_batches")
    .select("status")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false })
    .limit(10);
  let n = 0;
  for (const b of data || []) {
    if (b.status === "failed" || b.status === "requires_action") n += 1;
    else break;
  }
  return n;
}

export async function failBatch(admin, batch, { message, requiresAction = false }) {
  const { data: updated } = await admin
    .from("payout_batches")
    .update({
      status: requiresAction ? "requires_action" : "failed",
      last_error: (message || "Charge failed").slice(0, 500),
      next_retry_at: new Date(Date.now() + RETRY_AFTER_DAYS * DAY_MS).toISOString(),
    })
    .eq("id", batch.id)
    .eq("status", "charging")
    .select("id");
  if (!updated?.length) return; // already settled or failed

  // Put the earnings back so the retry (a fresh batch) picks them up.
  await admin
    .from("creator_earnings")
    .update({ payout_batch_id: null })
    .eq("payout_batch_id", batch.id)
    .eq("status", "payable");

  const failures = await consecutiveFailures(admin, batch.brand_id);
  if (failures >= FAILURES_BEFORE_PAUSE) {
    await admin
      .from("programs")
      .update({ status: "paused" })
      .eq("brand_id", batch.brand_id)
      .eq("status", "active");
    await notify(admin, batch.brand_id, {
      type: "payout_charge_failed",
      title: "Campaigns paused: creator payouts couldn't be charged",
      body: `We couldn't charge ${dollars(batch.charge_cents)} for creator payouts twice in a row, so your campaigns are paused. Update your card, then reactivate them.`,
      link: "/dashboard/brand/settings/billing",
    });
  } else {
    await notify(admin, batch.brand_id, {
      type: "payout_charge_failed",
      title: "Creator payout charge failed",
      body: `We couldn't charge ${dollars(batch.charge_cents)} for this week's creator payouts${requiresAction ? " because your bank asked for verification" : ""}. Update your card; we'll retry in ${RETRY_AFTER_DAYS} days.`,
      link: "/dashboard/brand/settings/billing",
    });
  }
}

// Transfer each creator's share of a paid batch. Safe to call repeatedly.
export async function settleBatch(admin, batchId, { chargeId } = {}) {
  const { data: batch } = await admin
    .from("payout_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return { transfers: 0 };

  const sourceCharge = chargeId || batch.stripe_charge_id;
  if (batch.status !== "paid") {
    await admin
      .from("payout_batches")
      .update({
        status: "paid",
        stripe_charge_id: sourceCharge || null,
        paid_at: new Date().toISOString(),
        last_error: null,
        next_retry_at: null,
      })
      .eq("id", batchId);
  }

  const { data: rows, error } = await admin
    .from("creator_earnings")
    .select("id, creator_id, amount_cents, status")
    .eq("payout_batch_id", batchId)
    .eq("status", "payable");
  if (error) throw error;
  if (!rows?.length) return { transfers: 0 };

  const byCreator = sumBy(rows, "creator_id");
  const { data: creators } = await admin
    .from("creator_profiles")
    .select("user_id, stripe_account_id")
    .in("user_id", [...byCreator.keys()]);
  const accountFor = new Map((creators || []).map((c) => [c.user_id, c.stripe_account_id]));

  let transfers = 0;
  for (const [creatorId, amount] of byCreator) {
    const ids = rows.filter((r) => r.creator_id === creatorId).map((r) => r.id);
    const destination = accountFor.get(creatorId);
    if (amount <= 0 || !destination) continue;

    try {
      // A transfer that went through but whose DB update failed must not be
      // sent again: look for it in the batch's transfer group first.
      const existing = await stripe.transfers.list({ transfer_group: batchId, destination, limit: 10 });
      const transfer =
        existing.data.find((t) => t.metadata?.creator_id === creatorId && !t.reversed) ||
        (await stripe.transfers.create(
          {
            amount,
            currency: batch.currency,
            destination,
            transfer_group: batchId,
            ...(sourceCharge ? { source_transaction: sourceCharge } : {}),
            metadata: { kind: "payout_batch", payout_batch_id: batchId, creator_id: creatorId },
          },
          // Keyed per day: Stripe replays a stored error for the same key for
          // 24h, so a retry on a later run needs a fresh key. The list check
          // above is what prevents a double transfer.
          { idempotencyKey: `payout-batch-${batchId}-${creatorId}-${new Date().toISOString().slice(0, 10)}` },
        ));
      await admin
        .from("creator_earnings")
        .update({ status: "paid", stripe_transfer_id: transfer.id, paid_at: new Date().toISOString() })
        .in("id", ids)
        .eq("status", "payable");
      transfers += 1;
      await notify(admin, creatorId, {
        type: "creator_paid",
        title: `You got paid ${dollars(amount)}`,
        body: "Your campaign earnings are on their way to your bank through Stripe.",
        link: "/dashboard/creator/programs",
      });
    } catch (e) {
      // The brand has already paid for these rows, so they stay in the batch
      // (status payable) and retryStuckTransfers() tries again next run. The
      // error goes on the batch, not the rows: row meta holds CPM running
      // totals that must not be overwritten.
      console.error("[payouts] transfer failed", batchId, creatorId, e);
      await admin
        .from("payout_batches")
        .update({ last_error: `Transfer to creator ${creatorId} failed: ${(e.message || "").slice(0, 300)}` })
        .eq("id", batchId);
    }
  }

  if (transfers > 0 && batch.status !== "paid") {
    await notify(admin, batch.brand_id, {
      type: "payout_batch_paid",
      title: `Paid ${byCreator.size} creator${byCreator.size === 1 ? "" : "s"} ${dollars(batch.earnings_cents)}`,
      body: `Your card was charged ${dollars(batch.charge_cents)} (incl. ${dollars(batch.platform_fee_cents + batch.processing_fee_cents)} in fees).`,
      link: "/dashboard/brand/programs/payouts",
    });
  }
  return { transfers };
}

// Paid batches with rows whose transfer failed (e.g. the creator's Stripe
// account was restricted at the time). Retried every run.
async function retryStuckTransfers(admin) {
  const { data } = await admin
    .from("creator_earnings")
    .select("payout_batch_id, payout_batches!inner ( status )")
    .eq("status", "payable")
    .not("payout_batch_id", "is", null)
    .eq("payout_batches.status", "paid");
  const batchIds = [...new Set((data || []).map((r) => r.payout_batch_id))];
  for (const id of batchIds) await settleBatch(admin, id);
  return batchIds.length;
}

// The PaymentIntent for a batch: the intent, null if Stripe has none, or
// undefined if we can't be sure either way.
async function findBatchIntent(admin, batch) {
  if (batch.stripe_payment_intent_id) {
    return stripe.paymentIntents.retrieve(batch.stripe_payment_intent_id);
  }
  const { data: brand, error } = await admin
    .from("brand_profiles")
    .select("stripe_customer_id")
    .eq("user_id", batch.brand_id)
    .maybeSingle();
  if (error) throw error;
  if (!brand?.stripe_customer_id) return undefined;

  // List rather than search: search results can lag behind.
  const page = await stripe.paymentIntents.list({
    customer: brand.stripe_customer_id,
    created: { gte: Math.floor(new Date(batch.created_at).getTime() / 1000) - 300 },
    limit: 100,
  });
  const match = page.data.find((pi) => pi.metadata?.payout_batch_id === batch.id);
  if (match) return match;
  return page.has_more ? undefined : null;
}

// Resolve batches left "charging": charge outcome unknown, or a run that
// died part way. Without this the brand is skipped by every later run.
async function reconcileStaleCharges(admin, now) {
  const { data: stale, error } = await admin
    .from("payout_batches")
    .select("*")
    .eq("status", "charging")
    .lt("created_at", new Date(now.getTime() - STALE_CHARGE_MINUTES * 60000).toISOString());
  if (error) throw error;

  let resolved = 0;
  for (const batch of stale || []) {
    try {
      const intent = await findBatchIntent(admin, batch);
      if (intent === undefined) {
        console.error("[payouts] can't verify charge, check in Stripe", batch.id);
        continue;
      }
      const action = reconcileAction(intent);
      if (action === "wait") continue;

      if (action === "release") {
        // Never charged. Not the brand's fault, so it doesn't count as a
        // failure: drop the batch and let this run pick the rows up.
        const { error: releaseErr } = await admin
          .from("creator_earnings")
          .update({ payout_batch_id: null })
          .eq("payout_batch_id", batch.id)
          .eq("status", "payable");
        if (releaseErr) throw releaseErr;
        await admin.from("payout_batches").delete().eq("id", batch.id).eq("status", "charging");
      } else {
        await admin
          .from("payout_batches")
          .update({ stripe_payment_intent_id: intent.id })
          .eq("id", batch.id);
        if (action === "settle") {
          const chargeId =
            typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;
          await settleBatch(admin, batch.id, { chargeId });
        } else {
          // Cancel first so the old intent can't succeed after we release
          // the rows. If cancelling throws, the batch stays locked.
          if (action === "cancel_then_fail") await stripe.paymentIntents.cancel(intent.id);
          await failBatch(admin, batch, {
            message: intent.last_payment_error?.message || `Charge ${intent.status}`,
            requiresAction: intent.status === "requires_action",
          });
        }
      }
      resolved += 1;
    } catch (e) {
      console.error("[payouts] reconcile failed", batch.id, e);
    }
  }
  return resolved;
}

// Build, lock and charge one brand's batch.
export async function chargeBrand(admin, brandId) {
  const { data: rows, error } = await admin
    .from("creator_earnings")
    .select("id, creator_id, amount_cents")
    .eq("brand_id", brandId)
    .eq("status", "payable")
    .is("payout_batch_id", null);
  if (error) throw error;
  if (!rows?.length) return { skipped: "nothing_payable" };

  // Only creators who can receive money, with a positive net (a refund
  // clawback larger than new earnings carries over to next time).
  const byCreator = sumBy(rows, "creator_id");
  const { data: creators } = await admin
    .from("creator_profiles")
    .select("user_id, stripe_account_id, stripe_payouts_enabled")
    .in("user_id", [...byCreator.keys()]);
  const payable = new Set(
    (creators || [])
      .filter((c) => c.stripe_account_id && c.stripe_payouts_enabled && byCreator.get(c.user_id) > 0)
      .map((c) => c.user_id),
  );
  const selected = rows.filter((r) => payable.has(r.creator_id));
  const earnings = selected.reduce((s, r) => s + r.amount_cents, 0);
  if (earnings < MIN_BATCH_EARNINGS_CENTS) return { skipped: "below_minimum" };

  const { data: brand } = await admin
    .from("brand_profiles")
    .select("user_id, stripe_customer_id, stripe_subscription_id")
    .eq("user_id", brandId)
    .maybeSingle();
  const paymentMethod = await brandPaymentMethod(brand).catch(() => null);
  if (!paymentMethod) {
    await notify(admin, brandId, {
      type: "payout_no_card",
      title: "Add a card to pay your creators",
      body: `${dollars(earnings)} in creator earnings is ready, but there's no card on file to charge.`,
      link: "/dashboard/brand/settings/billing",
    });
    return { skipped: "no_payment_method" };
  }

  const currency = await getAccountCurrency();
  const fees = brandChargeBreakdown(earnings, {
    platformFeeRate: PLATFORM_FEE_RATE,
    stripeFeePercent: STRIPE_FEE_PERCENT,
    stripeFeeFixedCents: STRIPE_FEE_FIXED_CENTS,
  });

  const { data: batch, error: batchErr } = await admin
    .from("payout_batches")
    .insert({
      brand_id: brandId,
      earnings_cents: fees.earningsCents,
      platform_fee_cents: fees.platformFeeCents,
      processing_fee_cents: fees.processingFeeCents,
      charge_cents: fees.chargeCents,
      currency,
      status: "charging",
    })
    .select("*")
    .single();
  if (batchErr) throw batchErr;

  // Lock the rows. Anything that changed since we read it (reversed,
  // grabbed by another run) simply isn't locked.
  const { data: locked } = await admin
    .from("creator_earnings")
    .update({ payout_batch_id: batch.id })
    .in("id", selected.map((r) => r.id))
    .eq("status", "payable")
    .is("payout_batch_id", null)
    .select("amount_cents");
  const lockedTotal = (locked || []).reduce((s, r) => s + r.amount_cents, 0);
  if (lockedTotal !== earnings) {
    // Re-price the batch to exactly what was locked.
    const refees = brandChargeBreakdown(lockedTotal, {
      platformFeeRate: PLATFORM_FEE_RATE,
      stripeFeePercent: STRIPE_FEE_PERCENT,
      stripeFeeFixedCents: STRIPE_FEE_FIXED_CENTS,
    });
    const repriced = {
      earnings_cents: refees.earningsCents,
      platform_fee_cents: refees.platformFeeCents,
      processing_fee_cents: refees.processingFeeCents,
      charge_cents: refees.chargeCents,
    };
    Object.assign(batch, repriced);
    await admin.from("payout_batches").update(repriced).eq("id", batch.id);
    if (lockedTotal < MIN_BATCH_EARNINGS_CENTS) {
      await admin.from("creator_earnings").update({ payout_batch_id: null }).eq("payout_batch_id", batch.id);
      await admin.from("payout_batches").delete().eq("id", batch.id);
      return { skipped: "below_minimum" };
    }
  }

  let intent;
  try {
    intent = await stripe.paymentIntents.create(
      {
        amount: batch.charge_cents,
        currency,
        customer: brand.stripe_customer_id,
        payment_method: paymentMethod,
        off_session: true,
        confirm: true,
        description: `JriveContent creator payouts (${dollars(batch.earnings_cents)} earned)`,
        transfer_group: batch.id,
        metadata: { kind: "payout_batch", payout_batch_id: batch.id, brand_id: brandId },
      },
      { idempotencyKey: `payout-batch-${batch.id}` },
    );
  } catch (e) {
    if (chargeOutcomeUnknown(e)) {
      // Releasing the rows now could charge the brand twice.
      console.error("[payouts] charge outcome unknown", batch.id, e);
      await admin
        .from("payout_batches")
        .update({ last_error: `Outcome unknown: ${(e.message || "").slice(0, 400)}` })
        .eq("id", batch.id);
      return { unknown: true, batchId: batch.id, error: e.message };
    }
    const pi = e?.raw?.payment_intent;
    await admin
      .from("payout_batches")
      .update({ stripe_payment_intent_id: pi?.id || null })
      .eq("id", batch.id);
    await failBatch(admin, batch, {
      message: e.message,
      requiresAction: e?.code === "authentication_required",
    });
    return { failed: true, batchId: batch.id, error: e.message };
  }

  await admin
    .from("payout_batches")
    .update({ stripe_payment_intent_id: intent.id })
    .eq("id", batch.id);

  if (intent.status === "succeeded") {
    const chargeId =
      typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;
    await settleBatch(admin, batch.id, { chargeId });
    return { paid: true, batchId: batch.id, chargeCents: batch.charge_cents };
  }
  // processing (e.g. bank debit): the webhook settles it later.
  return { charging: true, batchId: batch.id, status: intent.status };
}

// mode "weekly": every brand with payable earnings.
// mode "retry":  only brands whose last charge failed and are due a retry.
export async function runPayouts(admin, { mode = "weekly", now = new Date() } = {}) {
  const promoted = await promoteHeldEarnings(admin, now);
  const reconciled = await reconcileStaleCharges(admin, now);
  const stuckRetried = await retryStuckTransfers(admin);

  const brandIds = mode === "retry" ? await brandsDueForRetry(admin, now) : await brandsDueForPayout(admin);

  const results = [];
  for (const brandId of brandIds) {
    try {
      results.push({ brandId, ...(await chargeBrand(admin, brandId)) });
    } catch (e) {
      console.error("[payouts] brand failed", brandId, e);
      results.push({ brandId, error: e.message });
    }
  }
  return { mode, promoted, reconciled, stuckRetried, brands: results };
}
