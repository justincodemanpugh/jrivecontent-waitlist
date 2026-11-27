import { ExternalLink } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

// Other companies' results, as reported by someone else. None of them used
// JriveContent. Change a number or claim here only after reading the source it
// links to, and keep "who said it" accurate.
const PROOF = [
  {
    app: "Cal AI",
    number: "$30M+",
    unit: "revenue in two years",
    claim: "Its growth came largely from a small army of influencers.",
    source: "Reported by TechCrunch, October 2026",
    href: "https://techcrunch.com/2026/10/15/when-it-came-to-cal-ais-viral-success-a-small-army-of-influencers-paid-off/",
  },
  {
    app: "Photogenic",
    number: "35M",
    unit: "views from about 46 posts",
    claim: "Weekly downloads went up about 10x.",
    source: "From an interview recap by Superwall, a paywall company, 2025",
    href: "https://superwall.com/blog/the-secret-behind-weirdly-viral-apps",
  },
  {
    app: "Astra",
    number: "5M+",
    unit: "views in six weeks",
    claim: "Creators posted more than 400 TikToks.",
    source: "A case study by SideShift, which sells creator marketing",
    href: "https://sideshift.app/casestudies/astra",
  },
];

export default function Proof() {
  return (
    <section id="proof" className="scroll-mt-24 bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <h2 className="text-center font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-5xl">
            Apps are growing with creators
          </h2>
        </FadeIn>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PROOF.map((p, i) => (
            <FadeIn key={p.app} delay={80 * i} className="h-full">
              <article className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-500">{p.app}</h3>
                <p className="mt-3 font-display text-5xl font-extrabold tracking-tight text-brand-ink">{p.number}</p>
                <p className="mt-1 font-semibold text-brand-ink">{p.unit}</p>
                <p className="mt-3 flex-1 text-slate-600">{p.claim}</p>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-start gap-1.5 text-sm text-slate-500 underline underline-offset-4 hover:text-brand-ink"
                >
                  {p.source} <ExternalLink size={13} className="mt-0.5 shrink-0" />
                </a>
                <p className="mt-2 text-xs text-slate-400">Not a JriveContent customer</p>
              </article>
            </FadeIn>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Results vary. These apps had their own budgets and teams, and most videos don&apos;t go viral.
        </p>
      </div>
    </section>
  );
}
