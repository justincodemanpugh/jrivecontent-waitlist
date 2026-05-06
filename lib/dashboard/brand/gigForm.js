// Shared constants + validation for the "Post a new gig" flow.

export const STEPS = [
  { key: "info", label: "Job info" },
  { key: "pay", label: "Pay per video" },
  { key: "examples", label: "Example videos" },
  { key: "review", label: "Review & launch" },
];

export const DESCRIPTION_LIMIT = 500;
export const TITLE_LIMIT = 80;
export const RECOMMENDED_PAY = 30;
export const MIN_PAY = 10;
export const MAX_EXAMPLES = 3;

export const INITIAL_FORM = {
  title: "",
  description: "",
  image: null, // { dataUrl, name }
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
      const n = Number(form.payPerVideo);
      return Number.isFinite(n) && n >= MIN_PAY;
    }
    case 2:
      // Examples are optional but recommended — allow 0, cap at MAX_EXAMPLES
      return form.examples.length <= MAX_EXAMPLES;
    case 3:
      return true;
    default:
      return false;
  }
}
