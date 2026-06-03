# Start-here canon — `/start/` and the Companion kit

Editorial brief for the `/start/` four-corner diagnostic surface, plus
the canonical Companion kit footer block injected at the bottom of
every library article, live tool, operator sheet, and curated
glossary page. This document governs both phases of the cohesion
pass: the `/start/` build (Builder 1, Phase 2A) and the inject script
(Builder 2, Phase 2B). When the two disagree, this canon wins.

This document does not replace `docs/voice-canon-library.md` or
`/methods/#voice-contract`. It restates the parts of each that
apply to the diagnostic and the footer block.

## 1. Purpose

The library is intent-rich and topic-shaped. A returning operator
who knows what they want goes to `/library/`, `/tools/`, or
`/glossary/` directly. A first-time visitor — the operator who came
in from a Google search, a referral, or a chef-friend — does not.
They came in with a situation, not a topic. `/start/` is the
intent-based entry that routes the situation to the right starting
set.

`/tools/start/` is the precursor: five questions, route to two or
three calculators. `/start/` is the four-corner evolution: three
questions, route to a complete reading-watching-doing-defining kit
(library articles + tool + sheet + glossary terms). The kit is the
30-minute plan a chef-friend would write down on a napkin.

The cohesion pass also lands a Companion kit footer block on every
library article, live tool, operator sheet, and curated glossary
page. The kit answers the same question every reader asks at the
bottom of a page: *What do I read next, what do I run on my own
site, what do I write down, what word should I look up?* The
`/start/` result page and the Companion kit share the four-corner
shape so the operator's mental model is stable across surfaces.

## 2. Voice

The diagnostic adopts the `/tools/start/` voice — operator-direct,
no jargon, low-stakes options. Three questions; each one in plain
English with a short helper line. Options name the situation, not
the topic.

  - **In:** *"Sales are fine but the bank account isn't."*
  - **Out:** *"Identify your primary revenue optimization challenge."*

The result page voice is firmer than the question voice. The visitor
just told us what's wrong; we have an answer. Use *"Read these in
order"* rather than *"You might want to try…"*. Use *"Cost the plate
first"* rather than *"It could be a good idea to start with plate
cost."* The library's warmth move is clarity; the result page
inherits it.

The Companion kit voice is even tighter — labels and titles, no
hedging prose. The block is structural. Headings name the verb
(*Read · Try · Write down · Look up*); cards carry the article
title and a one-line dek; the dek is lifted from `data/library-tags.json`
or `data/tools.json` or `data/sheets.json` so it stays in sync with
the source page.

No exclamation marks. No emoji. No future-tense guarantees. The
[banned-words list at `/methods/#voice-contract`](../methods/index.html)
is binding for every string written through this canon, including
the JSON entries in `data/start-here-journeys.json`.

## 3. Question schema

Three questions, exactly three. The `/tools/start/` precursor used
five; that's too long for the new four-corner version. Each question
earns its slot by differentiating journeys — drop one and two
journeys collapse to the same kit.

### Q1. `leak` — *"What's leaking?"*

The single most useful sort. Adopted verbatim from `/tools/start/`
so the visitor who came over from the tools page sees the question
they already answered. Five options: `margin`, `covers`, `discovery`,
`kitchen`, `unsure`. Each option names a situation, not a topic; the
helper line names the symptom the operator is feeling.

### Q2. `stage` — *"Where is the restaurant right now?"*

This question differentiates a building-from-scratch journey from
an open-and-running journey. The same leak (`margin`) means
something very different at `stage: building` (no system yet, read
the structural posts) versus `stage: running` (calculators can
fire, run them in order). Three options: `building`, `running`,
`rebuilding`.

The `rebuilding` option exists for the operator who has an open
restaurant but is tearing down the digital surface. They have
records but the front-of-house is in flux.

### Q3. `paperwork` — *"What records do you have on hand?"*

This question picks whether the right next step is a calculator or
a sheet. The plate-cost calculator can't fire without recipes; the
margin-math calculator can't fire without a rough P&L; the
storefront-health tool needs none of that. Three options:
`have-numbers`, `partial`, `blank-slate`.

A `blank-slate` answer routes to a sheet (record the inputs first)
before the calculator. A `have-numbers` answer routes straight to
the calculator. A `partial` answer routes to both — the calculator
with what's known, the sheet for what isn't.

## 4. Journey schema

