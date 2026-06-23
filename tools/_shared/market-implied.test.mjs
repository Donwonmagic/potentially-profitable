/**
 * Unit tests — tools/_shared/market-implied.js
 * Run via:  node --test tools/_shared/market-implied.test.mjs
 *
 * PARITY GUARANTEE. Insight E12 (the labeled market-implied teaser), EN + ES.
 * Muntin Ledger mirrors these vectors verbatim on the TypeScript port.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const T = require('./market-implied.js');

const BASE = { category: 'produce', marketDeltaPct: 0.09, marketConfidence: 'high', dishExample: 'Caesar', impliedPerPlateCents: 20, area: 'mid-Atlantic' };

test('teaser (EN): names the move + the estimate, ALWAYS labeled "not your real cost"', () => {
  const c = T.build({ ...BASE, locale: 'en' });
  assert.equal(c.tier, 'teaser');
  assert.equal(c.show, true);
  assert.match(c.headline, /produce prices in your area moved \+9%/);
  assert.match(c.headline, /\$0\.20\/plate/);
  assert.match(c.headline, /a market estimate, not your real cost/); // the non-negotiable label
  assert.equal(c.options[0].kind, 'connect_invoice');
});

test('teaser (ES): full Spanish, still labeled an estimate', () => {
  const c = T.build({ ...BASE, locale: 'es' });
  assert.match(c.headline, /se movieron \+9%/);
  assert.match(c.headline, /un estimado del mercado, no tu costo real/);
  assert.equal(c.options[0].label, 'Conecta una factura');
});

test('stays silent on a thin index read (no anxiety-bait)', () => {
  const c = T.build({ ...BASE, marketConfidence: 'low', locale: 'en' });
  assert.equal(c.tier, 'none');
  assert.equal(c.show, false);
  assert.equal(c.reason, 'thin-confidence');
});

test('stays silent on a flat/immaterial move', () => {
  const c = T.build({ ...BASE, marketDeltaPct: 0.01, locale: 'en' });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'flat-or-immaterial');
});

test('never invents a per-plate figure: no implied cents → drop that clause, keep the CTA', () => {
  const c = T.build({ category: 'produce', marketDeltaPct: 0.09, marketConfidence: 'medium', dishExample: 'Caesar', locale: 'en' });
  assert.equal(c.tier, 'teaser');
  assert.doesNotMatch(c.headline, /\/plate/);
  assert.match(c.headline, /a market estimate, not your real cost/);
  assert.equal(c.options[0].kind, 'connect_invoice');
});
