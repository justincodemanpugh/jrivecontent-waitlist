"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { nameForCountry } from "@/lib/countries";

// Small destructive action used in both the brand and creator Stripe
// payouts cards. Deletes the connected Stripe account (so its locked
// country can be reset) and clears the local link. See
// `app/api/stripe/reset/route.js` for the server-side rules.
//
// Props:
//   - country: ISO 3166-1 alpha-2 code currently stamped on the Stripe
//     account, used to make the warning message specific ("...currently
//     locked to Canada"). Optional.
//   - onReset: optional callback fired after a successful reset, before
//     the router refresh. Lets the parent card flip its local state.
export default function ResetStripeButton({ country, onReset }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const reset = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/reset", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Could not reset Stripe account.");
      }
      onReset?.();
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    if (loading) return;
    setOpen(false);
    setErr("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-rose-600 hover:text-rose-700 underline-offset-4 hover:underline"
      >
        Reset Stripe account
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
          onClick={close}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              disabled={loading}
              aria-label="Close"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={20} />
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-brand-ink">
                  Reset your Stripe account?
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  This permanently deletes your current Stripe connected
                  account
                  {country ? (
                    <>
                      {" "}
                      (currently locked to{" "}
                      <span className="font-semibold">
                        {nameForCountry(country) || country}
                      </span>
                      )
                    </>
                  ) : null}
                  . You'll need to connect Stripe again and complete KYC
                  from scratch.
                </p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                Stripe will refuse if your account has any balance, pending
                payouts, or unresolved charges. Withdraw or clear those
                first.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                Past payouts and transfers stay in Stripe's records, but
                this account ID can never be used again.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                Make sure your country is set correctly in your profile
                <strong> before</strong> reconnecting — Stripe locks it again
                on the new account.
              </li>
            </ul>

            {err && (
              <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                {loading ? "Resetting…" : "Yes, delete & reset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
