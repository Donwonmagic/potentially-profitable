#!/usr/bin/env node
/**
 * build-cost-index-health.mjs — coverage / health matrix for the vendored Cost Index.
 *
 * A PURE, DETERMINISTIC function of data/cost-index.json (no `now`, so --check is
 * stable across days). Per ingredient it records: does a dollar LEVEL exist · how
 * many families/types back the level and trend · the published confidence · whether
 * that confidence sits within the calibration gate's data-supported ceiling · weeks
 * of history · and a `toHigh` hint naming the single binding blocker to a higher
 * tier. It proves honest maintenance (overstated should always be 0) and
 * self-prioritizes the "add a 2nd independent dollar source" work.
 *
 *   node scripts/build-cost-index-health.mjs            # write data/cost-index-health.json
 *   node scripts/build-cost-index-health.mjs --check    # CI: fail if the committed file is stale
 *   node scripts/build-cost-index-health.mjs --self-test
 *
 * Reuses the calibration gate's exported primitives so the audit ceiling here is
 * the same one CI enforces. The `toHigh` hint mirrors composite-price.confidenceFor's
 * min-of-gates on the vendored output fields (advisory only — not gate-enforced).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { typeCount, historyWeeks, calibrationCeiling, levelDispersion } from './check-cost-index-calibration.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RANK = { directional: 0, low: 1, medium: 2, high: 3 };
const NAME = ['directional', 'low', 'medium', 'high'];
const HIGH = 3, MED = 2, LOW = 1;

// What single thing is keeping this ingredient below `high`? Mirrors the engine's
// min-of-gates (level types/dispersion × trend types/agreement/stability) on the
// already-vendored output fields, and reports the binding reason(s).
export function toHighHint(point) {
  const level = point.level;
  const trend = point.trend || {};
  if (!level) return 'no dollar level exists (directional) — needs a comparable wholesale $ source on a measurable basis';
  const lt = level.nTypes || 0;
  const tt = trend.nTypes || 0;
  const agree = typeof trend.agreement === 'number' ? trend.agreement : 0;
  const noise = trend.noise == null ? null : trend.noise;
  const disp = level.typeDispersion || 0;

  let levelTier, levelWhy = null;
  if (lt >= 2 && disp > 0.15) { levelTier = MED; levelWhy = 'dollar types disagree (>15% spread) — reconcile the commodity match'; }
  else if (lt >= 2) levelTier = HIGH;
  else { levelTier = MED; levelWhy = 'add a 2nd independent-agency wholesale $ level on the same basis'; }

  let trendTier = HIGH, trendWhy = null;
  if (trend.pct != null) {
    if (tt >= 2 && agree >= 0.66) trendTier = HIGH;
    else if (tt >= 2 && agree >= 0.33) { trendTier = MED; trendWhy = 'trend agreement is only moderate'; }
    else if (tt >= 2) { trendTier = LOW; trendWhy = 'trend sources disagree on direction'; }
    else { trendTier = LOW; trendWhy = 'add a 2nd independent trend source'; }
    if (noise != null && noise > 0.20) { trendTier = LOW; trendWhy = 'trend is too noisy (jagged) to trust as a move'; }
    else if (noise != null && noise > 0.08 && trendTier > MED) { trendTier = MED; trendWhy = 'trend is mildly noisy'; }
  }

  const headline = Math.min(levelTier, trendTier);
  if (headline >= HIGH) return 'eligible for high';
  const why = [];
  if (levelTier === headline && levelWhy) why.push(levelWhy);
  if (trendTier === headline && trendWhy) why.push(trendWhy);
  return why.length ? why.join('; ') : 'capped at ' + NAME[headline];
}

export function ingredientHealth(key, entry) {
  const point = entry && Array.isArray(entry.points) && entry.points[0];
  if (!point || !point.confidence) return null;
  const history = Array.isArray(entry.history) ? entry.history : [];
  const level = point.level || null;
  const trend = point.trend || null;
  const ceiling = calibrationCeiling(point, history);
  return {
    key,
    confidence: point.confidence,
    withinAuditCeiling: RANK[point.confidence] <= ceiling,
    hasDollarLevel: !!level,
    basis: level ? level.basis : null,
    rangeBasis: level ? level.rangeBasis : null,
    levelFamilies: level ? level.nFamilies : 0,
    levelTypes: typeCount(point, 'level'),
    trendTypes: typeCount(point, 'trend'),
    trendAgreement: trend && typeof trend.agreement === 'number' ? trend.agreement : null,
    trendNoise: trend && trend.noise != null ? trend.noise : null,
    typeDispersion: level ? +(levelDispersion(point)).toFixed(4) : 0,
    weeks: historyWeeks(history),
    asOf: point.asOf || null,
    toHigh: toHighHint(point),
  };
}

export function build(data) {
  const ings = data.ingredients || {};
  const rows = Object.keys(ings).map((k) => ingredientHealth(k, ings[k])).filter(Boolean)
    .sort((a, b) => (RANK[b.confidence] - RANK[a.confidence]) || a.key.localeCompare(b.key));
  const byConfidence = rows.reduce((m, r) => { m[r.confidence] = (m[r.confidence] || 0) + 1; return m; }, {});
  return {
    _doc: 'Coverage/health matrix for the Cost Index, derived purely from data/cost-index.json by scripts/build-cost-index-health.mjs (CI runs --check). confidence is the published read; withinAuditCeiling proves it is not overstated; toHigh names the single binding blocker to a higher tier. Regenerate after every vendor.',
    generatedFrom: data.generatedAt || data.asOf || null,
    summary: {
      total: rows.length,
      byConfidence,
      withDollarLevel: rows.filter((r) => r.hasDollarLevel).length,
      highEligible: rows.filter((r) => r.toHigh === 'eligible for high').length,
      overstated: rows.filter((r) => !r.withinAuditCeiling).length,
    },
    ingredients: rows,
  };
}

function run() {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) return selfTest();
  let data;
  try { data = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8')); }
  catch (e) { console.error('cost-index health: cannot read data/cost-index.json —', e.message); process.exit(1); }
  const outPath = path.join(repoRoot, 'data/cost-index-health.json');
  const built = JSON.stringify(build(data), null, 2) + '\n';
  const h = JSON.parse(built);
  const tag = `${h.summary.total} ingredient(s), ${JSON.stringify(h.summary.byConfidence)}, ${h.summary.highEligible} high-eligible, ${h.summary.overstated} overstated`;

  if (args.includes('--check')) {
    let current = '';
    try { current = readFileSync(outPath, 'utf8'); } catch { /* missing → stale */ }
    if (current !== built) {
      console.error('cost-index health: data/cost-index-health.json is stale — run `node scripts/build-cost-index-health.mjs` and commit.');
      process.exit(1);
    }
    if (h.summary.overstated > 0) {
      console.error(`cost-index health: ${h.summary.overstated} ingredient(s) overstated — see check-cost-index-calibration.`);
      process.exit(1);
    }
    console.log(`cost-index health: matrix in sync — ${tag}.`);
    process.exit(0);
  }
  writeFileSync(outPath, built);
  console.log(`cost-index health: wrote data/cost-index-health.json — ${tag}.`);
}

