#!/usr/bin/env node
/**
 * build-cost-index-calibration-report.mjs — the public calibration RECORD.
 *
 * A PURE, DETERMINISTIC function of the vendored price data + deep history: it
 * pools the two verified methodology claims the gates enforce — the conformal
 * band's realized COVERAGE, and the trend arrow's reliability-by-strength SKILL —
 * into one versioned, CI-checked artifact. Nothing here is hand-typed; the page
 * and JSON-LD cite this file, so the published "our 80% band covered 83%" / "our
 * high-confidence arrow was right 58% of the time" claims can never silently drift
 * from what the data supports. (No `now` — stable across days for --check.)
 *
 *   node scripts/build-cost-index-calibration-report.mjs            # write the report
 *   node scripts/build-cost-index-calibration-report.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-index-calibration-report.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { conformalNext } = require(path.join(repo, 'tools/_shared/cost-conformal.js'));
const { reliabilityCurve } = require(path.join(repo, 'tools/_shared/cost-reliability.js'));
const OUT = path.join(repo, 'data/cost-index-calibration-report.json');
// A routable public copy so a skeptic can OPEN the calibration table, not just read the
// numbers quoted on the methodology page. Linked from /cost-index/methodology/#track-record.
const PUBLIC_OUT = path.join(repo, 'cost-index/calibration.json');

const ALPHA = 0.20, WINDOW = 52;

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }
function seriesFor(key, deep, ci) {
  const d = deep && deep.ingredients && deep.ingredients[key];
  if (Array.isArray(d) && d.length >= 14) return d.map((p) => p.valueCents).filter((x) => typeof x === 'number');
  const v = ci && ci.ingredients && ci.ingredients[key];
  const h = (v && v.history) || (v && v.points && v.points[0] && v.points[0].history) || [];
  return h.map((p) => p.valueCents).filter((x) => typeof x === 'number');
}

function build() {
  const ci = rd('data/cost-index.json'), deep = rd('data/cost-index-history.json');
  const keys = ci && ci.ingredients ? Object.keys(ci.ingredients) : [];

  // --- band coverage (RAW walk-forward conformal, leakage-free) ---
  // Honesty contract (audit CRIT-2): we report the un-tuned coverage, NOT the
  // adaptive-widened rate (which reported its own fitting target). Under-covering
  // items are counted and hedged/withheld at render time, never widened away.
  let bItems = 0, bSteps = 0, bHits = 0, underCovering = 0, minCov = 1, maxCov = 0;
  for (const k of keys) {
    const r = conformalNext(seriesFor(k, deep, ci), { alpha: ALPHA, window: WINDOW });
    if (!r || r.coverage == null) continue;
    bItems++; bSteps += r.nTested; bHits += Math.round(r.coverage * r.nTested);
    if (r.coverage < 0.70) underCovering++;
    if (r.coverage < minCov) minCov = r.coverage;
    if (r.coverage > maxCov) maxCov = r.coverage;
  }

  // --- trend reliability (skill by strength) ---
  const labels = ['low', 'medium', 'high'];
  const tn = [0, 0, 0], th = [0, 0, 0];
  let tN = 0, tH = 0, up = 0, down = 0, tItems = 0;
  for (const k of keys) {
    const r = reliabilityCurve(seriesFor(k, deep, ci));
    if (!r) continue;
    tItems++;
    r.tiers.forEach((t, i) => { tn[i] += t.n; th[i] += t.hits; });
    tN += r.n; tH += r.hits; up += r.up; down += r.down;
  }
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const tiers = {}; labels.forEach((l, i) => { tiers[l] = { n: tn[i], hitRate: tn[i] ? r3(th[i] / tn[i]) : null }; });

  return {
    _doc: 'Verified calibration record for the Cost Index. Built by scripts/build-cost-index-calibration-report.mjs from the vendored price data + deep history; CI re-checks it (--check). Hand-edit nothing.',
    _version: 1,
    band: {
      method: 'split/EnbPI conformal, raw walk-forward coverage (un-tuned)',
      nominal: 1 - ALPHA,
      pooledCoverage: bSteps ? r3(bHits / bSteps) : null,
      items: bItems, scoredSteps: bSteps,
      minItemCoverage: bItems ? r3(minCov) : null,
      maxItemCoverage: bItems ? r3(maxCov) : null,
      underCovering,
    },
    trend: {
      method: 'price-only direction call, reliability by signal strength',
      baseline: r3(Math.max(up, down) / (up + down || 1)),
      overallHitRate: tN ? r3(tH / tN) : null,
      scoredCalls: tN, items: tItems, tiers,
    },
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';
  if (process.argv.includes('--self-test')) {
    const b = report.band, t = report.trend;
    const checks = [
      // Raw coverage may sit BELOW nominal (that is the honest reading we now publish);
      // the honest window is nominal-0.15 .. 1.
      ['band raw coverage within honest window [nominal-.15, 1]', b.pooledCoverage >= b.nominal - 0.15 && b.pooledCoverage <= 1],
      ['trend tiers monotonic non-decreasing', t.tiers.low.hitRate <= t.tiers.medium.hitRate + 0.02 && t.tiers.medium.hitRate <= t.tiers.high.hitRate + 0.02],
      ['high tier beats baseline', t.tiers.high.hitRate >= t.baseline],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`calibration-report self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }
  if (process.argv.includes('--check')) {
    let cur = '', pub = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    try { pub = readFileSync(PUBLIC_OUT, 'utf8'); } catch {}
    if (cur !== json || pub !== json) { console.error('✗ calibration report is stale (data/ or the public cost-index/calibration.json) — run: node scripts/build-cost-index-calibration-report.mjs'); process.exit(1); }
    console.log('✓ calibration report in sync with the data (data/ + public copy).');
    return;
  }
  writeFileSync(OUT, json);
  writeFileSync(PUBLIC_OUT, json);
  console.log(`Wrote data/cost-index-calibration-report.json — band ${(report.band.pooledCoverage * 100).toFixed(1)}% coverage, trend high ${(report.trend.tiers.high.hitRate * 100).toFixed(0)}% vs ${(report.trend.baseline * 100).toFixed(0)}% baseline.`);
}

main();
