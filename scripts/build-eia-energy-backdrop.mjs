/**
 * build-eia-energy-backdrop.mjs — the Energy Backdrop.
 *
 * A COINCIDENT, SITE-WIDE backdrop: the cost of the energy the food system runs on — diesel (the fuel
 * under freight and reefer trucks), natural gas (greenhouse heat + food processing), and electricity
 * (refrigeration + cold storage). It is descriptive context, read against each carrier's OWN multi-
 * decade range. Per ADR-013 it is NEVER a per-ingredient driver, NEVER a cause of any tracked food
 * price, and NEVER a forecast — the diesel demotion is preserved by construction: this artifact carries
 * no ingredient reference at all, and the honesty gate enforces that.
 *
 * Input : data/eia-energy.jsonl  (one line per carrier: {series,label,unit,description,points:[{period,value}]})
 *          — US EIA, public domain (US Government work). Fetched on the operator's Mac.
 * Output: cost-index/eia-energy-backdrop.json  (CC-BY packaging of a public-domain source)
 *
 * Deterministic (no build clock): dateModified = the latest period present across the series.
 *
 * Usage:  node scripts/build-eia-energy-backdrop.mjs           # build
 *         node scripts/build-eia-energy-backdrop.mjs --check   # CI: rebuild & diff (exit 1 on drift)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = process.cwd();
const IN = 'data/eia-energy.jsonl';
const OUT = 'cost-index/eia-energy-backdrop.json';

// Plain, general role descriptions — what each carrier does across the food SYSTEM. Descriptive, not a
// causal claim about any single price. Keyed by the pull's `label`.
const ROLE = {
  diesel: 'the fuel under freight and refrigerated trucks',
  natural_gas: 'greenhouse heat and food processing',
  electricity: 'refrigeration and cold storage',
};
const TITLE = { diesel: 'Diesel', natural_gas: 'Natural gas', electricity: 'Electricity' };

function bandLabel(pctile) {
  if (pctile >= 80) return 'near the top of its own range';
  if (pctile <= 20) return 'near the bottom of its own range';
  if (pctile >= 60) return 'in the upper part of its own range';
  if (pctile <= 40) return 'in the lower part of its own range';
  return 'around the middle of its own range';
}

export function buildBackdrop(lines) {
  const carriers = [];
  let latestPeriod = '';
  for (const s of lines) {
    const pts = (s.points || []).filter((p) => p.value != null && p.period).map((p) => ({ period: String(p.period), value: Number(p.value) }));
    if (pts.length < 24) continue; // need a real history to read a range
    // sort oldest -> newest
    pts.sort((a, b) => (a.period < b.period ? -1 : 1));
    const vals = pts.map((p) => p.value);
    const latest = pts[pts.length - 1];
    if (latest.period > latestPeriod) latestPeriod = latest.period;
    const min = Math.min(...vals), max = Math.max(...vals);
    const pctOfRange = max > min ? Math.round(((latest.value - min) / (max - min)) * 100) : null;
    // historical percentile: share of all months at or below the latest (descriptive, where it sits)
    const percentile = Math.round((vals.filter((v) => v <= latest.value).length / vals.length) * 100);
    // year-over-year: latest vs the reading ~12 months earlier (descriptive nominal change, never a forecast)
    const prior = pts[pts.length - 13];
    const yoyPct = prior && prior.value > 0 ? Math.round((latest.value / prior.value - 1) * 1000) / 10 : null;
    // vs its own trailing 5-year (60-month) average
    const last60 = vals.slice(-60);
    const avg5 = last60.reduce((a, b) => a + b, 0) / last60.length;
    const vs5yrPct = avg5 > 0 ? Math.round((latest.value / avg5 - 1) * 1000) / 10 : null;
    carriers.push({
      key: s.label,
      title: TITLE[s.label] || s.label,
      role: ROLE[s.label] || null,
      unit: s.unit || null,
      source_series: s.series || null,
      latest_period: latest.period,
      latest_value: latest.value,
      span: pts[0].period + '..' + latest.period,
      range_min: min, range_max: max,
      pct_of_range: pctOfRange,
      percentile,
      band: bandLabel(percentile),
      yoy_pct: yoyPct,
      vs_5yr_avg_pct: vs5yrPct,
      series: pts.map((p) => [p.period, p.value]),
    });
  }
  return {
    dataset: 'Muntin Cost Index — Energy Backdrop',
    url: 'https://muntin.digital/cost-index/',
    license: 'CC BY 4.0', license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital); underlying data US EIA (public domain)',
    note: "A coincident, site-wide backdrop — the cost of the energy the food system runs on: diesel (freight + reefer trucks), natural gas (greenhouse heat + processing), and electricity (refrigeration + cold storage). Each carrier's latest value is read only against its OWN multi-decade range (pct_of_range, percentile, band) and its own recent history (yoy_pct, vs_5yr_avg_pct) — all descriptive of the tracked energy series. This is NOT a driver of any tracked food price, NOT a measured link to a single ingredient, and NOT a forecast; it carries no ingredient reference. Energy underlies moving, heating, and cooling food in general, but no single ingredient's price is attributed to it here. Underlying series are US EIA, public domain.",
    dateModified: latestPeriod || null,
    carriers,
  };
}

function run() {
  let lines;
  try { lines = fs.readFileSync(path.join(repoRoot, IN), 'utf8').trim().split('\n').map((l) => JSON.parse(l)); }
  catch (e) { console.error(`build-eia-energy-backdrop: cannot read ${IN}: ${e.message}`); process.exit(1); }
  const out = JSON.stringify(buildBackdrop(lines), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(path.join(repoRoot, OUT)) ? fs.readFileSync(path.join(repoRoot, OUT), 'utf8') : '';
    if (cur !== out) { console.error(`DRIFT: ${OUT} is stale — run: node scripts/build-eia-energy-backdrop.mjs`); process.exit(1); }
    console.log(`eia-energy-backdrop: OK — ${JSON.parse(out).carriers.length} carriers in sync.`);
  } else {
    fs.writeFileSync(path.join(repoRoot, OUT), out);
    const b = JSON.parse(out);
    console.log(`Wrote ${OUT}: ${b.carriers.length} carriers (${b.carriers.map((c) => c.title + ' ' + c.percentile + 'pct').join(', ')}).`);
  }
}
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
