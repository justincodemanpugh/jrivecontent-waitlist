import { createClient } from "@/lib/supabase/server";
import MessageThread from "@/components/dashboard/messaging/MessageThread";

export default async function BrandThreadPage({ params }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <MessageThread
      conversationId={params.conversationId}
      role="brand"
      currentUserId={user?.id || ""}
      basePath="/dashboard/brand/messages"
    />
  );
}
