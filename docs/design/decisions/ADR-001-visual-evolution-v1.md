# ADR-001 — Visual evolution v1: tie the spine duality to the Modern / Old-fashioned-honest positioning

- **Status:** Accepted (founder-authorized) · **Date:** 2026-06-20 · **Owner:** Creative / Design Lead · **Review by:** 2026-09-20
- **Relates to:** `ADR-000-design-doctrine.md` (the operating doctrine this works within); `docs/brand/visual-system.md` (the canonical visual doc this ADR seeds); `data/muntin.tokens.json` + `assets/site-core.css` (the spine it reads, does not change).

> Decision: name the brand's existing visual duality as the literal expression of the
> storefront positioning — **"Modern tools. Old-fashioned honest."** The cool slate/blue
> spine IS the *modern*; the Fraunces serif + the sanctioned Golden-Hour "light through
> the pane" IS the *old-fashioned honest*. Then evolve the system in three restrained
> tiers — hardening (Tier 1), craft tokens (Tier 2), visible OG refresh (Tier 3) —
> additive and on-spine, never touching a spine token value, the Pane mark, the fonts,
> or the palette.

## Context

The visual spine ("Wave 8b") is already excellent and locked: a financial-grade cool
slate + blue palette, traced to `data/muntin.tokens.json` and consumed by
`assets/site-core.css`, cross-repo SHA-256-locked (see ADR-000). Warmth is carried
*not* by surface color but by the **Fraunces** display serif and a rationed expressive
layer — the **Golden Hour** marigold/coral accent ("light through the pane"), sanctioned
for editorial/positive moments only (recorded in `docs/brand/visual-system.md §3`).

What was missing was not pigment but *articulation*: nowhere did a doc state that this
duality is the brand positioning made visible. ADR-000 demands provenance for every
value; this ADR adds provenance for the **intent** — why the system looks the way it
does — and sets a restrained path forward so "evolution" never becomes drift.

## Intent

Make the visual system *mean* the storefront line. Both registers stay one brand:

- **The modern** — the cool slate/blue spine: financial-grade rigor, calm, trustworthy,
  data-first. This is the "modern tools" half. (Editorial primary `#2a50c8` for AA on
  cream; product primary `#3b68f5` dark-first. Same hue, two values — a sanctioned
  divergence, not drift.)
- **The old-fashioned honest** — Fraunces (a warm, human serif with real history in its
  letterforms) + the Golden-Hour marigold `#FFB020` / coral `#FF6B5C` light that blooms
  through the muntin grid on hero/OG/lifecycle-win moments. Warmth through type and a
  rationed accent, never through chrome color.

## Decision — and the spine tokens it uses

Adopt the duality framing as canonical (now written up in `docs/brand/visual-system.md`),
and evolve in three restrained tiers. **No spine token value changes in any tier.**

- **Tier 1 — hardening (this iteration).** Two additive CI guards, no visual change:
  - `scripts/check-stone-2-usage.mjs` — flags `--stone-2` used as a *text* color
    (`color: var(--stone-2)`), which fails AAA on cream; allows the decoration channels
    (background/border/fill/stroke). Ships in **report mode** because the current tree
    still has legitimate-looking low-emphasis uses (placeholders, separators, mono
    labels); it is **not** wired into `check-all.mjs` until those are migrated.
  - `scripts/check-og-accents.mjs` — validates every `accent` in `brand/og/cards.json`
    against the whitelist **derived from** `scripts/build-og-cards.mjs` PALETTE keys
    (today: `teal, rust, gold, ink, cream` are the card vocabulary; the full PALETTE key
    set is the accepted superset). Passes clean today, so it **is** wired into
    `check-all.mjs`.
- **Tier 2 — craft tokens (this iteration).** Additive token declarations in
  `assets/site-core.css`, applied to no component (zero visual change), closing gaps in
  the scale so the next contributor reaches for a token instead of an ad-hoc value:
  - `--r-xs: 4px` — the bottom of the radius scale (below `--r-sm: 8px`).
  - `--fs-emphasis: clamp(16px, .3vw + 14px, 18px)` — a half-step above `--fs-body`,
    below `--fs-lead`, for emphasis lead-ins.
- **Tier 3 — OG visible evolution (next iteration, not now).** Any *visible* change to
  the OG card template (the share-image look) is deferred and must be **render-verified
  on a preview** before it ships — per ADR-000's "render it and look" ritual. This
  iteration deliberately does not touch the OG visual template.

## Render proof

No render needed for this iteration — it is documentation + two non-visual guards + two
unused additive tokens. Tier 3 (visible OG change) is explicitly gated on a render-verified
preview before it lands, satisfying ADR-000's render-and-look mandate at the point the
visual actually changes.

## Cross-repo impact

None. Nothing here touches `data/muntin.tokens.json`, so neither SHA-256 spine hash moves
and no dual-commit is required. The new tokens live only in the studio's `assets/site-core.css`
(editorial register); the Golden-Hour boundary is unchanged. `check-tokens-sync` /
`migrate-warm-palette --check` remain green.

## Alternatives rejected

- **Re-pigment for "more warmth."** Rejected: warmth is a type + accent decision by
  doctrine (ADR-000 value hierarchy #3/#4); changing chrome color would be drift and a
  cross-repo spine event for no positioning gain.
- **Apply the new craft tokens to components now.** Rejected for this iteration: that is a
  visible change and would couple "harden the docs" with "restyle UI," muddying the
  reversible/auditable boundary. Tokens land first, declared and unused; application is a
  later, separately-reviewed pass.
- **Promote the `--stone-2` guard to fail-CI immediately.** Rejected: the tree has
  existing uses; a fail-CI guard would break the build on legitimate low-emphasis chrome.
  Report mode first, migrate, then promote.

## Consequences

- **+** The visual system now has documented *intent*, not just provenance — "one identity"
  reads as a deliberate expression of the positioning, defensible in a brief.
- **+** Two new guards close real drift classes (off-spine OG accents; `--stone-2` as text).
- **+** The radius/type scales are complete, so future work has a token to reach for.
- **−** Expressive-budget cost: zero (no new accent; Golden Hour unchanged).
- **Reversibility:** high — additive docs + tokens + one wired guard; trivially revertible.
- **Blast radius:** studio-only; no spine, mark, font, or palette change.
