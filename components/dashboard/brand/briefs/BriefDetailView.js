"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  DollarSign,
  Clock,
  Share2,
  Video,
  CheckCircle2,
  AlertCircle,
  Play,
  Lock,
} from "lucide-react";
import {
  fetchBriefById,
  fundBriefEscrow,
  approveBriefSubmission,
  requestBriefChanges,
  getBriefSubmissionUrl,
  briefPlatformLabel,
} from "@/lib/dashboard/brand/briefsApi";

function formatMoney(cents) {
  if (cents == null) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BriefDetailView({ briefId }) {
  const searchParams = useSearchParams();
  const depositResult = searchParams?.get("deposit");

  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    if (!briefId) return;
    setErr("");
    try {
      const data = await fetchBriefById(briefId);
      setBrief(data);
    } catch (e) {
      setErr(e.message || "Couldn't load this brief.");
    } finally {
      setLoading(false);
    }
  }, [briefId]);

  useEffect(() => {
    reload();
    const refresh = () => reload();
    window.addEventListener("briefs:changed", refresh);
    return () => window.removeEventListener("briefs:changed", refresh);
  }, [reload]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err}
        </p>
      </div>
    );
  }

  if (!brief) return null;

  const recipients = brief.recipients || [];
  const readyForReview = recipients.filter(
    (r) => r.submissionStoragePath && r.reviewStatus === "pending",
  );
  const payCents = brief.payPerCreator
    ? Math.round(Number(brief.payPerCreator) * 100)
    : 0;

  const platformLabel = briefPlatformLabel(brief.platform);

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Deposit result banner */}
      {depositResult === "success" && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <p className="text-sm text-emerald-700">
            Escrow funded. The creator can now see their payment is secured and
            upload their video.
          </p>
        </div>
      )}
      {depositResult === "cancel" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-amber-600" />
          <p className="text-sm text-amber-700">
            Deposit canceled. You can fund escrow any time below.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">
              {brief.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
              {brief.instructions || "No instructions provided."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {payCents > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <DollarSign size={15} />
              {formatMoney(payCents)} per creator
            </span>
          )}
          {platformLabel && (
            <span className="flex items-center gap-1.5">
              <Share2 size={15} />
              {platformLabel}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Video size={15} />
            {brief.exampleVideos.length} example
            {brief.exampleVideos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* No-price warning */}
      {payCents <= 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 mt-0.5" />
          <p className="text-sm text-amber-700">
            This brief has no payment set, so you can&apos;t fund escrow.
            Creators can still post proof links, but escrow protection requires
            a payment amount.
          </p>
        </div>
      )}

      {/* Videos Ready for Review */}
      {readyForReview.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
            <Play size={16} className="text-brand-skyDeep" />
            Videos Ready for Review ({readyForReview.length})
          </h2>
          <div className="space-y-3">
            {readyForReview.map((r) => (
              <RecipientCard
                key={r.id}
                recipient={r}
                payCents={payCents}
                onChanged={reload}
                defaultOpen
              />
            ))}
          </div>
        </section>
      )}

      {/* All creators */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-brand-ink">
          Creators ({recipients.length})
        </h2>
        <div className="space-y-3">
          {recipients.map((r) => (
            <RecipientCard
              key={r.id}
              recipient={r}
              payCents={payCents}
              onChanged={reload}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/brand/briefs"
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-ink transition"
    >
      <ArrowLeft size={15} />
      Back to briefs
    </Link>
  );
}

function EscrowBadge({ recipient }) {
  const { escrowStatus, reviewStatus } = recipient;

  if (reviewStatus === "approved" || escrowStatus === "released") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium">
        <CheckCircle2 size={12} />
        Approved &amp; Paid
      </span>
    );
  }
  if (escrowStatus === "escrowed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-mist text-brand-skyDeep px-2.5 py-1 text-xs font-medium">
        <ShieldCheck size={12} />
        In Escrow
      </span>
    );
  }
  if (escrowStatus === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-medium">
        <Clock size={12} />
        Awaiting payment
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-500 px-2.5 py-1 text-xs font-medium">
      <Lock size={12} />
      Not funded
    </span>
  );
}

function RecipientCard({ recipient, payCents, onChanged, defaultOpen = false }) {
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState("");

  const platformFee = Math.round(payCents * 0.15);
  const creatorGets = payCents - platformFee;

  const handleFund = async () => {
    setError("");
    setFunding(true);
    try {
      const url = await fundBriefEscrow(recipient.id);
      window.location.href = url;
    } catch (e) {
      setError(e.message || "Could not start deposit.");
      setFunding(false);
    }
  };

  const hasSubmission = !!recipient.submissionStoragePath;
  const isApproved = recipient.reviewStatus === "approved";
  const canFund =
    payCents > 0 &&
    (recipient.escrowStatus === "none" || recipient.escrowStatus === "pending") &&
    !isApproved;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar recipient={recipient} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-ink truncate">
              {recipient.name}
            </p>
            {recipient.handle && (
              <p className="text-xs text-slate-500 truncate">
                @{recipient.handle}
              </p>
            )}
          </div>
        </div>
        <EscrowBadge recipient={recipient} />
      </div>

      {/* Fund escrow */}
      {canFund && (
        <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-sm text-slate-600">
            Secure {formatMoney(payCents)} in escrow for this creator. They&apos;ll
            see a <span className="font-medium">Payment Secured</span> badge and
            can upload their video.
          </p>
          <div className="mt-2 text-xs text-slate-500 space-y-0.5">
            <div className="flex justify-between">
              <span>Creator receives</span>
              <span>{formatMoney(creatorGets)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee (15%)</span>
              <span>{formatMoney(platformFee)}</span>
            </div>
          </div>
          {error && (
            <p className="mt-2 text-xs text-rose-600">{error}</p>
          )}
          <button
            onClick={handleFund}
            disabled={funding}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-5 py-2.5 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
          >
            {funding ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <ShieldCheck size={15} />
            )}
            {recipient.escrowStatus === "pending"
              ? "Complete deposit"
              : `Deposit ${formatMoney(payCents)} into escrow`}
          </button>
        </div>
      )}

      {/* Escrowed, waiting for upload */}
      {recipient.escrowStatus === "escrowed" && !hasSubmission && (
        <p className="mt-4 text-sm text-slate-500 flex items-center gap-2">
          <Clock size={15} className="text-slate-400" />
          Payment secured. Waiting for {recipient.name} to upload their video.
        </p>
      )}

      {/* Submission + review */}
      {hasSubmission && (
        <SubmissionReview
          recipient={recipient}
          onChanged={onChanged}
          defaultOpen={defaultOpen}
        />
      )}

      {/* Changes requested */}
      {recipient.reviewStatus === "changes_requested" && (
        <p className="mt-3 text-xs text-amber-600">
          You requested changes. Waiting for a new upload.
        </p>
      )}
    </div>
  );
}

