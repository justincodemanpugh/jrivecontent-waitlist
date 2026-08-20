"use client";

import { Instagram, Music2, Youtube, MapPin, UserPlus, Clock, CheckCircle2 } from "lucide-react";

// Browse card. Tapping anywhere on the card opens the profile modal; the
// "Connect" button is a separate target that triggers the connection flow.
export default function CreatorCard({
  creator,
  connectionStatus, // null | 'pending' | 'active'
  isPro,
  onOpen,
  onConnect,
}) {
  const initials = deriveInitials(creator.name);

  return (
    <button
      type="button"
      onClick={() => onOpen(creator)}
      className="group text-left rounded-2xl overflow-hidden border border-line bg-surface hover:border-accent-soft/60 hover:shadow-md transition flex flex-col"
    >
      {/* Cover (portrait 9:16, like TikTok) */}
      <div className="relative aspect-[9/16] w-full bg-gradient-to-br from-accent-tint to-surface-hover">
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
          <div className="h-full w-full flex items-center justify-center text-4xl font-bold text-faint">
            {initials}
          </div>
        )}

        {/* Social pills top-left */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {creator.instagram ? (
            <span className="h-6 w-6 rounded-full bg-surface/95 flex items-center justify-center text-ink-soft shadow-sm">
              <Instagram size={12} />
            </span>
          ) : null}
          {creator.tiktok ? (
            <span className="h-6 w-6 rounded-full bg-surface/95 flex items-center justify-center text-ink-soft shadow-sm">
              <Music2 size={12} />
            </span>
          ) : null}
          {creator.youtube ? (
            <span className="h-6 w-6 rounded-full bg-surface/95 flex items-center justify-center text-ink-soft shadow-sm">
              <Youtube size={12} />
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="font-semibold text-sm text-ink truncate">
            {creator.name}
          </p>
          <p className="text-[11px] text-muted truncate inline-flex items-center gap-1">
            {creator.location ? (
              <>
                <MapPin size={11} className="text-faint" />
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
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent-tint text-accent"
            >
              {n}
            </span>
          ))}
          {creator.rateMin || creator.rateMax ? (
            <span className="ml-auto text-[10px] font-semibold text-success">
              {formatRate(creator.rateMin, creator.rateMax)}
            </span>
          ) : null}
        </div>

        {/* Connect button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (!connectionStatus) {
              onConnect(creator);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              if (!connectionStatus) {
                onConnect(creator);
              }
            }
          }}
          className={`mt-1 w-full inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
            connectionStatus === "active"
              ? "bg-success-soft text-success border border-success-line"
              : connectionStatus === "pending"
              ? "bg-warn-soft text-warn border border-warn-line"
              : "bg-ink text-on-accent hover:bg-ink/90"
          }`}
        >
          {connectionStatus === "active" ? (
            <>
              <CheckCircle2 size={12} />
              Connected
            </>
          ) : connectionStatus === "pending" ? (
            <>
              <Clock size={12} />
              Pending
            </>
          ) : (
            <>
              <UserPlus size={12} />
              Connect
            </>
          )}
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
