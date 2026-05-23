"use client";

import { useState } from "react";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import TopBar from "@/components/dashboard/brand/TopBar";
import { startBrandSubscription } from "@/lib/dashboard/brand/billingApi";

const FEATURES = [
  "Unlimited gig postings",
  "Browse & invite any creator",
  "Priority support",
  "Cancel anytime",
];

export default function BrandPricingPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      <main className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard/brand"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-ink transition mb-8"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
            Unlock full access
          </h1>
          <p className="mt-2 text-slate-600">
            Create unlimited gigs and browse every creator on the platform.
          </p>
        </div>

        {/* Pricing card */}
        <div className="relative rounded-2xl border-2 border-brand-sky bg-white shadow-lg shadow-brand-sky/10 p-6 sm:p-8">
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white text-xs font-semibold uppercase tracking-wide px-3 py-1">
              <Sparkles size={12} />
              Recommended
            </span>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm font-medium text-slate-500">Pro Plan</p>
            <div className="mt-2 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-brand-ink">$25</span>
              <span className="text-lg text-slate-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Billed monthly · Cancel anytime
            </p>
          </div>

          {/* Features */}
          <ul className="mt-8 space-y-3">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-mist text-brand-skyDeep">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-sm text-brand-ink">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={busy}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-brand-skyDeep to-brand-ink text-white py-3 text-base font-semibold shadow-md shadow-brand-sky/20 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Redirecting to checkout…" : "Get started"}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-red-600">{error}</p>
          )}

          <p className="mt-4 text-center text-xs text-slate-400">
            Secure payment via Stripe
          </p>
        </div>

        {/* Current plan note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Currently on the <span className="font-medium text-brand-ink">Free</span> plan
          </p>
        </div>
      </main>
    </>
  );
}
