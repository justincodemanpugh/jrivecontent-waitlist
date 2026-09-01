// Client-side queries for the TikTok directory tab of Browse Creators.
//
// Reads discovered_creators through the browser Supabase client, gated by the
// subscribed-brand RLS policy in migration 0043 — an unsubscribed brand gets
// zero rows rather than an error, which the view renders as an upgrade prompt.
//
// Filtering and pagination run in Postgres. This deliberately does NOT follow
// the fetchAllCreators() pattern in ./creatorsApi.js, which loads every row and
// filters in a useMemo: that is fine for the few dozen creators who have signed
// up and would fall over on a directory of thousands.
import { createClient } from "@/lib/supabase/client";
import { PAGE_SIZE, SORTS, FOLLOWER_RANGES, sanitizeQuery } from "@/lib/discovery/directory";

export async function fetchDiscoveredCreators({
  q = "",
  niche = "",
  followers = "",
  sort = "followers",
  page = 1,
} = {}) {
  const supabase = createClient();

  const sortKey = SORTS[sort] ? sort : "followers";
  const pageNum = Math.max(1, Number(page) || 1);
  const from = (pageNum - 1) * PAGE_SIZE;

  let query = supabase
    .from("discovered_creators")
    .select(
      `id, username, nickname, avatar_url, bio, bio_link, follower_count,
       total_likes, video_count, avg_likes_per_video, avg_views, verified,
       niche_tags, last_scraped_at,
       discovered_creator_videos ( thumbnail_url, video_url, views, position )`,
      { count: "exact" },
    )
    .eq("hidden", false);

  const term = sanitizeQuery(q);
  if (term) {
    query = query.or(
      `username.ilike.%${term}%,nickname.ilike.%${term}%,bio.ilike.%${term}%`,
    );
  }
  if (niche) query = query.contains("niche_tags", [niche]);

  const range = FOLLOWER_RANGES[followers];
  if (range) {
    query = query.gte("follower_count", range.min);
    if (range.max) query = query.lt("follower_count", range.max);
  }

  const { data, error, count } = await query
    .order(SORTS[sortKey].column, { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) throw error;

  const creators = (data || []).map((row) => ({
    ...row,
    videos: (row.discovered_creator_videos || []).sort(
      (a, b) => a.position - b.position,
    ),
  }));

  return {
    creators,
    total: count ?? 0,
    page: pageNum,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}
