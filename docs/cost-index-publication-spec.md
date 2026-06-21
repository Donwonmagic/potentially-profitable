# Cost Index Publication Spec — making the weekly dispatch a citable, "of-record" market series

> Status: proposal / canon-candidate. Author seat: this is a design spec, not yet wired
> into `scripts/build-cost-index-dispatch.mjs`. Where a change touches generated prose it
> is written to drop into the generator or the blog canon verbatim.
> Companion docs it builds on (do not re-decide what these settle): `cost-index-history-map.md`,
> `cost-index-depth-roadmap.md`, `cost-index-value-strategy.md`, `cost-index-methodology.md`,
> `cost-index-methodology-hardening.md`, `cost-index-confidence-canon.md`, `voice-canon-blog.md`.

The north star, in one line: a publication is "of record" when (a) it is a continuous,
versioned time series a third party can pull and reproduce; (b) its methodology is
transparent and stable enough that a skeptic can audit it; (c) its commentary is
calibrated — pitched exactly at the strength the evidence supports, and sourced; (d) it
is tiered — a 30-second act/watch read on top, progressively deeper layers below; and
(e) it is stable and addressable — permalinks, an edition archive, structured data, a
"cite this" affordance. The dispatch today is strong on (b) at the *hub* level and
honest by construction, but fails (a) and (e) outright and is partial on (c) and (d).

---

## 1. Diagnosis — the two live editions against the five-part north star

The corpus is two editions: `blog/cost-index-week-2026-06-05/` and
`blog/cost-index-week-2026-06-16/`. Both are pure renders of
`scripts/build-cost-index-dispatch.mjs` from `data/cost-index.json` + `data/cost-pressure.json`.

### What it already does better than a typical market report — protect these

1. **The honesty contract is load-bearing prose, not fine print.** Every edition states,
   inline and in the audio narration, "public wholesale levels, never your delivered
   price" and "a read versus that ingredient's *own tracked baseline window*… not a
   week-over-week move." Most commodity newsletters bury or omit the basis disclosure.
   Here it is the second paragraph. This is the single most valuable thing on the page and
   the reason the brief exists. **Do not trade it for polish.**
2. **The headline is decomposed, not asserted.** The 06-16 "What's moving the basket"
   `viz-bars` shows the +3.2% as `weight × each staple's own read` — Romaine +7.8 pts,
   Butter −0.6 pts. A reader can see the number is a tug-of-war, not a verdict. That is
   more transparency than Urner Barry's headline quotes offer.
3. **The "absent" discipline is enforced at the panel boundary.** The generator filters to
   `isShippable(p)` (line 96), so the dispatch never flags an ingredient the hub can't
   show a live reading for. "When an input cannot earn a credible reading, it stays off
   the page rather than showing you a guess." This is the Georgia-Dock lesson honored in
   code.
4. **The pressure layer is correctly fenced.** "Inferred direction only… No delivered
   price," with a `<details class="cite">` naming USDA NASS / AMS / EIA / Drought Monitor.
   Direction on a lead, never a price, never a forecast.

### Where it falls short of "of record"

**(a) Continuous, versioned, reproducible time series — FAILS.** This is the load-bearing
gap. There is **no dated weekly snapshot archive of the basket headline anywhere in
`data/`** (confirmed: `data/cost-index.json` `basket` is a single snapshot with one
`asOf`; `cost-index-readings.prev.json` is one-deep; `cost-index-history.json` is
per-*ingredient* price series at mixed cadence covering 53 of 101 ingredients, not a
basket series). The generator says so in its own header and in the prose. The consequence
is visible the moment you pull both editions:

| | 2026-06-05 edition | 2026-06-16 edition |
|---|---|---|
| Basket headline | **+9.1%**, *high* confidence | **+3.2%**, *medium* confidence |
| Basket `asOf` (the data anchor) | **2026-04-01** | **2026-05-01** |
| Spread denominator (tracked panel) | 9 of **13** above | 32 of **82** above |
| Flagged movers | Romaine +168.9%, Ribeye +30.3%, Salmon +17.6% | Avocado +68.6%, Acorn squash +56.1%, Cilantro +52.9% |
| Feed driver (corn) | **−10.5%** | **+10.4%** |

An analyst pulling both **cannot** read +9.1% → +3.2% as costs falling 5.9 points, and
must not: the baseline windows differ, the basket itself **re-anchored from Apr 1 to May
1**, the panel **grew 13 → 82**, confidence **dropped high → medium**, and corn appears to
swing −10.5% → +10.4% purely because each is measured against its own moving baseline.
The two editions are *deliberately non-commensurable*. That honesty is correct given
what's archived — but it means the publication is, today, a sequence of unconnected
snapshots, not a series. Nothing can be cited as a trend.

