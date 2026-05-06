"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Search,
  Settings,
  Gift,
} from "lucide-react";
import {
  fetchFreeGigsUsage,
  FREE_GIGS_TOTAL,
} from "@/lib/dashboard/brand/gigsApi";

const NAV = [
  { label: "Dashboard", href: "/dashboard/brand", icon: LayoutDashboard, exact: true },
  { label: "My Gigs", href: "/dashboard/brand/gigs", icon: Briefcase },
  { label: "Messages", href: "/dashboard/brand/messages", icon: MessageSquare, badge: 3 },
  { label: "Browse Creators", href: "/dashboard/brand/creators", icon: Search },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [usage, setUsage] = useState({
    used: 0,
    total: FREE_GIGS_TOTAL,
    remaining: FREE_GIGS_TOTAL,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const next = await fetchFreeGigsUsage();
        if (!cancelled) setUsage(next);
      } catch {
        // Silent — chip just won't update. Gig pages surface their own errors.
      }
    };
    load();
    const onChange = () => load();
    window.addEventListener("gigs:changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("gigs:changed", onChange);
    };
  }, []);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 bg-white z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-200">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-sky">
          <img
            src="/logo.svg"
            alt="Jrive"
            className="h-4 w-4"
            style={{ filter: "brightness(0) invert(1)" }}
          />
        </span>
        <span className="font-semibold tracking-tight">
          Jrive<span className="text-brand-skyDeep">Content</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-brand-mist text-brand-ink"
                  : "text-slate-600 hover:bg-slate-50 hover:text-brand-ink"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-brand-skyDeep" : "text-slate-400"}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-skyDeep text-white text-[11px] font-semibold">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Free gigs chip */}
      {usage.remaining > 0 && (
        <div className="mx-3 mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-900">
              Free gigs left
            </span>
          </div>
          <p className="mt-1 text-xs text-amber-700">
            {usage.remaining} of {usage.total} remaining
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-amber-100 overflow-hidden">
            <div
              className="h-full bg-amber-500"
              style={{
                width: `${(usage.remaining / usage.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Settings at bottom */}
      <div className="px-3 pb-5 border-t border-slate-200 pt-3">
        <Link
          href="/dashboard/brand/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
            pathname.startsWith("/dashboard/brand/settings")
              ? "bg-brand-mist text-brand-ink"
              : "text-slate-600 hover:bg-slate-50 hover:text-brand-ink"
          }`}
        >
          <Settings size={18} className="text-slate-400" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
