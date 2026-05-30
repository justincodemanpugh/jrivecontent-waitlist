"use server";

// Logs a single onboarding funnel event for the current user. Writes to
// public.onboarding_events; failures are swallowed so analytics never
// blocks the user's progress through the flow.
//
// Event vocabulary documented in supabase/migrations/0017_onboarding_events.sql.

import { createClient } from "@/lib/supabase/server";

const VALID_EVENTS = new Set([
  "onboarding_started",
  "step_viewed",
  "step_completed",
  "step_skipped",
  "onboarding_completed",
]);

const VALID_ROLES = new Set(["brand", "creator"]);

// Step keys per role, indexed by step_index. Keeping these here (rather than
// in the *Constants files) so analytics labels stay stable even if the UI
// reorders steps in the future.
const BRAND_STEP_KEYS = [
  "brand_name",
  "industry",
  "brand_stage",
  "monthly_budget",
  "content_needs",
  "referral_terms",
];

const CREATOR_STEP_KEYS = [
  "display_name",
  "handle",
  "niches",
  "content_types",
  "bio",
  "cover_photo",
  "socials_terms",
  "stripe_connect",
];

export async function logOnboardingEvent({
  role,
  event,
  stepIndex = null,
  metadata = {},
} = {}) {
  if (!VALID_ROLES.has(role)) return { ok: false, error: "Bad role." };
  if (!VALID_EVENTS.has(event)) return { ok: false, error: "Bad event." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const keys = role === "brand" ? BRAND_STEP_KEYS : CREATOR_STEP_KEYS;
  const stepKey =
    typeof stepIndex === "number" && stepIndex >= 0 && stepIndex < keys.length
      ? keys[stepIndex]
      : null;

  const { error } = await supabase.from("onboarding_events").insert({
    user_id: user.id,
    role,
    event,
    step_index: typeof stepIndex === "number" ? stepIndex : null,
    step_key: stepKey,
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  });

  if (error) {
    // Don't surface to the client — analytics must never block onboarding.
    // eslint-disable-next-line no-console
    console.warn("logOnboardingEvent failed:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
