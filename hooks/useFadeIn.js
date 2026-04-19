"use client";

import { useEffect, useRef, useState } from "react";

export function useFadeIn(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { 
        threshold,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    // Small delay to ensure initial render completes
    const timer = setTimeout(() => {
      observer.observe(element);
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [threshold]);

  return { ref, isVisible };
}

export function FadeIn({ children, className = "", delay = 0 }) {
  const { ref, isVisible } = useFadeIn();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{ 
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)"
      }}
    >
      {children}
    </div>
  );
}
