// Assemble a plan from the matches and the answers, and cut it down to the
// free preview. Pure, so what leaves the server can be tested
// (scripts/test-plan.mjs).
//
// toPlanTeaser is the paywall: whatever it returns is visible to anyone. It
// builds each field up from nothing, so a new field on a creator or video is
// withheld until someone adds it here on purpose.
import {
  GOAL_LABELS,
  buildBrief,
  buildMessage,
  buildWeek,
  offerFor,
  postsPerWeek,
  shortAppName,
} from "./templates.js";

export const PLAN_VIDEOS = 3;
export const PLAN_CREATORS = 5;
const FREE_MESSAGE_LINES = 2;
// Signed-up creators lead because they can be invited and paid in the app,
// but they don't fill the whole list: scraped accounts add reach.
const PLATFORM_SLOTS = 3;

// Prefer one video per account, so three videos are three formats to try.
export function pickVideos(niche, wider = []) {
  const picked = [];
  const urls = new Set();
  const accounts = new Set();
  const pools = [
    { list: niche, outside: false },
    { list: wider, outside: true },
  ];

  for (const distinct of [true, false]) {
    for (const { list, outside } of pools) {
      for (const v of list) {
        if (picked.length === PLAN_VIDEOS) return picked;
        if (!v.video_url || urls.has(v.video_url)) continue;
        if (distinct && accounts.has(v.creator_id)) continue;
        urls.add(v.video_url);
        accounts.add(v.creator_id);
        picked.push({ ...v, outsideNiche: outside });
      }
    }
  }
  return picked;
}

export function pickCreators(niche, wider = { platform: [], directory: [] }) {
  const picked = [];
  const ids = new Set();
  const take = (list, outside, max = PLAN_CREATORS) => {
    let taken = 0;
    for (const c of list) {
      if (picked.length === PLAN_CREATORS || taken === max) return;
      if (ids.has(c.id)) continue;
      ids.add(c.id);
      picked.push({ ...c, outsideNiche: outside });
      taken += 1;
    }
  };

  take(niche.platform, false, PLATFORM_SLOTS);
  take(niche.directory, false);
  take(niche.platform, false);
  take(wider.platform, true, PLATFORM_SLOTS);
  take(wider.directory, true);
  take(wider.platform, true);
  return picked;
}

function rateLabel(c) {
  if (c.rate_min && c.rate_max) return `$${c.rate_min}–${c.rate_max} per video`;
  if (c.rate_min) return `From $${c.rate_min} per video`;
  return null;
}

export function buildPlan({ app, appName, niche, answers, matches }) {
  const name = shortAppName(appName || app?.name);
  const offer = offerFor(answers);

  return {
    appName: name,
    niche,
    nicheLabel: niche === "Other" ? "your niche" : niche,
    goalLabel: GOAL_LABELS[answers.goal],
    postsPerWeek: postsPerWeek(answers),
    videos: pickVideos(matches.videos, matches.widerVideos),
    // Creators list several niches: show the plan's when it is one of them.
    creators: pickCreators(matches, matches.wider).map((c) => ({
      ...c,
      niche: c.niches?.includes(niche) ? niche : c.niches?.[0] || null,
    })),
    message: buildMessage({ app: name, niche, answers, offer }),
    brief: buildBrief({ app: name, answers, offer }),
    notes: offer.notes,
    week: buildWeek({ app: name, answers }),
  };
}

function teaserVideo(v, index) {
  const base = {
    thumbnail_url: v.thumbnail_url || null,
    views: v.views,
    outsideNiche: v.outsideNiche,
  };
  // The first video is the free sample.
  if (index > 0) return { ...base, locked: true };
  return {
    ...base,
    video_url: v.video_url,
    likes: v.likes,
    follower_count: v.follower_count,
    caption: v.caption,
    locked: false,
  };
}

// Numbers only: enough to judge the list, not enough to find anyone.
function teaserCreator(c) {
  return {
    source: c.source,
    follower_count: c.follower_count ?? null,
    rate: rateLabel(c),
    niche: c.niche,
    outsideNiche: c.outsideNiche,
    locked: true,
  };
}

function fullCreator(c) {
  const handle = c.source === "platform" ? c.tiktok_handle || c.handle : c.username;
  return {
    id: c.id,
    source: c.source,
    name: c.name,
    handle: handle || "",
    avatar_url: c.avatar_url || null,
    follower_count: c.follower_count ?? null,
    rate: rateLabel(c),
    niche: c.niche,
    outsideNiche: c.outsideNiche,
    locked: false,
  };
}

function header(plan) {
  return {
    appName: plan.appName,
    niche: plan.niche,
    nicheLabel: plan.nicheLabel,
    goalLabel: plan.goalLabel,
    postsPerWeek: plan.postsPerWeek,
    notes: plan.notes,
  };
}

export function toFullPlan(plan) {
  return {
    ...header(plan),
    videos: plan.videos.map((v) => ({ ...v, locked: false })),
    creators: plan.creators.map(fullCreator),
    message: plan.message,
    brief: plan.brief,
    week: plan.week,
  };
}

export function toPlanTeaser(plan) {
  return {
    ...header(plan),
    videos: plan.videos.map(teaserVideo),
    creators: plan.creators.map(teaserCreator),
    message: plan.message.slice(0, FREE_MESSAGE_LINES),
    brief: plan.brief.map((s) => ({ heading: s.heading })),
    week: plan.week.map((d, i) => (i === 0 ? d : { day: d.day, locked: true })),
  };
}
