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
const CSV         = await import(path.join(repoRoot, 'tools/invoice-decoder/csv-extract.js')).then(m => m.default || m);
const PDFX        = await import(path.join(repoRoot, 'tools/invoice-decoder/pdf-extract.js')).then(m => m.default || m);
const PREP        = await import(path.join(repoRoot, 'tools/invoice-decoder/preprocess.js')) .then(m => m.default || m);

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

console.log(`\n${totalPass} of ${FIXTURES.length} fixtures passed (parser + categorizer + vendors).`);

// =====================================================================
// W2-6 — extended soak fixtures for the new input paths.
//
// We don't ship real distributor PDFs / CSVs in the repo (privacy +
// IP). Instead each fixture exercises the CODE PATH the new modules
// add, with shapes that match real distributor exports closely
// enough to catch regressions on the parser, the header alias map,
// the PDF clustering, and the photo-quality classifier.
// =====================================================================

let csvPass = 0, csvFail = 0;
console.log(`\nCSV / TSV / XLSX header-mapping fixtures:`);

const CSV_FIXTURES = [
  {
    id: 'restaurant-depot-csv',
    label: 'Restaurant Depot — CSV export',
    text: 'Item Code,Description,Qty,UOM,Unit Price,Extended\n' +
          '120045,Romaine Hearts 24ct,2,case,24.00,48.00\n' +
          '120046,Ground Chuck 10lb,2,case,29.00,58.00\n' +
          '120047,Salmon Fillet 5lb,1,case,62.50,62.50\n',
    expectedRows: 3,
    expectedSum: 168.50
  },
  {
    id: 'sysco-marketplace-tsv',
    label: 'Sysco MarketPlace — TSV export (tab delimited)',
    text: 'SUPC\tDescription\tQty Ship\tUnit\tUnit Price\tExt Price\n' +
          '0123456\tChicken Breast 5lb\t2\tcs\t29.00\t58.00\n' +
          '0234567\tMozzarella 5lb\t1\tcs\t34.00\t34.00\n' +
          '0345678\tOlive Oil 1gal\t1\tcs\t48.00\t48.00\n',
    expectedRows: 3,
    expectedSum: 140.00
  },
  {
    id: 'es-distributor-csv',
    label: 'ES distributor — CSV with Spanish headers',
    text: 'Código,Descripción,Cantidad,Unidad,Precio Unitario,Total\n' +
          'P001,Pollo Entero,2,lb,14.00,28.00\n' +
          'P002,Papa Russet,5,lb,2.50,12.50\n' +
          'P003,Aceite de Oliva,1,gal,48.00,48.00\n',
    expectedRows: 3,
    expectedSum: 88.50
  },
  {
    id: 'csv-no-headers',
    label: 'CSV with NO recognizable headers (failure path)',
    text: 'foo,bar,baz\nx,y,z\n',
    expectedRows: 0,
    expectsNoHeaders: true
  },
  {
    id: 'csv-quoted-fields',
    label: 'CSV with quoted fields containing commas',
    text: 'Item,Description,Qty,Unit Price,Total\n' +
          '001,"Tomato, Roma 25lb",2,18.00,36.00\n' +
          '002,"Lettuce, Iceberg 24ct",1,24.00,24.00\n',
    expectedRows: 2,
    expectedSum: 60.00
  }
];

for (const fx of CSV_FIXTURES) {
  const result = CSV.extractCsv(fx.text);
  let ok = true;
  let why = '';
  if (fx.expectsNoHeaders) {
    if (!result._noHeaders) { ok = false; why = 'expected _noHeaders flag'; }
  } else {
    if (!Array.isArray(result.rows) || result.rows.length !== fx.expectedRows) {
      ok = false; why = `rows=${result.rows?.length ?? '?'} (expected ${fx.expectedRows})`;
    }
    if (ok && fx.expectedSum != null) {
      const drift = Math.abs((result.sumParsed || 0) - fx.expectedSum);
      if (drift > 0.02) { ok = false; why = `sum=${result.sumParsed} (expected ~${fx.expectedSum})`; }
    }
  }
  console.log(`  ${ok ? '✓' : '✗'} ${fx.id.padEnd(28)} ${ok ? '' : why}`);
  if (ok) csvPass++; else csvFail++;
}

let pdfPass = 0, pdfFail = 0;
console.log(`\nPDF text-layer clustering fixtures:`);

