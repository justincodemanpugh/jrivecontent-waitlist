"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FadeIn } from "@/hooks/useFadeIn";

const TRADITIONAL_PRICE_PER_VIDEO = 140;
const JRIVE_AVG_PRICE = 25;

const VIDEO_LENGTHS = [15, 30, 60];

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
      const eased = 1 - Math.pow(1 - t, 3);
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
  const [videoCount, setVideoCount] = useState(3);
  const [videoLength, setVideoLength] = useState(30);
  const [revisions, setRevisions] = useState(2);

  // Pricing calculations
  const traditionalPrice = videoCount * TRADITIONAL_PRICE_PER_VIDEO + revisions * 50;
  const jrivePrice = videoCount * JRIVE_AVG_PRICE + revisions * 5;
  const savings = traditionalPrice - jrivePrice;
  const savingsPercent = Math.round((savings / traditionalPrice) * 100);

  // Animated values
  const aTraditionalPrice = useAnimatedNumber(traditionalPrice);
  const aJrivePrice = useAnimatedNumber(jrivePrice);
  const aSavingsPercent = useAnimatedNumber(savingsPercent);

  return (
    <section id="calculator" className="py-16 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn delay={100}>
          <div className="rounded-3xl bg-brand-mist border border-brand-sky/40 p-6 md:p-8">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-brand-ink mb-6">
              How much do I have to pay per video?
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left side - Sliders */}
              <div className="space-y-6">
                {/* Video Count Slider */}
                <SliderControl
                  label="Video Count"
                  value={videoCount}
                  min={1}
                  max={10}
                  step={1}
                  onChange={setVideoCount}
                />

                {/* Video Length Slider */}
                <SliderControl
                  label="Video Length"
                  value={videoLength}
                  min={15}
                  max={60}
                  step={15}
                  onChange={setVideoLength}
                  suffix="s"
                />

                {/* Revisions Slider */}
                <SliderControl
                  label="Revisions"
                  value={revisions}
                  min={0}
                  max={5}
                  step={1}
                  onChange={setRevisions}
                />
              </div>

              {/* Right side - Pricing Comparison */}
              <div className="flex flex-col justify-center">
                {/* Pricing Box */}
                <div className="rounded-2xl bg-white border border-slate-200 p-6 mb-6">
                  {/* Traditional Agency Price */}
                  <div className="mb-2">
                    <p className="text-sm font-medium text-slate-500">Traditional agency price</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Traditional agency baseline: {videoCount} video{videoCount > 1 ? "s" : ""} + {revisions} revision{revisions !== 1 ? "s" : ""} = ${fmt(traditionalPrice)}
                    </p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold text-brand-ink tabular-nums mb-4">
                    ~ ${fmt(aTraditionalPrice)}.00
                  </p>

                  {/* VS divider */}
                  <div className="flex items-center justify-center my-4">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                      vs
                    </span>
                  </div>

                  {/* JriveContent Price */}
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-brand-skyDeep">With JriveContent</p>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <p className="text-4xl md:text-5xl font-bold text-brand-skyDeep tabular-nums">
                      ~ ${fmt(aJrivePrice)}.00
                    </p>
                    <span className="text-base font-semibold text-rose-500">
                      -{fmt(aSavingsPercent)}%
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand-skyDeep text-white px-7 py-4 font-medium hover:bg-brand-ink transition shadow-lg shadow-brand-sky/20"
                >
                  Get started
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
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
          height: 6px;
          background: transparent;
          border-radius: 9999px;
        }
        .budget-slider::-moz-range-track {
          height: 6px;
          background: transparent;
          border-radius: 9999px;
        }
        .budget-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #38bdf8;
          box-shadow: 0 2px 6px rgba(56, 189, 248, 0.3);
          cursor: grab;
          margin-top: -5px;
          transition: transform 0.15s ease;
        }
        .budget-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.1);
        }
        .budget-slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 9999px;
          background: #ffffff;
          border: 2px solid #38bdf8;
          box-shadow: 0 2px 6px rgba(56, 189, 248, 0.3);
          cursor: grab;
        }
      `}</style>
    </section>
  );
}

function SliderControl({ label, value, min, max, step, onChange, suffix = "" }) {
  const sliderPct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-brand-ink">{label}</span>
        <span className="text-sm font-semibold text-brand-ink tabular-nums">
          {value}{suffix}
        </span>
      </div>
      <div className="relative pt-1 pb-1">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-slate-200 pointer-events-none" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-brand-skyDeep pointer-events-none transition-all duration-200 ease-out"
          style={{ width: `${sliderPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="budget-slider relative w-full appearance-none bg-transparent cursor-pointer h-4"
          aria-label={label}
        />
      </div>
    </div>
  );
}
