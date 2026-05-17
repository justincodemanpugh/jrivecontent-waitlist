import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Instagram, Youtube, Globe, Music2 } from "lucide-react";
import TopBar from "@/components/dashboard/creator/TopBar";
import StripePayoutsCard from "@/components/dashboard/creator/StripePayoutsCard";
import PortfolioVideosGrid from "@/components/dashboard/creator/profile/PortfolioVideosGrid";
import { createClient } from "@/lib/supabase/server";

function deriveInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default async function CreatorProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const [{ data: profile }, { data: videos }] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select(
        "display_name, handle, bio, avatar_url, cover_photo_url, niches, instagram_handle, tiktok_handle, youtube_handle, portfolio_url",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("creator_portfolio_videos")
      .select("id, storage_path, position, created_at")
      .eq("creator_id", user.id)
      .order("position", { ascending: true }),
  ]);

  const name = profile?.display_name || user.email || "Creator";
  const initials = deriveInitials(profile?.display_name || user.email);
  const niches = profile?.niches || [];
  const portfolioVideos = videos || [];

  const socials = [
    {
      key: "instagram",
      label: "Instagram",
      icon: Instagram,
      handle: profile?.instagram_handle || "",
      href: profile?.instagram_handle
        ? `https://instagram.com/${profile.instagram_handle}`
        : null,
    },
    {
      key: "tiktok",
      label: "TikTok",
      icon: Music2,
      handle: profile?.tiktok_handle || "",
      href: profile?.tiktok_handle
        ? `https://tiktok.com/@${profile.tiktok_handle}`
        : null,
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: Youtube,
      handle: profile?.youtube_handle || "",
      href: profile?.youtube_handle
        ? `https://youtube.com/@${profile.youtube_handle}`
        : null,
    },
    {
      key: "portfolio",
      label: "Portfolio",
      icon: Globe,
      handle: profile?.portfolio_url || "",
      href: profile?.portfolio_url || null,
    },
  ];

  return (
    <>
      <TopBar title="Profile" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto space-y-6">
        {/* Header card */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-6 flex items-start gap-5">
            {profile?.cover_photo_url ? (
              <div className="hidden sm:block w-32 shrink-0 aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-br from-brand-mist to-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.cover_photo_url}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <span className="h-20 w-20 shrink-0 rounded-full overflow-hidden bg-brand-sky text-white text-2xl font-semibold flex items-center justify-center sm:hidden">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </span>
            <span className="hidden sm:flex h-20 w-20 shrink-0 rounded-full overflow-hidden bg-brand-sky text-white text-2xl font-semibold items-center justify-center">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-brand-ink">{name}</h2>
              {profile?.handle ? (
                <p className="text-sm text-slate-500">@{profile.handle}</p>
              ) : null}
              <p className="mt-2 text-sm text-slate-600">
                {profile?.bio || "Add a short bio so brands know who you are."}
              </p>
            </div>
            <Link
              href="/dashboard/creator/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <Pencil size={14} />
              Edit
            </Link>
          </div>

          {niches.length > 0 && (
            <div className="px-6 pb-6 flex flex-wrap gap-2">
              {niches.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-brand-mist text-brand-skyDeep"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stripe payouts */}
        <StripePayoutsCard />

        {/* Socials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-brand-ink mb-3">
            Where to find me
          </h3>
          <ul className="space-y-2 text-sm">
            {socials.map(({ key, label, icon: Icon, handle, href }) => (
              <li key={key} className="flex items-center gap-2">
                <Icon
                  size={16}
                  className={handle ? "text-brand-skyDeep" : "text-slate-400"}
                />
                {handle && href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-skyDeep hover:underline truncate"
                  >
                    {key === "portfolio" ? handle : `@${handle}`}
                  </a>
                ) : (
                  <span className="text-slate-400">{label} not linked</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Portfolio */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-brand-ink">
              Showcase your work
            </h3>
            <span className="text-xs text-slate-500">
              {portfolioVideos.length}/3
            </span>
          </div>

          {portfolioVideos.length > 0 ? (
            <PortfolioVideosGrid videos={portfolioVideos} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center">
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Upload up to 3 sample videos so brands can preview your style.
              </p>
              <Link
                href="/dashboard/creator/profile/edit"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-skyDeep px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-skyDeep/90"
              >
                <Pencil size={12} /> Add videos
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
