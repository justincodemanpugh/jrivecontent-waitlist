-- =====================================================================
-- Idempotent column-level migration for the marketplace tables.
-- Run this AFTER schema.sql in case any of those tables already existed
-- with an older shape. Safe to re-run.
-- =====================================================================

-- ---------- gigs ----------
alter table public.gigs add column if not exists brand_name text;
alter table public.gigs add column if not exists brand_industry text;
alter table public.gigs add column if not exists description text not null default '';
alter table public.gigs add column if not exists pay_per_video numeric not null default 0;
alter table public.gigs add column if not exists examples jsonb not null default '[]'::jsonb;
alter table public.gigs add column if not exists status text not null default 'open';
alter table public.gigs add column if not exists is_active boolean not null default true;
alter table public.gigs add column if not exists applicants_count integer not null default 0;
alter table public.gigs add column if not exists deleted_at timestamptz;
alter table public.gigs add column if not exists created_at timestamptz not null default now();
alter table public.gigs add column if not exists updated_at timestamptz not null default now();

-- ---------- gig_applications ----------
alter table public.gig_applications add column if not exists pitch text not null default '';
alter table public.gig_applications add column if not exists status text not null default 'pending';
alter table public.gig_applications add column if not exists brand_id uuid references auth.users(id) on delete cascade;
alter table public.gig_applications add column if not exists created_at timestamptz not null default now();
alter table public.gig_applications add column if not exists updated_at timestamptz not null default now();

-- Backfill brand_id from gigs in case the column was just added.
update public.gig_applications a
   set brand_id = g.brand_id
  from public.gigs g
 where a.gig_id = g.id
   and a.brand_id is null;

-- Unique (gig_id, creator_id) — only add if missing.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'gig_applications_gig_id_creator_id_key'
       and conrelid = 'public.gig_applications'::regclass
  ) then
    alter table public.gig_applications
      add constraint gig_applications_gig_id_creator_id_key
      unique (gig_id, creator_id);
  end if;
end$$;

-- ---------- conversations ----------
alter table public.conversations add column if not exists application_id uuid references public.gig_applications(id) on delete set null;
alter table public.conversations add column if not exists last_message_at timestamptz not null default now();
alter table public.conversations add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'conversations_gig_id_creator_id_key'
       and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_gig_id_creator_id_key
      unique (gig_id, creator_id);
  end if;
end$$;

-- ---------- messages ----------
alter table public.messages add column if not exists kind text not null default 'text';
alter table public.messages add column if not exists deliverable_id uuid;
alter table public.messages add column if not exists body text not null default '';
alter table public.messages add column if not exists created_at timestamptz not null default now();

-- ---------- deliverables ----------
alter table public.deliverables add column if not exists status text not null default 'submitted';
alter table public.deliverables add column if not exists feedback text;
alter table public.deliverables add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;
alter table public.deliverables add column if not exists gig_id uuid references public.gigs(id) on delete cascade;
alter table public.deliverables add column if not exists creator_id uuid references auth.users(id) on delete cascade;
alter table public.deliverables add column if not exists brand_id uuid references auth.users(id) on delete cascade;
alter table public.deliverables add column if not exists created_at timestamptz not null default now();
alter table public.deliverables add column if not exists updated_at timestamptz not null default now();

-- ---------- deliverable_videos ----------
alter table public.deliverable_videos add column if not exists position integer not null default 0;
alter table public.deliverable_videos add column if not exists size_bytes bigint;
alter table public.deliverable_videos add column if not exists mime_type text;
alter table public.deliverable_videos add column if not exists created_at timestamptz not null default now();

-- =====================================================================
-- Verify everything is present. Run the SELECT below afterwards to
-- visually confirm the column lists match expectations.
-- =====================================================================
-- select table_name, column_name, data_type
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name in (
--      'gigs','gig_applications','conversations','messages',
--      'deliverables','deliverable_videos'
--    )
--  order by table_name, ordinal_position;
