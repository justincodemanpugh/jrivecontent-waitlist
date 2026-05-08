-- =====================================================================
-- Creator profile assets: avatars + portfolio videos.
--
-- Adds:
--   * `creator_portfolio_videos` table (max 3 enforced via trigger)
--   * Public storage bucket `avatars`
--   * Public storage bucket `creator-portfolio`
--   * Policies so creators can manage their own files; anyone authed can
--     read them (so brands can preview a creator's reel before hiring).
-- =====================================================================

create table if not exists public.creator_portfolio_videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists creator_portfolio_videos_creator_idx
  on public.creator_portfolio_videos(creator_id, position);

-- Enforce hard max of 3 videos per creator.
create or replace function public.enforce_portfolio_video_limit()
returns trigger
language plpgsql
as $$
declare
  current_count integer;
begin
  select count(*) into current_count
    from public.creator_portfolio_videos
    where creator_id = new.creator_id;
  if current_count >= 3 then
    raise exception 'A creator can have at most 3 portfolio videos.';
  end if;
  return new;
end;
$$;

drop trigger if exists portfolio_videos_limit on public.creator_portfolio_videos;
create trigger portfolio_videos_limit
before insert on public.creator_portfolio_videos
for each row execute function public.enforce_portfolio_video_limit();

alter table public.creator_portfolio_videos enable row level security;

drop policy if exists "Portfolio videos: creator manage own" on public.creator_portfolio_videos;
create policy "Portfolio videos: creator manage own"
  on public.creator_portfolio_videos for all
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

-- Brands (and any authed user) can read portfolio rows for onboarded creators.
drop policy if exists "Portfolio videos: directory read" on public.creator_portfolio_videos;
create policy "Portfolio videos: directory read"
  on public.creator_portfolio_videos for select
  to authenticated
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.user_id = creator_portfolio_videos.creator_id
        and cp.onboarded_at is not null
    )
  );


-- =====================================================================
-- Storage buckets.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('creator-portfolio', 'creator-portfolio', true)
on conflict (id) do nothing;

-- Avatars: each user uploads under {user_id}/...
drop policy if exists "Avatars: public read" on storage.objects;
create policy "Avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Avatars: owner upload" on storage.objects;
create policy "Avatars: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatars: owner update" on storage.objects;
create policy "Avatars: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Avatars: owner delete" on storage.objects;
create policy "Avatars: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Portfolio videos: same pattern.
drop policy if exists "Creator portfolio: public read" on storage.objects;
create policy "Creator portfolio: public read"
  on storage.objects for select
  using (bucket_id = 'creator-portfolio');

drop policy if exists "Creator portfolio: owner upload" on storage.objects;
create policy "Creator portfolio: owner upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'creator-portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Creator portfolio: owner delete" on storage.objects;
create policy "Creator portfolio: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'creator-portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';
