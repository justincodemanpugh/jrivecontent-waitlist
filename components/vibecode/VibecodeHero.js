"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";
import { rememberScan, recallScan } from "@/lib/vibecode/lastScan";
import VibecodeResults from "./VibecodeResults";

// The hero is the tool. Everything below it on the page exists to explain
// what just happened in here.
//
// Two ways in: someone pastes a link, or they arrive back from signup with
// ?app=... — the second is the unlock round trip, where the same scan is
// re-requested now that the session carries a subscription. That second call
// is served from the scan cache, so returning from checkout costs nothing.
export default function VibecodeHero() {
  const params = useSearchParams();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const resultsRef = useRef(null);

  const runScan = useCallback(async (value, { scroll = true } = {}) => {
    const target = String(value || "").trim();
    if (!target) {
      setError("Paste a link to your app first.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    setData(null);

    try {
      const res = await fetch("/api/vibecode/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(body?.error || "Something went wrong. Try again in a minute.");
        setStatus("error");
        return;
      }

      setData(body);
      setScannedUrl(target);
      setStatus("done");
      // Survives the signup redirect chain, so the unlocked re-scan and the
      // onboarding website field don't make them retype it.
      rememberScan(target);
      if (scroll) {
        // Let the results mount before scrolling to them.
        requestAnimationFrame(() =>
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
      }
    } catch {
      setError("We couldn't reach the scanner. Check your connection and try again.");
      setStatus("error");
    }
  }, []);

  // Returning visitors. `?app=` is an explicit request to scan that link, so
  // it re-runs on its own (free — the scan cache serves it, and now that the
  // session may carry a subscription it comes back unlocked). A URL merely
  // remembered from a previous visit only prefills the box: re-scanning
  // something on page load because you were once here would be surprising.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;

    const fromQuery = params.get("app");
    const remembered = recallScan();

    if (fromQuery) {
      setUrl(fromQuery);
      runScan(fromQuery, { scroll: false });
    } else if (remembered) {
      setUrl(remembered);
      // Coming back from checkout, where the point is to see it unlocked.
      if (params.get("unlocked")) runScan(remembered, { scroll: false });
    }
  }, [params, runScan]);

  const loading = status === "loading";

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-mist via-brand-mist/40 to-white pb-20">
      <div className="relative mx-auto max-w-5xl px-6 pt-16 text-center">
        <FadeIn delay={50}>
          <div className="mb-7 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-mist px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-skyDeep ring-1 ring-brand-sky/40">
              <Sparkles size={13} />
              For people who ship fast
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={120}>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-brand-ink sm:text-6xl md:text-7xl">
            You built the app<span className="text-brand-sky">.</span>
            <br className="hidden sm:block" /> Now get real users
            <span className="text-brand-skyDeep">.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={220}>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl">
            Paste your app link. We&apos;ll show you the TikTok creators whose
            audience already matches it — and the exact videos to have them make.
          </p>
        </FadeIn>

        <FadeIn delay={320}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runScan(url);
            }}
            className="mx-auto mt-9 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="vibecode-app-url" className="sr-only">
              Your app&apos;s App Store or web link
            </label>
            <input
              id="vibecode-app-url"
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="apps.apple.com/… or yourapp.com"
              disabled={loading}
              className="w-full flex-1 rounded-full border border-slate-200 bg-white px-6 py-4 text-base text-brand-ink shadow-sm placeholder:text-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-skyDeep to-brand-sky px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-sky/30 transition hover:brightness-105 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Scanning
                </>
              ) : (
                <>
                  Scan my app
                  <ArrowRight size={18} className="transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </FadeIn>

        <FadeIn delay={420}>
          <p className="mt-5 text-sm text-slate-400">
            Free · no account needed to scan
          </p>
        </FadeIn>

        {error && (
          <p
            role="alert"
            className="mx-auto mt-6 max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-8 text-sm text-slate-500">
            Reading your listing, matching creators, writing concepts — about 15 seconds.
          </p>
        )}
      </div>

      <div ref={resultsRef} className="scroll-mt-24">
        {status === "done" && data && <VibecodeResults data={data} appUrl={scannedUrl} />}
      </div>
    </section>
  );
}
