import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import TopBar from "@/components/dashboard/creator/TopBar";
import AvatarUploader from "@/components/dashboard/creator/profile/AvatarUploader";
import CoverPhotoUploader from "@/components/dashboard/creator/profile/CoverPhotoUploader";
import ProfileEditForm from "@/components/dashboard/creator/profile/ProfileEditForm";
import PortfolioVideosManager from "@/components/dashboard/creator/profile/PortfolioVideosManager";

function deriveInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function CreatorProfileEditPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const [{ data: profile }, { data: videos }] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select(
        "display_name, bio, avatar_url, cover_photo_url, instagram_handle, tiktok_handle, youtube_handle, portfolio_url, country, stripe_account_id",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("creator_portfolio_videos")
      .select("id, platform, video_url, thumbnail_path, title, storage_path, position, created_at")
      .eq("creator_id", user.id)
      .order("position", { ascending: true }),
  ]);

  const initials = deriveInitials(profile?.display_name || user.email);

  return (
    <>
      <TopBar title="Edit profile" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard/creator/profile"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent"
        >
          <ArrowLeft size={14} /> Back to profile
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-6 space-y-6">
          <CoverPhotoUploader
            userId={user.id}
            initialUrl={profile?.cover_photo_url || null}
          />
          <AvatarUploader
            userId={user.id}
            initialUrl={profile?.avatar_url || null}
            initials={initials}
          />
        </div>

        <ProfileEditForm
          initial={{
            display_name: profile?.display_name || "",
            bio: profile?.bio || "",
            instagram_handle: profile?.instagram_handle || "",
            tiktok_handle: profile?.tiktok_handle || "",
            youtube_handle: profile?.youtube_handle || "",
            portfolio_url: profile?.portfolio_url || "",
            country: profile?.country || "",
            // Once a Stripe connected account exists, its country is
            // locked by Stripe and can't be changed via our app.
            stripe_country_locked: Boolean(profile?.stripe_account_id),
          }}
        />

        <PortfolioVideosManager userId={user.id} initialVideos={videos || []} />
      </main>
    </>
  );
}
