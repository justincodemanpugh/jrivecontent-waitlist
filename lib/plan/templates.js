// The written half of a plan: message, brief and week. Plain templates filled
// from the onboarding answers, so a plan costs nothing to generate.
//
// Anything in [brackets] is for the founder to fill in or change. Dollar
// amounts are starting points we picked, not market data, so they stay
// bracketed too.

const MAX_NAME = 40;

// Store titles and page titles carry taglines ("Acme: Habit Tracker",
// "Home | Acme"). Keep the part that reads like a name.
export function shortAppName(raw) {
  const parts = String(raw || "")
    .split(/\s*[|–—:·•]\s*|\s+-\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const name = parts.find((p) => !/^(home|homepage|welcome)$/i.test(p)) || parts[0] || "";
  return name.slice(0, MAX_NAME).trim() || "my app";
}

// How each niche reads inside "I like your ___ videos". Niches not listed
// ("Other") are left out of the sentence.
const TOPICS = {
  "Fashion & Beauty": "fashion and beauty",
  "Health & Fitness": "fitness",
  "Food & Drink": "food",
  "Travel & Local": "travel",
  "Lifestyle & Utilities": "lifestyle",
  "Photo & Video": "photo and editing",
  "Education & Learning": "study",
  "Entertainment & Media": "entertainment",
  "Home & Family": "family",
  "Finance & Commerce": "money",
  "Social & Communication": "social",
};

export const AMOUNTS = {
  under_100: { video: 25, view: 1, cap: 25 },
  "100_500": { video: 40, view: 2, cap: 100 },
  "500_plus": { video: 75, view: 2, cap: 200 },
};

export function offerFor({ stage, pay, budget }) {
  const notes = [];
  let type = pay === "not_sure" ? "per_video" : pay;

  if (budget === "0") {
    if (type !== "rev_share") {
      notes.push("You picked a $0 budget, so this offers a share of revenue instead of cash.");
    }
    type = "rev_share";
  } else if (pay === "not_sure") {
    notes.push("A flat fee per video is the simplest way to start.");
  }

  if (type === "rev_share") {
    if (stage !== "paying") {
      notes.push("Nobody pays for it yet, so some creators will say no to a revenue share.");
    }
    notes.push("Give each creator their own code or link, so you can see who brought each sale.");
    return { type, phrase: "[30]% of every subscription you bring in", notes };
  }

  const amounts = AMOUNTS[budget];
  const phrase =
    type === "per_view"
      ? `[$${amounts.view}] per 1,000 views, up to [$${amounts.cap}] per video`
      : `[$${amounts.video}] per video`;
  return { type, phrase, notes };
}

export function buildMessage({ app, niche, answers, offer }) {
  const building = answers.stage === "building";
  return [
    `Hi [their name], I like your ${TOPICS[niche] ? `${TOPICS[niche]} ` : ""}videos, especially [which one].`,
    building
      ? `I'm building ${app}, [what it does in one sentence].`
      : `I built ${app}, [what it does in one sentence].`,
    building
      ? "Would you make a short video about it once it's ready to try?"
      : "Would you make a short video showing how you'd use it?",
    `I can offer ${offer.phrase}, plus free ${building ? "early " : ""}access.`,
    "You'd mark it as an ad (#ad).",
    "Want me to send a one-page brief?",
  ];
}

const GOAL_LINES = {
  10: "Find the first 10 people who will try it.",
  100: "Get 100 people to try it.",
  paying: "Get viewers to pay for it.",
};

export const GOAL_LABELS = {
  10: "first 10 users",
  100: "first 100 users",
  paying: "more paying users",
};

export function buildBrief({ app, answers, offer }) {
  const building = answers.stage === "building";
  return [
    {
      heading: "The goal",
      lines: [building ? `Get people onto the waitlist for ${app}.` : `${app}: ${GOAL_LINES[answers.goal]}`],
    },
    {
      heading: "The first 2 seconds",
      lines: [
        "Start on the problem, not the app.",
        "For example: “I kept [the problem] until I tried this.”",
      ],
    },
    {
      heading: "What to show",
      lines: [
        building
          ? `The problem, then an early look at ${app}.`
          : `Your screen using ${app} for one real task.`,
        "Vertical video, 15 to 30 seconds, filmed on your phone.",
      ],
    },
    {
      heading: "What to say",
      lines: [`Say “${app}” once and where to get it: [link or store name].`],
    },
    {
      heading: "Rules",
      lines: [
        "Mark it as an ad (#ad or TikTok's disclosure setting). Required when you're paid or get something free.",
        "Only claim what you tried yourself.",
        "No bought views or likes.",
      ],
    },
    {
      heading: "Pay",
      lines: [
        `${offer.phrase}.`,
        offer.type === "rev_share"
          ? "Tracked with your own code or link: [code]."
          : "Paid after I approve the video.",
      ],
    },
  ];
}

const POSTS_PER_WEEK = { not_yet: 2, a_little: 3, regularly: 4 };
const POST_DAYS = { 2: [3, 6], 3: [2, 4, 6], 4: [2, 3, 5, 6] };

const FIRST_STEP = {
  building: () => "Write one sentence about what your app does and put up a waitlist page.",
  no_users: (app) => `Ask 5 people who have the problem to try ${app}. Watch where they get stuck.`,
  few_users: (app) => `Ask 3 users why they use ${app}. Write down their exact words.`,
  paying: (app) => `Ask 3 paying users why they paid for ${app}. Write down their exact words.`,
};

const LAST_STEP = {
  10: "Message everyone who commented or asked a question, and invite them to try it.",
  100: "Follow up with creators who haven't answered, and message 3 new ones.",
  paying: "Check which post brought sign-ups or sales.",
};

export function postsPerWeek(answers) {
  return POSTS_PER_WEEK[answers.posted];
}

export function buildWeek({ app, answers }) {
  const days = Array.from({ length: 7 }, (_, i) => ({ day: i + 1, tasks: [] }));
  const add = (day, task) => days[day - 1].tasks.push(task);

  add(1, FIRST_STEP[answers.stage](app));
  add(1, "Watch the first video to recreate and write down its opening line.");
  if (answers.posted === "not_yet") add(1, `Set up a TikTok account for ${app}.`);

  add(2, "Message 2 creators from your list.");
  add(3, "Message the other 3 creators.");
  add(4, "Send the brief to anyone who replied.");
  add(5, "Reply to every comment, and leave 10 helpful comments on videos in your niche.");

  POST_DAYS[postsPerWeek(answers)].forEach((day, i) => {
    const note = answers.stage === "building" ? ", showing what you're building" : "";
    add(day, `Post your version of video ${(i % 3) + 1}${note}.`);
  });

  add(7, "Find your most viewed post and plan two more like it.");
  add(7, LAST_STEP[answers.goal]);

  return days;
}
