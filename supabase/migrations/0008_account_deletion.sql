-- =====================================================================
-- Account self-deletion.
-- Lets a signed-in user permanently delete their own auth.users row.
-- All public.* tables that reference auth.users(id) use ON DELETE CASCADE,
-- so brand_profiles / creator_profiles / gigs / gig_applications /
-- conversations / messages / deliverables / deliverable_videos all clean
-- up automatically. Storage objects in the `deliverables` bucket are
-- handled by the application layer (admin client) before this runs, or
-- can be reaped by a separate job — they are not FK-linked.
--
-- The function runs as SECURITY DEFINER (table owner) so it can touch
-- auth.users, but it only ever deletes the *caller's* own row via
-- auth.uid(). Anonymous callers are rejected.
-- =====================================================================

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_user_account() from public;
grant execute on function public.delete_user_account() to authenticated;
