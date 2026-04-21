#!/usr/bin/env node
// Phase 2 U4: i18n-coverage regression test.
// Run via: `node scripts/test-i18n-coverage.mjs`
//
// Locks in the contract that every data-tr / data-tr-html /
// data-tr-attr key referenced in tools/audits/restaurant/index.html
// resolves to a Spanish string via either:
//   - the inline window.__MUNTIN_UI_ES dictionary in index.html, OR
//   - the UI_I18N map in restaurant-checks.js (consulted by t() and
//     by the resolveTr() fallback added in Phase 2 U4).
//
// Without this test it's easy to add a new <span data-tr="my.key">
// in HTML and forget the matching translation entry — the page
// would silently render in English on the Spanish mirror.
//
// Exits non-zero on failure.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);
const ROOT      = path.resolve(__dirname, '..');

const HTML_PATH = path.join(ROOT, 'tools/audits/restaurant/index.html');
const CHECKS    = require(path.join(ROOT, 'tools/audits/restaurant/restaurant-checks.js'));

let failures = 0;
function assert(label, cond, detail) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label + (cond ? '' : '  ' + (detail || '')));
  if (!cond) failures++;
}

const html = fs.readFileSync(HTML_PATH, 'utf8');

// Extract every data-tr key, every data-tr-html key, and every key
// inside a data-tr-attr="attr:key;attr:key" composite.
function collectKeys(html) {
  const keys = new Set();
  const trRe = /data-tr="([a-zA-Z0-9._]+)"/g;
  const trHtmlRe = /data-tr-html="([a-zA-Z0-9._]+)"/g;
  const trAttrRe = /data-tr-attr="([^"]+)"/g;
  let m;
  while ((m = trRe.exec(html))) keys.add(m[1]);
  while ((m = trHtmlRe.exec(html))) keys.add(m[1]);
  while ((m = trAttrRe.exec(html))) {
    const spec = m[1];
    spec.split(';').forEach((pair) => {
      const bits = pair.split(':');
      if (bits.length === 2) keys.add(bits[1].trim());
    });
  }
  return Array.from(keys).sort();
}

// Extract the inline __MUNTIN_UI_ES dictionary keys via the literal
// JS source. The block has the shape:
//   window.__MUNTIN_UI_ES = { 'k1': '...', 'k2': '...', ... };
function extractMuntinEsKeys(html) {
  const start = html.indexOf('window.__MUNTIN_UI_ES = {');
  if (start < 0) return new Set();
  const blockStart = html.indexOf('{', start);
  // Find the matching closing brace by walking — quick and accurate
  // enough for the well-formed dictionary literal in this file.
  let depth = 0;
  let i = blockStart;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const block = html.slice(blockStart, i + 1);
  const keys = new Set();
  const re = /'([a-zA-Z][a-zA-Z0-9._]+)'\s*:/g;
  let m;
  while ((m = re.exec(block))) keys.add(m[1]);
  return keys;
}

const dataKeys = collectKeys(html);
const muntinEs = extractMuntinEsKeys(html);
const uiI18n   = CHECKS.UI_I18N || {};

// --- Test 1: every data-tr key resolves to SOMETHING -----------------
{
  const missing = dataKeys.filter((k) => {
    if (muntinEs.has(k)) return false;
    if (uiI18n[k]) return false;
    return true;
  });
  assert(
    'every data-tr key has a translation entry (in __MUNTIN_UI_ES or UI_I18N)',
    missing.length === 0,
    'missing: ' + missing.join(', ')
  );
}

// --- Test 2: every UI_I18N entry has a Spanish string ---------------
// A key with an EN entry but no ES is a rendering-correct but
// usability-broken state — Spanish visitors see English.
{
  const dataInUi = dataKeys.filter((k) => uiI18n[k]);
  const noEs = dataInUi.filter((k) => !uiI18n[k] || !uiI18n[k].es);
  assert(
    'every UI_I18N key referenced as data-tr has an ES translation',
    noEs.length === 0,
    'missing ES: ' + noEs.join(', ')
  );
}

// --- Test 3: t('key', null, 'es') returns the ES string for a sample
// of previously-missing keys. End-to-end: this proves the resolveTr
// path works in practice, not just that the keys are present in the
// data structure.
{
  const cases = [
    ['schemaRichness.heading', '¿Qué tan bien puede Google leer tu menú'],
    ['deep.email.heading',     'Tus confirmaciones de reserva'],
    ['hero.deepToggle',        'escaneo profundo'],
    ['actionPlan.heading',     null],
    ['toc.actionPlan',         null]
  ];
  cases.forEach(([key, contains]) => {
    const v = CHECKS.t(key, null, 'es');
    if (contains == null) {
      assert('t(' + key + ', es) returns a string', typeof v === 'string' && v !== key);
    } else {
      assert(
        't(' + key + ', es) contains "' + contains + '"',
        typeof v === 'string' && v.toLowerCase().indexOf(contains.toLowerCase()) >= 0,
        'got: ' + JSON.stringify(v)
      );
    }
  });
}

// --- Test 4: data-tr key counts ratchet the floor -------------------
// If someone removes a data-tr attribute by mistake, the count drops
// — we don't catch every regression here, but a sudden floor drop is
// almost certainly a bug.
{
  assert(
    'data-tr key count >= 60 (sanity floor; current is ' + dataKeys.length + ')',
    dataKeys.length >= 60
  );
}

if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll i18n-coverage tests passed.');
console.log('  data-tr keys: ' + dataKeys.length);
console.log('  __MUNTIN_UI_ES keys: ' + muntinEs.size);
console.log('  UI_I18N keys with ES: ' + Object.keys(uiI18n).filter((k) => uiI18n[k] && uiI18n[k].es).length);
