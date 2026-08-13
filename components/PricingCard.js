"use client";

import { Check } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";
import { useBrandCheckout } from "@/hooks/useBrandCheckout";

export default function PricingCard({
  variant = "pro", // "free" | "pro"
  eyebrow = "3-Day Free Trial",
  title = "Pro",
  price = "$0",
  period = "3 days",
  description = "For brands serious about growth.",
  priceSubtext = "Then $25/month · Cancel anytime",
  features = [
    { label: "Gig postings", value: "Unlimited" },
    { label: "Creator browsing", value: "All creators" },
    { label: "Creator invites", value: "Unlimited" },
    { label: "Applications", value: "Unlimited" },
    { label: "Messaging", value: "Full access" },
    { label: "Support", value: "Priority" },
    { label: "Billing", value: "Cancel anytime" },
  ],
  buttonText = "Start Free Trial",
  // For the free tier we just send the user to signup — no Stripe call.
  ctaHref = null,
  footerNote = "Secure payment via Stripe · Cancel anytime",
}) {
  const { loading, error, startCheckout } = useBrandCheckout();

  const isFree = variant === "free";

  async function handleClick() {
    if (ctaHref) {
      window.location.href = ctaHref;
      return;
    }
    await startCheckout();
  }

  const cardBorder = isFree
    ? "border-slate-200 shadow-lg shadow-slate-200/40"
    : "border-brand-sky/40 shadow-xl shadow-brand-sky/10";

  const eyebrowClasses = isFree
    ? "border-slate-300 bg-slate-50 text-slate-600"
    : "border-brand-skyDeep/40 bg-brand-mist text-brand-skyDeep";

  const buttonClasses = isFree
    ? "bg-white border border-slate-300 text-brand-ink hover:bg-slate-50"
    : "bg-brand-skyDeep text-white shadow-md shadow-brand-sky/30 hover:bg-brand-ink";

  const checkClasses = isFree ? "text-slate-500" : "text-brand-skyDeep";
  const valueClasses = isFree
    ? "text-slate-600"
    : "text-brand-skyDeep";

  return (
    <FadeIn>
      <div
        className={`relative rounded-3xl border bg-white p-7 sm:p-9 h-full flex flex-col ${cardBorder}`}
      >
        {/* Eyebrow pill */}
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider w-fit ${eyebrowClasses}`}
        >
          {eyebrow}
        </span>

        {/* Plan name + tagline */}
        <h3 className="mt-5 text-3xl font-bold tracking-tight text-brand-ink">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>

        {/* Price */}
        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-brand-ink">
            {price}
          </span>
          <span className="text-lg text-slate-500">/{period}</span>
        </div>
        {priceSubtext && (
          <p className="mt-1 text-xs text-slate-400">{priceSubtext}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleClick}
          disabled={loading}
          className={`mt-6 w-full rounded-xl py-3.5 text-base font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${buttonClasses}`}
        >
          {loading ? "Redirecting…" : buttonText}
        </button>

        {error && (
          <p className="mt-3 text-center text-sm text-red-600">{error}</p>
        )}

        {/* Divider */}
        <div className="my-7 border-t border-slate-200" />

        {/* Feature rows */}
        <ul className="space-y-4 flex-1">
          {features.map((f, i) => {
            const item = typeof f === "string" ? { label: f, value: null } : f;
            return (
              <li
                key={item.label}
                className={`flex items-center justify-between gap-4 ${
                  i !== features.length - 1 ? "pb-4 border-b border-slate-100" : ""
                }`}
              >
                <span className="flex items-center gap-2.5 text-sm text-brand-ink">
                  <Check
                    size={16}
                    strokeWidth={3}
                    className={`${checkClasses} shrink-0`}
                  />
                  {item.label}
                </span>
                {item.value && (
                  <span className={`text-sm font-medium text-right ${valueClasses}`}>
                    {item.value}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        {footerNote && (
          <p className="mt-7 text-center text-xs text-slate-400">
            {footerNote}
          </p>
        )}
      </div>
    </FadeIn>
  );
}
