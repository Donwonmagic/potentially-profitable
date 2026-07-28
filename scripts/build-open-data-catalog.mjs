#!/usr/bin/env node
/**
 * build-open-data-catalog.mjs — the master open-data catalog: one entry per published dataset,
 * declaring its license under the deliberate ADR-015/ADR-017 split:
 *
 *   - RAW GOVERNMENT PASSTHROUGHS (US Census, USDA NASS, US EIA, NOAA) -> CC0 (public domain).
 *     These are US-Government works (17 USC 105) — we redistribute them verbatim, no rights added.
 *   - MUNTIN VALUE-ADDED ANALYSIS (the fused record, the energy backdrop, the derived open datasets)
 *     -> CC BY 4.0. The compilation / computation is Muntin's own work; attribution is required.
 *
 * Every dataset carries provenance (the agency + series behind it) and the honesty note that must
 * travel with the data (descriptive, never a forecast; wholesale a reference not a price; import
 * value not volume; farm price farm-gate; reliance an apparent-consumption proxy; energy a backdrop
 * not a driver; co-occurrence not cause). check-open-data-catalog.mjs enforces the split + coverage.
 *
 * Output: cost-index/open-data-catalog.json
 *
 *   node scripts/build-open-data-catalog.mjs            # build
 *   node scripts/build-open-data-catalog.mjs --check    # CI: rebuild & diff (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const OUT = 'cost-index/open-data-catalog.json';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';
const BASE = 'https://muntin.digital/';

// tier: 'gov' (raw US-gov passthrough -> CC0) | 'derived' (Muntin analysis -> CC BY 4.0).
// files are repo-relative paths that must exist; bytes/mtime-free (deterministic) — we stamp size only.
const DATASETS = [
  // ---- RAW GOVERNMENT PASSTHROUGHS → CC0 ---------------------------------------------------------
  { id: 'census-imports', tier: 'gov', title: 'US import value by HS code (2010–2025)',
    agency: 'US Census Bureau — International Trade (imports/HS)',
    files: ['data/census-imports.jsonl'],
    note: 'General US import value (GEN_VAL_MO) by HS code, monthly, nominal — value, never volume (unpublished at HS6). Public domain.' },
  { id: 'census-import-origins-2025', tier: 'gov', title: 'US import value by source country (2025)',
    agency: 'US Census Bureau — International Trade (imports by CTY)',
    files: ['data/census-import-origins-2025.jsonl'],
    note: 'US import value by HS code × source country, 2025. Real countries only. A supply-diversity fact, never a risk forecast. Public domain.' },
  { id: 'census-exports', tier: 'gov', title: 'US domestic export value by HS6 (2010–2025)',
    agency: 'US Census Bureau — International Trade (exports/HS, DF=1)',
    files: ['data/census-exports.jsonl'],
    note: 'US domestic exports (DF=1, US-produced goods excluding foreign re-exports) by HS6, monthly, nominal value. Public domain.' },
  { id: 'nass-domestic', tier: 'gov', title: 'US domestic production, farm price, area, yield',
    agency: 'USDA National Agricultural Statistics Service — QuickStats (SURVEY)',
    files: ['data/nass-domestic.jsonl'],
    note: 'National annual production ($ + volume), farm-gate price received, area, yield. Farm price is farm-gate — a distinct point in the chain, never the wholesale reference. Public domain.' },
  { id: 'nass-crop-condition', tier: 'gov', title: 'US corn & soybean crop condition (weekly)',
    agency: 'USDA National Agricultural Statistics Service — Crop Progress (SURVEY)',
    files: ['data/nass-crop-condition.jsonl'],
    note: 'National weekly share of the corn and soybean crop rated in each condition class (very poor..excellent), by year and week — the feed-complex health signal. An observed present-state rating, never a forecast. Public domain.' },
  { id: 'eia-energy', tier: 'gov', title: 'US energy carriers — diesel, natural gas, electricity',
    agency: 'US Energy Information Administration',
    files: ['data/eia-energy.jsonl'],
    note: 'Monthly No.2 diesel retail, Henry Hub natural gas spot, US average retail electricity. Public domain.' },
  { id: 'noaa-ghcn-weather', tier: 'gov', title: 'Observed weather at import growing regions (GHCN-Daily)',
    agency: 'NOAA NCEI — Global Historical Climatology Network (Daily)',
    files: ['data/weather-observations.jsonl'],
    note: 'Daily TMIN/TMAX/PRCP (tenths) at representative stations in import-origin growing regions, 1991–present. Observed weather, never a forecast. Public domain.' },
  { id: 'noaa-cpc-oni', tier: 'gov', title: 'CPC Oceanic Niño Index (ENSO regime)',
    agency: 'NOAA Climate Prediction Center',
    files: ['data/cpc-oni.txt'],
    note: 'The observed El Niño / La Niña (ENSO) regime index, 3-month seasons. Observed, never a forecast. Public domain.' },
  { id: 'noaa-landings', tier: 'gov', title: 'US commercial fish landings by species (1950–2024)',
    agency: 'NOAA Fisheries — FOSS commercial landings',
    files: ['data/noaa-landings.jsonl'],
    note: 'US commercial (wild-caught) landings — value ($, nominal ex-vessel) and pounds (round weight) — by species and state, for the restaurant-relevant seafood categories. Confidential rows are withheld (null), never zero-padded. Public domain.' },
  { id: 'ers-food-availability', tier: 'gov', title: 'US per-capita food availability by commodity',
    agency: 'USDA Economic Research Service — Food Availability (Per Capita) Data System',
    files: ['data/ers-food-availability.jsonl'],
    note: 'Per-capita food availability (pounds/person/year) and the underlying supply-and-use series by commodity and year, across 12 food groups. A supply-side proxy for consumption, never a measured intake, never a price, never a forecast. Public domain.' },
  { id: 'ers-meat-price-spreads', tier: 'gov', title: 'US meat price spreads — farm/wholesale/retail (1970–)',
    agency: 'USDA Economic Research Service — Meat Price Spreads',
    files: ['data/ers-meat-price-spreads.jsonl'],
    note: 'Monthly national-average farm value, wholesale value, retail value, and the spreads between them for beef, pork, and broilers, in cents per pound of retail equivalent. The retail figure is national-average grocery retail, never a delivered or menu price; the spreads are documented statistics, never a forecast. Public domain.' },
  { id: 'ers-food-dollar', tier: 'gov', title: 'US Food Dollar Series — farm share + marketing chain (1993–2023)',
    agency: 'USDA Economic Research Service — Food Dollar Series',
    files: ['data/ers-food-dollar.jsonl'],
    note: 'How each dollar Americans spend on domestically-produced food splits across the marketing chain (farm production, processing, packaging, transport, wholesale, retail, foodservices, energy, …) in cents per domestic food dollar, plus the farm share. A national macro statistic, never a per-ingredient claim, never a forecast. Public domain.' },
  { id: 'food-recalls', tier: 'gov', title: 'FDA food recalls tagged to tracked ingredients (2020–)',
    agency: 'US Food and Drug Administration — openFDA Food Enforcement',
    files: ['data/food-recalls.json', 'cost-index/food-recalls.csv'],
    note: 'Dated FDA food-enforcement recalls whose product text names a tracked ingredient, each row tagged with the matched ingredient slug (a whole-word product-text match, not a supply or price link). A documented food-safety record surfaced on its own — co-occurrence, never a cause, never a magnitude, never joined to a price. FDA-regulated foods only (USDA/FSIS meat, poultry, and egg recalls are absent). Public domain.' },
  { id: 'qcew-wages', tier: 'gov', title: 'County restaurant-industry wages & employment (QCEW, 2019–)',
    agency: 'US Bureau of Labor Statistics — Quarterly Census of Employment and Wages',
    files: ['data/qcew-wages.json', 'cost-index/qcew-wages.json', 'cost-index/qcew-wages.csv'],
    note: 'Quarterly average weekly wage, establishments, and employment for the private food-services industry (NAICS 722 & 7225) in Montgomery County, MD. A descriptive county industry average — never a per-plate labor cost, never blended into the food index, the pressure math, or the Vendor Benchmark reference, never a forecast. Public domain.' },
  { id: 'marts-sales', tier: 'gov', title: 'US food-services monthly retail sales (MARTS, 2015–)',
    agency: 'US Census Bureau — Monthly Retail Trade Survey (via FRED)',
    files: ['data/marts-sales.json', 'cost-index/marts-sales.json', 'cost-index/marts-sales.csv'],
    note: 'Monthly retail sales for Food Services & Drinking Places (NAICS 722), $ millions, seasonally adjusted and not, via FRED\'s public mirror. Observed sales — never a demand forecast; the most recent month is a provisional advance estimate subject to revision. A descriptive demand backdrop, never blended into the food index, the pressure math, or the Vendor Benchmark reference. Public domain.' },

  // ---- MUNTIN VALUE-ADDED ANALYSIS → CC BY 4.0 ---------------------------------------------------
  { id: 'ingredient-state-record', tier: 'derived', title: 'Ingredient State Record (fused corpus)',
    agency: 'Muntin Cost Index — fuses Census imports/exports, NASS, and internal price/yield/events layers',
    files: ['cost-index/ingredient-state-record.json', 'cost-index/ingredient-state-record.csv'],
    note: 'One present-state record per ingredient. Descriptive, never a forecast; wholesale a market-direction reference, never a delivered price; import value never volume; reliance an apparent-consumption proxy; co-occurrence never cause. Underlying import/export/production columns are US-gov public domain; the fused compilation is CC BY 4.0.' },
  { id: 'ingredient-codes', tier: 'derived', title: 'Ingredient identity crosswalk (slug → federal codes)',
    agency: 'Muntin Cost Index — maps our ingredient slugs to US Census HS, USDA NASS, USDA ERS, NOAA Fisheries and GHCN weather identifiers',
    files: ['cost-index/ingredient-codes.json', 'cost-index/ingredient-codes.csv'],
    note: 'An identity map, never a measurement: no price, no volume, no share, no ranking, no forecast. A code means "this is the federal identifier we read for this ingredient" — never that it is imported, grown domestically, or scarce. `granularity` is an absolute cross-authority level (line finer than commodity, group coarser, proxy = a growing region standing in for the ingredient, not an identity of it). `binding` = code_shared_by_slugs marks the codes the source CANNOT split, so any per-slug figure drawn from one is really the combined figure for every ingredient listed in `shared_with`. The codes and their descriptions are US-gov public domain; the slug-to-code mapping is Muntin editorial work, CC BY 4.0.' },
  { id: 'eia-energy-backdrop', tier: 'derived', title: 'Energy backdrop (each carrier vs its own range)',
    agency: 'Muntin Cost Index — computed from US EIA public-domain series',
    files: ['cost-index/eia-energy-backdrop.json'],
    note: 'Each energy carrier read against its own multi-decade range (percentile, band, YoY). A coincident site-wide backdrop, never a per-ingredient driver, never a forecast. Underlying series are US-gov public domain; the computed reads are CC BY 4.0.' },
  { id: 'crop-condition-backdrop', tier: 'derived', title: 'Crop-condition backdrop (corn & soybean feed complex)',
    agency: 'Muntin Cost Index — computed from USDA NASS public-domain crop-progress series',
    files: ['cost-index/crop-condition-backdrop.json'],
    note: 'Each feed crop\'s good-to-excellent share read against its own same-week history in prior seasons (percentile, band). A coincident site-wide backdrop on the feed complex, never a per-ingredient driver, never a forecast. Underlying series are US-gov public domain; the computed reads are CC BY 4.0.' },
  { id: 'noaa-landings-domestic', tier: 'derived', title: 'US domestic wild-landings by seafood group',
    agency: 'Muntin Cost Index — computed from NOAA Fisheries FOSS public-domain landings',
    files: ['cost-index/noaa-landings-domestic.json'],
    note: 'US commercial WILD landings (value + pounds) summed to national by seafood species group — the domestic pair for each seafood import stream. A wild-catch figure set beside a largely-farmed import stream: the wild-vs-farmed seam is named per group, never collapsed into a clean apparent-consumption share; negligible wild fisheries are flagged. Underlying series are US-gov public domain; the computed reads are CC BY 4.0.' },
  { id: 'ers-food-availability-mapped', tier: 'derived', title: 'Per-capita availability mapped to tracked ingredients',
    agency: 'Muntin Cost Index — computed from USDA ERS public-domain availability series',
    files: ['cost-index/ers-food-availability.json'],
    note: 'USDA ERS per-capita availability (lbs/person/year) mapped to tracked ingredients — the VOLUME companion to the value-based reliance read (how many pounds per person are available domestically). A supply-side proxy for consumption, published at the commodity level (a variety/cut carries its parent commodity figure), never a measured intake, never a price, never a forecast. Underlying series are US-gov public domain; the mapping/compilation is CC BY 4.0.' },
  { id: 'meat-price-chain', tier: 'derived', title: 'Protein price chain (farm → wholesale → retail)',
    agency: 'Muntin Cost Index — computed from USDA ERS Meat Price Spreads',
    files: ['cost-index/meat-price-chain.json'],
    note: 'The documented national-average farm → wholesale → retail chain for beef, pork, and broilers, with the spreads and the downstream-markup share (how much of the farm-to-retail spread sits above wholesale — downstream of where a kitchen buys). Retail is national-average grocery retail, never a delivered or menu price; a documented spread, never a forecast. Underlying series are US-gov public domain; the computed reads are CC BY 4.0.' },
  { id: 'food-dollar', tier: 'derived', title: 'The Food Dollar — farm share + marketing-chain split',
    agency: 'Muntin Cost Index — computed from USDA ERS Food Dollar Series',
    files: ['cost-index/food-dollar.json'],
    note: 'The farm share of the US food dollar (~16¢) and the marketing-chain split (foodservices, retail, processing, wholesale, farm production, energy, …) summing to 100, per year. The sitewide macro bookend to the per-protein meat chain. A national macro statistic, never a per-ingredient claim, never a forecast. Underlying series are US-gov public domain; the computed reads are CC BY 4.0.' },
  { id: 'food-recalls-by-ingredient', tier: 'derived', title: 'Food recalls indexed to tracked ingredients',
    agency: 'Muntin Cost Index — openFDA recalls keyed to the tracked-ingredient taxonomy',
    files: ['cost-index/food-recalls-by-ingredient.json'],
    note: 'openFDA food recalls compiled onto Muntin\'s tracked-ingredient taxonomy: per ingredient, the count of distinct recall events (event_id) by FDA severity class, the raw notice count, and the five most recent notices. The honest headline is distinct events, never the notice count; co-occurrence, never a cause, never joined to a price. The underlying recalls are US-gov public domain; the selection onto the tracked taxonomy is CC BY 4.0.' },
];

function build() {
  const datasets = DATASETS.map((d) => {
    const present = d.files.filter((f) => fs.existsSync(path.join(repoRoot, f)));
    const bytes = present.reduce((a, f) => a + fs.statSync(path.join(repoRoot, f)).size, 0);
    return {
      id: d.id,
      title: d.title,
      license: d.tier === 'gov' ? 'CC0 1.0' : 'CC BY 4.0',
      license_url: d.tier === 'gov' ? CC0 : CCBY,
      rights: d.tier === 'gov'
        ? 'US Government work — public domain (17 USC 105); redistributed verbatim.'
        : 'Compilation © Muntin Cost Index, licensed CC BY 4.0. Attribution: "Muntin Cost Index, muntin.digital".',
      source: d.agency,
      honesty_note: d.note,
      downloads: present.map((f) => ({ path: f, url: BASE + f.replace(/^data\//, 'data/'), bytes: fs.statSync(path.join(repoRoot, f)).size })),
      available: present.length === d.files.length,
      total_bytes: bytes,
    };
  });
  return {
    name: 'Muntin Cost Index — open-data catalog',
    description: 'Every published Muntin Cost Index dataset with its license, source, and the honesty note that travels with the data. Rights split (ADR-015/ADR-017): raw US-government passthroughs are CC0 (public domain); Muntin\'s value-added compilations are CC BY 4.0.',
    index: BASE + 'open/',
    splits: { gov_public_domain: CC0, muntin_compilation: CCBY },
    counts: {
      total: datasets.length,
      cc0: datasets.filter((x) => x.license === 'CC0 1.0').length,
      ccby: datasets.filter((x) => x.license === 'CC BY 4.0').length,
      available: datasets.filter((x) => x.available).length,
    },
    datasets,
  };
}

function run() {
  const out = JSON.stringify(build(), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(path.join(repoRoot, OUT)) ? fs.readFileSync(path.join(repoRoot, OUT), 'utf8') : '';
    if (cur !== out) { console.error(`DRIFT: ${OUT} is stale — run: node scripts/build-open-data-catalog.mjs`); process.exit(1); }
    const c = JSON.parse(out).counts;
    console.log(`open-data-catalog: OK — ${c.total} datasets (${c.cc0} CC0, ${c.ccby} CC-BY, ${c.available} available) in sync.`);
  } else {
    fs.writeFileSync(path.join(repoRoot, OUT), out);
    const c = JSON.parse(out).counts;
    console.log(`Wrote ${OUT}: ${c.total} datasets — ${c.cc0} CC0 (gov), ${c.ccby} CC-BY (Muntin), ${c.available} with files present.`);
  }
}
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
