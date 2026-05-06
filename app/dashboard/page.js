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

  if (!user) redirect("/login");

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

  // Hint passed from /login when the user explicitly chose a role on a fresh
  // sign-in. Honoured only if there's no existing profile of the *other* type.
  const hint = searchParams?.role;

  if (brand?.onboarded_at) redirect("/dashboard/brand");
  if (creator?.onboarded_at) redirect("/dashboard/creator");

  if (brand) redirect("/onboarding/brand");
  if (creator) redirect("/onboarding/creator");

  if (hint === "creator") redirect("/onboarding/creator");
  redirect("/onboarding/brand");
}
