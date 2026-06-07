// Client-side data access for gigs. The "creators read marketplace" RLS
// policy lets any authenticated user SELECT active/open gigs, so brand-
// scoped reads MUST filter by brand_id explicitly. Writes are still
// guarded by the "brand manage own" policy.

import { createClient } from "@/lib/supabase/client";

// ---------- Cover image upload helpers ----------

// Convert a "data:image/...;base64,..." URL into a Blob for Storage upload.
function dataUrlToBlob(dataUrl) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
  if (!match) return null;
  const [, mime, b64] = match;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function extFromMime(mime) {
  if (!mime) return "jpg";
  const m = mime.split("/")[1] || "jpg";
  return m === "jpeg" ? "jpg" : m;
}

// Uploads any file-type example videos to the public `gig-examples` bucket
// and rewrites them as { type: "file", value: publicUrl, name }. URL-type
// examples (TikTok/Reel/YouTube links) and already-uploaded entries pass
// through unchanged so editing a gig later doesn't double-upload.
async function uploadExampleVideos({ supabase, userId, examples }) {
  if (!Array.isArray(examples) || examples.length === 0) return [];
  const out = [];
  for (const ex of examples) {
    if (!ex || typeof ex !== "object") {
      out.push(ex);
      continue;
    }
    if (ex.type !== "file" || !ex.file) {
      // URL link, or a file entry that was already uploaded previously.
      // Strip the in-memory `file` / `previewUrl` so we never persist them.
      const { file, previewUrl, ...rest } = ex;
      out.push(rest);
      continue;
    }
    const file = ex.file;
    const ext = (file.name?.split(".").pop() || "mp4").toLowerCase();
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const path = `${userId}/${id}.${ext}`;
    const { error } = await supabase.storage
      .from("gig-examples")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "video/mp4",
      });
    if (error) throw error;
    const { data } = supabase.storage.from("gig-examples").getPublicUrl(path);
    out.push({
      type: "file",
      value: data?.publicUrl || "",
      name: ex.name || file.name || "",
    });
  }
  return out;
}

async function uploadCoverImage({ supabase, userId, image }) {
  if (!image?.dataUrl) return null;
  const blob = dataUrlToBlob(image.dataUrl);
  if (!blob) return null;
  const ext = extFromMime(blob.type);
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const path = `${userId}/${id}.${ext}`;
  const { error } = await supabase.storage
    .from("gig-covers")
    .upload(path, blob, {
      cacheControl: "3600",
      upsert: false,
      contentType: blob.type,
    });
  if (error) throw error;
  const { data } = supabase.storage.from("gig-covers").getPublicUrl(path);
  return data?.publicUrl || null;
}

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
    coverImageUrl: row.cover_image_url || null,
    budget: Number(row.pay_per_video) || 0,
    videoQuantity: Number(row.video_quantity) || 1,
    platforms: Array.isArray(row.platforms) ? row.platforms : [],
    contentType: row.content_type || null,
    deadline: formatDeadline(row.created_at),
    applicants: row.applicants_count ?? 0,
    status: row.status || "open",
    isActive: row.is_active,
    usageRights: Array.isArray(row.usage_rights) ? row.usage_rights : ["organic_posts"],
  };
}

export async function fetchMyGigs() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in to view your gigs.");
  const { data, error } = await supabase
    .from("gigs")
    .select("*")
    .eq("brand_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToGig);
}

// Free-tier lifetime limits. "Used" counts every resource the brand has
// ever created (including soft-deleted gigs) — deactivating, deleting,
// declining, or withdrawing does not refund a free slot.
export const FREE_GIGS_TOTAL = 1;
// No limits on invitations or accepted creators for free tier
export const FREE_INVITES_TOTAL = Infinity;
export const FREE_ACCEPTED_CREATORS_TOTAL = Infinity;

const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);

