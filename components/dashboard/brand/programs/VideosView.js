"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Film, ExternalLink } from "lucide-react";
import { fetchProgramVideos } from "@/lib/dashboard/brand/programsApi";

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
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>;
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
          <Film size={20} />
        </span>
        <h2 className="text-lg font-semibold text-brand-ink">No videos tracked yet</h2>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          Once your program creators connect TikTok and post, their videos and
          performance metrics appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
              <th className="px-5 py-3 font-medium">Creator</th>
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
              <tr key={v.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={v.creatorName} url={v.creatorAvatarUrl} />
                    <span className="font-medium text-brand-ink truncate">{v.creatorName}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/dashboard/brand/programs/${v.programId}`}
                    className="text-brand-skyDeep hover:underline"
                  >
                    {v.programTitle}
                  </Link>
                </td>
                <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                  {formatDate(v.postedAt)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-brand-ink">
                  {formatCompact(v.views)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                  {formatCompact(v.likes)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                  {formatCompact(v.comments)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                  {formatCompact(v.shares)}
                </td>
                <td className="px-5 py-3 text-right">
                  {v.videoUrl && (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-300 hover:text-brand-skyDeep transition inline-flex"
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

function Avatar({ name, url }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <span className="h-8 w-8 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
      {name?.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}
