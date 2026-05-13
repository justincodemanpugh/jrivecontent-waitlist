-- =====================================================================
-- Brand platform subscription tracking.
--
-- Tracks the $25/mo brand subscription state on the brand_profiles row so
-- the Settings → Billing tab can render the current plan, and so server
-- code (e.g. gig posting gates) can quickly check whether a brand is on
-- the Pro plan without round-tripping to Stripe.
--
-- Source of truth is still Stripe; these columns are kept in sync by the
-- /api/stripe/webhook handler (customer.subscription.* events).
-- =====================================================================

alter table public.brand_profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  -- One of: free | active | trialing | past_due | canceled | incomplete
  add column if not exists subscription_status text not null default 'free',
  add column if not exists subscription_price_id text,
  add column if not exists subscription_current_period_end timestamptz,
  add column if not exists subscription_cancel_at_period_end boolean not null default false,
  -- Brand logo / profile picture (stored in the existing `avatars` bucket).
  add column if not exists avatar_url text;

create index if not exists brand_profiles_stripe_customer_idx
  on public.brand_profiles (stripe_customer_id);

create index if not exists brand_profiles_stripe_subscription_idx
  on public.brand_profiles (stripe_subscription_id);

notify pgrst, 'reload schema';
