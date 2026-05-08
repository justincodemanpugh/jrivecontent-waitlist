-- =====================================================================
-- Creator cover photos + brand→creator invitations.
--
-- Adds:
--   * `creator_profiles.cover_photo_url` so creators can show a hero
--     image on their browse card / profile (like Twitter/IG cover).
--   * Public storage bucket `creator-covers` mirrored on the same
--     `{user_id}/...` path convention as avatars.
--   * `gig_invitations` table — brand invites a specific creator to a
--     specific gig. Creator can accept (which opens a conversation) or
--     decline.
-- =====================================================================

alter table public.creator_profiles
  add column if not exists cover_photo_url text;


-- ---------------------------------------------------------------------
-- Storage: creator-covers (public bucket, owner-managed writes)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('creator-covers', 'creator-covers', true)
on conflict (id) do nothing;

drop policy if exists "Creator covers: public read" on storage.objects;
create policy "Creator covers: public read"
  on storage.objects for select
  using (bucket_id = 'creator-covers');

drop policy if exists "Creator covers: owner upload" on storage.objects;
create policy "Creator covers: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'creator-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Creator covers: owner update" on storage.objects;
create policy "Creator covers: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'creator-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Creator covers: owner delete" on storage.objects;
create policy "Creator covers: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'creator-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------------
-- Gig invitations: brand-initiated outreach to a specific creator.
-- ---------------------------------------------------------------------

create table if not exists public.gig_invitations (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  brand_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending', -- pending | accepted | declined | cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gig_id, creator_id)
);

create index if not exists invitations_creator_idx
  on public.gig_invitations(creator_id, created_at desc);
create index if not exists invitations_brand_idx
  on public.gig_invitations(brand_id, created_at desc);

drop trigger if exists invitations_set_updated_at on public.gig_invitations;
create trigger invitations_set_updated_at
before update on public.gig_invitations
for each row execute function public.set_updated_at();

alter table public.gig_invitations enable row level security;

-- Brand can fully manage invitations they sent.
drop policy if exists "Invitations: brand manage own" on public.gig_invitations;
create policy "Invitations: brand manage own"
  on public.gig_invitations for all
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);

-- Creator can read invitations sent to them.
drop policy if exists "Invitations: creator read own" on public.gig_invitations;
create policy "Invitations: creator read own"
  on public.gig_invitations for select
  using (auth.uid() = creator_id);

-- Creator can update status (accept / decline) on their invitations.
drop policy if exists "Invitations: creator update status" on public.gig_invitations;
create policy "Invitations: creator update status"
  on public.gig_invitations for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- Profile-table foreign keys so PostgREST can embed brand/creator
-- profiles when listing invitations (mirrors migration 0003).
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'gig_invitations_brand_id_fkey'
       and conrelid = 'public.gig_invitations'::regclass
  ) then
    alter table public.gig_invitations
      add constraint gig_invitations_brand_id_fkey
      foreign key (brand_id)
      references public.brand_profiles(user_id)
      on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'gig_invitations_creator_id_fkey'
       and conrelid = 'public.gig_invitations'::regclass
  ) then
    alter table public.gig_invitations
      add constraint gig_invitations_creator_id_fkey
      foreign key (creator_id)
      references public.creator_profiles(user_id)
      on delete cascade;
  end if;
end$$;


-- ---------------------------------------------------------------------
-- Allow the creator to open the conversation when accepting an invitation.
-- Without this the existing "brand insert" policy blocks them.
-- ---------------------------------------------------------------------

drop policy if exists "Conversations: creator insert from invitation"
  on public.conversations;
create policy "Conversations: creator insert from invitation"
  on public.conversations for insert
  with check (
    auth.uid() = creator_id
    and exists (
      select 1 from public.gig_invitations gi
      where gi.gig_id = conversations.gig_id
        and gi.creator_id = auth.uid()
        and gi.brand_id = conversations.brand_id
    )
  );

notify pgrst, 'reload schema';
