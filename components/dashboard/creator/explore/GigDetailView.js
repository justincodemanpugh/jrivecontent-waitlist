"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Loader2, Check } from "lucide-react";
import { fetchMarketplaceGig } from "@/lib/dashboard/marketplaceApi";
import { fetchMyApplicationForGig } from "@/lib/dashboard/applicationsApi";
import ApplyDialog from "./ApplyDialog";

const APPLICATION_STATUS_META = {
  pending: { label: "Application pending", classes: "bg-slate-100 text-slate-600" },
  accepted: { label: "Accepted 🎉", classes: "bg-emerald-50 text-emerald-700" },
  declined: { label: "Declined", classes: "bg-rose-50 text-rose-700" },
  withdrawn: { label: "Withdrawn", classes: "bg-slate-100 text-slate-600" },
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
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }
  if (err || !gig) {
    return (
      <div className="px-4 py-10">
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
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
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-ink mb-4"
      >
        <ArrowLeft size={14} />
        Back to gigs
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
        <div
          className={`relative h-40 sm:h-56 overflow-hidden ${
            gig.coverImageUrl ? "bg-slate-100" : `bg-gradient-to-br ${gig.cover}`
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
            <p className="text-xs font-medium text-brand-skyDeep uppercase tracking-wide">
              {gig.brandName}
              {gig.brandIndustry ? ` · ${gig.brandIndustry}` : ""}
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-brand-ink">
              {gig.title}
            </h1>
          </div>

          <div className="rounded-2xl bg-brand-mist/50 border border-brand-sky/30 p-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-skyDeep">
              <DollarSign size={18} />
            </span>
            <div>
              <p className="text-xs text-slate-500">Pay per video</p>
              <p className="text-lg font-semibold text-brand-ink">
                ${gig.payPerVideo}
              </p>
            </div>
          </div>

          <section>
            <h2 className="text-sm font-semibold text-brand-ink mb-2">
              About this gig
            </h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {gig.description || "No description provided."}
            </p>
          </section>

          {Array.isArray(gig.examples) && gig.examples.length > 0 ? (
            <section>
              <h2 className="text-sm font-semibold text-brand-ink mb-2">
                Example videos
              </h2>
              <ul className="space-y-1.5">
                {gig.examples.map((ex, i) => {
                  const value =
                    typeof ex === "string" ? ex : ex?.value || ex?.name || "";
                  if (!value) return null;
                  const isUrl = /^https?:\/\//i.test(value);
                  return (
                    <li key={i} className="text-sm">
                      {isUrl ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-skyDeep hover:underline break-all"
                        >
                          {value}
                        </a>
                      ) : (
                        <span className="text-slate-600">{value}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

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
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-brand-skyDeep px-6 py-3 text-base font-semibold text-white hover:bg-brand-ink transition"
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
