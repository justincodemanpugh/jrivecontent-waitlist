-- =====================================================================
-- Briefs System: Private brand→creator content distribution.
--
-- Adds:
--   * `brand_creators` — Brand's roster of connected creators.
--   * `briefs` — Private briefs sent by brands.
--   * `brief_recipients` — Which creators received a brief.
--   * `brief_example_videos` — Example videos attached to briefs.
--   * `brief_submissions` — Creator proof links (posted content URLs).
--   * Storage bucket `brief-videos` for example video uploads.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Brand Creators: The brand's roster of connected creators.
-- ---------------------------------------------------------------------

create table if not exists public.brand_creators (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending', -- pending | active | declined | removed
  notes text, -- brand's private notes about this creator
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, creator_id)
);

create index if not exists brand_creators_brand_idx
  on public.brand_creators(brand_id, status, added_at desc);
create index if not exists brand_creators_creator_idx
  on public.brand_creators(creator_id, status);

drop trigger if exists brand_creators_set_updated_at on public.brand_creators;
create trigger brand_creators_set_updated_at
before update on public.brand_creators
for each row execute function public.set_updated_at();

alter table public.brand_creators enable row level security;

-- Brand can manage their own creator connections.
drop policy if exists "Brand creators: brand manage own" on public.brand_creators;
create policy "Brand creators: brand manage own"
  on public.brand_creators for all
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);

-- Creator can see connection requests sent to them.
drop policy if exists "Brand creators: creator read own" on public.brand_creators;
create policy "Brand creators: creator read own"
  on public.brand_creators for select
  using (auth.uid() = creator_id);

-- Creator can update status (accept/decline) on their connections.
drop policy if exists "Brand creators: creator update status" on public.brand_creators;
create policy "Brand creators: creator update status"
  on public.brand_creators for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);


-- ---------------------------------------------------------------------
-- Briefs: Private content briefs sent by brands.
-- ---------------------------------------------------------------------

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  instructions text not null default '',
  pay_per_creator numeric, -- optional payment amount per creator
  deadline timestamptz, -- optional deadline for submissions
  status text not null default 'active', -- active | archived
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists briefs_brand_idx
  on public.briefs(brand_id, created_at desc);

drop trigger if exists briefs_set_updated_at on public.briefs;
create trigger briefs_set_updated_at
before update on public.briefs
for each row execute function public.set_updated_at();

alter table public.briefs enable row level security;

-- Brand can manage their own briefs.
drop policy if exists "Briefs: brand manage own" on public.briefs;
create policy "Briefs: brand manage own"
  on public.briefs for all
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);

-- Note: Creator read policy will be added after brief_recipients table is created


-- ---------------------------------------------------------------------
-- Brief Recipients: Which creators received a brief.
-- ---------------------------------------------------------------------

create table if not exists public.brief_recipients (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.briefs(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending', -- pending | viewed | completed | declined
  sent_at timestamptz not null default now(),
  viewed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (brief_id, creator_id)
);

create index if not exists brief_recipients_brief_idx
  on public.brief_recipients(brief_id);
create index if not exists brief_recipients_creator_idx
  on public.brief_recipients(creator_id, status, sent_at desc);

drop trigger if exists brief_recipients_set_updated_at on public.brief_recipients;
create trigger brief_recipients_set_updated_at
before update on public.brief_recipients
for each row execute function public.set_updated_at();

alter table public.brief_recipients enable row level security;

-- Brand can manage recipients for their briefs.
drop policy if exists "Brief recipients: brand manage own" on public.brief_recipients;
create policy "Brief recipients: brand manage own"
  on public.brief_recipients for all
  using (
    exists (
      select 1 from public.briefs b
      where b.id = brief_recipients.brief_id
        and b.brand_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.briefs b
      where b.id = brief_recipients.brief_id
        and b.brand_id = auth.uid()
    )
  );

-- Creator can read and update their own recipient rows.
drop policy if exists "Brief recipients: creator read own" on public.brief_recipients;
create policy "Brief recipients: creator read own"
  on public.brief_recipients for select
  using (auth.uid() = creator_id);

drop policy if exists "Brief recipients: creator update own" on public.brief_recipients;
create policy "Brief recipients: creator update own"
  on public.brief_recipients for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);


