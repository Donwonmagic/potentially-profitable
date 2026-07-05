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
      const o = S.normalizeAms(j, { source: 'usda-ams', basis: 'wholesale', reducer: m.reducer || 'mostlyMid', commodity: m.commodity, matchFields: m.matchFields, commodityExact: m.commodityExact, filters: m.filters, priceUnitField: m.priceUnitField, unit: m.unit, priceUnit: m.priceUnit, fields: m.fields, dateField: m.dateField });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: 'wholesale', level: true }
        : { ok: false, err: `fetched OK, 0 priced rows matched${m.commodity ? ` commodity "${m.commodity}"` : ''}${F.AMS_WINDOW_DAYS ? ` (last ${F.AMS_WINDOW_DAYS}d — set AMS_WINDOW_DAYS=0 for full history)` : ''} (check report JSON shape / commodity term)` };
    }
    if (src === 'lmr') {
      // LMR Datamart (boxed beef / negotiated pork) — keyless; rows parse with the
      // same AMS normalizer. Optional LMR_KEY if the Datamart ever requires auth.
      const auth = process.env.LMR_KEY ? 'Basic ' + Buffer.from(process.env.LMR_KEY + ':').toString('base64') : undefined;
      const j = await F.fetchLmrReport(m.reportId, m.section, auth, m.windowDays, m.dateField);
      const o = S.normalizeAms(j, { source: 'usda-lmr', basis: 'wholesale', reducer: m.reducer || 'mostlyMid', commodity: m.commodity, matchFields: m.matchFields, commodityExact: m.commodityExact, filters: m.filters, priceUnitField: m.priceUnitField, unit: m.unit, priceUnit: m.priceUnit, fields: m.fields, dateField: m.dateField });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: 'wholesale', level: true }
        : { ok: false, err: `fetched OK, 0 priced rows matched${m.commodity ? ` commodity "${m.commodity}"` : ''} (LMR Datamart — confirm slug via --discover-lmr + row/price fields)` };
    }
    if (src === 'noaa') {
      // NOAA Fisheries import unit value (keyless) → landed-adjacent $/lb level.
      const j = await F.fetchNoaaTrade({ years: m.years });
      const o = S.normalizeNoaaTrade(j, { source: 'noaa', basis: m.basis || 'wholesale', commodity: m.commodity, hts: m.hts, nameMatch: m.nameMatch, edibleOnly: m.edibleOnly, unit: m.unit || 'lb' });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: 'wholesale', level: true }
        : { ok: false, err: `fetched OK, 0 import rows matched${m.commodity ? ` "${m.commodity}"` : ''} (confirm NOAA trade_data fields / commodity / hts via a sample)` };
    }
    if (src === 'census') {
      // US Census import unit value (keyless) → landed $/lb, any HS code.
      const j = await F.fetchCensusTrade({ hs: m.hs, years: m.years });
      const o = S.normalizeCensusTrade(j, { source: 'census', basis: m.basis || 'index', hts: m.hts, unit: m.unit || 'lb' });
      const latest = o.points[o.points.length - 1];
      const isLevel = (m.basis || 'index') !== 'index';
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: m.basis || 'index', level: isLevel }
        : { ok: false, err: `fetched OK, 0 usable import rows for HS ${(m.hs || []).join('/')} (confirm HS code + that UNIT_QY1 is a mass unit via a sample)` };
    }
    if (src === 'eia') {
      if (!process.env.EIA_KEY) return { ok: false, err: 'no EIA_KEY' };
      const j = await F.fetchEia(m);
      const o = S.normalizeEia(j, { source: 'eia', basis: 'index', value: m.value || 'price' });
      const latest = o.points[o.points.length - 1];
      return latest ? { ok: true, n: o.points.length, latest: latest.value, date: latest.date, basis: 'index', level: false }
        : { ok: false, err: 'fetched OK, 0 points (confirm EIA route/facets/value field via a sample)' };
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
      const o = S.normalizeFred(j, { source: 'fred', basis: m.basis || 'index', unit: m.unit });
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
  console.log('NEXT: `--list-commodities <reportId>` dumps every commodity term + sample price in that report — wire the EXACT term, no guessing (add "<section>" / --lmr for LMR cut reports).');
  console.log('Tip: ribeye/cuts live INSIDE a boxed-beef report — search "beef", "boxed", "cutout", "terminal", "lettuce", "vegetable".');
  console.log('     `--discover --all > /tmp/ams-reports.txt` dumps the whole directory to grep locally.');
}

