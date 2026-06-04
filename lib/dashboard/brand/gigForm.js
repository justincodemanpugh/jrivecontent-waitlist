// Shared constants + validation for the "Post a new gig" flow.

export const STEPS = [
  { key: "info", label: "Job info" },
  { key: "deliverables", label: "Deliverables" },
  { key: "pay", label: "Pay per video" },
  { key: "examples", label: "Example videos" },
  { key: "review", label: "Review & launch" },
];

export const DESCRIPTION_LIMIT = 500;
export const TITLE_LIMIT = 80;
export const RECOMMENDED_PAY = 30;
export const MIN_PAY = 10;
export const MAX_EXAMPLES = 3;

// Deliverables: how many videos the brand wants.
export const VIDEO_QUANTITY_PRESETS = [5, 10, 15];
export const MIN_VIDEO_QUANTITY = 1;
export const MAX_VIDEO_QUANTITY = 100;

// Where creators should post the videos. `key` is persisted to the DB.
export const PLATFORMS = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
];

// The style of content the brand is after. `key` is persisted to the DB.
export const CONTENT_TYPES = [
  { key: "product_demo", label: "Product demo" },
  { key: "tutorial", label: "Tutorial / how-to" },
  { key: "unboxing", label: "Unboxing" },
  { key: "lifestyle", label: "Lifestyle" },
  { key: "testimonial", label: "Testimonial / review" },
  { key: "other", label: "Other" },
];

export function platformLabel(key) {
  return PLATFORMS.find((p) => p.key === key)?.label || key;
}

export function contentTypeLabel(key) {
  return CONTENT_TYPES.find((c) => c.key === key)?.label || key;
}

export const INITIAL_FORM = {
  title: "",
  description: "",
  image: null, // { dataUrl, name }
  videoQuantity: VIDEO_QUANTITY_PRESETS[0],
  platforms: ["tiktok"], // subset of PLATFORMS keys
  contentType: "", // one of CONTENT_TYPES keys
  payPerVideo: RECOMMENDED_PAY,
  examples: [], // [{ type: "url" | "file", value, name? }]
};

export function validateStep(stepIndex, form) {
  switch (stepIndex) {
    case 0:
      return (
        form.title.trim().length >= 4 &&
        form.title.length <= TITLE_LIMIT &&
        form.description.trim().length >= 20 &&
        form.description.length <= DESCRIPTION_LIMIT &&
        !!form.image
      );
    case 1: {
      const n = Number(form.videoQuantity);
      return (
        Number.isFinite(n) &&
        n >= MIN_VIDEO_QUANTITY &&
        n <= MAX_VIDEO_QUANTITY &&
        Array.isArray(form.platforms) &&
        form.platforms.length >= 1 &&
        !!form.contentType
      );
    }
    case 2: {
      const n = Number(form.payPerVideo);
      return Number.isFinite(n) && n >= MIN_PAY;
    }
    case 3:
      // Examples are optional but recommended — allow 0, cap at MAX_EXAMPLES
      return form.examples.length <= MAX_EXAMPLES;
    case 4:
      return true;
    default:
      return false;
  }
}
