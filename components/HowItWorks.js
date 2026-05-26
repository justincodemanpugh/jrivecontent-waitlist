"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, MessageSquare, DollarSign, Play } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

const STEPS = [
  {
    title: "Post your gig",
    sub: "Describe the video, set your pay per video, and add reference clips. Done in 60 seconds.",
    Visual: PostVisual,
  },
  {
    title: "Review applications",
    sub: "Vetted creators apply within a day or two. Browse profiles, samples, and pick your favourite.",
    Visual: ReviewVisual,
  },
  {
    title: "Chat & brief your creator",
    sub: "Share references and align on the brief — everything stays inside Jrive.",
    Visual: ChatVisual,
  },
  {
    title: "Get your video & pay",
    sub: "Funds are held safely and only released once you approve the final cut.",
    Visual: PayVisual,
  },
];

// Vertical offsets (px) used to seat each desktop card along the arc.
// Outer cards sit lower; inner cards rise toward the apex.
const ARC_OFFSETS_PX = [40, 0, 0, 40];

export default function HowItWorks() {
  const arcRef = useRef(null);
  const arcInView = useInView(arcRef, { once: true, margin: "-80px" });

  return (
    <section id="how-it-works" className="py-24 bg-brand-sky/20 relative overflow-hidden">
      {/* Subtle dotted background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15,23,42,0.12) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 relative">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] text-brand-skyDeep uppercase">
              How it works
            </p>
            <h2 className="mt-3 text-4xl md:text-6xl font-semibold tracking-tight text-brand-ink">
              4 steps away from success.
            </h2>
          </div>
        </FadeIn>

        {/* Desktop / tablet — arc layout */}
        <div ref={arcRef} className="hidden md:block relative">
          {/* Arc SVG */}
          <svg
            viewBox="0 0 1000 220"
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-12 w-full h-[220px] pointer-events-none"
            aria-hidden
          >
            <motion.path
              d="M 40 200 Q 500 -40 960 200"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray="4 8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={arcInView ? { pathLength: 1, opacity: 0.55 } : {}}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            />
          </svg>

          <div className="relative grid grid-cols-4 gap-5 pt-2">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={arcInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.4 + i * 0.18, ease: "easeOut" }}
                style={{ marginTop: ARC_OFFSETS_PX[i] }}
                className="flex flex-col items-center text-center"
              >
                <StepCard index={i} step={step} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile — vertical timeline */}
        <div className="md:hidden relative">
          <div
            aria-hidden
            className="absolute left-6 top-2 bottom-2 w-px border-l-2 border-dashed border-brand-skyDeep/40"
          />
          <ul className="space-y-6">
            {STEPS.map((step, i) => (
              <li key={i} className="relative pl-16">
                <div className="absolute left-0 top-2 h-12 w-12 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-brand-ink font-semibold">
                  {i + 1}
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 p-5">
                  <div className="h-20 mb-3 flex items-center justify-center">
                    <step.Visual />
                  </div>
                  <h3 className="font-semibold text-brand-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {step.sub}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function StepCard({ index, step }) {
  const { Visual } = step;
  return (
    <>
      {/* Card */}
      <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5 hover:-translate-y-1 hover:border-brand-sky transition-all duration-300">
        <div className="h-24 flex items-center justify-center">
          <Visual />
        </div>
      </div>

      {/* Number badge — sits below card, on the arc */}
      <div className="relative -mt-4 h-9 w-9 rounded-full bg-white border border-brand-sky text-brand-skyDeep text-sm font-semibold flex items-center justify-center shadow-sm">
        {index + 1}
      </div>

      {/* Label */}
      <h3 className="mt-4 font-semibold text-brand-ink text-base">
        {step.title}
      </h3>
      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed max-w-[15rem]">
        {step.sub}
      </p>
    </>
  );
}

/* ---------- Per-card looping mini illustrations ---------- */

function PostVisual() {
  // Three "form lines" typing in sequence, with a tiny dollar pill at the bottom.
  const line = {
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
  };
  return (
    <div className="w-28 rounded-lg border border-slate-200 bg-brand-mist/60 p-2.5 space-y-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 rounded-full bg-brand-skyDeep/70 origin-left"
          style={{ width: ["95%", "70%", "85%"][i] }}
          variants={line}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.7,
            delay: i * 0.35,
            repeat: Infinity,
            repeatDelay: 1.6,
            repeatType: "loop",
            ease: "easeOut",
          }}
        />
      ))}
      <motion.div
        className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-ink text-white text-[9px] font-semibold px-2 py-0.5"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: 1.2,
          repeat: Infinity,
          repeatDelay: 1.6,
          repeatType: "reverse",
        }}
      >
        <DollarSign size={9} />
        30
      </motion.div>
    </div>
  );
}

