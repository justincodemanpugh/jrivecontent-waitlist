"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  Film,
  TrendingUp,
  Wallet,
} from "lucide-react";

// ViralApp-style grouped secondary navigation for the Programs section.
// Kept scoped to /dashboard/brand/programs — the outer brand sidebar is
// unchanged. Light theme, matching the rest of the dashboard.
const GROUPS = [
  {
    label: "Analytics",
    items: [
      { label: "Overview", href: "/dashboard/brand/programs", icon: BarChart3, exact: true },
      { label: "Accounts", href: "/dashboard/brand/programs/accounts", icon: Users },
      { label: "Videos", href: "/dashboard/brand/programs/videos", icon: Film },
    ],
  },
  {
    label: "Creator Hub",
    items: [
      { label: "Programs", href: "/dashboard/brand/programs/manage", icon: TrendingUp },
      { label: "Payouts", href: "/dashboard/brand/programs/payouts", icon: Wallet },
    ],
  },
];

export default function ProgramsNav() {
  const pathname = usePathname();
  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav className="lg:w-56 lg:flex-shrink-0 lg:border-r lg:border-slate-200 lg:sticky lg:top-16 lg:self-start lg:min-h-[calc(100vh-4rem)] bg-white/60">
      <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar px-3 py-4 lg:py-5">
        {GROUPS.map((group) => (
          <div key={group.label} className="contents lg:block lg:mb-3">
            <p className="hidden lg:block px-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {group.label}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
                    active
                      ? "bg-brand-mist text-brand-ink"
                      : "text-slate-600 hover:bg-slate-50 hover:text-brand-ink"
                  }`}
                >
                  <Icon
                    size={17}
                    className={active ? "text-brand-skyDeep" : "text-slate-400"}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
