-- Brand onboarding profile.
-- Run this in the Supabase SQL editor (or `supabase db push`) before testing.

create table if not exists public.brand_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  brand_name text,
  website text,
  industry text,
  brand_stage text,
  monthly_budget text,
  content_needs text[] not null default '{}',
  referral_source text,
  terms_accepted_at timestamptz,
  onboarded_at timestamptz,
  -- Stripe platform-subscription state (kept in sync by /api/stripe/webhook).
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'free',
  subscription_price_id text,
  subscription_current_period_end timestamptz,
  subscription_cancel_at_period_end boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_profiles_stripe_customer_idx
  on public.brand_profiles (stripe_customer_id);
create index if not exists brand_profiles_stripe_subscription_idx
  on public.brand_profiles (stripe_subscription_id);

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists brand_profiles_set_updated_at on public.brand_profiles;
create trigger brand_profiles_set_updated_at
before update on public.brand_profiles
for each row execute function public.set_updated_at();

-- RLS: each user can only see/edit their own brand profile.
alter table public.brand_profiles enable row level security;

drop policy if exists "Brand profiles: select own" on public.brand_profiles;
create policy "Brand profiles: select own"
  on public.brand_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Brand profiles: insert own" on public.brand_profiles;
create policy "Brand profiles: insert own"
  on public.brand_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Brand profiles: update own" on public.brand_profiles;
create policy "Brand profiles: update own"
  on public.brand_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- =====================================================================
-- Creator onboarding profile.
-- =====================================================================

create table if not exists public.creator_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  handle text unique,
  bio text,
  avatar_url text,
  niches text[] not null default '{}',
  content_types text[] not null default '{}',
  rate_min integer,
  rate_max integer,
  portfolio_url text,
  instagram_handle text,
  tiktok_handle text,
  youtube_handle text,
  location text,
  terms_accepted_at timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists creator_profiles_set_updated_at on public.creator_profiles;
create trigger creator_profiles_set_updated_at
before update on public.creator_profiles
for each row execute function public.set_updated_at();

-- RLS: creators can only see/edit their own row. Brands can read public-ish
-- fields of any onboarded creator (handled via a view or relaxed policy as
-- the marketplace grows; for now, lock down to self).
alter table public.creator_profiles enable row level security;

drop policy if exists "Creator profiles: select own" on public.creator_profiles;
create policy "Creator profiles: select own"
  on public.creator_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Creator profiles: insert own" on public.creator_profiles;
create policy "Creator profiles: insert own"
  on public.creator_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Creator profiles: update own" on public.creator_profiles;
create policy "Creator profiles: update own"
  on public.creator_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Marketplace browsing: any authenticated user can read public profile fields
-- of an *onboarded* counterpart. RLS still blocks writes/owner-only fields
-- because update/insert policies above require auth.uid() = user_id.
drop policy if exists "Creator profiles: directory read" on public.creator_profiles;
create policy "Creator profiles: directory read"
  on public.creator_profiles for select
  to authenticated
  using (onboarded_at is not null);

drop policy if exists "Brand profiles: directory read" on public.brand_profiles;
create policy "Brand profiles: directory read"
  on public.brand_profiles for select
  to authenticated
  using (onboarded_at is not null);


-- =====================================================================
-- Gigs (brand-posted jobs).
-- Brands fully manage their own rows. Authenticated creators can read
-- only active, non-deleted, open gigs for the marketplace.
-- =====================================================================

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  brand_name text,
  brand_industry text,
  title text not null,
  description text not null default '',
  pay_per_video numeric not null default 0,
  examples jsonb not null default '[]'::jsonb,
  status text not null default 'open', -- open | in_production | completed
  is_active boolean not null default true,
  applicants_count integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gigs_brand_id_idx on public.gigs(brand_id);
create index if not exists gigs_marketplace_idx
  on public.gigs(created_at desc)
  where deleted_at is null and is_active = true and status = 'open';

drop trigger if exists gigs_set_updated_at on public.gigs;
create trigger gigs_set_updated_at
before update on public.gigs
for each row execute function public.set_updated_at();

alter table public.gigs enable row level security;

drop policy if exists "Gigs: brand manage own" on public.gigs;
create policy "Gigs: brand manage own"
  on public.gigs for all
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);

drop policy if exists "Gigs: creators read marketplace" on public.gigs;
create policy "Gigs: creators read marketplace"
  on public.gigs for select
  to authenticated
  using (
    deleted_at is null
    and is_active = true
    and status in ('open', 'in_production')
  );


-- =====================================================================
-- Gig applications.
-- Creator applies to a gig (one row per creator/gig). Brand reviews and
-- accepts/declines. Accepting creates a conversation row downstream.
-- =====================================================================

create table if not exists public.gig_applications (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references auth.users(id) on delete cascade,
  pitch text not null default '',
  status text not null default 'pending', -- pending | accepted | declined | withdrawn
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gig_id, creator_id)
);

create index if not exists applications_gig_id_idx on public.gig_applications(gig_id);
create index if not exists applications_creator_id_idx on public.gig_applications(creator_id);

drop trigger if exists applications_set_updated_at on public.gig_applications;
create trigger applications_set_updated_at
before update on public.gig_applications
for each row execute function public.set_updated_at();

