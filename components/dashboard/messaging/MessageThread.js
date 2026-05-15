"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Paperclip } from "lucide-react";
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
} from "@/lib/dashboard/messagesApi";
import {
  fetchConversation,
  subscribeToConversation,
} from "@/lib/dashboard/conversationsApi";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import DeliverableCard from "./DeliverableCard";
import SubmitVideosDialog from "./SubmitVideosDialog";
import PaymentBanner from "./PaymentBanner";

/**
 * Full-thread view used by both brand and creator messages pages.
 * - role: "brand" | "creator" — controls deliverable actions and back link.
 * - currentUserId: used to color "mine" vs "theirs".
 * - basePath: where the back button links to (the inbox list).
 */
export default function MessageThread({ conversationId, role, currentUserId, basePath }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);
  const scrollRef = useRef(null);

  // DEBUG: verify the currentUserId prop reaches the client. If this is empty
  // in the browser while the server-side log shows a valid user, we have a
  // session hand-off problem. If both are empty, the user isn't authenticated.
  useEffect(() => {
    console.log("[MessageThread] mounted", {
      role,
      currentUserId: currentUserId || "(empty)",
      conversationId,
    });
    // Also verify the browser client sees the same user.
    import("@/lib/supabase/client").then(({ createClient }) => {
      createClient()
        .auth.getUser()
        .then(({ data, error }) => {
          console.log("[MessageThread] client-side auth", {
            clientUserId: data?.user?.id || null,
            email: data?.user?.email || null,
            matchesProp: data?.user?.id === currentUserId,
            error: error?.message || null,
          });
        });
    });
  }, [role, currentUserId, conversationId]);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [c, m] = await Promise.all([
          fetchConversation(conversationId, role),
          fetchMessages(conversationId),
        ]);
        if (cancelled) return;
        setConversation(c);
        setMessages(m);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Couldn't load conversation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, role]);

  // Realtime new messages.
  useEffect(() => {
    if (!conversationId) return undefined;
    const unsubscribe = subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => {
        // Already have the real row → no-op.
        if (prev.find((m) => m.id === msg.id)) return prev;
        // Replace any matching optimistic row from the same sender so we
        // don't render the message twice once realtime catches up.
        const withoutOptimistic = prev.filter(
          (m) =>
            !(
              m.__optimistic &&
              m.sender_id === msg.sender_id &&
              (m.body || "") === (msg.body || "")
            ),
        );
        return [...withoutOptimistic, msg];
      });
    });
    return unsubscribe;
  }, [conversationId]);

  // Realtime conversation updates (payment_deposited, video counts, etc.).
  // Without this, the PaymentBanner would stay on "Deposit $X" even after
  // the brand finished Stripe checkout because we'd never re-fetch.
  useEffect(() => {
    if (!conversationId) return undefined;
    const unsubscribe = subscribeToConversation(conversationId, async () => {
      // Re-fetch the full row so we pick up nested gig/payment/counterpart
      // joins (the realtime payload only contains the conversations row).
      try {
        const fresh = await fetchConversation(conversationId, role);
        if (fresh) setConversation(fresh);
      } catch {
        /* swallow — next user action will retry */
      }
    });
    return unsubscribe;
  }, [conversationId, role]);

  // Post-Stripe-checkout refresh. The webhook flips payment_deposited on the
  // server, but the brand lands here via a top-level redirect so the realtime
  // channel hasn't necessarily delivered the UPDATE yet. Force a re-fetch and
  // strip the query param so a manual reload doesn't keep re-triggering.
  useEffect(() => {
    if (!conversationId) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("deposit") !== "success") return;

    params.delete("deposit");
    const qs = params.toString();
    const next =
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;
    window.history.replaceState({}, "", next);

    let cancelled = false;
    (async () => {
      // Webhook fires async — retry briefly so the UI catches up even if the
      // user beats Stripe's webhook back to the page.
      for (let i = 0; i < 5; i += 1) {
        try {
          const fresh = await fetchConversation(conversationId, role);
          if (cancelled) return;
          if (fresh?.payment_deposited) {
            setConversation(fresh);
            return;
          }
          if (fresh) setConversation(fresh);
        } catch {
          /* retry */
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, role]);

  // Auto-scroll on new messages.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const counterpart =
    role === "brand" ? conversation?.creator : conversation?.brand;
  const counterpartName =
    counterpart?.display_name || counterpart?.brand_name || "Conversation";
  const counterpartAvatar = counterpart?.avatar_url || null;
  const counterpartInitials = (counterpartName || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const handleSend = async (body) => {
    // Optimistically render the message immediately so the sender sees it
    // without waiting for the realtime echo (or a manual refresh if
    // realtime is unavailable).
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      kind: "text",
      deliverable_id: null,
      created_at: new Date().toISOString(),
      __optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await sendMessage({ conversationId, body });
      // Swap the optimistic row for the persisted one so subsequent
      // realtime echoes dedupe correctly by id.
      if (saved) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === saved.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? saved : m));
        });
      }
    } catch (e) {
      // Roll back the optimistic message on failure.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErr(e.message || "Couldn't send.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }
  if (err || !conversation) {
    return (
      <div className="px-4 py-10">
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {err || "Conversation not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <PaymentBanner conversation={conversation} role={role} />
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <Link
          href={basePath}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"
          aria-label="Back to messages"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="h-10 w-10 rounded-full bg-brand-sky text-white text-sm font-semibold inline-flex items-center justify-center shrink-0 overflow-hidden">
          {counterpartAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={counterpartAvatar}
              alt={counterpartName}
              className="h-full w-full object-cover"
            />
          ) : (
            counterpartInitials
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-ink truncate">
            {counterpartName}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {conversation.gig?.title}
            {conversation.gig?.pay_per_video
              ? ` · $${Number(conversation.gig.pay_per_video)}/video`
              : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 bg-brand-mist/30"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-12">
            No messages yet — say hi 👋
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            // DEBUG: per-message side decision. Look for any row where
            // sender_id === currentUserId but isMine is false (whitespace, etc).
            if (typeof window !== "undefined") {
              console.log("[MessageThread] render msg", {
                msgId: m.id,
                senderId: m.sender_id,
                currentUserId,
                isMine,
                kind: m.kind,
                bodyPreview: (m.body || "").slice(0, 40),
              });
            }
            return (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={isMine}
              avatarUrl={counterpartAvatar}
              initials={counterpartInitials}
            >
              {m.kind === "deliverable" && m.deliverable_id ? (
                <DeliverableCard
                  deliverableId={m.deliverable_id}
                  role={role}
                />
              ) : null}
            </MessageBubble>
            );
          })
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={handleSend}
        leftSlot={
          role === "creator" ? (
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              disabled={!conversation?.payment_deposited}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:text-brand-ink hover:bg-slate-100 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              aria-label={
                conversation?.payment_deposited
                  ? "Submit videos"
                  : "Waiting for brand to deposit payment"
              }
              title={
                conversation?.payment_deposited
                  ? "Submit videos"
                  : "Brand must deposit payment before you can submit videos."
              }
            >
              <Paperclip size={18} />
            </button>
          ) : null
        }
      />

      {role === "creator" ? (
        <SubmitVideosDialog
          open={submitOpen}
          conversation={{
            id: conversation.id,
            gig_id: conversation.gig_id,
            brand_id: conversation.brand_id,
            creator_id: conversation.creator_id,
          }}
          onClose={() => setSubmitOpen(false)}
        />
      ) : null}
    </div>
  );
}
