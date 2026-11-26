// Server-only writes to the creator_earnings ledger. Every pay type goes
// through addEarning() so idempotency, the monthly cap and hold periods
// are enforced in one place.
import { applyMonthlyCap, availableAt, startOfUtcMonth } from "@/lib/earnings/calc";

// What a campaign has accrued so far this calendar month (UTC), counting
// everything except reversed rows. Adjustments (refund clawbacks) are
// negative, so they free up room under the cap again.
export async function programSpendThisMonth(admin, programId, now = new Date()) {
  const { data, error } = await admin
    .from("creator_earnings")
    .select("amount_cents")
    .eq("program_id", programId)
    .neq("status", "reversed")
    .gte("created_at", startOfUtcMonth(now).toISOString());
  if (error) throw error;
  return (data || []).reduce((sum, r) => sum + (r.amount_cents || 0), 0);
}

// Record one earning. Returns { inserted, amountCents, capped }.
//
//   row: { brand_id, program_id, program_member_id, creator_id,
//          program_video_id?, kind, amount_cents, source_key, meta? }
//   program: the campaign row (for monthly_cap_cents); optional for
//            adjustments, which are never capped.
//
// A duplicate source_key is a silent no-op, so crons and webhooks can be
// re-run freely. Earnings that don't fit under the monthly cap are
// forfeited, not deferred — that is what a spend cap promises the brand.
export async function addEarning(admin, row, { program, now = new Date() } = {}) {
  let amount = row.amount_cents;
  let capped = false;

  if (row.kind !== "adjustment" && program?.monthly_cap_cents) {
    const spent = await programSpendThisMonth(admin, program.id, now);
    const fitted = applyMonthlyCap(amount, {
      monthlyCapCents: program.monthly_cap_cents,
      spentThisMonthCents: spent,
    });
    capped = fitted < amount;
    amount = fitted;
  }

  // Adjustments are negative by design. Otherwise skip empty earnings,
  // except a capped CPM row: it is kept at 0 so its running target is
  // remembered and the forfeited views aren't credited again next month.
  const keepEmpty = row.kind === "cpm" && capped;
  if (row.kind === "adjustment" ? amount === 0 : amount <= 0 && !keepEmpty) {
    return { inserted: false, amountCents: 0, capped };
  }

  const available = availableAt(row.kind, now);
  const { data, error } = await admin
    .from("creator_earnings")
    .insert({
      ...row,
      amount_cents: amount,
      status: available <= now ? "payable" : "held",
      available_at: available.toISOString(),
      meta: { ...(row.meta || {}), ...(capped ? { capped_from_cents: row.amount_cents } : {}) },
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // 23505 = unique_violation on source_key: already recorded.
    if (error.code === "23505") return { inserted: false, amountCents: 0, capped };
    throw error;
  }
  return { inserted: !!data, amountCents: amount, capped, id: data?.id };
}

// Undo earnings tied to a source (a rejected video, a refunded payment).
//   - unpaid rows (held / payable, not yet in a batch) are marked reversed
//   - rows already paid get a matching negative adjustment, which nets
//     against the creator's next payout
// Rows locked in a batch that is still charging are left alone; the
// adjustment path catches them once they're paid.
export async function reverseEarnings(admin, earnings, { reason, keyPrefix }) {
  let reversed = 0;
  let clawedBack = 0;

  for (const e of earnings) {
    if (e.status === "reversed" || e.amount_cents <= 0) continue;

    if ((e.status === "held" || e.status === "payable") && !e.payout_batch_id) {
      const { data } = await admin
        .from("creator_earnings")
        .update({ status: "reversed", meta: { ...(e.meta || {}), reversed_reason: reason } })
        .eq("id", e.id)
        .in("status", ["held", "payable"])
        .is("payout_batch_id", null)
        .select("id");
      if (data?.length) {
        reversed += e.amount_cents;
        continue;
      }
    }

    const { inserted } = await addEarning(admin, {
      brand_id: e.brand_id,
      program_id: e.program_id,
      program_member_id: e.program_member_id,
      creator_id: e.creator_id,
      program_video_id: e.program_video_id,
      kind: "adjustment",
      amount_cents: -e.amount_cents,
      source_key: `${keyPrefix}:${e.id}`,
      meta: { reason, reverses: e.id },
    });
    if (inserted) clawedBack += e.amount_cents;
  }

  return { reversedCents: reversed, clawedBackCents: clawedBack };
}

// Move held earnings whose hold has passed to payable.
export async function promoteHeldEarnings(admin, now = new Date()) {
  const { data, error } = await admin
    .from("creator_earnings")
    .update({ status: "payable" })
    .eq("status", "held")
    .lte("available_at", now.toISOString())
    .select("id");
  if (error) throw error;
  return data?.length || 0;
}
