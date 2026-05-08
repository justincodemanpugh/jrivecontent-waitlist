"use client";

import { useState } from "react";
import { Lock, ShieldCheck, Loader2 } from "lucide-react";

/**
 * Banner that lives at the top of a MessageThread.
 *
 * Brand:
 *   - Not deposited -> "Deposit $X" button -> Stripe Checkout.
 *   - Deposited      -> "Funds in escrow. Released on approval."
 *
 * Creator:
 *   - Not deposited -> "Waiting for brand to deposit $X."
 *   - Deposited      -> "Brand deposited $X — you can submit videos."
 */
export default function PaymentBanner({ conversation, role }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const price = Number(conversation?.gig?.pay_per_video || 0);
  const deposited = !!conversation?.payment_deposited;
  const status = conversation?.payment?.status;

  const handleDeposit = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Couldn't start checkout.");
      window.location.href = json.url;
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  if (!price) return null;

  // ----- Deposited states -----
  if (deposited) {
    if (status === "released") {
      return (
        <Wrap tone="emerald">
          <ShieldCheck size={16} />
          <span>Payment released to creator. Project complete.</span>
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
      <Wrap tone="emerald">
        <ShieldCheck size={16} />
        <span>
          ${price.toFixed(2)} held in escrow.{" "}
          {role === "creator"
            ? "Submit videos when ready."
            : "Released to creator on approval."}
        </span>
      </Wrap>
    );
  }

  // ----- Not deposited -----
  if (role === "brand") {
    return (
      <Wrap tone="amber">
        <Lock size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            Deposit <strong>${price.toFixed(2)}</strong> to unlock video
            submissions. Held in escrow until you approve.
          </p>
          {err ? <p className="mt-1 text-xs text-rose-700">{err}</p> : null}
        </div>
        <button
          type="button"
          onClick={handleDeposit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : null}
          Deposit ${price.toFixed(2)}
        </button>
      </Wrap>
    );
  }

  return (
    <Wrap tone="amber">
      <Lock size={16} />
      <span>Waiting for brand to deposit ${price.toFixed(2)} into escrow.</span>
    </Wrap>
  );
}

function Wrap({ tone, children }) {
  const tones = {
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  return (
    <div
      className={`mx-4 mt-3 rounded-xl border px-3 py-2 text-sm flex items-center gap-2 ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
