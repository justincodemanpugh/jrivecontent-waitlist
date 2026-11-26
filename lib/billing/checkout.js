// The Stripe Checkout Session for the brand subscription. Pure, so what is
// charged can be tested (scripts/test-billing.mjs).
//
// First-time subscribers pay a one-time fee today and the monthly price after
// the trial. Everyone else pays the monthly price today: the cheap week is
// once per customer.
import { FIRST_TIME_PRICE_LINE, RETURNING_PRICE_LINE, TRIAL_DAYS } from "./pricing.js";

function withParam(path, name, value) {
  return `${path}${path.includes("?") ? "&" : "?"}${name}=${value}`;
}

export function checkoutParams({ customerId, userId, priceId, trialFeePriceId, trial, base, returnTo }) {
  const metadata = { user_id: userId, plan: "brand_monthly" };
  return {
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId,
    line_items: [
      { price: priceId, quantity: 1 },
      // A one-time price goes on the first invoice only.
      ...(trial ? [{ price: trialFeePriceId, quantity: 1 }] : []),
    ],
    subscription_data: { metadata, ...(trial && { trial_period_days: TRIAL_DAYS }) },
    // Stripe's own page says "7 days free" beside a trial; say what is
    // actually due next to its pay button.
    custom_text: { submit: { message: trial ? FIRST_TIME_PRICE_LINE : RETURNING_PRICE_LINE } },
    allow_promotion_codes: true,
    metadata,
    success_url: `${base}${withParam(returnTo, "checkout", "success")}`,
    cancel_url: `${base}${returnTo}`,
  };
}
