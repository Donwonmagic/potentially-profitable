/**
 * Pins Muntin Bench's price-move math to Muntin Ledger's computePriceHike
 * (apps/api/src/lib/verdict-compute.ts). If these drift, the storefront
 * tool and the product would give an operator contradictory verdicts on
 * the same prices — the one thing this module exists to prevent.
 *
 *   node --test tools/_shared/bench-lookup.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Bench = require('./bench-lookup.js');

test('median matches Ledger: odd -> middle, even -> mean of two', () => {
  assert.equal(Bench.median([100, 300, 200]), 200);
  assert.equal(Bench.median([100, 200, 300, 400]), 250);
  assert.equal(Bench.median([]), 0);
});

test('computePriceHike: needs >= 2 observations', () => {
  assert.equal(Bench.computePriceHike([{ cents: 1000 }]), null);
});

test('computePriceHike: fires only when BOTH thresholds clear (co-gating)', () => {
  // +20% but only +$2 over a $10 baseline -> dollars floor ($5) NOT met.
  assert.equal(
    Bench.computePriceHike([{ cents: 1000, ts: 1 }, { cents: 1200, ts: 2 }]),
    null,
  );
  // +$6 but only +6% over a $100 baseline -> percent floor (8%) NOT met.
  assert.equal(
    Bench.computePriceHike([{ cents: 10000, ts: 1 }, { cents: 10600, ts: 2 }]),
    null,
  );
  // +25% AND +$5 over a $20 baseline -> both clear, hike fires.
  const v = Bench.computePriceHike([{ cents: 2000, ts: 1 }, { cents: 2500, ts: 2 }]);
  assert.ok(v);
  assert.equal(v.median_cents, 2000);
  assert.equal(v.latest_cents, 2500);
  assert.equal(v.delta_cents, 500);
  assert.equal(Math.round(v.delta_pct * 100), 25);
});

test('computePriceHike: trailing median is the baseline (latest excluded)', () => {
  // priors [1000, 1000, 2000] median 1000; latest 2000 -> +$10, +100%.
  const v = Bench.computePriceHike([
    { cents: 1000, ts: 1 }, { cents: 1000, ts: 2 },
    { cents: 2000, ts: 3 }, { cents: 2000, ts: 4 },
  ]);
  assert.ok(v);
  assert.equal(v.median_cents, 1000);
});

test('assess: tiers map onto the co-gate without contradicting it', () => {
  const hike = Bench.assess({ item: 'beef tenderloin', observations: [{ cents: 2000, ts: 1 }, { cents: 2500, ts: 2 }] });
  assert.equal(hike.tier, 'hike');
  assert.match(hike.talkingPoint, /price hike/i);

  const watch = Bench.assess({ item: 'olive oil', observations: [{ cents: 10000, ts: 1 }, { cents: 10600, ts: 2 }] });
  assert.equal(watch.tier, 'watch'); // +6%: above 3% watch floor, below 8% hike line

  const steadyDown = Bench.assess({ item: 'flour', observations: [{ cents: 2000, ts: 1 }, { cents: 1800, ts: 2 }] });
  assert.equal(steadyDown.tier, 'steady');

  const insufficient = Bench.assess({ item: 'eggs', observations: [{ cents: 500, ts: 1 }] });
  assert.equal(insufficient.tier, 'insufficient');
});

test('assess: declines opaque pack vs weight (no invented conversion)', () => {
  const r = Bench.assess({
    item: 'tomatoes',
    observations: [
      { cents: 4000, ts: 1, unit: 'case' }, // opaque pack
      { cents: 250, ts: 2, unit: 'lb' },     // weight
    ],
  });
  assert.equal(r.tier, 'mixed-units');
  assert.equal(r.unitReason, 'opaque-pack');
  assert.equal(r.deltaPct, null);
  assert.match(r.talkingPoint, /Ledger/);
});

test('assess: declines incompatible dimensions (mass vs count)', () => {
  const r = Bench.assess({
    item: 'eggs',
    observations: [{ cents: 300, ts: 1, unit: 'lb' }, { cents: 300, ts: 2, unit: 'dozen' }],
  });
  assert.equal(r.tier, 'mixed-units');
  assert.equal(r.unitReason, 'incompatible-dimensions');
});

test('assess: NORMALIZES across units in one dimension ($/oz vs $/lb)', () => {
  // $1.00/oz baseline = $16.00/lb; latest $20.00/lb -> +25%, +$4/lb...
  // bump the latest enough to clear the $5 floor too: $22.00/lb.
  const r = Bench.assess({
    item: 'saffron blend',
    observations: [
      { cents: 100, ts: 1, unit: 'oz' },   // $1.00/oz  -> $16.00/lb
      { cents: 2200, ts: 2, unit: 'lb' },  // $22.00/lb
    ],
  });
  assert.equal(r.baseUnit, 'lb');
  assert.equal(r.medianCents, 1600); // $16.00/lb baseline, normalized from oz
  assert.equal(r.latestCents, 2200);
  assert.equal(r.tier, 'hike');
  assert.match(r.talkingPoint, /\/lb/);
});

test('assess: identical units stay exact (Ledger parity preserved)', () => {
  // All in lb, same as Ledger would see: no conversion, exact cents.
  const r = Bench.assess({
    item: 'beef',
    observations: [{ cents: 2000, ts: 1, unit: 'lb' }, { cents: 2500, ts: 2, unit: 'lb' }],
  });
  assert.equal(r.baseUnit, 'lb');
  assert.equal(r.medianCents, 2000);
  assert.equal(r.tier, 'hike');
});

test('assess: peer and market layers are honestly dormant, not fabricated', () => {
  const r = Bench.assess({ item: 'chicken', observations: [{ cents: 1000, ts: 1 }, { cents: 1100, ts: 2 }] });
  assert.equal(r.peer.available, false);
  assert.equal(r.market.available, false);
  assert.equal(r.peer.reason, 'no-pool');
});

test('stemFor: case/punctuation/pack-number noise drops out', () => {
  // Same product, different casing + punctuation -> one identity.
  assert.equal(Bench.stemFor('Beef Tenderloin, PSMO'), Bench.stemFor('beef tenderloin psmo'));
  // Numeric pack tokens fall away to the alphabetic core.
  assert.equal(Bench.stemFor('STELLA ARTOIS 24/12 BTL'), 'stella artois');
});

test('resolveStem: auto-binds identical, proposes near, opens new', () => {
  const auto = Bench.resolveStem('OLIVE OIL', ['olive oil', 'beef tender']);
  assert.equal(auto.tier, 'auto');
  assert.equal(auto.stem, 'olive oil');

  // Substring/near match -> proposed, not silently merged (operator confirms).
  const propose = Bench.resolveStem('beef tenderloin', ['beef tender']);
  assert.equal(propose.tier, 'propose');

  const fresh = Bench.resolveStem('arborio rice', ['olive oil', 'beef tender']);
  assert.equal(fresh.tier, 'new');
});
