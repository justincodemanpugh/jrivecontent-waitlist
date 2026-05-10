"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

export default function PricingCard({
  eyebrow = "For brands",
  title = "Brand Platform Access",
  price = "$25",
  period = "mo",
  description = "Post unlimited gigs and connect with affordable UGC creators.",
  features = [
    "Unlimited gig postings",
    "Access to the creator marketplace",
    "Direct messaging with creators",
    "Escrow-protected payments",
    "Cancel anytime",
  ],
  buttonText = "Get Started",
  isFeatured = true,
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
      <div
        className={`relative rounded-3xl p-8 h-full flex flex-col ${
          isFeatured
            ? "border-2 border-brand-skyDeep bg-gradient-to-b from-brand-mist to-white shadow-xl shadow-brand-sky/20"
            : "border border-slate-200 bg-white"
        }`}
      >
        {isFeatured && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-brand-ink text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1">
            Best value
          </span>
        )}

        <div className="flex items-center gap-2 text-sm font-medium text-brand-skyDeep">
          <span className="h-2 w-2 rounded-full bg-brand-skyDeep" />
          {eyebrow}
        </div>

        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-brand-ink">
          {title}
        </h3>
        <p className="mt-2 text-slate-600 leading-relaxed">{description}</p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-5xl font-bold text-brand-ink">{price}</span>
          <span className="text-lg font-medium text-slate-500">/{period}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Billed monthly. Cancel anytime.
        </p>

        <button
          onClick={handleClick}
          disabled={loading}
          className="group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink text-white px-7 py-3.5 font-medium hover:bg-slate-800 transition shadow-lg shadow-brand-sky/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Redirecting..." : buttonText}
          {!loading && (
            <ArrowRight
              size={18}
              className="group-hover:translate-x-0.5 transition"
            />
          )}
        </button>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <ul className="mt-8 space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-slate-700">
              <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-sky/30 text-brand-skyDeep">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </FadeIn>
  );
}
