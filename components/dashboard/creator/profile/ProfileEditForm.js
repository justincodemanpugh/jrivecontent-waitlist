"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Instagram, Youtube, Globe, Music2, Loader2 } from "lucide-react";
import { updateCreatorProfile } from "@/lib/dashboard/creator/profileActions";

export default function ProfileEditForm({ initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    display_name: initial.display_name || "",
    bio: initial.bio || "",
    instagram_handle: initial.instagram_handle || "",
    tiktok_handle: initial.tiktok_handle || "",
    youtube_handle: initial.youtube_handle || "",
    portfolio_url: initial.portfolio_url || "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      const res = await updateCreatorProfile(form);
      if (!res.ok) {
        setError(res.error || "Could not save changes.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Basics">
        <Field label="Display name" required>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => update("display_name", e.target.value)}
            maxLength={80}
            required
            className={inputClass}
            placeholder="How brands will see your name"
          />
        </Field>

        <Field label="Bio" hint={`${form.bio.length}/500`}>
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            maxLength={500}
            rows={4}
            className={`${inputClass} resize-y`}
            placeholder="One or two sentences on the kind of content you make."
          />
        </Field>
      </Section>

      <Section title="Where to find me">
        <Field label="Instagram" icon={<Instagram size={14} />} prefix="@">
          <input
            type="text"
            value={form.instagram_handle}
            onChange={(e) => update("instagram_handle", e.target.value.replace(/^@/, ""))}
            maxLength={60}
            className={inputClass}
            placeholder="yourhandle"
          />
        </Field>

        <Field label="TikTok" icon={<Music2 size={14} />} prefix="@">
          <input
            type="text"
            value={form.tiktok_handle}
            onChange={(e) => update("tiktok_handle", e.target.value.replace(/^@/, ""))}
            maxLength={60}
            className={inputClass}
            placeholder="yourhandle"
          />
        </Field>

        <Field label="YouTube" icon={<Youtube size={14} />} prefix="@">
          <input
            type="text"
            value={form.youtube_handle}
            onChange={(e) => update("youtube_handle", e.target.value.replace(/^@/, ""))}
            maxLength={60}
            className={inputClass}
            placeholder="yourchannel"
          />
        </Field>

        <Field label="Portfolio / website" icon={<Globe size={14} />}>
          <input
            type="url"
            value={form.portfolio_url}
            onChange={(e) => update("portfolio_url", e.target.value)}
            maxLength={240}
            className={inputClass}
            placeholder="https://yoursite.com"
          />
        </Field>
      </Section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-brand-skyDeep px-5 py-2 text-sm font-semibold text-white hover:bg-brand-skyDeep/90 disabled:opacity-60"
        >
          {pending ? <Loader2 size={14} className="animate-spin" /> : null}
          Save changes
        </button>
        {saved ? (
          <span className="text-sm text-emerald-600">Saved.</span>
        ) : null}
        {error ? <span className="text-sm text-red-600">{error}</span> : null}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-sky/40 focus:border-brand-sky";

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, hint, icon, prefix, required, children }) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1.5">
          {icon ? <span className="text-slate-400">{icon}</span> : null}
          {label}
          {required ? <span className="text-red-500">*</span> : null}
        </span>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {prefix ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            {prefix}
          </span>
          <div className="[&>input]:pl-7">{children}</div>
        </div>
      ) : (
        children
      )}
    </label>
  );
}
