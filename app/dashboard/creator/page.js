"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Upload, Clock, CheckCircle2, Eye, ImagePlus } from "lucide-react";
import TopBar from "@/components/dashboard/creator/TopBar";
import StatStrip from "@/components/dashboard/creator/home/StatStrip";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";
import { fetchMyAssignments } from "@/lib/dashboard/creator/assignmentsApi";

export default function CreatorHomePage() {
  const creator = useCreator();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchMyAssignments();
        if (!cancelled) setAssignments(rows);
      } catch {
        // silent — empty state shows instead
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const refresh = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("assignments:changed", refresh);
    }
    return () => {
      cancelled = true;
      if (typeof window !== "undefined") {
        window.removeEventListener("assignments:changed", refresh);
      }
    };
  }, []);

  const actionNeeded = useMemo(
    () =>
      assignments.filter(
        (a) =>
          // Escrowed but no video uploaded yet
          (a.escrowStatus === "escrowed" && !a.submissionStoragePath) ||
          // Changes requested — needs re-upload
          a.reviewStatus === "changes_requested"
      ),
    [assignments]
  );

  const inProgress = useMemo(
    () =>
      assignments.filter(
        (a) =>
          a.submissionStoragePath &&
          a.reviewStatus === "pending" &&
          a.escrowStatus !== "released"
      ),
    [assignments]
  );

  const completed = useMemo(
    () => assignments.filter((a) => a.reviewStatus === "approved"),
    [assignments]
  );

  // Profile completeness nudge — based on fields available in CreatorProvider
  const missingBio = !creator.bio;
  const missingHandle = !creator.handle;
  const profileComplete = !missingBio && !missingHandle;
  const profilePct = [!!creator.bio, !!creator.handle, creator.niches.length > 0].filter(Boolean).length;
  const profilePctDisplay = Math.round((profilePct / 3) * 100);

  const hasAnyAssignments = !loading && assignments.length > 0;
  const showEmpty = !loading && assignments.length === 0;

  return (
    <>
      <TopBar title="Home" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto space-y-6">

        {/* Welcome */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">
            Hey, {creator.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            {showEmpty
              ? "Brands will find you here — make sure your profile looks great."
              : "Here's what needs your attention today."}
          </p>
        </div>

        <StatStrip />

        {/* Profile completeness banner (show if not 100%) */}
        {!profileComplete && (
          <div className="rounded-2xl border border-warn-line bg-warn-soft px-5 py-4 flex items-center gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-surface flex items-center justify-center text-warn">
              <ImagePlus size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-warn">
                Your profile is {profilePctDisplay}% complete
              </p>
              <p className="text-xs text-warn mt-0.5">
                {missingBio && !missingHandle
                  ? "Add a short bio so brands know what you're about."
                  : !missingBio && missingHandle
                  ? "Add a creator handle so brands can find your socials."
                  : "Add a bio and handle to attract more brands."}
              </p>
            </div>
            <Link
              href="/dashboard/creator/profile/edit"
              className="flex-shrink-0 text-xs font-semibold text-warn hover:underline underline-offset-2 flex items-center gap-1"
            >
              Complete profile
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Action Needed */}
        {(loading || actionNeeded.length > 0) && (
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              Action needed
              {actionNeeded.length > 0 && (
                <span className="text-xs font-medium text-faint">({actionNeeded.length})</span>
              )}
            </h2>
            {loading ? (
              <div className="rounded-2xl border border-line bg-surface p-6 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {actionNeeded.map((a) => (
                  <AssignmentRow key={a.id} assignment={a} variant="action" />
                ))}
              </div>
            )}
          </section>
        )}

        {/* In Progress */}
        {inProgress.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <Clock size={14} className="text-accent" />
              Waiting on brand review
              <span className="text-xs font-medium text-faint">({inProgress.length})</span>
            </h2>
            <div className="space-y-2">
              {inProgress.map((a) => (
                <AssignmentRow key={a.id} assignment={a} variant="review" />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-accent-tint flex items-center justify-center mb-4">
              <Upload size={22} className="text-accent" />
            </div>
            <p className="text-base font-semibold text-ink">No assignments yet</p>
            <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
              Brands will send you briefs directly once you&apos;re connected. Make sure your profile is complete so you&apos;re easy to find.
            </p>
            <Link
              href="/dashboard/creator/profile/edit"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2.5 text-sm font-semibold hover:bg-ink/90 transition"
            >
              Complete your profile
            </Link>
          </div>
        )}

        {/* Quick stats row (only when there are assignments) */}
        {hasAnyAssignments && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Active"
              value={actionNeeded.length + inProgress.length}
              icon={<Clock size={16} />}
              tint="text-warn bg-warn-soft"
            />
            <StatCard
              label="In Review"
              value={inProgress.length}
              icon={<Eye size={16} />}
              tint="text-accent bg-accent-tint"
            />
            <StatCard
              label="Approved"
              value={completed.length}
              icon={<CheckCircle2 size={16} />}
              tint="text-success bg-success-soft"
            />
          </div>
        )}

        {/* View all link */}
        {hasAnyAssignments && (
          <div className="text-center">
            <Link
              href="/dashboard/creator/assignments"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-2"
            >
              View all assignments
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

      </main>
    </>
  );
}

function AssignmentRow({ assignment, variant }) {
  const isChanges = assignment.reviewStatus === "changes_requested";
  return (
    <Link
      href={`/dashboard/creator/assignments/${assignment.id}`}
      className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-4 hover:border-accent-soft/60 hover:shadow-sm transition"
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        variant === "action" ? "bg-warn-soft text-warn" : "bg-accent-tint text-accent"
      }`}>
        {variant === "action" ? <Upload size={18} /> : <Eye size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{assignment.title}</p>
        <p className="text-xs text-muted mt-0.5">
          {isChanges
            ? "Brand requested changes — re-upload your video"
            : variant === "action"
            ? `Payment secured · Upload your video for ${assignment.brandName}`
            : `Submitted · ${assignment.brandName} is reviewing`}
        </p>
      </div>
      {assignment.payPerCreator && (
        <span className="text-sm font-semibold text-success flex-shrink-0">
          ${assignment.payPerCreator}
        </span>
      )}
      <ArrowRight size={16} className="text-faint flex-shrink-0" />
    </Link>
  );
}

function StatCard({ label, value, icon, tint }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${tint} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-muted mt-0.5">{label}</p>
    </div>
  );
}
