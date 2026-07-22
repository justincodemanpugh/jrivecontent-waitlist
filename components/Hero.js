import Link from "next/link";
import { ArrowRight, Sparkles, Eye, DollarSign, TrendingUp } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

export default function Hero() {
  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-gradient-to-b from-brand-mist to-white"
    >
      <div className="mx-auto max-w-6xl px-6 pt-28 pb-0 md:pt-44 text-center">
        <FadeIn delay={50}>
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-skyDeep/30 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-skyDeep shadow-sm">
              <Sparkles size={13} />
              New · Creator redistribution
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <h1 className="mx-auto max-w-4xl text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.02] text-brand-ink">
            Stop guessing<span className="text-brand-sky">.</span> Redistribute your
            winning videos<span className="text-brand-skyDeep">.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="mt-5 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            Stop creating from scratch. Hand your best-performing videos to vetted
            creators and scale what&apos;s already working — across every platform.
          </p>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-7 py-3.5 font-medium hover:bg-slate-800 transition shadow-lg shadow-brand-sky/20"
            >
              Get started for free
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white text-brand-ink px-7 py-3.5 font-medium hover:border-brand-sky hover:bg-brand-mist/50 transition"
            >
              See how it works
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={500}>
          <p className="mt-5 text-xs text-slate-500">
            Pay $0 today · No credit card required
          </p>
        </FadeIn>

        {/* Coded mock product UI — bleeds off the bottom of the hero */}
        <FadeIn delay={600}>
          <div className="mt-14 md:mt-16">
            <MockDashboard />
          </div>
        </FadeIn>
      </div>

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-sky/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-brand-sky/30 blur-3xl" />
    </section>
  );
}

/* ---------- Coded mock marketplace dashboard ---------- */

function MockDashboard() {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="rounded-t-2xl border border-slate-200 border-b-0 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden text-left">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-4 hidden sm:flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-400">
            app.jrive.co / gigs
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5">
          {/* Left: gig + applicants */}
          <div className="md:col-span-2 space-y-4">
            {/* Gig row */}
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-ink">
                    Redistribute: &ldquo;3AM productivity&rdquo;
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    15 videos · $30 per video
                  </p>
                </div>
                <span className="rounded-full bg-brand-sky/20 text-brand-skyDeep text-[11px] font-semibold px-3 py-1">
                  Live
                </span>
              </div>
            </div>

            {/* Applicant list */}
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              <p className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Applicants
              </p>
              {APPLICANTS.map((a) => (
                <div key={a.handle} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="h-9 w-9 rounded-full shrink-0"
                    style={{ background: a.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-ink truncate">
                      {a.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{a.handle}</p>
                  </div>
                  <span className="rounded-full bg-brand-mist text-brand-skyDeep text-xs font-semibold px-2.5 py-1 whitespace-nowrap">
                    {a.views} views
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: metrics */}
          <div className="space-y-4">
            <MetricTile
              icon={<Eye size={16} />}
              label="Views this month"
              value="2.4M"
              delta="+18%"
            />
            <MetricTile
              icon={<TrendingUp size={16} />}
              label="Videos live"
              value="47"
              delta="+12"
            />
            <MetricTile
              icon={<DollarSign size={16} />}
              label="Paid to creators"
              value="$3,180"
              delta="on approval"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricTile({ icon, label, value, delta }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-sky/20 text-brand-skyDeep">
          {icon}
        </span>
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-brand-ink">{value}</span>
        <span className="text-xs font-medium text-brand-skyDeep">{delta}</span>
      </div>
    </div>
  );
}

const APPLICANTS = [
  { name: "Liam Chen", handle: "@liamchen", views: "154.6k", color: "#7DD3FC" },
  { name: "Ava Lee", handle: "@avalee", views: "92.1k", color: "#38BDF8" },
  { name: "Noah Park", handle: "@noahmakes", views: "48.3k", color: "#0F172A" },
];
