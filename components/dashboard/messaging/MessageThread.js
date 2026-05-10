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
      setMessages((prev) =>
        prev.find((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
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

  const handleSend = async (body) => {
    try {
      await sendMessage({ conversationId, body });
      // Realtime will append; we don't need to optimistically push.
    } catch (e) {
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <PaymentBanner conversation={conversation} role={role} />
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <Link
          href={basePath}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"
          aria-label="Back to messages"
        >
          <ArrowLeft size={18} />
        </Link>
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
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={m.sender_id === currentUserId}
            >
              {m.kind === "deliverable" && m.deliverable_id ? (
                <DeliverableCard
                  deliverableId={m.deliverable_id}
                  role={role}
                />
              ) : null}
            </MessageBubble>
          ))
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
