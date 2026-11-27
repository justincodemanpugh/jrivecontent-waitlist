"use client";

import { useState } from "react";
import { FadeIn } from "@/hooks/useFadeIn";

// Home page FAQ, written for app founders. The classic page keeps its own
// list in components/FAQ.js. Answers must match how the product works.
const FAQS = [
  {
    q: "What do I get for free?",
    a: "Paste your link and answer five questions. You see one video to recreate, five creators without their names, the start of the message and the first day of your week. The rest unlocks when you subscribe.",
  },
  {
    q: "I don't have any creators yet. Is this still for me?",
    a: "Yes. Your plan lists creators to start with. Some signed up with JriveContent; others are public TikTok accounts that you message yourself.",
  },
  {
    q: "What does it cost?",
    a: "$1 for your first 7 days, then $25 a month. The $1 week is for first-time subscribers. Creator pay is separate, and payouts through JriveContent add a 5% platform fee and card processing.",
  },
  {
    q: "How do I pay creators?",
    a: "You choose: a flat fee per video, a rate per 1,000 views, a share of revenue, or a mix, with a monthly cap. A video earns nothing until you approve it.",
  },
  {
    q: "How do you stop fake views?",
    a: "View-based earnings wait 7 days before they're paid out, videos with suspicious numbers are flagged, and you can reject any video before money moves.",
  },
  {
    q: "Can I see which videos actually make me money?",
    a: "If your app uses RevenueCat, you can connect it so purchases are tied back to the creator who brought them. That also lets you pay creators a share of that revenue.",
  },
  {
    q: "Will this get me users?",
    a: "Nobody can promise that. Creator videos have worked for some apps, but most videos don't take off. Your plan gives you the next step each day.",
  },
  {
    q: "How do I cancel?",
    a: "From your plan page or from Billing in your dashboard, whenever you like.",
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
