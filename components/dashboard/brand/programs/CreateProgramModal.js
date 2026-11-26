"use client";

import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Check,
  Target,
  AlertCircle,
  DollarSign,
  Eye,
  Repeat,
} from "lucide-react";
import { createProgram } from "@/lib/dashboard/brand/programsApi";
import { fetchMyCreators } from "@/lib/dashboard/brand/creatorsApi";
import { estimateMonthlyCents } from "@/lib/earnings/calc";

const STEPS = ["Basics", "Pay", "Creators", "Review"];

const toCents = (dollars) => Math.round(Number(dollars || 0) * 100);
const money = (cents) => `$${(cents / 100).toFixed(2)}`;

export default function CreateProgramModal({ onClose }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [periodType, setPeriodType] = useState("month");
  const [videosPerPeriod, setVideosPerPeriod] = useState("");
  const [payPerVideo, setPayPerVideo] = useState("");
  const [testPayoutEnabled, setTestPayoutEnabled] = useState(false);
  const [testPayout, setTestPayout] = useState("");

  // Pay types: any combination of base, CPM and rev share.
  const [baseEnabled, setBaseEnabled] = useState(true);
  const [cpmEnabled, setCpmEnabled] = useState(false);
  const [cpm, setCpm] = useState("");
  const [maxPerVideo, setMaxPerVideo] = useState("");
  const [viewWindowDays, setViewWindowDays] = useState("30");
  const [revshareEnabled, setRevshareEnabled] = useState(false);
  const [revsharePct, setRevsharePct] = useState("30");
  const [revshareMonths, setRevshareMonths] = useState("12");
  const [monthlyCap, setMonthlyCap] = useState("");
  const [expectedViews, setExpectedViews] = useState("10000");

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

  const baseOn = baseEnabled && Number(payPerVideo) > 0;
  const cpmOn = cpmEnabled && Number(cpm) > 0;
  const revshareOn = revshareEnabled && Number(revsharePct) > 0 && Number(revsharePct) <= 100;
  const hasValidBase =
    Number(videosPerPeriod) > 0 &&
    (baseOn || cpmOn || revshareOn) &&
    (!baseEnabled || Number(payPerVideo) > 0) &&
    (!cpmEnabled || Number(cpm) > 0) &&
    (!revshareEnabled || revshareOn);

  const videosPerMonth =
    periodType === "week" ? Number(videosPerPeriod || 0) * 4.33 : Number(videosPerPeriod || 0);
  const estimateCents = estimateMonthlyCents({
    videosPerMonth,
    payPerVideoCents: baseOn ? toCents(payPerVideo) : 0,
    cpmCents: cpmOn ? toCents(cpm) : 0,
    avgViews: Number(expectedViews) || 0,
    maxPayoutPerVideoCents: cpmOn && Number(maxPerVideo) > 0 ? toCents(maxPerVideo) : null,
  });
  const payParts = [
    baseOn && `${money(toCents(payPerVideo))}/video`,
    cpmOn && `${money(toCents(cpm))} per 1K views`,
    revshareOn && `${Number(revsharePct)}% of subscriptions`,
  ].filter(Boolean);

  const canContinue = () => {
    if (step === 0) return title.trim().length > 0;
    if (step === 1) return hasValidBase;
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
        payPerVideoCents: baseOn ? toCents(payPerVideo) : 0,
        // Payouts run weekly for every campaign; payout_schedule now only
        // sets the period the base-pay video target is counted over.
        payoutSchedule: periodType === "week" ? "weekly" : "monthly",
        cpmCents: cpmOn ? toCents(cpm) : 0,
        maxPayoutPerVideoCents: cpmOn && Number(maxPerVideo) > 0 ? toCents(maxPerVideo) : null,
        viewWindowDays: Number(viewWindowDays) || 30,
        revshareBps: revshareOn ? Math.round(Number(revsharePct) * 100) : 0,
        revshareMonths: revshareMonths === "lifetime" ? null : Number(revshareMonths),
        monthlyCapCents: Number(monthlyCap) > 0 ? toCents(monthlyCap) : null,
        testPayoutAmountCents:
          testPayoutEnabled && Number(testPayout) > 0
            ? Math.round(Number(testPayout) * 100)
            : 0,
        memberCreatorIds: selectedCreatorIds,
      });
      handleClose();
    } catch (e) {
      setErr(e.message || "Failed to create campaign.");
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
                <h2 className="text-lg font-semibold text-ink">Create Campaign</h2>
                <p className="text-sm text-muted mt-0.5">
                  Setup a recurring TikTok creator campaign.
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
              <Field label="Campaign name">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Premium Creator Campaign"
                  className={inputCls}
                  autoFocus
                />
              </Field>
              <Field label="Description" hint="Internal notes, not shown to creators.">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this campaign..."
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <div>
              <SectionHeading
                title="How creators get paid"
                hint="Turn on any mix. Earnings add up automatically and are paid out every Monday."
              />
              <div className="space-y-3">
                <Field label="Video target" hint="Videos each creator should post every period.">
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

                <PayCard
                  icon={DollarSign}
                  title="Base pay per video"
                  hint="A flat fee for each approved video, up to the video target."
                  enabled={baseEnabled}
                  onToggle={setBaseEnabled}
                >
                  <MoneyInput value={payPerVideo} onChange={setPayPerVideo} placeholder="25.00" />
                </PayCard>

                <PayCard
                  icon={Eye}
                  title="CPM (pay per 1,000 views)"
                  hint="Pays for views each video gets in its first days after posting."
                  enabled={cpmEnabled}
                  onToggle={setCpmEnabled}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <LabeledSmall label="Per 1K views">
                      <MoneyInput value={cpm} onChange={setCpm} placeholder="1.00" />
                    </LabeledSmall>
                    <LabeledSmall label="Max per video">
                      <MoneyInput value={maxPerVideo} onChange={setMaxPerVideo} placeholder="No max" />
                    </LabeledSmall>
                    <LabeledSmall label="Count views for">
                      <select
                        value={viewWindowDays}
                        onChange={(e) => setViewWindowDays(e.target.value)}
                        className={inputCls}
                      >
                        {["7", "14", "30", "60", "90"].map((d) => (
                          <option key={d} value={d}>
                            {d} days
                          </option>
                        ))}
                      </select>
                    </LabeledSmall>
                  </div>
                </PayCard>

                <PayCard
                  icon={Repeat}
                  title="Rev share (% of subscriptions)"
                  hint="Creators earn a cut of every subscription payment from users who enter their code in your app. Needs RevenueCat; you'll connect it after creating the campaign."
                  enabled={revshareEnabled}
                  onToggle={setRevshareEnabled}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <LabeledSmall label="Creator's share">
                      <div className="relative">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={revsharePct}
                          onChange={(e) => setRevsharePct(e.target.value)}
                          className={`${inputCls} pr-8`}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-faint text-sm">%</span>
                      </div>
                    </LabeledSmall>
                    <LabeledSmall label="For each subscriber's first">
                      <select
                        value={revshareMonths}
                        onChange={(e) => setRevshareMonths(e.target.value)}
                        className={inputCls}
                      >
                        <option value="3">3 months</option>
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                        <option value="24">24 months</option>
                        <option value="lifetime">Lifetime</option>
                      </select>
                    </LabeledSmall>
                  </div>
                  <p className="text-xs text-faint mt-2">
                    Calculated on what you keep after Apple/Google&apos;s cut.
                  </p>
                </PayCard>

                <Field label="Monthly spend cap (optional)" hint="Creators stop earning for the rest of the month once this campaign reaches it.">
                  <MoneyInput value={monthlyCap} onChange={setMonthlyCap} placeholder="No cap" />
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
                        see their work before the regular cycle starts.
                      </span>
                    </span>
                  </label>
                  {testPayoutEnabled && (
                    <div className="mt-3">
                      <MoneyInput value={testPayout} onChange={setTestPayout} placeholder="25.00" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <SectionHeading
                title="Add Creators"
                hint="Invite creators from your roster now, or add them later from the campaign page."
              />
              {rosterLoading ? (
                <div className="py-8 flex justify-center text-faint">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : roster.length === 0 ? (
                <p className="text-sm text-muted py-4">
                  No connected creators yet. You can invite creators to this campaign later.
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

          {step === 3 && (
            <div>
              <SectionHeading title="Campaign Review" hint="Check your campaign details before creating it." />

              {!hasValidBase && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-warn-line bg-warn-soft px-4 py-3">
                  <AlertCircle size={18} className="mt-0.5 text-warn flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-warn">Finish setting up pay</p>
                    <p className="text-xs text-warn mt-0.5">
                      Go back to the Pay step: set a video target and fill in every pay type you turned on.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs font-medium text-faint uppercase tracking-wide mb-2">Summary</p>
              <div className="rounded-xl border border-line divide-y divide-line mb-4">
                <SummaryRow label="Campaign name" value={title} />
                <SummaryRow label="Payouts" value="Automatic, every Monday" />
                <SummaryRow
                  label="Video target"
                  value={`${videosPerPeriod || 0} / ${periodType}`}
                />
                <SummaryRow label="Pay" value={payParts.join(" + ") || "None"} />
                {cpmOn && (
                  <SummaryRow
                    label="CPM limits"
                    value={`${Number(maxPerVideo) > 0 ? `max ${money(toCents(maxPerVideo))}/video · ` : ""}views in first ${viewWindowDays} days`}
                  />
                )}
                {revshareOn && (
                  <SummaryRow
                    label="Rev share length"
                    value={revshareMonths === "lifetime" ? "Lifetime" : `${revshareMonths} months per subscriber`}
                  />
                )}
                <SummaryRow
                  label="Monthly cap"
                  value={Number(monthlyCap) > 0 ? money(toCents(monthlyCap)) : "None"}
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
                <div className="rounded-xl border border-accent/30 bg-accent-tint px-4 py-3 space-y-2">
                  <p className="text-xs font-medium text-muted">Estimated cost per creator</p>
                  {(baseOn || cpmOn) && (
                    <p className="text-sm text-ink">
                      ≈ <span className="font-semibold">{money(estimateCents)}</span> / month
                      {cpmOn && (
                        <>
                          {" "}at{" "}
                          <input
                            type="number"
                            min={0}
                            value={expectedViews}
                            onChange={(e) => setExpectedViews(e.target.value)}
                            className="w-24 rounded-lg border border-line bg-surface px-2 py-0.5 text-sm"
                          />{" "}
                          views per video
                        </>
                      )}
                    </p>
                  )}
                  {revshareOn && (
                    <p className="text-sm text-ink">
                      {(baseOn || cpmOn) ? "+ " : ""}
                      {Number(revsharePct)}% of each subscription they bring in
                    </p>
                  )}
                </div>
              )}

              <p className="mt-4 text-xs text-faint">
                By creating this campaign you authorize JriveContent to charge your card on file
                each Monday for what creators earned that week, plus a{" "}
                {Math.round(Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_RATE || 0.05) * 100)}% platform
                fee and card processing.
              </p>
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
              Create Campaign
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

function PayCard({ icon: Icon, title, hint, enabled, onToggle, children }) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        enabled ? "border-accent bg-accent-tint/40" : "border-line"
      }`}
    >
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-line accent-accent"
        />
        <span className="flex-1">
          <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Icon size={14} className="text-accent" />
            {title}
          </span>
          <span className="block text-xs text-faint mt-0.5">{hint}</span>
        </span>
      </label>
      {enabled && <div className="mt-3 pl-7">{children}</div>}
    </div>
  );
}

function MoneyInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-faint text-sm">$</span>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pl-7`}
      />
    </div>
  );
}

function LabeledSmall({ label, children }) {
  return (
    <div>
      <span className="block text-xs text-muted mb-1">{label}</span>
      {children}
    </div>
  );
}
