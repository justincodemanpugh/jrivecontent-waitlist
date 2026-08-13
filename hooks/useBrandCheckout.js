"use client";

import { useState } from "react";

/* Starts a Stripe checkout session for the brand subscription. Shared by the
   pricing cards on the home page and on /viral so there's one call site. */
export function useBrandCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/brand-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Could not start checkout.");
        setLoading(false);
      }
    } catch (e) {
      setError(e.message || "Could not start checkout.");
      setLoading(false);
    }
  }

  return { loading, error, startCheckout };
}
