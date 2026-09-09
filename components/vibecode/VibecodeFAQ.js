"use client";

import { useState } from "react";
import { FadeIn } from "@/hooks/useFadeIn";

// Builder-facing FAQ. Same accordion as components/viral/ViralFAQ.js with a
// different question set — these are the objections app developers actually
// raise, drawn from the writeups in content/reddit/09 and /10.
//
// Answers are deliberately unglamorous. This audience can smell a marketing
// claim, and we have no case-study numbers to point at yet, so the honest
// version of the mechanics is the strongest thing we can say.
const FAQS = [
  {
    q: "I'm a developer, not a marketer. Can I actually run this?",
    a: "That's who it's built for. You write one page — what the app does, who it's for, and links to three videos you'd like yours to resemble. The creators handle filming, and they're better at it than a script would make them. You're picking who to keep, not directing shoots.",
  },
  {
    q: "How is this different from just buying installs?",
    a: "Paid installs stop the moment you stop paying, and after ATT the targeting got worse while the price went up. A creator video keeps getting views for weeks after it's posted, and the good ones keep bringing people in long after the $40 is spent. It's not a replacement for a working ad account — it's what you run when you don't have the budget for one.",
  },
  {
    q: "What happens when the videos flop?",
    a: "Most of them will. That's the model, not a failure of it: most videos do a few hundred views, and every so often one lands and you see a step in the install graph. The reason it still works is that a flop costs you $40 rather than an ad test you have to sit and babysit. You're buying volume of native shots on goal.",
  },
  {
    q: "The App Store doesn't tell me who drove an install. How do I know what worked?",
    a: "Four ways, cheapest first: a \"how did you hear about us\" tap in onboarding; a unique promo or offer code per creator, which also gives them something concrete to say on camera; per-creator campaign links (a Custom Product Page on iOS, UTM tags on Play); and correlating installs against the timestamp of each post. None are perfect and store links undercount, but with a handful of creators posting on different days, the trend is real enough to decide who to re-book.",
  },
  {
    q: "I made a game, not an app.",
    a: "Different video, same machinery. A game clip has to be genuinely fun gameplay over trend audio — nobody watches someone talk about a game's features. Promo codes usually don't apply either, so you lean on install-spike correlation and weight D1/D7 retention rather than raw install count.",
  },
  {
    q: "How new is this?",
    a: "Early and honest about it. It was built by one person who makes apps and got tired of being quoted $500/month by agencies and $120 a video by individual creators. The creator directory is still filling in, so some niches have better coverage than others — the scan will tell you straight if yours is thin rather than showing you a padded list.",
  },
  {
    q: "What does it cost?",
    a: "The scan is free and doesn't need an account. The platform is $0 for three days, then $25/month, and you pay creators their per-video fee directly on top — the average video runs about $40. No retainer and no minimum spend.",
  },
];

export default function VibecodeFAQ() {
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
                Something not covered here?
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
