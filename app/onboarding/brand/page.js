import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding/brand");

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Already finished — send straight to the dashboard.
  if (profile?.onboarded_at) redirect("/dashboard/brand");

  const initial = {
    brand_name: profile?.brand_name || "",
    website: profile?.website || "",
    industry: profile?.industry || "",
    brand_stage: profile?.brand_stage || "",
    monthly_budget: profile?.monthly_budget || "",
    content_needs: profile?.content_needs || [],
    referral_source: profile?.referral_source || "",
    terms_accepted: Boolean(profile?.terms_accepted_at),
  };

  return <OnboardingClient initial={initial} userEmail={user.email || ""} />;
}
