// Conversation list queries shared by both brand and creator inboxes.
// Each conversation links a brand + creator on a specific gig.

import { createClient } from "@/lib/supabase/client";

// Returns the conversations the current user is a member of, with the
// counterpart's display info denormalized for the inbox list. `role` is
// "brand" or "creator" — controls which counterpart fields we surface.
export async function fetchMyConversations(role) {
  const supabase = createClient();
  const isBrand = role === "brand";

  const counterpartJoin = isBrand
    ? `creator:creator_profiles!conversations_creator_id_fkey (
         user_id, display_name, handle, avatar_url
       )`
    : `brand:brand_profiles!conversations_brand_id_fkey (
         user_id, brand_name, industry
       )`;

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, gig_id, brand_id, creator_id, last_message_at, created_at, payment_deposited,
       gig:gigs ( id, title, pay_per_video ),
       ${counterpartJoin}`,
    )
    .order("last_message_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => ({
    id: row.id,
    gigId: row.gig_id,
    gigTitle: row.gig?.title || "Gig",
    payPerVideo: Number(row.gig?.pay_per_video) || 0,
    lastMessageAt: row.last_message_at,
    counterpart: isBrand
      ? {
          id: row.creator_id,
          name: row.creator?.display_name || row.creator?.handle || "Creator",
          handle: row.creator?.handle || "",
          avatarUrl: row.creator?.avatar_url || null,
        }
      : {
          id: row.brand_id,
          name: row.brand?.brand_name || "Brand",
          handle: "",
          avatarUrl: null,
          industry: row.brand?.industry || null,
        },
  }));
}

export async function fetchConversation(id, role) {
  const supabase = createClient();
  const isBrand = role === "brand";
  const counterpartJoin = isBrand
    ? `creator:creator_profiles!conversations_creator_id_fkey (
         user_id, display_name, handle, avatar_url, bio
       )`
    : `brand:brand_profiles!conversations_brand_id_fkey (
         user_id, brand_name, industry, website
       )`;

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, gig_id, brand_id, creator_id, last_message_at, created_at, payment_deposited,
       gig:gigs ( id, title, description, pay_per_video, brand_name ),
       payment:payments ( id, status, amount_cents, platform_fee_cents, creator_payout_cents ),
       ${counterpartJoin}`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
