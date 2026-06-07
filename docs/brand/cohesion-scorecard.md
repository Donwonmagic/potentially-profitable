# Cross-Site Brand Cohesion Scorecard

A **re-runnable, falsifiable** measure of how coherent the Muntin brand is across
the two repos. The point is not a precise grade — it is a *repeatable* one, so
"are we more cohesive than last cycle?" has an evidence-backed answer and your
decisions have to move a number, not a vibe.

- `{site}` = `potentially-profitable` · `{product}` = `Muntin-Invoice-Decoder`
- **Score each dimension 0–3:** `0` broken/absent · `1` real drift present ·
  `2` mostly aligned, manual · `3` aligned **and** enforced by a gate (can't
  regress silently). A `3` is the goal for everything: cohesion that a human has
  to remember is cohesion that will rot.
- Run it at the **start and end of every cycle**; record the date + total; keep
  the history in this file so the trend is visible.

## How to run (≈20 min)

1. `{site}`: `node scripts/check-all.mjs` — captures the gate truth.
2. `{product}`: run the `node-lints` gate set (see `.github/workflows/ci.yml`):
   `check-tokens-parity`, `check-contrast`, `check-icon-source`,
   `check-focus-discipline`, `check-keyframes-allowlist`, `check-voice-boundary`,
   `check-verboten-phrases`, `check-copy-grade`.
3. Run the live generators (`node scripts/build-og-cards.mjs`,
   `build-dark-mode.mjs`) and **eyeball the output in a browser** — gates don't
   see taste.
4. Score the table. For anything < 3, link the evidence (file:line) and the ADR
   that will fix it.

## The dimensions

| # | Dimension | What it measures | How to check | Target |
|---|---|---|---|---|
| 1 | **Token-spine parity** | The one palette is byte-identical across repos | `check-tokens-sync` ({site}) + `check-tokens-parity` ({product}) both green; `EXPECTED_SPINE_HASH` matches | 3 |
| 2 | **Single-accent discipline** | No rogue accent fragments the identity | Grep generators/CSS for accents outside the spine; resolve the **"Golden Hour" marigold/coral** in `{site}/scripts/build-og-cards.mjs:62-67` | — |
| 3 | **Palette currency** | No *retired warm* hexes in chrome | `migrate-warm-palette --check` ({site}); grep both for `#1F4E5B`/`#FAF7F2`/`#B8541A` | 3 |
| 4 | **Voice-register boundary** | "Don" never in product; no fake-team "we" in studio | `check-voice-boundary` ({product}) + `check-banned-words` ({site}); spot-read product copy + studio copy | 3 |
| 5 | **Naming coherence** | Canonical names everywhere; no orphan names | `check-name-coherence` ({site}); confirm "Muntin Ledger" / tool names vs `{site}/data/tools.json`; **resolve "the Workshop" vs "Ledger"** | — |
| 6 | **Mark geometry** | One window-mark spec across all encodings | Diff the transom ratio (top 9.5u / lower 15.5u, r6, channel 3u) across `WindowMark.tsx`, `muntin-ledger.svg`, `BrandGradientField.tsx`, and `{site}/brand/mark/` | — |
| 7 | **OG / social currency** | Cards on the current palette + per-surface coverage | `check-og-coverage` / `check-og-images` ({site}); render a sample, eyeball | 3 |
| 8 | **Contrast / a11y** | AA in both light and dark | `check-contrast` (both repos) | 3 |
| 9 | **Cross-seam coherence** | Funnel + shared entity strings agree | Read `{site}/data/ledger-cta.json`, `{product}` `MarketingFooter.tsx`, `funnel-emit.ts`; confirm shared Org `@id` + event names | — |
| 10 | **Doc currency** | The "official" docs match the code | Confirm the 3 stale docs are superseded by the current guideline (not cited as truth) | 3 |

## Current snapshot — 2026-06-07 (cycle 1, re-scored against live code)

Re-scored from gate truth + live greps (not the prior agent estimate). Dims 1, 3, 8
spot-verified live this cycle; the moved dims (2, 7, 10) reflect this cycle's work.

| Dim | Score | Note |
|---|---|---|
| 1 Token-spine parity | **3** | Verified live: `data/muntin.tokens.json` ↔ `{product}/packages/ui/muntin.tokens.json` **byte-identical**; both hashes `3681742a…` match. Sync still *manual* (P1, a fragility not a score hit). |
| 2 Single-accent | **2** ↑ | Golden Hour **decided + documented** (ADR-001 + `visual-system.md §3`): blessed as editorial-only, excluded from spine/`{product}`. Not yet **3** — the scope **gate** is pending (P1). |
| 3 Palette currency | **3** | Verified: `brand/og/*.svg` carry **0** retired-warm hexes; cool spine throughout. Warm gate-forbidden in chrome. |
| 4 Voice boundary | **2** | Enforced one-directionally (the "Don" gate lives only in `{product}`); the merged two-tier banned list is specified but not built (P1). |
| 5 Naming | **2** | Canon is clear; the "Workshop / Workbench / Ledger" relationship is undocumented (P2). |
| 6 Mark geometry | **2** | Geometry duplicated in ≥4 places; no single spec governs them (P2). |
| 7 OG currency | **3** ↑ | Palette current + coverage gated (`check-og-*`) **and** the Golden Hour layer is now governed (ADR-001), no longer an ungoverned accent. |
| 8 Contrast | **3** | AA gated in both repos, both themes. |
| 9 Cross-seam | **2** | Funnel + shared Org `@id` exist; the hardcoded studio inbox + `/window` coupling is undocumented (P2). |
| 10 Doc currency | **2** ↑ | `visual-system.md` published; the 3 stale docs carry dated supersession banners. Not yet **3** — no gate asserts docs match code (refresh on cadence). |
| **Total** | **24 / 30** | +3 from baseline via the cheapest predicted jumps (10, 2, 7). Next cheapest: the Golden Hour scope gate (2→3) and the merged banned list (4→3). |

> History (append each cycle): `YYYY-MM-DD — NN/30 — one-line what moved`.
> `2026-06-07 — 21/30 — baseline.`
> `2026-06-07 — 24/30 — cycle 1: kit synced; visual-system.md guideline published; Golden Hour blessed (ADR-001); 3 stale docs superseded.`
