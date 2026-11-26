// Where someone is in their week. Pure (scripts/test-week.mjs).

const DAY_MS = 86400000;

export const taskKey = (day, index) => `${day}-${index}`;

export function allTasks(week) {
  return week.flatMap((d) => d.tasks.map((text, i) => ({ key: taskKey(d.day, i), day: d.day, text })));
}

export const isTaskKey = (week, key) => allTasks(week).some((t) => t.key === key);

// Day 1 is the day they first opened the page.
export function weekDay(startedAt, now = new Date()) {
  const elapsed = Math.floor((now - new Date(startedAt)) / DAY_MS);
  return Math.min(7, Math.max(1, elapsed + 1));
}

export const weekOver = (startedAt, now = new Date()) => now - new Date(startedAt) >= 7 * DAY_MS;

// The one thing to do: the oldest unfinished task that is due, otherwise the
// next one coming up. Null when everything is ticked.
export function nextTask(week, done, day) {
  const left = allTasks(week).filter((t) => !done.includes(t.key));
  return left.find((t) => t.day <= day) || left[0] || null;
}
