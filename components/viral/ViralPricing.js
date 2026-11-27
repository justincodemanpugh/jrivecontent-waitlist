import Link from "next/link";
import { Check } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

// One plan. The button goes to the onboarding, not to checkout: people see
// their own preview first and pay from /plan. Keep the price in step with
// lib/billing/pricing.js.
const FEATURES = [
  "Your full plan: videos, creators, message, brief and week",
  "Creator board and a task for each day",
  "Invite creators and run campaigns",
  "Views on the videos you approve",
  "Pay your creators from one place",
  "Cancel anytime",
];

export default function ViralPricing() {
  return (
    <section id="pricing" className="scroll-mt-24 bg-slate-50 px-6 py-20">
      <FadeIn>
        <h2 className="text-center font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-5xl">
          One simple price
        </h2>
        <div className="mx-auto mt-10 max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <p className="font-display text-6xl font-extrabold tracking-tight text-brand-ink">$1</p>
          <p className="mt-1 font-semibold text-brand-ink">for your first 7 days</p>
          <p className="mt-1 text-slate-500">Then $25/month. Cancel anytime.</p>
          <Link
            href="/start"
            className="mt-6 block rounded-full bg-brand-ink py-4 font-semibold text-white transition hover:bg-slate-800"
          >
            Get my plan
          </Link>
          <ul className="mt-8 space-y-3 text-left text-sm text-brand-ink">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-brand-skyDeep" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-slate-400">
            The $1 week is for first-time subscribers. Creator pay is separate, and payouts through JriveContent add
            a 5% platform fee and card processing.
          </p>
        </div>
      </FadeIn>
    </section>
  );
}
