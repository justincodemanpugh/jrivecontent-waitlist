import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function CreatorOnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signup?role=creator");

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarded_at) redirect("/dashboard/creator");

  const initial = {
    display_name: profile?.display_name || "",
    handle: profile?.handle || "",
    bio: profile?.bio || "",
    niches: profile?.niches || [],
    content_types: profile?.content_types || [],
    portfolio_url: profile?.portfolio_url || "",
    instagram_handle: profile?.instagram_handle || "",
    tiktok_handle: profile?.tiktok_handle || "",
    youtube_handle: profile?.youtube_handle || "",
    terms_accepted: Boolean(profile?.terms_accepted_at),
  };

  return <OnboardingClient initial={initial} userEmail={user.email || ""} />;
}
