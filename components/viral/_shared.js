import { Instagram, Youtube, Facebook } from "lucide-react";

/* ---------- TikTok glyph (lucide has no TikTok icon) ---------- */
export function TikTokGlyph({ size = 16, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.5 3c.3 2 1.6 3.6 3.5 3.9v2.5c-1.3.1-2.5-.3-3.5-1v6.1a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.6a2.9 2.9 0 1 0 2 2.8V3h2.6Z"
      />
    </svg>
  );
}

/* ---------- Coloured platform icon chips ---------- */
export const PLATFORMS = {
  tiktok: { bg: "bg-brand-ink", Icon: TikTokGlyph },
  instagram: { bg: "bg-gradient-to-br from-brand-skyDeep to-brand-sky", Icon: Instagram },
  youtube: { bg: "bg-red-500", Icon: Youtube },
  facebook: { bg: "bg-blue-600", Icon: Facebook },
};

export function PlatformChips({ className = "", only = ["tiktok", "instagram", "youtube", "facebook"] }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {only.map((key) => {
        const { bg, Icon } = PLATFORMS[key];
        return (
          <span
            key={key}
            className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-white shadow-sm ${bg}`}
          >
            <Icon size={13} />
          </span>
        );
      })}
    </span>
  );
}
