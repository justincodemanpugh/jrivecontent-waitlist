"use client";

import { useState } from "react";
import { Check, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/dashboard/brand/TopBar";
import { startBrandSubscription } from "@/lib/dashboard/brand/billingApi";

const FEATURES = [
  { label: "Campaigns", value: "Unlimited" },
  { label: "Tracked accounts", value: "Unlimited" },
  { label: "Video analytics", value: "Daily sync" },
  { label: "Creator invites", value: "Unlimited" },
  { label: "Messaging", value: "Full access" },
  { label: "Support", value: "Priority" },
  { label: "Billing", value: "Cancel anytime" },
];

const REDIRECT_REASONS = {
  "create-campaign": "Start your free 3-day trial to create campaigns and track creators.",
  "track-accounts": "Start your free 3-day trial to track creator accounts.",
  "post-gig": "Start your free 3-day trial to post gigs and connect with creators.",
  "browse-creators": "Browsing creators is free! Start a trial to post gigs.",
  "invite-creator": "Start your free 3-day trial to invite creators directly.",
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
      <TopBar title="Start Free Trial" />
      <main className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-xl mx-auto">
        {/* Back link */}
        <Link
          href="/dashboard/brand"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition mb-6"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        {/* Contextual banner when redirected from a gated route */}
        {reasonMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-accent-soft/40 bg-accent-tint px-4 py-3 text-sm text-ink">
            <Info size={18} className="mt-0.5 shrink-0 text-accent" />
            <p>{reasonMessage}</p>
          </div>
        )}

        {/* Pricing card */}
        <div className="relative rounded-3xl border border-accent-soft/40 bg-surface shadow-xl shadow-accent-soft/10 p-7 sm:p-9">
          {/* Trial pill */}
          <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent-tint px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
            3-Day Free Trial
          </span>

          {/* Plan name + tagline */}
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink">
            Pro
          </h2>
          <p className="mt-1 text-sm text-muted">
            For brands serious about growth.
          </p>

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-2">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-ink">
              $0
            </span>
            <span className="text-lg text-muted">for 3 days</span>
          </div>
          <p className="mt-1 text-xs text-faint">Then $25/month · Cancel anytime</p>

          {/* CTA */}
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={busy}
            className="mt-6 w-full rounded-xl bg-accent text-on-accent py-3.5 text-base font-semibold shadow-md shadow-accent-soft/30 hover:bg-ink transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Redirecting to checkout…" : "Start Free Trial"}
          </button>

          {error && (
            <p className="mt-3 text-center text-sm text-danger">{error}</p>
          )}

          {/* Divider */}
          <div className="my-7 border-t border-line" />

          {/* Feature rows */}
          <ul className="space-y-4">
            {FEATURES.map((f, i) => (
              <li
                key={f.label}
                className={`flex items-center justify-between gap-4 ${
                  i !== FEATURES.length - 1 ? "pb-4 border-b border-line" : ""
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm text-ink">
                  <Check
                    size={16}
                    strokeWidth={3}
                    className="text-accent shrink-0"
                  />
                  {f.label}
                </span>
                <span className="text-sm font-medium text-accent text-right">
                  {f.value}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-7 text-center text-xs text-faint">
            Secure payment via Stripe · Cancel anytime
          </p>
        </div>

        {/* Current plan note */}
        <p className="mt-5 text-center text-sm text-muted">
          Browse creators for free · Start trial to post gigs
        </p>
      </main>
    </>
  );
}
