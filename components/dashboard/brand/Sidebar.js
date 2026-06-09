"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Search,
  Sparkles,
  Settings,
  Lock,
  Users,
} from "lucide-react";
import { startBrandSubscription, fetchBilling } from "@/lib/dashboard/brand/billingApi";
import { fetchPendingApplicantCount } from "@/lib/dashboard/applicationsApi";

const NAV = [
  { label: "Dashboard", href: "/dashboard/brand", icon: LayoutDashboard, exact: true, tourId: "nav-dashboard" },
  { label: "My Gigs", href: "/dashboard/brand/gigs", icon: Briefcase, tourId: "nav-gigs" },
  { label: "Applicants", href: "/dashboard/brand/applicants", icon: Users, badgeKey: "pendingApplicants", tourId: "nav-applicants" },
  { label: "Messages", href: "/dashboard/brand/messages", icon: MessageSquare, tourId: "nav-messages" },
  { label: "Browse Creators", href: "/dashboard/brand/creators", icon: Search, tourId: "nav-creators" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isPro, setIsPro] = useState(null);
  const [pendingApplicants, setPendingApplicants] = useState(0);


  useEffect(() => {
    let cancelled = false;
    const loadPending = async () => {
      try {
        const n = await fetchPendingApplicantCount();
        if (!cancelled) setPendingApplicants(n);
      } catch {
        // Silent — badge just won't update.
      }
    };
    loadPending();
    const onChange = () => loadPending();
    window.addEventListener("applications:changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("applications:changed", onChange);
    };
  }, []);

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
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 bg-white z-40">
      {/* Logo */}
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

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          const locked = item.proOnly && isPro === false;
          const href = locked ? "/dashboard/brand/pricing" : item.href;
          const dynamicBadge =
            item.badgeKey === "pendingApplicants" && pendingApplicants > 0
              ? pendingApplicants
              : null;
          const badge = item.badge ?? dynamicBadge;
          return (
            <Link
              key={item.href}
              href={href}
              data-tour={item.tourId}
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
              {locked ? (
                <Lock size={14} className="text-slate-400" />
              ) : badge ? (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-skyDeep text-white text-[11px] font-semibold">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade to Pro */}
      <div className="px-3 pb-3 border-t border-slate-200 pt-3">
        <button
          onClick={handleUpgrade}
          disabled={upgrading}
          data-tour="upgrade-button"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-skyDeep to-brand-ink text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-brand-sky/20 hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          {upgrading ? "Redirecting..." : "Start Free Trial"}
        </button>
        <p className="mt-1.5 text-center text-[11px] text-slate-500">
          3 days free · then $25/mo
        </p>
      </div>

      {/* Settings */}
      <div className="px-3 pb-3">
        <Link
          href="/dashboard/brand/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
            pathname.startsWith("/dashboard/brand/settings")
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
