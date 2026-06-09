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
    case 'usdm': return S.windowChange(S.usdmSeverity((raw && raw.length != null) ? raw : (raw && raw.data) || [], { categories: spec.categories }));
    case 'nws':  return S.eventSignal(S.nwsFreezeActive(raw, { events: spec.events, areaMatch: spec.areaMatch }));
    default: return null;
  }
}

// ---- self-test: prove the dispatch on canned fixtures (no network) --------
function selfTest() {
  const fx = {
    eia:  { spec: { type: 'eia', tail: 5 }, raw: { response: { data: [{ period: '2026-05-25', value: '3.80' }, { period: '2026-06-08', value: '3.99' }] } }, want: (v) => v > 0 },
    nass: { spec: { type: 'nass', tail: 5 }, raw: { data: [{ Value: '180', year: '2026', reference_period_desc: 'WEEK #20' }, { Value: '200', year: '2026', reference_period_desc: 'WEEK #22' }] }, want: (v) => v > 0 },
    ams:  { spec: { type: 'ams', field: 'price', tail: 5 }, raw: { results: [{ report_date: '2026-05-29', price: '70.1' }, { report_date: '2026-06-05', price: '74.5' }] }, want: (v) => v > 0 },
    usdm: { spec: { type: 'usdm', categories: ['D2', 'D3', 'D4'] }, raw: [{ MapDate: '20260601', D2: '10', D3: '5', D4: '0' }, { MapDate: '20260608', D2: '14', D3: '8', D4: '2' }], want: (v) => v > 0 },
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
async function fetchJson(url, init) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, Object.assign({ signal: ctrl.signal, headers: { 'User-Agent': 'muntin.digital cost-index (contact dongoldstein.accts@gmail.com)' } }, init || {}));
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(to); }
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
    return { url: `https://usdmdataservices.unl.edu/api/StateStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=${aoi}&startdate=1/1/2026&enddate=12/31/2026&statisticsType=1` };
  }
  if (spec.type === 'nws') {
    const ev = (spec.events || []).map(encodeURIComponent).join(',');
    return { url: `https://api.weather.gov/alerts/active?event=${ev}` };
  }
  return { skip: 'unknown type' };
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
      const raw = await fetchJson(u.url);
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
} else if (arg('--live')) { live(); }
else { console.log('usage: --self-test | --demo | --live   (live needs free EIA_KEY + NASS_KEY; USDM/NWS keyless)'); }
