"use client";

import { useState } from "react";
import { FadeIn } from "@/hooks/useFadeIn";
import { DollarSign, Gift, FileText, Send, Check } from "lucide-react";
import { PlatformChips } from "./_shared";

const TABS = [
  {
    title: "Create Your UGC Campaign",
    body: "Spin up a campaign in minutes. Set goals, budgets, and briefs your creators can follow.",
    mock: CampaignMock,
  },
  {
    title: "Define Your Payout Rules",
    body: "Set the base fee your creators earn per video or per month. Our payments engine keeps every program on one clear, consistent structure.",
    mock: PayoutRulesMock,
  },
  {
    title: "Onboard Your Creators",
    body: "Let your creators review their performance, campaign details, and payment status. One source of truth for streamlined information.",
    mock: OnboardMock,
  },
  {
    title: "Get Real-Time Analytics",
    body: "Ensure your creators are on track with posting, and monitor your campaign & creator performance as the numbers come in.",
    mock: AnalyticsMock,
  },
  {
    title: "Automate Payouts & Invoicing",
    body: "Stop chasing invoices & handling hundreds of payments each month manually. Leverage our Merchant-of-Records payments infrastructure that supports legally compliant & easy international payouts.",
    mock: AutomateMock,
  },
];

export default function CreatorManagement() {
  const [active, setActive] = useState(1);
  const ActiveMock = TABS[active].mock;

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <h2 className="text-center font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl md:text-5xl">
            Creator Management
          </h2>
        </FadeIn>

        <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          {/* Accordion */}
          <div className="space-y-1">
            {TABS.map((tab, i) => {
              const open = i === active;
              return (
                <button
                  key={tab.title}
                  onClick={() => setActive(i)}
                  className={`w-full border-l-2 pl-5 pr-4 text-left transition-all ${
                    open
                      ? "rounded-r-xl border-brand-skyDeep bg-brand-mist/40 py-5"
                      : "border-slate-200 py-4 hover:border-brand-sky"
                  }`}
                >
                  <h3
                    className={`font-display text-xl font-bold transition ${
                      open ? "text-brand-ink" : "text-slate-500"
                    }`}
                  >
                    {tab.title}
                  </h3>
                  {open && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{tab.body}</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Mock panel */}
          <FadeIn key={active} delay={0}>
            <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-mist/40 to-white p-8 shadow-sm">
              <ActiveMock />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ---------- Mocks ---------- */
function CampaignMock() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">New Campaign</p>
      <div className="mt-3 space-y-2.5">
        <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-brand-ink">
          Summer UGC Push
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400">
          Target: 2M views · Budget $5,000
        </div>
        <div className="flex items-center gap-2">
          <PlatformChips />
        </div>
      </div>
      <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-brand-skyDeep to-brand-sky py-2.5 text-sm font-semibold text-white">
        Launch Campaign
      </button>
    </div>
  );
}

function PayoutRulesMock() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-base font-bold text-brand-ink">Flexible Payout Engine</p>
          <p className="text-xs text-slate-400">My UGC Program</p>
        </div>
        <span className="rounded-full bg-brand-sky/20 px-2.5 py-1 text-[11px] font-semibold text-brand-skyDeep">
          Define Rules
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-skyDeep text-white">
              <DollarSign size={13} />
            </span>
            <span className="text-sm font-medium text-brand-ink">Base Compensation</span>
          </div>
          <span className="mt-1.5 inline-block rounded-md bg-brand-mist px-2 py-1 text-[11px] font-medium text-brand-skyDeep">
            $300 for 15 videos / month
          </span>
        </div>
      </div>
    </div>
  );
}

function OnboardMock() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-sky to-brand-skyDeep" />
        <div className="flex-1">
          <p className="font-display text-base font-bold text-brand-ink">Liam Chen</p>
          <p className="text-xs text-slate-400">@liamchen</p>
        </div>
        <PlatformChips />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-[11px] text-slate-400">Monthly Views</p>
          <p className="text-lg font-bold text-brand-ink">1.3M</p>
        </div>
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="text-[11px] text-slate-400">Outlier Factor</p>
          <p className="text-lg font-bold text-brand-ink">3x</p>
        </div>
      </div>
    </div>
  );
}

function AnalyticsMock() {
  const rows = [
    { name: "Campaign 1", target: "500K Views", status: "Completed", color: "green" },
    { name: "Campaign 2", target: "2M Views", status: "Behind Schedule", color: "sky" },
    { name: "Campaign 3", target: "50K Views", status: "In progress", color: "slate" },
  ];
  return (
    <div className="w-full max-w-sm space-y-3">
      {rows.map((r) => (
        <div key={r.name} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-brand-ink">{r.name}</p>
              <p className="text-[11px] text-slate-400">Target: {r.target}</p>
            </div>
            <span
              className={`text-[11px] font-semibold ${
                r.color === "green"
                  ? "text-green-500"
                  : r.color === "sky"
                  ? "text-brand-skyDeep"
                  : "text-slate-400"
              }`}
            >
              {r.status}
            </span>
          </div>
          {r.color === "green" && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-green-100">
              <div className="h-1.5 w-full rounded-full bg-green-500" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AutomateMock() {
  const rows = [
    { icon: FileText, label: "Agreement", status: "Signed", color: "green" },
    { icon: Gift, label: "Bonuses", status: "Calculated", color: "green" },
    { icon: Send, label: "Payout", status: "Sending…", color: "sky" },
  ];
  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="font-display text-base font-bold text-brand-ink">Payout Automation</p>
      <div className="mt-4 space-y-3">
        {rows.map(({ icon: Icon, label, status, color }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-mist text-brand-skyDeep">
                <Icon size={15} />
              </span>
              <span className="text-sm font-medium text-brand-ink">{label}</span>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                color === "green"
                  ? "bg-green-50 text-green-600"
                  : "bg-brand-mist text-brand-skyDeep"
              }`}
            >
              {color === "green" && <Check size={11} />}
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
