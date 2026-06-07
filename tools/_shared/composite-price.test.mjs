/**
 * Unit tests — tools/_shared/composite-price.js
 * Run via:  node --test tools/_shared/composite-price.test.mjs
 *
 * PARITY GUARANTEE. 12 vectors; Muntin Ledger mirrors them verbatim at
 * apps/api/tests/cost-index/composite-price.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const C = require('./composite-price.js');

test('LEVEL anchors on the most delivered-relevant basis — never averages across bases', () => {
  const lvl = C.compositeLevel([
    { source: 'ledger', basis: 'delivered', valueCents: 1000, date: '2026-05-01' },
    { source: 'usda-ams', basis: 'wholesale', valueCents: 600, date: '2026-05-01' },
  ]);
  assert.equal(lvl.basis, 'delivered');
  assert.equal(lvl.medianCents, 1000);
});

test('LEVEL ignores index sources (an index has no dollar value)', () => {
  const lvl = C.compositeLevel([
    { source: 'bls-ppi', basis: 'index', valueCents: 9999 },
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
  assert.equal(C.compositeLevel([{ source: 'ppi', basis: 'index', valueCents: 120 }]), null);
});

test('windowChange yields a clean % for a dollar level OR a unitless index', () => {
  assert.equal(C.windowChange([1000, 1100]).toFixed(2), '0.10');
  assert.equal(C.windowChange([100, 106]).toFixed(2), '0.06');
  assert.equal(C.windowChange([1]), null);
});

test('TREND blends with a weighted median, robust to one outlier source', () => {
  const t = C.blendTrend([
    { source: 'ams', pct: 0.06 }, { source: 'ppi', pct: 0.08 },
    { source: 'fred', pct: 0.07 }, { source: 'glitch', pct: -0.40 },
  ]);
  assert.equal(t.dir, 'up');
  assert.ok(t.pct >= 0.06 && t.pct <= 0.08, 'weighted median ignores the outlier');
  assert.equal(t.agreement, 0.75);
});

test('TREND reports low agreement when sources disagree on direction', () => {
  const t = C.blendTrend([{ source: 'a', pct: 0.10 }, { source: 'b', pct: -0.10 }]);
  assert.ok(t.agreement <= 0.5);
});

test('assess: level + corroborated trend → high confidence, honest range label', () => {
  const r = C.assess({
    levelObs: [
      { source: 'ams1', basis: 'wholesale', valueCents: 1300 },
      { source: 'ams2', basis: 'wholesale', valueCents: 1500 },
    ],
    sourceSeries: {
      ams: { basis: 'wholesale', values: [1300, 1400] },
      ppi: { basis: 'index', values: [100, 107] },
      fred: { basis: 'index', values: [200, 213] },
    },
    asOf: '2026-06-01',
  });
  assert.equal(r.trend.dir, 'up');
  assert.equal(r.confidence, 'high');
  assert.match(r.label, /reference/);
  assert.match(r.label, /up \+/);
  assert.ok(r.provenance.length >= 4);
});

test('assess: index-only sources → directional-only, never a fabricated level', () => {
  const r = C.assess({
    levelObs: [{ source: 'ppi', basis: 'index', valueCents: 120 }],
    sourceSeries: {
      ppi: { basis: 'index', values: [100, 109] },
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

test('LEVEL n=1: a single independent family is a point, never a fake $X–$X band', () => {
  const r = C.assess({
    levelObs: [{ source: 'usda-ams', basis: 'wholesale', valueCents: 1390 }],
    sourceSeries: { 'usda-ams': { basis: 'wholesale', values: [1300, 1390] } },
  });
  assert.equal(r.level.nFamilies, 1);
  assert.match(r.label, /single source/);
  assert.doesNotMatch(r.label, /\$13\.90.\$13\.90/);
});

test('DE-CORRELATION: mirror sources sharing a family count as ONE and cannot dominate', () => {
  const t = C.blendTrend([
    { source: 'bls', pct: 0.20, family: 'us-index' },
    { source: 'fred', pct: 0.20, family: 'us-index' },
    { source: 'ams', pct: 0.04, family: 'ams' },
  ]);
  assert.equal(t.nFamilies, 2);
  assert.equal(t.nSources, 3);
  assert.ok(t.pct < 0.20);
});

test('DE-CORRELATION flows through confidence: three echoes of one family cannot reach "high"', () => {
  const r = C.assess({
    levelObs: [
      { source: 'ams1', basis: 'wholesale', valueCents: 1300, family: 'ams' },
      { source: 'ams2', basis: 'wholesale', valueCents: 1500, family: 'ams' },
    ],
    sourceSeries: {
      fred1: { basis: 'index', values: [100, 107], family: 'us-index' },
      fred2: { basis: 'index', values: [200, 214], family: 'us-index' },
      fred3: { basis: 'index', values: [300, 321], family: 'us-index' },
    },
  });
  assert.equal(r.level.nFamilies, 1);
  assert.equal(r.trend.nFamilies, 1);
  assert.notEqual(r.confidence, 'high');
});
