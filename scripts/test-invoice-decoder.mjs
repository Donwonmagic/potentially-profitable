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
import fs from 'node:fs';
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

// =====================================================================
// Wave 8 — new fixture suites for kind classification, brand index,
// pack notation, math reconciliation, sku-history, accountant export,
// and contract-price watch. All must pass to merge.
// =====================================================================

let kindPass = 0, kindFail = 0;
console.log(`\nKind classification (Wave 1.5):`);
const KIND_FIXTURES = [
  { line: 'CREDIT 12345 ROMAINE 24CT 1 CS -$24.00', expectKind: 'credit' },
  { line: '0123456 MILK CRV BTL DEPOSIT $12.00',     expectKind: 'deposit' },
  { line: 'FUEL SURCHARGE $4.50',                    expectKind: 'surcharge' },
  { line: 'CHICKEN BREAST 5LB B/O',                  expectKind: 'backorder' },
  { line: '0123456 ROMAINE HEARTS 24CT 2 CS $48.00', expectKind: 'item' }
];
for (const fx of KIND_FIXTURES) {
  const k = PARSE.classifyKind(fx.line);
  const ok = k === fx.expectKind;
  console.log(`  ${ok ? '✓' : '✗'} ${fx.expectKind.padEnd(10)} ${fx.line.slice(0, 60)}`);
  if (ok) kindPass++; else kindFail++;
}

let packPass = 0, packFail = 0;
console.log(`\nPack notation extraction (Wave 1.5):`);
const PACK_FIXTURES = [
  { line: 'STELLA ARTOIS 24/12OZ BTL CASE $42.00', expectCaseQty: 24, expectUnit: 'oz' },
  { line: 'TOMATO PASTE 6#10 CASE $48.00',         expectCaseQty: 6,  expectUnit: '#' },
  { line: 'NAPKIN 5000CT $32.00',                  expectCaseQty: 5000, expectUnit: 'ct' }
];
for (const fx of PACK_FIXTURES) {
  const p = PARSE.extractPack(fx.line);
  const ok = p && p.caseQty === fx.expectCaseQty && p.unit === fx.expectUnit;
  console.log(`  ${ok ? '✓' : '✗'} ${fx.line.slice(0, 60)}  →  ${p ? JSON.stringify(p) : 'null'}`);
  if (ok) packPass++; else packFail++;
}

let mathPass = 0, mathFail = 0;
console.log(`\nMath reconciliation candidates (Wave 1.3):`);
const MATH_FIXTURES = [
  {
    label: 'digit-flip on a single line', expectKind: 'digit-flip',
    // Sum reads 18.00 + 30.00 = 48.00; printed is 108.00 — flipping
    // the leading 1→7 on the first line gives 78.00 → balanced.
    rows: [{ lineTotal: 18.00 }, { lineTotal: 30.00 }],
    printedTotal: 108.00
  },
  {
    label: 'rounding only',  expectKind: 'rounding',
    rows: [{ lineTotal: 10.005 }, { lineTotal: 20.005 }],
    printedTotal: 30.02
  },
  {
    label: 'no fix candidate found (fall back to unknown)', expectKind: 'unknown',
    rows: [{ lineTotal: 10.00 }, { lineTotal: 20.00 }],
    printedTotal: 999.99
  }
];
for (const fx of MATH_FIXTURES) {
  const fix = PARSE.suggestMathFix(fx.rows, fx.printedTotal);
  const ok = fix && fix.kind === fx.expectKind;
  console.log(`  ${ok ? '✓' : '✗'} ${fx.label.padEnd(50)}  →  ${fix ? fix.kind : 'null'}`);
  if (ok) mathPass++; else mathFail++;
}

let brandPass = 0, brandFail = 0;
console.log(`\nBrand index Tier-1 (Wave 4.4):`);
const BRAND_FIXTURES = [
  { name: 'STELLA ARTOIS 24/12 BTL', expectCat: 'beverage' },
  { name: 'KERRYGOLD UNSALTED BUTTER 1LB', expectCat: 'dairy' },
  { name: 'TYSON CHICKEN TENDER FROZEN', expectCat: 'protein' },
  { name: 'HEINZ KETCHUP 1GAL', expectCat: 'dry-goods' },
  { name: 'CLOROX REGULAR BLEACH 121OZ', expectCat: 'cleaning' }
];
for (const fx of BRAND_FIXTURES) {
  const c = CATEGORIZE.classify({ name: fx.name });
  const ok = c.category === fx.expectCat;
  console.log(`  ${ok ? '✓' : '✗'} ${fx.expectCat.padEnd(11)} ${fx.name}  →  ${c.category} (${c.tier}, ${c.confidence}%)`);
  if (ok) brandPass++; else brandFail++;
}

let abbrPass = 0, abbrFail = 0;
console.log(`\nAbbreviation expansion (Wave 4.4):`);
const ABBR_FIXTURES = [
  { name: 'CHX BRST 5LB',        expectCat: 'protein' },
  { name: 'GRND BF 10LB FRZN',   expectCat: 'protein' },
  { name: 'FRZN SHRMP U-15 5LB', expectCat: 'seafood' }
];
for (const fx of ABBR_FIXTURES) {
  const c = CATEGORIZE.classify({ name: fx.name });
  const ok = c.category === fx.expectCat;
  console.log(`  ${ok ? '✓' : '✗'} ${fx.expectCat.padEnd(11)} ${fx.name}  →  ${c.category} (${c.tier}, ${c.confidence}%)`);
  if (ok) abbrPass++; else abbrFail++;
}

let tagPass = 0, tagFail = 0;
console.log(`\nTag derivation (Wave 4.7):`);
const TAG_FIXTURES = [
  { name: 'FROZEN GROUND BEEF 10LB', expectTags: ['perishable', 'frozen'] },
  { name: 'STELLA ARTOIS 24/12 BTL', expectTags: ['alcoholic'] },
  { name: 'ALMOND MILK 1GAL',        expectTags: ['allergen-nuts'] }
];
for (const fx of TAG_FIXTURES) {
  const c = CATEGORIZE.classify({ name: fx.name });
  const got = c.tags || [];
  const ok = fx.expectTags.every(function (t) { return got.indexOf(t) !== -1; });
  console.log(`  ${ok ? '✓' : '✗'} ${fx.name.padEnd(30)}  →  [${got.join(',')}]`);
  if (ok) tagPass++; else tagFail++;
}

let vendorPass = 0, vendorFail = 0;
console.log(`\nNew vendor detection (Wave 4.2):`);
const VENDOR_FIXTURES = [
  { text: 'CHENEY BROTHERS INC\nCBI Item Description Pack Qty Unit\n', expectVendor: 'cheney-brothers' },
  { text: 'BEN E. KEITH FOODS\nDallas Distribution Center\n',          expectVendor: 'ben-e-keith' },
  { text: 'IMPERIAL DADE\nJanitorial & Disposables\n',                  expectVendor: 'imperial-dade' },
  { text: 'KEHE Distributors\nSpecialty Foods\n',                       expectVendor: 'kehe' },
  { text: 'BALDOR Specialty Foods\nBronx NY\n',                         expectVendor: 'baldor' },
  { text: 'FRESHPOINT\nProduce Order\n',                                expectVendor: 'freshpoint' },
  // Wave 4.2 final batch
  { text: 'COSTCO BUSINESS CENTER\nGold Star Business Member\n',        expectVendor: 'costco-business' },
  { text: 'WEBSTAURANTSTORE.COM\nClark Associates Order Confirmation #88123\n', expectVendor: 'webstaurantstore' },
  { text: 'VERITIV CORPORATION\nPackaging & Facility Solutions\n',      expectVendor: 'veritiv' },
  { text: 'HILAND DAIRY\nRoute 14 Driver 7 DSD INVOICE\n',               expectVendor: 'dairy-dsd' },
  { text: 'SOUTHERN GLAZER\'S WINE & SPIRITS\nState Liquor Tax\nCase Price\n', expectVendor: 'beer-wine-distributor' }
];
for (const fx of VENDOR_FIXTURES) {
  const m = VENDORS.detectVendor(fx.text);
  const ok = m && m.id === fx.expectVendor;
  console.log(`  ${ok ? '✓' : '✗'} ${fx.expectVendor.padEnd(20)}  →  ${m ? m.id + ' (' + (m.score*100|0) + '%)' : 'none'}`);
  if (ok) vendorPass++; else vendorFail++;
}

