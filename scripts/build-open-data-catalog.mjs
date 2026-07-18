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

  // ---- MUNTIN VALUE-ADDED ANALYSIS → CC BY 4.0 ---------------------------------------------------
  { id: 'ingredient-state-record', tier: 'derived', title: 'Ingredient State Record (fused corpus)',
    agency: 'Muntin Cost Index — fuses Census imports/exports, NASS, and internal price/yield/events layers',
    files: ['cost-index/ingredient-state-record.json', 'cost-index/ingredient-state-record.csv'],
    note: 'One present-state record per ingredient. Descriptive, never a forecast; wholesale a market-direction reference, never a delivered price; import value never volume; reliance an apparent-consumption proxy; co-occurrence never cause. Underlying import/export/production columns are US-gov public domain; the fused compilation is CC BY 4.0.' },
  { id: 'eia-energy-backdrop', tier: 'derived', title: 'Energy backdrop (each carrier vs its own range)',
    agency: 'Muntin Cost Index — computed from US EIA public-domain series',
    files: ['cost-index/eia-energy-backdrop.json'],
    note: 'Each energy carrier read against its own multi-decade range (percentile, band, YoY). A coincident site-wide backdrop, never a per-ingredient driver, never a forecast. Underlying series are US-gov public domain; the computed reads are CC BY 4.0.' },
  { id: 'crop-condition-backdrop', tier: 'derived', title: 'Crop-condition backdrop (corn & soybean feed complex)',
    agency: 'Muntin Cost Index — computed from USDA NASS public-domain crop-progress series',
    files: ['cost-index/crop-condition-backdrop.json'],
    note: 'Each feed crop\'s good-to-excellent share read against its own same-week history in prior seasons (percentile, band). A coincident site-wide backdrop on the feed complex, never a per-ingredient driver, never a forecast. Underlying series are US-gov public domain; the computed reads are CC BY 4.0.' },
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
