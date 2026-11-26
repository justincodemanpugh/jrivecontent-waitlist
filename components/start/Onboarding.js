"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight, Banknote, CalendarCheck, Check, ChevronLeft, CircleDollarSign,
  Coins, Eye, FileText, Gift, Hammer, HelpCircle, ListChecks, Loader2,
  MessageCircle, Moon, Percent, PlaySquare, Send, Store, TrendingUp, UserPlus,
  Users, Video, Wallet,
} from "lucide-react";
import Logo from "@/components/Logo";
import PlanPreview from "./PlanPreview";
import { QUESTIONS, normalizeAnswers } from "@/lib/plan/questions";
import { shortAppName } from "@/lib/plan/templates";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";
import { rememberScan } from "@/lib/vibecode/lastScan";

// One screen at a time: link → confirm app → questions → plan. Progress is
// kept in this browser so a refresh, or coming back after signing up, lands on
// the same place.

const SCREENS = ["link", "confirm", "stage", "goal", "info", "posted", "pay", "budget", "plan"];
const STORAGE_KEY = "jrive:start";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const ICONS = {
  stage: { building: Hammer, no_users: Store, few_users: Users, paying: CircleDollarSign },
  goal: { 10: UserPlus, 100: Users, paying: TrendingUp },
  posted: { not_yet: Moon, a_little: MessageCircle, regularly: CalendarCheck },
  pay: { per_view: Eye, per_video: Video, rev_share: Percent, not_sure: HelpCircle },
  budget: { 0: Gift, under_100: Coins, "100_500": Wallet, "500_plus": Banknote },
};

const YOU_GET = [
  [PlaySquare, "3 videos to recreate"],
  [Users, "5 creators"],
  [Send, "A message to send them"],
  [FileText, "A short brief"],
  [ListChecks, "What to post this week"],
];

const EMPTY = { url: "", app: null, niche: "", appName: "", answers: {}, screen: "link" };

function load() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!saved?.url || !SCREENS.includes(saved.screen)) return null;
    if (Date.now() - saved.at > MAX_AGE_MS) return null;
    return saved;
  } catch {
    return null;
  }
}

function save(state) {
  try {
    if (!state.url) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, at: Date.now() }));
  } catch {
    // Storage unavailable: a refresh starts over.
  }
}

async function scan(body) {
  const res = await fetch("/api/vibecode/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Something went wrong. Try again in a minute.");
  return data;
}