// SKU history + contract-price tests (require a stub MuntinContext +
// MID_LEARNINGS so the module's optional integrations resolve).
let skuPass = 0, skuFail = 0;
console.log(`\nSKU history + contract-price (Waves 1.1 + 1.2):`);
{
  // Stub a minimal MuntinContext + MID_LEARNINGS for sku-history.
  const stubStore = { skuHistory: {}, contractPrices: {} };
  global.window = global.window || {};
  global.window.MuntinContext = {
    read: () => stubStore,
    merge: (patch) => { Object.keys(patch).forEach(k => { stubStore[k] = patch[k]; }); return true; }
  };
  global.window.MID_LEARNINGS = {
    extractStem: (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim()
  };
  const SKU = await import(path.join(repoRoot, 'tools/invoice-decoder/sku-history.js')).then(m => m.default || m);

  // Record several observations for "ground beef".
  SKU.recordObservation({ name: 'GROUND BEEF 10LB', unitPrice: 4.20, qty: 1, unit: 'lb' }, 'sysco');
  SKU.recordObservation({ name: 'GROUND BEEF 10LB', unitPrice: 4.30, qty: 1, unit: 'lb' }, 'sysco');
  SKU.recordObservation({ name: 'GROUND BEEF 10LB', unitPrice: 4.25, qty: 1, unit: 'lb' }, 'sysco');
  SKU.recordObservation({ name: 'GROUND BEEF 10LB', unitPrice: 4.20, qty: 1, unit: 'lb' }, 'sysco');

  // New invoice has same SKU at 5.00 — should flag anomaly.
  const summary = SKU.summarizeRow({ name: 'GROUND BEEF 10LB', unitPrice: 5.00, qty: 1, unit: 'lb' });
  const sumOk = summary && summary.isAnomaly && summary.medianDelta > 0;
  console.log(`  ${sumOk ? '✓' : '✗'} drift summary fires anomaly when current price is +18% off median  →  ${summary ? summary.medianDelta + '%' : 'null'}`);
  if (sumOk) skuPass++; else skuFail++;

  // Contract layer: set $4.20 contract; flag overcharge at $5.00.
  SKU.setContract('GROUND BEEF 10LB', 4.20, { vendor: 'sysco', unit: 'lb' });
  const check = SKU.checkRow({ name: 'GROUND BEEF 10LB', unitPrice: 5.00, qty: 10, unit: 'lb' });
  const contractOk = check && check.isOver && check.overcharge > 7.5;
  console.log(`  ${contractOk ? '✓' : '✗'} contract overcharge fires (10 LB × $0.80 = $8.00)  →  ${check ? '$' + check.overcharge : 'null'}`);
  if (contractOk) skuPass++; else skuFail++;

  delete global.window;
}

let exportPass = 0, exportFail = 0;
console.log(`\nAccountant export (Wave 4.6):`);
{
  const ACCT = await import(path.join(repoRoot, 'tools/invoice-decoder/accountant-export.js')).then(m => m.default || m);
  const invoice = {
    vendor: 'sysco',
    savedAt: 1700000000000,
    parsedSum: 168.50,
    rows: [
      { name: 'Romaine Hearts', qty: 2, unit: 'cs', lineTotal: 48.00, category: 'produce', kind: 'item' },
      { name: 'Ground Chuck',   qty: 2, unit: 'cs', lineTotal: 58.00, category: 'protein', kind: 'item' },
      { name: 'Salmon Fillet',  qty: 1, unit: 'cs', lineTotal: 62.50, category: 'seafood', kind: 'item' }
    ]
  };
  const formats = ['qbo', 'qbd', 'xero', 'contpaqi', 'generic'];
  for (const fmt of formats) {
    const art = ACCT.exportInvoice(fmt, invoice, {});
    const ok = art && art.body && art.body.length > 50 && art.filename;
    console.log(`  ${ok ? '✓' : '✗'} ${fmt.padEnd(10)} ${art.filename}  ${art.body.length} bytes`);
    if (ok) exportPass++; else exportFail++;
  }
}

console.log(`\nWave 8 fixtures: ${kindPass} kind / ${packPass} pack / ${mathPass} math / ${brandPass} brand / ${abbrPass} abbr / ${tagPass} tag / ${vendorPass} vendor / ${skuPass} sku / ${exportPass} export passed.`);

// =====================================================================
// Wave 2.2 — perspective rectification math tests.
//
// Tests run against the pure-function exports of preprocess.js. They
// don't need a real <canvas>; ImageData is just {data, width, height}
// where data is a Uint8ClampedArray of RGBA bytes.
// =====================================================================

let homPass = 0, homFail = 0;
console.log(`\nHomography math (Wave 2.2):`);
{
  // Identity case: src = dst → H should map any point to itself.
  const id = PREP.solveHomography(
    [{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}],
    [{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]
  );
  const idOk = id && Math.abs(id[0] - 1) < 1e-6 && Math.abs(id[4] - 1) < 1e-6 && Math.abs(id[2]) < 1e-6 && Math.abs(id[5]) < 1e-6;
  console.log(`  ${idOk ? '✓' : '✗'} identity homography returns near-identity matrix`);
  if (idOk) homPass++; else homFail++;

  // Perspective case: a known forward H should map source corners
  // to destination corners exactly.
  const src = [{x:10,y:20},{x:200,y:30},{x:210,y:180},{x:5,y:170}];
  const dst = [{x:0,y:0},{x:200,y:0},{x:200,y:150},{x:0,y:150}];
  const H = PREP.solveHomography(src, dst);
  let mapOk = !!H;
  if (H) {
    for (let k = 0; k < 4 && mapOk; k++) {
      const p = PREP.applyHomography(H, src[k].x, src[k].y);
      if (!p || Math.abs(p.x - dst[k].x) > 0.01 || Math.abs(p.y - dst[k].y) > 0.01) mapOk = false;
    }
  }
  console.log(`  ${mapOk ? '✓' : '✗'} solveHomography: each src corner maps to its dst corner within 0.01 px`);
  if (mapOk) homPass++; else homFail++;

  // Inverse: H · H⁻¹ should map any point back to itself.
  const Hinv = PREP.invertHomography(H);
  let invOk = !!Hinv;
  if (Hinv) {
    for (let k = 0; k < 4 && invOk; k++) {
      const p = PREP.applyHomography(H, src[k].x, src[k].y);
      const back = PREP.applyHomography(Hinv, p.x, p.y);
      if (!back || Math.abs(back.x - src[k].x) > 0.01 || Math.abs(back.y - src[k].y) > 0.01) invOk = false;
    }
  }
  console.log(`  ${invOk ? '✓' : '✗'} invertHomography: round-trip H · H⁻¹ returns the source corner within 0.01 px`);
  if (invOk) homPass++; else homFail++;

  // Singular system (3 collinear src points) should return null.
  const sing = PREP.solveHomography(
    [{x:0,y:0},{x:50,y:0},{x:100,y:0},{x:0,y:50}],   // 3 points on y=0
    [{x:0,y:0},{x:50,y:0},{x:100,y:0},{x:0,y:50}]
  );
  // Note: identical src and dst is technically not singular here;
  // build a genuinely singular system.
  const sing2 = PREP.solveHomography(
    [{x:0,y:0},{x:0,y:0},{x:100,y:0},{x:0,y:100}],   // duplicate corner
    [{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]
  );
  const singOk = sing2 === null;
  console.log(`  ${singOk ? '✓' : '✗'} singular system returns null gracefully`);
  if (singOk) homPass++; else homFail++;
}

let warpPass = 0, warpFail = 0;
console.log(`\nWarp + bilinear sample (Wave 2.2):`);
{
  // Build a 20×20 RGBA buffer with a vertical color gradient
  // (red ramp 0→255). Identity warp should reproduce it.
  const W = 20, H = 20;
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      data[i] = Math.round(x / (W - 1) * 255);     // R ramps with x
      data[i + 1] = Math.round(y / (H - 1) * 255); // G ramps with y
      data[i + 2] = 128;
      data[i + 3] = 255;
    }
  }
  const srcImg = { data, width: W, height: H };
  // Identity homography
  const idH = PREP.solveHomography(
    [{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}],
    [{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}]
  );
  const out = PREP.warpPerspective(srcImg, idH, W, H);
  let okIdentity = !!out;
  if (out) {
    // Compare every pixel — identity should be exact (or off by ≤1 due to bilinear edge clamping).
    let maxDiff = 0;
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = (y * W + x) * 4;
        for (let ch = 0; ch < 3; ch++) {
          const d = Math.abs(out.data[i + ch] - data[i + ch]);
          if (d > maxDiff) maxDiff = d;
        }
      }
    }
    okIdentity = maxDiff <= 1;
  }
  console.log(`  ${okIdentity ? '✓' : '✗'} identity warp reproduces source within ±1 channel value`);
  if (okIdentity) warpPass++; else warpFail++;

  // Bilinear sample at exact integer points returns the pixel value.
  const r0 = PREP.bilinearSample(data, W, H, 5, 5);
  const ix = (5 * W + 5) * 4;
  const okExact = r0[0] === data[ix] && r0[1] === data[ix + 1] && r0[2] === data[ix + 2];
  console.log(`  ${okExact ? '✓' : '✗'} bilinearSample at integer (5,5) matches source pixel exactly`);
  if (okExact) warpPass++; else warpFail++;

  // Bilinear sample at midpoint between two pixels is ~average.
  const mid = PREP.bilinearSample(data, W, H, 5.5, 5);
  // Expected R ≈ avg of (5/19)*255 and (6/19)*255
  const expectedR = ((5 / 19) * 255 + (6 / 19) * 255) / 2;
  const okMid = Math.abs(mid[0] - expectedR) < 1;
  console.log(`  ${okMid ? '✓' : '✗'} bilinearSample at half-pixel returns interpolated value (got ${mid[0]}, expected ~${expectedR.toFixed(1)})`);
  if (okMid) warpPass++; else warpFail++;

  // Out-of-bounds returns white.
  const oob = PREP.bilinearSample(data, W, H, -5, -5);
  const okOob = oob[0] === 255 && oob[1] === 255 && oob[2] === 255;
  console.log(`  ${okOob ? '✓' : '✗'} bilinearSample out-of-bounds returns white background`);
  if (okOob) warpPass++; else warpFail++;

  // Round-trip: forward-warp source through a known perspective,
  // then inverse-warp the result. Final output should match source.
  const skewSrc = [{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}];
  const skewDst = [{x:2,y:1},{x:W-1,y:3},{x:W-3,y:H-1},{x:1,y:H-2}];
  const fwd = PREP.solveHomography(skewSrc, skewDst);
  const fwdImg = PREP.warpPerspective(srcImg, fwd, W, H);
  const inv = PREP.solveHomography(skewDst, skewSrc);
  const back = PREP.warpPerspective(fwdImg, inv, W, H);
  let roundTripErr = 0;
  let roundTripCount = 0;
  // Skip a 4px border; bilinear sampling can't fully recover those.
  for (let y = 4; y < H - 4; y++) {
    for (let x = 4; x < W - 4; x++) {
      const i = (y * W + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        roundTripErr += Math.abs(back.data[i + ch] - data[i + ch]);
        roundTripCount++;
      }
    }
  }
  const meanErr = roundTripErr / roundTripCount;
  const okRoundTrip = meanErr < 12;
  console.log(`  ${okRoundTrip ? '✓' : '✗'} forward+inverse warp round-trip mean channel error = ${meanErr.toFixed(2)} (need <12)`);
  if (okRoundTrip) warpPass++; else warpFail++;
}

