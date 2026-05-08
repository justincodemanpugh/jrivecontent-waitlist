import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/dashboard/messaging/MessageThread";

export default async function CreatorThreadPage({ params }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <MessageThread
      conversationId={params.conversationId}
      role="creator"
      currentUserId={user?.id || ""}
      basePath="/dashboard/creator/messages"
    />
  );
}
