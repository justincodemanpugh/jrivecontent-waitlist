"use client";

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function Avatar({ url, initials }) {
  return (
    <span className="h-7 w-7 rounded-full bg-brand-sky text-white text-[11px] font-semibold inline-flex items-center justify-center shrink-0 overflow-hidden self-end mb-5">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        initials || "?"
      )}
    </span>
  );
}

export default function MessageBubble({
  message,
  isMine,
  avatarUrl,
  initials,
  children,
}) {
  if (message.kind === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] uppercase tracking-wide text-slate-400 bg-slate-100 rounded-full px-3 py-1">
          {message.body}
        </span>
      </div>
    );
  }

  // Deliverable messages render with the deliverable card inline.
  if (message.kind === "deliverable") {
    return (
      <div
        className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} my-2`}
      >
        {!isMine && <Avatar url={avatarUrl} initials={initials} />}
        <div className="max-w-[80%] flex flex-col gap-1.5">
          {message.body ? (
            <div
              className={[
                "rounded-2xl px-4 py-2 text-sm",
                isMine
                  ? "bg-brand-ink text-white rounded-br-md"
                  : "bg-white border border-slate-200 text-brand-ink rounded-bl-md",
              ].join(" ")}
            >
              {message.body}
            </div>
          ) : null}
          {children}
          <span className="text-[10px] text-slate-400 px-1">
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-2 ${isMine ? "justify-end" : "justify-start"} my-1`}
    >
      {!isMine && <Avatar url={avatarUrl} initials={initials} />}
      <div className="max-w-[75%] flex flex-col gap-1">
        <div
          className={[
            "rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words",
            isMine
              ? "bg-brand-ink text-white rounded-br-md"
              : "bg-white border border-slate-200 text-brand-ink rounded-bl-md",
          ].join(" ")}
        >
          {message.body}
        </div>
        <span
          className={`text-[10px] text-slate-400 px-1 ${
            isMine ? "text-right" : "text-left"
          }`}
        >
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
