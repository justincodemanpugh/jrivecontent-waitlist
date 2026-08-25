-- =====================================================================
-- Let conversations belong to a program, not just a gig.
--
-- Conversations were created only when a brand accepted a gig application
-- or gig invitation. Creators are no longer applying to gigs — brands
-- track their videos through programs — so a program membership now needs
-- to open a message thread too.
--
-- gig_id becomes nullable and program_id is added; exactly one must be set.
-- The old (gig_id, creator_id) unique constraint is replaced by partial
-- unique indexes so each side can be null independently.
-- =====================================================================

alter table public.conversations
  alter column gig_id drop not null;

alter table public.conversations
  add column if not exists program_id uuid references public.programs(id) on delete cascade;

alter table public.conversations
  drop constraint if exists conversations_gig_id_creator_id_key;

alter table public.conversations
  drop constraint if exists conversations_subject_check;

alter table public.conversations
  add constraint conversations_subject_check
  check (num_nonnulls(gig_id, program_id) = 1);

create unique index if not exists conversations_gig_creator_key
  on public.conversations(gig_id, creator_id)
  where gig_id is not null;

create unique index if not exists conversations_program_creator_key
  on public.conversations(program_id, creator_id)
  where program_id is not null;

-- The existing "members read" / "brand insert" policies key off brand_id
-- and creator_id only, so they already cover program conversations. No
-- policy changes are needed on conversations or messages.

notify pgrst, 'reload schema';
