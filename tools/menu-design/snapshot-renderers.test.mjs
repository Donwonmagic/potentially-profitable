/**
 * Golden-master snapshot tests — the renderer-extraction safety net.
 * Run via:  node --test tools/menu-design/snapshot-renderers.test.mjs
 *
 * These tests capture the current HTML/text output of menu-render-html.js
 * and menu-render-text.js with deterministic seed inputs, write the
 * results to __snapshots__/ on first run, and byte-equality-assert on
 * every subsequent run.
 *
 * Why this exists: Wave A2 (renderer extraction to tools/_shared/
 * menu-renderers/) and Wave A3 (code-split the boot) both move/wrap
 * the renderer modules. Without snapshots we have no way to prove
 * the move didn't change the output. With snapshots, ANY drift —
 * whitespace, attribute order, escaping difference, JSON-LD shape,
 * font reference — fails the test.
 *
 * To re-record after an INTENTIONAL renderer change:
 *   SNAPSHOT_UPDATE=1 node --test tools/menu-design/snapshot-renderers.test.mjs
 *
 * PDF snapshot: not byte-equality (PDF binary varies with embedded
 * font subsetting, timestamps, document IDs). Instead, the PDF gate
 * tests in cascade-gate.test.mjs cover the structural layer; full
 * pixel-diff would need pdf2json + a render harness, which is the
 * Wave C10 test-pyramid follow-on.
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
const require    = createRequire(import.meta.url);

const SNAPSHOT_DIR = path.join(__dirname, '__snapshots__');
const UPDATE = !!process.env.SNAPSHOT_UPDATE;

// Deterministic seed used by every snapshot. Identical to a real
// trattoria menu the operator might paste in. Rich enough to exercise
// every output branch (allergens, dietary chips, descriptions, prices,
// section headers) without being noisy.
function seedRows() {
  return [
    { kind: 'section', name: 'Antipasti' },
    { kind: 'dish', name: 'Bruschetta',                 price: '8',  desc: 'House levain, summer tomato, basil, finishing oil.', allergens: ['V','GL'] },
    { kind: 'dish', name: 'Burrata, peach, prosciutto', price: '17', desc: 'Stracciatella heart, prosciutto di Parma, white peach.', allergens: ['VG'] },
    { kind: 'section', name: 'Pasta' },
    { kind: 'dish', name: 'Cacio e pepe',               price: '22', desc: 'Tonnarelli, pecorino romano, cracked Tellicherry pepper.', allergens: ['VG','GL','E'] },
    { kind: 'dish', name: "Bucatini all'amatriciana",   price: '24', desc: 'Guanciale, San Marzano, pecorino, chili.', allergens: ['GL','E'], spice: 1 },
    { kind: 'section', name: 'Dolci' },
    { kind: 'dish', name: 'Tiramisù della casa',        price: '13', desc: 'Mascarpone, espresso-soaked savoiardi, cocoa.', allergens: ['VG','E','GL'] }
  ];
}

function seedTheme() {
  // Fixed theme tokens so font + color references stay stable.
  return {
    id: 'trattoria',
    paper: '#FAF6EE', ink: '#14161A', accent: '#9c2e3b', muted: '#7A6F60',
    bodyFamily: 'Georgia, "Times New Roman", serif',
    displayFamily: 'Fraunces, Georgia, serif',
    h1Pt: 32, h2Pt: 18, bodyPt: 11, descPt: 9.5
  };
}

function seedMeta() {
  return {
    title: 'Da Marco',
    tagline: 'Family-run since 1987',
    address: '123 Main St, Silver Spring, MD',
    hours: 'Tues–Sun, 5:30–9:30',
    disclaimer: 'Please tell your server about any allergies. Cross-contamination is possible.',
    locale: 'en'
  };
}

// Fixed clock used inside the renderer VM context so the "Last
// updated: <date>" footer line each renderer emits is deterministic
// across runs. Without this, the snapshot drifts on day 2 onward
// (the renderer calls `new Date()` at render time, the snapshot
// was recorded on a single day, and the toLocaleDateString output
// changes daily).
//
// The chosen instant — 2026-01-15T12:00:00Z — renders as:
//   en-US: "Jan 15, 2026"
//   es-MX: "15 ene 2026"
// Picking a mid-month, mid-day timestamp avoids any timezone-edge
// effect (the Workers runtime + the Cloudflare Pages build environ
// both use UTC, but local devs may run in any timezone — noon UTC
// stays on the same date for every common DC).
const FIXED_NOW_MS = Date.UTC(2026, 0, 15, 12, 0, 0);
const RealDate = Date;
function makeFixedDate() {
  // A Date subclass that, when invoked with no args, returns the
  // pinned timestamp; otherwise behaves identically to the real
  // Date. Date.now() is also pinned, in case the renderer reaches
  // for it. Static methods (parse, UTC) pass through.
  function FixedDate(...args) {
    if (!new.target) return new RealDate(FIXED_NOW_MS).toString();
    if (args.length === 0) return new RealDate(FIXED_NOW_MS);
    return new RealDate(...args);
  }
  FixedDate.now   = () => FIXED_NOW_MS;
  FixedDate.parse = RealDate.parse;
  FixedDate.UTC   = RealDate.UTC;
  Object.setPrototypeOf(FixedDate.prototype, RealDate.prototype);
  Object.setPrototypeOf(FixedDate, RealDate);
  return FixedDate;
}

function loadRenderer(rel, extras = {}) {
  const src = fs.readFileSync(path.join(__dirname, rel), 'utf8');
  const win = {};
  if (extras.MD_SCHEMA)  win.MD_SCHEMA  = extras.MD_SCHEMA;
  if (extras.MD_JSONLD)  win.MD_JSONLD  = extras.MD_JSONLD;
  if (extras.MD_THEMES)  win.MD_THEMES  = extras.MD_THEMES;
  const moduleObj = { exports: {} };
  const ctx = vm.createContext({
    window:   win,
    document: { createElement: () => ({}), head: { appendChild: () => {} } },
    module:   moduleObj,
    Promise,
    setTimeout, clearTimeout,
    console,
    Date: makeFixedDate(),
  });
  vm.runInContext(src, ctx);
  return moduleObj.exports;
}

function snapshotPath(name) {
  return path.join(SNAPSHOT_DIR, name);
}

function compareOrWrite(name, actual) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const p = snapshotPath(name);
  if (!fs.existsSync(p) || UPDATE) {
    fs.writeFileSync(p, actual);
    return { wrote: true, p };
  }
  const expected = fs.readFileSync(p, 'utf8');
  return { wrote: false, p, expected, matches: expected === actual };
}

// ============================================================
//  HTML renderer snapshot
// ============================================================
test('menu-render-html.js — snapshot for trattoria seed', () => {
  const SCHEMA = require('../_shared/menu-schema.js');
  const JSONLD = require('../_shared/menu-renderers/jsonld.js');
  const MD_HTML = loadRenderer('menu-render-html.js', {
    MD_SCHEMA: SCHEMA,
    MD_JSONLD: JSONLD
  });
  const out = MD_HTML.exportHtml({
    rows: seedRows(),
    theme: seedTheme(),
    meta: seedMeta(),
    title: 'Da Marco',
    locale: 'en',
    hostUrl: 'https://example.com/menu'
  });
  // The output may be a string or { html, ... }
  const html = typeof out === 'string' ? out : (out && out.html);
  assert.ok(html && typeof html === 'string', 'exportHtml must return HTML string');

  const result = compareOrWrite('html-trattoria.html', html);
  if (!result.wrote) {
    assert.equal(result.matches, true,
      `HTML output drift vs snapshot at ${result.p}.\n` +
      `If the change is intentional: SNAPSHOT_UPDATE=1 node --test ${path.relative(process.cwd(), __filename)}`);
  }
});

// ============================================================
//  Text renderer snapshot
// ============================================================
test('menu-render-text.js — plain-text snapshot for trattoria seed', () => {
  const MD_TEXT = loadRenderer('menu-render-text.js');
  assert.ok(typeof MD_TEXT.exportPlainText === 'function',
    'menu-render-text must export exportPlainText()');
  const out = MD_TEXT.exportPlainText({
    rows: seedRows(),
    theme: seedTheme(),
    meta: seedMeta(),
    title: 'Da Marco',
    locale: 'en'
  });
  const text = typeof out === 'string' ? out : (out && (out.text || out.body));
  assert.ok(text && typeof text === 'string', 'exportPlainText must return text string');

  const result = compareOrWrite('text-trattoria.txt', text);
  if (!result.wrote) {
    assert.equal(result.matches, true,
      `Text output drift vs snapshot at ${result.p}.\n` +
      `If the change is intentional: SNAPSHOT_UPDATE=1 node --test ${path.relative(process.cwd(), __filename)}`);
  }
});

test('menu-render-text.js — markdown snapshot for trattoria seed', () => {
  const MD_TEXT = loadRenderer('menu-render-text.js');
  const md = MD_TEXT.exportMarkdown({
    rows: seedRows(),
    theme: seedTheme(),
    meta: seedMeta(),
    title: 'Da Marco',
    locale: 'en'
  });
  const out = typeof md === 'string' ? md : (md && (md.markdown || md.text));
  assert.ok(out && typeof out === 'string', 'exportMarkdown must return markdown string');

  const result = compareOrWrite('markdown-trattoria.md', out);
  if (!result.wrote) {
    assert.equal(result.matches, true,
      `Markdown output drift vs snapshot at ${result.p}.\n` +
      `If the change is intentional: SNAPSHOT_UPDATE=1 node --test ${path.relative(process.cwd(), __filename)}`);
  }
});

// ============================================================
//  JSON-LD emitter snapshot
// ============================================================
test('jsonld.js — schema.org Menu JSON-LD snapshot for trattoria seed', () => {
  const JSONLD = require('../_shared/menu-renderers/jsonld.js');
  const SCHEMA = require('../_shared/menu-schema.js');
  // The JSON-LD emitter operates on the canonical schema (post-migrate);
  // rows[] is a draft format. Migrate the seed so the snapshot is
  // semantically meaningful.
  const menu = SCHEMA.migrate({
    rows: seedRows(),
    meta: seedMeta(),
    title: 'Da Marco'
  });
  const graph = JSONLD.build(menu, { url: 'https://example.com/menu' });
  // Stable serialization with sorted keys for byte-equality.
  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    const keys = Object.keys(value).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
  }
  const serialized = stableStringify(graph);

  const result = compareOrWrite('jsonld-trattoria.json', serialized);
  if (!result.wrote) {
    assert.equal(result.matches, true,
      `JSON-LD output drift vs snapshot at ${result.p}.\n` +
      `If the change is intentional: SNAPSHOT_UPDATE=1 node --test ${path.relative(process.cwd(), __filename)}`);
  }
});
