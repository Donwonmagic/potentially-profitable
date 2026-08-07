# ADR-025 — The storefront is an audit file, not an acquisition engine

**Status:** Accepted
**Date:** 2026-08-07
**Owner:** Don Goldstein

> **Decision.** Muntin needs roughly forty customers ever, so the storefront's
> job is **qualification, not traffic**. It is the public audit file a bookkeeper
> or a CPA reads for forty minutes before recommending us — read AFTER a
> conversation, not before one. Every one of the 1,327 routable pages carries a
> **disposition** in `data/surface-disposition.json`: `keep` (maintained),
> `freeze` (URL and index entry kept, every maintenance ratchet released),
> `freeze-noindex` (URL kept, index entry surrendered), `merge`, or `delete`.
> **Freezing is the default and deletion is the exception**, because a URL costs
> nothing and its inbound links are real; what costs is maintenance. The measure
> of this storefront is qualified applications and whether the CPA said yes.
> It is never sessions.

## Context

The company sells a closed month at $600/location/month, hand-invoiced, to
roughly forty locations ever (`data/queue.json#strategy`). Against that, the
storefront is 1,327 pages, 1,433,700 words, 1,058 sitemap URLs and 27,137
internal editorial links, built over fifteen months to be *found*.

The founder's instinct is to maximise the storefront for traffic and consumer
confidence. The doctrine of record says **credibility is a closing asset, not a
demand asset** — it converts consideration into signature, and it does not
convert strangers into consideration. Both cannot be acted on at once, and the
arithmetic decides it: forty customers at a plausible qualified-reader-to-signature
rate is on the order of four hundred qualified readers, ever. Four hundred
readers is not a traffic problem. It is a *credibility* problem wearing a traffic
problem's clothes, and the reader who decides is not a hungry operator scanning
Google — it is the bookkeeper or the CPA the owner forwards the link to.

That reframing has one mechanical consequence, and it is the whole ADR:

> **The cost of a page is no longer its writing. It is its maintenance.**

Measured, from `data/surface-disposition.json`:

| obligation | count | what it costs |
|---|---|---|
| `<details class="cite">` drawers | 311 across 94 pages | every one is a dated claim the fact gate binds someone to re-verify |
| rendered audio tracks | 114 across 109 pages | `check-audio-fabrications.mjs` runs the fact gate per spoken language; a wrong number is spoken aloud |
| ES counterparts | 1,297 hreflang pairs | a parity ratchet on every edit |
| analytics tags | 274 pages | a measurement obligation on pages whose measure has been abolished |
| dead product CTAs | 501 anchors on 402 pages | `data/link-graph.json#summary.productCta` |

A page carrying none of those costs nothing to leave standing. A page carrying
them and serving no one is a liability that grows. **Nothing in that table is
fixed by deleting the page** — it is fixed by releasing the page from the
ratchets, which is what `freeze` means here and why it is not a synonym for
`noindex`.

## The decision

### 1. Five dispositions, one rule ladder, first match wins

`scripts/build-surface-disposition.mjs` reads `data/surface-inventory.json`,
`data/link-graph.json` and `data/content-intent.json` and emits one record per
route. Every rule names the measured signal it fires on, so a future session
re-derives the verdict instead of trusting it.

| disposition | pages | meaning |
|---|---:|---|
| `keep` | 406 | maintained: fact gate applies, cites re-verified, links live |
| `freeze` | 469 | stays at its URL, stays indexable, released from every ratchet |
| `freeze-noindex` | 438 | `noindex, follow` — URL and link equity kept, index entry surrendered |
| `merge` | 0 | thin AND on-thesis AND parent still maintained |
| `delete` | 14 | the provably-dead cut |

The 406 maintained pages are the audit file: 42 company pages (marketing,
product, trust), 304 Cost Index pages, 18 runtime surfaces, 14 tools, 4 dispatch
editions of record, and 24 on-thesis pages carrying live cite drawers.

### 2. Freeze is the default; delete is the exception

Slugs are final-forever (CLAUDE.md). Both freeze flavours **preserve the URL**,
which is why they absorb 907 of the 1,327 pages and deletion absorbs 14. A
deletion that burns inbound-link equity for tidiness is a bad trade, so the
delete set is defined by measured unreachability, never by editorial distaste.

### 3. The provably-dead cut is 14 pages, not 162 — a correction of record

The verdict and queue item **Q-052 both say "162 provably-dead pages."** That
number is `data/content-intent.json#summary.deadWeight.total`, which counts pages
that are frozen **and off-thesis**. It is not the frozen-**and-orphaned** set.
Measured:

- 162 "dead weight" pages — of which **142 are still linked**, median rendered
  in-degree **12**. Deleting them breaks live internal links.
- **24** pages are noindex AND absent from the sitemap AND carry no editorial
  inbound link AND are unreachable by any walk from either home.
- **10 of those 24 are runtime machinery** — `/404.html`, the `/admin/*`
  harness, `/brand/og/preview.html`, the two `embed.html` iframe targets.
  Nothing links to a 404 page on purpose.
- **14 are deletable.** 8,840 words. Seven retired-line operator sheets in EN and
  ES: `daypart-traffic-map`, `holiday-hours-planner`, `photo-refresh-tracker`,
  `reservation-no-show-log`, `signage-spec-sheet`, `social-content-calendar`,
  `vendor-contact-sheet`.

