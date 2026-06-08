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
| 1 Token-spine parity | **3** | Verified live: `data/muntin.tokens.json` ↔ `{product}/packages/ui/muntin.tokens.json` **byte-identical**; both hashes `3681742a…` match. Sync is now **scripted + documented** (`vendor-tokens.mjs` + `token-spine.md`, cycle 8) — the P1 fragility hardened, not just noted. |
| 2 Single-accent | **3** ↑ | Golden Hour decided (ADR-001) **and gate-enforced** (cycle 2): `{product}/check-editorial-accent-boundary.mjs` bans the hexes anywhere in the product; `{site}/check-tokens-sync.mjs` keeps them out of the shared spine. Negative-tested. |
| 3 Palette currency | **3** | Verified: `brand/og/*.svg` carry **0** retired-warm hexes; cool spine throughout. Warm gate-forbidden in chrome both repos — `migrate-warm-palette` ({site}) + `check-brand-asset-palette` ({product} icon/favicon, cycle 4, after re-pigmenting the favicon). |
| 4 Voice boundary | **3** | Two-tier banned list, **fail-CI in BOTH repos**, with the anti-overclaim cluster (`seamless`/`powerful`/`Welcome to`/`AI-powered`) now also on {site} — **marketing-surface-scoped** (cycle 10), after an audit showed all 7 site uses are legit editorial/critique (Tier-1b in canon §3a). Earlier base: (cycle 9: cleared the 13 pre-existing {site} hits — meaning-preserving rewrites of "move the needle"/meeting-speak, fixed at source in `topic-essays.json`/`article-content.json`/`library-tags.json` + re-rendered — and promoted `check-banned-words` to `--check`; also tightened the leverage regex's `highest-leverage` false positive). Shared Tier-1 core in both gates, now drift-proof: a single source of truth (`data/banned-core.json`) + `check-banned-core-sync.mjs` cross-repo guard, fail-CI in both (cycle 11, canon §3a). |
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
> `2026-06-07 — 29/30 — cycle 8: hardened the token-sync P1 — vendor-tokens.mjs (scripted copy + hash + cross-repo diff) + token-spine.md runbook. Score holds; structural fragility reduced.`
> `2026-06-07 — 29/30 — cycle 9: cleared the 13 {site} banned-word hits (fixed at source + re-rendered) and promoted check-banned-words to --check — Tier-1 now fail-CI both repos. Dim 4 hardened to a symmetric 3.`
> `2026-06-08 — 29/30 — cycle 10: audited the anti-overclaim cluster on {site} (7 hits, ALL legit editorial/critique, 0 on marketing surfaces) → added Tier-1b marketing-surface-scoped (no copy rewrites needed), with a negative test. Closed the §3a backlog item honestly. Score holds.`
> `2026-06-08 — 29/30 — cycle 10b: locale-parity follow-through — mirrored Tier-1b into Spanish on es/ brand surfaces (potente/sin esfuerzo/Bienvenido a); audit caught one drifted line (es/for/restaurants "pasan sin esfuerzo", absent from EN source) and fixed it; negative-tested. Logged the global-Tier-1 Spanish-mirror gap as P3. Score holds.`
> `2026-06-08 — 29/30 — cycle 11: closed the last unenforced "keep in sync" instruction — built data/banned-core.json (single source of truth, vendored to both repos) + check-banned-core-sync.mjs (cross-repo Tier-1 drift guard, fail-CI in both lint jobs, self-tested). Audit confirmed the 9-word cores already matched; tightened two product regexes (\b anchors) so bodies are byte-identical. This is the §4 item-3 merged-list follow-on, landed for Tier-1. Dim 4 now structurally drift-proof.`
> `2026-06-08 — 29/30 — cycle 12: extended the sync guard to Tier-1b (seamless/powerful/Welcome to/AI-powered) — added a tier1b list to banned-core.json + tier1b-core sentinels in both gates; audit found the AI-powered patterns had already diverged (/AI[ -]?powered/ vs /\\bAI[- ]?powered\\b/), reconciled to one anchored body; regrouped the product's four contiguous. 13 shared-core entries now drift-guarded both ways. Negative-tested per-tier. Score holds.`
