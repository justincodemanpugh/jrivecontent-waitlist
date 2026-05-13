"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import MarketplaceGigCard from "@/components/dashboard/creator/explore/MarketplaceGigCard";
import { fetchMarketplaceGigs } from "@/lib/dashboard/marketplaceApi";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";

// Pull a small slice of live marketplace gigs for the home page. We rank by
// niche overlap with the creator's saved niches when available so the
// "Recommended for you" framing matches reality, then fall back to the
// freshest open gigs.
function rankByNicheOverlap(gigs, niches) {
  if (!Array.isArray(niches) || niches.length === 0) return gigs;
  const lower = niches.map((n) => String(n).toLowerCase());
  const score = (g) => {
    const hay = `${g.title} ${g.brandIndustry || ""}`.toLowerCase();
    return lower.reduce((n, kw) => n + (hay.includes(kw) ? 1 : 0), 0);
  };
  return [...gigs].sort((a, b) => score(b) - score(a));
}

export default function RecommendedGigs({ limit = 3 }) {
  const creator = useCreator();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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

  const visible = rankByNicheOverlap(gigs, creator?.niches).slice(0, limit);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-brand-ink">
          Recommended for you
        </h2>
        <Link
          href="/dashboard/creator/explore"
          className="text-sm text-brand-skyDeep hover:underline inline-flex items-center gap-1"
        >
          See all <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 flex items-center justify-center text-slate-400">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : err ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </p>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            No open gigs yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((g) => (
            <MarketplaceGigCard key={g.id} gig={g} />
          ))}
        </div>
      )}
    </section>
  );
}
