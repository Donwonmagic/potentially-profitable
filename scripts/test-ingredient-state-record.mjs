#!/usr/bin/env node
/**
 * test-ingredient-state-record.mjs — pins the audit-hardened harmony computation so the honesty
 * thresholds a 4-lens adversarial audit forced (2026-07-18) cannot silently regress. Pure-function
 * tests only; the record-level invariants live in check-ingredient-state-record.mjs --self-test.
 *
 *   node --test scripts/test-ingredient-state-record.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harmonyFor, strongComover, deriveOrigins } from './build-ingredient-state-record.mjs';

const kinds = (r) => (harmonyFor(r) || []).map((h) => h.kind);
const of = (r, kind) => (harmonyFor(r) || []).find((h) => h.kind === kind);

test('deriveOrigins: "single-source" needs a >=90% top share (audit fix)', () => {
  assert.equal(deriveOrigins({ Mexico: 100 }).import_source_concentration, 'single-source');
  assert.equal(deriveOrigins({ Mexico: 95, Canada: 5 }).import_source_concentration, 'single-source');
  // 81% and 88% top shares were the self-contradictory "single-source" the audit caught
  assert.equal(deriveOrigins({ Mexico: 81, Canada: 19 }).import_source_concentration, 'concentrated');
  assert.equal(deriveOrigins({ Mexico: 88, Peru: 12 }).import_source_concentration, 'concentrated');
  // genuinely spread stream
  assert.equal(deriveOrigins({ A: 20, B: 20, C: 20, D: 20, E: 20 }).import_source_concentration, 'diversified');
  // top_share is the top country's share of the import stream
  assert.equal(deriveOrigins({ Mexico: 81, Canada: 19 }).import_top_sources[0].share_pct, 81);
});

test('strongComover: named only on a real majority (>=3 shared AND >=half of n)', () => {
  const co = (s) => strongComover({ comovers: [{ slug: 'x', shared_of_n: s }] });
  assert.ok(co('3/6'), '3/6 (exactly half, >=3) is a strong co-mover');
  assert.ok(co('3/5'), '3/5 (0.6) is strong');
  assert.ok(co('4/6'), '4/6 is strong');
  assert.equal(co('2/6'), null, '2/6 is winner-curse noise — dropped');
  assert.equal(co('2/5'), null, '2/5 dropped (< 3 shared)');
  assert.equal(co('4/10'), null, '4/10 dropped (>=3 but 0.4 < half)');
  assert.equal(strongComover({ comovers: [] }), null);
  assert.equal(strongComover({}), null);
});

test('harmonyFor: supplyshape fires from the origin mix', () => {
  const r = { import_source_concentration: 'concentrated', import_source_hhi: 0.69, import_top_sources: [{ country: 'Mexico', share_pct: 81 }] };
  const ss = of(r, 'supplyshape');
  assert.ok(ss);
  assert.equal(ss.concentration, 'concentrated');
  assert.equal(ss.top_country, 'Mexico');
  assert.equal(ss.top_share, 81);
});

test('harmonyFor: reliance carries the aligned year + anchors the origin share to imports; only when present', () => {
  const withRel = {
    import_reliance_pct: 30, import_reliance_year: 2023,
    import_reliance_scope: 'commodity', nass_commodity: 'TOMATOES',
    us_import_value_usd: 3, us_production_usd: 7,
    us_percap_lbs: 8.4, us_percap_year: 2021,
    import_top_sources: [{ country: 'Mexico', share_pct: 88 }],
  };
  const rel = of(withRel, 'reliance');
  assert.ok(rel);
  assert.equal(rel.reliance_pct, 30);
  assert.equal(rel.reliance_year, 2023);
  assert.equal(rel.scope, 'commodity', 'reliance carries its scope (item vs commodity) for the render');
  assert.equal(rel.commodity, 'TOMATOES', 'reliance carries the commodity name for the "group" label');
  assert.equal(rel.top_country, 'Mexico'); // the island states this is 88% OF IMPORTS, not of supply
  assert.equal(rel.top_share, 88);
  // the value read carries its VOLUME companion (ERS per-capita lbs) when present, never conflated
  assert.equal(rel.percap_lbs, 8.4);
  assert.equal(rel.percap_year, 2021);
  // absent ERS -> reliance still fires, percap null (degrade by absence)
  const relNoVol = of({ import_reliance_pct: 30, import_reliance_year: 2023, us_import_value_usd: 3, us_production_usd: 7 }, 'reliance');
  assert.equal(relNoVol.percap_lbs, null);
  // inert until NASS lands: no reliance value -> no reliance read
  assert.equal(of({ import_source_concentration: 'concentrated', import_top_sources: [{ country: 'X', share_pct: 50 }] }, 'reliance'), undefined);
});

test('harmonyFor: persistence keeps the run-length always, names a co-mover only on a majority', () => {
  const strong = { notable_events_n: 6, median_shock_days: 84, comovers: [{ slug: 'cherry-tomato', shared_of_n: '3/6' }] };
  const p1 = of(strong, 'persistence');
  assert.equal(p1.n, 6);
  assert.equal(p1.median_days, 84);
  assert.equal(p1.comover_slug, 'cherry-tomato');
  assert.equal(p1.comover_shared, '3/6');

  const noisy = { notable_events_n: 6, median_shock_days: 49, comovers: [{ slug: 'garlic', shared_of_n: '2/6' }] };
  const p2 = of(noisy, 'persistence');
  assert.ok(p2, 'persistence still present (the duration is honest)');
  assert.equal(p2.comover_slug, null, 'noise co-mover dropped');
  assert.equal(p2.comover_shared, null);
});

test('harmonyFor: catchpair pairs wild landings vs imports (both sides required), never a share', () => {
  // import_usd aligns to the landings YEAR when the annual series has it (never cross-year)
  const seafood = { us_landings_value_usd: 312_000_000, us_import_value_usd: 1_617_000_000, us_landings_wild_minimal: false,
    us_landings_year: 2024, import_annual_usd: { 2024: 1_589_800_000, 2025: 1_617_000_000 } };
  const cp = of(seafood, 'catchpair');
  assert.ok(cp, 'catchpair fires when both landings + import are present');
  assert.equal(cp.landings_usd, 312_000_000);
  assert.equal(cp.import_usd, 1_589_800_000, 'import aligns to the 2024 landings year, not the 2025 latest');
  assert.equal(cp.import_year, 2024, 'import_year matches landings_year when aligned');
  assert.equal(cp.wild_minimal, false);
  assert.equal(cp.landings_year, 2024);
  // fallback: no same-year import -> use latest us_import_value_usd + label its year
  const fb = of({ us_landings_value_usd: 5, us_import_value_usd: 99, us_landings_year: 2024, import_annual_usd: { 2022: 88, 2023: 99 } }, 'catchpair');
  assert.equal(fb.import_usd, 99);
  assert.equal(fb.import_year, 2023, 'fallback labels the latest available import year');
  // it never computes a percentage/share — only the two raw figures + the seam flag
  assert.equal(cp.reliance_pct, undefined);
  assert.equal(cp.share_pct, undefined);
  // the wild-minimal seam is carried through (octopus: tiny wild landing beside a large import)
  const minimal = of({ us_landings_value_usd: 300_000, us_import_value_usd: 15_800_000, us_landings_wild_minimal: true, us_landings_year: 2024 }, 'catchpair');
  assert.equal(minimal.wild_minimal, true);
  // degrade by absence: only one side present -> no catchpair
  assert.equal(of({ us_landings_value_usd: 312_000_000 }, 'catchpair'), undefined, 'no import -> no catchpair');
  assert.equal(of({ us_import_value_usd: 1_617_000_000 }, 'catchpair'), undefined, 'no landings -> no catchpair');
  // a missing wild_minimal coerces to false (never null/undefined in the seam)
  assert.equal(of({ us_landings_value_usd: 1, us_import_value_usd: 2 }, 'catchpair').wild_minimal, false);
});

test('harmonyFor: the audit-dropped kinds never render, even with their inputs present', () => {
  const r = {
    cheapest_month: 3, import_peak_months: [1, 2, 3],       // old buyclock inputs
    edible_yield_pct: 75, cooked_yield: 0.75,               // old served inputs
    import_source_concentration: 'concentrated', import_top_sources: [{ country: 'Mexico', share_pct: 81 }],
  };
  const ks = kinds(r);
  assert.ok(!ks.includes('buyclock'), 'buyclock dropped by the audit');
  assert.ok(!ks.includes('served'), 'served dropped by the audit');
  assert.deepEqual([...ks].sort(), ['supplyshape']);
});

test('harmonyFor: degrades by absence — a bare record has no harmony', () => {
  assert.equal(harmonyFor({ slug: 'x', name: 'X' }), null);
});
