#!/usr/bin/env node
/**
 * verify-cost-index-sources.mjs — confirm the placeholder source ids in
 * data/cost-index-sources.json actually resolve against the live APIs, then
 * (optionally) flip verified:true for the ones that do. This is the bridge
 * between "I have the keys" and a live Cost Index (plan pin #8 — the real unlock).
 *
 * For each ingredient × source it fetches the declared id (ams may be an ARRAY
 * of terminal markets — it probes each), normalizes through the shipping
 * adapters, and reports resolve/fail + in-bounds. An ingredient is READY when at
 * least one LEVEL-bearing source resolves IN BOUNDS and ≥2 sources resolve (a
 * real trend) — so a bad id can't be flipped live, and one market missing the
 * commodity this week doesn't block the rest.
 *
 * Needs network + keys (won't run from the web sandbox — the source hosts aren't
 * allowlisted; run locally or in the worker env):
 *   FRED_KEY=… BLS_KEY=… AMS_KEY=… node scripts/verify-cost-index-sources.mjs
 *   FRED_KEY=… BLS_KEY=… AMS_KEY=… node scripts/verify-cost-index-sources.mjs --flip
 *
 * --flip rewrites verified:true ONLY for READY ingredients; never touches the rest.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const S = require('../tools/_shared/cost-index-sources.js');
const F = require('../tools/_shared/cost-index-fetch.js');   // shared transport: timeout + transient retry + AMS window/section + fan-out

const FLIP = process.argv.includes('--flip');
const SRC = path.join(repoRoot, 'data/cost-index-sources.json');
const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));
const doc = rd(SRC);
const sources = doc.ingredients || {};
const bounds = rd(path.join(repoRoot, 'data/cost-index-bounds.json')).bounds || {};

const keys = { FRED: process.env.FRED_KEY, BLS: process.env.BLS_KEY, AMS: process.env.AMS_KEY };
for (const [k, v] of Object.entries(keys)) if (!v) console.warn(`! ${k}_KEY not set — its sources will be skipped.`);

// Returns { ok, n, latest, basis } or { ok:false, err }.
async function probe(src, m) {
  try {
    if (src === 'ams') {
      if (!keys.AMS) return { ok: false, err: 'no AMS_KEY' };
      // Prices live in a report SECTION ("Report Details"); the bare report is the header.
      const auth = 'Basic ' + Buffer.from(keys.AMS + ':').toString('base64');
      const j = await F.fetchAmsReport(m.reportId, m.section, auth);
      const o = S.normalizeAms(j, { source: 'usda-ams', basis: 'wholesale', reducer: m.reducer || 'mostlyMid', commodity: m.commodity, matchFields: m.matchFields, unit: m.unit });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, basis: 'wholesale', level: true }
        : { ok: false, err: `fetched OK, 0 priced rows matched${m.commodity ? ` commodity "${m.commodity}"` : ''}${F.AMS_WINDOW_DAYS ? ` (last ${F.AMS_WINDOW_DAYS}d — set AMS_WINDOW_DAYS=0 for full history)` : ''} (check report JSON shape / commodity term)` };
    }
    if (src === 'bls') {
      if (!keys.BLS) return { ok: false, err: 'no BLS_KEY' };
      const j = await F.fetchJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesid: [m.seriesId], registrationkey: keys.BLS }) });
      const o = S.normalizeBls(j, { source: 'bls', basis: 'index' });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, basis: 'index', level: false }
        : { ok: false, err: 'fetched OK, 0 data points (check series id)' };
    }
    if (src === 'fred') {
      if (!keys.FRED) return { ok: false, err: 'no FRED_KEY' };
      const j = await F.fetchJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${m.seriesId}&file_type=json&api_key=${keys.FRED}`);
      const o = S.normalizeFred(j, { source: 'fred', basis: m.basis || 'index' });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, basis: m.basis || 'index', level: (m.basis === 'retail' || m.basis === 'wholesale') }
        : { ok: false, err: 'fetched OK, 0 data points (check series id)' };
    }
  } catch (e) { return { ok: false, err: String(e.message || e) }; }
  return { ok: false, err: 'unknown source' };
}

// --discover [query]: list the MARS API report directory (so you can find the
// NUMERIC report id the API wants — the slugs like 'LM_XB403' 404). The 404s on
// every ams probe mean auth works but the path/id is wrong; this finds the id.
async function discoverAms(query) {
  if (!keys.AMS) { console.error('AMS_KEY required for --discover.'); process.exit(1); }
  const auth = 'Basic ' + Buffer.from(keys.AMS + ':').toString('base64');
  let list;
  try { list = await F.fetchJson('https://marsapi.ams.usda.gov/services/v1.2/reports', { headers: { Authorization: auth } }); }
  catch (e) { console.error(`Could not reach the reports directory (${e.message}). If this 404s too, the API base path changed — check https://mymarketnews.ams.usda.gov/mars-api`); process.exit(1); }
  const reports = Array.isArray(list) ? list : (list.results || list.reports || []);
  const all = process.argv.includes('--all');
  const q = (query || '').toLowerCase().trim();
  // Match report_title OR slug_name (the AMS report code, e.g. LM_XB459). The
  // numeric slug_id is what the data endpoint wants in ams.reportId.
  const matches = (all || !q) ? reports
    : reports.filter((r) => (((r.report_title || '') + ' ' + (r.slug_name || '')).toLowerCase().includes(q)));
  console.log(`AMS reports directory: ${reports.length} total · ${matches.length} ${q ? `matching "${query}"` : 'shown'}\n`);
  const limit = all ? reports.length : 100;
  for (const r of matches.slice(0, limit)) {
    console.log(`  reportId=${r.slug_id}   code=${r.slug_name || '?'}   ${r.report_title || ''}   (${r.report_date || r.published_date || ''})`);
  }
  console.log('\nPut the numeric reportId into data/cost-index-sources.json (ams.reportId), then re-run verify.');
  console.log('Tip: ribeye/cuts live INSIDE a boxed-beef report — search "beef", "boxed", "cutout", "terminal", "lettuce", "vegetable".');
  console.log('     `--discover --all > /tmp/ams-reports.txt` dumps the whole directory to grep locally.');
}

// --discover-fred <query>: search the FRED catalog for the right series id (so we
// resolve a bad/wrong id by SEARCHING rather than guessing or dropping the slot).
// FRED indexes most BLS PPI/CPI series too, so this finds WPU*/CUUR* (trend) AND
// APU* ($-level) ids. basis: retail/wholesale = a level; index = trend-only.
async function discoverFred(query) {
  if (!keys.FRED) { console.error('FRED_KEY required for --discover-fred.'); process.exit(1); }
  if (!query) { console.error('Usage: --discover-fred "russet potatoes"'); process.exit(1); }
  const url = `https://api.stlouisfed.org/fred/series/search?search_text=${encodeURIComponent(query)}`
    + `&api_key=${keys.FRED}&file_type=json&limit=40&order_by=popularity&sort_order=desc`;
  let j;
  try { j = await F.fetchJson(url); }
  catch (e) { console.error(`FRED search failed (${e.message}). Check FRED_KEY / network.`); process.exit(1); }
  const list = j.seriess || [];
  console.log(`FRED series matching "${query}": ${j.count != null ? j.count : list.length} total · showing ${list.length}\n`);
  for (const s of list) {
    console.log(`  ${s.id}  [${s.frequency_short || '?'}, ${s.units_short || s.units || '?'}, ${(s.observation_start || '').slice(0, 4)}–${(s.observation_end || '').slice(0, 4)}]  ${s.title || ''}`);
  }
  console.log('\nPut the chosen id into data/cost-index-sources.json (fred.seriesId, or bls.seriesId for a WPU/CUUR code).');
  console.log('Set basis: a $-per-unit series (APU*, "Dollars per…") = retail/wholesale LEVEL (add a matching `unit`); an index ("Index 1982=100") = trend-only.');
  console.log('Tip: --discover-fred "potatoes" / "beef" / "butter" / "eggs" / "soybean oil". Avoid IMF/OECD/World Bank series (redistribution-limited).');
}

