import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Someone who made a plan or scanned their app already told us its name and
  // link — don't make them type them again. A saved value still wins.
  const scannedApp = typeof searchParams?.app === "string" ? searchParams.app : "";
  // brand_plans is readable by the server only (migration 0050).
  const { data: latestPlan } = await createAdminClient()
    .from("brand_plans")
    .select("app_url, plan")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const initial = {
    brand_name: profile?.brand_name || latestPlan?.plan?.appName || "",
    website: profile?.website || latestPlan?.app_url || scannedApp || "",
    terms_accepted: Boolean(profile?.terms_accepted_at),
  };

  return <OnboardingClient initial={initial} userEmail={user.email || ""} />;
}
