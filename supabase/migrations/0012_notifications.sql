-- =====================================================================
-- In-app notifications.
--
-- One row per delivered notification, scoped to a single recipient user.
-- Created by Postgres triggers on the source tables (messages,
-- gig_applications, deliverables) so the app never has to remember to
-- emit them from application code. The TopBar bell component reads from
-- here and subscribes to INSERTs via Supabase Realtime.
-- =====================================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Notification type. Keep as text so triggers can introduce new kinds
  -- without a schema migration. Known values:
  --   message            — new chat message from counterpart
  --   application_new    — creator applied to a brand's gig
  --   application_accepted, application_declined — brand updated app status
  --   deliverable_submitted — creator submitted videos
  --   deliverable_approved, deliverable_revision — brand reviewed videos
  type text not null,
  title text not null,
  body text not null default '',
  -- Where clicking the notification should send the user.
  link_url text,
  -- Free-form payload (conversation_id, gig_id, application_id, etc.).
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists notifications_user_recent_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Recipients can read and mark their own notifications as read. Inserts
-- happen via SECURITY DEFINER triggers, so no insert policy is needed
-- for end users.
drop policy if exists "Notifications: recipient read" on public.notifications;
create policy "Notifications: recipient read"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Notifications: recipient update" on public.notifications;
create policy "Notifications: recipient update"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Notifications: recipient delete" on public.notifications;
create policy "Notifications: recipient delete"
  on public.notifications for delete
  using (auth.uid() = user_id);


-- =====================================================================
-- Trigger: new message → notify the *other* conversation member.
-- =====================================================================
create or replace function public.notify_on_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  conv record;
  recipient uuid;
  sender_name text;
  preview text;
begin
  select c.id, c.brand_id, c.creator_id, c.gig_id, g.title as gig_title
    into conv
    from public.conversations c
    left join public.gigs g on g.id = c.gig_id
    where c.id = new.conversation_id;
  if conv is null then return new; end if;

  if new.sender_id = conv.brand_id then
    recipient := conv.creator_id;
    select coalesce(brand_name, 'Brand') into sender_name
      from public.brand_profiles where user_id = conv.brand_id;
  else
    recipient := conv.brand_id;
    select coalesce(display_name, handle, 'Creator') into sender_name
      from public.creator_profiles where user_id = conv.creator_id;
  end if;

  -- Don't notify yourself (system inserts may set sender to either side).
  if recipient is null or recipient = new.sender_id then return new; end if;

  preview := case
    when new.kind = 'deliverable' then 'Sent a deliverable'
    when new.kind = 'system' then new.body
    else left(new.body, 140)
  end;

  insert into public.notifications (user_id, type, title, body, link_url, data)
  values (
    recipient,
    'message',
    coalesce(sender_name, 'New message'),
    coalesce(preview, ''),
    case
      when recipient = conv.brand_id
        then '/dashboard/brand/messages/' || conv.id::text
      else '/dashboard/creator/messages/' || conv.id::text
    end,
    jsonb_build_object(
      'conversation_id', conv.id,
      'gig_id', conv.gig_id,
      'message_id', new.id
    )
  );
  return new;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
after insert on public.messages
for each row execute function public.notify_on_new_message();


-- =====================================================================
-- Trigger: new gig application → notify the brand.
-- =====================================================================
create or replace function public.notify_on_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gig_title text;
  creator_name text;
begin
  select title into gig_title from public.gigs where id = new.gig_id;
  select coalesce(display_name, handle, 'A creator') into creator_name
    from public.creator_profiles where user_id = new.creator_id;

  insert into public.notifications (user_id, type, title, body, link_url, data)
  values (
    new.brand_id,
    'application_new',
    'New applicant',
    coalesce(creator_name, 'A creator') || ' applied to "' || coalesce(gig_title, 'your gig') || '"',
    '/dashboard/brand/gigs/' || new.gig_id::text,
    jsonb_build_object(
      'application_id', new.id,
      'gig_id', new.gig_id,
      'creator_id', new.creator_id
    )
  );
  return new;
