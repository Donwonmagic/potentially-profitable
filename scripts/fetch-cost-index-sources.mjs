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
const B = require('../tools/_shared/cost-basket.js');

const LIVE = process.argv.includes('--live');
const STALE_DAYS = 120;   // a level obs older than this can't anchor a current level (matches verify + the build gate)
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const sourceMap = rd('data/cost-index-sources.json').ingredients || {};
const bounds = rd('data/cost-index-bounds.json').bounds || {};
const basketWeights = (() => { try { return rd('data/cost-basket-weights.json').weights || {}; } catch { return {}; } })();

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
// Transport (timeout + transient retry + AMS window/section + fan-out) is shared
// with the verifier so the two can't drift.
const F = require('../tools/_shared/cost-index-fetch.js');

// ams may be a single mapping OR an array of terminal markets (multiple
// independent terminals → a real national p25–p75 level, not one city).
function amsSpecs(m) { return Array.isArray(m.ams) ? m.ams : (m.ams ? [m.ams] : []); }
function lmrSpecs(m) { return Array.isArray(m.lmr) ? m.lmr : (m.lmr ? [m.lmr] : []); }
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function liveFetch(ingredient, m) {
  const out = { ams: [] };
  if (m.fred && process.env.FRED_KEY) {
    out.fred = await F.fetchJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${m.fred.seriesId}&file_type=json&api_key=${process.env.FRED_KEY}`);
  }
  if (m.bls && process.env.BLS_KEY) {
    out.bls = await F.fetchJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seriesid: [m.bls.seriesId], registrationkey: process.env.BLS_KEY }),
    });
  }
  if (process.env.AMS_KEY) {
    const auth = 'Basic ' + Buffer.from(process.env.AMS_KEY + ':').toString('base64');
    // Fan out the terminals in parallel (bounded). mapLimit always settles each,
    // so one market missing the commodity or one slow report drops only itself —
    // the others still contribute (the cardinal rule), without 8 sequential waits.
    const settled = await F.mapLimit(amsSpecs(m), F.AMS_CONCURRENCY,
      (spec) => F.fetchAmsReport(spec.reportId, spec.section, auth, spec.windowDays).then((json) => ({ json, spec })));
    settled.forEach((r) => { if (r.ok) out.ams.push(r.value); });
  }
  if (m.lmr) {
    // LMR Datamart (boxed beef / negotiated pork) — keyless by default. Same
    // per-report resilience + parse path as AMS, just a different host.
    const lauth = process.env.LMR_KEY ? 'Basic ' + Buffer.from(process.env.LMR_KEY + ':').toString('base64') : undefined;
    out.lmr = [];
    const settled = await F.mapLimit(lmrSpecs(m), F.AMS_CONCURRENCY,
      (spec) => F.fetchLmrReport(spec.reportId, spec.section, lauth, spec.windowDays).then((json) => ({ json, spec })));
    settled.forEach((r) => { if (r.ok) out.lmr.push(r.value); });
  }
  if (m.noaa) {
    // NOAA Fisheries import unit value (keyless). One trade dump, cached + reused
    // across species; normalizeNoaaTrade filters by commodity.
    try { out.noaa = await F.fetchNoaaTrade({ years: m.noaa.years }); } catch (e) { /* skip; others contribute */ }
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
    const o = S.normalizeAms(a.json, { source: key, basis: 'wholesale', reducer: spec.reducer || 'mostlyMid', commodity: spec.commodity, matchFields: spec.matchFields, unit: spec.unit, priceUnit: spec.priceUnit, fields: spec.fields, dateField: spec.dateField });
    o.family = spec.family || key;                 // distinct per market → real p25–p75 dispersion
    o.type = spec.type || 'usda-ams';              // ONE methodology → all terminals are one corroborating line for confidence
    if (o.points.length) outs.push(o);
  });
  // LMR Datamart (beef/pork wholesale) — parses with the same AMS normalizer,
  // its own source type 'usda-lmr' so it's an independent line of evidence.
  const lmrArr = Array.isArray(raw.lmr)
    ? raw.lmr
    : (raw.lmr ? [{ json: raw.lmr, spec: lmrSpecs(m)[0] || {} }] : []);
  lmrArr.forEach((a) => {
    const spec = a.spec || {};
    const key = 'usda-lmr' + (spec.market ? '-' + slug(spec.market) : '');
    const o = S.normalizeAms(a.json, { source: key, basis: 'wholesale', reducer: spec.reducer || 'mostlyMid', commodity: spec.commodity, matchFields: spec.matchFields, unit: spec.unit, priceUnit: spec.priceUnit, fields: spec.fields, dateField: spec.dateField });
    o.family = spec.family || key;
    o.type = spec.type || 'usda-lmr';
    if (o.points.length) outs.push(o);
  });
  if (raw.noaa) { const o = S.normalizeNoaaTrade(raw.noaa, { source: 'noaa', basis: 'wholesale', commodity: m.noaa && m.noaa.commodity, hts: m.noaa && m.noaa.hts, unit: (m.noaa && m.noaa.unit) || 'lb' }); o.family = 'noaa'; o.type = 'noaa-trade'; if (o.points.length) outs.push(o); }
  if (raw.bls) { const o = S.normalizeBls(raw.bls, { source: 'bls', basis: 'index' }); o.family = (m.bls && m.bls.family) || 'bls'; o.type = (m.bls && m.bls.type) || 'bls'; if (o.points.length) outs.push(o); }
  if (raw.fred) { const o = S.normalizeFred(raw.fred, { source: 'fred', basis: (m.fred && m.fred.basis) || 'index', unit: m.fred && m.fred.unit }); o.family = (m.fred && m.fred.family) || 'fred'; o.type = (m.fred && m.fred.type) || 'fred'; if (o.points.length) outs.push(o); }
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
  const asOf = outputs.reduce((d, o) => { const p = o.points[o.points.length - 1]; return p && p.date && (!d || p.date > d) ? p.date : d; }, null);
  const screened = Q.screen(obs, { bounds: b ? { minCents: b.minCents, maxCents: b.maxCents } : undefined, expectedUnit: b && b.unit, asOf, maxAgeDays: STALE_DAYS });
  const okSources = new Set(screened.kept.map((k) => k.source));
  // A stale level must not anchor a current level (it still feeds the trend). Mark
  // each non-index source level-eligible only if its latest obs is fresh — same
  // 120d bar as verify + the build gate, so the three agree.
  const isFresh = (d) => !d || (Date.now() - Date.parse(d + 'T00:00:00Z')) / 86400000 <= STALE_DAYS;
  const kept = outputs.filter((o) => okSources.has(o.source)).map((o) => {
    const latest = o.points[o.points.length - 1];
    return { ...o, weight: screened.sourceWeight[o.source], levelEligible: o.basis !== 'index' && isFresh(latest && latest.date) };
  });
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

  // Headline: compose the per-ingredient trends into the Muntin Restaurant Basket
  // (a weighted basis-agnostic % move for the declared basket — never a level).
  const basket = B.basketTrend(artifact.points, basketWeights);
  artifact.basket = basket;
  if (!jsonMode) {
    log('\n══ Muntin Restaurant Basket ══');
    log('  ' + B.basketPhrase(basket));
  }

  // --out <file> / --json: emit the build-cost-index artifact (the clean
  // fetch→vendor handoff). Otherwise print the human summary.
  if (outFile) {
    // Don't clobber a good artifact with an empty one: if a LIVE run composed
    // nothing (every source transiently down), refuse to write so the prior
    // vendored index survives (the last-good rule). Demo always has fixtures.
    if (LIVE && composed === 0) {
      console.error(`Refusing to write ${outFile}: 0 points composed (all sources failed?). Last-good artifact left intact — investigate before vendoring.`);
      process.exit(1);
    }
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
