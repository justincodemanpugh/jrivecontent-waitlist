"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Eye, Heart, Film, ExternalLink, TrendingUp } from "lucide-react";
import ProgramStatStrip from "@/components/dashboard/brand/programs/ProgramStatStrip";
import ProgramMetricsChart from "@/components/dashboard/brand/programs/ProgramMetricsChart";
import {
  fetchProgramStats,
  fetchProgramVideos,
  fetchProgramAccounts,
  buildProgramMetrics,
} from "@/lib/dashboard/brand/programsApi";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

export default function OverviewView() {
  const [stats, setStats] = useState({});
  const [series, setSeries] = useState([]);
  const [topVideos, setTopVideos] = useState([]);
  const [topAccounts, setTopAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, videos, accounts] = await Promise.all([
          fetchProgramStats(),
          fetchProgramVideos().catch(() => []),
          fetchProgramAccounts().catch(() => []),
        ]);
        if (cancelled) return;
        const { series: metricSeries, deltas } = buildProgramMetrics(videos);
        setStats({ ...statsRes, deltas });
        setSeries(metricSeries);
        setTopVideos(
          [...videos].sort((a, b) => b.views - a.views).slice(0, 5),
        );
        setTopAccounts(
          [...accounts].sort((a, b) => b.views - a.views).slice(0, 5),
        );
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
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

  return (
    <div className="space-y-6">
      <ProgramStatStrip stats={stats} />

      <ProgramMetricsChart series={series} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Videos */}
        <Panel title="Top Videos" icon={Film}>
          {topVideos.length === 0 ? (
            <EmptyPanel text="No videos tracked yet." />
          ) : (
            <ul className="divide-y divide-slate-50">
              {topVideos.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3 py-3">
                  <span className="text-xs font-semibold text-slate-400 w-4 text-center">
                    {i + 1}
                  </span>
                  <Avatar name={v.creatorName} url={v.creatorAvatarUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-ink truncate">
                      {v.creatorName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{v.programTitle}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-brand-ink tabular-nums">
                    <Eye size={13} className="text-slate-400" />
                    {formatCompact(v.views)}
                  </span>
                  {v.videoUrl && (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-300 hover:text-brand-skyDeep transition"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Top Accounts */}
        <Panel title="Top Accounts" icon={TrendingUp}>
          {topAccounts.length === 0 ? (
            <EmptyPanel text="No accounts tracked yet." />
          ) : (
            <ul className="divide-y divide-slate-50">
              {topAccounts.map((a, i) => (
                <li key={a.memberId} className="flex items-center gap-3 py-3">
                  <span className="text-xs font-semibold text-slate-400 w-4 text-center">
                    {i + 1}
                  </span>
                  <Avatar name={a.name} url={a.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-ink truncate">{a.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {a.tiktokHandle ? `@${a.tiktokHandle}` : a.programTitle}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-slate-500 tabular-nums">
                    <Film size={12} className="text-slate-400" />
                    {a.videoCount}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-brand-ink tabular-nums">
                    <Eye size={13} className="text-slate-400" />
                    {formatCompact(a.views)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Icon size={15} className="text-brand-skyDeep" />
        <h2 className="text-sm font-semibold text-brand-ink">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </section>
  );
}

function EmptyPanel({ text }) {
  return <p className="py-8 text-center text-sm text-slate-400">{text}</p>;
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
