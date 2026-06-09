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
              Browse creators for free. Start a 3-day trial to post gigs and connect.
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
          <PricingCard
            variant="free"
            eyebrow="Always Free"
            title="Free"
            price="$0"
            period="forever"
            description="Browse and discover creators."
            priceSubtext="No credit card required"
            features={[
              { label: "Browse all creators", value: "Unlimited" },
              { label: "View creator profiles", value: "Full access" },
              { label: "Favorite creators", value: "Unlimited" },
              { label: "Access dashboard", value: "Full access" },
              { label: "Support", value: "Community" },
            ]}
            buttonText="Get Started Free"
            ctaHref="/?signup=brand#join"
            footerNote="No credit card required"
          />
          <PricingCard />
        </div>
      </div>
    </section>
  );
}
