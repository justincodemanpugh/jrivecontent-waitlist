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

  let { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarded_at) redirect("/dashboard/creator");

  // Ensure a profile row exists so the cover photo step (which performs an
  // .update on creator_profiles) can persist before other fields are saved.
  if (!profile) {
    await supabase
      .from("creator_profiles")
      .upsert({ user_id: user.id }, { onConflict: "user_id" });
    const { data: created } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    profile = created || null;
  }

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
    cover_photo_url: profile?.cover_photo_url || "",
    terms_accepted: Boolean(profile?.terms_accepted_at),
  };

  return (
    <OnboardingClient
      initial={initial}
      userEmail={user.email || ""}
      userId={user.id}
    />
  );
}
