---
title: "Building a creator-payments tool solo: the parts I badly underestimated"
status: draft
pure_value_subs: [r/SaaS, r/juststart]
soft_ps_subs: [r/SideProject, r/EntrepreneurRideAlong, r/microsaas]
posted_to: []
---

I've been building a tool to help small founders manage and pay UGC creators. The
"manage creators" half was roughly what I expected. The "pay creators" half was a
swamp. If you're thinking about building anything that moves money to a lot of
small recipients, here's what I wish I'd known.

**Merchant of record vs. just moving money.**
The second you're the one collecting from brands and paying creators, you're in
"are we a payment processor" territory. There's a real legal and tax difference
between facilitating a payment and being the merchant of record. This changes
your compliance surface a lot and it's not a thing you bolt on later.

**International payouts are the hard part, not the domestic ones.**
Paying someone in the US: fine, several good APIs. Paying a creator in Brazil,
the Philippines, Nigeria, the EU: different rails, FX handling, higher fees, some
corridors just don't work, KYC requirements per country. A huge share of small
creators are international, so you can't treat this as an edge case.

**Tax paperwork multiplies.**
W-9s, W-8BENs, 1099 thresholds, VAT questions from EU creators. Collecting and
storing this correctly for every creator before their first payout is
non-negotiable and it's a whole flow.

**Invoicing is a product, not a feature.**
"Generate an invoice" sounds trivial until you have per-creator base fees, a
bonus calc, a payout period, partial months, and a creator who disputes the video
count. The invoice has to show its work or every payout becomes an argument.

**Reconciliation.**
Money in from brands, money out to creators, fees, failed transfers that need
retrying, refunds. Keeping that ledger correct and auditable is quietly most of
the work.

None of this is glamorous and none of it demos well, but it's where the actual
difficulty lives. If you're scoping something similar, budget most of your time
for the money-out side and the compliance around it.

---

<!-- The product mention in paragraph 1 is mild enough for most builder subs.
     For strict subs (r/SaaS pure-value, r/juststart), replace the first
     sentence with: "I've been digging into how creator-payment tools work
     under the hood." -->
