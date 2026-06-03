#!/usr/bin/env node
/**
 * check-cost-index-sync.mjs — the vendored Cost Index gate. Three jobs:
 *
 *   FACT GATE   every vendored point is for a verified:true ingredient that has
 *               a bounds entry, carries provenance whose every element names a
 *               source, has a valid asOf, at least one of level/trend, and a
 *               level within plausible bounds. Nothing unverified/unsourced/
 *               unbounded ships.
 *   FRESHNESS   _lastReviewed is present + well-formed; once the index is
 *               NON-EMPTY it must be < STALE_DAYS old (an empty placeholder is
 *               exempt — there's nothing to review yet). Points older than
 *               POINT_STALE_DAYS warn.
 *   PARITY      ingredient keys ⊆ data/cost-index-sources.json; the file is the
 *               canonical shape (_generatedFrom marker).
 *
 * `pointIssues()` is exported so scripts/build-cost-index.mjs uses the SAME
 * predicate to decide what to vendor — build and gate cannot drift.
 *
 *   node scripts/check-cost-index-sync.mjs --check      # CI gate
 *   node scripts/check-cost-index-sync.mjs --self-test  # pins the validator
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function rd(rel) {
  const p = path.isAbsolute(rel) ? rel : path.join(repoRoot, rel);
  try { return { ok: true, data: JSON.parse(readFileSync(p, 'utf8')) }; }
  catch (e) { return { ok: false, err: `${rel}: ${e.message}` }; }
}

const STALE_DAYS = 90;
const POINT_STALE_DAYS = 120;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const parseDay = (d) => Date.parse(d + 'T00:00:00Z');   // always UTC midnight

/**
 * pointIssues — the single source of truth for "may this point ship?".
 * Returns [] when the point is vendorable for `ingredient`, else a list of
 * issue codes. Used by BOTH the gate (per committed point) and the build
 * (per artifact point + per carried-forward point).
 */
export function pointIssues(ingredient, point, srcIng, boundsMap) {
  const out = [];
  if (!srcIng[ingredient]) out.push('orphan');                          // not in cost-index-sources.json
  else if (srcIng[ingredient].verified !== true) out.push('unverified'); // fact gate
  if (!boundsMap[ingredient]) out.push('no-bounds');                     // must have a plausibility band
  if (!point || !DATE_RE.test(point.asOf || '')) out.push('bad-asof');
  if (!point || !Array.isArray(point.provenance) || point.provenance.length === 0 ||
      !point.provenance.every((p) => p && typeof p.source === 'string' && p.source.trim())) {
    out.push('no-provenance');                                          // every element must name a source
  }
  const hasLevel = point && point.level && typeof point.level.medianCents === 'number';
  const hasTrend = point && point.trend && (typeof point.trend.pct === 'number');
  if (!hasLevel && !hasTrend) out.push('empty-point');                  // must carry meaningful data
  if (hasLevel && boundsMap[ingredient]) {
    const b = boundsMap[ingredient];
    if (point.level.medianCents < b.minCents / 2 || point.level.medianCents > b.maxCents * 2) out.push('out-of-bounds');
  }
  return out;
}

export function validateIndex(index, sources, bounds, now = Date.now()) {
  const errors = [];
  const warnings = [];
  const srcIng = (sources && sources.ingredients) || {};
  const boundsMap = (bounds && bounds.bounds) || {};
  const ingredients = (index && index.ingredients) || {};
  const isEmpty = Object.keys(ingredients).length === 0;

  // ---- file-level shape + freshness ----
  const lr = index && index._lastReviewed;
  if (!lr || !DATE_RE.test(lr)) {
    errors.push('_lastReviewed missing or not YYYY-MM-DD.');
  } else if (!isEmpty) {                          // empty placeholder is exempt — nothing to review yet
    const age = (now - parseDay(lr)) / 86400000;
    if (age > STALE_DAYS) errors.push(`_lastReviewed=${lr} is ${Math.round(age)}d old (>${STALE_DAYS}d) — re-review and bump.`);
  }
  if (index && index._generatedFrom !== 'verified-sources-only') {
    errors.push("_generatedFrom must be 'verified-sources-only' (the fact-gate marker).");
  }

  // ---- per-ingredient / per-point fact gate (via the shared predicate) ----
  for (const key of Object.keys(ingredients)) {
    const points = (ingredients[key] && ingredients[key].points) || [];
    if (!Array.isArray(points)) { errors.push(`${key}.points must be an array.`); continue; }
    for (const p of points) {
      const issues = pointIssues(key, p, srcIng, boundsMap);
      if (issues.length) errors.push(`${key} @ ${p && p.asOf ? p.asOf : '?'}: ${issues.join(', ')}.`);
      if (p && DATE_RE.test(p.asOf || '')) {
        const age = (now - parseDay(p.asOf)) / 86400000;
        if (age > POINT_STALE_DAYS) warnings.push(`${key} @ ${p.asOf}: point is ${Math.round(age)}d old (>${POINT_STALE_DAYS}d).`);
      }
    }
  }
  return { errors, warnings };
}

