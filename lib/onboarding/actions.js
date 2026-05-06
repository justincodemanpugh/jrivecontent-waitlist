"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  INDUSTRIES,
  BRAND_STAGES,
  BUDGET_RANGES,
  CONTENT_NEEDS,
  REFERRAL_SOURCES,
} from "./constants";

const STAGE_VALUES = BRAND_STAGES.map((s) => s.value);

// Validates and sanitises an inbound partial onboarding payload. Returns an
// object containing only the fields that are present and valid; unknown or
// invalid fields are dropped silently.
function sanitize(input) {
  const out = {};

  if (typeof input.brand_name === "string") {
    const v = input.brand_name.trim();
    if (v) out.brand_name = v.slice(0, 120);
  }

  if (typeof input.website === "string") {
    const v = input.website.trim();
    out.website = v ? v.slice(0, 240) : null;
  }

  if (typeof input.industry === "string" && INDUSTRIES.includes(input.industry)) {
    out.industry = input.industry;
  }

  if (typeof input.brand_stage === "string" && STAGE_VALUES.includes(input.brand_stage)) {
    out.brand_stage = input.brand_stage;
  }

  if ("monthly_budget" in input) {
    const v = input.monthly_budget;
    if (v === null || v === "") out.monthly_budget = null;
    else if (typeof v === "string" && BUDGET_RANGES.includes(v)) out.monthly_budget = v;
  }

  if (Array.isArray(input.content_needs)) {
    out.content_needs = input.content_needs.filter(
      (x) => typeof x === "string" && CONTENT_NEEDS.includes(x),
    );
  }

  if ("referral_source" in input) {
    const v = input.referral_source;
    if (v === null || v === "") out.referral_source = null;
    else if (typeof v === "string" && REFERRAL_SOURCES.includes(v)) {
      out.referral_source = v;
    }
  }

  if (input.terms_accepted === true) {
    out.terms_accepted_at = new Date().toISOString();
  }

  return out;
}

// Upserts the current user's brand profile with the provided partial fields.
// Used for save-as-you-go progress between onboarding steps.
export async function saveOnboardingStep(payload) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const fields = sanitize(payload || {});

  const { error } = await supabase
    .from("brand_profiles")
    .upsert({ user_id: user.id, ...fields }, { onConflict: "user_id" });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Final submit. Validates required fields server-side, marks onboarded_at,
// then redirects to the dashboard.
export async function completeOnboarding(payload) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const fields = sanitize(payload || {});

  if (!fields.brand_name) return { ok: false, error: "Brand name is required." };
  if (!fields.terms_accepted_at) {
    // Accept previously-stored terms acceptance if the client didn't resend it.
    const { data: existing } = await supabase
      .from("brand_profiles")
      .select("terms_accepted_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing?.terms_accepted_at) {
      return { ok: false, error: "You must agree to the Terms and Privacy Policy." };
    }
  }
  if (!fields.industry) return { ok: false, error: "Please select an industry." };
  if (!fields.brand_stage) return { ok: false, error: "Please select your brand stage." };

  const { error } = await supabase
    .from("brand_profiles")
    .upsert(
      {
        user_id: user.id,
        ...fields,
        onboarded_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) return { ok: false, error: error.message };

  redirect("/dashboard/brand");
}

// Server-side fetch of the current user's brand profile (or null).
export async function getMyBrandProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data || null;
}