-- Now add the creator read policy for briefs (after brief_recipients exists)
-- Creators can read briefs they were sent (via brief_recipients).
drop policy if exists "Briefs: creator read received" on public.briefs;
create policy "Briefs: creator read received"
  on public.briefs for select
  using (
    exists (
      select 1 from public.brief_recipients br
      where br.brief_id = briefs.id
        and br.creator_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- Brief Example Videos: Example videos attached to briefs.
-- ---------------------------------------------------------------------

create table if not exists public.brief_example_videos (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.briefs(id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  size_bytes bigint,
  mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists brief_example_videos_brief_idx
  on public.brief_example_videos(brief_id, position);

alter table public.brief_example_videos enable row level security;

-- Brand can manage example videos for their briefs.
drop policy if exists "Brief example videos: brand manage own" on public.brief_example_videos;
create policy "Brief example videos: brand manage own"
  on public.brief_example_videos for all
  using (
    exists (
      select 1 from public.briefs b
      where b.id = brief_example_videos.brief_id
        and b.brand_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.briefs b
      where b.id = brief_example_videos.brief_id
        and b.brand_id = auth.uid()
    )
  );

-- Creator can read example videos for briefs they received.
drop policy if exists "Brief example videos: creator read received" on public.brief_example_videos;
create policy "Brief example videos: creator read received"
  on public.brief_example_videos for select
  using (
    exists (
      select 1 from public.brief_recipients br
      where br.brief_id = brief_example_videos.brief_id
        and br.creator_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- Brief Submissions: Creator proof links (posted content URLs).
-- ---------------------------------------------------------------------

create table if not exists public.brief_submissions (
  id uuid primary key default gen_random_uuid(),
  brief_recipient_id uuid not null references public.brief_recipients(id) on delete cascade,
  link_url text not null,
  platform text, -- tiktok | instagram | youtube | other
  notes text, -- creator's notes about the submission
  created_at timestamptz not null default now()
);

create index if not exists brief_submissions_recipient_idx
  on public.brief_submissions(brief_recipient_id, created_at desc);

alter table public.brief_submissions enable row level security;

-- Creator can manage their own submissions.
drop policy if exists "Brief submissions: creator manage own" on public.brief_submissions;
create policy "Brief submissions: creator manage own"
  on public.brief_submissions for all
  using (
    exists (
      select 1 from public.brief_recipients br
      where br.id = brief_submissions.brief_recipient_id
        and br.creator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.brief_recipients br
      where br.id = brief_submissions.brief_recipient_id
        and br.creator_id = auth.uid()
    )
  );

-- Brand can read submissions for their briefs.
drop policy if exists "Brief submissions: brand read own" on public.brief_submissions;
create policy "Brief submissions: brand read own"
  on public.brief_submissions for select
  using (
    exists (
      select 1 from public.brief_recipients br
      join public.briefs b on b.id = br.brief_id
      where br.id = brief_submissions.brief_recipient_id
        and b.brand_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- Storage: brief-videos bucket for example video uploads.
-- Path convention: {brand_id}/{brief_id}/{uuid}.{ext}
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('brief-videos', 'brief-videos', false)
on conflict (id) do nothing;

-- Brand can upload to their own folder.
drop policy if exists "Brief videos: brand upload" on storage.objects;
create policy "Brief videos: brand upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Brand can read their own uploads.
drop policy if exists "Brief videos: brand read own" on storage.objects;
create policy "Brief videos: brand read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Brand can delete their own uploads.
drop policy if exists "Brief videos: brand delete own" on storage.objects;
create policy "Brief videos: brand delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Creators can read videos for briefs they received.
drop policy if exists "Brief videos: creator read received" on storage.objects;
create policy "Brief videos: creator read received"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'brief-videos'
    and exists (
      select 1 from public.brief_example_videos bev
      join public.brief_recipients br on br.brief_id = bev.brief_id
      where bev.storage_path = name
        and br.creator_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- Foreign keys for PostgREST embedding.
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'brand_creators_brand_id_fkey_profile'
       and conrelid = 'public.brand_creators'::regclass
  ) then
    alter table public.brand_creators
      add constraint brand_creators_brand_id_fkey_profile
      foreign key (brand_id)
      references public.brand_profiles(user_id)
      on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'brand_creators_creator_id_fkey_profile'
       and conrelid = 'public.brand_creators'::regclass
  ) then
    alter table public.brand_creators
      add constraint brand_creators_creator_id_fkey_profile
      foreign key (creator_id)
      references public.creator_profiles(user_id)
      on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'briefs_brand_id_fkey_profile'
       and conrelid = 'public.briefs'::regclass
  ) then
    alter table public.briefs
      add constraint briefs_brand_id_fkey_profile
      foreign key (brand_id)
      references public.brand_profiles(user_id)
      on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'brief_recipients_creator_id_fkey_profile'
       and conrelid = 'public.brief_recipients'::regclass
  ) then
    alter table public.brief_recipients
      add constraint brief_recipients_creator_id_fkey_profile
      foreign key (creator_id)
      references public.creator_profiles(user_id)
      on delete cascade;
  end if;
end$$;


notify pgrst, 'reload schema';
