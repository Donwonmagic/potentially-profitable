#!/usr/bin/env node
/**
 * backtest-cost-forecast.mjs — does a FORWARD forecast earn the right to be published?
 *
 * The shipped calibration record (build-cost-index-calibration-report.mjs) only proves
 * the ONE-step band and the one-step arrow. Two frontier ideas want more before they go
 * near a page:
 *
 *   (1) "The forecast that grades itself" — a forward CONE at horizon h, not just next
 *       print. So we extend the same honest machinery to h steps: a random-walk centre
 *       with the empirical quantiles of recent h-step residuals (reusing the conformal
 *       module's `quantile`), walk-forward, and ask whether the band still COVERS and the
 *       direction still beats the no-skill majority baseline as h grows. Where it stops
 *       beating baseline is exactly how far an honest cone may reach.
 *
 *   (2) "Term structure of cost" — does the SEASONAL monthly-median curve (seasonality.json)
 *       call the sign of the next move better than naive persistence? Calendar-month aware,
 *       so it is robust to the mixed publish cadence across items.
 *
 * PURE & DETERMINISTIC (no `now`, no randomness) so --check can pin it in CI, mirroring
 * build-cost-index-calibration-report.mjs. This writes a REPORT only — it ships nothing to
 * a page. The `verdict` block is the go/no-go: publish a cone only as far as it clears
 * baseline, and add a seasonal line only if seasonal beats persistence.
 *
 *   node scripts/backtest-cost-forecast.mjs            # write the report
 *   node scripts/backtest-cost-forecast.mjs --check    # CI: fail if stale
 *   node scripts/backtest-cost-forecast.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { quantile } = require(path.join(repo, 'tools/_shared/cost-conformal.js'));
const { directionCall } = require(path.join(repo, 'tools/_shared/cost-reliability.js'));
const OUT = path.join(repo, 'data/cost-forecast-backtest.json');

const ALPHA = 0.20;              // 80% cone, matching the published band
const HORIZONS = [1, 2, 3, 4];   // steps ahead (publish cadence varies by item — see _doc)
const MIN_RESID = 8;             // need >=8 h-step residuals before forming a band
const MIN_STEPS = 12;            // need >=12 scored steps to state a rate (pooled per horizon)

const r3 = (x) => Math.round(x * 1000) / 1000;
const sgn = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }
function cleanNums(a) { return (a || []).filter((x) => typeof x === 'number' && isFinite(x)); }

// Ordered {date, valueCents} series per ingredient, oldest→newest.
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

// (1) Walk-forward h-step cone: pooled band coverage + directional skill vs baseline.
function coneAtHorizon(seriesByKey, h) {
  let items = 0, steps = 0, hits = 0;            // band coverage
  let dItems = 0, dScored = 0, dHits = 0, up = 0, down = 0;   // direction
  for (const k of Object.keys(seriesByKey)) {
    const v = cleanNums(seriesByKey[k].map((p) => p.valueCents));
    if (v.length < MIN_RESID + h + 2) continue;
    let usedBand = false, usedDir = false;
    // earliest t with >=MIN_RESID prior h-step residuals: need (t - h) >= MIN_RESID
    for (let t = MIN_RESID + h; t + h < v.length; t++) {
      const resid = [];
      for (let i = 0; i + h <= t; i++) resid.push(v[i + h] - v[i]);
      if (resid.length < MIN_RESID) continue;
      const s = resid.slice().sort((a, b) => a - b);
      const lo = v[t] + quantile(s, ALPHA / 2);
      const hi = v[t] + quantile(s, 1 - ALPHA / 2);
      const actual = v[t + h];
      steps++; usedBand = true;
      if (actual >= lo && actual <= hi) hits++;

      const call = directionCall(v.slice(0, t + 1));
      const realized = sgn(actual - v[t]);
      if (call && call.dir !== 0 && realized !== 0) {
        dScored++; usedDir = true;
        if (realized > 0) up++; else down++;
        if (call.dir === realized) dHits++;
      }
    }
    if (usedBand) items++;
    if (usedDir) dItems++;
  }
  const baseline = up + down ? Math.max(up, down) / (up + down) : null;
  const hitRate = dScored ? dHits / dScored : null;
  return {
    h,
    items,
    scoredSteps: steps,
    bandCoverage: steps >= MIN_STEPS ? r3(hits / steps) : null,
    direction: {
      items: dItems,
      scored: dScored,
      hitRate: dScored >= MIN_STEPS ? r3(hitRate) : null,
      baseline: baseline == null ? null : r3(baseline),
      lift: dScored >= MIN_STEPS && baseline != null ? r3(hitRate - baseline) : null,
      beatsBaseline: dScored >= MIN_STEPS && baseline != null ? hitRate > baseline : null,
    },
  };
}

// (2) Seasonal term structure: seasonal monthly-median direction vs persistence vs majority.
// Each method is scored on ITS OWN callable steps (a method must not be charged a miss on a
// step where it abstains) — so seasonal coverage and persistence coverage are reported on
// their own denominators, not a shared one that would understate whichever abstains more.
function seasonalTermStructure(seriesByKey, seasonality) {
  const ready = {};
  for (const e of (seasonality && seasonality.ingredients) || []) {
    if (e && e.ready && e.months) ready[e.key] = e.months;
  }
  const monthOf = (date) => date.slice(5, 7);     // "MM" — matches seasonality month keys
  let items = 0;
  let sScored = 0, sHits = 0, up = 0, down = 0;   // seasonal, scored on seasonal-callable steps
  let pScored = 0, pHits = 0;                       // persistence, scored on its own callable steps
  // Head-to-head on steps where BOTH call: the decisive test of whether seasonality adds
  // anything OVER momentum. On steps where they DISAGREE, who is right more often?
  let bothScored = 0, disagree = 0, sWinDisagree = 0, pWinDisagree = 0;
  for (const k of Object.keys(seriesByKey)) {
    const months = ready[k];
    if (!months) continue;
    const pts = seriesByKey[k];
    if (pts.length < 4) continue;
    let used = false;
    for (let t = 1; t + 1 < pts.length; t++) {
      const mNow = monthOf(pts[t].date), mNext = monthOf(pts[t + 1].date);
      const sNow = months[mNow], sNext = months[mNext];
      const realized = sgn(pts[t + 1].valueCents - pts[t].valueCents);
      if (realized === 0) continue;               // flat next step = push, not a call for anyone
      const persistDir = sgn(pts[t].valueCents - pts[t - 1].valueCents);
      const seasonalDir = (sNow && sNext) ? sgn(sNext.medianCents - sNow.medianCents) : 0;
      if (persistDir !== 0) { pScored++; if (persistDir === realized) pHits++; }
      if (seasonalDir !== 0) {
        sScored++; used = true;
        if (realized > 0) up++; else down++;
        if (seasonalDir === realized) sHits++;
      }
      if (seasonalDir !== 0 && persistDir !== 0) {
        bothScored++;
        if (seasonalDir !== persistDir) {
          disagree++;
          if (seasonalDir === realized) sWinDisagree++;
          else if (persistDir === realized) pWinDisagree++;
        }
      }
    }
    if (used) items++;
  }
  const majority = up + down ? Math.max(up, down) / (up + down) : null;  // baseline over seasonal-callable steps
  const seasonalRate = sScored ? sHits / sScored : null;
  const persistRate = pScored ? pHits / pScored : null;
  const enough = sScored >= MIN_STEPS && pScored >= MIN_STEPS;
  // On disagreements, seasonal's win share (vs persistence). >0.5 means seasonality carries
  // signal momentum doesn't; ~0.5 means the seasonal line adds nothing over the trend arrow.
  const seasonalWinOnDisagree = disagree >= MIN_STEPS ? sWinDisagree / disagree : null;
  return {
    items,
    seasonal: { hitRate: sScored >= MIN_STEPS ? r3(seasonalRate) : null, scored: sScored },
    persistence: { hitRate: pScored >= MIN_STEPS ? r3(persistRate) : null, scored: pScored },
    majorityBaseline: majority == null ? null : r3(majority),
    headToHead: {
      bothCalled: bothScored,
      disagreements: disagree,
      seasonalWinOnDisagree: seasonalWinOnDisagree == null ? null : r3(seasonalWinOnDisagree),
      addsSignalOverMomentum: seasonalWinOnDisagree == null ? null : seasonalWinOnDisagree > 0.5,
    },
    seasonalBeatsPersistence: enough ? seasonalRate > persistRate : null,
    seasonalBeatsBaseline: sScored >= MIN_STEPS && majority != null ? seasonalRate > majority : null,
  };
}

function build() {
  const hist = rd('data/cost-index-history.json');
  const seasonality = rd('data/seasonality.json');
  const seriesByKey = historySeries(hist);
  const cones = HORIZONS.map((h) => coneAtHorizon(seriesByKey, h));
  const seasonal = seasonalTermStructure(seriesByKey, seasonality);

  // verdict: how far an honest cone reaches (coverage near nominal AND direction beats
  // baseline), and whether the seasonal line earns a place.
  const nominal = 1 - ALPHA;
  let coneHonestThroughH = 0;
  for (const c of cones) {
    const covers = c.bandCoverage != null && c.bandCoverage >= nominal - 0.05;
    const beats = c.direction.beatsBaseline === true;
    if (covers && beats) coneHonestThroughH = c.h; else break;
  }

  return {
    _doc: 'Walk-forward backtest deciding whether a forward forecast may be published. (1) horizonCone: pooled h-step band coverage + directional skill vs majority baseline; horizons are PUBLISH-STEPS and item cadence varies (some weekly, some monthly) — read as "h prints ahead", not a fixed calendar window. (2) seasonalTermStructure: calendar-month-aware seasonal direction vs persistence. Built by scripts/backtest-cost-forecast.mjs from committed public data; deterministic; CI re-checks with --check. Ships nothing to a page — the verdict block is the go/no-go.',
    _version: 1,
    source: { history: 'data/cost-index-history.json', seasonality: 'data/seasonality.json' },
    horizonCone: {
      method: 'random-walk centre + empirical h-step residual quantiles (reuses cost-conformal quantile); direction reuses cost-reliability directionCall; walk-forward, pooled across items',
      nominal,
      horizons: cones,
    },
    seasonalTermStructure: {
      method: 'seasonal monthly-median direction vs realized next-step sign, calendar-month aware; compared to persistence and majority baseline',
      ...seasonal,
    },
    verdict: {
      coneHonestThroughH,
      // The seasonal line earns a page only if it beats baseline AND carries signal the trend
      // arrow doesn't — i.e. wins the head-to-head on steps where it disagrees with momentum.
      seasonalUseful:
        seasonal.seasonalBeatsBaseline === true &&
        seasonal.headToHead.addsSignalOverMomentum === true,
    },
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    const cones = report.horizonCone.horizons;
    const checks = [
      ['has all horizons', cones.length === HORIZONS.length],
      ['coverages in [0,1] or null', cones.every((c) => c.bandCoverage == null || (c.bandCoverage >= 0 && c.bandCoverage <= 1))],
      ['direction hitRate in [0,1] or null', cones.every((c) => c.direction.hitRate == null || (c.direction.hitRate >= 0 && c.direction.hitRate <= 1))],
      ['1-step coverage near nominal', cones[0].bandCoverage == null || cones[0].bandCoverage >= report.horizonCone.nominal - 0.1],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`forecast-backtest self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let cur = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    if (cur !== json) { console.error('✗ forecast backtest is stale — run: node scripts/backtest-cost-forecast.mjs'); process.exit(1); }
    console.log('✓ forecast backtest in sync with the data.');
    return;
  }

  writeFileSync(OUT, json);
  const c1 = report.horizonCone.horizons[0];
  const st = report.seasonalTermStructure;
  console.log(`Wrote data/cost-forecast-backtest.json`);
  console.log(`  cone honest through h=${report.verdict.coneHonestThroughH} (1-step band ${c1.bandCoverage != null ? (c1.bandCoverage * 100).toFixed(1) + '%' : 'n/a'}, dir ${c1.direction.hitRate != null ? (c1.direction.hitRate * 100).toFixed(0) + '%' : 'n/a'} vs ${c1.direction.baseline != null ? (c1.direction.baseline * 100).toFixed(0) + '%' : 'n/a'} baseline)`);
  console.log(`  seasonal ${st.seasonal.hitRate != null ? (st.seasonal.hitRate * 100).toFixed(0) + '%' : 'n/a'} vs persistence ${st.persistence.hitRate != null ? (st.persistence.hitRate * 100).toFixed(0) + '%' : 'n/a'} vs ${st.majorityBaseline != null ? (st.majorityBaseline * 100).toFixed(0) + '%' : 'n/a'} baseline → useful: ${report.verdict.seasonalUseful}`);
}

main();
