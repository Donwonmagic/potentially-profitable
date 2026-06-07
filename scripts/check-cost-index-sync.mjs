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
export function pointIssues(ingredient, point, srcIng, boundsMap, now = Date.now()) {
  const out = [];
  if (!srcIng[ingredient]) out.push('orphan');                          // not in cost-index-sources.json
  else if (srcIng[ingredient].verified !== true) out.push('unverified'); // fact gate
  if (!boundsMap[ingredient]) out.push('no-bounds');                     // must have a plausibility band
  if (!point || !DATE_RE.test(point.asOf || '')) out.push('bad-asof');
  // Provenance: every element must name a source AND carry its WHEN (date) or
  // its BASIS (what it measured). A rendered number with no as-of/basis backing
  // isn't citeable — the whole point of the fact gate.
  if (!point || !Array.isArray(point.provenance) || point.provenance.length === 0 ||
      !point.provenance.every((p) => p && typeof p.source === 'string' && p.source.trim() &&
        (DATE_RE.test(p.date || '') || (typeof p.basis === 'string' && p.basis.trim())))) {
    out.push('no-provenance');
  }
  const hasLevel = point && point.level && typeof point.level.medianCents === 'number';
  const hasTrend = point && point.trend && (typeof point.trend.pct === 'number');
  if (!hasLevel && !hasTrend) out.push('empty-point');                  // must carry meaningful data
  // A level must be anchored on FRESH observations — not just carry a fresh
  // composite asOf (a fresh trend can mask a stale level behind it). Check the
  // level provenance dates directly, so build + gate catch what verify catches.
  if (hasLevel && Array.isArray(point.level.provenance)) {
    const staleLevel = point.level.provenance.some((lp) => lp && DATE_RE.test(lp.date || '') && (now - parseDay(lp.date)) / 86400000 > POINT_STALE_DAYS);
    if (staleLevel) out.push('stale-level');
  }
  if (hasLevel && boundsMap[ingredient]) {
    const b = boundsMap[ingredient];
    // TIGHT band: the rendered level must be inside the plausible range itself,
    // not merely within 2x of it. The 2x slop is the raw-observation screen's
    // job (catching gross unit flips pre-composite); by the time a level is
    // vendored it's the number a user reads, so it must actually be plausible.
    if (point.level.medianCents < b.minCents || point.level.medianCents > b.maxCents) out.push('out-of-bounds');
  }
  // Freshness is a HARD gate here, not a warning: a stale point must never
  // render as a "current" price. The carry-forward re-vendor path re-runs this,
  // so a series that stops updating ages out instead of freezing a stale level.
  if (point && DATE_RE.test(point.asOf || '') && (now - parseDay(point.asOf)) / 86400000 > POINT_STALE_DAYS) {
    out.push('stale');
  }
  return out;
}

/**
 * historyIssues — gate for a per-ingredient HISTORICAL series (the curve behind
 * the current point). DELIBERATELY EXEMPT from the staleness gate: history is
 * old by design. It is NOT exempt from citeability or plausibility — every
 * entry must name a source + a valid date, and dollar values must sit in the
 * 2x raw-observation band (the gross-unit-flip screen, not the tight rendered
 * band; index-basis entries carry no dollar meaning and are unbounded).
 * Absence of history is fine (returns []).
 */
export function historyIssues(ingredient, history, srcIng, boundsMap) {
  const out = [];
  if (history == null) return out;                                  // optional — absence is fine
  if (!Array.isArray(history) || history.length === 0) { out.push('history-empty'); return out; }
  if (!srcIng[ingredient]) out.push('history-orphan');
  else if (srcIng[ingredient].verified !== true) out.push('history-unverified');
  const b = boundsMap[ingredient];
  for (const h of history) {
    // CITEABILITY: every historical point names a source AND a valid date.
    if (!h || typeof h.source !== 'string' || !h.source.trim() || !DATE_RE.test(h.date || '')) { out.push('history-uncited'); break; }
    if (typeof h.valueCents !== 'number' || !isFinite(h.valueCents)) { out.push('history-badvalue'); break; }
    // BOUNDS for dollar history only, on the 2x slop band — a historical point
    // is a raw observation, not the rendered "current" number, so the gross-flip
    // screen applies, not pointIssues' tight band. Index history is unbounded.
    if (b && h.basis !== 'index' && (h.valueCents < b.minCents / 2 || h.valueCents > b.maxCents * 2)) { out.push('history-out-of-bounds'); break; }
  }
  // NOTE: no asOf/stale check — historical points are old by design.
  return out;
}

