# ADR-018 — The CHAIN presentation architecture (making the fused corpus visible)

**Status:** Accepted (2026-07-18). Build sequenced; menu-pricing island first.
**Supersedes/extends:** ADR-017 (the fused Ingredient State Record), ADR-015 (open-data explore surfaces), ADR-012 (Vendor Benchmark market-context).

## Context

The Ingredient State Record (ADR-017) now fuses, per ingredient, every present-state layer the corpus
computes: AMS/BLS/FRED/USDA wholesale (posture, band, cheapest month, hedge), edible + cooked yield,
Census imports (value, seasonality, origins, HHI), Census exports, NASS production + farm-gate price +
**value-reliance**, **NOAA wild landings + the catchpair seam**, **ERS per-capita availability (the
volume cross-check)**, the events/co-mover engine, and cost-pressure. `harmonyFor` distils four
cross-source **seams**: `supplyshape`, `reliance` (now value **and** volume), `persistence`, `catchpair`.

The problem this ADR resolves: **the corpus is complete but nearly invisible.** The menu-pricing island
reads the record but renders none of the four harmony seams; the citable per-ingredient pages show only
band + seasonality + events; the new trade/domestic/availability layers reach a reader only via the CC-BY
download. The richest fused signal on the site is dark. And a naive fix — dumping every field onto a page —
would overwhelm, not empower, and would let honesty-distinct numbers collide (a 98%-single-source origin
fact beside a 5%-of-consumption reliance fact, a wild-landings figure beside a farmed-import figure).

## Decision

Present the fused corpus on a single spine that **doubles as the honesty mechanism**: the **CHAIN —
Source → Market → Your-Plate.** Every number lives at exactly one chain point; the visual separation of
rungs is what keeps distinct chain points (farm-gate ≠ wholesale ≠ import-value ≠ plate; value-reliance ≠
volume-availability; wild ≠ farmed; co-occurrence ≠ cause) from being conflated.

### Seam / field → rung

| Rung | Question | Data |
|---|---|---|
| **SOURCE** | Where does it come from? | `supplyshape` (origin mix + HHI) · `reliance` (value % **+** ERS per-capita lbs) · `catchpair` (US wild landings vs a largely-farmed import, `wild_minimal` flagged) |
| **MARKET** | What's happening to the price? | wholesale band + posture · pressure direction · cheapest month · notable events + `persistence` (run-length + majority co-mover) |
| **YOUR PLATE** | What does it mean in my kitchen? | edible + cooked yield · trim tax · hedge swap · the pricing math |

Null layers **degrade by absence** — an empty rung is not drawn; a bare ingredient renders short + honest.

### Three surfaces, three distinct jobs (not the same content everywhere)

1. **Menu-pricing island** (`/cost-index/menu-pricing/`) — the **primary interactive dossier.** The CHAIN
   renders as a *walk* the reader descends (farm → plate). Where the four seams finally become visible.
   Rich, exploratory, visual-depth. **Built first (highest leverage).**
2. **Per-ingredient pages** (`/cost-index/<slug>/`, ~155) — the **citable / answer-engine surface.** A
   compact "Supply picture" block + schema.org (`Dataset` + `FAQPage` with the caveat inside every
   `acceptedAnswer`). The AEO/SEO workhorse — what gets indexed and lifted. Built second, reusing the
   island's render logic.
3. **Open-data explorers** (`/open/…`) — the **data-immersion surface**: the century-long raw series, the
   "inside the data" feel, for the researcher. Built by the dataset-explorers workflow.

### Cross-cutting requirements

- **Visual depth** ("inside the data"): the CHAIN as a walk, not a flat stack — layered/scroll-driven
  reveals moving farm→plate, live hover/crosshair, each seam its own honest micro-viz (share bar, paired
  value bars, stat tile). Genuinely sophisticated + purposeful, **never gratuitous**; WCAG 2.1 AA,
  `prefers-reduced-motion`-safe, performant, and no effect may misrepresent a number.
