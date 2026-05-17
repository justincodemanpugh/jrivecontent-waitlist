import { createClient } from "@/lib/supabase/server";
import BillingPanel from "@/components/dashboard/brand/settings/BillingPanel";

export const dynamic = "force-dynamic";

export default async function BrandSettingsBillingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select(
      "stripe_account_id, stripe_payouts_enabled, stripe_charges_enabled, stripe_details_submitted, country",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <BillingPanel
      connect={{
        stripe_account_id: profile?.stripe_account_id || null,
        stripe_payouts_enabled: !!profile?.stripe_payouts_enabled,
        stripe_charges_enabled: !!profile?.stripe_charges_enabled,
        stripe_details_submitted: !!profile?.stripe_details_submitted,
        country: profile?.country || null,
      }}
    />
  );
}
