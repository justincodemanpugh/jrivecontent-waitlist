"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import Stepper from "@/components/dashboard/brand/gigs/Stepper";
import StepJobInfo from "@/components/dashboard/brand/gigs/StepJobInfo";
import StepDeliverables from "@/components/dashboard/brand/gigs/StepDeliverables";
import StepUsageRights from "@/components/dashboard/brand/gigs/StepUsageRights";
import StepPay from "@/components/dashboard/brand/gigs/StepPay";
import StepExamples from "@/components/dashboard/brand/gigs/StepExamples";
import StepReview from "@/components/dashboard/brand/gigs/StepReview";
import StepNav from "@/components/dashboard/brand/gigs/StepNav";
import PublishConfirmModal from "@/components/dashboard/brand/gigs/PublishConfirmModal";
import {
  STEPS,
  INITIAL_FORM,
  validateStep,
} from "@/lib/dashboard/brand/gigForm";
import { publishGig, fetchFreeGigsUsage } from "@/lib/dashboard/brand/gigsApi";
import { fetchBilling } from "@/lib/dashboard/brand/billingApi";

export default function NewGigPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [checkingPro, setCheckingPro] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [billing, freeUsage] = await Promise.all([
          fetchBilling(),
          fetchFreeGigsUsage(),
        ]);
        if (!cancelled) {
          const isPro = billing?.plan === "pro";
          const hasFreeGigRemaining = freeUsage?.remaining > 0;
          if (!isPro && !hasFreeGigRemaining) {
            router.replace("/dashboard/brand/pricing?from=post-gig");
          } else {
            setCheckingPro(false);
          }
        }
      } catch {
        if (!cancelled) router.replace("/dashboard/brand/pricing?from=post-gig");
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const canGoNext = validateStep(step, form);
  const isLast = step === STEPS.length - 1;

  const goToStep = (i) => {
    // Only allow jumping to already-valid previous steps (or current).
    if (i <= step) setStep(i);
  };

  const next = () => {
    if (!canGoNext) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  // On the review step, clicking "Publish" opens the confirm modal instead
  // of publishing immediately. Actual publish happens in `confirmPublish`.
  const requestPublish = () => setConfirmOpen(true);

  const confirmPublish = async () => {
    setPublishError("");
    setPublishing(true);
    try {
      await publishGig(form);
      setConfirmOpen(false);
      router.push("/dashboard/brand/gigs");
      router.refresh();
    } catch (err) {
      setPublishError(err?.message || "Couldn't publish gig. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (checkingPro) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-faint" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Minimal top bar for the flow */}
      <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-md border-b border-line">
        <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
          <Link
            href="/dashboard/brand"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink transition"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back to dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <h1 className="text-base md:text-lg font-semibold text-ink">
            Post a new gig
          </h1>
          <span className="w-[88px] md:w-[180px]" aria-hidden />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <Stepper steps={STEPS} currentStep={step} onStepClick={goToStep} />

        <div className="mt-6 md:mt-8">
          {step === 0 && <StepJobInfo form={form} update={update} />}
          {step === 1 && <StepDeliverables form={form} update={update} />}
          {step === 2 && <StepUsageRights form={form} update={update} />}
          {step === 3 && <StepPay form={form} update={update} />}
          {step === 4 && <StepExamples form={form} update={update} />}
          {step === 5 && <StepReview form={form} goToStep={setStep} />}
        </div>

        <StepNav
          onBack={back}
          onNext={next}
          canGoBack={step > 0}
          canGoNext={canGoNext}
          isLast={isLast}
          onPublish={requestPublish}
        />
      </main>

      <PublishConfirmModal
        open={confirmOpen}
        form={form}
        onConfirm={confirmPublish}
        onClose={() => !publishing && setConfirmOpen(false)}
        publishing={publishing}
        error={publishError}
      />
    </div>
  );
}
