// The price, in words. Safe to import anywhere. The amounts actually charged
// live in Stripe (STRIPE_BRAND_SUBSCRIPTION_PRICE_ID and
// STRIPE_BRAND_TRIAL_FEE_PRICE_ID); change both together.

export const TRIAL_DAYS = 7;

// Shown beside a button when we know the person has never subscribed.
export const FIRST_TIME_PRICE_LINE = "$1 today, then $25/month after 7 days. Cancel anytime.";
// Shown when they have subscribed before: there is no second $1 trial.
export const RETURNING_PRICE_LINE = "$25/month. Cancel anytime.";
// Shown where we don't know which of the two applies.
export const NEW_SUBSCRIBER_LINE = "New subscribers: $1 for 7 days, then $25/month.";
