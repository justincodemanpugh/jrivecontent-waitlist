import TopBar from "@/components/dashboard/brand/TopBar";
import SettingsTabs from "@/components/dashboard/brand/settings/SettingsTabs";

export const metadata = {
  title: "Settings — JriveContent",
};

export default function BrandSettingsLayout({ children }) {
  return (
    <>
      <TopBar title="Settings" />
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage your account preferences, billing, and brand profile.
          </p>
        </div>

        <SettingsTabs />

        <div className="pt-2">{children}</div>
      </main>
    </>
  );
}
