"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useCreator } from "./CreatorProvider";
import ResetStripeButton from "@/components/dashboard/ResetStripeButton";

// Payouts setup card for the creator profile page. Shows different states
// based on whether the creator has connected Stripe and whether payouts
// are enabled (i.e. KYC is fully completed).
export default function StripePayoutsCard() {
  const creator = useCreator();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [banner, setBanner] = useState("");

  useEffect(() => {
    const status = searchParams?.get("stripe");
    if (status === "refresh") {
      setBanner("Stripe asked you to retry. Click Connect to continue.");
      return;
    }
    if (status !== "connected") return;

    setBanner("Syncing your Stripe account status…");
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/account-status", {
          method: "POST",
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setBanner(json.error || "Could not refresh Stripe status.");
          return;
        }
        setBanner(
          json.payouts_enabled
            ? "Stripe account connected — you're ready to receive payouts."
            : "We received your Stripe info. Payouts may take a few minutes to enable.",
        );
        // Refresh the server component layout so the badge updates.
        router.refresh();
      } catch (e) {
        if (!cancelled) setBanner(e.message || "Could not refresh status.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  const start = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Could not open Stripe.");
      }
      if (json.newTab) {
        // Open Stripe Express Dashboard in a new tab so the creator can
        // close it and return to their profile easily.
        window.open(json.url, "_blank", "noopener,noreferrer");
        setLoading(false);
      } else {
        window.location.href = json.url;
      }
    } catch (e) {
      setErr(e.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const enabled = creator.stripePayoutsEnabled;
  const hasAccount = Boolean(creator.stripeAccountId);

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent">
            <CreditCard size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink">
              Payouts
            </h3>
            <p className="mt-1 text-sm text-muted">
              {enabled
                ? "Your Stripe account is connected and ready to receive payouts."
                : hasAccount
                  ? "Your Stripe account needs more info before you can receive payouts."
                  : "Connect Stripe so brands can pay you for completed work."}
            </p>
          </div>
        </div>
        <StatusPill enabled={enabled} hasAccount={hasAccount} />
      </div>

      {!enabled && (
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 text-accent" />
            Free to set up. Stripe handles KYC and tax forms.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 text-accent" />
            Funds are held in escrow until the brand approves your delivery.
          </li>
        </ul>
      )}

      {banner && (
        <p className="mt-4 rounded-lg bg-surface-sunken px-3 py-2 text-sm text-ink-soft">
          {banner}
        </p>
      )}

      {err && (
        <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {err}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={start}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#635BFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5247e6] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CreditCard size={16} />
          )}
          {loading
            ? "Opening Stripe…"
            : enabled
              ? "Manage Stripe account"
              : hasAccount
                ? "Continue Stripe setup"
                : "Connect Stripe account"}
        </button>

        {hasAccount && <ResetStripeButton country={creator.country} />}
      </div>
    </div>
  );
}

function StatusPill({ enabled, hasAccount }) {
  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
        <CheckCircle2 size={12} /> Active
      </span>
    );
  }
  if (hasAccount) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
        <AlertCircle size={12} /> Action needed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2.5 py-1 text-xs font-semibold text-muted">
      Not connected
    </span>
  );
}
