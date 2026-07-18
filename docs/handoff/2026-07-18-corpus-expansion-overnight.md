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

## ROADMAP — open-data + pressure expansion (from the adversarially-audited workflow)

_Filled in when `muntin-source-roadmap` completes. Sequenced, honesty-gated._

<!-- ROADMAP:PENDING -->

---

## PRESENTATION / HARMONY SPEC (from the dreamer/judge workflow)

_The design for making the fused sources accessible + empowering (the price-chain ladder, the
reliance/origin read, the availability calendar, the supply-fragility composite, the signature
harmony moment). Filled in when `muntin-harmony-presentation` completes._

<!-- PRESENTATION:PENDING -->

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
