// Read-only marketplace queries used by the creator-side Explore Gigs UI.
// RLS ensures only active, non-deleted, open gigs are returned.

import { createClient } from "@/lib/supabase/client";

const COVER_POOL = [
  "from-rose-200 to-amber-100",
  "from-amber-200 to-orange-100",
  "from-sky-200 to-indigo-100",
  "from-yellow-200 to-rose-100",
  "from-pink-200 to-fuchsia-100",
  "from-emerald-200 to-teal-100",
  "from-violet-200 to-indigo-100",
];

export function pickCoverFor(seed) {
  const s = String(seed || "");
  const n = s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVER_POOL[Math.abs(n) % COVER_POOL.length];
}

function rowToMarketplaceGig(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    payPerVideo: Number(row.pay_per_video) || 0,
    videoQuantity: Number(row.video_quantity) || 1,
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    contentType: row.content_type || null,
    examples: row.examples || [],
    brandId: row.brand_id,
    brandName: row.brand_name || "Brand",
    brandIndustry: row.brand_industry || null,
    cover: pickCoverFor(row.id),
    coverImageUrl: row.cover_image_url || null,
    createdAt: row.created_at,
    applicantsCount: row.applicants_count ?? 0,
    status: row.status,
  };
}

export async function fetchMarketplaceGigs() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gigs")
    .select("*")
    .is("deleted_at", null)
    .eq("is_active", true)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data || []).map(rowToMarketplaceGig);
}

export async function fetchMarketplaceGig(id) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gigs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToMarketplaceGig(data);
}
