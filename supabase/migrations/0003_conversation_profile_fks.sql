-- =====================================================================
-- Add foreign keys from conversations -> profile tables so PostgREST can
-- embed creator_profiles / brand_profiles when querying conversations.
--
-- Without these, Supabase returns:
--   "Could not find a relationship between 'conversations' and
--    'creator_profiles' in the schema cache"
--
-- Safe to re-run.
-- =====================================================================

-- creator_profiles.user_id is the PK of that table, so this FK is valid
-- as long as every conversation's creator has completed creator onboarding
-- (which is enforced by the app flow before a creator can apply to a gig).
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'conversations_creator_id_fkey'
       and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_creator_id_fkey
      foreign key (creator_id)
      references public.creator_profiles(user_id)
      on delete cascade;
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'conversations_brand_id_fkey'
       and conrelid = 'public.conversations'::regclass
  ) then
    alter table public.conversations
      add constraint conversations_brand_id_fkey
      foreign key (brand_id)
      references public.brand_profiles(user_id)
      on delete cascade;
  end if;
end$$;

-- Same fix for gig_applications, since applicantsApi.js embeds
-- creator_profiles via gig_applications_creator_id_fkey.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'gig_applications_creator_id_fkey'
       and conrelid = 'public.gig_applications'::regclass
  ) then
    alter table public.gig_applications
      add constraint gig_applications_creator_id_fkey
      foreign key (creator_id)
      references public.creator_profiles(user_id)
      on delete cascade;
  end if;
end$$;

-- Tell PostgREST to reload its schema cache so the new relationships
-- are picked up immediately.
notify pgrst, 'reload schema';
