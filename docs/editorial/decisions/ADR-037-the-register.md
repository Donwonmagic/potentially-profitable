# ADR-037 — The Register: the essay and the index in the instrument's voice

**Status:** PROPOSED — specification only; implementation reverted 2026-08-07 (see note below)
**Date:** 2026-08-07
**Owner:** Don Goldstein
**Scope:** the `essay` (123) + `collection-index` (72) archetypes = 195 of 1,327 routable pages
**Builds on:** ADR-036 (The Instrument — the token spine and the `.lite` grammar)


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


> The two archetypes that hold the corpus have no builder between them, so the
> shell they share is the one this repo builds shells with everywhere else: a
> sentinel-bracketed block written by a deploy-run, `--check`-able injector.
> The essay gets the apparatus half of the Instrument, not the pane half — the
> pane grammar has nothing to say about prose and becomes decoration there. The
> index gets the pane half literally: a hub's card grid stops being N floating
> white cards and becomes one window whose muntin is the painted 1px gutter.

## Context

`data/surface-archetypes.json` classifies 123 pages as `essay` (the library
articles, the blog dispatches, the research papers, the two topic pillars) and
72 as `collection-index` (every page whose body is a list of other pages).

**There is no essay builder.** The archetype record says
`producedByKind: "hand+injected"`, and `data/system-graph.json` confirms it:
`scripts/build-library.mjs` is an **orphan** — invoked by nothing, and it only
autolinks and rails; `scripts/build-library-recent.mjs` writes a three-card
strip on `/learn/` and is otherwise unrelated. The hubs are worse: they are
split across five producers, two of which — `build-ingredient-yield-pages.mjs`
and the menu-design builders — belong to **other archetypes** and were
deliberately not touched by this pass.

