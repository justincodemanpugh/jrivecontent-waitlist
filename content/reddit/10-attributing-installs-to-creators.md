---
title: "How to actually tell which creator drove your app installs (the store doesn't tell you)"
status: draft
pure_value_subs: [r/iOSProgramming, r/androiddev, r/gamedev, r/ASO]
soft_ps_subs: [r/AppBusiness, r/reactnative, r/FlutterDev]
posted_to: []
---

The hard part of using creator UGC for an app isn't the videos, it's knowing
which creator is worth re-paying. TikTok to the App Store / Play Store drops
almost all the referral data on the floor. Here's what actually works, cheapest
first.

**1. Onboarding "how did you hear about us"**
One tap, free to build, lossy but directionally useful. Add a per-creator option
when you're running a handful of them.

**2. Per-creator promo / offer codes**
If you have IAP or a subscription: issue each creator a unique code for a free
trial or discount. Clean attribution when it's redeemed, and it gives the creator
something concrete to say in the video. Apple offer codes and Play promo codes
both do this.

**3. Per-creator store campaign links**
- iOS: a Custom Product Page plus a campaign link with its own token, one per
  creator. Shows up in App Analytics by source.
- Android: a Play Store URL with `utm_source` / `utm_campaign` per creator via
  the Play URL builder, readable in the Play Console.

These undercount (people search your app name instead of tapping through) but the
trend is real.

**4. Spike correlation**
Log every creator's post time and view count. Watch installs in the 24-48h
after. With 5-10 creators posting on different days you can attribute most of
your spikes by hand. Not court-admissible, good enough to decide who to keep.

**What to record per creator, per week**

Videos posted vs agreed · median views · installs in the 48h post-window · cost
per attributed install · whether they've had an outlier (>3x their median) yet.

**Decision rule**

Bottom of the pack on cost-per-install for two months with no outlier hit: stop,
move that budget to your top two. A creator who's expensive per view but whose
installs actually activate and pay: keep them.

For games, codes usually don't apply, so lean on 1 and 4 and weight D1 retention
of the installs each creator brings, not just the count.

---

<!-- SOFT P.S. — append only for r/AppBusiness, r/reactnative, r/FlutterDev -->

> Doing this by hand across a bunch of creators is why I ended up building a tool
> for it. The methods above work fine in a spreadsheet though — that's the part
> that matters.
