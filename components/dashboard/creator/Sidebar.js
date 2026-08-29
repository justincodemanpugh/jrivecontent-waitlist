"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  User,
  Settings,
  TrendingUp,
} from "lucide-react";
import Logo from "@/components/Logo";

const NAV = [
  { label: "Home", href: "/dashboard/creator", icon: LayoutDashboard, exact: true },
  { label: "Campaigns", href: "/dashboard/creator/programs", icon: TrendingUp },
  { label: "Messages", href: "/dashboard/creator/messages", icon: MessageSquare },
  { label: "Profile", href: "/dashboard/creator/profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-line bg-surface z-40">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-line">
        <Logo size={32} />
        <span className="font-semibold tracking-tight">
          Jrive<span className="text-accent">Content</span>
        </span>
      </div>

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
                  ? "bg-accent-tint text-ink"
                  : "text-muted hover:bg-surface-sunken hover:text-ink"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-accent" : "text-faint"}
              />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-on-accent text-[11px] font-semibold">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-5 border-t border-line pt-3">
        <Link
          href="/dashboard/creator/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
            pathname.startsWith("/dashboard/creator/settings")
              ? "bg-accent-tint text-ink"
              : "text-muted hover:bg-surface-sunken hover:text-ink"
          }`}
        >
          <Settings size={18} className="text-faint" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
