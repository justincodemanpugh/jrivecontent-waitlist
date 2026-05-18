import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Post-login router. Decides whether the signed-in user should land on the
// brand or creator dashboard, or be sent into onboarding. The role is inferred
// from which `*_profiles` row exists for this user.
export default async function DashboardRouter({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  const [{ data: brand }, { data: creator }] = await Promise.all([
    supabase
      .from("brand_profiles")
      .select("onboarded_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("creator_profiles")
      .select("onboarded_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  // Hint passed from /signup when the user picked a role on a fresh account.
  // Prefer the query param (`?role=creator`) but fall back to the cookie that
  // `sendMagicLink` set, in case the magic-link round-trip dropped the param.
  const cookieStore = cookies();
  const cookieRole = cookieStore.get("signup_role")?.value;
  const hint = searchParams?.role || cookieRole;
  if (cookieRole) {
    cookieStore.set("signup_role", "", { path: "/", maxAge: 0 });
  }

  if (brand?.onboarded_at) redirect("/dashboard/brand");
  if (creator?.onboarded_at) redirect("/dashboard/creator");

  // Honour an explicit role hint from sign-in before falling back to whichever
  // partial profile row happens to exist. Without this, a stale/partial
  // brand_profiles row from an earlier attempt would silently send a user who
  // just signed up as a creator into brand onboarding.
  if (hint === "creator") redirect("/onboarding/creator");
  if (hint === "brand") redirect("/onboarding/brand");

  if (brand) redirect("/onboarding/brand");
  if (creator) redirect("/onboarding/creator");

  // No role signal at all (e.g. user hit /dashboard directly without coming
  // through /login). Send them back to pick a role rather than silently
  // defaulting to brand onboarding.
  redirect("/signup?error=please_select_a_role");
}
