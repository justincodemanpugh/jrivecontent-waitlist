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
import ResetStripeButton from "@/components/dashboard/ResetStripeButton";

/**
 * Brand-side payouts/escrow setup card. Mirrors the creator
 * StripePayoutsCard but uses the brand Connect endpoints. Funds that
 * brands deposit into a gig are routed to *this* connected account
 * (destination charge with application_fee), so on approval we can
 * release the per-video share to the creator straight from the brand's
 * Connect balance.
 */
export default function BrandStripePayoutsCard({ initial }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState({
    hasAccount: !!initial?.stripe_account_id,
    detailsSubmitted: !!initial?.stripe_details_submitted,
    chargesEnabled: !!initial?.stripe_charges_enabled,
    payoutsEnabled: !!initial?.stripe_payouts_enabled,
  });
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
        const res = await fetch("/api/stripe/brand-account-status", {
          method: "POST",
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setBanner(json.error || "Could not refresh Stripe status.");
          return;
        }
        setState({
          hasAccount: !!json.connected,
          detailsSubmitted: !!json.details_submitted,
          chargesEnabled: !!json.charges_enabled,
          payoutsEnabled: !!json.payouts_enabled,
        });
        setBanner(
          json.charges_enabled
            ? "Stripe connected — you can now fund gigs into your escrow."
            : "We received your Stripe info. It may take a few minutes to enable.",
        );
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
      const res = await fetch("/api/stripe/brand-connect", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Could not open Stripe.");
      }
      if (json.newTab) {
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

  const { hasAccount, chargesEnabled } = state;
  const ready = hasAccount && chargesEnabled;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent">
            <CreditCard size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-ink">
              Escrow account
            </h3>
            <p className="mt-1 text-sm text-muted">
              {ready
                ? "Your Stripe account is connected. Gig deposits go here and we release the per-video share to the creator when you approve."
                : hasAccount
                  ? "Your Stripe account needs a bit more info before you can deposit."
                  : "Connect Stripe so your gig deposits can sit in your own escrow until you approve each video."}
            </p>
          </div>
        </div>
        <StatusPill ready={ready} hasAccount={hasAccount} />
      </div>

      {!ready && (
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 text-accent" />
            Free to set up. Stripe handles KYC and verification.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 text-accent" />
            Funds stay in <em>your</em> Stripe balance until you approve a
            video — not in a shared platform pool.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 text-accent" />
            On approval, the creator's share is transferred instantly. We
            keep our 15% as a platform fee.
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
            : ready
              ? "Manage Stripe account"
              : hasAccount
                ? "Continue Stripe setup"
                : "Connect Stripe account"}
        </button>

        {hasAccount && (
          <ResetStripeButton
            country={initial?.country || null}
            onReset={() =>
              setState({
                hasAccount: false,
                detailsSubmitted: false,
                chargesEnabled: false,
                payoutsEnabled: false,
              })
            }
          />
        )}
      </div>
    </div>
  );
}

function StatusPill({ ready, hasAccount }) {
  if (ready) {
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
