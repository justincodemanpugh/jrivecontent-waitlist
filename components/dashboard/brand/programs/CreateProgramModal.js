"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Check, Target, AlertCircle, CalendarClock } from "lucide-react";
import { createProgram, PAYOUT_SCHEDULES } from "@/lib/dashboard/brand/programsApi";
import { fetchMyCreators } from "@/lib/dashboard/brand/creatorsApi";

const STEPS = ["Basics", "Schedule", "Base", "Creators", "Review"];

export default function CreateProgramModal({ onClose }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payoutSchedule, setPayoutSchedule] = useState("monthly");
  const [periodType, setPeriodType] = useState("month");
  const [videosPerPeriod, setVideosPerPeriod] = useState("");
  const [payPerVideo, setPayPerVideo] = useState("");

  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [selectedCreatorIds, setSelectedCreatorIds] = useState([]);

  useEffect(() => {
    fetchMyCreators()
      .then((rows) => setRoster(rows.filter((c) => c.connectionStatus === "active")))
      .catch(() => setRoster([]))
      .finally(() => setRosterLoading(false));
  }, []);

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
        memberCreatorIds: selectedCreatorIds,
      });
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to create program.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-mist text-brand-skyDeep">
                <Target size={20} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-brand-ink">Create Program</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Setup a recurring TikTok creator program.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition flex-shrink-0"
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
                  i <= step ? "bg-brand-ink" : "bg-slate-100"
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
                      ? "text-brand-ink"
                      : i < step
                        ? "text-emerald-600"
                        : "text-slate-400"
                  }`}
                >
                  {i < step && <Check size={12} />}
                  {s}
                </span>
              ))}
            </div>
            <span className="text-xs text-slate-400 flex-shrink-0">
              Step {step + 1}/{STEPS.length}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
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
                          ? "border-brand-skyDeep bg-brand-mist"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          payoutSchedule === s.key
                            ? "bg-white text-brand-skyDeep"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <CalendarClock size={14} />
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          payoutSchedule === s.key ? "text-brand-ink" : "text-slate-600"
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
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden flex-shrink-0">
                      {["week", "month"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPeriodType(p)}
                          className={`px-3 py-2.5 text-sm font-medium transition ${
                            periodType === p
                              ? "bg-brand-ink text-white"
                              : "bg-white text-slate-600 hover:bg-slate-50"
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
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
                <div className="py-8 flex justify-center text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : roster.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
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
                            ? "border-brand-skyDeep bg-brand-mist"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="h-8 w-8 rounded-full bg-white text-brand-skyDeep flex items-center justify-center text-xs font-semibold overflow-hidden flex-shrink-0">
                          {c.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                          ) : (
                            c.name?.slice(0, 2).toUpperCase()
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-brand-ink truncate">
                            {c.name}
                          </span>
                          <span className="block text-xs text-slate-500 truncate">
                            {c.tiktok ? `@${c.tiktok}` : "No TikTok handle on file"}
                          </span>
                        </span>
                        {checked && (
                          <Check size={16} className="text-brand-skyDeep flex-shrink-0" />
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
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <AlertCircle size={18} className="mt-0.5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Add a video target and pay per video</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Go back to the Base step to set a video target and a pay-per-video amount.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Summary</p>
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 mb-4">
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
                  label="Creators invited"
                  value={`${selectedCreatorIds.length} creator${selectedCreatorIds.length !== 1 ? "s" : ""}`}
                />
              </div>

              {hasValidBase && (
                <div className="rounded-xl border border-brand-skyDeep/30 bg-brand-mist px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">Payout Simulation</p>
                  <p className="text-sm text-brand-ink mt-0.5">
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

          {err && <p className="text-sm text-rose-600">{err}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canContinue()}
              className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-5 py-2 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-40"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={saving || !hasValidBase}
              className="inline-flex items-center gap-2 rounded-full bg-brand-ink text-white px-5 py-2 text-sm font-medium hover:bg-slate-800 transition disabled:opacity-40"
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
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-skyDeep/20 focus:border-brand-skyDeep";

function SectionHeading({ title, hint }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-brand-ink">{title}</h3>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-ink mb-1">{label}</label>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function SummaryRow({ label, value, capitalize }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-brand-ink ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}
