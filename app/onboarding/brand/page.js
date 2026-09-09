import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signup?role=brand");

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Already finished — send straight to the dashboard.
  if (profile?.onboarded_at) redirect("/dashboard/brand");

  // Someone arriving from the /vibecode scan already told us their app's URL
  // once — don't make them type it again. A saved value still wins.
  const scannedApp = typeof searchParams?.app === "string" ? searchParams.app : "";

  const initial = {
    brand_name: profile?.brand_name || "",
    website: profile?.website || scannedApp || "",
    industry: profile?.industry || "",
    brand_stage: profile?.brand_stage || "",
    monthly_budget: profile?.monthly_budget || "",
    content_needs: profile?.content_needs || [],
    referral_source: profile?.referral_source || "",
    terms_accepted: Boolean(profile?.terms_accepted_at),
  };

  return <OnboardingClient initial={initial} userEmail={user.email || ""} />;
}
