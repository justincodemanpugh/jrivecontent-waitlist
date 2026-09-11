"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";
import { rememberScan, recallScan } from "@/lib/vibecode/lastScan";
import VibecodeResults from "./VibecodeResults";
import VibecodeSkeleton from "./VibecodeSkeleton";

// The scanner owns the whole page's state, which is why the marketing
// sections are passed in as children: once a scan produces results they
// unmount entirely and the page becomes just the results. Someone who has
// already acted doesn't need to be sold to, and leaving pricing and the FAQ
// below their creator list buries the thing they came for.
//
// Scanning happens in two requests on purpose. The App Store lookup resolves
// in a few hundred milliseconds while matching creators and re-signing
// thumbnails takes longer, so stage one paints the visitor's own app icon
// almost immediately and stage two fills in underneath. Seeing your own app
// appear is far more convincing than any spinner.
//
// Two ways in besides typing: `?app=` re-runs a scan after signup (served from
// the metadata cache, so returning from checkout is free), and a URL
// remembered in localStorage survives the auth redirect chain.
export default function VibecodeHero({ children }) {
  const params = useSearchParams();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const resultsRef = useRef(null);

  // Bumped on every scan so a slow response from an abandoned scan can't
  // overwrite the results of a newer one.
  const runId = useRef(0);

  const runScan = useCallback(async (value, { niche = null } = {}) => {
    const target = String(value || "").trim();
    if (!target) {
      setError("Paste a link to your app first.");
      setStatus("error");
      return;
    }

    const id = ++runId.current;
    setStatus("loading");
    setError("");
    // A niche change refines results already on screen — clearing them would
    // collapse the page and throw away the reader's place.
    if (!niche) setData(null);

    const post = (body) =>
      fetch("/api/vibecode/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    try {
      // Stage one — the app card, fast. Skipped on a niche change, where the
      // card is already correct and only the matches need redoing.
      if (!niche) {
        const appRes = await post({ url: target, stage: "app" });
        const appBody = await appRes.json().catch(() => ({}));
        if (id !== runId.current) return;

        if (!appRes.ok) {
          setError(appBody?.error || "Something went wrong. Try again in a minute.");
          setStatus("error");
          return;
        }
        setData({ ...appBody, locked: true, partial: true });
      }

      // Stage two — creators, videos, thumbnails.
      const res = await post(niche ? { url: target, niche } : { url: target });
      const body = await res.json().catch(() => ({}));
      if (id !== runId.current) return;

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
    } catch {
      if (id !== runId.current) return;
      setError("We couldn't reach the scanner. Check your connection and try again.");
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    runId.current += 1;
    setData(null);
    setStatus("idle");
    setError("");
    setUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;

    const fromQuery = params.get("app");
    const remembered = recallScan();

    if (fromQuery) {
      setUrl(fromQuery);
      runScan(fromQuery);
    } else if (remembered) {
      setUrl(remembered);
      // Coming back from checkout, where the point is to see it unlocked.
      if (params.get("unlocked")) runScan(remembered);
    }
  }, [params, runScan]);

  const loading = status === "loading";
  const hasResults = Boolean(data);
  // A finished scan replaces the marketing page; a scan still in flight keeps
  // it, so the page doesn't go blank mid-request.
  const showMarketing = !hasResults;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-mist via-brand-mist/40 to-white pb-16">
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
              Paste your app link. See the TikToks already working in your niche
              — and the creators who&apos;ll make them for you.
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
                    <Loader2 size={18} className="animate-spin motion-reduce:hidden" />
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
        </div>
      </section>

      <div ref={resultsRef} className="scroll-mt-24 bg-white">
        {hasResults && (
          data.partial ? (
            <VibecodeSkeleton app={data.app} />
          ) : (
            <VibecodeResults
              data={data}
              appUrl={scannedUrl}
              busy={loading}
              onReset={reset}
              onNicheChange={(niche) => runScan(scannedUrl || url, { niche })}
            />
          )
        )}
      </div>

      {showMarketing && children}
    </>
  );
}
