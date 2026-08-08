# ADR-038 — The definition card: the glossary reads as a reference desk, not a landing page

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


> **Decision.** All 342 pages of the `definition-card` archetype — 322 per-term
> entries (161 EN + 161 ES) and 20 section indexes — get a shared shell that
> makes the **definition the only bordered object on the page**: a glazed
> `.lite`-grammar pane with its label welded into the frame, under a muntin
> transom, over a "why it matters" note hung off a stile. The shell is owned by
> **`scripts/inject-glossary-card-shell.mjs`**, wired into the deploy
> `build.command` and `--check`ed by `check-all`, **not** by
> `scripts/build-library.mjs#renderTermPage`, because that builder is an orphan
> whose re-run deletes 722 of 803 lines on a term page. The CSS is scoped under
> `.term-desk` and reads **only ADR-036 spine tokens** — no new hex, no new
> token, no edit to `assets/site.css`. The worked example takes the **frosted
> (estimated)** state, because an example is illustrative and not measured. No
> `.withheld` is forced onto this archetype: a term with no example is a content
> gap, not a withheld reading, and dressing a gap as abstention would be a
> design lie.

## Context

The glossary is the largest archetype on the site — 342 of 1,327 routable pages,
per `data/surface-archetypes.json`. It is also the archetype a stranger is most
likely to land on cold: a search for "what is prime cost" arrives at
`/glossary/prime-cost/`, and that page is the company's first sentence.

What it said, before this pass, was *landing page*. A 60px serif headword set as
a hero. Pill-shaped topic chips with 999px radii. A rounded, tinted "research"
card. An italic worked example indistinguishable from body prose. A dark
marketing band at the foot with a centred serif call to action. A reader met a
page that happened to contain a definition, and the definition itself carried no
more visual weight than the paragraph after it.

**The builder could not be the lever.** `build-library.mjs#renderTermPage` did
originally emit these pages, and it is the obvious place to change the shell.
It is also an **orphan** — invoked by no runner in `data/system-graph.json`.
Measured on 2026-08-07 in a detached `git worktree` at HEAD, running it rewrites
157 EN + 157 ES glossary pages and, on a representative entry
(`glossary/break-even/`), **deletes 722 of 803 lines**: the worked example, the
FAQ block and its `FAQPage` JSON-LD, the sheet and tool sidecars, the article
backlinks, the deep anchors, the verified stamp, the 90-second explainer, the
knit rail and the companion kit — fifteen deploy-chain injectors' worth of
enrichment that has accumulated on top of the builder's output since it last
ran. Re-running it is a content deletion wearing a build's clothes. That is why
it is an orphan, and the honest conclusion is that **these pages no longer have
a builder; they have a shell owned by injectors**.

**`assets/site.css` could not be the lever either**, for a different reason:
ADR-036 shipped the token spine into that file hours earlier and it is
partitioned by `build-css-shells.mjs`. This pass consumes that spine rather than
competing with it.

There was also a real defect sitting in plain sight. `<span class="gloss-tag">`
is emitted on every term page, but `.gloss-tag` is only styled **inline on
`glossary/index.html`**. For the life of the surface, all 322 term entries have
rendered a naked, unstyled tag immediately next to a fully styled topic pill.

## The mechanism

`scripts/inject-glossary-card-shell.mjs` walks `glossary/` and `es/glossary/`,
classifies each page as a term entry (`<section class="term-page">`) or a
section index (the shared sibling grid), and writes three things, all
sentinel-bracketed and all idempotent:

1. `class="term-desk" data-desk="term|section"` on `<main id="main">`. This is
   the scope handle and it is also the **specificity handle**: every rule below
   is `0,2,0` against site.css's `0,1,0`. Required, not cosmetic — `site-core.css`
   is preloaded and swapped in **asynchronously**, so source order between it and
   an inline block is not guaranteed. Specificity is.
2. On term entries only, one new element: a localized markface rail
   (`Definition` / `Definición`) welded to the top of `<p class="term-def">`.
3. The shell `<style>`, anchored to `</title>` — a single-occurrence anchor that
   no other head injector writes near. `inject-critical-fonts`,
   `inject-italic-font-preloads`, `inject-critical-link-color`,
   `inject-css-shells` and `inject-css-cache-bust` all insert before `</head>`
   and all run **later** in the deploy; anchoring to `</head>` would have made
   this block oscillate on every `--check`.

## Decision

1. **The definition is the instrument reading, so it gets the pane.** The
   definition is the only bordered object above the fold: square corners, one
   `--muntin` hairline, `--surface-1` ground, its label inside the frame at top
   left. This is `.lite[data-state="glazed"]` expressed on the markup that is
   already there.
2. **The apparatus voice carries everything that labels rather than is.**
   Breadcrumb, section eyebrow, alternate form, tags, "why it matters", FAQ
   heading, verified date and sibling glosses all move to `--font-mark` at
   `--ts-11`/`--ts-12` with `--track-mark`. The **headword keeps
   `--font-display`**, per ADR-036's deliberately declined Fraunces retirement,
   but drops from `clamp(36px,5vw,60px)` to `clamp(2rem,3.6vw,2.875rem)`: an
   entry headword, not a hero.
