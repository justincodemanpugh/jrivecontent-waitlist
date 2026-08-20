"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Loader2, Check, Film, Shield } from "lucide-react";
import { fetchMarketplaceGig } from "@/lib/dashboard/marketplaceApi";
import { fetchMyApplicationForGig } from "@/lib/dashboard/applicationsApi";
import { platformLabel, contentTypeLabel, USAGE_RIGHTS } from "@/lib/dashboard/brand/gigForm";
import ExampleVideosSection from "@/components/dashboard/brand/gigs/ExampleVideosSection";
import ApplyDialog from "./ApplyDialog";

const APPLICATION_STATUS_META = {
  pending: { label: "Application pending", classes: "bg-surface-hover text-muted" },
  accepted: { label: "Accepted 🎉", classes: "bg-success-soft text-success" },
  declined: { label: "Declined", classes: "bg-danger-soft text-danger" },
  withdrawn: { label: "Withdrawn", classes: "bg-surface-hover text-muted" },
};

export default function GigDetailView({ gigId }) {
  const [gig, setGig] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [g, app] = await Promise.all([
          fetchMarketplaceGig(gigId),
          fetchMyApplicationForGig(gigId),
        ]);
        if (cancelled) return;
        setGig(g);
        setApplication(app);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load gig.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gigId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }
  if (err || !gig) {
    return (
      <div className="px-4 py-10">
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {err || "Gig not found."}
        </p>
      </div>
    );
  }

  const statusMeta =
    application && APPLICATION_STATUS_META[application.status];

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/creator/explore"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink mb-4"
      >
        <ArrowLeft size={14} />
        Back to gigs
      </Link>

      <div className="rounded-3xl border border-line bg-surface overflow-hidden">
        <div
          className={`relative h-40 sm:h-56 overflow-hidden ${
            gig.coverImageUrl ? "bg-surface-hover" : `bg-gradient-to-br ${gig.cover}`
          }`}
          aria-hidden
        >
          {gig.coverImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={gig.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="px-5 sm:px-7 py-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-accent uppercase tracking-wide">
              {gig.brandName}
              {gig.brandIndustry ? ` · ${gig.brandIndustry}` : ""}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              {gig.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-accent-tint/50 border border-accent-soft/30 p-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-accent">
                <DollarSign size={18} />
              </span>
              <div>
                <p className="text-xs text-muted">Pay per video</p>
                <p className="text-lg font-semibold text-ink">
                  ${gig.payPerVideo}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-accent-tint/50 border border-accent-soft/30 p-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-accent">
                <Film size={18} />
              </span>
              <div>
                <p className="text-xs text-muted">Videos needed</p>
                <p className="text-lg font-semibold text-ink">
                  {gig.videoQuantity} video{gig.videoQuantity === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>

          {(gig.contentType || (gig.platforms && gig.platforms.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2">
              {gig.contentType && (
                <span className="inline-flex items-center rounded-full bg-surface-hover text-ink-soft px-3 py-1 text-xs font-medium">
                  {contentTypeLabel(gig.contentType)}
                </span>
              )}
              {(gig.platforms || []).map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-full bg-accent-tint text-accent px-3 py-1 text-xs font-medium"
                >
                  {platformLabel(p)}
                </span>
              ))}
            </div>
          )}

          <section>
            <h2 className="text-sm font-semibold text-ink mb-2">
              About this gig
            </h2>
            <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed">
              {gig.description || "No description provided."}
            </p>
          </section>

          <UsageRightsSection usageRights={gig.usageRights} />

          <ExampleVideosSection examples={gig.examples} />

          <div className="pt-2">
            {statusMeta ? (
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${statusMeta.classes}`}
              >
                <Check size={14} />
                {statusMeta.label}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setApplyOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-base font-semibold text-on-accent hover:bg-ink transition"
              >
                Apply now
              </button>
            )}
          </div>
        </div>
      </div>

      <ApplyDialog
        open={applyOpen}
        gig={gig}
        onClose={() => setApplyOpen(false)}
        onApplied={(app) => setApplication(app)}
      />
    </main>
  );
}

function UsageRightsSection({ usageRights }) {
  if (!Array.isArray(usageRights) || usageRights.length === 0) return null;

  const hasFullRights = usageRights.length >= USAGE_RIGHTS.length;

  return (
    <section className="rounded-2xl border border-line bg-surface-sunken/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-accent" />
        <h2 className="text-sm font-semibold text-ink">
          Usage Rights You're Granting
        </h2>
        {hasFullRights && (
          <span className="inline-flex items-center rounded-full bg-plum-soft px-2 py-0.5 text-[10px] font-medium text-plum">
            Full Rights
          </span>
        )}
      </div>
      <div className="space-y-2">
        {USAGE_RIGHTS.map((right) => {
          const granted = usageRights.includes(right.key);
          return (
            <div
              key={right.key}
              className={`flex items-start gap-2 text-sm ${
                granted ? "text-ink-soft" : "text-faint line-through"
              }`}
            >
              <span className="flex-shrink-0 mt-0.5">
                {granted ? (
                  <Check size={14} className="text-success" />
                ) : (
                  <span className="inline-block w-3.5 h-3.5 rounded-full border border-line-strong" />
                )}
              </span>
              <div>
                <span className="font-medium">{right.icon} {right.label}</span>
                {granted && (
                  <p className="text-xs text-muted mt-0.5">{right.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 pt-3 border-t border-line text-xs text-muted">
        <strong>Duration:</strong> Perpetual (lifetime) &nbsp;•&nbsp;
        <strong>Territory:</strong> Worldwide
      </p>
    </section>
  );
}