/**
 * driverIssues — gate for a driver (corn/soybeans/diesel/electricity): must be a
 * known driver, carry a trend, a citeable (index) history, and only name leads
 * that are actually vendored ingredients. Drivers have no level and no bounds.
 */
export function driverIssues(driver, d, srcDrivers, ingredients) {
  const out = [];
  if (!srcDrivers || !srcDrivers[driver]) out.push('driver-orphan');
  if (!d || !d.trend || typeof d.trend.pct !== 'number') out.push('driver-empty');
  // reuse the citeability check (treat the driver as verified, no bounds).
  out.push(...historyIssues(driver, d && d.history, { [driver]: { verified: true } }, {}));
  for (const led of (d && Array.isArray(d.leads) ? d.leads : [])) {
    if (!ingredients[led]) out.push('driver-bad-lead');
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
      const issues = pointIssues(key, p, srcIng, boundsMap, now);   // staleness is now one of these (hard fail)
      if (issues.length) errors.push(`${key} @ ${p && p.asOf ? p.asOf : '?'}: ${issues.join(', ')}.`);
    }
    // Historical series (optional, sibling to points): citeable + bounded, but
    // EXEMPT from staleness (old by design). Lives outside the points[] array
    // the stale gate iterates, so the current-price gate is untouched.
    const hIssues = historyIssues(key, ingredients[key] && ingredients[key].history, srcIng, boundsMap);
    if (hIssues.length) errors.push(`${key} history: ${hIssues.join(', ')}.`);
  }

  // ---- drivers (corn/soybeans/diesel/electricity): trend + citeable index history ----
  const srcDrivers = (sources && sources.drivers) || {};
  const drivers = (index && index.drivers) || {};
  for (const dkey of Object.keys(drivers)) {
    // leads are checked against the known ingredient universe (srcIng), not the
    // transient vendored set — a lead isn't "bad" just because it had a thin week.
    const dIssues = driverIssues(dkey, drivers[dkey], srcDrivers, srcIng);
    if (dIssues.length) errors.push(`driver ${dkey}: ${dIssues.join(', ')}.`);
  }

  // ---- headline Basket (optional): validate shape + that it only claims what shipped ----
  // build-cost-index recomputes it from the vendored set; absent/null is fine.
  if (index && index.basket != null) {
    const bk = index.basket;
    if (typeof bk !== 'object') {
      errors.push('basket must be an object or null.');
    } else {
      if (bk.pct != null && (typeof bk.pct !== 'number' || !isFinite(bk.pct))) errors.push('basket.pct must be a number or null.');
      if (bk.coverage != null && (typeof bk.coverage !== 'number' || bk.coverage < 0 || bk.coverage > 1)) errors.push('basket.coverage must be within [0,1].');
      if (bk.pct != null) {
        if (!DATE_RE.test(bk.asOf || '')) errors.push('basket has a pct but no valid asOf.');
        for (const c of (Array.isArray(bk.contributors) ? bk.contributors : [])) {
          if (!c || !ingredients[c.ingredient]) errors.push(`basket contributor "${c && c.ingredient}" is not a vendored ingredient.`);
        }
      }
    }
  }
  return { errors, warnings };
}

