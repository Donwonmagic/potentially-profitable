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
  { text: 'FRESHPOINT\nProduce Order\n',                                expectVendor: 'freshpoint' }
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

const grandFail = totalFail + totalNew + kindFail + packFail + mathFail + brandFail + abbrFail + tagFail + vendorFail + skuFail + exportFail;
process.exit(grandFail === 0 ? 0 : 1);
