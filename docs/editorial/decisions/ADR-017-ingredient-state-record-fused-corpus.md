# ADR-017 — The Ingredient State Record: a fused multi-source corpus (import + domestic-supply descriptive tiers)

- **Status:** Accepted (autonomous corpus-expansion session, 2026-07-18); founder review open.
- **Date:** 2026-07-18
- **Owner:** Cost-Index / open-data thread
- **Review by:** 2026-10-18
- **Relates to:** ADR-013 (gov-data-sources policy — this **scopes a relaxation** of its "no NASS
  price fetcher" open question); ADR-014 (NASS cold-storage deseasonalization — same source, pressure
  tier); ADR-015 (open-data explore surfaces — same CC0/CC-BY + honesty contract); `docs/fact-check.md`
  (the absolute number rule); `data/ingredient-hs-codes.json`, `data/ingredient-nass-codes.json`,
  `data/ingredient-specialty.json`, `scripts/build-ingredient-state-record.mjs`,
  `scripts/check-ingredient-state-record.mjs`, `/cost-index/menu-pricing/` (the explorer).

## Context

The Cost Index tracks 100 wholesale-priced ingredients (the measured price band, from USDA
AMS/BLS/FRED — untouched by this ADR). Alongside that measured tier we have been building a
**fused, present-state record per ingredient** — the Ingredient State Record — that joins many
**public-domain, redistributable** sources into one dossier the `/cost-index/menu-pricing/`
explorer reads at runtime. This session mined the US Census International Trade imports/HS source to
completion (finest HS10 cut level), audited the food chapters to confirm coverage, expanded the
ingredient set to the items a restaurant invoice actually touches, and built the USDA NASS
domestic-supply layer ahead of its fetch.

ADR-013 left an **open question**: whether to relax its "avoid building a NASS *price* fetcher"
position. That caution was about the **pressure tier and the measured price band** — keeping farm
prices out of the numbers that drive a posture or stand in for a delivered price. It was never a ban
on descriptive use.

## Decision

The Ingredient State Record fuses these sources as **descriptive tiers**, each honesty-scoped. None
touches the measured price band or the Vendor Benchmark reference.

1. **Import layer (US Census, imports/HS).** Per ingredient: 16-year import **value** series, within-
   year seasonal fingerprint, YoY, top source **countries** + Herfindahl concentration, at the finest
   HS level the schedule exposes (HS10 primal cuts for meat, variety splits for produce). Value never
   volume (unpublished at HS6). A slug may aggregate several codes (fresh+frozen, a primal split);
   HS8 subheading prefixes sum a whole subheading. SDESC-verified; combined codes noted.

2. **Domestic-supply layer (USDA NASS) — the ADR-013 relaxation, scoped.** Per ingredient (where the
   US commercially grows it): national annual production **volume + $ value**, **farm price received**
   (farm-gate), area, yield — the clean SURVEY series (domain=TOTAL). This **relaxes** ADR-013's "no
   NASS price fetcher" position **only** for this descriptive layer. Guardrails: farm price is
   **farm-gate**, a distinct point in the chain, rendered as its own labeled tier — **never** the
   wholesale reference, **never** a pressure driver, **never** a delivered/retail price. It is a
   published, public-domain fact about the upstream, not a number that moves a posture.

3. **Import-reliance (the first cross-source harmony read).** `import_reliance_pct` = customs import
   value ÷ (import + farm-gate production value). A **descriptive value-share proxy** — the two are
   measured at different points in the chain — and it renders only when **both** sources are present.
   Never a forecast, never a risk score.

4. **The ingredient set follows the invoice.** Beyond the 100 priced ingredients, an
   **import-defined specialty tier** carries anything likely on a restaurant invoice with a real US
   import stream (fruit, nuts, fish, meat, dairy, spices, pantry/prepared, beverages) — import stream
   present, wholesale band **honestly absent** (no USDA reference tracks them). The builder skips a
   registered specialty ingredient until its data lands, so registration is inert until real.

## Consequences

- The record grows from the 100 priced ingredients toward ~169 as the invoice pull + NASS pull land;
  every layer **degrades by absence** (a null field is not drawn), so a bare ingredient renders short
  and honest while a rich one renders the full stack.
- New honesty surface area is gated: `check-ingredient-state-record.mjs` fails the build on unbounded
  fields, envelope-count drift, a specialty ingredient carrying a wholesale layer, reliance without
  both cross-sources, or forecast/causation/delivered-price language.
- The reliance proxy's cross-chain caveat must stay visible wherever reliance is shown.
- **Next sources** (separate roadmap, adversarially audited): NOAA Fisheries landings (wild-caught US
  seafood, the domestic pair for the seafood imports), EIA energy as a coincident backdrop only, and
  a deepened weather/pressure layer. FAO/IMF/World Bank/UN Comtrade remain **off-limits** for
  redistribution.
- This corpus work is **separate from the research-paper thread**, which resumes once the fused
  picture is complete.
