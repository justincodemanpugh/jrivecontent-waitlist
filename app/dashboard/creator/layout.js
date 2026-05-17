import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/creator/Sidebar";
import MobileTabBar from "@/components/dashboard/creator/MobileTabBar";
import { CreatorProvider } from "@/components/dashboard/creator/CreatorProvider";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Creator Dashboard — JriveContent",
};

export default async function CreatorDashboardLayout({ children }) {
  // Auth is enforced by middleware. We additionally enforce that the creator
  // has finished onboarding before the dashboard is rendered.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("creator_profiles")
      .select(
        "display_name, handle, bio, avatar_url, niches, onboarded_at, stripe_account_id, stripe_payouts_enabled, country",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data?.onboarded_at) redirect("/onboarding/creator");
    profile = data;
  }

  const creatorValue = {
    display_name: profile?.display_name || "",
    handle: profile?.handle || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || null,
    niches: profile?.niches || [],
    email: user?.email || "",
    stripe_account_id: profile?.stripe_account_id || null,
    stripe_payouts_enabled: Boolean(profile?.stripe_payouts_enabled),
    country: profile?.country || null,
  };

  return (
    <CreatorProvider value={creatorValue}>
      <div className="min-h-screen bg-brand-mist/40">
        <Sidebar />
        <div className="lg:pl-64">{children}</div>
        <MobileTabBar />
        <div className="h-16 lg:hidden" />
      </div>
    </CreatorProvider>
  );
}
