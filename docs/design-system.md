# Design system — tokens, shells, guardrails

This is the one-pager for keeping muntin.digital visually cohesive
as new pages and tools get added. It documents the parts of
`assets/site.css` that the rest of the site is supposed to read
from, and the guardrails that catch drift before it lands.

If you're adding a new tool or marketing page, read this first.

> **Unified token spine (2026).** These tokens are the **editorial register**
> of the cross-brand Muntin spine (`data/muntin.tokens.json`, vendored from the
> Ledger product repo). One palette, two registers: the product is dark-first
> Inter; this site is light + Fraunces and uses the deeper accent blue
> `#2A50C8` as its primary accent for AA on light surfaces. The palette is the
> cool, financial-grade system adopted in **Wave 8b** — "editorial warmth" now
> comes from **type and layout (Fraunces, generous measure), not surface
> color**. The values below are locked to the spine by
> `scripts/check-tokens-sync.mjs`; the retired warm palette is forbidden in
> muntin chrome by `scripts/migrate-warm-palette.mjs --check`.
>
> **Experience north star:** every surface should make a low-skill restaurant
> operator feel *empowered and on the cutting edge* — clear, confident,
> jargon-free, never intimidating.

## Tokens

All tokens live in the two `:root` blocks at the top of
`assets/site.css`. They are the only values you should reach for
when you write new CSS.

### Color

| Token | Hex | Use |
|---|---|---|
| `--cream` / `--surface-0` | `#F6F7F8` | Body / baseline (cool slate, kept `--cream` name) |
| `--cream-2` / `--surface-inset` | `#EDEEF1` | Recessed trays, CTA boxes |
| `--white` / `--surface-2` | `#FFFFFF` | Cards on top of the baseline |
| `--surface-1` | `#FFFFFF` | Slightly raised card |
| `--ink` | `#16181D` | Primary text |
| `--ink-soft` | `#4A4F59` | Secondary text |
| `--stone` | `#6B7280` | Tertiary / meta |
| `--stone-2` | `#9AA0AB` | Disabled / placeholder |
| `--teal` | `#2A50C8` | Brand accent, CTAs, focus (kept name; now blue) |
| `--teal-dark` | `#1F3A93` | Hover / press state for the accent |
| `--teal-tint` | `#EAF0FE` | Accent background wash |
| `--rust` | `#C42E2E` | Error / danger |
| `--line` | `#E3E5E9` | Subtle borders |
| `--line-dark` | `#D7DAE0` | Stronger borders |
| `--line-input` | `#868D9A` | Form input idle border |

The site runs on a single accent (the brand blue, kept under the legacy
`--teal` name). Do not introduce a second.
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

#### Audio edition card (`.listen-card`)

Sits at the top of `.article-body` on posts that have a rendered
audio variant. Defining choices to preserve when touching the card:

- **Eyebrow contract.** The `.listen-card-kicker` text is `var(--stone)`
  at the canonical eyebrow spec (`11px / 700 / 0.14em / uppercase`).
  Resist the urge to color it the accent — eyebrows site-wide are
  stone so the page reads coherently across sections.
- **Muntin motif.** The single sash treatment on this card is a
  `3px solid var(--teal)` underline applied as `border-bottom` on
  `.listen-card-kicker` itself (NOT on the card edge). A card-edge
  border collides with `.compare-card--featured`'s 2px teal frame on
  hub pages; the eyebrow-anchored sash sidesteps that collision.
- **Headline.** Fraunces 500, `clamp(22px, 1.4vw + 14px, 26px)` desktop,
  drops to 20px under the 720px breakpoint.
- **Byline.** `.listen-source-note` reads "Voiced for The Muntin Desk"
  in studio mode and "Read by your browser" in speech-fallback mode.
  Both go through `i18n()`; "The Muntin Desk" stays untranslated as the
  publication's brand name even in localized renders.
- **Palette.** All Listen-section rgba literals use `rgba(42,80,200,...)`
  (= `#2A50C8`, the current `--teal`). Earlier work referenced
  `rgba(31,78,91,...)` from a deprecated palette; that drift was
  migrated for the Listen section first; the sitewide teal→blue migration
  is now complete (Wave 8b + the 2026 purge pass), so `#1F4E5B` no longer
  appears in muntin chrome anywhere — `migrate-warm-palette.mjs --check`
  enforces it.
- **Reading sync.** Active body chunks get `.is-reading` (paragraph-
  level `--teal-tint` wash). When the chunk is text-only,
  `.listen-sent` spans wrap each sentence and the active sentence gets
  `.is-sent-reading` (deeper teal tint + 2px teal underline). Mixed-
  children paragraphs (links, em, strong) fall back to paragraph-
  level highlight gracefully.
