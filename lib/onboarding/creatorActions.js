"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CREATOR_NICHES, CONTENT_TYPES } from "./creatorConstants";

function clean(s, max = 200) {
  if (typeof s !== "string") return null;
  const v = s.trim();
  if (!v) return null;
  return v.slice(0, max);
}

function sanitize(input) {
  const out = {};

  const display = clean(input.display_name, 80);
  if (display) out.display_name = display;

  const handle = clean(input.handle, 40);
  if (handle) out.handle = handle.replace(/^@/, "").toLowerCase();

  const bio = clean(input.bio, 500);
  if (bio !== null) out.bio = bio;

  if (Array.isArray(input.niches)) {
    out.niches = input.niches.filter(
      (n) => typeof n === "string" && CREATOR_NICHES.includes(n),
    );
  }

  if (Array.isArray(input.content_types)) {
    out.content_types = input.content_types.filter(
      (n) => typeof n === "string" && CONTENT_TYPES.includes(n),
    );
  }

  const portfolio = clean(input.portfolio_url, 240);
  if (portfolio !== null) out.portfolio_url = portfolio;

  const ig = clean(input.instagram_handle, 60);
  if (ig !== null) out.instagram_handle = ig.replace(/^@/, "");

  const tt = clean(input.tiktok_handle, 60);
  if (tt !== null) out.tiktok_handle = tt.replace(/^@/, "");

  const yt = clean(input.youtube_handle, 60);
  if (yt !== null) out.youtube_handle = yt.replace(/^@/, "");

  if ("country" in input) {
    const v = input.country;
    if (v === null || v === "") out.country = null;
    else if (typeof v === "string" && /^[A-Za-z]{2}$/.test(v.trim())) {
      out.country = v.trim().toUpperCase();
    }
  }

  if (input.terms_accepted === true) {
    out.terms_accepted_at = new Date().toISOString();
  }

  return out;
}

// Upserts the current user's creator profile with the partial fields touched
// in the current step. Used for save-as-you-go progress so a refresh can
// resume on the first incomplete step.
export async function saveCreatorOnboardingStep(payload) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const fields = sanitize(payload || {});

  const { error } = await supabase
    .from("creator_profiles")
    .upsert({ user_id: user.id, ...fields }, { onConflict: "user_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Marks the creator profile as fully onboarded without redirecting. Used by
// the Stripe Connect step where the client needs to send the user off to
// Stripe immediately after completion. Requires the same minimum fields as
// completeCreatorOnboarding.
export async function markCreatorOnboarded() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: existing, error: readErr } = await supabase
    .from("creator_profiles")
    .select("display_name, niches, terms_accepted_at, onboarded_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!existing) return { ok: false, error: "Profile not found." };

  if (!existing.display_name) {
    return { ok: false, error: "Please enter a display name." };
  }
  if (!existing.niches || existing.niches.length === 0) {
    return { ok: false, error: "Pick at least one niche." };
  }
  if (!existing.terms_accepted_at) {
    return {
      ok: false,
      error: "You must agree to the Terms and Privacy Policy.",
    };
  }

  if (existing.onboarded_at) return { ok: true };

  const { error } = await supabase
    .from("creator_profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function completeCreatorOnboarding(payload) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const fields = sanitize(payload || {});

  if (!fields.display_name) {
    return { ok: false, error: "Please enter a display name." };
  }
  if (!fields.niches || fields.niches.length === 0) {
    return { ok: false, error: "Pick at least one niche." };
  }
  if (!fields.terms_accepted_at) {
    return { ok: false, error: "You must agree to the Terms and Privacy Policy." };
  }

  const { error } = await supabase.from("creator_profiles").upsert(
    {
      user_id: user.id,
      ...fields,
      onboarded_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, error: error.message };

  redirect("/dashboard/creator");
}
