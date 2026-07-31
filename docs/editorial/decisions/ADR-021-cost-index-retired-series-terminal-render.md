# ADR-021 — A dead Cost Index feed ends in a terminal page, not a frozen one

- **Status:** Accepted (2026-07-31)
- **Date:** 2026-07-31
- **Owner:** Founder (Don Goldstein)
- **Review by:** the first time a BASKET CONTRIBUTOR retires, or if a retired feed ever comes back
- **Relates to:** ADR-010 (citable publication), ADR-013 (public-data policy), ADR-015 (open-data surfaces),
  `scripts/build-cost-index.mjs`, `scripts/build-cost-index-pages.mjs`,
  `scripts/check-cost-index-orphans.mjs`, `scripts/check-cost-index-series-freshness.mjs`

> Decision: **when a public feed stops publishing, its ingredient page becomes a terminal render** —
> "this series stopped publishing, last measured `<date>`" — with its history preserved, its URL
> alive, and the ingredient out of the basket. The last-good state is archived automatically at the
> moment the builder drops it, and the retirement is only accepted by CI once the published page
> actually says so.

## Context

`build-cost-index.mjs` drops an ingredient when every one of its points fails the fact gate — the
carry-forward path's `if (!kept.length) continue;`. That drop is correct for the DATA: a dead feed
must age out rather than freeze a stale level on the dashboard.

It was not correct for the PAGE. Nothing deleted `cost-index/<slug>/index.html` or its `/es/`
mirror, nothing removed it from `sitemap.xml`, and the page builder's `--check` only diffs files it
still generates. The published bilingual page kept showing its last live reading, as if current,
forever. `check-cost-index-orphans.mjs` (2026-07-30) made that visible — but every disposition it
could offer was hand-work, and its own closing note said so: *"options 2 and 3 have no runbook or
precedent yet — no cost-index ingredient page has ever been retired."*

That left CI with a red it could not clear — and the deadline was not 2026-08-29, as the roster
suggested. Replaying the next refresh against the committed data on **today's** clock drops
**`scallops`**: both of its points fail, the older on `stale`, the 2026-05-01 one on `stale-level`.
The first real retirement is the next scheduled refresh, not next month.

(The same replay confirms that refresh clears all 24 `check-cost-index-sync` errors standing on
`main` right now — the 2026-04-01 tail crossed the 120-day cliff on 2026-07-30, one day after the
last refresh ran, so the deploy has been blocked since. That is the carry-forward filter and PR
#536's `mergePoints` fix doing their job; it needed no change here.)

The simulation run while building this (freeze the clock 40 days forward, hand the builder an empty
artifact) produced **13** drops, not the 6 the freshness roster predicted. The extra seven — among
them `parsley` and `yellow-squash`, both reading `asOf` three days old — are dropped by
`stale-level`, not `stale`: their composite date is fresh while the price provenance behind it is
from 2026-05-01. The dead-feed roster was counting them as live. That miss is fixed here too.

## Decision

1. **Retirement is an accepted end-state, alongside "live data".** A published ingredient page must
   have live data OR be a terminal render. There is no third state, and deleting the directory
   remains forbidden — slugs are final-forever, and a quiet delete would satisfy the orphan gate
   while destroying every deep link and citation pointing at it.
2. **The last-good state is archived at the moment of the drop**, into
   `data/cost-index-retired.json`, by `build-cost-index.mjs`. That is the only moment the record
   still exists; one line later the index has forgotten the ingredient entirely.
3. **A retired page may show its last measured DOLLAR figure only if that point would have shipped
   while it was live.** Two rules, both inherited rather than invented:
   - the archive keeps `lastPoint` only when every issue on it is an AGE issue (`stale`,
     `stale-level`). A point that was out of bounds or had lost its source was never publishable and
     does not resurface under a "last measured" label just because the feed also died;
   - the page prints a price only when that point clears `isShippable()`. This matters most for the
     series most likely to die: the NOAA-sourced seafood, whose level is demoted to `basis:'index'`
     precisely because import trade value runs about half of delivered wholesale. Retiring a page
     must not become the back door that finally prints those numbers as a price. All six of the
     imminent cohort are non-shippable, so their pages carry the date and no dollar figure.
4. **The archive alone does not satisfy the gate.** `check-cost-index-orphans.mjs` accepts a retired
   slug only when the PUBLISHED page carries the `cost-index:retired` marker. Listing a slug in a
   JSON file can never mute the check for a page nobody rebuilt — that would reintroduce the silent
   freeze through the door meant to fix it. Live data + an archive entry at once is a contradiction
   and fails.
5. **Retirement is reversible and self-clearing.** If the feed publishes again, the ingredient is
   vendored, the build removes its archive entry, and the page returns to a live reading. Nothing is
   hand-maintained; "retired" cannot outlive the condition that caused it.
6. **The dead-feed roster now counts down to the date that actually governs** — the older of the
   composite `asOf` and the oldest `level.provenance` date — and says which one it is.

## Consequences

- **`scallops` retires on the next refresh, and resolves inside that same run.** A keyed refresh archives; the
  page build renders; the gate goes green because the pages tell the truth, not because anything was
  suppressed.
- **The hub gains a "Retired series" section**, each entry with its last measured date. Without it a
  terminal page would be published, in the sitemap, and unreachable from the index of the index.
- **Basket coverage falls when a contributor retires**, and the page says so. That is the intended
  behavior — the alternative is a headline carried by a number nobody is measuring any more.
- **`series.json` / `series.csv` survive retirement** for a shippable slug, with `asOf: null` and a
  `retired` block, so a downstream consumer's parser learns the series ended instead of reading a
  frozen tail as current. Non-shippable slugs get no data file, exactly as while they were live.
- **Two ingredients were a month from silent retirement** and the roster called the index healthy.
  Fixed, with the case pinned in the self-test.
- **A live falsehood was found and fixed in passing**: the edible-yield block told readers "your true
  cost per usable pound runs higher than the purchase price" on the eight ingredients whose yield is
  1.0 (the ground meats, the berries, shrimp P&D, scallops). At 100% yield that is simply false.
  Those now get their own true sentence.
- **Not covered:** no ingredient page has actually retired yet, so this path has been exercised only
  against a simulated cliff (clock frozen +40d, empty artifact, full page build, all gates run, five
  mutations verified to fail the gate) — never against a real keyed refresh, which runs on the
  operator's Mac. The first real retirement should be watched, not assumed.

## Alternatives rejected

- **Delete the page and 301 it.** Rejected: slugs are final-forever, external citations point at
  these URLs, and a redirect answers "where did the price go?" with silence. It also satisfies the
  orphan gate by removing the evidence, which is the failure mode that gate exists to catch.
- **Freeze the page and add a banner by hand.** Rejected: 18 series are frozen today and 13 drop in
  the next simulated cliff alone. Hand-authoring does not survive contact with that volume, and the
  one that gets forgotten is indistinguishable from the bug.
- **Keep the last price on the page without the shippable test.** Rejected: it would print the NOAA
  trade-value numbers as wholesale prices, which the whole `basis:'index'` demotion exists to
  prevent — and it would do it at the moment nobody is watching the page any more.
- **Let the freshness gate keep counting down on `asOf` alone.** Rejected once the simulation showed
  it wrong for a whole class of series. A countdown that is silently wrong reads as an all-clear.
