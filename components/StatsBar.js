"use client";

import { motion } from "framer-motion";
import { FadeIn } from "@/hooks/useFadeIn";

const STATS = [
  { value: "100+", label: "Creators" },
  { value: "$2K+", label: "Paid to Creators" },
  { value: "50+", label: "Videos Delivered" },
];

export default function StatsBar() {
  return (
    <section className="py-10 bg-white">
      <div className="mx-auto max-w-4xl px-6">
        <FadeIn>
          <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 shadow-xl border border-slate-100 py-8 px-6">
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              {STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col items-center justify-center px-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <span className="text-3xl md:text-5xl font-bold text-brand-ink tracking-tight">
                    {stat.value}
                  </span>
                  <span className="mt-1 text-xs md:text-sm text-slate-500 font-medium">
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
