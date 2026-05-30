import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Brand & creator step labels — kept in sync with the step_key values
// emitted by lib/onboarding/analytics.js.
const BRAND_STEPS = [
  { idx: 0, key: "brand_name", label: "1. Brand name" },
  { idx: 1, key: "industry", label: "2. Industry" },
  { idx: 2, key: "brand_stage", label: "3. Brand stage" },
  { idx: 3, key: "monthly_budget", label: "4. Monthly budget" },
  { idx: 4, key: "content_needs", label: "5. Content needs" },
  { idx: 5, key: "referral_terms", label: "6. Referral + Terms" },
];

const CREATOR_STEPS = [
  { idx: 0, key: "display_name", label: "1. Display name" },
  { idx: 1, key: "handle", label: "2. Handle" },
  { idx: 2, key: "niches", label: "3. Niches" },
  { idx: 3, key: "content_types", label: "4. Content types" },
  { idx: 4, key: "bio", label: "5. Bio" },
  { idx: 5, key: "cover_photo", label: "6. Cover photo" },
  { idx: 6, key: "socials_terms", label: "7. Socials + Terms" },
  { idx: 7, key: "stripe_connect", label: "8. Stripe Connect" },
];

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" },
];

export default async function AdminOnboardingPage({ searchParams }) {

  const rangeParam = searchParams?.range || "30";
  const sinceIso = rangeToIso(rangeParam);

  const supabase = createAdminClient();

  // Pull all relevant events in the window. Onboarding flows are short,
  // event volume is tiny; aggregating in JS keeps the SQL trivial.
  let query = supabase
    .from("onboarding_events")
    .select("user_id, role, event, step_index, created_at")
    .in("event", [
      "onboarding_started",
      "step_viewed",
      "step_completed",
      "step_skipped",
      "onboarding_completed",
    ]);
  if (sinceIso) query = query.gte("created_at", sinceIso);
  const { data: events, error } = await query.limit(50000);

  if (error) {
    return (
      <Shell range={rangeParam}>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Could not load events: {error.message}
        </div>
      </Shell>
    );
  }

  const brand = buildFunnel(events || [], "brand", BRAND_STEPS);
  const creator = buildFunnel(events || [], "creator", CREATOR_STEPS);

  return (
    <Shell range={rangeParam}>
      <FunnelCard
        title="Brand onboarding"
        steps={BRAND_STEPS}
        funnel={brand}
        accent="bg-brand-skyDeep"
      />
      <FunnelCard
        title="Creator onboarding"
        steps={CREATOR_STEPS}
        funnel={creator}
        accent="bg-emerald-500"
      />
    </Shell>
  );
}

function Shell({ range, children }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/dashboard"
            className="text-xs font-medium text-slate-500 hover:text-brand-ink"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-brand-ink">
            Onboarding funnel
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Distinct users reaching each step, with drop-off vs the previous
            step.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <label
            htmlFor="range"
            className="text-xs font-medium uppercase tracking-wide text-slate-500"
          >
            Range
          </label>
          <select
            id="range"
            name="range"
            defaultValue={range}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-brand-ink px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}

function FunnelCard({ title, steps, funnel, accent }) {
  const started = funnel.startedUsers;
  const completed = funnel.completedUsers;
  const completionRate = started === 0 ? 0 : (completed / started) * 100;
  const maxAtStep = Math.max(started, ...funnel.rows.map((r) => r.users), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-ink">{title}</h2>
          <p className="text-xs text-slate-500">
            {funnel.totalEvents.toLocaleString()} events in range
          </p>
        </div>
        <div className="flex gap-4 text-right">
          <Stat label="Started" value={started} />
          <Stat label="Completed" value={completed} />
          <Stat
            label="Conversion"
            value={`${completionRate.toFixed(1)}%`}
          />
        </div>
      </header>

      <div className="space-y-2">
        {/* Anchor row: anyone who emitted any onboarding event */}
        <FunnelRow
          label="Started onboarding"
          users={started}
          max={maxAtStep}
          accent={accent}
          dropFromPrev={null}
        />
        {funnel.rows.map((row, i) => {
          const prev = i === 0 ? started : funnel.rows[i - 1].users;
          const drop = prev === 0 ? 0 : ((prev - row.users) / prev) * 100;
          return (
            <FunnelRow
              key={row.key}
              label={steps[i].label}
              users={row.users}
              completed={row.completed}
              skipped={row.skipped}
              max={maxAtStep}
              accent={accent}
              dropFromPrev={drop}
            />
          );
        })}
        <FunnelRow
          label="Onboarding completed"
          users={completed}
          max={maxAtStep}
          accent="bg-emerald-600"
          dropFromPrev={
            funnel.rows.length
              ? funnel.rows[funnel.rows.length - 1].users === 0
                ? 0
                : ((funnel.rows[funnel.rows.length - 1].users - completed) /
                    funnel.rows[funnel.rows.length - 1].users) *
                  100
              : null
          }
        />
      </div>
    </section>
  );
}