function selfTest() {
  const cases = [];
  const ok = (name, got, want) => cases.push({ name, pass: got === want, got, want });
  const prov = (levelTypes, trendTypes) => [
    ...levelTypes.map((t, i) => ({ kind: 'level', source: t + '-' + i, type: t, valueCents: 1000 })),
    ...trendTypes.map((t, i) => ({ kind: 'trend', source: t + '-' + i, type: t })),
  ];
  const mk = (over) => ({ points: [over], history: [] });
  // two independent agreeing dollar types, clean trend → eligible for high
  ok('two clean types → eligible for high', ingredientHealth('x', mk({
    confidence: 'high', level: { basis: 'wholesale', nTypes: 2, nFamilies: 2, typeDispersion: 0.01, rangeBasis: 'markets' },
    trend: { pct: 0.05, agreement: 1, nTypes: 3, noise: 0.01 }, provenance: prov(['lmr', 'cme'], ['lmr', 'cme', 'bls']),
  })).toHigh, 'eligible for high');
  // single dollar type → blocked on a 2nd level
  ok('single level type → needs 2nd level', ingredientHealth('x', mk({
    confidence: 'medium', level: { basis: 'wholesale', nTypes: 1, nFamilies: 6, typeDispersion: 0, rangeBasis: 'markets' },
    trend: { pct: 0.05, agreement: 0.8, nTypes: 2, noise: 0.05 }, provenance: prov(['usda-ams'], ['usda-ams', 'bls']),
  })).toHigh, 'add a 2nd independent-agency wholesale $ level on the same basis');
  // jagged trend dominates (romaine-shaped) → noise is the blocker, NOT the level
  ok('jagged trend → noise blocker', ingredientHealth('x', mk({
    confidence: 'low', level: { basis: 'wholesale', nTypes: 1, nFamilies: 6, typeDispersion: 0, rangeBasis: 'markets' },
    trend: { pct: 0.05, agreement: 1, nTypes: 2, noise: 0.34 }, provenance: prov(['usda-ams'], ['usda-ams', 'bls']),
  })).toHigh, 'trend is too noisy (jagged) to trust as a move');
  // disagreeing trend direction (russet-shaped) → agreement blocker
  ok('trend disagreement → direction blocker', ingredientHealth('x', mk({
    confidence: 'low', level: { basis: 'wholesale', nTypes: 1, nFamilies: 6, typeDispersion: 0, rangeBasis: 'markets' },
    trend: { pct: 0.0, agreement: 0.22, nTypes: 2, noise: 0.02 }, provenance: prov(['usda-ams'], ['usda-ams', 'bls']),
  })).toHigh, 'trend sources disagree on direction');
  // no level → directional
  ok('no level → directional hint', ingredientHealth('x', mk({
    confidence: 'directional', level: null, trend: { pct: 0.05, agreement: 1, nTypes: 2, noise: 0.02 },
    provenance: prov([], ['bls', 'fred']),
  })).hasDollarLevel, false);

  const failed = cases.filter((c) => !c.pass);
  for (const c of failed) console.error(`  ✗ ${c.name}: got ${JSON.stringify(c.got)}, want ${JSON.stringify(c.want)}`);
  console.log(`cost-index health self-test: ${cases.length - failed.length}/${cases.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) run();
