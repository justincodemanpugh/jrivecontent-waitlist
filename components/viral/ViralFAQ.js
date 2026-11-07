"use client";

import { useState } from "react";
import { FadeIn } from "@/hooks/useFadeIn";

// Home page FAQ, written for app founders. The classic page keeps its own
// list in components/FAQ.js. Answers must match how the product works.
const FAQS = [
  {
    q: "I don't have any creators yet. Is this still for me?",
    a: "Yes. Post a campaign and creators on JriveContent can apply to it. You can also browse creator profiles and invite the ones that fit your app.",
  },
  {
    q: "How does paying per view work?",
    a: "You set a rate per 1,000 views, for example $2. A video that gets 100,000 views earns the creator $200, and a video that flops costs you almost nothing. You can cap what any one video earns, and add a flat fee per video or a revenue share if you want.",
  },
  {
    q: "How do you stop fake views?",
    a: "View-based earnings wait 7 days before they're paid out. That gives you time to review every video and reject anything with fake or bought views before any money moves.",
  },
  {
    q: "Do I get to review videos?",
    a: "Yes. Every video shows up in your dashboard, and you can reject ones that don't meet your brief.",
  },
  {
    q: "Can I see which videos actually make me money?",
    a: "If your app uses RevenueCat, you can connect it so purchases are tied back to the creator who drove them. That also lets you pay creators a share of the revenue they bring in.",
  },
  {
    q: "What does it cost?",
    a: "Browsing creators is free. Pro starts with a 3-day free trial, then it's $25/month, cancel anytime. On top of that, you pay creators whatever rates you set for your campaign.",
  },
];

export default function ViralFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }),
        }}
      />
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
