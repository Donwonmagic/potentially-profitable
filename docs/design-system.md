# Design system — tokens, shells, guardrails

This is the one-pager for keeping muntin.digital visually cohesive
as new pages and tools get added. It documents the parts of
`assets/site.css` that the rest of the site is supposed to read
from, and the guardrails that catch drift before it lands.

If you're adding a new tool or marketing page, read this first.

## Tokens

All tokens live in the two `:root` blocks at the top of
`assets/site.css`. They are the only values you should reach for
when you write new CSS.

### Color

| Token | Hex | Use |
|---|---|---|
| `--cream` / `--surface-0` | `#FAF7F2` | Body / baseline |
| `--cream-2` / `--surface-inset` | `#F3EEE3` | Recessed trays, CTA boxes |
| `--white` / `--surface-2` | `#FFFFFF` | Cards on top of cream |
| `--surface-1` | `#FFFDF8` | Slightly raised card |
| `--ink` | `#14161A` | Primary text |
| `--ink-soft` | `#2A2D33` | Secondary text |
| `--stone` | `#6B6B6B` | Tertiary / meta |
| `--stone-2` | `#9A958B` | Disabled / placeholder |
| `--teal` | `#1F4E5B` | Brand accent, CTAs, focus |
| `--teal-dark` | `#143640` | Hover state for teal |
| `--teal-tint` | `#E8F1F3` | Teal background wash |
| `--rust` | `#B8541A` | Error / warning |
| `--line` | `#E8E2D6` | Subtle borders |
| `--line-dark` | `#D4CCBC` | Stronger borders |
| `--line-input` | `#8A8378` | Form input idle border |

The site runs on a single accent (teal). Do not introduce a second.
For status (good / warn / bad) use the inline values you'll already
find in tool result CSS: `#1f9d55` / `#C28B2E` (or `#8A6018` text)
/ `var(--rust)`. Don't invent new ones.

### Radius

| Token | Value | Use |
|---|---|---|
| `--r-sm` | `8px` | Compact controls, small chips |
| `--r-input` | `12px` | Form inputs, form buttons, result cells |
| `--r-md` | `14px` | Cards, CTA boxes, tool cards |
| `--r-lg` | `22px` | Hero panels, large feature blocks |
| `999px` | pills | Buttons (`.btn`), badges, language switch |

Anything outside these is drift. The CI guard (below) catches new
non-tokenized radii.

### Elevation

Three tiers, period.

```css
--elev-1   /* subtle inset for resting cards */
--elev-2   /* card hover, active state */
--elev-3   /* modals, floating surfaces */
```

Don't write `box-shadow: 0 20px 40px ...` inline. Reach for
`var(--elev-2)`.

### Type

`--font-display` (Fraunces, weight 500) for headings and quoted /
serif accents. `--font-body` (Inter) for everything else. Sizes
use clamp tokens — `--fs-eyebrow / body / lead / h4 / h3` — plus
the existing `clamp(...)` rules on `h1`/`h2`. No bare `font-size: 22px`
in component CSS unless it's inside a tightly-scoped result-rendering
block.

### Motion

`--t-micro` (120ms) / `--t-fast` (180ms) / `--t-med` (420ms) /
`--t-slow` (900ms). Pair with `--ease`, `--ease-out`, or
`--ease-spring`. Don't write inline `transition: ... 200ms`.

## Shell patterns

Three shell patterns cover almost every page on the site. New
pages should pick one rather than invent a fourth.

### Marketing shell

`/`, `/services/`, `/for/restaurants/`, `/work/`, `/about/`,
`/system/`. Hero + section blocks + global footer CTA. Components
already in `site.css`: `.hero`, `.hero-tight`, `.hero-meta`,
`.section`, `.block`, `.service`, `.plan`, `.compare .card`,
`.faq`, `.work-card`, `.foot-cta`. New marketing pages should
compose from these.

### Tool shell

`/tools/*` lives under the new "TOOL SHELL" section in `site.css`.
Every new tool must use these classes for its form, note, result
container, and CTA. The only thing each tool's inline `<style>`
should contain is the **result-rendering bits that genuinely
differ** (a dial, a table, a list of cards, etc.).

The shared classes are written as comma-list selectors covering
seven prefixes (`.cmp-`, `.speed-`, `.mob-`, `.seo-`, `.sch-`,
`.si-`, `.ts-`). When you add an 8th tool, add its prefix to those
selector lists. Don't create a bespoke form pattern.

#### Tool page header pattern (Sprint 7 — locked)

Every tool page renders its hero in this order — no exceptions:

```
<eyebrow> →  <h1> →  <lede> →  <primary input form>
```

**Eyebrow rule** — the eyebrow is a tool-meta line, not a brand
locator. Always begins with `Free tool · ` (EN) or
`Herramienta gratis · ` (ES), followed by ONE qualifier:

| Tool kind | Qualifier (EN / ES) | Examples |
|---|---|---|
| URL fetch — fast (~10s) | `10 seconds` / `10 segundos` | seo-grader, mobile-check, schema-check, speed-test, tech-stack, gbp-grader |
| URL fetch — slow (~30s) | `30 seconds` / `30 segundos` | compare |
| URL fetch — instant | `Instant` / `Al instante` | search-ideas |
| In-browser only (calculator/parser) | `stays in your browser` / `se queda en tu navegador` | menu-engineering, menu-copy, plate-cost, photo-brief, open-hours |
| Privacy-sensitive in-browser | `Your <noun> never leaves this page` / `Tu <sustantivo> nunca sale de esta página` | brand-suite (logo), margin-math (numbers) |

Never lead the eyebrow with `Muntin Digital` or `A Muntin Digital tool` —
the brand lives in the nav logo, not in the tool meta line.

