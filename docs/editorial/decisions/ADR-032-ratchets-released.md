# ADR-032 — The ratchets are released: traffic, audio, parity, analytics

**Status:** Proposed — awaiting founder ratification (queue Q-019)
**Date:** 2026-08-07
**Owner:** Don Goldstein
**Related:** ADR-025 (the storefront is an audit file — what each page is FOR),
ADR-030 (one price, one cohort), ADR-033 (the ninety days and its falsifiers),
ADR-001 (per-language audio fact gate), ADR-002 (email and es-MX gates)

> **Decision.** Four standing ratchets are released. **Traffic is not an
> objective and list growth is not a metric** — the storefront's measure is
> qualified applications and whether the CPA said yes. **The audio pipeline takes
> no new work**: the manifest freezes at what is rendered and no new figure
> incurs a narration obligation. **EN↔ES parity stops being a site-wide ratchet**
> and is scoped to `/es/cost-index/`; everything else is released, and the
> Spanish 24-hour reply and phone-callback promises come down today because
> nothing establishes the company can keep them. **Analytics is scoped to the
> qualification path** — 72 instrumented pages, not 274 — because measuring 1,277
> pages whose measure has been abolished is an obligation pretending to be
> insight. A ratchet is a promise that renews itself on every edit; these four
> renew against a business that no longer consumes them.

## Context

ADR-025 established that the storefront's job is qualification, not traffic:
roughly forty customers ever needs on the order of four hundred qualified
readers, and the reader who decides is the bookkeeper or the CPA the owner
forwards the link to. That ADR dispositioned every page. **It did not release the
per-edit obligations**, and those are the actual cost.

Measured in `data/surface-disposition.json#summary` on 2026-08-07:

| ratchet | standing obligation | released by this ADR |
|---|---|---|
| audio | 114 rendered tracks; `check-audio-fabrications.mjs` runs the fact gate per spoken language; every new figure needs `data-audio-alt` ≥ 80 chars | 100 tracks released; 0 new tracks ever |
| ES parity | 1,297 hreflang pairs; `check-locale-parity.mjs` on every surface edit | scoped to `/es/cost-index/` |
| analytics | 274 tagged pages | 221 tags removed; 72 kept |
| cite drawers | 311 across 94 pages, each a dated claim someone must re-verify | 177 released, 134 maintained |

The audio obligation is the clearest case. No $600 buyer has ever asked for
narrated prose; there is no evidence any human has listened to a track; and the
cost is not the 114 existing files but the ≥80-character `data-audio-alt`
enforced in CI on **every new figure forever**, plus a language-aware fact gate
that will speak a wrong number aloud in six languages if one slips through.

The Spanish case is worse than dormant — it is an uncosted promise. The ES
funnel is dead at every terminus: 2 of 651 ES pages carry a waitlist, 1 of 384 ES
subscribe boxes emits a mailable source, and zero ES dispatch editions exist. Yet
`apps/web/lib/copy.es.ts` promises a reply "en 24 horas, en tu idioma" and a
phone callback "te llamamos en 24 horas," from a one-person company with no
artifact anywhere establishing conversational Spanish. That is not a parity gap.
It is a service-level promise made to a Spanish-speaking operator that nobody has
committed to keeping, published by a company whose entire position is that its
claims are checkable.

## Decision

### 1. Traffic is not an objective; list growth is not a metric

Neither appears in any plan, checkpoint, or report of record. The measures that
replace them, and the only ones tracked, are:

- **qualified applications** (a 1-3 location independent, 8-12 active specialty
  vendors, zero or one broadliner),
- **whether the reviewing CPA said yes** (`docs/handoff/receipts/cpa-review.json`),
- **`deskMinutesPerClose`**, instrumented from customer one and published.

Sessions, subscribers, impressions and rankings may be observed. None is a goal,
and no work is justified by moving one.

### 2. The audio pipeline takes no new work

