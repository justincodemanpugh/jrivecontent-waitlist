// Work out which creator niches an app belongs to, without a model.
//
// The niche is a literal filter against discovered_creators.niche_tags, so it
// has to come from CREATOR_NICHES (lib/onboarding/creatorConstants.js) — the
// same vocabulary the seed cron tags creators with in lib/discovery/keywords.js.
//
// Two paths, and neither is clever on purpose:
//
//   * iOS listings carry primaryGenreName, a small fixed vocabulary Apple
//     controls. A lookup table is exactly right for that, and it never
//     surprises anyone.
//   * A web app has no category, so we keyword-match its title and blurb.
//     That is genuinely rough.
//
// Which is why the results UI always shows the detected niche as a dropdown
// the visitor can change. A wrong guess is then one click from right, instead
// of being a wrong answer we quietly stand behind.
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";

const N = Object.fromEntries(CREATOR_NICHES.map((n) => [n, n]));

// App-adjacent creators mostly land here — lib/discovery/keywords.js tags
// "app review creator" and "ugc app demo" as Lifestyle & Utilities — so it is
// the right catch-all for a utility app we can't place.
const FALLBACK = N["Lifestyle & Utilities"];

// Apple's primaryGenreName values. Games is deliberately Entertainment &
// Media: the creators who post gameplay clips sit with entertainment
// audiences, not in a category of their own.
const APP_STORE_GENRES = {
  "Health & Fitness": N["Health & Fitness"],
  "Medical": N["Health & Fitness"],
  "Food & Drink": N["Food & Drink"],
  "Travel": N["Travel & Local"],
  "Navigation": N["Travel & Local"],
  "Weather": N["Travel & Local"],
  "Photo & Video": N["Photo & Video"],
  "Graphics & Design": N["Photo & Video"],
  "Education": N["Education & Learning"],
  "Reference": N["Education & Learning"],
  "Books": N["Education & Learning"],
  "Entertainment": N["Entertainment & Media"],
  "Games": N["Entertainment & Media"],
  "Music": N["Entertainment & Media"],
  "Sports": N["Entertainment & Media"],
  "Magazines & Newspapers": N["Entertainment & Media"],
  "News": N["Entertainment & Media"],
  "Social Networking": N["Social & Communication"],
  "Finance": N["Finance & Commerce"],
  "Business": N["Finance & Commerce"],
  "Shopping": N["Finance & Commerce"],
  "Lifestyle": N["Lifestyle & Utilities"],
  "Productivity": N["Lifestyle & Utilities"],
  "Utilities": N["Lifestyle & Utilities"],
  "Developer Tools": N["Lifestyle & Utilities"],
  "Stickers": N["Entertainment & Media"],
};

// Fashion & Beauty and Home & Family have no App Store genre of their own —
// a skincare-routine app ships as "Lifestyle" — so they are reachable only
// through these terms or the picker.
const KEYWORD_HINTS = [
  [N["Fashion & Beauty"], ["skincare", "makeup", "beauty", "outfit", "fashion", "wardrobe", "styling", "haircare", "nails"]],
  [N["Health & Fitness"], ["workout", "fitness", "gym", "exercise", "running", "yoga", "meditation", "sleep", "calorie", "nutrition", "weight", "mental health", "habit"]],
  [N["Food & Drink"], ["recipe", "cooking", "meal", "restaurant", "coffee", "grocery", "diet", "menu", "baking", "cocktail"]],
  [N["Travel & Local"], ["travel", "trip", "flight", "hotel", "itinerary", "map", "city guide", "hiking", "camping", "weather"]],
  [N["Photo & Video"], ["photo", "video", "camera", "edit", "filter", "presets", "design", "logo", "thumbnail", "image"]],
  [N["Education & Learning"], ["learn", "study", "course", "language", "flashcard", "quiz", "tutor", "homework", "exam", "reading"]],
  [N["Entertainment & Media"], ["game", "play", "puzzle", "music", "podcast", "movie", "anime", "stream", "sports", "fantasy"]],
  [N["Home & Family"], ["family", "kids", "baby", "parent", "chores", "home", "pet", "couples", "relationship", "wedding", "garden"]],
  [N["Finance & Commerce"], ["budget", "money", "invest", "crypto", "expense", "invoice", "tax", "savings", "shop", "ecommerce", "store", "payment"]],
  [N["Social & Communication"], ["chat", "message", "friends", "social", "community", "dating", "share", "group", "network"]],
  [N["Lifestyle & Utilities"], ["todo", "task", "note", "planner", "productivity", "calendar", "tracker", "organize", "reminder", "journal"]],
];

// Score the app's text against each niche's terms and keep whatever actually
// matched, best first. No match at all means we say so via FALLBACK rather
// than inventing a specific-sounding niche.
//
// `minScore` is the whole story on accuracy. A single term hit inside a
// 1500-character store listing is mostly noise — VSCO calls its saved presets
// "recipes", which scored it as a Food & Drink app — so when Apple has
// already told us the genre we demand corroboration from two terms before
// adding a second niche. A web app has no genre, so there a single hit is all
// the signal available and it has to be enough.
function fromText(name, description, minScore) {
  const haystack = `${name || ""} ${description || ""}`.toLowerCase();
  if (!haystack.trim()) return [];

  const scored = [];
  for (const [niche, terms] of KEYWORD_HINTS) {
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += 1;
    }
    if (score >= minScore) scored.push({ niche, score });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 2);
}

// A keyword niche this well-corroborated outranks the App Store genre. Apple's
// categories are coarse where it matters most: Sephora ships as "Shopping",
// which maps to Finance & Commerce, when the app is obviously Fashion & Beauty
// and its listing says so a dozen times.
const TEXT_BEATS_GENRE = 3;

// Returns 1-2 niches from CREATOR_NICHES, best match first. Never empty.
export function inferNiches({ category, name, description } = {}) {
  const fromGenre = category ? APP_STORE_GENRES[category] : null;

  // Text hints still run alongside a genre — they are what separates a
  // skincare tracker from a habit tracker, since both ship as "Lifestyle" —
  // but they have to clear a higher bar once Apple has told us the category.
  // See fromText.
  const scored = fromText(name, description, fromGenre ? 2 : 1);
  const top = scored[0];

  // Order matters beyond the query: the results page shows niches[0] in the
  // picker, so whichever signal is strongest has to lead.
  const out = [];
  if (top && top.score >= TEXT_BEATS_GENRE) out.push(top.niche);
  if (fromGenre) out.push(fromGenre);
  for (const s of scored) out.push(s.niche);

  const deduped = [...new Set(out)];
  if (deduped.length === 0) deduped.push(FALLBACK);
  return deduped.slice(0, 2);
}

// Search phrases parked in discovery_searches when a niche turns out to have
// thin coverage, so the Monday seed cron (app/api/discovery/seed) widens it.
// Mirrors the intent-first shape of lib/discovery/keywords.js: terms aimed at
// people who already make brand content, not at the topic in general.
export function keywordsForNiches(niches) {
  const base = (niches || []).map((n) => {
    const head = n.split(" & ")[0].toLowerCase();
    return `ugc ${head} creator`;
  });
  return [...new Set([...base, "ugc app demo", "app review creator"])].slice(0, 6);
}
