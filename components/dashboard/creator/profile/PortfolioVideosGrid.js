"use client";

import { createClient } from "@/lib/supabase/client";

// Read-only video grid for the main profile page.
export default function PortfolioVideosGrid({ videos }) {
  const supabase = createClient();
  const publicUrl = (path) =>
    supabase.storage.from("creator-portfolio").getPublicUrl(path).data.publicUrl;

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {videos.map((v) => (
        <li
          key={v.id}
          className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[9/16]"
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
      ))}
    </ul>
  );
}
