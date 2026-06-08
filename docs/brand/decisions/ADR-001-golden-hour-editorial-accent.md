# ADR-001 — Golden Hour is a sanctioned editorial accent, not a brand-wide one

- Status: Accepted
- Date: 2026-06-07 · Owner: Brand & Cohesion Lead · Review by: 2026-09-07
- Supersedes: — · Superseded by: —

## Context

A warm two-color accent — **marigold `#FFB020` + coral `#FF6B5C`**, "Golden Hour" —
exists in `{site}/scripts/build-og-cards.mjs:62-80` and contradicts the single-accent
discipline recorded in the ground-truth pack and scorecard (Dim 2). The brief flagged
it as a confirm-tier P0: promote it into the shared spine, or scope it and document it.

Verified against live code (2026-06-07), the situation is larger than "a script
constant":

- Golden Hour is **already rendered into 765 of 766 OG cards** (`brand/og/*.svg`),
  layered over the cool slate/blue spine. It is shipped, not proposed.
- Marigold **also** serves as the **"Tools / free-course badge"** accent in live site
  chrome (`/workbench/`, `/ai/`, `/services/*`, `/tools/brand-suite/` — inline
  `background:#FFB020`). Coral is OG-only.
- It is **not** in the shared `muntin.tokens.json` spine and **not** in `{product}`.

So the boundary in question is not "OG-only"; it is **studio-editorial vs. product**.

## Decision

**Bless Golden Hour as a sanctioned _editorial_ expressive accent, scoped to `{site}`
studio surfaces (OG + editorial/Tools accents). It is excluded from the shared token
spine and from `{product}`, which stays single-accent (`#3b68f5` / dark `#5b82ff`).**

This serves **brand soul (calm, operator-grade restraint)** and **register integrity
(cohesion ≠ uniformity)**: the warm "light" is allowed to bloom on the editorial
surface where warmth-via-expression belongs, while the product's financial-grade
restraint is protected by keeping it single-accent. It also honors **truth** — the
guideline now matches shipped reality instead of asserting a single-accent rule the
code already broke.

Marigold/coral remain **`{site}`-scoped generator constants** (not promoted to spine
tokens). That is the honest encoding of "editorial-only": putting them in the shared,
hash-locked spine would make them a product-available accent, which is exactly what
this decision rejects.

Documented in `docs/brand/visual-system.md §3`.

## Alternatives considered (and why rejected)

- **Promote into the shared spine + propagate to `{product}`.** Steelman: one
  expressive system brand-wide; no asymmetry; warmth everywhere. Rejected: it makes a
  warm accent a *product* color, eroding the financial-grade restraint that is the
  product's whole credibility signal, and it changes the spine hash for both repos to
  serve a studio-only need. This is the drift toward the funded-SaaS look Muntin is
  defined against.
- **Retire it — revert the 765 OG cards to single-accent.** Steelman: maximal
  single-accent purity; simplest rule. Rejected: it destroys a deliberate, already-
  shipped brand-refresh at real cost, for purity's own sake — and the value hierarchy
  puts brand soul and operator outcome above bare consistency. "More restrained" here
  means *contained*, not *erased*.

## Pre-mortem

It is 2026-12 and this was a mistake — why?

1. **Leak into product.** Marigold/coral appear in `{product}` chrome and the product
   starts to read "warmer / less serious." *Detect early:* the enforcement gate that
   bans `#FFB020`/`#FF6B5C` in `{product}` and asserts their absence from the shared
   spine. **Shipped 2026-06-07 (cycle 2)** — see the Update below; this is no longer a
   doc-only boundary.
2. **Sprawl within `{site}`.** The "editorial accent" creeps into body text, data viz,
   or focus states, fragmenting the studio identity. *Detect:* periodic grep of
   `assets/*.css` for the two hexes outside OG + the sanctioned badge usage.
3. **Contrast regressions.** Marigold/coral used as text or on the wrong background
   fail AA. *Detect:* `check-contrast`; keep them as decorative/background accents, not
   body text.

## Consequences

- **+** Guideline matches reality; product restraint is protected; the studio keeps its
  warmth. Scorecard Dim 2 moves 1 → 2 (decided + documented).
- **−** A documented boundary without a gate is "cohesion a human has to remember."
  Mitigated by the follow-on gate (see Update). Reversibility: high — the accent is
  contained to `{site}` editorial CSS (`--light-marigold`/`--light-coral`) and markup.

## Update — 2026-06-07 (cycle 2): the boundary is now gate-enforced

The committed follow-on shipped, moving this from a doc-only decision to an
un-regressible one (scorecard Dim 2: 2 → 3):

- **`{product}/scripts/check-editorial-accent-boundary.mjs`** — fails CI if `#FFB020`
  or `#FF6B5C` appears anywhere in the product (apps/packages/docs); wired into
  `.github/workflows/ci.yml` "Node lints"; ships `--self-test`.
- **`{site}/scripts/check-tokens-sync.mjs`** — now also asserts the two hexes never
  appear in the shared spine `data/muntin.tokens.json`.

Both verified with negative tests (a planted hex fails each gate, exit 1). Editorial
usage in `{site}` (the `--light-*` tokens, `brand/og/*`, editorial pages) is untouched
— the gates police only the register boundary, not legitimate studio use.

## Review

Revisit by the date above, or if Golden Hour is proposed for `{product}`, or if a third
expressive hue is introduced (either would be a new confirm-tier decision).
