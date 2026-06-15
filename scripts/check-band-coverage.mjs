/**
 * check-band-coverage.mjs — proves the Cost Index's prediction bands are HONEST:
 * a conformal interval is only trustworthy if, walked forward over real history, it
 * covers the next print at (about) the rate it claims. This gate computes the
 * backtested coverage of the 80% conformal band for every ingredient with enough
 * deep history and FAILS if the aggregate realized coverage drifts away from
 * nominal — i.e. it stops us ever publishing "80% band" unless 80% is true.
 *
 * Run:  node scripts/check-band-coverage.mjs            # report + gate
 *       node scripts/check-band-coverage.mjs --self-test
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { conformalNext } = require(path.join(repo, 'tools/_shared/cost-conformal.js'));

const ALPHA = 0.20, NOMINAL = 1 - ALPHA;     // 80% band
const WINDOW = 52;                            // ~1yr of weekly residuals
const TOL = 0.10;                             // aggregate realized must be within ±10pp of nominal
const MIN_ITEMS = 8;                          // need a few verifiable items before asserting

function rd(p) { try { return JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }

// Best available chronological cents series per ingredient: prefer the deep
// backfill store, fall back to the vendored capped history.
function seriesFor(key, deep, ci) {
  const d = deep && deep.ingredients && deep.ingredients[key];
  if (Array.isArray(d) && d.length >= 14) return d.map((p) => p.valueCents).filter((x) => typeof x === 'number');
  const v = ci && ci.ingredients && ci.ingredients[key];
  const h = (v && v.history) || (v && v.points && v.points[0] && v.points[0].history) || [];
  return h.map((p) => p.valueCents).filter((x) => typeof x === 'number');
}

function evaluate() {
  const ci = rd('data/cost-index.json'), deep = rd('data/cost-index-history.json');
  const keys = ci && ci.ingredients ? Object.keys(ci.ingredients) : [];
  const rows = [];
  for (const k of keys) {
    const s = seriesFor(k, deep, ci);
    const r = conformalNext(s, { alpha: ALPHA, window: WINDOW });
    if (r && r.coverage != null) rows.push({ k, coverage: r.coverage, nTested: r.nTested });
  }
  // Pooled coverage = total hits / total scored steps (weights longer series more).
  const totTested = rows.reduce((a, r) => a + r.nTested, 0);
  const totHits = rows.reduce((a, r) => a + Math.round(r.coverage * r.nTested), 0);
  const pooled = totTested ? totHits / totTested : null;
  return { rows, pooled, totTested };
}

function selfTest() {
  // A clean random walk's 80% band must backtest near 80%.
  let seed = 5; const rng = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const v = [1000]; for (let i = 1; i < 400; i++) v.push(Math.max(1, Math.round(v[i - 1] + (rng() - 0.5) * 80)));
  const r = conformalNext(v, { alpha: ALPHA, window: WINDOW });
  const checks = [
    ['random-walk 80% band backtests near 0.80', r.coverage >= NOMINAL - TOL && r.coverage <= NOMINAL + TOL],
    ['coverage null on short series', conformalNext([1, 2, 3], {}) === null],
    ['50% band tracks ~0.50', (() => { let s2 = 9; const g = () => { s2 |= 0; s2 = (s2 + 0x6D2B79F5) | 0; let t = Math.imul(s2 ^ (s2 >>> 15), 1 | s2); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; const w = [1000]; for (let i = 1; i < 400; i++) w.push(Math.max(1, Math.round(w[i - 1] + (g() - 0.5) * 80))); const rr = conformalNext(w, { alpha: 0.5, window: WINDOW }); return rr.coverage >= 0.40 && rr.coverage <= 0.60; })()],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`band-coverage self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();

const { rows, pooled, totTested } = evaluate();
if (rows.length < MIN_ITEMS) {
  console.log(`Band coverage: only ${rows.length} ingredient(s) have enough deep history to verify (need ${MIN_ITEMS}). Run the deep backfill (COST_INDEX_SERIES_DAYS) — gate is informational until then.`);
  process.exit(0);
}
const lo = NOMINAL - TOL, hi = NOMINAL + TOL;
const ok = pooled >= lo && pooled <= hi;
const worst = rows.slice().sort((a, b) => a.coverage - b.coverage).slice(0, 5)
  .map((r) => `${r.k} ${(r.coverage * 100).toFixed(0)}%`).join(', ');
console.log(`Band coverage: ${rows.length} ingredient(s), ${totTested} scored steps · pooled realized coverage of the ${NOMINAL * 100}% band = ${(pooled * 100).toFixed(1)}% (target ${lo * 100}–${hi * 100}%).`);
console.log(`  lowest-covering: ${worst}`);
if (!ok) { console.error(`✗ pooled coverage ${(pooled * 100).toFixed(1)}% is outside ${lo * 100}–${hi * 100}% — the published band claim does not hold; widen the interval or label it provisionally.`); process.exit(1); }
console.log(`✓ the ${NOMINAL * 100}% band's realized coverage holds — the claim is earned.`);
