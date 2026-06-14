#!/usr/bin/env node
/**
 * check-pressure-freshness.mjs — heartbeat monitor for the PRESSURE overlay.
 *
 * Sibling to check-cost-index-freshness.mjs, for the other refresh track. The
 * pressure overlay refreshes on the weekly cron (cost-pressure-refresh.yml, live
 * mode). That job fails SILENTLY too: if a key lapses or every source is down it
 * keeps last-good directions and exits 0 — so the inferred overlay freezes at stale
 * "where it's headed" reads with no alarm. This makes that staleness LOUD.
 *
 * It measures the age of the freshest dated pressure read (newest asOf in
 * data/pressure-history.json) against a threshold. Two call sites:
 *   - check-all (no flag) → status, always exit 0 (informational; the overlay ages
 *     naturally between weekly runs, so it must never block a PR).
 *   - weekly refresh, AFTER the keyed live fetch (--check) → exit non-zero when the
 *     overlay is older than the threshold, turning the scheduled run RED (the alert).
 *
 * Threshold: PRESSURE_MAX_AGE_DAYS (default 21 = three weekly cycles, so a missed
 * run or two is tolerated but a persistent stall alarms — the overlay is inferred
 * and slower-moving than the measured index, hence looser than its 14d).
 *
 *   node scripts/check-pressure-freshness.mjs            # status, exit 0
 *   node scripts/check-pressure-freshness.mjs --check     # exit 1 if stale
 *   node scripts/check-pressure-freshness.mjs --self-test
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(repoRoot, 'data/pressure-history.json');
const MAX_AGE_DAYS = Number(process.env.PRESSURE_MAX_AGE_DAYS || 21);

// Newest dated pressure read across every ingredient's history — the age of the
// freshest inferred direction the overlay is currently serving.
export function newestAsOf(json) {
  let newest = null;
  const consider = (d) => { if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && (!newest || d > newest)) newest = d; };
  const items = (json && json.items) || {};
  for (const hist of Object.values(items)) {
    for (const rec of (Array.isArray(hist) ? hist : [])) consider(rec && (rec.asOf || rec.anchor));
  }
  return newest;
}

export function ageDays(asOf, now = Date.now()) {
  if (!asOf) return Infinity;
  return Math.floor((now - Date.parse(asOf + 'T00:00:00Z')) / 86400000);
}

function run(check) {
  let json;
  try { json = JSON.parse(readFileSync(DATA, 'utf8')); }
  catch { console.log('pressure freshness: no data/pressure-history.json yet — nothing to monitor (OK).'); return 0; }
  const asOf = newestAsOf(json);
  if (!asOf) {
    console.log('pressure freshness: no dated reads yet (preview/empty — OK).');
    return 0;
  }
  const age = ageDays(asOf);
  const stale = age > MAX_AGE_DAYS;
  const msg = `pressure freshness: freshest inferred read as of ${asOf} (${age}d old); threshold ${MAX_AGE_DAYS}d — ${stale ? 'STALE' : 'fresh'}.`;
  if (stale && check) {
    console.log(`::error::${msg} The weekly pressure heartbeat is not landing current data — check API keys / source health.`);
    console.error(msg);
    return 1;
  }
  console.log(msg);
  return 0;
}

function selfTest() {
  const assert = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exitCode = 1; } };
  const NOW = Date.parse('2026-06-13T00:00:00Z');
  assert(newestAsOf({ items: { a: [{ asOf: '2026-06-01' }, { asOf: '2026-06-10' }] } }) === '2026-06-10', 'newest across one ingredient');
  assert(newestAsOf({ items: { a: [{ asOf: '2026-05-01' }], b: [{ asOf: '2026-06-08' }] } }) === '2026-06-08', 'newest across ingredients');
  assert(newestAsOf({ items: { a: [{ anchor: '2026-06-05' }] } }) === '2026-06-05', 'falls back to anchor when no asOf');
  assert(newestAsOf({ items: {} }) === null, 'empty → null');
  assert(newestAsOf({}) === null, 'no items → null');
  assert(ageDays('2026-06-12', NOW) === 1, 'age 1 day');
  assert(ageDays('2026-05-23', NOW) === 21, 'age 21 days');
  assert(ageDays(null) === Infinity, 'no date → infinite age');
  console.log(process.exitCode ? 'pressure freshness self-test: FAILURES above.' : 'pressure freshness self-test: 8/8 passed.');
  return process.exitCode || 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest());
  process.exit(run(process.argv.includes('--check')));
}
