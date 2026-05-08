"use client";

import { createContext, useContext, useMemo } from "react";

const CreatorContext = createContext(null);

function deriveInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function CreatorProvider({ value, children }) {
  const creator = useMemo(() => {
    const name = value?.display_name || value?.email || "Creator";
    return {
      name,
      firstName: name.split(/\s+/)[0],
      initials: deriveInitials(value?.display_name || value?.email),
      handle: value?.handle || "",
      email: value?.email || "",
      bio: value?.bio || "",
      niches: value?.niches || [],
      avatarUrl: value?.avatar_url || null,
      stripeAccountId: value?.stripe_account_id || null,
      stripePayoutsEnabled: Boolean(value?.stripe_payouts_enabled),
    };
  }, [value]);

  return (
    <CreatorContext.Provider value={creator}>{children}</CreatorContext.Provider>
  );
}

export function useCreator() {
  const ctx = useContext(CreatorContext);
  if (!ctx) {
    return {
      name: "Creator",
      firstName: "Creator",
      initials: "?",
      handle: "",
      email: "",
      bio: "",
      niches: [],
      avatarUrl: null,
      stripeAccountId: null,
      stripePayoutsEnabled: false,
    };
  }
  return ctx;
}
