"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, ExternalLink, Loader2 } from "lucide-react";
import CopyButton from "@/components/dashboard/brand/board/CopyButton";
import { allTasks, nextTask, taskKey } from "@/lib/week/progress";
import { formatCount } from "@/lib/discovery/directory";

const money = (cents) => `$${(cents / 100).toFixed(2)}`;

async function api(method, body) {
  const res = await fetch("/api/week", {
    method,
    cache: "no-store",
    ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "We couldn't load your week.");
  return data;
}

// Answers one question: what do I do today?
export default function WeekView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await api("GET"));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (key, done) => {
    setError("");
    const before = data.done;
    // Tick straight away; put it back if saving fails.
    setData((d) => ({ ...d, done: done ? [...d.done, key] : d.done.filter((k) => k !== key) }));
    try {
      await api("POST", { task: key, done });
    } catch (e) {
      setData((d) => ({ ...d, done: before }));
      setError(e.message);
    }
  };

  const restart = async () => {
    try {
      await api("POST", { restart: true });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!data) {
    return error ? (
      <Empty title="Something went wrong" body={error}>
        <button type="button" onClick={load} className={BUTTON}>
          Try again
        </button>
      </Empty>
    ) : (
      <div className="flex justify-center py-24 text-faint">
        <Loader2 size={24} className="animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (data.locked) {
    return (
      <Empty title="Unlock your week" body="Your daily tasks, creators and numbers are part of the paid plan.">
        <Link href="/plan" className={BUTTON}>
          See my plan
        </Link>
      </Empty>
    );
  }

  if (!data.saved) {
    return (
      <Empty title="Make your plan" body="Paste your app link and answer a few questions. It takes about a minute.">
        <Link href="/start" className={BUTTON}>
          Get my plan
        </Link>
      </Empty>
    );
  }

  const next = nextTask(data.week, data.done, data.day);
  const total = allTasks(data.week).length;
  const doneCount = allTasks(data.week).filter((t) => data.done.includes(t.key)).length;
  const n = data.numbers;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">This week</h1>
        <p className="mt-1 text-sm text-muted">
          {data.appName} · Day {data.day} of 7 · Goal: {data.goalLabel}
        </p>
      </header>

      {n.toReview > 0 && (
        <Link
          href="/dashboard/brand/programs/videos"
          className="flex items-center gap-3 rounded-2xl border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn"
        >
          <AlertCircle size={18} className="shrink-0" />
          <span>
            {n.toReview} {n.toReview === 1 ? "video is" : "videos are"} waiting for you. Creators earn nothing until
            you approve them.
          </span>
        </Link>
      )}

      <section className="rounded-3xl border border-accent-soft/60 bg-accent-tint p-6">
        {next ? (
          <>
            <p className="text-sm font-semibold text-muted">
              {next.day < data.day ? `Still to do from day ${next.day}` : next.day > data.day ? "Get ahead" : "Today"}
            </p>
            <p className="mt-1 text-xl font-semibold text-ink md:text-2xl">{next.text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => toggle(next.key, true)} className={BUTTON}>
                <Check size={16} /> Done
              </button>
              <CopyButton text={data.message.join("\n")} label="Copy message" />
              <CopyButton
                text={data.brief.map((s) => `${s.heading}\n${s.lines.join("\n")}`).join("\n\n")}
                label="Copy brief"
              />
            </div>
          </>
        ) : (
          <p className="text-xl font-semibold text-ink">Everything on this week&apos;s list is done.</p>
        )}
        {(data.over || !next) && (
          <button type="button" onClick={restart} className="mt-4 text-sm font-semibold text-ink underline underline-offset-4">
            Start the week again
          </button>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="sr-only">Your numbers</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Stat
            label="Creators messaged"
            value={n.messaged}
            hint={n.toMessage ? `${n.toMessage} to go` : null}
            href="/dashboard/brand/board"
          />
          <Stat label="Approved videos" value={n.videos} href="/dashboard/brand/programs/videos" />
          <Stat label="Views on them" value={formatCount(n.views)} href="/dashboard/brand/programs" />
          <Stat
            label="Paying users"
            value={n.paying ?? "—"}
            hint={n.paying === null ? "Connect RevenueCat" : "from creators"}
            // RevenueCat is connected from a campaign's page; the per-creator
            // list is on Results.
            href={n.paying === null ? "/dashboard/brand/programs/manage" : "/dashboard/brand/programs"}
          />
          <Stat label="Owed to creators" value={money(n.owedCents)} href="/dashboard/brand/programs/payouts" />
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold text-ink">Checklist</h2>
          <span className="text-sm text-muted">
            {doneCount} of {total} done
          </span>
        </div>
        <ol className="mt-3 space-y-2">
          {data.week.map((d) => (
            <li
              key={d.day}
              className={`flex gap-4 rounded-2xl border bg-surface p-4 ${
                d.day === data.day ? "border-ink" : "border-line"
              }`}
            >
              <span className="w-12 shrink-0 text-sm font-semibold text-ink">Day {d.day}</span>
              {d.tasks.length ? (
                <ul className="flex-1 space-y-2">
                  {d.tasks.map((text, i) => {
                    const key = taskKey(d.day, i);
                    const done = data.done.includes(key);
                    return (
                      <li key={key}>
                        <label className="flex cursor-pointer items-start gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={done}
                            onChange={(e) => toggle(key, e.target.checked)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong"
                          />
                          <span className={done ? "text-faint line-through" : "text-ink-soft"}>{text}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <span className="text-sm text-muted">Rest day</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {data.videos.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-ink">Videos to recreate</h2>
          <ul className="mt-3 space-y-2">
            {data.videos.map((v, i) => (
              <li key={v.url} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-ink">
                    Video {i + 1} · {formatCount(v.views)} views
                  </span>
                  {v.caption && <span className="block truncate text-muted">{v.caption}</span>}
                </span>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-ink underline underline-offset-4"
                >
                  Watch <ExternalLink size={14} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const BUTTON =
  "inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-ink/90";

function Stat({ label, value, hint, href }) {
  return (
    <Link href={href} className="rounded-2xl border border-line bg-surface p-4 transition hover:border-accent-soft">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </Link>
  );
}

function Empty({ title, body, children }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
