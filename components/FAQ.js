"use client";

import { useState } from "react";
import { FadeIn } from "@/hooks/useFadeIn";

export const FAQS = [
  {
    q: "I've tried other tools, why is this different?",
    a: "We don't charge $500/month like other platforms. We're built specifically for small startups and small creators with simple, affordable pricing.",
  },
  {
    q: "How much is the average video?",
    a: "The average video costs $40, making professional UGC accessible for any budget.",
  },
  {
    q: "How do I know if I can connect with people?",
    a: "Our community has new creators and brands actively looking for opportunities. Whether you're a creator seeking work or a brand needing content, everyone here is eager to collaborate.",
  },
  {
    q: "How do I get videos?",
    a: "Post a gig describing what you need, then invite creators or let them apply to your project. You choose who to work with.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-brand-ink text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 space-y-4">
            {FAQS.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-brand-mist border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between px-6 py-5 text-left"
                  >
                    <span className="font-medium text-brand-ink">{item.q}</span>
                    <span
                      className={`ml-4 flex-shrink-0 text-2xl text-brand-ink transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-slate-600 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
