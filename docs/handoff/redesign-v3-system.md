<!-- The v3 app-grade design system, as shipped 2026-07-11. Reference this
     before adding any new surface so it inherits the system rather than
     re-inventing it. Source of truth for the visual language; the strategic
     board tracks WHAT shipped, this tracks HOW the system works. -->

# Muntin v3 design system (app-grade, shipped 2026-07-11)

The storefront reinvention. One coherent "app-grade" visual language across every
flagship + product surface: cool slate + electric blue, a crisp hairline card
grammar, and a **tabular-mono data voice**. Editorial warmth is preserved where it
belongs (articles, `/about/`, `/window/`). Both light + dark, EN + ES.

## The token layer (`assets/site.css` `:root` — SOURCE; shells auto-generated)

- **Radius (unified 6px hairline):** `--r-sm:6px` · `--r-md:6px` · `--r-input:6px`
  (cards + inputs) · `--r-lg:8px` (big surfaces + 4:5 image frames, gently rounded).
  Literal `999px` pills / `50%` circles are intentional and untouched.
- **Type:** `--font-display` = Fraunces (hero/masthead + genuine editorial display),
  `--font-body` = Inter (body + **all product-UI titles**). The global
  `h1,h2,h3,h4{font-family:var(--font-display)}` rule is KEPT (splitting it would
  demote every article heading); product-UI titles opt down to Inter via scoped
  overrides (`.tool-card-flagship__title`, `.score-card-*`, `.mtn-*__title`, and
  each hub's card-title selectors).
- **Data voice:** `--font-mono` (one global token) + `font-variant-numeric:tabular-nums`.
  The single source for the mono voice — do NOT re-declare a scoped `--xx-mono` stack.
- **Accent:** `--teal` is BLUE (#2A50C8 light / #7AA7FF dark). Cool neutrals, full
  dark mode via `@media(prefers-color-scheme:dark)` + `[data-theme]`.

## The two grammars — pick by surface

**APP / product surfaces** (home, cost-index/ledger/tools hubs, tool pages, instruments):
- Hairline card: `border:1px solid var(--line); border-radius:6px; overflow:hidden`.
- Muntin top-accent hover: a `::before` teal bar `scaleX(0→1)` on `:hover`, plus
  `translateY(-2px)` + `border-color:var(--teal)`. (Replaces any static "3px ink slab".)
- **Data voice:** numbers, dates, tier/status chips, unit labels, and uppercase
  micro-labels/kickers → `font-family:var(--font-mono)` (+ tabular-nums; + `text-transform:uppercase;letter-spacing:0.12em` for labels).
- Card TITLES → Inter. Section eyebrows → mono uppercase.
- Tints via `color-mix(in srgb, var(--teal) N%, transparent)` — **never new hardcoded hex**
  (css-drift baseline 502; the `check-css-drift` gate scans `/tools/*` + inline `<style>`).

**EDITORIAL surfaces** (library/blog articles, `/about/`, `/studio/`, `viz-*` graphics):
- Keep Fraunces headings + numeric voice (the `viz-*` gauge/flow numerals stay Fraunces
  — the editorial register's own numbers, deliberately NOT the app data voice).
- These read as a reference work / narrative, not a dashboard. Do not app-grade them.

## What shipped (surfaces at v3)

Home (hero instrument, trust-strip readout, recents app-index, founding enrollment,
all card families) · `/cost-index/` · `/ledger/` · `/tools/` (hub + cards) · `/library/`
(doors as hairline cards; article rows stay bordered rows) · site chrome (nav/footer
company voice) · tool pages already inherit the token layer. Mobile (390px) verified.

## Deliberate keeps (do not "fix" these)

- **Editorial numeric voice:** `viz-*` numerals stay Fraunces (see above).
- **Human seat:** `/about/` (Don's story) + `/window/` ("a direct line to Don") stay
  personal — the pivot de-solo'd the *flagship*, not these.
- **Ledger `$19` pricing lockup:** the one editorial Fraunces moment on `/ledger/`
  (only its GA date is mono). `.lg-pricing` ink band keeps its hardcoded ink hexes
  (deliberate, so dark-mode doesn't double-flip).
- **cost-index semantic left-rails** (teal/rust/purple = signal), the library autolink
  sentinels, count/cal sentinels — machinery, not decoration.
- **Glossary `.gloss-term` reference cards:** their Fraunces headwords stay — a glossary
  reads as a reference work (a dictionary), the same editorial register as `viz-*` numerals.
  Only the glossary *app-chrome* (search, filter bar, the recently-added link cards) is on the
  app grammar.
- **Tool-page section `<h2>`s stay Fraunces** (RESOLVED long-tail, 2026-07-11). By the system's
  own rule, section-level heads keep Fraunces everywhere; only tight component titles
  (`.mtn-card__title`, `.score-card-*`, `.tool-card-flagship__title`) opt down to Inter. The
  tool pages' heads are section-level and *mixed register even within one container* — e.g. in
  cost-pulse's `.cp-card`, the data-panel title "Drift this week" sits beside the framing head
  "What this dashboard isn't." There is no clean CSS scope; a blanket `.tool-page h2{Inter}`
  would flatten the warm framing heads. Per-head classing (~40 heads × EN+ES = 14 files) is
  not worth it for a low-traffic surface. Deliberate keep.

## Extending the system (checklist for a new surface)

1. Use the tokens (6px radius, `--font-mono` data voice, Fraunces/Inter split, `--teal`).
2. App surface → hairline card + muntin top-accent hover + mono data voice. Editorial → leave warm.
3. Token-only / `color-mix` — no new hardcoded hex (hold css-drift ≤ baseline).
4. If you edit `assets/site.css`, regenerate ALL 3 shells (`build-css-shells.mjs`) and commit them.
5. Preserve sentinels + machinery. Mirror EN → ES. Verify both themes headless.
6. Build-injected blocks (e.g. the library cost-index-hero): edit the INJECTOR template,
   not just the output, or a rebuild reverts you.

## Known follow-ups (optional, low-priority)

- **Glossary index app-chrome — DONE 2026-07-11** (`597bc5f23`): search / filter bar / empty
  states tokenized to the 6px/8px radius scale; the recently-added link cards took the muntin
  top-accent hover-reveal + mono tabular dates. `.gloss-term` reference cards + Fraunces
  headwords kept (see Deliberate keeps).
- **Sheets index — already on-grammar:** its cards reuse the swept `.tool-card--compact`; its
  inline `<style>` is critical-CSS only. Nothing to sweep.
- **Tool-page section `<h2>`s — RESOLVED as a deliberate keep** (see Deliberate keeps). Not a gap.