function ReviewVisual() {
  // A small profile card with a magnifier doing a gentle scanning loop over it.
  return (
    <div className="relative w-28 h-20 rounded-lg border border-slate-200 bg-white p-2 flex items-center gap-2">
      <div className="h-9 w-9 rounded-full bg-brand-sky/30" />
      <div className="flex-1 space-y-1.5">
        <div className="h-1.5 w-16 rounded-full bg-slate-200" />
        <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="h-1.5 w-14 rounded-full bg-slate-200" />
      </div>
      <motion.div
        className="absolute text-brand-skyDeep"
        initial={{ x: -4, y: -4 }}
        animate={{
          x: [-4, 60, 60, -4, -4],
          y: [-4, -4, 36, 36, -4],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.3, 0.55, 0.8, 1],
        }}
        style={{ left: 6, top: 6 }}
      >
        <Search size={22} strokeWidth={2.25} />
      </motion.div>
    </div>
  );
}

function ChatVisual() {
  // Two chat bubbles alternating in.
  return (
    <div className="w-28 space-y-1.5 flex flex-col">
      <motion.div
        className="self-start rounded-2xl rounded-bl-sm bg-slate-100 px-2.5 py-1.5 inline-flex items-center gap-1"
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatDelay: 2,
          repeatType: "reverse",
        }}
      >
        <MessageSquare size={10} className="text-slate-500" />
        <span className="h-1 w-6 rounded-full bg-slate-400" />
      </motion.div>
      <motion.div
        className="self-end rounded-2xl rounded-br-sm bg-brand-skyDeep text-white px-2.5 py-1.5 inline-flex items-center gap-1"
        initial={{ opacity: 0, x: 6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.4,
          delay: 0.7,
          repeat: Infinity,
          repeatDelay: 2,
          repeatType: "reverse",
        }}
      >
        <span className="h-1 w-8 rounded-full bg-white/80" />
      </motion.div>
      <motion.div
        className="self-start rounded-2xl rounded-bl-sm bg-slate-100 px-2.5 py-1.5"
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.4,
          delay: 1.4,
          repeat: Infinity,
          repeatDelay: 2,
          repeatType: "reverse",
        }}
      >
        <span className="h-1 w-4 rounded-full bg-slate-400" />
      </motion.div>
    </div>
  );
}

function PayVisual() {
  // A video tile with a play button pulse, plus a bouncing dollar badge.
  return (
    <div className="relative w-28 h-20 rounded-lg bg-gradient-to-br from-brand-ink to-slate-700 flex items-center justify-center overflow-hidden">
      <motion.div
        className="h-9 w-9 rounded-full bg-white/95 text-brand-ink flex items-center justify-center"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <Play size={14} fill="currentColor" />
      </motion.div>
      <motion.div
        className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-brand-skyDeep text-white flex items-center justify-center shadow-md border-2 border-brand-mist"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <DollarSign size={14} strokeWidth={2.5} />
      </motion.div>
    </div>
  );
}
