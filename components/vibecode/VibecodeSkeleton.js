"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

// Shown between the two scan requests: the app card is already real, the
// creators are still loading.
//
// Two things earn their place here. The app card is not a placeholder — stage
// one of the scan has already returned the visitor's own icon, name and
// category, and seeing your own app come back is the moment the tool stops
// feeling like a form. And the tile grid is laid out at its final size, so
// nothing jumps when the real thumbnails arrive.
//
// The status lines below are real stages, not decoration — they correspond to
// work the server is actually doing in the second request (matching the niche,
// querying creators, re-signing TikTok thumbnails). They advance on a timer
// only because the request is a single round trip; the wording never claims a
// step finished that hasn't started.
const STAGES = [
  "Matching your niche…",
  "Finding creators…",
  "Pulling their best posts…",
];

export default function VibecodeSkeleton({ app }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stop at the last line rather than looping — a spinner that keeps
    // restarting its story reads as stuck.
    const timers = STAGES.slice(1).map((_, i) =>
      setTimeout(() => setStage(i + 1), (i + 1) * 1400),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 text-left">
      {/* Real data, already returned by stage one. */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        {app?.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={app.iconUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl bg-brand-mist object-cover"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-brand-mist motion-reduce:animate-none" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-brand-ink">
              {app?.name || "Reading your listing…"}
            </h2>
            {app?.category && (
              <span className="rounded-full bg-brand-mist px-2.5 py-0.5 text-[11px] font-semibold text-brand-skyDeep">
                {app.category}
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500" aria-live="polite">
            <Loader2 size={14} className="animate-spin text-brand-sky motion-reduce:hidden" />
            {STAGES[stage]}
          </p>
        </div>

        <ol className="hidden shrink-0 gap-1 text-[11px] text-slate-400 sm:flex sm:flex-col">
          {STAGES.map((label, i) => (
            <li key={label} className="flex items-center gap-1.5">
              {i < stage ? (
                <Check size={12} className="text-brand-sky" />
              ) : (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-300" />
              )}
              <span className={i <= stage ? "text-slate-500" : ""}>{label}</span>
            </li>
          ))}
        </ol>
      </div>

      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h3 className="font-display text-2xl font-bold text-brand-ink">
            What&apos;s working in your niche
          </h3>
        </div>
        {/* Final grid geometry, so the real thumbnails drop straight in. */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[9/13] animate-pulse rounded-xl bg-gradient-to-br from-brand-mist to-slate-200 motion-reduce:animate-none"
              // Staggered so the grid ripples rather than strobing as one block.
              style={{ animationDelay: `${(i % 6) * 110}ms` }}
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 pb-3">
          <h3 className="font-display text-2xl font-bold text-brand-ink">
            Creators for your app
          </h3>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 motion-reduce:animate-none"
              style={{ animationDelay: `${i * 140}ms` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
