#!/usr/bin/env node
/**
 * check-cost-index-calibration.mjs — confidence calibration gate (P1 #36).
 *
 * Structurally governs precision: a published confidence may never exceed what
 * the underlying data supports. Confidence is the MIN of independent gates, so a
 * single weak gate caps the whole read — you cannot buy "high" with one strong
 * dimension while another is thin.
 *
 * Gates (each yields a maximum allowed confidence):
 *   - independence — distinct source TYPES in the provenance (NOT correlated
 *     markets). Six USDA-AMS terminals are one methodology: they widen the
 *     measured RANGE (families) but are a single type for confidence. >=2 types
 *     allow 'high'; exactly 1 caps at 'medium'; 0 → 'directional'.
 *   - completeness — length of the history series. >=12 reads allow 'high';
 *     >=8 cap at 'medium'; >=4 cap at 'low'; fewer → 'directional'.
 *   - agreement — the trend's cross-source agreement (when present). >=0.66
 *     allows 'high'; >=0.33 caps 'medium'; >0 caps 'low'.
 * The ceiling = min(gates). A point whose vendored confidence RANKS ABOVE its
 * ceiling is an overstatement.
 *
 * This is the storefront-side guard. Confidence itself is computed upstream by
 * the orchestrator's composite-price (parity-locked, in the Ledger repo); this
 * check re-derives the ceiling from the vendored provenance + history and only
 * READS — it never edits confidence. The fix for any flag is upstream.
 *
 * ROLLOUT: STRICT (fail-CI) as of the 2026-06-08 first live vendor — every
 * vendored confidence is within its data-supported ceiling, so any future
 * overstatement fails CI rather than just warning. Set COST_INDEX_WARN_ONLY=1
 * to temporarily downgrade to warn (e.g. while reconciling a new source).
 *
 * DEFERRED sub-part of #36: range-widening (rolling IQR/MAD feeding the level
 * range) is an orchestrator/pipeline change inside the parity-locked module, so
 * it is not done here.
 *
 *   node scripts/check-cost-index-calibration.mjs              # warn-only report
 *   node scripts/check-cost-index-calibration.mjs --self-test  # unit cases
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SELF_TEST = process.argv.includes('--self-test');

// Flip to true to make calibration overstatements fail CI (once the upstream
// orchestrator confidences are reconciled — see the `onion` note above).
const FAIL_ON_DRIFT = process.env.COST_INDEX_WARN_ONLY !== '1';   // strict by default; COST_INDEX_WARN_ONLY=1 → warn

const RANK = { directional: 0, low: 1, medium: 2, high: 3 };
const NAME = ['directional', 'low', 'medium', 'high'];

// Collapse a source id to its METHODOLOGY type. Terminals of one agency
// (usda-ams-boston, …-chicago) collapse to a single type — they are correlated
// markets, not independent sources.
export function sourceType(id) {
  const s = String(id || '');
  if (/^usda-ams/.test(s)) return 'ams';
  if (/^usda-lmr/.test(s) || /^lmr/.test(s)) return 'lmr';
  if (/^bls/.test(s)) return 'bls';
  if (/^fred/.test(s)) return 'fred';
  if (/^eia/.test(s)) return 'eia';
  if (/^noaa/.test(s)) return 'noaa';
  return s || 'unknown';
}

// Distinct independent TYPES among provenance of a given kind ('level' | 'trend').
// Correlated terminals collapse (usda-ams-boston / -chicago → 'ams'), so six
// markets are one methodology. Split by kind because a BLS/FRED index can
// corroborate the TREND but never sets a dollar LEVEL.
export function typeCount(point, kind) {
  return new Set((point.provenance || [])
    .filter((p) => !kind || p.kind === kind)
    .map((p) => p.type || sourceType(p.source))).size;   // explicit type; prefix-collapse only for legacy data
}
// Distinct weeks the history actually covers (epoch/7 buckets) — daily LMR/AMS
// rows over five weeks are five weekly TREND reads, not twenty-six.
export function historyWeeks(history) {
  const wk = new Set();
  (history || []).forEach((h) => { const t = Date.parse(h && h.date); if (isFinite(t)) wk.add(Math.floor(t / (7 * 86400000))); });
  return wk.size;
}
function med(xs) {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
// Robust relative dispersion of the per-TYPE level medians (1.4826·MAD / median).
// Mirrors composite-price.compositeLevel.typeDispersion: independent dollar types
// that disagree (>15%) signal a wiring/commodity mismatch.
export function levelDispersion(point) {
  const byType = {};
  (point.provenance || []).filter((p) => p.kind === 'level' && typeof p.valueCents === 'number')
    .forEach((p) => { const t = p.type || sourceType(p.source); (byType[t] = byType[t] || []).push(p.valueCents); });
  const tm = Object.keys(byType).map((t) => med(byType[t]));
  if (tm.length < 2) return 0;
  const m = med(tm);
  return m > 0 ? (1.4826 * med(tm.map((v) => Math.abs(v - m)))) / m : 0;
}
function levelCeiling(point) {
  const lt = typeCount(point, 'level');
  if (lt >= 2) return levelDispersion(point) > 0.15 ? RANK.medium : RANK.high;
  return lt >= 1 ? RANK.medium : RANK.directional;
}
function trendCeiling(point, weeks) {
  const tt = typeCount(point, 'trend');
  const a = point.trend && typeof point.trend.agreement === 'number' ? point.trend.agreement : 0;
  const indep = (tt >= 2 && a >= 0.66) ? RANK.high : (tt >= 2 && a >= 0.33) ? RANK.medium : tt >= 1 ? RANK.low : RANK.directional;
  const complete = weeks >= 8 ? RANK.high : weeks >= 4 ? RANK.medium : weeks >= 2 ? RANK.low : RANK.directional;
  return Math.min(indep, complete);
}

// The calibrated ceiling = min(level, trend) — mirrors composite-price.confidenceFor.
// Takes the history ARRAY (for week-coverage), not a row count. Exported for tests.
export function calibrationCeiling(point, history) {
  return Math.min(levelCeiling(point), trendCeiling(point, historyWeeks(history)));
}

function runSelfTest() {
  const cases = [];
  const ok = (name, got, want) => cases.push({ name, pass: got === want, got, want });
  const lev = (n, t) => Array.from({ length: n }, (_, i) => ({ kind: 'level', source: t + '-' + i }));
  const trd = (arr) => arr.map((s) => ({ kind: 'trend', source: s }));
  const weeks = (n) => Array.from({ length: n }, (_, i) => ({ date: new Date(Date.UTC(2026, 0, 5 + i * 7)).toISOString().slice(0, 10) }));
  const daily = (n) => Array.from({ length: n }, (_, i) => ({ date: new Date(Date.UTC(2026, 4, 1 + i)).toISOString().slice(0, 10) }));
  // type counting (level vs trend, terminals collapse)
  ok('six AMS terminals = one level type', typeCount({ provenance: lev(6, 'usda-ams') }, 'level'), 1);
  ok('ams + bls = two trend types', typeCount({ provenance: trd(['usda-ams-x', 'bls-ppi']) }, 'trend'), 2);
  // week coverage
  ok('12 weekly rows = 12 weeks', historyWeeks(weeks(12)), 12);
  ok('26 daily rows = a handful of weeks, not 26', historyWeeks(daily(26)) <= 6 && historyWeeks(daily(26)) >= 4 ? 1 : 0, 1);
  // composed ceilings
  ok('two independent dollar types + corroborated, deep trend → high',
    calibrationCeiling({ provenance: [...lev(1, 'usda-lmr'), ...lev(1, 'cme'), ...trd(['usda-lmr', 'cme', 'bls'])], trend: { agreement: 1 } }, weeks(12)), RANK.high);
  ok('six AMS terminals (one type) cannot reach high',
    calibrationCeiling({ provenance: [...lev(6, 'usda-ams'), ...trd(['usda-ams-x'])], trend: { agreement: 0.9 } }, weeks(12)), RANK.low);
  ok('onion-shaped (single AMS methodology) → low',
    calibrationCeiling({ provenance: [...lev(6, 'usda-ams'), ...trd(['usda-ams-a', 'usda-ams-b'])], trend: { agreement: 0.83 } }, daily(26)), RANK.low);
  ok('romaine-shaped (1 level type, ams+bls trend) → medium',
    calibrationCeiling({ provenance: [...lev(6, 'usda-ams'), ...trd(['usda-ams-a', 'bls-ppi'])], trend: { agreement: 1 } }, weeks(12)), RANK.medium);
  ok('thin history (4 weeks) caps even independent types at medium',
    calibrationCeiling({ provenance: [...lev(1, 'usda-lmr'), ...lev(1, 'cme'), ...trd(['usda-lmr', 'cme'])], trend: { agreement: 1 } }, weeks(4)), RANK.medium);
  ok('two level types that DISAGREE (>15%) cap at medium',
    calibrationCeiling({ provenance: [{ kind: 'level', source: 'usda-lmr', valueCents: 1300 }, { kind: 'level', source: 'cme-cash', valueCents: 2000 }, ...trd(['usda-lmr', 'cme', 'bls'])], trend: { agreement: 1 } }, weeks(12)), RANK.medium);
  ok('two level types that AGREE reach high',
    calibrationCeiling({ provenance: [{ kind: 'level', source: 'usda-lmr', valueCents: 1300 }, { kind: 'level', source: 'cme-cash', valueCents: 1320 }, ...trd(['usda-lmr', 'cme', 'bls'])], trend: { agreement: 1 } }, weeks(12)), RANK.high);

  const failed = cases.filter((c) => !c.pass);
  for (const c of failed) console.error(`  ✗ ${c.name}: got ${NAME[c.got] ?? c.got}, want ${NAME[c.want] ?? c.want}`);
  console.log(`cost-index calibration self-test: ${cases.length - failed.length}/${cases.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

function runCheck() {
  let data;
  try { data = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8')); }
  catch (e) { console.error('cost-index calibration: cannot read data/cost-index.json —', e.message); process.exit(1); }
  const ings = data.ingredients || {};
  const overstated = [];
  let checked = 0;
  for (const key of Object.keys(ings)) {
    const e = ings[key];
    const point = e && Array.isArray(e.points) && e.points[0];
    if (!point || !point.confidence) continue;
    checked++;
    const history = Array.isArray(e.history) ? e.history : [];
    const ceiling = calibrationCeiling(point, history);
    const shipped = RANK[point.confidence];
    if (typeof shipped === 'number' && shipped > ceiling) {
      overstated.push({ key, shipped: point.confidence, ceiling: NAME[ceiling], levelTypes: typeCount(point, 'level'), trendTypes: typeCount(point, 'trend'), weeks: historyWeeks(history) });
    }
  }
  if (overstated.length) {
    console.log(`cost-index calibration: ${overstated.length} confidence overstatement(s) of ${checked} checked:`);
    for (const o of overstated) {
      console.log(`  ${o.key}: vendored '${o.shipped}' but data supports at most '${o.ceiling}' (level-types=${o.levelTypes}, trend-types=${o.trendTypes}, weeks=${o.weeks}).`);
    }
    console.log('  Fix is upstream in the orchestrator composite-price (confidence counts source TYPES, not correlated markets).');
    if (FAIL_ON_DRIFT) process.exit(1);
    console.log('  (warn-only during rollout — set FAIL_ON_DRIFT once upstream is reconciled.)');
    process.exit(0);
  }
  console.log(`cost-index calibration: ${checked} point(s) checked; every confidence is within its data-supported ceiling.`);
  process.exit(0);
}

// Run the CLI only when invoked directly — importing this module (e.g. from
// build-cost-index-health.mjs) reuses its exported primitives without side effects.
if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  if (SELF_TEST) runSelfTest(); else runCheck();
}