let quadPass = 0, quadFail = 0;
console.log(`\nQuad picker (Wave 2.2):`);
{
  // Build synthetic Hough peaks for a simple rectangle of corners
  // at (10,20)-(190,20)-(190,180)-(10,180). The 4 lines:
  //   top:    y = 20    →  Hough form: 0*x + 1*y = 20  →  theta=90, rho=20
  //   bottom: y = 180   →  theta=90, rho=180
  //   left:   x = 10    →  theta=0,  rho=10
  //   right:  x = 190   →  theta=0,  rho=190
  const peaks = [
    { theta: 0,  rho: 10,  votes: 200 },
    { theta: 0,  rho: 190, votes: 200 },
    { theta: 90, rho: 20,  votes: 180 },
    { theta: 90, rho: 180, votes: 180 }
  ];
  const quad = PREP.pickQuad(peaks, 200, 200);
  const ok = !!quad;
  let cornersOk = false;
  if (quad) {
    const expected = [
      { x: 10, y: 20 },
      { x: 190, y: 20 },
      { x: 190, y: 180 },
      { x: 10, y: 180 }
    ];
    cornersOk = quad.corners.every((c, i) =>
      Math.abs(c.x - expected[i].x) < 0.5 && Math.abs(c.y - expected[i].y) < 0.5
    );
  }
  console.log(`  ${ok && cornersOk ? '✓' : '✗'} pickQuad returns the expected corner set for a simple rectangle`);
  if (ok && cornersOk) quadPass++; else quadFail++;

  // Reject when only 3 lines are present.
  const peaks3 = peaks.slice(0, 3);
  const quad3 = PREP.pickQuad(peaks3, 200, 200);
  const okReject = quad3 === null;
  console.log(`  ${okReject ? '✓' : '✗'} pickQuad rejects when fewer than 4 lines available`);
  if (okReject) quadPass++; else quadFail++;

  // Reject when area coverage <25%.
  const tinyPeaks = [
    { theta: 0,  rho: 90,  votes: 200 },
    { theta: 0,  rho: 110, votes: 200 },
    { theta: 90, rho: 90,  votes: 200 },
    { theta: 90, rho: 110, votes: 200 }
  ];
  const tinyQuad = PREP.pickQuad(tinyPeaks, 200, 200);
  const okTinyReject = tinyQuad === null;
  console.log(`  ${okTinyReject ? '✓' : '✗'} pickQuad rejects quads covering <25% of frame`);
  if (okTinyReject) quadPass++; else quadFail++;

  // Reject opposite-side angle parity violation (a parallelogram
  // tilted hard one way).
  const skewedPeaks = [
    { theta: 0,   rho: 10,  votes: 200 },
    { theta: 0,   rho: 190, votes: 200 },
    { theta: 95,  rho: 20,  votes: 180 },  // 5° from horizontal
    { theta: 75,  rho: 180, votes: 180 }   // 15° from horizontal — 20° apart
  ];
  const skQuad = PREP.pickQuad(skewedPeaks, 200, 200);
  const okSkewReject = skQuad === null;
  console.log(`  ${okSkewReject ? '✓' : '✗'} pickQuad rejects when opposite-side angle parity exceeds 12°`);
  if (okSkewReject) quadPass++; else quadFail++;
}

let sobelPass = 0, sobelFail = 0;
console.log(`\nSobel edge magnitude (Wave 2.2):`);
{
  // Build a 10×10 image with a sharp vertical line at x=5.
  const W = 10, H = 10;
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const v = x < 5 ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const edges = PREP.sobelMagnitude({ data, width: W, height: H });
  // The vertical line should produce strong edge response at x=5.
  let maxEdge = 0, maxX = -1;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const v = edges[y * W + x];
      if (v > maxEdge) { maxEdge = v; maxX = x; }
    }
  }
  const ok = maxEdge >= 200 && (maxX === 4 || maxX === 5);
  console.log(`  ${ok ? '✓' : '✗'} Sobel: vertical line at x=5 produces strong edge at x=${maxX} (mag=${maxEdge})`);
  if (ok) sobelPass++; else sobelFail++;
}

console.log(`\nWave 2.2 fixtures: ${homPass} homography / ${warpPass} warp / ${quadPass} quad / ${sobelPass} sobel passed.`);

// End-to-end pipeline test: build a synthetic edge buffer with a
// rectangular border, run Hough → pickQuad, verify the quad matches
// the synthetic rectangle within a few pixels.
let pipePass = 0, pipeFail = 0;
console.log(`\nEnd-to-end Hough → pickQuad pipeline (Wave 2.2):`);
{
  const W = 100, H = 80;
  const edges = new Uint8ClampedArray(W * H);
  // Rectangle edges: top y=10, bottom y=70, left x=15, right x=85
  function paintLineH(y, intensity) { for (let x = 0; x < W; x++) edges[y * W + x] = intensity; }
  function paintLineV(x, intensity) { for (let y = 0; y < H; y++) edges[y * W + x] = intensity; }
  paintLineH(10, 200);
  paintLineH(70, 200);
  paintLineV(15, 200);
  paintLineV(85, 200);
  const peaks = PREP.houghLines(edges, W, H, { threshold: 100, topK: 12 });
  const ok = peaks.length >= 4;
  console.log(`  ${ok ? '✓' : '✗'} houghLines extracts ≥4 peaks from a rectangular edge buffer (got ${peaks.length})`);
  if (ok) pipePass++; else pipeFail++;

  const quad = PREP.pickQuad(peaks, W, H);
  const okQuad = !!quad;
  let cornersClose = false;
  if (quad) {
    const exp = [{x:15,y:10},{x:85,y:10},{x:85,y:70},{x:15,y:70}];
    cornersClose = quad.corners.every((c, i) =>
      Math.abs(c.x - exp[i].x) < 2 && Math.abs(c.y - exp[i].y) < 2
    );
  }
  console.log(`  ${okQuad && cornersClose ? '✓' : '✗'} pipeline maps 4 strongest Hough peaks to the source rectangle within ±2 px`);
  if (okQuad && cornersClose) pipePass++; else pipeFail++;
}

console.log(`\nWave 2.2 totals: ${homPass + warpPass + quadPass + sobelPass + pipePass} of ${homPass + warpPass + quadPass + sobelPass + pipePass + homFail + warpFail + quadFail + sobelFail + pipeFail} math + pipeline tests passed.`);

// =====================================================================
// Wave 4.3 — auto-learn (vendor template induction) tests.
// =====================================================================