export default function Onboarding() {
  const params = useSearchParams();
  const [state, setState] = useState(EMPTY);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [ready, setReady] = useState(false);
  // Bumped on every request and on Back, so a slow response can't move
  // someone who has since gone elsewhere.
  const runId = useRef(0);

  const lookup = useCallback(async (url) => {
    const id = ++runId.current;
    setBusy(true);
    setError("");
    setLink(url);
    try {
      const data = await scan({ url, stage: "app" });
      if (id !== runId.current) return;
      rememberScan(url);
      setResult(null);
      setState({
        ...EMPTY,
        url,
        app: data.app,
        niche: data.niches?.[0] || CREATOR_NICHES[0],
        appName: shortAppName(data.app?.name),
        screen: "confirm",
      });
    } catch (e) {
      if (id !== runId.current) return;
      setError(e.message);
      setState((s) => ({ ...s, screen: "link" }));
    } finally {
      if (id === runId.current) setBusy(false);
    }
  }, []);

  const buildPlan = useCallback(async ({ url, niche, appName, answers }) => {
    const id = ++runId.current;
    setError("");
    setResult(null);
    try {
      const data = await scan({ url, niche, appName, answers });
      if (id === runId.current) setResult(data);
    } catch (e) {
      if (id === runId.current) setError(e.message);
    }
  }, []);

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const fromQuery = params.get("app")?.trim();
    const saved = load();
    if (saved && (!fromQuery || fromQuery === saved.url)) {
      const complete = normalizeAnswers(saved.answers);
      const screen = saved.screen === "plan" && !complete ? "stage" : saved.screen;
      setState({ ...saved, screen });
      setLink(saved.url);
      if (screen === "plan") buildPlan(saved);
    } else if (fromQuery) {
      lookup(fromQuery);
    }
    setReady(true);
  }, [params, lookup, buildPlan]);

  useEffect(() => {
    if (ready) save(state);
  }, [ready, state]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.screen]);

  const go = (screen, patch) => {
    setError("");
    setState((s) => ({ ...s, ...patch, screen }));
  };
  const next = (patch) => go(SCREENS[SCREENS.indexOf(state.screen) + 1], patch);
  const back = () => {
    runId.current += 1;
    setBusy(false);
    go(SCREENS[SCREENS.indexOf(state.screen) - 1]);
  };

  const answer = (questionId, value) => {
    const answers = { ...state.answers, [questionId]: value };
    next({ answers });
    if (questionId === QUESTIONS[QUESTIONS.length - 1].id) buildPlan({ ...state, answers });
  };

  const startOver = () => {
    runId.current += 1;
    setBusy(false);
    setResult(null);
    setError("");
    setLink("");
    setState(EMPTY);
  };

  const { screen } = state;
  const progress = (SCREENS.indexOf(screen) / (SCREENS.length - 1)) * 100;
  const question = QUESTIONS.find((q) => q.id === screen);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6">
      <header className="relative flex items-center justify-center">
        {screen !== "link" && (
          <button
            type="button"
            onClick={back}
            aria-label="Back"
            className="absolute left-0 rounded-full p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <Logo size={32} />
          JriveContent
        </Link>
      </header>

      <div
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="mt-6 h-1 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-brand-ink transition-all duration-300"
          style={{ width: `${Math.max(progress, 6)}%` }}
        />
      </div>

      {screen === "link" && (
        <Screen title="Paste your app link" subtitle="App Store or website. We'll build your creator plan from it.">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (link.trim()) lookup(link.trim());
              else setError("Paste a link to your app first.");
            }}
            className="mx-auto max-w-md"
          >
            <label htmlFor="start-link" className="sr-only">
              Your app&apos;s App Store or web link
            </label>
            <input
              id="start-link"
              type="text"
              inputMode="url"
              autoFocus
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="yourapp.com or App Store link"
              className={INPUT}
            />
            <ErrorNote>{error}</ErrorNote>
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Reading your app
                </>
              ) : (
                <>
                  Continue <ArrowRight size={18} />
                </>
              )}
            </PrimaryButton>
          </form>
        </Screen>
      )}

      {screen === "confirm" && (
        <Screen title="Is this your app?">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next({ appName: state.appName.trim() || shortAppName(state.app?.name) });
            }}
            className="mx-auto max-w-md space-y-4"
          >
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
              {state.app?.iconUrl ? (
                // Arbitrary remote artwork, so it stays outside next/image.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={state.app.iconUrl} alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-brand-mist object-cover" />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-2xl bg-brand-mist" />
              )}
              <p className="min-w-0 break-words font-semibold">{state.app?.name}</p>
            </div>

            <label className="block text-sm font-medium text-slate-600">
              What should we call it?
              <input
                type="text"
                maxLength={40}
                value={state.appName}
                onChange={(e) => setState((s) => ({ ...s, appName: e.target.value }))}
                className={`${INPUT} mt-1`}
              />
            </label>

            <label className="block text-sm font-medium text-slate-600">
              Which niche is it?
              <select
                value={state.niche}
                onChange={(e) => setState((s) => ({ ...s, niche: e.target.value }))}
                className={`${INPUT} mt-1`}
              >
                {CREATOR_NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <PrimaryButton type="submit">
              Yes, that&apos;s it <ArrowRight size={18} />
            </PrimaryButton>
            <button type="button" onClick={startOver} className="block w-full py-2 text-sm text-slate-500 hover:text-brand-ink">
              Not your app? Try another link
            </button>
          </form>
        </Screen>
      )}

      {question && (
        <Screen title={question.title}>
          <div className="mx-auto max-w-md space-y-3">
            {question.options.map((o) => {
              const Icon = ICONS[question.id][o.value];
              const selected = state.answers[question.id] === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => answer(question.id, o.value)}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-3 text-left text-lg transition hover:border-brand-ink ${
                    selected ? "border-brand-ink" : "border-slate-200"
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-mist text-brand-ink">
                    <Icon size={20} />
                  </span>
                  <span className="flex-1">{o.label}</span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      selected ? "border-brand-ink bg-brand-ink text-white" : "border-slate-300"
                    }`}
                  >
                    {selected && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </Screen>
      )}

      {screen === "info" && (
        <Screen title="Here's what you'll get" subtitle="Three more questions first.">
          <div className="mx-auto max-w-md">
            <ul className="space-y-3">
              {YOU_GET.map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-3 text-lg">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-mist">
                    <Icon size={20} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <PrimaryButton onClick={() => next()}>
              Continue <ArrowRight size={18} />
            </PrimaryButton>
          </div>
        </Screen>
      )}

      {screen === "plan" &&
        (result?.plan ? (
          <PlanPreview data={result} appUrl={state.url} onStartOver={startOver} />
        ) : error ? (
          <Screen title="We couldn't build your plan">
            <div className="mx-auto max-w-md">
              <ErrorNote>{error}</ErrorNote>
              <PrimaryButton onClick={() => buildPlan(state)}>Try again</PrimaryButton>
              <button type="button" onClick={startOver} className="block w-full py-3 text-sm text-slate-500 hover:text-brand-ink">
                Start over
              </button>
            </div>
          </Screen>
        ) : (
          <Screen title="Building your plan" subtitle={`Finding videos and creators in ${state.niche}…`}>
            <Loader2 size={32} className="mx-auto animate-spin text-brand-skyDeep" aria-label="Loading" />
          </Screen>
        ))}
    </div>
  );
}

const INPUT =
  "block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-brand-ink placeholder:text-slate-400 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-sky/40";

function Screen({ title, subtitle, children }) {
  return (
    <section className="pt-10 sm:pt-14">
      <h1 className="mx-auto max-w-xl text-center font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="mx-auto mt-3 max-w-md text-center text-slate-500">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function PrimaryButton({ type = "button", children, ...props }) {
  return (
    <button
      type={type}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      {...props}
    >
      {children}
    </button>
  );
}

function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {children}
    </p>
  );
}
