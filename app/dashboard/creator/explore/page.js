"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import TopBar from "@/components/dashboard/creator/TopBar";
import MarketplaceGigCard from "@/components/dashboard/creator/explore/MarketplaceGigCard";
import { fetchMarketplaceGigs } from "@/lib/dashboard/marketplaceApi";

export default function ExploreGigsPage() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchMarketplaceGigs();
        if (!cancelled) setGigs(rows);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load gigs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    if (!query.trim()) return gigs;
    const q = query.trim().toLowerCase();
    return gigs.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.brandName || "").toLowerCase().includes(q),
    );
  }, [gigs, query]);

  return (
    <>
      <TopBar title="Explore Gigs" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-6">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gigs by name or brand"
            className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
          />
        </div>

        {err ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              {gigs.length === 0
                ? "No open gigs yet. Check back soon!"
                : "No gigs match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((g) => (
              <MarketplaceGigCard key={g.id} gig={g} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
