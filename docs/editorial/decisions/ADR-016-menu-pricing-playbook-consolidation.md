# ADR-016 — Consolidate the research pages into the menu-pricing playbook; gate seasonal windows against noise

- **Status:** accepted
- **Date:** 2026-07-11
- **Context branch:** `claude/vendor-benchmark-redesign-yn273q`
- **Supersedes:** the Workstream-F research surface introduced under ADR-015 (`/cost-index/research/`, seven pages + hub, EN+ES).

## Context

Workstream F shipped seven "educated-inference" research pages (steady-vs-wild,
what-moves-together, trim-tax, shock-duration, cheapest-month calendar,
invoice-vs-wholesale, protein-volatility). In review the founder judged them
"very slim and surface level — I would rather do 1 quality piece than 7 halfway
pieces." Each page stretched a single computed number across ~800 words; none
let an operator act on their own menu.

Two decisions followed, taken with the founder.

## Decision 1 — one decision-grade piece, not seven thin ones

Retire the seven research pages + hub. Fold their strong kernels into a single
interactive **menu-pricing playbook** at `/cost-index/menu-pricing/` (EN+ES)
that joins **four data layers per ingredient**: pricing posture
(lock/cushion/float/withhold + band), true cost per edible portion
(trim tax = 1/yield), the seasonal buying window, and the co-mover whose swap
saves nothing. It renders an interactive per-ingredient card picker, a deep
teaching guide, and a 100-row at-a-glance table — all from the deterministic
engine (`scripts/lib/cost-research.mjs` `pricingCards()` + `researchInputs()`),
grounded by `check-cost-research.mjs`.

- **Registry, not read-me content, for the events** (ADR-015's other surface):
  the events registry + open datasets + ingredient-page co-occurrence context
  stay; the 39 per-event read-me pages are handled separately (follow-up).
- **No dead links.** `/cost-index/research/` (+ `/es/`, hub, every slug,
  sub-paths) 301 → `/cost-index/menu-pricing/` via the Worker
  (`src/worker.js`), not `_redirects` (which is at Cloudflare's 100-rule cap).
  Sitemap regenerated; the `/open` "the read" callout now points at the playbook.

## Decision 2 — a seasonal window is named only when the trough clears the noise

The founder caught the cheapest-month layer asserting "whole turkey cheapest in
February, save 35%." That was a **noise artifact**: turkey's monthly medians
scatter (Jan 167¢, Feb 109¢, Mar 149¢), and January's own 25th-percentile week
(89¢) already buys under a typical February (109¢) — so a normal January is
cheaper than a normal February. Naming Feb a buying window would invent a
repeatable signal the data does not support.

`pricingCards().timingFor()` now names a cheapest-month window **only when the
trough is robust**, item by item (never a category rule):

1. the cheap month's median beats the **peak** month's 25th percentile
   (the trough clears even good weeks of the dear month), **and**
2. the peak-to-trough swing is **≥ the median within-month IQR**
   (the season moves the price more than the ordinary month-to-month scatter).

Fail → **no window; price it year-round** (`reason: 'noisy'`), distinct from
`'thin'` (no multi-year history) and `'flat'` (real trough, < 15% save). On the
current basket this suppresses 20 noisy windows (incl. whole turkey) while
keeping 54 real ones. Surviving windows are framed descriptively ("has
historically run cheapest around X"), never as a forecast.

- **Protein seasonality is taught, not hidden** (founder's ask). The guide's
  section 4 teaches the counterintuitive real read: the cut bottoms out *after*
  its demand peak (ribeye Aug −26%, striploin Sep −40%), the freeze angle that
  makes a protein window actionable where a produce one is not, and whole turkey
  as the myth-buster (steadiest band on the board at ±0.8%, no readable window).

## Consequences

- Honesty gate `check-cost-research.mjs` grounds every playbook number
  (`pricingCards` band %, trim tax, edible %, save %, co-mover k/n + the split
  counts). Adversarial verify in the guide workflow additionally caught a
  driver→price causal sentence and a spelled-out invented span ("six-week")
  that the digit-only gate would miss — both removed.
- `emitResearchPage` / `emitResearchHub` in the engine are now dead (kept for
  now; the figure renderers still feed `researchInputs`). A later cleanup can
  remove the unused renderers once the events follow-up settles.
- Follow-up: the playbook is currently prose-heavy; a data-figure layer (the
  print/float split, the protein-hold-vs-produce-swing bars, the trim-tax
  ladder, the backward-season chart) is the next pass to make it read as a
  modern data study, not an essay.
