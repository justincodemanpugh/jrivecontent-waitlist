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

  // Hint passed from /signup via the `?role=` query param (preserved through
  // the magic-link round-trip via `next={{ .RedirectTo }}` in the email
  // template).
  const hint = searchParams?.role;

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

  // No role signal at all — send to role picker (user is already authenticated).
  redirect("/choose-role");
}
