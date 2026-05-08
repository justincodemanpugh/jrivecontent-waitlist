// Creator-side invitations: list, accept (creates conversation), decline.

import { createClient } from "@/lib/supabase/client";

function notifyInvitationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("invitations:changed"));
  }
}

function notifyConversationsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("conversations:changed"));
  }
}

// Hydrate invitations with the gig + brand for inbox-style rendering.
export async function fetchMyInvitations() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gig_invitations")
    .select(
      `id, status, message, created_at, gig_id, brand_id, creator_id,
       gig:gigs ( id, title, brand_name, pay_per_video, status, is_active ),
       brand:brand_profiles!gig_invitations_brand_id_fkey (
         user_id, brand_name, industry
       )`,
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function declineInvitation(invitationId) {
  const supabase = createClient();
  const { error } = await supabase
    .from("gig_invitations")
    .update({ status: "declined" })
    .eq("id", invitationId);
  if (error) throw error;
  notifyInvitationsChanged();
}

// Accept = mark accepted + ensure a conversation exists between brand &
// creator on the invited gig. Returns the conversation row so we can route
// the creator into the chat thread immediately.
export async function acceptInvitation(invitation) {
  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Sign in required.");

  const { error: updErr } = await supabase
    .from("gig_invitations")
    .update({ status: "accepted" })
    .eq("id", invitation.id);
  if (updErr) throw updErr;

  // Reuse a conversation if one already exists for this (gig, creator).
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("gig_id", invitation.gig_id)
    .eq("creator_id", user.id)
    .maybeSingle();

  let conversation = existing;
  if (!conversation) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        gig_id: invitation.gig_id,
        brand_id: invitation.brand_id,
        creator_id: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    conversation = data;
  }

  await supabase.from("messages").insert({
    conversation_id: conversation.id,
    sender_id: user.id,
    body: "Creator accepted your invitation — let's get started!",
    kind: "system",
  });

  notifyInvitationsChanged();
  notifyConversationsChanged();
  return conversation;
}
