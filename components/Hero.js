import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

export default function Hero() {
  return (
    <section
      id="waitlist"
      className="relative overflow-hidden bg-gradient-to-b from-brand-mist to-white"
    >
      <div className="mx-auto max-w-6xl px-6 pt-32 pb-24 md:pt-40 md:pb-32 text-center">
        <FadeIn delay={100}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] text-brand-ink">
            For brands and creators <br className="hidden sm:block" />
            just starting their <span className="text-brand-skyDeep">journey</span>
          </h1>
        </FadeIn>

        <FadeIn delay={200}>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 leading-relaxed">
            Get your first 100 users by collaborating with affordable UGC creators.
            Sign up free and start collaborating today.
          </p>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="mt-10 flex justify-center items-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-7 py-3.5 font-medium hover:bg-slate-800 transition shadow-lg shadow-brand-sky/20"
            >
              Get started
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
