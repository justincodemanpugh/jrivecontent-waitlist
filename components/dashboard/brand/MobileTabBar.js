"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  Plus,
  MessageSquare,
  Search,
} from "lucide-react";

const TABS = [
  { label: "Home", href: "/dashboard/brand", icon: LayoutDashboard, exact: true },
  { label: "Gigs", href: "/dashboard/brand/gigs", icon: Briefcase },
  { label: "Post", href: "/dashboard/brand/gigs/new", icon: Plus, primary: true },
  { label: "Messages", href: "/dashboard/brand/messages", icon: MessageSquare },
  { label: "Creators", href: "/dashboard/brand/creators", icon: Search },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href));

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-white border-t border-slate-200">
      <ul className="grid grid-cols-5 h-full">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(t);
          if (t.primary) {
            return (
              <li key={t.href} className="flex items-center justify-center">
                <Link
                  href={t.href}
                  className="h-12 w-12 rounded-full bg-brand-ink text-white flex items-center justify-center shadow-lg shadow-brand-sky/30 -mt-4"
                  aria-label={t.label}
                >
                  <Icon size={20} />
                </Link>
              </li>
            );
          }
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
      </ul>
    </nav>
  );
}
