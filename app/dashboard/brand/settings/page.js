import { redirect } from "next/navigation";

// /settings has no standalone content — send users to the Profile tab,
// which is the default landing for the tabbed settings layout.
export default function BrandSettingsIndex() {
  redirect("/dashboard/brand/settings/profile");
}
