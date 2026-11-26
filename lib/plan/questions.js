// The onboarding questions. Shared by the screens (components/start) and the
// server, which only accepts these values. Every question changes the plan
// (lib/plan/templates.js); one that stops doing so should be removed.

export const QUESTIONS = [
  {
    id: "stage",
    title: "Where are you right now?",
    options: [
      { value: "building", label: "Still building" },
      { value: "no_users", label: "Launched, no users" },
      { value: "few_users", label: "A few users" },
      { value: "paying", label: "People pay for it" },
    ],
  },
  {
    id: "goal",
    title: "What do you want first?",
    options: [
      { value: "10", label: "10 users" },
      { value: "100", label: "100 users" },
      { value: "paying", label: "More paying users" },
    ],
  },
  {
    id: "posted",
    title: "Have you posted about it?",
    options: [
      { value: "not_yet", label: "Not yet" },
      { value: "a_little", label: "A little" },
      { value: "regularly", label: "Yes, regularly" },
    ],
  },
  {
    id: "pay",
    title: "How would you pay creators?",
    options: [
      { value: "per_view", label: "Per view" },
      { value: "per_video", label: "A flat fee per video" },
      { value: "rev_share", label: "A share of revenue" },
      { value: "not_sure", label: "Not sure yet" },
    ],
  },
  {
    id: "budget",
    title: "What's your monthly creator budget?",
    options: [
      { value: "0", label: "$0" },
      { value: "under_100", label: "Under $100" },
      { value: "100_500", label: "$100 – $500" },
      { value: "500_plus", label: "$500 or more" },
    ],
  },
];

// Returns the answers if every question has an allowed value, else null.
export function normalizeAnswers(input) {
  const answers = {};
  for (const q of QUESTIONS) {
    const value = input?.[q.id];
    if (!q.options.some((o) => o.value === value)) return null;
    answers[q.id] = value;
  }
  return answers;
}
