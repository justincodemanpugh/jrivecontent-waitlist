"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2, Building2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMagicLink } from "../login/actions";

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const errorParam = searchParams.get("error");

  const inferredRole = roleParam === "creator" ? "creator" : "brand";

  const [role, setRole] = useState(inferredRole);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(
    errorParam ? decodeURIComponent(errorParam) : "",
  );

  // Route through /dashboard with a role hint rather than straight to
  // /onboarding/{role}. The dashboard router already knows how to interpret
  // the `role` query param for fresh sign-ups, and this means the role is
  // encoded in the URL itself — so even if the cookie fallback fails (e.g.
  // the magic link is opened in a different browser), the role survives as
  // long as Supabase preserves the `next` query param. If even that gets
  // stripped, the dashboard router will at least show a clearer error than
  // dropping the user into the wrong onboarding flow.
  const next = `/dashboard?role=${role}`;

  const callbackUrl = (() => {
    if (typeof window === "undefined") return "";
    const url = new URL("/auth/callback", window.location.origin);
    url.searchParams.set("next", next);
    return url.toString();
  })();

  const signUpWithGoogle = async () => {
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const signUpWithEmail = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return;
    setLoading(true);
    const formData = new FormData();
    formData.set("email", email.trim());
    formData.set("next", next);
    const result = await sendMagicLink(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-brand-mist/40 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-slate-500 hover:text-brand-ink"
          >
            ← Back to home
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-brand-ink">
            Create your JriveContent account
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Free to join. No credit card required.
          </p>
        </div>

        {!sent && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              I&apos;m signing up as a
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("brand")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  role === "brand"
                    ? "border-brand-skyDeep bg-brand-mist text-brand-ink"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building2 size={16} />
                Brand
              </button>
              <button
                type="button"
                onClick={() => setRole("creator")}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  role === "creator"
                    ? "border-brand-skyDeep bg-brand-mist text-brand-ink"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Sparkles size={16} />
                Creator
              </button>
            </div>
          </div>
        )}

        {sent ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} />
              Check your inbox
            </div>
            <p className="mt-1 text-emerald-700">
              We sent a magic link to{" "}
              <span className="font-medium">{email}</span>. Click it to finish
              creating your account.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={signUpWithGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              or
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={signUpWithEmail} className="space-y-3">
              <label className="block text-sm font-medium text-brand-ink">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-brand-ink placeholder-slate-400 focus:border-brand-skyDeep focus:outline-none focus:ring-2 focus:ring-brand-sky/30"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                Email me a magic link
              </button>
            </form>
          </>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-brand-skyDeep hover:text-brand-ink"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41 35.6 44 30.3 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