async function main() {
  const dfi = process.argv.indexOf('--discover-fred');
  if (dfi >= 0) return discoverFred(process.argv[dfi + 1]);
  const di = process.argv.indexOf('--discover');
  if (di >= 0) return discoverAms(process.argv[di + 1]);
  console.log('Verifying cost-index source ids against the live APIs…\n');
  const ready = [];
  const inBand = (latest, band) => latest != null && band && Math.round(latest * 100) >= band.minCents && Math.round(latest * 100) <= band.maxCents;
  for (const ing of Object.keys(sources)) {
    const entry = sources[ing];
    const b = bounds[ing];
    // Flatten probe targets: ams may be an array of terminal markets.
    const targets = [];
    if (entry.ams) (Array.isArray(entry.ams) ? entry.ams : [entry.ams]).forEach((s) =>
      targets.push({ kind: 'ams', label: 'ams' + (s.market ? `:${s.market}` : ''), spec: s }));
    if (entry.bls) targets.push({ kind: 'bls', label: 'bls', spec: entry.bls });
    if (entry.fred) targets.push({ kind: 'fred', label: 'fred', spec: entry.fred });
    // Probe in parallel (bounded) — 8 produce terminals sequentially is what made
    // this feel hung; mapLimit always settles each, so a dead market drops only itself.
    const results = await F.mapLimit(targets, F.AMS_CONCURRENCY, (t) => probe(t.kind, t.spec));
    targets.forEach((t, i) => { t.res = results[i].ok ? results[i].value : { ok: false, err: String(results[i].error && results[i].error.message || results[i].error) }; });

    const lines = [];
    const amsT = targets.filter((t) => t.kind === 'ams');
    if (amsT.length) {
      const okA = amsT.filter((t) => t.res.ok);
      const inb = okA.filter((t) => b && inBand(t.res.latest, b));
      if (okA.length) {
        const vals = okA.map((t) => t.res.latest);
        lines.push(`ams ✓ ${okA.length}/${amsT.length} markets, ${inb.length} in bounds (latest ${Math.min(...vals).toFixed(2)}–${Math.max(...vals).toFixed(2)})`);
      } else {
        lines.push(`ams ✗ 0/${amsT.length} markets (${amsT[0].res.err})`);
      }
    }
    for (const t of targets.filter((t) => t.kind !== 'ams')) {
      const r = t.res;
      lines.push(r.ok ? `${t.label} ✓ ${r.n} pts, latest ${r.latest}` : `${t.label} ✗ ${r.err}`);
    }
    if (!targets.length) lines.push(entry.noaa
      ? 'noaa only — no free public wholesale source (dormant by design, not stuck)'
      : 'no live source configured (dormant)');

    // READY = at least one level-bearing source in bounds AND ≥2 sources resolve (a trend).
    const levelOk = targets.some((t) => t.res.ok && (t.kind === 'ams' || t.res.level) && b && inBand(t.res.latest, b));
    const resolved = targets.filter((t) => t.res.ok).length;
    const isReady = levelOk && resolved >= 2;
    if (isReady) ready.push(ing);
    console.log(`${isReady ? '✅ READY' : '⏳      '} ${ing.padEnd(18)} ${lines.join('  ·  ')}`);
  }

  console.log(`\n${ready.length}/${Object.keys(sources).length} ingredient(s) READY to flip verified:true.`);
  if (FLIP && ready.length) {
    for (const ing of ready) sources[ing].verified = true;
    writeFileSync(SRC, JSON.stringify(doc, null, 2) + '\n');
    console.log(`Flipped verified:true for: ${ready.join(', ')}. Re-run check-cost-index-sources.mjs, then fetch --live + build-cost-index.`);
  } else if (ready.length) {
    console.log('Run again with --flip to set verified:true for the READY ones.');
  }
  if (!ready.length) console.log('Nothing READY yet — fix the ✗ ids (wrong report/series id, or out-of-bounds → check the unit/reducer).');
}

main().catch((e) => { console.error(e); process.exit(1); });
