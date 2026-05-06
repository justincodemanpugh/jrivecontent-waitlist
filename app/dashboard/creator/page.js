"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Wallet, Inbox } from "lucide-react";
import TopBar from "@/components/dashboard/creator/TopBar";
import { useCreator } from "@/components/dashboard/creator/CreatorProvider";
import {
  mockApplications,
  mockOpenGigs,
  APPLICATION_STATUS,
} from "@/lib/dashboard/creator/mockData";

const STATS = [
  { label: "Open applications", value: 2, icon: Inbox },
  { label: "Earnings this month", value: "$0", icon: Wallet },
  { label: "Profile strength", value: "60%", icon: Sparkles },
];

export default function CreatorHomePage() {
  const creator = useCreator();
  const recommended = mockOpenGigs.slice(0, 3);

  return (
    <>
      <TopBar title="Home" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-brand-ink">
            Welcome back, {creator.firstName} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Here are gigs that match your niches and the latest on your applications.
          </p>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-lg font-semibold text-brand-ink">{s.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Applications */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-brand-ink">
              Your applications
            </h2>
            <Link
              href="/dashboard/creator/explore"
              className="text-sm text-brand-skyDeep hover:underline inline-flex items-center gap-1"
            >
              Browse more <ArrowRight size={14} />
            </Link>
          </div>
          {mockApplications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                You haven&apos;t applied to any gigs yet.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {mockApplications.map((a) => {
                const meta =
                  APPLICATION_STATUS[a.status] || APPLICATION_STATUS.pending;
                return (
                  <li
                    key={a.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-brand-ink truncate">
                        {a.gigTitle}
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.brand} · Applied {a.appliedAt}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border ${meta.classes}`}
                    >
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recommended */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-brand-ink">
              Recommended for you
            </h2>
            <Link
              href="/dashboard/creator/explore"
              className="text-sm text-brand-skyDeep hover:underline inline-flex items-center gap-1"
            >
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.map((g) => (
              <GigCardCompact key={g.id} gig={g} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function GigCardCompact({ gig }) {
  return (
    <Link
      href={`/dashboard/creator/explore/${gig.id}`}
      className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-brand-sky hover:-translate-y-0.5 transition flex flex-col"
    >
      <div
        className={`h-24 bg-gradient-to-br ${gig.cover} relative flex items-start justify-end p-3`}
      >
        <span className="inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full bg-white/90 text-brand-ink">
          ${gig.payout}/{gig.payoutUnit}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-brand-ink leading-snug group-hover:text-brand-skyDeep transition line-clamp-2">
          {gig.title}
        </h3>
        <p className="mt-1.5 text-xs text-slate-500">
          {gig.brand} · {gig.tag}
        </p>
      </div>
    </Link>
  );
}
