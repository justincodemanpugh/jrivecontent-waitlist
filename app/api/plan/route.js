// The signed-in founder's saved plan (/plan).
//
//   GET                                   → their latest plan
//   POST { url, niche, appName, answers } → build it, save it, return it
//
// Either way the answer is { saved, locked, plan, ... }. Without a
// subscription `plan` is the free preview (lib/plan/preview.js).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
import { brandHasActiveSubscription } from "@/lib/billing/subscription";
import { customerTrialState } from "@/lib/billing/trial";
import { CREATOR_NICHES } from "@/lib/onboarding/creatorConstants";
import { scanApp, normalizeAppUrl } from "@/lib/vibecode/appScan";
import { matchForPlan } from "@/lib/vibecode/matchCreators";
import { normalizeAnswers } from "@/lib/plan/questions";
import { shortAppName } from "@/lib/plan/templates";
import { buildPlan, toFullPlan, toPlanTeaser } from "@/lib/plan/preview";
import { storablePlan } from "@/lib/plan/saved";
import { latestPlan, stillAvailable } from "@/lib/plan/stored";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const signInRequired = () => NextResponse.json({ error: "Sign in required." }, { status: 401 });

function failure(e) {
  console.error("[plan]", e);
  return NextResponse.json(
    { error: "We couldn't load your plan. Try again in a minute." },
    { status: 500 },
  );
}

async function respond({ supabase, admin, user, row }) {
  const plan = await stillAvailable(admin, row.plan);
  const unlocked = await brandHasActiveSubscription(supabase, user.id);
  const body = {
    saved: true,
    appUrl: row.app_url,
    app: { name: row.app_name, iconUrl: row.icon_url },
    // Enough to rebuild the plan or start the onboarding from where it was.
    niche: row.niche,
    answers: row.answers,
    locked: !unlocked,
    plan: unlocked ? toFullPlan(plan) : toPlanTeaser(plan),
  };

  if (!unlocked) {
    const { data: brand } = await admin
      .from("brand_profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    try {
      const state = await customerTrialState(stripe, brand?.stripe_customer_id);
      body.trialEligible = state.trialEligible;
      // Paid, but Stripe's webhook hasn't reached us yet.
      body.confirming = state.live;
    } catch (e) {
      console.error("[plan] could not check Stripe", e);
      body.trialEligible = null;
    }
  }
  return NextResponse.json(body);
}

export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return signInRequired();

    const admin = createAdminClient();
    const row = await latestPlan(admin, user.id);
    if (!row) return NextResponse.json({ saved: false });

    return await respond({ supabase, admin, user, row });
  } catch (e) {
    return failure(e);
  }
}

const sameAnswers = (a, b) => Object.keys(b).every((k) => a?.[k] === b[k]);

export async function POST(request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) return signInRequired();

    const body = await request.json().catch(() => ({}));
    const answers = normalizeAnswers(body?.answers);
    const niche = CREATOR_NICHES.includes(body?.niche) ? body.niche : null;
    if (!answers || !niche) {
      return NextResponse.json({ error: "Answer every question first." }, { status: 400 });
    }
    const input = String(body?.url || "").trim().slice(0, 500);
    let appUrl;
    try {
      appUrl = normalizeAppUrl(input);
    } catch (e) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    const requestedName = typeof body.appName === "string" ? body.appName.slice(0, 80).trim() : "";

    const admin = createAdminClient();
    const { data: existing, error: readError } = await admin
      .from("brand_plans")
      .select("*")
      .eq("user_id", user.id)
      .eq("app_url", appUrl)
      .maybeSingle();
    if (readError) throw readError;

    // Nothing changed (a reload, or the same link twice): keep the plan they
    // have, so its videos and creators don't move under them.
    if (
      existing &&
      existing.niche === niche &&
      sameAnswers(existing.answers, answers) &&
      (!requestedName || shortAppName(requestedName) === existing.plan.appName)
    ) {
      return await respond({ supabase, admin, user, row: existing });
    }

    // Name and icon come from the listing. A page that can't be read now
    // still gets a plan under the name they typed.
    let app;
    try {
      app = await scanApp(input);
    } catch (e) {
      console.warn("[plan] could not read the app listing", e.message);
      app = { name: requestedName || existing?.app_name || "", iconUrl: null };
    }

    const plan = storablePlan(
      buildPlan({
        app,
        appName: requestedName,
        niche,
        answers,
        matches: await matchForPlan(admin, { nicheTags: [niche] }),
      }),
    );

    const { data: row, error: writeError } = await admin
      .from("brand_plans")
      .upsert(
        {
          user_id: user.id,
          app_url: appUrl,
          app_name: app.name || plan.appName,
          icon_url: app.iconUrl || null,
          niche,
          answers,
          plan,
          // A rebuilt plan has different tasks, so the week starts over.
          done_tasks: [],
          week_started_at: null,
        },
        { onConflict: "user_id,app_url" },
      )
      .select("*")
      .single();
    if (writeError) throw writeError;

    return await respond({ supabase, admin, user, row });
  } catch (e) {
    return failure(e);
  }
}
