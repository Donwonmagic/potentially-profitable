/**
 * Integration test — tools/menu-design/menu-render-html.js
 * Run via:   node --test tools/menu-design/menu-render-html.test.mjs
 *
 * Coverage focus: Wave B6's JSON-LD injection (the QR-menu HTML
 * emitter must emit a schema.org Menu graph in <head> when MD_JSONLD
 * + MD_SCHEMA are reachable). Other rendering invariants are
 * exercised by the existing scripts/check-menu-design.mjs.
 *
 * Module-load shape: menu-render-html.js attaches to a `root` object
 * (window in the browser, the IIFE's argument in Node). To smoke-
 * test JSON-LD injection in Node, we set up a fake root with
 * MD_SCHEMA + MD_JSONLD already attached, then load the renderer
 * via vm so it picks them up.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const require = createRequire(import.meta.url);

const SCHEMA = require('../_shared/menu-schema.js');
const JSONLD = require('../_shared/menu-renderers/jsonld.js');

// Load menu-render-html.js with a synthetic root that already has
// MD_SCHEMA + MD_JSONLD attached, mirroring the browser's load order
// (where index.html loads schema + jsonld BEFORE menu-render-html).
function loadRenderer({ withSchema = true, withJsonld = true } = {}) {
  const src = fs.readFileSync(path.join(__dirname, 'menu-render-html.js'), 'utf8');
  // The renderer's IIFE attaches its api to the `root` arg
  // (typeof window !== 'undefined' ? window : null) AND to
  // module.exports if module is defined. We seed a vm context with
  // a synthetic window that already has MD_SCHEMA / MD_JSONLD
  // attached — mirrors the browser's load order — and read back via
  // module.exports for a clean handle.
  const win = {};
  if (withSchema) win.MD_SCHEMA = SCHEMA;
  if (withJsonld) win.MD_JSONLD = JSONLD;
  const moduleObj = { exports: {} };
  const ctx = vm.createContext({
    window:   win,
    document: { createElement: () => ({}), head: { appendChild: () => {} } },
    module:   moduleObj,
    Promise,
    setTimeout, clearTimeout,
    console
  });
  vm.runInContext(src, ctx);
  return moduleObj.exports;
}

function seedRows() {
  return [
    { kind: 'section', name: 'Antipasti' },
    { kind: 'dish', name: 'Bruschetta', price: '8',  desc: 'house bread', allergens: ['DF'] },
    { kind: 'dish', name: 'Caprese',    price: '11', desc: 'mozzarella', allergens: ['VG'] },
    { kind: 'section', name: 'Pasta' },
    { kind: 'dish', name: 'Carbonara',  price: '18', desc: 'guanciale, egg, pecorino', allergens: ['E', 'GF'] }
  ];
}

function seedTheme() {
  return { id: 'trattoria', paper: '#FAF6EE', ink: '#14161A', accent: '#9c2e3b' };
}

// ============== JSON-LD injection ==============
test('exportHtml injects a schema.org Menu JSON-LD <script> when MD_JSONLD is loaded', () => {
  const MD_HTML = loadRenderer();
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'Da Marco',
    locale: 'en',
    meta: { businessName: 'Da Marco', tagline: 'Since 1992', currency: 'USD', locale: 'en' }
  });
  assert.match(html, /<script type="application\/ld\+json">/);
  assert.match(html, /"@type":\s*"Menu"/);
  assert.match(html, /"@context":\s*"https:\/\/schema\.org"/);
  assert.match(html, /"name":\s*"Da Marco"/);
});

test('exportHtml omits JSON-LD when MD_JSONLD is absent', () => {
  const MD_HTML = loadRenderer({ withJsonld: false });
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'Da Marco',
    locale: 'en'
  });
  assert.doesNotMatch(html, /application\/ld\+json/, 'no JSON-LD when emitter unavailable');
});

test('exportHtml uses caller-supplied canonicalMenu when present', () => {
  const MD_HTML = loadRenderer();
  const canonical = SCHEMA.migrate({
    rows: seedRows(),
    theme: 'trattoria',
    meta: { businessName: 'Da Marco', tagline: 'Caller-supplied', currency: 'EUR', locale: 'en' }
  });
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'Da Marco',
    locale: 'en',
    canonicalMenu: canonical
  });
  assert.match(html, /"description":\s*"Caller-supplied"/);
  // EUR currency carried via canonicalMenu, not the synthesized fallback
  assert.match(html, /"priceCurrency":\s*"EUR"/);
});

test('JSON-LD includes hasMenuSection with both sections from the row stream', () => {
  const MD_HTML = loadRenderer();
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'Test',
    locale: 'en',
    meta: { businessName: 'Test', locale: 'en', currency: 'USD' }
  });
  // Both "Antipasti" and "Pasta" must appear as MenuSection.name values
  assert.match(html, /"name":\s*"Antipasti"/);
  assert.match(html, /"name":\s*"Pasta"/);
  // At least one MenuItem with offers + USD
  assert.match(html, /"@type":\s*"Offer"/);
  assert.match(html, /"priceCurrency":\s*"USD"/);
});

test('JSON-LD output is parseable JSON inside the <script> block', () => {
  const MD_HTML = loadRenderer();
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'Da Marco',
    locale: 'en',
    meta: { businessName: 'Da Marco', currency: 'USD', locale: 'en' }
  });
  const m = html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
  assert.ok(m, 'JSON-LD script block must be present');
  // Must round-trip through JSON.parse without throwing.
  const parsed = JSON.parse(m[1]);
  assert.equal(parsed['@type'], 'Menu');
  assert.equal(Array.isArray(parsed.hasMenuSection), true);
});

test('exportHtml is graceful when MD_SCHEMA is absent but MD_JSONLD is present', () => {
  // Realistic browser scenario: someone bundles the JSON-LD emitter
  // but forgets the schema migrator. Should NOT throw; should NOT
  // emit JSON-LD (since we can't migrate the v2 rows to v3).
  const MD_HTML = loadRenderer({ withSchema: false });
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'Test',
    locale: 'en'
  });
  assert.doesNotMatch(html, /application\/ld\+json/);
  // Other rendering still works.
  assert.match(html, /<title>Test<\/title>/);
  assert.match(html, /Bruschetta/);
});

test('caller-supplied canonicalMenu is used even when MD_SCHEMA is unavailable', () => {
  // The caller has done its own migration; renderer should still emit
  // JSON-LD via MD_JSONLD without needing MD_SCHEMA at runtime.
  const MD_HTML = loadRenderer({ withSchema: false });
  const canonical = SCHEMA.migrate({
    rows: seedRows(),
    meta: { businessName: 'Pre-migrated', locale: 'en', currency: 'USD' }
  });
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'Pre-migrated',
    locale: 'en',
    canonicalMenu: canonical
  });
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"name":\s*"Pre-migrated"/);
});

// ============== Wave B2 — disclaimer footer in HTML ==============
test('exportHtml emits a disclaimer block when opts.disclaimer is supplied', () => {
  const MD_HTML = loadRenderer();
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'X',
    locale: 'en',
    disclaimer: 'Please inform your server of any allergies.'
  });
  assert.match(html, /class="ml-disclaimer"/);
  assert.match(html, /Please inform your server of any allergies/);
  assert.match(html, /role="note"/);
});

test('exportHtml omits the disclaimer block when disclaimer is empty', () => {
  const MD_HTML = loadRenderer();
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'X',
    locale: 'en'
  });
  // The .ml-disclaimer CSS rule lives in the inlined <style> block
  // unconditionally; what we want to assert is that no <aside> tag
  // carrying the class is emitted.
  assert.doesNotMatch(html, /<aside class="ml-disclaimer"/);
});

test('exportHtml escapes HTML in the disclaimer text', () => {
  const MD_HTML = loadRenderer();
  const html = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    title: 'X',
    locale: 'en',
    disclaimer: '<script>alert("xss")</script>'
  });
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert/);
});
