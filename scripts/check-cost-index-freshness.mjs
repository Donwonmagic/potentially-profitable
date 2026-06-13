#!/usr/bin/env node
/**
 * check-cost-index-freshness.mjs — the heartbeat monitor.
 *
 * The Cost Index only earns trust if it is CURRENT. The weekly refresh
 * (.github/workflows/cost-index-refresh.yml) is the heartbeat, but it fails
 * SILENTLY: if the founder's API keys lapse or every source is transiently down,
 * the job keeps last-good data and exits 0 — so the surface slowly goes stale
 * with no alarm. This monitor makes staleness LOUD.
 *
 * It measures the age of the freshest vendored market read (newest point asOf)
 * against a threshold and reports. Two intended call sites:
 *   - check-all (no flag) → prints status, always exits 0 (informational; data
 *     ages naturally between weekly runs, so it must never block a PR).
 *   - weekly refresh, AFTER a keyed fetch (--check) → exits non-zero when the
 *     data is older than the threshold, turning the scheduled run RED so GitHub
 *     emails the founder. That red run IS the alert — no extra secrets needed.
 *
 * Threshold: COST_INDEX_MAX_AGE_DAYS (default 14 = two weekly cycles, so a single
 * missed run is tolerated but a persistent stall alarms).
 *
 * Usage:
 *   node scripts/check-cost-index-freshness.mjs            # status, exit 0
 *   node scripts/check-cost-index-freshness.mjs --check    # exit 1 if stale
 *   node scripts/check-cost-index-freshness.mjs --self-test # pin the logic
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(repoRoot, 'data/cost-index.json');
const MAX_AGE_DAYS = Number(process.env.COST_INDEX_MAX_AGE_DAYS || 14);

// Newest market-read date across every vendored point + driver — the age of the
// freshest insight the engine is currently serving.
export function newestAsOf(json) {
  let newest = null;
  const consider = (d) => { if (d && /^\d{4}-\d{2}-\d{2}$/.test(d) && (!newest || d > newest)) newest = d; };
  for (const ing of Object.values((json && json.ingredients) || {})) {
    for (const p of (ing && ing.points) || []) consider(p && p.asOf);
    for (const h of (ing && ing.history) || []) consider(h && h.date);
  }
  for (const d of Object.values((json && json.drivers) || {})) {
    for (const h of (d && d.history) || []) consider(h && h.date);
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
  catch { console.log('cost-index freshness: no data/cost-index.json yet — nothing to monitor (OK).'); return 0; }
  const asOf = newestAsOf(json);
  if (!asOf) {
    // No dated read at all. In preview/empty state this is expected, not a stall.
    console.log('cost-index freshness: no dated reads vendored yet (preview/empty — OK).');
    return 0;
  }
  const age = ageDays(asOf);
  const stale = age > MAX_AGE_DAYS;
  const msg = `cost-index freshness: freshest read as of ${asOf} (${age}d old); threshold ${MAX_AGE_DAYS}d — ${stale ? 'STALE' : 'fresh'}.`;
  if (stale && check) {
    // GitHub Actions annotation + non-zero so a scheduled run goes red (the alert).
    console.log(`::error::${msg} The weekly heartbeat is not landing current data — check API keys / source health.`);
    console.error(msg);
    return 1;
  }
  console.log(msg);
  return 0;
}

function selfTest() {
  const assert = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exitCode = 1; } };
  const NOW = Date.parse('2026-06-13T00:00:00Z');
  assert(newestAsOf({ ingredients: { a: { points: [{ asOf: '2026-06-01' }, { asOf: '2026-06-10' }] } } }) === '2026-06-10', 'newest across points');
  assert(newestAsOf({ ingredients: { a: { points: [{ asOf: '2026-05-01' }], history: [{ date: '2026-06-11' }] } } }) === '2026-06-11', 'history counts');
  assert(newestAsOf({ drivers: { diesel: { history: [{ date: '2026-06-12' }] } } }) === '2026-06-12', 'drivers count');
  assert(newestAsOf({}) === null, 'empty → null');
  assert(ageDays('2026-06-12', NOW) === 1, 'age 1 day');
  assert(ageDays('2026-05-30', NOW) === 14, 'age 14 days');
  assert(ageDays(null) === Infinity, 'no date → infinite age');
  console.log(process.exitCode ? 'freshness self-test: FAILURES above.' : 'freshness self-test: 7/7 passed.');
  return process.exitCode || 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest());
  process.exit(run(process.argv.includes('--check')));
}
