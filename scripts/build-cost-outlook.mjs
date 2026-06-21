#!/usr/bin/env node
/**
 * build-cost-outlook.mjs — the intelligence layer's published weekly outlook.
 *
 * Runs the Basket Forecast (tools/_shared/basket-forecast.js) over the declared
 * Restaurant Basket (data/cost-basket-weights.json) and writes the result as a
 * machine-readable artifact (data/cost-outlook.json) — the forward-looking,
 * honesty-gated companion to the measured cost-index/feed.json. Consumable by the
 * weekly dispatch, an answer engine, or a future no-fetch panel.
 *
 * Honesty is inherited from the modules it composes:
 *   - cost-pressure proven edges only (directional, no price);
 *   - the backtest verdict GOVERNS the reach (coneHonestThroughH) — if 0, the
 *     outlook is 'no-forward-call' and only the measured state is reported;
 *   - storability gates the lock/watch/feature actions;
 *   - nothing is ever a price or a guarantee.
 *
 * Deterministic: stamped from the data's own asOf, never wall-clock. Built like
 * the other cost-index artifacts; CI re-checks with --check; ships to no page.
 *
 *   node scripts/build-cost-outlook.mjs            # write data/cost-outlook.json
 *   node scripts/build-cost-outlook.mjs --check    # CI: exit 1 if stale
 *   node scripts/build-cost-outlook.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const repo = path.resolve(path.dirname(__filename), '..');
const require = createRequire(import.meta.url);
const FORECAST = require(path.join(repo, 'tools/_shared/basket-forecast.js'));

const OUT = path.join(repo, 'data', 'cost-outlook.json');
const rd = (p) => { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } };
const round = (n, d) => { const f = Math.pow(10, d); return Math.round(n * f) / f; };

function build() {
  const pressure = rd('data/cost-pressure.json');
  const backtest = rd('data/cost-forecast-backtest.json');
  const seasonality = rd('data/seasonality.json');
  const labels = rd('data/cost-index-labels.json');
  const weightsDoc = rd('data/cost-basket-weights.json');
  if (!pressure || !backtest || !weightsDoc) {
    return { _doc: 'inputs missing', _version: 1, error: 'missing-inputs' };
  }
  const weights = weightsDoc.weights || weightsDoc;
  const basketSlugs = Object.keys(weights).sort();
  const asOf = pressure.asOf || null;
  const month = asOf ? parseInt(String(asOf).slice(5, 7), 10) : null;

  const forecast = FORECAST.forecast({
    pressure: pressure, backtest: backtest, seasonality: seasonality,
    labels: labels, basketSlugs: basketSlugs, month: month
  });

  // Weighted tilt across the basket: +weight for a proven building edge, -weight
  // for easing, over the movers that cleared the forecast's bars. Range ~[-1,1];
  // a directional summary, never a price.
  const SIGN = { building: 1, easing: -1 };
  let tilt = 0, covered = 0;
  forecast.movers.forEach((m) => {
    const w = (typeof weights[m.slug] === 'number') ? weights[m.slug] : 0;
    if (SIGN[m.direction]) { tilt += SIGN[m.direction] * w; covered += w; }
  });
  const weightedTilt = covered > 0 ? round(tilt, 3) : 0;

  return {
    _doc: 'Published weekly cost OUTLOOK — the forward-looking companion to cost-index/feed.json. Basket Forecast (tools/_shared/basket-forecast.js) run over the declared Restaurant Basket (data/cost-basket-weights.json): a directional outlook gated to the backtest-validated reach (coneHonestThroughH), proven cost-pressure edges only, storability-aware actions. Directional only — never a price, never a guarantee, never forecast beyond what the backtest earns. Deterministic; stamped from the data asOf; ships to no page. Built by scripts/build-cost-outlook.mjs; CI re-checks with --check.',
    _version: 1,
    source: {
      pressure: 'data/cost-pressure.json', backtest: 'data/cost-forecast-backtest.json',
      seasonality: 'data/seasonality.json', basket: 'data/cost-basket-weights.json'
    },
    asOf: asOf,
    month: month,
    horizonHonest: forecast.horizonHonest,
    basket: basketSlugs,
    weightedTilt: weightedTilt,
    outlook: forecast.outlook,
    counts: forecast.counts,
    lockCandidates: forecast.lockCandidates,
    watchCandidates: forecast.watchCandidates,
    featureCandidates: forecast.featureCandidates,
    movers: forecast.movers,
    note: forecast.note
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    const checks = [
      ['inputs present', !report.error],
      ['movers stay within the basket', report.movers.every((m) => report.basket.indexOf(m.slug) >= 0)],
      ['no forecast beyond the validated reach', report.horizonHonest > 0 || report.outlook === 'no-forward-call'],
      ['weighted tilt in [-1,1]', report.weightedTilt >= -1 && report.weightedTilt <= 1],
      ['no price/level leaked into movers', report.movers.every((m) => !('priceCents' in m) && !('medianCents' in m))],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)]
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-outlook self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let cur = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    if (cur !== json) { console.error('✗ cost outlook is stale — run: node scripts/build-cost-outlook.mjs'); process.exit(1); }
    console.log('✓ cost outlook in sync with the data.');
    return;
  }

  writeFileSync(OUT, json);
  console.log(`cost-outlook: ${report.outlook} (tilt ${report.weightedTilt}); lock ${report.lockCandidates.length}, watch ${report.watchCandidates.length}, feature ${report.featureCandidates.length}; reach ${report.horizonHonest} print(s).`);
}

main();
