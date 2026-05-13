"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, AlertTriangle } from "lucide-react";

const TABS = [
  {
    label: "Profile",
    href: "/dashboard/brand/settings/profile",
    icon: User,
  },
  {
    label: "Billing",
    href: "/dashboard/brand/settings/billing",
    icon: CreditCard,
  },
  {
    label: "Account",
    href: "/dashboard/brand/settings/account",
    icon: AlertTriangle,
  },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  active
                    ? "border-brand-skyDeep text-brand-ink"
                    : "border-transparent text-slate-500 hover:text-brand-ink hover:border-slate-300"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
