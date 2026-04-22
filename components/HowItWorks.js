import { FileEdit, Users, MessageSquare, TrendingUp } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

const STEPS = [
  {
    icon: FileEdit,
    title: "Post your gig",
    body: "Describe the video you need in 60 seconds. Creators can also browse and apply to open gigs.",
  },
  {
    icon: Users,
    title: "Get matched with creators",
    body: "Receive applications from real, vetted creators in 24–48 hours.",
  },
  {
    icon: MessageSquare,
    title: "Chat, approve & pay",
    body: "Everything happens safely inside Jrive — no chasing invoices or ghosting.",
  },
  {
    icon: TrendingUp,
    title: "Get your video & grow",
    body: "Publish your content and watch your brand scale without breaking your budget.",
    optional: true,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-brand-mist">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-brand-ink">
              How it <span className="text-brand-skyDeep">Works</span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-xl mx-auto">
              From idea to content in 4 simple steps. Whether you&apos;re a brand or a creator, JriveContent makes collaboration simple and safe.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <FadeIn key={i} delay={i * 100}>
                <div
                  className="relative rounded-2xl bg-white border border-slate-200 p-6 hover:border-brand-sky hover:-translate-y-1 transition h-full"
                >
                  <div className="absolute -top-3 left-6 bg-brand-ink text-white text-xs font-semibold h-7 w-7 rounded-full flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="mt-3 h-11 w-11 rounded-xl bg-brand-sky/20 text-brand-skyDeep flex items-center justify-center">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 font-semibold text-lg text-brand-ink">
                    {step.title}
                    {step.optional && (
                      <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
                    )}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.body}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>

        <FadeIn>
          <div id="for-creators" className="mt-16 rounded-3xl bg-brand-ink text-white p-10 md:p-14 text-center">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Ready to get on the waitlist?
            </h3>
            <p className="mt-3 text-slate-300 max-w-lg mx-auto">
              Brands and creators — join early and get priority access when we launch.
            </p>
            <a
              href="https://app.youform.com/forms/aj4rmaai"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center rounded-full bg-brand-sky text-brand-ink px-7 py-3.5 font-medium hover:bg-white transition"
            >
              Join the Waitlist
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
