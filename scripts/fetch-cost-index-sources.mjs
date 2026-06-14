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
function fredSpecs(m) { return Array.isArray(m.fred) ? m.fred : (m.fred ? [m.fred] : []); }
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Surface the historical curve from the screened outputs — the same series the
// renderer draws: highest-priority non-index basis (delivered>wholesale>retail),
// longest wins ties; fall back to the longest index series (index-only items).
// Points emitted verbatim (oldest→newest, capped) — gaps stay gaps, never filled.
const BASIS_RANK = { delivered: 0, wholesale: 1, retail: 2, index: 99 };
function buildHistory(outputs, capN = 26) {
  const ranked = (outputs || []).slice().sort((a, b) => {
    const ra = BASIS_RANK[a.basis] == null ? 99 : BASIS_RANK[a.basis];
    const rb = BASIS_RANK[b.basis] == null ? 99 : BASIS_RANK[b.basis];
    return ra !== rb ? ra - rb : b.points.length - a.points.length;
  });
  const primary = ranked[0];
  if (!primary || !primary.points || !primary.points.length) return [];
  return primary.points.slice(-capN).map((p) => ({ date: p.date, valueCents: Math.round(p.value * 100), source: primary.source, basis: primary.basis }));
}

// Collapse a dated {date, valueCents} series to one point per ISO week (mean),
// keeping the week's latest date — for the DEEP backfill store (a 12-year daily
// LMR/AMS pull → ~weekly, so the file stays sane and seasonality buckets cleanly).
// Same valueCents scale as buildHistory, so the deep history matches the live level.
function weeklyDedup(hist) {
  const byWk = new Map();
  for (const h of hist || []) {
    if (!h || !h.date || typeof h.valueCents !== 'number' || !isFinite(Date.parse(h.date))) continue;
    const wk = Math.floor(Date.parse(h.date + 'T00:00:00Z') / (7 * 864e5));
    const cur = byWk.get(wk);
    if (!cur) byWk.set(wk, { date: h.date, sum: h.valueCents, n: 1 });
    else { cur.sum += h.valueCents; cur.n++; if (h.date > cur.date) cur.date = h.date; }
  }
  return [...byWk.values()].map((b) => ({ date: b.date, valueCents: Math.round(b.sum / b.n) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

async function liveFetch(ingredient, m) {
  const out = { ams: [] };
  // Deep-backfill window: when COST_INDEX_SERIES_DAYS is set (the --history-out
  // path), it FLOORS each source's per-report fetch window so the API actually
  // returns years, not the ~45–150d the spec uses for a normal vendor run.
  const DEEP_DAYS = Number(process.env.COST_INDEX_SERIES_DAYS) || 0;
  const win = (wd) => (DEEP_DAYS > (wd || 0) ? DEEP_DAYS : wd);
  if (m.fred && process.env.FRED_KEY) {
    // Fan out FRED series (e.g. a BLS-rehost trend + an independent IMF series)
    // in parallel; each settles on its own so one bad series_id drops only itself.
    const settled = await F.mapLimit(fredSpecs(m), F.AMS_CONCURRENCY,
      (spec) => F.fetchJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${spec.seriesId}&file_type=json&api_key=${process.env.FRED_KEY}`).then((json) => ({ json, spec })));
    out.fred = [];
    settled.forEach((r) => { if (r.ok) out.fred.push(r.value); });
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
      (spec) => F.fetchAmsReport(spec.reportId, spec.section, auth, win(spec.windowDays)).then((json) => ({ json, spec })));
    settled.forEach((r) => { if (r.ok) out.ams.push(r.value); });
  }
  if (m.lmr) {
    // LMR Datamart (boxed beef / negotiated pork) — keyless by default. Same
    // per-report resilience + parse path as AMS, just a different host.
    const lauth = process.env.LMR_KEY ? 'Basic ' + Buffer.from(process.env.LMR_KEY + ':').toString('base64') : undefined;
    out.lmr = [];
    const settled = await F.mapLimit(lmrSpecs(m), F.AMS_CONCURRENCY,
      (spec) => F.fetchLmrReport(spec.reportId, spec.section, lauth, win(spec.windowDays), spec.dateField).then((json) => ({ json, spec })));
    settled.forEach((r) => { if (r.ok) out.lmr.push(r.value); });
  }
  if (m.noaa && typeof S.normalizeNoaaTrade === 'function') {
    // NOAA Fisheries import unit value (keyless). One trade dump, cached + reused
    // across species; normalizeNoaaTrade filters by commodity.
    try { out.noaa = await F.fetchNoaaTrade({ years: DEEP_DAYS ? Math.max(m.noaa.years || 2, Math.ceil(DEEP_DAYS / 365)) : m.noaa.years }); } catch (e) { /* skip; others contribute */ }
  }
  if (m.eia && process.env.EIA_KEY) {
    // EIA v2 (electricity etc.) — needs EIA_KEY; an energy-direction index signal.
    try { out.eia = await F.fetchEia(m.eia); } catch (e) { /* skip; transient/missing */ }
  }
  return out;
}

// Trend horizon: every source's series is trimmed to this many days (relative to
// the source's OWN latest dated point) before composing. USDA AMS/LMR already
// arrive windowed by the fetcher, but FRED/BLS/EIA come with their full multi-year
// history — and an unwindowed index series leaks a multi-year change into the
// blended trend while the level + sparkline stay recent (the romaine "+159%"
// bug). Trimming here makes every source express the SAME recent change. Matches
// the AMS fetch window so level, trend and history share one horizon.
const SERIES_WINDOW_DAYS = Number(process.env.COST_INDEX_SERIES_DAYS || F.AMS_WINDOW_DAYS || 120);
function windowOutputPoints(o, days) {
  if (!o || !Array.isArray(o.points) || o.points.length < 2 || !days || days <= 0) return o;
  const dated = o.points.filter((p) => p && p.date && isFinite(Date.parse(p.date)));
  if (dated.length < 2) return o;
  const lastT = dated.reduce((mx, p) => Math.max(mx, Date.parse(p.date)), -Infinity);
  const cut = lastT - days * 86400000;
  const win = o.points.filter((p) => p && p.date && isFinite(Date.parse(p.date)) && Date.parse(p.date) >= cut);
  return win.length >= 2 ? { ...o, points: win } : o;   // never trim below a 2-point series
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
    const o = S.normalizeAms(a.json, { source: key, basis: 'wholesale', reducer: spec.reducer || 'mostlyMid', commodity: spec.commodity, matchFields: spec.matchFields, commodityExact: spec.commodityExact, filters: spec.filters, priceUnitField: spec.priceUnitField, unit: spec.unit, priceUnit: spec.priceUnit, fields: spec.fields, dateField: spec.dateField });
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
    const o = S.normalizeAms(a.json, { source: key, basis: 'wholesale', reducer: spec.reducer || 'mostlyMid', commodity: spec.commodity, matchFields: spec.matchFields, commodityExact: spec.commodityExact, filters: spec.filters, priceUnitField: spec.priceUnitField, unit: spec.unit, priceUnit: spec.priceUnit, fields: spec.fields, dateField: spec.dateField });
    o.family = spec.family || key;
    o.type = spec.type || 'usda-lmr';
    if (o.points.length) outs.push(o);
  });
  if (raw.noaa && typeof S.normalizeNoaaTrade === 'function') { const o = S.normalizeNoaaTrade(raw.noaa, { source: 'noaa', basis: (m.noaa && m.noaa.basis) || 'wholesale', commodity: m.noaa && m.noaa.commodity, hts: m.noaa && m.noaa.hts, nameMatch: m.noaa && m.noaa.nameMatch, edibleOnly: m.noaa && m.noaa.edibleOnly, unit: (m.noaa && m.noaa.unit) || 'lb' }); o.family = 'noaa'; o.type = 'noaa-trade'; if (o.points.length) outs.push(o); }
  if (raw.bls) { const o = S.normalizeBls(raw.bls, { source: 'bls', basis: 'index' }); o.family = (m.bls && m.bls.family) || 'bls'; o.type = (m.bls && m.bls.type) || 'bls'; if (o.points.length) outs.push(o); }
  // FRED fan-out: an array of {json, spec} (multi-series) or a single json (demo).
  // Distinct `source` per series so sourceSeries keys don't collide; default stays
  // 'fred' for the single-series case so existing data is unchanged.
  const fredArr = Array.isArray(raw.fred)
    ? raw.fred
    : (raw.fred ? [{ json: raw.fred, spec: fredSpecs(m)[0] || {} }] : []);
  fredArr.forEach((a, idx) => {
    const spec = a.spec || {};
    const o = S.normalizeFred(a.json, { source: spec.source, basis: spec.basis || 'index', unit: spec.unit });
    o.source = spec.source || (fredArr.length > 1 ? 'fred-' + slug(spec.seriesId || String(idx)) : 'fred');
    o.family = spec.family || 'fred';
    o.type = spec.type || 'fred';
    if (o.points.length) outs.push(o);
  });
  if (raw.eia && typeof S.normalizeEia === 'function') { const o = S.normalizeEia(raw.eia, { source: 'eia', basis: 'index', value: (m.eia && m.eia.value) || 'price' }); o.family = (m.eia && m.eia.family) || m.family || 'eia'; o.type = 'eia'; if (o.points.length) outs.push(o); }
  // One shared recent horizon for every source → the trend describes the same
  // window the level and sparkline do (kills the unwindowed-index-source skew).
  return outs.map((o) => windowOutputPoints(o, SERIES_WINDOW_DAYS));
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
  return { result: C.assess(input), rejected: screened.rejected, kept };
}

// A driver (corn/soybeans/diesel/electricity): index/trend only — no level, no
// bounds, no quality screen. Just blend the trend and surface its index history.
function composeDriver(outputs) {
  if (!outputs.length) return null;
  return { trend: C.assess(S.buildCompositeInput(outputs)).trend, history: buildHistory(outputs) };
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
  // --history-out <file>: the DEEP backfill store. Run with a large window
  // (COST_INDEX_SERIES_DAYS=4500 ≈ 12y) to fetch the full per-ingredient series;
  // this writes data/cost-index-history.json (weekly, vendor-scale) which
  // build-seasonality.mjs reads to activate the "vs. typical {month}" band early.
  const historyOutFile = arg('--history-out');
  const jsonMode = process.argv.includes('--json') || !!outFile || !!historyOutFile;
  const log = jsonMode ? () => {} : (...a) => console.log(...a);   // stay quiet in JSON mode

  log(`Cost Index orchestrator — ${LIVE ? 'LIVE' : 'DEMO (canned payloads)'} mode`);
  const ingredients = LIVE ? Object.keys(sourceMap) : Object.keys(FIXTURES);
  const artifact = { generatedAt: new Date().toISOString(), points: {} };
  const deepHistory = {};   // --history-out: per-ingredient FULL weekly series (vendor-scale)
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
    // history = the citeable curve behind it (gaps verbatim), if any.
    const history = buildHistory(point.kept);
    artifact.points[ing] = { asOf: point.result.asOf, ...point.result, ...(history.length ? { history } : {}) };
    // Deep backfill store: the FULL (uncapped) primary series, weekly-deduped, on the
    // exact vendor scale — so build-seasonality's normals are comparable to the live level.
    if (historyOutFile) {
      const deep = weeklyDedup(buildHistory(point.kept, Number.MAX_SAFE_INTEGER));
      if (deep.length) deepHistory[ing] = deep;
    }
    composed++;
  }

  // Drivers (corn/soybeans/diesel/electricity) — the "why" layer: index/trend +
  // citeable index history + the ingredients each tends to lead. LIVE only. Each
  // driver runs through the same liveFetch→toOutputs path as an ingredient, so
  // BLS (corn/soybeans), FRED (diesel) and EIA (electricity) are all wired; a
  // driver with no key set, or whose live response composes 0 points, skips
  // gracefully without sinking the run.
  const driverMap = rd('data/cost-index-sources.json').drivers || {};
  const drivers = {};
  let driversComposed = 0;
  if (LIVE) {
    for (const d of Object.keys(driverMap)) {
      if (d === '_doc' || (driverMap[d] && driverMap[d].verified === false)) continue;
      let raw;
      try { raw = await liveFetch(d, driverMap[d]); } catch (e) { log(`\n■ driver ${d}  ·  fetch error: ${e.message}`); continue; }
      const outs = toOutputs(d, raw, driverMap[d]);
      const dp = composeDriver(outs);
      if (!dp) { log(`\n■ driver ${d}  ·  no source data (no key set, or 0 points — for EIA confirm the route/facets via a sample)`); continue; }
      drivers[d] = { kind: driverMap[d].kind, leads: Array.isArray(driverMap[d].leads) ? driverMap[d].leads : [], trend: dp.trend, history: dp.history };
      driversComposed++;
    }
  }
  if (driversComposed) artifact.drivers = drivers;

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
    const withHist = Object.values(artifact.points).filter((p) => Array.isArray(p.history) && p.history.length).length;
    log(`\n— ${composed} ingredient(s) composed (${withHist} with history), ${driversComposed} driver(s)${LIVE ? `, ${skipped} skipped (verified:false — confirm source ids first, pin #8)` : ''}.`);
    if (!LIVE) log('  Run with --live + FRED_KEY/BLS_KEY/AMS_KEY once source ids are verified to fetch real data.');
  }

  // --history-out: write the deep backfill store for the seasonal engine.
  if (historyOutFile) {
    if (LIVE && composed === 0) {
      console.error(`Refusing to write ${historyOutFile}: 0 points composed (all sources failed?). Last-good store left intact.`);
      process.exit(1);
    }
    const fs = await import('node:fs');
    const keys = Object.keys(deepHistory);
    const totalPts = keys.reduce((n, k) => n + deepHistory[k].length, 0);
    const store = {
      _doc: 'Deep backfill history for the Cost Index seasonal engine (scripts/build-seasonality.mjs). Per ingredient, the FULL weekly wholesale series on the SAME valueCents scale as data/cost-index.json (so seasonal normals are comparable to the live level). Written by fetch-cost-index-sources.mjs --history-out with a deep window (set COST_INDEX_SERIES_DAYS, e.g. 4500 ≈ 12y). Re-run to extend; build-seasonality uses the deep series wherever it is longer than the capped live history.',
      generatedAt: artifact.generatedAt,
      ingredients: deepHistory,
    };
    fs.writeFileSync(historyOutFile, JSON.stringify(store, null, 2) + '\n');
    console.log(`Wrote deep history → ${historyOutFile}: ${keys.length} ingredient(s), ${totalPts} weekly point(s). Next: node scripts/build-seasonality.mjs && node scripts/check-all.mjs`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
