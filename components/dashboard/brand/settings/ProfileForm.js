"use client";

import { useRef, useState } from "react";
import { Check, Camera, Upload, Trash2 } from "lucide-react";
import { updateBrandProfile } from "@/lib/dashboard/brand/profileApi";
import { uploadBrandAvatar } from "@/lib/dashboard/brand/avatarUpload";
import { COUNTRIES } from "@/lib/countries";

function initialsFor(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ProfileForm({ initial }) {
  const [form, setForm] = useState({
    brand_name: initial.brand_name || "",
    website: initial.website || "",
    industry: initial.industry || "",
    country: initial.country || "",
    email: initial.email || "",
    avatar_url: initial.avatar_url || "",
  });
  // Stripe locks the connected account country at creation. If the brand
  // already finished Stripe onboarding, we hide the picker entirely so they
  // don't think they can change it.
  const stripeCountryLocked = Boolean(initial.stripe_country_locked);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [emailChanged, setEmailChanged] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    try {
      const url = await uploadBrandAvatar(file);
      if (!url) throw new Error("Upload failed.");
      set("avatar_url", url);
      // Persist immediately so the avatar sticks even if the user navigates
      // away without clicking Save.
      await updateBrandProfile({ avatar_url: url });
    } catch (err) {
      setError(err.message || "Could not upload image.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    setError("");
    try {
      set("avatar_url", "");
      await updateBrandProfile({ avatar_url: null });
    } catch (err) {
      setError(err.message || "Could not remove image.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedAt(null);
    setEmailChanged(false);
    try {
      const patch = {
        brand_name: form.brand_name,
        website: form.website,
        industry: form.industry,
      };
      if (!stripeCountryLocked) {
        patch.country = form.country || null;
      }
      if (form.email && form.email !== initial.email) {
        patch.email = form.email;
      }
      await updateBrandProfile(patch);
      setSavedAt(Date.now());
      if (patch.email) setEmailChanged(true);
    } catch (err) {
      setError(err.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const initials = initialsFor(form.brand_name || form.email);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Brand profile picture */}
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0">
            <div className="h-24 w-24 rounded-2xl bg-accent-soft text-on-accent text-2xl font-semibold flex items-center justify-center overflow-hidden ring-1 ring-line">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatar_url}
                  alt="Brand logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarPick}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-ink text-on-accent flex items-center justify-center shadow-md hover:bg-ink/90 transition"
              aria-label="Change profile picture"
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-ink">
              Profile picture
            </h2>
            <p className="mt-1 text-sm text-muted">
              Upload a logo or photo. PNG, JPG, WEBP or GIF, up to 5 MB.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAvatarPick}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-sunken transition disabled:opacity-60"
              >
                <Upload size={14} />
                {uploadingAvatar
                  ? "Uploading…"
                  : form.avatar_url
                    ? "Replace"
                    : "Upload"}
              </button>
              {form.avatar_url && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-2 rounded-xl border border-line-strong px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-sunken hover:text-danger transition disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarFile}
            />
          </div>
        </div>
      </section>

      {/* Brand details */}
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-ink">
            Brand details
          </h2>
          <p className="mt-1 text-sm text-muted">
            This is what creators see when you reach out and when you post
            gigs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Brand name"
            value={form.brand_name}
            onChange={(v) => set("brand_name", v)}
            placeholder="Acme Inc."
            required
          />
          <Field
            label="Industry"
            value={form.industry}
            onChange={(v) => set("industry", v)}
            placeholder="e.g. Skincare, SaaS, Apparel"
          />
          <div className="sm:col-span-2">
            <Field
              label="Website"
              value={form.website}
              onChange={(v) => set("website", v)}
              placeholder="https://example.com"
              type="url"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block">
              <span className="block text-xs font-medium text-ink-soft">
                Country
                {!stripeCountryLocked && (
                  <span className="ml-1 font-normal text-muted">
                    — used when you connect Stripe for payouts
                  </span>
                )}
              </span>
              <select
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                disabled={stripeCountryLocked}
                className="mt-1.5 w-full rounded-xl border border-line-strong px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft/40 disabled:bg-surface-hover disabled:text-muted"
              >
                <option value="">Select your country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              {stripeCountryLocked ? (
                <span className="mt-1 block text-[11px] text-muted">
                  Locked by Stripe — the country of a connected account can
                  only be set when it's first created.
                </span>
              ) : (
                <span className="mt-1 block text-[11px] text-muted">
                  Pick the country where your business is legally based.
                  Stripe locks this once you connect, so choose carefully.
                </span>
              )}
            </label>
          </div>
        </div>
      </section>

      {/* Sign in */}
      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-muted">
            Used to sign in and receive transactional emails.
          </p>
        </div>
        <Field
          label="Email"
          value={form.email}
          onChange={(v) => set("email", v)}
          type="email"
          required
        />
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted min-h-[1rem]">
          {savedAt && (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Check size={14} />
              Saved
              {emailChanged && " — check your new email to confirm the change."}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-ink text-on-accent px-4 py-2 text-sm font-semibold hover:bg-ink/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 w-full rounded-xl border border-line-strong px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft/40"
      />
    </label>
  );
}
