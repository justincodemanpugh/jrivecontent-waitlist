"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Loader2,
  Plus,
  Minus,
  X,
  PackagePlus,
} from "lucide-react";

// Mirror of lib/stripe/server.js gross-up so we can show the brand the
// processing-fee surcharge before they click through to Stripe Checkout.
const STRIPE_FEE_PERCENT = 0.029;
const STRIPE_FEE_FIXED_CENTS = 30;
function processingFeeForDollars(subtotalDollars) {
  const subtotalCents = Math.round(subtotalDollars * 100);
  if (subtotalCents <= 0) return 0;
  const gross = Math.ceil(
    (subtotalCents + STRIPE_FEE_FIXED_CENTS) / (1 - STRIPE_FEE_PERCENT),
  );
  return (gross - subtotalCents) / 100;
}

/**
 * Banner that lives at the top of a MessageThread.
 *
 * Brand:
 *   - Not deposited -> quantity stepper + "Deposit $X" button.
 *   - Deposited      -> escrow + progress + "Request more videos" button.
 *
 * Creator:
 *   - Not deposited -> "Waiting for brand to deposit $X."
 *   - Deposited      -> "$X in escrow. Y of Z videos completed."
 */
export default function PaymentBanner({ conversation, role }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [errCode, setErrCode] = useState("");
  const [videoCount, setVideoCount] = useState(1);
  const [moreOpen, setMoreOpen] = useState(false);

  const perVideo = Number(conversation?.gig?.pay_per_video || 0);
  const deposited = !!conversation?.payment_deposited;
  const status = conversation?.payment?.status;
  const totalVideos = Math.max(
    1,
    Number(conversation?.total_videos_requested || 1),
  );
  const completed = Math.max(0, Number(conversation?.videos_completed || 0));
  const escrowDollars =
    Number(conversation?.payment?.amount_cents || 0) / 100 ||
    perVideo * totalVideos;

  const handleInitialDeposit = async () => {
    setBusy(true);
    setErr("");
    setErrCode("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          videoCount,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code) setErrCode(json.code);
        throw new Error(json.error || "Couldn't start checkout.");
      }
      window.location.href = json.url;
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (!perVideo) return null;

  // ----- Deposited states -----
  if (deposited) {
    if (status === "released") {
      return (
        <Wrap tone="emerald">
          <ShieldCheck size={16} />
          <span>
            Payment released to creator. Project complete ({completed} of{" "}
            {totalVideos} video{totalVideos > 1 ? "s" : ""}).
          </span>
        </Wrap>
      );
    }
    if (status === "released_pending") {
      return (
        <Wrap tone="amber">
          <ShieldCheck size={16} />
          <span>
            Approved. Waiting for creator to connect Stripe to receive payout.
          </span>
        </Wrap>
      );
    }
    return (
      <>
        <Wrap tone="emerald">
          <ShieldCheck size={16} />
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <strong>${escrowDollars.toFixed(2)}</strong> held in escrow.{" "}
              <span className="text-success/80">
                {completed} of {totalVideos} video{totalVideos > 1 ? "s" : ""}{" "}
                completed.
              </span>
            </p>
          </div>
          {role === "brand" ? (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-success-line bg-surface/60 px-2.5 py-1 text-xs font-semibold text-success hover:bg-surface"
            >
              <PackagePlus size={13} />
              Request more
            </button>
          ) : null}
        </Wrap>
        {moreOpen ? (
          <RequestMoreVideosDialog
            conversation={conversation}
            perVideo={perVideo}
            onClose={() => setMoreOpen(false)}
          />
        ) : null}
      </>
    );
  }

  // ----- Not deposited -----
  if (role === "brand") {
    const total = perVideo * videoCount;
    const processingFee = processingFeeForDollars(total);
    const grandTotal = total + processingFee;
    return (
      <Wrap tone="amber">
        <Lock size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            Deposit <strong>${total.toFixed(2)}</strong> to unlock video
            submissions. Held in escrow until you approve each video.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-warn/80">Videos:</span>
            <Stepper
              value={videoCount}
              min={1}
              max={50}
              onChange={setVideoCount}
            />
            <span className="text-xs text-warn/70">
              ${perVideo.toFixed(2)} × {videoCount} = ${total.toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-warn/70">
            + ${processingFee.toFixed(2)} payment processing fee · You'll be
            charged <strong>${grandTotal.toFixed(2)}</strong> at checkout.
          </p>
          {err ? (
            <p className="mt-1 text-xs text-danger">
              {err}
              {errCode === "brand_connect_required" ? (
                <>
                  {" "}
                  <Link
                    href="/dashboard/brand/settings/billing"
                    className="underline font-semibold"
                  >
                    Connect Stripe
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleInitialDeposit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-on-accent hover:bg-ink/90 disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : null}
          Deposit ${grandTotal.toFixed(2)}
        </button>
      </Wrap>
    );
  }

  return (
    <Wrap tone="amber">
      <Lock size={16} />
      <span>
        Waiting for brand to deposit ${perVideo.toFixed(2)}/video into escrow.
      </span>
    </Wrap>
  );
}

function Wrap({ tone, children }) {
  const tones = {
    amber: "bg-warn-soft border-warn-line text-warn",
    emerald: "bg-success-soft border-success-line text-success",
  };
  return (
    <div
      className={`mx-4 mt-3 rounded-xl border px-3 py-2 text-sm flex items-center gap-2 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="inline-flex items-center rounded-full border border-warn-line bg-surface">
      <button
        type="button"
        onClick={dec}
        className="h-7 w-7 inline-flex items-center justify-center text-warn hover:bg-warn-soft rounded-l-full disabled:opacity-40"
        disabled={value <= min}
        aria-label="Decrease"
      >
        <Minus size={12} />
      </button>
      <span className="min-w-[1.75rem] text-center text-xs font-semibold text-amber-950">
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        className="h-7 w-7 inline-flex items-center justify-center text-warn hover:bg-warn-soft rounded-r-full disabled:opacity-40"
        disabled={value >= max}
        aria-label="Increase"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

function RequestMoreVideosDialog({ conversation, perVideo, onClose }) {
  const [count, setCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const total = perVideo * count;
  const processingFee = processingFeeForDollars(total);
  const grandTotal = total + processingFee;
  const currentTotal = Math.max(
    1,
    Number(conversation?.total_videos_requested || 1),
  );

  const handleConfirm = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          additionalVideos: count,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't start checkout.");
      window.location.href = json.url;
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="text-base font-semibold text-ink">
            Request additional videos
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-surface-hover text-muted"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-muted">
            Add more videos to this gig. We'll charge for the new videos and
            top up the same escrow.
          </p>
          <div className="flex items-center justify-between rounded-xl bg-surface-sunken px-3 py-2.5">
            <span className="text-sm text-ink-soft">Additional videos</span>
            <Stepper
              value={count}
              min={1}
              max={50}
              onChange={setCount}
            />
          </div>
          <div className="rounded-xl border border-line px-3 py-2.5 text-sm">
            <Row label="Per video" value={`$${perVideo.toFixed(2)}`} />
            <Row label="Quantity" value={`× ${count}`} />
            <div className="my-2 border-t border-line" />
            <Row
              label="Additional deposit"
              value={`$${total.toFixed(2)}`}
            />
            <Row
              label="Payment processing fee"
              value={`$${processingFee.toFixed(2)}`}
            />
            <div className="my-2 border-t border-line" />
            <Row
              label="Charged today"
              value={`$${grandTotal.toFixed(2)}`}
              strong
            />
            <p className="mt-2 text-xs text-muted">
              New project total: {currentTotal + count} video
              {currentTotal + count > 1 ? "s" : ""}.
            </p>
          </div>
          {err ? (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
              {err}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-3 py-1.5 text-sm text-muted hover:bg-surface-hover disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-on-accent hover:bg-ink/90 disabled:opacity-60"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : null}
            Deposit ${grandTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={strong ? "text-ink font-semibold" : "text-muted"}>
        {label}
      </span>
      <span className={strong ? "text-ink font-semibold" : "text-ink-soft"}>
        {value}
      </span>
    </div>
  );
}
