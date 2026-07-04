"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  User,
  Settings,
  TrendingUp,
} from "lucide-react";

const NAV = [
  { label: "Home", href: "/dashboard/creator", icon: LayoutDashboard, exact: true },
  { label: "Assignments", href: "/dashboard/creator/assignments", icon: ClipboardList },
  { label: "Programs", href: "/dashboard/creator/programs", icon: TrendingUp },
  { label: "Messages", href: "/dashboard/creator/messages", icon: MessageSquare },
  { label: "Profile", href: "/dashboard/creator/profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 bg-white z-40">
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

      <div className="px-3 pb-5 border-t border-slate-200 pt-3">
        <Link
          href="/dashboard/creator/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
            pathname.startsWith("/dashboard/creator/settings")
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
