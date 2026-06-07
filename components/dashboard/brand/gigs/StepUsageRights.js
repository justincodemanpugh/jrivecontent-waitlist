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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 mb-4">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Clear licensing = happy creators
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Creators are more likely to apply when they know exactly what rights they're granting. No surprises, no fuzzy terms.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-brand-ink">
          Select usage rights
        </label>
        <button
          type="button"
          onClick={selectAll}
          disabled={allSelected}
          className="text-xs font-medium text-brand-skyDeep hover:text-brand-ink disabled:text-slate-400 transition"
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
                  ? "bg-brand-mist border-brand-sky"
                  : "bg-white border-slate-200 hover:border-brand-sky/50",
              ].join(" ")}
            >
              <span
                className={[
                  "flex-shrink-0 mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center transition",
                  active
                    ? "bg-brand-skyDeep border-brand-skyDeep text-white"
                    : "border-slate-300 bg-white",
                ].join(" ")}
              >
                {active && <Check size={12} strokeWidth={3} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base">{right.icon}</span>
                  <span className="text-sm font-medium text-brand-ink">
                    {right.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {right.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        <strong>Duration:</strong> Perpetual (lifetime rights) &nbsp;•&nbsp;
        <strong>Territory:</strong> Worldwide
      </p>
    </StepShell>
  );
}