The measurement also caught a trap worth recording. Those 14 each have **rendered
in-degree 1** — from their own hreflang counterpart. They form closed EN↔ES pairs
that no walk of the site can enter. An in-degree test scores them "linked" and
hides them; only a **reachability** test finds them. This is the same class of
error as the three 2026-07-28 root-list bugs in CLAUDE.md: the scanner was fine,
the predicate was wrong.

**And the honest accounting stands: retiring what nothing reaches retires zero
obligation.** 14 pages is 1.1% of the corpus and 0.6% of the words. This cut is
not the retirement. The retirement is §4.

### 4. What actually retires: the ratchets, not the pages

Freezing 907 pages releases, in one decision:

- **177 cite drawers** — dated claims nobody has to re-verify
- **100 audio tracks** — removed from the per-language fabrication surface
- **221 analytics tags** to strip; instrumentation drops to **72 pages**, the
  qualification path only
- the ES parity ratchet on every frozen page
- CTA injection, knit-rail re-runs and smart-next rebuilds on every frozen page

That is the trade this ADR makes: **1.1% of the pages deleted, and roughly 68% of
the pages released from the obligations that consume the founder's 13–26 hours.**

### 5. `merge` is empty, and that is the finding

`data/content-intent.json` proposed 60 merges under the old traffic doctrine —
57 of them the `/library/menu-design-themes/*` pages, the retired Menu Design
Suite's marketing, 239–252 words apiece. Merging costs editorial hours to
consolidate pages the company has just decided to stop maintaining.
`freeze-noindex` buys the identical index hygiene for **zero** editorial hours.
Merge survives as a category, reserved for content that genuinely belongs inside
a page still being maintained, and it is empty today.

### 6. The manifest has teeth

`scripts/check-surface-disposition.mjs` asserts four things: every routable page
has a disposition; nothing marked `delete` is still on disk; every
`freeze-noindex` page actually carries noindex; every `keep` page that is not
runtime machinery is indexable. It **fails today, 223 violations**, which is the
point — the manifest is a decision the site has not executed yet, and the gate is
the work list. It is registered in `check-gate-coverage.mjs#UNWIRED` with its
date, its failing status and this reason, per that gate's own rule: fix the
violations, then wire it, then delete the entry. Wiring a red gate into
`check-all` would red the Cloudflare deploy and teach everyone to ignore the
deploy — the disease this repo already diagnosed in `check-queue` and
`check-idem-coverage`.

## The honest answer to "what is the storefront FOR"

It is the document a stranger reads to decide whether the number can be stood
behind — and it is read **after** the conversation, not before it. That changes
what each page must do:

- **Not** "rank for a query." **Instead** "survive being checked by a
  professional whose job is catching exactly this."
- The 306 Cost Index pages are neither product nor marketing. They are **the
  published basis the close is priced off** — the public half of a paid
  deliverable's audit trail. That is also the first functional inbound-link
  mechanism the 95 orphaned ingredient pages have ever had.
- The strongest asset is not a page that claims honesty (89 of them do). It is
  `/tools/pack-check/`: a thing a stranger can run in a browser that **visibly
  declines to answer** when the evidence is inconclusive. A refusal a stranger
  can execute beats any number of paragraphs about refusing.
- `/close/limits/` — the append-only, code-cited defect register — is the
  document nobody else in the category publishes, and the one the CPA reads
  before recommending us.
- Reach comes last and mostly does not come at all. Amplifying reach across
  surfaces that are still wrong converts a correctness problem into a credibility
  event, and credibility is the only asset this company has.

## Alternatives rejected

**Delete the retired-line corpus.** 419 pages carry retired-line vocabulary and
270 are over the positioning gate's threshold. Deleting them destroys inbound
links and external equity to buy tidiness. `freeze-noindex` removes them from the
index at zero equity cost and zero editorial hours.

**Keep everything maintained and just publish less.** The maintenance is not
publication-driven. Cite drawers go stale on their own, audio needs re-rendering
when prose changes, hreflang parity is checked in CI. Standing still still costs.

**Rebuild the site around `/close/`.** Eight new pages are already queued
(`_toBuild` in the manifest). A rebuild is not needed and is not affordable; the
existing corpus becomes the audit trail behind those eight.

## Consequences

- `data/surface-disposition.json` is the disposition of record. Re-run
  `node scripts/build-surface-disposition.mjs` after
  `data/surface-inventory.json` is rebuilt. It is deliberately **not** an
  `(idem)` builder in `check-all` — registering it would create exactly the
  obligation this repo has learned to refuse: a builder CI verifies that nothing
  re-runs.
- Queue item **Q-052 is corrected in place** from 162 to 14, with the measured
  reason. The queue is append-and-correct, not append-only.
- `check-positioning-drift.mjs`'s ALLOW list and this manifest must agree. The
  manifest is the broader instrument; where they disagree, the manifest is wrong
  and gets rebuilt.
- Site-wide EN↔ES parity stops being a ratchet for frozen pages. It remains
  binding for the 406 maintained ones.
- **Nothing in this ADR authorises publishing anything new.** The honesty debt is
  paid first (queue P0). Freezing is safe to do under a red deploy; publishing is
  not.