// Checks the brand's platform subscription. Returns true when the brand
// is on the Pro plan and should bypass free-tier gates.
export async function isBrandPro(supabase, userId) {
  const { data } = await supabase
    .from("brand_profiles")
    .select("subscription_status")
    .eq("user_id", userId)
    .maybeSingle();
  return PAID_STATUSES.has(data?.subscription_status || "free");
}

export async function fetchFreeGigsUsage() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in.");
  const { count, error } = await supabase
    .from("gigs")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", user.id);
  if (error) throw error;
  const used = count ?? 0;
  return {
    used,
    total: FREE_GIGS_TOTAL,
    remaining: Math.max(FREE_GIGS_TOTAL - used, 0),
  };
}

// Aggregate snapshot of every free-tier limit the brand is subject to.
// Used by the Sidebar usage chip and by limit-enforcement code paths.
export async function fetchFreeTierUsage() {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in.");

  const [gigsRes, invitesRes, acceptedAppsRes, acceptedInvitesRes] =
    await Promise.all([
      supabase
        .from("gigs")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id),
      supabase
        .from("gig_invitations")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id)
        .neq("status", "cancelled"),
      supabase
        .from("gig_applications")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id)
        .eq("status", "accepted"),
      supabase
        .from("gig_invitations")
        .select("id", { count: "exact", head: true })
        .eq("brand_id", user.id)
        .eq("status", "accepted"),
    ]);

  const gigsUsed = gigsRes.count ?? 0;
  const invitesUsed = invitesRes.count ?? 0;
  const acceptedUsed =
    (acceptedAppsRes.count ?? 0) + (acceptedInvitesRes.count ?? 0);

  return {
    gigs: {
      used: gigsUsed,
      limit: FREE_GIGS_TOTAL,
      remaining: Math.max(FREE_GIGS_TOTAL - gigsUsed, 0),
    },
    invites: {
      used: invitesUsed,
      limit: FREE_INVITES_TOTAL,
      remaining: Math.max(FREE_INVITES_TOTAL - invitesUsed, 0),
    },
    acceptedCreators: {
      used: acceptedUsed,
      limit: FREE_ACCEPTED_CREATORS_TOTAL,
      remaining: Math.max(FREE_ACCEPTED_CREATORS_TOTAL - acceptedUsed, 0),
    },
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

  // Free-tier gate: enforce the 1-gig lifetime cap for non-Pro brands.
  // Pro brands bypass this entirely.
  if (!(await isBrandPro(supabase, user.id))) {
    const { count } = await supabase
      .from("gigs")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", user.id);
    if ((count ?? 0) >= FREE_GIGS_TOTAL) {
      throw new Error(
        "You've used your free gig. Upgrade to Pro to post more.",
      );
    }
  }

  // Denormalize brand_name + industry so the creator marketplace can render
  // gig cards without joining brand_profiles per row.
  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("brand_name, industry")
    .eq("user_id", user.id)
    .maybeSingle();

  // Upload the cover image first; abort before creating an orphan row if
  // it fails. If the brand didn't pick an image we just skip it.
  const coverImageUrl = await uploadCoverImage({
    supabase,
    userId: user.id,
    image: form.image,
  });

  // Upload any uploaded phone-video examples and replace them with their
  // public URLs before persisting so the creator-side detail view can
  // render <video src=…> directly.
  const examples = await uploadExampleVideos({
    supabase,
    userId: user.id,
    examples: form.examples,
  });

  const { data, error } = await supabase
    .from("gigs")
    .insert({
      brand_id: user.id,
      brand_name: profile?.brand_name || null,
      brand_industry: profile?.industry || null,
      title: form.title.trim(),
      description: form.description.trim(),
      pay_per_video: Number(form.payPerVideo) || 0,
      video_quantity: Number(form.videoQuantity) || 1,
      platforms: Array.isArray(form.platforms) ? form.platforms : [],
      content_type: form.contentType || null,
      examples,
      cover_image_url: coverImageUrl,
      usage_rights: Array.isArray(form.usageRights) ? form.usageRights : ["organic_posts"],
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
