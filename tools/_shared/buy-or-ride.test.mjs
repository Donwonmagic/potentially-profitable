/**
 * Parity vectors — buy-or-ride.js (insight E7). The Ledger buy-or-ride.ts port
 * mirrors these verbatim.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { decide } = require('./buy-or-ride.js');

const base = { ingredient: 'Beef', hikePct: 12, daysOfCover: 9, spikeVerdict: 'spike', retrace: 0.4, locale: 'en' };

test('RIDE (EN): comfortable cover + retraced spike → hold, re-check', () => {
  const c = decide(base);
  assert.equal(c.tier, 'ride');
  assert.equal(c.actionBias, 'hold');
  assert.equal(c.show, true);
  assert.equal(c.daysOfCover, 9);
  assert.match(c.headline, /up 12%/);
  assert.match(c.headline, /9 days on hand/);
  assert.match(c.headline, /pulled back from its peak/);
  assert.match(c.headline, /re-check Monday/);
  assert.deepEqual(c.options[0], { kind: 'remind', label: 'Remind me Monday' });
});

test('RIDE (ES): full Spanish', () => {
  const c = decide({ ...base, locale: 'es' });
  assert.match(c.headline, /subió 12%/);
  assert.match(c.headline, /9 días en inventario/);
  assert.match(c.headline, /bajó algo desde su punto alto/);
  assert.match(c.headline, /Revisamos el lunes/);
  assert.equal(c.options[0].label, 'Recuérdame el lunes');
});

test('BUY-NOW: nearly out + spike → must buy at the high, mitigate on the dish', () => {
  const c = decide({ ...base, daysOfCover: 1 });
  assert.equal(c.tier, 'buy-now');
  assert.equal(c.actionBias, 'act');
  assert.match(c.headline, /down to 1 day\b/);
  assert.match(c.headline, /buying at the high/);
  assert.deepEqual(c.options[0], { kind: 'see_move', label: 'See the move' });
});

test('STRUCTURAL → REPRICE regardless of cover (cover only flexes the phrasing)', () => {
  const hi = decide({ ...base, spikeVerdict: 'structural', daysOfCover: 9 });
  assert.equal(hi.tier, 'reprice');
  assert.equal(hi.actionBias, 're-price');
  assert.match(hi.headline, /real, sustained move/);
  assert.match(hi.headline, /even with 9 days on hand/);
  const lo = decide({ ...base, spikeVerdict: 'structural', daysOfCover: 1 });
  assert.equal(lo.tier, 'reprice');
  assert.match(lo.headline, /down to 1 day\b/);
});

test('EMERGING + room → WATCH; EMERGING + nearly out → BUY-NOW (forced buy)', () => {
  const watch = decide({ ...base, spikeVerdict: 'emerging', daysOfCover: 9 });
  assert.equal(watch.tier, 'watch');
  assert.equal(watch.actionBias, 'watch');
  assert.match(watch.headline, /too early to tell/);
  const buy = decide({ ...base, spikeVerdict: 'emerging', daysOfCover: 1 });
  assert.equal(buy.tier, 'buy-now');
});

test('dish $/week appears only when supplied — never invented', () => {
  const withDish = decide({ ...base, daysOfCover: 1, dishImpactPerWeek: 47 });
  assert.match(withDish.headline, /\$47\/week/);
  const without = decide({ ...base, daysOfCover: 1 });
  assert.doesNotMatch(without.headline, /\$/);
});

test('lead time tightens the forced-buy point: 5 days cover − 4 day lead → buy now', () => {
  const c = decide({ ...base, daysOfCover: 5, leadTimeDays: 4 });
  assert.equal(c.tier, 'buy-now');
});

test('ride phrasing flexes by verdict: easing vs flat', () => {
  assert.match(decide({ ...base, spikeVerdict: 'easing' }).headline, /market has actually been easing/);
  assert.match(decide({ ...base, spikeVerdict: 'flat' }).headline, /barely moved/);
});

test('HONESTY: no cover read → no card (never invents inventory)', () => {
  const c = decide({ ...base, daysOfCover: null });
  assert.equal(c.tier, 'none');
  assert.equal(c.show, false);
  assert.equal(c.reason, 'no-coverage');
});

test('HONESTY: a sub-material hike → no card', () => {
  const c = decide({ ...base, hikePct: 0.3 });
  assert.equal(c.tier, 'none');
  assert.equal(c.reason, 'no-hike');
});
