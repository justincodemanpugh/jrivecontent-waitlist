import { FadeIn } from "@/hooks/useFadeIn";
import { Check, Link2 } from "lucide-react";

// The builder-facing counterpart to components/viral/HowItWorks.js. Same
// three-card shape, but framed around the app-install funnel rather than
// generic brand campaigns — the numbers and framing come from the writeups
// in content/reddit/09 and /10.
export default function VibecodeSteps() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <h2 className="text-center font-display text-4xl font-bold tracking-tight text-brand-ink sm:text-5xl md:text-6xl">
            How it works
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg text-slate-500">
            No agency, no retainer, no ad account to babysit.
          </p>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <FadeIn delay={80}>
            <Step
              num="01"
              numColor="text-brand-sky"
              tint="from-brand-sky/20"
              title="Brief it in one page"
              body="Your app link plus the three videos you wish you'd made. Creators get a brief and reference clips — never a script."
              mock={<BriefMock />}
            />
          </FadeIn>
          <FadeIn delay={160}>
            <Step
              num="02"
              numColor="text-brand-skyDeep"
              tint="from-brand-skyDeep/20"
              title="Small creators post it"
              body="Creators who post daily to an audience like yours make native TikToks of the app being used. Around $40 a video, agreed monthly."
              mock={<PostMock />}
            />
          </FadeIn>
          <FadeIn delay={240}>
            <Step
              num="03"
              numColor="text-brand-ink"
              tint="from-brand-ink/10"
              title="Keep who moves the graph"
              body="Every video tracked in one place. Watch installs in the 48 hours after each post, then put next month's budget on the creators that worked."
              mock={<TrackMock />}
            />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

function Step({ num, numColor, tint, title, body, mock }) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={`flex min-h-[240px] items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-b ${tint} to-white p-6 shadow-sm`}
      >
        {mock}
      </div>
      <div className="px-1 pt-6">
        <p className={`font-display text-3xl font-extrabold ${numColor}`}>{num}</p>
        <h3 className="mt-3 font-display text-xl font-bold text-brand-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
      </div>
    </div>
  );
}

/* ---------- Mocks ---------- */
function BriefMock() {
  return (
    <div className="w-full rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-brand-ink">
        <Link2 size={14} className="shrink-0 text-brand-skyDeep" />
        <span className="truncate">apps.apple.com/…</span>
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Reference videos
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[9/13] rounded-md bg-brand-mist" />
        ))}
      </div>
    </div>
  );
}

function PostMock() {
  return (
    <div className="w-full space-y-2">
      {[
        { followers: "4.2K", price: "$40" },
        { followers: "11K", price: "$40" },
        { followers: "2.8K", price: "$40" },
      ].map((row, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-brand-mist" />
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-20 rounded-full bg-slate-200" />
            <p className="mt-1.5 text-[10px] text-slate-400">{row.followers} followers</p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-mist px-2.5 py-1 text-[11px] font-semibold text-brand-skyDeep">
            {row.price}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrackMock() {
  return (
    <div className="w-full rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Installs
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
          <Check size={10} /> 48h window
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        {[22, 30, 26, 88, 54, 35, 28].map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${
              h > 70
                ? "bg-gradient-to-t from-brand-sky to-brand-skyDeep"
                : "bg-slate-200"
            }`}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      <p className="mt-3 text-[10px] text-slate-400">
        Spike lines up with one creator&apos;s post
      </p>
    </div>
  );
}
