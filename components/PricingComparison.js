"use client";

import { FadeIn } from "@/hooks/useFadeIn";
import PricingCard from "@/components/PricingCard";

export default function PricingComparison() {
  return (
    <section id="pricing" className="pt-8 pb-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-ink">
              Simple, <span className="text-brand-skyDeep">flat-rate</span> pricing for brands
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              One affordable monthly plan to post unlimited gigs and start working with creators.
            </p>
          </div>
        </FadeIn>

        <div className="max-w-md mx-auto">
          <PricingCard />
        </div>
      </div>
    </section>
  );
}
