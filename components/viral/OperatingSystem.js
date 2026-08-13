import { FadeIn } from "@/hooks/useFadeIn";

export default function OperatingSystem() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <h2 className="text-center font-display text-4xl font-bold tracking-tight text-brand-ink sm:text-5xl md:text-6xl">
            The operating system for UGC
          </h2>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Without */}
          <FadeIn delay={100}>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-brand-ink px-8 py-7">
                <h3 className="font-display text-2xl font-bold text-white">Without JriveContent</h3>
              </div>
              <div className="relative p-8">
                <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm">
                  {/* fake spreadsheet */}
                  <div className="flex border-b border-slate-100 text-[11px] font-medium text-slate-400">
                    <div className="w-8 border-r border-slate-100 py-1.5 text-center">#</div>
                    {["A", "B", "C"].map((c) => (
                      <div key={c} className="flex-1 border-r border-slate-100 py-1.5 text-center last:border-r-0">
                        {c}
                      </div>
                    ))}
                  </div>
                  {Array.from({ length: 7 }).map((_, r) => (
                    <div key={r} className="flex border-b border-slate-50 text-[11px] text-slate-300 last:border-b-0">
                      <div className="w-8 border-r border-slate-100 py-2 text-center">{r + 1}</div>
                      {[0, 1, 2].map((c) => (
                        <div key={c} className="flex-1 border-r border-slate-50 py-2 last:border-r-0" />
                      ))}
                    </div>
                  ))}
                </div>
                {/* speech bubbles */}
                <Bubble className="left-6 top-24">Data outdated — refresh manually</Bubble>
                <Bubble className="right-8 top-10">Tally payouts by hand</Bubble>
                <Bubble className="bottom-4 right-10">You&apos;re doing the work of 3 people</Bubble>
              </div>
            </div>
          </FadeIn>

          {/* With */}
          <FadeIn delay={200}>
            <div className="overflow-hidden rounded-3xl border border-brand-sky/40 bg-white shadow-lg shadow-brand-sky/10">
              <div className="relative bg-gradient-to-r from-brand-skyDeep to-brand-sky px-8 py-7">
                <h3 className="font-display text-2xl font-bold text-white">With JriveContent</h3>
              </div>
              <div className="bg-brand-mist/40 p-8">
                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="Views" value="138.5M" delta="+46k" />
                    <Stat label="Likes" value="50K" delta="+4k" />
                    <Stat label="Revenue" value="$35K" delta="+$500" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Stat label="Videos" value="147" delta="+46" />
                    <Stat label="App Installs" value="1.3K" delta="+300" />
                  </div>
                  {/* mini bar + area */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-[11px] font-medium text-slate-500">Metrics</p>
                      <div className="mt-3 flex items-end gap-1.5">
                        {[40, 70, 30, 90, 55, 75].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-gradient-to-t from-brand-sky to-brand-skyDeep"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-100 p-3">
                      <p className="text-[11px] font-medium text-slate-500">Engagement</p>
                      <svg viewBox="0 0 120 60" className="mt-3 w-full">
                        <defs>
                          <linearGradient id="engFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M0 45 C20 25 40 50 60 35 S100 20 120 30 L120 60 L0 60 Z" fill="url(#engFill)" />
                        <path d="M0 45 C20 25 40 50 60 35 S100 20 120 30" fill="none" stroke="#38BDF8" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function Bubble({ children, className = "" }) {
  return (
    <div
      className={`absolute max-w-[150px] rounded-2xl bg-slate-700 px-3 py-2 text-xs font-medium text-white shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

function Stat({ label, value, delta }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-base font-bold text-brand-ink">{value}</span>
        <span className="text-[11px] font-semibold text-green-500">{delta}</span>
      </p>
    </div>
  );
}
