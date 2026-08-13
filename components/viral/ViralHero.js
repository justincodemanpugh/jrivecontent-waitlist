import Link from "next/link";
import { Sparkles, ChevronRight, ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";
import { PlatformChips } from "./_shared";
import HeroBackdrop from "./HeroBackdrop";
import GigMock from "./GigMock";

export default function ViralHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-mist via-brand-mist/40 to-white">
      {/* Tiled platform texture */}
      <HeroBackdrop />

      <div className="relative mx-auto max-w-5xl px-6 pt-16 text-center">
        <FadeIn delay={50}>
          <div className="mb-7 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-mist px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-skyDeep ring-1 ring-brand-sky/40">
              <Sparkles size={13} />
              New: UGC Creator Platform
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={120}>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-brand-ink sm:text-6xl md:text-7xl">
            Track every video<span className="text-brand-sky">.</span>
            <br className="hidden sm:block" /> Pay for real results<span className="text-brand-skyDeep">.</span> Scale up<span className="text-brand-ink/40">.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={220}>
          <p className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-lg text-slate-500 sm:text-xl">
            Track, manage, and pay UGC creators on TikTok
            <PlatformChips className="translate-y-[2px]" only={["tiktok"]} />
          </p>
        </FadeIn>

        <FadeIn delay={340}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-skyDeep to-brand-sky px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-sky/30 transition hover:brightness-105"
            >
              Start Free Trial
              <ChevronRight size={18} className="transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-brand-ink shadow-sm transition hover:border-brand-sky"
            >
              How it works
              <ArrowUpRight size={18} />
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={440}>
          <p className="mt-5 text-sm text-slate-400">Pay $0 today · Cancel anytime</p>
        </FadeIn>
      </div>

      {/* Product mock */}
      <FadeIn delay={520}>
        <div className="relative mx-auto mt-14 max-w-6xl px-6 pb-20">
          <GigMock />
        </div>
      </FadeIn>
    </section>
  );
}
