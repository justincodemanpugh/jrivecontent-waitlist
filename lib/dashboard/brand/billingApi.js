// Client-side helpers for the Settings → Billing tab.

export async function fetchBilling() {
  const res = await fetch("/api/brand/billing", { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not load billing.");
  }
  return res.json();
}

// Opens Stripe Checkout for the $25/mo brand subscription.
export async function startBrandSubscription(returnTo) {
  const res = await fetch("/api/stripe/brand-subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnTo }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Could not start checkout.");
  }
  return data.url;
}

// Opens the Stripe Customer Portal so the user can update their payment
// method, view invoices, or cancel.
export async function openBillingPortal(returnTo) {
  const res = await fetch("/api/stripe/brand-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnTo }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(data.error || "Could not open billing portal.");
  }
  return data.url;
}

export function formatCardBrand(brand) {
  if (!brand) return "Card";
  return brand
    .split(/[\s_-]+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
