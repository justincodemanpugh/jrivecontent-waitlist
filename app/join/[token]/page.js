import { redirect } from "next/navigation";
import JoinInvite from "@/components/join/JoinInvite";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteState } from "@/lib/board/invite";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "You're invited — JriveContent",
  robots: { index: false },
};

export default async function JoinPage({ params }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/signup?role=creator&next=${encodeURIComponent(`/join/${params.token}`)}`);
  }

  const { state, brandName } = await inviteState(createAdminClient(), params.token, user.id);

  return <JoinInvite token={params.token} state={state} brandName={brandName || ""} />;
}
