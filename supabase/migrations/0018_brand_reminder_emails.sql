-- =====================================================================
-- Brand reminder emails tracking.
--
-- Tracks reminder emails sent to brands who haven't taken certain
-- actions (e.g., posting their first gig). Prevents duplicate sends
-- and allows analytics on reminder effectiveness.
-- =====================================================================

create table if not exists public.brand_reminder_emails (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_type text not null,
  sent_at timestamptz not null default now(),
  resend_id text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists brand_reminder_emails_user_type_idx
  on public.brand_reminder_emails (user_id, reminder_type);

create index if not exists brand_reminder_emails_sent_at_idx
  on public.brand_reminder_emails (sent_at desc);

alter table public.brand_reminder_emails enable row level security;

-- No client access — only service-role key can read/write.
-- This prevents users from seeing or manipulating their reminder history.

notify pgrst, 'reload schema';
