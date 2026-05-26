"use client";

import { useState } from "react";
import { Check, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/dashboard/brand/TopBar";
import { startBrandSubscription } from "@/lib/dashboard/brand/billingApi";

const FEATURES = [
  { label: "Gig postings", value: "Unlimited" },
  { label: "Creator browsing", value: "All creators" },
  { label: "Creator invites", value: "Unlimited" },
  { label: "Applications", value: "Unlimited" },
  { label: "Messaging", value: "Full access" },
  { label: "Support", value: "Priority" },
  { label: "Billing", value: "Cancel anytime" },
];

const REDIRECT_REASONS = {
  "post-gig": "Posting a gig is a Pro feature. Upgrade to publish your first gig.",
  "browse-creators": "Browsing creators is a Pro feature. Upgrade to discover and invite creators.",
};

export default function BrandPricingPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const reasonKey = searchParams?.get("from");
  const reasonMessage = reasonKey ? REDIRECT_REASONS[reasonKey] : null;

  const handleUpgrade = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const url = await startBrandSubscription("/dashboard/brand?subscription=success");
      window.location.href = url;
    } catch (e) {
      setError(e.message || "Could not start checkout.");
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar title="Upgrade to Pro" />
      <main className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard/brand"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-ink transition mb-6"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* Contextual banner when redirected from a gated route */}
        {reasonMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-sky/40 bg-brand-mist px-4 py-3 text-sm text-brand-ink">
            <Info size={18} className="mt-0.5 shrink-0 text-brand-skyDeep" />
            <p>{reasonMessage}</p>
          </div>
        )}

        {/* Pricing card */}
        <div className="relative rounded-3xl border border-brand-sky/40 bg-white shadow-xl shadow-brand-sky/10 p-7 sm:p-9">
          {/* Most popular pill */}
          <span className="inline-flex items-center rounded-full border border-brand-skyDeep/40 bg-brand-mist px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-skyDeep">
            Most Popular
          </span>

          {/* Plan name + tagline */}
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-brand-ink">
            Pro
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            For brands serious about growth.
          </p>

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-brand-ink">
              $25
            </span>
            <span className="text-lg text-slate-500">/month</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Less than $1 a day</p>

          {/* CTA */}
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-brand-skyDeep text-white py-3.5 text-base font-semibold shadow-md shadow-brand-sky/30 hover:bg-brand-ink transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Redirecting to checkout…" : "Upgrade to Pro"}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-red-600">{error}</p>
          )}

          {/* Divider */}
          <div className="my-7 border-t border-slate-200" />

          {/* Feature rows */}
          <ul className="space-y-4">
            {FEATURES.map((f, i) => (
              <li
                key={f.label}
                className={`flex items-center justify-between gap-4 ${
                  i !== FEATURES.length - 1 ? "pb-4 border-b border-slate-100" : ""
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm text-brand-ink">
                  <Check
                    size={16}
                    strokeWidth={3}
                    className="text-brand-skyDeep shrink-0"
                  />
                  {f.label}
                </span>
                <span className="text-sm font-medium text-brand-skyDeep text-right">
                  {f.value}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-7 text-center text-xs text-slate-400">
            Secure payment via Stripe · Cancel anytime
          </p>
        </div>

        {/* Current plan note */}
        <p className="mt-5 text-center text-sm text-slate-500">
          Currently on the <span className="font-medium text-brand-ink">Free</span> plan
        </p>
      </main>
    </>
  );
}
