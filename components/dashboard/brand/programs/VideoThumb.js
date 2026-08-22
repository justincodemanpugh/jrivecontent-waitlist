"use client";

import { useEffect, useState } from "react";

// Thumbnail for a tracked video. TikTok's cover URLs are signed and expire
// between syncs, so a failed load silently falls back to the creator's avatar
// (and then to their initials) rather than showing a broken image.
export default function VideoThumb({
  coverImageUrl,
  creatorAvatarUrl,
  creatorName,
  className = "h-10 w-10 rounded-lg",
}) {
  const sources = [coverImageUrl, creatorAvatarUrl].filter(Boolean);
  const [index, setIndex] = useState(0);

  // A new row (or a refreshed cover) should retry from the top.
  useEffect(() => {
    setIndex(0);
  }, [coverImageUrl, creatorAvatarUrl]);

  const src = sources[index];

  if (!src) {
    return (
      <span
        className={`${className} bg-accent-tint text-accent flex items-center justify-center text-[10px] font-semibold flex-shrink-0`}
      >
        {creatorName?.slice(0, 2).toUpperCase() || "?"}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onError={() => setIndex((i) => i + 1)}
      className={`${className} object-cover flex-shrink-0 bg-surface-sunken`}
    />
  );
}

// TikTok posts can legitimately have no caption — fall back to something that
// still distinguishes the row.
export function videoLabel(video) {
  const caption = (video.caption || "").trim();
  if (caption) return caption;
  return video.postedAt
    ? `Untitled · ${new Date(video.postedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`
    : "Untitled video";
}
