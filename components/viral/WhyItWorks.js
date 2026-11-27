import { FadeIn } from "@/hooks/useFadeIn";

const PLAN = ["3 videos to recreate", "5 creators", "A message to send them", "A short brief", "What to post this week"];

// Each line has to stay true of the product as it is.
const REASONS = [
  [
    "Real posts, not templates",
    "Your videos are TikToks that already pulled views. If your niche is thin, the plan says so.",
  ],
  [
    "You pick the creators",
    "Message the ones you like. Their videos earn nothing until you approve them.",
  ],
  [
    "Works on a small budget",
    "Pay per video, per 1,000 views or with a share of revenue, and set a monthly cap.",
  ],
  ["One thing to do each day", "Your main page shows the next task, so you don't have to work out what's next."],
];

export default function WhyItWorks() {
  return (
    <section id="features" className="scroll-mt-24 bg-white px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <FadeIn>
          <h2 className="text-center font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-5xl">
            Why it works
          </h2>
          <ul className="mt-8 flex flex-wrap justify-center gap-2">
            {PLAN.map((item) => (
              <li key={item} className="rounded-full bg-brand-mist px-4 py-2 text-sm font-semibold text-brand-ink">
                {item}
              </li>
            ))}
          </ul>
        </FadeIn>

        <div className="mt-8 space-y-3">
          {REASONS.map(([title, body]) => (
            <details key={title} className="group rounded-3xl border border-slate-200 px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-brand-ink [&::-webkit-details-marker]:hidden">
                {title}
                <span aria-hidden="true" className="text-2xl text-slate-400 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-slate-600">{body}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
