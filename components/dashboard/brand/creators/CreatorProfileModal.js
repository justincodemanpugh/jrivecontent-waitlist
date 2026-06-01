"use client";

import { useEffect } from "react";
import {
  X,
  Instagram,
  Youtube,
  Music2,
  Globe,
  MapPin,
  Send,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Read-only profile detail. The brand opens this from the browse grid; the
// invite button defers to the InviteDialog (mounted by the parent view).
export default function CreatorProfileModal({
  creator,
  invited,
  isPro,
  onClose,
  onInvite,
}) {
  // Resolve portfolio URLs once per render.
  const supabase = createClient();
  const portfolioUrls = (creator.portfolioVideos || []).map((v) => ({
    id: v.id,
    url: supabase.storage
      .from("creator-portfolio")
      .getPublicUrl(v.storage_path).data.publicUrl,
  }));

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const initials = deriveInitials(creator.name);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto sm:rounded-2xl shadow-xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white text-slate-700 shadow border border-slate-200 flex items-center justify-center hover:bg-slate-50"
        >
          <X size={16} />
        </button>

        {/* Header: portrait cover + identity */}
        <div className="p-5 sm:p-6 flex items-start gap-4 sm:gap-5">
          {creator.coverUrl ? (
            <div className="w-28 sm:w-36 shrink-0 aspect-[9/16] rounded-xl overflow-hidden bg-gradient-to-br from-brand-mist to-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creator.coverUrl}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <span className="h-20 w-20 rounded-full overflow-hidden bg-brand-sky text-white text-2xl font-semibold flex items-center justify-center shrink-0">
              {creator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </span>
          )}
          <div className="flex-1 min-w-0">
            {creator.coverUrl && creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="mb-2 h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : null}
            <h2 className="text-xl font-semibold text-brand-ink truncate">
              {creator.name}
            </h2>
            <p className="text-sm text-slate-500 inline-flex items-center gap-1.5 truncate">
              {creator.handle ? `@${creator.handle}` : "Creator"}
              {creator.location ? (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {creator.location}
                  </span>
                </>
              ) : null}
            </p>
            <button
              type="button"
              onClick={() => onInvite(creator)}
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                invited
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : !isPro
                    ? "bg-slate-100 text-slate-500 border border-slate-200"
                    : "bg-brand-ink text-white hover:bg-slate-800"
              }`}
            >
              {invited ? <Send size={14} /> : !isPro ? <Lock size={14} /> : <Send size={14} />}
              {invited ? "Invited" : "Invite to gig"}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 pb-6 space-y-5">
          {creator.bio ? (
            <p className="text-sm text-slate-700 leading-relaxed">
              {creator.bio}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">
              This creator hasn&apos;t written a bio yet.
            </p>
          )}

          {creator.niches.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {creator.niches.map((n) => (
                <span
                  key={n}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-mist text-brand-skyDeep"
                >
                  {n}
                </span>
              ))}
            </div>
          ) : null}

          {/* Rate */}
          {creator.rateMin || creator.rateMax ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-brand-ink">Typical rate: </span>
              {formatRate(creator.rateMin, creator.rateMax)} per video
            </div>
          ) : null}

          {/* Socials */}
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Where to find them
            </h3>
            <ul className="space-y-1.5 text-sm">
              <SocialRow
                icon={Instagram}
                label="Instagram"
                handle={creator.instagram}
                href={
                  creator.instagram
                    ? `https://instagram.com/${creator.instagram}`
                    : null
                }
              />
              <SocialRow
                icon={Music2}
                label="TikTok"
                handle={creator.tiktok}
                href={
                  creator.tiktok
                    ? `https://tiktok.com/@${creator.tiktok}`
                    : null
                }
              />
              <SocialRow
                icon={Youtube}
                label="YouTube"
                handle={creator.youtube}
                href={
                  creator.youtube
                    ? `https://youtube.com/@${creator.youtube}`
                    : null
                }
              />
              <SocialRow
                icon={Globe}
                label="Portfolio"
                handle={creator.portfolioUrl}
                href={creator.portfolioUrl || null}
                rawUrl
              />
            </ul>
          </div>

          {/* Portfolio videos */}
          <div>
            <h3 className="text-sm font-semibold text-brand-ink mb-2">
              Sample work
            </h3>
            {portfolioUrls.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                No videos uploaded yet.
              </p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {portfolioUrls.map((v) => (
                  <li
                    key={v.id}
                    className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[9/16]"
                  >
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      src={v.url}
                      className="h-full w-full object-cover"
                      controls
                      preload="metadata"
                      playsInline
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialRow({ icon: Icon, label, handle, href, rawUrl }) {
  const has = Boolean(handle && href);
  return (
    <li className="flex items-center gap-2">
      <Icon
        size={14}
        className={has ? "text-brand-skyDeep" : "text-slate-400"}
      />
      {has ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-skyDeep hover:underline truncate"
        >
          {rawUrl ? handle : `@${handle}`}
        </a>
      ) : (
        <span className="text-slate-400">{label} not linked</span>
      )}
    </li>
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
  return "—";
}
