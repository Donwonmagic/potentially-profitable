#!/usr/bin/env node
/**
 * build-cost-anomaly-log.mjs — a deterministic anomaly record for the Cost Index history.
 *
 * Runs the robust detectors (cost-anomaly.js: Hampel point-outliers + Pettitt regime breaks)
 * over every ingredient's committed price history and publishes what they find. It classifies
 * HISTORICAL prints only — no forward claim, no price asserted — so the "no forecast" promise
 * holds. Thresholds are labeled-illustrative internal calibration. This ships to no page (a
 * research/QA artifact, like cost-forecast-backtest.json); it makes the index's outlier
 * handling auditable rather than invisible.
 *
 * PURE & DETERMINISTIC (no `now`), mirroring backtest-cost-forecast.mjs.
 *   node scripts/build-cost-anomaly-log.mjs            # write the log
 *   node scripts/build-cost-anomaly-log.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-anomaly-log.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { detect } = require(path.join(repo, 'tools/_shared/cost-anomaly.js'));
const OUT = path.join(repo, 'data/cost-anomaly-log.json');

const HAMPEL = { k: 3, nSigma: 4 };   // 4 robust sigmas: conservative, low false-alarm on weekly prints
const PETTITT = { minN: 12, alpha: 0.05 };

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }

// Ordered {date, valueCents} series per ingredient (same shape backtest-cost-forecast uses).
function historySeries(hist) {
  const out = {};
  const ing = (hist && hist.ingredients) || {};
  for (const k of Object.keys(ing)) {
    const arr = Array.isArray(ing[k]) ? ing[k] : [];
    const pts = arr.filter((p) => p && typeof p.valueCents === 'number' && typeof p.date === 'string');
    if (pts.length) out[k] = pts;
  }
  return out;
}

function build() {
  const series = historySeries(rd('data/cost-index-history.json'));
  const keys = Object.keys(series).sort();
  let withHistory = 0, pointOutliers = 0, regimeBreaks = 0;
  const items = [];
  for (const key of keys) {
    const pts = series[key];
    const vals = pts.map((p) => p.valueCents);
    const d = detect(vals, { hampel: HAMPEL, pettitt: PETTITT });
    if (d.n >= 4) withHistory++;
    const outs = [];
    d.hampel.flags.forEach((f, i) => { if (f === 1) outs.push({ index: i, date: pts[i].date, valueCents: pts[i].valueCents, score: d.hampel.scores[i] }); });
    pointOutliers += outs.length;
    let cp = null;
    if (d.changePoint) {
      const i = d.changePoint.index;
      cp = { index: i, date: pts[i] ? pts[i].date : null, K: d.changePoint.K, pApprox: d.changePoint.pApprox, significant: d.changePoint.significant };
      if (cp.significant) regimeBreaks++;
    }
    items.push({ key, n: d.n, pointOutliers: outs, changePoint: cp });
  }
  return {
    _doc: 'Deterministic anomaly record for the Cost Index. Per ingredient: Hampel rolling-MAD point-outlier flags and a Pettitt single regime-break date, computed over the committed public price history. Historical classification only — no price asserted, no forecast. Thresholds (k, nSigma, alpha) are illustrative internal calibration. Built by scripts/build-cost-anomaly-log.mjs; ships to no page; CI re-checks with --check. HONESTY CAVEAT (stats-audit 2026-07, C4): the Pettitt `significant` flag is a RAW, uncorrected diagnostic, NOT an established market step. Pettitt\'s i.i.d.-no-change null is violated by near-unit-root price-LEVEL series, so the test fires on a large majority of driftless/trending items that contain no real step (~64–98% of shipped series), with no effect-size floor and no cross-ingredient multiplicity control. Treat the regime-break count as internal research only; do NOT surface a market-wide "step"/"stepped up around {date}" claim on any page without first-differencing, a step-vs-trend model check (BIC), a volatility-scaled magnitude floor, a block-bootstrap null, and BH/BY correction (charter P0-3). The Vendor Benchmark\'s regimeBreakBlock is already gated off for the same reason.',
    _version: 1,
    source: { history: 'data/cost-index-history.json' },
    params: { hampel: HAMPEL, pettitt: PETTITT },
    summary: { ingredients: keys.length, withHistory, pointOutliers, regimeBreaks },
    items,
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    const checks = [
      ['summary present', report.summary && typeof report.summary.ingredients === 'number'],
      ['every hampel score >= 0', report.items.every((it) => it.pointOutliers.every((o) => o.score >= 0))],
      ['every outlier index in range', report.items.every((it) => it.pointOutliers.every((o) => o.index >= 0 && o.index < it.n + it.pointOutliers.length + 1))],
      ['changePoint pApprox in [0,1] or null', report.items.every((it) => !it.changePoint || (it.changePoint.pApprox >= 0 && it.changePoint.pApprox <= 1))],
      ['counts reconcile', report.summary.pointOutliers === report.items.reduce((a, it) => a + it.pointOutliers.length, 0)],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-anomaly-log self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let cur = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    if (cur !== json) { console.error('✗ anomaly log is stale — run: node scripts/build-cost-anomaly-log.mjs'); process.exit(1); }
    console.log('✓ anomaly log in sync with the data.');
    return;
  }

  writeFileSync(OUT, json);
  const s = report.summary;
  console.log(`Wrote data/cost-anomaly-log.json — ${s.ingredients} ingredient(s), ${s.pointOutliers} point-outlier(s), ${s.regimeBreaks} significant regime break(s).`);
}

main();
