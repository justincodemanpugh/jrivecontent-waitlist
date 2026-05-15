"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/dashboard/creator/TopBar";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";
import StatStrip from "@/components/dashboard/creator/home/StatStrip";
import ApplicationsPreview from "@/components/dashboard/creator/home/ApplicationsPreview";
import RecommendedGigs from "@/components/dashboard/creator/home/RecommendedGigs";
import EmptyState from "@/components/dashboard/creator/EmptyState";
import { fetchMyApplications } from "@/lib/dashboard/applicationsApi";

// Statuses that count as "still in flight" for the open-applications stat.
const OPEN_STATUSES = new Set(["pending"]);

export default function CreatorHomePage() {
  const creator = useCreator();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchMyApplications();
        if (!cancelled) setApplications(rows);
      } catch (e) {
        if (!cancelled) setError(e.message || "Couldn't load applications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const refresh = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("applications:changed", refresh);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("applications:changed", refresh);
      }
    };
  }, []);

  const openCount = useMemo(
    () => applications.filter((a) => OPEN_STATUSES.has(a.status)).length,
    [applications],
  );

  const hasApplications = !loading && applications.length > 0;
  const showEmpty = !loading && applications.length === 0;

  return (
    <>
      <TopBar title="Home" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-8">
        {showEmpty ? (
          <EmptyState creatorName={creator.firstName} />
        ) : (
          <>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
                Welcome back, {creator.firstName} <span className="inline-block">👋</span>
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Here are gigs that match your niches and the latest on your applications.
              </p>
            </div>

            <StatStrip openApplicationsCount={openCount} />

            <ApplicationsPreview
              applications={applications}
              loading={loading}
              error={error}
            />

            <RecommendedGigs />
          </>
        )}
      </main>
    </>
  );
}
