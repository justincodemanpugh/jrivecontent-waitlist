// Keyword seed list for the /creators directory.
//
// Each keyword is scraped by app/api/discovery/seed/route.js and every creator
// it surfaces inherits that keyword's `niches`, which is what the public
// directory's niche filter reads. Niche values come from CREATOR_NICHES
// (lib/onboarding/creatorConstants.js) so discovered creators and signed-up
// creators are filterable by the same vocabulary.
//
// The generic UGC-intent terms matter more than the niche terms: the measured
// run on "ugc creator" returned a median of 5.4k followers with names like
// @charlotte.ugc and @alicia_ugc — people who already make brand content and
// are open to more, which is exactly who this directory is for. Broad niche
// terms ("fitness") pull in creators who have no interest in brand work.
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";

const N = Object.fromEntries(CREATOR_NICHES.map((n) => [n, n]));

export const DISCOVERY_KEYWORDS = [
  // Intent-first: people who self-identify as available for brand work.
  { keyword: "ugc creator", niches: [] },
  { keyword: "ugc portfolio", niches: [] },
  { keyword: "ugc examples brands", niches: [] },
  { keyword: "product demo video", niches: [] },
  { keyword: "app review creator", niches: [N["Lifestyle & Utilities"]] },
  { keyword: "brand deal creator", niches: [] },

  // Niche-scoped UGC, so the directory's filters return something useful.
  { keyword: "ugc beauty creator", niches: [N["Fashion & Beauty"]] },
  { keyword: "ugc fashion haul", niches: [N["Fashion & Beauty"]] },
  { keyword: "ugc fitness creator", niches: [N["Health & Fitness"]] },
  { keyword: "ugc supplement review", niches: [N["Health & Fitness"]] },
  { keyword: "ugc food review", niches: [N["Food & Drink"]] },
  { keyword: "ugc restaurant creator", niches: [N["Food & Drink"]] },
  { keyword: "ugc travel creator", niches: [N["Travel & Local"]] },
  { keyword: "ugc home decor", niches: [N["Home & Family"]] },
  { keyword: "ugc mom creator", niches: [N["Home & Family"]] },
  { keyword: "ugc tech gadget review", niches: [N["Lifestyle & Utilities"]] },
  { keyword: "ugc app demo", niches: [N["Lifestyle & Utilities"]] },
  { keyword: "ugc finance creator", niches: [N["Finance & Commerce"]] },
  { keyword: "ugc education creator", niches: [N["Education & Learning"]] },
  { keyword: "ugc photographer videographer", niches: [N["Photo & Video"]] },
  { keyword: "ugc skincare routine", niches: [N["Fashion & Beauty"]] },
  { keyword: "ugc pet products", niches: [N["Home & Family"]] },
];

// Floors applied by the seed cron. A 200-follower account with 4 posts is not
// something a brand will hire, and storing it just inflates the directory and
// the refresh bill.
export const MIN_FOLLOWERS = 1000;
export const MIN_VIDEO_COUNT = 5;
