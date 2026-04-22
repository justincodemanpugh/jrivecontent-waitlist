import { FadeIn } from "@/hooks/useFadeIn";

export default function WaitlistCTA() {
  return (
    <section className="py-24 bg-brand-mist">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn>
          <div id="for-creators" className="rounded-3xl bg-brand-ink text-white p-10 md:p-14 text-center">
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
