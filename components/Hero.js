import { ArrowRight, Gift, Zap } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

const SPOTS = {
  brands: { total: 50, remaining: 47 },
  creators: { total: 100, remaining: 89 },
};

export default function Hero() {
  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-gradient-to-b from-brand-mist to-white"
    >
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-24 md:pt-40 md:pb-32 text-center">
        <FadeIn>
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-brand-sky/40 px-4 py-1.5 text-xs font-medium text-brand-skyDeep shadow-sm">
            <span className="h-2 w-2 rounded-full bg-brand-skyDeep animate-pulse" />
            Now accepting early access
          </span>
        </FadeIn>

        <FadeIn delay={100}>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-brand-ink">
            For brands and creators <br className="hidden sm:block" />
            just starting their <span className="text-brand-skyDeep">journey</span>
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            Get your first 100 users by collaborating with affordable UGC creators.
            Join the waitlist and be first in line when we launch.
          </p>
        </FadeIn>

        <FadeIn delay={300}>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <Gift size={20} className="text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-900">First {SPOTS.brands.total} brands</p>
                <p className="text-xs text-amber-700">Get 3 free gigs</p>
              </div>
              <span className="ml-auto text-lg font-bold text-amber-600">{SPOTS.brands.remaining}</span>
              <span className="text-xs text-amber-500">left</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Zap size={20} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-emerald-900">First {SPOTS.creators.total} creators</p>
                <p className="text-xs text-emerald-700">Get $20 credit</p>
              </div>
              <span className="ml-auto text-lg font-bold text-emerald-600">{SPOTS.creators.remaining}</span>
              <span className="text-xs text-emerald-500">left</span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="https://app.youform.com/forms/aj4rmaai"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-7 py-3.5 font-medium hover:bg-slate-800 transition shadow-lg shadow-brand-sky/20"
            >
              Join the Waitlist
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-full bg-white border border-slate-200 px-7 py-3.5 font-medium text-slate-700 hover:border-brand-sky transition"
            >
              How it works
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={500}>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="h-6 w-6 rounded-full bg-brand-sky border-2 border-white" />
                <div className="h-6 w-6 rounded-full bg-brand-skyDeep border-2 border-white" />
                <div className="h-6 w-6 rounded-full bg-brand-ink border-2 border-white" />
              </div>
              <span>Joining brands &amp; creators</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">No credit card required</span>
          </div>
        </FadeIn>

      </div>

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-sky/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-brand-sky/30 blur-3xl" />
    </section>
  );
}
