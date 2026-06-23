import Link from "next/link";
import { Send, Users, Video, Target } from "lucide-react";

const TIPS = [
  {
    icon: Users,
    title: "Build your roster",
    body: "Browse creators and connect with ones that match your brand style.",
  },
  {
    icon: Video,
    title: "Add example videos",
    body: "Upload reference videos so creators know exactly what you're looking for.",
  },
  {
    icon: Target,
    title: "Be specific",
    body: "Clear instructions help creators nail your content on the first try.",
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
          Build your creator team{brandName ? `, ${brandName}` : ""}.
        </h2>
        <p className="mt-3 max-w-lg mx-auto text-slate-600">
          Connect with creators, send them briefs, and get content delivered directly to you.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard/brand/creators"
            className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-7 py-3.5 font-medium hover:bg-slate-800 transition shadow-lg shadow-brand-sky/20"
          >
            <Users size={18} />
            Browse Creators
          </Link>
          <Link
            href="/dashboard/brand/briefs/new"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white text-brand-ink px-7 py-3.5 font-medium hover:bg-slate-50 transition"
          >
            <Send size={18} />
            Send a Brief
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
