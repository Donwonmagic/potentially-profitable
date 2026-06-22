# ADR-009 (PROPOSAL) — Rendered literal illustrations (the third lane)

- **Status:** **Proposed** — needs gate-authors + fact-gate sign-off before adoption
- **Date:** 2026-06-20
- **Owner:** Expanded-vocabulary panel + Performance/front-end guild (proposing)
- **Review by:** 2026-09-20
- **Relates to:** ADR-005 (convening); ADR-006 (taxonomy — the `render` kind); ADR-007 (imagery priority); ADR-008 (provenance); `docs/fact-check.md` (illustrative-labeling clause); `scripts/build-og-cards.mjs` (the rendering precedent)

> Proposal: recognize a third visual lane between abstract `viz-*` diagrams and
> captured photographs — **literal illustrations of the topic, authored as
> SVG/HTML and rendered to images at build time.** The founder's note: figures
> "don't just have to be a viz — think more literal visualization of the topics,
> that are then rendered." This lane is bespoke, brand-controlled, first-party by
> construction (no stock, no abstraction), and it reuses a rendering pipeline the
> repo already runs four times over.

## Context

The taxonomy in ADR-006 admits photographs and scans for *evidence*, and keeps
`viz-*` for *abstract data shapes*. Neither covers the most common editorial want:
a **literal picture of the thing the article is about** — a rendered Google Business
Profile card for the GBP setup piece, a rendered example menu for the pricing piece,
a rendered receipt for the cost-index methodology, a rendered SERP for the discovery
posts. Today the only way to get that is a stock photo (banned by ADR-007) or to
contort it into an abstract `viz`. The literal depiction is missing.

**The pipeline already exists.** `scripts/build-og-cards.mjs` authors brand SVG from
a declarative manifest (`brand/og/cards.json` — a glyph registry, palette accents,
and `focus` modules: `type`/`funnel`/`stat`/`score-ring`/`list`/`quote`/`checks`)
and renders each to PNG via `rsvg-convert` on CF Pages, with an `@resvg/resvg-js`
local fallback. Three sibling systems do the same for glossary cards, course
batches, and sheet cards (`generate-glossary-cards.mjs`, `render-course-batch.mjs`,
`sync-sheet-og-cards.mjs`). Rendering authored vector art to a deterministic raster
is a *mature, repeated* repo capability — not new infrastructure.

So this lane is cheap to build and strongly on-brand. It has exactly one hazard,
and it is the important one.

## The hazard: a rendered depiction is not evidence

A `scan` says "this is a real invoice" (ADR-008 makes that true or fails CI). A
`render` of "an invoice" says nothing of the sort — it is an **illustration**, and
if it shows `$1,240 — Restaurant Depot` those numbers are either real-and-sourced or
**invented**. On this site invention is the cardinal sin (it gets spoken aloud in
two languages). The fact gate already has the right clause: every number/name is
(a) registered, (b) cited inline, or (c) **labeled illustrative** in the prose.
Rendered illustrations live or die on clause (c).

## Proposal

### What a `render` figure is

A `<figure class="viz-figure" data-figure-kind="render">` whose inner is either
inline `<svg>` or a rendered `<img>`/`<picture>`, authored from a declarative source
(extend the `cards.json`-style manifest, or a per-article SVG template) and rendered
to WebP/AVIF at build by the existing renderer. It carries the same `data-audio-alt`
(≥80 chars), `<figcaption>`, and provenance handling as every other element.

### Honesty contract (the load-bearing rule)

1. **Any specific datum shown in a render must be sourced or visibly illustrative.**
   A rendered example must read as an example: a literal `EXAMPLE` / `ILLUSTRATIVE`
   token in the rendered art, or a figcaption that says so, or values drawn from a
   registered claim. The fact gate's clause (c) is the contract; the `render` kind
   does not get an exemption from it.
2. **No render may depict a real, identifiable third party** (a named competitor's
   actual UI screenshot is a `shot`, governed by ADR-008 — not a `render`). Renders
   are generic/illustrative by nature.
3. **Provenance is trivial but still recorded:** `source: "first-party"`,
   `license: "rendered"` in `data/image-credits.json` (ADR-008), `anonymized` N/A
   (nothing real is depicted). The registry entry exists so the image's article
   footprint and locale-parity are still auditable.

### Gate interactions

- **Image gates:** a rendered `<img>` satisfies `check-image-dimensions`
  (known width/height — it's rendered at a fixed size), `check-image-formats`
  (emit WebP/AVIF), and `check-lazy-images` (lazy + async below fold) for free.
  Inline `<svg>` renders are out of the `<img>` gates' scope, like the existing
  `viz` SVGs.
- **Article-graphics gate (ADR-006):** counts as kind `render`; mandatory
  `data-figure-kind` because a render and a photo are pixel-identical to the parser
  but carry opposite honesty contracts.
- **New rule candidate:** `check-image-credits.mjs` (ADR-008) flags any
  `data-figure-kind="render"` whose figure contains a number/`$`/`%` token but no
  registered claim id **and** no illustrative marker — the automated enforcement of
  the honesty contract above. (Warn-first, then promote — the repo's standard
  rollout.)

## Open questions for the corps

- Manifest vs. per-article templates: extend the `cards.json` declarative model to
  article illustrations, or author bespoke SVG per render? (Front-end guild — likely
  both: a manifest for recurring types like "example receipt," bespoke for one-offs.)
- Does a `render` count toward the "needs ≥1 `viz`" question parked in ADR-005?
  Proposed: a `render` is *not* a `viz` (it's literal, not abstract data), so a
  post of `render` + `photo` still has zero `viz`. Keep that as warn-only.
- Animated/`HyperFrames` renders: a still frame is in scope here; motion/video is a
  separate surface (the HyperFrames social pipeline), not an article figure. Confirm
  the boundary.

## Consequences

- **Positive:** the highest-frequency editorial want (a literal picture of the
  topic) gets a first-class, on-brand, stock-free home that reuses proven rendering
  infrastructure and produces deterministic, CI-friendly assets.
- **Cost:** the illustrative-labeling discipline is real overhead and the easiest
  thing to forget — which is exactly why the ADR-008 warn rule automates it. Without
  that rule, this lane is the most likely re-entry point for fabrication.
