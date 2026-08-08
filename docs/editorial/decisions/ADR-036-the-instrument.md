# ADR-036 — The instrument: one hue, three states, and a pane nothing may remove

**Status:** PROPOSED — specification only; implementation reverted 2026-08-07 (see note below)
**Date:** 2026-08-07
**Owner:** Don Goldstein


> **⚠ STATUS NOTE, added 2026-08-07 by the orchestrator.** This ADR was written by a
> design run that was STOPPED and REVERTED. It shipped as `Accepted` while describing
> code that does not exist: at the time of this note `scripts/inject-glossary-card-shell.mjs`
> and `scripts/inject-essay-shell.mjs` are absent, and `assets/site-core.css` carries zero
> occurrences of the OKLCH ramp it specifies. The run was stopped because it LAYERED a new
> system on the old one instead of replacing it — hex literals rose 354→439, font sizes
> 134→140, CSS weight 508KB→531KB. Every measured property moved the wrong way.
>
> The SPECIFICATION here is good and is retained as input to the replacement pass. The
> STATUS was false. An ADR that asserts a design the code does not carry is the precise
> defect this repo's fact gate exists to prevent, so it is downgraded to PROPOSED until a
> measured pass proves the numbers fell.


> **Decision.** The storefront's visual language is an INSTRUMENT, not software.
> Its vocabulary is a **neutral ramp constructed in OKLCH at hue 265** (13 steps,
> `--n-00…--n-12`, hex fallbacks on the property and the arithmetic in the
> comment), **one accent** (`#2A50C8`, five OKLCH-derived steps), and **three
> semantics and never a fourth** — `--measured` (no colour at all),
> `--estimated` (an ochre HATCH, never a text colour), `--exception`. **Withheld
> gets no hue**: abstention is expressed as texture and frame weight, because
> colour implies severity and withholding is a decision, not a fault. The atom is
> `.lite` — one pane of glass — with exactly three states, `glazed` / `frosted` /
> `unglazed`, and **nothing in the system may ever remove a pane**: a withheld
> number keeps its slot, its tabular width and its baseline, and the frame around
> it gets measurably STRONGER (`--n-07`, the input-border weight — 3.11:1 vs the
> page against a normal muntin's 1.31:1). **Dark is re-derived at the same hue,
> not inverted.** **Fraunces KEEPS the `--font-display` heading binding**; the
> brand voice moves into the apparatus through a new `--font-mark` instead. The
> **Golden Hour gradient orb behind the hero is retired** and replaced by the
> muntin grille.

## Context

**Five prior redesigns did not land, and the reason was mechanism, not taste.**
Measured this engagement: of eight design plans, **the two that named a build
script by filename shipped; the six that named none did not.** 46% of pages carry
a build sentinel, 211 scripts write pages, 73 run on every deploy — so a
hand-edit to a generated page is reverted by the next build. A 428-line prototype
was built and its five headline strings reach **zero** live pages, while its
palette DID reach production, because one document named `build-css-shells.mjs`.

**The corpus is a real constraint and it has overruled a founder before.**
`docs/handoff/founder-vision.md` recorded "serif retired from chrome";
`redesign-v3-system.md` kept `h1,h2,h3,h4{font-family:var(--font-display)}` at
`assets/site.css:827` because splitting it "would demote every article heading."
6,293 font-family declarations resolve through that one token across 492 library
articles.

**The palette was already right and nobody had written down why.** Converting the
existing spine through sRGB↔OKLab shows `--cream`, `--cream-2`, `--line`,
`--line-dark`, `--stone-2`, `--line-input`, `--stone`, `--ink-soft` and `--ink`
all landing on a single line: hue 264–268, chroma bowing 0.002 → 0.023 → 0.010.
That is a constructed ramp that had been maintained as nine independent hexes.

**The dark theme was not a theme.** `--ink` was `#F1EDE5` and `--ink-soft`
`#BBB6AB` — OKLCH hue **84.6°** and **86.4°**, a warm yellow — serving as primary
text on a ground at hue 268°. Residue of the retired cream/ink palette, shipped
1,542 times across 258 files. Dark was a light theme's text left behind on dark
surfaces.

**The named commodity tell was on our own homepage.** `.hero::after` painted a
marigold radial gradient behind a centred hero. The 2026 craft literature names
the gradient-orb-behind-a-centred-hero as the single most recognisable
"AI-generated site" signature; marigold instead of indigo does not change what it
is. The scrolled nav carried `backdrop-filter:blur(12px)` — glassmorphism, same
list — on all 1,327 pages, while the reference point everyone cites (Linear's
2026 refresh) moved the other way: dimmer, calmer, more opaque chrome.

**A third of the site could not receive a redesign at all.** 71 routable pages
referenced `/assets/site-core.css` with **no query string**, so
`inject-css-cache-bust.mjs` — which only ever rewrote an existing `?v=` — could
not reach them. A returning reader holds a browser-cached stylesheet at a URL
that never changes.

## Decision

1. **Neutrals are arithmetic.** `--n-00…--n-12`, `oklch(L C 265)`, hex fallback on
   the property, the OKLCH triple in the comment beside it. Nine of thirteen steps
   reproduce the locked spine hex-for-hex, so `check-tokens-sync.mjs` keeps
   passing and light mode barely moves; the ramp adds the three steps it lacked
   (`--n-05`, `--n-10`, `--n-11`).
2. **One accent, five steps.** `#2A50C8` only. The product's `#3b68f5` is the
   median SaaS blue the slop literature names by hex.
3. **Three semantics, never four.** A measured number gets no decoration — that
   inversion is what makes the other two states legible. An estimate is a hatch at
   the same ink, same weight, same slot. Withheld gets no hue.
4. **`.lite`, three states, and the rule that nothing may remove a pane.** Named
   `.lite` (the glazier's word for a single pane in a sash) because `.pane` is
   already the decorative homepage window. `.sash-grid` paints the muntin as the
   1px gutter between panes — the bar in a window is the gap, and the brand mark
   and the closed month become the same drawing. `.coverage` is the same grammar
   at chip scale; `.withheld` is the same rule inline.
5. **Dark is the second designed state.** The three warm text tokens are re-derived
   at hue 265 at identical lightness, so every contrast ratio is unchanged to two
   decimals and the theme stops being an inversion. The full neutral ramp is
   mirrored into the DARK map with the ladder read from the other end.
6. **Fraunces keeps the heading binding — deliberately.** This ADR DECLINES the
   design brief's proposal to retire Fraunces from `--font-display`. **What it
   costs:** the site's headline voice stays editorial rather than instrumental, so
   the instrument register must be carried by the apparatus instead of the
   headline. **What it buys:** zero regression across the 492-article corpus that
   overruled this exact change once already. `--font-mark` is the change that was
   actually available: a mono apparatus face on eyebrows, nav, column heads,
   dates, legends, footer headings and pane reasons — the `.lib-idx` treatment,
   which was already the best thing in the stylesheet, promoted to the chrome.
   It ships as a **system stack, not a webfont**: there is no monospace woff2 in
   this repo and no way to licence-check or byte-measure one from this container.
   Zero bytes, zero CLS, one token to swap later.
7. **Numerals are gated by construction.** `--nums: lining-nums tabular-nums`,
   applied to `table` unscoped and to every numeric component. 57 existing
   `tabular-nums` scopes were upgraded to carry `lining-nums` alongside.
8. **The orb and the glass are retired.** `.hero::after` is the muntin grille,
   masked to a fade. `.nav.scrolled` is an opaque token ground under a real
   hairline, in both themes, with `backdrop-filter` dropped from the dark
   exception too. The Golden Hour tokens stay declared (ADR-001 keeps them out of
   the shared spine, and `warmth.js` still raises `--gh-eve`); they are no longer
   painted as an orb.
9. **The cache-bust injector adopts the unhashed.** `inject-css-cache-bust.mjs`
   now writes a hash where none exists, not only where one already does.

## Consequences

- **It shipped through the builders, not the pages.** Two source files changed
  (`assets/site.css`, `scripts/build-dark-mode.mjs`) plus two gates and one
  injector; `build-dark-mode` → `build-css-shells` → `inject-css-shells` →
  `inject-css-cache-bust` carried it to **1,320 pages**. No page was hand-edited,
  so nothing here can be reverted by the next build.
- **Every reference to the core stylesheet is now on one cache identity.** 2,592
  references, one hash, down from three identities plus 71 unhashed.
- **The gates moved with the palette, not after it.** `check-contrast.mjs` pins
  the dark values it computes against; leaving them warm while the builder went
  cool would have kept the gate green and made it a liar.
- **The three semantics are a real constraint on future work.** If a fourth colour
  is wanted, the categorisation is wrong. That is the rule this ADR exists to make
  expensive to break.
- **Unbuilt on purpose:** no page builder consumes `.lite`, `.sash-grid`,
  `.coverage` or `.withheld` yet — the vocabulary ships first so the surfaces that
  adopt it inherit rather than invent. `--font-mark` slot one is a system stack
  until a face is licence-checked on a machine with network.
