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
 * ROLLOUT: warn-only by default (FAIL_ON_DRIFT=false), matching the repo's
 * pattern for new gates (pricing-consistency, sheets-parity). Flip the flag to
 * fail-CI once the upstream confidences are reconciled. Today it flags `onion`
 * (high on 6 AMS terminals = one type → should cap at medium).
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
const FAIL_ON_DRIFT = false;

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

function independenceCeiling(point) {
  const types = new Set((point.provenance || []).map((p) => sourceType(p.source)));
  const t = types.size;
  if (t >= 2) return RANK.high;
  if (t === 1) return RANK.medium;
  return RANK.directional;
}
function completenessCeiling(historyLen) {
  if (historyLen >= 12) return RANK.high;
  if (historyLen >= 8) return RANK.medium;
  if (historyLen >= 4) return RANK.low;
  return RANK.directional;
}
function agreementCeiling(point) {
  const a = point.trend && typeof point.trend.agreement === 'number' ? point.trend.agreement : null;
  if (a == null) return RANK.high;            // no agreement signal → don't constrain on this axis
  if (a >= 0.66) return RANK.high;
  if (a >= 0.33) return RANK.medium;
  if (a > 0) return RANK.low;
  return RANK.directional;
}

// The calibrated ceiling for a point + its history length. Exported for tests.
export function calibrationCeiling(point, historyLen) {
  return Math.min(
    independenceCeiling(point),
    completenessCeiling(historyLen),
    agreementCeiling(point)
  );
}

function runSelfTest() {
  const cases = [];
  const ok = (name, got, want) => cases.push({ name, pass: got === want, got, want });
  // independence
  ok('two types → high allowed', independenceCeiling({ provenance: [{ source: 'usda-ams-boston' }, { source: 'bls-x' }] }), RANK.high);
  ok('six AMS terminals = one type → medium cap', independenceCeiling({ provenance: ['boston', 'chicago', 'detroit', 'miami', 'new-york', 'los-angeles'].map((c) => ({ source: 'usda-ams-' + c })) }), RANK.medium);
  ok('no provenance → directional', independenceCeiling({ provenance: [] }), RANK.directional);
  // completeness
  ok('12 reads → high allowed', completenessCeiling(12), RANK.high);
  ok('8 reads → medium cap', completenessCeiling(8), RANK.medium);
  ok('5 reads → low cap', completenessCeiling(5), RANK.low);
  ok('2 reads → directional', completenessCeiling(2), RANK.directional);
  // agreement
  ok('agreement 1.0 → high', agreementCeiling({ trend: { agreement: 1 } }), RANK.high);
  ok('agreement 0.5 → medium', agreementCeiling({ trend: { agreement: 0.5 } }), RANK.medium);
  ok('agreement absent → unconstrained', agreementCeiling({ trend: {} }), RANK.high);
  // min-of-gates composition
  ok('one strong gate cannot lift a weak one', calibrationCeiling({ provenance: [{ source: 'usda-ams-boston' }], trend: { agreement: 1 } }, 26), RANK.medium);
  ok('onion-shaped (1 type, deep, agree) → medium ceiling',
    calibrationCeiling({ provenance: ['a', 'b', 'c'].map((c) => ({ source: 'usda-ams-' + c })), trend: { agreement: 0.83 } }, 26), RANK.medium);
  ok('romaine-shaped (2 types) → high ceiling',
    calibrationCeiling({ provenance: [{ source: 'usda-ams-boston' }, { source: 'bls-ppi' }], trend: { agreement: 1 } }, 26), RANK.high);

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
    const histLen = Array.isArray(e.history) ? e.history.length : 0;
    const ceiling = calibrationCeiling(point, histLen);
    const shipped = RANK[point.confidence];
    if (typeof shipped === 'number' && shipped > ceiling) {
      const types = [...new Set((point.provenance || []).map((p) => sourceType(p.source)))];
      overstated.push({ key, shipped: point.confidence, ceiling: NAME[ceiling], types: types.join('+'), hist: histLen });
    }
  }
  if (overstated.length) {
    console.log(`cost-index calibration: ${overstated.length} confidence overstatement(s) of ${checked} checked:`);
    for (const o of overstated) {
      console.log(`  ${o.key}: vendored '${o.shipped}' but data supports at most '${o.ceiling}' (types=${o.types}, history=${o.hist}).`);
    }
    console.log('  Fix is upstream in the orchestrator composite-price (confidence counts source TYPES, not correlated markets).');
    if (FAIL_ON_DRIFT) process.exit(1);
    console.log('  (warn-only during rollout — set FAIL_ON_DRIFT once upstream is reconciled.)');
    process.exit(0);
  }
  console.log(`cost-index calibration: ${checked} point(s) checked; every confidence is within its data-supported ceiling.`);
  process.exit(0);
}

if (SELF_TEST) runSelfTest(); else runCheck();
