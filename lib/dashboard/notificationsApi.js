// Notification queries + Realtime subscription helper.
// Powers the bell dropdown in both the brand and creator TopBars.

import { createClient } from "@/lib/supabase/client";

const DEFAULT_LIMIT = 20;

// Fetches the most recent notifications for the current user.
export async function fetchMyNotifications({ limit = DEFAULT_LIMIT } = {}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link_url, data, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Cheap count of unread notifications for the badge dot.
export async function fetchUnreadCount() {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) throw error;
}

// Subscribe to new notifications for `userId`. Returns an unsubscribe fn.
export function subscribeToNotifications(userId, onInsert) {
  if (!userId) return () => {};
  const supabase = createClient();
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload?.new) onInsert(payload.new);
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
