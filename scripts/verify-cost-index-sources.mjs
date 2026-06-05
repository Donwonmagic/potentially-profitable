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
      const j = await F.fetchAmsReport(m.reportId, m.section, auth, m.windowDays);
      const o = S.normalizeAms(j, { source: 'usda-ams', basis: 'wholesale', reducer: m.reducer || 'mostlyMid', commodity: m.commodity, matchFields: m.matchFields, unit: m.unit, priceUnit: m.priceUnit });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: 'wholesale', level: true }
        : { ok: false, err: `fetched OK, 0 priced rows matched${m.commodity ? ` commodity "${m.commodity}"` : ''}${F.AMS_WINDOW_DAYS ? ` (last ${F.AMS_WINDOW_DAYS}d — set AMS_WINDOW_DAYS=0 for full history)` : ''} (check report JSON shape / commodity term)` };
    }
    if (src === 'lmr') {
      // LMR Datamart (boxed beef / negotiated pork) — keyless; rows parse with the
      // same AMS normalizer. Optional LMR_KEY if the Datamart ever requires auth.
      const auth = process.env.LMR_KEY ? 'Basic ' + Buffer.from(process.env.LMR_KEY + ':').toString('base64') : undefined;
      const j = await F.fetchLmrReport(m.reportId, m.section, auth, m.windowDays);
      const o = S.normalizeAms(j, { source: 'usda-lmr', basis: 'wholesale', reducer: m.reducer || 'mostlyMid', commodity: m.commodity, matchFields: m.matchFields, unit: m.unit, priceUnit: m.priceUnit });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: 'wholesale', level: true }
        : { ok: false, err: `fetched OK, 0 priced rows matched${m.commodity ? ` commodity "${m.commodity}"` : ''} (LMR Datamart — confirm slug via --discover-lmr + row/price fields)` };
    }
    if (src === 'noaa') {
      // NOAA Fisheries import unit value (keyless) → landed-adjacent $/lb level.
      const j = await F.fetchNoaaTrade({ years: m.years });
      const o = S.normalizeNoaaTrade(j, { source: 'noaa', basis: 'wholesale', commodity: m.commodity, hts: m.hts, unit: m.unit || 'lb' });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: 'wholesale', level: true }
        : { ok: false, err: `fetched OK, 0 import rows matched${m.commodity ? ` "${m.commodity}"` : ''} (confirm NOAA trade_data fields / commodity / hts via a sample)` };
    }
    if (src === 'bls') {
      if (!keys.BLS) return { ok: false, err: 'no BLS_KEY' };
      const j = await F.fetchJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesid: [m.seriesId], registrationkey: keys.BLS }) });
      const o = S.normalizeBls(j, { source: 'bls', basis: 'index' });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: 'index', level: false }
        : { ok: false, err: 'fetched OK, 0 data points (check series id)' };
    }
    if (src === 'fred') {
      if (!keys.FRED) return { ok: false, err: 'no FRED_KEY' };
      const j = await F.fetchJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${m.seriesId}&file_type=json&api_key=${keys.FRED}`);
      const o = S.normalizeFred(j, { source: 'fred', basis: m.basis || 'index' });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: m.basis || 'index', level: (m.basis === 'retail' || m.basis === 'wholesale') }
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

// --discover-lmr [query]: list the LMR Datamart report directory (boxed beef /
// negotiated pork wholesale — the reports that 404 in MARS because they live in
// this separate, keyless system). Find the slug for ribeye/tenderloin/pork cuts.
async function discoverLmr(query) {
  const auth = process.env.LMR_KEY ? 'Basic ' + Buffer.from(process.env.LMR_KEY + ':').toString('base64') : undefined;
  let list;
  try { list = await F.fetchJson(F.LMR_BASE.replace(/\/reports\/$/, '/reports'), auth ? { headers: { Authorization: auth } } : {}); }
  catch (e) { console.error(`Could not reach the LMR Datamart directory (${e.message}). If it needs auth, set LMR_KEY. Base: ${F.LMR_BASE}`); process.exit(1); }
  const reports = Array.isArray(list) ? list : (list.results || list.reports || []);
  const q = (query || '').toLowerCase().trim();
  const matches = !q ? reports
    : reports.filter((r) => ((r.report_title || r.title || '') + ' ' + (r.slug_name || r.slug_id || '')).toLowerCase().includes(q));
  console.log(`LMR Datamart: ${reports.length} reports · ${matches.length} ${q ? `matching "${query}"` : 'shown'}\n`);
  for (const r of matches.slice(0, 120)) {
    console.log(`  reportId=${r.slug_id || r.slug_name || r.report_id}   ${r.report_title || r.title || ''}   (${r.report_date || r.published_date || ''})`);
  }
  console.log('\nPut the slug into data/cost-index-sources.json (lmr.reportId), set lmr.commodity to the cut (e.g. "Ribeye"), then re-run verify.');
  console.log('Tip: --discover-lmr "boxed beef" / "cutout" / "ribeye" / "pork" / "loin". Then curl one report to confirm the row/price fields.');
}

// --audit-titles: print the REAL FRED title + freshness for every bls/fred series
// in the mapping, so a mislabeled series (e.g. a "beef" trend that's actually the
// cheese PPI) is caught at a glance. The id resolving is NOT enough — the title
// must match the ingredient it's used by.
async function auditTitles() {
  if (!keys.FRED) { console.error('FRED_KEY required for --audit-titles.'); process.exit(1); }
  const seen = new Map();   // seriesId → ["ingredient.bls", ...]
  const collect = (obj, where) => {
    if (!obj) return;
    for (const sk of ['bls', 'fred']) {
      const s = obj[sk];
      if (s && s.seriesId) { if (!seen.has(s.seriesId)) seen.set(s.seriesId, []); seen.get(s.seriesId).push(`${where}.${sk}`); }
    }
  };
  for (const [ing, e] of Object.entries(sources)) collect(e, ing);
  for (const [d, e] of Object.entries(doc.drivers || {})) if (!d.startsWith('_')) collect(e, `driver:${d}`);
  console.log(`Auditing ${seen.size} FRED/BLS series — confirm each TITLE matches the ingredient using it:\n`);
  for (const [id, wheres] of seen) {
    try {
      const j = await F.fetchJson(`https://api.stlouisfed.org/fred/series?series_id=${id}&file_type=json&api_key=${keys.FRED}`);
      const s = (j.seriess || [])[0];
      if (!s) { console.log(`  ${id.padEnd(16)} ✗ not on FRED   used by: ${wheres.join(', ')}`); continue; }
      const age = Math.round((Date.now() - Date.parse(s.observation_end + 'T00:00:00Z')) / 86400000);
      console.log(`  ${id.padEnd(16)} ${s.observation_end}${age > 120 ? ` ⚠STALE(${age}d)` : ''}  ${s.title}`);
      console.log(`  ${''.padEnd(16)} used by: ${wheres.join(', ')}`);
    } catch (e) { console.log(`  ${id.padEnd(16)} ✗ ${e.message}   used by: ${wheres.join(', ')}`); }
  }
  console.log('\nFix any title that does not match its ingredient (use --discover-fred "<term>" to find the right id).');
}

