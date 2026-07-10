<!-- The build plan for the device-aware Ledger demo rebuild. Grounded in
     docs/handoff/ledger-audit.md. Durable across context compaction — the
     rebuild spans many commits. Every immutable/honesty rail is quoted from
     the audit; no inventions. 2026-07-10. -->

# Muntin Ledger demo — device-aware rebuild plan

**Grounding:** `docs/handoff/ledger-audit.md` (the deep product/surface/API/design audit).
**Founder mandate (this session), four asks, all confirmed:**

1. **Device-aware, purpose-built compositions, auto-selected** — each device class gets a
   composition designed *for it*, silently chosen by viewport. Replaces today's single
   composition crushed onto every screen via the density lattice.
2. **Full surface tour** — the demo should cover more of the product as distinct beats:
   the Cost-Index **market-check** ("my guy, or the market?"), the same-day **plate re-cost**
   (the P&L "so-what"), the **no-LLM / privacy** proof, and **QuickBooks** export (woven into File).
3. **Slow the motion** to human reading pace (~1.5–2×, with dwell).
4. **Sharpen the type** — rebuild hierarchy on size + weight + colour, not colour alone.

## Non-negotiables (carry through every increment)

- **Immutable numbers, byte-intact:** $24.10 / $24.35 / $29.45; median $24.22; ▲$5.23 / +21.6%;
  thresholds "at least 8%" + "at least $5.00"; $115.80; "$19 a month per location" /
  "$19 al mes por local"; "November 13, 2026"; the `ledger.ga_weeks_out` count sentinel.
- **Honesty rails:** "Canned sample… fires no requests of its own"; "not live controls";
  "Illustrative figures." No live UI that implies a real network call. Any new artifact
  (QBO, market-check, plate re-cost) is labelled illustrative and traces to the product page.
- **The FLOOR:** no internal panel scroll, no page bounce (constant document height across all
  steps per breakpoint), no horizontal overflow — across the viewport matrix (incl. 320×568 and
  1280×700), EN + ES, light + dark; degrades cleanly (reduced-motion, no-JS complete).
- **EN ↔ ES byte-parity** of structure (hide-by-CSS, never by DOM divergence).
- **Gates green** — `scripts/check-all.mjs` (~249 checks) + the article-graphics tests.

## Device classes (the new architecture)

Replace the reductive `≤340/≤360/≤560/≤660-tall…` lattice with three intentional tiers, each a
composition designed for its form factor (not the desktop demo shrunk down):

| Class | Range | Composition intent |
|---|---|---|
| **Phone** | ≤600px | Tall, single-column, **one artifact per beat**, big type (body ≥13px, numerals ≥15px), large touch targets, minimal supporting prose. Vertical rhythm; the stage is the phone. |
| **Tablet** | 601–1023px | Single or light two-column, medium density; inherits the nearer tier and tunes. |
| **Laptop / desktop** | ≥1024px | Wide, two-column artifacts, full richness (rows + chart side by side), hover affordances. |

Each tier is selected by media query only — one DOM, so ES stays byte-parallel; hidden pieces are
`display:none` (never `[hidden]`), returning for the no-JS stacked read.

## The beat sequence (surface tour)

Append new beats **after** Flag so the flag-land climax stays at its hardcoded `i === 3` index; the
CTA moves to the last index. Renumber ids sequentially by DOM order and update the JS regex
(`/^#ld-step([0-9])$/`), `titles[]`, and the rail.

| # | id | Beat | Hero artifact | Source |
|---|---|---|---|---|
| 0 | ld-step0 | The invoice arrives | sample invoice, 5 lines, $115.80 | current |
| 1 | ld-step1 | Read | one line dissected → typed rows; "rules, not a model" | current |
| 2 | ld-step2 | File | searchable ledger + **CSV *and* QuickBooks** export chips | current + QBO |
| 3 | ld-step3 | Flag | price-check chart, ▲$5.23 climax (index pinned) | current |
| 4 | ld-step4 | **My guy, or the market?** | flagged romaine vs the public Cost-Index band | NEW (market-check) |
| 5 | ld-step5 | **The plate re-costs itself** | a dish whose plate cost ticks up ~22¢/head same day | NEW (plate re-cost) |
| 6 | ld-step6 | **Why a platform can't copy it** | the four asymmetries; no-LLM build-gate front-and-centre | NEW (privacy/why-us) |
| 7 | ld-step7 | Put this flag on every line | the ink ask + founding terms (was ld-step4) | current CTA |

Scope honesty for beat 4/5 (from the audit): market-check only applies inside the Cost-Index basket
(wholesale proteins/produce/dairy — not spirits/wine/graded cuts); outside it a raise still files +
re-costs but isn't market-checked. The plate re-cost math is illustrative ($5.23 ÷ 24 ≈ 22¢/head).

## Increment sequence (each independently verifiable + committable)

- **A. Motion → reading pace** *(in progress)* — slow the cross-fade, the step-1 scan, the step-0
  arrive, the flag-land climax chain, the ghost FLIP, and the search-typing; add dwell. Device-agnostic,
  layout-untouched → FLOOR unaffected. Verify light/dark, reduced-motion still instant.
- **B. Type hierarchy** — rebuild the row (`lg-d/v/i/n/s`) on size+weight+colour; lift item + numeral,
  give status a distinct weight/hue. Re-verify FLOOR (size changes affect fit).
- **C. Device-aware architecture** — refactor CSS from density-lattice to phone/tablet/desktop
  compositions for the existing beats. Re-measure stage heights per tier headless.
- **D. Surface tour** — add beats 4/5/6 (per-device), weave QBO into File, renumber CTA→step7,
  rewire JS (regex, titles, rail). Re-verify FLOOR per new beat across the matrix.
- **E. Certify** — full gate run, headless matrix (320×568 … 1280×700, EN+ES, light+dark),
  reduced-motion + no-JS, immutable-number byte check. Commit + push.

*Status is tracked here and in commit messages; this doc is the durable spine if context compacts.*
