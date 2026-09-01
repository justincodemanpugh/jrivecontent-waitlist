"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  Search,
  Sparkles,
  Settings,
  Lock,
  Users,
  TrendingUp,
  BarChart3,
  Film,
  Wallet,
} from "lucide-react";
import { startBrandSubscription, fetchBilling } from "@/lib/dashboard/brand/billingApi";
import ComingSoonModal from "./ComingSoonModal";
import Logo from "@/components/Logo";

// Single grouped nav — Analytics (Programs performance) + Creator Hub
// (everything creator/program management related).
const NAV_GROUPS = [
  {
    label: "Analytics",
    items: [
      { label: "Overview", href: "/dashboard/brand/programs", icon: BarChart3, exact: true, tourId: "nav-programs" },
      { label: "Accounts", href: "/dashboard/brand/programs/accounts", icon: Users },
      { label: "Videos", href: "/dashboard/brand/programs/videos", icon: Film },
    ],
  },
  {
    label: "Creator Hub",
    items: [
      { label: "Campaigns", href: "/dashboard/brand/programs/manage", icon: TrendingUp },
      { label: "My Creators", href: "/dashboard/brand/my-creators", icon: Users, tourId: "nav-my-creators" },
      { label: "Browse Creators", href: "/dashboard/brand/creators", icon: Search, tourId: "nav-creators" },
      { label: "Messages", href: "/dashboard/brand/messages", icon: MessageSquare, tourId: "nav-messages" },
      { label: "Payouts", href: "/dashboard/brand/programs/payouts", icon: Wallet },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isPro, setIsPro] = useState(null);
  const [comingSoon, setComingSoon] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const billing = await fetchBilling();
        if (!cancelled) setIsPro(billing?.plan === "pro");
      } catch {
        // Silent — default to showing lock icons
        if (!cancelled) setIsPro(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const [upgrading, setUpgrading] = useState(false);
  const handleUpgrade = async () => {
    if (upgrading) return;
    setUpgrading(true);
    try {
      const url = await startBrandSubscription(
        "/dashboard/brand/settings/billing?subscription=success",
      );
      window.location.href = url;
    } catch (e) {
      console.error("[upgrade]", e);
      setUpgrading(false);
    }
  };

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-line bg-surface z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-line">
        <Logo size={32} />
        <span className="font-semibold tracking-tight">
          Jrive<span className="text-accent">Content</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wide text-faint">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                const locked = item.proOnly && isPro === false;
                const href = locked ? "/dashboard/brand/pricing" : item.href;
                const className = `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active && !item.comingSoon
                    ? "bg-accent-tint text-ink"
                    : "text-muted hover:bg-surface-sunken hover:text-ink"
                }`;

                if (item.comingSoon) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      data-tour={item.tourId}
                      onClick={() => setComingSoon(item.label)}
                      className={className}
                    >
                      <Icon size={18} className="text-faint" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <Lock size={14} className="text-faint" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={href}
                    data-tour={item.tourId}
                    className={className}
                  >
                    <Icon
                      size={18}
                      className={active ? "text-accent" : "text-faint"}
                    />
                    <span className="flex-1">{item.label}</span>
                    {locked && <Lock size={14} className="text-faint" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade to Pro */}
      <div className="px-3 pb-3 border-t border-line pt-3">
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          data-tour="upgrade-button"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-skyDeep to-brand-ink text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-accent-soft/20 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          {upgrading ? "Redirecting..." : "Start Free Trial"}
        </button>
        <p className="mt-1.5 text-center text-[11px] text-muted">
          3 days free · then $25/mo
        </p>
      </div>

      {/* Settings */}
      <div className="px-3 pb-3">
        <Link
          href="/dashboard/brand/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
            pathname.startsWith("/dashboard/brand/settings")
              ? "bg-accent-tint text-ink"
              : "text-muted hover:bg-surface-sunken hover:text-ink"
          }`}
        >
          <Settings size={18} className="text-faint" />
          Settings
        </Link>
      </div>

      <ComingSoonModal
        open={comingSoon !== null}
        title={comingSoon || ""}
        onClose={() => setComingSoon(null)}
      />
    </aside>
  );
}
