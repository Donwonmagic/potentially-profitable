/**
 * Unit tests — tools/menu-design/menu-render-text.js
 * Run via:  node --test tools/menu-design/menu-render-text.test.mjs
 *
 * Coverage focus: Wave B2's disclaimer wiring (the Markdown +
 * plain-text emitters must render an opts.disclaimer block above
 * the last-updated line). Other rendering invariants are exercised
 * by the existing scripts/check-menu-design.mjs.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

function loadRenderer() {
  const src = fs.readFileSync(path.join(__dirname, 'menu-render-text.js'), 'utf8');
  const moduleObj = { exports: {} };
  const ctx = vm.createContext({
    window:   {},
    module:   moduleObj,
    Promise,
    setTimeout, clearTimeout,
    console
  });
  vm.runInContext(src, ctx);
  return moduleObj.exports;
}

const SEED_ROWS = [
  { kind: 'section', name: 'Starters' },
  { kind: 'dish', name: 'Caesar', price: '12', desc: 'crisp', allergens: ['DF'] },
  { kind: 'section', name: 'Mains' },
  { kind: 'dish', name: 'Steak',  price: '34', allergens: ['GF'] }
];

// ============== Plain text disclaimer ==============
test('exportPlainText emits a wrapped disclaimer above the last-updated line', () => {
  const TEXT = loadRenderer();
  const out = TEXT.exportPlainText({
    rows: SEED_ROWS,
    title: 'X',
    locale: 'en',
    disclaimer: 'Please inform your server of any allergies. Cross-contamination is possible in our kitchen.'
  });
  assert.match(out, /Please inform your server/);
  assert.match(out, /Cross-contamination is possible/);
  // Disclaimer appears BEFORE the last-updated line
  const idxDisc = out.indexOf('Please inform');
  const idxFoot = out.indexOf('Last updated:');
  assert.ok(idxDisc < idxFoot, 'disclaimer renders above last-updated');
});

test('exportPlainText omits the disclaimer block when empty', () => {
  const TEXT = loadRenderer();
  const out = TEXT.exportPlainText({
    rows: SEED_ROWS,
    title: 'X',
    locale: 'en'
  });
  assert.doesNotMatch(out, /Please inform/);
});

test('exportPlainText word-wraps a long disclaimer to ~60 columns', () => {
  const TEXT = loadRenderer();
  // ~120 chars; should wrap to 2+ lines.
  const long = 'If you have a food allergy or intolerance, please ask a member of staff before ordering. We list all 14 allergens.';
  const out = TEXT.exportPlainText({
    rows: SEED_ROWS,
    title: 'X',
    locale: 'en',
    disclaimer: long
  });
  // Find the disclaimer area, slice up to last-updated line
  const slice = out.slice(out.indexOf('---'), out.indexOf('Last updated:'));
  // Most lines should fit under ~62 cols (60 + slop for one extra word).
  const lines = slice.split('\n').filter(l => l && !/^-+$/.test(l));
  lines.forEach(l => {
    assert.ok(l.length <= 64, `line too long (${l.length}): "${l}"`);
  });
});

// ============== Markdown disclaimer ==============
test('exportMarkdown emits the disclaimer as a blockquote above the last-updated', () => {
  const TEXT = loadRenderer();
  const md = TEXT.exportMarkdown({
    rows: SEED_ROWS,
    title: 'X',
    locale: 'en',
    disclaimer: 'Please inform your server of any allergies.'
  });
  assert.match(md, /^> Please inform your server/m);
  // Markdown horizontal rule + blockquote ordering
  const hrIdx = md.lastIndexOf('---');
  const bqIdx = md.indexOf('> Please inform');
  assert.ok(hrIdx >= 0 && bqIdx > hrIdx, 'disclaimer follows the markdown HR');
});

test('exportMarkdown omits the disclaimer when missing', () => {
  const TEXT = loadRenderer();
  const md = TEXT.exportMarkdown({
    rows: SEED_ROWS,
    title: 'X',
    locale: 'en'
  });
  assert.doesNotMatch(md, /Please inform/);
});

test('exportPlainText emits ES disclaimer when supplied', () => {
  const TEXT = loadRenderer();
  const out = TEXT.exportPlainText({
    rows: SEED_ROWS,
    title: 'X',
    locale: 'es',
    disclaimer: 'Por favor informe a su mesero de cualquier alergia.'
  });
  assert.match(out, /informe a su mesero/);
  assert.match(out, /Última actualización:/);
});
