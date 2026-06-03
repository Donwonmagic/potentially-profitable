/**
 * market-vs-vendor.test.ts — the headline insight's attribution logic.
 * Proves the four honest verdicts + the "no fabricated market read" guard.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { attributeMove } from '../src/market-vs-vendor.js';
import type { CompositeTrend } from '../src/composite-price.js';

const trend = (pct: number | null, over: Partial<CompositeTrend> = {}): CompositeTrend =>
  ({ pct, dir: pct == null ? 'flat' : pct > 0.005 ? 'up' : pct < -0.005 ? 'down' : 'flat', agreement: 1, nSources: 3, ...over });

test('vendor moved far more than the market → "your vendor"', () => {
  const r = attributeMove({ ingredient: 'Beef', vendorPctMove: 0.18, marketTrend: trend(0.06), marketConfidence: 'high' });
  assert.equal(r.attribution, 'vendor');
  assert.equal(r.excessPct! > 0.11 && r.excessPct! < 0.13, true);
  assert.match(r.line, /Beef is up 18%/);
  assert.match(r.line, /market only moved 6%/);
  assert.match(r.line, /Worth a call/);
});

test('market flat but vendor raised → "your vendor"', () => {
  const r = attributeMove({ ingredient: 'Onions', vendorPctMove: 0.12, marketTrend: trend(0.0), marketConfidence: 'high' });
  assert.equal(r.attribution, 'vendor');
  assert.match(r.line, /roughly flat/);
});

test('vendor moved with the market → "it\'s the market"', () => {
  const r = attributeMove({ ingredient: 'Beef', vendorPctMove: 0.07, marketTrend: trend(0.06), marketConfidence: 'high' });
  assert.equal(r.attribution, 'market');
  assert.match(r.line, /so is the whole market/);
  assert.match(r.line, /a re-price is fair/);
});

test('seasonal market move nudges toward HOLD in the copy', () => {
  const r = attributeMove({ ingredient: 'Tomatoes', vendorPctMove: 0.30, marketTrend: trend(0.28), marketConfidence: 'high', seasonal: true });
  assert.equal(r.attribution, 'market');
  assert.equal(r.seasonal, true);
  assert.match(r.line, /seasonal/);
});

test('vendor moved LESS than a rising market → "holding the line"', () => {
  const r = attributeMove({ ingredient: 'Salmon', vendorPctMove: 0.04, marketTrend: trend(0.15), marketConfidence: 'high' });
  assert.equal(r.attribution, 'mixed');
  assert.match(r.line, /holding the line/);
});

test('no confident market read → say so, never fabricate', () => {
  const lowConf = attributeMove({ ingredient: 'Saffron', vendorPctMove: 0.20, marketTrend: trend(0.05), marketConfidence: 'low' });
  assert.equal(lowConf.attribution, 'unknown');
  assert.match(lowConf.line, /don't have a confident market read/);
  const noTrend = attributeMove({ ingredient: 'Saffron', vendorPctMove: 0.20, marketTrend: null });
  assert.equal(noTrend.attribution, 'unknown');
  assert.equal(noTrend.marketPctMove, null);
});
