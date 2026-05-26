"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FadeIn } from "@/hooks/useFadeIn";

const MIN_BUDGET = 100;
const MAX_BUDGET = 1000;
const TRADITIONAL_PRICE = 200;
const JRIVE_AVG_PRICE = 40; // midpoint of $20-60
const JRIVE_LOW = 20;
const JRIVE_HIGH = 60;

function useAnimatedNumber(target, duration = 350) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);

    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const next = fromRef.current + (target - fromRef.current) * eased;
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

function fmt(n) {
  return Math.round(n).toLocaleString();
}

export default function BudgetCalculator() {
  const [budget, setBudget] = useState(500);

  // Targets
  const videosWithout = budget / TRADITIONAL_PRICE;
  const videosWithLow = budget / JRIVE_HIGH;
  const videosWithHigh = budget / JRIVE_LOW;
  const videosWithAvg = budget / JRIVE_AVG_PRICE;
  // Savings: cost to produce same # of videos (videosWithout) at JriveContent avg
  const savings = budget - videosWithout * JRIVE_AVG_PRICE;
  const growthMultiplier = videosWithAvg / Math.max(videosWithout, 0.01);

  // Animated values
  const aBudget = useAnimatedNumber(budget);
  const aVideosWithout = useAnimatedNumber(videosWithout);
  const aVideosLow = useAnimatedNumber(videosWithLow);
  const aVideosHigh = useAnimatedNumber(videosWithHigh);
  const aSavings = useAnimatedNumber(savings);
  const aGrowth = useAnimatedNumber(growthMultiplier);

  // Bar widths (relative scale: max possible videos at min price)
  const maxScale = MAX_BUDGET / JRIVE_LOW; // 50
  const widthWithout = `${(aVideosWithout / maxScale) * 100}%`;
  const widthWith = `${(aVideosHigh / maxScale) * 100}%`;

  const sliderPct = ((budget - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;

  return (
    <section id="calculator" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-6xl md:text-6xl font-semibold tracking-tight text-brand-ink">
              Double your output with the{" "}
              <span className="text-brand-skyDeep">same budget</span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Drag the slider to your monthly content budget and see exactly how much
              more you get with JriveContent.
            </p>
          </div>
        </FadeIn>

        {/* Slider */}
        <FadeIn delay={100}>
          <div className="max-w-3xl mx-auto rounded-3xl bg-brand-mist border border-brand-sky/40 p-6 md:p-8 mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Your monthly content budget
              </span>
              <span className="text-2xl md:text-3xl font-bold text-brand-ink tabular-nums">
                ${fmt(aBudget)}
              </span>
            </div>

            <div className="relative pt-2 pb-1">
              {/* Track fill */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-200 pointer-events-none" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-brand-skyDeep pointer-events-none transition-all duration-200 ease-out"
                style={{ width: `${sliderPct}%` }}
              />
              <input
                type="range"
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="budget-slider relative w-full appearance-none bg-transparent cursor-pointer h-6"
                aria-label="Monthly content budget"
              />
            </div>

            <div className="flex justify-between text-xs font-medium text-slate-500 mt-1">
              <span>${MIN_BUDGET}</span>
              <span>${MAX_BUDGET.toLocaleString()}</span>
            </div>
          </div>
        </FadeIn>

        {/* Comparison cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Without */}
          <FadeIn delay={150}>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 h-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
                  Without JriveContent
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-brand-ink">
                Traditional UGC pricing
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                ~$200 per 30s video on freelance platforms
              </p>

              <Metric
                label="Videos you can afford"
                value={`${fmt(aVideosWithout)}`}
                sub="videos / month"
                tone="bad"
                barWidth={widthWithout}
                barClass="bg-rose-300"
              />

              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <Item bad>Expensive to test different videos</Item>
                <Item bad>Burn through your budget fast</Item>
                <Item bad>Never knowing what works</Item>
                <Item bad>Slow, unpredictable growth</Item>
              </ul>
            </div>
          </FadeIn>

          {/* With */}
          <FadeIn delay={250}>
            <div className="rounded-3xl border-2 border-brand-sky bg-brand-mist p-6 md:p-8 h-full relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center rounded-full bg-brand-ink text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1">
                  Up to 80% cheaper
                </span>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center rounded-full bg-brand-skyDeep/15 text-brand-skyDeep text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1">
                  With JriveContent
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-brand-ink">
                Affordable creator pricing
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                $20–60 per video from real creators
              </p>

              <Metric
                label="Videos you can afford"
                value={`${fmt(aVideosLow)}–${fmt(aVideosHigh)}`}
                sub="videos / month"
                tone="good"
                barWidth={widthWith}
                barClass="bg-brand-skyDeep"
              />

              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <Item good>Test tons of variations fast</Item>
                <Item good>Stretch your budget {fmt(aGrowth)}× further</Item>
                <Item good>Find what actually works</Item>
                <Item good>Scale content to grow your business</Item>
              </ul>
            </div>
          </FadeIn>
        </div>

        {/* Summary callout */}
        <FadeIn delay={300}>
          <div className="mt-8 rounded-3xl bg-brand-ink text-white p-8 md:p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-skyDeep/20 via-transparent to-transparent pointer-events-none" />
            <div className="relative">
              <p className="text-sm uppercase tracking-wider text-brand-sky font-semibold">
                With a ${fmt(aBudget)} budget
              </p>
              <p className="mt-3 text-2xl md:text-4xl font-semibold leading-tight">
                You save up to{" "}
                <span className="text-brand-sky tabular-nums">${fmt(aSavings)}</span>{" "}
                <span className="text-slate-300">/month</span>
                <br className="hidden sm:block" />
                <span className="text-slate-200">
                  and get{" "}
                </span>
                <span className="text-brand-sky tabular-nums">{fmt(aGrowth)}×</span>{" "}
                <span className="text-slate-200">more content to test &amp; grow</span>
              </p>

              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-skyDeep text-white px-7 py-3.5 font-medium hover:bg-white hover:text-brand-ink transition shadow-lg shadow-brand-sky/20"
              >
                Start saving on UGC
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>

      <style jsx>{`
        .budget-slider {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }
        .budget-slider:focus {
          outline: none;
        }
        .budget-slider::-webkit-slider-runnable-track {
          height: 8px;
          background: transparent;
          border-radius: 9999px;
        }
        .budget-slider::-moz-range-track {
          height: 8px;
          background: transparent;
          border-radius: 9999px;
        }
        .budget-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 28px;
          width: 28px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #38bdf8;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
          cursor: grab;
          margin-top: -10px;
          transition: transform 0.15s ease;
        }
        .budget-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .budget-slider::-moz-range-thumb {
          height: 28px;
          width: 28px;
          border-radius: 9999px;
          background: #ffffff;
          border: 3px solid #38bdf8;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.18);
          cursor: grab;
        }
      `}</style>
    </section>
  );
}

function Metric({ label, value, sub, barWidth, barClass }) {
  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl md:text-5xl font-bold text-brand-ink tabular-nums">
          {value}
        </span>
        <span className="text-sm text-slate-500">{sub}</span>
      </div>
      <div className="mt-3 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${barClass} transition-[width] duration-300 ease-out`}
          style={{ width: barWidth }}
        />
      </div>
    </div>
  );
}

function Item({ children, good, bad }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full ${
          good ? "bg-brand-skyDeep/15 text-brand-skyDeep" : "bg-rose-100 text-rose-600"
        }`}
        aria-hidden
      >
        {good ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </li>
  );
}
