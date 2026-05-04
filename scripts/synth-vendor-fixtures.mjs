#!/usr/bin/env node
/**
 * Synthetic vendor fixture generator (Wave 11.6).
 *
 * Reads each vendor template under tools/invoice-decoder/vendors/*.json
 * and emits N deterministic synthetic invoices per template:
 *
 *   tools/invoice-decoder/__fixtures__/synth/<vendor>-<idx>.json
 *
 * Each fixture is a JSON sidecar containing:
 *   {
 *     vendor:        '<id>',
 *     fullText:      '<the synthetic OCR text>',
 *     expectedRows:  [{ name, qty, unit, lineTotal, category }],
 *     expectedTotal: <number>,
 *     wordBoxes:     [{ text, x0, y0, x1, y1 }]    // for column tests
 *   }
 *
 * The same script runs in CI to validate that parseLines + classify
 * produce row counts + totals within tolerance of the expected values.
 *
 * Why deterministic: a stable PRNG seeded by vendor-id + idx means
 * runs are reproducible. Operators reviewing CI failures see the
 * same fixtures locally.
 *
 * Why synthetic: a real-photo soak set is the gold standard, but
 * we can't ship operator photos in the open repo. Synthetic gives
 * us deterministic, vendor-template-aligned fixtures that exercise
 * the column reconstruction (Wave 4.1) and per-region OCR (Wave 4.2)
 * paths without leaking real operator data.
 *
 * Run:
 *   node scripts/synth-vendor-fixtures.mjs            (regenerate all)
 *   node scripts/synth-vendor-fixtures.mjs --check    (CI validation;
 *                                                      asserts every
 *                                                      fixture parses
 *                                                      to within
 *                                                      tolerance.)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const vendorsDir = path.join(repoRoot, 'tools', 'invoice-decoder', 'vendors');
const outDir     = path.join(repoRoot, 'tools', 'invoice-decoder', '__fixtures__', 'synth');

const FIXTURES_PER_VENDOR = 3;
const ROWS_PER_FIXTURE    = 8;

// Deterministic PRNG (mulberry32). Seeded by vendor id + index.
function _hashSeed(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}
function _prng(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A handful of plausible SKU stems per category. Synthetic invoices
// pick from this pool; we know the expected category for each.
const SKU_POOL = [
  { name: 'GROUND CHUCK 80/20',       category: 'protein',  unit: 'lb', priceRange: [3.50, 5.50] },
  { name: 'BONELESS CHICKEN BREAST',  category: 'protein',  unit: 'lb', priceRange: [2.80, 4.80] },
  { name: 'ROMAINE HEARTS 24CT',      category: 'produce',  unit: 'cs', priceRange: [38.00, 56.00] },
  { name: 'TOMATOES VINE-RIPE',       category: 'produce',  unit: 'cs', priceRange: [20.00, 32.00] },
  { name: 'CILANTRO',                 category: 'produce',  unit: 'bn', priceRange: [1.20, 2.50] },
  { name: 'OLIVE OIL EXTRA VIRGIN',   category: 'dry-goods', unit: 'gal', priceRange: [22.00, 36.00] },
  { name: 'STELLA ARTOIS 24/12 BTL',  category: 'beverage', unit: 'cs', priceRange: [38.00, 48.00] },
  { name: 'PAPER NAPKIN 250CT',       category: 'paper',    unit: 'cs', priceRange: [16.00, 22.00] },
  { name: 'CHEDDAR BLOCK',            category: 'dairy',    unit: 'lb', priceRange: [3.20, 4.80] },
  { name: 'OYSTER PANKO 5LB',         category: 'dry-goods', unit: 'cs', priceRange: [22.00, 30.00] }
];

function _pickRows(rng, n) {
  const out = [];
  const used = new Set();
  while (out.length < n) {
    const idx = Math.floor(rng() * SKU_POOL.length);
    if (used.has(idx)) continue;
    used.add(idx);
    const sku = SKU_POOL[idx];
    const qty = 1 + Math.floor(rng() * 5);
    const lo = sku.priceRange[0], hi = sku.priceRange[1];
    const unitPrice = +(lo + rng() * (hi - lo)).toFixed(2);
    out.push({
      name: sku.name,
      qty: qty,
      unit: sku.unit,
      unitPrice: unitPrice,
      lineTotal: +(qty * unitPrice).toFixed(2),
      category: sku.category
    });
  }
  return out;
}

// Render a vendor's invoice text. Uses the headerLines from the
// vendor JSON (when present) so the parser's vendor-detection layer
// fires, then a clean tabular line list, then a TOTAL line.
function _renderText(vendorTpl, rows) {
  const headerLines = (vendorTpl.headerLines && vendorTpl.headerLines.slice(0, 4))
                       || [vendorTpl.label_en || vendorTpl.id];
  const body = rows.map(r =>
    `${r.qty} ${r.unit.toUpperCase()} ${r.name} $${r.lineTotal.toFixed(2)}`
  );
  const total = rows.reduce((s, r) => s + r.lineTotal, 0).toFixed(2);
  return [
    ...headerLines,
    '',
    ...body,
    '',
    `TOTAL: $${total}`
  ].join('\n');
}

// Generate stub bbox boxes by laying out characters in a 12-pt
// monospace grid. Used by Wave 4.1 column reconstruction tests.
function _renderBoxes(text) {
  const charW = 7, lineH = 14;
  const out = [];
  text.split('\n').forEach((line, y) => {
    const tokens = line.split(/\s+/).filter(Boolean);
    let xCursor = 0;
    tokens.forEach((tok) => {
      out.push({
        text: tok,
        x0: xCursor * charW,
        y0: y * lineH,
        x1: (xCursor + tok.length) * charW,
        y1: (y + 1) * lineH
      });
      xCursor += tok.length + 1;
    });
  });
  return out;
}

function _generateForVendor(vendorTpl, idx) {
  const seed = _hashSeed(vendorTpl.id + ':' + idx);
  const rng = _prng(seed);
  const rows = _pickRows(rng, ROWS_PER_FIXTURE);
  const fullText = _renderText(vendorTpl, rows);
  const wordBoxes = _renderBoxes(fullText);
  const expectedTotal = +rows.reduce((s, r) => s + r.lineTotal, 0).toFixed(2);
  return {
    vendor: vendorTpl.id,
    seed: seed,
    fullText: fullText,
    expectedRows: rows,
    expectedTotal: expectedTotal,
    wordBoxes: wordBoxes
  };
}

function generateAll() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const indexPath = path.join(vendorsDir, '_index.json');
  if (!fs.existsSync(indexPath)) {
    console.error('vendors/_index.json missing; nothing to generate.');
    return [];
  }
  const indexJson = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const index = Array.isArray(indexJson) ? indexJson : (indexJson.vendors || []);
  const written = [];
  index.forEach((entry) => {
    const tplPath = path.join(vendorsDir, entry.id + '.json');
    if (!fs.existsSync(tplPath)) return;
    const tpl = JSON.parse(fs.readFileSync(tplPath, 'utf8'));
    for (let i = 0; i < FIXTURES_PER_VENDOR; i++) {
      const fixture = _generateForVendor(Object.assign({}, entry, tpl), i);
      const outPath = path.join(outDir, entry.id + '-' + i + '.json');
      fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2) + '\n');
      written.push(outPath);
    }
  });
  return written;
}

function check() {
  const require = createRequire(import.meta.url);
  const PARSE = require(path.join(repoRoot, 'tools', 'invoice-decoder', 'parse.js'));
  if (!fs.existsSync(outDir)) {
    console.error('No fixtures present. Run without --check first to generate.');
    process.exit(1);
  }
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.json'));
  let fails = 0;
  files.forEach((f) => {
    const fixture = JSON.parse(fs.readFileSync(path.join(outDir, f), 'utf8'));
    const lines = fixture.fullText.split('\n').map(text => ({ text: text, confidence: 92 }));
    const parsed = PARSE.parseLines(lines, fixture.fullText);
    const itemRows = parsed.rows.filter(r => !r.kind || r.kind === 'item');
    const expected = fixture.expectedRows.length;
    const within = Math.abs(itemRows.length - expected) <= 1;
    const totalParsed = (parsed.meta && parsed.meta.totalParsed) || null;
    const totalDelta = totalParsed != null ? Math.abs(totalParsed - fixture.expectedTotal) : null;
    const totalOk = totalParsed == null || totalDelta < 0.05;
    const ok = within && totalOk;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${f}  rows=${itemRows.length}/${expected}` +
                (totalParsed != null ? `  total=$${totalParsed} (Δ${totalDelta.toFixed(2)})` : '  total=skipped'));
    if (!ok) fails++;
  });
  console.log('');
  console.log(fails === 0
    ? `✓ all ${files.length} synthetic-vendor fixtures parse within tolerance`
    : `✗ ${fails} of ${files.length} fixtures failed`);
  process.exit(fails === 0 ? 0 : 1);
}

if (process.argv.includes('--check')) {
  check();
} else {
  const written = generateAll();
  console.log(`Wrote ${written.length} fixture(s) to tools/invoice-decoder/__fixtures__/synth/`);
}
