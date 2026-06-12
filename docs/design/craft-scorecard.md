# Design Craft Scorecard — Muntin (one palette, two registers)

A **re-runnable, falsifiable** measure of visual-design craft. The point is a
*repeatable* read so "is the system more coherent than last cycle?" has evidence —
and the evidence is a **render in both themes and both registers**, traced to the
spine, not a hex inspected in isolation.

**Score each dimension 0–3 — and the craft bar for `3` is provenance + render:**
`0` absent / broken · `1` partial or off-spine in places · `2` on-spine and
gate-protected · `3` on-spine **AND** gated **AND verified rendered** in light + dark
and both registers. The "verified rendered" clause is the discipline: a token that's
correct in the JSON but never looked at on the real component in dark mode is a `2`,
not a `3`. An asset frozen in a retired palette is a `1` no matter how nice it looked
once.

## How to run (≈40 min, half of it looking at pixels)
1. Run `check-tokens-parity` (product) + `check-tokens-sync` (studio) +
   `check-article-graphics` + `check-contrast`/`check-dark-contrast` + the styleguide
   visual-regression suite for the gate truth.
2. **Scan for drift** (the volatile part): grep both repos for raw hex outside the
   token files; diff against the allowlist. Each orphan is a coherence dock.
3. **Render-check:** open the styleguide in light AND dark; put the two registers
   side by side; confirm illustrations + OG cards trace to the spine and adapt.
4. Score the table; for anything < 3, link evidence (file:line) + the ADR/gate that
   fixes it. **Build the gate (the raw-hex ban), don't just fix the instance.**

| # | Dimension | What it measures | Check | Target |
|---|-----------|------------------|-------|--------|
| 1 | **Token-spine provenance** | Every value traces to the spine; no off-spine hardcodes | raw-hex grep outside token files; (a ban gate exists?) | — |
| 2 | **Two-register coherence** | A + B read as ONE palette; differ only by type/theme/accent | side-by-side render; `$meta` vs reality | — |
| 3 | **Cross-repo lock health** | SHA-256 parity holds; both gates green; no manual drift | `check-tokens-parity` + `check-tokens-sync` | 3 |
| 4 | **Type system** | Families, scale, weights, fluid behavior, tabular-nums; consistent | render headings/body/data both registers | — |
| 5 | **Color & dark mode** | Ramps, semantics, dark inversion, AA at the token level | `check-contrast`+`check-dark-contrast`; render dark | — |
| 6 | **`viz-*` craft (studio)** | Families consistent; tone-balance honored; tones on-spine | `check-article-graphics`; grep viz tones | — |
| 7 | **Component fit-and-finish** | Spacing rhythm, radii, motion, states; token-driven | styleguide visual regression (light+dark) | 3 |
| 8 | **Illustration & icon coherence** | On current palette, consistent style, adapts to dark | render illustrations in dark | — |
| 9 | **OG / social / brand-asset craft** | On-spine (or sanctioned), templated, consistent | inspect `build-og-cards`; render samples | — |
| 10| **Expressive-layer discipline** | Sanctioned accents rationed, tiered, documented; no scatter | tier guide exists? expressive tokens gated? | — |

## Current snapshot — 2026-06-07 (code-assessed; RE-RENDER on engagement start, esp. dims 1/5/8 in dark mode)
| Dim | Score | Note |
|---|---|---|
| 1 Token-spine provenance | **2** | Spine is gold-standard, but real off-spine hardcodes exist: viz `gold` `#C5A059`, rgba gradient literals, OG marigold/coral, work-thumb gradients. No raw-hex ban gate yet. |
| 2 Two-register coherence | **2** | Register *separation* is clean (no var bleed, `$meta` accurate) — but the retired-palette **illustrations fracture the "one palette" read** in Register B. 3 once they're on-spine. |
| 3 Cross-repo lock health | **3** | Bidirectional SHA-256 spine hash, pinned in both gates, verified clean. The crown jewel — protect it. |
| 4 Type system | **2** | Inter / Geist Mono / Fraunces, swap + clamp + tabular-nums, Fraunces relegated to editorial motif in product. Solid; RE-RENDER both registers to confirm 3 (no explicit type-scale gate). |
| 5 Color & dark mode | **2** | Full ramp + semantics + AA contrast gate (both themes) — but the hardcoded illustrations **don't adapt to dark**, fracturing dark-mode coherence. |
| 6 `viz-*` craft | **2** | Families well-defined + tone-balance rule **gated** — but the `gold` tone and rgba gradients are off-spine. |
| 7 Component fit-and-finish | **3** | `@muntin/ui` is 100% token-driven (no hardcoded hex in className), motion-safe, consistent radii/spacing, **and** under light+dark visual regression. Genuinely excellent. |
| 8 Illustration & icon coherence | **1** | The headline gap: ~99 hardcoded hex in a **retired warm palette**, frozen, non-adaptive to dark, clashing with the current slate spine. |
| 9 OG / social craft | **2** | Templated, idempotent, mostly on canonical palette — minus marigold/coral declared as raw literals (sanctioned but not *sourced* from the spine). |
| 10 Expressive-layer discipline | **2** | Golden Hour + grain are documented + additive, and a tier system exists in code — but it's **not formalized as a guide** and the expressive tokens aren't gated to a tier. |
| **Total** | **21 / 30** | A gold-standard spine + lock (3), clean register separation, and genuinely polished components (3) — **fractured chiefly by the illustration drift (8) and a scatter of off-spine hardcodes (1,5,6,9)**. Cheapest jumps: bring the illustrations on-spine (8→3 lifts 2 and 5 too), then ship the raw-hex ban gate so it can't recur (1→3). |

> History (append each cycle): `2026-06-07 — 21/30 — baseline (code-assessed; not yet render-checked in dark on a device).`
