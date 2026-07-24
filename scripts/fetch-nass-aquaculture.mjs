#!/usr/bin/env node
/**
 * fetch-nass-aquaculture.mjs — USDA NASS farmed-seafood fundamentals (catfish + trout), wave-5
 * (WORLD-SUPPLY lane) of the corpus-expansion fetch list. The wild-landings (NOAA) + customs
 * unit-value (Census) pair can't see US FARMED production; this fills it for the species that are
 * overwhelmingly aquaculture. NASS Quickstats is US-gov public domain.
 *
 * HONEST SUBSET (ADR-013): a production / sales / grower-price FUNDAMENTAL — never the measured tier,
 * never the Vendor Benchmark reference, never a delivered or retail price, never a forecast.
 *
 *   node scripts/fetch-nass-aquaculture.mjs               # demo: transform a fixture, no network
 *   node scripts/fetch-nass-aquaculture.mjs --self-test   # CI: pin the transform + lane framing
 *   NASS_KEY=… node scripts/fetch-nass-aquaculture.mjs --live   # operator Mac: fetch → data/nass-aquaculture.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'data/nass-aquaculture.json';
const API = 'https://quickstats.nass.usda.gov/api/api_GET/';
const SINCE = 2015;
// Confirmed live 2026-07-24: catfish/trout are class_desc under commodity_desc "FOOD FISH", with
// annual SURVEY data (not just the 5-yearly CENSUS) at NATIONAL. Try these (class, statistic) pairs;
// NASS 400s a combo with no rows, so empties are skipped.
const COMMODITY = 'FOOD FISH';
const SOURCE = 'SURVEY';
const AGG = 'NATIONAL';
const SPECS = [
  { cls: 'CATFISH', stat: 'SALES' },
  { cls: 'CATFISH', stat: 'PRICE RECEIVED' },
  { cls: 'CATFISH', stat: 'INVENTORY' },
  { cls: 'CATFISH, FOODSIZE', stat: 'SALES' },
  { cls: 'TROUT', stat: 'SALES' },
  { cls: 'TROUT', stat: 'PRICE RECEIVED' },
  { cls: 'TROUT, FOODSIZE', stat: 'SALES' },
];

// NASS Value is a display string: commas ("1,234,567"), or withheld/NA markers "(D)"/"(NA)"/"(Z)".
function numOrNull(v) {
  const s = String(v == null ? '' : v).trim();
  if (/^\(.*\)$/.test(s) || s === '') return null; // (D) withheld, (NA), etc.
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function normalize(rows) {
  const out = [];
  for (const r of rows) {
    const value = numOrNull(r.Value);
    if (value == null) continue; // drop withheld / non-numeric
    out.push({
      commodity: r.commodity_desc || null,
      species: r.class_desc || null,
      statistic: r.statisticcat_desc || null,
      unit: r.unit_desc || null,
      year: Number(r.year) || null,
      value,
      short_desc: r.short_desc || null,
    });
  }
  return out;
}

function assemble(records, fetchedAt) {
  const byKey = {};
  for (const r of records) {
    const k = `${r.species} · ${r.statistic}`;
    (byKey[k] = byKey[k] || { species: r.species, statistic: r.statistic, unit: r.unit, series: [] }).series.push({ year: r.year, value: r.value });
  }
  for (const k of Object.keys(byKey)) byKey[k].series.sort((a, b) => a.year - b.year);
  return {
    _doc: 'USDA NASS farmed-seafood fundamentals (catfish + trout): production / sales / grower-price by year. A WORLD-SUPPLY / production FUNDAMENTAL for species that are overwhelmingly US aquaculture — never the measured tier, never the Vendor Benchmark reference, never a delivered/retail price, never a forecast (ADR-013 honest subset). Source: USDA NASS Quickstats, public domain. Built by scripts/fetch-nass-aquaculture.mjs --live on the operator Mac.',
    source: 'USDA NASS Quickstats — https://quickstats.nass.usda.gov/',
    license: 'public-domain-usgov',
    lane: 'world-supply (production fundamental; never a price, never in the index/VB)',
    fetchedAt: fetchedAt || null,
    series_count: Object.keys(byKey).length,
    series: Object.values(byKey),
  };
}

const DEMO = [
  { commodity_desc: 'FOOD FISH', class_desc: 'CATFISH', statisticcat_desc: 'SALES', unit_desc: '$', year: '2023', Value: '424,000,000', short_desc: 'FOOD FISH, CATFISH - SALES, MEASURED IN $' },
  { commodity_desc: 'FOOD FISH', class_desc: 'CATFISH', statisticcat_desc: 'SALES', unit_desc: '$', year: '2022', Value: '(D)', short_desc: 'FOOD FISH, CATFISH - SALES (withheld)' },
  { commodity_desc: 'FOOD FISH', class_desc: 'TROUT', statisticcat_desc: 'PRICE RECEIVED', unit_desc: '$ / LB', year: '2023', Value: '2.15', short_desc: 'FOOD FISH, TROUT - PRICE RECEIVED, MEASURED IN $ / LB' },
];

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  eq('parses a comma value', numOrNull('424,000,000'), 424000000);
  eq('drops a withheld (D) value', numOrNull('(D)'), null);
  eq('drops empty', numOrNull(''), null);
  const recs = normalize(DEMO);
  eq('normalize drops the withheld row (3 → 2)', recs.length, 2);
  const out = assemble(recs, null);
  eq('groups into commodity·statistic series', out.series_count, 2);
  eq('series sorted by year', assemble(normalize([{ commodity_desc: 'X', statisticcat_desc: 'Y', unit_desc: 'u', year: '2020', Value: '2' }, { commodity_desc: 'X', statisticcat_desc: 'Y', unit_desc: 'u', year: '2019', Value: '1' }]), null).series[0].series.map((s) => s.year), [2019, 2020]);
  eq('lane is world-supply / never a price', out.lane, 'world-supply (production fundamental; never a price, never in the index/VB)');
  eq('license public domain', out.license, 'public-domain-usgov');
  console.log(`fetch-nass-aquaculture self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

async function live() {
  const key = process.env.NASS_KEY;
  if (!key) { console.error('fetch-nass-aquaculture --live needs NASS_KEY (free: quickstats.nass.usda.gov/api).'); process.exit(1); }
  const all = [];
  for (const spec of SPECS) {
    const qs = new URLSearchParams({ key, commodity_desc: COMMODITY, class_desc: spec.cls, statisticcat_desc: spec.stat, source_desc: SOURCE, agg_level_desc: AGG, year__GE: String(SINCE), format: 'JSON' });
    let res;
    for (let a = 0; a < 3; a++) { try { res = await fetch(`${API}?${qs}`); break; } catch (e) { if (a === 2) throw e; await new Promise((r) => setTimeout(r, 2000 * (a + 1))); } }
    if (res.status === 400) { console.error(`  · ${spec.cls}/${spec.stat}: no series (400) — skipped`); continue; } // NASS 400 = empty/invalid combo
    if (!res.ok) { console.error(`  · ${spec.cls}/${spec.stat}: HTTP ${res.status} — skipped`); continue; }
    const json = await res.json();
    const rows = (json && json.data) || [];
    const n = normalize(rows);
    all.push(...n);
    console.error(`  · ${spec.cls}/${spec.stat}: ${n.length} row(s)`);
  }
  const out = assemble(all, new Date().toISOString());
  fs.writeFileSync(path.join(repo, OUT), JSON.stringify(out, null, 2) + '\n');
  console.log(`fetch-nass-aquaculture: wrote ${OUT} — ${out.series_count} series, ${all.length} data points.`);
}

if (process.argv.includes('--self-test')) { selfTest(); }
else if (process.argv.includes('--live')) { live().catch((e) => { console.error('fetch-nass-aquaculture --live failed:', e.message); process.exit(1); }); }
else {
  console.log('DEMO (fixture, no network):\n');
  console.log(JSON.stringify(assemble(normalize(DEMO), null), null, 2));
  console.log(`\nRun with NASS_KEY=… --live on the operator Mac to fetch NASS and write ${OUT}.`);
}
