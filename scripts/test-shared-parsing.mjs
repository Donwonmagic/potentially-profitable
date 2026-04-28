// Tests for tools/_shared/parse-number.js — the toolkit-wide loose
// number parser that handles every locale + format users actually
// paste from spreadsheets, websites, and Word docs.
//
// Shared modules don't have a per-tool home, so they live in their own
// test file. Run with `node scripts/test-shared-parsing.mjs`.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Parse = require('../tools/_shared/parse-number.js');

let failures = 0;
function assertEq(label, actual, expected) {
  if (actual === expected) {
    console.log('PASS  ' + label);
  } else {
    failures++;
    console.log('FAIL  ' + label + '  (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')');
  }
}
function assertClose(label, actual, expected, tol) {
  if (typeof actual === 'number' && Math.abs(actual - expected) <= (tol || 0.001)) {
    console.log('PASS  ' + label);
  } else {
    failures++;
    console.log('FAIL  ' + label + '  (expected ~' + expected + ' ±' + tol + ', got ' + JSON.stringify(actual) + ')');
  }
}
function assertTrue(label, condition) {
  if (condition) console.log('PASS  ' + label);
  else { failures++; console.log('FAIL  ' + label); }
}

// ------------------------------------------------------------
// Plain US format — the common case. Must not regress.
// ------------------------------------------------------------
assertEq('US: plain integer', Parse.parseLooseNumberValue('1234'), 1234);
assertEq('US: plain decimal', Parse.parseLooseNumberValue('8.50'), 8.5);
assertEq('US: thousands separator', Parse.parseLooseNumberValue('1,234'), 1234);
assertEq('US: thousands + decimal', Parse.parseLooseNumberValue('1,234.56'), 1234.56);
assertEq('US: multiple thousands', Parse.parseLooseNumberValue('1,234,567'), 1234567);
assertEq('US: leading zero decimal', Parse.parseLooseNumberValue('0.50'), 0.5);
assertEq('US: zero', Parse.parseLooseNumberValue('0'), 0);

// ------------------------------------------------------------
// EU/ES format — the bug Brand Suite proved hits real users.
// ------------------------------------------------------------
assertEq('EU: thousands . + decimal ,', Parse.parseLooseNumberValue('1.234,56'), 1234.56);
assertEq('EU: decimal ,', Parse.parseLooseNumberValue('8,50'), 8.5);
assertEq('EU: multiple thousands .', Parse.parseLooseNumberValue('1.234.567'), 1234567);
assertEq('EU: zero', Parse.parseLooseNumberValue('0,00'), 0);
// Ambiguous "1,234" with EU default → 1.234 (decimal)
assertEq('EU default: 1,234 → decimal',
         Parse.parseLooseNumberValue('1,234', { defaultLocale: 'eu' }), 1.234);
// Ambiguous "1,234" with US default → 1234 (thousands, exactly 3 digits after)
assertEq('US default: 1,234 → thousands',
         Parse.parseLooseNumberValue('1,234'), 1234);
// "1,5" — only 1 digit after comma → decimal regardless of locale
assertEq('Either locale: 1,5 → decimal', Parse.parseLooseNumberValue('1,5'), 1.5);

// ------------------------------------------------------------
// Currency symbols
// ------------------------------------------------------------
assertEq('Currency: $1,234.50', Parse.parseLooseNumberValue('$1,234.50'), 1234.5);
assertEq('Currency: €1.234,56', Parse.parseLooseNumberValue('€1.234,56'), 1234.56);
assertEq('Currency: £1,234.50', Parse.parseLooseNumberValue('£1,234.50'), 1234.5);
assertEq('Currency: ¥1234', Parse.parseLooseNumberValue('¥1234'), 1234);
{
  const r = Parse.parseLooseNumber('$50');
  assertEq('Currency presence flag', r.hadCurrency, true);
}
{
  const r = Parse.parseLooseNumber('50');
  assertEq('No currency → flag false', r.hadCurrency, false);
}

