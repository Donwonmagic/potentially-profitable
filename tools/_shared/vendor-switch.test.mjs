/**
 * Unit tests — tools/_shared/vendor-switch.js
 * Run via:  node --test tools/_shared/vendor-switch.test.mjs
 *
 * PARITY GUARANTEE. Flagship E2 ("you already buy it cheaper"), pinned EN + ES.
 * Muntin Ledger mirrors these vectors verbatim on the TypeScript port.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const W = require('./vendor-switch.js');

// cross-vendor.compare shape: cheapest-first, gapPctVsCheapest on each row.
const ROWS = [
  { vendor: 'US Foods', medianComparable: 5.20, comparableUnit: 'lb', observations: 6, gapPctVsCheapest: 0 },
  { vendor: 'Sysco',    medianComparable: 5.67, comparableUnit: 'lb', observations: 6, gapPctVsCheapest: 9 },
];

test('switch (EN): names the gap + the recoverable $/week + a one-tap re-bind', () => {
  const c = W.build({ compareRows: ROWS, currentVendor: 'Sysco', ingredient: 'mozzarella', saving: { targetVendor: 'US Foods', savingPerWeek: 18 }, locale: 'en' });
  assert.equal(c.tier, 'switch');
  assert.equal(c.show, true);
  assert.equal(c.gapPct, 9);
  assert.equal(c.cheaperVendor, 'US Foods');
  assert.equal(c.savingPerWeek, 18);
  for (const s of ['9%', 'US Foods', 'Sysco', 'mozzarella', '$18']) assert.match(c.headline, new RegExp(s.replace('$', '\\$')));
  assert.equal(c.options[0].kind, 'switch_vendor');
  assert.match(c.options[0].label, /US Foods/);
});

test('switch (ES): full Spanish, loss-framed on the price (running ~9% more)', () => {
  const c = W.build({ compareRows: ROWS, currentVendor: 'Sysco', ingredient: 'mozzarella', saving: { targetVendor: 'US Foods', savingPerWeek: 18 }, locale: 'es' });
  assert.equal(c.tier, 'switch');
  for (const s of ['9%', 'US Foods', 'Sysco', '$18']) assert.match(c.headline, new RegExp(s.replace('$', '\\$')));
  assert.match(c.headline, /más caro/);
  assert.equal(c.options[0].label, 'Pon US Foods de preferido');
});

test("softens the vendor tally to 'more than one vendor' (never a count that could undercount)", () => {
  const en = W.build({ compareRows: ROWS, currentVendor: 'Sysco', ingredient: 'mozzarella', locale: 'en' });
  assert.match(en.headline, /from more than one vendor/);
  assert.doesNotMatch(en.headline, /from \d+ vendors/);
  const es = W.build({ compareRows: ROWS, currentVendor: 'Sysco', ingredient: 'mozzarella', locale: 'es' });
  assert.match(es.headline, /de más de un proveedor/);
  assert.doesNotMatch(es.headline, /de \d+ proveedores/);
});

test('already cheapest: calm green, show:false, no CTA', () => {
  const c = W.build({ compareRows: ROWS, currentVendor: 'US Foods', ingredient: 'mozzarella', locale: 'en' });
  assert.equal(c.tier, 'best');
  assert.equal(c.show, false);
  assert.equal(c.options.length, 0);
  assert.equal(c.reason, 'already-cheapest');
});

test('immaterial gap (< 3%): not worth a switch → calm, show:false', () => {
  const rows = [
    { vendor: 'US Foods', medianComparable: 5.20, comparableUnit: 'lb', observations: 5, gapPctVsCheapest: 0 },
    { vendor: 'Sysco',    medianComparable: 5.30, comparableUnit: 'lb', observations: 5, gapPctVsCheapest: 2 },
  ];
  const c = W.build({ compareRows: rows, currentVendor: 'Sysco', ingredient: 'mozzarella', locale: 'en' });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'gap-immaterial');
});

test('boundary gap 2.5% (would round UP to 3): below the >=3% rail → stays calm, does NOT fire', () => {
  const rows = [
    { vendor: 'US Foods', medianComparable: 2.00, comparableUnit: 'lb', observations: 5, gapPctVsCheapest: 0 },
    { vendor: 'Sysco',    medianComparable: 2.05, comparableUnit: 'lb', observations: 5, gapPctVsCheapest: 2.5 },
  ];
  const c = W.build({ compareRows: rows, currentVendor: 'Sysco', ingredient: 'mozzarella', locale: 'en' });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'gap-immaterial');
});

test('gap is shown EXACTLY, never rounded up: an 8.6% gap reads "8.6%", not an overstated "9%"', () => {
  const rows = [
    { vendor: 'US Foods', medianComparable: 5.00, comparableUnit: 'lb', observations: 6, gapPctVsCheapest: 0 },
    { vendor: 'Sysco',    medianComparable: 5.43, comparableUnit: 'lb', observations: 6, gapPctVsCheapest: 8.6 },
  ];
  const c = W.build({ compareRows: rows, currentVendor: 'Sysco', ingredient: 'mozzarella', locale: 'en' });
  assert.equal(c.tier, 'switch');
  assert.equal(c.gapPct, 8.6);
  assert.match(c.headline, /8\.6%/);
  assert.doesNotMatch(c.headline, /9%/);
});

test('sub-$0.50 weekly saving → no fabricated "$0/week"; falls back to "would trim that"', () => {
  const c = W.build({ compareRows: ROWS, currentVendor: 'Sysco', ingredient: 'mozzarella', saving: { targetVendor: 'US Foods', savingPerWeek: 0.30 }, locale: 'en' });
  assert.equal(c.tier, 'switch');
  assert.equal(c.savingPerWeek, null);
  assert.doesNotMatch(c.headline, /\$/);          // no "$0"
  assert.match(c.headline, /would trim that/);    // the honest no-number fallback
});

test('fewer than 2 vendors → nothing to compare', () => {
  assert.equal(W.build({ compareRows: null, currentVendor: 'Sysco', ingredient: 'x' }).reason, 'insufficient-vendors');
  assert.equal(W.build({ compareRows: [ROWS[0]], currentVendor: 'US Foods', ingredient: 'x' }).reason, 'insufficient-vendors');
});

test('current vendor not in the comparison → fail closed, no card', () => {
  const c = W.build({ compareRows: ROWS, currentVendor: 'Cisco', ingredient: 'mozzarella', locale: 'en' });
  assert.equal(c.show, false);
  assert.equal(c.reason, 'current-vendor-not-found');
});

test('never invents dollars: no saving → switch card with no $/week clause', () => {
  const c = W.build({ compareRows: ROWS, currentVendor: 'Sysco', ingredient: 'mozzarella', locale: 'en' });
  assert.equal(c.tier, 'switch');         // gap is still material
  assert.equal(c.savingPerWeek, null);
  assert.doesNotMatch(c.headline, /\$/);  // no fabricated dollars
  assert.match(c.headline, /9%/);          // still names the exact gap
});
