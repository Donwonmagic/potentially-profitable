# The Monthly Dispatch — site edition master plan

**Date:** 2026-07-06. **Status:** build-ready; one founder decision (naming, §2) + one
ratification (ADR-010 extension, §6). **Companion:** `dispatch-email-upgrade.md` (the email
is the sleek instrument panel; THIS page is the bold essay — two renders of one payload,
per §12b there). **Provenance:** two grounded expert seats (AEO/SEO strategist;
editorial+design director), synthesized by the council; every file:line claim verified.

**Founder directives bound in:** flagship SEO/AEO surface, "planned with tenacity —
stunning, professional, modern, informative, bold, empowering, well organized"; a DELAYED
JULY EDITION publishes this week (on the 2026-07-08 refresh data — not today, which would
duplicate the 07-06 weekly on identical numbers); every edition looks BACKWARDS and
FORWARDS (forwards strictly within the licensed machinery, §6).

---

## 1. Strategic frame (AEO seat §A)

The query space splits into a **rolling answer layer** (hub + per-ingredient pages own
"garlic wholesale price," "are food prices going up" — permanent, freshness-won) and a
**dated evidence layer** (the monthly edition owns "food cost trends August 2026" and is
the citable anchor for "why did green bean prices spike"). Keep the division strict: the
edition never chases rolling queries (12 pages competing for one query), and the hub never
pretends to be a dated record. The moat surface is event + month queries answered with
dated, source-cited, CC0-downloadable numbers — every incumbent is paywalled, conflicted,
or a forecast. Forecast-intent queries are answered with the honest reframe ("the index
never forecasts; its pressure layer reads direction on a lead — here's what's building"),
never chased with anything stronger.

## 2. Naming (founder pick; AEO §D, reconciled with editorial §D)

**Recommendation: `blog/cost-index-YYYY-MM/`** (AEO Option 1; drop the editorial seat's
`-monthly-` infix — it adds length, not queries). Month carried hard in title/H1; honesty
carried in the dek. Slug keys on the EDITION date, not the data asOf (the data date is
stated inside). Existing `cost-index-week-*` slugs are final-forever and untouched.

- `<title>`: `Restaurant Cost Index — August 2026: where food costs stand | Muntin Digital`
- H1: `The Restaurant Cost Index — August 2026 edition.` + serif-italic verdict clause.
- Dek always: "read as of <date> — a dated read, not a month average." (the honesty
  release valve that makes the month-scoped slug safe under the fact gate).
- July's delayed edition: `blog/cost-index-2026-07/`, read as of 2026-07-08, with a one-
  line service note naming the cadence pivot. Collision convention if a month ever needs a
  second edition: `-update` suffix, documented in the generator header.
- Alternatives considered: `cost-index-august-2026` (EN-only, doesn't sort),
  `cost-index-edition-YYYY-MM-DD` (invisible to month queries). Rejected.

## 3. Section architecture (editorial §A + AEO §B, merged — the ten-section spine)

Three reader jobs in strict order: decide fast (≤90s) → understand (≤6 min) → verify.

1. **Masthead + cold-open answer.** Eyebrow `The Cost Index · Monthly Dispatch · Edition
   of {editionDate} · By Don Goldstein`; H1 = the month's verdict; hero stat band (basket
   read as Fraunces display numeral over a quiet aria-hidden basket arc, spread counts,
   gated-story count, sinceDate). Plus the `.dispatch-answer` block: ≤50 words, verbatim-
   liftable, month name + as-of date + basket + top story + "wholesale, not delivered."
   Speakable narrowed to `h1, .dispatch-answer, .tldr__list` (never the whole body).
2. **The honesty paragraph.** `honestyPara()` promoted to slot 2 — month-over-month only
   where `wow` licenses it; withholds stated with reasons. Above the first figure, always.
3. **The month in one figure.** The flagship 1+4 small-multiples board of `viz-spark`
   month arcs (basket large; four lead stories beneath), every point a dated read.
4. **The lead stories (2–4).** One card per gated `stories[]` entry, four fixed beats:
   the measured move (pct, deltaPts, dollar level+range) → the dated arc (own spark,
   peak/trough annotated) → the sourced mechanism (approved `cost-index-stories.json`
   entry, cite drawer mandatory) → the licensed action (exactly one contract verb + its
   qualifier). Deterministic ids `#story-<key>` — the deep-link targets AI citations land
   on. Quiet month ⇒ the quiet section (7) promotes to this slot as the lead.
5. **The full board.** All ~81 shippable items, category-grouped in the `viz-tree`
   details/summary idiom (zero JS, fine at 360px) — and (founder directive 2026-07-06)
   **every ingredient row is itself expandable**: the summary row is the scan (glyph,
   name, pct, $median), and opening it reveals the month detail inline — the dollar
   band with percentile placement (a compact pure-HTML band strip), the month endpoints
   with dates (opened $X on <date>, closed $Y on <date>, peak/trough), elevated-weeks +
   gated status, the seasonal-band position where `ready`, the pressure read where one
   exists, and the "full read →" link to `/cost-index/<key>/`. Native nested
   `<details>` — no JS; expanded content is real DOM (crawlable, deepens the page for
   per-ingredient event queries); anchor `id="board-<key>"` per row so expansions are
   deep-linkable. Budget rule: full spark SVGs render only in the story cards and the
   flagship board — board expansions are text+strip only (~0.3KB/row, ~25KB total),
   keeping the page under budget while every ingredient still expands. PLUS a compact
   flags table in the `.ci-table` idiom mirroring the CSV row-for-row (tables are the
   most-lifted structure). Full panel stays in the CC0 CSV — never inline 81 prose rows.
6. **What stayed quiet — the trust move.** The loudest raw gaps that did NOT clear the
   gate, with the its-own-history framing and the explicit hold license.
7. **Looking ahead (§6 — the forward section).**
8. **From the floor.** Don's gated editors note + the optional dek kicker — the bounded
   human slots (editorial §C: interprets what's on the page; no new numbers).
9. **The record.** Calibration with misses (band 77.2% vs 80% design; the one trend tier
   beating a coin flip), revision-ledger disclosure (median |rev| 14%, p90 53%) — rendered
   from the committed reports.
10. **Methodology & provenance footer.** Cite block, frozen JSON/CSV, feed, archive,
    versioned methodology, prev/next edition chain (sentinel-injected both directions).

Trust sections (2, 6, 9) interleave rather than ghettoize — withholding IS the product.

## 4. The visual system (editorial §B; binding production values §E)

- **Build the reserved `.viz-spark` family** (the one new family; CSS ≤1.5KB; canon §8
  entry; added to `check-article-graphics.mjs` VIZ_KINDS in the same PR). Job: the dated
  shape of ONE single-source series over one cycle — 8–13 reads as an inline-SVG step-line,
  endpoints/peak/trough annotated with date + dollar, rust when end>start, teal when
  end<start; gaps render as gaps; the line ENDS at the last committed read — no projection
  tail, ever.
- Story cards: elevation-framed panels, uppercase action chip (viz-tree verdict-chip
  style), Fraunces display pct; teal/rust spent only on data, never chrome.
- Basket: keep rings; keep contribution bars retitled "the biggest individual pulls"
  (D10 fix — no summation claim over a weighted-median headline; no waterfall, which
  asserts additivity the statistic lacks).
- The board is the one full-bleed moment (`min(960px,100%)`; prose stays 720px).
- Eight-rule article-graphics compliance stated per rule in the editorial brief §B —
  notably: emit-time asserts for `data-audio-alt` ≥80 chars and tone balance; dates inside
  figure text (dedup rule); spark exempt from the bars width rule by construction.
- Perf: zero new JS, zero images (inline SVG), article CSS additions ≤5KB (hard cap 182KB
  pre-minify), motion compositor-only + reduced-motion-gated.

## 5. AEO layer (AEO §B–C)

- Month-scoped **FAQPage** (3–4 Q/As generated from the payload; answers open "As of
  <date>…", close "wholesale reference, not a delivered price").
- **Dataset** stays the crown jewel; fix `temporalCoverage` to the cycle range
  (`sinceDate/asOf`); optional `PublicationIssue`/`Periodical` typing. NOT NewsArticle.
- **The lattice:** every flagged/story/mover name links its ingredient page (guaranteed
  live via `isShippable` — the single highest-leverage internal-linking fix; today the
  flags name ingredients 15× with zero links); prior-edition date becomes a link; prev/next
  sentinel chain; per-ingredient "edition history" strips deep-linking `#story-` anchors;
  archive upgraded to a real topic hub (basket read + top flag per row, month grouping,
  DataCatalog listing every native edition); the dispatch named as a citable surface class
  in llms.txt.
- Freshness discipline: `dateModified` only on genuine data re-runs; never retitle; the
  hub wins rolling queries, not edition churn.
- Anti-patterns (binding): no satellite pages, no per-month landing pages, no fake
  freshness, no forecast-query chasing, no institutional-analyst voice drift (Don stays a
  real FOH manager — that's the E-E-A-T asset).

## 6. Looking ahead — forwards within the license (founder directive, ADR-010-bound)

ADR-010 (`docs/editorial/decisions/ADR-010-…insight-grammar.md`, status PROPOSAL) is the
grammar: expectation is conveyed through **measured persistence, the verdict's durability
read, and labelled sourced associations — no future tense, no predicted timelines, no
"expect prices to."** The forward section composes exactly four licensed blocks:

1. **What's building / what's easing** — the pressure digest as the section's spine:
   direction on a STATED lead window, named force, cite drawer, "(association, not
   cause)" tag. Present-tense throughout ("cold-storage stocks are building on a 4–8 week
   lead").
2. **The seasonal calendar** — for `ready:true` ingredients with ≥2 years of the coming
   month: "August is typically an easing month for tomatoes (3 years of August reads:
   p25–p75 $X–$Y)." A pattern statement about measured history, not a prediction.
3. **Lock or float** — the certified postures from `cost-lockfloat.json` (lock 15 /
   cushion 8 / float 4 / withhold 73, per-item coverage CIs): forward DECISIONS without
   predictions, carrying the file's own "risk read, never a direction call" qualifier.
4. **[RATIFIED 2026-07-06] The one-print reach** — `cost-outlook.json`'s h=1 weighted
   tilt + movers ("the backtest's proven edge reaches one print ahead; at that reach the
   panel's weighted tilt reads easing; beyond it we don't look"). This is the maximal
   honest forward claim; the email plan's auditor red-lined it for INBOX copy under
   ADR-010's ceiling. Shipping it on the SITE edition requires the founder to ratify the
   ADR-010 extension — **ratified by the founder 2026-07-06** (recorded in the ADR).
   `cost-outlook.json` must be rebuilt into the refresh workflow (it is stale at
   2026-06-08) with `--check` + staging before anything renders it.

**New gate `check-cost-index-forward-grammar.mjs`:** scans the Looking-ahead section (and
the FAQ) for future-tense/forecast constructions (will/going to/expect(ed) to/predicted/
forecast + price terms; ES twins), asserts every pressure line carries a lead window + the
association tag, every seasonal line carries years-of-reads, every lock/float line carries
the risk-read qualifier, and (if item 4 ships) the tilt line names the one-print reach and
its backtest citation. `--self-test` fixtures both directions.

## 7. Repeatable-template system + gates (editorial §D; AEO F10)

- `emit()` decomposed into pure section builders assembled by `assembleEdition()` in the
  §3 order; donor-chrome slicing unchanged; every builder consumes only the payload +
  gated JSON files.
- **`check-cost-index-edition-structure.mjs`** — the site-side golden-structure gate: ten
  sections present in order (stable anchors), 2–4 story cards each with exactly one
  enumerated action chip, quiet-month exclusivity both directions, honesty paragraph
  consistent with `wow.state`, every arc date/cent byte-matches the frozen
  `cost-index/week-<asOf>.json` snapshot.
- **`check-cost-index-dispatch-parity.mjs`** — every %, $ in the edition HTML (body,
  TL;DR, FAQ, speakable targets, meta description) exists in the frozen snapshot.
- **`check-cost-index-stories.mjs`** — per `dispatch-email-upgrade.md` §13 (drafts never
  render; approved entries need sourceUrl + in-cycle retrievedAt + association vocabulary).
- `check-article-graphics.mjs`: add `viz-spark` to VIZ_KINDS only; the 8 rules already
  police the rest. Everything else (fabrications, editors-note, dispatch-fresh, contrast,
  CLS, keyframes) carries over untouched.

## 8. Build sequence

**This week — the July edition (publishes on the 2026-07-08 refresh data, Wed eve/Thu):**
1. Naming pivot in the generator (slug `cost-index-2026-07`, editionDate vs asOf split,
   spine records both) — blocks everything; needs the founder's §2 sign-off.
2. `.viz-spark` CSS + VIZ_KINDS + canon §8 entry.
3. `emit()` → section builders: masthead/answer block, honesty at slot 2, arc board,
   story cards (quiet-lead variant — July likely leads with the quiet read + arcs),
   the full board + flags table, quiet section, record, footer + ingredient links + FAQ +
   temporalCoverage + anchors + narrowed speakable.
4. Looking-ahead §6 blocks 1–3 (+ outlook rebuild wiring, unrendered until ratified).
5. Gates: edition-structure, dispatch-parity, forward-grammar; spark test fixture.
6. July edition service note + first-edition variant (since-last-edition vs the 07-06
   weekly — dated, commensurable); Don's floor note + dek kicker slots (may ship empty);
   founder reads the rendered draft; publish + comeback email via manual dispatch.

**Before 2026-08-04 (the first cron edition):**
7. Prev/next edition chain; ingredient edition-history strips; archive topic-hub upgrade;
   llms.txt line; stories pipeline live (Claude research routine armed ~Jul 30); email P1
   body (per companion plan) so the August email matches the August page.

**Founder's touchpoints:** §2 naming — SIGNED 2026-07-06 (`cost-index-YYYY-MM`);
ADR-010 §6.4 — RATIFIED 2026-07-06; remaining: the July draft read (Wed/Thu).
