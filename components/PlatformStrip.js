import { FadeIn } from "@/hooks/useFadeIn";

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Facebook"];

export default function PlatformStrip() {
  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <FadeIn>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Works across every platform
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-16">
            {PLATFORMS.map((name) => (
              <span
                key={name}
                className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-400 grayscale transition hover:text-brand-ink"
              >
                {name}
              </span>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