- **Help dialog (`.listen-help-dialog`).** Native `<dialog>` opened
  by the small `?` icon in the always-visible meta column (next to
  the language pill). The icon was originally inside `.listen-card-
  extras` but that row is hidden until first play; the help docs
  must be reachable BEFORE the user discovers Play, so the trigger
  moved up. Hosts keyboard-shortcut
  documentation + a one-paragraph editorial note about the synthetic
  narration. Contracts to preserve:
  - **First focus on the title**, not the close button. listen.js's
    openHelp() explicitly calls `helpTitle.focus()` after
    `showModal()` so a reflex Space/Enter doesn't dismiss before
    anything is read. The h3 has `tabindex="-1"` to make it
    programmatically focusable; CSS suppresses the default outline.
  - **Padding lives on `.listen-help-inner`**, NOT on the dialog
    itself. The outside-click handler checks `e.target ===
    helpDialog` — true only for genuine backdrop clicks. Moving
    padding outside this check stops fat-finger taps on the
    content edge from dismissing the dialog.
  - **No fallback path.** Browsers without `<dialog>.showModal`
    (effectively none in support as of May 2026) hide the help
    button entirely. The previous "render as a modeless block"
    fallback was strictly worse than no affordance.
  - **Global keyboard shortcuts bail when the dialog is open** via
    a check on `.listen-help-dialog[open]`. Space inside the dialog
    must not toggle play.
  - **Copy register: plain operator English.** No "broadcast
    loudness", no "MP3", no "synthetic narration". The body reads
    as a publication note, not a Pro Tools session.

### Conversation shell

`/window/`, `/es/window/`. The intentionally-bare contact surface
that frames "tell Don what's on your mind" as a conversation, not a
form. No global nav (a slim `.window-shell` with the lockup and a
"← muntin.digital" exit). One vertical reading rhythm: hero →
muntin hairline → thread (initially empty) → composer with onramp
chips → reassurance line → optional Cal.com link → fieldnotes
rail at the bottom.

Components live under the `.window-*` namespace in `site.css`:
`.window-canvas`, `.window-shell`, `.window-shell__lockup`,
`.window-shell__back`, `.window-hero`, `.window-muntin`,
`.window-thread`, `.window-composer`, `.window-composer__form`,
`.window-composer__field`, `.window-composer__row`,
`.window-composer__counter`, `.window-composer__submit`,
`.window-composer__msg`, `.window-composer__onramps`,
`.window-onramp`, `.window-composer__reassurance`,
`.window-composer__alt`, `.window-fieldnotes-rail`,
`.window-paused`, `.window-signin`.

Hard rules for the Conversation shell:

- No marketing CTAs, no pricing, no service descriptions inside the
  shell. The shell exists to receive a message, full stop.
- The composer onramp chips PREPEND text to the textarea, they don't
  replace it. The user is always free to rewrite.
- The field is autofocused **only** if the user arrived from a path
  that signals intent (`?topic=…`). Default is no autofocus, so the
  shell can be read without hijacking the typing context.
- No `data-hide-sticky-bar` is needed here; the path-based
  suppression in `_includes/footer.html` already hides the mobile
  sticky CTA bar on `/window/` and `/es/window/`.
- New conversation surfaces (e.g. an in-flow "ask Don a follow-up"
  step inside a tool) reuse `.window-composer*` classes; do not
  fork.

### App shell

`/workbench/`, `/sign-in/`, `/account/`, `/admin/` (and ES
counterparts). The signed-in / account-state surface that frames
the site's persistent-state features (saved tool results,
account settings, login). Different visual register from the
marketing shell: tighter type, denser layout, no big hero, the
nav stays but loses the "Email Don" CTA.

Components live under the `.workbench-*` and `.account-*`
namespaces in `site.css`. New app surfaces:

- Reuse `.workbench-grid`, `.workbench-card`, `.workbench-empty`,
  `.workbench-action`, `.account-row`, `.account-section`.
- Body sets `<body class="app-shell" data-hide-sticky-bar>` so
  the mobile sticky CTA bar suppresses (an account screen has its
  own primary actions; double UI is noise).
- The nav still ships, but the auth-state JS in
  `_includes/nav.html` shows the "Workshop (N)" link instead of
  "Sign in" once `/api/auth/me` returns 200.
- App-shell pages do **not** ship the post-end signature, the
  fieldnotes rail, or the smart-next-CTA. Those are reading-shell
  conventions — they don't belong in a working surface.
