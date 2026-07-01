"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, Send, ArrowRight, Plus } from "lucide-react";

import TopBar from "@/components/dashboard/brand/TopBar";
import NeedsAttention from "@/components/dashboard/brand/NeedsAttention";
import ActiveBriefs from "@/components/dashboard/brand/ActiveBriefs";
import EmptyState from "@/components/dashboard/brand/EmptyState";
import { fetchMyBriefs } from "@/lib/dashboard/brand/briefsApi";
import { fetchMyCreators } from "@/lib/dashboard/brand/creatorsApi";
import {
  fetchDashboardStats,
  fetchAttentionItems,
} from "@/lib/dashboard/brand/dashboardApi";
import { useBrand } from "@/components/dashboard/brand/BrandProvider";

export default function BrandDashboardPage() {
  const searchParams = useSearchParams();
  const brand = useBrand();
  const forceEmpty = searchParams?.get("empty") === "1";

  const [briefs, setBriefs] = useState([]);
  const [myCreators, setMyCreators] = useState([]);
  const [stats, setStats] = useState({ activeBriefs: 0, connectedCreators: 0 });
  const [attention, setAttention] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [rows, creators, statsRes, attentionRes] = await Promise.all([
        fetchMyBriefs().catch(() => []),
        fetchMyCreators().catch(() => []),
        fetchDashboardStats().catch(() => ({ activeBriefs: 0, connectedCreators: 0 })),
        fetchAttentionItems().catch(() => []),
      ]);
      setBriefs(rows);
      setMyCreators(creators.filter((c) => c.connectionStatus === "active"));
      setStats(statsRes);
      setAttention(attentionRes);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAll().then(() => { if (cancelled) return; });
    const onChange = () => loadAll();
    window.addEventListener("briefs:changed", onChange);
    window.addEventListener("brand-creators:changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("briefs:changed", onChange);
      window.removeEventListener("brand-creators:changed", onChange);
    };
  }, [loadAll]);

  const activeBriefs = useMemo(() => briefs.filter((b) => b.status === "active"), [briefs]);
  const hasBriefs = !forceEmpty && loaded && activeBriefs.length > 0;
  const showEmpty = forceEmpty || (loaded && activeBriefs.length === 0);

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-8">

        {/* Page header with inline stats */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-ink">
              Welcome back, {brand.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 flex items-center gap-3">
              <span>
                <span className="font-semibold text-brand-ink">{stats.connectedCreators ?? myCreators.length}</span>
                {" "}creators on your team
              </span>
              <span className="text-slate-300">·</span>
              <span>
                <span className="font-semibold text-brand-ink">{stats.activeBriefs ?? activeBriefs.length}</span>
                {" "}active briefs
              </span>
            </p>
          </div>
          <Link
            href="/dashboard/brand/briefs/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-5 py-2.5 text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
          >
            <Send size={15} />
            Send Brief
          </Link>
        </div>

        {/* Two-column: Creator Team + Needs Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreatorTeam creators={myCreators} loaded={loaded} />
          <NeedsAttention items={attention} />
        </div>

        {/* Briefs section */}
        {hasBriefs ? (
          <ActiveBriefs briefs={activeBriefs} />
        ) : showEmpty ? (
          <EmptyState brandName={brand.name} />
        ) : null}

      </main>
    </>
  );
}

function CreatorTeam({ creators, loaded }) {
  const MAX_SHOW = 12;
  const shown = creators.slice(0, MAX_SHOW);
  const overflow = creators.length - MAX_SHOW;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
          <Users size={15} className="text-brand-skyDeep" />
          Your Creator Team
          {creators.length > 0 && (
            <span className="ml-1 text-xs font-medium text-slate-400">
              ({creators.length})
            </span>
          )}
        </h2>
        <Link
          href="/dashboard/brand/my-creators"
          className="text-xs text-brand-skyDeep hover:underline underline-offset-2 flex items-center gap-1"
        >
          Manage
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="p-5">
        {!loaded ? (
          <div className="h-20 flex items-center justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-brand-skyDeep border-t-transparent animate-spin" />
          </div>
        ) : creators.length === 0 ? (
          <div className="text-center py-6">
            <div className="mx-auto h-12 w-12 rounded-xl bg-brand-mist flex items-center justify-center mb-3">
              <Users size={20} className="text-brand-skyDeep" />
            </div>
            <p className="text-sm font-medium text-brand-ink">No creators yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              Find creators to build your team.
            </p>
            <Link
              href="/dashboard/brand/creators"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-skyDeep hover:underline"
            >
              <Plus size={14} />
              Browse creators
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Avatar grid */}
            <div className="flex flex-wrap gap-2">
              {shown.map((c) => (
                <div key={c.id} className="relative group" title={c.name}>
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatarUrl}
                      alt={c.name}
                      className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <span className="h-10 w-10 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-xs font-semibold border-2 border-white shadow-sm">
                      {c.name?.slice(0, 2).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
              ))}
              {overflow > 0 && (
                <span className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-semibold border-2 border-white shadow-sm">
                  +{overflow}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <Link
                href="/dashboard/brand/briefs/new"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-ink text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-800 transition"
              >
                <Send size={14} />
                Send Brief to Team
              </Link>
              <Link
                href="/dashboard/brand/creators"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-brand-ink transition"
              >
                <Plus size={14} />
                Add
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