-- Maintain `gigs.applicants_count` automatically.
-- SECURITY DEFINER so the bump UPDATE bypasses the "Gigs: brand manage own"
-- RLS policy. Without it, the creator inserting the application can't update
-- the gigs row and `applicants_count` would stay stuck at 0.
create or replace function public.bump_gig_applicants_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.gigs
      set applicants_count = applicants_count + 1
      where id = new.gig_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.gigs
      set applicants_count = greatest(applicants_count - 1, 0)
      where id = old.gig_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists applications_bump_count on public.gig_applications;
create trigger applications_bump_count
after insert or delete on public.gig_applications
for each row execute function public.bump_gig_applicants_count();

alter table public.gig_applications enable row level security;

drop policy if exists "Applications: creator manage own" on public.gig_applications;
create policy "Applications: creator manage own"
  on public.gig_applications for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

drop policy if exists "Applications: brand read own gigs" on public.gig_applications;
create policy "Applications: brand read own gigs"
  on public.gig_applications for select
  using (auth.uid() = brand_id);

drop policy if exists "Applications: brand update status" on public.gig_applications;
create policy "Applications: brand update status"
  on public.gig_applications for update
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);


-- =====================================================================
-- Conversations (created when brand accepts an applicant) + messages.
-- =====================================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  application_id uuid references public.gig_applications(id) on delete set null,
  brand_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (gig_id, creator_id)
);

create index if not exists conversations_brand_idx on public.conversations(brand_id, last_message_at desc);
create index if not exists conversations_creator_idx on public.conversations(creator_id, last_message_at desc);

alter table public.conversations enable row level security;

drop policy if exists "Conversations: members read" on public.conversations;
create policy "Conversations: members read"
  on public.conversations for select
  using (auth.uid() = brand_id or auth.uid() = creator_id);

-- Inserts go through a server-side action that flips the application to
-- 'accepted' first, but allow the brand to insert directly here too.
drop policy if exists "Conversations: brand insert" on public.conversations;
create policy "Conversations: brand insert"
  on public.conversations for insert
  with check (auth.uid() = brand_id);


create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  kind text not null default 'text', -- text | system | deliverable
  deliverable_id uuid, -- populated when kind = 'deliverable'
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "Messages: members read" on public.messages;
create policy "Messages: members read"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.brand_id = auth.uid() or c.creator_id = auth.uid())
    )
  );

drop policy if exists "Messages: members insert" on public.messages;
create policy "Messages: members insert"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.brand_id = auth.uid() or c.creator_id = auth.uid())
    )
  );

-- Bump conversations.last_message_at on every new message.
create or replace function public.bump_conversation_last_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation on public.messages;
create trigger messages_bump_conversation
after insert on public.messages
for each row execute function public.bump_conversation_last_message();


-- =====================================================================
-- Deliverables: a "submission" of up to 3 videos within a conversation.
-- Brand approves or requests revision per submission. Multiple submissions
-- can exist per conversation over the gig's lifetime.
-- =====================================================================

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'submitted', -- submitted | approved | revision_requested
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deliverables_conversation_idx on public.deliverables(conversation_id, created_at desc);

drop trigger if exists deliverables_set_updated_at on public.deliverables;
create trigger deliverables_set_updated_at
before update on public.deliverables
for each row execute function public.set_updated_at();

alter table public.deliverables enable row level security;

drop policy if exists "Deliverables: members read" on public.deliverables;
create policy "Deliverables: members read"
  on public.deliverables for select
  using (auth.uid() = creator_id or auth.uid() = brand_id);

drop policy if exists "Deliverables: creator insert" on public.deliverables;
create policy "Deliverables: creator insert"
  on public.deliverables for insert
  with check (auth.uid() = creator_id);

drop policy if exists "Deliverables: brand update status" on public.deliverables;
create policy "Deliverables: brand update status"
  on public.deliverables for update
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);


create table if not exists public.deliverable_videos (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables(id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists deliverable_videos_parent_idx on public.deliverable_videos(deliverable_id, position);

alter table public.deliverable_videos enable row level security;

drop policy if exists "Deliverable videos: members read" on public.deliverable_videos;
create policy "Deliverable videos: members read"
  on public.deliverable_videos for select
  using (
    exists (
      select 1 from public.deliverables d
      where d.id = deliverable_videos.deliverable_id
        and (d.creator_id = auth.uid() or d.brand_id = auth.uid())
    )
  );

drop policy if exists "Deliverable videos: creator insert" on public.deliverable_videos;
create policy "Deliverable videos: creator insert"
  on public.deliverable_videos for insert
  with check (
    exists (
      select 1 from public.deliverables d
      where d.id = deliverable_videos.deliverable_id
        and d.creator_id = auth.uid()
    )
  );


-- =====================================================================
-- Storage: private `deliverables` bucket. Path convention:
--   {conversation_id}/{uuid}.{ext}
-- Policies below allow conversation members to read and only the creator
-- (member of conversation) to upload.
-- Run this section once. Bucket creation requires service_role; if the
-- SQL editor errors on the insert, create the bucket via the Storage UI
-- instead and keep the policies below.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;

drop policy if exists "Deliverables storage: members read" on storage.objects;
create policy "Deliverables storage: members read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and (c.brand_id = auth.uid() or c.creator_id = auth.uid())
    )
  );

drop policy if exists "Deliverables storage: creator upload" on storage.objects;
create policy "Deliverables storage: creator upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'deliverables'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and c.creator_id = auth.uid()
    )
  );

drop policy if exists "Deliverables storage: creator delete own" on storage.objects;
create policy "Deliverables storage: creator delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from public.conversations c
      where c.id::text = (storage.foldername(name))[1]
        and c.creator_id = auth.uid()
    )
  );
