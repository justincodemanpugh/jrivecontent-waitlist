import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/dashboard/brand/settings/ProfileForm";

export const dynamic = "force-dynamic";

export default async function BrandSettingsProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("brand_name, website, industry, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <ProfileForm
      initial={{
        brand_name: profile?.brand_name || "",
        website: profile?.website || "",
        industry: profile?.industry || "",
        avatar_url: profile?.avatar_url || "",
        email: user?.email || "",
      }}
    />
  );
}
