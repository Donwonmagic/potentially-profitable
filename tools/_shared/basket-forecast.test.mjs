import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { forecast, isStorable } = require('./basket-forecast.js');

const BACKTEST = { verdict: { coneHonestThroughH: 1, seasonalUseful: true } };
const PRESSURE = { items: {
  'ribeye':        { direction: 'building', confidence: 'high',     under_review: false },
  'vegetable-oil': { direction: 'building', confidence: 'moderate', under_review: false },
  'chicken-breast':{ direction: 'easing',   confidence: 'high',     under_review: false },
  'onion':         { direction: 'building', confidence: 'low',      under_review: false }, // too thin for the call
  'short-rib':     { direction: 'building', confidence: 'high',     under_review: true }   // unproven
}};

test('gives a forward call only to the backtest-validated reach', () => {
  const r = forecast({ pressure: PRESSURE, backtest: BACKTEST });
  assert.equal(r.horizonHonest, 1);
  assert.equal(r.outlook, 'building'); // 2 building movers (ribeye, veg-oil) vs 1 easing
  assert.match(r.note, /1 print/);
});

test('makes NO forward call when the backtest does not earn one', () => {
  const r = forecast({ pressure: PRESSURE, backtest: { verdict: { coneHonestThroughH: 0 } } });
  assert.equal(r.outlook, 'no-forward-call');
  assert.match(r.note, /measured/);
  assert.ok(r.movers.length > 0); // still reports the measured state
});

test('storable building -> lock; perishable building -> watch; easing -> feature', () => {
  const r = forecast({ pressure: PRESSURE, backtest: BACKTEST });
  assert.deepEqual(r.lockCandidates, ['vegetable-oil']); // oil stores
  assert.deepEqual(r.watchCandidates, ['ribeye']);       // protein can't be locked
  assert.deepEqual(r.featureCandidates, ['chicken-breast']);
});

test('excludes under-review and sub-moderate edges from the movers', () => {
  const r = forecast({ pressure: PRESSURE, backtest: BACKTEST });
  const slugs = r.movers.map((m) => m.slug);
  assert.ok(!slugs.includes('short-rib')); // under_review
  assert.ok(!slugs.includes('onion'));     // low confidence
  // but counts still tally the measured directions (incl. low/under-review-excluded)
  assert.equal(r.counts.building >= 2, true);
});

test('basketSlugs limits the outlook to what the operator buys', () => {
  const r = forecast({ pressure: PRESSURE, backtest: BACKTEST, basketSlugs: ['chicken-breast'] });
  assert.equal(r.outlook, 'easing');
  assert.deepEqual(r.featureCandidates, ['chicken-breast']);
  assert.equal(r.counts.building, 0);
});

test('attaches a seasonal-low cue when seasonality is ready and useful', () => {
  const seasonality = { ingredients: [
    { key: 'chicken-breast', ready: true, months: {
      '1':{medianCents:200},'2':{medianCents:190},'3':{medianCents:150},'4':{medianCents:140},
      '5':{medianCents:160},'6':{medianCents:210},'7':{medianCents:220},'8':{medianCents:230},
      '9':{medianCents:215},'10':{medianCents:205},'11':{medianCents:195},'12':{medianCents:205} } }
  ]};
  const r = forecast({ pressure: PRESSURE, backtest: BACKTEST, seasonality, month: 4 });
  const chicken = r.movers.find((m) => m.slug === 'chicken-breast');
  assert.equal(chicken.seasonalNote, 'seasonal-low'); // April is in the cheap third
});

test('isStorable is conservative (oils yes, proteins no)', () => {
  assert.equal(isStorable('vegetable-oil'), true);
  assert.equal(isStorable('white-rice'), true);
  assert.equal(isStorable('ribeye'), false);
  assert.equal(isStorable('chicken-breast'), false);
});

test('degrades safely with no pressure', () => {
  const r = forecast({ backtest: BACKTEST });
  assert.equal(r.outlook, 'steady');
  assert.deepEqual(r.movers, []);
});
