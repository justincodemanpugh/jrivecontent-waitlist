"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";
import { fetchDiscoveredCreators } from "@/lib/dashboard/brand/discoveryApi";
import { SORTS, FOLLOWER_RANGES, formatCount } from "@/lib/discovery/directory";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";
import DiscoveredCreatorCard from "./DiscoveredCreatorCard";

// The TikTok directory tab of Browse Creators: public profiles we discovered
// via Apify, which are NOT platform members.
//
// Kept as a sibling of CreatorsView rather than a branch inside it. The two
// tabs have genuinely different data shapes and paging models — CreatorsView
// loads every member and filters client-side, this one pages in Postgres —
// and merging them would mean rewriting a working 350-line component.
export default function DiscoveryView() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Committed filter values. `queryInput` is the uncommitted textbox so we
  // don't hit Postgres on every keystroke.
  const [queryInput, setQueryInput] = useState("");
  const [filters, setFilters] = useState({
    q: "", niche: "", followers: "", sort: "followers",
  });

  const load = useCallback(async (nextFilters, nextPage) => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetchDiscoveredCreators({ ...nextFilters, page: nextPage });
      setRows(res.creators);
      setTotal(res.total);
      setPage(res.page);
      setPageCount(res.pageCount);
    } catch (e) {
      console.error("[discovery] load failed", e);
      setErr("We couldn't load the directory. Please try again.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters, page); }, [load, filters, page]);

  const apply = (patch) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const submitSearch = (e) => {
    e.preventDefault();
    apply({ q: queryInput });
  };

  // Zero rows with no filters means the RLS gate returned nothing — the brand
  // has no active subscription (0043). Distinguishing this from a genuinely
  // empty result matters: one is an upgrade prompt, the other is "widen your
  // filters".
  const isFiltered = Boolean(filters.q || filters.niche || filters.followers);
  const likelyGated = !loading && !err && total === 0 && !isFiltered;

  const selectClass =
    "rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none focus:border-accent";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search by name, handle, or bio…"
            className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
          />
        </form>

        <select
          value={filters.niche}
          onChange={(e) => apply({ niche: e.target.value })}
          className={selectClass}
        >
          <option value="">All niches</option>
          {CREATOR_NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        <select
          value={filters.followers}
          onChange={(e) => apply({ followers: e.target.value })}
          className={selectClass}
        >
          <option value="">Any size</option>
          {Object.entries(FOLLOWER_RANGES).map(([k, r]) => (
            <option key={k} value={k}>{r.label}</option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(e) => apply({ sort: e.target.value })}
          className={selectClass}
        >
          {Object.entries(SORTS).map(([k, s]) => (
            <option key={k} value={k}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : err ? (
        <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">{err}</p>
      ) : likelyGated ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <Sparkles size={20} className="mx-auto text-accent" />
          <p className="mt-3 font-semibold text-ink">The TikTok directory is a paid feature</p>
          <p className="mt-1 text-sm text-muted">
            Start a subscription to search discovered TikTok creators by niche and follower count.
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="font-semibold text-ink">No creators match those filters.</p>
          <button
            type="button"
            onClick={() => { setQueryInput(""); apply({ q: "", niche: "", followers: "" }); }}
            className="mt-2 text-sm font-medium text-accent underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted">
              {formatCount(total)} creator{total === 1 ? "" : "s"}
              {isFiltered ? " matching your filters" : ""}
            </p>
            <p className="text-xs text-faint">Page {page} of {pageCount}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((c) => <DiscoveredCreatorCard key={c.id} creator={c} />)}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink transition hover:bg-surface-hover disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-ink transition hover:bg-surface-hover disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <p className="pt-2 text-xs leading-relaxed text-faint">
        Public TikTok data, refreshed periodically and possibly out of date. These creators
        are not on JriveContent and have not agreed to work with anyone — listing here is not
        an endorsement or a sign of availability. Verification badges are TikTok&apos;s.
        Creators can remove themselves at <span className="text-muted">/creators/opt-out</span>.
      </p>
    </div>
  );
}