function selfTest() {
  const sources = { ingredients: { ribeye: { verified: true }, onion: { verified: false } } };
  const bounds = { bounds: { ribeye: { minCents: 700, maxCents: 3000, unit: 'lb' }, onion: { minCents: 30, maxCents: 300, unit: 'lb' } } };
  const NOW = parseDay('2026-06-10');
  const good = { asOf: '2026-06-01', level: { medianCents: 1400 }, trend: { pct: 0.05 }, provenance: [{ kind: 'level', source: 'usda-ams' }] };
  const cases = [
    ['empty canonical passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: {} }, true],
    ['empty + old _lastReviewed still passes (exempt)', { _lastReviewed: '2025-01-01', _generatedFrom: 'verified-sources-only', ingredients: {} }, true],
    ['verified+sourced+bounded point passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } } }, true],
    ['unverified ingredient FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { onion: { points: [good] } } }, false],
    ['empty provenance FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, provenance: [] }] } } }, false],
    ['provenance of empty objects FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, provenance: [{}] }] } } }, false],
    ['out-of-bounds level FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, level: { medianCents: 999999 } }] } } }, false],
    ['neither level nor trend FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ asOf: '2026-06-01', provenance: [{ source: 'x' }] }] } } }, false],
    ['non-empty + stale _lastReviewed FAILS', { _lastReviewed: '2026-01-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } } }, false],
    ['orphan ingredient FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { saffron: { points: [good] } } }, false],
    ['missing _generatedFrom FAILS', { _lastReviewed: '2026-06-01', ingredients: {} }, false],
  ];
  let pass = 0;
  for (const [name, idx, shouldPass] of cases) {
    const { errors } = validateIndex(idx, sources, bounds, NOW);
    const ok = (errors.length === 0) === shouldPass;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}: ${name}${ok ? '' : ` (errors: ${errors.join('; ')})`}`);
    if (ok) pass++;
  }
  console.log(`\nself-test: ${pass}/${cases.length} passed.`);
  process.exit(pass === cases.length ? 0 : 1);
}

function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  const idx = rd('data/cost-index.json');
  const src = rd('data/cost-index-sources.json');
  const bnd = rd('data/cost-index-bounds.json');
  for (const r of [idx, src, bnd]) {
    if (!r.ok) { console.error('✗ cost-index sync: ' + r.err); process.exit(1); }
  }
  const { errors, warnings } = validateIndex(idx.data, src.data, bnd.data);
  warnings.forEach((w) => console.warn('  ! ' + w));
  if (errors.length) {
    console.error('✗ cost-index sync: ' + errors.length + ' error(s):');
    errors.forEach((e) => console.error('  - ' + e));
    console.error('  Fix data/cost-index.json (or rebuild with scripts/build-cost-index.mjs). Unverified/unsourced/unbounded/stale points must not ship.');
    process.exit(1);
  }
  const n = Object.keys(idx.data.ingredients || {}).length;
  console.log(`cost-index sync: OK — ${n} ingredient(s) vendored, all verified+sourced+bounded; _lastReviewed=${idx.data._lastReviewed}.`);
}

// Only run as a CLI when executed directly — not when build-cost-index.mjs
// imports pointIssues()/validateIndex().
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
