import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { cadenceFor, stalenessOf, capConfidence } = require('./cost-staleness.js');

// Build a point whose freshest level print is `staleDays` before the read date.
function point(type, staleDays, asOf = '2026-06-16') {
  const d = new Date(Date.parse(asOf) - staleDays * 86400000).toISOString().slice(0, 10);
  return { asOf, level: { provenance: [{ source: type, type, date: d, valueCents: 100 }] } };
}

test('cadenceFor: known weekly/monthly, conservative default', () => {
  assert.equal(cadenceFor('usda-ams'), 7);
  assert.equal(cadenceFor('noaa-trade'), 31);
  assert.equal(cadenceFor('mystery-source'), 31);
});

test('fresh weekly source → no cap', () => {
  const s = stalenessOf(point('usda-ams', 3));
  assert.equal(s.overdue, false);
  assert.equal(s.ceiling, null);
});

test('monthly source a month old reads FRESH (old ≠ overdue)', () => {
  // The seafood case: 30 days stale but a 31-day cadence → ratio ~0.97, no penalty.
  const s = stalenessOf(point('noaa-trade', 30));
  assert.ok(s.ratio < 1.5, `ratio ${s.ratio} within one cadence`);
  assert.equal(s.ceiling, null);
  assert.equal(s.overdue, false);
});

test('weekly source three weeks stale → overdue, capped to medium', () => {
  const s = stalenessOf(point('usda-ams', 21));   // 21/7 = 3 cadences
  assert.ok(s.overdue, 'three cadences behind is overdue');
  assert.equal(s.ceiling, 'low');                  // ratio 3.0 → ≤4 → 'low'
});

test('ceiling steps down with how overdue it is', () => {
  assert.equal(stalenessOf(point('usda-ams', 14)).ceiling, 'medium'); // 2.0 → ≤2.5
  assert.equal(stalenessOf(point('usda-ams', 21)).ceiling, 'low');    // 3.0 → ≤4
  assert.equal(stalenessOf(point('usda-ams', 42)).ceiling, 'directional'); // 6.0 → >4
});

test('capConfidence: never exceeds ceiling, no-cap passes through', () => {
  assert.equal(capConfidence('high', 'medium'), 'medium');
  assert.equal(capConfidence('high', null), 'high');
  assert.equal(capConfidence('low', 'medium'), 'low');   // already below ceiling
  assert.equal(capConfidence('directional', 'low'), 'directional');
});

test('null when no dated level provenance', () => {
  assert.equal(stalenessOf({ asOf: '2026-06-16', level: {} }), null);
  assert.equal(stalenessOf({ level: { provenance: [{ type: 'usda-ams', date: '2026-06-01' }] } }), null);
});

test('future-dated print clamps to 0 (no negative staleness)', () => {
  const s = stalenessOf(point('usda-ams', -5));
  assert.equal(s.staleDays, 0);
  assert.equal(s.ceiling, null);
});
