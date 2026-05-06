export default function StepShell({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-8">
      <header className="mb-6">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-brand-ink">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            {subtitle}
          </p>
        )}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
