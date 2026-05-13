"use client";

import { createContext, useContext, useMemo } from "react";

const BrandContext = createContext(null);

// Generates 1–2 letter uppercase initials from a brand/display name.
function deriveInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function BrandProvider({ value, children }) {
  const brand = useMemo(() => {
    const name = value?.brand_name || value?.email || "Your Brand";
    return {
      name,
      initials: deriveInitials(value?.brand_name || value?.email),
      email: value?.email || "",
      industry: value?.industry || null,
      website: value?.website || null,
      avatarUrl: value?.avatar_url || null,
    };
  }, [value]);

  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  // Fallback so components don't crash outside a provider (e.g. storybook).
  if (!ctx) {
    return {
      name: "Your Brand",
      initials: "?",
      email: "",
      industry: null,
      website: null,
      avatarUrl: null,
    };
  }
  return ctx;
}
