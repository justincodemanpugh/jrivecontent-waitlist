"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, Sparkles, Settings, Users, BarChart3, Wallet } from "lucide-react";
import { startBrandSubscription, fetchBilling } from "@/lib/dashboard/brand/billingApi";
import Logo from "@/components/Logo";
import { SECTIONS, locate } from "@/lib/dashboard/brand/nav";

const SECTION_ICONS = { week: CalendarCheck, creators: Users, results: BarChart3, payouts: Wallet };

export default function Sidebar() {
  const pathname = usePathname();
  const [isPro, setIsPro] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const billing = await fetchBilling();
        if (!cancelled) setIsPro(billing?.plan === "pro");
      } catch {
        // Silent — default to offering the upgrade
        if (!cancelled) setIsPro(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const active = locate(pathname).section?.id;

  const [upgrading, setUpgrading] = useState(false);
  const handleUpgrade = async () => {
    if (upgrading) return;
    setUpgrading(true);
    try {
      const url = await startBrandSubscription("/dashboard/brand/settings/billing");
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
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.id];
          const isActive = active === section.id;
          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={isActive ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                isActive ? "bg-accent-tint text-ink" : "text-muted hover:bg-surface-sunken hover:text-ink"
              }`}
            >
              <Icon size={18} className={isActive ? "text-accent" : "text-faint"} />
              {section.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade to Pro. Hidden until we know they aren't paying already. */}
      <div className={`px-3 pb-3 border-t border-line pt-3 ${isPro === false ? "" : "hidden"}`}>
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          data-tour="upgrade-button"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-skyDeep to-brand-ink text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-accent-soft/20 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          {upgrading ? "Redirecting..." : "Upgrade"}
        </button>
        <p className="mt-1.5 text-center text-[11px] text-muted">
          New: $1 for 7 days · then $25/mo
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
    </aside>
  );
}
