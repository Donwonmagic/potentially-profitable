#!/usr/bin/env node
/**
 * verify-cost-index-sources.mjs — confirm the placeholder source ids in
 * data/cost-index-sources.json actually resolve against the live APIs, then
 * (optionally) flip verified:true for the ones that do. This is the bridge
 * between "I have the keys" and a live Cost Index (plan pin #8 — the real unlock).
 *
 * For each ingredient × source it fetches the declared id, normalizes it through
 * the shipping adapters, and reports: ✓ resolves (latest value, in-bounds?) or
 * ✗ (HTTP error / empty / out of band). An ingredient is READY only when EVERY
 * declared source resolves AND its level-bearing source's latest value sits
 * inside data/cost-index-bounds.json — so a bad id can't be flipped live.
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

const FLIP = process.argv.includes('--flip');
const SRC = path.join(repoRoot, 'data/cost-index-sources.json');
const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));
const doc = rd(SRC);
const sources = doc.ingredients || {};
const bounds = rd(path.join(repoRoot, 'data/cost-index-bounds.json')).bounds || {};

const keys = { FRED: process.env.FRED_KEY, BLS: process.env.BLS_KEY, AMS: process.env.AMS_KEY };
for (const [k, v] of Object.entries(keys)) if (!v) console.warn(`! ${k}_KEY not set — its sources will be skipped.`);

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

// Returns { ok, n, latest, basis } or { ok:false, err }.
async function probe(src, m) {
  try {
    if (src === 'ams') {
      if (!keys.AMS) return { ok: false, err: 'no AMS_KEY' };
      const j = await fetchJson(`https://marsapi.ams.usda.gov/services/v1.2/reports/${m.reportId}`, {
        headers: { Authorization: 'Basic ' + Buffer.from(keys.AMS + ':').toString('base64') } });
      const o = S.normalizeAms(j, { source: 'usda-ams', basis: 'wholesale', reducer: m.reducer || 'mostlyMid' });
      const latest = o.points[o.points.length - 1];
      return { ok: !!latest, n: o.points.length, latest: latest && latest.value, basis: 'wholesale', level: true };
    }
    if (src === 'bls') {
      if (!keys.BLS) return { ok: false, err: 'no BLS_KEY' };
      const j = await fetchJson('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seriesid: [m.seriesId], registrationkey: keys.BLS }) });
      const o = S.normalizeBls(j, { source: 'bls', basis: 'index' });
      const latest = o.points[o.points.length - 1];
      return { ok: !!latest, n: o.points.length, latest: latest && latest.value, basis: 'index', level: false };
    }
    if (src === 'fred') {
      if (!keys.FRED) return { ok: false, err: 'no FRED_KEY' };
      const j = await fetchJson(`https://api.stlouisfed.org/fred/series/observations?series_id=${m.seriesId}&file_type=json&api_key=${keys.FRED}`);
      const o = S.normalizeFred(j, { source: 'fred', basis: m.basis || 'index' });
      const latest = o.points[o.points.length - 1];
      return { ok: !!latest, n: o.points.length, latest: latest && latest.value, basis: m.basis || 'index', level: (m.basis === 'retail' || m.basis === 'wholesale') };
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
  try { list = await fetchJson('https://marsapi.ams.usda.gov/services/v1.2/reports', { headers: { Authorization: auth } }); }
  catch (e) { console.error(`Could not reach the reports directory (${e.message}). If this 404s too, the API base path changed — check https://mymarketnews.ams.usda.gov/mars-api`); process.exit(1); }
  const reports = Array.isArray(list) ? list : (list.results || list.reports || []);
  console.log(`AMS reports directory: ${reports.length} report(s).`);
  if (reports[0]) console.log('record fields:', Object.keys(reports[0]).join(', '), '\n');
  const q = (query || '').toLowerCase();
  const matches = q ? reports.filter((r) => JSON.stringify(r).toLowerCase().includes(q)) : reports.slice(0, 40);
  console.log(`${matches.length} match(es)${q ? ` for "${query}"` : ' (showing first 40)'}:`);
  for (const r of matches.slice(0, 80)) {
    const id = r.report_id ?? r.reportId ?? r.id ?? r.slug_id ?? '?';
    const slug = r.slug_id ?? r.slug ?? r.report_slug ?? '';
    const title = r.report_title ?? r.title ?? r.report_name ?? r.name ?? '';
    console.log(`  id=${id}  slug=${slug}  ${title}`);
  }
  console.log('\nPut the numeric id into data/cost-index-sources.json (ams.reportId), then re-run verify.');
}

async function main() {
  const di = process.argv.indexOf('--discover');
  if (di >= 0) return discoverAms(process.argv[di + 1]);
  console.log('Verifying cost-index source ids against the live APIs…\n');
  const ready = [];
  for (const ing of Object.keys(sources)) {
    const entry = sources[ing];
    const b = bounds[ing];
    const srcKeys = ['ams', 'bls', 'fred'].filter((k) => entry[k]);
    const results = {};
    for (const k of srcKeys) results[k] = await probe(k, entry[k]);

    const lines = srcKeys.map((k) => {
      const r = results[k];
      if (!r.ok) return `${k} ✗ ${r.err}`;
      let note = `${r.n} pts, latest ${r.latest}`;
      if (r.level && b) {
        const cents = Math.round(r.latest * 100);
        const inBand = cents >= b.minCents && cents <= b.maxCents;
        note += inBand ? ' (in bounds)' : ` (OUT of bounds [${b.minCents / 100}–${b.maxCents / 100}])`;
      }
      return `${k} ✓ ${note}`;
    });

    const allOk = srcKeys.every((k) => results[k].ok);
    const levelOk = srcKeys.some((k) => results[k].ok && results[k].level && b &&
      Math.round(results[k].latest * 100) >= b.minCents && Math.round(results[k].latest * 100) <= b.maxCents);
    const isReady = allOk && levelOk;
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
