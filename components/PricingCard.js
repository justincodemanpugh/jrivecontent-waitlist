"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

export default function PricingCard({
  eyebrow = "Most Popular",
  title = "Pro",
  price = "$25",
  period = "month",
  description = "For brands serious about growth.",
  priceSubtext = "Less than $1 a day",
  features = [
    { label: "Gig postings", value: "Unlimited" },
    { label: "Creator browsing", value: "All creators" },
    { label: "Creator invites", value: "Unlimited" },
    { label: "Applications", value: "Unlimited" },
    { label: "Messaging", value: "Full access" },
    { label: "Support", value: "Priority" },
    { label: "Billing", value: "Cancel anytime" },
  ],
  buttonText = "Upgrade to Pro",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/brand-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Could not start checkout.");
        setLoading(false);
      }
    } catch (e) {
      setError(e.message || "Could not start checkout.");
      setLoading(false);
    }
  }

  return (
    <FadeIn>
      <div className="relative rounded-3xl border border-brand-sky/40 bg-white shadow-xl shadow-brand-sky/10 p-7 sm:p-9">
        {/* Most popular pill */}
        <span className="inline-flex items-center rounded-full border border-brand-skyDeep/40 bg-brand-mist px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-skyDeep">
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
          className="mt-6 w-full rounded-xl bg-brand-skyDeep text-white py-3.5 text-base font-semibold shadow-md shadow-brand-sky/30 hover:bg-brand-ink transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Redirecting…" : buttonText}
        </button>

        {error && (
          <p className="mt-3 text-center text-sm text-red-600">{error}</p>
        )}

        {/* Divider */}
        <div className="my-7 border-t border-slate-200" />

        {/* Feature rows */}
        <ul className="space-y-4">
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
                    className="text-brand-skyDeep shrink-0"
                  />
                  {item.label}
                </span>
                {item.value && (
                  <span className="text-sm font-medium text-brand-skyDeep text-right">
                    {item.value}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <p className="mt-7 text-center text-xs text-slate-400">
          Secure payment via Stripe · Cancel anytime
        </p>
      </div>
    </FadeIn>
  );
}
