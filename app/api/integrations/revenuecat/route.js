// GET   /api/integrations/revenuecat  → the brand's RevenueCat setup
//                                       (created on first call)
// PATCH /api/integrations/revenuecat  { storeTakehomeRate } → update
//
// Brand-only. Returns the webhook URL and Authorization value to paste into
// RevenueCat, the connection status, and each rev-share creator's code.
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/stripe/server";
import { ensureCodesForBrand } from "@/lib/earnings/codes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireBrand() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: brand } = await admin
    .from("brand_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!brand) return { error: NextResponse.json({ error: "Brands only." }, { status: 403 }) };
  return { user, admin };
}

function present(integration, codes, creators) {
  return {
    id: integration.id,
    status: integration.status,
    lastEventAt: integration.last_event_at,
    storeTakehomeRate: Number(integration.store_takehome_rate),
    webhookUrl: `${siteUrl()}/api/integrations/revenuecat/${integration.id}`,
    authorizationHeader: `Bearer ${integration.webhook_secret}`,
    codes: Object.entries(codes).map(([creatorId, code]) => ({
      creatorId,
      code,
      name: creators[creatorId] || null,
    })),
  };
}

async function creatorNames(admin, creatorIds) {
  if (!creatorIds.length) return {};
  const { data } = await admin
    .from("creator_profiles")
    .select("user_id, display_name, tiktok_handle")
    .in("user_id", creatorIds);
  return Object.fromEntries(
    (data || []).map((c) => [c.user_id, c.display_name || (c.tiktok_handle ? `@${c.tiktok_handle}` : null)]),
  );
}

export async function GET() {
  const { user, admin, error } = await requireBrand();
  if (error) return error;

  let { data: integration } = await admin
    .from("brand_integrations")
    .select("*")
    .eq("brand_id", user.id)
    .eq("provider", "revenuecat")
    .maybeSingle();

  if (!integration) {
    const { data: created, error: insertErr } = await admin
      .from("brand_integrations")
      .insert({
        brand_id: user.id,
        provider: "revenuecat",
        webhook_secret: randomBytes(24).toString("base64url"),
      })
      .select("*")
      .maybeSingle();
    if (insertErr && insertErr.code !== "23505") {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    integration =
      created ||
      (
        await admin
          .from("brand_integrations")
          .select("*")
          .eq("brand_id", user.id)
          .eq("provider", "revenuecat")
          .maybeSingle()
      ).data;
  }

  const codes = await ensureCodesForBrand(admin, user.id);
  const names = await creatorNames(admin, Object.keys(codes));
  return NextResponse.json(present(integration, codes, names));
}

export async function PATCH(request) {
  const { user, admin, error } = await requireBrand();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const rate = Number(body.storeTakehomeRate);
  if (!(rate > 0 && rate <= 1)) {
    return NextResponse.json({ error: "Take-home rate must be between 0 and 1." }, { status: 400 });
  }

  const { error: updateErr } = await admin
    .from("brand_integrations")
    .update({ store_takehome_rate: rate })
    .eq("brand_id", user.id)
    .eq("provider", "revenuecat");
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
