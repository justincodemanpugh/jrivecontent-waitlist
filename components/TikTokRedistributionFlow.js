"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";
import Link from "next/link";
import Image from "next/image";

const CREATORS = [
  { name: "Sofia", views: "75K", profile: "/images/profiles/creator-1-profile.png", video: "/images/thumbnails/creator-1-video.png" },
  { name: "Maya", views: "120K", profile: "/images/profiles/creator-2-profile.png", video: "/images/thumbnails/creator-2-video.png" },
  { name: "Ava", views: "55K", profile: "/images/profiles/creator-3-profile.png", video: "/images/thumbnails/creator-3-video.png" },
];

function TikTokVideoCard({ views, thumbnail, delay, size = "sm" }) {
  const sizeClasses = {
    sm: "w-[72px] h-[100px]",
    lg: "w-[90px] h-[125px]",
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`relative ${sizeClasses[size]} rounded-xl overflow-hidden shadow-lg`}
    >
      {/* Video thumbnail */}
      <Image
        src={thumbnail}
        alt="TikTok video"
        fill
        className="object-cover"
      />
      
      {/* View count overlay */}
      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/50 rounded px-1 py-0.5">
        <Play size={10} fill="white" className="text-white" />
        <span className="text-white text-[10px] font-semibold">{views}</span>
      </div>
    </motion.div>
  );
}

function CreatorProfile({ delay, src }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md"
    >
      <Image
        src={src}
        alt="Creator profile"
        width={40}
        height={40}
        className="object-cover"
      />
    </motion.div>
  );
}

function JriveLogo({ delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring" }}
      className="w-14 h-14 rounded-full overflow-hidden shadow-lg shadow-brand-sky/30"
    >
      <Image
        src="/images/jrive-logo.png"
        alt="Jrivecontent"
        width={56}
        height={56}
        className="object-cover"
      />
    </motion.div>
  );
}

export default function TikTokRedistributionFlow() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });

  return (
    <section className="py-50 md:py-150 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left side - Text content */}
          <div className="flex-1 text-center lg:text-left">
            <FadeIn>
              <p className="text-xs font-semibold tracking-[0.2em] text-brand-skyDeep uppercase mb-4">
                Content Redistribution
              </p>
            </FadeIn>
            
            <FadeIn delay={100}>
              <h2 className="text-4xl md:text-5xl font-bold text-brand-ink mb-6">
                Redistribute to{" "}
                <span className="text-brand-skyDeep">multiple creators</span>
              </h2>
            </FadeIn>
            
            <FadeIn delay={200}>
              <p className="text-lg text-slate-600 mb-8 max-w-lg mx-auto lg:mx-0">
                Take your viral TikTok and have UGC creators repost it on their accounts. 
                Reach new audiences and multiply your views without creating new content.
              </p>
            </FadeIn>
            
            <FadeIn delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink text-white px-6 py-3 font-medium hover:bg-slate-800 transition"
                >
                  Start redistributing
                  <ArrowRight size={18} />
                </Link>
                              </div>
            </FadeIn>
          </div>

          {/* Right side - Diagram */}
          <div ref={containerRef} className="flex-1 flex justify-center">
            <div className="relative bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
              {isInView && (
                <div className="flex items-center gap-6 md:gap-8">
                  {/* Brand video */}
                  <div className="flex flex-col items-center gap-2">
                    <TikTokVideoCard
                      views="60K"
                      thumbnail="/images/thumbnails/brand-video.png"
                      delay={0.2}
                      size="lg"
                    />
                    <span className="text-xs text-slate-500 font-medium">Brand</span>
                  </div>

                  {/* Connection line to Jrive */}
                  <svg width="40" height="2" className="hidden md:block">
                    <motion.line
                      x1="0"
                      y1="1"
                      x2="40"
                      y2="1"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    />
                  </svg>

                  {/* Jrivecontent logo */}
                  <div className="flex flex-col items-center gap-2">
                    <JriveLogo delay={0.6} />
                  </div>

                  {/* Connection lines to creators */}
                  <div className="relative">
                    <svg width="40" height="140" className="hidden md:block">
                      {CREATORS.map((_, i) => {
                        const startY = 70;
                        const endY = 25 + i * 50;
                        return (
                          <motion.path
                            key={i}
                            d={`M 0 ${startY} Q 20 ${startY} 40 ${endY}`}
                            fill="none"
                            stroke="#CBD5E1"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                          />
                        );
                      })}
                    </svg>
                  </div>

                  {/* Creators with videos */}
                  <div className="flex flex-col gap-3">
                    {CREATORS.map((creator, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.15, duration: 0.4 }}
                        className="flex items-center gap-3"
                      >
                        <CreatorProfile
                          delay={1 + i * 0.15}
                          src={creator.profile}
                        />
                        <TikTokVideoCard
                          views={creator.views}
                          thumbnail={creator.video}
                          delay={1.2 + i * 0.15}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
