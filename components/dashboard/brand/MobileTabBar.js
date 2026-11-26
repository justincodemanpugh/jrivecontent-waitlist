"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BarChart3, CalendarCheck, Users, Wallet } from "lucide-react";
import { SECTIONS, locate } from "@/lib/dashboard/brand/nav";

const ICONS = { week: CalendarCheck, creators: Users, results: BarChart3, payouts: Wallet };

export default function MobileTabBar() {
  const active = locate(usePathname()).section?.id;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface border-t border-line">
      <ul className="grid grid-cols-4 h-full">
        {SECTIONS.map((section) => {
          const Icon = ICONS[section.id];
          return (
            <li key={section.id}>
              <Link
                href={section.href}
                aria-current={active === section.id ? "page" : undefined}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] ${
                  active === section.id ? "text-accent" : "text-muted"
                }`}
              >
                <Icon size={18} />
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
