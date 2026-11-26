"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { forgetInvite, rememberInvite } from "@/lib/board/pendingInvite";

export default function JoinInvite({ token, state: initial, brandName }) {
  const [state, setState] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Creator onboarding ends on the creator dashboard, which offers the way
  // back here.
  useEffect(() => {
    if (state === "needs_profile") rememberInvite(token);
    else forgetInvite();
  }, [state, token]);

  const accept = async () => {
    setBusy(true);
    setError("");
    const res = await fetch("/api/board/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) setState("joined");
    else setError(data?.error || "Something went wrong. Try again.");
  };

  const views = {
    ready: [
      `${brandName} wants to work with you`,
      "Accepting lets them invite you to a paid campaign. You see the pay before you join one.",
      <button key="a" type="button" onClick={accept} disabled={busy} className={BUTTON}>
        {busy ? "Accepting…" : "Accept invite"}
      </button>,
    ],
    needs_profile: [
      `${brandName} wants to work with you`,
      "Set up your creator profile first. We'll bring you back here after.",
      <Link key="a" href="/onboarding/creator" className={BUTTON}>
        Set up my profile
      </Link>,
    ],
    joined: [
      `You're connected with ${brandName}`,
      "Their campaign invite will show up on your dashboard.",
      <Link key="a" href="/dashboard/creator/programs" className={BUTTON}>
        Go to my dashboard
      </Link>,
    ],
    not_creator: [
      "This invite is for a creator",
      "Send this link to the creator. You're signed in with a brand account.",
      <Link key="a" href="/dashboard" className={BUTTON}>
        Go to my dashboard
      </Link>,
    ],
    invalid: [
      "This invite link no longer works",
      "It may have been used already. Ask the brand for a new one.",
      <Link key="a" href="/" className={BUTTON}>
        Go home
      </Link>,
    ],
  };
  const [title, body, action] = views[state] || views.invalid;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center text-brand-ink">
      <Logo size={40} />
      <h1 className="mt-6 max-w-md text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-md text-slate-600">{body}</p>
      <div className="mt-8">{action}</div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-rose-700">
          {error}
        </p>
      )}
    </main>
  );
}

const BUTTON =
  "inline-flex rounded-full bg-brand-ink px-8 py-4 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60";
