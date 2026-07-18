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
  forecast → excluded.
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

### A. The harmony reads — BUILT AHEAD this session (the signature moment)

`build-ingredient-state-record.mjs` now computes a per-record **`harmony[]`** array — **structured
params only** (bounded numbers + enums + in-corpus slugs, never free prose), so a synthesis line
**cannot** smuggle a forecast/cause/delivered price past the gate, and the island owns the reviewed
EN/ES sentence templates (locale parity preserved). Each read fuses ≥2 fields and appears only when
present. Validated by `check-ingredient-state-record.mjs` (kind ∈ known set; every param bounded;
reliance requires both cross-sources). **107/113 records already carry harmony** (`reliance` = 0
until NASS lands — forward-compatible, exactly like the layer itself).

| kind | fuses | fires today | proposed EN template (island renders; ES mirrors) |
|---|---|---|---|
| **reliance** ⭐ | Census customs × NASS farm-gate | on NASS pull | "About {reliance_pct}% of the US supply **value** is imported — customs-landed against farm-gate, a rough cross-chain proxy{, led by {top_country} at {top_share}%}." |
| **buyclock** | wholesale seasonality × import seasonality | 50 | agree: "Its cheapest month in the record ({Month}) lands inside the import supply peak (Q{q}) — price trough and supply peak fall together." · disagree: "…sits outside the import peak (Q{q}) — the wholesale and import seasons run on different calendars." |
| **supplyshape** | import origin mix + HHI | 97 | "Imports are {concentration} — {top_country} alone is {top_share}% of the stream (a supply-diversity fact, not a risk read)." |
| **served** | edible × cooked yield | 21 | "A pound as purchased is ~{edible}% edible; after cooking, the plated pound costs about ×{served_mult} the invoice pound." (grain inversion when served_mult<1: "…the fire gives weight back — the plated pound costs *less*.") |
| **persistence** | events run-length + co-mover | 78 | "When it moves it runs a median ~{median_days} days and most often travels with {comover} — a co-mover, so a swap there moves with it, not against it." (co-occurrence, never cause) |

**⭐ Signature harmony moment = reliance + supplyshape together** ("≈Z% of supply is imported, nearly
all from one country") — it fuses two independent US-gov datasets into a supply picture neither agency
publishes alone. That is the "stronger together than any single data point" the founder named. The
data layer is built; only the render (below) waits on the NASS pull.

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

### Render mechanics (morning task, small + reviewed)

Add a `harmonySlot(r)` to the `isrSection` island (a new slot right after the answer sentence) that
maps `r.harmony[]` kinds → EN/ES sentences via the templates above, resolving comover/top slugs to
names as the island already does for hedge/comovers. **Mirror the island change byte-for-byte into the
two committed HTMLs** (`cost-index/menu-pricing/index.html` + ES) per the engine-behind runbook. It is
a contained, reviewable change — deliberately left for founder review rather than shipped to a live
page overnight.

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
