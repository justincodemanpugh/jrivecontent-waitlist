"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Clock,
  Share2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  fetchAssignmentById,
  markAssignmentViewed,
  uploadAssignmentVideo,
  getAssignmentVideoUrl,
} from "@/lib/dashboard/creator/assignmentsApi";
import { briefPlatformLabel } from "@/lib/dashboard/brand/briefsApi";

function formatMoney(cents) {
  if (cents == null) return null;
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AssignmentDetailView({ recipientId }) {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    if (!recipientId) return;
    setErr("");
    try {
      const data = await fetchAssignmentById(recipientId);
      setAssignment(data);
    } catch (e) {
      setErr(e.message || "Couldn't load this assignment.");
    } finally {
      setLoading(false);
    }
  }, [recipientId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Mark viewed once on first load.
  useEffect(() => {
    if (recipientId) markAssignmentViewed(recipientId).catch(() => {});
  }, [recipientId]);

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

  if (!assignment) return null;

  const a = assignment;
  const isApproved = a.reviewStatus === "approved" || a.escrowStatus === "released";
  const isEscrowed = a.escrowStatus === "escrowed" || isApproved;
  const hasSubmission = !!a.submissionStoragePath;
  const payDisplay =
    formatMoney(a.payoutCents) ||
    (a.payPerCreator ? `$${Number(a.payPerCreator).toFixed(2)}` : null);

  const platformLabel = briefPlatformLabel(a.platform);

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Payment status banner */}
      {isApproved ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Approved &amp; Paid {payDisplay ? `· ${payDisplay}` : ""}
            </p>
            <p className="text-xs text-emerald-700">
              The brand approved your video and the payment has been released to
              your account.
            </p>
          </div>
        </div>
      ) : isEscrowed ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex items-center gap-3">
          <ShieldCheck size={22} className="text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              {payDisplay ? `${payDisplay} in Escrow` : "Payment Secured"} — Payment Secured
            </p>
            <p className="text-xs text-emerald-700">
              The brand has funded escrow. Upload your video below and you&apos;ll
              be paid as soon as they approve it.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4 flex items-center gap-3">
          <Lock size={22} className="text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Waiting for the brand to secure payment
            </p>
            <p className="text-xs text-slate-500">
              You&apos;ll be able to upload your video once {a.brandName} funds
              escrow. We&apos;ll keep your payment protected.
            </p>
          </div>
        </div>
      )}

      {/* Brief header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs text-slate-500">{a.brandName}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-brand-ink">
          {a.title}
        </h1>
        <p className="mt-3 text-sm text-slate-600 whitespace-pre-wrap">
          {a.instructions || "No instructions provided."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          {payDisplay && (
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <DollarSign size={15} />
              {payDisplay}
            </span>
          )}
          {platformLabel && (
            <span className="flex items-center gap-1.5">
              <Share2 size={15} />
              {platformLabel}
            </span>
          )}
        </div>
      </div>

      {/* Changes requested feedback */}
      {a.reviewStatus === "changes_requested" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <AlertCircle size={16} />
            The brand requested changes
          </p>
          {a.reviewFeedback && (
            <p className="mt-1 text-sm text-amber-700 whitespace-pre-wrap">
              {a.reviewFeedback}
            </p>
          )}
          <p className="mt-1 text-xs text-amber-700">
            Upload a new version below.
          </p>
        </div>
      )}

      {/* Upload / submission area */}
      <UploadSection
        assignment={a}
        canUpload={isEscrowed && !isApproved}
        hasSubmission={hasSubmission}
        onChanged={reload}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/creator/assignments"
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-ink transition"
    >
      <ArrowLeft size={15} />
      Back to assignments
    </Link>
  );
}

function UploadSection({ assignment, canUpload, hasSubmission, onChanged }) {
  const a = assignment;
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressName, setProgressName] = useState("");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(hasSubmission);

  useEffect(() => {
    let cancelled = false;
    if (!a.submissionStoragePath) {
      setVideoUrl(null);
      setLoadingUrl(false);
      return;
    }
    setLoadingUrl(true);
    (async () => {
      try {
        const url = await getAssignmentVideoUrl(a.submissionStoragePath);
        if (!cancelled) setVideoUrl(url);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingUrl(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [a.submissionStoragePath]);

  const doUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    setError("");
    setUploading(true);
    setProgressName(file.name);
    try {
      await uploadAssignmentVideo(a.id, file);
      onChanged?.();
    } catch (e) {
      setError(e.message || "Upload failed.");
    } finally {
      setUploading(false);
      setProgressName("");
    }
  };

  const isApproved = a.reviewStatus === "approved";

  // Locked state — escrow not funded yet.
  if (!canUpload && !hasSubmission) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3">
          <Lock size={20} />
        </span>
        <p className="text-sm font-medium text-slate-600">
          Upload unlocks once payment is secured
        </p>
        <p className="mt-1 text-xs text-slate-500">
          The brand needs to fund escrow before you submit your video.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-brand-ink flex items-center gap-2">
        <Video size={16} className="text-brand-skyDeep" />
        Your Video
      </h2>

      {/* Existing submission preview */}
      {hasSubmission && (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
          {loadingUrl ? (
            <div className="aspect-video flex items-center justify-center text-slate-400">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : videoUrl ? (
            <video src={videoUrl} controls className="w-full aspect-video bg-black" />
          ) : (
            <div className="aspect-video flex items-center justify-center text-slate-400 text-sm">
              Could not load video.
            </div>
          )}
        </div>
      )}

      {hasSubmission && a.submissionUploadedAt && (
        <p className="text-xs text-slate-400">
          Uploaded{" "}
          {new Date(a.submissionUploadedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
          {a.reviewStatus === "pending" && " · In review"}
        </p>
      )}

      {/* Approved — no more uploads */}
      {isApproved ? (
        <p className="text-sm text-emerald-600 flex items-center gap-1.5">
          <CheckCircle2 size={15} />
          This assignment is complete.
        </p>
      ) : a.reviewStatus === "pending" && hasSubmission ? (
        <p className="text-sm text-slate-500 flex items-center gap-1.5">
          <Clock size={15} className="text-slate-400" />
          Your video is in review. We&apos;ll notify you when the brand
          responds.
        </p>
      ) : canUpload ? (
        <>
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              doUpload(e.dataTransfer.files?.[0]);
            }}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${
              dragOver
                ? "border-brand-skyDeep bg-brand-mist/50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              onChange={(e) => doUpload(e.target.files?.[0])}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-brand-skyDeep">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-sm">Uploading {progressName}…</p>
              </div>
            ) : (
              <>
                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">
                  Drag &amp; drop your video or{" "}
                  <span className="text-brand-skyDeep font-medium">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {hasSubmission
                    ? "Uploading a new file replaces your current submission"
                    : "MP4, MOV, WebM up to 100MB"}
                </p>
              </>
            )}
          </div>
          {error && (
            <p className="text-xs text-rose-600 flex items-center gap-1">
              <X size={13} />
              {error}
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}
