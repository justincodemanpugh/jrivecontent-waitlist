"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Film, ExternalLink, Check, X } from "lucide-react";
import { fetchProgramVideos, reviewProgramVideo } from "@/lib/dashboard/brand/programsApi";
import VideoThumb, { videoLabel } from "./VideoThumb";

function formatCompact(n) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n || 0,
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VideosView() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [reviewing, setReviewing] = useState(null);

  const review = async (video, decision) => {
    if (
      decision === "reject" &&
      !confirm("Reject this video? Anything it earned that hasn't been paid yet is cancelled.")
    ) {
      return;
    }
    setReviewing(video.id);
    try {
      await reviewProgramVideo(video.id, decision);
      setVideos((rows) =>
        rows.map((r) =>
          r.id === video.id
            ? { ...r, reviewStatus: decision === "approve" ? "approved" : "rejected", flaggedReason: null }
            : r,
        ),
      );
    } catch (e) {
      alert(e.message || "Could not review video.");
    } finally {
      setReviewing(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchProgramVideos()
      .then((rows) => {
        if (!cancelled) setVideos(rows);
      })
      .catch((e) => {
        if (!cancelled) setErr(e.message || "Couldn't load videos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{err}</p>;
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-tint text-accent mb-3">
          <Film size={20} />
        </span>
        <h2 className="text-lg font-semibold text-ink">No videos tracked yet</h2>
        <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
          Once your campaign creators connect TikTok and post, their videos and
          performance metrics appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden">
      <p className="border-b border-line px-5 py-3 text-xs text-muted">
        Creators earn nothing from a video until you approve it. Approve the ones about your app.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Video</th>
              <th className="px-5 py-3 font-medium">Campaign</th>
              <th className="px-5 py-3 font-medium">Posted</th>
              <th className="px-5 py-3 font-medium text-right">Views</th>
              <th className="px-5 py-3 font-medium text-right">Likes</th>
              <th className="px-5 py-3 font-medium text-right">Comments</th>
              <th className="px-5 py-3 font-medium text-right">Shares</th>
              <th className="px-5 py-3 font-medium">Review</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {videos.map((v) => (
              <tr key={v.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 max-w-[320px]">
                  <div className="flex items-center gap-2.5">
                    <VideoThumb
                      coverImageUrl={v.coverImageUrl}
                      creatorAvatarUrl={v.creatorAvatarUrl}
                      creatorName={v.creatorName}
                    />
                    <span className="min-w-0">
                      <span
                        className="block font-medium text-ink truncate"
                        title={v.caption || undefined}
                      >
                        {videoLabel(v)}
                      </span>
                      <span className="block text-xs text-muted truncate">
                        {v.creatorName}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/dashboard/brand/programs/${v.programId}`}
                    className="text-accent hover:underline"
                  >
                    {v.programTitle}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted whitespace-nowrap">
                  {formatDate(v.postedAt)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-ink">
                  {formatCompact(v.views)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {formatCompact(v.likes)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {formatCompact(v.comments)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-muted">
                  {formatCompact(v.shares)}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <ReviewCell video={v} busy={reviewing === v.id} onReview={review} />
                </td>
                <td className="px-5 py-3 text-right">
                  {v.videoUrl && (
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-faint hover:text-accent transition inline-flex"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


const REVIEW_BADGES = {
  approved: { cls: "bg-success-soft text-success", label: "Approved" },
  rejected: { cls: "bg-danger-soft text-danger", label: "Rejected" },
  flagged: { cls: "bg-warn-soft text-warn", label: "Flagged" },
  pending: { cls: "bg-surface-hover text-muted", label: "Pending" },
};

// Pending and flagged videos (views that look bought) get approve/reject
// buttons. Neither earns anything until the brand approves it.
function ReviewCell({ video, busy, onReview }) {
  if (!video.earnsPay) {
    return <span className="text-xs text-faint" title="Posted before this creator joined the campaign">Before campaign</span>;
  }
  const badge = REVIEW_BADGES[video.reviewStatus] || REVIEW_BADGES.pending;
  const needsAction = video.reviewStatus === "pending" || video.reviewStatus === "flagged";
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}
        title={video.flaggedReason === "low_engagement" ? "Very few likes for its views; views may be bought" : undefined}
      >
        {badge.label}
      </span>
      {busy ? (
        <Loader2 size={14} className="animate-spin text-faint" />
      ) : (
        <>
          {needsAction && (
            <button
              onClick={() => onReview(video, "approve")}
              title="Approve: earns base pay and CPM"
              className="h-6 w-6 rounded-full flex items-center justify-center text-success hover:bg-success-soft transition"
            >
              <Check size={13} />
            </button>
          )}
          {video.reviewStatus !== "rejected" && (
            <button
              onClick={() => onReview(video, "reject")}
              title="Reject: this video earns nothing"
              className="h-6 w-6 rounded-full flex items-center justify-center text-faint hover:text-danger hover:bg-danger-soft transition"
            >
              <X size={13} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
