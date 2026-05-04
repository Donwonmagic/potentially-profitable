#!/usr/bin/env node
// Pattern atlas — cross-family fixture suite.
//
// Synthesises representative invoices for each family in the atlas
// and validates:
//   - family-classifier picks the correct family (no operator data)
//   - invoice-grammar parses representative line shapes per family
//   - parse.js routes through both modules without breaking
//   - universal OCR confusion atlas catches canonical errors from
//     invoice #1 (no operator dictionary)
//
// Run: `node scripts/test-pattern-atlas.mjs`

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const F = require('../tools/invoice-decoder/family-classifier.js');
const G = require('../tools/invoice-decoder/invoice-grammar.js');
const B = require('../tools/invoice-decoder/user-words-bias.js');
const P = require('../tools/invoice-decoder/parse.js');

let failures = 0;
function assert(label, cond, detail) {
  if (cond) {
    console.log('  ✓ ' + label);
  } else {
    failures++;
    console.error('  ✗ ' + label + (detail ? ': ' + detail : ''));
  }
}

// ---------------------------------------------------------------
// Family classification (synthetic invoice headers)
// ---------------------------------------------------------------
console.log('\nFamily classifier — 9 family fixtures:');
{
  const fixtures = [
    { fam: 'broadliner', text: 'CUSTOMER NUMBER 8842910 PURCHASE ORDER 12345 INVOICE NO 4451821 SHIP TO 100 MAIN ST FUEL SURCHARGE $4.50 4/1GAL OLIVE OIL 6X10LB CHICKEN SUBTOTAL $312.40' },
    { fam: 'paper-goods', text: 'IMPERIAL DADE INVOICE NO 442  janitorial supplies  paper towel 24CT  trash liner 200CT  cleaning chemicals' },
    { fam: 'beverage', text: 'INVOICE  STELLA ARTOIS 24/12 BTL  CRV deposit per bottle  excise tax  ABV 5.5%  alcohol tax' },
    { fam: 'dairy-dsd', text: 'DELIVERY SLIP  Driver number 12  4/1GA whole milk  6/1GA half and half  CREDIT empty bottles -3.00' },
    { fam: 'thermal-receipt', text: 'COSTCO BUSINESS CENTER  member number 5594129  cashier 12  register 4  TAX 8.875A  thank you' },
    { fam: 'produce-jobber', text: 'BALDOR SPECIALTY FOODS  romaine 24CT lettuce  5LB AVG catch weight  tomato heirloom  pack weight' },
    { fam: 'asian-wholesale', text: 'H MART  bok choy soy sauce  miso paste  김치 쌀 tofu  bean sprouts' },
    { fam: 'mexican-wholesale', text: 'FACTURA  RFC ABCD123456  IVA 16% subtotal  importe descuento 5%  carne de res leche queso pesos M.N.' },
    { fam: 'handwritten', text: 'farmers market  CSA  tomato 5 LB $25  sweet corn 12 ct $18' }
  ];
  fixtures.forEach(f => {
    const r = F.classifyFamily(f.text, { lineCount: 30 });
    assert(`fixture ${f.fam.padEnd(20)} routes correctly (got ${r.family}, conf ${r.confidence.toFixed(2)})`, r.family === f.fam);
  });
}

