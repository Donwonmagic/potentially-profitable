/**
 * Unit tests — tools/menu-design/data/allergens.js
 * Run via:   node --test tools/menu-design/data/allergens.test.mjs
 *
 * Coverage focus: regime math (FDA Big 9 = 9, EU FIC 14 = 14),
 * backwards-compatibility of the original 11-code list, kind
 * discriminators, byRegime / inRegime semantics.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const A = require('./allergens.js');

const ORIGINAL_11 = ['V', 'VG', 'GF', 'DF', 'N', 'E', 'SO', 'SF', 'FI', 'SE', 'LO'];

test('original 11 codes preserved at head of CODES (back-compat)', () => {
  assert.deepEqual(A.CODES.slice(0, 11).map(c => c.id), ORIGINAL_11);
});

test('total catalog has 17 codes (11 original + 6 added)', () => {
  assert.equal(A.CODES.length, 17);
});

test('Wave B2 additions present', () => {
  const ids = A.CODES.map(c => c.id);
  ['PE', 'MU', 'CE', 'LU', 'MO', 'SU'].forEach(id => {
    assert.ok(ids.includes(id), `missing added code: ${id}`);
  });
});

test('REGIMES registry has 5 keys', () => {
  assert.deepEqual(
    Object.keys(A.REGIMES).sort(),
    ['au-fsanz', 'ca-health', 'eu-fic14', 'uk-ppds', 'us-fda9']
  );
});

test('US FDA Big 9 contains exactly 9 allergens', () => {
  const fda = A.allergensInRegime('us-fda9').map(c => c.id).sort();
  assert.equal(fda.length, 9);
  assert.deepEqual(fda, ['DF', 'E', 'FI', 'GF', 'N', 'PE', 'SE', 'SF', 'SO']);
});

test('EU FIC 14 contains exactly 14 allergens', () => {
  const eu = A.allergensInRegime('eu-fic14').map(c => c.id).sort();
  assert.equal(eu.length, 14);
  assert.deepEqual(eu, ['CE', 'DF', 'E', 'FI', 'GF', 'LU', 'MO', 'MU', 'N', 'PE', 'SE', 'SF', 'SO', 'SU']);
});

test('UK PPDS = EU FIC 14', () => {
  const uk = A.allergensInRegime('uk-ppds').map(c => c.id).sort();
  const eu = A.allergensInRegime('eu-fic14').map(c => c.id).sort();
  assert.deepEqual(uk, eu);
});

test('Canada Health includes mustard but not celery/lupin', () => {
  const ca = A.allergensInRegime('ca-health').map(c => c.id);
  assert.ok(ca.includes('MU'), 'mustard included');
  assert.ok(!ca.includes('CE'), 'celery NOT included');
  assert.ok(!ca.includes('LU'), 'lupin NOT included');
});

test('AU/NZ FSANZ includes lupin but not mustard/celery', () => {
  const au = A.allergensInRegime('au-fsanz').map(c => c.id);
  assert.ok(au.includes('LU'), 'lupin included');
  assert.ok(!au.includes('MU'), 'mustard NOT included');
  assert.ok(!au.includes('CE'), 'celery NOT included');
});

test('byRegime includes dietary + sourcing codes regardless of regime', () => {
  const us = A.byRegime('us-fda9').map(c => c.id);
  // 9 allergens + V + VG + LO = 12
  assert.equal(us.length, 12);
  assert.ok(us.includes('V') && us.includes('VG') && us.includes('LO'));
});

test('byRegime falls back to default regime when called with bogus input', () => {
  const fallback = A.byRegime('mars-edition').map(c => c.id);
  const def = A.byRegime(A.DEFAULT_REGIME).map(c => c.id);
  assert.deepEqual(fallback, def);
});

test('kindOf classifies correctly', () => {
  assert.equal(A.kindOf('V'),  'dietary');
  assert.equal(A.kindOf('VG'), 'dietary');
  assert.equal(A.kindOf('LO'), 'sourcing');
  assert.equal(A.kindOf('GF'), 'allergen');
  assert.equal(A.kindOf('PE'), 'allergen');
  assert.equal(A.kindOf('XX'), null);
});

test('inRegime: dietary/sourcing always true; allergens vary', () => {
  assert.equal(A.inRegime('V', 'us-fda9'),  true,  'vegan always available');
  assert.equal(A.inRegime('LO', 'eu-fic14'), true, 'sourcing always available');
  assert.equal(A.inRegime('MU', 'us-fda9'), false, 'mustard not in US Big 9');
  assert.equal(A.inRegime('MU', 'eu-fic14'), true, 'mustard in EU FIC 14');
  assert.equal(A.inRegime('PE', 'us-fda9'), true,  'peanuts in US Big 9');
  assert.equal(A.inRegime('XX', 'us-fda9'), false, 'unknown id false');
});

test('label helper honors locale', () => {
  assert.equal(A.label('GF', 'en'), 'Gluten-free');
  assert.equal(A.label('GF', 'es'), 'Sin gluten');
  // Wave B2 additions translate
  assert.equal(A.label('MU', 'en'), 'Mustard');
  assert.equal(A.label('MU', 'es'), 'Mostaza');
  // Unknown id passes through
  assert.equal(A.label('XX', 'en'), 'XX');
});

test('N (tree nuts) and PE (peanuts) are distinct codes', () => {
  const n  = A.byId('N');
  const pe = A.byId('PE');
  assert.equal(n.id,  'N');
  assert.equal(pe.id, 'PE');
  assert.match(n.label_en,  /tree nuts/i);
  assert.match(pe.label_en, /peanuts/i);
});