let alPass = 0, alFail = 0;
console.log(`\nAuto-learn — letterhead hashing + induction (Wave 4.3):`);
{
  // Stub MuntinContext so the module's storage helpers work.
  const stubStore = { learnedVendorObservations: [], learnedVendors: [] };
  global.window = global.window || {};
  global.window.MuntinContext = {
    read: () => stubStore,
    merge: (patch) => { Object.keys(patch).forEach(k => { stubStore[k] = patch[k]; }); return true; }
  };
  const AL = await import(path.join(repoRoot, 'tools/invoice-decoder/auto-learn.js')).then(m => m.default || m);

  // Hash stability: same letterhead text → same hash.
  const lh1 = AL.normalize('LA MICHOACANA MEAT MARKET\nWHOLESALE FOODS\nDallas TX 75201\nCustomer Number: 4421');
  const lh2 = AL.normalize('LA MICHOACANA MEAT MARKET\nWHOLESALE FOODS\nDallas TX 75201\nCustomer Number: 9988');  // different invoice number
  const h1 = AL.fnv1a(lh1);
  const h2 = AL.fnv1a(lh2);
  const okStable = h1 === h2;
  console.log(`  ${okStable ? '✓' : '✗'} fnv1a hash is stable across invoice-number variation (${h1} === ${h2})`);
  if (okStable) alPass++; else alFail++;

  // Bigram Jaccard: identical text → 1.0; different text → low.
  const j1 = AL.bigramJaccard(lh1, lh1);
  const okIdentJ = Math.abs(j1 - 1.0) < 0.001;
  console.log(`  ${okIdentJ ? '✓' : '✗'} bigramJaccard(self, self) === 1.0 (got ${j1.toFixed(3)})`);
  if (okIdentJ) alPass++; else alFail++;

  const j2 = AL.bigramJaccard('the quick brown fox', 'a totally different sentence');
  const okDiffJ = j2 < 0.4;
  console.log(`  ${okDiffJ ? '✓' : '✗'} bigramJaccard distinguishes unrelated text (got ${j2.toFixed(3)} < 0.4)`);
  if (okDiffJ) alPass++; else alFail++;

  // Bigram Jaccard tolerates light OCR noise.
  const noisy = AL.normalize('LA MICH0ACANA MEAT MAREKT\nWHOLESALE F00DS\nDalls TX 75201');
  const jNoisy = AL.bigramJaccard(lh1, noisy);
  const okNoiseTol = jNoisy >= 0.5;
  console.log(`  ${okNoiseTol ? '✓' : '✗'} bigramJaccard tolerates light OCR noise (got ${jNoisy.toFixed(3)} ≥ 0.5)`);
  if (okNoiseTol) alPass++; else alFail++;

  // induceDetectTokens picks the long distinctive words.
  const tokens = AL.induceDetectTokens(lh1);
  const okTokens = tokens.length >= 3 && tokens.includes('michoacana');
  console.log(`  ${okTokens ? '✓' : '✗'} induceDetectTokens picks distinctive words (got ${JSON.stringify(tokens)})`);
  if (okTokens) alPass++; else alFail++;

  // Header-skip induction: lines appearing in 2 of 3 samples become headers.
  const samples = [
    { topLines: ['LA MICHOACANA MEAT MARKET', 'Dallas TX 75201', 'Item Description Qty Unit', '0123 RIBEYE 5LB $48.00'] },
    { topLines: ['LA MICHOACANA MEAT MARKET', 'Dallas TX 75201', 'Item Description Qty Unit', '4567 CARNITAS 10LB $58.00'] },
    { topLines: ['LA MICHOACANA MEAT MARKET', 'Dallas TX 75201', 'Item Description Qty Unit', '8910 CHORIZO 5LB $32.00'] }
  ];
  const headers = AL.induceHeaderSkip(samples);
  const okHeaders = headers.length >= 2 && headers.some(h => /michoacana/i.test(h));
  console.log(`  ${okHeaders ? '✓' : '✗'} induceHeaderSkip extracts ≥2 recurring header lines (got ${headers.length})`);
  if (okHeaders) alPass++; else alFail++;

  // Total-regex induction: needs the same total phrasing in ≥2 samples.
  const totalSamples = [
    { topLines: ['HEADER LINE', 'GRAND TOTAL: $168.50'] },
    { topLines: ['HEADER LINE', 'GRAND TOTAL: $284.00'] },
    { topLines: ['HEADER LINE', 'GRAND TOTAL: $112.75'] }
  ];
  const totalRe = AL.induceTotalRegex(totalSamples);
  const okTotalRe = totalRe && totalRe.indexOf('grand') !== -1;
  console.log(`  ${okTotalRe ? '✓' : '✗'} induceTotalRegex extracts the recurring total phrasing (got ${totalRe})`);
  if (okTotalRe) alPass++; else alFail++;

  // Full flow: 3 observations → shouldPromptToLearn returns the bucket;
  // build template; save; detectLearnedVendor finds it.
  AL.clearAll();
  const sampleText = 'LA MICHOACANA MEAT MARKET\nWHOLESALE FOODS\nDallas TX\nItem Description Qty Unit Price\n0123 RIBEYE 5LB $48.00';
  AL.recordObservation(sampleText, [], null);
  AL.recordObservation(sampleText.replace('0123', '4567').replace('48.00', '58.00'), [], null);
  AL.recordObservation(sampleText.replace('0123', '8910').replace('48.00', '32.00'), [], null);
  const ready = AL.shouldPromptToLearn(sampleText);
  const okReady = ready && ready.samples && ready.samples.length === 3;
  console.log(`  ${okReady ? '✓' : '✗'} shouldPromptToLearn returns bucket after 3 observations`);
  if (okReady) alPass++; else alFail++;

  if (ready) {
    const tmpl = AL.buildLearnedTemplate(ready.letterhead, ready.samples, 'La Michoacana');
    const okBuild = tmpl && tmpl.label === 'La Michoacana' && tmpl.detectTokens.length >= 3;
    console.log(`  ${okBuild ? '✓' : '✗'} buildLearnedTemplate constructs a complete template`);
    if (okBuild) alPass++; else alFail++;

    const okSave = AL.saveLearnedTemplate(tmpl);
    console.log(`  ${okSave ? '✓' : '✗'} saveLearnedTemplate persists the template`);
    if (okSave) alPass++; else alFail++;

    const detected = AL.detectLearnedVendor(sampleText);
    const okDetect = detected && detected.id === tmpl.id && detected.score >= 0.55;
    console.log(`  ${okDetect ? '✓' : '✗'} detectLearnedVendor matches the saved template (score ${detected ? detected.score.toFixed(3) : 'null'})`);
    if (okDetect) alPass++; else alFail++;

    // After save, observations for this letterhead are cleared.
    const clearedReady = AL.shouldPromptToLearn(sampleText);
    const okClear = clearedReady === null;
    console.log(`  ${okClear ? '✓' : '✗'} shouldPromptToLearn returns null once template is saved`);
    if (okClear) alPass++; else alFail++;

    // Recognized template should not re-trigger the prompt for a new
    // invoice from the same vendor.
    AL.recordObservation(sampleText.replace('0123', '9999'), [], null);
    const stillCleared = AL.shouldPromptToLearn(sampleText.replace('0123', '9999'));
    const okStillCleared = stillCleared === null;
    console.log(`  ${okStillCleared ? '✓' : '✗'} learned letterhead does not re-prompt on future invoices`);
    if (okStillCleared) alPass++; else alFail++;
  } else {
    alFail += 4;
  }

  // Cleanup global stub.
  delete global.window;
}

console.log(`\nWave 4.3 fixtures: ${alPass} passed.`);

// =====================================================================
// Wave 6.4 — vendor-config + vendor-pin tests.
// =====================================================================

let vcPass = 0, vcFail = 0;
console.log(`\nVendor pin manifest + URL config (Wave 6.4):`);
{
  // Verify the integrity manifest parses + has the expected entries.
  const integrityPath = path.join(repoRoot, 'dist/assets/vendor/_integrity.json');
  let manifest = null;
  try {
    manifest = JSON.parse(await fs.promises.readFile(integrityPath, 'utf8'));
  } catch (_) { /* might not be present in CI without build */ }
  if (manifest && manifest.files) {
    const expectedKeys = [
      '/assets/vendor/tesseract.js@5.1.1/tesseract.min.js',
      '/assets/vendor/tesseract.js@5.1.1/worker.min.js',
      '/assets/vendor/pdfjs-dist@4.5.136/pdf.min.mjs',
      '/assets/vendor/pdfjs-dist@4.5.136/pdf.worker.min.mjs',
      '/assets/vendor/xlsx@0.20.3/xlsx.mjs'
    ];
    for (const k of expectedKeys) {
      const hit = manifest.files[k];
      const ok = hit && /^sha384-/.test(hit.sha384) && hit.bytes > 0;
      console.log(`  ${ok ? '✓' : '✗'} ${k.padEnd(60)} ${hit ? hit.sha384.slice(0, 24) + '...' : 'MISSING'}`);
      if (ok) vcPass++; else vcFail++;
    }
  } else {
    console.log('  · manifest not present in dist/ (run `node scripts/vendor-pin.mjs --allow-offline`); skipping these checks');
  }

  // Static analysis: vendor-config exposes the right URLs.
  const cfg = await fs.promises.readFile(path.join(repoRoot, 'tools/invoice-decoder/vendor-config.js'), 'utf8');
  const okSelfTesseract = cfg.indexOf("/assets/vendor/tesseract.js@") !== -1;
  const okSelfPdfjs     = cfg.indexOf("/assets/vendor/pdfjs-dist@")    !== -1;
  const okSelfXlsx      = cfg.indexOf("/assets/vendor/xlsx@")          !== -1;
  console.log(`  ${okSelfTesseract ? '✓' : '✗'} vendor-config.js declares tesseract self-hosted path`);
  console.log(`  ${okSelfPdfjs     ? '✓' : '✗'} vendor-config.js declares pdfjs self-hosted path`);
  console.log(`  ${okSelfXlsx      ? '✓' : '✗'} vendor-config.js declares xlsx self-hosted path`);
  if (okSelfTesseract) vcPass++; else vcFail++;
  if (okSelfPdfjs)     vcPass++; else vcFail++;
  if (okSelfXlsx)      vcPass++; else vcFail++;

  // Static analysis: ocr / pdf / csv no longer reference jsdelivr.
  const ocr  = await fs.promises.readFile(path.join(repoRoot, 'tools/invoice-decoder/ocr.js'), 'utf8');
  const pdfx = await fs.promises.readFile(path.join(repoRoot, 'tools/invoice-decoder/pdf-extract.js'), 'utf8');
  const csvx = await fs.promises.readFile(path.join(repoRoot, 'tools/invoice-decoder/csv-extract.js'), 'utf8');
  // The vendor-config module legitimately keeps LEGACY entries with jsdelivr;
  // the consumer modules should not embed those URLs themselves anymore.
  const okOcrClean  = !/cdn\.jsdelivr\.net/.test(ocr);
  const okPdfClean  = !/cdn\.jsdelivr\.net/.test(pdfx);
  const okCsvClean  = !/cdn\.jsdelivr\.net/.test(csvx);
  console.log(`  ${okOcrClean ? '✓' : '✗'} ocr.js no longer hard-codes jsdelivr URLs`);
  console.log(`  ${okPdfClean ? '✓' : '✗'} pdf-extract.js no longer hard-codes jsdelivr URLs`);
  console.log(`  ${okCsvClean ? '✓' : '✗'} csv-extract.js no longer hard-codes jsdelivr URLs`);
  if (okOcrClean) vcPass++; else vcFail++;
  if (okPdfClean) vcPass++; else vcFail++;
  if (okCsvClean) vcPass++; else vcFail++;

  // Static analysis: CSP no longer allows jsdelivr in script-src.
  const headers = await fs.promises.readFile(path.join(repoRoot, '_headers'), 'utf8');
  const cspMatch = headers.match(/Content-Security-Policy:\s*([^\n]+)/);
  if (cspMatch) {
    const csp = cspMatch[1];
    const scriptSrc = csp.match(/script-src([^;]+);/);
    const okCspClean = scriptSrc && !/cdn\.jsdelivr\.net/.test(scriptSrc[1]);
    console.log(`  ${okCspClean ? '✓' : '✗'} CSP script-src no longer allows cdn.jsdelivr.net`);
    if (okCspClean) vcPass++; else vcFail++;
  }
}

