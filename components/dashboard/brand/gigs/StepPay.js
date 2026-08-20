"use client";

import { Sparkles, TrendingUp } from "lucide-react";
import StepShell from "./StepShell";
import { MIN_PAY, RECOMMENDED_PAY } from "@/lib/dashboard/brand/gigForm";

const PRESETS = [20, 30, 50, 75];

export default function StepPay({ form, update }) {
  const value = form.payPerVideo;
  const n = Number(value);
  const belowMin = Number.isFinite(n) && n < MIN_PAY;

  return (
    <StepShell
      title="How much per video?"
      subtitle={`We recommend $${RECOMMENDED_PAY} per video for most short-form UGC.`}
    >
      {/* Amount input */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Pay per video
        </label>
        <div className="relative max-w-xs">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink font-semibold">
            $
          </span>
          <input
            type="number"
            min={MIN_PAY}
            inputMode="numeric"
            value={value}
            onChange={(e) =>
              update({ payPerVideo: e.target.value === "" ? "" : Number(e.target.value) })
            }
            className="w-full rounded-xl border border-line bg-surface pl-9 pr-4 py-3 text-lg font-semibold text-ink focus:border-accent focus:ring-2 focus:ring-accent-soft/30 outline-none transition"
          />
        </div>
        {belowMin && (
          <p className="mt-2 text-xs text-warn">
            Minimum is ${MIN_PAY}. Higher pay gets faster, better applicants.
          </p>
        )}
      </div>

      {/* Presets */}
      <div>
        <p className="text-xs font-medium text-muted mb-2">Quick picks</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const active = Number(value) === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => update({ payPerVideo: p })}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium border transition",
                  active
                    ? "bg-ink text-on-accent border-ink"
                    : "bg-surface text-ink border-line hover:border-accent-soft",
                ].join(" ")}
              >
                ${p}
                {p === RECOMMENDED_PAY && (
                  <span className="ml-1.5 text-[10px] uppercase tracking-wide opacity-80">
                    rec
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="rounded-xl border border-line bg-accent-tint/50 p-4">
          <div className="flex items-center gap-2 text-accent">
            <Sparkles size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Recommended
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink">
            <span className="font-semibold">${RECOMMENDED_PAY}/video</span> hits the
            sweet spot — most gigs fill in under 48 hours.
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-muted">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Pro tip
            </span>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Paying $50+ attracts creators with bigger followings and faster
            turnaround.
          </p>
        </div>
      </div>
    </StepShell>
  );
}
