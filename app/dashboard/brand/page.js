"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import TopBar from "@/components/dashboard/brand/TopBar";
import StatStrip from "@/components/dashboard/brand/StatStrip";
import NeedsAttention from "@/components/dashboard/brand/NeedsAttention";
import ActiveGigs from "@/components/dashboard/brand/ActiveGigs";
import EmptyState from "@/components/dashboard/brand/EmptyState";
import { mockStats, mockAttentionItems } from "@/lib/dashboard/brand/mockData";
import { fetchMyGigs } from "@/lib/dashboard/brand/gigsApi";
import { useBrand } from "@/components/dashboard/brand/BrandProvider";

export default function BrandDashboardPage() {
  const searchParams = useSearchParams();
  const brand = useBrand();
  // ?empty=1 forces the first-time-user empty state for previewing.
  const forceEmpty = searchParams?.get("empty") === "1";

  const [gigs, setGigs] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchMyGigs();
        if (!cancelled) setGigs(rows);
      } catch {
        if (!cancelled) setGigs([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    load();
    const onChange = () => load();
    window.addEventListener("gigs:changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("gigs:changed", onChange);
    };
  }, []);

  const activeGigs = useMemo(
    () => gigs.filter((g) => g.isActive),
    [gigs],
  );

  const hasGigs = !forceEmpty && loaded && activeGigs.length > 0;
  const showEmpty = forceEmpty || (loaded && activeGigs.length === 0);

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
            Welcome back, {brand.name} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Here&apos;s what&apos;s happening with your gigs today.
          </p>
        </div>

        {hasGigs ? (
          <>
            <StatStrip stats={mockStats} />
            <NeedsAttention items={mockAttentionItems} />
            <ActiveGigs gigs={activeGigs} />
          </>
        ) : showEmpty ? (
          <EmptyState brandName={brand.name} />
        ) : null}
      </main>
    </>
  );
}
