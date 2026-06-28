-- =====================================================================
-- Brief Escrow + Direct Video Submissions
--
-- New assignment flow:
--   1. Brand creates a brief and sends it to creators (no payment yet).
--   2. Brand funds escrow PER creator (per brief_recipient) via Stripe
--      Checkout. Funds land in the brand's Connect balance; the platform
--      collects its 15% as an application fee. Mirrors the gig escrow.
--   3. Creator sees a "Payment Secured" badge once escrow_status='escrowed'
--      and uploads a video directly on the assignment page (not chat).
--   4. Brand reviews the uploaded video and clicks Approve, which transfers
--      the creator's share from the brand's Connect balance to the creator.
--
-- Adds:
--   * Escrow / submission / review columns on `brief_recipients`.
--   * `brief_payments` — one escrow row per brief_recipient.
--   * Storage bucket `brief-submissions` for creator video uploads.
-- =====================================================================


-- ---------------------------------------------------------------------
-- brief_recipients: escrow status, submission video, brand review.
-- ---------------------------------------------------------------------

alter table public.brief_recipients
  add column if not exists escrow_status text not null default 'none',
    -- none | pending | escrowed | released
  add column if not exists submission_storage_path text,
  add column if not exists submission_size_bytes bigint,
  add column if not exists submission_mime_type text,
  add column if not exists submission_uploaded_at timestamptz,
  add column if not exists review_status text not null default 'pending',
    -- pending | approved | changes_requested
  add column if not exists review_feedback text,
  add column if not exists reviewed_at timestamptz;

create index if not exists brief_recipients_escrow_idx
  on public.brief_recipients(escrow_status);


-- ---------------------------------------------------------------------
-- brief_payments: one escrow row per brief_recipient.
-- Inserts/updates happen via the service role from API routes.
-- ---------------------------------------------------------------------

create table if not exists public.brief_payments (
  id uuid primary key default gen_random_uuid(),
  brief_recipient_id uuid not null references public.brief_recipients(id) on delete cascade,
  brief_id uuid not null references public.briefs(id) on delete cascade,
  brand_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,

  amount_cents integer not null,           -- what the brand pays (gig subtotal)
  platform_fee_cents integer not null,     -- our cut (15% by default)
  creator_payout_cents integer not null,   -- what the creator receives

  brand_stripe_account_id text,            -- snapshot of brand Connect acct

  status text not null default 'pending',
    -- pending          : checkout session created, not paid yet
    -- escrowed         : brand paid; funds in brand's Connect balance
    -- released         : transferred to creator
    -- released_pending : approved but creator hasn't onboarded Stripe yet
    -- refunded         : refunded back to brand
    -- failed           : checkout failed/expired

  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_transfer_id text,

  deposited_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (brief_recipient_id)
);

create index if not exists brief_payments_brand_idx   on public.brief_payments(brand_id);
create index if not exists brief_payments_creator_idx on public.brief_payments(creator_id);
create index if not exists brief_payments_brief_idx   on public.brief_payments(brief_id);

drop trigger if exists brief_payments_set_updated_at on public.brief_payments;
create trigger brief_payments_set_updated_at
before update on public.brief_payments
for each row execute function public.set_updated_at();

alter table public.brief_payments enable row level security;

-- Both parties can read the escrow row (for badges / status).
drop policy if exists "Brief payments: members read" on public.brief_payments;
create policy "Brief payments: members read"
  on public.brief_payments for select
  using (auth.uid() = brand_id or auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- Storage: brief-submissions bucket for creator video uploads.
-- Path convention: {creator_id}/{brief_recipient_id}/{uuid}.{ext}
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('brief-submissions', 'brief-submissions', false)
on conflict (id) do nothing;

-- Creator can upload to their own folder.
drop policy if exists "Brief submissions: creator upload" on storage.objects;
create policy "Brief submissions: creator upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Creator can read their own uploads.
drop policy if exists "Brief submissions: creator read own" on storage.objects;
create policy "Brief submissions: creator read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Creator can delete/replace their own uploads.
drop policy if exists "Brief submissions: creator delete own" on storage.objects;
create policy "Brief submissions: creator delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Brand can read submissions for their own briefs.
drop policy if exists "Brief submissions: brand read own" on storage.objects;
create policy "Brief submissions: brand read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-submissions'
    and exists (
      select 1 from public.brief_recipients br
      join public.briefs b on b.id = br.brief_id
      where br.submission_storage_path = name
        and b.brand_id = auth.uid()
    )
  );


notify pgrst, 'reload schema';
