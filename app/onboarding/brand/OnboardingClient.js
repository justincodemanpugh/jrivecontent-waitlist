"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { completeOnboarding } from "@/lib/onboarding/actions";
import { logOnboardingEvent } from "@/lib/onboarding/analytics";
import { recallScan } from "@/lib/vibecode/lastScan";

// One screen: confirm the app's name (creators see it) and accept the terms.
// The name and link are filled in from the plan, so nobody answers twice.
export default function OnboardingClient({ initial, userEmail }) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    logOnboardingEvent({ role: "brand", event: "onboarding_started", stepIndex: 0 });
    logOnboardingEvent({ role: "brand", event: "step_viewed", stepIndex: 0 });
    // Someone who scanned a link but has no saved plan still has it here.
    const remembered = recallScan();
    if (remembered) setData((d) => (d.website ? d : { ...d, website: remembered }));
  }, []);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    if (!data.brand_name.trim()) return setError("Please enter your app's name.");
    if (!data.terms_accepted) return setError("Please agree to the Terms and Privacy Policy.");
    setError("");
    startTransition(async () => {
      logOnboardingEvent({ role: "brand", event: "step_completed", stepIndex: 0 });
      const res = await completeOnboarding({
        brand_name: data.brand_name,
        website: data.website,
        terms_accepted: data.terms_accepted,
      });
      if (res && !res.ok) setError(res.error);
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-xs font-medium text-slate-500">Signed in as {userEmail}</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">One last thing</h1>
          <p className="mt-1 text-sm text-slate-600">This is how creators will see you.</p>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-ink">App or brand name</span>
            <input
              type="text"
              value={data.brand_name}
              onChange={(e) => update({ brand_name: e.target.value })}
              placeholder="e.g. FitLog"
              className={INPUT}
              maxLength={120}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-brand-ink">Link (optional)</span>
            <input
              type="text"
              value={data.website}
              onChange={(e) => update({ website: e.target.value })}
              placeholder="yourapp.com"
              className={INPUT}
              maxLength={240}
            />
          </label>

          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={data.terms_accepted}
              onChange={(e) => update({ terms_accepted: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-skyDeep focus:ring-brand-sky/40"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-skyDeep hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-skyDeep hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Open my dashboard
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

const INPUT =
  "block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30";
