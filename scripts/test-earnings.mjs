// Unit tests for the creator-deal pay math (lib/earnings/calc.js).
// Run: node --test scripts/test-earnings.mjs
import test from "node:test";
import assert from "node:assert/strict";
import {
  availableAt,
  applyMonthlyCap,
  brandChargeBreakdown,
  chargeOutcomeUnknown,
  cpmIncrement,
  cpmTotalCents,
  estimateMonthlyCents,
  looksSuspicious,
  payTermsLabel,
  reconcileAction,
  revshareActive,
  revshareCents,
  revshareExpiresAt,
  viewWindowEnd,
} from "../lib/earnings/calc.js";

test("CPM total: $1.50 per 1K views", () => {
  assert.equal(cpmTotalCents(20000, 150), 3000);
  assert.equal(cpmTotalCents(999, 100), 99);
  assert.equal(cpmTotalCents(50000, 0), 0);
});

test("CPM increment credits only growth since the last run", () => {
  const day1 = cpmIncrement({ views: 10000, cpmCents: 100 });
  assert.deepEqual(day1, { targetCents: 1000, incrementCents: 1000 });
  const day2 = cpmIncrement({ views: 25000, cpmCents: 100, previousTargetCents: day1.targetCents });
  assert.deepEqual(day2, { targetCents: 2500, incrementCents: 1500 });
});

test("CPM never claws back when TikTok revises views down", () => {
  const r = cpmIncrement({ views: 8000, cpmCents: 100, previousTargetCents: 1000 });
  assert.equal(r.incrementCents, 0);
  assert.equal(r.targetCents, 1000);
});

test("per-video cap covers base + CPM together", () => {
  // $100 cap, $25 base already earned -> CPM can reach $75 at most.
  const r = cpmIncrement({
    views: 1_000_000,
    cpmCents: 100,
    maxPayoutPerVideoCents: 10000,
    baseEarnedCents: 2500,
  });
  assert.deepEqual(r, { targetCents: 7500, incrementCents: 7500 });
  const next = cpmIncrement({
    views: 2_000_000,
    cpmCents: 100,
    previousTargetCents: 7500,
    maxPayoutPerVideoCents: 10000,
    baseEarnedCents: 2500,
  });
  assert.equal(next.incrementCents, 0);
});

test("view window end", () => {
  assert.equal(
    viewWindowEnd("2026-10-01T00:00:00Z", 30).toISOString(),
    "2026-10-31T00:00:00.000Z",
  );
});

test("monthly cap clamps and forfeits the overflow", () => {
  assert.equal(applyMonthlyCap(5000, { monthlyCapCents: 20000, spentThisMonthCents: 18000 }), 2000);
  assert.equal(applyMonthlyCap(5000, { monthlyCapCents: 20000, spentThisMonthCents: 25000 }), 0);
  assert.equal(applyMonthlyCap(5000, { monthlyCapCents: null, spentThisMonthCents: 1e9 }), 5000);
});

test("rev share: 30% of what the brand keeps after Apple's cut", () => {
  // $9.99 sub, brand keeps 85% -> $8.49, creator 30% -> $2.55
  assert.equal(revshareCents({ priceUsd: 9.99, takehomeRate: 0.85, revshareBps: 3000 }), 255);
  // free trial (price 0) and refunds (negative) earn nothing here
  assert.equal(revshareCents({ priceUsd: 0, takehomeRate: 0.85, revshareBps: 3000 }), 0);
  assert.equal(revshareCents({ priceUsd: -9.99, takehomeRate: 0.85, revshareBps: 3000 }), 0);
});

test("rev share window: 12 months from first purchase, or lifetime", () => {
  const first = "2026-01-15T12:00:00Z";
  assert.equal(revshareActive({ firstPurchaseAt: first, revshareMonths: 12, at: "2026-12-20T00:00:00Z" }), true);
  assert.equal(revshareActive({ firstPurchaseAt: first, revshareMonths: 12, at: "2027-01-16T00:00:00Z" }), false);
  assert.equal(revshareActive({ firstPurchaseAt: first, revshareMonths: null, at: "2030-01-01T00:00:00Z" }), true);
  assert.equal(revshareExpiresAt(first, 12).toISOString(), "2027-01-15T00:00:00.000Z");
  assert.equal(revshareExpiresAt(first, null), null);
});

test("hold periods", () => {
  const now = new Date("2026-10-15T00:00:00Z");
  assert.equal(availableAt("base", now).toISOString(), now.toISOString());
  assert.equal(availableAt("cpm", now).toISOString(), "2026-10-22T00:00:00.000Z");
  assert.equal(availableAt("revshare", now).toISOString(), "2026-11-14T00:00:00.000Z");
});

test("suspicious engagement", () => {
  assert.equal(looksSuspicious({ views: 50000, likes: 100 }), true); // 0.2%
  assert.equal(looksSuspicious({ views: 50000, likes: 2000 }), false); // 4%
  assert.equal(looksSuspicious({ views: 5000, likes: 0 }), false); // too small to judge
});

test("brand charge: creators get earnings in full, fees on top", () => {
  const b = brandChargeBreakdown(10000, {
    platformFeeRate: 0.05,
    stripeFeePercent: 0.029,
    stripeFeeFixedCents: 30,
  });
  assert.equal(b.earningsCents, 10000);
  assert.equal(b.platformFeeCents, 500);
  // After Stripe takes 2.9% + 30c, at least earnings + platform fee remains.
  const net = b.chargeCents - Math.round(b.chargeCents * 0.029) - 30;
  assert.ok(net >= 10500, `net ${net}`);
  assert.equal(b.chargeCents, b.earningsCents + b.platformFeeCents + b.processingFeeCents);
});

test("monthly estimate respects the per-video cap", () => {
  assert.equal(
    estimateMonthlyCents({ videosPerMonth: 4, payPerVideoCents: 2500, cpmCents: 100, avgViews: 10000 }),
    4 * 3500,
  );
  assert.equal(
    estimateMonthlyCents({
      videosPerMonth: 4,
      payPerVideoCents: 2500,
      cpmCents: 100,
      avgViews: 1_000_000,
      maxPayoutPerVideoCents: 10000,
    }),
    40000,
  );
});

test("pay label", () => {
  assert.equal(
    payTermsLabel({ payPerVideoCents: 2500, cpmCents: 100, revshareBps: 3000 }),
    "$25/video + $1.00/1K views + 30% rev share",
  );
  assert.equal(payTermsLabel({ payPerVideoCents: 0, cpmCents: 0, revshareBps: 0 }), "Unpaid");
});

test("only a Stripe rejection counts as a failed charge", () => {
  assert.equal(chargeOutcomeUnknown({ type: "StripeCardError" }), false);
  assert.equal(chargeOutcomeUnknown({ type: "StripeInvalidRequestError" }), false);
  assert.equal(chargeOutcomeUnknown({ type: "StripeConnectionError" }), true);
  assert.equal(chargeOutcomeUnknown({ type: "StripeAPIError" }), true);
  assert.equal(chargeOutcomeUnknown(new Error("timeout")), true);
});

test("abandoned charge: what to do with what Stripe says", () => {
  assert.equal(reconcileAction(null), "release");
  assert.equal(reconcileAction({ status: "succeeded" }), "settle");
  assert.equal(reconcileAction({ status: "processing" }), "wait");
  assert.equal(reconcileAction({ status: "canceled" }), "fail");
  assert.equal(reconcileAction({ status: "requires_action" }), "cancel_then_fail");
  assert.equal(reconcileAction({ status: "requires_payment_method" }), "cancel_then_fail");
});
