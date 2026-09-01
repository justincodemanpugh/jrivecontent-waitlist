// Server-side query for the public /creators directory.
//
// Reads through the anon-key server client against the public-read policy in
// migration 0042, so this works logged out. Filtering and pagination happen in
// Postgres — deliberately NOT the fetchAllCreators() pattern in
// lib/dashboard/brand/creatorsApi.js, which loads every row and filters in a
// useMemo. That is fine for a few dozen signed-up creators and falls over on a
// seeded directory of thousands.
import { createClient } from "@/lib/supabase/server";

export const PAGE_SIZE = 24;

export const SORTS = {
  followers: { label: "Most followers", column: "follower_count" },
  engagement: { label: "Most likes per video", column: "avg_likes_per_video" },
  newest: { label: "Recently added", column: "created_at" },
};

export const FOLLOWER_RANGES = {
  "1k-10k": { label: "1K – 10K", min: 1000, max: 10000 },
  "10k-100k": { label: "10K – 100K", min: 10000, max: 100000 },
  "100k-1m": { label: "100K – 1M", min: 100000, max: 1000000 },
  "1m+": { label: "1M+", min: 1000000, max: null },
};

// PostgREST's .or() takes a comma-separated filter string, so a raw query
// containing commas or parens would change the filter's meaning. Strip the
// characters that are structural rather than trying to escape them.
function sanitizeQuery(raw) {
  return String(raw || "").trim().replace(/[,()%*\\]/g, "").slice(0, 80);
}

export async function fetchDirectory({
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

// Total shown in the hero. Cheap head-only count, cached by the page's own
// revalidate window.
export async function countDirectory() {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("discovered_creators")
    .select("id", { count: "exact", head: true })
    .eq("hidden", false);
  if (error) return 0;
  return count ?? 0;
}

export function tiktokProfileUrl(username) {
  return `https://www.tiktok.com/@${encodeURIComponent(username)}`;
}

export function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1)}K`;
  return String(num);
}
