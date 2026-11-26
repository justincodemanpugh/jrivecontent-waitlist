import { redirect } from "next/navigation";
import ViralFonts from "@/components/viral/ViralFonts";
import PlanPage from "@/components/plan/PlanPage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your plan — JriveContent",
  robots: { index: false },
};

export default async function Plan({ searchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sign up first, then come back here with the same inputs.
  if (!user) {
    const query = new URLSearchParams(
      Object.entries(searchParams || {}).filter(([, v]) => typeof v === "string"),
    ).toString();
    const next = query ? `/plan?${query}` : "/plan";
    redirect(`/signup?role=brand&next=${encodeURIComponent(next)}`);
  }

  const [{ data: brand }, { data: creator }] = await Promise.all([
    supabase.from("brand_profiles").select("user_id").eq("user_id", user.id).maybeSingle(),
    supabase.from("creator_profiles").select("onboarded_at").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <ViralFonts>
      <main className="min-h-screen bg-white text-brand-ink">
        <PlanPage email={user.email || ""} creatorOnly={!brand && Boolean(creator?.onboarded_at)} />
      </main>
    </ViralFonts>
  );
}