A second-order tell of the same gap: the basket `asOf` (Apr 1 / May 1) **lags the "week
of" headline date by ~6 weeks** because the basket is anchored to monthly BLS/FRED prints
while the produce flags are weekly. The page says "where the basket stands this week"
over a number that is six weeks old. Honest once you read the audio-alt; invisible in the
H1.

**(b) Transparent, stable, auditable methodology — STRONG at the hub, INVISIBLE from the
dispatch.** The hub already has what most PRAs never publish: `cost-index/methodology/`
(versioned `v1.3.0`, effective 2026-06-18, with a changelog, a `#reproduce` worked
example pinned to live `series.json`, `#independence`, `#limitations`, a published
backtest — 80% nominal band, 84% realized coverage — and `TechArticle` + **`Dataset`** +
`FAQPage` JSON-LD), plus `/cost-index/feed.json`, per-ingredient `series.json`/`series.csv`,
`/cost-index/sources.json` (CC0) provenance, and `revisions.json`/`calibration.json`
ledgers. **The dispatch links almost none of it.** The 06-05 edition links the
methodology *zero* times; 06-16 links it *once*, buried in the pressure `<details>`
drawer. A skeptic reading the dispatch has no visible path to the audit trail that exists
one directory over.

**(c) Calibrated, sourced commentary — PARTIAL, with two real leaks.** The flag language
is calibrated in intent ("elevated and sustained," "not enough history to tell a spike
from a real trend"). But:
  - **Sign/word mismatch (fact-gate leak).** 06-16 line 522: *"Re-price — Green beans. It
    reads −6.2%… elevated and sustained — **the increase looks real**."* A **negative**
    read is described as "the increase." The `reason` string is keyed to the re-price
    *verdict*, not the *sign*. The audio renderer speaks this contradiction aloud in EN
    and ES. This is the exact failure mode the fact gate exists to prevent, shipped live.
  - **Degenerate range presented as a reading.** 06-16 line 525: *"Watch — Ground beef…
    range $5.51–$5.51."* A single-observation range printed as a range reads as
    false precision. It should be suppressed or labeled single-source.
  - **Driver attribution is structurally thin.** The "what's behind the moves" layer
    only covers the 12 basket staples that carry a `cost-pressure.json` read. The actual
    *flagged movers* — Avocado +68.6%, Cilantro, the squashes — get **no driver context
    at all**, because the dispatch has no catalog connecting import/weather/seasonal
    events to non-basket produce. The biggest numbers on the page are the least explained.

**(d) Tiered depth — PARTIAL.** The top read is genuinely scannable (TLDR + rings). But
below it the layers are flat, not nested: a 14-item re-price `<ul>`, then a widest-gaps
section, then pressure — all at one altitude, all in the dispatch body. There is no
descent path to the per-ingredient pages, the feed, or the raw data. An AI or journalist
who wants to go deeper hits a wall of prose, not a set of links to structured layers.

**(e) Stable, addressable citability — FAILS at the publication level.** Per-edition
permalinks exist (the dated slug). But: **no edition carries `Dataset` JSON-LD** (both are
`Article` + `BreadcrumbList` only); **there is no edition archive page** ("all weeks");
**there is no machine-readable per-week snapshot** shipped with the post; **there is no
"cite this" affordance**; and there is a live **consistency bug** — the generator claims
(lines 398–400) it prunes prior `cost-index-week-*` entries to one, but both editions
remain in `data/library-tags.json` and in the blog index `ItemList`, while only the 06-16
card renders visibly. The archive is half-pruned and drifted from its own structured data.

**One-line verdict:** the dispatch is an honest weekly *snapshot generator* sitting on top
of an already-strong auditable hub. To become "of record" it needs a persisted spine
under it, a wired path to the audit trail beside it, and a citation surface on top of it —
in that order.

---

## 2. The longitudinal spine — the highest-leverage change

This is the first thing to build. Everything else (real momentum language, seasonality,
citable trends, the archive) is blocked on it.

### 2.1 What to archive — one append-only file, written every weekly run

Add `data/cost-index-editions.json`, an append-only array of frozen per-edition snapshots.
The dispatch generator writes one entry per `asOf` on emit (upsert by `asOf`, never
delete — same immutability rule as `cost-revisions.json`). Minimum schema:

```jsonc
{
  "_doc": "Append-only archive of weekly Cost Index dispatch snapshots. One entry per asOf. Never overwrite a prior entry except via a dated revision (mirror cost-revisions policy).",
  "_version": "1.0",
  "basketWeightsVersion": "2026-Q2",          // from cost-basket-weights.json _version
  "methodologyVersion": "1.3.0",               // from cost-index/methodology.json
  "editions": [
    {
      "asOf": "2026-06-16",                    // the dispatch's "week of"
      "publishedAt": "2026-06-16T13:00:00-04:00",
      "basket": {
        "pct": 0.032, "dir": "up", "confidence": "medium",
        "asOf": "2026-05-01",                  // the basket's OWN data anchor (≠ week-of)
        "nContributing": 16,
        "contributors": [ { "ingredient": "romaine-lettuce", "pct": 1.553, "weight": 0.05, "points": 0.0776 } ]
      },
      "spread": { "above": 32, "below": 37, "flat": 13, "panel": 82 },
      "panelMembers": ["avocado","acorn-squash", "..."], // the shippable set this week, for membership-aware deltas
      "flags": [ { "ingredient":"avocado", "pct":0.686, "bias":"re-price", "medianCents":5900, "elevatedWeeks":7 } ],
      "drivers": [ { "key":"corn", "pct":0.104, "dir":"up" } ],
      "pressureAsOf": "2026-06-08"
    }
  ]
}
```

Two non-negotiable fields make the archive *honest as a series* where the prose currently
warns it can't be: `basketWeightsVersion` and `basket.asOf`. They let a future reader (or
the generator) detect exactly the discontinuities section 1 exposed — a re-anchor or a
weight change — and refuse a week-over-week delta across them rather than print a fake one.

