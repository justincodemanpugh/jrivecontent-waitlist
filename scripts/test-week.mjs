// Unit tests for the main page: the week, the creator columns, campaign
// starting terms and the dashboard sections.
// Run: node --test scripts/test-week.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { allTasks, isTaskKey, nextTask, weekDay, weekOver } from "../lib/week/progress.js";
import { messageFor, normalizeHandle, seedRows, visibleCards } from "../lib/board/cards.js";
import { campaignDefaults } from "../lib/board/terms.js";
import { locate } from "../lib/dashboard/brand/nav.js";
import { buildWeek } from "../lib/plan/templates.js";

const answers = { stage: "no_users", goal: "10", posted: "a_little", pay: "per_video", budget: "under_100" };
const week = buildWeek({ app: "FitLog", answers });

test("day counts from when the week started, 1 to 7", () => {
  const start = "2026-11-01T12:00:00Z";
  const at = (iso) => weekDay(start, new Date(iso));
  assert.equal(at("2026-11-01T12:00:00Z"), 1);
  assert.equal(at("2026-11-02T11:59:00Z"), 1);
  assert.equal(at("2026-11-02T12:00:00Z"), 2);
  assert.equal(at("2026-12-25T00:00:00Z"), 7);
  assert.equal(at("2026-10-01T00:00:00Z"), 1);
  assert.equal(weekOver(start, new Date("2026-11-07T12:00:00Z")), false);
  assert.equal(weekOver(start, new Date("2026-11-08T12:00:00Z")), true);
});

test("next task: oldest overdue, then what's coming", () => {
  const keys = allTasks(week).map((t) => t.key);
  assert.equal(nextTask(week, [], 3).key, keys[0]);
  const dayOne = keys.filter((k) => k.startsWith("1-"));
  assert.equal(nextTask(week, dayOne, 1).day, 2);
  assert.equal(nextTask(week, keys, 7), null);
  assert.ok(isTaskKey(week, keys[0]));
  assert.ok(!isTaskKey(week, "9-0"));
});

test("cards from a plan, and who stays visible", () => {
  const rows = seedRows(
    {
      creators: [
        { id: "u1", source: "platform", name: "Ann", tiktok_handle: "@ann", handle: "other" },
        { id: "d1", source: "directory", name: "Bo", username: "bo.tok" },
      ],
    },
    "brand",
  );
  assert.deepEqual(rows.map((r) => [r.creator_ref, r.handle]), [["u1", "ann"], ["d1", "bo.tok"]]);

  const card = (over) => ({ status: "to_message", source: "directory", creator_ref: "d1", joined_creator_id: null, ...over });
  const visible = (cards, directory = [], members = []) =>
    visibleCards(cards, { directoryIds: new Set(directory), memberIds: new Set(members) }).length;
  assert.equal(visible([card()], ["d1"]), 1);
  assert.equal(visible([card()], []), 0, "opted out");
  assert.equal(visible([card({ status: "removed" })], ["d1"]), 0);
  assert.equal(visible([card({ joined_creator_id: "u9" })], [], ["u9"]), 1, "joined");
  assert.equal(visible([card({ source: "platform", creator_ref: "u1" })], [], []), 0, "account gone");
  assert.equal(visible([card({ source: "manual", creator_ref: "x" })]), 1);
});

test("handles and messages", () => {
  assert.equal(normalizeHandle("@Some.Name"), "some.name");
  assert.equal(normalizeHandle("https://www.tiktok.com/@abc_1?lang=en"), "abc_1");
  for (const bad of ["", "a", "two words", "<script>", "x".repeat(30)]) assert.equal(normalizeHandle(bad), null, bad);
  assert.equal(messageFor(["Hi [their name],", "Bye"], "$& Sam"), "Hi $& Sam,\nBye");
});

test("campaign starting terms follow the answers and cap at the budget", () => {
  const perVideo = campaignDefaults({ appName: "FitLog", answers });
  assert.equal(perVideo.title, "FitLog creators");
  assert.deepEqual(
    [perVideo.baseEnabled, perVideo.payPerVideo, perVideo.monthlyCap, perVideo.cpmEnabled],
    [true, "25", "100", false],
  );
  const perView = campaignDefaults({ appName: "x", answers: { ...answers, pay: "per_view", budget: "100_500" } });
  assert.deepEqual([perView.cpm, perView.maxPerVideo, perView.monthlyCap, perView.baseEnabled], ["2", "100", "500", false]);
  const share = campaignDefaults({ appName: "x", answers: { ...answers, budget: "0" } });
  assert.deepEqual([share.revshareEnabled, share.baseEnabled, share.payPerVideo, share.monthlyCap], [true, false, "", ""]);
});

test("every dashboard page belongs to the right section", () => {
  const at = (path) => [locate(path).section?.id, locate(path).page?.label];
  assert.deepEqual(at("/dashboard/brand"), ["week", "This week"]);
  assert.deepEqual(at("/dashboard/brand/board"), ["creators", "Board"]);
  assert.deepEqual(at("/dashboard/brand/messages/abc"), ["creators", "Messages"]);
  assert.deepEqual(at("/dashboard/brand/programs"), ["results", "Overview"]);
  assert.deepEqual(at("/dashboard/brand/programs/123"), ["results", "Overview"]);
  assert.deepEqual(at("/dashboard/brand/programs/payouts"), ["payouts", "Payouts"]);
  assert.deepEqual(at("/dashboard/brand/programs/videos"), ["results", "Videos"]);
  assert.deepEqual(at("/dashboard/brand/settings/billing"), [undefined, undefined]);
});
