-- =====================================================================
-- Brand-side Stripe Connect accounts.
--
-- Brands now hold deposited gig funds in their own Express Connect account
-- (instead of the platform Stripe balance). When the brand approves a
-- video, we transfer the per-video share from the brand's connected
-- balance directly to the creator's connected account. The platform's
-- 15% fee is collected as an `application_fee_amount` on the original
-- checkout charge.
--
-- This solves two problems with the legacy single-account flow:
--   1. Funds no longer pile up in the platform's Stripe balance (which
--      caused "insufficient funds" on transfer while balances were
--      pending / swept to bank).
--   2. Each brand's escrow is logically isolated to its own account.
--
-- The legacy flow still works for any conversations that were funded
-- before a brand connected — the release endpoint falls back to the old
-- platform-transfer behaviour when `payments.brand_stripe_account_id`
-- is null.
-- =====================================================================

alter table public.brand_profiles
  add column if not exists stripe_account_id text,
  add column if not exists stripe_payouts_enabled boolean not null default false,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_details_submitted boolean not null default false;

create index if not exists brand_profiles_stripe_account_idx
  on public.brand_profiles (stripe_account_id);

-- Snapshot of the brand's Connect account on each payment row. We snapshot
-- it at deposit time so a later disconnection / re-onboarding can't
-- redirect an already-funded escrow somewhere else.
alter table public.payments
  add column if not exists brand_stripe_account_id text;

create index if not exists payments_brand_stripe_account_idx
  on public.payments (brand_stripe_account_id);

notify pgrst, 'reload schema';
