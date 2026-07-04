-- =====================================================================
-- Fix: infinite recursion in program_members / programs RLS policies.
--
-- "Program members: brand manage own" (on program_members) subqueries
-- `programs` to check brand_id, while "Programs: creator read enrolled"
-- (on programs) subqueries `program_members` to check membership. Any
-- query that joins both tables (e.g. programs!inner from program_members)
-- makes Postgres evaluate each table's RLS while already evaluating the
-- other's, which it refuses to do ("infinite recursion detected in policy
-- for relation program_members").
--
-- Fix: give the program_members brand-ownership check a SECURITY DEFINER
-- helper function. Functions created by the migration role bypass RLS
-- (same pattern already used by public.bump_gig_applicants_count in
-- schema.sql), so checking programs.brand_id from inside program_members'
-- policy no longer re-triggers programs' own RLS evaluation.
-- =====================================================================

create or replace function public.is_program_owner(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.programs
    where id = p_program_id
      and brand_id = auth.uid()
  );
$$;

drop policy if exists "Program members: brand manage own" on public.program_members;
create policy "Program members: brand manage own"
  on public.program_members for all
  using (public.is_program_owner(program_id))
  with check (public.is_program_owner(program_id));

notify pgrst, 'reload schema';
