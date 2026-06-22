/**
 * Unit tests — tools/_shared/vendor-ask.js
 * Run via:  node --test tools/_shared/vendor-ask.test.mjs
 *
 * PARITY GUARANTEE. The owner-facing vendor-ask copy, pinned EN + ES. Muntin
 * Ledger mirrors these vectors verbatim on the TypeScript port.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const S = require('./spread-decompose.js');
const V = require('./vendor-ask.js');

const decompFor = (over) => S.decompose({
  ownDeltaPct: 0.14, marketDeltaPct: 0.06,
  marketConfidence: 'high', marketAgreement: 0.8, vendorPeriods: 6, ...over,
});
const baseCard = {
  ingredient: 'Romaine', vendor: 'Sysco', itemName: 'Caesar',
  ownDeltaPct: 0.14, marketDeltaPct: 0.06, unitPriceText: '$32/case', dishDollarsPerWeek: 47,
};

test('vendor (EN): leads with the recoverable dollars + a show-your-work ask', () => {
  const c = V.build({ decomposition: decompFor(), ...baseCard, locale: 'en' });
  assert.equal(c.tier, 'vendor');
  assert.equal(c.show, true);
  assert.equal(c.vendorDollarsPerWeek, 27);          // 47 * vendorShare 0.57
  for (const s of ['14%', '6%', '$27', 'Caesar', 'vendor']) assert.match(c.headline, new RegExp(s.replace('$', '\\$')));
  for (const s of ['Sysco', '$32/case', 'can you do better']) assert.match(c.ask, new RegExp(s.replace('$', '\\$')));
  assert.equal(c.options[0].kind, 'draft_ask');      // one default action, first
});

test('vendor (ES): full Spanish, not a translation stub', () => {
  const c = V.build({ decomposition: decompFor(), ...baseCard, locale: 'es' });
  assert.equal(c.tier, 'vendor');
  for (const s of ['14%', '6%', '$27', 'proveedor']) assert.match(c.headline, new RegExp(s.replace('$', '\\$')));
  assert.match(c.ask, /puedes mejorarlo/);
  assert.equal(c.options[0].label, 'Prepara el mensaje');
});

test('HONESTY: the headline discloses BOTH numbers, never just one', () => {
  const c = V.build({ decomposition: decompFor(), ...baseCard, locale: 'en' });
  assert.match(c.headline, /14%/); // own
  assert.match(c.headline, /6%/);  // market
});

test('market move: say so plainly, NO vendor ask (a false alarm lowers IAR)', () => {
  const d = S.decompose({ ownDeltaPct: 0.07, marketDeltaPct: 0.065, marketConfidence: 'high', marketAgreement: 0.8, vendorPeriods: 5 });
  const c = V.build({ decomposition: d, ingredient: 'Romaine', vendor: 'Sysco', itemName: 'Caesar', ownDeltaPct: 0.07, marketDeltaPct: 0.065, dishDollarsPerWeek: 20, locale: 'en' });
  assert.equal(c.tier, 'market');
  assert.equal(c.show, true);
  assert.equal(c.ask, null);
  assert.match(c.headline, /market/);
  assert.doesNotMatch(c.headline, /Sysco/);
  assert.equal(c.options[0].kind, 'reprice');
});

test('mixed: discloses the split, still hands over the ask', () => {
  const d = S.decompose({ ownDeltaPct: 0.14, marketDeltaPct: 0.10, marketConfidence: 'high', marketAgreement: 0.7, vendorPeriods: 4 });
  const c = V.build({ decomposition: d, ...baseCard, marketDeltaPct: 0.10, dishDollarsPerWeek: 47, locale: 'en' });
  assert.equal(c.tier, 'mixed');
  assert.ok(c.ask);
  assert.equal(c.vendorDollarsPerWeek, 14);          // 47 * vendorShare 0.29
  assert.match(c.headline, /14%/);
  assert.match(c.headline, /10%/);
});

test('gated decomposition → show:false, no card at all', () => {
  const d = decompFor({ marketConfidence: 'low' });
  const c = V.build({ decomposition: d, ...baseCard, locale: 'en' });
  assert.equal(c.tier, 'gated');
  assert.equal(c.show, false);
  assert.equal(c.headline, null);
  assert.equal(c.ask, null);
  assert.equal(c.options.length, 0);
  assert.equal(c.reason, 'market-confidence-below-medium');
});

test('never invents a dollar figure: no dish $/week → no money clause', () => {
  const c = V.build({ decomposition: decompFor(), ingredient: 'Romaine', vendor: 'Sysco', itemName: 'Caesar', ownDeltaPct: 0.14, marketDeltaPct: 0.06, locale: 'en' });
  assert.equal(c.vendorDollarsPerWeek, null);
  assert.doesNotMatch(c.headline, /\$/);             // no fabricated dollars
  assert.match(c.headline, /14%/);                   // still discloses both rates
  assert.match(c.headline, /6%/);
});
