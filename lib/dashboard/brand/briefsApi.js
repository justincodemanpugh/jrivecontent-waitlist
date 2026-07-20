// Platform label helper for the creator assignment flow. The brand-facing
// briefs UI has been removed in favor of Programs, but assignments created
// from briefs still carry a platform key that needs a display label.

export const BRIEF_PLATFORMS = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "all", label: "All platforms" },
];

export function briefPlatformLabel(key) {
  return BRIEF_PLATFORMS.find((p) => p.key === key)?.label || null;
}
