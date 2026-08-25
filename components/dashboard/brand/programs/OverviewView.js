"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Eye, Film, ExternalLink, TrendingUp, RefreshCw } from "lucide-react";
import ProgramStatStrip from "@/components/dashboard/brand/programs/ProgramStatStrip";
import ProgramMetricsChart from "@/components/dashboard/brand/programs/ProgramMetricsChart";
import VideoThumb, { videoLabel } from "@/components/dashboard/brand/programs/VideoThumb";
import {
  fetchOverviewData,
  fetchMetricsHistory,
  buildMetricsFromSnapshots,
  buildProgramMetrics,
} from "@/lib/dashboard/brand/programsApi";
import { refreshTrackedMetrics } from "@/lib/dashboard/brand/trackedAccountsApi";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

export default function OverviewView() {
  const [stats, setStats] = useState({});
  const [series, setSeries] = useState([]);
  const [approximate, setApproximate] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [topVideos, setTopVideos] = useState([]);
  const [topAccounts, setTopAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const [overview, snapshots] = await Promise.all([
      fetchOverviewData(),
      fetchMetricsHistory().catch(() => []),
    ]);
    const { videos, accounts } = overview;

    // Prefer real recorded history; fall back to the post-date approximation
    // until there are at least two days of snapshots to plot.
    const metrics =
      buildMetricsFromSnapshots(snapshots) || buildProgramMetrics(videos);

    setStats({ ...overview.stats, deltas: metrics.deltas });
    setSeries(metrics.series);
    setApproximate(metrics.approximate);
    setLastSyncedAt(overview.lastSyncedAt);
    setTopVideos([...videos].sort((a, b) => b.views - a.views).slice(0, 5));
    setTopAccounts([...accounts].sort((a, b) => b.views - a.views).slice(0, 5));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load analytics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setErr("");
    try {
      await refreshTrackedMetrics();
      await load();
    } catch (e) {
      setErr(e.message || "Couldn't refresh metrics.");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {err && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:bg-surface-sunken transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <ProgramStatStrip stats={stats} />

      <ProgramMetricsChart
        series={series}
        approximate={approximate}
        lastSyncedAt={lastSyncedAt}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Videos */}
        <Panel title="Top Videos" icon={Film}>
          {topVideos.length === 0 ? (
            <EmptyPanel text="No videos tracked yet." />
          ) : (
            <ul className="divide-y divide-line">
              {topVideos.map((v, i) => (
                <li key={v.id} className="flex items-center gap-3 py-3">
                  <span className="text-xs font-semibold text-faint w-4 text-center">
                    {i + 1}
                  </span>
                  <VideoThumb
                    coverImageUrl={v.coverImageUrl}
                    creatorAvatarUrl={v.creatorAvatarUrl}
                    creatorName={v.creatorName}
                    className="h-9 w-9 rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium text-ink truncate"
                      title={v.caption || undefined}
                    >
                      {videoLabel(v)}
                    </p>
                    <p className="text-xs text-faint truncate">
                      {v.creatorName} · {v.sourceLabel}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium text-ink tabular-nums">
                    <Eye size={13} className="text-faint" />
                    {formatCompact(v.views)}
                  </span>
                  {v.videoUrl && (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-faint hover:text-accent transition"
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
            <ul className="divide-y divide-line">
              {topAccounts.map((a, i) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <span className="text-xs font-semibold text-faint w-4 text-center">
                    {i + 1}
                  </span>
                  <Avatar name={a.name} url={a.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{a.name}</p>
                    <p className="text-xs text-faint truncate">
                      {a.source === "tracked"
                        ? a.sourceLabel
                        : a.tiktokHandle
                        ? `@${a.tiktokHandle}`
                        : a.programTitle}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-muted tabular-nums">
                    <Film size={12} className="text-faint" />
                    {a.videoCount}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-ink tabular-nums">
                    <Eye size={13} className="text-faint" />
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
    <section className="rounded-2xl border border-line bg-surface">
      <div className="px-5 py-4 border-b border-line flex items-center gap-2">
        <Icon size={15} className="text-accent" />
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      <div className="px-5 py-1">{children}</div>
    </section>
  );
}

function EmptyPanel({ text }) {
  return <p className="py-8 text-center text-sm text-faint">{text}</p>;
}

function Avatar({ name, url }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <span className="h-8 w-8 rounded-full bg-accent-tint text-accent flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
      {name?.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}