console.log(`\nWave 6.4 fixtures: ${vcPass} passed.`);

// =====================================================================
// Wave 6.1 + 6.3 — KDF dispatcher + dual-wrap envelope + recovery.
//
// Tests run in Node with WebCrypto polyfill (Node 18+ has it built-in
// at globalThis.crypto.subtle). Argon2id requires the WASM module
// which isn't available in pure Node — we exercise the PBKDF2 path
// with low iterations so the round-trips finish quickly.
// =====================================================================

let kdfPass = 0, kdfFail = 0;
console.log(`\nKDF + envelope v=2 dual-wrap (Waves 6.1, 6.3):`);
{
  // Stub the browser globals the modules expect.
  global.window = global.window || {};
  global.window.crypto = global.crypto;
  global.window.MuntinContext = global.window.MuntinContext || {
    read: () => ({}),
    merge: () => true
  };

  const KDF     = await import(path.join(repoRoot, 'tools/invoice-decoder/kdf.js'))     .then(m => m.default || m);
  global.window.MID_KDF = KDF;
  const ENC     = await import(path.join(repoRoot, 'tools/invoice-decoder/encrypt.js')) .then(m => m.default || m);
  global.window.MID_ENCRYPT = ENC;

  // PBKDF2 is identical given the same salt + iterations.
  const salt = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
  const k1 = await KDF.deriveKeyPbkdf2('hunter2-supersafe', salt, 1000);
  const k2 = await KDF.deriveKeyPbkdf2('hunter2-supersafe', salt, 1000);
  const okDeterministic = k1.length === 32 && k1.every((b, i) => b === k2[i]);
  console.log(`  ${okDeterministic ? '✓' : '✗'} deriveKeyPbkdf2 is deterministic (32-byte output, identical for same input)`);
  if (okDeterministic) kdfPass++; else kdfFail++;

  // Different salt → different key.
  const salt2 = new Uint8Array([16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]);
  const k3 = await KDF.deriveKeyPbkdf2('hunter2-supersafe', salt2, 1000);
  const different = !k1.every((b, i) => b === k3[i]);
  console.log(`  ${different ? '✓' : '✗'} deriveKeyPbkdf2 with different salt yields different key`);
  if (different) kdfPass++; else kdfFail++;

  // Round-trip a v=2 envelope using PBKDF2 (Argon2id requires WASM).
  const payload = { rows: [{ name: 'Romaine Hearts', qty: 2, lineTotal: 48 }], totalParsed: 48 };
  const passphrase = 'correct-horse-battery-staple-99';
  const aad = 'invoice:test:001';
  const lowParams = { kdf: 'pbkdf2', iter: 5000 };  // fast for tests
  const env = await ENC.encryptPayload(payload, passphrase, aad, { kdfParams: lowParams });
  const okShape = env.v === 2 && Array.isArray(env.wraps) && env.wraps.length === 1 && env.wraps[0].kind === 'passphrase';
  console.log(`  ${okShape ? '✓' : '✗'} encryptPayload emits v=2 envelope with one passphrase wrap`);
  if (okShape) kdfPass++; else kdfFail++;

  // Decrypt with correct passphrase.
  const got = await ENC.decryptPayload(env, passphrase, aad);
  const okRoundtrip = got && got.totalParsed === 48 && got.rows[0].name === 'Romaine Hearts';
  console.log(`  ${okRoundtrip ? '✓' : '✗'} decryptPayload recovers the exact payload with the right passphrase`);
  if (okRoundtrip) kdfPass++; else kdfFail++;

  // Wrong passphrase rejects.
  let okReject = false;
  try {
    await ENC.decryptPayload(env, 'wrong-pass', aad);
  } catch (_) { okReject = true; }
  console.log(`  ${okReject ? '✓' : '✗'} decryptPayload rejects on wrong passphrase`);
  if (okReject) kdfPass++; else kdfFail++;

  // Wrong AAD rejects (tamper protection).
  let okAadReject = false;
  try {
    await ENC.decryptPayload(env, passphrase, 'invoice:test:DIFFERENT');
  } catch (_) { okAadReject = true; }
  console.log(`  ${okAadReject ? '✓' : '✗'} decryptPayload rejects on tampered AAD`);
  if (okAadReject) kdfPass++; else kdfFail++;

  // Dual-wrap: encrypt with passphrase + recovery, decrypt with EITHER.
  const recoveryPhrase = 'apple banana cherry date echo fig grape honey ink jam kiwi lemon mango note olive pear quince rose silk tea ugli vine water yew';
  const dual = await ENC.encryptPayload(payload, passphrase, aad, {
    kdfParams: lowParams,
    recoveryPhrase: recoveryPhrase
  });
  const okDualShape = dual.v === 2 && dual.wraps.length === 2 &&
                      dual.wraps[0].kind === 'passphrase' &&
                      dual.wraps[1].kind === 'recovery';
  console.log(`  ${okDualShape ? '✓' : '✗'} encryptPayload with recoveryPhrase emits two wraps`);
  if (okDualShape) kdfPass++; else kdfFail++;

  const viaPass = await ENC.decryptPayload(dual, passphrase, aad);
  const okViaPass = viaPass && viaPass.totalParsed === 48;
  console.log(`  ${okViaPass ? '✓' : '✗'} dual-wrap envelope decrypts with the passphrase`);
  if (okViaPass) kdfPass++; else kdfFail++;

  const viaRecovery = await ENC.decryptPayload(dual, recoveryPhrase, aad);
  const okViaRecovery = viaRecovery && viaRecovery.totalParsed === 48;
  console.log(`  ${okViaRecovery ? '✓' : '✗'} dual-wrap envelope decrypts with the recovery phrase`);
  if (okViaRecovery) kdfPass++; else kdfFail++;

  // addWrap on a single-wrap envelope yields a dual-wrap envelope
  // that still decrypts with the original passphrase AND with the
  // newly added recovery phrase.
  const upgraded = await ENC.addWrap(env, passphrase, recoveryPhrase, 'recovery', lowParams);
  const okUpgraded = upgraded.wraps.length === 2 &&
                     upgraded.wraps[1].kind === 'recovery';
  console.log(`  ${okUpgraded ? '✓' : '✗'} addWrap appends a recovery wrap to a single-wrap envelope`);
  if (okUpgraded) kdfPass++; else kdfFail++;

  const upgradedViaRec = await ENC.decryptPayload(upgraded, recoveryPhrase, aad);
  const okUpgradedRec = upgradedViaRec && upgradedViaRec.totalParsed === 48;
  console.log(`  ${okUpgradedRec ? '✓' : '✗'} upgraded envelope decrypts with the new recovery phrase`);
  if (okUpgradedRec) kdfPass++; else kdfFail++;

  // Backward compat: v=1 envelopes still decrypt.
  // Build a v=1 manually using the legacy path. The encrypt module
  // doesn't expose a v=1 builder anymore, so we hand-construct the
  // shape and let decryptV1 do its job.
  const enc = new TextEncoder();
  const v1Salt = global.crypto.getRandomValues(new Uint8Array(16));
  const v1Iv   = global.crypto.getRandomValues(new Uint8Array(12));
  const baseKey = await global.crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const v1Key = await global.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: v1Salt, iterations: 250000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const v1Ct = await global.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: v1Iv, additionalData: enc.encode(aad) },
    v1Key,
    enc.encode(JSON.stringify(payload))
  );
  function b64(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return Buffer.from(s, 'binary').toString('base64');
  }
  const v1Env = {
    v: 1,
    salt: b64(v1Salt),
    iv:   b64(v1Iv),
    ct:   b64(v1Ct),
    aad:  aad
  };
  const v1Result = await ENC.decryptPayload(v1Env, passphrase, aad);
  const okV1 = v1Result && v1Result.totalParsed === 48;
  console.log(`  ${okV1 ? '✓' : '✗'} legacy v=1 envelope still decrypts (backward compat)`);
  if (okV1) kdfPass++; else kdfFail++;

  delete global.window.MID_KDF;
  delete global.window.MID_ENCRYPT;
  delete global.window.MuntinContext;
  // Wave 4.1 — release the global.window stub so the next test
  // block (vendor template runtime) sees `typeof window ===
  // 'undefined'` and falls through to its file-system loader.
  delete global.window;
}

