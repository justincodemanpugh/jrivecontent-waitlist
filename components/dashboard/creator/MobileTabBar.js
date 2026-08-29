"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  User,
  Settings,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";

const TABS = [
  { label: "Home", href: "/dashboard/creator", icon: LayoutDashboard, exact: true },
  { label: "Campaigns", href: "/dashboard/creator/programs", icon: TrendingUp },
  { label: "Messages", href: "/dashboard/creator/messages", icon: MessageSquare },
];

const MORE_ITEMS = [
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
            className="absolute inset-0 bg-scrim/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 inset-x-0 rounded-t-2xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-base font-semibold text-ink">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full text-muted hover:bg-surface-hover"
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
                          ? "bg-accent-tint text-ink"
                          : "text-muted hover:bg-surface-sunken"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={active ? "text-accent" : "text-faint"}
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

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface border-t border-line">
        <ul className="grid grid-cols-4 h-full">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = isActive(t);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] ${
                    active ? "text-accent" : "text-muted"
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
                moreActive || moreOpen ? "text-accent" : "text-muted"
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
