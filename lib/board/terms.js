// Starting values for the campaign form, from the onboarding answers. The
// founder sees and confirms them there; nothing is created from these alone.
import { AMOUNTS, offerFor } from "../plan/templates.js";

// Their stated budget becomes the campaign's monthly cap.
const CAPS = { under_100: 100, "100_500": 500 };

export function campaignDefaults({ appName, answers }) {
  const { type } = offerFor(answers);
  const amounts = AMOUNTS[answers.budget];
  const value = (on, n) => (on ? String(n) : "");
  return {
    title: `${appName} creators`,
    periodType: "month",
    videosPerPeriod: "4",
    baseEnabled: type === "per_video",
    payPerVideo: value(type === "per_video", amounts?.video),
    cpmEnabled: type === "per_view",
    cpm: value(type === "per_view", amounts?.view),
    maxPerVideo: value(type === "per_view", amounts?.cap),
    revshareEnabled: type === "rev_share",
    revsharePct: "30",
    // A cap would also cut off a creator's share of revenue, so none there.
    monthlyCap: value(type !== "rev_share" && CAPS[answers.budget], CAPS[answers.budget]),
  };
}