end;
$$;

drop trigger if exists applications_notify_new on public.gig_applications;
create trigger applications_notify_new
after insert on public.gig_applications
for each row execute function public.notify_on_new_application();


-- =====================================================================
-- Trigger: application status changed by brand → notify the creator.
-- =====================================================================
create or replace function public.notify_on_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gig_title text;
begin
  if new.status = old.status then return new; end if;
  if new.status not in ('accepted', 'declined') then return new; end if;

  select title into gig_title from public.gigs where id = new.gig_id;

  insert into public.notifications (user_id, type, title, body, link_url, data)
  values (
    new.creator_id,
    case when new.status = 'accepted' then 'application_accepted' else 'application_declined' end,
    case when new.status = 'accepted' then 'Application accepted' else 'Application declined' end,
    case when new.status = 'accepted'
      then 'You were accepted for "' || coalesce(gig_title, 'a gig') || '"'
      else 'Your application for "' || coalesce(gig_title, 'a gig') || '" was declined'
    end,
    '/dashboard/creator/applications',
    jsonb_build_object(
      'application_id', new.id,
      'gig_id', new.gig_id,
      'status', new.status
    )
  );
  return new;
end;
$$;

drop trigger if exists applications_notify_status on public.gig_applications;
create trigger applications_notify_status
after update on public.gig_applications
for each row execute function public.notify_on_application_status();


-- =====================================================================
-- Trigger: deliverable submitted → notify the brand.
-- Trigger: deliverable approved / revision_requested → notify the creator.
-- =====================================================================
create or replace function public.notify_on_deliverable_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gig_title text;
  creator_name text;
begin
  select g.title into gig_title from public.gigs g where g.id = new.gig_id;
  select coalesce(display_name, handle, 'A creator') into creator_name
    from public.creator_profiles where user_id = new.creator_id;

  insert into public.notifications (user_id, type, title, body, link_url, data)
  values (
    new.brand_id,
    'deliverable_submitted',
    'New deliverable',
    coalesce(creator_name, 'A creator') || ' submitted videos for "' || coalesce(gig_title, 'your gig') || '"',
    '/dashboard/brand/messages/' || new.conversation_id::text,
    jsonb_build_object(
      'deliverable_id', new.id,
      'conversation_id', new.conversation_id,
      'gig_id', new.gig_id
    )
  );
  return new;
end;
$$;

drop trigger if exists deliverables_notify_insert on public.deliverables;
create trigger deliverables_notify_insert
after insert on public.deliverables
for each row execute function public.notify_on_deliverable_insert();


create or replace function public.notify_on_deliverable_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  gig_title text;
begin
  if new.status = old.status then return new; end if;
  if new.status not in ('approved', 'revision_requested') then return new; end if;

  select title into gig_title from public.gigs where id = new.gig_id;

  insert into public.notifications (user_id, type, title, body, link_url, data)
  values (
    new.creator_id,
    case when new.status = 'approved' then 'deliverable_approved' else 'deliverable_revision' end,
    case when new.status = 'approved' then 'Deliverable approved' else 'Revision requested' end,
    case when new.status = 'approved'
      then 'Your videos for "' || coalesce(gig_title, 'a gig') || '" were approved'
      else 'Brand requested a revision on "' || coalesce(gig_title, 'a gig') || '"'
    end,
    '/dashboard/creator/messages/' || new.conversation_id::text,
    jsonb_build_object(
      'deliverable_id', new.id,
      'conversation_id', new.conversation_id,
      'gig_id', new.gig_id,
      'status', new.status
    )
  );
  return new;
end;
$$;

drop trigger if exists deliverables_notify_update on public.deliverables;
create trigger deliverables_notify_update
after update on public.deliverables
for each row execute function public.notify_on_deliverable_update();


notify pgrst, 'reload schema';