// ---------------------------------------------------------------
// Pack notation — exhaustive coverage
// ---------------------------------------------------------------
console.log('\nInvoice grammar — pack notation atlas:');
{
  const cases = [
    { input: '4/1GAL',      expect: { count:4, perUnit:1,    baseUnit:'GAL',     totalQuantity:4 } },
    { input: '6X10LB',      expect: { count:6, perUnit:10,   baseUnit:'LB',      totalQuantity:60 } },
    { input: '24CT',        expect: { count:24, perUnit:1,   baseUnit:'CT',      totalQuantity:24 } },
    { input: '12X750ML',    expect: { count:12, perUnit:750, baseUnit:'ML',      totalQuantity:9000 } },
    { input: '1/2GAL',      expect: { count:1, perUnit:0.5,  baseUnit:'GAL',     totalQuantity:0.5 } },
    { input: '1/4LB',       expect: { count:1, perUnit:0.25, baseUnit:'LB',      totalQuantity:0.25 } },
    { input: '5LB AVG',     expect: { count:1, perUnit:5,    baseUnit:'LB',      totalQuantity:5, avg:true } },
    { input: '6/#10',       expect: { count:6, perUnit:1,    baseUnit:'#10CAN',  totalQuantity:6 } },
    { input: 'EACH',        expect: { count:1, perUnit:1,    baseUnit:'EA',      totalQuantity:1 } },
    { input: '2/CASE',      expect: { count:2, perUnit:1,    baseUnit:'CASE',    totalQuantity:2 } }
  ];
  cases.forEach(c => {
    const r = G.parsePack(c.input);
    if (!r) { failures++; console.error('  ✗ pack ' + c.input + ' returned null'); return; }
    let ok = true;
    Object.keys(c.expect).forEach(k => {
      if (r[k] !== c.expect[k]) { ok = false; }
    });
    assert(`pack ${c.input.padEnd(12)} → c=${r.count} p=${r.perUnit} u=${r.baseUnit} t=${r.totalQuantity}`, ok);
  });
}

// ---------------------------------------------------------------
// Line shapes — four canonical layouts
// ---------------------------------------------------------------
console.log('\nInvoice grammar — line shape atlas:');
{
  const cases = [
    { input: '6741034 ROMAINE HEARTS 24CT  2 CS  $24.00  $48.00', shape: 'canonical-broadliner', qty:2, lineTotal:48 },
    { input: 'OLIVE OIL 1 EA  $28.00  $28.00',                    shape: 'broadliner-no-sku',    qty:1, lineTotal:28 },
    { input: 'ROMAINE 2CT $48.00',                                shape: 'compact',              qty:2, lineTotal:96 },
    { input: 'GROUND CHUCK $58.00',                               shape: 'receipt-flat',         qty:1, lineTotal:58 }
  ];
  cases.forEach(c => {
    const r = G.parseLineShape(c.input);
    if (!r) { failures++; console.error('  ✗ shape "' + c.input + '" returned null'); return; }
    assert(`shape ${c.shape.padEnd(22)} matches "${c.input.slice(0, 30)}…"`, r.shape === c.shape && r.qty === c.qty && r.lineTotal === c.lineTotal);
  });
}

// ---------------------------------------------------------------
// Kind classifier — universal patterns
// ---------------------------------------------------------------
console.log('\nInvoice grammar — kind classifier:');
{
  const cases = [
    ['SUBTOTAL: $312.40',      'subtotal'],
    ['TOTAL: $345.00',         'total'],
    ['SALES TAX: $28.00',      'tax'],
    ['IVA 16% $48.00',         'tax'],
    ['CRV $0.05',              'tax'],
    ['FUEL SURCHARGE: $4.50',  'surcharge'],
    ['DELIVERY CHARGE: $25.00', 'surcharge'],
    ['BOTTLE DEPOSIT: $0.50',  'deposit'],
    ['MEMBER DISCOUNT: -$5.00', 'discount'],
    ['CR -8.00',               'credit'],
    ['BACKORDER',              'backorder'],
    ['SUB ALTERNATE SKU',      'substitution'],
    ['BNLS THIGH 5LB',         'item'],
    ['random text',            'item']
  ];
  cases.forEach(([input, expected]) => {
    const got = G.classifyKind(input);
    assert(`kind "${input.slice(0, 30).padEnd(30)}" → ${expected}`, got === expected, `got ${got}`);
  });
}

// ---------------------------------------------------------------
// Math reconciliation grammar
// ---------------------------------------------------------------
console.log('\nInvoice grammar — math reconciliation grammars:');
{
  const expected = {
    'broadliner':        ['subtotal','discount','surcharge','tax','total'],
    'beverage':          ['subtotal','crv','tax','deposit','total'],
    'mexican-wholesale': ['subtotal','discount','iva','total'],
    'thermal-receipt':   ['subtotal','tax','total']
  };
  Object.keys(expected).forEach(fam => {
    const g = G.mathGrammarFor(fam);
    assert(`math grammar ${fam.padEnd(20)} sequence matches`, JSON.stringify(g.sequence) === JSON.stringify(expected[fam]));
  });
}

