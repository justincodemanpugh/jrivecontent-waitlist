// Billing-period math for Programs, shared by the brand UI and the
// payout-cycle cron.
//
// Everything is computed in UTC. This matters: the browser runs in the
// brand's local timezone while a Vercel cron runs in UTC, and a payout row is
// matched to a period by exact timestamp equality on both endpoints. If the
// two disagreed by a timezone offset, the cron's row would never match the
// period the UI is showing and "Fund payout" would appear alongside an
// already-created payout.
//
// Periods are half-open: [start, end). A video counts toward a period when
// start <= posted_at < end.
//
// `payout_schedule` (weekly | biweekly | monthly) drives the period length —
// it is the field named for this job. `period_type` only governs how the
// video target is phrased ("4 videos / month") and is not used here.

const DAY_MS = 86400000;

function startOfUtcDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

// Monday 00:00:00 UTC of the week containing `date`.
function startOfUtcWeek(date) {
  const day = startOfUtcDay(date);
  const diffToMonday = (day.getUTCDay() + 6) % 7; // 0 = Sunday -> 6
  return new Date(day.getTime() - diffToMonday * DAY_MS);
}

// Biweekly has no calendar anchor, so periods are counted forward from the
// Monday of the week the program was created. Without a fixed anchor the
// boundaries would drift depending on when you happened to ask.
function biweeklyPeriodContaining(date, createdAt) {
  const anchor = startOfUtcWeek(createdAt ? new Date(createdAt) : date);
  const elapsed = startOfUtcWeek(date).getTime() - anchor.getTime();
  const periodIndex = Math.floor(elapsed / (14 * DAY_MS));
  const start = new Date(anchor.getTime() + periodIndex * 14 * DAY_MS);
  return { start, end: new Date(start.getTime() + 14 * DAY_MS) };
}

// The period containing `now`.
export function currentPeriod(program, now = new Date()) {
  const schedule = program?.payoutSchedule || program?.payout_schedule || "monthly";
  const createdAt = program?.createdAt || program?.created_at || null;

  if (schedule === "weekly") {
    const start = startOfUtcWeek(now);
    return { start, end: new Date(start.getTime() + 7 * DAY_MS) };
  }

  if (schedule === "biweekly") {
    return biweeklyPeriodContaining(now, createdAt);
  }

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

// The period immediately before the one containing `now` — i.e. the most
// recently closed period, which is what the payout cron bills for.
export function previousPeriod(program, now = new Date()) {
  const { start } = currentPeriod(program, now);
  // One millisecond before the current period opened is inside the previous
  // one, whatever its length. Works across month lengths and year boundaries.
  return currentPeriod(program, new Date(start.getTime() - 1));
}

// Human-readable label, e.g. "Mar 3 – Mar 10".
export function formatPeriod({ start, end }) {
  const fmt = (d) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  // `end` is exclusive; show the last day actually included.
  return `${fmt(start)} – ${fmt(new Date(end.getTime() - DAY_MS))}`;
}
