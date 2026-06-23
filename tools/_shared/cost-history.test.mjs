/**
 * Parity vectors — cost-history.js (insight E15). The Ledger cost-history.ts
 * port mirrors these verbatim.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require('./cost-history.js');

const BASE = Date.parse('2026-01-01T00:00:00Z');
const at = (dayOffset) => new Date(BASE + dayOffset * 86400000).toISOString();

test('UP (EN): net % + window from the dates + $ receipt + sparkline order', () => {
  const c = build({ dish: 'Caesar', points: [{ at: at(0), plateCostCents: 540 }, { at: at(182), plateCostCents: 589 }], locale: 'en' });
  assert.equal(c.show, true);
  assert.equal(c.direction, 'up');
  assert.equal(c.netDeltaPct, 9.1); // (589-540)/540
  assert.deepEqual(c.spark, [540, 589]); // oldest -> newest
  assert.match(c.headline, /Caesar's plate cost is up 9.1% over the past 6 months/);
  assert.match(c.headline, /\$5\.40 to \$5\.89/);
  assert.deepEqual(c.options[0], { kind: 'open_dish', dish: 'Caesar', label: 'Open Caesar' });
});

test('UP (ES): full Spanish', () => {
  const c = build({ dish: 'Caesar', points: [{ at: at(0), plateCostCents: 540 }, { at: at(182), plateCostCents: 589 }], locale: 'es' });
  assert.match(c.headline, /El costo de tu Caesar subió 9.1% en los últimos 6 meses/);
  assert.match(c.headline, /de \$5\.40 a \$5\.89/);
  assert.equal(c.options[0].label, 'Abre Caesar');
});

test('FLAT: a steady dish reads calm and offers no action', () => {
  const c = build({ dish: 'Caesar', points: [{ at: at(0), plateCostCents: 540 }, { at: at(60), plateCostCents: 545 }], locale: 'en' });
  assert.equal(c.direction, 'flat');
  assert.match(c.headline, /has held steady over the past 9 weeks/);
  assert.match(c.headline, /around \$5\.45/);
  assert.deepEqual(c.options, []);
});

test('DOWN: a falling cost, months window', () => {
  const c = build({ dish: 'Cobb', points: [{ at: at(0), plateCostCents: 600 }, { at: at(90), plateCostCents: 540 }], locale: 'en' });
  assert.equal(c.direction, 'down');
  assert.equal(c.netDeltaPct, -10);
  assert.match(c.headline, /is down 10% over the past 3 months/);
});

test('weeks window when the span is short', () => {
  const c = build({ dish: 'Wings', points: [{ at: at(0), plateCostCents: 540 }, { at: at(21), plateCostCents: 560 }], locale: 'en' });
  assert.match(c.headline, /over the past 3 weeks/);
});

test('optional market side-by-side is labeled to a NAMED ingredient', () => {
  const c = build({ dish: 'Caesar', points: [{ at: at(0), plateCostCents: 540 }, { at: at(182), plateCostCents: 589 }], marketDeltaPct: 6, marketLabel: 'romaine', locale: 'en' });
  assert.match(c.headline, /the market for romaine moved \+6%/);
  const down = build({ dish: 'Caesar', points: [{ at: at(0), plateCostCents: 540 }, { at: at(182), plateCostCents: 589 }], marketDeltaPct: -6, marketLabel: 'romaine', locale: 'en' });
  assert.match(down.headline, /the market for romaine moved −6%/);
});

test('HONESTY: fewer than 2 usable points → not enough history, no line drawn', () => {
  const c = build({ dish: 'Caesar', points: [{ at: at(0), plateCostCents: 540 }], locale: 'en' });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'insufficient-history');
});

test('HONESTY: bad points are dropped; order is normalized regardless of input order', () => {
  const c = build({
    dish: 'Caesar',
    points: [
      { at: at(182), plateCostCents: 589 }, // newest first in the input
      { at: at(90), plateCostCents: 0 }, // invalid → dropped
      { at: at(0), plateCostCents: 540 },
    ],
    locale: 'en',
  });
  assert.deepEqual(c.spark, [540, 589]); // sorted oldest->newest, invalid removed
  assert.equal(c.direction, 'up');
});
