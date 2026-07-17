/**
 * from-continuity.test.mjs — pins the ?from injection guard (Move 9).
 * Run: node --test tools/_shared/from-continuity.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { titleFor } = require('./from-continuity.js');

const MAP = {
  'romaine-lettuce': { en: 'Romaine lettuce', es: 'Lechuga romana' },
  'eggs': { en: 'Eggs', es: 'Huevo' },
};

test('titleFor: returns the committed title for a valid slug, per locale', () => {
  assert.equal(titleFor('romaine-lettuce', MAP, 'en'), 'Romaine lettuce');
  assert.equal(titleFor('romaine-lettuce', MAP, 'es'), 'Lechuga romana');
  assert.equal(titleFor('eggs', MAP, 'en'), 'Eggs');
});

test('titleFor: prototype-pollution keys never resolve', () => {
  assert.equal(titleFor('__proto__', MAP, 'en'), '');
  assert.equal(titleFor('constructor', MAP, 'en'), '');
  assert.equal(titleFor('prototype', MAP, 'en'), '');
  assert.equal(titleFor('hasOwnProperty', MAP, 'en'), '');   // own-prop check → not in MAP → ''
});

test('titleFor: charset guard rejects anything but [a-z0-9-]{1,40}', () => {
  assert.equal(titleFor('Romaine Lettuce', MAP, 'en'), '');   // uppercase + space
  assert.equal(titleFor('<script>', MAP, 'en'), '');          // angle brackets
  assert.equal(titleFor('eggs/../x', MAP, 'en'), '');         // slashes
  assert.equal(titleFor('a'.repeat(41), MAP, 'en'), '');      // over length cap
  assert.equal(titleFor('', MAP, 'en'), '');                  // empty
});

test('titleFor: unknown / label-less slug → silent no-op', () => {
  assert.equal(titleFor('striploin', MAP, 'en'), '');         // valid shape, not in map
  assert.equal(titleFor('pork-belly', MAP, 'es'), '');
});

test('titleFor: a slug missing its ES title never echoes the EN one on an ES page', () => {
  const partial = { 'x-only-en': { en: 'X' } };
  assert.equal(titleFor('x-only-en', partial, 'es'), '');     // no es → '' (not 'X')
  assert.equal(titleFor('x-only-en', partial, 'en'), 'X');
});

test('titleFor: non-string / bad map inputs → ""', () => {
  assert.equal(titleFor(null, MAP, 'en'), '');
  assert.equal(titleFor(undefined, MAP, 'en'), '');
  assert.equal(titleFor('eggs', null, 'en'), '');
  assert.equal(titleFor('eggs', 'not-a-map', 'en'), '');
});