// ------------------------------------------------------------
// Percent
// ------------------------------------------------------------
assertEq('Percent: 30% raw', Parse.parseLooseNumberValue('30%'), 30);
assertEq('Percent: 30% with space', Parse.parseLooseNumberValue('30 %'), 30);
assertEq('Percent: -5% raw', Parse.parseLooseNumberValue('-5%'), -5);
assertEq('Percent: 30% as fraction',
         Parse.parseLooseNumberValue('30%', { percentAsFraction: true }), 0.3);
assertEq('Percent: 8,5% as fraction (EU)',
         Parse.parseLooseNumberValue('8,5%', { percentAsFraction: true }), 0.085);
{
  const r = Parse.parseLooseNumber('30%');
  assertEq('Percent flag', r.wasPercent, true);
}

// ------------------------------------------------------------
// Negative values — preserved by default; clamped only when asked
// ------------------------------------------------------------
assertEq('Negative: preserved', Parse.parseLooseNumberValue('-50'), -50);
assertEq('Negative: clamped on opt-in',
         Parse.parseLooseNumberValue('-50', { nonNegative: true }), 0);
assertEq('Negative: with currency', Parse.parseLooseNumberValue('-$50'), -50);
assertEq('Negative: leading +', Parse.parseLooseNumberValue('+50'), 50);

// ------------------------------------------------------------
// Smart quotes / curly quotes from Word/Pages pastes
// ------------------------------------------------------------
assertEq('Smart double quote: "50"', Parse.parseLooseNumberValue('“50”'), 50);
assertEq('Smart single quote: ‘50’', Parse.parseLooseNumberValue('‘50’'), 50);
assertEq('Curly apostrophe in number', Parse.parseLooseNumberValue('1’234.50'), 1234.5);

// ------------------------------------------------------------
// Whitespace + control characters
// ------------------------------------------------------------
assertEq('Leading/trailing whitespace', Parse.parseLooseNumberValue('  50  '), 50);
assertEq('NBSP separator: 1 234,56',
         Parse.parseLooseNumberValue('1 234,56'), 1234.56);
assertEq('Thin space separator', Parse.parseLooseNumberValue('1 234.56'), 1234.56);
assertEq('BOM prefix', Parse.parseLooseNumberValue('﻿50'), 50);

// ------------------------------------------------------------
// Invalid input → null (caller decides; no silent NaN)
// ------------------------------------------------------------
assertEq('Empty string → null', Parse.parseLooseNumberValue(''), null);
assertEq('Whitespace-only → null', Parse.parseLooseNumberValue('   '), null);
assertEq('Letters → null', Parse.parseLooseNumberValue('abc'), null);
assertEq('Mixed garbage → null', Parse.parseLooseNumberValue('5x'), null);
assertEq('null input → null', Parse.parseLooseNumberValue(null), null);
assertEq('undefined input → null', Parse.parseLooseNumberValue(undefined), null);

// ------------------------------------------------------------
// Discriminated record — caller can read intent
// ------------------------------------------------------------
{
  const r = Parse.parseLooseNumber('€1.234,56');
  assertClose('record value', r.value, 1234.56);
  assertEq('record hadCurrency', r.hadCurrency, true);
  assertEq('record wasPercent', r.wasPercent, false);
  assertEq('record raw', r.raw, '€1.234,56');
}

// ------------------------------------------------------------
// Real-user fixtures from the audit findings
// ------------------------------------------------------------
// Argentinian owner pasting delivery economics
assertClose('Argentinian: 1.234,56', Parse.parseLooseNumberValue('1.234,56'), 1234.56);
// UK owner pasting catering quote
assertClose('UK: £1,234.50', Parse.parseLooseNumberValue('£1,234.50'), 1234.5);
// Spanish menu price
assertClose('Spanish menu price: €24,50', Parse.parseLooseNumberValue('€24,50'), 24.5);

// ------------------------------------------------------------
// Result
// ------------------------------------------------------------
if (failures === 0) {
  console.log('\n✓ all shared-parsing assertions pass');
  process.exit(0);
} else {
  console.log('\n✗ ' + failures + ' assertion(s) failed');
  process.exit(1);
}
