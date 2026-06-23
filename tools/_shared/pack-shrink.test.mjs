/**
 * Unit tests — tools/_shared/pack-shrink.js
 * Run via:  node --test tools/_shared/pack-shrink.test.mjs
 *
 * PARITY GUARANTEE. Insight E3 (the silent pack-shrink hike), pinned EN + ES.
 * Muntin Ledger mirrors these vectors verbatim on the TypeScript port.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const P = require('./pack-shrink.js');

// Olive oil: same $144 case, pack quietly shrinks 6x1gal -> 4x1gal.
// per-gal cost: $24 -> $36 (+50%), sticker unchanged.
const OIL = {
  ingredient: 'olive oil',
  prior:   { packLabel: '6x1gal', centsPerBase: 2400, casePriceCents: 14400, baseUnit: 'gal' },
  current: { packLabel: '4x1gal', centsPerBase: 3600, casePriceCents: 14400, baseUnit: 'gal' },
  market:  { deltaPct: 0.0, confidence: 'high' },
};

test('detect (EN): names the pack change, the exact per-base %, and the flat market', () => {
  const c = P.build({ ...OIL, locale: 'en' });
  assert.equal(c.tier, 'pack-shrink');
  assert.equal(c.show, true);
  assert.equal(c.perBasePct, 50);
  assert.equal(c.packFrom, '6x1gal');
  assert.equal(c.packTo, '4x1gal');
  assert.equal(c.marketFlat, true);
  for (const s of ['50%', 'gal', '6x1gal', '4x1gal', 'has not moved']) assert.match(c.headline, new RegExp(s));
  assert.equal(c.options[0].kind, 'flag_requote');
});

test('detect (ES): full Spanish', () => {
  const c = P.build({ ...OIL, locale: 'es' });
  assert.equal(c.tier, 'pack-shrink');
  for (const s of ['50%', 'paquete', '6x1gal', '4x1gal', 'no se ha movido']) assert.match(c.headline, new RegExp(s));
  assert.equal(c.options[0].label, 'Márcalo para re-cotizar');
});

test('not silent: when the sticker price ALSO moved, it is an ordinary hike, not a pack trick', () => {
  const c = P.build({
    ingredient: 'olive oil',
    prior:   { packLabel: '6x1gal', centsPerBase: 2400, casePriceCents: 14400, baseUnit: 'gal' },
    current: { packLabel: '4x1gal', centsPerBase: 4320, casePriceCents: 17280, baseUnit: 'gal' }, // +20% sticker
  });
  assert.equal(c.tier, 'none');
  assert.equal(c.reason, 'sticker-also-moved');
});

test('no pack change → a straight price move, not E3', () => {
  const c = P.build({
    ingredient: 'olive oil',
    prior:   { packLabel: '6x1gal', centsPerBase: 2400, casePriceCents: 14400, baseUnit: 'gal' },
    current: { packLabel: '6x1gal', centsPerBase: 2640, casePriceCents: 15840, baseUnit: 'gal' },
  });
  assert.equal(c.tier, 'none');
  assert.equal(c.reason, 'no-pack-change');
});

test('market clause omitted when the index actually moved (no false flat claim)', () => {
  const c = P.build({ ...OIL, market: { deltaPct: 0.08, confidence: 'high' }, locale: 'en' });
  assert.equal(c.tier, 'pack-shrink');
  assert.equal(c.marketFlat, false);
  assert.doesNotMatch(c.headline, /has not moved/);
});

test('fails closed on a base-unit mismatch (never compares gal to lb)', () => {
  const c = P.build({
    ingredient: 'olive oil',
    prior:   { packLabel: '6x1gal', centsPerBase: 2400, baseUnit: 'gal' },
    current: { packLabel: '4x1gal', centsPerBase: 3600, baseUnit: 'lb' },
  });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'unit-mismatch');
});

test('immaterial per-base move (< 5%) → nothing to flag', () => {
  const c = P.build({
    ingredient: 'olive oil',
    prior:   { packLabel: '6x1gal', centsPerBase: 2400, baseUnit: 'gal' },
    current: { packLabel: '4x1gal', centsPerBase: 2460, baseUnit: 'gal' }, // +2.5%
  });
  assert.equal(c.tier, 'none');
  assert.equal(c.reason, 'immaterial');
});

test('no sticker data → still flags on per-base + pack, but drops the "same price" framing', () => {
  const c = P.build({
    ingredient: 'olive oil',
    prior:   { packLabel: '6x1gal', centsPerBase: 2400, baseUnit: 'gal' },
    current: { packLabel: '4x1gal', centsPerBase: 3600, baseUnit: 'gal' },
    locale: 'en',
  });
  assert.equal(c.tier, 'pack-shrink');
  assert.doesNotMatch(c.headline, /same price/);
  assert.match(c.headline, /50%/);
});