function FunnelRow({ label, users, completed, skipped, max, accent, dropFromPrev }) {
  const pct = max === 0 ? 0 : (users / max) * 100;
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
      <div className="col-span-4 text-sm font-medium text-brand-ink">
        {label}
      </div>
      <div className="col-span-5">
        <div className="h-3 w-full rounded-full bg-slate-200">
          <div
            className={`h-3 rounded-full ${accent}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="col-span-2 text-right text-sm font-semibold tabular-nums text-brand-ink">
        {users.toLocaleString()}
        {(completed != null || skipped != null) && (
          <div className="text-[10px] font-normal uppercase tracking-wide text-slate-400">
            {completed != null && (
              <span className="mr-2">✓ {completed}</span>
            )}
            {skipped != null && skipped > 0 && (
              <span>skip {skipped}</span>
            )}
          </div>
        )}
      </div>
      <div className="col-span-1 text-right text-xs font-medium tabular-nums">
        {dropFromPrev == null ? (
          <span className="text-slate-300">—</span>
        ) : dropFromPrev <= 0 ? (
          <span className="text-emerald-600">0%</span>
        ) : (
          <span className="text-rose-600">-{dropFromPrev.toFixed(0)}%</span>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="text-lg font-semibold tabular-nums text-brand-ink">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

function rangeToIso(range) {
  if (!range || range === "all") return null;
  const days = parseInt(range, 10);
  if (!Number.isFinite(days) || days <= 0) return null;
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

// Returns:
//   {
//     totalEvents,
//     startedUsers,            // distinct users with any event
//     completedUsers,          // distinct users who fired onboarding_completed
//     rows: [{ key, users, completed, skipped }, …]  // one per step index
//   }
function buildFunnel(events, role, steps) {
  const filtered = events.filter((e) => e.role === role);
  const startedSet = new Set();
  const completedSet = new Set();
  // step_index -> Set(user_id) for viewed/completed/skipped
  const viewed = new Map();
  const completedAtStep = new Map();
  const skippedAtStep = new Map();

  for (const e of filtered) {
    if (!e.user_id) continue;
    startedSet.add(e.user_id);
    if (e.event === "onboarding_completed") {
      completedSet.add(e.user_id);
      continue;
    }
    const idx = e.step_index;
    if (typeof idx !== "number") continue;
    if (e.event === "step_viewed" || e.event === "onboarding_started") {
      if (!viewed.has(idx)) viewed.set(idx, new Set());
      viewed.get(idx).add(e.user_id);
    } else if (e.event === "step_completed") {
      if (!completedAtStep.has(idx)) completedAtStep.set(idx, new Set());
      completedAtStep.get(idx).add(e.user_id);
    } else if (e.event === "step_skipped") {
      if (!skippedAtStep.has(idx)) skippedAtStep.set(idx, new Set());
      skippedAtStep.get(idx).add(e.user_id);
    }
  }

  const rows = steps.map((s) => ({
    key: s.key,
    users: viewed.get(s.idx)?.size || 0,
    completed: completedAtStep.get(s.idx)?.size || 0,
    skipped: skippedAtStep.get(s.idx)?.size || 0,
  }));

  return {
    totalEvents: filtered.length,
    startedUsers: startedSet.size,
    completedUsers: completedSet.size,
    rows,
  };
}
