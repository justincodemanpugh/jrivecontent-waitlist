import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

// Server component. Renders a profile completeness checklist for the creator
// profile page. Highlights missing items (especially cover photo) so creators
// are nudged toward a complete, brand-ready profile.
export default function ProfileCompletenessCard({ profile, videoCount = 0 }) {
  const items = [
    {
      key: "display_name",
      label: "Display name",
      done: Boolean(profile?.display_name),
    },
    {
      key: "avatar",
      label: "Profile photo",
      done: Boolean(profile?.avatar_url),
    },
    {
      key: "cover",
      label: "Cover photo",
      done: Boolean(profile?.cover_photo_url),
      emphasize: true,
    },
    {
      key: "bio",
      label: "Short bio",
      done: Boolean(profile?.bio && profile.bio.trim().length > 0),
    },
    {
      key: "niches",
      label: "Niches",
      done: Array.isArray(profile?.niches) && profile.niches.length > 0,
    },
    {
      key: "social",
      label: "At least one social link",
      done: Boolean(
        profile?.instagram_handle ||
          profile?.tiktok_handle ||
          profile?.youtube_handle ||
          profile?.portfolio_url,
      ),
    },
    {
      key: "videos",
      label: "Example video",
      done: videoCount > 0,
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const percent = Math.round((completed / total) * 100);
  const allDone = completed === total;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-brand-ink">
            Profile completeness
          </h3>
          <p className="text-xs text-slate-500">
            {allDone
              ? "Nice — your profile is ready for brands."
              : "Complete your profile to get noticed by more brands."}
          </p>
        </div>
        <span className="text-sm font-semibold text-brand-skyDeep">
          {percent}%
        </span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-brand-skyDeep transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li
            key={it.key}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            {it.done ? (
              <CheckCircle2
                size={16}
                className="text-emerald-500 shrink-0"
              />
            ) : (
              <Circle size={16} className="text-slate-300 shrink-0" />
            )}
            <span className={it.done ? "text-slate-500 line-through" : ""}>
              {it.label}
            </span>
            {!it.done && it.emphasize && (
              <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                Recommended
              </span>
            )}
          </li>
        ))}
      </ul>

      {!allDone && (
        <Link
          href="/dashboard/creator/profile/edit"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-skyDeep hover:underline"
        >
          Finish setup <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
