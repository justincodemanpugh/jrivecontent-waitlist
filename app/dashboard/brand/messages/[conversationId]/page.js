import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/dashboard/messaging/MessageThread";

export default async function BrandThreadPage({ params }) {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // DEBUG: server-side auth state for the brand thread page.
  console.log("[brand-thread] auth debug", {
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
      role="brand"
      currentUserId={user?.id || ""}
      basePath="/dashboard/brand/messages"
    />
  );
}