Seven named journeys cover the 45-tuple answer space without
enumerating every cell. Each journey carries:

  - **`title`** — the headline a visitor sees on the result page.
    Operator-voice, situational, no jargon.
  - **`dek`** — one sentence naming what the journey is for.
  - **`matches`** — the answer tuples that land on this journey.
  - **`library`** (3-5) — articles to read, in order.
  - **`tools`** (1-2) — calculators to run.
  - **`sheets`** (1-2) — paperwork to start filling.
  - **`glossary`** (3-5) — terms to skim if anything in the prose lands flat.
  - **`headline`** — the call-to-action sentence at the top of the result.

### The seven journeys

  - **`margin-with-numbers`** — *"Margin's bleeding, and you have the numbers."* Lands the operator who knows the leak is financial and can pull last month's P&L. The calculators fire; we route to them first.
  - **`margin-no-numbers`** — *"Margin's bleeding, but the records aren't there yet."* Same leak, no inputs. We route to sheets first, then the calculators.
  - **`covers-thin`** — *"Covers are thin. The room isn't full."* The leak is volume, not margin. Test the storefront score first, then the menu, then the discovery layer.
  - **`discovery-dark`** — *"Discovery is dark. Google isn't pulling its weight."* Local SEO sequenced: GBP first, then mobile and speed, then titles and schema.
  - **`kitchen-menu`** — *"You suspect the menu, not the marketing."* Plate-cost first, then how it photographs, then how it reads.
  - **`building-from-scratch`** — *"Just opened, or building from scratch."* Stage=building wins regardless of leak. Read structural posts; the calculators come after the foundations.
  - **`unsure-composite`** — *"Not sure yet. Give me one read."* Storefront Health composite first; come back and pick the right journey from the score.

### Fallback

When the tuple matches no journey (it shouldn't, but the safety net
exists), the fallback returns the four corners of the structural
starting set: `what-should-be-on-a-restaurant-website` +
`restaurant-local-seo` + `restaurant-menu-engineering` +
`reservation-conversion-guide`, paired with Storefront Health,
Margin Math, the conversion checklist sheet, and the prime-cost
worksheet.

