-- =====================================================================
-- Some databases still have the `result` column from the first version of
-- 0046. The scan route stopped writing it, so on those databases every
-- insert into vibecode_scans fails: nothing is logged, and the per-visitor
-- rate limit, which counts those rows, never triggers.
-- =====================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'vibecode_scans'
      and column_name = 'result'
  ) then
    alter table public.vibecode_scans alter column result drop not null;
  end if;
end $$;

notify pgrst, 'reload schema';
