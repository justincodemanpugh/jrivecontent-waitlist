-- Fix `gigs.applicants_count` not updating when creators apply.
--
-- Root cause: the trigger function ran with the inserter's privileges
-- (the creator), but RLS on `public.gigs` only allows the gig's brand to
-- UPDATE its own row. The bump UPDATE was silently filtered out, leaving
-- `applicants_count` at 0. Marking the function SECURITY DEFINER makes
-- it run as the function owner so it can bypass that RLS check.

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

-- Backfill existing rows that were stuck at 0 (or otherwise out of sync)
-- because the trigger was silently failing under the inserter's RLS.
update public.gigs g
set applicants_count = coalesce(sub.cnt, 0)
from (
  select gig_id, count(*)::int as cnt
  from public.gig_applications
  group by gig_id
) sub
where sub.gig_id = g.id
  and g.applicants_count is distinct from sub.cnt;

-- Also zero out gigs that have no applications but a stale non-zero count.
update public.gigs g
set applicants_count = 0
where applicants_count <> 0
  and not exists (
    select 1 from public.gig_applications a where a.gig_id = g.id
  );