function selfTest() {
  const sources = { ingredients: { ribeye: { verified: true }, onion: { verified: false } }, drivers: { corn: { verified: true } } };
  const bounds = { bounds: { ribeye: { minCents: 700, maxCents: 3000, unit: 'lb' }, onion: { minCents: 30, maxCents: 300, unit: 'lb' } } };
  const NOW = parseDay('2026-06-10');
  const good = { asOf: '2026-06-01', level: { medianCents: 1400 }, trend: { pct: 0.05 }, provenance: [{ kind: 'level', source: 'usda-ams', date: '2026-06-01' }] };
  const staleHist = [{ date: '2025-01-01', valueCents: 1300, source: 'usda-ams', basis: 'wholesale' }, { date: '2025-01-08', valueCents: 1350, source: 'usda-ams', basis: 'wholesale' }];
  const idxHist = [{ date: '2025-01-01', valueCents: 999999, source: 'bls', basis: 'index' }, { date: '2025-01-08', valueCents: 1000000, source: 'bls', basis: 'index' }];
  const goodDriver = { trend: { pct: 0.1 }, history: [{ date: '2026-05-01', valueCents: 500, source: 'bls', basis: 'index' }], leads: ['ribeye'] };
  const cases = [
    ['empty canonical passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: {} }, true],
    ['empty + old _lastReviewed still passes (exempt)', { _lastReviewed: '2025-01-01', _generatedFrom: 'verified-sources-only', ingredients: {} }, true],
    ['verified+sourced+bounded point passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } } }, true],
    ['trend-kind provenance (basis, no date) passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, provenance: [{ kind: 'trend', source: 'bls', basis: 'index' }] }] } } }, true],
    ['unverified ingredient FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { onion: { points: [good] } } }, false],
    ['empty provenance FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, provenance: [] }] } } }, false],
    ['provenance of empty objects FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, provenance: [{}] }] } } }, false],
    ['provenance with source but no date AND no basis FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, provenance: [{ source: 'usda-ams' }] }] } } }, false],
    ['wildly out-of-bounds level FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, level: { medianCents: 999999 } }] } } }, false],
    ['just-over-max level FAILS (tight band, no 2x slop)', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, level: { medianCents: 3001 } }] } } }, false],
    ['stale point FAILS (older than POINT_STALE_DAYS)', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, asOf: '2026-01-01' }] } } }, false],
    ['neither level nor trend FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ asOf: '2026-06-01', provenance: [{ source: 'x', date: '2026-06-01' }] }] } } }, false],
    ['non-empty + stale _lastReviewed FAILS', { _lastReviewed: '2026-01-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } } }, false],
    ['orphan ingredient FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { saffron: { points: [good] } } }, false],
    ['missing _generatedFrom FAILS', { _lastReviewed: '2026-06-01', ingredients: {} }, false],
    ['valid basket over a vendored ingredient passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } }, basket: { pct: 0.05, coverage: 0.5, asOf: '2026-06-01', contributors: [{ ingredient: 'ribeye' }] } }, true],
    ['basket claiming a non-vendored contributor FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } }, basket: { pct: 0.05, coverage: 0.5, asOf: '2026-06-01', contributors: [{ ingredient: 'saffron' }] } }, false],
    ['basket pct with no asOf FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } }, basket: { pct: 0.05, coverage: 0.5, contributors: [{ ingredient: 'ribeye' }] } }, false],
    ['null basket passes (empty canonical)', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: {}, basket: null }, true],
    ['stale LEVEL provenance FAILS even with a fresh asOf', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, level: { medianCents: 1400, provenance: [{ source: 'usda-ams', date: '2025-01-01' }] } }] } } }, false],
    ['fresh LEVEL provenance passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, level: { medianCents: 1400, provenance: [{ source: 'usda-ams', date: '2026-06-01' }] } }] } } }, true],
    // ---- history: citeable + bounded, but EXEMPT from staleness ----
    ['stale-dated HISTORY passes (exempt from staleness)', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good], history: staleHist } } }, true],
    ['absent history passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } } }, true],
    ['history entry missing a source FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good], history: [{ date: '2026-05-01', valueCents: 1300, basis: 'wholesale' }] } } }, false],
    ['history entry missing a date FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good], history: [{ valueCents: 1300, source: 'usda-ams', basis: 'wholesale' }] } } }, false],
    ['dollar history out of 2x band FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good], history: [{ date: '2026-05-01', valueCents: 999999, source: 'usda-ams', basis: 'wholesale' }] } } }, false],
    ['index-basis history is unbounded — passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good], history: idxHist } } }, true],
    ['CRITICAL: stale current point STILL FAILS while history is exempt', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [{ ...good, asOf: '2026-01-01' }], history: staleHist } } }, false],
    // ---- drivers ----
    ['driver with trend + index history + valid lead passes', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } }, drivers: { corn: goodDriver } }, true],
    ['driver naming a non-vendored lead FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } }, drivers: { corn: { ...goodDriver, leads: ['saffron'] } } }, false],
    ['driver missing trend FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } }, drivers: { corn: { history: goodDriver.history, leads: ['ribeye'] } } }, false],
    ['unknown driver FAILS (orphan)', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } }, drivers: { diesel: goodDriver } }, false],
    ['driver with uncited history FAILS', { _lastReviewed: '2026-06-01', _generatedFrom: 'verified-sources-only', ingredients: { ribeye: { points: [good] } }, drivers: { corn: { trend: { pct: 0.1 }, history: [{ valueCents: 500, basis: 'index' }], leads: ['ribeye'] } } }, false],
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
