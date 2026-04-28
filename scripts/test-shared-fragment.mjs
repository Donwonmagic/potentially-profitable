// Tests for tools/_shared/url-fragment.js — the toolkit-wide fragment
// encoder/decoder that lets dish names and ingredients with `|` / `&`
// / `=` survive cross-tool deep-links round-trip.
//
// Run with `node scripts/test-shared-fragment.mjs`.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const F = require('../tools/_shared/url-fragment.js');

let failures = 0;
function assertEq(label, actual, expected) {
  if (actual === expected) console.log('PASS  ' + label);
  else { failures++; console.log('FAIL  ' + label + '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')'); }
}
function assertTrue(label, condition) {
  if (condition) console.log('PASS  ' + label);
  else { failures++; console.log('FAIL  ' + label); }
}

// ------------------------------------------------------------
// Plain ASCII passes through unchanged
// ------------------------------------------------------------
assertEq('plain text unchanged', F.encodeRowField('Tonnarelli'), 'Tonnarelli');
assertEq('numbers unchanged', F.encodeRowField('1234.56'), '1234.56');
assertEq('letters + spaces', F.encodeRowField('Cacio e pepe'), 'Cacio e pepe');

// ------------------------------------------------------------
// Reserved characters get escaped
// ------------------------------------------------------------
assertEq('pipe encoded', F.encodeRowField('Fish | Chips'), 'Fish ~h7C~ Chips');
assertEq('semicolon encoded', F.encodeRowField('foo;bar'), 'foo~h3B~bar');
assertEq('tilde encoded', F.encodeRowField('a~b'), 'a~h7E~b');
assertEq('equals encoded', F.encodeRowField('key=val'), 'key~h3D~val');
assertEq('ampersand encoded', F.encodeRowField('Fish & Chips'), 'Fish ~h26~ Chips');
assertEq('hash encoded', F.encodeRowField('#tag'), '~h23~tag');

// ------------------------------------------------------------
// Round-trip — every reserved char survives encode → decode
// ------------------------------------------------------------
const torture = ['Fish & Chips | Pan-Seared', 'a~b;c=d#e', '|||', '~h7C~', '#abc&def=ghi'];
torture.forEach((s, i) => {
  assertEq('round-trip[' + i + ']: ' + s, F.decodeRowField(F.encodeRowField(s)), s);
});

// ------------------------------------------------------------
// The audit-found dishes — concrete real-user fixtures
// ------------------------------------------------------------
{
  const dish = 'Fish & Chips | Pan-Seared';
  const encoded = F.encodeRowField(dish);
  // The encoded form contains NO reserved chars (other than the escape
  // tokens themselves, which use ~ but in a deterministic ~h…~ form
  // that decodes back).
  assertTrue('encoded form contains no raw |',
             encoded.indexOf('|') === -1 || encoded.indexOf('|') >= 999);
  assertTrue('encoded form contains no raw &',
             encoded.indexOf('&') === -1);
  assertEq('round-trip preserves Fish & Chips | Pan-Seared',
           F.decodeRowField(encoded), dish);
}
{
  const ingredient = 'Butter | Cultured';
  assertEq('Butter | Cultured round-trips',
           F.decodeRowField(F.encodeRowField(ingredient)), ingredient);
}

// ------------------------------------------------------------
// encodeRow / decodeRow — multi-field with `;` separator
// ------------------------------------------------------------
{
  const fields = ['Tonnarelli', '8.50', 'pasta'];
  const row = F.encodeRow(fields);
  assertEq('encodeRow joins with ;', row, 'Tonnarelli;8.50;pasta');
  const decoded = F.decodeRow(row);
  assertEq('decodeRow length', decoded.length, 3);
  assertEq('decodeRow[0]', decoded[0], 'Tonnarelli');
  assertEq('decodeRow[1]', decoded[1], '8.50');
  assertEq('decodeRow[2]', decoded[2], 'pasta');
}
{
  // A field containing the row separator itself round-trips.
  const fields = ['Fish; Chips', 'with garlic & onion', '12.50'];
  const row = F.encodeRow(fields);
  // The row should split into exactly 3 fields on `;`, NOT 4 — the
  // semicolon inside the first field is escaped.
  const decoded = F.decodeRow(row);
  assertEq('field with embedded ; round-trips count', decoded.length, 3);
  assertEq('field with embedded ; round-trips content', decoded[0], 'Fish; Chips');
}

// ------------------------------------------------------------
// Hex normalisation
// ------------------------------------------------------------
assertEq('hex: lowercase → uppercase', F.normaliseHex('#abc123'), '#ABC123');
assertEq('hex: no prefix → with prefix', F.normaliseHex('abc123'), '#ABC123');
assertEq('hex: 3-char expansion', F.normaliseHex('#fff'), '#FFFFFF');
assertEq('hex: 3-char no prefix', F.normaliseHex('abc'), '#AABBCC');
assertEq('hex: 8-char alpha dropped', F.normaliseHex('#abcdef80'), '#ABCDEF');
assertEq('hex: invalid → null', F.normaliseHex('xyz'), null);
assertEq('hex: empty → null', F.normaliseHex(''), null);
assertEq('hex: too short → null', F.normaliseHex('#ab'), null);
assertEq('hex: too long (5) → null', F.normaliseHex('#abcde'), null);
assertEq('hex: too long (7) → null', F.normaliseHex('#abcdef0'), null);
assertEq('hex: whitespace stripped', F.normaliseHex('  #fff  '), '#FFFFFF');

// ------------------------------------------------------------
// Edge cases
// ------------------------------------------------------------
assertEq('empty string passthrough', F.encodeRowField(''), '');
assertEq('null encoded as empty', F.encodeRowField(null), '');
assertEq('undefined encoded as empty', F.encodeRowField(undefined), '');
assertEq('empty decode round-trips', F.decodeRowField(''), '');
assertEq('numeric input encoded', F.encodeRowField(42), '42');

// ------------------------------------------------------------
// Result
// ------------------------------------------------------------
if (failures === 0) {
  console.log('\n✓ all shared-fragment assertions pass');
  process.exit(0);
} else {
  console.log('\n✗ ' + failures + ' assertion(s) failed');
  process.exit(1);
}
