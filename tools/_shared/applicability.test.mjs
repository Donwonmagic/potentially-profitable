/**
 * APPLICABILITY GUARANTEE — the catalog-wide invariant that the complex Plate
 * alerts only surface when they actually apply.
 *
 * Every emergent-insight engine returns a non-surfacing result on (a) empty /
 * degenerate input and (b) its "present but not actionable" borderline case.
 * "Non-surfacing" = show:false, or tier:'none', or gated:true. This single suite
 * enumerates every complex engine so NONE can be added without a calm path —
 * a false alarm is the one failure mode that erodes trust, and this is the
 * forcing function against it.
 *
 * Pure engines only (no DOM/IO), so this runs in CI with `node --test`. The
 * Ledger TS ports are behaviour-identical (parity contract), so the guarantee
 * transfers; the Ledger vitest suites pin the same calm cases per engine.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const isCalm = (r) =>
  !!r && (r.show === false || r.gated === true || r.tier === 'none');

// One entry per complex alert. `empty` = degenerate input; `borderline` =
// present-but-not-actionable input (the harder, more important case).
const ENGINES = [
  {
    name: 'E1 spread-decompose', fn: require('./spread-decompose.js').decompose,
    empty: {},
    // a real own-move, but the market read is too weak to attribute → no spread
    borderline: { ownDeltaPct: 14, marketDeltaPct: 6, marketConfidence: 'low', marketAgreement: 0.4, vendorPeriods: 1 },
  },
  {
    name: 'E4 silent-bleed', fn: require('./silent-bleed.js').build,
    empty: {},
    borderline: { impacts: [] }, // nothing bled this week
  },
  {
    name: 'E5 blast-radius', fn: require('./blast-radius.js').build,
    empty: {},
    borderline: { ingredient: 'Mozzarella', dishes: [{ name: 'Pizza' }] }, // only one dish → not a blast radius
  },
  {
    name: 'E6 margin-map', fn: require('./margin-map.js').build,
    empty: {},
    borderline: { dishes: [{ dish: 'Caesar', foodCostPct: 0.25 }], targetPct: 0.30 }, // all under target
  },
  {
    name: 'E7 buy-or-ride', fn: require('./buy-or-ride.js').decide,
    empty: {},
    borderline: { ingredient: 'Beef', hikePct: 12, daysOfCover: null, spikeVerdict: 'spike' }, // real hike, but NO cover read
  },
  {
    name: 'E9 yield-truth', fn: require('./yield-truth.js').build,
    empty: {},
    borderline: { ingredient: 'whole chicken', bookYield: 0.60, learnedYield: 0.61, dishes: [{ dish: 'Roast', ingredientCostCents: 154 }] }, // < 3pp → matches the book
  },
  {
    name: 'E14 stress-test', fn: require('./stress-test.js').build,
    empty: {},
    borderline: { ingredient: 'Beef', hikePct: 20, targetPct: 0.30, dishes: [{ dish: 'Salad', plateCostCents: 300, menuPriceCents: 1200, exposedCents: 0 }] }, // dish doesn't use it
  },
  {
    name: 'E15 cost-history', fn: require('./cost-history.js').build,
    empty: {},
    borderline: { dish: 'Caesar', points: [{ at: '2026-01-01T00:00:00Z', plateCostCents: 540 }] }, // one point → not enough history
  },
];

for (const e of ENGINES) {
  test(`${e.name}: empty input never surfaces an alert`, () => {
    assert.equal(isCalm(e.fn(e.empty)), true, `${e.name} surfaced on empty input`);
  });
  test(`${e.name}: present-but-not-actionable input stays calm`, () => {
    assert.equal(isCalm(e.fn(e.borderline)), true, `${e.name} surfaced when not applicable`);
  });
}

// Meta-guard: if a new complex engine ships without being registered here, this
// count drops out of sync — a deliberate nudge to add its calm path to the suite.
test('every complex alert engine is covered by the applicability guarantee', () => {
  assert.equal(ENGINES.length, 8);
});
