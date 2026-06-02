"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Circle,
  X,
  Sparkles,
  User,
  Briefcase,
  Search,
  Users,
  ExternalLink,
} from "lucide-react";
import {
  fetchTutorialProgress,
  toggleChecklistVisibility,
  completeTutorialStep,
} from "@/lib/dashboard/brand/tutorialApi";
import { fetchMyGigs } from "@/lib/dashboard/brand/gigsApi";
import { fetchBilling } from "@/lib/dashboard/brand/billingApi";

const CHECKLIST_SECTIONS = [
  {
    id: "get_started",
    title: "Get started",
    items: [
      {
        key: "profile_completed",
        label: "Complete your profile",
        description: "Add your brand details and logo",
        href: "/dashboard/brand/settings",
        icon: User,
      },
      {
        key: "first_gig_posted",
        label: "Post your first gig",
        description: "Create a gig to start receiving applications",
        href: "/dashboard/brand/gigs/new",
        icon: Briefcase,
        primary: true,
      },
    ],
  },
  {
    id: "explore",
    title: "Explore the platform",
    items: [
      {
        key: "browsed_creators",
        label: "Browse creators",
        description: "Find creators that match your brand",
        href: "/dashboard/brand/creators",
        icon: Search,
      },
      {
        key: "checked_applicants",
        label: "Check applicants",
        description: "Review who applied to your gigs",
        href: "/dashboard/brand/applicants",
        icon: Users,
      },
    ],
  },
  {
    id: "upgrade",
    title: "Unlock more features",
    items: [
      {
        key: "viewed_upgrade",
        label: "Explore Pro features",
        description: "Unlimited gigs, priority support & more",
        href: "/dashboard/brand/pricing",
        icon: Sparkles,
        optional: true,
      },
    ],
  },
];

export default function TutorialChecklist({ onStartTour, onHide }) {
  const router = useRouter();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState(["get_started"]);
  const [isPro, setIsPro] = useState(false);
  const [hasGigs, setHasGigs] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [prog, billing, gigs] = await Promise.all([
          fetchTutorialProgress(),
          fetchBilling().catch(() => null),
          fetchMyGigs().catch(() => []),
        ]);
        if (!cancelled) {
          setProgress(prog);
          setIsPro(billing?.plan === "pro");
          setHasGigs(gigs.length > 0);
          setLoading(false);
        }
      } catch (err) {
        console.error("[TutorialChecklist]", err);
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const onChange = () => load();
    window.addEventListener("tutorial:changed", onChange);
    window.addEventListener("gigs:changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("tutorial:changed", onChange);
      window.removeEventListener("gigs:changed", onChange);
    };
  }, []);

  const completedCount = useMemo(() => {
    if (!progress) return 0;
    let count = 0;
    if (progress.profile_completed) count++;
    if (progress.first_gig_posted || hasGigs) count++;
    if (progress.browsed_creators) count++;
    if (progress.checked_applicants) count++;
    if (progress.viewed_upgrade || isPro) count++;
    return count;
  }, [progress, hasGigs, isPro]);

  const totalItems = 5;
  const progressPercent = (completedCount / totalItems) * 100;

  const isItemCompleted = (key) => {
    if (!progress) return false;
    if (key === "first_gig_posted") return progress.first_gig_posted || hasGigs;
    if (key === "viewed_upgrade") return progress.viewed_upgrade || isPro;
    return progress[key];
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = async (item) => {
    if (!isItemCompleted(item.key)) {
      await completeTutorialStep(item.key);
    }
    router.push(item.href);
  };

  const handleHide = async () => {
    setIsHidden(true);
    onHide?.();
    await toggleChecklistVisibility(true);
  };

  if (loading) return null;
  if (isHidden || progress?.checklist_hidden) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-brand-mist to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-brand-ink">Setup guide</h3>
            <button
              onClick={handleHide}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Hide checklist"
            >
              <X size={14} />
            </button>
          </div>
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="text-xs font-medium text-brand-skyDeep hover:text-brand-ink transition"
            >
              Take a tour
            </button>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-sky to-brand-skyDeep rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {completedCount}/{totalItems}
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="divide-y divide-slate-100">
        {CHECKLIST_SECTIONS.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const sectionCompleted = section.items.every((item) =>
            isItemCompleted(item.key)
          );

          return (
            <div key={section.id}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition"
              >
                <span
                  className={`text-sm font-medium ${
                    sectionCompleted
                      ? "text-slate-400 line-through"
                      : "text-brand-ink"
                  }`}
                >
                  {section.title}
                </span>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </button>

              {/* Section items */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-1">
                  {section.items.map((item) => {
                    const completed = isItemCompleted(item.key);
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.key}
                        onClick={() => handleItemClick(item)}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition group ${
                          completed
                            ? "bg-emerald-50/50"
                            : item.primary
                            ? "bg-brand-mist hover:bg-brand-sky/20"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                            completed
                              ? "bg-emerald-500 text-white"
                              : "border-2 border-slate-300 text-transparent group-hover:border-brand-skyDeep"
                          }`}
                        >
                          {completed ? (
                            <Check size={12} strokeWidth={3} />
                          ) : (
                            <Circle size={12} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                completed
                                  ? "text-slate-400 line-through"
                                  : "text-brand-ink"
                              }`}
                            >
                              {item.label}
                            </span>
                            {item.optional && (
                              <span className="text-[10px] font-medium text-slate-400 uppercase">
                                Optional
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Icon */}
                        <Icon
                          size={16}
                          className={`mt-0.5 flex-shrink-0 ${
                            completed
                              ? "text-emerald-500"
                              : "text-slate-400 group-hover:text-brand-skyDeep"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue for free note */}
      {!isPro && (
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            You can post your first gig for free!{" "}
            <button
              onClick={() => router.push("/dashboard/brand/gigs/new")}
              className="font-medium text-brand-skyDeep hover:underline"
            >
              Get started →
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
