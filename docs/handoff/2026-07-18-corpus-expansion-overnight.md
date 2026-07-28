# Corpus expansion — overnight handoff (2026-07-18)

**Thread:** aggregate many public data sources into one fused per-ingredient record, sources working
**in harmony** (whole > sum of parts), presented **accessibly and empoweringly** to everyone.
**Separate from the research paper** — resume the paper once the corpus picture is complete.

Branch: `claude/vendor-benchmark-redesign-yn273q`. Data fetches run on the operator's Mac (keys +
network); the container has neither. Two-writer git: operator pushes data, assistant pulls + builds.

---

## STATE (what's shipped / staged)

- **Census imports — complete + audited.** 113 ingredients, 99 with a US import stream at the finest
  HS granularity (beef/pork by primal cut, produce by variety, seafood, cheeses, cured ham). A
  food-chapter audit confirmed coverage and surfaced ~56 more "restaurant-invoice" ingredients.
- **Invoice-ingredient expansion — registered, pull pending.** `data/ingredient-specialty.json` +
  the HS crosswalk now carry 56 new items (fruit, nuts, fish, meat, dairy, spices, pantry,
  beverages). Builder skips a specialty ingredient until its data lands, so the record holds at 113
  until the invoice pull is in. **The invoice pull (`INVOICE_SH`, 79 HS6 codes) was running in the
  operator's terminal at bedtime — push it first thing.**
- **The explorer** at `/cost-index/menu-pricing/` — deep-linkable combobox → self-assembling dossier,
  reads `/cost-index/ingredient-state-record.json` at runtime.