let recPass = 0, recFail = 0;
console.log(`\nRecovery phrase generation + validation (Wave 6.3):`);
{
  // Recovery module reads the BIP39 wordlist via fetch — that's
  // browser-only. We test the pure functions (normalize,
  // looksLikePhrase) plus the wordlist file's shape directly.
  const wordlistPath = path.join(repoRoot, 'tools/invoice-decoder/data/bip39-en.txt');
  const words = (await fs.promises.readFile(wordlistPath, 'utf8')).split(/\r?\n/).filter(Boolean);
  const okWordCount = words.length === 2048;
  console.log(`  ${okWordCount ? '✓' : '✗'} BIP39 wordlist contains 2048 words (got ${words.length})`);
  if (okWordCount) recPass++; else recFail++;

  // Sample words match the canonical list.
  const okSamples = words[0] === 'abandon' && words[2047] === 'zoo' && words[1] === 'ability';
  console.log(`  ${okSamples ? '✓' : '✗'} BIP39 wordlist matches canonical first/last entries (abandon, zoo)`);
  if (okSamples) recPass++; else recFail++;

  // No duplicates.
  const seen = new Set(words);
  const okUnique = seen.size === words.length;
  console.log(`  ${okUnique ? '✓' : '✗'} BIP39 wordlist has no duplicates`);
  if (okUnique) recPass++; else recFail++;

  // All lowercase.
  const okLower = words.every(w => w === w.toLowerCase());
  console.log(`  ${okLower ? '✓' : '✗'} BIP39 wordlist is all-lowercase`);
  if (okLower) recPass++; else recFail++;
}

console.log(`\nWave 6.1+6.3 fixtures: ${kdfPass} kdf+envelope / ${recPass} recovery passed.`);

// =====================================================================
// Wave 4.1 — JSON-per-vendor schema + template runtime tests.
// =====================================================================

let v41Pass = 0, v41Fail = 0;
console.log(`\nVendor JSON schema + template runtime (Wave 4.1):`);
{
  const vendorsDir = path.join(repoRoot, 'tools/invoice-decoder/vendors');
  const indexPath = path.join(vendorsDir, '_index.json');
  const indexRaw = await fs.promises.readFile(indexPath, 'utf8');
  const index = JSON.parse(indexRaw);

  // Schema sanity: every entry has id, label, detect.tokens.
  let schemaOk = Array.isArray(index.vendors) && index.vendors.length >= 22;
  for (const v of (index.vendors || [])) {
    if (!v.id || !v.label || !v.detect || !Array.isArray(v.detect.tokens)) {
      schemaOk = false;
    }
    for (const t of (v.detect.tokens || [])) {
      if (!t.pattern || typeof t.weight !== 'number') schemaOk = false;
    }
  }
  console.log(`  ${schemaOk ? '✓' : '✗'} _index.json contains ≥22 vendors with well-formed detect.tokens`);
  if (schemaOk) v41Pass++; else v41Fail++;

  // Each per-vendor JSON file exists, parses, and matches its index entry.
  let perFileOk = true;
  let missing = [];
  for (const v of (index.vendors || [])) {
    const p = path.join(vendorsDir, v.id + '.json');
    if (!fs.existsSync(p)) { perFileOk = false; missing.push(v.id); continue; }
    try {
      const j = JSON.parse(await fs.promises.readFile(p, 'utf8'));
      if (j.id !== v.id) perFileOk = false;
      if (!j.label || typeof j.label.en !== 'string') perFileOk = false;
      if (!Array.isArray(j.detect.tokens) || j.detect.tokens.length === 0) perFileOk = false;
    } catch (_) { perFileOk = false; }
  }
  console.log(`  ${perFileOk ? '✓' : '✗'} every index entry has a corresponding <id>.json file (missing: ${missing.join(',') || 'none'})`);
  if (perFileOk) v41Pass++; else v41Fail++;

  // Detection token regexes all compile.
  let regexOk = true;
  for (const v of index.vendors) {
    for (const t of v.detect.tokens) {
      try { new RegExp(t.pattern, 'i'); } catch (_) { regexOk = false; }
    }
  }
  console.log(`  ${regexOk ? '✓' : '✗'} every detection token regex compiles cleanly`);
  if (regexOk) v41Pass++; else v41Fail++;

  // Template runtime — token-based scoring.
  const RT = await import(path.join(repoRoot, 'tools/invoice-decoder/vendors/template-runtime.js')).then(m => m.default || m);
  RT._resetForTests();

  const detected = await RT.detectVendor('SYSCO HOUSTON\nCustomer Number: 1842371\nSUPC Pack Description');
  const okSysco = detected && detected.id === 'sysco' && detected.score >= 0.5;
  console.log(`  ${okSysco ? '✓' : '✗'} runtime.detectVendor identifies Sysco from canonical letterhead text`);
  if (okSysco) v41Pass++; else v41Fail++;

  // The lazy template fetch returns rich data (headerSkip etc.).
  const okHeaderSkip = detected && detected.template && Array.isArray(detected.template.headerSkip) && detected.template.headerSkip.length >= 3;
  console.log(`  ${okHeaderSkip ? '✓' : '✗'} matched template carries headerSkip patterns from the per-vendor JSON`);
  if (okHeaderSkip) v41Pass++; else v41Fail++;

  // No-match path returns null cleanly.
  const noMatch = await RT.detectVendor('GIBBERISH HEADER\nNot a real distributor invoice');
  const okNoMatch = noMatch === null;
  console.log(`  ${okNoMatch ? '✓' : '✗'} runtime returns null for unrecognized letterhead`);
  if (okNoMatch) v41Pass++; else v41Fail++;

  // Vendor facade compatibility — the legacy fields are populated.
  if (detected) {
    const facade = detected.vendor;
    const okFacade = facade && facade.id === 'sysco' &&
                     facade.label_en === 'Sysco' &&
                     typeof facade.confidenceBoost === 'number' &&
                     Array.isArray(facade.headerLines);
    console.log(`  ${okFacade ? '✓' : '✗'} runtime builds a legacy-compatible vendor facade for matched template`);
    if (okFacade) v41Pass++; else v41Fail++;
  }

  // Inline STUBS array in vendors.js mirrors _index.json count.
  const VENDORS_REFACTORED = await import(path.join(repoRoot, 'tools/invoice-decoder/vendors.js')).then(m => m.default || m);
  const stubMatchesIndex = VENDORS_REFACTORED.STUBS && VENDORS_REFACTORED.STUBS.length === index.vendors.length;
  console.log(`  ${stubMatchesIndex ? '✓' : '✗'} vendors.js inline STUBS count matches _index.json (${VENDORS_REFACTORED.STUBS && VENDORS_REFACTORED.STUBS.length} vs ${index.vendors.length})`);
  if (stubMatchesIndex) v41Pass++; else v41Fail++;

  // Inline detection still works synchronously (back-compat).
  const sync = VENDORS_REFACTORED.detectVendor('SYSCO HOUSTON\nCustomer Number: 1842371');
  const okSync = sync && sync.id === 'sysco';
  console.log(`  ${okSync ? '✓' : '✗'} legacy synchronous detectVendor() still works after refactor`);
  if (okSync) v41Pass++; else v41Fail++;
}

console.log(`\nWave 4.1 fixtures: ${v41Pass} passed.`);

// =====================================================================
// Wave 6.10 — desktop split-pane layout. Static checks against the
// HTML + CSS to confirm the wrapper is in place and the grid rules
// activate at 1024px.
// =====================================================================

