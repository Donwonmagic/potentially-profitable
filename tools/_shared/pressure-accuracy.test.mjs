import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { realizedExpectation, scoreCalls, shouldSuppress, summary } = require('./pressure-accuracy.js');

test('a call expects the matching realized move', () => {
  assert.equal(realizedExpectation('building'), 'up');
  assert.equal(realizedExpectation('easing'), 'down');
  assert.equal(realizedExpectation('steady'), 'flat');
  assert.equal(realizedExpectation('unknown'), null);
});

test('scoreCalls counts hits, rate, and the trailing miss-streak', () => {
  const pairs = [
    { predicted: 'building', realized: 'up' },   // hit
    { predicted: 'easing', realized: 'down' },   // hit
    { predicted: 'building', realized: 'down' }, // miss
    { predicted: 'steady', realized: 'up' }      // miss (newest)
  ];
  const s = scoreCalls(pairs);
  assert.equal(s.n, 4);
  assert.equal(s.hits, 2);
  assert.equal(s.hitRate, 0.5);
  assert.equal(s.missStreak, 2);   // last two are misses
});

test('regime-breaker suppresses only on enough calls + a cold streak', () => {
  const cold = [
    { predicted: 'building', realized: 'up' },
    { predicted: 'easing', realized: 'up' },     // miss
    { predicted: 'building', realized: 'down' }, // miss
    { predicted: 'easing', realized: 'up' }      // miss → streak 3
  ];
  assert.equal(shouldSuppress(cold), true);
  // a long good record with a single recent miss does NOT suppress
  const good = [
    { predicted: 'building', realized: 'up' },
    { predicted: 'easing', realized: 'down' },
    { predicted: 'steady', realized: 'flat' },
    { predicted: 'building', realized: 'down' }  // 1 miss
  ];
  assert.equal(shouldSuppress(good), false);
  // too few calls → never suppress, even all-miss
  assert.equal(shouldSuppress([{ predicted: 'building', realized: 'down' }]), false);
});

test('summary is a plain track-record phrase, no price', () => {
  const pairs = [{ predicted: 'building', realized: 'up' }, { predicted: 'easing', realized: 'up' }];
  assert.equal(summary(pairs, false), 'Right on 1 of the last 2 measured prints.');
  assert.equal(summary(pairs, true), 'Acertó 1 de las últimas 2 lecturas medidas.');
  assert.equal(summary([], false), '');
  assert.ok(!/\$/.test(summary(pairs, false)));
});
