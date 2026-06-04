"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import TopBar from "@/components/dashboard/brand/TopBar";
import StatStrip from "@/components/dashboard/brand/StatStrip";
import NeedsAttention from "@/components/dashboard/brand/NeedsAttention";
import ActiveGigs from "@/components/dashboard/brand/ActiveGigs";
import EmptyState from "@/components/dashboard/brand/EmptyState";
import WelcomeBanner from "@/components/dashboard/brand/tutorial/WelcomeBanner";
import TutorialChecklist from "@/components/dashboard/brand/tutorial/TutorialChecklist";
import GuidedTour from "@/components/dashboard/brand/tutorial/GuidedTour";
import { fetchMyGigs } from "@/lib/dashboard/brand/gigsApi";
import { toggleChecklistVisibility, fetchTutorialProgress } from "@/lib/dashboard/brand/tutorialApi";
import { fetchBilling } from "@/lib/dashboard/brand/billingApi";
import {
  fetchDashboardStats,
  fetchAttentionItems,
} from "@/lib/dashboard/brand/dashboardApi";
import { useBrand } from "@/components/dashboard/brand/BrandProvider";

const EMPTY_STATS = {
  activeGigs: 0,
  newApplications: 0,
  awaitingApproval: 0,
  completedThisMonth: 0,
};

export default function BrandDashboardPage() {
  const searchParams = useSearchParams();
  const brand = useBrand();
  // ?empty=1 forces the first-time-user empty state for previewing.
  const forceEmpty = searchParams?.get("empty") === "1";

  const [gigs, setGigs] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [attention, setAttention] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [checklistHidden, setChecklistHidden] = useState(false);
  const [tutorialProgress, setTutorialProgress] = useState(null);
  const [isPro, setIsPro] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [rows, statsRes, attentionRes, progress, billing] = await Promise.all([
        fetchMyGigs().catch(() => []),
        fetchDashboardStats().catch(() => EMPTY_STATS),
        fetchAttentionItems().catch(() => []),
        fetchTutorialProgress().catch(() => null),
        fetchBilling().catch(() => null),
      ]);
      setGigs(rows);
      setStats(statsRes);
      setAttention(attentionRes);
      setTutorialProgress(progress);
      setIsPro(billing?.plan === "pro");
      if (progress?.checklist_hidden) {
        setChecklistHidden(true);
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await loadAll();
      if (cancelled) return;
    };
    run();
    const onChange = () => loadAll();
    window.addEventListener("gigs:changed", onChange);
    window.addEventListener("applications:changed", onChange);
    window.addEventListener("conversations:changed", onChange);
    window.addEventListener("tutorial:changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("gigs:changed", onChange);
      window.removeEventListener("applications:changed", onChange);
      window.removeEventListener("conversations:changed", onChange);
      window.removeEventListener("tutorial:changed", onChange);
    };
  }, [loadAll]);

  const activeGigs = useMemo(
    () => gigs.filter((g) => g.isActive),
    [gigs],
  );

  const hasGigs = !forceEmpty && loaded && activeGigs.length > 0;
  const showEmpty = forceEmpty || (loaded && activeGigs.length === 0);

  const handleStartTour = () => setTourOpen(true);
  const handleCloseTour = () => setTourOpen(false);
  const handleHideChecklist = () => setChecklistHidden(true);
  const handleShowChecklist = async () => {
    setChecklistHidden(false);
    await toggleChecklistVisibility(false);
  };

  // Calculate checklist progress for the header button
  const checklistProgress = useMemo(() => {
    if (!tutorialProgress) return 0;
    const hasGigsNow = gigs.length > 0;
    let count = 0;
    if (tutorialProgress.profile_completed) count++;
    if (tutorialProgress.first_gig_posted || hasGigsNow) count++;
    if (tutorialProgress.browsed_creators) count++;
    if (tutorialProgress.checked_applicants) count++;
    if (tutorialProgress.viewed_upgrade || isPro) count++;
    return (count / 5) * 100;
  }, [tutorialProgress, gigs, isPro]);

  return (
    <>
      <TopBar
          title="Dashboard"
          checklistHidden={checklistHidden}
          checklistProgress={checklistProgress}
          onShowChecklist={handleShowChecklist}
        />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome banner for new brands */}
        <WelcomeBanner brandName={brand.name} onStartTour={handleStartTour} />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className={`space-y-8 ${checklistHidden ? 'flex-1' : 'flex-1'}`}>
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
                <StatStrip stats={stats} />
                <NeedsAttention items={attention} />
                <ActiveGigs gigs={activeGigs} />
              </>
            ) : showEmpty ? (
              <EmptyState brandName={brand.name} />
            ) : null}
          </div>

          {/* Tutorial checklist sidebar - only show when not hidden */}
          {!checklistHidden && (
            <div className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <TutorialChecklist
                  onStartTour={handleStartTour}
                  onHide={handleHideChecklist}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Guided tour overlay */}
      <GuidedTour isOpen={tourOpen} onClose={handleCloseTour} />
    </>
  );
}