### 2.2 What new honest claims it unlocks — and the gate on each

The archive does **not** instantly license "WoW." It licenses a *ladder* of claims, each
gated on what the archive can actually support. This mirrors the depth-roadmap's
honest-at-N rule (no YoY until ≥53 weeks; no seasonal normal until ≥2 years per month).

| Claim | Unlocked when | Gate / guard |
|---|---|---|
| **Real basket week-over-week** ("the basket eased 0.4 pts from last week") | ≥2 editions **with identical `basketWeightsVersion` AND identical `basket.asOf` cadence** | If the basket re-anchored or re-weighted between editions, **suppress the WoW and say so** (see prose below). Never delta across a discontinuity. |
| **Per-ingredient WoW** ("avocado eased from +71% to +69%") | ≥2 editions where the ingredient is in `panelMembers` both weeks | Membership-aware: if it dropped out of the shippable set, say "off the panel," not a delta. |
| **"N weeks elevated"** ("avocado has flagged re-price 7 weeks running") | Already computable today — `flag.elevatedWeeks` exists per ingredient in `cost-index.json` | This is the **first claim to ship**; it needs no new archive, just surfacing the field already there. |
| **Momentum** ("building 3 weeks, accelerating") | ≥4 editions, same membership | Direction of the *change in the read*, not the level. Word it as observed history, never extrapolation. |
| **Percentile-of-history as a count** ("higher than 9 of its last 12 weekly reads") | ≥8 editions for that ingredient | A **count**, never a smoothed percentile (experience-map rule). |
| **Seasonality-adjusted read** | ≥2 distinct years per month (the dormant `build-seasonality.mjs` bar) | Out of reach for ~2 years. Until then, "no typical June yet." |

### 2.3 The prose change — how the dispatch stops disclaiming what it can suddenly support

Today every edition carries this paragraph (06-16 line 687, identical in 06-05 with its
own number):

> **BEFORE:** "Each ingredient's percentage here is its read against *its own tracked
> baseline window* — a state-of-play "what's flashing this week," never "moved +3.2% since
> last week." The panel does not archive weekly snapshots yet, so I will not pretend it
> measures a week-over-week delta it cannot see."

Once `cost-index-editions.json` carries ≥2 commensurable editions, the second sentence is
no longer true, and clinging to it *understates* the publication. Replace it
conditionally (the generator already branches cleanly on data presence):

> **AFTER (when a commensurable prior edition exists):** "Each ingredient's percentage is
> still its read against its *own tracked baseline window* — the gap, not a price. New this
> week: because the basket is anchored the same way it was last edition, I can also show the
> **move since last week** where it's honest to. The basket eased 0.4 points, from +3.6% to
> +3.2%; avocado has now flagged re-price seven weeks running. Where the basket re-anchored
> or the panel changed, I show no week-over-week number rather than a fake one."

> **AFTER (when the prior edition is NOT commensurable — e.g. a re-anchor):** "The basket
> re-anchored its baseline window this edition, so a week-over-week number would compare two
> different rulers. I'm not printing one. Per-ingredient reads that stayed on the panel
> still carry an honest move-since-last-week below."

