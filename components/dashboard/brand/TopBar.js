"use client";

import { useState } from "react";
import { ChevronDown, ListChecks } from "lucide-react";
import { useBrand } from "@/components/dashboard/brand/BrandProvider";
import NotificationsBell from "@/components/dashboard/NotificationsBell";
import ThemeToggle from "@/components/dashboard/ThemeToggle";

export default function TopBar({ title = "Programs", checklistHidden, checklistProgress, onShowChecklist }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = useBrand();

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-md border-b border-line">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-ink">{title}</h1>

        <div className="flex items-center gap-2">
          {checklistHidden && onShowChecklist && (
            <button
              onClick={onShowChecklist}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-surface-sunken transition shadow-sm"
            >
              <span>Setup guide</span>
              <svg className="w-5 h-5" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-line"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke="url(#progress-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(checklistProgress / 100) * 94.2} 94.2`}
                  transform="rotate(-90 18 18)"
                />
                <defs>
                  <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </button>
          )}

          <NotificationsBell />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-surface-hover transition"
            >
              <span className="h-8 w-8 rounded-full bg-accent-soft text-on-accent text-sm font-semibold flex items-center justify-center overflow-hidden">
                {brand.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.avatarUrl}
                    alt={brand.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  brand.initials
                )}
              </span>
              <ChevronDown size={14} className="text-muted" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-line bg-surface shadow-lg shadow-scrim/5 py-1.5 z-20">
                  <div className="px-3 py-2 border-b border-line">
                    <p className="text-sm font-semibold text-ink">
                      {brand.name}
                    </p>
                    <p className="text-xs text-muted">Brand account</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line">
                    <span className="text-sm text-ink-soft">Theme</span>
                    <ThemeToggle compact />
                  </div>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="block w-full text-left px-3 py-2 text-sm text-ink-soft hover:bg-surface-sunken"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
