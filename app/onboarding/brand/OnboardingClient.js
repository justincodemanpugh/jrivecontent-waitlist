"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import {
  INDUSTRIES,
  BRAND_STAGES,
  BUDGET_RANGES,
  CONTENT_NEEDS,
  REFERRAL_SOURCES,
  TOTAL_STEPS,
} from "@/lib/onboarding/constants";
import {
  saveOnboardingStep,
  completeOnboarding,
} from "@/lib/onboarding/actions";
import { logOnboardingEvent } from "@/lib/onboarding/analytics";

const STEP_TITLES = [
  "Tell us about your brand",
  "What industry are you in?",
  "What stage is your brand at?",
  "What's your monthly content budget?",
  "What kind of content do you need?",
  "How did you hear about us?",
];

const STEP_SUBTITLES = [
  "We'll use this to set up your dashboard.",
  "Pick the closest match — you can change this later.",
  "Helps us match you with the right creators.",
  "Optional — helps creators tailor their pitches.",
  "Optional — pick all that apply.",
  "Optional — and the last one, promise.",
];

export default function OnboardingClient({ initial, userEmail }) {
  const [step, setStep] = useState(deriveStartStep(initial));
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Funnel instrumentation. We fire `onboarding_started` once per mount,
  // then `step_viewed` on every step change so the admin funnel can count
  // distinct users per step.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      logOnboardingEvent({
        role: "brand",
        event: "onboarding_started",
        stepIndex: step,
      });
    }
    logOnboardingEvent({
      role: "brand",
      event: "step_viewed",
      stepIndex: step,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const validateStep = () => {
    if (step === 0 && !data.brand_name.trim()) {
      return "Please enter your brand name.";
    }
    if (step === 1 && !data.industry) return "Please pick an industry.";
    if (step === 2 && !data.brand_stage) return "Please pick a stage.";
    if (step === TOTAL_STEPS - 1 && !data.terms_accepted) {
      return "Please agree to the Terms and Privacy Policy.";
    }
    return "";
  };

  const persistStep = () => {
    // Save just the fields touched in this step.
    const payloads = [
      {
        brand_name: data.brand_name,
        website: data.website,
      },
      { industry: data.industry },
      { brand_stage: data.brand_stage },
      { monthly_budget: data.monthly_budget || null },
      { content_needs: data.content_needs },
      {
        referral_source: data.referral_source || null,
        terms_accepted: data.terms_accepted,
      },
    ];
    return saveOnboardingStep(payloads[step]);
  };

  const handleNext = () => {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await persistStep();
      if (!res?.ok) {
        setError(res?.error || "Something went wrong. Please try again.");
        return;
      }
      logOnboardingEvent({
        role: "brand",
        event: "step_completed",
        stepIndex: step,
      });
      if (step < TOTAL_STEPS - 1) {
        setStep((s) => s + 1);
      } else {
        const final = await completeOnboarding({
          brand_name: data.brand_name,
          website: data.website,
          industry: data.industry,
          brand_stage: data.brand_stage,
          monthly_budget: data.monthly_budget || null,
          content_needs: data.content_needs,
          referral_source: data.referral_source || null,
          terms_accepted: data.terms_accepted,
        });
        // completeOnboarding redirects on success; only get here on error.
        if (final && !final.ok) setError(final.error);
      }
    });
  };

  const handleBack = () => {
    if (step === 0) return;
    setError("");
    setStep((s) => s - 1);
  };

  const handleSkip = () => {
    if (![3, 4, 5].includes(step)) return;
    // The last step also hosts the required terms checkbox, so a "skip"
    // there is really just clearing the optional referral source.
    if (step === TOTAL_STEPS - 1 && !data.terms_accepted) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }
    setError("");
    startTransition(async () => {
      // Persist as cleared so a resumed session reflects the skip.
      const cleared =
        step === 3
          ? { monthly_budget: null }
          : step === 4
            ? { content_needs: [] }
            : { referral_source: null, terms_accepted: data.terms_accepted };
      await saveOnboardingStep(cleared);
      logOnboardingEvent({
        role: "brand",
        event: "step_skipped",
        stepIndex: step,
      });
      if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
      else {
        const final = await completeOnboarding({
          brand_name: data.brand_name,
          website: data.website,
          industry: data.industry,
          brand_stage: data.brand_stage,
          monthly_budget: null,
          content_needs: step === 4 ? [] : data.content_needs,
          referral_source: null,
          terms_accepted: data.terms_accepted,
        });
        if (final && !final.ok) setError(final.error);
      }
    });
  };

  const isLastStep = step === TOTAL_STEPS - 1;
  const canSkip = [3, 4, 5].includes(step);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="text-xs font-medium text-slate-500">
            Signed in as {userEmail}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">
            {STEP_TITLES[step]}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{STEP_SUBTITLES[step]}</p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i <= step ? "bg-brand-skyDeep" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="mb-3 text-right text-xs font-medium text-slate-500">
          Step {step + 1} of {TOTAL_STEPS}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {step === 0 && <Step1 data={data} update={update} />}
          {step === 1 && <Step2 data={data} update={update} />}
          {step === 2 && <Step3 data={data} update={update} />}
          {step === 3 && <Step4 data={data} update={update} />}
          {step === 4 && <Step5 data={data} update={update} />}
          {step === 5 && <Step6 data={data} update={update} />}

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0 || isPending}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-brand-ink disabled:opacity-30"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div className="flex items-center gap-2">
              {canSkip && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isPending}
                  className="rounded-full px-3 py-2 text-sm font-medium text-slate-500 hover:text-brand-ink disabled:opacity-50"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isLastStep ? (
                  <Check size={16} />
                ) : (
                  <ArrowRight size={16} />
                )}
                {isLastStep ? "Finish" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function deriveStartStep(d) {
  // Resume on the first incomplete step. Terms acceptance is collected on the
  // final step (TOTAL_STEPS - 1) and enforced there.
  if (!d.brand_name) return 0;
  if (!d.industry) return 1;
  if (!d.brand_stage) return 2;
  return 3;
}

/* ---------------- Steps ---------------- */

function Step1({ data, update }) {
  return (
    <div className="space-y-4">
      <Field label="Brand name" required>
        <input
          type="text"
          value={data.brand_name}
          onChange={(e) => update({ brand_name: e.target.value })}
          placeholder="e.g. Acme Coffee Co."
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
          maxLength={120}
        />
      </Field>
      <Field label="Website or social handle (optional)">
        <input
          type="text"
          value={data.website}
          onChange={(e) => update({ website: e.target.value })}
          placeholder="acme.com or @acme"
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
          maxLength={240}
        />
      </Field>
    </div>
  );
}

function Step2({ data, update }) {
  return (
    <ChoiceGrid
      options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
      selected={data.industry}
      onSelect={(v) => update({ industry: v })}
    />
  );
}

function Step3({ data, update }) {
  return (
    <ChoiceGrid
      options={BRAND_STAGES}
      selected={data.brand_stage}
      onSelect={(v) => update({ brand_stage: v })}
    />
  );
}

function Step4({ data, update }) {
  return (
    <ChoiceGrid
      options={BUDGET_RANGES.map((b) => ({ value: b, label: b }))}
      selected={data.monthly_budget}
      onSelect={(v) => update({ monthly_budget: v })}
    />
  );
}

function Step5({ data, update }) {
  const toggle = (val) => {
    const has = data.content_needs.includes(val);
    update({
      content_needs: has
        ? data.content_needs.filter((x) => x !== val)
        : [...data.content_needs, val],
    });
  };
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {CONTENT_NEEDS.map((opt) => {
        const active = data.content_needs.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              active
                ? "border-brand-skyDeep bg-brand-mist text-brand-ink"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <span>{opt}</span>
            {active && <Check size={16} className="text-brand-skyDeep" />}
          </button>
        );
      })}
    </div>
  );
}

function Step6({ data, update }) {
  return (
    <div className="space-y-5">
      <ChoiceGrid
        options={REFERRAL_SOURCES.map((r) => ({ value: r, label: r }))}
        selected={data.referral_source}
        onSelect={(v) => update({ referral_source: v })}
      />
      <TermsAccept
        checked={data.terms_accepted}
        onChange={(v) => update({ terms_accepted: v })}
      />
    </div>
  );
}

function TermsAccept({ checked, onChange }) {
  return (
    <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-skyDeep focus:ring-brand-sky/40"
      />
      <span>
        I agree to the Terms of Service (
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-skyDeep hover:underline"
        >
          View
        </Link>
        ) and Privacy Policy (
        <Link
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-skyDeep hover:underline"
        >
          View
        </Link>
        ).
      </span>
    </label>
  );
}

/* ---------------- Shared ---------------- */

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-brand-ink">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function ChoiceGrid({ options, selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const active = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              active
                ? "border-brand-skyDeep bg-brand-mist text-brand-ink"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