`data/article-audio.json` freezes at its current contents. **No article, figure
or page created from today forward carries an audio obligation.** The ≥80-char
`data-audio-alt` requirement in `check-article-graphics.mjs` continues to apply
to figures on pages that already have rendered tracks and to nothing else. The
100 tracks on released pages are left on disk — deleting them buys nothing and
breaks links — but they are not re-rendered, not corrected, and not extended.

`check-audio-fabrications.mjs` stays wired: the tracks that exist are still
spoken claims, and a live falsehood is a live falsehood whether or not the
subsystem is growing.

### 3. EN↔ES parity is scoped to `/es/cost-index/`

Parity is enforced on the Cost Index Spanish surfaces and nowhere else. Every
other ES page is frozen: it keeps its URL, its hreflang pair and its content, and
loses the ratchet that made an EN edit into an ES obligation.

**The Spanish service promises come down today.** The 24-hour reply and the phone
callback in `copy.es.ts` are replaced with what is actually true about response
time and language, and if nothing is true, the promise is removed rather than
softened. This is a same-day change, not a queue item to age.

### 4. Analytics measures the qualification path only

72 instrumented pages — the pages a qualified buyer or a reviewing CPA actually
touches — and 221 tags removed. Measuring the corpus was an obligation to
maintain a measurement nobody read, on pages whose disposition is now `freeze`.

### 5. What is NOT released

Named explicitly, so releasing ratchets is not read as releasing standards:

- **The fact gate is absolute** and applies to every word on every page,
  frozen or not. A frozen page may not contain a falsehood.
- **`check-fabrications.mjs`, `check-src-sentinel.mjs`, the corrections ledger
  and the basis rules (ADR-023)** all keep running everywhere.
- **Slugs are still final-forever.** Freezing is not renaming.
- **The 306 Cost Index pages stay fresh.** They are the published basis the close
  is priced off — the public half of a paid deliverable's audit trail — and their
  data cadence is automated, not founder-paid.

## Consequences

- **Per-edit cost falls sharply on 921 pages** and rises on none. The 406
  maintained pages get the attention that was spread over 1,327.
- **A future ES launch costs more.** Restarting parity after a freeze means
  re-verifying, not merely translating. That is accepted: the ES funnel converts
  nothing today, and a promise kept badly in Spanish is worse than a page frozen
  honestly.
- **Some frozen pages will drift out of date.** They keep their URLs and their
  inbound links, and they carry no dated cites to re-verify — which is exactly
  what `freeze` means. A page that is merely old is not a page that is wrong.
- **The audio investment is sunk and stays sunk.** 114 tracks, none of them
  evidenced as used, and no further hour spent finding out.
- **Nothing here is a deletion.** ADR-025's rule holds: freezing is the default,
  deletion is the exception (14 pages, all provably dead), because a URL costs
  nothing and what costs is maintenance.

## Alternatives rejected

- **Keep the ratchets and just work faster.** Rejected on measurement: roughly 3
  of 31 maintenance-hours-due were paid in the 30 days to 2026-08-07. The ratchets
  are already not being honored; this ADR makes the reality legible instead of
  letting six trust artifacts lapse silently, which is what actually happened.
- **Delete the frozen surfaces outright.** Rejected by ADR-025 and by
  measurement: only 14 pages are both orphaned and unreachable. Deleting a page
  that nothing links to retires no obligation, and deleting one that something
  links to destroys a real asset.
- **Keep ES parity, drop only audio.** Rejected: ES parity is the more expensive
  ratchet (1,297 pairs against 114 tracks) and the one making a promise the
  company cannot keep. Dropping audio alone would leave the uncosted Spanish SLA
  live.
- **Keep site-wide analytics "because data is cheap."** Rejected: the tag is
  cheap and the obligation is not. An instrumented page is one someone is
  expected to look at, and 274 pages nobody looks at is a dashboard that trains
  its owner to ignore dashboards.