// ---------------------------------------------------------------
// Universal OCR confusion baseline (no operator dict needed)
// ---------------------------------------------------------------
console.log('\nUniversal OCR confusion atlas (fires from invoice #1):');
{
  const cases = [
    { input: '8NLS',     expected: 'BNLS'    },   // 8→B
    { input: 'R0MAINE',  expected: 'ROMAINE' },   // 0→O
    { input: '5KLS',     expected: 'SKLS'    },   // 5→S
    { input: 'GR0UND',   expected: 'GROUND'  },   // 0→O
    { input: 'B0NELESS', expected: 'BONELESS' },  // 0→O
    { input: 'CHE3SE',   expected: 'CHE3SE'  }    // 3 not in atlas; unchanged
  ];
  cases.forEach(c => {
    const w = [{ text: c.input, confidence: 55 }];
    B.applyUniversalConfusions(w);
    assert(`universal: ${c.input.padEnd(10)} → ${c.expected}`, w[0].text === c.expected, `got ${w[0].text}`);
  });

  // Conf ≥ 70 should be untouched.
  const high = [{ text: '8NLS', confidence: 80 }];
  B.applyUniversalConfusions(high);
  assert('high-confidence (>=70) tokens are not rewritten', high[0].text === '8NLS');

  // Digit-dominant tokens should be untouched.
  const digit = [{ text: '$48.00', confidence: 55 }];
  B.applyUniversalConfusions(digit);
  assert('digit-dominant tokens are not rewritten', digit[0].text === '$48.00');
}

// ---------------------------------------------------------------
// End-to-end: parse.js delegates correctly per family
// ---------------------------------------------------------------
console.log('\nEnd-to-end: parse.js delegates to family + grammar:');
{
  const fixtures = [
    {
      name: 'broadliner-sysco-shaped',
      family: 'broadliner',
      lines: [
        '6741034 ROMAINE HEARTS 24CT  2 CS  $24.00  $48.00',
        '4451221 GROUND CHUCK 80/20 10LB  2 CS  $29.00  $58.00',
        'FUEL SURCHARGE  $4.50',
        'SUBTOTAL $106.00',
        'SALES TAX $8.85',
        'TOTAL $119.35'
      ],
      header: 'SYSCO INVOICE  CUSTOMER NUMBER 8842910 PURCHASE ORDER 12345 SHIP TO'
    },
    {
      name: 'mexican-wholesale-bilingual',
      family: 'mexican-wholesale',
      lines: [
        'CARNE DE RES 1KG  $250.00',
        'LECHE 1L  4 EA  $25.00  $100.00',
        'SUBTOTAL: $350.00',
        'DESCUENTO 5% -$17.50',
        'IVA 16% $53.20',
        'TOTAL: $385.70'
      ],
      header: 'FACTURA RFC ABCD123 importe pesos M.N. M.N.'
    },
    {
      name: 'beverage-distributor',
      family: 'beverage',
      lines: [
        'STELLA ARTOIS 24/12 BTL  $42.00',
        'CRV $1.20',
        'BOTTLE DEPOSIT $4.80',
        'EXCISE TAX $5.50',
        'TOTAL $53.50'
      ],
      header: 'BEER WINE DISTRIBUTOR INVOICE  ABV 5%  alcohol tax  varietal'
    }
  ];
  fixtures.forEach(f => {
    const fullText = f.header + '\n' + f.lines.join('\n');
    const lines = f.lines.map(t => ({ text: t, confidence: 90 }));
    const parsed = P.parseLines(lines, fullText);
    assert(`${f.name.padEnd(35)} family=${f.family}`, parsed.family === f.family, `got ${parsed.family}`);
    assert(`${f.name.padEnd(35)} mathValidation present`, parsed.mathValidation !== null);
    assert(`${f.name.padEnd(35)} familyHints carries currency`, !!(parsed.familyHints && parsed.familyHints.currency));
  });
}

// ---------------------------------------------------------------
console.log('\n' + (failures === 0 ? '✓ All pattern-atlas tests passed.' : '✗ ' + failures + ' failure(s).'));
process.exit(failures === 0 ? 0 : 1);
