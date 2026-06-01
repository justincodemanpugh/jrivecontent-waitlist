"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Fetches the current user's tutorial progress.
 * Returns null if no progress record exists (new user).
 */
export async function fetchTutorialProgress() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("brand_tutorial_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[fetchTutorialProgress]", error);
    throw error;
  }

  return data;
}

/**
 * Initializes tutorial progress for a new brand user.
 * Called on first dashboard visit.
 */
export async function initTutorialProgress() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("brand_tutorial_progress")
    .upsert({
      user_id: user.id,
      first_dashboard_visit_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    console.error("[initTutorialProgress]", error);
    throw error;
  }

  return data;
}

/**
 * Updates a specific tutorial step as completed.
 */
export async function completeTutorialStep(stepKey) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const updates = { [stepKey]: true };
  
  const { data, error } = await supabase
    .from("brand_tutorial_progress")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[completeTutorialStep]", error);
    throw error;
  }

  window.dispatchEvent(new CustomEvent("tutorial:changed"));
  return data;
}

/**
 * Marks the guided tour as started.
 */
export async function startTour() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("brand_tutorial_progress")
    .update({ tour_started_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[startTour]", error);
    throw error;
  }

  return data;
}

/**
 * Marks the guided tour as completed.
 */
export async function completeTour() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("brand_tutorial_progress")
    .update({
      tour_completed: true,
      tour_completed_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[completeTour]", error);
    throw error;
  }

  window.dispatchEvent(new CustomEvent("tutorial:changed"));
  return data;
}

/**
 * Dismisses the guided tour (user clicked skip/close).
 */
export async function dismissTour() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("brand_tutorial_progress")
    .update({ tour_dismissed: true })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[dismissTour]", error);
    throw error;
  }

  window.dispatchEvent(new CustomEvent("tutorial:changed"));
  return data;
}

/**
 * Hides/shows the checklist panel.
 */
export async function toggleChecklistVisibility(hidden) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("brand_tutorial_progress")
    .update({ checklist_hidden: hidden })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[toggleChecklistVisibility]", error);
    throw error;
  }

  window.dispatchEvent(new CustomEvent("tutorial:changed"));
  return data;
}
