import Link from "next/link";
import { Play, Search, FileText, TrendingUp } from "lucide-react";
import { useState } from "react";

const TIPS = [
  {
    icon: Search,
    title: "Explore gigs",
    body: "Browse available gigs that match your niches and apply to ones that interest you.",
  },
  {
    icon: FileText,
    title: "Write great applications",
    body: "Be specific about your ideas and show brands why you're perfect for their content.",
  },
  {
    icon: TrendingUp,
    title: "Get approved & create",
    body: "Once approved, create amazing content and get paid for your work.",
  },
];

export default function CreatorEmptyState({ creatorName }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-mist to-white p-8 md:p-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white border border-brand-sky/40 px-4 py-1.5 text-xs font-medium text-brand-skyDeep">
          <span className="h-2 w-2 rounded-full bg-brand-skyDeep animate-pulse" />
          Welcome to JriveContent
        </span>
        <h2 className="mt-5 text-3xl md:text-4xl font-semibold tracking-tight text-brand-ink">
          Ready to create amazing content{creatorName ? `, ${creatorName}` : ""}?
        </h2>
        <p className="mt-3 max-w-lg mx-auto text-slate-600">
          Find gigs that match your style, apply in minutes, and get paid to create content.
        </p>

        {/* Tutorial video */}
        <div 
          className={`mt-8 mx-auto max-w-2xl aspect-video rounded-2xl bg-brand-ink/90 relative overflow-hidden group ${isPlaying ? "" : "cursor-pointer"}`}
          onClick={isPlaying ? undefined : () => setIsPlaying(true)}
        >
          {isPlaying ? (
            <video
              src="/videos/creator-tutorial/1778821729672224.mp4"
              controls
              autoPlay
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-skyDeep/30 to-transparent" />
              <button
                type="button"
                aria-label="Play creator tutorial video"
                className="relative h-16 w-16 rounded-full bg-white text-brand-ink flex items-center justify-center shadow-xl group-hover:scale-105 transition"
              >
                <Play size={24} className="ml-1 fill-brand-ink" />
              </button>
              <span className="absolute bottom-4 left-4 text-xs text-white/80">
                How to succeed as a creator · Click to play
              </span>
            </>
          )}
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard/creator/explore"
            className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-7 py-3.5 font-medium hover:bg-slate-800 transition shadow-lg shadow-brand-sky/20"
          >
            <Search size={18} />
            Explore gigs
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
                Step {i + 1}: {tip.title}
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
