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
      { report_date: '03/03/2026', commodity: 'Ribeye, 1x1', mostly_low: '12.80', mostly_high: '13.40' },
      { report_date: '05/04/2026', commodity: 'Ribeye, 1x1', mostly_low: '13.60', mostly_high: '14.20' },
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
    // Real National Chicken Report shape: item field, cents-per-lb, wtd_avg_price.
    ams: { results: [
      { report_date: '03/03/2026', item: 'Breast - B/S', price_unit: 'Cents Per Lb', low_price: '130.00', high_price: '160.00', wtd_avg_price: 142.0 },
      { report_date: '05/04/2026', item: 'Breast - B/S', price_unit: 'Cents Per Lb', low_price: '135.00', high_price: '168.00', wtd_avg_price: 145.72 },
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
const AMS_WINDOW_DAYS = Number(process.env.AMS_WINDOW_DAYS || 120);
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS || 25000);

async function fetchJson(url, init = {}) {
  // Hard ceiling: a huge/slow terminal report errors out instead of hanging the run.
  const res = await fetch(url, { ...init, signal: init.signal || AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}
function amsWindowStr(days) {
  const f = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  const end = new Date(); const start = new Date(end.getTime() - days * 864e5);
  return `${f(start)}:${f(end)}`;
}
// Detail section (where prices live), scoped to a recent window so the (often
// enormous) terminal reports return a small current slice; falls back to full
// history if the date filter is rejected. Detail-section names differ across
// reports ("Report Details" vs "Report Detail") and MARS silently returns the
// HEADER on a name miss, so auto-correct to the section the report advertises.
async function fetchAmsReport(reportId, sectionRaw, auth) {
  const h = { Authorization: auth };
  const win = AMS_WINDOW_DAYS > 0 ? `?q=${encodeURIComponent('report_begin_date=' + amsWindowStr(AMS_WINDOW_DAYS))}` : '';
  const base = `https://marsapi.ams.usda.gov/services/v1.2/reports/${reportId}`;
  const want = sectionRaw === '' ? '' : (sectionRaw || 'Report Details');
  const get = async (section) => {
    const path = section === '' ? '' : '/' + encodeURIComponent(section);
    try { return await fetchJson(`${base}${path}${win}`, { headers: h }); }
    catch (e) { if (win) return fetchJson(`${base}${path}`, { headers: h }); throw e; }
  };
  let j = await get(want);
  if (want && j && j.reportSection === 'Report Header' && want !== 'Report Header' && Array.isArray(j.reportSections)) {
    const detail = j.reportSections.find((s) => s !== 'Report Header' && /detail/i.test(s))
                || j.reportSections.find((s) => s !== 'Report Header');
    if (detail && detail !== want) j = await get(detail);
  }
  return j;
}
// ams may be a single mapping OR an array of terminal markets (multiple
// independent terminals → a real national p25–p75 level, not one city).
function amsSpecs(m) { return Array.isArray(m.ams) ? m.ams : (m.ams ? [m.ams] : []); }
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function liveFetch(ingredient, m) {
  const out = { ams: [] };
  if (m.fred && process.env.FRED_KEY) {
    out.fred = await fetchJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${m.fred.seriesId}&file_type=json&api_key=${process.env.FRED_KEY}`);
  }
  if (m.bls && process.env.BLS_KEY) {
    out.bls = await fetchJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: [m.bls.seriesId], registrationkey: process.env.BLS_KEY }),
    });
  }
  if (process.env.AMS_KEY) {
    const auth = 'Basic ' + Buffer.from(process.env.AMS_KEY + ':').toString('base64');
    for (const spec of amsSpecs(m)) {
      // Per-terminal resilience: one market missing the commodity this week
      // (or one slow report) must not drop the whole ingredient (cardinal rule).
      try {
        // Prices live in a report SECTION (e.g. "Report Details"); the bare
        // /reports/{id} returns the Report Header (metadata, no prices).
        const json = await fetchAmsReport(spec.reportId, spec.section, auth);
        out.ams.push({ json, spec });
      } catch (e) { /* skip this terminal; others still contribute */ }
    }
  }
  return out;
}

// normalize raw payloads → adapter outputs, honoring the per-source basis/reducer.
function toOutputs(ingredient, raw, m) {
  const outs = [];
  // Each AMS terminal becomes its own source/family (independent markets), so
  // compositeLevel sees real cross-market dispersion → an honest national range.
  // `family` declares lineage so mirror feeds (e.g. fred.family:'bls') de-correlate.
  const amsArr = Array.isArray(raw.ams)
    ? raw.ams
    : (raw.ams ? [{ json: raw.ams, spec: amsSpecs(m)[0] || {} }] : []);   // demo: single json + the mapping's spec
  amsArr.forEach((a) => {
    const spec = a.spec || {};
    const key = 'usda-ams' + (spec.market ? '-' + slug(spec.market) : '');
    const o = S.normalizeAms(a.json, { source: key, basis: 'wholesale', reducer: spec.reducer || 'mostlyMid', commodity: spec.commodity, matchFields: spec.matchFields, unit: spec.unit });
    o.family = spec.family || key;
    if (o.points.length) outs.push(o);
  });
  if (raw.bls) { const o = S.normalizeBls(raw.bls, { source: 'bls', basis: 'index' }); o.family = (m.bls && m.bls.family) || 'bls'; if (o.points.length) outs.push(o); }
  if (raw.fred) { const o = S.normalizeFred(raw.fred, { source: 'fred', basis: (m.fred && m.fred.basis) || 'index' }); o.family = (m.fred && m.fred.family) || 'fred'; if (o.points.length) outs.push(o); }
  return outs;
}

// quality-screen the latest level-bearing obs per source, then assess.
function composeIngredient(ingredient, outputs) {
  const b = bounds[ingredient];
  const obs = outputs.map((o) => {
    const latest = o.points[o.points.length - 1];
    return o.basis === 'index'
      ? { source: o.source, basis: 'index', value: latest.value, date: latest.date }
      // Carry the source's OWN reported unit (not the bounds unit) so a flipped
      // price_unit is a hard reject, not a number wearing the expected costume.
      : { source: o.source, basis: o.basis, valueCents: Math.round(latest.value * 100), unit: o.unit, date: latest.date };
  });
  const screened = Q.screen(obs, { bounds: b ? { minCents: b.minCents, maxCents: b.maxCents } : undefined, expectedUnit: b && b.unit });
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
  const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
  const outFile = arg('--out');
  const jsonMode = process.argv.includes('--json') || !!outFile;
  const log = jsonMode ? () => {} : (...a) => console.log(...a);   // stay quiet in JSON mode

  log(`Cost Index orchestrator — ${LIVE ? 'LIVE' : 'DEMO (canned payloads)'} mode`);
  const ingredients = LIVE ? Object.keys(sourceMap) : Object.keys(FIXTURES);
  const artifact = { generatedAt: new Date().toISOString(), points: {} };
  let composed = 0, skipped = 0;
  for (const ing of ingredients) {
    const m = sourceMap[ing] || {};
    if (LIVE && !m.verified) { skipped++; continue; }   // cardinal rule: unverified contributes nothing
    let raw;
    try {
      raw = LIVE ? await liveFetch(ing, m) : (FIXTURES[ing] || {});
    } catch (e) {
      log(`\n■ ${ing}  ·  fetch error: ${e.message} (contributes nothing)`);
      continue;
    }
    const outputs = toOutputs(ing, raw, m);
    if (!outputs.length) { log(`\n■ ${ing}  ·  no source data`); continue; }
    const point = composeIngredient(ing, outputs);
    if (!point) { log(`\n■ ${ing}  ·  all sources failed the quality gate`); continue; }
    if (!jsonMode) fmt(point, ing);
    // The artifact point is exactly a MuntinComposite.assess result — the shape
    // build-cost-index.mjs vendors (it adds asOf already; ensure it's present).
    artifact.points[ing] = { asOf: point.result.asOf, ...point.result };
    composed++;
  }

  // --out <file> / --json: emit the build-cost-index artifact (the clean
  // fetch→vendor handoff). Otherwise print the human summary.
  if (outFile) {
    const fs = await import('node:fs');
    fs.writeFileSync(outFile, JSON.stringify(artifact, null, 2) + '\n');
    console.log(`Wrote ${composed} point(s) → ${outFile}. Next: node scripts/build-cost-index.mjs --artifact ${outFile}`);
  } else if (jsonMode) {
    process.stdout.write(JSON.stringify(artifact, null, 2) + '\n');
  } else {
    log(`\n— ${composed} ingredient(s) composed${LIVE ? `, ${skipped} skipped (verified:false — confirm source ids first, pin #8)` : ''}.`);
    if (!LIVE) log('  Run with --live + FRED_KEY/BLS_KEY/AMS_KEY once source ids are verified to fetch real data.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
