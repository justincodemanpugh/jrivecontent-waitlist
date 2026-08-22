// Conversation list queries shared by both brand and creator inboxes.
// Each conversation links a brand + creator on a specific gig.

import { createClient } from "@/lib/supabase/client";

// Returns the conversations the current user is a member of, with the
// counterpart's display info denormalized for the inbox list. `role` is
// "brand" or "creator" — controls which counterpart fields we surface.
export async function fetchMyConversations(role) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in to view your conversations.");

  const isBrand = role === "brand";

  const counterpartJoin = isBrand
    ? `creator:creator_profiles!conversations_creator_id_fkey (
         user_id, display_name, handle, avatar_url
       )`
    : `brand:brand_profiles!conversations_brand_id_fkey (
         user_id, brand_name, industry, avatar_url
       )`;

  const ownershipCol = isBrand ? "brand_id" : "creator_id";

  let query = supabase
    .from("conversations")
    .select(
      `id, gig_id, brand_id, creator_id, last_message_at, created_at,
       gig:gigs ( id, title, pay_per_video ),
       ${counterpartJoin}`,
    )
    .eq(ownershipCol, user.id);

  // Brands can remove a thread from their own inbox; the creator still sees it.
  if (isBrand) query = query.is("hidden_by_brand_at", null);

  const { data, error } = await query.order("last_message_at", {
    ascending: false,
  });
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
          avatarUrl: row.brand?.avatar_url || null,
          industry: row.brand?.industry || null,
        },
  }));
}

export async function fetchConversation(id, role) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in to view this conversation.");

  const isBrand = role === "brand";
  const counterpartJoin = isBrand
    ? `creator:creator_profiles!conversations_creator_id_fkey (
         user_id, display_name, handle, avatar_url, bio
       )`
    : `brand:brand_profiles!conversations_brand_id_fkey (
         user_id, brand_name, industry, website, avatar_url
       )`;

  // Defense-in-depth: explicitly require the current user to be the
  // brand or creator on this conversation, matching their dashboard role.
  // RLS already enforces members-only access, but this filter ensures a
  // brand can't open a creator-side URL for someone else's thread (and
  // vice versa) and surfaces a clean "not found" instead of empty data.
  const ownershipCol = isBrand ? "brand_id" : "creator_id";

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `id, gig_id, brand_id, creator_id, last_message_at, created_at,
       gig:gigs ( id, title, description, pay_per_video, brand_name ),
       ${counterpartJoin}`,
    )
    .eq("id", id)
    .eq(ownershipCol, user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Hide a conversation from the brand's inbox. The creator's view is unaffected.
export async function hideConversationForBrand(conversationId) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("You need to be signed in.");

  const { error } = await supabase
    .from("conversations")
    .update({ hidden_by_brand_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("brand_id", user.id);
  if (error) throw error;

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("conversations:changed"));
  }
}

// Subscribe to UPDATE events on a conversation row. Returns an unsubscribe fn.
export function subscribeToConversation(conversationId, onUpdate) {
  const supabase = createClient();
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "conversations",
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload?.new) onUpdate(payload.new);
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
