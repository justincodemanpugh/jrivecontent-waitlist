// Client-side data access for gigs. RLS policies enforce that brands can
// only read/write their own rows, so we don't filter by brand_id manually.

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

function pickCover(seed) {
  const n = typeof seed === "string"
    ? seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
    : Number(seed) || 0;
  return COVER_POOL[Math.abs(n) % COVER_POOL.length];
}

function formatDeadline(createdAt) {
  if (!createdAt) return "Just posted";
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "Just posted";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

// Map a DB row to the shape `GigListCard` expects.
export function rowToGig(row) {
  return {
    id: row.id,
    title: row.title,
    cover: pickCover(row.id),
    budget: Number(row.pay_per_video) || 0,
    deadline: formatDeadline(row.created_at),
    applicants: row.applicants_count ?? 0,
    status: row.status || "open",
    isActive: row.is_active,
  };
}

export async function fetchMyGigs() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gigs")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToGig);
}

// Free-gig lifetime usage. "Used" counts every gig the brand has ever
// created, including soft-deleted ones — deactivating or deleting does
// not refund a free slot.
export const FREE_GIGS_TOTAL = 3;

export async function fetchFreeGigsUsage() {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("gigs")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  const used = count ?? 0;
  return {
    used,
    total: FREE_GIGS_TOTAL,
    remaining: Math.max(FREE_GIGS_TOTAL - used, 0),
  };
}

function notifyGigsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("gigs:changed"));
  }
}

export async function publishGig(form) {
  const supabase = createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in to publish a gig.");

  const { data, error } = await supabase
    .from("gigs")
    .insert({
      brand_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      pay_per_video: Number(form.payPerVideo) || 0,
      examples: form.examples || [],
      status: "open",
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  notifyGigsChanged();
  return rowToGig(data);
}

export async function deactivateGig(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from("gigs")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
  notifyGigsChanged();
}

// Soft-delete so the row still counts against the brand's lifetime
// free-gig allowance. `fetchMyGigs` filters these out of the UI.
export async function deleteGig(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from("gigs")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);
  if (error) throw error;
  notifyGigsChanged();
}
