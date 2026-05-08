// Message thread queries + Realtime subscription helper.

import { createClient } from "@/lib/supabase/client";

export async function fetchMessages(conversationId) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, kind, deliverable_id, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage({ conversationId, body, kind = "text", deliverableId = null }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required.");

  const trimmed = (body || "").trim();
  if (!trimmed && kind === "text") throw new Error("Message can't be empty.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: trimmed,
      kind,
      deliverable_id: deliverableId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Subscribe to new messages for a conversation. Returns an unsubscribe fn.
export function subscribeToMessages(conversationId, onMessage) {
  const supabase = createClient();
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload?.new) onMessage(payload.new);
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
