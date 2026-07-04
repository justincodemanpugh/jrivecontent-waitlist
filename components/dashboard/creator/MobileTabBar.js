"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Compass,
  MessageSquare,
  ClipboardList,
  Inbox,
  User,
  Settings,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";

const TABS = [
  { label: "Home", href: "/dashboard/creator", icon: LayoutDashboard, exact: true },
  { label: "Explore", href: "/dashboard/creator/explore", icon: Compass },
  { label: "Messages", href: "/dashboard/creator/messages", icon: MessageSquare },
];

const MORE_ITEMS = [
  { label: "Assignments", href: "/dashboard/creator/assignments", icon: ClipboardList },
  { label: "Programs", href: "/dashboard/creator/programs", icon: TrendingUp },
  { label: "Applications", href: "/dashboard/creator/applications", icon: Inbox },
  { label: "Profile", href: "/dashboard/creator/profile", icon: User },
  { label: "Settings", href: "/dashboard/creator/settings", icon: Settings },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href));
  const moreActive = MORE_ITEMS.some((t) => pathname.startsWith(t.href));

  return (
    <>
      {/* More bottom sheet */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-base font-semibold text-brand-ink">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            <ul className="px-2 pb-4">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                        active
                          ? "bg-brand-mist text-brand-ink"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={active ? "text-brand-skyDeep" : "text-slate-400"}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white border-t border-slate-200">
        <ul className="grid grid-cols-4 h-full">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = isActive(t);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] ${
                    active ? "text-brand-skyDeep" : "text-slate-500"
                  }`}
                >
                  <Icon size={18} />
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] ${
                moreActive || moreOpen ? "text-brand-skyDeep" : "text-slate-500"
              }`}
            >
              <Menu size={18} />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
