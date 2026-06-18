#!/usr/bin/env node
/**
 * build-cost-confidence-calibration.mjs — does the user-facing CONFIDENCE LABEL earn its keep?
 *
 * calibration.json already proves the band METHOD covers and the trend arrow's SIGNAL-STRENGTH
 * tiers are ordered. This proves a different, user-facing thing: that the label a reader sees on
 * a card — directional / low / medium / high — actually tracks realized accuracy. It groups every
 * backtestable ingredient by its PUBLISHED confidence label and reports, per label, the realized
 * conformal band coverage and the realized trend hit-rate. If the labels are principled, a higher
 * label verifies more often; if they don't, that's an honest finding (and a Track-B signal), not a
 * hidden one.
 *
 * PURE & DETERMINISTIC (no `now`), mirroring build-cost-index-calibration-report.mjs. Reads the
 * shared modules; changes none of them (parity-safe). --check pins it; --self-test asserts
 * structure + monotonicity where the tiers are powered enough to claim it.
 *
 *   node scripts/build-cost-confidence-calibration.mjs            # write the report
 *   node scripts/build-cost-confidence-calibration.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-confidence-calibration.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { conformalNext } = require(path.join(repo, 'tools/_shared/cost-conformal.js'));
const { reliabilityCurve } = require(path.join(repo, 'tools/_shared/cost-reliability.js'));
const OUT = path.join(repo, 'data/cost-confidence-calibration.json');
const PUBLIC_OUT = path.join(repo, 'cost-index/confidence-calibration.json');

const ALPHA = 0.20, WINDOW = 52;
const TIER_ORDER = ['directional', 'low', 'medium', 'high'];   // rank = index; higher should verify more
const MIN_STEPS = 12;     // need >=12 scored steps to state a band-coverage rate
const MIN_ITEMS = 4;      // a tier needs >=4 backtestable items before we assert it in a trend
const r3 = (x) => Math.round(x * 1000) / 1000;

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }

// Same series resolution the calibration report uses (deep history first, else vendored history).
function seriesFor(key, deep, ci) {
  const d = deep && deep.ingredients && deep.ingredients[key];
  if (Array.isArray(d) && d.length >= 14) return d.map((p) => p.valueCents).filter((x) => typeof x === 'number');
  const v = ci && ci.ingredients && ci.ingredients[key];
  const h = (v && v.history) || (v && v.points && v.points[0] && v.points[0].history) || [];
  return h.map((p) => p.valueCents).filter((x) => typeof x === 'number');
}
function confidenceOf(ci, key) {
  const v = ci.ingredients[key];
  const p = v && v.points && v.points[0];
  return (p && p.confidence) || (v && v.confidence) || null;
}

function build() {
  const ci = rd('data/cost-index.json'), deep = rd('data/cost-index-history.json');
  const keys = ci && ci.ingredients ? Object.keys(ci.ingredients) : [];

  // accumulators per published tier
  const acc = {};
  for (const t of TIER_ORDER) acc[t] = { items: 0, bandItems: 0, bandSteps: 0, bandHits: 0, trendItems: 0, calls: 0, hits: 0, up: 0, down: 0 };

  for (const k of keys) {
    const tier = confidenceOf(ci, k);
    if (!acc[tier]) continue;                 // skip null / unknown labels
    acc[tier].items++;
    const series = seriesFor(k, deep, ci);
    const band = conformalNext(series, { alpha: ALPHA, window: WINDOW, calibrate: true });
    if (band && band.coverage != null && band.nTested >= MIN_STEPS) {
      acc[tier].bandItems++; acc[tier].bandSteps += band.nTested; acc[tier].bandHits += Math.round(band.coverage * band.nTested);
    }
    const rel = reliabilityCurve(series);
    if (rel) {
      acc[tier].trendItems++; acc[tier].calls += rel.n; acc[tier].hits += rel.hits; acc[tier].up += rel.up; acc[tier].down += rel.down;
    }
  }

  const tiers = TIER_ORDER.map((t, rank) => {
    const a = acc[t];
    const cov = a.bandSteps >= MIN_STEPS ? r3(a.bandHits / a.bandSteps) : null;
    const hit = a.calls >= MIN_STEPS ? r3(a.hits / a.calls) : null;
    const base = a.up + a.down ? r3(Math.max(a.up, a.down) / (a.up + a.down)) : null;
    return {
      tier: t, rank, items: a.items,
      band: { items: a.bandItems, scoredSteps: a.bandSteps, coverage: cov },
      trend: { items: a.trendItems, calls: a.calls, hitRate: hit, baseline: base, lift: hit != null && base != null ? r3(hit - base) : null },
    };
  });

  // Monotonicity: among tiers powered enough (items >= MIN_ITEMS and a non-null metric),
  // does the metric not DECREASE as the label rank rises? (tolerance for noise.)
  const TOL = 0.07;
  const mono = (pick) => {
    const pts = tiers.filter((t) => t.items >= MIN_ITEMS && pick(t) != null).map((t) => ({ rank: t.rank, v: pick(t) }));
    if (pts.length < 2) return { powered: pts.length, monotone: null };   // can't claim
    let ok = true;
    for (let i = 1; i < pts.length; i++) if (pts[i].v < pts[i - 1].v - TOL) ok = false;
    return { powered: pts.length, monotone: ok };
  };
  const bandMono = mono((t) => t.band.coverage);
  const trendMono = mono((t) => t.trend.hitRate);

  return {
    _doc: 'Does the published confidence LABEL track realized accuracy? Every backtestable ingredient is grouped by the label it ships with (directional/low/medium/high); per label we report realized conformal band coverage and realized trend hit-rate. A higher label should verify at least as often as a lower one. Built deterministically from the price history by scripts/build-cost-confidence-calibration.mjs; reads the shared modules, changes none. Re-checked on every build.',
    _version: 1,
    nominal: 1 - ALPHA,
    byPublishedConfidence: tiers,
    monotonicity: { band: bandMono, trend: trendMono, tolerance: TOL, note: 'monotone=null means too few powered tiers to claim ordering yet (a coverage limitation, not a failure).' },
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    const t = report.byPublishedConfidence;
    const checks = [
      ['all four tiers present, ranked', t.length === 4 && t.every((x, i) => x.rank === i)],
      ['coverages in [0,1] or null', t.every((x) => x.band.coverage == null || (x.band.coverage >= 0 && x.band.coverage <= 1))],
      ['hit-rates in [0,1] or null', t.every((x) => x.trend.hitRate == null || (x.trend.hitRate >= 0 && x.trend.hitRate <= 1))],
      ['band monotone where powered (or unpowered)', report.monotonicity.band.monotone !== false],
      ['trend monotone where powered (or unpowered)', report.monotonicity.trend.monotone !== false],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`confidence-calibration self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let cur = '', pub = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    try { pub = readFileSync(PUBLIC_OUT, 'utf8'); } catch {}
    if (cur !== json || pub !== json) { console.error('✗ confidence-calibration report is stale — run: node scripts/build-cost-confidence-calibration.mjs'); process.exit(1); }
    console.log('✓ confidence-calibration report in sync (data/ + public copy).');
    return;
  }

  writeFileSync(OUT, json);
  writeFileSync(PUBLIC_OUT, json);
  const line = report.byPublishedConfidence.map((t) => `${t.tier}:${t.items}${t.band.coverage != null ? ` band ${(t.band.coverage * 100).toFixed(0)}%` : ''}${t.trend.hitRate != null ? ` trend ${(t.trend.hitRate * 100).toFixed(0)}%` : ''}`).join(' | ');
  console.log(`Wrote confidence-calibration — ${line}`);
  console.log(`  monotone: band=${report.monotonicity.band.monotone} (${report.monotonicity.band.powered} powered), trend=${report.monotonicity.trend.monotone} (${report.monotonicity.trend.powered} powered)`);
}

main();
