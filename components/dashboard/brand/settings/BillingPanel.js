"use client";

import { useEffect, useState } from "react";
import { Sparkles, CreditCard, ExternalLink } from "lucide-react";
import {
  fetchBilling,
  startBrandSubscription,
  openBillingPortal,
  formatCardBrand,
} from "@/lib/dashboard/brand/billingApi";
import BrandStripePayoutsCard from "@/components/dashboard/brand/settings/BrandStripePayoutsCard";

const RETURN_TO = "/dashboard/brand/settings/billing";

export default function BillingPanel({ connect }) {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // 'upgrade' | 'portal' | null

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBilling();
        if (!cancelled) setBilling(data);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpgrade = async () => {
    setBusy("upgrade");
    setError("");
    try {
      const url = await startBrandSubscription(RETURN_TO);
      window.location.href = url;
    } catch (e) {
      setError(e.message);
      setBusy(null);
    }
  };

  const handlePortal = async () => {
    setBusy("portal");
    setError("");
    try {
      const url = await openBillingPortal(RETURN_TO);
      window.location.href = url;
    } catch (e) {
      setError(e.message);
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading billing…
      </div>
    );
  }

  const isPro = billing?.plan === "pro";
  const cancelAtPeriodEnd = !!billing?.cancelAtPeriodEnd;
  const periodEnd = billing?.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd)
    : null;

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Escrow / Stripe Connect setup */}
      <BrandStripePayoutsCard initial={connect} />

      {/* Current plan */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current plan
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h2 className="text-xl font-semibold text-brand-ink">
                {isPro ? "Pro" : "Free"}
              </h2>
              <PlanBadge status={billing?.status} cancelAtPeriodEnd={cancelAtPeriodEnd} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {isPro ? (
                <>
                  $25 / month · unlimited gigs
                  {cancelAtPeriodEnd && periodEnd && (
                    <>
                      {" "}
                      · cancels on{" "}
                      <span className="font-medium text-brand-ink">
                        {periodEnd.toLocaleDateString()}
                      </span>
                    </>
                  )}
                  {!cancelAtPeriodEnd && periodEnd && (
                    <>
                      {" "}
                      · renews{" "}
                      <span className="font-medium text-brand-ink">
                        {periodEnd.toLocaleDateString()}
                      </span>
                    </>
                  )}
                </>
              ) : (
                "1 free gig. Upgrade for unlimited gigs."
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isPro ? (
              <button
                type="button"
                onClick={handlePortal}
                disabled={busy === "portal"}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-slate-50 transition disabled:opacity-60"
              >
                {busy === "portal" ? "Opening…" : "Manage plan"}
                <ExternalLink size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={busy === "upgrade"}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-skyDeep to-brand-ink text-white px-4 py-2 text-sm font-semibold shadow-md shadow-brand-sky/20 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Sparkles size={16} />
                {busy === "upgrade" ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            )}
          </div>
        </div>

        {/* Plan comparison strip */}
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <PlanCard
            title="Free"
            price="$0"
            features={["1 gig total", "Browse creators", "Standard support"]}
            current={!isPro}
          />
          <PlanCard
            title="Pro"
            price="$25/mo"
            features={["Unlimited gigs", "Priority support", "Cancel anytime"]}
            current={isPro}
            highlight
          />
        </div>
      </section>

      {/* Payment method */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep">
              <CreditCard size={18} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-brand-ink">
                Payment method
              </h3>
              {billing?.paymentMethod ? (
                <p className="mt-1 text-sm text-slate-600">
                  {formatCardBrand(billing.paymentMethod.brand)} ••••{" "}
                  {billing.paymentMethod.last4}
                  <span className="text-slate-400">
                    {" "}
                    · exp{" "}
                    {String(billing.paymentMethod.expMonth).padStart(2, "0")}/
                    {String(billing.paymentMethod.expYear).slice(-2)}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-600">
                  {isPro
                    ? "No card on file."
                    : "Add a card when you upgrade to Pro."}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Securely managed via Stripe.
              </p>
            </div>
          </div>

          {billing?.hasCustomer && (
            <button
              type="button"
              onClick={handlePortal}
              disabled={busy === "portal"}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-slate-50 transition disabled:opacity-60"
            >
              {busy === "portal" ? "Opening…" : "Change"}
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function PlanBadge({ status, cancelAtPeriodEnd }) {
  if (!status || status === "free") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
        Free
      </span>
    );
  }
  if (cancelAtPeriodEnd) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
        Canceling
      </span>
    );
  }
  const tone =
    status === "active" || status === "trialing"
      ? "bg-emerald-100 text-emerald-700"
      : status === "past_due"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";
  const label =
    status === "active"
      ? "Active"
      : status === "trialing"
        ? "Trial"
        : status === "past_due"
          ? "Past due"
          : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}
    >
      {label}
    </span>
  );
}

function PlanCard({ title, price, features, current, highlight }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-brand-sky bg-brand-mist/40"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-ink">{title}</p>
        {current && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-skyDeep">
            Current
          </span>
        )}
      </div>
      <p className="mt-1 text-lg font-semibold text-brand-ink">{price}</p>
      <ul className="mt-2 space-y-1">
        {features.map((f) => (
          <li key={f} className="text-xs text-slate-600">
            • {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
