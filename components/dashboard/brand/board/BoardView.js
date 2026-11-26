"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Search, X } from "lucide-react";
import CopyButton from "./CopyButton";
import CreateProgramModal from "@/components/dashboard/brand/programs/CreateProgramModal";
import { STATUSES, messageFor } from "@/lib/board/cards";
import { addProgramMember } from "@/lib/dashboard/brand/programsApi";
import { connectWithCreator } from "@/lib/dashboard/brand/creatorsApi";
import { tiktokProfileUrl } from "@/lib/discovery/directory";

async function api(method, body) {
  const res = await fetch("/api/board", {
    method,
    cache: "no-store",
    ...(body && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "We couldn't load your creators.");
  return data;
}

// Four columns, moved by hand: messaging happens on TikTok, where we can't see
// it.
export default function BoardView() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(null); // card id, or "add"
  const [payFor, setPayFor] = useState(null); // creator user id for a new campaign

  const load = useCallback(async () => {
    try {
      setData(await api("GET"));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, fn) => {
    setBusy(id);
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  const patch = (card, change) => act(card.id, () => api("PATCH", { id: card.id, ...change }));

  const add = (e) => {
    e.preventDefault();
    if (!handle.trim()) return;
    act("add", async () => {
      await api("POST", { source: "manual", handle });
      setHandle("");
    });
  };

  const remove = (card) => {
    if (window.confirm(`Remove ${card.name} from your board?`)) patch(card, { status: "removed" });
  };

  // Campaign invites only work for creators on the brand's roster.
  const invite = (card, campaign) => {
    const ok = window.confirm(
      `Invite ${card.name} to "${campaign.title}"?\n\nPay: ${campaign.pay}. Your card is charged for what they earn.`,
    );
    if (!ok) return;
    act(card.id, async () => {
      await connectWithCreator(card.memberId);
      await addProgramMember(campaign.id, card.memberId);
    });
  };

  const newCampaign = (card) =>
    act(card.id, async () => {
      await connectWithCreator(card.memberId);
      setPayFor(card.memberId);
    });

  if (!data) {
    return error ? (
      <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
        {error}
      </p>
    ) : (
      <div className="flex justify-center py-24 text-faint">
        <Loader2 size={24} className="animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (data.locked) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Unlock your creator board</h1>
        <p className="mt-3 text-muted">The creators from your plan and where you are with each one.</p>
        <Link href="/plan" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-on-accent">
          See my plan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">Creators</h1>
          <p className="mt-1 text-sm text-muted">Message them, then move each card as you go.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={add} className="flex gap-2">
            <label htmlFor="add-handle" className="sr-only">
              Add a creator by TikTok handle
            </label>
            <input
              id="add-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@tiktokhandle"
              className="w-44 rounded-full border border-line bg-surface px-4 py-2 text-base text-ink placeholder:text-faint"
            />
            <button type="submit" disabled={busy === "add"} className={DARK}>
              Add
            </button>
          </form>
          <Link href="/dashboard/brand/creators" className={LIGHT}>
            <Search size={14} /> Find more
          </Link>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {STATUSES.map((column) => {
          const cards = data.cards.filter((c) => c.status === column.id);
          return (
            <section key={column.id} className="rounded-3xl bg-surface-hover p-3">
              <h2 className="px-1 text-sm font-semibold text-ink">
                {column.label} <span className="font-normal text-muted">{cards.length}</span>
              </h2>
              <ul className="mt-2 space-y-2">
                {cards.map((card) => (
                  <Card
                    key={card.id}
                    card={card}
                    data={data}
                    busy={busy === card.id}
                    onMove={(status) => patch(card, { status })}
                    onNotes={(notes) => patch(card, { notes })}
                    onRemove={() => remove(card)}
                    onInvite={() => invite(card, data.campaigns[0])}
                    onNewCampaign={() => newCampaign(card)}
                  />
                ))}
                {!cards.length && <li className="px-1 py-2 text-xs text-faint">Nobody here yet</li>}
              </ul>
            </section>
          );
        })}
      </div>

      {payFor && (
        <CreateProgramModal
          initial={{ ...data.defaults, memberCreatorIds: [payFor] }}
          onClose={() => {
            setPayFor(null);
            load();
          }}
        />
      )}
    </div>
  );
}

const DARK = "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-on-accent hover:bg-ink/90 disabled:opacity-60";
const LIGHT =
  "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-sunken";
const LINK = "text-xs font-semibold text-ink underline underline-offset-4";

function Card({ card, data, busy, onMove, onNotes, onRemove, onInvite, onNewCampaign }) {
  const [notes, setNotes] = useState(card.notes);
  const campaign = data.campaigns[0];
  // Worth inviting an account once they've agreed; before that it's noise.
  const agreed = card.status === "said_yes" || card.status === "posting";

  return (
    <li className="space-y-2 rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{card.name}</p>
          {card.handle && (
            <a
              href={tiktokProfileUrl(card.handle)}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
            >
              @{card.handle} <ExternalLink size={11} />
            </a>
          )}
        </div>
        <button type="button" onClick={onRemove} aria-label={`Remove ${card.name}`} className="text-faint hover:text-danger">
          <X size={14} />
        </button>
      </div>

      {card.memberId && (
        <p className="text-xs text-success">
          {card.campaign
            ? `${card.campaign.status === "active" ? "In" : "Invited to"} ${card.campaign.title}`
            : "On JriveContent"}
        </p>
      )}

      {card.status === "to_message" && data.message && (
        <CopyButton text={messageFor(data.message, card.name)} label="Copy message" small />
      )}

      {agreed && card.inviteUrl && (
        <div className="rounded-xl bg-surface-sunken p-2 text-xs text-muted">
          Send them this link so you can pay and track them here.
          <div className="mt-1">
            <CopyButton text={card.inviteUrl} label="Copy invite link" small />
          </div>
        </div>
      )}

      {agreed && card.memberId && !card.campaign && (
        <div className="flex flex-wrap gap-3">
          {campaign && (
            <button type="button" onClick={onInvite} disabled={busy} className={LINK}>
              Invite to campaign
            </button>
          )}
          <button type="button" onClick={onNewCampaign} disabled={busy || !data.defaults} className={LINK}>
            {campaign ? "New campaign" : "Set up pay"}
          </button>
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => notes !== card.notes && onNotes(notes)}
        placeholder="Notes"
        aria-label={`Notes on ${card.name}`}
        rows={notes ? 2 : 1}
        maxLength={1000}
        className="w-full resize-none rounded-xl border border-line bg-surface px-2 py-1 text-base text-ink placeholder:text-faint lg:text-xs"
      />

      <label className="flex items-center gap-2 text-xs text-muted">
        Move to
        <select
          value={card.status}
          disabled={busy}
          onChange={(e) => onMove(e.target.value)}
          className="flex-1 rounded-full border border-line bg-surface px-2 py-1 text-xs font-semibold text-ink"
        >
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        {busy && <Loader2 size={12} className="animate-spin" />}
      </label>
    </li>
  );
}
