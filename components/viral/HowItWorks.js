import { FadeIn } from "@/hooks/useFadeIn";
import { DollarSign, Check } from "lucide-react";
import { PlatformChips } from "./_shared";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <h2 className="text-center font-display text-4xl font-bold tracking-tight text-brand-ink sm:text-5xl md:text-6xl">
            How it works
          </h2>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          <FadeIn delay={80}>
            <Step
              num="01"
              numColor="text-brand-sky"
              tint="from-brand-sky/20"
              title="Set your rates"
              body="Pick what you pay: per 1,000 views, a flat fee per video, a share of revenue, or a mix. Cap any video so a viral hit never blows your budget."
              mock={<RatesMock />}
            />
          </FadeIn>
          <FadeIn delay={160}>
            <Step
              num="02"
              numColor="text-brand-skyDeep"
              tint="from-brand-skyDeep/20"
              title="Creators post about your app"
              body="Invite creators or let them apply. They make TikToks about your app, and you watch every video's views come in live."
              mock={<DecisionMock />}
            />
          </FadeIn>
          <FadeIn delay={240}>
            <Step
              num="03"
              numColor="text-brand-ink"
              tint="from-brand-ink/10"
              title="Pay only for results"
              body="Review videos and reject anything fake before payday. We calculate what each creator earned and pay them for you."
              mock={<PayMock />}
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
function RatesMock() {
  const rows = [
    { label: "Per 1,000 views", value: "$2.00", on: true },
    { label: "Max per video", value: "$150", on: true },
    { label: "Flat fee per video", value: "$0", on: false },
    { label: "Revenue share", value: "10%", on: false },
  ];
  return (
    <div className="w-full rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-brand-ink">Campaign rates</p>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
              r.on ? "border-brand-sky/40 bg-brand-mist/50" : "border-slate-100"
            }`}
          >
            <span className={`text-xs ${r.on ? "font-medium text-brand-ink" : "text-slate-400"}`}>
              {r.label}
            </span>
            <span className={`text-xs font-semibold ${r.on ? "text-brand-skyDeep" : "text-slate-300"}`}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <PlatformChips only={["tiktok"]} />
      </div>
    </div>
  );
}

function DecisionMock() {
  return (
    <div className="w-full rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-100 p-2">
          <p className="text-[10px] text-slate-400">Views</p>
          <p className="text-sm font-bold text-brand-ink">138.5M</p>
        </div>
        <div className="rounded-lg border border-slate-100 p-2">
          <p className="text-[10px] text-slate-400">Likes</p>
          <p className="text-sm font-bold text-brand-ink">50%</p>
        </div>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        {[30, 60, 45, 90, 50, 70, 40].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-brand-sky to-brand-skyDeep"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
}

function PayMock() {
  return (
    <div className="relative w-full">
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-brand-ink">INVOICE</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-skyDeep to-brand-sky text-white">
            <DollarSign size={14} />
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {[
            ["Approved videos", "12"],
            ["Verified views", "412K"],
            ["Rejected (fake views)", "2"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-xs font-semibold text-brand-ink">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-bold text-brand-ink">$824</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
            <Check size={11} /> Paid
          </span>
        </div>
      </div>
    </div>
  );
}
