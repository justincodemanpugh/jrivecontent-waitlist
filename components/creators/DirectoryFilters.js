import { Search } from "lucide-react";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";
import { SORTS, FOLLOWER_RANGES } from "@/lib/discovery/directory";

// A plain GET form, on purpose. Submitting writes the filters straight into
// the URL, which means every filtered view is linkable, shareable, crawlable,
// and server-rendered — the whole reason this page is public. No client
// component, no JS required for the page to work.
export default function DirectoryFilters({ params }) {
  const { q = "", niche = "", followers = "", sort = "followers" } = params;

  return (
    <form
      method="get"
      action="/creators"
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
    >
      <label className="relative flex-1">
        <span className="sr-only">Search creators</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name, handle, or bio…"
          className="w-full rounded-full border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label>
        <span className="sr-only">Niche</span>
        <select
          name="niche"
          defaultValue={niche}
          className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 sm:w-auto"
        >
          <option value="">All niches</option>
          {CREATOR_NICHES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <label>
        <span className="sr-only">Follower range</span>
        <select
          name="followers"
          defaultValue={followers}
          className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 sm:w-auto"
        >
          <option value="">Any size</option>
          {Object.entries(FOLLOWER_RANGES).map(([key, r]) => (
            <option key={key} value={key}>{r.label}</option>
          ))}
        </select>
      </label>

      <label>
        <span className="sr-only">Sort by</span>
        <select
          name="sort"
          defaultValue={sort}
          className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 sm:w-auto"
        >
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded-full bg-brand-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Search
      </button>
    </form>
  );
}
