"use client";

import { FadeIn } from "@/hooks/useFadeIn";

const INDUSTRY = [
  { label: "$80",   pct: 55 },
  { label: "$100",  pct: 78 },
  { label: "$120",  pct: 92 },
  { label: "$150",  pct: 95 },
  { label: "$200",  pct: 80 },
  { label: "$250",  pct: 62 },
  { label: "$300",  pct: 48 },
  { label: "+$400", pct: 42 },
];

const JRIVE = [
  { label: "Free Trial", pct: 45 },
  { label: "$15",        pct: 72 },
  { label: "$25",        pct: 95 },
  { label: "$35",        pct: 68 },
  { label: "$50",        pct: 38 },
];

function Chart({ data, barClass }) {
  return (
    <div className="mt-6">
      <div className="flex items-end gap-2 sm:gap-3 h-48">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <div
              className={`w-full rounded-t-lg ${barClass} transition-all duration-700 ease-out`}
              style={{ height: `${d.pct}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 sm:gap-3 mt-2">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] sm:text-xs font-semibold text-slate-500 tracking-tight"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingComparison() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-brand-ink">
              UGC shouldn&apos;t cost a <span className="text-brand-skyDeep">fortune</span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              The average brand pays well over $100 for a single 30-second UGC video.
              On JriveContent, most brands pay a fraction of that — without sacrificing quality.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Industry chart */}
          <FadeIn>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 h-full">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg md:text-xl font-semibold text-brand-ink">
                  Average 30s UGC video price
                </h3>
                <span className="inline-flex items-center rounded-lg bg-slate-900 text-white text-sm font-bold px-2.5 py-1">
                  ~$165
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Industry pricing across freelance UGC creators
              </p>

              <Chart data={INDUSTRY} barClass="bg-slate-300" />

              <p className="mt-5 text-xs text-slate-400 leading-relaxed">
                Estimated range based on typical freelance UGC rates on platforms like Influee,
                Insense, and Aspire. Most creators start at $80+ per video.
              </p>
            </div>
          </FadeIn>

          {/* JriveContent chart */}
          <FadeIn delay={120}>
            <div className="rounded-3xl border-2 border-brand-sky bg-brand-mist p-6 md:p-8 h-full relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center rounded-full bg-brand-ink text-white text-[10px] font-semibold uppercase tracking-wider px-3 py-1">
                  Up to 80% cheaper
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg md:text-xl font-semibold text-brand-ink">
                  UGC on JriveContent
                </h3>
                <span className="inline-flex items-center rounded-lg bg-brand-skyDeep text-white text-sm font-bold px-2.5 py-1">
                  ~$25
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                Real pricing from creators on our platform
              </p>

              <Chart data={JRIVE} barClass="bg-brand-skyDeep" />

              <p className="mt-5 text-xs text-slate-500 leading-relaxed">
                Based on typical creator rates on JriveContent. Many creators offer free trial
                videos or product-for-content barter collabs.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Summary stat strip */}
        <FadeIn delay={200}>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-brand-ink text-white p-6">
              <div className="text-3xl font-bold text-brand-sky">$95+</div>
              <div className="mt-1 text-sm text-slate-300">Saved per video on average</div>
            </div>
            <div className="rounded-2xl bg-brand-ink text-white p-6">
              <div className="text-3xl font-bold text-brand-sky">4–5x</div>
              <div className="mt-1 text-sm text-slate-300">More videos per marketing dollar</div>
            </div>
            <div className="rounded-2xl bg-brand-ink text-white p-6">
              <div className="text-3xl font-bold text-brand-sky">48 hrs</div>
              <div className="mt-1 text-sm text-slate-300">Average turnaround on your first match</div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