The discipline: the spine lets the dispatch *add* a claim, and the same metadata lets it
*withhold* that claim precisely when it would lie. That withholding, stated plainly, is
itself a trust signal — it is the publication showing its work.

### 2.4 Retroactive backfill — do it, but mark it

A one-time `scripts/backfill-cost-index-editions.mjs` can reconstruct prior basket
snapshots by re-running the weighted median over `cost-index-history.json`. But that file
is mixed-cadence (monthly + weekly) and covers only 53 of 101 ingredients, so a
reconstructed basket spine is **approximate**. If backfilled, stamp each reconstructed
edition `"reconstructed": true` and never let a reconstructed point anchor a public WoW
claim — it is context for the curve's shape, not a citable reading. Prefer letting the
real archive accrue forward from the next edition.

---

## 3. The citable driver layer — Urner-Barry discipline

The principle from `cost-index-value-strategy.md` is binding: **out-explain, don't
out-quote; association, not cause; never a fitted coefficient dressed as causation.** The
goal here is to let *correlated events* enter the dispatch without ever crossing into a
claim the data can't carry.

### 3.1 The driver catalog — a new registered data file

Add `data/cost-index-drivers.json`: a catalog mapping legitimate driver classes to the
ingredients they plausibly move, each entry carrying a source and a retrieval date. This
is the fact-gate surface for the entire causal layer — nothing causal may appear in the
dispatch that is not registered here.

```jsonc
{
  "_doc": "Registered driver events. Every causal/contextual claim in the dispatch must trace to an entry here with a source + retrievedAt. Correlational by default; 'mechanism' names the channel, never a coefficient.",
  "drivers": [
    {
      "id": "hpai-2026-q2",
      "class": "animal-disease",
      "affects": ["eggs","whole-chicken","chicken-breast","chicken-thigh"],
      "mechanism": "Laying-flock & broiler losses from HPAI detections reduce supply",
      "strength": "correlation",                 // correlation | strong-correlation | mechanism-established
      "directionExpected": "up",
      "source": "USDA APHIS, Confirmed HPAI Detections in Commercial & Backyard Flocks",
      "sourceUrl": "https://www.aphis.usda.gov/...",
      "retrievedAt": "2026-06-18",
      "asOfEvent": "2026-06-12",                  // date of the latest detection cited
      "note": "Detections are a leading supply shock; pass-through lag to retail eggs ~2-6 weeks, to broiler ~variable."
    },
    {
      "id": "desert-sw-heat-2026-06",
      "class": "weather",
      "affects": ["romaine-lettuce","iceberg-lettuce","red-leaf-lettuce","butter-lettuce","cilantro","parsley"],
      "mechanism": "Heat/short harvest windows in CA/AZ desert growing regions tighten leafy-green supply",
      "strength": "correlation",
      "directionExpected": "up",
      "source": "U.S. Drought Monitor; USDA AMS Specialty Crops shipment movement",
      "retrievedAt": "2026-06-18",
      "asOfEvent": "2026-06-15"
    }
  ]
}
```

