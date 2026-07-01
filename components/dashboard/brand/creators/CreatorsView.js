"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Users, SlidersHorizontal, X, Check } from "lucide-react";
import {
  fetchAllCreators,
  fetchConnectionStatusForCreators,
  connectWithCreator,
} from "@/lib/dashboard/brand/creatorsApi";
import { fetchBilling } from "@/lib/dashboard/brand/billingApi";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";
import CreatorCard from "./CreatorCard";
import CreatorProfileModal from "./CreatorProfileModal";

const PLATFORMS = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
];

export default function CreatorsView() {
  const [creators, setCreators] = useState([]);
  const [connectionMap, setConnectionMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [openCreator, setOpenCreator] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [connecting, setConnecting] = useState(null);

  // Filters
  const [selectedNiches, setSelectedNiches] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  async function reload() {
    setLoading(true);
    setErr("");
    try {
      const [rows, billing] = await Promise.all([fetchAllCreators(), fetchBilling()]);
      setCreators(rows);
      setIsPro(billing?.plan === "pro");
      const ids = rows.map((r) => r.id);
      const connections = await fetchConnectionStatusForCreators(ids);
      const map = new Map();
      for (const c of connections) map.set(c.creator_id, c.status);
      setConnectionMap(map);
    } catch (e) {
      setErr(e.message || "Couldn't load creators.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    function refresh() { reload(); }
    if (typeof window !== "undefined") {
      window.addEventListener("brand-creators:changed", refresh);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("brand-creators:changed", refresh);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (creator) => {
    setConnecting(creator.id);
    try {
      await connectWithCreator(creator.id);
      setConnectionMap((prev) => {
        const next = new Map(prev);
        next.set(creator.id, "active");
        return next;
      });
    } catch (e) {
      alert(e.message || "Failed to connect.");
    } finally {
      setConnecting(null);
    }
  };

  const toggleNiche = (n) =>
    setSelectedNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );

  const togglePlatform = (p) =>
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const clearFilters = () => {
    setSelectedNiches([]);
    setSelectedPlatforms([]);
    setQuery("");
  };

  const hasActiveFilters = selectedNiches.length > 0 || selectedPlatforms.length > 0 || query.trim();
  const activeFilterCount = selectedNiches.length + selectedPlatforms.length;

  const filtered = useMemo(() => {
    let list = creators;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.handle.toLowerCase().includes(q) ||
          c.niches.some((n) => n.toLowerCase().includes(q)) ||
          c.bio.toLowerCase().includes(q)
      );
    }

    if (selectedNiches.length > 0) {
      list = list.filter((c) => selectedNiches.every((n) => c.niches.includes(n)));
    }

    if (selectedPlatforms.length > 0) {
      list = list.filter((c) =>
        selectedPlatforms.some((p) => {
          if (p === "tiktok") return !!c.tiktok;
          if (p === "instagram") return !!c.instagram;
          if (p === "youtube") return !!c.youtube;
          return false;
        })
      );
    }

    return list;
  }, [creators, query, selectedNiches, selectedPlatforms]);

  return (
    <div className="flex gap-6 items-start">
      {/* Filter sidebar — desktop */}
      <aside className="hidden lg:block w-52 flex-shrink-0 space-y-5 sticky top-24">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-brand-ink uppercase tracking-wide">Filters</span>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="text-xs text-brand-skyDeep hover:underline">
              Clear all
            </button>
          )}
        </div>

        {/* Platform */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Platform</p>
          <div className="space-y-1">
            {PLATFORMS.map((p) => {
              const active = selectedPlatforms.includes(p.key);
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePlatform(p.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition ${
                    active
                      ? "bg-brand-mist text-brand-ink font-medium border border-brand-skyDeep/40"
                      : "text-slate-600 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  {active
                    ? <Check size={13} className="text-brand-skyDeep flex-shrink-0" />
                    : <span className="w-[13px]" />}
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Niches */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Niche</p>
          <div className="flex flex-wrap gap-1.5">
            {CREATOR_NICHES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => toggleNiche(n)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  selectedNiches.includes(n)
                    ? "bg-brand-mist border-brand-skyDeep text-brand-ink"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Search + mobile filter toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-2">
            <Search size={16} className="text-slate-400 ml-1 flex-shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or niche…"
              className="flex-1 bg-transparent text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none min-w-0"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className={`lg:hidden flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
              activeFilterCount > 0
                ? "border-brand-skyDeep bg-brand-mist text-brand-ink"
                : "border-slate-200 text-slate-600 bg-white"
            }`}
          >
            <SlidersHorizontal size={15} />
            {activeFilterCount > 0 ? activeFilterCount : "Filter"}
          </button>
        </div>

        {/* Mobile filter panel */}
        {showMobileFilters && (
          <div className="lg:hidden rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-ink">Filters</span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-brand-skyDeep hover:underline">Clear all</button>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Platform</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => togglePlatform(p.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      selectedPlatforms.includes(p.key)
                        ? "bg-brand-mist border-brand-skyDeep text-brand-ink"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Niche</p>
              <div className="flex flex-wrap gap-1.5">
                {CREATOR_NICHES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => toggleNiche(n)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                      selectedNiches.includes(n)
                        ? "bg-brand-mist border-brand-skyDeep text-brand-ink"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active filter chips + count */}
        {(hasActiveFilters || !loading) && (
          <div className="flex items-center gap-2 flex-wrap min-h-[20px]">
            <span className="text-xs text-slate-500">
              {filtered.length} {filtered.length === 1 ? "creator" : "creators"}
            </span>
            {selectedNiches.map((n) => (
              <span key={n} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-mist text-brand-skyDeep text-xs font-medium">
                {n}
                <button onClick={() => toggleNiche(n)}><X size={10} /></button>
              </span>
            ))}
            {selectedPlatforms.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-mist text-brand-skyDeep text-xs font-medium">
                {PLATFORMS.find((x) => x.key === p)?.label}
                <button onClick={() => togglePlatform(p)}><X size={10} /></button>
              </span>
            ))}
          </div>
        )}

        {/* Creator grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : err ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep mb-3">
              <Users size={20} />
            </span>
            <h2 className="text-lg font-semibold text-brand-ink">No creators match</h2>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Try adjusting your filters or search term.
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-brand-skyDeep hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((c) => (
              <CreatorCard
                key={c.id}
                creator={c}
                connectionStatus={connectionMap.get(c.id) || null}
                isPro={isPro}
                onOpen={(creator) => setOpenCreator(creator)}
                onConnect={handleConnect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Profile modal */}
      {openCreator ? (
        <CreatorProfileModal
          creator={openCreator}
          connectionStatus={connectionMap.get(openCreator.id) || null}
          isPro={isPro}
          onClose={() => setOpenCreator(null)}
          onConnect={handleConnect}
        />
      ) : null}
    </div>
  );
}
