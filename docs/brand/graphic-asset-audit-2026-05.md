# Muntin Graphic-Asset Audit — May 2026

> **⚠ Partially superseded (2026-06-07).** This audit's central claim — that the OG
> cards and brand icons "still ship the retired warm palette" — is **no longer true**.
> The OG migration shipped: a live grep of `brand/og/*.svg` (764 files) finds **zero**
> warm hexes (`#1F4E5B`/`#FAF7F2`/`#B8541A`/`#C5A059`) and the cool spine + the Golden
> Hour editorial accent throughout. Do **not** brief off this doc's palette/migration
> status. The current visual authority is **`docs/brand/visual-system.md`**; dated facts
> live in **`docs/brand/ground-truth-pack.md`**. The asset inventory counts and the
> mark-split discussion remain useful as historical context.

**Author:** Graphic Design Lead (Creative Director, brand execution)
**Date:** 2026-05-30
**Scope:** Every rendered visual asset across both product surfaces —
`potentially-profitable` (muntin.digital, the editorial/marketing site)
and `Muntin-Invoice-Decoder` (Muntin Ledger, the product).
**Purpose:** Ground all future design work in the *actual* state of the
assets. This audits **execution** (how the visuals are built and whether
they're consistent), not UX (what screens are needed) — that division is
deliberate.

> **Division of labor (confirmed with founder, 2026-05-30):** UX/UI
> decides *what* designs are needed and how the user interacts. This role
> owns *how* every design is executed — the marks, color, type, icons,
> social cards, illustration, and the cross-surface consistency of all of
> it.

---

## 0. TL;DR — the one finding that matters

**The brand's color migration is half-shipped at the asset layer, and the
seam is public.**

In *Wave 8b* (2026-05-16) Muntin retired its old *warm* "calm-editorial"
palette (warm teal `#1F4E5B`, cream `#FAF7F2`, gold `#C5A059`, rust
`#B8541A`) and adopted a single *cool, financial-grade* spine (slate +
blue `#2A50C8` / `#3B68F5`) shared across both products. The **chrome**
migrated cleanly — CSS tokens, stylesheets, lockups, favicons are all on
the cool spine and CI-locked.

But the **rendered raster/SVG assets were explicitly deferred** to an "OG
re-render follow-on" that has not happened
(`scripts/migrate-warm-palette.mjs:211-212`). As of today:

| Asset class | Count | Palette shipping now | Should be |
|---|---:|---|---|
| Brand icons (`brand/icons/*.svg`) | **18 / 18** | Old warm teal `#1F4E5B` | Cool spine |
| OG / social cards (`brand/og/*.svg` + PNG) | **748** | Old warm (teal/cream/gold/rust) | Cool spine |

**Customer-visible consequence:** the site renders cool-blue/slate, but
the moment any page is shared to Slack, iMessage, LinkedIn, or WhatsApp,
the OG card shows the *old warm brand*. Inline article/feature icons are
warm teal against cool-blue chrome. A prospect who sees both reads **two
brands.** This is tracked debt, not a regression — but it is the single
highest-impact item under this role's purview, and it is the natural
first project.

---

## 1. The system as it actually stands (post-convergence)

My initial read flagged the two products as "cousins, not siblings."
After syncing to `main`, that's **out of date** — the convergence already
landed and is enforced:

- **One canonical token source:** `packages/ui/muntin.tokens.json` (Ledger
  repo) is the cross-brand source of truth, vendored into the site as
  `data/muntin.tokens.json`. *"One palette, two registers."*
- **Two registers, by design:**
  - **Product (Ledger):** dark-first canon, Inter + Geist Mono, primary
    blue `#3B68F5`, "Linear / Mercury / Ramp" financial-grade.
  - **Editorial (muntin.digital):** light, Fraunces display + Inter body,
    deeper blue `#2A50C8` (AA on light). *Warmth now comes from type and
    layout — not surface color.*
- **CI-locked both ways:** `check-tokens-parity.mjs` (Ledger) and
  `build-tokens.mjs --check` / `check-tokens-sync.mjs` /
  `migrate-warm-palette.mjs --check` (site) forbid drift and the retired
  warm hex in chrome.
- **Experience north star (from `docs/design-system.md`):** every surface
  should make a low-skill restaurant operator feel *"empowered and on the
  cutting edge — clear, confident, jargon-free, never intimidating."*

This is a mature, well-governed system. The job here is **direction and
finishing**, not rebuild.

---

## 2. Asset inventory (counts)

### muntin.digital (`potentially-profitable`) — asset-heavy
| Class | Count | Notes |
|---|---:|---|
| SVG (all) | 782 | Brand marks, icons, 748 OG cards, article viz |
| PNG | 758 | Mostly OG raster renders (1:1 with the SVG cards) |
| Fonts (woff2/ttf) | 43 | Fraunces + Inter families, PDF TTF mirrors |
| Brand lockups | 7 | wordmark + horizontal/stacked × cream/ink/teal |
| Brand marks | 6 | outline + square-tile × cream/ink/teal |
| Brand icons | 18 | line icons, 24px grid |
| Favicons | full set | android/apple/16/32/ico + webmanifest |
| OG master | 4 | `og-image.{svg,png,webp,avif}` |

### Muntin Ledger (`Muntin-Invoice-Decoder`) — code-driven
| Class | Count | Notes |
|---|---:|---|
| Static images | 6 | 1 favicon SVG + 5 demo-sample webp |
| React UI primitives | 34 | `packages/ui/src/*.tsx` |
| Bespoke brand glyphs | 12 | `packages/ui/src/icons/*` (hand-drawn, 24×24, 1.5 stroke) |
| System icons | lucide | single sanctioned surface (`system-icons.ts`), CI-gated |

**Architectural contrast worth internalizing:** the site *pre-renders*
~1,500 image files; the product *renders from code/tokens at runtime* and
keeps almost zero static art. Re-pigmenting the product is a token edit;
re-pigmenting the site means **re-rendering 748 cards + redrawing 18
icons**. That asymmetry is exactly why the asset migration got deferred.

---

## 3. Asset-by-asset condition

### 3.1 The brand mark — ⚠️ the unresolved identity split
The two products ship **two different marks of the same window**:

- **Site (`brand/mark/mark-ink.svg`):** *hairline outline* — `fill:none`,
  `stroke-width:9`, a drawn sash window (rect + vertical muntin + transom
  bar at the upper third). Reads as **a drawing of a window.**
- **Product (`packages/ui/src/WindowMark.tsx`, "The Pane"):** *solid mass*
  — four filled panes with the muntin cross cut as a negative channel,
  transom proportion, 32u grid, r6 fillets. Reads as **a confident logo
  glyph.** In-code it's described as the "financial-grade re-cut of the
  old hairline-outline box."

Both share the *transom* geometry (horizontal bar high, not centered — a
real sash window), so they're clearly the same idea. But one is line, one
is mass. **The product already moved on; the site's mark didn't.** The
solid "Pane" is the stronger, more scalable, more ownable mark (it holds
at favicon size where the hairline collapses). Recommendation: adopt the
solid Pane as the **single Muntin mark** across both surfaces, keeping the
outline only as an optional editorial/illustrative treatment if wanted.
*Note: Ledger's own favicon comment already flags the old centered-cross
hairline as resolved P0 debt — the direction is set; the site just needs
to follow.*

### 3.2 Brand icons (18) — ❌ stale palette, **100% affected**
Every icon in `brand/icons/` is hardcoded `stroke="#1F4E5B"` (retired warm
teal). They feed `build-og-cards` and render inline on the site beside
cool-blue chrome. **All 18 need re-stroking to the cool spine.** These are
also the only place the line-icon style is authored by hand — worth
deciding whether the site standardizes on the same lucide-based system the
product mandates (`system-icons.ts`), so both surfaces draw icons the same
way instead of maintaining a separate 18-icon set.

### 3.3 OG / social cards (748) — ❌ stale palette, the public seam
Color census across `brand/og/*.svg`:

| Hex | Role (old warm) | Occurrences |
|---|---|---:|
| `#6B6B6B` | warm grey text | 3,566 |
| `#1F4E5B` | warm teal | 2,438 |
| `#FAF7F2` | warm cream bg | 2,422 |
| `#14161A` | old ink | 1,726 |
| `#C5A059` | warm gold | 1,002 |
| `#B8541A` | warm rust/orange | 928 |
| `#E8E2D6` | warm line | 550 |
| `#3AA368` | green | 28 |

Zero cool-spine colors present. The good news: these are **template-
generated** (`build-og-cards.mjs` → `render-og-pngs.py`, guarded by
`check-og-coverage / -images / -template-grid`). A single template +
palette-map edit, then a batch re-render, fixes all 748. This is a
**scripted, low-risk, high-visibility** win — the ideal first deliverable.

### 3.4 Lockups (7) & favicons — ✅ migrated
`brand/lockup/*.svg` were cooled in the catch-up window ("cool the lockup
SVGs"; ink corrected `#14161A → #16181D`). Site favicons are on the cool
spine (`#2A50C8 / #16181D / #F6F7F8`). The OG *master* (`og-image.svg`)
uses the cool spine. **No action** beyond keeping the "teal" filename
labels honest (they now carry blue `#2A50C8`, not teal — a naming-vs-pigment
trap for future maintainers; rename to `-blue` when convenient).

### 3.5 Product UI glyphs & components — ✅ healthy
Ledger's 12 bespoke glyphs (24×24, 1.5 stroke, `currentColor`) and 34
primitives all inherit from tokens — they re-pigment for free and are
dark-mode correct. The system-icon discipline (one lucide surface, CI-
gated, 1.75 stroke) is exemplary. **No action**; treat this as the
reference standard the site should converge toward.

### 3.6 Type — ✅ coherent, one watch-item
Fraunces (display, editorial) + Inter (body, both) + Geist Mono (product
numerics). Clear register split. Watch-item: the site ships **9+ extra
serif families** in `assets/fonts/` (Cormorant, Playfair, Alfa Slab, Bebas,
Quattrocento, Noto Serif) — likely PDF/tool-specific, but worth an audit
to confirm none leak into brand chrome and dilute the Fraunces/Inter pair.

---

## 4. Read against the brief

Brand keywords: **sleek, trustworthy, vibrant, modern.** Audience:
everyday, *less tech-savvy* business owners.

- **Sleek / modern / trustworthy** — well served. Rationed color, hairline
  depth, tabular numerics, the financial-grade spine. Strong.
- **Vibrant — the gap, and where it can live.** Both surfaces are
  deliberately restrained; nothing currently reads "vibrant." Per founder
  direction, the move is to **add a vibrant layer, not recolor the core.**
  Notably, the *old warm OG palette still holds the only real energy in the
  system* — gold `#C5A059`, rust `#B8541A`. When we re-render the 748 cards,
  that's the decision point: rather than flatten everything to one blue, we
  can introduce a **sanctioned accent-expressive layer** (a controlled
  warm/secondary hue reserved for marketing/OG/illustration moments) that
  gives "vibrant" a home *without* touching the disciplined product or
  chrome. The expressive-tier tokens already scaffolded in Ledger
  (`data-tier="expressive"`, brand gradient + grain) are the product-side
  hook for the same idea.
- **Less tech-savvy audience** — the editorial register (light, warm-via-
  type, Fraunces) is closer to this audience than the product's dark-first
  fintech canon. Worth tracking whether the product's dark-first default
  intimidates the 10pm-on-the-host-stand operator the README describes.

---

## 5. Severity-ranked punch list

| # | Severity | Item | Effort | Owner move |
|---|---|---|---|---|
| 1 | **High — public seam** | Re-render 748 OG cards to cool spine | M (scripted) | Template + palette-map edit, batch render, verify with `check-og-*` |
| 2 | **High** | Re-stroke 18 brand icons off `#1F4E5B` | S | Cool-spine stroke; decide lucide-vs-bespoke |
| 3 | **Medium** | Resolve the mark split (adopt solid "Pane" site-wide) | M | Port WindowMark geometry to site `brand/mark/` |
| 4 | **Medium** | Define + spec the "vibrant layer" (accent-expressive) | M | New tokens + usage rules; fold into OG re-render |
| 5 | **Low** | Rename `*-teal*` lockup/mark files → `-blue` | S | Pigment/label honesty |
| 6 | **Low** | Audit stray serif font families for chrome leakage | S | Confirm PDF-only |
| 7 | **Low** | Unify favicon backplate (Ledger uses warm `#FAF7F2`) | S | Spine-align |

---

## 6. Recommended first move

**Project 1: "Re-pigment the public face."** Combine punch-list #1 + #2 +
#4 into one pass — re-render the 748 OG cards and 18 icons onto the cool
spine, and in the same pass introduce the sanctioned **vibrant accent
layer** so "vibrant" lands deliberately instead of as leftover warmth. It's
the highest-visibility, lowest-architectural-risk work available, it closes
the most damaging brand inconsistency, and it executes the founder's
"add a vibrant layer" directive in the exact place the energy already
wants to live. Everything is template/script-driven and CI-verifiable, so
it's safe to ship incrementally.

*Pending founder sign-off on the mark-resolution direction (#3) and the
vibrant-layer hue before any pixels change.*
