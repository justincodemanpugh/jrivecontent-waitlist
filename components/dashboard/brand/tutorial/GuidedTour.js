"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { startTour, completeTour, dismissTour } from "@/lib/dashboard/brand/tutorialApi";

const TOUR_STEPS = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to JriveContent! 🎉",
    content:
      "Let's take a quick tour to help you post your first gig and start connecting with creators.",
    position: "center",
  },
  {
    id: "post_gig_button",
    target: '[data-tour="post-new-gig"]',
    title: "Post Your First Gig",
    content:
      "Click here to create your first gig. Describe what content you need, set your budget, and publish it to the marketplace.",
    position: "bottom",
    highlight: true,
  },
  {
    id: "sidebar_gigs",
    target: '[data-tour="nav-gigs"]',
    title: "My Gigs",
    content:
      "This is where you'll manage all your gigs. Track applications, see what's active, and review past campaigns.",
    position: "right",
    highlight: true,
  },
  {
    id: "sidebar_applicants",
    target: '[data-tour="nav-applicants"]',
    title: "Review Applicants",
    content:
      "When creators apply to your gigs, you'll see them here. Review their profiles, portfolios, and accept the best fits.",
    position: "right",
    highlight: true,
  },
  {
    id: "sidebar_creators",
    target: '[data-tour="nav-creators"]',
    title: "Browse Creators",
    content:
      "Explore our creator marketplace to find the perfect match for your brand. Filter by niche, style, and more.",
    position: "right",
    highlight: true,
  },
  {
    id: "sidebar_messages",
    target: '[data-tour="nav-messages"]',
    title: "Messages",
    content:
      "Chat directly with creators you're working with. Discuss details, share feedback, and coordinate deliverables.",
    position: "right",
    highlight: true,
  },
  {
    id: "upgrade_button",
    target: '[data-tour="upgrade-button"]',
    title: "Upgrade to Pro (Optional)",
    content:
      "Unlock unlimited gigs, priority support, and advanced features. Pro is optional — you can continue with our free plan.",
    position: "top",
    highlight: true,
  },
  {
    id: "complete",
    target: null,
    title: "You're all set! 🚀",
    content:
      "You now know the basics. Ready to post your first gig and start connecting with amazing creators?",
    position: "center",
    cta: {
      label: "Post Your First Gig",
      href: "/dashboard/brand/gigs/new",
    },
  },
];

export default function GuidedTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef(null);

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    startTour().catch(console.error);
  }, [isOpen]);

  const updateTargetRect = useCallback(() => {
    if (!step?.target) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();

    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, currentStep, updateTargetRect]);

  const handleNext = () => {
    if (isLastStep) {
      completeTour().catch(console.error);
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    dismissTour().catch(console.error);
    onClose();
  };

  const handleCtaClick = () => {
    completeTour().catch(console.error);
    onClose();
    if (step.cta?.href) {
      window.location.href = step.cta.href;
    }
  };

  if (!isOpen || !mounted) return null;

  const tooltipPosition = getTooltipPosition(step.position, targetRect);

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999]"
      style={{ pointerEvents: "auto" }}
    >
      {/* Backdrop with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Glowing ring around target */}
      {targetRect && step.highlight && (
        <div
          className="absolute rounded-xl pointer-events-none"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow:
              "0 0 0 4px rgba(56, 189, 248, 0.5), 0 0 20px 8px rgba(56, 189, 248, 0.3)",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`absolute bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 max-w-sm transition-all duration-300 ${
          step.position === "center"
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            : ""
        }`}
        style={
          step.position !== "center"
            ? {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
              }
            : {}
        }
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-3">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? "w-4 bg-brand-skyDeep"
                  : idx < currentStep
                  ? "w-1.5 bg-brand-sky"
                  : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-brand-ink pr-6">
          {step.title}
        </h3>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {step.content}
        </p>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-500 hover:text-slate-700 transition"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 hover:text-brand-ink transition"
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}

            {step.cta ? (
              <button
                onClick={handleCtaClick}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-ink text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                <Sparkles size={14} />
                {step.cta.label}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-brand-ink text-white text-sm font-semibold hover:bg-slate-800 transition"
              >
                {isLastStep ? "Finish" : "Next"}
                {!isLastStep && <ArrowRight size={14} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pulse animation styles */}
      <style jsx global>{`
        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 0 4px rgba(56, 189, 248, 0.5),
              0 0 20px 8px rgba(56, 189, 248, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(56, 189, 248, 0.7),
              0 0 30px 12px rgba(56, 189, 248, 0.4);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}

function getTooltipPosition(position, targetRect) {
  if (!targetRect) {
    return { top: "50%", left: "50%" };
  }

  const padding = 16;
  const tooltipWidth = 320;
  const tooltipHeight = 200;

  switch (position) {
    case "right":
      return {
        top: Math.max(padding, targetRect.top - 20),
        left: targetRect.left + targetRect.width + padding,
      };
    case "left":
      return {
        top: Math.max(padding, targetRect.top - 20),
        left: Math.max(padding, targetRect.left - tooltipWidth - padding),
      };
    case "bottom":
      return {
        top: targetRect.top + targetRect.height + padding,
        left: Math.max(
          padding,
          Math.min(
            targetRect.left,
            window.innerWidth - tooltipWidth - padding
          )
        ),
      };
    case "top":
      return {
        top: Math.max(padding, targetRect.top - tooltipHeight - padding),
        left: Math.max(
          padding,
          Math.min(
            targetRect.left,
            window.innerWidth - tooltipWidth - padding
          )
        ),
      };
    default:
      return { top: "50%", left: "50%" };
  }
}
