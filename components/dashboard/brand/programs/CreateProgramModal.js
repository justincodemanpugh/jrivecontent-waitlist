"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Check, Target, AlertCircle, CalendarClock } from "lucide-react";
import { createProgram, PAYOUT_SCHEDULES } from "@/lib/dashboard/brand/programsApi";
import { fetchMyCreators } from "@/lib/dashboard/brand/creatorsApi";

const STEPS = ["Basics", "Schedule", "Base", "Creators", "Review"];

export default function CreateProgramModal({ onClose }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payoutSchedule, setPayoutSchedule] = useState("monthly");
  const [periodType, setPeriodType] = useState("month");
  const [videosPerPeriod, setVideosPerPeriod] = useState("");
  const [payPerVideo, setPayPerVideo] = useState("");
  const [testPayoutEnabled, setTestPayoutEnabled] = useState(false);
  const [testPayout, setTestPayout] = useState("");

  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([]);

  useEffect(() => {
    fetchMyCreators()
      .then((rows) => setRoster(rows.filter((c) => c.connectionStatus === "active")))
      .catch(() => setRoster([]))
      .finally(() => setRosterLoading(false));
  }, []);

  // Trigger the slide-in transition on mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Play the slide-out transition before actually closing.
  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 200);
  };

  const hasValidBase = Number(videosPerPeriod) > 0 && Number(payPerVideo) > 0;

  const canContinue = () => {
    if (step === 0) return title.trim().length > 0;
    if (step === 2) return hasValidBase;
    return true;
  };

  const toggleCreator = (id) => {
    setSelectedCreatorIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    setSaving(true);
    setErr("");
    try {
      await createProgram({
        title,
        description,
        videosPerPeriod: Number(videosPerPeriod),
        periodType,
        payPerVideoCents: Math.round(Number(payPerVideo) * 100),
        payoutSchedule,
        testPayoutAmountCents:
          testPayoutEnabled && Number(testPayout) > 0
            ? Math.round(Number(testPayout) * 100)
            : 0,
        memberCreatorIds: selectedCreatorIds,
      });
      handleClose();
    } catch (e) {
      setErr(e.message || "Failed to create program.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-scrim/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed inset-y-0 right-0 h-full w-full max-w-2xl bg-surface shadow-xl border-l border-line flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-line flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent">
                <Target size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">Create Program</h2>
                <p className="text-sm text-muted mt-0.5">
                  Setup a recurring TikTok creator program.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-full flex items-center justify-center text-faint hover:bg-surface-hover hover:text-muted transition flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-1.5 mt-5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition ${
                  i <= step ? "bg-ink" : "bg-surface-hover"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              {STEPS.map((s, i) => (
                <span
                  key={s}
                  className={`hidden sm:flex items-center gap-1 text-xs font-medium transition ${
                    i === step
                      ? "text-ink"
                      : i < step
                        ? "text-success"
                        : "text-faint"
                  }`}
                >
                  {i < step && <Check size={12} />}
                  {s}
                </span>
              ))}
            </div>
            <span className="text-xs text-faint flex-shrink-0">
              Step {step + 1}/{STEPS.length}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {step === 0 && (
            <>
              <Field label="Program name">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Premium Creator Program"
                  className={inputCls}
                  autoFocus
                />
              </Field>
              <Field label="Description" hint="Internal notes, not shown to creators.">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this program..."
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <div>
              <SectionHeading title="Payout Schedule" hint="Configure how often creators get paid." />
              <Field label="Payout cycle" hint="How often creators get paid.">
                <div className="grid grid-cols-3 gap-2">
                  {PAYOUT_SCHEDULES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setPayoutSchedule(s.key)}
                      className={`flex flex-col items-start gap-2 rounded-xl border px-4 py-3 text-left transition ${
                        payoutSchedule === s.key
                          ? "border-accent bg-accent-tint"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          payoutSchedule === s.key
                            ? "bg-surface text-accent"
                            : "bg-surface-hover text-faint"
                        }`}
                      >
                        <CalendarClock size={14} />
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          payoutSchedule === s.key ? "text-ink" : "text-muted"
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div>
              <SectionHeading
                title="Base Compensation"
                hint="Set the video target and flat pay-per-video rate for this program."
              />
              <div className="space-y-4">
                <Field label="Video target" hint="Number of videos creators should post every period.">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={videosPerPeriod}
                      onChange={(e) => setVideosPerPeriod(e.target.value)}
                      placeholder="e.g. 4"
                      className={inputCls}
                    />
                    <div className="flex rounded-xl border border-line overflow-hidden flex-shrink-0">
                      {["week", "month"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriodType(p)}
                          className={`px-3 py-2.5 text-sm font-medium transition ${
                            periodType === p
                              ? "bg-ink text-on-accent"
                              : "bg-surface text-muted hover:bg-surface-sunken"
                          }`}
                        >
                          /{p}
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>
                <Field label="Pay per video" hint="Flat amount paid per published video.">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-faint text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={payPerVideo}
                      onChange={(e) => setPayPerVideo(e.target.value)}
                      placeholder="50.00"
                      className={`${inputCls} pl-7`}
                    />
                  </div>
                </Field>

                <div className="rounded-xl border border-line p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testPayoutEnabled}
                      onChange={(e) => setTestPayoutEnabled(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-line accent-accent"
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">
                        Pay for a test video
                      </span>
                      <span className="block text-xs text-faint mt-0.5">
                        Offer each new creator a one-time flat payment so you can
                        see their work before the regular cycle starts. Released
                        without waiting for a posted video.
                      </span>
                    </span>
                  </label>
                  {testPayoutEnabled && (
                    <div className="relative mt-3">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-faint text-sm">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={testPayout}
                        onChange={(e) => setTestPayout(e.target.value)}
                        placeholder="25.00"
                        className={`${inputCls} pl-7`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <SectionHeading
                title="Add Creators"
                hint="Invite creators from your roster now, or add them later from the program page."
              />
              {rosterLoading ? (
                <div className="py-8 flex justify-center text-faint">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : roster.length === 0 ? (
                <p className="text-sm text-muted py-4">
                  No connected creators yet. You can invite creators to this program later.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {roster.map((c) => {
                    const checked = selectedCreatorIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleCreator(c.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition text-left ${
                          checked
                            ? "border-accent bg-accent-tint"
                            : "border-line hover:border-line-strong"
                        }`}
                      >
                        <span className="h-8 w-8 rounded-full bg-surface text-accent flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                          {c.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                          ) : (
                            c.name?.slice(0, 2).toUpperCase()
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-ink truncate">
                            {c.name}
                          </span>
                          <span className="block text-xs text-muted truncate">
                            {c.tiktok ? `@${c.tiktok}` : "No TikTok handle on file"}
                          </span>
                        </span>
                        {checked && (
                          <Check size={16} className="text-accent flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <SectionHeading title="Program Review" hint="Check your program details before creating it." />

              {!hasValidBase && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-warn-line bg-warn-soft px-4 py-3">
                  <AlertCircle size={18} className="mt-0.5 text-warn flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-warn">Add a video target and pay per video</p>
                    <p className="text-xs text-warn mt-0.5">
                      Go back to the Base step to set a video target and a pay-per-video amount.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs font-medium text-faint uppercase tracking-wide mb-2">Summary</p>
              <div className="rounded-xl border border-line divide-y divide-line mb-4">
                <SummaryRow label="Program name" value={title} />
                <SummaryRow label="Payout cycle" value={payoutSchedule} capitalize />
                <SummaryRow
                  label="Video target"
                  value={`${videosPerPeriod || 0} / ${periodType}`}
                />
                <SummaryRow
                  label="Pay per video"
                  value={payPerVideo ? `$${Number(payPerVideo).toFixed(2)}` : "$0.00"}
                />
                <SummaryRow
                  label="Test video payout"
                  value={
                    testPayoutEnabled && Number(testPayout) > 0
                      ? `$${Number(testPayout).toFixed(2)} per new creator`
                      : "Off"
                  }
                />
                <SummaryRow
                  label="Creators invited"
                  value={`${selectedCreatorIds.length} creator${selectedCreatorIds.length !== 1 ? "s" : ""}`}
                />
              </div>

              {hasValidBase && (
                <div className="rounded-xl border border-accent/30 bg-accent-tint px-4 py-3">
                  <p className="text-xs font-medium text-muted">Payout Simulation</p>
                  <p className="text-sm text-ink mt-0.5">
                    ≈{" "}
                    <span className="font-semibold">
                      ${(Number(videosPerPeriod) * Number(payPerVideo)).toFixed(2)}
                    </span>{" "}
                    per creator, per {periodType}
                  </p>
                </div>
              )}
            </div>
          )}

          {err && <p className="text-sm text-danger">{err}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-line flex-shrink-0">
          <button
            onClick={() => (step === 0 ? handleClose() : setStep(step - 1))}
            className="px-4 py-2 text-sm font-medium text-muted hover:text-ink transition"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canContinue()}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving || !hasValidBase}
              className="inline-flex items-center gap-2 rounded-full bg-ink text-on-accent px-5 py-2 text-sm font-medium hover:bg-ink/90 transition disabled:opacity-40"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create Program
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-line px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent";

function SectionHeading({ title, hint }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {hint && <p className="text-xs text-faint mt-0.5">{hint}</p>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      {hint && <p className="text-xs text-faint mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function SummaryRow({ label, value, capitalize }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`font-medium text-ink ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}
