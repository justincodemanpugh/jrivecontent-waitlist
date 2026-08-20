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
        <div className="rounded-2xl border border-line bg-gradient-to-b from-accent-tint/60 to-surface px-6 py-5">
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
                          "bg-accent text-on-accent group-hover:bg-ink",
                        state === "active" &&
                          "bg-accent text-on-accent ring-4 ring-accent-soft/30",
                        state === "upcoming" &&
                          "bg-surface-hover text-faint border border-line",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {state === "done" ? <Check size={16} strokeWidth={3} /> : i + 1}
                    </span>
                    <span
                      className={[
                        "truncate text-sm font-medium transition",
                        state === "upcoming" ? "text-faint" : "text-ink",
                      ].join(" ")}
                    >
                      {step.label}
                    </span>
                  </button>

                  {!isLast && (
                    <span
                      className={[
                        "mx-3 h-px flex-1 min-w-[16px]",
                        state === "done" ? "bg-accent/60" : "bg-surface-hover",
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
        <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
          <div className="flex items-center justify-between text-xs font-medium text-muted">
            <span>
              Step {currentStep + 1} of {total}
            </span>
            <span className="text-accent font-semibold">
              {Math.round(((currentStep + 1) / total) * 100)}%
            </span>
          </div>
          <p className="mt-1 text-base font-semibold text-ink">
            {steps[currentStep].label}
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-surface-hover overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${((currentStep + 1) / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