Legitimate driver classes (the catalog's allowed vocabulary):

| Class | Canonical channel | Typical `affects` | Public source for the event |
|---|---|---|---|
| `animal-disease` (HPAI/avian flu) | flock losses → supply | eggs, poultry | USDA APHIS detections |
| `weather` (drought, heat, freeze) | harvest windows → produce supply | leafy greens, squash, peppers, berries | U.S. Drought Monitor, NOAA, USDA AMS movement |
| `feed` (corn/soy) | feed cost → protein cost on a lag | chicken, pork, eggs | USDA NASS, FRED feed series |
| `dairy-cycle` | milk/cold-storage → butter/cheese | butter, cheddar | USDA Cold Storage, CME cash spot via USDA |
| `energy` (diesel, electricity) | freight & processing → everything | imports, all | EIA diesel |
| `freight-ocean` | container/ocean rates → imports | seafood, avocado, off-season produce | public freight indices (cite-or-omit) |
| `trade` (tariff, border, phyto) | named policy/border event → specific imports | avocado, tomatoes, shrimp | Federal Register / USTR / CBP notices |
| `seasonality` | growing-region transition | seasonal produce | already flagged via `labels[].seasonal` |

### 3.2 The sourcing-and-calibration protocol

1. **Registration before assertion.** No driver appears in the dispatch unless it is in
   `cost-index-drivers.json` with a `source` and a `retrievedAt`. A new
   `scripts/check-cost-index-drivers.mjs` gate fails CI if dispatch prose names a driver
   class not backed by a current catalog entry (entries stale > 30 days are dropped, not
   spoken).
2. **Language pitched to `strength`.** The catalog's `strength` field maps to a fixed
   verb register, so the prose can never out-run the evidence:
   - `correlation` → "tends to move with," "is the standing context behind," "associated
     with." Never "because," "caused," "driven by."
   - `strong-correlation` → "consistently moves ahead of," "a reliable lead on."
   - `mechanism-established` → "feeds directly into" (reserve for feed→protein, the one
     chain the methodology already treats as mechanism).
   - **Note on the hedge-token ban:** `voice-canon-blog.md` bans *tends to, usually,
     typically, may, can, around*. Calibrated uncertainty must therefore route through
     **sourced ranges and named lags**, not hedge words — e.g. not "prices may rise" but
     "APHIS logged detections on 2026-06-12 (retrieved 2026-06-18); egg supply shocks of
     this kind have historically reached wholesale within 2–6 weeks." The number and the
     citation carry the uncertainty; the verb stays flat.
3. **Direction-consistency gate.** A driver is only spoken when its `directionExpected`
   agrees with the ingredient's actual measured read this week. If APHIS shows detections
   (`up` expected) but eggs are reading −10.7%, the dispatch does **not** tell the HPAI
   story as if it were operative — it either stays silent or notes the *divergence*
   explicitly ("detections logged, yet the wholesale read is easing — the shock hasn't
   reached this print"). This is the single most important rule: it kills the temptation
   to tell the dramatic story regardless of what the number says.
4. **The do-not-assert line.** The dispatch will **never**: (a) state a driver *caused* a
   move; (b) attach a magnitude to a driver ("HPAI added 12%"); (c) predict a future price
   from a driver; (d) cite a driver event without a public source and retrieval date; (e)
   speak a driver whose expected direction contradicts the measured read without flagging
   the contradiction. Drivers supply *context for a direction already measured*, never a
   forecast and never an attribution of size.

### 3.3 Worked before/after on a real ingredient

**Avocado (06-16, +68.6%) — today gets zero context** because it isn't a basket staple
and carries no `cost-pressure` read:

> **BEFORE:** "Re-price — Avocado. It reads +68.6% against its baseline — about
> $59.00/carton wholesale (range $47.81–$70.19); elevated and sustained — the increase
> looks real."

> **AFTER (if a `trade` or `weather` driver is registered & direction-consistent):**
> "Re-price — Avocado. It reads +68.6% against its baseline — about $59.00/carton
> wholesale (range $47.81–$70.19); elevated and sustained. Standing context: avocado is
> import-dominated, and CBP logged a Michoacán border slowdown on 2026-06-10 (retrieved
> 2026-06-18) — associated with import-produce tightness, not a measured cause of this
> print. The +68.6% is what the wholesale market shows; the border note is why it's worth
> watching rather than dismissing as noise."

> **AFTER (if NO driver is registered — the honest default, and what ships until one is):**
> unchanged from BEFORE, except the buggy tail is fixed (see §3.4). Silence is the correct
> output when nothing is sourced. The dispatch's value is that it *doesn't* invent the
> avocado story to fill the gap.

**Eggs (06-16, −10.7%, easing) — the calibration test.** Eggs are the textbook HPAI
ingredient, so the lazy move is to tell the avian-flu story every week. But eggs are
*easing*. With the direction-consistency gate:

> **AFTER:** "Eggs read −10.7% against baseline and pull the basket down 0.5 points. HPAI
> remains the standing supply risk for eggs, but APHIS shows no new commercial-layer
> detections in the window (retrieved 2026-06-18) and the wholesale read is easing — so
> this week the egg line is a tailwind, not a flashpoint. The story to tell is the absence
> of the shock, stated as such."

That is the Urner-Barry move: the discipline to *not* tell the dramatic story when the
number disagrees, and to make the absence itself the reportable fact.

### 3.4 Fix the two leaks first (no new data needed)

- **Sign/word bug.** In `repriceList()` (generator line ~387), the trailing clause
  `i.reason || i.verdict || 'a move worth tracking'` prints "the increase looks real" for a
  −6.2% read. Make the reason **sign-aware**: a negative re-price read should read
  "elevated and sustained — the move looks real" or "reading well below baseline and
  holding — the easing looks real," never "the increase." This is a fact-gate fix: the
  prose currently contradicts its own number and the audio speaks it in two languages.
- **Degenerate range.** In `dollarPhrase()` (line ~225), when `rangeCents[0] ===
  rangeCents[1]`, suppress the `(range …)` clause and append "single-source" so
  `$5.51–$5.51` never prints as a range.

---

## 4. Tiered-depth information architecture

Design the descent so the top read stays 30 seconds and everything heavier is *one link
down*, not inlined. Five layers, each addressable:

**Layer 0 — Surface (act/watch, ~30s).** H1 + dek + TLDR + the two rings. The single
question: *is there anything on my menu I should act on?* This already exists and is good.
**Change:** the TLDR's third bullet should lead with the count of re-price signals and the
**single** highest-confidence one, not list all 14 — the 14-item list belongs in Layer 1.

**Layer 1 — The read (drivers + flags, ~3 min).** "What's moving the basket,"
"What's flashing," "Widest gaps." Largely as-is. **Change:** cap the visible re-price list
at the top 5 by confidence-then-magnitude, with a `<details>` "all 14 re-price signals →"
disclosure. Long lists are Layer-1 depth, not Layer-0 surface.

**Layer 2 — Why (the driver layer, §3).** "What's behind the moves," now with the
registered driver catalog attaching sourced context to the *flagged movers*, not only the
basket staples. Every driver claim carries its `<details class="cite">` with source +
retrievedAt.

**Layer 3 — Methodology & confidence appendix (one link, off-page).** The dispatch should
**not** inline the methodology. It should carry a compact, persistent "How this is built"
block linking: `cost-index/methodology/` (the versioned page), the basket-weights version,
the confidence ceiling note ("nothing here is rated *high* — that needs two independent
dollar sources; see methodology §confidence"), and the reproducibility statement. Today
this link is buried once in a drawer; it should be a standing labeled section.

**Layer 4 — Raw / queryable data (off-page, machine-first).** Link the already-built
`/cost-index/feed.json`, per-ingredient `series.json`/`series.csv`, `sources.json` (CC0),
and — new — the per-edition snapshot (§5.2). This is the layer an AI or analyst descends
to. It exists; it's just not linked from the dispatch.

**How a reader/AI moves between them:** Layer 0–2 are in the post body, top-to-bottom, each
H2 a deeper altitude. Layer 3–4 are a single persistent "Go deeper / cite this" block
(§5.3) between the last H2 and the takeaways, plus the per-edition `Dataset` JSON-LD that
points machines straight to Layer 4 without scrolling. The rule: **nothing below Layer 2
is inlined in prose; it is linked.** That keeps the top read from bloating as depth grows.

**Data-export design.** Two new endpoints, both generated alongside the dispatch:
  - `/cost-index/editions.json` — the full archive (§2.1), the publication's time series.
  - `/cost-index/week-<asOf>.json` — the single edition's frozen snapshot (the same object
    written to the archive), so each edition has a 1:1 machine sibling at a stable URL.
Both are derivable from `cost-index-editions.json`; the per-week file is just one element
pretty-printed. CSV mirror (`week-<asOf>.csv`, flat per-ingredient rows) for spreadsheet
users, matching the existing `series.csv` convention.

---

## 5. Citability spec — concrete markup, permalink, archive, "cite this"

The hub is already citable; the *dispatch* is not. Five concrete additions, all
expressible in the generator.

### 5.1 `Dataset` JSON-LD on every edition

Add a third node to the dispatch `@graph` (alongside `Article` + `BreadcrumbList`),
mirroring the hub's existing `Dataset` shape so it's consistent across surfaces:

```jsonc
{
  "@type": "Dataset",
  "@id": "https://muntin.digital/blog/cost-index-week-2026-06-16/#dataset",
  "name": "Muntin Restaurant Cost Index — weekly reading, 2026-06-16",
  "description": "Weighted 16-staple wholesale-cost basket reading and per-ingredient flags for the week of 2026-06-16. Public wholesale levels, not delivered prices.",
  "url": "https://muntin.digital/blog/cost-index-week-2026-06-16/",
  "isPartOf": { "@id": "https://muntin.digital/cost-index/#index-dataset" }, // the hub's series-level Dataset
  "dateModified": "2026-06-17",
  "temporalCoverage": "2026-06-16",
  "license": "https://creativecommons.org/publicdomain/zero/1.0/",
  "creator": { "@id": "https://muntin.digital/#business" },
  "variableMeasured": [
    { "@type": "PropertyValue", "name": "Weighted basket vs baseline", "value": "+3.2%", "measurementTechnique": "Weighted median of 16 staples vs each staple's tracked baseline window" }
  ],
  "isBasedOn": [ "USDA AMS/LMR", "USDA NASS", "BLS", "FRED", "EIA" ],
  "distribution": [
    { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://muntin.digital/cost-index/week-2026-06-16.json" },
    { "@type": "DataDownload", "encodingFormat": "text/csv",         "contentUrl": "https://muntin.digital/cost-index/week-2026-06-16.csv" }
  ]
}
```

`isPartOf` → the hub's series Dataset makes each edition a node of one continuous series in
the eyes of an answer engine — the structured-data expression of the spine.

### 5.2 Per-edition machine snapshot

Ship `/cost-index/week-<asOf>.json` (+ `.csv`) with each dispatch — the frozen edition
object (§2.1). This is the `distribution.contentUrl` above and the thing a journalist or
AI actually pulls.

### 5.3 A "Cite this edition" block (drop-in for the generator)

Place between the last H2 and the takeaways. Plain, copy-pasteable, with a machine link:

```html
<aside class="cite-this" data-llm="citation" aria-label="How to cite this edition">
  <p class="cite-this__eyebrow">Cite this edition</p>
  <p class="cite-this__text">Muntin Digital. “Restaurant Cost Index: where the basket stands, week of 2026-06-16.”
    Muntin Restaurant Cost Index, basket weights v2026-Q2, methodology v1.3.0.
    Published 2026-06-16. https://muntin.digital/blog/cost-index-week-2026-06-16/.
    Data: https://muntin.digital/cost-index/week-2026-06-16.json (CC0).</p>
  <p class="cite-this__repro">Reproducible from public USDA/BLS/FRED data via the methodology’s
    <a href="/cost-index/methodology/#reproduce">worked example</a> and the
    <a href="/cost-index/check/">check suite</a>. Public wholesale levels, never delivered price.</p>
</aside>
```

This single block delivers four north-star pieces at once: the versioned-basket disclosure,
named sources, the stable permalink, and the reproducibility statement.

### 5.4 An edition archive page

Build `blog/cost-index/index.html` (or `/cost-index/weekly/`) — a reverse-chronological
list of every edition with its headline basket %, confidence, and date, plus an
`ItemList`/`DataCatalog` JSON-LD. Generated by a small `build-cost-index-archive.mjs` over
`cost-index-editions.json`. This is the "all weeks" surface a citing party links to for
the series, and the home for the "← previous / next →" inter-edition nav.

### 5.5 Fix the prune/archive drift first

Before building the archive, reconcile the bug from §1(e): the generator's
prune-to-one logic (lines 398–400) leaves stale entries in `library-tags.json` and the
blog `ItemList` while only the latest card renders. **Decision: stop pruning.** An archive
*wants* every edition retained. Change `upsertLibraryTags` to keep all `cost-index-week-*`
entries, set `hide_from_recents: true` (already done) so they don't flood the homepage
strip, and let the new archive page be their home. Then the data file, the `ItemList`, and
the visible surfaces agree.

---

## 6. The generated-vs-human fork — recommendation

**Recommendation: stay primarily generated, add a *narrow, gated* human commentary slot —
not a free-form Don essay.** This is the two-track decision already made in
`cost-index-history-map.md` ("evergreen tracker × timely dispatch on the spike"), applied
at the right altitude.

Reasoning:
- **Full-generated is the safest for the honesty contract** and scales to weekly with zero
  marginal fact-gate risk. The machine cannot invent a number it wasn't given.
- **A free-form human seat is where fabrication enters.** The moment Don writes prose, the
  fact gate must police a human, and the audio renderer will speak any slip in EN+ES. The
  CLAUDE.md warning is explicit about this.
- **But the brief's whole premise — "the operator who actually buys these ingredients" —
  is real value the machine can't supply.** The fix is to make the human slot *structured
  and gated*, not free-form.

**The design: one optional `editorsNote` field per edition.** Add an `editorsNote` to the
edition object (`cost-index-editions.json`), authored by Don, that the generator renders in
a fixed, labeled block ("From the floor — Don Goldstein"). The fact-gate workflow:

1. **It is a registered field, not free prose.** It passes through the *same* gates as any
   dispatch body text: `check-fabrications.mjs`, `check-audio-fabrications.mjs`, and a new
   `check-cost-index-editors-note.mjs` that enforces: every number in the note must match a
   value in that edition's snapshot or a registered `sourced-claims.json` entry; every
   causal claim must trace to `cost-index-drivers.json`; the Tacombi-only bio rule applies.
2. **It is constrained in scope.** The note may interpret *what's on the page* ("the
   romaine line matches what I'm seeing on my own produce drop — the desert transition
   always does this") — first-person operator observation, which is exactly the Don seat
   `voice-canon-blog.md` authorizes. It may **not** introduce a new number, a new
   ingredient, or a forecast.
3. **It is optional and clearly attributed.** Absent by default (most weeks ship fully
   generated). When present, it's visually and semantically separated from the machine read
   so a citing party can tell the measured series from the operator's color.
4. **It never touches the `Dataset` or the headline.** The citable series stays 100%
   machine-derived; the human note is labeled commentary layered beside it, never inside it.

This keeps the series of-record (machine, auditable, reproducible) while giving the
publication the one thing Urner Barry's wire copy has and a pure data feed doesn't: a
named operator who buys these ingredients, speaking on the record, inside the fact gate.

---

## 7. Prioritized roadmap — trust-and-citability leverage per unit of effort

Ranked. **The one change to make first is at the top.**

| # | Change | Effort | Leverage | Ships where |
|---|---|---|---|---|
| **1** | **Build `data/cost-index-editions.json` + write one snapshot per run.** The spine. Unlocks everything below. | M | **Highest** — converts a snapshot generator into a series. | Generator |
| 2 | **Fix the two fact-gate leaks** (sign/word bug; degenerate range). Honesty contract is bleeding *today*. | S | High (defensive — stops a live contradiction the audio speaks) | Next edition |
| 3 | **Surface `elevatedWeeks`** ("N weeks elevated"). Already in the data; no spine needed. First real longitudinal claim. | S | High | Next edition |
| 4 | **Wire the depth links + "Cite this" block + per-edition `Dataset` JSON-LD.** Makes the existing hub machinery reachable and the edition citable. | M | High | Next edition |
| 5 | **Ship `/cost-index/week-<asOf>.json` + `.csv`** per edition. | S | Medium-high | Generator |
| 6 | **Reconcile the prune/ItemList drift; build the edition archive page.** | M | Medium-high | Build |
| 7 | **Conditional WoW / momentum prose** (gated on commensurable editions). Needs the spine to have accrued. | M | High (but blocked on #1 maturing) | Generator, later |
| 8 | **Driver catalog `cost-index-drivers.json` + gate + driver prose on flagged movers.** | L | High but slow — needs ongoing sourced curation. | Build |
| 9 | **`editorsNote` field + its gate.** The human seat. | M | Medium (differentiator, not foundation) | Build |

**The first change, stated plainly:** start persisting `data/cost-index-editions.json` on
every weekly run — and immediately surface `elevatedWeeks` (#3) so the very next edition can
make one honest longitudinal claim ("avocado has flagged re-price seven weeks running")
while the basket spine quietly accrues toward real week-over-week. Pair it with the two
leak fixes (#2), which cost almost nothing and stop a contradiction that ships today.

---

## 8. DO-NOT-DO — moves that look like leveling up but cost the moat

1. **No price predictions, ever** — not "expect avocado to rise," not "prices should ease,"
   not a futures-derived "forecast." Futures, if ever shown, are "the market is pricing X,"
   never a Muntin prediction. (`cost-index-methodology.md` §14; depth-roadmap.)
2. **No causal claims the data can't carry.** No "HPAI drove eggs up 12%." Drivers supply
   *direction context*, never magnitude, never causation. Strength-gated verbs only (§3.2).
3. **No fake week-over-week across a discontinuity.** If the basket re-anchored or
   re-weighted, suppress the WoW and say why — never delta two different rulers (the exact
   trap §1 exposes between the two live editions).
4. **Never conflate wholesale with delivered price.** The "public wholesale levels, never
   your delivered price" line is inviolable and must survive every edit. No feature that
   blurs it ships.
5. **No confidence the engine didn't earn.** Nothing is rated *high* without two
   independent dollar sources (0 qualify today). Marketing/commentary must never imply a
   *high* the pipeline can't produce. (`cost-index-confidence-canon.md`,
   `methodology-hardening.md`.)
6. **No smoothed percentiles, no interpolated gaps, no fabricated seasonality.** Percentile
   is a count ("9 of its last 12"); gaps stay gaps; "no typical June yet" until ≥2 years.
7. **No engagement-bait framing.** No "shocking spike," no "what every restaurant must do
   now," no urgency the number doesn't support. The headline reports the basket; it doesn't
   sell the click.
8. **No driver story that contradicts the measured read** without flagging the divergence
   (the egg/HPAI rule, §3.2).
9. **No human prose outside the gated `editorsNote`** — and nothing in that note that
   introduces a number, ingredient, or forecast not already in the snapshot or
   `sourced-claims.json`.
10. **No reconstructed/backfilled point cited as a reading.** Reconstructed editions are
    context for a curve's shape, never a citable WoW datum (§2.4).

---

*End of spec. Sequenced deliverable order honored: diagnosis (§1) and the longitudinal
spine (§2) lead, because they are the load-bearing calls; the driver layer (§3), tiered
depth (§4), citability (§5), the fork (§6), the roadmap (§7), and the do-not-do list (§8)
build on them.*
