-- =====================================================================
-- Let a brand remove a creator's conversation from their own inbox.
--
-- This is a per-user hide, not a shared delete: the creator's copy of the
-- thread and all its messages are untouched. If the creator ever needs the
-- same affordance, add hidden_by_creator_at alongside it.
-- =====================================================================

alter table public.conversations
  add column if not exists hidden_by_brand_at timestamptz;

create index if not exists conversations_brand_visible_idx
  on public.conversations (brand_id, last_message_at desc)
  where hidden_by_brand_at is null;

-- The brand needs UPDATE on their own conversation rows to set the flag.
drop policy if exists "Brand can hide own conversations" on public.conversations;
create policy "Brand can hide own conversations"
  on public.conversations for update
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);