**Body order** — every tool page after the hero follows the same
sequence:

```
<primary input form>
<note>                          ← one-line caveat under the form
<tool-states-slot>              ← shared loading/error states (Sprint 5/6)
<{prefix}-result>               ← the actual result region
<{prefix}-save>                 ← Save-to-Workshop affordance, INSIDE
                                  or IMMEDIATELY AFTER the result
<{prefix}-cta>                  ← related-tool CTA cards
<!-- tool-deep-links -->        ← knit aside (one glossary + one article)
```

**Save affordance position** — the Save card lives inside the
result region (or immediately after it), never below the
deep-links block. The principle: a successful result should
prompt the save in the same eyeful.

A new tool checklist:

- [ ] HTML uses the `.{prefix}-form`, `.{prefix}-note`, `.{prefix}-result`, `.{prefix}-cta` classes
- [ ] Hero eyebrow uses the `Free tool · <qualifier>` pattern (and ES counterpart) — see table above
- [ ] Inline `<style>` block contains only result-rendering rules
- [ ] All radii use `--r-input`, `--r-sm`, or `--r-md`
- [ ] All shadows use `--elev-1/2/3`
- [ ] If the tool fetches URLs: integrate `tools/_shared/states.js` (a `tool-states-slot` element + the four-states wiring)
- [ ] Save affordance lives inside or directly under the result region — never below `<!-- tool-deep-links -->`
- [ ] Tool registers a knit entry in `data/tool-knit.json` (one glossary term + one article)

### Article shell

`/blog/*`, `/learn/research/*`, `/glossary/*`. Header + breadcrumb +
hero + body + cite drawer + further-reading + sources + footer.
Components: `.article-body`, `.cite`, `.share-btn`, `.listen-card`,
`.breadcrumb`. New articles must not introduce per-page CSS
beyond what's already in `site.css`.

## Drift guard

`scripts/check-css-drift.mjs` runs in CI and fails the build if
new drift is detected. Run locally with:

```bash
node scripts/check-css-drift.mjs
```

It catches:

1. **Inline `<style>` blocks in new tool pages** that contain
   `border-radius:` (other than `999px` pills or `50%` icons).
   If you need a new radius, add a token in `:root` and use it.
2. **Bespoke `box-shadow:` declarations** with raw rgba values —
   should reference `--elev-1/2/3` or `--ring-focus`.
3. **Non-tokenized hex colors** in tool pages — should reference
   the palette above. Allowed exceptions: `#1f9d55`, `#8A6018`,
   `#C28B2E`, `#e6f4ec` (status), and `--rust`.

The guard intentionally allows `--r-input`-scoped inline radii
that match the token value; it's only failing on raw 8/10/12/14/18px
that don't match.

## When you're tempted to inline CSS

- "I need a quick custom radius" → add a token in `:root`, use
  the token. If the token already exists, use that one.
- "I need a one-off shadow" → use `var(--elev-2)`. If you really
  need something different, propose it as a 4th elevation tier in
  the token block — not a one-off.
- "This component is too unique to share" → it probably isn't.
  Margin Math, Brand Suite, and the Restaurant Audit are the only
  three tools where this is currently true. Their inline CSS is a
  known follow-up; don't add a fourth.

## History

The Phase 1 cohesion pass (April 2026) consolidated:

- 7 near-identical inline CSS blocks (compare, speed-test,
  mobile-check, seo-grader, schema-check, search-ideas, tech-stack)
  into one shared block in `site.css` under "TOOL SHELL".
- The `.tool-grid` + `.tool-card` system, previously duplicated in
  `/tools/index.html` and `/tools/audits/index.html` (with one
  copy already drifted to `border-radius: 18px`).
- Standardized form/button radii under a new `--r-input: 12px`
  token.
- Added this doc + the drift guard.

### Bespoke tool migrations

The four bespoke tools (Margin Math, Brand Suite, GBP Grader, and
the Restaurant Audit) opted out of the original drift guard
because each carried enough unique component vocabulary that
a careful migration was its own pass.

In a follow-up sprint, three of the four were tokenized and
graduated off the exclusion list:

- **GBP Grader** — full tokenization. Status triad (good/warn/bad)
  uses `--status-*` tokens; radii use the standard `--r-*` scale.
- **Margin Math** — full tokenization. Calculator-specific colors
  (waterfall food brown, panel band tints) are intentional design
  vocabulary, allowlisted in `scripts/check-css-drift.mjs` with
  inline comments.
- **Brand Suite** — full tokenization including the WCAG contrast
  AA cell tint (was a near-duplicate of `--status-good-tint`).

The **Restaurant Audit** (4,662 lines of inline CSS) received a
selective sweep — top-frequency hex (rust, teal, status family,
cream, teal-tint) was replaced, dropping ~70 hex occurrences.
The audit's bespoke earthtone palette (`#E6DFCE`, `#EFC4AA`,
`#C7DFE4`, etc.) is intentional design vocabulary for the result
tree; full migration is a future pass and the file remains in
`EXCLUSIONS` in `scripts/check-css-drift.mjs`.

### Status palette tokens

Added during the bespoke-tool migration:

```css
--status-good:        #1F6B3A;   /* primary grade pass */
--status-good-tint:   #E7F5EC;
--status-warn:        #8A6018;
--status-warn-deep:   #8A3E16;
--status-warn-fill:   #C28B2E;
--status-warn-tint:   #FDEFE3;
--status-bad-tint:    #F7E7DC;   /* pairs with --rust */
--status-pass:        #1f9d55;   /* inline indicator green */
```

Use `--status-good` for primary grade displays; use `--status-pass`
(brighter) for inline check marks. Different greens, different
purposes.