// --list-commodities <reportId> [section] [--lmr]: dump every distinct commodity
// term actually present in a report (with a sample price + unit), so you wire the
// EXACT term instead of guessing — and see commodities you didn't know were there.
// Field-agnostic: picks the most-varied label field (commodity / item / variety …).
async function listCommodities(reportId, section) {
  if (!reportId) { console.error('Usage: --list-commodities <reportId> ["section"] [--lmr]'); process.exit(1); }
  const useLmr = process.argv.includes('--lmr');
  if (!useLmr && !keys.AMS) { console.error('AMS_KEY required for --list-commodities.'); process.exit(1); }
  const auth = useLmr
    ? (process.env.LMR_KEY ? 'Basic ' + Buffer.from(process.env.LMR_KEY + ':').toString('base64') : undefined)
    : 'Basic ' + Buffer.from(keys.AMS + ':').toString('base64');
  let j;
  try { j = useLmr ? await F.fetchLmrReport(reportId, section, auth) : await F.fetchAmsReport(reportId, section, auth); }
  catch (e) { console.error(`Could not fetch report ${reportId}${section ? ' / ' + section : ''}: ${e.message}`); process.exit(1); }
  const rows = Array.isArray(j) ? j : (j.results || (j.report && j.report.results) || []);
  if (!rows.length) {
    const secs = j.reportSections || (j.report && j.report.reportSections) || [];
    console.error(`Report ${reportId} returned 0 rows for section "${section || '(default)'}".`);
    if (secs.length) console.error('Sections in this report: ' + secs.map((s) => (typeof s === 'string' ? s : s.name)).join(' · ') + `\n  → re-run: --list-commodities ${reportId} "<section>"${useLmr ? ' --lmr' : ''}`);
    process.exit(1);
  }
  const labelFields = ['commodity', 'item', 'variety', 'commodity_name', 'cut', 'description', 'item_description'];
  const priceFields = ['avg_price', 'wtd_avg_price', 'mostly_low_price', 'low_price', 'price', 'Weighted_Average', 'weighted_average'];
  const unitFields = ['price_unit', 'price_Unit', 'priceUnit'];
  const skip = /date|price|_id\b|^id$|slug|year|week|begin|end|published|narrative|grade|unit|state|office|market|region|community|category/i;
  const distinctText = (f) => new Set(rows.map((r) => r[f]).filter((v) => v != null && typeof v !== 'number' && String(v).trim() && isNaN(Number(String(v).replace(/[$,%]/g, ''))))).size;
  let labelF = null, best = 0;
  // 1) known commodity fields with real variety
  for (const f of labelFields) { const n = distinctText(f); if (n >= 3 && n > best) { best = n; labelF = f; } }
  // 2) fallback — most-varied label-like text field (catches LMR cut reports whose
  //    cut name isn't in a 'commodity' field)
  if (!labelF) for (const f of Object.keys(rows[0] || {})) { if (skip.test(f)) continue; const n = distinctText(f); if (n >= 2 && n <= 400 && n > best) { best = n; labelF = f; } }
  if (!labelF) {
    console.error(`Could not auto-detect a commodity label field in report ${reportId}. Row fields are:\n  ${Object.keys(rows[0] || {}).join(', ')}\nPick the descriptive one and use it as ams.matchFields, e.g. {"price":["${priceFields.find((f) => rows.some((r) => r[f] != null)) || 'price'}"]}.`);
    process.exit(1);
  }
  const priceF = priceFields.find((f) => rows.some((r) => r[f] != null && r[f] !== '')) || null;
  const unitF = unitFields.find((f) => rows.some((r) => r[f] != null)) || null;
  const tally = {};
  for (const r of rows) {
    const v = r[labelF]; if (v == null || !String(v).trim()) continue;
    const k = String(v).trim();
    (tally[k] = tally[k] || { count: 0, price: null, unit: '' });
    tally[k].count++;
    if (tally[k].price == null && priceF && r[priceF] != null && r[priceF] !== '') { tally[k].price = r[priceF]; tally[k].unit = unitF ? (r[unitF] || '') : ''; }
  }
  const entries = Object.entries(tally).sort((a, b) => b[1].count - a[1].count);
  console.log(`Report ${reportId}${section ? ' / ' + section : ''}: ${rows.length} rows · label field "${labelF}" · ${entries.length} distinct commodities${priceF ? ` · price "${priceF}"` : ''}\n`);
  for (const [name, t] of entries) {
    console.log(`  ${String(t.count).padStart(4)}×  ${name}${t.price != null ? `   (e.g. ${t.price}${t.unit ? ' ' + t.unit : ''})` : '   (no price field)'}`);
  }
  console.log(`\nUse the exact term as ams.commodity (field-agnostic substring match on "${labelF}"). Pick the price column "${priceF || '?'}" for fields.price if it isn't auto-detected.`);
}

