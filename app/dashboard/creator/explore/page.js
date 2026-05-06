"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import TopBar from "@/components/dashboard/creator/TopBar";
import {
  CATEGORIES,
  mockOpenGigs,
} from "@/lib/dashboard/creator/mockData";

export default function ExploreGigsPage() {
  const [activeCats, setActiveCats] = useState([]);
  const [query, setQuery] = useState("");

  const toggle = (cat) =>
    setActiveCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );

  const gigs = useMemo(() => {
    let rows = mockOpenGigs;
    if (activeCats.length > 0) {
      rows = rows.filter((g) => activeCats.includes(g.category));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [activeCats, query]);

  return (
    <>
      <TopBar title="Explore Gigs" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-6">
        {/* Search */}
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

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = activeCats.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggle(cat)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                  active
                    ? "bg-brand-ink text-white border-brand-ink"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-sky hover:text-brand-ink"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {gigs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              No gigs match your filters. Try clearing a category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function GigCard({ gig }) {
  return (
    <Link
      href={`/dashboard/creator/explore/${gig.id}`}
      className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-brand-sky hover:-translate-y-0.5 transition flex flex-col"
    >
      <div
        className={`h-32 bg-gradient-to-br ${gig.cover} relative flex items-start justify-end p-3`}
      >
        <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/90 text-brand-ink shadow-sm">
          ${gig.payout}/{gig.payoutUnit}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-brand-ink leading-snug group-hover:text-brand-skyDeep transition line-clamp-2">
          {gig.title}
        </h3>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700 truncate">
            {gig.brand}
          </span>
          <span>·</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-mist text-brand-skyDeep font-medium">
            {gig.tag}
          </span>
        </div>
      </div>
    </Link>
  );
}
