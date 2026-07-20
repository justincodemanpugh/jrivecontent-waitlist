"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Search,
} from "lucide-react";

const TABS = [
  { label: "Programs", href: "/dashboard/brand/programs", icon: TrendingUp },
  { label: "Creators", href: "/dashboard/brand/my-creators", icon: Users },
  { label: "Messages", href: "/dashboard/brand/messages", icon: MessageSquare },
  { label: "Browse", href: "/dashboard/brand/creators", icon: Search },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const isActive = (t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href));

  return (
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
      </ul>
    </nav>
  );
}
