import Link from "next/link";
import Image from "next/image";
import { FadeIn } from "@/hooks/useFadeIn";

export default function FounderNote() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-brand-mist">
      <div className="mx-auto max-w-4xl px-6">
        <FadeIn>
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src="/images/profiles/your-photo.png"
                  alt="Justin - Founder of JriveContent"
                  width={60}
                  height={60}
                  className="rounded-full border-2 border-slate-200"
                />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-skyDeep block">
                    Founder Note
                  </span>
                  <h3 className="text-xl font-semibold text-brand-ink">
                    Hi, I'm Justin, the founder of JriveContent
                  </h3>
                </div>
              </div>
              <div className="text-slate-600 leading-relaxed space-y-4">
                <p>
                  I've been creating products and trying to market them for 3 years. It was hard since I didn't have a big budget and none of my posts were talking off at all.
                </p>
                <p>
                  I was getting burnt out from filming and posting 3-4 videos a day just to see them all flop or barely take off, it sucked.
                </p>
                <p>
                  I saw other small business collaborating with small creators, getting them to create new accounts, and post different variations of winning videos. I wanted to try this out for myself but I was quoted <strong>$120 per video</strong> on average, agency's cost <strong>$500/month</strong>, and I couldn't find any creators to post at all.
                </p>
                <p>
                  So I decided to fix this problem to help people like me who are just starting out, struggling with marketing, and have a small budget. I'm improving the platform everyday so you can reach out to me email and I'll get back to you in 1-2 days.
                </p>
                <p>
                  You can check the platform out for free just click the get started now button below!
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:jrivejrive@gmail.com"
                className="inline-flex items-center justify-center rounded-full border border-brand-ink text-brand-ink px-6 py-3 font-medium hover:bg-brand-ink hover:text-white transition"
              >
                Chat with me on Email
              </a>
              
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-brand-ink text-white px-6 py-3 font-medium hover:bg-slate-800 transition"
              >
                Get started for free
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
