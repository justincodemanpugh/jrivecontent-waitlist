import Link from "next/link";
import { Plus, Play, Target, DollarSign, Image as ImageIcon } from "lucide-react";

const TIPS = [
  {
    icon: Target,
    title: "Be specific",
    body: "Tell creators exactly what you want — angle, vibe, length, must-have shots.",
  },
  {
    icon: DollarSign,
    title: "Set a fair budget",
    body: "$40–$120 is the sweet spot for most short-form UGC videos.",
  },
  {
    icon: ImageIcon,
    title: "Share examples",
    body: "Drop a TikTok or Reel link so creators nail your style on the first try.",
  },
];

export default function EmptyState({ brandName }) {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-mist to-white p-8 md:p-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-brand-sky/40 px-4 py-1.5 text-xs font-medium text-brand-skyDeep">
          <span className="h-2 w-2 rounded-full bg-brand-skyDeep animate-pulse" />
          Welcome to JriveContent
        </span>
        <h2 className="mt-5 text-3xl md:text-4xl font-semibold tracking-tight text-brand-ink">
          Let&apos;s get your first video made{brandName ? `, ${brandName}` : ""}.
        </h2>
        <p className="mt-3 max-w-lg mx-auto text-slate-600">
          Post a gig in under 60 seconds. Real creators apply within 24–48 hours.
        </p>

        {/* Video placeholder */}
        <div className="mt-8 mx-auto max-w-2xl aspect-video rounded-2xl bg-brand-ink/90 relative overflow-hidden flex items-center justify-center group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-skyDeep/30 to-transparent" />
          <button
            type="button"
            aria-label="Play how-it-works video"
            className="relative h-16 w-16 rounded-full bg-white text-brand-ink flex items-center justify-center shadow-xl group-hover:scale-105 transition"
          >
            <Play size={24} className="ml-1 fill-brand-ink" />
          </button>
          <span className="absolute bottom-4 left-4 text-xs text-white/80">
            How JriveContent works · 1:24
          </span>
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard/brand/gigs/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-7 py-3.5 font-medium hover:bg-slate-800 transition shadow-lg shadow-brand-sky/20"
          >
            <Plus size={18} />
            Post your first gig
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIPS.map((tip, i) => {
          const Icon = tip.icon;
          return (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="h-10 w-10 rounded-xl bg-brand-sky/20 text-brand-skyDeep flex items-center justify-center">
                <Icon size={18} />
              </div>
              <h3 className="mt-4 font-semibold text-brand-ink">
                Tip {i + 1}: {tip.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                {tip.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
