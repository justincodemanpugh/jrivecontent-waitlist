// Unit tests for what the subscription charges and where redirects may go.
// Run: node --test scripts/test-billing.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { checkoutParams } from "../lib/billing/checkout.js";
import { trialState } from "../lib/billing/trial.js";
import { safePath } from "../lib/auth/safePath.js";

const base = {
  customerId: "cus_1",
  userId: "user-1",
  priceId: "price_monthly",
  trialFeePriceId: "price_week",
  base: "https://example.com",
  returnTo: "/plan",
};

test("first-time: the fee now, the monthly price after 7 days", () => {
  const p = checkoutParams({ ...base, trial: true });
  assert.deepEqual(p.line_items, [
    { price: "price_monthly", quantity: 1 },
    { price: "price_week", quantity: 1 },
  ]);
  assert.equal(p.subscription_data.trial_period_days, 7);
  assert.match(p.custom_text.submit.message, /\$1 today, then \$25\/month after 7 days/);
});

test("returning: monthly price today, no second cheap week", () => {
  const p = checkoutParams({ ...base, trial: false });
  assert.deepEqual(p.line_items, [{ price: "price_monthly", quantity: 1 }]);
  assert.equal(p.subscription_data.trial_period_days, undefined);
  assert.doesNotMatch(p.custom_text.submit.message, /\$1/);
});

test("the webhook can tell whose subscription it is", () => {
  const p = checkoutParams({ ...base, trial: true });
  assert.deepEqual(p.subscription_data.metadata, { user_id: "user-1", plan: "brand_monthly" });
  assert.equal(p.customer, "cus_1");
});

test("success is marked, cancel is not", () => {
  const p = checkoutParams({ ...base, trial: true });
  assert.equal(p.success_url, "https://example.com/plan?checkout=success");
  assert.equal(p.cancel_url, "https://example.com/plan");
  const q = checkoutParams({ ...base, trial: true, returnTo: "/plan?a=1" });
  assert.equal(q.success_url, "https://example.com/plan?a=1&checkout=success");
});

test("who still gets the $1 week", () => {
  assert.deepEqual(trialState([]), { live: false, trialEligible: true });
  assert.deepEqual(trialState([{ status: "incomplete_expired" }]), { live: false, trialEligible: true });
  assert.deepEqual(trialState([{ status: "canceled" }]), { live: false, trialEligible: false });
  for (const status of ["trialing", "active", "past_due", "unpaid"]) {
    assert.deepEqual(trialState([{ status }]), { live: true, trialEligible: false });
  }
});

test("redirects stay on this site", () => {
  const origin = "https://example.com";
  assert.equal(safePath("/plan?url=a&niche=b"), "/plan?url=a&niche=b");
  assert.equal(safePath(`${origin}/plan`, "/x", origin), "/plan");
  for (const bad of [
    "@evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "https://evil.com/plan",
    "https://example.com.evil.com/",
    ".evil.com",
    "",
    null,
  ]) {
    assert.equal(safePath(bad, "/x", origin), "/x", String(bad));
  }
});
