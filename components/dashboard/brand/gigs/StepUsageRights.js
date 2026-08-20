"use client";

import { Check, Shield } from "lucide-react";
import StepShell from "./StepShell";
import { USAGE_RIGHTS } from "@/lib/dashboard/brand/gigForm";

export default function StepUsageRights({ form, update }) {
  const selected = Array.isArray(form.usageRights) ? form.usageRights : [];

  const toggle = (key) => {
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    update({ usageRights: next });
  };

  const selectAll = () => {
    update({ usageRights: USAGE_RIGHTS.map((r) => r.key) });
  };

  const allSelected = USAGE_RIGHTS.every((r) => selected.includes(r.key));

  return (
    <StepShell
      title="What can you do with the content?"
      subtitle="Select the usage rights you need. Creators will see exactly what they're granting."
    >
      <div className="rounded-2xl border border-success-line bg-success-soft/50 p-4 mb-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-success mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-success">
              Clear licensing = happy creators
            </p>
            <p className="text-xs text-success mt-0.5">
              Creators are more likely to apply when they know exactly what rights they're granting. No surprises, no fuzzy terms.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-ink">
          Select usage rights
        </label>
        <button
          type="button"
          onClick={selectAll}
          disabled={allSelected}
          className="text-xs font-medium text-accent hover:text-ink disabled:text-faint transition"
        >
          Select all
        </button>
      </div>

      <div className="space-y-2">
        {USAGE_RIGHTS.map((right) => {
          const active = selected.includes(right.key);
          return (
            <button
              key={right.key}
              type="button"
              onClick={() => toggle(right.key)}
              className={[
                "w-full flex items-start gap-3 rounded-xl border p-4 text-left transition",
                active
                  ? "bg-accent-tint border-accent-soft"
                  : "bg-surface border-line hover:border-accent-soft/50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex-shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition",
                  active
                    ? "bg-accent border-accent text-on-accent"
                    : "border-line-strong bg-surface",
                ].join(" ")}
              >
                {active && <Check size={12} strokeWidth={3} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{right.icon}</span>
                  <span className="text-sm font-medium text-ink">
                    {right.label}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {right.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted">
        <strong>Duration:</strong> Perpetual (lifetime rights) &nbsp;•&nbsp;
        <strong>Territory:</strong> Worldwide
      </p>
    </StepShell>
  );
}
