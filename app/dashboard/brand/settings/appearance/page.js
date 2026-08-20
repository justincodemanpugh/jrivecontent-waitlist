import ThemeToggle from "@/components/dashboard/ThemeToggle";

export default function BrandSettingsAppearancePage() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
        Appearance
      </h2>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-sm font-medium text-ink">Theme</p>
        <p className="mt-1 text-sm text-muted">
          Choose how the dashboard looks. System follows your device setting.
        </p>
        <div className="mt-4">
          <ThemeToggle />
        </div>
      </div>
    </section>
  );
}
