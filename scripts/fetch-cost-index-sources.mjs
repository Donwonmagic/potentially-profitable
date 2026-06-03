#!/usr/bin/env node
/**
 * fetch-cost-index-sources.mjs — the Cost Index orchestrator, runnable as a
 * script. Walks the real engine end to end:
 *   raw source payloads → normalize → quality-screen → composite.assess
 *   → one honest Cost Index point per ingredient (level range + blended trend
 *     + confidence + provenance + As-of).
 *
 * Two modes:
 *   (default)  --demo   canned, realistic source payloads. Runs anywhere, no
 *                       network, no keys — proves the engine produces real
 *                       composite points. THIS is "the engine working."
 *   --live              fetches USDA AMS / BLS / FRED for verified:true
 *                       ingredients using FRED_KEY / BLS_KEY / AMS_KEY from the
 *                       env. Skips verified:false (nothing renders behind the
 *                       fact gate until a source id is confirmed — pin #8).
 *
 * Reads data/cost-index-sources.json (mapping) + data/cost-index-bounds.json
 * (quality bands). Uses the SHIPPING engine in tools/_shared/. Pure orchestration;
 * the only network is the explicit --live fetch. Does not write data/ — printing
 * the composite is the demo; the vendored data/cost-index.json is a separate,
 * fact-gated build step once sources are verified.
 *
 *   node scripts/fetch-cost-index-sources.mjs                 # demo
 *   FRED_KEY=… BLS_KEY=… AMS_KEY=… node scripts/fetch-cost-index-sources.mjs --live
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = require('../tools/_shared/composite-price.js');
const S = require('../tools/_shared/cost-index-sources.js');
const Q = require('../tools/_shared/observation-quality.js');

const LIVE = process.argv.includes('--live');
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const sourceMap = rd('data/cost-index-sources.json').ingredients || {};
const bounds = rd('data/cost-index-bounds.json').bounds || {};

// ---- realistic canned payloads (the upstream dialects) for --demo ----------
// Shapes match the live APIs exactly, so the demo exercises the same
// normalizers the live path uses. Two ingredients across all three sources.
const FIXTURES = {
  ribeye: {
    ams: { results: [
      { report_date: '03/03/2026', mostly_low: '12.80', mostly_high: '13.40' },
      { report_date: '05/04/2026', mostly_low: '13.60', mostly_high: '14.20' },
    ] },
    bls: { Results: { series: [{ data: [
      { year: '2026', period: 'M03', value: '231.4' },
      { year: '2026', period: 'M05', value: '244.0' },
    ] }] } },
    fred: { observations: [
      { date: '2026-03-01', value: '14.10' },
      { date: '2026-05-01', value: '14.85' },
    ] },
  },
  'chicken-breast': {
    ams: { results: [
      { report_date: '03/03/2026', mostly_low: '2.10', mostly_high: '2.30' },
      { report_date: '05/04/2026', mostly_low: '2.15', mostly_high: '2.35' },
    ] },
    bls: { Results: { series: [{ data: [
      { year: '2026', period: 'M03', value: '118.2' },
      { year: '2026', period: 'M05', value: '119.0' },
    ] }] } },
    fred: { observations: [
      { date: '2026-03-01', value: '3.20' },
      { date: '2026-05-01', value: '3.24' },
    ] },
  },
};

// ---- live fetchers (only used with --live) --------------------------------
async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}
async function liveFetch(ingredient, m) {
  const out = {};
  if (m.fred && process.env.FRED_KEY) {
    out.fred = await fetchJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${m.fred.seriesId}&file_type=json&api_key=${process.env.FRED_KEY}`);
  }
  if (m.bls && process.env.BLS_KEY) {
    out.bls = await fetchJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: [m.bls.seriesId], registrationkey: process.env.BLS_KEY }),
    });
  }
  if (m.ams && process.env.AMS_KEY) {
    out.ams = await fetchJson(`https://marsapi.ams.usda.gov/services/v1.2/reports/${m.ams.reportId}`, {
      headers: { Authorization: 'Basic ' + Buffer.from(process.env.AMS_KEY + ':').toString('base64') },
    });
  }
  return out;
}

// normalize raw payloads → adapter outputs, honoring the per-source basis/reducer.
function toOutputs(ingredient, raw, m) {
  const outs = [];
  // `family` declares source lineage so mirror feeds de-correlate in the engine
  // (e.g. set fred.family:'bls' when a FRED series republishes the BLS one).
  // Defaults to each source's own family → no de-correlation until declared.
  if (raw.ams) { const o = S.normalizeAms(raw.ams, { source: 'usda-ams', basis: 'wholesale', reducer: (m.ams && m.ams.reducer) || 'mostlyMid' }); o.family = (m.ams && m.ams.family) || 'usda-ams'; outs.push(o); }
  if (raw.bls) { const o = S.normalizeBls(raw.bls, { source: 'bls', basis: 'index' }); o.family = (m.bls && m.bls.family) || 'bls'; outs.push(o); }
  if (raw.fred) { const o = S.normalizeFred(raw.fred, { source: 'fred', basis: (m.fred && m.fred.basis) || 'index' }); o.family = (m.fred && m.fred.family) || 'fred'; outs.push(o); }
  return outs.filter((o) => o.points.length);
}

// quality-screen the latest level-bearing obs per source, then assess.
function composeIngredient(ingredient, outputs) {
  const b = bounds[ingredient];
  const obs = outputs.map((o) => {
    const latest = o.points[o.points.length - 1];
    return o.basis === 'index'
      ? { source: o.source, basis: 'index', value: latest.value, date: latest.date }
      : { source: o.source, basis: o.basis, valueCents: Math.round(latest.value * 100), unit: (b && b.unit) || 'lb', date: latest.date };
  });
  const screened = Q.screen(obs, { bounds: b ? { minCents: b.minCents, maxCents: b.maxCents } : undefined });
  const okSources = new Set(screened.kept.map((k) => k.source));
  const kept = outputs.filter((o) => okSources.has(o.source)).map((o) => ({ ...o, weight: screened.sourceWeight[o.source] }));
  if (!kept.length) return null;
  const input = S.buildCompositeInput(kept);
  return { result: C.assess(input), rejected: screened.rejected };
}

function fmt(point, ingredient) {
  const r = point.result;
  console.log(`\n■ ${ingredient}  ·  confidence: ${r.confidence}  ·  as of ${r.asOf || 'n/a'}`);
  console.log('  ' + r.label);
  if (r.level) console.log(`  level: $${(r.level.rangeCents[0] / 100).toFixed(2)}–$${(r.level.rangeCents[1] / 100).toFixed(2)} (${r.level.basis}, ${r.level.nSources} src)`);
  if (r.trend.pct != null) console.log(`  trend: ${(r.trend.pct * 100).toFixed(1)}% ${r.trend.dir}, ${r.trend.nSources} src, agreement ${r.trend.agreement}`);
  if (point.rejected.length) console.log(`  quality gate rejected: ${point.rejected.map((x) => x.flags.join('/')).join(', ')}`);
}

async function main() {
  console.log(`Cost Index orchestrator — ${LIVE ? 'LIVE' : 'DEMO (canned payloads)'} mode`);
  const ingredients = LIVE ? Object.keys(sourceMap) : Object.keys(FIXTURES);
  let composed = 0, skipped = 0;
  for (const ing of ingredients) {
    const m = sourceMap[ing] || {};
    if (LIVE && !m.verified) { skipped++; continue; }   // cardinal rule: unverified contributes nothing
    let raw;
    try {
      raw = LIVE ? await liveFetch(ing, m) : (FIXTURES[ing] || {});
    } catch (e) {
      console.log(`\n■ ${ing}  ·  fetch error: ${e.message} (contributes nothing)`);
      continue;
    }
    const outputs = toOutputs(ing, raw, m);
    if (!outputs.length) { console.log(`\n■ ${ing}  ·  no source data`); continue; }
    const point = composeIngredient(ing, outputs);
    if (!point) { console.log(`\n■ ${ing}  ·  all sources failed the quality gate`); continue; }
    fmt(point, ing);
    composed++;
  }
  console.log(`\n— ${composed} ingredient(s) composed${LIVE ? `, ${skipped} skipped (verified:false — confirm source ids first, pin #8)` : ''}.`);
  if (!LIVE) console.log('  Run with --live + FRED_KEY/BLS_KEY/AMS_KEY once source ids are verified to fetch real data.');
}

main().catch((e) => { console.error(e); process.exit(1); });
