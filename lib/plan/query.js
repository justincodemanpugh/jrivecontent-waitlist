// Carries the onboarding inputs to /plan in the address, so they survive
// sign-up, including a magic link opened in a different browser.
import { QUESTIONS, normalizeAnswers } from "./questions.js";

export function planHref({ url, niche, appName, answers }) {
  const params = new URLSearchParams({ url, niche, name: appName || "" });
  for (const q of QUESTIONS) params.set(q.id, answers[q.id]);
  return `/plan?${params}`;
}

// `params` is anything with a get(): URLSearchParams or Next's. Returns null
// unless every part needed to build a plan is there.
export function parsePlanQuery(params) {
  const url = params.get("url");
  const niche = params.get("niche");
  const answers = normalizeAnswers(
    Object.fromEntries(QUESTIONS.map((q) => [q.id, params.get(q.id)])),
  );
  if (!url || !niche || !answers) return null;
  return { url, niche, appName: params.get("name") || "", answers };
}