function SubmissionReview({ recipient, onChanged, defaultOpen }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(true);
  const [open, setOpen] = useState(defaultOpen);
  const [approving, setApproving] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [savingChanges, setSavingChanges] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = await getBriefSubmissionUrl(recipient.submissionStoragePath);
        if (!cancelled) setVideoUrl(url);
      } catch {
        // ignore — show fallback
      } finally {
        if (!cancelled) setLoadingUrl(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipient.submissionStoragePath]);

  const isApproved = recipient.reviewStatus === "approved";

  const handleApprove = async () => {
    setError("");
    setApproving(true);
    try {
      const res = await approveBriefSubmission(recipient.id);
      setDone(
        res.pendingCreatorOnboarding
          ? "Approved. Payout will arrive once the creator connects their payout account."
          : "Approved and payment released to the creator.",
      );
      onChanged?.();
    } catch (e) {
      setError(e.message || "Could not approve.");
    } finally {
      setApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    setError("");
    setSavingChanges(true);
    try {
      await requestBriefChanges(recipient.id, feedback);
      setShowChanges(false);
      onChanged?.();
    } catch (e) {
      setError(e.message || "Could not save feedback.");
    } finally {
      setSavingChanges(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Video */}
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
        {loadingUrl ? (
          <div className="aspect-video flex items-center justify-center text-slate-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full aspect-video bg-black"
            preload={open ? "metadata" : "none"}
          />
        ) : (
          <div className="aspect-video flex items-center justify-center text-slate-400 text-sm">
            Could not load video.
          </div>
        )}
      </div>

      {recipient.submissionUploadedAt && (
        <p className="text-xs text-slate-400">
          Uploaded{" "}
          {new Date(recipient.submissionUploadedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
      {done && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle2 size={13} />
          {done}
        </p>
      )}

      {/* Actions */}
      {!isApproved && !done && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {approving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            Approve &amp; Release Payment
          </button>
          <button
            onClick={() => setShowChanges((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 text-slate-600 px-5 py-2.5 text-sm font-medium hover:bg-slate-50 transition"
          >
            Request Changes
          </button>
        </div>
      )}

      {/* Request changes form */}
      {showChanges && !isApproved && (
        <div className="rounded-xl border border-slate-200 p-3 space-y-2">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="What needs to change? (optional)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleRequestChanges}
              disabled={savingChanges}
              className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
            >
              {savingChanges ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Send request
            </button>
            <button
              onClick={() => setShowChanges(false)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ recipient }) {
  if (recipient.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={recipient.avatarUrl}
        alt={recipient.name}
        className="h-10 w-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span className="h-10 w-10 rounded-full bg-brand-mist text-brand-skyDeep flex items-center justify-center text-sm font-semibold flex-shrink-0">
      {recipient.name?.slice(0, 2).toUpperCase() || "?"}
    </span>
  );
}