- **AEO/SEO** on every surface: schema.org structured data, semantic heading hierarchy, phrasing that
  survives verbatim extraction **with its caveat intact**, meta/OG, `llms.txt` + sitemap registration.
  Never trade the honesty framing for a richer snippet.
- **Engine-behind-pages:** the committed pages run ahead of the in-container build engine, so every change
  is a bounded, in-place edit to the committed HTML **plus** a mirror into `build-cost-index-pages.mjs` —
  never a from-scratch regenerate in-container (which would regress the live pages).
- **EN + ES parity:** the island owns reviewed EN/ES sentence templates per seam; the record carries only
  bounded structured params (numbers + enums + in-corpus slugs), so no synthesis line can smuggle a
  forecast/cause/delivered-price past the gate.

## Honesty seam templates (the reviewed sentences the island renders)

- **reliance** ⭐ — "In {reliance_year} imports were about {reliance_pct}% of apparent consumption by value
  (made + imported − exported); about {percap_lbs} lb/person/yr are available domestically ({percap_year}).
  A dollar comparison — not how much of what is on your shelf came from abroad — not a supply-security
  score; import value carries freight a farm price doesn't. Of those imports, {top_country} was
  {top_share}%." The `%` is **NOT clamped to 100**: a heavy re-exporter's imports can exceed apparent
  consumption (brussels-sprouts ~112%), and the render appends "Over 100% means imports exceed apparent
  consumption — the US re-exports part of its supply" rather than masking it. Commodity-scope names the
  group in the reader's own language (an EN→ES map, so the ES tile reads "del grupo tomates", not the raw
  English "tomatoes").
- **supplyshape** — concentration verdict + top source, a share-of-import-stream bar (never share-of-supply).
- **catchpair** — two INDEPENDENT stat figures (NOT a shared-axis bar pair, which an adversarial audit
  showed implies the very supply-share the seam forbids — "shrimp landings are 1/6 of imports → 84%
  imported"): "US wild landings ${landings} ({landings_year})" beside "US imports, same year ${import}
  ({import_year})". Caveat is mode-neutral ("dockside ex-vessel first-sale value … beside the customs
  value of imports — two different measures, not a supply-share ratio"); the farming clause ("Most
  imports of this species are farmed abroad") is appended ONLY when `import_mostly_farmed` — never
  hard-coded, because octopus/lobster/squid/crab/cod/etc. are wild-caught imports. `wild_minimal` names
  the negligible-wild case.
- **persistence** — run-length always; a co-mover named only on a real majority, tagged "shared timing,
  not cause."

## Consequences

- The seams' honesty is pinned by `check-ingredient-state-record.mjs` (bounded params, no forecast/cause,
  reliance/catchpair require both sides, year-aligned) + the pin-test; the island render must not restate a
  raw field twice (compose the seam sentence as the single source).
- **Landed (2026-07-23): `scripts/check-menu-pricing-render.mjs`** (wired into `check-all`, `--self-test` +
  live). It pins the render so it can't silently drift: (1) **byte-parity** — the engine's `ISR_ISLAND`
  and `ISR_CSS` (unescaped) appear verbatim in BOTH committed pages, which is the single guarantee that
  engine == EN == ES for the island; (2) the **render contract** — reliance emits its caveat + year +
  scope, catchpair renders year-aligned paired value bars and **never a `%`/share** or a `reliance`
  reference, every seam sits behind a null guard, and the rungs seal in SOURCE→MARKET→YOUR PLATE order
  behind the degrade-by-absence check; (3) **EN/ES T-key parity** (no untranslated or orphaned render
  string). This is what makes the engine-behind-pages hazard safe: any hand-edit or engine regen that
  desyncs the three files, or drops a seam caveat, fails CI.
- This ADR consolidates the `muntin-isr-improvement-loop` findings (menu-pricing island, Vendor Benchmark,
  events explorer, seasonality hub) + the events-explorer visual-depth/AEO-SEO pass. The loop's
  adversarial-verify refinements are folded in as they land; the architecture above is fixed.
