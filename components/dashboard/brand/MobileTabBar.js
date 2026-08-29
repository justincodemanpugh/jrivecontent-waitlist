"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Search,
  Lock,
} from "lucide-react";
import ComingSoonModal from "./ComingSoonModal";

const TABS = [
  { label: "Campaigns", href: "/dashboard/brand/programs", icon: TrendingUp },
  { label: "Creators", href: "/dashboard/brand/my-creators", icon: Users },
  { label: "Messages", href: "/dashboard/brand/messages", icon: MessageSquare },
  { label: "Browse", href: "/dashboard/brand/creators", icon: Search, comingSoon: true },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const [comingSoon, setComingSoon] = useState(false);
  const isActive = (t) => (t.exact ? pathname === t.href : pathname.startsWith(t.href));

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface border-t border-line">
      <ul className="grid grid-cols-4 h-full">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(t) && !t.comingSoon;
          const className = `w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] ${
            active ? "text-accent" : "text-muted"
          }`;
          return (
            <li key={t.href}>
              {t.comingSoon ? (
                <button
                  type="button"
                  onClick={() => setComingSoon(true)}
                  className={className}
                >
                  <span className="relative">
                    <Icon size={18} />
                    <Lock
                      size={10}
                      className="absolute -right-1.5 -top-1 text-faint"
                    />
                  </span>
                  {t.label}
                </button>
              ) : (
                <Link href={t.href} className={className}>
                  <Icon size={18} />
                  {t.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <ComingSoonModal
        open={comingSoon}
        title="Browse Creators"
        onClose={() => setComingSoon(false)}
      />
    </nav>
  );
}
