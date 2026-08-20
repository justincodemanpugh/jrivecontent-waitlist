"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

const STATUS_META = {
  pending: { label: "Pending review", classes: "bg-surface-hover text-muted border-line" },
  accepted: { label: "Accepted", classes: "bg-success-soft text-success border-success-line" },
  declined: { label: "Declined", classes: "bg-danger-soft text-danger border-danger-line" },
  withdrawn: { label: "Withdrawn", classes: "bg-surface-hover text-muted border-line" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

// Top-of-home applications preview. Receives data from the parent so we don't
// re-query Supabase for the same rows the StatStrip already counts.
export default function ApplicationsPreview({
  applications,
  loading,
  error,
  limit = 3,
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-ink">
          Your applications
        </h2>
        <Link
          href="/dashboard/creator/applications"
          className="text-sm text-accent hover:underline inline-flex items-center gap-1"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-line bg-surface p-8 flex items-center justify-center text-faint">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            You haven&apos;t applied to any gigs yet.
          </p>
          <Link
            href="/dashboard/creator/explore"
            className="mt-3 inline-flex items-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-on-accent hover:bg-ink/90"
          >
            Explore gigs
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {applications.slice(0, limit).map((a) => {
            const meta = STATUS_META[a.status] || STATUS_META.pending;
            return (
              <li
                key={a.id}
                className="rounded-2xl border border-line bg-surface p-4 flex items-center justify-between gap-4"
              >
                <Link
                  href={`/dashboard/creator/explore/${a.gig_id}`}
                  className="min-w-0 flex-1 group"
                >
                  <p className="font-medium text-ink truncate group-hover:text-accent transition">
                    {a.gig?.title || "Gig"}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {a.gig?.brand_name || "Brand"} · Applied {timeAgo(a.created_at)}
                  </p>
                </Link>
                <span
                  className={`shrink-0 inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border ${meta.classes}`}
                >
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
