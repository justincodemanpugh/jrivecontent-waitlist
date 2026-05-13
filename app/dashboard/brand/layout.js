import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/brand/Sidebar";
import MobileTabBar from "@/components/dashboard/brand/MobileTabBar";
import { BrandProvider } from "@/components/dashboard/brand/BrandProvider";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Brand Dashboard — JriveContent",
};

export default async function BrandDashboardLayout({ children }) {
  // Auth is enforced by middleware; here we make sure brand onboarding is
  // completed before letting the user into the dashboard, and we hydrate the
  // brand profile for downstream components via BrandProvider.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("brand_profiles")
      .select("brand_name, website, industry, avatar_url, onboarded_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data?.onboarded_at) redirect("/onboarding/brand");
    profile = data;
  }

  const brandValue = {
    brand_name: profile?.brand_name || "",
    website: profile?.website || "",
    industry: profile?.industry || "",
    avatar_url: profile?.avatar_url || "",
    email: user?.email || "",
  };

  return (
    <BrandProvider value={brandValue}>
      <div className="min-h-screen bg-brand-mist/40">
        <Sidebar />
        <div className="lg:pl-64">{children}</div>
        <MobileTabBar />
        {/* Spacer so mobile tab bar doesn't cover content */}
        <div className="h-16 lg:hidden" />
      </div>
    </BrandProvider>
  );
}
