import Link from "next/link";
import ViralFonts from "@/components/viral/ViralFonts";
import ViralNavbar from "@/components/viral/ViralNavbar";
import ViralFooter from "@/components/viral/ViralFooter";

// Plain form posting to a route handler that redirects back — works with no
// client JS. Deliberately kept out of the search index: this page exists to be
// used, not to rank.
export const metadata = {
  title: "Remove your profile | JriveContent",
  description: "Remove your TikTok profile from the JriveContent creator directory.",
  robots: { index: false, follow: true },
};

const MESSAGES = {
  done: {
    tone: "ok",
    text: "Done — that profile has been removed from the directory and won't be added back.",
  },
  invalid: {
    tone: "bad",
    text: "That doesn't look like a TikTok username. Try just the @handle, e.g. @yourname.",
  },
  error: {
    tone: "bad",
    text: "Something went wrong on our end. Please try again, or email us and we'll remove it manually.",
  },
};

export default function OptOutPage({ searchParams }) {
  const status = MESSAGES[searchParams?.status];

  return (
    <ViralFonts>
      <main className="min-h-screen bg-brand-mist/40 text-brand-ink [color-scheme:light]">
        <ViralNavbar />

        <section className="mx-auto max-w-xl px-4 py-16">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Remove your profile
          </h1>
          <p className="mt-4 text-slate-600">
            Our creator directory lists public TikTok profiles. If yours is
            there and you&apos;d rather it wasn&apos;t, enter your handle below
            and we&apos;ll remove it. No account needed, and we won&apos;t add
            it back.
          </p>

          {status && (
            <p
              className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                status.tone === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {status.text}
            </p>
          )}

          <form
            method="post"
            action="/api/discovery/opt-out"
            className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <label className="block">
              <span className="text-sm font-medium text-brand-ink">
                Your TikTok handle
              </span>
              <input
                type="text"
                name="username"
                required
                placeholder="@yourname"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-brand-ink outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
              <span className="mt-1 block text-xs text-slate-500">
                A full profile URL works too.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-brand-ink">
                Anything you want us to know{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <textarea
                name="reason"
                rows={3}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-brand-ink outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-full bg-brand-ink px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Remove my profile
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/creators" className="underline hover:text-slate-700">
              Back to the directory
            </Link>
          </p>
        </section>

        <ViralFooter />
      </main>
    </ViralFonts>
  );
}
