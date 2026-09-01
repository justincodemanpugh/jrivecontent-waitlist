import Link from "next/link";
import ViralFonts from "@/components/viral/ViralFonts";
import ViralNavbar from "@/components/viral/ViralNavbar";
import ViralFooter from "@/components/viral/ViralFooter";
import DirectoryFilters from "@/components/creators/DirectoryFilters";
import DiscoveredCreatorCard from "@/components/creators/DiscoveredCreatorCard";
import { fetchDirectory, formatCount } from "@/lib/discovery/directory";

// Public and unauthenticated. middleware.js only guards /dashboard and
// /onboarding, so no middleware change is needed for this route to be open.
//
// Server component by design: the creator grid has to be in the HTML for this
// page to do its job, which is bringing brands in from search.
//
// Rendered per-request, not cached: reading searchParams opts a route out of
// static rendering, so a `revalidate` here would be dead config. Crawlers
// still get fully-rendered HTML; each filtered view is one indexed query.

export const metadata = {
  title: "Find TikTok UGC Creators — Browse Thousands of Creators | JriveContent",
  description:
    "Browse TikTok UGC creators by niche and follower count. See real follower counts and engagement, then reach out directly. Free to search, no account needed.",
  alternates: { canonical: "/creators" },
};

function buildHref(params, overrides) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...overrides })) {
    if (v) sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `/creators?${qs}` : "/creators";
}

export default async function CreatorsPage({ searchParams }) {
  const params = {
    q: searchParams?.q || "",
    niche: searchParams?.niche || "",
    followers: searchParams?.followers || "",
    sort: searchParams?.sort || "followers",
    page: searchParams?.page || "1",
  };

  let result = { creators: [], total: 0, page: 1, pageCount: 1 };
  let loadError = null;
  try {
    result = await fetchDirectory(params);
  } catch (e) {
    console.error("[/creators] query failed", e);
    loadError = e.message;
  }

  const { creators, total, page, pageCount } = result;
  const isFiltered = Boolean(params.q || params.niche || params.followers);

  return (
    <ViralFonts>
      <main className="min-h-screen bg-brand-mist/40 text-brand-ink">
        <ViralNavbar />

        <section className="mx-auto max-w-6xl px-4 pb-8 pt-12 sm:pt-16">
          <h1 className="max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Find TikTok creators for your next campaign
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            {total > 0
              ? `Browse ${formatCount(total)} TikTok creators by niche and follower count. `
              : "Browse TikTok creators by niche and follower count. "}
            Free to search — no account needed.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4">
          <DirectoryFilters params={params} />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8">
          {loadError ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              We couldn&apos;t load the directory just now. Please try again shortly.
            </p>
          ) : creators.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <p className="font-semibold text-brand-ink">
                {isFiltered ? "No creators match those filters." : "The directory is still filling up."}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {isFiltered ? (
                  <>Try a wider follower range, or{" "}
                    <Link href="/creators" className="font-medium text-sky-600 underline">
                      clear the filters
                    </Link>.
                  </>
                ) : (
                  "Check back shortly — we add creators every day."
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-baseline justify-between">
                <p className="text-sm text-slate-500">
                  {formatCount(total)} creator{total === 1 ? "" : "s"}
                  {isFiltered ? " matching your filters" : ""}
                </p>
                <p className="text-xs text-slate-400">Page {page} of {pageCount}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map((c) => (
                  <DiscoveredCreatorCard key={c.id} creator={c} />
                ))}
              </div>

              {pageCount > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-3">
                  {page > 1 && (
                    <Link
                      href={buildHref(params, { page: page - 1 })}
                      rel="prev"
                      className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium transition hover:bg-slate-50"
                    >
                      Previous
                    </Link>
                  )}
                  {page < pageCount && (
                    <Link
                      href={buildHref(params, { page: page + 1 })}
                      rel="next"
                      className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium transition hover:bg-slate-50"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>

        {/* The bridge to the paid product. The directory is where brands
            arrive; campaigns and payouts are what they stay for. */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="rounded-3xl bg-brand-ink px-6 py-12 text-center text-white sm:px-12">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Already working with creators?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">
              Track every video they post, see what actually performs, and pay
              per video on a schedule — all in one place.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-block rounded-full bg-white px-7 py-3 font-semibold text-brand-ink transition hover:bg-slate-100"
            >
              Start free
            </Link>
          </div>
        </section>

        {/* Provenance and opt-out. Required, not decorative: these people did
            not sign up, so they need a visible way out. */}
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <p className="text-center text-xs leading-relaxed text-slate-500">
            Profile data is public information from TikTok and may be out of date.
            Listing here does not mean a creator is available for work or affiliated
            with JriveContent. Verification badges are TikTok&apos;s.{" "}
            <Link href="/creators/opt-out" className="underline hover:text-slate-700">
              Remove your profile
            </Link>
            .
          </p>
        </section>

        <ViralFooter />
      </main>
    </ViralFonts>
  );
}
