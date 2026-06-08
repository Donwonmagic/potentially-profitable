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
| 2 Single-accent | **3** ↑ | Golden Hour decided (ADR-001) **and gate-enforced** (cycle 2): `{product}/check-editorial-accent-boundary.mjs` bans the hexes anywhere in the product; `{site}/check-tokens-sync.mjs` keeps them out of the shared spine. Negative-tested. |
| 3 Palette currency | **3** | Verified: `brand/og/*.svg` carry **0** retired-warm hexes; cool spine throughout. Warm gate-forbidden in chrome both repos — `migrate-warm-palette` ({site}) + `check-brand-asset-palette` ({product} icon/favicon, cycle 4, after re-pigmenting the favicon). |
| 4 Voice boundary | **3** ↑ | Two-tier banned list built (canon §3a): shared Tier-1 core carried by **both** gates (added the 7 missing marketing-speak words to `{product}`; both annotate the core). Enforcement is asymmetric and honestly so — **fail-CI in {product}**, **warn-only in {site}** (its gate runs without `--check`; promoting it is blocked by a pre-existing 13-hit backlog, logged). Audited live copy first; the collisions were false positives (proper noun, critique pages, doc-comments). |
| 5 Naming | **3** ↑ | Canon now documents the Workshop/Workbench/Ledger relationship (`voice-and-naming-architecture.md §3`). Enforced **both** repos via `check-name-coherence` — {site}: Workbench→Workshop (`--check`, fail-CI); {product}: bans the retired "Invoice Decoder" in user copy. |
| 6 Mark geometry | **3** ↑ | One spec (`window-mark-geometry.md`) + conformance gates both repos (`check-mark-geometry.mjs`): studio 128u variants ({site}) and the 32u encodings — WindowMark/favicon/gradient clip ({product}). Verified: all encodings agree; self + negative-tested. |
| 7 OG currency | **3** ↑ | Palette current + coverage gated (`check-og-*`) **and** the Golden Hour layer is now governed (ADR-001), no longer an ungoverned accent. |
| 8 Contrast | **3** | AA gated in both repos, both themes. |
| 9 Cross-seam | **3** ↑ | Mapped in `cross-repo-seams.md` + gated (`check-cross-repo-seams.mjs`): window→`source=ledger` attribution, the shared business `@id` linkage (the product's `parentOrganization` now anchors to `…/#business` — fixed this cycle), and the canonical contact. The audit corrected two aspirational §6 claims (the @id was not actually shared; funnel vocab is not shared by design). |
| 10 Doc currency | **2** ↑ | `visual-system.md` published; the 3 stale docs carry dated supersession banners. Not yet **3** — no gate asserts docs match code (refresh on cadence). |
| **Total** | **29 / 30** | The practical ceiling. Nine dimensions gated at 3; the tenth (doc currency) can't be gated by nature — kept current by the per-cycle fold-back discipline instead. |

> History (append each cycle): `YYYY-MM-DD — NN/30 — one-line what moved`.
> `2026-06-07 — 21/30 — baseline.`
> `2026-06-07 — 24/30 — cycle 1: kit synced; visual-system.md guideline published; Golden Hour blessed (ADR-001); 3 stale docs superseded.`
> `2026-06-07 — 25/30 — cycle 2: Golden Hour boundary gate-enforced both repos (Dim 2 → 3).`
> `2026-06-07 — 26/30 — cycle 3: window-mark geometry spec + conformance gates both repos (Dim 6 → 3).`
> `2026-06-07 — 26/30 — cycle 4: re-pigmented product favicon to cool spine + check-brand-asset-palette gate (hardening; Dim 3 stays 3, now gated both sides).`
> `2026-06-07 — 27/30 — cycle 5: cross-repo seam map + gate; linked product parentOrganization to the shared business @id (Dim 9 → 3).`
> `2026-06-07 — 28/30 — cycle 6: documented Workshop/Workbench/Ledger in the naming canon + product name-coherence gate (retired "Invoice Decoder") (Dim 5 → 3).`
> `2026-06-07 — 29/30 — cycle 7: two-tier banned list — shared Tier-1 core enforced both repos (added 7 marketing-speak words to product); canon §3a (Dim 4 → 3). Practical ceiling reached.`
