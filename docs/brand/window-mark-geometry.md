# Window-Mark Geometry — the single spec

- **Status:** Authoritative (current). The one source of truth for Muntin's window-mark
  geometry across both repos and every encoding.
- **Verified:** 2026-06-07 (against live code). **Owner:** Brand & Cohesion Lead.
- **Decision context:** ADR-000 doctrine; pairs with `visual-system.md` (§4 Marks).

> **Why this exists.** The mark — "The Pane" — was encoded independently in ≥6 places
> across two repos (a React component, a favicon, a gradient-field clip, and six studio
> SVG variants). They currently **agree**, but nothing *kept* them agreeing; a future
> edit to one could silently drift. This spec is the canonical geometry, and a
> conformance gate in each repo (`check-mark-geometry.mjs`) makes the agreement
> un-regressible.

## The canonical geometry (normalized 32-unit grid)

"The Pane": a solid rounded square with the muntin cross cut as a negative channel,
yielding four filled panes. On a **32×32 grid** (viewBox `0 0 32 32`):

| Parameter | Value | Meaning |
|---|---|---|
| Outer square | x2 y2 w28 h28 | 2u inset on all sides |
| Outer corner radius | **r6** | rounded outer fillets; pane-inner corners stay sharp (v1) |
| Vertical muntin | x14.5–17.5 | **centered** (center 16); channel width **3u** |
| Horizontal muntin (transom) | y11.5–14.5 | **not centered** — the transom proportion; channel **3u** |
| Top lights (height) | **9.5u** | y2 → y11.5 |
| Lower lights (height) | **15.5u** | y14.5 → y30 |

The transom (top 9.5u / lower 15.5u) is the founder decision that makes the mark read as
a real sash window rather than a mechanical centered cross.

### Canonical path data (32u grid) — the source

```
M8 2 H14.5 V11.5 H2 V8 A6 6 0 0 1 8 2 Z      (top-left light)
M17.5 2 H24 A6 6 0 0 1 30 8 V11.5 H17.5 V2 Z (top-right light)
M2 14.5 H14.5 V30 H8 A6 6 0 0 1 2 24 V14.5 Z (bottom-left light)
M17.5 14.5 H30 V24 A6 6 0 0 1 24 30 H17.5 V14.5 Z (bottom-right light)
```

Canonical encoding: **`{product}/packages/ui/src/WindowMark.tsx`**.

## The encodings (and how each conforms)

| Encoding | Repo | Grid | Conformance |
|---|---|---|---|
| `packages/ui/src/WindowMark.tsx` | {product} | 32u | **canonical** — the 4 paths above |
| `apps/web/public/icons/muntin-ledger.svg` | {product} | 32u | byte-identical 4 paths (favicon locked to component) |
| `packages/ui/src/BrandGradientField.tsx` clip | {product} | 320u (×10) | transom-proportion pane rects: x20/175, y20/145, w125, h95/155. Decorative background clip → all-corner `r40` (≈r4) is an accepted simplification, not the asymmetric mark fillet |
| `brand/mark/mark-{ink,cream,teal}.svg` | {site} | 128u (×4) | the 4 paths scaled ×4 (e.g. `M32 8 H58 V46 H8 V32 A24 24 0 0 1 32 8 Z`) |
| `brand/mark/mark-square-{ink,cream,teal}.svg` | {site} | 128u inner, 400 tile | same 128u inner paths inside a rounded ink tile (`rx56`) |

**Scale law:** the 128u studio paths are the 32u canonical paths ×4 (14.5→58, 11.5→46,
6→24, …). The arc *flags* (`0 0 1`) are not scaled.

## Enforcement

- `{product}/scripts/check-mark-geometry.mjs` — asserts `WindowMark.tsx` and
  `muntin-ledger.svg` carry the canonical 32u paths, and the gradient-field clip carries
  the transom-proportion rects. In `ci.yml` "Node lints". `--self-test`.
- `{site}/scripts/check-mark-geometry.mjs` — asserts every `brand/mark/*.svg` carries the
  canonical 128u path set. In `check-all.mjs`. `--self-test`.

Both gates hold the canonical numbers (this spec's path data) as the lockstep constant —
same discipline as the token spine hash. **Changing the mark geometry means updating this
spec + the canonical constant in both gates, together.**

## Out of scope (logged, not fixed here)

- **Favicon palette drift:** `muntin-ledger.svg` still fills with retired-warm
  `#FAF7F2` (backplate) + `#14161A` (ink). Geometry is correct; the *palette* is
  pre-Wave-8b. Tracked in `ground-truth-pack.md §7`.
- The studio outline-vs-solid mark question (`visual-system.md §4`) — a separate
  identity decision, not a geometry one.
