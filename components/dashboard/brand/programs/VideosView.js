"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Film, ExternalLink } from "lucide-react";
import { fetchProgramVideos } from "@/lib/dashboard/brand/programsApi";
import VideoThumb, { videoLabel } from "./VideoThumb";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VideosView() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchProgramVideos()
      .then((rows) => {
        if (!cancelled) setVideos(rows);
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message || "Couldn't load videos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>;
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-tint text-accent mb-3">
          <Film size={20} />
        </span>
        <h2 className="text-lg font-semibold text-ink">No videos tracked yet</h2>
        <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
          Once your program creators connect TikTok and post, their videos and
          performance metrics appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Video</th>
              <th className="px-5 py-3 font-medium">Program</th>
              <th className="px-5 py-3 font-medium">Posted</th>
              <th className="px-5 py-3 font-medium text-right">Views</th>
              <th className="px-5 py-3 font-medium text-right">Likes</th>
              <th className="px-5 py-3 font-medium text-right">Comments</th>
              <th className="px-5 py-3 font-medium text-right">Shares</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 max-w-[320px]">
                  <div className="flex items-center gap-2.5">
                    <VideoThumb
                      coverImageUrl={v.coverImageUrl}
                      creatorAvatarUrl={v.creatorAvatarUrl}
                      creatorName={v.creatorName}
                    />
                    <span className="min-w-0">
                      <span
                        className="block font-medium text-ink truncate"
                        title={v.caption || undefined}
                      >
                        {videoLabel(v)}
                      </span>
                      <span className="block text-xs text-muted truncate">
                        {v.creatorName}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/dashboard/brand/programs/${v.programId}`}
                    className="text-accent hover:underline"
                  >
                    {v.programTitle}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {formatDate(v.postedAt)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-ink">
                  {formatCompact(v.views)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {formatCompact(v.likes)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {formatCompact(v.comments)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {formatCompact(v.shares)}
                </td>
                <td className="px-5 py-3 text-right">
                  {v.videoUrl && (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-faint hover:text-accent transition inline-flex"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

