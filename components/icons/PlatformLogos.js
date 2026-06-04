// Official-style brand logos for the creator portfolio platforms.
// Kept as inline SVGs so they render crisply at any size without extra deps.

export function InstagramLogo({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="#fff" />
    </svg>
  );
}

export function TikTokLogo({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" fill="#010101" />
      <path
        d="M16.8 8.3a3.3 3.3 0 0 1-2-2.3h-1.9v7.9a1.9 1.9 0 1 1-1.9-1.9c.2 0 .3 0 .5.1V10a3.8 3.8 0 1 0 3.3 3.8V9.9a5 5 0 0 0 2.5.8V8.5l-.5-.2z"
        fill="#fff"
      />
    </svg>
  );
}

export function YouTubeLogo({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
      <path d="M10 9l5 3-5 3V9z" fill="#fff" />
    </svg>
  );
}

const LOGOS = {
  instagram: InstagramLogo,
  tiktok: TikTokLogo,
  youtube: YouTubeLogo,
};

export const PLATFORM_LABELS = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

// Convenience renderer: <PlatformLogo platform="tiktok" size={18} />
export function PlatformLogo({ platform, size = 20, className = "" }) {
  const Logo = LOGOS[platform];
  if (!Logo) return null;
  return <Logo size={size} className={className} />;
}
