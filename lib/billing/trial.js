// Whether a Stripe customer already subscribes, and whether they can still
// have the $1 trial. Stripe is asked directly: our copy of the status lags
// behind checkout and forgets the subscription id once it is cancelled.

const LIVE = new Set(["active", "trialing", "past_due", "unpaid"]);
// A checkout whose first payment never went through doesn't use up the trial.
const NEVER_STARTED = new Set(["incomplete", "incomplete_expired"]);

export function trialState(subscriptions) {
  return {
    live: subscriptions.some((s) => LIVE.has(s.status)),
    trialEligible: !subscriptions.some((s) => !NEVER_STARTED.has(s.status)),
  };
}

export async function customerTrialState(stripe, customerId) {
  if (!customerId) return { live: false, trialEligible: true };
  const page = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  return trialState(page.data);
}
