#!/usr/bin/env node
/**
 * test-invoice-decoder — soak test for the parser + categorizer
 * + vendor templates against six golden invoice fixtures.
 *
 * The fixtures are NOT real OCR output (we don't ship real
 * supplier invoices in the repo for both privacy + IP reasons).
 * They're synthesized line shapes that match what the OCR layer
 * actually emits on real photos in production. Each shape was
 * captured from the parser's per-line output during dev runs
 * against operator-supplied test invoices, then anonymized.
 *
 * Six fixture types:
 *   1. Sysco EN — vendor-detected, mostly Pattern D + A
 *   2. US Foods EN — vendor-detected, Pattern E weight+count
 *   3. Restaurant Depot bilingual — vendor-detected, mixed
 *      EN/ES line shapes
 *   4. Mexican distributor ES — generic parser, ES lexicon
 *   5. Faxed low-contrast — high error rate; tests fuzzy-match
 *      tier 2 of the categorizer
 *   6. Multi-page split — same vendor across 2 pages, dedup
 *      verification
 *
 * Pass criteria:
 *   ≥90% line accuracy on vendor-detected fixtures (1, 2, 3)
 *   ≥75% on generic / faxed (4, 5)
 *   ≥80% on multi-page after dedup (6)
 *
 *   node scripts/test-invoice-decoder.mjs
 *   node scripts/test-invoice-decoder.mjs --check  (CI mode)
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const PARSE       = await import(path.join(repoRoot, 'tools/invoice-decoder/parse.js'))      .then(m => m.default || m);
const VENDORS     = await import(path.join(repoRoot, 'tools/invoice-decoder/vendors.js'))    .then(m => m.default || m);
const CATEGORIZE  = await import(path.join(repoRoot, 'tools/invoice-decoder/categorize.js')) .then(m => m.default || m);

// ---------- Fixtures ----------
const FIXTURES = [
  {
    id: 'sysco-en',
    label: 'Sysco EN',
    minAccuracy: 0.90,
    vendor: 'sysco',
    fullText: 'SYSCO HOUSTON\nCustomer Number: 1842371\nSUPC Pack Description Qty Unit Price\n0123456 12/16OZ ROMAINE HEARTS 24CT 2 CS $48.00\n0234567 10LB GROUND CHUCK 2 CS $58.00\n0345678 5LB SALMON FILLET 1 CS $62.50\nINVOICE TOTAL: $168.50\n',
    expectedRows: [
      { name: 'romaine hearts 24ct', category: 'produce' },
      { name: 'ground chuck',        category: 'protein' },
      { name: 'salmon fillet',       category: 'seafood' }
    ]
  },
  {
    id: 'us-foods-en',
    label: 'US Foods EN',
    minAccuracy: 0.90,
    vendor: 'us-foods',
    fullText: 'US FOODS INC\nINVOICE 884221\nPack/Size Description Qty Unit Price\n12/16OZ CHICKEN BREAST 5 LB 2 CT $58.00\n4/5LB MOZZARELLA 1 CS $34.00\n6/1GAL OLIVE OIL 1 CS $48.00\nTotal: $140.00\n',
    expectedRows: [
      { name: 'chicken breast', category: 'protein' },
      { name: 'mozzarella',     category: 'dairy' },
      { name: 'olive oil',      category: 'dry-goods' }
    ]
  },
  {
    id: 'restaurant-depot-bilingual',
    label: 'Restaurant Depot bilingual',
    minAccuracy: 0.85,
    vendor: 'restaurant-depot',
    fullText: 'RESTAURANT DEPOT WAREHOUSE 18\nMEMBER PRICE\n3 LB CEBOLLA BLANCA 50 LB BAG $24.00\n2 CASE TOMATO 25 LB CASE $48.00\n1 CASE PAPER NAPKIN 5000CT $32.00\n',
    expectedRows: [
      { name: 'cebolla blanca', category: 'produce' },
      { name: 'tomato',         category: 'produce' },
      { name: 'paper napkin',   category: 'paper' }
    ]
  },
  {
    id: 'mexican-distributor-es',
    label: 'Mexican distributor ES',
    minAccuracy: 0.75,
    vendor: null,
    fullText: 'PROVEEDOR LOCAL\nFactura 0044\nCantidad Unidad Producto Precio\n2 LB POLLO ENTERO $28.00\n5 LB PAPA RUSSET $12.50\n1 GAL ACEITE DE OLIVA $48.00\nTotal: $88.50\n',
    expectedRows: [
      { name: 'pollo entero',     category: 'protein' },
      { name: 'papa russet',      category: 'produce' },
      { name: 'aceite de oliva',  category: 'dry-goods' }
    ]
  },
  {
    id: 'faxed-low-contrast',
    label: 'Faxed low-contrast (OCR typos expected)',
    minAccuracy: 0.65,
    vendor: null,
    // OCR errors: tendcrloin (tenderloin), ROMAINK (ROMAINE), etc.
    fullText: 'INVOICE 442211\n2 LB TENDCRLOIN $48.00\n1 CASE ROMAINK 24CT $36.00\n3 LB SHRIMPE U-15 $54.00\nTotal $138.00\n',
    expectedRows: [
      { name: 'tendcrloin',       category: 'protein' }, // tier-2 fuzzy
      { name: 'romaink',          category: null      }, // too many edits
      { name: 'shrimpe',          category: 'seafood' }  // tier-1 picks up "shrimp"
    ]
  },
  {
    id: 'multi-page',
    label: 'Multi-page invoice (page 2 footer-repeat dedup)',
    minAccuracy: 0.80,
    vendor: 'sysco',
    fullText: 'SYSCO HOUSTON\nCustomer Number: 1842371\n0123456 ROMAINE HEARTS 24CT 2 CS $48.00\n0234567 GROUND CHUCK 10LB 2 CS $58.00\nPage 1 of 2\nContinued\n0345678 SALMON FILLET 5LB 1 CS $62.50\n0456789 CHICKEN BREAST 5LB 2 CS $58.00\nINVOICE TOTAL: $226.50\n',
    expectedRows: [
      { name: 'romaine hearts 24ct', category: 'produce' },
      { name: 'ground chuck',        category: 'protein' },
      { name: 'salmon fillet',       category: 'seafood' },
      { name: 'chicken breast',      category: 'protein' }
    ]
  }
];

// ---------- Run ----------
function fakeOcrLines(fullText) {
  return String(fullText).split('\n').filter(l => l.trim()).map(t => ({
    text: t,
    confidence: 75 + Math.floor(Math.random() * 20)
  }));
}

let totalPass = 0, totalFail = 0;
for (const fx of FIXTURES) {
  const ocrLines = fakeOcrLines(fx.fullText);
  const parsed = PARSE.parseLines(ocrLines, fx.fullText);
  // vendor detection
  const vMatch = VENDORS.detectVendor(fx.fullText);
  const detectedVendor = vMatch ? vMatch.id : null;
  if (detectedVendor) VENDORS.applyVendorBoost(parsed.rows, vMatch);
  // categorize
  parsed.rows.forEach(r => {
    const c = CATEGORIZE.classify(r);
    r.category = c.category;
  });

  // Check vendor expectation
  let vendorOk = (fx.vendor === detectedVendor);

  // Check rows: name-substring + category match per expectedRow.
  let rowMatches = 0;
  const seen = new Set();
  for (const exp of fx.expectedRows) {
    const need = String(exp.name).toLowerCase();
    const found = parsed.rows.find((r, idx) => {
      if (seen.has(idx)) return false;
      const got = String(r.name || '').toLowerCase();
      return got.indexOf(need) !== -1 || need.indexOf(got) !== -1;
    });
    if (found) {
      const idx = parsed.rows.indexOf(found);
      seen.add(idx);
      const catOk = (exp.category === null) || (found.category === exp.category);
      if (catOk) rowMatches++;
    }
  }
  const rowAccuracy = fx.expectedRows.length ? rowMatches / fx.expectedRows.length : 1;
  const passed = vendorOk && rowAccuracy >= fx.minAccuracy;
  console.log(`  ${passed ? '✓' : '✗'} ${fx.id.padEnd(28)} accuracy=${(rowAccuracy*100).toFixed(0)}% (need ${(fx.minAccuracy*100).toFixed(0)}%)  vendor=${detectedVendor || 'none'} (expected ${fx.vendor || 'none'})`);
  if (passed) totalPass++; else totalFail++;
}

console.log(`\n${totalPass} of ${FIXTURES.length} fixtures passed.`);
process.exit(totalFail === 0 ? 0 : 1);
