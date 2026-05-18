// Plain (non-"use server") constants module so both the client onboarding
// form and the server action can import these without violating the
// "server actions files may only export async functions" rule.

export const CREATOR_NICHES = [
  "Fashion & Beauty",
  "Health & Fitness",
  "Food & Drink",
  "Travel & Local",
  "Lifestyle & Utilities",
  "Photo & Video",
  "Education & Learning",
  "Entertainment & Media",
  "Home & Family",
  "Finance & Commerce",
  "Social & Communication",
  "Other",
];

export const CONTENT_TYPES = [
  "UGC video",
  "Photo",
  "Voiceover",
  "Long-form video",
  "Story / Reel",
  "Live stream",
];

export const TOTAL_CREATOR_STEPS = 8;
