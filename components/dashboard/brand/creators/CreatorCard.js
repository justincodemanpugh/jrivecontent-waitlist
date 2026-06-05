"use client";

import { Instagram, Music2, Youtube, MapPin } from "lucide-react";

// Browse card. Tapping anywhere on the card opens the profile modal; the
// "Invite" button is a separate target that opens the invite dialog without
// also triggering the card click.
export default function CreatorCard({
  creator,
  invited,
  isPro,
  onOpen,
  onInvite,
}) {
  const initials = deriveInitials(creator.name);

  return (
    <button
      type="button"
      onClick={() => onOpen(creator)}
      className="group text-left rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-brand-sky/60 hover:shadow-md transition flex flex-col"
    >
      {/* Cover (portrait 9:16, like TikTok) */}
      <div className="relative aspect-[9/16] w-full bg-gradient-to-br from-brand-mist to-slate-100">
        {creator.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.coverUrl}
            alt={`${creator.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : creator.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.avatarUrl}
            alt={creator.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-slate-300">
            {initials}
          </div>
        )}

        {/* Social pills top-left */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {creator.instagram ? (
            <span className="h-6 w-6 rounded-full bg-white/95 flex items-center justify-center text-slate-700 shadow-sm">
              <Instagram size={12} />
            </span>
          ) : null}
          {creator.tiktok ? (
            <span className="h-6 w-6 rounded-full bg-white/95 flex items-center justify-center text-slate-700 shadow-sm">
              <Music2 size={12} />
            </span>
          ) : null}
          {creator.youtube ? (
            <span className="h-6 w-6 rounded-full bg-white/95 flex items-center justify-center text-slate-700 shadow-sm">
              <Youtube size={12} />
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="font-semibold text-sm text-brand-ink truncate">
            {creator.name}
          </p>
          <p className="text-[11px] text-slate-500 truncate inline-flex items-center gap-1">
            {creator.location ? (
              <>
                <MapPin size={11} className="text-slate-400" />
                {creator.location}
              </>
            ) : creator.handle ? (
              `@${creator.handle}`
            ) : (
              "Creator"
            )}
          </p>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {creator.niches.slice(0, 2).map((n) => (
            <span
              key={n}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-mist text-brand-skyDeep"
            >
              {n}
            </span>
          ))}
          {creator.rateMin || creator.rateMax ? (
            <span className="ml-auto text-[10px] font-semibold text-emerald-700">
              {formatRate(creator.rateMin, creator.rateMax)}
            </span>
          ) : null}
        </div>

        {/* Invite button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onInvite(creator);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              onInvite(creator);
            }
          }}
          className={`mt-1 w-full inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            invited
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-brand-ink text-white hover:bg-slate-800"
          }`}
        >
          {invited ? "Invited" : "Invite"}
        </span>
      </div>
    </button>
  );
}

function deriveInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatRate(min, max) {
  if (min && max && min !== max) return `$${min}–$${max}`;
  if (min) return `$${min}+`;
  if (max) return `$${max}`;
  return "";
}
