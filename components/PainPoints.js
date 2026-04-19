"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

const PAIN_POINTS = [
  {
    tag: "Reddit user complaint",
    quote:
      "I reached out to 20 creators and most wanted $1,500+ for a single video. My whole marketing budget is $2k.",
    author: "r/smallbusiness",
  },
  {
    tag: "Problem",
    quote:
      "Agencies want retainers and take 30% cuts. We just need a few videos, not a 6-month contract.",
    author: "Early-stage founder",
  },
  {
    tag: "Issue",
    quote:
      "Finding creators who actually convert (not just look pretty on camera) is basically impossible on Instagram DMs.",
    author: "DTC brand owner",
  },
  {
    tag: "Market gap",
    quote:
      "Fiverr is hit or miss. TikTok Creator Marketplace gatekeeps you. There's no middle ground for startups.",
    author: "Marketing lead",
  },
  {
    tag: "Reddit user complaint",
    quote:
      "Half the creators I paid ghosted after sending one rough draft. No accountability, no refunds.",
    author: "r/Entrepreneur",
  },
  {
    tag: "Problem",
    quote:
      "I'm a creator and brands lowball me constantly — or ask for free work in exchange for 'exposure'.",
    author: "UGC creator",
  },
];

export default function PainPoints() {
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    const width = card ? card.clientWidth + 16 : 320;
    el.scrollBy({ left: dir * width, behavior: "smooth" });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.querySelector("[data-card]");
      const width = card ? card.clientWidth + 16 : 320;
      setActiveIndex(Math.round(el.scrollLeft / width));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section id="for-brands" className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <span className="text-sm font-medium text-brand-skyDeep">The problem</span>
              <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-brand-ink">
                Issues small brands &amp; startups face
              </h2>
              <p className="mt-3 text-slate-600 max-w-xl">
                Real complaints we&apos;ve collected from founders and creators.
                These are the problems JriveContent is built to solve.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => scrollBy(-1)}
                className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center hover:border-brand-sky transition"
                aria-label="Previous"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scrollBy(1)}
                className="h-10 w-10 rounded-full border border-slate-200 flex items-center justify-center hover:border-brand-sky transition"
                aria-label="Next"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <div
            ref={scrollerRef}
            className="no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6"
          >
            {PAIN_POINTS.map((p, i) => (
              <article
                key={i}
                data-card
                className="snap-start shrink-0 w-[85%] sm:w-[360px] rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-brand-mist p-6 hover:border-brand-sky transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block text-xs font-medium text-brand-skyDeep bg-brand-sky/10 rounded-full px-3 py-1">
                    {p.tag}
                  </span>
                  <Quote size={18} className="text-brand-sky" />
                </div>
                <p className="text-slate-800 leading-relaxed">&ldquo;{p.quote}&rdquo;</p>
                <p className="mt-6 text-sm text-slate-500">— {p.author}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-1.5">
            {PAIN_POINTS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "w-6 bg-brand-skyDeep" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