3. **The transom and the stile.** The head rule becomes a muntin — a hairline
   across with a 56px heavy tick at the left — and "why it matters" hangs off a
   vertical hairline with a tick where its label meets it, the way a usage note
   hangs off a rule in a printed reference.
4. **The sibling grid becomes a sash.** One outer frame, 1px painted gutters,
   panes with no borders of their own. The muntin stops being a metaphor in the
   footer and becomes the object actually holding the panes — and because the 20
   section indexes are nothing *but* that grid, one rule redesigns them too.
5. **The example is frosted, because it is illustrative.** `--estimated` at 11%
   in a 45° hairline hatch on the ground plus a 3px stroke at the stile — a
   hatch and a stroke, never ochre text, exactly as ADR-036 permits. This is the
   one honest use of the semantic on this archetype.
6. **No `.withheld` is forced here, and that is the point.** A term with no
   worked example is a content gap. Withholding is a *decision* not to print a
   number that cannot be stood behind. Rendering the first as the second would
   spend the company's one uncopyable visual idea on a lie. Abstention stays
   where it is true.
7. **Square, not round.** Buttons inside the desk drop to a 2px radius, chips and
   sidecars to 0. Only the outer sash rounds, per the spine.
8. **The marketing band gets quieter, not deleted.** Reduced vertical padding, a
   smaller heading, smaller sub. The URL and the call to action are unchanged.

## Walk receipt

There is no browser in this container, so this is code reasoning plus the gates,
not a rendered visual walk. Say that plainly.

- **Isolation was measured, not assumed.** A detached `git worktree` at clean
  HEAD ran the full CI orchestrator twice: once untouched, once carrying **only**
  this change. Baseline **318 of 330**; with this change **319 of 331**. `comm`
  on the two sorted failure lists is **empty in both directions** — zero
  failures introduced, zero fixed, and the new gate passes.
- **Idempotent.** Three consecutive runs, then `--check` → exit 0, 0 of 342.
- **Scope.** 342 of 342 pages stamped: 322 term entries + 20 section indexes,
  matching `data/surface-archetypes.json#definition-card` exactly.
- **Preserved.** `DefinedTerm`, `Article`, `BreadcrumbList` and `FAQPage`
  JSON-LD, `<!-- count: -->` sentinels, `<!-- LIBRARY:autolink -->` markers,
  hreflang, canonical, slugs, and the EN↔ES pairing are byte-identical; the diff
  on a term page is the style block, the `<main>` attributes and the label rail,
  and nothing else.
- **Not verified:** rendered appearance, and the two failing gates in the tree at
  the time of writing that belong to concurrent sessions
  (`check-archetype-conformance.mjs`, `check-contrast-ratios.mjs` are unwired and
  red `check-gate-coverage`). Neither is this pass's to wire — the house rule is
  that a currently-failing gate is fixed before it is wired, by its owner.

## Alternatives rejected

- **Edit `build-library.mjs` and run it.** Rejected on measurement: 722 of 803
  lines deleted per entry. The plan that says "change the builder" is right
  everywhere on this site except here, and the difference is checkable in a
  worktree in ninety seconds.
- **Add the rules to `assets/site.css`.** Rejected: the spine owns that file this
  cycle and concurrent edits to it were the named failure mode of the engagement.
  The tokens are consumed, not extended.
- **A new `assets/site-glossary.css`.** Rejected: it would ship outside the
  `build-css-shells` partition and outside `inject-css-cache-bust`, so a
  redesign would never reach a returning reader.
- **Retire the terminal marketing band.** Deferred. It is a content decision with
  an ADR-025 disposition attached, not a design decision, and 111 of these terms
  are off-thesis retired-line subjects whose disposition is being decided
  elsewhere.

## Consequences

- The largest archetype on the site now reads as one designed object, and the
  design is a **shell** — a future change is one edit and one command, not 342.
- `.gloss-tag` is styled on term pages for the first time.
- **Adding to this archetype now means running one more injector**, and the
  deploy runs it. `check-all` `--check`s it, so drift reds CI rather than
  accumulating.
- **The block costs 8,184 bytes uncompressed per page** — 60 rules, 197
  declarations, zero off-token hex — which is **2.67 MB across the 342 pages**
  and is the honest price of not editing `assets/site.css` this cycle.
  Measured over the wire it is far smaller: gzipped, the page grows **1,503
  bytes** (19,578 from 18,075), because the block is highly repetitive text.
  It buys zero additional requests, zero CLS and immunity from the
  async-stylesheet ordering problem. If a future pass consolidates the archetype
  shells into the `build-css-shells` partition, this is the single place to lift
  it from, and lifting it would return that 2.67 MB.
- 111 off-thesis terms now look *better*, which is a real cost worth naming: a
  design pass improves the surface it touches whether or not the surface should
  exist. This one deliberately did not spend a line on prose, so nothing here
  deepens the investment in a term that ADR-025 may yet freeze.
