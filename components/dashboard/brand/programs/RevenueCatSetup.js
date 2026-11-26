"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Plug, CheckCircle2, ChevronDown } from "lucide-react";
import { updateRevenueCatTakehome } from "@/lib/dashboard/brand/programsApi";

// The prompt a vibecoder pastes into Cursor / Claude / Lovable to add the
// creator-code field. Keep the attribute name in sync with
// CREATOR_CODE_ATTRIBUTE in lib/earnings/revenuecat.js.
const AI_PROMPT = `Add an optional "Have a creator code?" text field to my app's onboarding flow, shown before the paywall.

When the user submits a code:
1. Trim it and convert it to UPPERCASE.
2. Save it to RevenueCat as the subscriber attribute "creator_code" using the RevenueCat SDK already in the app:
   - Swift: Purchases.shared.attribution.setAttributes(["creator_code": code])
   - React Native / Expo: Purchases.setAttributes({ creator_code: code })
   - Flutter: Purchases.setAttributes({"creator_code": code})
3. Make sure this runs before the user can start a purchase.

Keep the field optional (a "Skip" button is fine) and don't change anything else.`;

const SNIPPETS = {
  Swift: `Purchases.shared.attribution.setAttributes(["creator_code": code.uppercased()])`,
  "React Native": `await Purchases.setAttributes({ creator_code: code.toUpperCase() });`,
  Flutter: `await Purchases.setAttributes({"creator_code": code.toUpperCase()});`,
};

function CopyField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context); the text is selectable.
    }
  };
  return (
    <div>
      {label && <span className="block text-xs text-muted mb-1">{label}</span>}
      <div className="flex items-stretch gap-2">
        <code
          className={`flex-1 min-w-0 truncate rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink ${
            mono ? "font-mono" : ""
          }`}
          title={value}
        >
          {value}
        </code>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-lg border border-line px-3 text-xs font-medium text-muted hover:text-ink hover:bg-surface-hover transition flex-shrink-0"
        >
          {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function RevenueCatSetup({ integration, onChanged }) {
  const [expanded, setExpanded] = useState(null);
  const [snippet, setSnippet] = useState("Swift");
  const [promptCopied, setPromptCopied] = useState(false);
  const [savingRate, setSavingRate] = useState(false);

  if (!integration) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5 flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" />
        Loading rev share setup…
      </div>
    );
  }

  const connected = integration.status === "connected";
  const open = expanded ?? !connected;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const changeRate = async (rate) => {
    setSavingRate(true);
    try {
      await updateRevenueCatTakehome(rate);
      onChanged?.();
    } finally {
      setSavingRate(false);
    }
  };

  return (
    <section className="rounded-2xl border border-line bg-surface">
      <button
        onClick={() => setExpanded(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-tint text-accent">
            <Plug size={16} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Rev share tracking (RevenueCat)</span>
            <span className="block text-xs text-muted">
              {connected
                ? `Connected · last event ${integration.lastEventAt ? new Date(integration.lastEventAt).toLocaleString() : "—"}`
                : "Not connected yet: creators can't earn rev share until this is set up."}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          {connected ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
              <CheckCircle2 size={12} /> Connected
            </span>
          ) : (
            <span className="rounded-full bg-warn-soft px-2.5 py-1 text-xs font-medium text-warn">
              Setup needed
            </span>
          )}
          <ChevronDown size={16} className={`text-faint transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="border-t border-line p-5 space-y-6">
          <Step n={1} title="Send RevenueCat events to us">
            <p className="text-xs text-muted mb-3">
              In RevenueCat go to <b>Integrations → Webhooks → Add</b>, and paste these two values.
              Leave the environment on Production.
            </p>
            <div className="space-y-2">
              <CopyField label="Webhook URL" value={integration.webhookUrl} />
              <CopyField label="Authorization header value" value={integration.authorizationHeader} />
            </div>
          </Step>

          <Step n={2} title="Add a creator code field to your app">
            <p className="text-xs text-muted mb-3">
              Creators tell viewers to enter their code. Paste this prompt into Cursor, Claude Code
              or Lovable and it will add the field for you (about 5 minutes).
            </p>
            <button
              onClick={copyPrompt}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink text-on-accent px-4 py-2 text-xs font-medium hover:bg-ink/90 transition"
            >
              {promptCopied ? <Check size={13} /> : <Copy size={13} />}
              {promptCopied ? "Prompt copied" : "Copy AI prompt"}
            </button>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted hover:text-ink">
                Or add it by hand
              </summary>
              <div className="mt-2 flex gap-1">
                {Object.keys(SNIPPETS).map((k) => (
                  <button
                    key={k}
                    onClick={() => setSnippet(k)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      snippet === k ? "bg-ink text-on-accent" : "bg-surface-hover text-muted"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <CopyField value={SNIPPETS[snippet]} />
              </div>
            </details>
          </Step>

          <Step n={3} title="Send a test event" done={connected}>
            <p className="text-xs text-muted">
              In the RevenueCat webhook you just added, click <b>Send test event</b>. This card
              switches to Connected as soon as we receive it (refresh the page).
            </p>
          </Step>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-sunken border border-line px-4 py-3">
            <span className="text-xs text-muted">
              Rev share is calculated on what you keep after the store&apos;s cut.
            </span>
            <select
              value={String(integration.storeTakehomeRate)}
              disabled={savingRate}
              onChange={(e) => changeRate(Number(e.target.value))}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink"
            >
              <option value="0.85">You keep 85% (Small Business Program)</option>
              <option value="0.7">You keep 70% (standard)</option>
            </select>
          </div>

          {integration.codes?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-faint uppercase tracking-wide mb-2">Creator codes</p>
              <div className="flex flex-wrap gap-2">
                {integration.codes.map((c) => (
                  <span
                    key={c.creatorId}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-muted"
                  >
                    {c.name || "Creator"}
                    <b className="font-mono text-ink">{c.code}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-faint">
            Only purchases from people who typed a code are counted, so rev share undercounts the
            sales a creator actually drives. Pair it with base pay or CPM so creators are paid for
            reach too.
          </p>
        </div>
      )}
    </section>
  );
}

function Step({ n, title, done, children }) {
  return (
    <div className="flex gap-3">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          done ? "bg-success-soft text-success" : "bg-accent-tint text-accent"
        }`}
      >
        {done ? <Check size={12} /> : n}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink mb-1">{title}</p>
        {children}
      </div>
    </div>
  );
}
