// Single source of truth for "is this brand paying?".
//
// Deliberately client-agnostic: it takes a Supabase client rather than
// creating one, so the same function works with the browser client
// (lib/supabase/client) and the server client (lib/supabase/server).
//
// Keep the status list in sync with public.brand_has_active_subscription in
// supabase/migrations/0041_require_subscription_to_create_program.sql — that
// SQL function is the real enforcement, this is for UX and server routes.

// 'past_due' counts as paid so a single failed renewal doesn't lock a brand
// out mid-cycle. Stripe moves the subscription to 'canceled' once dunning is
// exhausted, and that does revoke access.
export const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function brandHasActiveSubscription(supabase, userId) {
  if (!userId) return false;
  const { data } = await supabase
    .from("brand_profiles")
    .select("subscription_status")
    .eq("user_id", userId)
    .maybeSingle();
  return PAID_STATUSES.has(data?.subscription_status || "free");
}

// Shown when a gated action is blocked. Kept here so the wording is
// identical everywhere it surfaces.
export const TRIAL_REQUIRED_MESSAGE =
  "Start your free 3-day trial to create campaigns and track accounts.";
