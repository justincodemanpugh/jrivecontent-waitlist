import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/dashboard/messaging/MessageThread";

export default async function CreatorThreadPage({ params }) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // DEBUG: server-side auth state for the creator thread page.
  console.log("[creator-thread] auth debug", {
    userId: user?.id || null,
    email: user?.email || null,
    hasUser: !!user,
    authError: authError?.message || null,
    conversationId: params.conversationId,
    ts: new Date().toISOString(),
  });

  return (
    <MessageThread
      conversationId={params.conversationId}
      role="creator"
      currentUserId={user?.id || ""}
      basePath="/dashboard/creator/messages"
    />
  );
}
