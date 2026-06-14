# Cost Index — New-Source Adapter Specs

> Implementation-ready specs for the sources surfaced in the depth research
> (roadmap §3c/§3d/§3e). Each is grounded in the *existing* interfaces so a
> connected-run build is near-copy-paste, not from scratch. Compiled 2026-06-13.
>
> **Two normalizer libs:**
> - **Levels** → `tools/_shared/cost-index-sources.js` (imported as `S` by
>   `scripts/fetch-cost-index-sources.mjs` / `verify-cost-index-sources.mjs`):
>   `normalizeAms`, `normalizeBls`, `normalizeFred`, `normalizeNoaaTrade`,
>   `normalizeEia`. Each returns `{ points:[{ valueCents, asOf, basis }], … }`.
> - **Pressure** → `tools/_shared/pressure-sources.js` (imported as `S` by
>   `scripts/fetch-pressure-observations.mjs`): `windowChange`, `amsSeries`,
>   `nwsFreezeActive`, `usdmSeverity`, `eiaSeries`, `fredSeries`, `nassSeries`,
>   `seasonSignal`, `eventSignal`. Pressure specs live in
>   `data/pressure-source-specs.json#specs`; dispatch is a `switch (spec.type)`.
>
> Honesty defaults carry over: levels gate through `check-cost-index-sync` +
> calibration; derived levels are tier `derived` + banded; pressure is direction
> only (`check-pressure-honesty`).

---

## A. GATS import unit-value adapter — `normalizeGats` (NEW, levels lib)

**Purpose:** derived wholesale-proxy level for import-dominated items (banana,
avocado, lime, pineapple, ginger, garlic) and a seafood cross-check. Roadmap §3e /
methodology §7 (import unit-value) + §7.0 (ratio bridge).

**Where:** add `normalizeGats(raw, opts)` to `tools/_shared/cost-index-sources.js`,
modeled on the existing `normalizeNoaaTrade` (which already does value÷volume unit
value for fish by HS code — GATS generalizes it to all commodities).

**Interface (mirror `normalizeNoaaTrade`):**
```
normalizeGats(raw, {
  source: 'gats',
  hts: ['080390'],          // HS code(s) for the commodity (banana = 0803...)
  partner,                  // optional country filter (avocado → 'Mexico')
  valueField: 'CustomsValue',
  volumeField: 'Quantity',  // → unitValueCents = round(value / volume * per-lb factor)
  unit: 'lb',
  basis: 'wholesale-import' // NOT 'wholesale' — see honesty
}) -> { points:[{ valueCents, asOf, basis }], family:'gats', type:'gats-trade' }
```

**Source-spec shape** (`data/cost-index-sources.json#ingredients.<key>.gats`):
```json
"banana": { "gats": { "hts": ["080390"], "valueField": "CustomsValue",
  "volumeField": "Quantity", "unit": "lb", "_status": "STAGED verified:false" } }
```

**Fetch wiring** (`fetch-cost-index-sources.mjs`, beside the NOAA block ~L203):
`if (raw.gats) { const o = S.normalizeGats(raw.gats, {...m.gats}); o.family='gats'; … outs.push(o); }`
plus a `m.gats` fetch (FAS GATS API key, Swagger/SDK per §3c) in the fetch section.

**Honesty / tier:** emit tier `derived`, basis `wholesale-import`. Customs value
excludes duty/freight/importer margin, so it is **below** delivered wholesale —
ratio-bridge it up via the AMS-terminal overlap (§7.0): learn `wholesale ≈ k ×
importUV` on items where both exist, apply k per cluster. For ~100%-imported banana,
k≈1 + a small landed margin; band = the fit residual. Never tier `measured`.

---

## B. APHIS HPAI pressure — `aphisHpai` (NEW, pressure lib)

**Purpose:** the dominant egg/poultry price driver — flock detections/layer culls as
a leading supply-shock. Roadmap §3e. Eggs, whole-turkey, whole-chicken,
chicken-breast, chicken-thigh.

**Where:** add `aphisHpai(raw, opts)` to `tools/_shared/pressure-sources.js`; add
`case 'aphis': return S.eventSignal(S.aphisHpai(raw, { species: spec.species, tail: spec.tail }));`
to the dispatch in `fetch-pressure-observations.mjs` (~L43), a URL builder
(`spec.type==='aphis'`) for the APHIS commercial/backyard-flock detections feed
(public; dataset + dashboard per §3e — confirm the JSON/CSV endpoint on the
connected run), and a `pull()` case returning the rows.

