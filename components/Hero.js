import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

export default function Hero() {
  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-gradient-to-b from-brand-mist to-white"
    >
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 md:pt-48 md:pb-24 text-center">
        <FadeIn delay={50}>
          <div className="flex justify-center mb-6">
            <span className="inline-block rounded-full border border-brand-skyDeep/30 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-brand-skyDeep">
              Built for small startups who just want to build &amp; not worry about marketing
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={100}>
          <h1 className="text-5xl sm:text-7xl md:text-6xl lg:text-6xl font-bold tracking-tight leading-[1.02] text-brand-ink">
            Turn One Video<br />into Thousands of Views
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            Scale without creating more videos
          </p>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="mt-8 flex justify-center items-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-7 py-3.5 font-medium hover:bg-slate-800 transition shadow-lg shadow-brand-sky/20"
            >
              Get started for free
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition" />
            </Link>
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
