#!/usr/bin/env node
/**
 * fetch-pressure-observations.mjs — assemble the Pressure layer's INPUTS.
 *
 * For each indicator in data/pressure-rules.json, look up its fetch spec
 * (data/pressure-source-specs.json), pull the recent window from the free
 * public source, normalize it (tools/_shared/pressure-sources.js) into a
 * window % change, and write data/pressure-observations.json (status:'live').
 * build-cost-pressure.mjs then scores it into directions.
 *
 * Modes:
 *   --self-test   run the spec→normalizer dispatch over bundled FIXTURES (no
 *                 network) — proves the wiring before any key exists.
 *   --probe       try EVERY spec live (ignoring `verified`) and report what each
 *                 endpoint returns — row count, normalized change, and (for NASS)
 *                 the matched short_desc/unit_desc — so the 12-spec verification
 *                 is one command, not 12 param-browser lookups. Writes nothing.
 *   --demo        re-emit data/pressure-observations.demo.json (pipeline smoke).
 *   --live        fetch real sources. EIA needs EIA_KEY; NASS needs NASS_KEY;
 *                 USDM + NWS are keyless. Skips any spec with verified:false or a
 *                 missing key, and reports the gap (go-live checklist).
 *
 * Free keys: https://www.eia.gov/opendata/  ·  https://quickstats.nass.usda.gov/api
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const S = require(path.join(repoRoot, 'tools/_shared/pressure-sources.js'));
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const arg = (f) => process.argv.includes(f);

const rules = rd('data/pressure-rules.json');
const specs = (rd('data/pressure-source-specs.json').specs) || {};

// The one place raw → changePct per source type. Same dispatch live + self-test.
function changeFromRaw(spec, raw) {
  switch (spec.type) {
    case 'eia':  return S.windowChange(S.eiaSeries(raw, { tail: spec.tail }));
    case 'nass': return S.windowChange(S.nassSeries((raw && raw.data) || raw, { tail: spec.tail }));
    case 'ams':  return S.windowChange(S.amsSeries((raw && raw.results) || raw, { field: spec.field, tail: spec.tail }));
    case 'usdm': return S.windowChange(S.usdmSeverity((raw && raw.length != null) ? raw : (raw && raw.data) || [], { categories: spec.categories, tail: spec.tail }));
    case 'nws':  return S.eventSignal(S.nwsFreezeActive(raw, { events: spec.events, areaMatch: spec.areaMatch }));
    default: return null;
  }
}

// ---- self-test: prove the dispatch on canned fixtures (no network) --------
function selfTest() {
  // Fixtures mimic the MESSY real responses, not clean toy ones, so a green
  // self-test actually predicts a green --live: EIA newest-first nested under
  // response.data; NASS reverse-chronological with begin_code ordering + a comma
  // value + a withheld (D) cell; AMS with a $ string; USDM two states per date
  // (multi-area mean); NWS geojson feature.
  const fx = {
    eia:  { spec: { type: 'eia', tail: 5 }, raw: { response: { data: [{ period: '2026-06-08', value: '3.99' }, { period: '2026-05-25', value: '3.80' }] } }, want: (v) => v > 0 },
    nass: { spec: { type: 'nass', tail: 5 }, raw: { data: [
              { Value: '(D)', year: '2026', begin_code: '22', reference_period_desc: 'WEEK #22' },
              { Value: '2,000', year: '2026', begin_code: '20', reference_period_desc: 'WEEK #20' },
              { Value: '1,800', year: '2026', begin_code: '9',  reference_period_desc: 'WEEK #9' }
            ] }, want: (v) => v > 0 },
    ams:  { spec: { type: 'ams', field: 'price', tail: 5 }, raw: { results: [{ report_date: '2026-06-05', price: '$74.50' }, { report_date: '2026-05-29', price: '$70.10' }] }, want: (v) => v > 0 },
    usdm: { spec: { type: 'usdm', categories: ['D2', 'D3', 'D4'] }, raw: [
              { ValidStart: '2026-06-01', D2: '10', D3: '5', D4: '0' }, { ValidStart: '2026-06-01', D2: '20', D3: '5', D4: '0' },
              { ValidStart: '2026-06-08', D2: '14', D3: '8', D4: '2' }, { ValidStart: '2026-06-08', D2: '30', D3: '6', D4: '0' }
            ], want: (v) => v > 0 },
    nws:  { spec: { type: 'nws', events: ['Freeze Warning'], areaMatch: 'AZ' }, raw: { features: [{ properties: { event: 'Freeze Warning', areaDesc: 'Yuma County, AZ' } }] }, want: (v) => v === 1 }
  };
  let fail = 0;
  for (const [t, c] of Object.entries(fx)) {
    const v = changeFromRaw(c.spec, c.raw);
    const ok = v != null && c.want(v);
    console.log(`  ${t.padEnd(5)} → ${v}  ${ok ? 'OK' : 'FAIL'}`);
    if (!ok) fail++;
  }
  console.log(fail ? `self-test: ${fail} FAIL` : 'self-test: OK — every source type normalizes to a change.');
  process.exit(fail ? 1 : 0);
}

// ---- live fetch (founder runs with free keys) -----------------------------
async function fetchOnce(url, init) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 25000);
  try {
    // Merge headers so a per-spec Accept (USDM needs application/json or it
    // returns CSV) doesn't clobber the User-Agent the public endpoints expect.
    const headers = Object.assign({ 'User-Agent': 'muntin.digital cost-index (contact dongoldstein.accts@gmail.com)' }, (init && init.headers) || {});
    const r = await fetch(url, Object.assign({ signal: ctrl.signal }, init || {}, { headers }));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(to); }
}
// Retry transient blips (the free NASS/AMS endpoints are flaky): up to 3 tries
// with a short backoff. A persistent failure still surfaces as a gap — we never
// invent a value, we just don't let one timeout drop an indicator for the week.
async function fetchJson(url, init) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return await fetchOnce(url, init); }
    catch (e) { lastErr = e; if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 1500)); }
  }
  throw lastErr;
}
function urlFor(id, spec) {
  const EIA_KEY = process.env.EIA_KEY, NASS_KEY = process.env.NASS_KEY;
  if (spec.type === 'eia') {
    if (!EIA_KEY) return { skip: 'no EIA_KEY' };
    return { url: `https://api.eia.gov/v2/seriesid/${encodeURIComponent(spec.series)}?api_key=${EIA_KEY}` };
  }
  if (spec.type === 'nass') {
    if (!NASS_KEY) return { skip: 'no NASS_KEY' };
    const q = Object.entries(spec.query || {}).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return { url: `https://quickstats.nass.usda.gov/api/api_GET/?key=${NASS_KEY}&${q}&format=JSON` };
  }
  if (spec.type === 'usdm') {
    const aoi = (spec.areas || ['US']).join(',');
    // Rolling ~5-month window to today (NOT a hardcoded calendar year — that
    // silently empties every January). USDM wants M/D/YYYY.
    const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    const end = new Date();
    const start = new Date(end.getTime() - 150 * 86400000);
    // USDM defaults to CSV — ask for JSON explicitly or fetchOnce's r.json() chokes
    // on "MapDate,St...".
    return { url: `https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=${aoi}&startdate=${fmt(start)}&enddate=${fmt(end)}&statisticsType=1`, init: { headers: { Accept: 'application/json' } } };
  }
  if (spec.type === 'nws') {
    const ev = (spec.events || []).map(encodeURIComponent).join(',');
    return { url: `https://api.weather.gov/alerts/active?event=${ev}` };
  }
  return { skip: 'unknown type' };
}
// Extract the row array per source type (mirrors changeFromRaw's digging).
function rowsFor(spec, raw) {
  switch (spec.type) {
    case 'eia':  return (raw && raw.response && raw.response.data) || (raw && raw.data) || [];
    case 'nass': return (raw && raw.data) || (Array.isArray(raw) ? raw : []);
    case 'ams':  return (raw && raw.results) || (Array.isArray(raw) ? raw : []);
    case 'usdm': return Array.isArray(raw) ? raw : ((raw && raw.data) || []);
    case 'nws':  return (raw && raw.features) || [];
    default: return [];
  }
}
function distinct(rows, key, cap) {
  const seen = []; for (const r of rows) { const v = r && r[key]; if (v != null && seen.indexOf(v) < 0) { seen.push(v); if (seen.length >= (cap || 6)) break; } } return seen;
}

// ---- probe: try EVERY spec live (ignore `verified`) and report what comes back
// so the founder can confirm/tighten each query in one pass. Writes nothing.
async function probe() {
  console.log('Probing every spec live (writes nothing). NASS/EIA need keys; USDM/NWS keyless.\n');
  const ready = [];
  for (const [id, spec] of Object.entries(specs)) {
    const u = urlFor(id, spec);
    if (u.skip) { console.log(`  ✗ ${id.padEnd(26)} [${spec.type}] skipped: ${u.skip}`); continue; }
    try {
      const raw = await fetchJson(u.url, u.init);
      const rows = rowsFor(spec, raw);
      const cp = changeFromRaw(spec, raw);
      const usable = cp != null;
      const flag = usable ? '✓' : '⚠';
      let detail = `rows=${rows.length} change=${usable ? (cp * 100).toFixed(1) + '%' : 'none'}`;
      if (spec.type === 'nass') {
        const sd = distinct(rows, 'short_desc'), ud = distinct(rows, 'unit_desc');
        detail += `\n      short_desc: ${sd.length ? sd.join(' | ') : '(none — query matched nothing)'}`;
        if (ud.length > 1) detail += `\n      unit_desc (multiple — tighten with unit_desc): ${ud.join(' | ')}`;
      }
      // USDM: when the share series won't compute, dump the first row's keys so
      // we can see exactly which field names the JSON uses (MapDate/D2 casing).
      if (spec.type === 'usdm' && rows.length) {
        detail += `\n      usdm keys: ${Object.keys(rows[0]).join(', ')}`;
        if (!usable) detail += `\n      usdm row[0]: ${JSON.stringify(rows[0])}`;
      }
      console.log(`  ${flag} ${id.padEnd(26)} [${spec.type}] ${detail}`);
      if (usable) ready.push(id);
    } catch (e) { console.log(`  ✗ ${id.padEnd(26)} [${spec.type}] fetch failed: ${e.message}`); }
  }
  console.log(`\n${ready.length}/${Object.keys(specs).length} specs returned a usable series.`);
  const toFlip = ready.filter((id) => specs[id].verified === false);
  if (toFlip.length) console.log(`Ready to flip verified:true (confirm the short_desc above looks right first):\n  ${toFlip.join('\n  ')}`);
}

async function live() {
  const observations = {};
  const gaps = [];
  const asOf = new Date().toISOString().slice(0, 10);
  const ids = new Set();
  for (const panel of Object.values(rules.items || {})) (panel.indicators || []).forEach((i) => ids.add(i.id));
  for (const id of ids) {
    const spec = specs[id];
    if (!spec) { gaps.push(`${id}: no spec`); continue; }
    if (spec.verified === false) { gaps.push(`${id}: spec not verified yet`); continue; }
    const u = urlFor(id, spec);
    if (u.skip) { gaps.push(`${id}: ${u.skip}`); continue; }
    try {
      const raw = await fetchJson(u.url, u.init);
      const cp = changeFromRaw(spec, raw);
      if (cp == null) { gaps.push(`${id}: no usable series`); continue; }
      observations[id] = cp;
    } catch (e) { gaps.push(`${id}: fetch failed (${e.message})`); }
  }
  // Map shared indicator changes onto each item that uses them.
  const byItem = {};
  for (const [item, panel] of Object.entries(rules.items || {})) {
    const o = {};
    (panel.indicators || []).forEach((i) => { if (observations[i.id] != null) o[i.id] = observations[i.id]; });
    if (Object.keys(o).length) byItem[item] = o;
  }
  const out = { _doc: 'GENERATED live by fetch-pressure-observations.mjs --live.', _status: 'live', asOf, observations: byItem };
  writeFileSync(path.join(repoRoot, 'data/pressure-observations.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`Wrote data/pressure-observations.json (live) — ${Object.keys(byItem).length} item(s).`);
  if (gaps.length) { console.log('Gaps (go-live checklist):'); gaps.forEach((g) => console.log('  - ' + g)); }
}

if (arg('--self-test')) selfTest();
else if (arg('--demo')) {
  const demo = rd('data/pressure-observations.demo.json');
  writeFileSync(path.join(repoRoot, 'data/pressure-observations.json'), JSON.stringify(demo, null, 2) + '\n');
  console.log('Wrote data/pressure-observations.json from demo fixture.');
} else if (arg('--probe')) { probe(); }
else if (arg('--live')) { live(); }
else { console.log('usage: --self-test | --probe | --demo | --live\n  --probe  try every spec live (ignores verified), report what each returns, write nothing\n  --live   fetch verified specs → data/pressure-observations.json\n  (live/probe need free EIA_KEY + NASS_KEY; USDM/NWS keyless)'); }