So the forensic rule that governs this engagement ("a hand-edit to a generated
page is reverted by the next build; change a builder and run it") had no
builder to point at. What these 195 pages do share is the mechanism the rest of
the site is assembled by: an idempotent injector writing between sentinels,
listed in `check-all.mjs` and run by the deploy `build.command`.

Two further facts set the shape of the design:

1. `docs/handoff/bones/design-design-language.md:111` states plainly that the
   pane grammar "on the 492 library articles and 344 glossary terms — which are
   prose, not readings — has nothing to say, and applied there it becomes
   decoration, which is the failure mode I am claiming to design against."
2. ADR-036 **declined** to retire Fraunces from `--font-display`, because 6,293
   declarations resolve through that token and the corpus has overruled that
   exact change once already. It moved the brand's voice into `--font-mark`
   instead. That leaves the apparatus — and only the apparatus — as the place
   the essay's register can change.

## Decision

1. **One injector, `scripts/inject-instrument-register.mjs`**, stamps
   `data-register="essay"` or `data-register="index"` on `<body>` and a
   sentinel-bracketed `<style>` block before `</head>` on all 195 pages. Wired
   into `wrangler.jsonc` `build.command` after `inject-h2-anchor-ids` and into
   `check-all.mjs` as `Instrument register (idem)`.

2. **Every selector carries the `[data-register]` prefix.** Not for scoping
   alone: `site-core.css` is preloaded and swapped in **asynchronously**, so
   source order between it and an inline block is not guaranteed. Specificity
   is. One attribute selector buys the one class of specificity the overrides
   need, deterministically.

3. **No colour is invented.** The emitted CSS contains **zero hex literals** —
   19 distinct tokens on the essay block, 17 on the index block, all from the
   ADR-036 spine. Every colour token used is re-declared in the dark map by
   `build-dark-mode.mjs`, so dark needs no second ruleset and cannot drift.

4. **The essay becomes a numbered document.** `.article-body h2::before` was a
   44×2px teal dash — decoration standing exactly where an instrument prints a
   section number. It is **replaced**: `§ 01` in the mark face above a hairline
   transom with the heavier muntin tick at the left. Figures are numbered
   `FIG. 01` and their captions move from centred italic to left-set under a
   rule. Citation drawers stack into one squared schedule of provenance, and
   their two URL-encoded SVG icons — whose strokes are hardcoded `#6B6B6B`,
   off-palette and invisible to the dark-mode token flip — are replaced by
   mark-face glyphs that inherit colour. The TL;DR loses its radius and its
   drop shadow. The pull-quote's teal bar becomes the same ink stile every
   other structural bar in the system uses.

5. **The hub becomes a sash.** Eleven grid containers and thirteen card classes
   are converted: `gap:1px` on a `--muntin` ground, one hairline frame around
   the whole collection instead of N frames around N cards, radius only on the
   outer sash. **The `translateY(-3px)` lift and the drop shadow retire** — an
   instrument's frame does not move when the reading changes; a hairline change
   of ground is the whole affordance. Dates and counts move to the mark face
   and stop being accent-coloured, because a date is not an action and spending
   the one accent on it is what makes the accent stop meaning anything.

6. **`.topic-other-list` is deliberately excluded** from the sash. It is a
   centred flex row of pill links, not a collection of records, and a sash
   there would be a lie about what it holds.

7. **The orb on `/library/` retires.** The Cost-Index hero opened on a
   `140% 180%` radial gradient bleeding accent into an ink panel — the
   gradient-behind-a-hero shape the 2026 slop literature names by name. It is
   an inline `style` attribute on a hand-authored page, so `!important` is the
   only lever an injected sheet has. No colour is substituted: the ink ground
   and its hairline stay, the glow simply goes.

## What was NOT done, and why

- **No `.lite` panes in prose.** See Context (1). The three-state pane earns
  its place where a number could have been printed and was not; an essay has
  nothing to withhold.
- **No record counts on hub sashes.** "12 RECORDS" in the mark face above a
  collection would be the right instrument gesture, and the number is honestly
  derivable by counting the page's own children — but the site already has a
  count system (`<!-- count:KEY -->` / `build-site-counts.mjs`) and a second
  one competing with it is how sentinels rot. It belongs in that builder, not
  in a stylesheet.
- **`build-ingredient-yield-pages.mjs` and the menu-design builders were not
  edited**, though 36 of the 72 hubs are theirs. The CSS reaches those pages —
  they are `collection-index` and the injector stamps them — but their
  generators stay untouched so another cluster's pass cannot be clobbered.
- **Fraunces was not touched.** ADR-036 settled it; relitigating a recorded
  decision is the other half of the 26% close rate.

## Consequences

- 195 pages carry a ~4.7 KB (index) / ~6.4 KB (essay) inline block. The
  rationale for each rule lives in the injector, not on the wire: comments are
  stripped from the emitted CSS and one provenance line points back to the
  script. This is the same trade `inject-critical-fonts.mjs` and
  `inject-critical-link-color.mjs` already make.
- Reclassifying a page's archetype in `data/surface-archetypes.json` now moves
  its design register on the next deploy, and `check-all` reds if the tree
  disagrees. The archetype map became load-bearing rather than descriptive.
- A future stylesheet asset would let these 195 blocks collapse to one `<link>`.
  It was not built here because it would require extending
  `inject-css-cache-bust.mjs` and `build-css-shells.mjs`, both of which the
  spine pass owns, and cross-cluster edits in a concurrent tree are how six
  agents corrupted their own measurements earlier in this engagement.

## Verification

Not a rendered visual walk — there is no browser in this container. What was
actually run:

- `node scripts/inject-instrument-register.mjs` → 195 of 195 pages rewritten;
  re-run with `--check` → clean. Convergent.
- Diff audit across all 195 pages: **zero** changed lines that are not the
  register block, the `<body>` attribute, or the spine's own cache-bust line.
  No prose, no `<!-- count: -->` sentinel (2,228 intact), no
  `<!-- LIBRARY:autolink:start -->` marker (397 intact), no slug, no hreflang.
- `check-article-graphics` → 0 violations across 105 articles.
- Brace balance 32/32 (essay) and 14/14 (index); 0 hex literals; all 36 token
  references resolve in `site-core.css`, and every colour token among them is
  present in the dark map.
- `check-all.mjs` in a detached clean-HEAD worktree vs this tree: **321 of 332
  passed here, 318 of 330 at clean HEAD; zero failures attributable to this
  change.** The one new failure name, `Gate coverage`, names
  `check-archetype-conformance.mjs` and `check-contrast-ratios.mjs` — two
  unwired check scripts from concurrent sessions. This pass added no
  `check-*.mjs` at all.
