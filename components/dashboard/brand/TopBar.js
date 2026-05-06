"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Plus, ChevronDown } from "lucide-react";
import { useBrand } from "@/components/dashboard/brand/BrandProvider";

export default function TopBar({ title = "Dashboard" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = useBrand();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-brand-ink">{title}</h1>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/brand/gigs/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Post New Gig</span>
            <span className="sm:hidden">Post</span>
          </Link>

          <button
            type="button"
            aria-label="Notifications"
            className="relative h-10 w-10 inline-flex items-center justify-center rounded-full hover:bg-slate-100 transition"
          >
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-skyDeep ring-2 ring-white" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition"
            >
              <span className="h-8 w-8 rounded-full bg-brand-sky text-white text-sm font-semibold flex items-center justify-center">
                {brand.initials}
              </span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 py-1.5 z-20">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-brand-ink">
                      {brand.name}
                    </p>
                    <p className="text-xs text-slate-500">Brand account</p>
                  </div>
                  <Link
                    href="/dashboard/brand/settings"
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile & settings
                  </Link>
                  <Link
                    href="/dashboard/brand/billing"
                    className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Billing
                  </Link>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