- Save copy on app-shell pages follows the by-tool-kind contract
  (scorecard tools vs. calculators vs. artifacts) — see
  `data/tool-knit.json` and the per-tool save-card patterns.

Hard line: if a new feature mixes "marketing wants to convert" with
"the user is signed in and managing state", it's two pages. Don't
ship a hybrid.

## Learn-back row (Sprint 12 — locked)

A thin, prose-shaped row inside the result region that teaches the
concept behind the score. Different from — and complementary to —
the `<!-- LIBRARY:tool-deep-links -->` block at the page bottom:

| Block | Position | Function | Length |
|---|---|---|---|
| Learn-back row | Inside result region, between the result cards and the `.{prefix}-cta` block | Teach the concept the user just got scored on. One short paragraph naming 1–2 glossary terms + 1 article. | 1 paragraph, ≤ 50 words |
| Tool deep-links block | Bottom of the page | "Why this tool exists" — marketing context that converts a casual visitor into someone who reads the Library. | A header + topic chip + 2 detailed cards |

**Anatomy**:

```html
<aside class="learn-back" aria-label="What this score means">
  <p class="learn-back-eyebrow">What this score means</p>
  <p class="learn-back-body">
    The <a href="/glossary/title-tag/">title tag</a> and
    <a href="/glossary/meta-description/">meta description</a>
    are the two lines Google decides to show… The
    <a href="/blog/…/">playbook</a> walks through the rest.
  </p>
</aside>
```

**Rules**:

- One short paragraph. Two underlined links max — one or two
  glossary terms + one article.
- No new save / watch CTA — the existing `.{prefix}-save` block
  already handles that. Don't duplicate.
- Localized: every learn-back has an EN + ES counterpart with
  links pointing at the locale-correct page.
- Pilot landed on `/tools/seo-grader/`. Sprint 12b rolls out to
  the remaining URL-fetching tools (compare, mobile-check,
  schema-check, speed-test, tech-stack) once the pattern is
  reviewed.

## OG cards

See **`docs/brand/visual-system.md`** for the current 2026 visual + OG system.
The live source of truth for OG cards is `scripts/build-og-cards.mjs` (templates,
PALETTE, accent whitelist) + `brand/og/cards.json` (the manifest).

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

## Cohesion checks (Sprint 16 — fail-CI)

Sprints 1–15 each shipped one or more locks against drift, each
expressed as a `scripts/check-*.mjs` script in warn-only mode.
Sprint 16 promotes the full set to fail-CI under
`scripts/check-all.mjs`:

```bash
node scripts/check-all.mjs
```

Returns 0 if every check passes; 1 otherwise. Wire this into the
build pipeline as the cohesion gate.

| Check | What it catches | Source of truth |
|---|---|---|
| `check-name-coherence` | User-visible "Workbench" strings (the product is "the Workshop"). | Allowlist of code-internal exceptions |
| `check-counts-coherence` | Hard-coded counts that disagree with the canonical value. | `data/site-counts.json` |
| `check-knit-coverage` | Tool↔glossary back-link drift between two declarations of the same relationship. | `data/tool-knit.json` ↔ `data/library-tags.json` |
| `check-button-vocabulary` | New `*-btn` CSS classes outside the locked family. | Canonical set in the script + registered exceptions |
| `check-tool-header` | Tool hero eyebrows that don't begin with `Free tool · ` (EN) or `Herramienta gratis · ` (ES). | The eyebrow rule in §Tool shell above |
| `check-og-images` | Dangling `og:image` / `twitter:image` references that don't resolve. | The files in `brand/og/` |
| `check-og-coverage` | Pages that fall back to a generic OG card when they should have their own. | Per-X rule in §OG cards |
| `check-analytics-vocabulary` | New `window.plausible('…')` event names not in the registry. | `tools/_shared/analytics.js` `EVENTS` |
| `wire-glossary-knit --check` | Glossary term knit asides stale vs source data. | `data/library-tags.json` |
| `inject-glossary-fieldnotes --check` | Fieldnote sentinels stale vs `data/glossary-fieldnotes.json`. | The data file |
| `inject-post-end-cta --check` | Post-end CTA sentinels stale vs `data/post-end-cta.json`. | The data file |
| `inject-site-counts --check` | Count sentinels stale vs `data/site-counts.json`. | The data file |
| `check-locale-parity` | Pages on EN that have no ES counterpart (or stale ES). | EN as authoritative source |

To temporarily bypass a check during local iteration, run the
script without `--check` (it's warn-only by default). To bypass
in CI, the policy is: don't. Add a registered exception or fix
the source.

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