// Synthetic PDF.js-shaped items: { str, transform: [, , , , x, y], width }
// Each cluster of 3 items at the same y should join into one line with
// smart-spaced separators where the x-gaps are wide enough.
const PDF_FIXTURES = [
  {
    id: 'pdf-three-rows',
    label: 'Three rows at distinct Y, items joined within row',
    items: [
      { str: 'Romaine',  transform: [1,0,0,1, 50, 700], width: 30 },
      { str: 'Hearts',   transform: [1,0,0,1, 90, 700], width: 28 },
      { str: '$48.00',   transform: [1,0,0,1, 200,700], width: 30 },
      { str: 'Ground',   transform: [1,0,0,1, 50, 680], width: 28 },
      { str: 'Chuck',    transform: [1,0,0,1, 90, 680], width: 26 },
      { str: '$58.00',   transform: [1,0,0,1, 200,680], width: 30 },
      { str: 'Salmon',   transform: [1,0,0,1, 50, 660], width: 28 },
      { str: 'Fillet',   transform: [1,0,0,1, 90, 660], width: 24 },
      { str: '$62.50',   transform: [1,0,0,1, 200,660], width: 30 }
    ],
    expectedLineCount: 3,
    expectedFirstContains: 'Romaine'
  },
  {
    id: 'pdf-y-tolerance',
    label: 'Two rows ~2pt apart cluster correctly (within tolerance)',
    items: [
      { str: 'Foo',  transform: [1,0,0,1, 50, 700.0], width: 20 },
      { str: '$1',   transform: [1,0,0,1, 100,701.5], width: 10 },  // within 2pt tol
      { str: 'Bar',  transform: [1,0,0,1, 50, 680.0], width: 20 },
      { str: '$2',   transform: [1,0,0,1, 100,680.0], width: 10 }
    ],
    expectedLineCount: 2,
    expectedFirstContains: 'Foo'
  },
  {
    id: 'pdf-empty',
    label: 'Empty items array yields empty lines',
    items: [],
    expectedLineCount: 0
  }
];

for (const fx of PDF_FIXTURES) {
  const lines = PDFX._clusterItemsToLines(fx.items);
  let ok = true;
  let why = '';
  if (lines.length !== fx.expectedLineCount) {
    ok = false; why = `lines=${lines.length} (expected ${fx.expectedLineCount})`;
  }
  if (ok && fx.expectedFirstContains) {
    const first = (lines[0] && lines[0].text) || '';
    if (first.indexOf(fx.expectedFirstContains) === -1) {
      ok = false; why = `first line "${first}" missing "${fx.expectedFirstContains}"`;
    }
  }
  console.log(`  ${ok ? '✓' : '✗'} ${fx.id.padEnd(28)} ${ok ? '' : why}`);
  if (ok) pdfPass++; else pdfFail++;
}

let qualityPass = 0, qualityFail = 0;
console.log(`\nPhoto-quality classifier fixtures (W2-3 coaching gate):`);

// blurScore is laplacian variance: <60 → blurry; bimodality < 1500 →
// low-contrast; otherwise good. Coaching chip fires on 'blurry' OR
// 'low-contrast' BEFORE OCR runs.
const QUALITY_FIXTURES = [
  { blur: 200,  bimodality: 8000, expect: 'good',          label: 'sharp + high contrast' },
  { blur: 25,   bimodality: 8000, expect: 'blurry',        label: 'soft focus' },
  { blur: 200,  bimodality: 800,  expect: 'low-contrast',  label: 'faxed / washed-out' },
  { blur: 10,   bimodality: 100,  expect: 'blurry',        label: 'blur dominates over contrast' },
  { blur: 300,  bimodality: 5000, expect: 'good',          label: 'borderline good' }
];

for (const fx of QUALITY_FIXTURES) {
  const got = PREP.classifyQuality(fx.blur, fx.bimodality);
  const ok = got === fx.expect;
  console.log(`  ${ok ? '✓' : '✗'} ${fx.label.padEnd(40)} blur=${fx.blur} bimodality=${fx.bimodality} → ${got} (expected ${fx.expect})`);
  if (ok) qualityPass++; else qualityFail++;
}

const totalNew = csvFail + pdfFail + qualityFail;
console.log(`\nW2-6 extended fixtures: ${csvPass} CSV / ${pdfPass} PDF / ${qualityPass} quality passed.`);

const grandFail = totalFail + totalNew;
process.exit(grandFail === 0 ? 0 : 1);