**Normalizer logic:** sum birds-affected (or flock count) for `species` (e.g.
`table-egg-layer`, `turkey`) over a trailing window vs the prior window →
a positive **upward** pressure signal when detections accelerate (culls tighten
supply → price up). Output normalized to `windowChange`-style magnitude or a
`eventSignal` boolean if a major cull is active.

**Pressure-spec shape** (`data/pressure-source-specs.json#specs`):
```json
"hpai-layers": { "type": "aphis", "species": ["table-egg-layer"], "tail": 8,
  "verified": false, "note": "APHIS HPAI commercial layer detections → egg supply shock." }
```
Then wire it as a lead in `data/pressure-rules.json` for `eggs` (and turkey/poultry),
direction `up`, with the hold-until-proven track-record bar (methodology §10).

**Honesty:** direction only, never a price; correlational but mechanism-ironclad
(culls → supply ↓). Subject to `check-pressure-honesty` recompute match.

---

## C. AMS National FOB Review — 2nd produce source (REUSE `normalizeAms`)

**Purpose:** independent **direction** corroborator for the ~60 single-source produce
items → lifts trend confidence `low → medium`. Roadmap §3d.

**Where:** no new normalizer — reuse `normalizeAms`. Add a second AMS spec block per
produce item pointing at the National FOB Review report (one MARS report, many
commodities; `--discover` its commodity terms → map to our slugs).

**Source-spec shape** (add alongside the existing terminal `ams` entry):
```json
"romaine-lettuce": { "ams": [ { /* existing terminal report */ },
  { "reportId": "<FOB Review id>", "commodity": "Lettuce, Romaine",
    "asTrendOnly": true, "reducer": "mostlyMid", "unit": "carton" } ] }
```

**Critical:** flag the FOB entry **`asTrendOnly: true`** (new flag the vendor must
honor) — F.O.B. (origin) sits *below* terminal (destination) by freight, so it must
add an independent *trend type*, **not** be averaged into the level (that would
mix bases and trip the >15% dispersion cap falsely). Confirm `normalizeAms` /
`composite-price` route an `asTrendOnly` source into trend provenance only.

---

## D. Desert-SW weather pressure — MOSTLY EXISTING (`nws` + `season`)

**Purpose:** leading freeze/heat spike indicator for leafy greens (Yuma winter /
Salinas summer). Roadmap §3e.

**Where:** **no new code** — the pressure system already has `nws`
(`nwsFreezeActive`, freeze events by area) and `season` (region-by-month windows).
Only new *config*:

**Pressure-spec shape:**
```json
"freeze-yuma": { "type": "nws", "events": ["Freeze Warning","Hard Freeze Warning"],
  "areaMatch": "Yuma|Imperial", "verified": false,
  "note": "Winter lettuce: Yuma/Imperial freeze → leafy-greens supply shock." },
"freeze-salinas": { "type": "nws", "events": ["Freeze Warning"], "areaMatch": "Monterey|Salinas" }
```
Gate the active region by month via a `season` companion (Yuma Nov–Mar, Salinas
Apr–Oct). Wire as leads for romaine/iceberg/leaf lettuces, spinach, broccoli,
cauliflower, celery in `data/pressure-rules.json`, direction `up`, hold-until-proven.

**Honesty:** direction only; magnitude not modeled (mechanism strong — ~90% of
winter lettuce is Yuma).

---

## E. AMS Movement / volume pressure — SCAFFOLD EXISTS (`fetchMovement`)

`fetch-pressure-observations.mjs` already has a `fetchMovement(spec)` stub. Complete
it against the AMS Specialty Crops Movement reports (volume = shipments + crossings +
imports; high arrivals → softening) as a *downward* pressure lead for the produce it
covers. Roadmap §3c. Direction only, correlational.

---

## Build order (value ÷ effort)

1. **D — weather pressure** (config only, code exists) — fast leafy-greens depth.
2. **C — FOB Review** (reuse `normalizeAms` + the `asTrendOnly` flag) — ~60 items.
3. **B — APHIS HPAI** (one new pressure normalizer) — the egg/poultry signal.
4. **A — GATS** (one new level normalizer, new FAS key) — import-dominated derived levels.
5. **E — Movement** (finish the existing stub) — produce volume leads.

Each lands through the existing gate suite; nothing here weakens an honesty rule.
