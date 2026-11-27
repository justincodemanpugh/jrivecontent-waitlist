// The link box. A plain form, so it works before any JavaScript loads: it
// opens /start?app=<link>, which reads the app and starts the questions.
export default function LinkBox({ id = "app-link" }) {
  return (
    <form action="/start" method="get" className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row">
      <label htmlFor={id} className="sr-only">
        Your app&apos;s App Store or web link
      </label>
      <input
        id={id}
        name="app"
        type="text"
        inputMode="url"
        required
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="yourapp.com or App Store link"
        className="w-full flex-1 rounded-full border border-slate-300 bg-white px-6 py-4 text-base text-brand-ink placeholder:text-slate-400 focus:border-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-sky/40"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-brand-ink px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
      >
        Get my plan
      </button>
    </form>
  );
}
