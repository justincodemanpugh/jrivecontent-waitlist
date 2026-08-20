import DeleteAccountCard from "@/components/dashboard/DeleteAccountCard";

export const dynamic = "force-dynamic";

export default function BrandSettingsAccountPage() {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
        Danger zone
      </h2>
      <DeleteAccountCard role="brand" />
    </section>
  );
}
