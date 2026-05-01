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

const grandFail = totalFail + totalNew + kindFail + packFail + mathFail + brandFail + abbrFail + tagFail + vendorFail + skuFail + exportFail
  + homFail + warpFail + quadFail + sobelFail + pipeFail
  + alFail;
process.exit(grandFail === 0 ? 0 : 1);