// --sample <reportId> [section] [--lmr] [--match <substr>] [--n <count>]: dump RAW
// rows (every field) from a report, optionally only rows containing <substr> in any
// field. This is the schema X-ray behind the term matcher: --list-commodities shows
// ONE label field, but a report can blend products under it (e.g. 2279 mixes onions
// + potatoes in "variety"). --sample reveals the OTHER fields (commodity / class …)
// so you wire a precise ams.commodity + matchFields/filters instead of a substring
// that catches the wrong product. Pairs with normalizeAms's matcher exactly.
async function sampleRows(reportId, section) {
  if (!reportId) { console.error('Usage: --sample <reportId> ["section"] [--lmr] [--match <substr>] [--n <count>]'); process.exit(1); }
  const useLmr = process.argv.includes('--lmr');
  if (!useLmr && !keys.AMS) { console.error('AMS_KEY required for --sample.'); process.exit(1); }
  const auth = useLmr
    ? (process.env.LMR_KEY ? 'Basic ' + Buffer.from(process.env.LMR_KEY + ':').toString('base64') : undefined)
    : 'Basic ' + Buffer.from(keys.AMS + ':').toString('base64');
  const mi = process.argv.indexOf('--match');
  const match = mi >= 0 && process.argv[mi + 1] && !process.argv[mi + 1].startsWith('--') ? process.argv[mi + 1].toLowerCase() : null;
  const ni = process.argv.indexOf('--n');
  const limit = ni >= 0 ? Math.max(1, parseInt(process.argv[ni + 1], 10) || 6) : 6;
  let j;
  try { j = useLmr ? await F.fetchLmrReport(reportId, section, auth) : await F.fetchAmsReport(reportId, section, auth); }
  catch (e) { console.error(`Could not fetch report ${reportId}${section ? ' / ' + section : ''}: ${e.message}`); process.exit(1); }
  const rows = Array.isArray(j) ? j : (j.results || (j.report && j.report.results) || []);
  if (!rows.length) {
    const secs = j.reportSections || (j.report && j.report.reportSections) || [];
    console.error(`Report ${reportId} returned 0 rows for section "${section || '(default)'}".`);
    if (secs.length) console.error('Sections in this report: ' + secs.map((s) => (typeof s === 'string' ? s : s.name)).join(' · '));
    process.exit(1);
  }
  const hit = match
    ? rows.filter((r) => Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(match)))
    : rows;
  console.log(`Report ${reportId}${section ? ' / ' + section : ''}: ${rows.length} rows · fields: ${Object.keys(rows[0] || {}).join(', ')}`);
  console.log(`${match ? `${hit.length} rows containing "${process.argv[mi + 1]}"` : 'no --match filter'} · showing ${Math.min(limit, hit.length)}:\n`);
  for (const r of hit.slice(0, limit)) console.log('  ' + JSON.stringify(r));
  console.log('\nWire it: ams.commodity = a substring of the product field; add matchFields:["<field>"] to scope the match to that column, or filters:{"<field>":"<exactValue>"} to pin one variety/class (EQUALS). commodityExact:true forces the commodity to match EQUALS, not contains.');
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
  const lci = process.argv.indexOf('--list-commodities');
  if (lci >= 0) {
    const reportId = process.argv[lci + 1];
    const next = process.argv[lci + 2];
    const section = next && !next.startsWith('--') ? next : undefined;
    return listCommodities(reportId, section);
  }
  const si = process.argv.indexOf('--sample');
  if (si >= 0) {
    const reportId = process.argv[si + 1];
    const next = process.argv[si + 2];
    const section = next && !next.startsWith('--') ? next : undefined;
    return sampleRows(reportId, section);
  }
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
    if (entry.census) targets.push({ kind: 'census', label: 'census', spec: entry.census });
    if (entry.bls) targets.push({ kind: 'bls', label: 'bls', spec: entry.bls });
    if (entry.fred) (Array.isArray(entry.fred) ? entry.fred : [entry.fred]).forEach((s) =>
      targets.push({ kind: 'fred', label: 'fred' + (s.seriesId ? `:${s.seriesId}` : ''), spec: s }));
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

    // READY = at least one level-bearing source that is IN BOUNDS *and FRESH* AND
    // ≥2 sources resolve. A stale level (e.g. a discontinued series) must NOT count
    // — that would diverge from the build gate, which hard-rejects stale points.
    const isFresh = (d) => { if (!d) return true; return (Date.now() - Date.parse(d + 'T00:00:00Z')) / 86400000 <= STALE_DAYS; };
    const levelOk = targets.some((t) => t.res.ok && (t.kind === 'ams' || t.kind === 'lmr' || t.res.level) && b && inBand(t.res.latest, b) && isFresh(t.res.date));
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
      if (e.eia) dts.push({ kind: 'eia', spec: e.eia });
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
