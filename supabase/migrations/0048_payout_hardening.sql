-- =====================================================================
-- Close two holes that matter once cards are charged automatically (0047).
--
-- RLS limits which ROWS a user may update, not which columns, so both are
-- done with triggers. Server code (service role) has no auth.uid() and is
-- not restricted.
--
-- Deploy the app code together with this migration: the subscription
-- checkout route must write stripe_customer_id with the service role.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. program_members: "creator update own" (0034) let a creator change any
--    column of their membership: reactivate after being removed, move it to
--    another campaign, or backdate joined_at. A creator may only accept an
--    invite, or decline / leave.
-- ---------------------------------------------------------------------

create or replace function public.restrict_creator_membership_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_program_owner(old.program_id) then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.program_id is distinct from old.program_id
     or new.creator_id is distinct from old.creator_id
     or new.invited_at is distinct from old.invited_at then
    raise exception 'Creators cannot change this membership';
  end if;

  if old.status = 'invited' and new.status = 'active' then
    new.joined_at := now();
  elsif old.status in ('invited', 'active', 'paused') and new.status = 'removed' then
    new.joined_at := old.joined_at;
  else
    raise exception 'Creators can only accept an invite or leave a campaign';
  end if;

  return new;
end;
$$;

drop trigger if exists program_members_restrict_creator_update on public.program_members;
create trigger program_members_restrict_creator_update
before update on public.program_members
for each row execute function public.restrict_creator_membership_update();


-- ---------------------------------------------------------------------
-- 2. brand_profiles: "update own" let a brand write its own billing
--    columns. Pointing stripe_customer_id at another brand's customer would
--    charge that brand's card for creator payouts; setting
--    subscription_status would skip the paywall.
-- ---------------------------------------------------------------------

create or replace function public.protect_brand_billing_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.stripe_customer_id is not null
       or new.stripe_subscription_id is not null
       or new.subscription_status is distinct from 'free'
       or new.subscription_price_id is not null
       or new.subscription_current_period_end is not null
       or new.subscription_cancel_at_period_end then
      raise exception 'Billing fields are managed by the server';
    end if;
  elsif new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.subscription_status is distinct from old.subscription_status
     or new.subscription_price_id is distinct from old.subscription_price_id
     or new.subscription_current_period_end is distinct from old.subscription_current_period_end
     or new.subscription_cancel_at_period_end is distinct from old.subscription_cancel_at_period_end then
    raise exception 'Billing fields are managed by the server';
  end if;

  return new;
end;
$$;

drop trigger if exists brand_profiles_protect_billing on public.brand_profiles;
create trigger brand_profiles_protect_billing
before insert or update on public.brand_profiles
for each row execute function public.protect_brand_billing_columns();

notify pgrst, 'reload schema';
