"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FadeIn } from "@/hooks/useFadeIn";

const videos = [
  {
    src: "/videos/ssstik.io_@sharedmood1_1778666164544.mp4",
    name: "Sophia",
    location: "Toronto",
  },
  {
    src: "/videos/ssstik.io_@sharedmood1_1778666235104.mp4",
    name: "Maya",
    location: "Vancouver",
  },
  {
    src: "/videos/ssstik.io_@sharedmood1_1778666259046.mp4",
    name: "Ava",
    location: "Calgary",
  },
  {
    src: "/videos/ssstik.io_@itssono__1778666476804.mp4",
    name: "Sono",
    location: "Montreal",
  },
  {
    src: "/videos/ssstik.io_@itssono__1778666511554.mp4",
    name: "Lina",
    location: "Ottawa",
  },
  {
    src: "/videos/ssstik.io_@sharedmood1_1778666562190.mp4",
    name: "Emma",
    location: "Edmonton",
  },
  {
    src: "/videos/ssstik.io_@sharedmood1_1778666595183.mp4",
    name: "Zoe",
    location: "Halifax",
  },
  {
    src: "/videos/i-just-know-i\u2019m-gonna-overuse-this-link-in-bio-sharedmood-fyp-xyzbca-foryou-trending-trend.mp4",
    name: "Riley",
    location: "Winnipeg",
  },
];

export default function VideoCarousel() {
  const scrollerRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(null);
  const videoRefs = useRef([]);

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector("[data-card]");
    const step = card ? card.clientWidth + 16 : 280;
    el.scrollBy({ left: dir * step * 2, behavior: "smooth" });
  };

  // Auto-play / pause based on viewport visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.4 }
    );
    videoRefs.current.forEach((v) => v && observer.observe(v));
    return () => observer.disconnect();
  }, []);

  const handleEnter = (i) => {
    setActiveIdx(i);
    const v = videoRefs.current[i];
    if (v) {
      v.muted = false;
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const handleLeave = (i) => {
    setActiveIdx(null);
    const v = videoRefs.current[i];
    if (v) {
      v.muted = true;
    }
  };

  return (
    <section className="relative bg-white pb-8 md:pb-10 overflow-hidden">
      <div className="relative">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-24 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-24 bg-gradient-to-l from-white to-transparent z-10" />

        {/* Arrows */}
        <button
          aria-label="Previous"
          onClick={() => scrollBy(-1)}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md hover:border-brand-sky transition"
        >
          <ChevronLeft size={20} className="text-brand-ink" />
        </button>
        <button
          aria-label="Next"
          onClick={() => scrollBy(1)}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md hover:border-brand-sky transition"
        >
          <ChevronRight size={20} className="text-brand-ink" />
        </button>

        {/* Scroller */}
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-6 md:px-16 pb-6 no-scrollbar"
        >
          {videos.map((v, i) => (
            <div
              key={i}
              data-card
              className="snap-start shrink-0 w-[180px] sm:w-[200px] md:w-[220px] aspect-[9/16] rounded-2xl overflow-hidden relative bg-slate-100 shadow-sm hover:shadow-xl transition group cursor-pointer"
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={() => handleLeave(i)}
            >
              <video
                ref={(el) => (videoRefs.current[i] = el)}
                src={v.src}
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
