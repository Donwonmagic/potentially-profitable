/**
 * Pins the composite-price engine — the discipline that makes a
 * multi-source price HONEST: separate level from trend, anchor the
 * level on one basis (never average across incommensurable bases),
 * blend trend robustly, and keep provenance.
 *
 *   node --test tools/_shared/composite-price.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('./composite-price.js');

test('LEVEL anchors on the most delivered-relevant basis — never averages across bases', () => {
  // Delivered $10.00 and wholesale $6.00 present. The honest level is
  // delivered ($10), NOT an $8 average that is true of neither.
  const lvl = C.compositeLevel([
    { source: 'ledger', basis: 'delivered', valueCents: 1000, date: '2026-05-01' },
    { source: 'usda-ams', basis: 'wholesale', valueCents: 600, date: '2026-05-01' },
  ]);
  assert.equal(lvl.basis, 'delivered');
  assert.equal(lvl.medianCents, 1000);
});

test('LEVEL ignores index sources (an index has no dollar value)', () => {
  const lvl = C.compositeLevel([
    { source: 'bls-ppi', basis: 'index', valueCents: 9999 }, // should be ignored
    { source: 'usda-ams', basis: 'wholesale', valueCents: 600 },
  ]);
  assert.equal(lvl.basis, 'wholesale');
  assert.equal(lvl.medianCents, 600);
});

test('LEVEL is a range with provenance, null when no level basis exists', () => {
  const lvl = C.compositeLevel([
    { source: 'a', basis: 'wholesale', valueCents: 500, date: '2026-05-01' },
    { source: 'b', basis: 'wholesale', valueCents: 700, date: '2026-05-01' },
    { source: 'c', basis: 'wholesale', valueCents: 900, date: '2026-05-01' },
  ]);
  assert.equal(lvl.medianCents, 700);
  assert.ok(lvl.rangeCents[0] <= 700 && lvl.rangeCents[1] >= 700);
  assert.equal(lvl.provenance.length, 3);
  // index-only -> no level
  assert.equal(C.compositeLevel([{ source: 'ppi', basis: 'index', valueCents: 120 }]), null);
});

test('windowChange yields a clean % for a dollar level OR a unitless index', () => {
  assert.equal(C.windowChange([1000, 1100]).toFixed(2), '0.10');     // +10% level
  assert.equal(C.windowChange([100, 106]).toFixed(2), '0.06');       // +6% index
  assert.equal(C.windowChange([1]), null);                            // need 2 points
});

test('TREND blends with a weighted median, robust to one outlier source', () => {
  // Three sources agree ~+6–8%, one bad source says -40%. Median holds.
  const t = C.blendTrend([
    { source: 'ams', pct: 0.06 },
    { source: 'ppi', pct: 0.08 },
    { source: 'fred', pct: 0.07 },
    { source: 'glitch', pct: -0.40 },
  ]);
  assert.equal(t.dir, 'up');
  assert.ok(t.pct >= 0.06 && t.pct <= 0.08, 'weighted median ignores the outlier');
  assert.equal(t.agreement, 0.75); // 3 of 4 agree on "up"
});

test('TREND reports low agreement when sources disagree on direction', () => {
  const t = C.blendTrend([
    { source: 'a', pct: 0.10 },
    { source: 'b', pct: -0.10 },
  ]);
  assert.ok(t.agreement <= 0.5);
});

test('assess: level + corroborated trend → high confidence, honest range label', () => {
  const r = C.assess({
    levelObs: [
      { source: 'ams1', basis: 'wholesale', valueCents: 1300 },
      { source: 'ams2', basis: 'wholesale', valueCents: 1500 },
    ],
    sourceSeries: {
      ams:  { basis: 'wholesale', values: [1300, 1400] },
      ppi:  { basis: 'index', values: [100, 107] },
      fred: { basis: 'index', values: [200, 213] },
    },
    asOf: '2026-06-01',
  });
  assert.equal(r.trend.dir, 'up');
  assert.equal(r.confidence, 'high');
  assert.match(r.label, /reference/);
  assert.match(r.label, /up \+/);
  assert.ok(r.provenance.length >= 4); // level + trend sources retained
});

test('assess: index-only sources → directional-only, never a fabricated level', () => {
  const r = C.assess({
    levelObs: [{ source: 'ppi', basis: 'index', valueCents: 120 }], // no real level
    sourceSeries: {
      ppi:  { basis: 'index', values: [100, 109] },
      fred: { basis: 'index', values: [200, 218] },
    },
  });
  assert.equal(r.level, null);
  assert.equal(r.confidence, 'directional');
  assert.match(r.label, /Directional only/);
  assert.match(r.label, /market moved up/);
});

test('assess: empty input degrades gracefully', () => {
  const r = C.assess({});
  assert.equal(r.level, null);
  assert.equal(r.trend.pct, null);
  assert.match(r.label, /Not enough data/);
});
