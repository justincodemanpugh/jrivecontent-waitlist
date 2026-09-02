-- =====================================================================
-- Gate the creator directory behind the brand dashboard.
--
-- 0042 made discovered_creators anon-readable to back a public /creators
-- page aimed at search traffic. That page is gone: the directory is a
-- brand tool and now lives at /dashboard/brand/creators, behind the same
-- subscription gate 0041 puts on campaign creation.
--
-- What does NOT change: /creators/opt-out stays public and unauthenticated.
-- Scraped creators have no account and cannot log into a brand dashboard,
-- so gating removal alongside the data would leave people listed with no
-- reachable way out. That route writes with the service-role client, so it
-- needs no policy here — it just must never be gated.
-- =====================================================================


-- ---------------------------------------------------------------------
-- discovered_creators: subscribed brands only.
-- ---------------------------------------------------------------------

drop policy if exists "Discovered creators: public read" on public.discovered_creators;
drop policy if exists "Discovered creators: subscribed brand read" on public.discovered_creators;

create policy "Discovered creators: subscribed brand read"
  on public.discovered_creators for select
  to authenticated
  using (
    hidden = false
    and public.brand_has_active_subscription(auth.uid())
  );


-- ---------------------------------------------------------------------
-- discovered_creator_videos: follows the parent.
-- ---------------------------------------------------------------------

drop policy if exists "Discovered creator videos: public read"
  on public.discovered_creator_videos;
drop policy if exists "Discovered creator videos: subscribed brand read"
  on public.discovered_creator_videos;

create policy "Discovered creator videos: subscribed brand read"
  on public.discovered_creator_videos for select
  to authenticated
  using (
    exists (
      select 1 from public.discovered_creators dc
      where dc.id = discovered_creator_videos.discovered_creator_id
        and dc.hidden = false
    )
    and public.brand_has_active_subscription(auth.uid())
  );


-- discovery_searches and discovery_optouts are unchanged: RLS on, no
-- policies, service-role only.

notify pgrst, 'reload schema';
