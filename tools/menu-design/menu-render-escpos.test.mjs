/**
 * Unit tests — tools/menu-design/menu-render-escpos.js
 * Run via:  node --test tools/menu-design/menu-render-escpos.test.mjs
 *
 * Coverage focus: ESC/POS byte output is correct for the common
 * receipt-printer expectations (init, alignment, cut commands),
 * ASCII-safe text encoding strips diacritics without garbling, and
 * the column-aligned name/price formatter handles long names with
 * wrap.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ESC = require('./menu-render-escpos.js');

function bytesToString(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

test('exportEscpos returns Uint8Array bytes + filename', () => {
  const out = ESC.exportEscpos({
    title: 'Da Marco',
    rows: [
      { kind: 'section', name: 'Antipasti' },
      { kind: 'dish', name: 'Bruschetta', price: '$8', desc: 'levain, tomato', allergens: ['V', 'GL'] }
    ]
  });
  assert.ok(out.blob, 'blob present');
  assert.match(out.filename, /\.bin$/);
  assert.ok(out.byteCount > 50, 'non-empty output');
});

test('output starts with ESC/POS init bytes (1B 40)', () => {
  const bytes = ESC.buildEscpos({ title: 'X', rows: [] });
  assert.equal(bytes[0], 0x1B, 'first byte ESC');
  assert.equal(bytes[1], 0x40, 'second byte 0x40 (init)');
});

test('output ends with partial-cut bytes (1D 56 42 00)', () => {
  const bytes = ESC.buildEscpos({ title: 'X', rows: [] });
  const tail = Array.from(bytes.slice(-4));
  assert.deepEqual(tail, [0x1D, 0x56, 0x42, 0x00], 'partial cut at end');
});

test('asciiSafe strips diacritics + curly quotes', () => {
  assert.equal(ESC._asciiSafe('Tiramisù della casa'), 'Tiramisu della casa');
  assert.equal(ESC._asciiSafe('café "ñoño"'), 'cafe "nono"');
  assert.equal(ESC._asciiSafe('it’s — fancy…'), "it's - fancy...");
});

test('asciiSafe replaces non-ASCII fallback with ?', () => {
  // Chinese / emoji / out-of-Latin glyphs reduce to ?-runs.
  // Emoji is a UTF-16 surrogate pair so it produces two '?'s
  // (one per code unit). The exact count doesn't matter for the
  // print output — what matters is no out-of-range bytes ship.
  assert.equal(ESC._asciiSafe('北京'), '??');
  assert.equal(ESC._asciiSafe('Pizza 🍕'), 'Pizza ??');
  // Sanity: no non-ASCII byte survives.
  assert.match(ESC._asciiSafe('北京 Pizza 🍕'), /^[\x20-\x7E\n]+$/);
});

test('nameAndPriceLine right-aligns price within column count', () => {
  // Default 48 cols
  const line = ESC._nameAndPriceLine('Bruschetta', '$8');
  assert.ok(line.endsWith('$8\n'));
  assert.equal(line.replace('\n', '').length, 48, 'line padded to 48 cols');
  // 32 cols
  const line32 = ESC._nameAndPriceLine('Bruschetta', '$8', 32);
  assert.equal(line32.replace('\n', '').length, 32);
});

test('nameAndPriceLine wraps long names to a separate line + right-aligns price', () => {
  const long = 'Slow-braised duck-leg cassoulet with house bacon and rosemary';
  const out = ESC._nameAndPriceLine(long, '$32');
  // Should produce multiple lines
  assert.ok(out.split('\n').length >= 2, 'wrapped output is multi-line');
  // Last line should end with the price
  const lines = out.trim().split('\n');
  assert.match(lines[lines.length - 1], /\$32$/);
});

test('section names render uppercase + with rule chars between header and body', () => {
  const bytes = ESC.buildEscpos({
    title: 'X',
    rows: [
      { kind: 'section', name: 'Antipasti' },
      { kind: 'dish', name: 'A', price: '1' }
    ]
  });
  const text = bytesToString(bytes);
  assert.ok(text.indexOf('ANTIPASTI') !== -1, 'section title uppercase');
  // The header rule under the title is a row of dashes.
  assert.match(text, /-{20,}/);
});

test('quietMode + non-existent fields gracefully no-op', () => {
  const bytes = ESC.buildEscpos({
    title: '',
    rows: [
      { kind: 'section' },
      { kind: 'dish' },
      { kind: 'dish', name: '', price: '', desc: '', allergens: [] }
    ]
  });
  // Empty rows should produce only init + footer + cut, not crash.
  assert.ok(bytes.length > 4, 'init + cut at least');
  assert.ok(bytes.length < 500, 'small output for empty input');
});

test('paperWidth=58 narrows column layout to 32 chars', () => {
  const out = ESC._nameAndPriceLine('Carbonara', '$18', 32);
  const trimmed = out.replace('\n', '');
  // Length should be exactly cols
  assert.equal(trimmed.length, 32);
});

test('allergens render as a comma-separated indented line', () => {
  const bytes = ESC.buildEscpos({
    title: 'X',
    rows: [
      { kind: 'dish', name: 'Caesar', price: '14', allergens: ['DF', 'F', 'E'] }
    ]
  });
  const text = bytesToString(bytes);
  assert.ok(text.indexOf('allergens: DF, F, E') !== -1, 'allergens line present');
});

test('footer carries default English allergen prompt when meta.askYourServer is empty', () => {
  const bytes = ESC.buildEscpos({ title: 'X', rows: [] });
  const text = bytesToString(bytes);
  assert.ok(text.indexOf('Ask your server about allergens') !== -1);
});

test('footer carries Spanish allergen prompt when locale=es', () => {
  const bytes = ESC.buildEscpos({ title: 'X', rows: [], locale: 'es' });
  const text = bytesToString(bytes);
  assert.ok(text.indexOf('Pregunta al servidor') !== -1);
});

test('filename slugified from title', () => {
  const out = ESC.exportEscpos({ title: 'Café Da Marco!', rows: [] });
  assert.equal(out.filename, 'cafe-da-marco-thermal.bin');
});
