"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
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

/**
 * Full-thread view used by both brand and creator messages pages.
 * - role: "brand" | "creator" — controls the back link.
 * - currentUserId: used to color "mine" vs "theirs".
 * - basePath: where the back button links to (the inbox list).
 */
export default function MessageThread({ conversationId, role, currentUserId, basePath }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
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

  // Realtime conversation updates — the realtime payload only carries the
  // conversations row, so re-fetch to pick up nested joins.
  useEffect(() => {
    if (!conversationId) return undefined;
    const unsubscribe = subscribeToConversation(conversationId, async () => {
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
      <div className="flex items-center justify-center py-20 text-faint">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }
  if (err || !conversation) {
    return (
      <div className="px-4 py-10">
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {err || "Conversation not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-surface">
        <Link
          href={basePath}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-hover"
          aria-label="Back to messages"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="h-10 w-10 rounded-full bg-accent-soft text-on-accent text-sm font-semibold inline-flex items-center justify-center shrink-0 overflow-hidden">
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
          <p className="font-semibold text-ink truncate">
            {counterpartName}
          </p>
          <p className="text-xs text-muted truncate">
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
        className="flex-1 overflow-y-auto px-4 py-3 bg-accent-tint/30"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted py-12">
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
            />
            );
          })
        )}
      </div>

      {/* Composer */}
      <MessageComposer onSend={handleSend} />
    </div>
  );
}
