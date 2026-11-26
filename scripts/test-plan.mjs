// Unit tests for the plan wording and the free preview (lib/plan).
// Run: node --test scripts/test-plan.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, normalizeAnswers } from "../lib/plan/questions.js";
import { shortAppName } from "../lib/plan/templates.js";
import {
  buildPlan,
  pickCreators,
  pickVideos,
  toFullPlan,
  toPlanTeaser,
} from "../lib/plan/preview.js";

const ANSWERS = {
  stage: "no_users",
  goal: "10",
  posted: "not_yet",
  pay: "per_video",
  budget: "under_100",
};

const video = (n, creator = `c${n}`) => ({
  creator_id: creator,
  video_url: `https://tiktok.com/@secret${n}/video/${n}`,
  thumbnail_url: `https://cdn.test/${n}.jpg`,
  views: 1000 * n,
  likes: 10 * n,
  caption: `secret caption ${n}`,
  follower_count: 5000,
});

const member = (n) => ({
  id: `platform-${n}`,
  source: "platform",
  name: `Secret Member ${n}`,
  handle: `secretmember${n}`,
  tiktok_handle: "",
  avatar_url: `https://cdn.test/secret-avatar-${n}.jpg`,
  niches: ["Health & Fitness"],
  rate_min: 30,
  rate_max: 60,
});

const scraped = (n) => ({
  id: `directory-${n}`,
  source: "directory",
  username: `secretscraped${n}`,
  name: `Secret Scraped ${n}`,
  avatar_url: `https://cdn.test/secret-face-${n}.jpg`,
  bio: "secret bio",
  niches: ["Health & Fitness"],
  follower_count: 12000 + n,
});

const MATCHES = {
  platform: [1, 2, 3, 4].map(member),
  directory: [1, 2, 3, 4].map(scraped),
  videos: [video(1), video(2), video(3), video(4)],
  wider: { platform: [], directory: [] },
  widerVideos: [],
};

const plan = (answers = {}, matches = MATCHES) =>
  buildPlan({
    app: { name: "FitLog: Workout Tracker" },
    niche: "Health & Fitness",
    answers: { ...ANSWERS, ...answers },
    matches,
  });

test("app name drops taglines", () => {
  assert.equal(shortAppName("FitLog: Workout Tracker"), "FitLog");
  assert.equal(shortAppName("Home | Acme"), "Acme");
  assert.equal(shortAppName("Acme - Do more"), "Acme");
  assert.equal(shortAppName("Co-pilot"), "Co-pilot");
  assert.equal(shortAppName(""), "my app");
});

test("answers outside the options are rejected", () => {
  assert.deepEqual(normalizeAnswers(ANSWERS), ANSWERS);
  assert.equal(normalizeAnswers({ ...ANSWERS, budget: "a million" }), null);
  assert.equal(normalizeAnswers({}), null);
});

test("every question changes the plan", () => {
  for (const q of QUESTIONS) {
    const versions = new Set(q.options.map((o) => JSON.stringify(plan({ [q.id]: o.value }))));
    assert.ok(versions.size > 1, `${q.id} changes nothing`);
  }
});

test("every combination of answers produces a complete plan", () => {
  let combos = [{}];
  for (const q of QUESTIONS) {
    combos = combos.flatMap((c) => q.options.map((o) => ({ ...c, [q.id]: o.value })));
  }
  for (const answers of combos) {
    const p = plan(answers);
    assert.doesNotMatch(JSON.stringify(p), /undefined|NaN|null per/, JSON.stringify(answers));
    assert.equal(p.week.length, 7);
    assert.equal(
      p.week.flatMap((d) => d.tasks).filter((t) => t.startsWith("Post your version")).length,
      p.postsPerWeek,
    );
  }
});

test("a $0 budget never offers cash", () => {
  for (const pay of ["per_view", "per_video", "rev_share", "not_sure"]) {
    const text = plan({ budget: "0", pay }).message.join(" ");
    assert.match(text, /of every subscription/);
    assert.doesNotMatch(text, /\$/);
  }
});

test("free preview withholds names, links and the written parts", () => {
  const full = toFullPlan(plan());
  const teaser = toPlanTeaser(plan());
  const out = JSON.stringify(teaser);

  // The one free video is the only thing that may identify an account.
  const [sample, ...locked] = teaser.videos;
  assert.equal(sample.video_url, full.videos[0].video_url);
  for (const v of locked) assert.deepEqual(Object.keys(v).sort(), ["locked", "outsideNiche", "thumbnail_url", "views"]);

  const withoutSample = JSON.stringify({ ...teaser, videos: locked });
  assert.doesNotMatch(withoutSample, /secret(member|scraped|\d|-| )/i);
  assert.doesNotMatch(out, /platform-\d|directory-\d|avatar/);

  assert.equal(teaser.creators.length, 5);
  assert.equal(teaser.message.length, 2);
  assert.doesNotMatch(teaser.message.join(" "), /\$|#ad/);
  assert.ok(teaser.brief.every((s) => s.lines === undefined));
  assert.ok(teaser.week[0].tasks.length > 0);
  assert.ok(teaser.week.slice(1).every((d) => d.locked && d.tasks === undefined));

  assert.equal(full.creators[0].name, "Secret Member 1");
  assert.equal(full.message.length, 6);
});

test("videos come from different accounts when they can", () => {
  const picked = pickVideos([video(1, "a"), video(2, "a"), video(3, "b")], [video(4, "c")]);
  assert.deepEqual(picked.map((v) => v.creator_id), ["a", "b", "c"]);
  assert.deepEqual(picked.map((v) => v.outsideNiche), [false, false, true]);
  assert.equal(pickVideos([video(1, "a"), video(2, "a")]).length, 2);
});

test("thin niche is topped up and labelled", () => {
  const picked = pickCreators(
    { platform: [member(1)], directory: [] },
    { platform: [member(1), member(2)], directory: [scraped(1), scraped(2), scraped(3)] },
  );
  assert.equal(picked.length, 5);
  assert.deepEqual(picked.map((c) => c.outsideNiche), [false, true, true, true, true]);
  assert.equal(new Set(picked.map((c) => c.id)).size, 5);
});

test("a creator with several niches shows the plan's", () => {
  const multi = { ...member(1), niches: ["Fashion & Beauty", "Health & Fitness"] };
  const [first] = toPlanTeaser(plan({}, { ...MATCHES, platform: [multi] })).creators;
  assert.equal(first.niche, "Health & Fitness");
});

test("signed-up creators don't crowd out the rest", () => {
  const picked = pickCreators(MATCHES);
  assert.deepEqual(picked.map((c) => c.source), ["platform", "platform", "platform", "directory", "directory"]);
});
