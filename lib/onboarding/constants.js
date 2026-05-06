// Option lists for the brand onboarding flow. Keep these stable since values
// are stored as plain text in the brand_profiles table.

export const INDUSTRIES = [
  "Tech / App",
  "E-commerce",
  "SaaS",
  "Health / Fitness",
  "Lifestyle",
  "Education",
  "Food & Beverage",
  "Beauty",
  "Gaming",
  "Finance / Fintech",
  "B2B Services",
  "Other",
];

export const BRAND_STAGES = [
  { value: "idea", label: "Just an idea" },
  { value: "pre_launch", label: "Pre-launch" },
  { value: "launched", label: "Launched (under 1 year)" },
  { value: "established", label: "Established (1+ years)" },
];

export const BUDGET_RANGES = [
  "Under $100",
  "$100 – $500",
  "$500 – $1000",
  "Not sure yet",
];

export const CONTENT_NEEDS = [
  "Short TikTok / Reels videos",
  "Product demos / explainer videos",
  "App launch teasers",
  "Customer testimonials",
  "Other",
];

export const REFERRAL_SOURCES = [
  "Twitter / X",
  "TikTok",
  "Instagram",
  "YouTube",
  "Friend / word of mouth",
  "Google search",
  "Other",
];

export const TOTAL_STEPS = 6;
