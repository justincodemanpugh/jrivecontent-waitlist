"use client";

import { Check } from "lucide-react";

/**
 * Horizontal stepper inspired by the amber reference, restyled with brand palette.
 * - Completed: filled brand-skyDeep circle + white check
 * - Active:    filled brand-skyDeep circle + white number + soft sky glow ring
 * - Upcoming:  slate-100 circle + slate-400 number
 * Connectors between circles shade by the *lower-indexed* step's status.
 *
 * Mobile: collapses to "Step X of N · Label" with a sky progress bar.
 */
export default function Stepper({ steps, currentStep, onStepClick }) {
  const total = steps.length;

  return (
    <div className="w-full">
      {/* Desktop / tablet */}
      <div className="hidden md:block">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-brand-mist/60 to-white px-6 py-5">
          <ol className="flex items-center gap-2">
            {steps.map((step, i) => {
              const state =
                i < currentStep ? "done" : i === currentStep ? "active" : "upcoming";
              const isLast = i === total - 1;
              const canClick = i < currentStep && typeof onStepClick === "function";

              return (
                <li key={step.key} className="flex items-center flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={canClick ? () => onStepClick(i) : undefined}
                    disabled={!canClick}
                    className={`group flex items-center gap-2.5 min-w-0 ${
                      canClick ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    <span
                      className={[
                        "relative h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold transition",
                        state === "done" &&
                          "bg-brand-skyDeep text-white group-hover:bg-brand-ink",
                        state === "active" &&
                          "bg-brand-skyDeep text-white ring-4 ring-brand-sky/30",
                        state === "upcoming" &&
                          "bg-slate-100 text-slate-400 border border-slate-200",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {state === "done" ? <Check size={16} strokeWidth={3} /> : i + 1}
                    </span>
                    <span
                      className={[
                        "truncate text-sm font-medium transition",
                        state === "upcoming" ? "text-slate-400" : "text-brand-ink",
                      ].join(" ")}
                    >
                      {step.label}
                    </span>
                  </button>

                  {!isLast && (
                    <span
                      className={[
                        "mx-3 h-px flex-1 min-w-[16px]",
                        state === "done" ? "bg-brand-skyDeep/60" : "bg-slate-200",
                      ].join(" ")}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              Step {currentStep + 1} of {total}
            </span>
            <span className="text-brand-skyDeep font-semibold">
              {Math.round(((currentStep + 1) / total) * 100)}%
            </span>
          </div>
          <p className="mt-1 text-base font-semibold text-brand-ink">
            {steps[currentStep].label}
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-brand-skyDeep transition-all duration-300"
              style={{ width: `${((currentStep + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