### Journey-curation constraints

  - Quality over quantity. The visitor should leave with a 30-minute
    reading plan, not a 5-hour homework dump. 3-5 articles, 1-2 tools,
    1-2 sheets, 3-5 glossary terms is the cap.
  - Every slug referenced must exist on disk. The verification block
    in [§7](#7-sentinels--idempotence) fails CI if any slug is broken.
  - Reading order matters. The first article is the one the operator
    should read tonight; the last is the one to come back to next
    weekend. The `headline` line tells them that.

## 5. Result page UX

When the visitor finishes the three questions and submits, the
result page renders the matched journey (or the fallback). Required
blocks, in this order:

  - **Headline** — *"Here's what to read first."* (or the journey's
    `headline` field, when it's more specific).
  - **3-5 library article cards** — title + dek + reading-time
    (from `data/library-tags.json#blog_posts[<slug>].read_min`).
    Each card links to `/library/<slug>/`.
  - **1-2 tool cards** — *"Do this on your own restaurant."* Each
    card links to the tool URL from `data/tools.json#tools[<slug>].url_en`.
  - **1-2 sheet cards** — *"Write this down."* Each card links to
    `/sheets/<slug>/`.
  - **3-5 glossary chips** — link-only, reuse the existing
    `.glossary-chip` hover pattern.
  - **"Not the right journey?"** — link back to the form for retake.
  - **"Save my journey"** — localStorage anchor (same pattern as
    `/tools/start/` uses for its answer persistence). Stores the
    journey slug; the next visit shows a `tsRestore`-equivalent
    banner.

The result page reuses chrome from the existing surfaces — the
`see-also-card` markup pattern from library article footers, the
`tool-knit__col` pattern from tool footers, the glossary chip
pattern. No new design vocabulary.

The result page does not include the field-notes form (that lives
on individual articles), the post-end-cta (the result already is
the CTA), or the article-author-card.

## 6. The Companion kit block

The canonical four-corner footer block. Goes on every library
article, live tool, operator sheet, and curated glossary page.
Replaces no existing block — it sits between the page's primary
content and the `<footer>`, after any `see-also` or `tool-knit`
block that may already exist (those are not retired in Phase 2;
this block is additive and is the through-line across surfaces).

### Canonical HTML (library variant)

```html
<!-- companion-kit:start -->
<aside class="companion-kit" data-surface="library" data-source-slug="<slug>" aria-labelledby="companion-kit-h-<slug>">
  <div class="container">
    <p class="companion-kit__eyebrow">The four corners</p>
    <h2 id="companion-kit-h-<slug>" class="companion-kit__h">Read, run, write down, look up.</h2>
    <div class="companion-kit__grid">
      <div class="companion-kit__col companion-kit__col--read">
        <h3>Read</h3>
        <ul class="companion-kit__list">
          <li><a class="see-also-card" href="/library/<related-1>/"><span class="see-also-kind">Article</span><h4><!-- title --></h4><p><!-- dek --></p></a></li>
          <li><a class="see-also-card" href="/library/<related-2>/"><span class="see-also-kind">Article</span><h4><!-- title --></h4><p><!-- dek --></p></a></li>
          <li><a class="see-also-card" href="/library/<related-3>/"><span class="see-also-kind">Article</span><h4><!-- title --></h4><p><!-- dek --></p></a></li>
        </ul>
      </div>
      <div class="companion-kit__col companion-kit__col--try">
        <h3>Run on your own site</h3>
        <a class="companion-kit__tool see-also-card" href="<tool-url>"><span class="see-also-kind">Tool</span><h4><!-- tool title --></h4><p><!-- tool summary --></p></a>
      </div>
      <div class="companion-kit__col companion-kit__col--write">
        <h3>Write it down</h3>
        <a class="companion-kit__sheet see-also-card" href="/sheets/<sheet>/"><span class="see-also-kind">Sheet</span><h4><!-- sheet title --></h4><p><!-- sheet summary --></p></a>
      </div>
      <div class="companion-kit__col companion-kit__col--lookup">
        <h3>Look up</h3>
        <ul class="companion-kit__chips">
          <li><a class="glossary-chip" href="/glossary/<term-1>/"><!-- term --></a></li>
          <li><a class="glossary-chip" href="/glossary/<term-2>/"><!-- term --></a></li>
          <li><a class="glossary-chip" href="/glossary/<term-3>/"><!-- term --></a></li>
        </ul>
      </div>
    </div>
  </div>
</aside>
<!-- /companion-kit:end -->
```

The `see-also-card` class is reused verbatim from the library
article footer (the `LIBRARY:see-also` block in
`library/best-restaurant-website-platform/index.html`). The
`glossary-chip` class is reused from the existing glossary popover
pattern. The `companion-kit__*` class names are new; they nest
inside the existing chrome.

### Per-surface variations

The grid is always four corners. The labels and the items per
corner shift by surface:

| Source surface | Read | Run | Write | Look up |
|---|---|---|---|---|
| **Library article** | 3 related articles | 1 tool | 1 sheet | 3 glossary chips |
| **Live tool** | 3 articles that explain why you'd run it | the source page is the tool — corner is empty | 1 sheet to record the output | 3 glossary terms it computes |
| **Operator sheet** | 3 articles the sheet supports | 1 tool that uses the sheet's output | the source page is the sheet — corner is empty | 3 glossary terms named on the sheet |
| **Glossary term** | 3 articles that use the term | 1 tool the term lives inside | 1 sheet that records the metric | the source page is the term — corner is empty |

When a corner is empty (the source page already is that corner),
the inject script renders the column header but replaces the card
slot with a single sentence: *"You're on the tool. The other corners
keep you moving."* — or the equivalent for sheet/glossary.
`data-surface` on the wrapping `<aside>` tells the CSS which corner
to dim.

### CSS

The CSS rules for `.companion-kit__*` live in `assets/site-article.css`
for library articles (the file already carries the `see-also-card`,
`tool-knit`, and `glossary-chip` rules). For tools and sheets, the
same rules apply via `assets/site-tool.css` and
`assets/site-sheet.css` — those files already `@import` site-article.css
for shared chrome, so no new file is needed.

### What the block does NOT carry

  - No `data-audio-alt`. The block is structural chrome, not a
    content figure; the article-graphics gate's rule for figures
    doesn't apply.
  - No `<details class="cite">`. The block doesn't make claims; it
    surfaces existing pages.
  - No `<!-- LIBRARY:autolink:start -->` markers. The titles and
    deks are read from JSON; no glossary autolinking runs through
    them.
  - No listen button. Audio is paused site-wide; the block ships
    silent.

## 7. Sentinels + idempotence

The Phase 2 inject script (`scripts/inject-companion-kit.mjs`) must
be `--check` idempotent. Two consecutive runs without an edit
between them must produce a zero diff.

### Sentinel pair

```html
<!-- companion-kit:start -->
...
<!-- /companion-kit:end -->
```

The script:

  1. Reads `data/cross-surface-map.json`.
  2. For each surface entry, locates the sentinel pair in the target
     file.
  3. Renders the canonical block from the per-surface template.
  4. Replaces everything between the sentinels.
  5. Writes the file only if the new block differs from the old one.

If the sentinel pair is missing, the script inserts the block at
the canonical insertion point — for library articles, immediately
before the `<!-- LIBRARY:see-also:start -->` marker (so the
Companion kit precedes the legacy see-also block); for tools,
immediately before the `<!-- tool-knit -->` marker; for sheets,
before the closing `</main>`; for glossary pages, before the
closing `</main>`.

### The autolink corruption rule (binding)

The inject script never writes inside attribute values. The block
contains article titles and deks read from JSON; the script renders
them as text-node children of `<h4>` and `<p>`, never as the value
of an `alt`, `title`, `data-audio-alt`, or `aria-label` attribute.
The `<!-- LIBRARY:autolink:start -->` markers in the source titles
are stripped before rendering. This protects against the
attribute-corruption pattern that `check-article-graphics.mjs`
rule 8 catches.

### Verification block

```bash
# These run in the integration agent's CI before commit:

# 1. JSON parses
node -e "JSON.parse(require('fs').readFileSync('data/start-here-journeys.json'))" && echo OK
node -e "JSON.parse(require('fs').readFileSync('data/cross-surface-map.json'))" && echo OK

# 2. Every slug exists
node scripts/check-companion-slugs.mjs --check    # Phase 2B builder writes this

# 3. The inject script is idempotent
node scripts/inject-companion-kit.mjs --check     # Phase 2B builder writes this

# 4. The article-graphics gate is unbroken
node scripts/check-article-graphics.mjs --check

# 5. Canon docs clean
node scripts/check-banned-words.mjs --check
node scripts/check-fabrications.mjs --check
```

## 8. i18n

Every surface in this pass has an ES mirror. The Companion kit ships
in both languages. The data files are shared (one
`data/start-here-journeys.json`, one `data/cross-surface-map.json`);
the strings are localized at render time.

### Shared

  - The library, tool, sheet, and glossary slugs themselves are
    shared. EN ↔ ES resolution happens through
    `data/i18n-slug-map.json` (already canonical for the site).
  - The four-corner shape is shared. *Read · Run · Write down · Look up*
    translates as *Lee · Corre · Anota · Busca* (or the regional
    operator-Spanish equivalent — see `docs/voice-canon-library.md`
    §10 on `usted/tú`-neutral phrasing).

### Localized at render time

  - The question legends, helper lines, and option strings in
    `data/start-here-journeys.json` need ES counterparts. Phase 2A
    Builder 1 creates the parallel file
    `data/start-here-journeys.es.json` with the same structure,
    same option `value`s, ES strings for legend/help/head/dek/title/dek/headline.
  - Article titles and deks already exist in
    `data/article-content.es.json` (mirrored from EN
    `data/article-content.json`).
  - Tool titles and summaries already exist in `data/tools.json`
    under `title_es` and `summary_es`.
  - Sheet titles and summaries already exist in `data/sheets.es.json`.
  - Glossary terms have ES mirrors at `/es/glossary/<term>/` — the
    chip label translates via `data/i18n-slug-map.json#glossary`.

### Locale-routing rule

The result page renders at `/start/` (EN) and `/es/start/` (ES).
The `hreflang` pair stamps both directions per
`scripts/stamp-hreflang.mjs`. The Companion kit on a library
article at `library/<slug>/index.html` reads ES strings when the
sibling `es/library/<es-slug>/index.html` is built, never at the
EN render. The two are stamped from one truth file at build time.

### Don't translate

Platform names — Google Business Profile, DoorDash, Toast, OpenTable,
Resy, Tock — stay in English in both locales. Function names —
prime cost, plate cost, schema markup, citation — translate to the
operator's working register, not the dictionary. Restaurant terms —
expo, the line, the back door, covers — translate to the regional
working register; see `docs/voice-canon-library.md` §10 for the
DMV-Spanish defaults.
