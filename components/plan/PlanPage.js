"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import PlanPreview, { UnlockCard } from "@/components/start/PlanPreview";
import { openBillingPortal, startBrandSubscription } from "@/lib/dashboard/brand/billingApi";
import {
  FIRST_TIME_PRICE_LINE,
  NEW_SUBSCRIBER_LINE,
  RETURNING_PRICE_LINE,
} from "@/lib/billing/pricing";
import { parsePlanQuery } from "@/lib/plan/query";
import { normalizeAnswers } from "@/lib/plan/questions";

// The saved plan. Arrives three ways: from the onboarding with the inputs in
// the address, back from Stripe Checkout, or a later visit.

const CONFIRM_TRIES = 10;
const CONFIRM_WAIT_MS = 2000;

// The onboarding's saved state, for when the inputs didn't make it through
// sign-up in the address.
function fromOnboarding() {
  try {
    const saved = JSON.parse(window.localStorage.getItem("jrive:start"));
    return saved?.url && normalizeAnswers(saved.answers) ? saved : null;
  } catch {
    return null;
  }
}

async function request(method, body) {
  const res = await fetch("/api/plan", {
    method,
    cache: "no-store",
    ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "We couldn't load your plan.");
  return data;
}

const save = ({ url, niche, appName, answers }) => request("POST", { url, niche, appName, answers });

export default function PlanPage({ email, creatorOnly }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false); // back from a completed checkout
  const [waiting, setWaiting] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    setError("");
    const params = new URLSearchParams(window.location.search);
    const justPaid = params.get("checkout") === "success";
    setPaid(justPaid);
    try {
      const incoming = parsePlanQuery(params);
      let result = incoming ? await save(incoming) : await request("GET");
      if (!result.saved) {
        const local = fromOnboarding();
        if (local) result = await save(local);
      }
      // So a refresh doesn't save or confirm again.
      if (incoming || justPaid) window.history.replaceState(null, "", "/plan");
      if (!alive.current) return;
      setData(result);

      // Stripe tells our server about the payment a moment after sending
      // the buyer back.
      if (justPaid && result.locked) {
        setWaiting(true);
        for (let i = 0; i < CONFIRM_TRIES && alive.current; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, CONFIRM_WAIT_MS));
          const next = await request("GET");
          if (!alive.current) return;
          setData(next);
          if (!next.locked) break;
        }
        setWaiting(false);
      }
    } catch (e) {
      if (alive.current) {
        setWaiting(false);
        setError(e.message);
      }
    }
  }, []);

  const started = useRef(false);
  useEffect(() => {
    alive.current = true;
    if (!started.current && !creatorOnly) {
      started.current = true;
      load();
    }
    return () => {
      alive.current = false;
    };
  }, [load, creatorOnly]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Logo size={32} />
          JriveContent
        </Link>
        <form action="/auth/signout" method="post" className="flex items-center gap-3 text-sm text-slate-500">
          <span className="hidden sm:inline">{email}</span>
          <button type="submit" className="font-semibold hover:text-brand-ink">
            Sign out
          </button>
        </form>
      </header>

      {creatorOnly ? (
        <Message title="This is a creator account">
          <p>Plans are for founders with an app. Sign out and sign up with a different email.</p>
          <Link href="/dashboard/creator" className={BUTTON}>
            Go to my creator dashboard
          </Link>
        </Message>
      ) : error && !data ? (
        <Message title="Something went wrong">
          <p role="alert">{error}</p>
          <button type="button" onClick={load} className={BUTTON}>
            Try again
          </button>
        </Message>
      ) : !data ? (
        <Message title="Loading your plan">
          <Loader2 size={32} className="mx-auto animate-spin text-brand-skyDeep" aria-label="Loading" />
        </Message>
      ) : !data.saved ? (
        // Someone can pay before they have a plan (the pricing cards).
        <Message title={paid ? "Payment received. Now make your plan." : "You don't have a plan yet"}>
          <p>Paste your app link and answer a few questions. It takes about a minute.</p>
          <Link href="/start" className={BUTTON}>
            Get my plan
          </Link>
        </Message>
      ) : (
        <>
          {paid && !data.locked && (
            <p role="status" className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              You&apos;re in. Your full plan is below.
            </p>
          )}
          <PlanPreview
            data={data}
            unlock={
              data.locked ? <Checkout data={data} waiting={waiting || paid} /> : <Manage />
            }
          />
          <Link href="/start" className="mx-auto mt-4 block w-fit py-2 text-sm text-slate-500 hover:text-brand-ink">
            Make a plan for another app
          </Link>
        </>
      )}
    </div>
  );
}

function Checkout({ data, waiting }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Never offer to pay again while a payment is being confirmed.
  if (waiting || data.confirming) {
    return (
      <UnlockCard title="Confirming your payment" line="This usually takes a few seconds.">
        <button type="button" onClick={() => window.location.reload()} className={LIGHT_BUTTON}>
          Refresh
        </button>
      </UnlockCard>
    );
  }

  const eligible = data.trialEligible;
  const line =
    eligible === true ? FIRST_TIME_PRICE_LINE : eligible === false ? RETURNING_PRICE_LINE : NEW_SUBSCRIBER_LINE;

  const pay = async () => {
    setBusy(true);
    setError("");
    try {
      window.location.href = await startBrandSubscription("/plan", { expectTrial: eligible === true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <UnlockCard title="Unlock your full plan" line={line}>
      <button type="button" onClick={pay} disabled={busy} className={LIGHT_BUTTON}>
        {busy ? "Opening checkout…" : eligible === false ? "Unlock for $25/month" : "Unlock for $1"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400">
        By paying you agree to the{" "}
        <Link href="/terms" target="_blank" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" target="_blank" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </UnlockCard>
  );
}

// Cancelling has to be as easy to find as paying was.
function Manage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    setBusy(true);
    setError("");
    try {
      window.location.href = await openBillingPortal("/plan");
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="mt-12 rounded-3xl border border-slate-200 p-6 text-center">
      <Link href="/dashboard/brand" className={BUTTON}>
        Go to my dashboard
      </Link>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="mx-auto mt-3 block py-2 text-sm text-slate-500 underline underline-offset-4 hover:text-brand-ink"
      >
        {busy ? "Opening…" : "Manage or cancel my subscription"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

const BUTTON =
  "inline-flex rounded-full bg-brand-ink px-8 py-4 font-semibold text-white transition hover:bg-slate-800";
const LIGHT_BUTTON =
  "inline-flex rounded-full bg-white px-8 py-4 font-semibold text-brand-ink transition hover:bg-slate-100 disabled:opacity-60";

function Message({ title, children }) {
  return (
    <section className="mx-auto max-w-md pt-16 text-center">
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      <div className="mt-6 space-y-6 text-slate-600">{children}</div>
    </section>
  );
}
