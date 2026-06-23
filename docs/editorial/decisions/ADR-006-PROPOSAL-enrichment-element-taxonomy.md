# ADR-006 (PROPOSAL) — Widen "content figure" to an enrichment-element taxonomy

- **Status:** **Proposed** — needs gate-authors + accessibility sign-off before adoption
- **Date:** 2026-06-20
- **Owner:** Expanded-vocabulary panel (proposing); Gate authors own `check-article-graphics.mjs`
- **Review by:** 2026-09-20
- **Relates to:** ADR-005 (convening); ADR-007 (imagery priority); ADR-008 (provenance registry); ADR-009 (rendered illustrations — the `render` kind); `scripts/check-article-graphics.mjs` rules 1–2; `voice-canon-library.md` §8 / `voice-canon-blog.md` §7

> Proposal: stop counting only the ten `viz-*` diagram families as "content
> figures." Recognize an **enrichment-element taxonomy** — `viz` diagrams,
> **rendered literal illustrations**, photographs, document/receipt scans, data
> tables, maps, and annotated screenshots — where each non-`viz` element counts
> toward the two-figure floor and toward "variety," provided it carries the same
> narration + caption + (where sourced) provenance contract. The floor and the
> protections stay; the vocabulary widens.

## Context

Per ADR-005, gate rules 1–2 are the homogenizer: only `viz-figure`/`article-figure`
wrappers with a `viz-*` inner class count, so the cheapest path to "≥2 distinct
kinds" is the `bars + tree`/`bars + flow` template the corpus converged on, and a
photograph or table is pure overhead on top of two mandatory diagrams. Agent audit
confirmed the canons name only `viz-*` and are silent on photographs, and that the
image gates already exist and will apply to any `<img>` we admit:

- `check-image-dimensions.mjs` (**fail-CI**): every `<img>` needs `width`+`height`
  **or** an aspect-ratio class (`aspect`/`ar-`/`has-aspect`). Excludes `docs/`,
  `brand/`; skips src-less placeholders.
- `check-lazy-images.mjs` (**fail-CI**): below-the-fold `<img>` needs
  `loading="lazy"` **and** `decoding="async"`. First 2 imgs + `hero`/`logo`-class
  imgs are above-fold-exempt.
- `check-image-formats.mjs` (**warn-only**): hero images need a `<picture>` with a
  WebP/AVIF source; non-hero exempt; SVG exempt.

## Proposal

### The taxonomy

Each element is a `<figure class="viz-figure" data-figure-kind="…">` carrying
`data-audio-alt` (≥80 chars), a `<figcaption>`, and a `<details class="cite">` /
`data-credit-id` when sourced (ADR-008). `data-figure-kind` is the explicit,
robust signal the gate keys on (inference is a fallback, not the contract):

| `data-figure-kind` | What it is | Inner shape | Counts as kind |
|---|---|---|---|
| `viz` | the existing abstract diagram families | one of ten `viz-*` classes | the specific `viz-*` sub-kind (unchanged) |
| `render` | a **rendered literal illustration** of the topic — authored as SVG/HTML, rendered to image at build time; first-party by construction (ADR-009) | inline `<svg>` **or** rendered `<img>`/`<picture>` | `render` |
| `photo` | a photograph (first-party preferred — ADR-007) | `<img>`/`<picture>` | `photo` |
| `scan` | a document/receipt/pay-stub scan, **redacted** | `<img>`/`<picture>` | `scan` |
| `table` | an honest data table (exportable, copy-pasteable) | `<table class="viz-table">` | `table` |
| `map` | a geographic figure | `<img>`/inline SVG | `map` |
| `shot` | an annotated product/interface screenshot | `<img>`/`<picture>` | `shot` |

### The gate amendment (`check-article-graphics.mjs`)

1. **Rule 1 (floor) — unchanged in spirit, widened in counting.** `≥ 2`
   enrichment elements per article. `collectContentFigures` already matches the
   `viz-figure` wrapper, so photos/tables in that wrapper count once admitted; add
   recognition of `data-figure-kind` so a `<figure>` wrapping `<img>`/`<table>` (no
   `viz-*` inner) is no longer invisible.
2. **Rule 2 (variety) — count over the taxonomy, not just `viz-*`.** "≥ 2 distinct
   *kinds*," where a `viz-*` sub-kind and each non-`viz` kind (`photo`/`scan`/
   `table`/`map`/`shot`) are distinct kinds. One `viz-bars` + one `photo` now
   satisfies variety. (Open question in ADR-005: whether ≥1 `viz` stays mandatory.
   **Panel's default: not mandatory** — some posts, e.g. the weekly Cost Index, are
   better as `table` + `scan` — but flag posts with zero `viz` for editorial review
   via a warn, not a fail.)
3. **Rules 3–4 (narration + figcaption) — apply unchanged to every kind.** A photo
   still needs ≥80-char `data-audio-alt` that *narrates what the picture shows and
   why it's evidence* (not alt-text), and a `<figcaption>`. A table's narration
   states the takeaway the rows support, not a cell-by-cell read.
4. **Rules 5–8 — unchanged.** Tone balance, viz-bars consistency, dedup, and
   autolink-in-attribute are untouched; the dedup hash already normalizes inner
   text and will hash a table/photo block fine.
5. **New companion checks own the image guarantees:** the three image gates above
   already fire on any `<img>`; ADR-008 adds the provenance gate. The graphics gate
   does **not** duplicate them — it stays the figure-shape gate.

### Detection (implementable sketch)

`detectKind(figure)`: if `data-figure-kind` present → use it; else if inner has a
`viz-*` class → `viz` + sub-kind; else if inner has `<table>` → `table`; else if
inner has `<img>`/`<picture>` or inline `<svg>` → require `data-figure-kind` to
disambiguate `render`/`photo`/`scan`/`map`/`shot` (a rendered illustration and a
photograph are visually indistinguishable to the gate but carry *opposite* honesty
contracts — ADR-009 vs. ADR-007/008 — so the attribute is mandatory here, not
inferred; default to a fail asking the author to declare).
Update `test-article-graphics.mjs` to pin: a photo+table post passes floor+variety;
a two-`viz-bars` post still fails variety; a photo without `data-audio-alt`≥80 still
fails rule 3.

## Open questions for the corps

- `viz-table` CSS: does `assets/site-article.css` need a new table treatment, or
  reuse an existing one? (Performance & front-end guild.)
- Should `scan` require a visible "redacted" affordance in the figcaption, or is the
  ADR-008 `anonymized:true` registry flag enough? (Provenance bench.)
- Above-the-fold: a lead photograph would want eager-load + `<picture>`. Does any
  post get a hero image, or do all article photos stay below-fold/lazy? (Front-end.)

## Consequences

- **Positive:** the five forced-diagram posts in the pilot (ADR-005) can swap a
  bolted-on diagram for the evidence the topic actually wants (a redacted pay stub,
  a real GSC screenshot, an exportable table) and still pass CI.
- **Cost:** more `<img>` in the tree means the image gates and ADR-008 now carry
  real load; the warn-only format gate may need promotion to fail-CI once photos are
  common. Track as a follow-up ADR.
