"use client";

import { useState } from "react";
import { FadeIn } from "@/hooks/useFadeIn";
import { FAQS } from "@/components/FAQ";

export default function ViralFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-16">
            <div>
              <h2 className="font-display text-4xl font-bold tracking-tight text-brand-ink sm:text-5xl">
                FAQs
              </h2>
              <p className="mt-5 text-slate-500">
                Haven&apos;t found what you are looking for?
              </p>
              <a
                href="mailto:hello@jrivecontent.com"
                className="mt-1 inline-block text-brand-skyDeep underline underline-offset-4 transition hover:text-brand-ink"
              >
                Send us an email
              </a>
            </div>

            <div className="space-y-4">
              {FAQS.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-brand-mist"
                  >
                    <button
                      onClick={() => toggle(i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between px-6 py-5 text-left"
                    >
                      <span className="font-medium text-brand-ink">{item.q}</span>
                      <span
                        className={`ml-4 flex-shrink-0 text-2xl text-brand-skyDeep transition-transform duration-300 ${
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
                        <p className="px-6 pb-5 leading-relaxed text-slate-600">{item.a}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
