"use client";

import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PlatformLogo, PLATFORM_LABELS } from "@/components/icons/PlatformLogos";

// Read-only video grid for the main profile page. Link-based videos show a
// thumbnail with a platform badge and open the original post; legacy uploaded
// videos still play inline.
export default function PortfolioVideosGrid({ videos }) {
  const supabase = createClient();
  const publicUrl = (path) =>
    supabase.storage.from("creator-portfolio").getPublicUrl(path).data.publicUrl;

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {videos.map((v) => {
        const isLink = Boolean(v.video_url);

        if (!isLink) {
          return (
            <li
              key={v.id}
              className="rounded-xl overflow-hidden border border-line bg-surface-hover aspect-[9/16]"
            >
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                src={publicUrl(v.storage_path)}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
                playsInline
              />
            </li>
          );
        }

        return (
          <li
            key={v.id}
            className="relative rounded-xl overflow-hidden border border-line bg-surface-hover aspect-[9/16] group"
          >
            <a
              href={v.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
            >
              {v.thumbnail_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={publicUrl(v.thumbnail_path)}
                  alt={v.title || "Video thumbnail"}
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-surface-hover">
                  <PlatformLogo platform={v.platform} size={44} />
                </div>
              )}

              <span className="absolute top-2 left-2 inline-flex items-center justify-center rounded-full bg-surface/90 p-1 shadow-sm">
                <PlatformLogo platform={v.platform} size={16} />
              </span>

              <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/75 to-transparent p-2 text-xs font-medium text-white">
                <span className="truncate">{v.title || PLATFORM_LABELS[v.platform]}</span>
                <ExternalLink size={12} className="ml-auto shrink-0" />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
