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
              title="Add creators & competitors"
              body="Track any TikTok, Instagram, YouTube, or Facebook URL. Or invite creators to the platform."
              mock={<AddMock />}
            />
          </FadeIn>
          <FadeIn delay={160}>
            <Step
              num="02"
              numColor="text-brand-skyDeep"
              tint="from-brand-skyDeep/20"
              title="Make data-driven decisions"
              body="Views, engagement, post schedules, and revenue data all in one place."
              mock={<DecisionMock />}
            />
          </FadeIn>
          <FadeIn delay={240}>
            <Step
              num="03"
              numColor="text-brand-ink"
              tint="from-brand-ink/10"
              title="Pay your creators"
              body="Define the base fee for each creator. We calculate, invoice, and pay them for you."
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
function AddMock() {
  return (
    <div className="w-full rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-brand-ink">
        @username
      </div>
      <div className="mt-2 space-y-1 text-[11px] text-slate-400">
        <p>https://tiktok.com/@username</p>
        <p>https://instagram.com/username</p>
        <p>https://youtube.com/@username</p>
      </div>
      <div className="mt-3">
        <PlatformChips />
      </div>
      <div className="mt-4 flex gap-2">
        <span className="rounded-lg bg-gradient-to-r from-brand-skyDeep to-brand-sky px-3 py-2 text-xs font-semibold text-white">
          Track Accounts
        </span>
        <span className="rounded-lg bg-brand-mist px-3 py-2 text-xs font-semibold text-brand-skyDeep">
          Upload CSV
        </span>
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
          {["Base fee", "Videos delivered", "Payout period"].map((r) => (
            <div key={r} className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{r}</span>
              <span className="h-2 w-12 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-bold text-brand-ink">$1,500</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
            <Check size={11} /> Paid
          </span>
        </div>
      </div>
    </div>
  );
}
