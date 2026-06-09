"use client";

import { FadeIn } from "@/hooks/useFadeIn";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CreatorShowcase() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          {/* Left side - Image */}
          <div className="flex-1 flex justify-center">
            <FadeIn delay={400}>
              <div className="relative w-full max-w-2xl">
                <Image
                  src="/images/profiles/creator-profile.png"
                  alt="Verified creators on Jrivecontent"
                  width={1060}
                  height={550}
                  className="w-full h-auto rounded-2xl shadow-lg"
                  priority
                />
              </div>
            </FadeIn>
          </div>

          {/* Right side - Text content */}
          <div className="flex-1 text-center lg:text-left">
            <FadeIn>
              <p className="text-xs font-semibold tracking-[0.2em] text-brand-skyDeep uppercase mb-4">
                Verified Creators
              </p>
            </FadeIn>
            
            <FadeIn delay={100}>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-ink mb-6">
                Work with{" "}
                <span className="text-brand-skyDeep">real creators</span>
              </h2>
            </FadeIn>
            
            <FadeIn delay={200}>
              <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Every creator on Jrivecontent is verified with linked social accounts. 
                Browse profiles, view portfolios, and partner with authentic content creators.
              </p>
            </FadeIn>
            
            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink text-white px-6 py-3 font-medium hover:bg-slate-800 transition"
                >
                  Browse creators
                  <ArrowRight size={18} />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}
