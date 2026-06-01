"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Play, ArrowRight } from "lucide-react";
import { fetchTutorialProgress, initTutorialProgress } from "@/lib/dashboard/brand/tutorialApi";
import { fetchMyGigs } from "@/lib/dashboard/brand/gigsApi";

export default function WelcomeBanner({ brandName, onStartTour }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkNewUser = async () => {
      try {
        const [progress, gigs] = await Promise.all([
          fetchTutorialProgress(),
          fetchMyGigs().catch(() => []),
        ]);

        // Show banner if:
        // 1. No tutorial progress exists (first time)
        // 2. Or tour hasn't been started/completed and no gigs
        const isNewUser =
          !progress ||
          (!progress.tour_started_at &&
            !progress.tour_completed &&
            !progress.tour_dismissed &&
            gigs.length === 0);

        if (!cancelled && isNewUser) {
          // Initialize progress if needed
          if (!progress) {
            await initTutorialProgress();
          }
          setVisible(true);
        }
      } catch (err) {
        console.error("[WelcomeBanner]", err);
      }
    };

    checkNewUser();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleStartTour = () => {
    setDismissed(true);
    setTimeout(() => {
      setVisible(false);
      onStartTour?.();
    }, 300);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-ink via-slate-800 to-brand-ink p-6 shadow-lg transition-all duration-300 ${
        dismissed ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-sky/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-skyDeep/20 rounded-full blur-3xl" />
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
      >
        <X size={18} />
      </button>

      {/* Content */}
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-sky to-brand-skyDeep flex items-center justify-center shadow-lg shadow-brand-sky/30">
            <Sparkles size={28} className="text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white">
            Welcome to JriveContent{brandName ? `, ${brandName}` : ""}! 🎉
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Let's get you set up to post your first gig and start connecting
            with amazing creators.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleStartTour}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-brand-ink text-sm font-semibold shadow-md hover:bg-slate-100 transition"
          >
            <Play size={16} className="fill-current" />
            Take a quick tour
          </button>
          <button
            onClick={handleDismiss}
            className="inline-flex items-center justify-center gap-1 px-4 py-2.5 rounded-full text-white/80 text-sm font-medium hover:text-white hover:bg-white/10 transition"
          >
            Skip for now
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