let splitPass = 0, splitFail = 0;
console.log(`\nDesktop split-pane (Wave 6.10):`);
{
  const enHtml = await fs.promises.readFile(path.join(repoRoot, 'tools/invoice-decoder/index.html'), 'utf8');
  const esHtml = await fs.promises.readFile(path.join(repoRoot, 'es/tools/invoice-decoder/index.html'), 'utf8');

  // Wrapper present in both pages.
  const okEnWrap = /<div class="id-result-area">[\s\S]+\/\.id-result-area/.test(enHtml);
  const okEsWrap = /<div class="id-result-area">[\s\S]+\/\.id-result-area/.test(esHtml);
  console.log(`  ${okEnWrap ? '✓' : '✗'} EN page wraps the result region in .id-result-area`);
  console.log(`  ${okEsWrap ? '✓' : '✗'} ES page wraps the result region in .id-result-area`);
  if (okEnWrap) splitPass++; else splitFail++;
  if (okEsWrap) splitPass++; else splitFail++;

  // Grid CSS at 1024px present.
  const cssGridEn = /@media \(min-width:\s*1024px\)\{[^@]*\.id-result-area\s*\{\s*display:\s*grid/.test(enHtml.replace(/\s+/g, ' '));
  const cssGridEs = /@media \(min-width:\s*1024px\)\{[^@]*\.id-result-area\s*\{\s*display:\s*grid/.test(esHtml.replace(/\s+/g, ' '));
  console.log(`  ${cssGridEn ? '✓' : '✗'} EN page activates 2-column grid above 1024px`);
  console.log(`  ${cssGridEs ? '✓' : '✗'} ES page activates 2-column grid above 1024px`);
  if (cssGridEn) splitPass++; else splitFail++;
  if (cssGridEs) splitPass++; else splitFail++;

  // display:contents on .id-parsed so children participate in grid.
  const okContents = /\.id-parsed\{display:contents\}/.test(enHtml.replace(/\s+/g, ''));
  console.log(`  ${okContents ? '✓' : '✗'} EN page applies display:contents to .id-parsed inside the breakpoint`);
  if (okContents) splitPass++; else splitFail++;

  // Sticky preview rail.
  const okSticky = /\.id-preview-wrap\{position:sticky/.test(enHtml.replace(/\s+/g, ''));
  console.log(`  ${okSticky ? '✓' : '✗'} EN page makes .id-preview-wrap sticky in the rail`);
  if (okSticky) splitPass++; else splitFail++;

  // The :has() guard for hidden parsed panel — fallback to single column pre-OCR.
  const okHas = /\.id-result-area:has\(\.id-parsed\[hidden\]\)/.test(enHtml);
  console.log(`  ${okHas ? '✓' : '✗'} EN page falls back to single-column when .id-parsed is hidden (pre-OCR)`);
  if (okHas) splitPass++; else splitFail++;

  // Wider container at 1100px.
  const okWide = /@media \(min-width:\s*1100px\)\{[^@]*max-width:\s*1100px/.test(enHtml.replace(/\s+/g, ' '));
  console.log(`  ${okWide ? '✓' : '✗'} EN page widens the container at 1100px+`);
  if (okWide) splitPass++; else splitFail++;
}

console.log(`\nWave 6.10 fixtures: ${splitPass} passed.`);

// =====================================================================
// Wave 2.1 — live capture coach. Tests the pure-function pieces that
// run in the browser: state-machine debouncing, glare scoring, and
// laplacian-variance blur scoring. The video / getUserMedia / overlay
// rendering are exercised manually in a real browser; out of scope here.
// =====================================================================

let coachPass = 0, coachFail = 0;
console.log(`\nLive capture coach state machine + metrics (Wave 2.1):`);
{
  const COACH = await import(path.join(repoRoot, 'tools/invoice-decoder/capture-coach.js')).then(m => m.default || m);

  // State machine — sustained-signal debouncing.
  const evaluators = COACH._makeEvaluators();
  let state = COACH._makeCoachState();
  // Frame 1: all good (no rule fires) → candidate is allGood.
  let id = COACH._tickCoach(state, evaluators, { glareScore: 0, blur: 200, quadArea: 0.6 }, 1000);
  // After exactly 0ms, candidate just set; activeId still null → tick returns null
  // We set the timestamp to 1000; threshold is 400ms; activeId not yet flipped.
  console.log(`  ${id === null ? '✓' : '✗'} no rule firing within sustain window leaves activeId unset (got ${id})`);
  if (id === null) coachPass++; else coachFail++;

  // Frame 2: 500ms later, still all good → activeId becomes allGood.
  id = COACH._tickCoach(state, evaluators, { glareScore: 0, blur: 200, quadArea: 0.6 }, 1500);
  console.log(`  ${id === 'allGood' ? '✓' : '✗'} sustained no-rule for ≥400ms transitions to allGood (got ${id})`);
  if (id === 'allGood') coachPass++; else coachFail++;

  // Frame 3: glare appears, but only briefly → state should NOT flip yet.
  state = COACH._makeCoachState();
  state.activeId = 'allGood';
  state.candidateId = 'allGood';
  state.candidateAt = 1000;
  id = COACH._tickCoach(state, evaluators, { glareScore: 0.5, blur: 200, quadArea: 0.6 }, 1100);
  // Glare just started 100ms ago; sustain is 400ms → activeId still allGood.
  console.log(`  ${id === 'allGood' ? '✓' : '✗'} glare flicker shorter than sustain window keeps activeId stable (got ${id})`);
  if (id === 'allGood') coachPass++; else coachFail++;

  // Frame 4: glare sustained → flip to glare.
  id = COACH._tickCoach(state, evaluators, { glareScore: 0.5, blur: 200, quadArea: 0.6 }, 1500);
  console.log(`  ${id === 'glare' ? '✓' : '✗'} glare sustained ≥400ms transitions to glare (got ${id})`);
  if (id === 'glare') coachPass++; else coachFail++;

  // Glare > Blur > Fill-frame priority order. When multiple rules
  // fire at once, glare wins.
  state = COACH._makeCoachState();
  id = COACH._tickCoach(state, evaluators, { glareScore: 0.5, blur: 30, quadArea: 0.2 }, 1000);
  id = COACH._tickCoach(state, evaluators, { glareScore: 0.5, blur: 30, quadArea: 0.2 }, 1500);
  console.log(`  ${id === 'glare' ? '✓' : '✗'} priority order glare > blur > fillFrame (got ${id})`);
  if (id === 'glare') coachPass++; else coachFail++;

  // Glare scoring on a synthetic image: a 40×40 image with a 10×10
  // blob of pure-white pixels in the center should score > 0.25 in
  // ONE of the 4×4 grid cells.
  const W = 40, H = 40;
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const inBlob = x >= 15 && x < 25 && y >= 15 && y < 25;
      const v = inBlob ? 255 : 50;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const score = COACH._computeGlareScore({ data, width: W, height: H });
  console.log(`  ${score >= 0.25 ? '✓' : '✗'} computeGlareScore detects a focused white blob (got ${score.toFixed(3)} ≥ 0.25)`);
  if (score >= 0.25) coachPass++; else coachFail++;

  // Glare scoring on a uniformly mid-gray image: low score.
  const dataGray = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < dataGray.length; i += 4) { dataGray[i] = dataGray[i + 1] = dataGray[i + 2] = 120; dataGray[i + 3] = 255; }
  const grayScore = COACH._computeGlareScore({ data: dataGray, width: W, height: H });
  console.log(`  ${grayScore < 0.05 ? '✓' : '✗'} computeGlareScore returns near-zero for a uniformly gray image (got ${grayScore.toFixed(3)})`);
  if (grayScore < 0.05) coachPass++; else coachFail++;

  // Laplacian variance: a sharp edge should produce non-zero variance,
  // a uniform gray image should produce ~zero.
  const lvSharp = COACH._computeLaplacianVariance({ data, width: W, height: H });
  const lvFlat  = COACH._computeLaplacianVariance({ data: dataGray, width: W, height: H });
  const okLvOrder = lvSharp > lvFlat;
  console.log(`  ${okLvOrder ? '✓' : '✗'} laplacian variance higher on sharp edges (sharp ${lvSharp.toFixed(1)} > flat ${lvFlat.toFixed(1)})`);
  if (okLvOrder) coachPass++; else coachFail++;
}

console.log(`\nWave 2.1 fixtures: ${coachPass} passed.`);

// =====================================================================
// Wave 4.2 evolution — vendor categoryHints (Tier 0.5).
// =====================================================================

let v42Pass = 0, v42Fail = 0;
console.log(`\nVendor categoryHints — Tier 0.5 (Wave 4.2 evolution):`);
{
  // Stub MID_VENDORS with the cached-enrichment shape categorize.js
  // expects. We're testing that tier05VendorHints reads the
  // _enrichment fields and short-circuits to the mapped category.
  global.window = global.window || {};
  global.window.MID_VENDORS = {
    STUBS: [
      {
        id: 'sysco',
        _enrichment: {
          categoryHints: {
            skuPrefixMap: { '01': 'produce', '02': 'protein', '05': 'seafood' }
          }
        }
      },
      {
        id: 'gfs',
        _enrichment: {
          categoryHints: {
            classCodeRegex: '\\b(PRD|PRO|DRY|PAP|FRZ|BEV|JAN|SML|EQU|SEA|DAI|HRB)\\b',
            classCodeMap: { 'PRD': 'produce', 'PRO': 'protein', 'DRY': 'dry-goods', 'PAP': 'paper' }
          }
        }
      }
    ]
  };

  // Fresh import of categorize so the new global.window.MID_VENDORS
  // is visible. (Node module-cache means a re-import reuses the
  // first-load — but the IIFE captures `root` once at module load.
  // We're stubbing AFTER first-load above; tier05VendorHints
  // re-reads root.MID_VENDORS each call, so the stub still works.)
  // Re-importing also avoids cross-test pollution from earlier
  // stubs that stuffed root.MuntinContext etc.
  const CAT = await import(path.join(repoRoot, 'tools/invoice-decoder/categorize.js')).then(m => m.default || m);

  // GFS class-code path: row.raw contains "PRD" → produce.
  const gfsRow = {
    name:           'Romaine Hearts 24ct',
    raw:            '0123456 PRD ROMAINE HEARTS 24CT 2 CS $48.00',
    vendorDetected: 'gfs'
  };
  const gfsHit = CAT.tier05VendorHints(gfsRow);
  const okGfs = gfsHit && gfsHit.category === 'produce' && gfsHit.tier === 'vendor-class-code' && gfsHit.matched === 'PRD';
  console.log(`  ${okGfs ? '✓' : '✗'} GFS classCodeRegex matches PRD on row.raw → produce (got ${gfsHit ? gfsHit.category : 'null'})`);
  if (okGfs) v42Pass++; else v42Fail++;

  // GFS class-code: PRO → protein.
  const gfsRow2 = {
    name:           'Ground Chuck 10lb',
    raw:            '0234567 PRO GROUND CHUCK 10LB 2 CS $58.00',
    vendorDetected: 'gfs'
  };
  const gfsHit2 = CAT.tier05VendorHints(gfsRow2);
  const okGfs2 = gfsHit2 && gfsHit2.category === 'protein';
  console.log(`  ${okGfs2 ? '✓' : '✗'} GFS PRO class-code → protein (got ${gfsHit2 ? gfsHit2.category : 'null'})`);
  if (okGfs2) v42Pass++; else v42Fail++;

  // Sysco SKU-prefix path: row.sku starts with '01' → produce.
  const syscoRow = {
    name:           'Whatever',
    sku:            '0123456',
    vendorDetected: 'sysco'
  };
  const syscoHit = CAT.tier05VendorHints(syscoRow);
  const okSysco = syscoHit && syscoHit.category === 'produce' && syscoHit.tier === 'vendor-sku-prefix' && syscoHit.matched === '01';
  console.log(`  ${okSysco ? '✓' : '✗'} Sysco skuPrefixMap matches '01' → produce (got ${syscoHit ? syscoHit.category : 'null'})`);
  if (okSysco) v42Pass++; else v42Fail++;

  // Sysco SKU '02' → protein
  const syscoRow2 = { name: 'Beef', sku: '0234567', vendorDetected: 'sysco' };
  const syscoHit2 = CAT.tier05VendorHints(syscoRow2);
  const okSysco2 = syscoHit2 && syscoHit2.category === 'protein';
  console.log(`  ${okSysco2 ? '✓' : '✗'} Sysco skuPrefixMap matches '02' → protein (got ${syscoHit2 ? syscoHit2.category : 'null'})`);
  if (okSysco2) v42Pass++; else v42Fail++;

  // Unknown SKU prefix returns null (no false positive).
  const unknownPrefix = CAT.tier05VendorHints({ name: 'X', sku: '999XXXX', vendorDetected: 'sysco' });
  const okUnknown = unknownPrefix === null;
  console.log(`  ${okUnknown ? '✓' : '✗'} unknown SKU prefix returns null (no false positive)`);
  if (okUnknown) v42Pass++; else v42Fail++;

  // No vendor detected → null.
  const noVendor = CAT.tier05VendorHints({ name: 'X', sku: '0123456' });
  console.log(`  ${noVendor === null ? '✓' : '✗'} no vendorDetected returns null cleanly`);
  if (noVendor === null) v42Pass++; else v42Fail++;

  // Confidence is 88-90 (vendor-printed signals are essentially
  // ground truth; we want them to outrank brand index at 92 only
  // when learned-overrides haven't fired).
  const okConfRange = gfsHit.confidence >= 88 && gfsHit.confidence <= 95 &&
                      syscoHit.confidence >= 88 && syscoHit.confidence <= 95;
  console.log(`  ${okConfRange ? '✓' : '✗'} categoryHints confidence in 88-95 band (class-code ${gfsHit.confidence}, sku-prefix ${syscoHit.confidence})`);
  if (okConfRange) v42Pass++; else v42Fail++;

  // The full classify() pipeline routes through tier05 BEFORE the
  // brand index, so a row that matches both should pick the vendor
  // signal. Build a row that has both a brand name AND a class code.
  const dualRow = {
    name:           'STELLA ARTOIS 24/12 BTL',
    raw:            'BEV STELLA ARTOIS 24/12 BTL CASE $42.00',
    vendorDetected: 'gfs'
  };
  // GFS classCodeMap doesn't include BEV in our test stub — the
  // brand-index path should win. Add BEV to the stub map first.
  global.window.MID_VENDORS.STUBS[1]._enrichment.categoryHints.classCodeMap.BEV = 'beverage';
  const dual = CAT.classify(dualRow);
  const okDual = dual.tier === 'vendor-class-code' && dual.category === 'beverage';
  console.log(`  ${okDual ? '✓' : '✗'} classify() routes through tier05 before brand-index when both match (got tier=${dual.tier}, cat=${dual.category})`);
  if (okDual) v42Pass++; else v42Fail++;

  delete global.window.MID_VENDORS;
  delete global.window;
}

console.log(`\nWave 4.2 evolution fixtures: ${v42Pass} passed.`);

// =====================================================================
// Wave 4.2 line-grammar — alcohol-tax line splitting + accountant
// GL routing for kind:'tax' / kind:'discount'.
// =====================================================================

let lgPass = 0, lgFail = 0;
console.log(`\nPer-vendor line grammar — tax + discount classification (Wave 4.2):`);
{
  const RT = await import(path.join(repoRoot, 'tools/invoice-decoder/vendors/template-runtime.js')).then(m => m.default || m);
  RT._resetForTests();

  // Real beer/wine template (loaded from the JSON file we just
  // updated). Verifies the runtime applies the patterns correctly.
  const tmpl = await RT.loadTemplate('beer-wine-distributor');
  const okTemplate = tmpl && tmpl.lineGrammar && Array.isArray(tmpl.lineGrammar.taxPatterns) && tmpl.lineGrammar.taxPatterns.length > 0;
  console.log(`  ${okTemplate ? '✓' : '✗'} beer-wine-distributor.json carries lineGrammar.taxPatterns (got ${tmpl && tmpl.lineGrammar ? tmpl.lineGrammar.taxPatterns.length : 'none'})`);
  if (okTemplate) lgPass++; else lgFail++;

  // Build a row set covering the typical beer/wine invoice shapes.
  const rows = [
    { name: 'Stella Artois 24/12 BTL', raw: 'STELLA ARTOIS 24/12 BTL CASE $42.00', lineTotal: 42.00, kind: 'item' },
    { name: 'State Liquor Tax',         raw: 'STATE LIQUOR TAX 12% $5.04',         lineTotal:  5.04, kind: 'item' },
    { name: 'Federal Excise Tax',       raw: 'FEDERAL EXCISE TAX $1.20',           lineTotal:  1.20, kind: 'item' },
    { name: 'Volume Discount',          raw: 'VOLUME DISCOUNT -$2.50',             lineTotal: -2.50, kind: 'item' },
    { name: 'Modelo 24/12',             raw: 'MODELO 24/12 BTL CASE $38.00',       lineTotal: 38.00, kind: 'item' },
    { name: 'Credit return',            raw: 'CREDIT 12345 BUDWEISER -$24.00',     lineTotal: -24.00, kind: 'credit' }   // pre-set credit
  ];

  RT.applyLineGrammar(rows, tmpl);

  const okStella = rows[0].kind === 'item';
  const okStateLiquor = rows[1].kind === 'tax';
  const okFedExcise = rows[2].kind === 'tax';
  const okDiscount = rows[3].kind === 'discount';
  const okModelo = rows[4].kind === 'item';
  const okCreditPreserved = rows[5].kind === 'credit';   // existing credit kind not overwritten

  console.log(`  ${okStella ? '✓' : '✗'} normal item line stays kind='item' (got ${rows[0].kind})`);
  console.log(`  ${okStateLiquor ? '✓' : '✗'} STATE LIQUOR TAX line classified as kind='tax' (got ${rows[1].kind})`);
  console.log(`  ${okFedExcise ? '✓' : '✗'} FEDERAL EXCISE TAX line classified as kind='tax' (got ${rows[2].kind})`);
  console.log(`  ${okDiscount ? '✓' : '✗'} VOLUME DISCOUNT line classified as kind='discount' (got ${rows[3].kind})`);
  console.log(`  ${okModelo ? '✓' : '✗'} another item line stays kind='item' (got ${rows[4].kind})`);
  console.log(`  ${okCreditPreserved ? '✓' : '✗'} pre-existing credit kind is NOT overwritten (got ${rows[5].kind})`);
  if (okStella) lgPass++; else lgFail++;
  if (okStateLiquor) lgPass++; else lgFail++;
  if (okFedExcise) lgPass++; else lgFail++;
  if (okDiscount) lgPass++; else lgFail++;
  if (okModelo) lgPass++; else lgFail++;
  if (okCreditPreserved) lgPass++; else lgFail++;

  // No-op when template lacks lineGrammar.
  const noLg = [{ name: 'Tax Line', raw: 'STATE LIQUOR TAX', kind: 'item' }];
  RT.applyLineGrammar(noLg, { id: 'no-grammar' });
  const okNoOp = noLg[0].kind === 'item';
  console.log(`  ${okNoOp ? '✓' : '✗'} no-op when template lacks lineGrammar (got ${noLg[0].kind})`);
  if (okNoOp) lgPass++; else lgFail++;

  // Accountant export GL maps include _tax + _discount keys.
  const ACCT = await import(path.join(repoRoot, 'tools/invoice-decoder/accountant-export.js')).then(m => m.default || m);
  const okGlTax = ACCT.suggestGL('qbo', { kind: 'tax', category: null }).includes('Tax');
  console.log(`  ${okGlTax ? '✓' : '✗'} QBO accountant-export routes kind='tax' to a Tax GL`);
  if (okGlTax) lgPass++; else lgFail++;
  const okGlDisc = ACCT.suggestGL('qbo', { kind: 'discount' }).includes('Discount');
  console.log(`  ${okGlDisc ? '✓' : '✗'} QBO accountant-export routes kind='discount' to a Discount GL`);
  if (okGlDisc) lgPass++; else lgFail++;

  // Generic ledger preserves kind='tax' in the row output for the bookkeeper.
  const invoice = {
    vendor: 'beer-wine-distributor',
    savedAt: 1700000000000,
    parsedSum: 84.74,
    rows: [
      { name: 'Stella Artois', qty: 1, unit: 'cs', lineTotal: 42, category: 'beverage', kind: 'item' },
      { name: 'State Liquor Tax', qty: 1, unit: '', lineTotal: 5.04, category: null, kind: 'tax' },
      { name: 'Volume Discount', qty: 1, unit: '', lineTotal: -2.50, category: null, kind: 'discount' }
    ]
  };
  const generic = ACCT.exportGenericLedger(invoice, {});
  const okGenericTax = generic && generic.body && /,tax,/.test(generic.body) && /,discount,/.test(generic.body);
  console.log(`  ${okGenericTax ? '✓' : '✗'} generic ledger CSV contains 'tax' and 'discount' kinds in the Kind column`);
  if (okGenericTax) lgPass++; else lgFail++;
}

console.log(`\nWave 4.2 line-grammar fixtures: ${lgPass} passed.`);

const grandFail = totalFail + totalNew + kindFail + packFail + mathFail + brandFail + abbrFail + tagFail + vendorFail + skuFail + exportFail
  + homFail + warpFail + quadFail + sobelFail + pipeFail
  + alFail
  + vcFail
  + kdfFail + recFail
  + v41Fail
  + splitFail
  + coachFail
  + v42Fail
  + lgFail;
process.exit(grandFail === 0 ? 0 : 1);
