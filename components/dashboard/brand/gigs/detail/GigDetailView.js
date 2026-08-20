"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Users, Loader2, Film } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { platformLabel, contentTypeLabel } from "@/lib/dashboard/brand/gigForm";
import ExampleVideosSection from "@/components/dashboard/brand/gigs/ExampleVideosSection";
import ApplicantsList from "./ApplicantsList";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "applicants", label: "Applicants" },
];

export default function BrandGigDetailView({ gigId }) {
  const [gig, setGig] = useState(null);
  const [brandId, setBrandId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) throw new Error("You need to be signed in to view this gig.");
        const { data, error } = await supabase
          .from("gigs")
          .select("*")
          .eq("id", gigId)
          .eq("brand_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        setGig(data);
        setBrandId(user.id);
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
      <div className="px-4 py-10 max-w-3xl mx-auto">
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {err || "Gig not found."}
        </p>
      </div>
    );
  }

  return (
    <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto space-y-5">
      <Link
        href="/dashboard/brand/gigs"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={14} />
        All gigs
      </Link>

      {gig.cover_image_url ? (
        <div className="relative h-40 sm:h-56 overflow-hidden rounded-2xl bg-surface-hover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={gig.cover_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
          {gig.title}
        </h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <DollarSign size={14} className="text-faint" />$
            {Number(gig.pay_per_video)}
            /video
          </span>
          <span className="inline-flex items-center gap-1">
            <Film size={14} className="text-faint" />
            {Number(gig.video_quantity) || 1} video
            {Number(gig.video_quantity) === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={14} className="text-faint" />
            {gig.applicants_count ?? 0}{" "}
            {gig.applicants_count === 1 ? "applicant" : "applicants"}
          </span>
          {!gig.is_active ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-hover text-muted text-[11px] font-medium border border-line">
              Deactivated
            </span>
          ) : null}
        </div>
      </div>

      <div className="border-b border-line flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={[
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition",
              tab === t.key
                ? "border-accent text-ink"
                : "border-transparent text-muted hover:text-ink",
            ].join(" ")}
          >
            {t.label}
            {t.key === "applicants" && gig.applicants_count > 0 ? (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-on-accent text-[10px] font-semibold">
                {gig.applicants_count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
          {(gig.content_type ||
            (Array.isArray(gig.platforms) && gig.platforms.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2">
              {gig.content_type && (
                <span className="inline-flex items-center rounded-full bg-surface-hover text-ink-soft px-3 py-1 text-xs font-medium">
                  {contentTypeLabel(gig.content_type)}
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
              Description
            </h2>
            <p className="text-sm text-ink-soft whitespace-pre-wrap leading-relaxed">
              {gig.description || "No description provided."}
            </p>
          </section>

          <ExampleVideosSection examples={gig.examples} />
        </div>
      ) : (
        <ApplicantsList gigId={gigId} brandId={brandId} />
      )}
    </main>
  );
}
