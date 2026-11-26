"use client";

import { useState } from "react";

/* Starts a Stripe checkout session for the brand subscription. Shared by the
   marketing pricing cards. Visitors who aren't signed in go to the onboarding
   first: they see their plan, then sign up and pay from it. */
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
        body: JSON.stringify({ returnTo: "/plan" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.signIn) {
        window.location.href = "/start";
      } else if (data.alreadySubscribed) {
        window.location.href = "/dashboard/brand";
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
