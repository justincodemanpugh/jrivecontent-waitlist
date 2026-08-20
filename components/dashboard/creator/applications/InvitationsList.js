"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Check, X } from "lucide-react";
import {
  fetchMyInvitations,
  acceptInvitation,
  declineInvitation,
} from "@/lib/dashboard/creator/invitationsApi";

const STATUS_META = {
  pending: { label: "New", classes: "bg-warn-soft text-warn border-warn-line" },
  accepted: { label: "Accepted", classes: "bg-success-soft text-success border-success-line" },
  declined: { label: "Declined", classes: "bg-surface-hover text-muted border-line" },
  cancelled: { label: "Cancelled", classes: "bg-surface-hover text-muted border-line" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function InvitationsList() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      const rows = await fetchMyInvitations();
      setItems(rows);
    } catch (e) {
      setErr(e.message || "Couldn't load invitations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refresh = () => load();
    if (typeof window !== "undefined") {
      window.addEventListener("invitations:changed", refresh);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("invitations:changed", refresh);
      }
    };
  }, []);

  async function handleAccept(inv) {
    setBusyId(inv.id);
    setErr("");
    try {
      const conversation = await acceptInvitation(inv);
      // Drop them straight into the conversation.
      router.push(`/dashboard/creator/messages/${conversation.id}`);
    } catch (e) {
      setErr(e.message || "Couldn't accept invitation.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(inv) {
    setBusyId(inv.id);
    setErr("");
    try {
      await declineInvitation(inv.id);
      await load();
    } catch (e) {
      setErr(e.message || "Couldn't decline invitation.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-faint">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
        <Mail size={14} className="text-accent" />
        Invitations
        <span className="text-xs font-normal text-muted">
          ({items.filter((i) => i.status === "pending").length} new)
        </span>
      </h2>

      {err ? (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {err}
        </p>
      ) : null}

      <ul className="space-y-2">
        {items.map((inv) => {
          const meta = STATUS_META[inv.status] || STATUS_META.pending;
          const brandName =
            inv.brand?.brand_name || inv.gig?.brand_name || "A brand";
          return (
            <li
              key={inv.id}
              className="rounded-2xl border border-line bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink truncate">
                    {inv.gig?.title || "Gig"}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {brandName}
                    {inv.gig?.pay_per_video
                      ? ` · $${Number(inv.gig.pay_per_video)}/video`
                      : ""}
                    {" · "}Invited {timeAgo(inv.created_at)}
                  </p>
                  {inv.message ? (
                    <p className="mt-2 text-sm text-ink-soft bg-surface-sunken rounded-lg px-3 py-2">
                      “{inv.message}”
                    </p>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-full border ${meta.classes}`}
                >
                  {meta.label}
                </span>
              </div>

              {inv.status === "pending" ? (
                <div className="mt-3 flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleDecline(inv)}
                    disabled={busyId === inv.id}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-surface-sunken disabled:opacity-60"
                  >
                    <X size={12} /> Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccept(inv)}
                    disabled={busyId === inv.id}
                    className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-on-accent hover:bg-ink/90 disabled:opacity-60"
                  >
                    {busyId === inv.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    Accept
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
