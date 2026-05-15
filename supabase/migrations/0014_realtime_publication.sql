-- =====================================================================
-- Enable Supabase Realtime for the tables the dashboard subscribes to.
--
-- Without these `alter publication` statements, Postgres never streams
-- INSERT/UPDATE events to connected clients, which is why the message
-- thread, inbox list, payment banner, and notifications bell only
-- updated after a manual page refresh.
--
-- `add table` is not idempotent on its own, so we wrap each statement
-- in a DO block that swallows the "already member" error (42710).
-- =====================================================================

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null; -- publication missing on local/dev
end$$;

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception
  when duplicate_object then null;
  when undefined_object then null;
end$$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
end$$;

do $$
begin
  alter publication supabase_realtime add table public.deliverables;
exception
  when duplicate_object then null;
  when undefined_object then null;
end$$;
