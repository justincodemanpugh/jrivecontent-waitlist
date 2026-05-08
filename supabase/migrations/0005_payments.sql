-- =====================================================================
-- Payments / escrow system for the gig marketplace.
--
-- Flow:
--   1. Brand accepts an application -> conversation is created
--   2. Brand deposits gig price via Stripe Checkout
--      -> webhook flips payments.status = 'escrowed' and
--         conversations.payment_deposited = true
--   3. Creator can submit deliverables (videos)
--   4. Brand approves a deliverable -> backend transfers
--      (amount * (1 - platform fee)) to creator's Stripe Connect account,
--      payments.status = 'released'. Platform keeps the fee in its balance.
-- =====================================================================

-- Creator Stripe Connect account id (Express). Brands don't need one.
alter table public.creator_profiles
  add column if not exists stripe_account_id text,
  add column if not exists stripe_payouts_enabled boolean not null default false;

-- Has the brand funded the escrow for this conversation?
alter table public.conversations
  add column if not exists payment_deposited boolean not null default false;

-- One payment row per conversation (you can only fund a gig once).
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  brand_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,

  amount_cents integer not null,           -- what the brand pays
  platform_fee_cents integer not null,     -- our cut (15% by default)
  creator_payout_cents integer not null,   -- what the creator receives

  status text not null default 'pending',
    -- pending     : checkout session created, not paid yet
    -- escrowed    : brand paid; funds in platform balance
    -- released    : transferred to creator
    -- refunded    : refunded back to brand
    -- failed      : checkout failed/expired

  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,

  deposited_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (conversation_id)
);

create index if not exists payments_brand_idx   on public.payments(brand_id);
create index if not exists payments_creator_idx on public.payments(creator_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists "Payments: members read" on public.payments;
create policy "Payments: members read"
  on public.payments for select
  using (auth.uid() = brand_id or auth.uid() = creator_id);

-- Inserts/updates only happen via the service role from API routes,
-- so we don't add insert/update policies for normal users.

notify pgrst, 'reload schema';
