"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Check, Sparkles, CreditCard, ShieldCheck } from "lucide-react";
import {
  CREATOR_NICHES,
  TOTAL_CREATOR_STEPS,
} from "@/lib/onboarding/creatorConstants";
import {
  saveCreatorOnboardingStep,
  completeCreatorOnboarding,
  markCreatorOnboarded,
} from "@/lib/onboarding/creatorActions";
import { logOnboardingEvent } from "@/lib/onboarding/analytics";

const STEP_TITLES = [
  "What should we call you?",
  "What niches do you create in?",
  "Where can brands find you?",
  "Set up payouts with Stripe",
];

const STEP_SUBTITLES = [
  "This is the name brands will see on your profile.",
  "Pick all that apply — brands use these to find you.",
  "Add your social handles so brands know where to look.",
  "Connect Stripe so brands can pay you. You can also do this later from your profile.",
];

export default function OnboardingClient({ initial, userEmail, userId }) {
  const [step, setStep] = useState(deriveStartStep(initial));
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      logOnboardingEvent({ role: "creator", event: "onboarding_started", stepIndex: step });
    }
    logOnboardingEvent({ role: "creator", event: "step_viewed", stepIndex: step });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const toggleNiche = (value) =>
    setData((d) => ({
      ...d,
      niches: d.niches.includes(value)
        ? d.niches.filter((v) => v !== value)
        : [...d.niches, value],
    }));

  const validateStep = () => {
    if (step === 0 && !data.display_name.trim()) return "Please enter a display name.";
    if (step === 1 && data.niches.length === 0) return "Pick at least one niche.";
    if (step === 2 && !data.terms_accepted) return "Please agree to the Terms and Privacy Policy.";
    return "";
  };

  const stepPayload = (s = step) => {
    switch (s) {
      case 0: return { display_name: data.display_name, handle: data.handle };
      case 1: return { niches: data.niches };
      case 2: return {
        instagram_handle: data.instagram_handle,
        tiktok_handle: data.tiktok_handle,
        youtube_handle: data.youtube_handle,
        terms_accepted: data.terms_accepted,
      };
      case 3: return {};
      default: return {};
    }
  };

  const handleNext = () => {
    const v = validateStep();
    if (v) { setError(v); return; }
    setError("");
    startTransition(async () => {
      const res = await saveCreatorOnboardingStep(stepPayload());
      if (!res?.ok) { setError(res?.error || "Something went wrong. Please try again."); return; }
      logOnboardingEvent({ role: "creator", event: "step_completed", stepIndex: step });
      if (step < TOTAL_CREATOR_STEPS - 1) {
        setStep((s) => s + 1);
      } else {
        const final = await completeCreatorOnboarding({
          display_name: data.display_name,
          handle: data.handle,
          niches: data.niches,
          content_types: [],
          bio: "",
          instagram_handle: data.instagram_handle,
          tiktok_handle: data.tiktok_handle,
          youtube_handle: data.youtube_handle,
          portfolio_url: "",
          terms_accepted: data.terms_accepted,
        });
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
    // Only step 3 (Stripe) is skippable
    if (step !== 3) return;
    setError("");
    startTransition(async () => {
      logOnboardingEvent({ role: "creator", event: "step_skipped", stepIndex: step });
      const final = await completeCreatorOnboarding({
        display_name: data.display_name,
        handle: data.handle,
        niches: data.niches,
        content_types: [],
        bio: "",
        instagram_handle: data.instagram_handle,
        tiktok_handle: data.tiktok_handle,
        youtube_handle: data.youtube_handle,
        portfolio_url: "",
        terms_accepted: data.terms_accepted,
      });
      if (final && !final.ok) setError(final.error);
    });
  };

  const isLastStep = step === TOTAL_CREATOR_STEPS - 1;
  const canSkip = step === 3;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-mist text-brand-skyDeep">
            <Sparkles size={20} />
          </span>
          {userEmail && (
            <div className="mt-3 text-xs font-medium text-slate-500">Signed in as {userEmail}</div>
          )}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">
            {STEP_TITLES[step]}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{STEP_SUBTITLES[step]}</p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: TOTAL_CREATOR_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand-skyDeep" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <div className="mb-3 text-right text-xs font-medium text-slate-500">
          Step {step + 1} of {TOTAL_CREATOR_STEPS}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {step === 0 && <Step0 data={data} update={update} />}
          {step === 1 && <Step1 data={data} onToggle={toggleNiche} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 markOnboarded={markCreatorOnboarded} />}

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
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
              {!isLastStep && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function deriveStartStep(d) {
  if (!d.display_name) return 0;
  if (d.niches.length === 0) return 1;
  return 2;
}

/* ---- Steps ---- */

function Step0({ data, update }) {
  return (
    <div className="space-y-4">
      <Field label="Display name" required>
        <input
          type="text"
          value={data.display_name}
          onChange={(e) => update({ display_name: e.target.value })}
          placeholder="e.g. Sarah Chen"
          className={inputClass}
          maxLength={80}
          autoFocus
        />
      </Field>
      <Field label="Creator handle (optional)" hint="Letters, numbers, dots, underscores">
        <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-brand-skyDeep focus-within:ring-2 focus-within:ring-brand-sky/30">
          <span className="pl-3 text-sm text-slate-400">@</span>
          <input
            type="text"
            value={data.handle}
            onChange={(e) => update({ handle: e.target.value })}
            placeholder="sarah.creates"
            className="flex-1 bg-transparent px-2 py-2.5 text-sm text-brand-ink placeholder-slate-400 focus:outline-none"
            maxLength={40}
          />
        </div>
      </Field>
    </div>
  );
}

function Step1({ data, onToggle }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {CREATOR_NICHES.map((opt) => {
        const active = data.niches.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
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

function Step2({ data, update }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Add the handles brands will use to find your content. All optional, but at least one helps.
      </p>

      <Field label="TikTok">
        <SocialInput prefix="@tiktok.com/" value={data.tiktok_handle} onChange={(v) => update({ tiktok_handle: v })} placeholder="yourusername" />
      </Field>
      <Field label="Instagram">
        <SocialInput prefix="@instagram.com/" value={data.instagram_handle} onChange={(v) => update({ instagram_handle: v })} placeholder="yourusername" />
      </Field>
      <Field label="YouTube">
        <SocialInput prefix="@youtube.com/" value={data.youtube_handle} onChange={(v) => update({ youtube_handle: v })} placeholder="yourusername" />
      </Field>

      <TermsAccept checked={data.terms_accepted} onChange={(v) => update({ terms_accepted: v })} />
    </div>
  );
}

function Step3({ markOnboarded }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const startConnect = async () => {
    setErr("");
    setLoading(true);
    try {
      const marked = await markOnboarded();
      if (!marked?.ok) throw new Error(marked?.error || "Could not finish onboarding.");
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Could not start Stripe onboarding.");
      window.location.href = json.url;
    } catch (e) {
      setErr(e.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-skyDeep">
            <CreditCard size={16} />
          </span>
          <div>
            <p className="font-medium text-brand-ink">Get paid directly to your bank account</p>
            <p className="mt-1 text-slate-600">
              When a brand approves your work, your share is transferred automatically via Stripe.
            </p>
          </div>
        </div>
      </div>

      <ul className="space-y-2 text-sm text-slate-600">
        <li className="flex items-start gap-2">
          <ShieldCheck size={16} className="mt-0.5 text-brand-skyDeep" />
          Free to set up — Stripe handles KYC and tax forms.
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck size={16} className="mt-0.5 text-brand-skyDeep" />
          Funds are held in escrow until the brand approves your delivery.
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck size={16} className="mt-0.5 text-brand-skyDeep" />
          Takes about 2 minutes. You can also do this later from your profile.
        </li>
      </ul>

      <button
        type="button"
        onClick={startConnect}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#635BFF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5247e6] disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        {loading ? "Redirecting to Stripe…" : "Connect Stripe account"}
      </button>

      {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}

      <p className="text-center text-xs text-slate-500">
        Prefer to do this later? Click <span className="font-medium">Skip</span> above — you can connect Stripe any time from your creator profile.
      </p>
    </div>
  );
}

function SocialInput({ prefix, value, onChange, placeholder }) {
  return (
    <div className="flex items-center rounded-lg border border-slate-200 bg-white focus-within:border-brand-skyDeep focus-within:ring-2 focus-within:ring-brand-sky/30">
      <span className="pl-3 text-xs text-slate-400 whitespace-nowrap">{prefix}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-2 py-2.5 text-sm text-brand-ink placeholder-slate-400 focus:outline-none"
        maxLength={60}
      />
    </div>
  );
}

function TermsAccept({ checked, onChange }) {
  return (
    <label className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-skyDeep focus:ring-brand-sky/40"
      />
      <span>
        I agree to the{" "}
        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-skyDeep hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-brand-skyDeep hover:underline">
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );
}

const inputClass =
  "block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30";

function Field({ label, hint, required, children }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-sm font-medium text-brand-ink">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