- **NASS domestic-supply layer — built ahead (this commit `c00b179a5`).** Crosswalk
  `data/ingredient-nass-codes.json` (~90 ingredients incl. the herbs Census couldn't reach) + a
  forward-compatible builder. Inert until `data/nass-domestic.jsonl` lands, then every mapped
  ingredient gains production volume + $ value, farm-gate price, area, yield, and the first
  cross-source harmony read: **import reliance** (US grows $X, imports $Y).

---

## MORNING FETCHES (run these, then push; assistant integrates)

### 1. Push the invoice-ingredient data (already fetched overnight)
```
git pull --rebase origin claude/vendor-benchmark-redesign-yn273q && git add -A && git commit -m "Census: invoice-ingredient import streams (56 new)" && git push origin claude/vendor-benchmark-redesign-yn273q
```
Then the assistant rebuilds → the record jumps to ~169 ingredients.

### 2. NASS domestic-supply pull (new — needs `NASS_KEY`, free at quickstats.nass.usda.gov/api)
Reads the committed crosswalk for the commodity list, pulls national annual SURVEY series
(production / price received / area / yield), writes `data/nass-domestic.jsonl`:
```
bash <<'NASS_PULL'
set -uo pipefail
: "${NASS_KEY:?export NASS_KEY=... first (free: quickstats.nass.usda.gov/api)}"
B="https://quickstats.nass.usda.gov/api/api_GET/"
COMS=$(jq -r '.codes | to_entries | map(.value.commodity) | unique | .[]' data/ingredient-nass-codes.json)
: > data/nass-domestic.jsonl
while IFS= read -r com; do
  for stat in "PRODUCTION" "PRICE RECEIVED" "AREA HARVESTED" "YIELD"; do
    raw=$(curl -s -G "$B" \
      --data-urlencode "key=$NASS_KEY" \
      --data-urlencode "commodity_desc=$com" \
      --data-urlencode "agg_level_desc=NATIONAL" \
      --data-urlencode "domain_desc=TOTAL" \
      --data-urlencode "source_desc=SURVEY" \
      --data-urlencode "statisticcat_desc=$stat" \
      --data-urlencode "format=JSON")
    if echo "$raw" | jq -e '.data' >/dev/null 2>&1; then
      echo "$raw" | jq -c --arg com "$com" --arg stat "$stat" '{commodity:$com, stat:$stat, rows:[.data[]|[.year,.class_desc,.reference_period_desc,.unit_desc,.Value,.short_desc]]}' >> data/nass-domestic.jsonl
    fi
    sleep 0.25
  done
  echo "  done $com"
done <<< "$COMS"
echo "NASS pull complete -> data/nass-domestic.jsonl ($(wc -l < data/nass-domestic.jsonl) lines)"
NASS_PULL
```
Then: `git pull --rebase … && git add -A && git commit -m "USDA NASS: domestic production, farm price, area, yield" && git push …`.
The assistant then rebuilds + **verifies the selection heuristics against the real rows** (NASS
proliferates by class/period/unit — the builder's picks are conservative and need a first-real-data
check), tunes any bad picks, and the domestic-supply + reliance layer lights up.

---

## ROADMAP — open-data + pressure expansion (sequenced, honesty-gated)

_Synthesized overnight (the `muntin-source-roadmap` workflow's synth output was lost to a context
reset; hand-synthesized from ADR-017's "next sources" + the builder's forward-compatible pattern —
the documented recovery path). Every source below is **US-gov public-domain redistributable**, lands
the way NASS did (crosswalk committed inert → builder layer degrades by absence → honesty gate
extended → operator's Mac runs the keyed fetch → assistant rebuilds + verifies heuristics against
real rows), and is **descriptive, never a forecast/driver/delivered price**._

**Tier 1 — the domestic pair (the biggest harmony payoff):**

1. **USDA NASS domestic supply** — _crosswalk built, builder inert-ready, PULL QUEUED for this
   morning (§2 above)._ Production volume + $ value, **farm-gate** price, area, yield → the flagship
   **import-reliance** cross-source read (Census customs ÷ (customs + NASS farm-gate)). ~90 mapped
   ingredients. First job after the pull: verify the builder's class/period/unit selection heuristics
   against the real rows.
2. **NOAA Fisheries commercial landings (FOSS)** — the **domestic pair for the seafood imports** the
   corpus already carries (shrimp, salmon, cod, lobster, crab, tilapia, scallop…). US commercial
   landings by species, value + pounds, public domain (`foss.nmfs.noaa.gov`). Today seafood has an
   import stream but **no domestic side**, so it is the largest block with no reliance read — the
   natural #2. Crosswalk: slug → NOAA species. Honesty caveat to surface: wild **landings** vs largely
   **aquaculture imports** is a chain difference, so the seafood reliance read names that seam.

**Tier 1½ — make the reliance read honest (the audit's denominator fix).** The adversarial audit
showed `import ÷ (import + production)` overstates the imported share (exports aren't netted). Two
public-domain fixes, both worth landing with NASS:

- **Census exports/HS** — the *same* Census API we already use, exports endpoint. Nets exports out so
  the denominator becomes **apparent consumption** (production + imports − exports), the correct base
  for a supply share.
- **USDA ERS Food Availability** (per-capita apparent consumption) — a public-domain, descriptive
  (non-forecast) ERS series that independently frames how much of a commodity is actually consumed
  domestically. The honest cross-check for the reliance ratio.

**Tier 2 — descriptive backdrops (context, never a per-ingredient driver):**

3. **EIA energy** (diesel #2, natural gas, electricity) — a **coincident site-wide backdrop only.**
   Freight (diesel) + cold-chain / greenhouse heat (gas, power) are energy-linked, but the corpus
   states this as a standing backdrop association, **never** a per-ingredient cause or a pressure
   driver (ADR-013 already demoted diesel). One `/open` energy-backdrop panel, not an ingredient
   field. Public domain (`eia.gov` API).
4. **BLS PPI / import price indexes** — public commodity PPI + import-price-index series could add a
   descriptive within-series *trend* context. **Low priority, high honesty risk** — must never read as
   a delivered price; gate hard before surfacing.

**Tier 3 — deepen what we already hold:**

5. **Census HS10 quantity where published** — some HS10 lines publish quantity beside value; where
   they do, a within-series **unit-value index** (value ÷ qty) becomes a descriptive *shape* (never a
   price level). Per-code investigation.
6. **NASS cold-storage** (already the ADR-014 pressure tier) — extend the deseasonalized-stocks
   coverage as a domestic-inventory backdrop.

**Deliberately EXCLUDED (on principle, not availability):**

- **USDA ERS Food Price Outlook** — public domain **but a forecast product**; the corpus does not
  forecast → excluded. (ERS's *descriptive* series — Food Availability, the Food Dollar — are fine and
  are used above; only the forward-looking Outlook is out.)
- **FAO / IMF / World Bank / UN Comtrade** — richer global data but **not redistributable** under the
  CC-BY posture → off-limits.

---

## PRESENTATION / HARMONY SPEC — sources working together

_Synthesized overnight (the `muntin-harmony-presentation` workflow's synth output was lost to the
same context reset; hand-synthesized against the live `isrSection` island + the builder). The
founder's north star: the sources should **combine into reads no single field gives**, presented
**accessibly + empoweringly** to anyone who works with food._

The explorer at `/cost-index/menu-pricing/` already renders a self-assembling per-ingredient
**dossier** (combobox → card: yield/trim + invoice calculator, own-baseline band, cheapest-month +
hedge, import sparkline + seasonal fingerprint + origins/HHI, shocks + co-movers, pressure). Harmony
is the next layer — the fields **synthesized**, not just stacked.

### A. The harmony reads — BUILT AHEAD + ADVERSARIALLY AUDITED this session

`build-ingredient-state-record.mjs` now computes a per-record **`harmony[]`** array — **structured
params only** (bounded numbers + enums + in-corpus slugs, never free prose), so a synthesis line
**cannot** smuggle a forecast/cause/delivered price past the gate, and the island owns the reviewed
EN/ES sentence templates (locale parity preserved). Validated by `check-ingredient-state-record.mjs`.

**A 4-lens adversarial audit** (fact-gate · ag-economist · accessibility · operator-empowerment,
all default-refute) ran over the first draft and **dropped two of five kinds** — recorded so the
reasoning survives:

- ❌ **`buyclock`** (wholesale-cheapest month vs import peak) — labeled an import-**value** peak a
  "supply/volume peak" (value-never-volume breach), the peak-quarter tie-break was an artifact on
  low-seasonality items, and it added nothing to a buy the `cheapest_month` field already decides.
- ❌ **`served`** (edible × cooked) — crossed two different trim bases (card edible × depth cooked),
  **mispriced raw-portioned cuts** (cooking loss doesn't raise cost per raw-portioned steak), and its
  grain-inversion branch was dead code (0 grains in the scored set). The served-pound teaching stays
  where it is already properly caveated: the menu-pricing **dispatch**.

The **three surviving kinds**, with their audit-corrected EN templates (ES mirrors):

| kind | fuses | fires today | audit-corrected EN template (island renders) |
|---|---|---|---|
| **reliance** ⭐ | Census import value × NASS farm-gate production value | on NASS pull | "In {reliance_year} the US farm gate took in about ${prod} for this and imports ran about ${imp} — imports are about {reliance_pct}% of the two combined. A rough cross-point comparison, **not a true supply share**: imported value carries freight the farm price doesn't, and exports aren't netted out, so it overstates the imported share. Of those imports, {top_country} was {top_share}%." |
| **supplyshape** | import origin mix + HHI | 97 | single-source: "Almost all imports come from one country — {top_country}, {top_share}% of all imports in 2025 by value." · concentrated: "Imports come mostly from {top_country} ({top_share}% of 2025 imports by value); the rest is spread across others." · diversified: "Imports are spread across several countries (largest {top_country}, {top_share}%)." |
| **persistence** | move run-length + co-mover | 78 | with co-mover: "Across its {n} recorded price moves the middle one ran about {median_days} days. It moved the same way as {comover} in {comover_shared} of those moves — historically {comover} did not move against it (co-occurrence, which may be coincidental, not cause)." · without: "Across its {n} recorded moves the middle one ran about {median_days} days — long enough that riding a spike out rarely pays." |

**Builder fixes the audit forced** (all shipped): `single-source` now requires a top share ≥90%
(tomato 81% / avocado 88% → **concentrated**, not the old self-contradictory "single-source"; 54→22
single-source); the persistence co-mover is **named only on a real majority** (≥3 shared AND ≥½ of n,
so noise pairs like ribeye→garlic 2/6 and avocado→acorn-squash 2/6 are dropped — 31 named, 47 keep
just the run-length); reliance is **year-aligned** + stamped and reframed as a cross-point ratio.

**⭐ Signature harmony moment = reliance + supplyshape together** — two independent US-gov datasets
fused into one supply picture neither agency publishes alone ("the US farm gate took in $X, imports
ran $Y, almost all from one country"). The data layer is built + gated; the render waits on the NASS
pull. **107/113 carry harmony today** (supplyshape 97 + persistence 78; reliance 0 until NASS).

### B. Accessibility — "for anyone who works with food"

The record's declared audience is already operators, chefs, home cooks, journalists, researchers.
Every field keeps a plain "what this means for you": the band is a market-**direction** reference
(your delivered/retail price tracks it with a lag + markup — already stated on the band); the import
stream is *where supply comes from and when it leans on imports*; the calculator turns any field into
**your** number. No jargon left un-glossed.

### C. Empowerment — three levers from three sources

**Time the buy** (cheapest month), **check the hedge** (co-mover — and learn it usually *isn't* one),
**cost your own pound** (the invoice calculator that never prints a Muntin dollar). The harmony reads
make the levers legible *together* instead of as scattered fields.

### D. The corpus as an ecosystem (harmony at the whole-corpus level)

Co-movers already link ingredients and `#slug` deep-links already jump card→card. Next: a small
"moves with" cluster view so 113→169 isolated cards read as **one connected web** — the whole visibly
greater than the parts. Descriptive co-occurrence, never cause.

### E. Coverage honesty (always visible)

"N ingredients · M with an import stream · K with a pressure read · (later) J with domestic supply."
Null **degrades by absence** — a bare ingredient renders short + honest; a rich one renders the full
stack. Never a fabricated field to fill a gap.

### The render architecture — THE CHAIN (from the `muntin-harmony-presentation` workflow)

The recovered design workflow (ground→dream→judge→synth, 12/13 agents) chose a spine that turns the
flat dossier into one oriented read: **THE CHAIN — a per-ingredient vertical `Source → Market → Your
Plate` frame**, rendered as a new slot in the `isrSection` island right after the yield+calculator
slot (so the reader's typed invoice feeds the top rung). It is the "price ladder" insight with its
fatal flaw designed out: the ladder's three *price* rungs were empty today (farm-gate = 0/113), so the
already-populated **origin/HHI read becomes the SOURCE rung** — a genuine 3-rung chain renders on ~60
slugs now, ≥2 rungs on ~94, and the FARM price point + reliance split slot in **by absence** when NASS
lands, no reframe. This maps directly onto the harmony field: **supplyshape → SOURCE**, **persistence
+ band/posture → MARKET**, **reliance/farm_price → the SOURCE/FARM growth**, the invoice calculator →
**YOUR PLATE**.

Rungs (top→bottom): **YOUR PLATE** (rust — the reader's typed $ × trim_tax, live) → **MARKET** (stone —
±band direction + a one-word exposure badge + the 12-item pressure why/when) → **SOURCE** (teal —
origin country + concentration). A left-edge axis reads **"position in the chain," never a $ scale**;
between rungs sit **named form-transitions** ("whole animal → boxed cut → your plate"), **never a
numeric subtraction** until a committed `chain_commensurable` flag proves same-form/same-unit end to
end. Companion **"zoom out: the whole basket"** figure (category × trim_tax × band) sits below the
dossier. A new `check-chain-honesty.mjs` recompute-gate asserts no `$` on SOURCE/MARKET, import value
stays confined to its own slot, the FARM rung is absent while `farm_price` is null, and the chain is
**suppressed for specialty items** (a one-rung chain would mislead).

**CUT (from the design's own cut-list, honor these):** no ship-now three-*price*-rung ladder
(farm-gate empty); no dollar-subtraction ribbons between rungs (deferred to `chain_commensurable`); no
auto-supplied/defaulted delivered price to "complete" the top rung — **YOUR PLATE is only ever the
reader's own number**; no new route (it's a slot in the existing deep-linked island); raw pressure
weights stay in the open dataset, only top-2 indicators + direction + lead surface.

**Morning build order** (small, reviewed; engine-behind runbook — mirror the island byte-for-byte into
`cost-index/menu-pricing/index.html` + ES): (1) `chain(r, deliveredVal)` in `ISR_ISLAND` reusing the
existing `el()/magbar()/usd()/slot()` helpers + the `isr-price-<slug>` input handler; (2) EN/ES chain
strings into the `T` dictionary + `.isr-chain/.isr-rung/.isr-transition/.isr-badge` CSS; (3) bake
`pressure_why[]` (top-2 contributors) + the exposure badge into the record build; (4) the hedge-vs-
mirror sidestep chip under YOUR PLATE; (5) the two static viz figures (gate-compliant) + extend the
noscript table/CSV with origin/band-direction/edible-cost columns; (6) `check-chain-honesty.mjs` wired
into `check-all`; (7) reserved NASS fields (`farm_price*`, `chain_commensurable`, `chain_note`) drawn
by absence. Deliberately **not** shipped overnight — it touches a live page and wants founder review.

---

## HONESTY LEDGER (binding across the whole corpus)

- Descriptive of the tracked record — **never a forecast.**
- Wholesale band is a market-**direction reference**, never a delivered/retail price.
- Import figures are nominal **value**, never volume (unpublished at HS6).
- Farm price (NASS) is **farm-gate** — a distinct point in the chain, never the wholesale reference,
  never a pressure driver (ADR-013 relaxation is descriptive-tier only).
- Import reliance is a **value-share proxy** (customs-landed vs farm-gate) — noted as such.
- Co-occurrence is **never cause.** Null layers degrade by **absence** (not drawn).
- Only US-gov public-domain redistributable sources (NASS/Census/EIA/NOAA/USDA). IMF / World Bank /
  FAO / UN Comtrade are **off-limits** for redistribution.
