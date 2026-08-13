"use client";

import { Check } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";
import { useBrandCheckout } from "@/hooks/useBrandCheckout";

/* Mirrors the real pricing on the home page — see components/PricingComparison.js
   and the PricingCard defaults. Keep the two in sync. */
const FREE = {
  title: "Free",
  price: "$0",
  period: "forever",
  description: "Browse and discover creators.",
  priceSubtext: "No credit card required",
  features: [
    { label: "Browse all creators", value: "Unlimited" },
    { label: "View creator profiles", value: "Full access" },
    { label: "Favorite creators", value: "Unlimited" },
    { label: "Access dashboard", value: "Full access" },
    { label: "Support", value: "Community" },
  ],
  buttonText: "Get Started Free",
  href: "/signup?role=brand",
};

const PRO = {
  title: "Pro",
  price: "$0",
  period: "3 days",
  description: "For brands serious about growth.",
  priceSubtext: "Then $25/month · Cancel anytime",
  features: [
    { label: "Gig postings", value: "Unlimited" },
    { label: "Creator browsing", value: "All creators" },
    { label: "Creator invites", value: "Unlimited" },
    { label: "Applications", value: "Unlimited" },
    { label: "Messaging", value: "Full access" },
    { label: "Support", value: "Priority" },
    { label: "Billing", value: "Cancel anytime" },
  ],
  buttonText: "Start Free Trial",
};

export default function ViralPricing() {
  const { loading, error, startCheckout } = useBrandCheckout();

  return (
    <section id="pricing" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <h2 className="mx-auto max-w-3xl text-center font-display text-4xl font-bold leading-tight tracking-tight text-brand-ink sm:text-5xl md:text-6xl">
            Plans that grow with your creator program
          </h2>
        </FadeIn>

        <FadeIn delay={120}>
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 items-start gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/40">
              <h3 className="font-display text-2xl font-bold text-brand-ink">{FREE.title}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold tracking-tight text-brand-ink">
                  {FREE.price}
                </span>
                <span className="text-lg text-slate-500">/{FREE.period}</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">{FREE.description}</p>
              <p className="mt-2 text-xs text-slate-400">{FREE.priceSubtext}</p>

              <a
                href={FREE.href}
                className="mt-7 block rounded-full border border-slate-300 bg-white py-3.5 text-center text-base font-semibold text-brand-ink transition hover:bg-slate-50"
              >
                {FREE.buttonText}
              </a>

              <div className="my-7 border-t border-slate-200" />

              <ul className="flex-1 space-y-4">
                {FREE.features.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2.5 text-sm text-brand-ink">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-skyDeep text-white">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      {f.label}
                    </span>
                    <span className="text-right text-sm font-medium text-slate-600">
                      {f.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro — featured */}
            <div className="flex h-full flex-col rounded-3xl bg-gradient-to-br from-brand-skyDeep to-brand-sky p-8 shadow-xl shadow-brand-sky/20 md:-mt-4 md:pb-12 md:pt-12">
              <h3 className="font-display text-2xl font-bold text-white">{PRO.title}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-5xl font-extrabold tracking-tight text-white">
                  {PRO.price}
                </span>
                <span className="text-lg text-white/80">/{PRO.period}</span>
              </div>
              <p className="mt-4 text-sm text-white/90">{PRO.description}</p>
              <p className="mt-2 text-xs text-white/70">{PRO.priceSubtext}</p>

              <button
                onClick={startCheckout}
                disabled={loading}
                className="mt-7 w-full rounded-full bg-white py-3.5 text-base font-semibold text-brand-skyDeep shadow-lg transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Redirecting…" : PRO.buttonText}
              </button>

              {error && <p className="mt-3 text-center text-sm text-white">{error}</p>}

              <div className="my-7 border-t border-white/25" />

              <ul className="flex-1 space-y-4">
                {PRO.features.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2.5 text-sm text-white">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-white">
                        <Check size={12} strokeWidth={3.5} />
                      </span>
                      {f.label}
                    </span>
                    <span className="text-right text-sm font-medium text-white/80">
                      {f.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
