import Image from "next/image";
import { Eye, DollarSign, TrendingUp } from "lucide-react";

/* Coded mock of the gig marketplace view. Mirrors the mock in components/Hero.js,
   but with real creator photos and a fully closed window instead of one that
   bleeds off the bottom. Kept as a separate copy so the home page hero is
   free to diverge. */
export default function GigMock() {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl shadow-slate-900/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-green-400" />
          <div className="ml-4 hidden items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-400 sm:flex">
            app.jrive.co / gigs
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          {/* Left: gig + applicants */}
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-ink">
                    Redistribute: &ldquo;3AM productivity&rdquo;
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">15 videos · $30 per video</p>
                </div>
                <span className="rounded-full bg-brand-sky/20 px-3 py-1 text-[11px] font-semibold text-brand-skyDeep">
                  Live
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              <p className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Applicants
              </p>
              {APPLICANTS.map((a) => (
                <div key={a.handle} className="flex items-center gap-3 px-4 py-3">
                  <Image
                    src={a.avatar}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brand-ink">{a.name}</p>
                    <p className="truncate text-xs text-slate-500">{a.handle}</p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-brand-mist px-2.5 py-1 text-xs font-semibold text-brand-skyDeep">
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
  {
    name: "Liam Chen",
    handle: "@liamchen",
    views: "154.6k",
    avatar: "/images/profiles/creator-1-profile.png",
  },
  {
    name: "Ava Lee",
    handle: "@avalee",
    views: "92.1k",
    avatar: "/images/profiles/creator-2-profile.png",
  },
  {
    name: "Noah Park",
    handle: "@noahmakes",
    views: "48.3k",
    avatar: "/images/profiles/creator-3-profile.png",
  },
];
