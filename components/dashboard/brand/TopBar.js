"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronDown } from "lucide-react";
import { useBrand } from "@/components/dashboard/brand/BrandProvider";
import NotificationsBell from "@/components/dashboard/NotificationsBell";

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

          <NotificationsBell />

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition"
            >
              <span className="h-8 w-8 rounded-full bg-brand-sky text-white text-sm font-semibold flex items-center justify-center overflow-hidden">
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
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
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