async function main() {
  if (process.argv.includes('--audit-titles')) return auditTitles();
  const dli = process.argv.indexOf('--discover-lmr');
  if (dli >= 0) return discoverLmr(process.argv[dli + 1]);
  const dfi = process.argv.indexOf('--discover-fred');
  if (dfi >= 0) return discoverFred(process.argv[dfi + 1]);
  const di = process.argv.indexOf('--discover');
  if (di >= 0) return discoverAms(process.argv[di + 1]);
  console.log('Verifying cost-index source ids against the live APIs…\n');
  const ready = [];
  const directional = [];
  const inBand = (latest, band) => latest != null && band && Math.round(latest * 100) >= band.minCents && Math.round(latest * 100) <= band.maxCents;
  // Show the DATA date (not fetch time) + loudly flag a genuinely stale source —
  // normal monthly lag is fine; 120d+ means discontinued/dead and the build gate
  // would reject it anyway. This is how you spot a lagging series at a glance.
  const STALE_DAYS = 120;
  const dateTag = (d) => {
    if (!d) return '';
    const age = Math.round((Date.now() - Date.parse(d + 'T00:00:00Z')) / 86400000);
    return ` @ ${d}${age > STALE_DAYS ? ` ⚠STALE(${age}d)` : ''}`;
  };
  for (const ing of Object.keys(sources)) {
    const entry = sources[ing];
    const b = bounds[ing];
    // Flatten probe targets: ams may be an array of terminal markets.
    const targets = [];
    if (entry.ams) (Array.isArray(entry.ams) ? entry.ams : [entry.ams]).forEach((s) =>
      targets.push({ kind: 'ams', label: 'ams' + (s.market ? `:${s.market}` : ''), spec: s }));
    if (entry.lmr) (Array.isArray(entry.lmr) ? entry.lmr : [entry.lmr]).forEach((s) =>
      targets.push({ kind: 'lmr', label: 'lmr' + (s.market ? `:${s.market}` : ''), spec: s }));
    if (entry.noaa) targets.push({ kind: 'noaa', label: 'noaa', spec: entry.noaa });
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
        const newest = okA.map((t) => t.res.date).filter(Boolean).sort().pop();   // most-recent market date
        lines.push(`ams ✓ ${okA.length}/${amsT.length} markets, ${inb.length} in bounds (latest ${Math.min(...vals).toFixed(2)}–${Math.max(...vals).toFixed(2)})${dateTag(newest)}`);
      } else {
        lines.push(`ams ✗ 0/${amsT.length} markets (${amsT[0].res.err})`);
      }
    }
    for (const t of targets.filter((t) => t.kind !== 'ams')) {
      const r = t.res;
      lines.push(r.ok ? `${t.label} ✓ ${r.n} pts, latest ${r.latest}${dateTag(r.date)}` : `${t.label} ✗ ${r.err}`);
    }
    if (!targets.length) lines.push(entry.noaa
      ? 'noaa only — no free public wholesale source (dormant by design, not stuck)'
      : 'no live source configured (dormant)');

    // READY = at least one level-bearing source in bounds AND ≥2 sources resolve (a trend).
    const levelOk = targets.some((t) => t.res.ok && (t.kind === 'ams' || t.kind === 'lmr' || t.res.level) && b && inBand(t.res.latest, b));
    const resolved = targets.filter((t) => t.res.ok).length;
    const isReady = levelOk && resolved >= 2;
    // DIRECTIONAL = no comparable price LEVEL, but ≥2 trend sources resolve. Honest
    // trend-only (e.g. cooking oil — no free oil level exists). Vendorable: it
    // composes a directional point + feeds the basket; just no level to anchor.
    const isDirectional = !isReady && !levelOk && resolved >= 2;
    if (isReady || isDirectional) ready.push(ing);
    if (isDirectional) directional.push(ing);
    const tag = isReady ? '✅ READY ' : isDirectional ? '◆ DIRECT' : '⏳       ';
    console.log(`${tag} ${ing.padEnd(18)} ${lines.join('  ·  ')}`);
  }

  // Drivers (feed-grain / fuel) — the explanatory "why" layer. Trend-only; shown
  // so the feed + fuel numbers are visibly confirmed, not just assumed.
  const drivers = doc.drivers || {};
  const driverKeys = Object.keys(drivers).filter((k) => !k.startsWith('_'));
  if (driverKeys.length) {
    console.log('\n── drivers (feed / fuel — the "why" behind protein moves) ──');
    for (const dk of driverKeys) {
      const e = drivers[dk];
      const dts = [];
      if (e.bls) dts.push({ kind: 'bls', spec: e.bls });
      if (e.fred) dts.push({ kind: 'fred', spec: e.fred });
      const res = await F.mapLimit(dts, F.AMS_CONCURRENCY, (t) => probe(t.kind, t.spec));
      const dl = dts.map((t, i) => {
        const r = res[i].ok ? res[i].value : { ok: false, err: String(res[i].error && res[i].error.message || res[i].error) };
        return r.ok ? `${t.kind} ✓ latest ${r.latest}${dateTag(r.date)}` : `${t.kind} ✗ ${r.err}`;
      });
      console.log(`   ${(dk + ` (${e.kind || '?'})`).padEnd(20)} ${dl.join('  ·  ')}`);
    }
  }

  const readyCount = ready.length - directional.length;
  console.log(`\n${readyCount} READY (level + trend) + ${directional.length} directional (trend-only) = ${ready.length} flippable of ${Object.keys(sources).length}.`);
  if (FLIP && ready.length) {
    for (const ing of ready) sources[ing].verified = true;
    writeFileSync(SRC, JSON.stringify(doc, null, 2) + '\n');
    console.log(`Flipped verified:true for: ${ready.join(', ')}. Re-run check-cost-index-sources.mjs, then fetch --live + build-cost-index.`);
  } else if (ready.length) {
    console.log('Run again with --flip to set verified:true for the READY + directional ones.');
  }
  if (!ready.length) console.log('Nothing resolvable yet — fix the ✗ ids (wrong report/series id, or out-of-bounds → check the unit/reducer).');
}

main().catch((e) => { console.error(e); process.exit(1); });
