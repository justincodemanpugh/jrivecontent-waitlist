"use client";

import { FadeIn } from "@/hooks/useFadeIn";
import PricingCard from "@/components/PricingCard";

export default function PricingComparison() {
  return (
    <section id="pricing" className="pt-6 pb-16 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-ink">
              Simple, <span className="text-brand-skyDeep">flat-rate</span> pricing for brands
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Start free to test the platform. Upgrade to Pro when you&apos;re ready to scale.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
          <PricingCard
            variant="free"
            eyebrow="Try It Free"
            title="Free"
            price="$0"
            period="forever"
            description="Test the platform before you commit."
            priceSubtext="No credit card required"
            features={[
              { label: "Gig postings", value: "1" },
              { label: "Creator invites", value: "1" },
              { label: "Accepted creators", value: "1" },
              { label: "Applications", value: "Unlimited" },
              { label: "Messaging", value: "With accepted creator" },
              { label: "Support", value: "Community" },
              { label: "Upgrade anytime", value: "Yes" },
            ]}
            buttonText="Get Started Free"
            ctaHref="/?signup=brand#join"
            footerNote="No credit card required · Upgrade anytime"
          />
          <PricingCard />
        </div>
      </div>
    </section>
  );
}
