/**
 * Unit tests — tools/_shared/menu-renderers/jsonld.js
 * Run via:   node --test tools/_shared/menu-renderers/jsonld.test.mjs
 *
 * Coverage: schema.org Menu shape, dietary mapping (positive-only —
 * never emit "suitableForDiet" for a CONTAINS-allergen tag), price
 * parsing across formats, locale → inLanguage, validation warnings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SCHEMA = require('../menu-schema.js');
const JSONLD = require('./jsonld.js');

function buildMenuFromV2(v2) { return SCHEMA.migrate(v2); }

test('build: empty menu returns minimal Menu wrapper', () => {
  const m = SCHEMA.blankMenu();
  const j = JSONLD.build(m);
  assert.equal(j['@context'], 'https://schema.org');
  assert.equal(j['@type'], 'Menu');
  assert.equal(j.hasMenuSection, undefined, 'empty sections omits the field');
});

test('build: includeContext=false drops @context (for inline embedding inside another graph)', () => {
  const m = SCHEMA.blankMenu();
  const j = JSONLD.build(m, { includeContext: false });
  assert.equal(j['@context'], undefined);
  assert.equal(j['@type'], 'Menu');
});

test('build: full v2 draft round-trips into a valid Menu graph', () => {
  const m = buildMenuFromV2({
    rows: [
      { kind: 'section', name: 'Starters', blurb: 'A few small plates' },
      { kind: 'dish', name: 'Caesar', price: '12', desc: 'crisp', allergens: ['DF', 'V'] },
      { kind: 'dish', name: 'Soup',   price: '8' },
      { kind: 'section', name: 'Mains' },
      { kind: 'dish', name: 'Steak',  price: '$34.50', allergens: ['GF'], spice: 1 }
    ],
    theme: 'trattoria',
    meta: { businessName: 'Da Marco', tagline: 'Since 1992', locale: 'en' }
  });
  m.meta.currency = 'USD';
  const j = JSONLD.build(m, { url: 'https://damarco.example/menu/' });
  assert.equal(j.name, 'Da Marco');
  assert.equal(j.description, 'Since 1992');
  assert.equal(j.url, 'https://damarco.example/menu/');
  assert.equal(j.inLanguage, 'en');
  assert.equal(j.hasMenuSection.length, 2);
  // Section 1
  assert.equal(j.hasMenuSection[0]['@type'], 'MenuSection');
  assert.equal(j.hasMenuSection[0].name, 'Starters');
  assert.equal(j.hasMenuSection[0].description, 'A few small plates');
  assert.equal(j.hasMenuSection[0].hasMenuItem.length, 2);
  // Caesar item
  const caesar = j.hasMenuSection[0].hasMenuItem[0];
  assert.equal(caesar['@type'], 'MenuItem');
  assert.equal(caesar.name, 'Caesar');
  assert.equal(caesar.description, 'crisp');
  assert.equal(caesar.offers['@type'], 'Offer');
  assert.equal(caesar.offers.price, '12');
  assert.equal(caesar.offers.priceCurrency, 'USD');
  // Caesar tagged DF + V → suitableForDiet = LowLactose + Vegan
  assert.ok(Array.isArray(caesar.suitableForDiet) || typeof caesar.suitableForDiet === 'string');
  // Steak: $34.50 string with currency symbol → numeric "34.5"
  const steak = j.hasMenuSection[1].hasMenuItem[0];
  assert.equal(steak.offers.price, '34.5');
  // Steak tagged GF → suitableForDiet = GlutenFreeDiet
  assert.equal(steak.suitableForDiet, 'https://schema.org/GlutenFreeDiet');
});

test('validate(build(menu)) returns no warnings for a complete graph', () => {
  const m = buildMenuFromV2({
    rows: [
      { kind: 'section', name: 'A' },
      { kind: 'dish', name: 'a1', price: '10' }
    ]
  });
  const warnings = JSONLD.validate(JSONLD.build(m));
  assert.deepEqual(warnings, []);
});

test('validate flags @type drift', () => {
  const broken = { '@context': 'https://schema.org', '@type': 'NotAMenu' };
  const w = JSONLD.validate(broken);
  assert.ok(w.some(x => x.includes('@type must be "Menu"')));
});

// ============== Diet mapping (positive-only) ==============
test('dietsForDish maps V → VeganDiet', () => {
  const d = SCHEMA.blankDish({ allergens: ['V'] });
  assert.deepEqual(JSONLD._dietsForDish(d), ['https://schema.org/VeganDiet']);
});

test('dietsForDish maps GF → GlutenFreeDiet', () => {
  const d = SCHEMA.blankDish({ allergens: ['GF'] });
  assert.deepEqual(JSONLD._dietsForDish(d), ['https://schema.org/GlutenFreeDiet']);
});

test('dietsForDish maps DF → LowLactoseDiet (closest schema.org enum)', () => {
  const d = SCHEMA.blankDish({ allergens: ['DF'] });
  assert.deepEqual(JSONLD._dietsForDish(d), ['https://schema.org/LowLactoseDiet']);
});

test('dietsForDish does NOT emit a diet for CONTAINS-allergen tags', () => {
  // 'N' = contains tree nuts → must NOT generate a "suitable for nut diet"
  // (no such enum exists; doing so would be misleading).
  const d = SCHEMA.blankDish({ allergens: ['N', 'PE', 'SF', 'FI', 'E', 'SO', 'SE', 'MU', 'CE', 'LU', 'MO', 'SU'] });
  assert.deepEqual(JSONLD._dietsForDish(d), []);
});

test('dietsForDish maps dietary axis: halal, kosher, lowsodium', () => {
  assert.deepEqual(JSONLD._dietsForDish(SCHEMA.blankDish({ dietary: ['halal'] })),     ['https://schema.org/HalalDiet']);
  assert.deepEqual(JSONLD._dietsForDish(SCHEMA.blankDish({ dietary: ['kosher'] })),    ['https://schema.org/KosherDiet']);
  assert.deepEqual(JSONLD._dietsForDish(SCHEMA.blankDish({ dietary: ['lowsodium'] })), ['https://schema.org/LowSaltDiet']);
});

test('dietsForDish drops pescatarian and fodmap (no schema.org enum)', () => {
  const d = SCHEMA.blankDish({ dietary: ['pescatarian', 'fodmap'] });
  assert.deepEqual(JSONLD._dietsForDish(d), []);
});

test('dietsForDish de-dupes V + VG (operator tagged both)', () => {
  const d = SCHEMA.blankDish({ allergens: ['V', 'VG'] });
  const out = JSONLD._dietsForDish(d);
  assert.equal(new Set(out).size, out.length);
  assert.equal(out.length, 2, 'both retained — schema accepts arrays of diets');
});

// ============== Price parsing ==============
test('parsePrice handles plain numerics', () => {
  assert.equal(JSONLD._parsePrice('12'), '12');
  assert.equal(JSONLD._parsePrice(12), '12');
  assert.equal(JSONLD._parsePrice('12.5'), '12.5');
  assert.equal(JSONLD._parsePrice('12.50'), '12.5');
});

test('parsePrice strips currency symbols', () => {
  assert.equal(JSONLD._parsePrice('$12'), '12');
  assert.equal(JSONLD._parsePrice('$12.50'), '12.5');
  assert.equal(JSONLD._parsePrice('£8'), '8');
  assert.equal(JSONLD._parsePrice('CHF 24'), '24');
});

test('parsePrice handles European comma-decimals', () => {
  assert.equal(JSONLD._parsePrice('8,50'), '8.5');
  assert.equal(JSONLD._parsePrice('€8,50'), '8.5');
});

test('parsePrice handles thousands separators', () => {
  assert.equal(JSONLD._parsePrice('1,200'), '1200');
  assert.equal(JSONLD._parsePrice('1,200.50'), '1200.5');
});

test('parsePrice returns null on un-parseable input', () => {
  assert.equal(JSONLD._parsePrice(''), null);
  assert.equal(JSONLD._parsePrice(null), null);
  assert.equal(JSONLD._parsePrice(undefined), null);
  assert.equal(JSONLD._parsePrice('Market Price'), null);
});

test('build: dish without price omits offers', () => {
  const m = buildMenuFromV2({
    rows: [
      { kind: 'section', name: 'X' },
      { kind: 'dish', name: 'Market Catch', price: 'Market Price' }
    ]
  });
  const item = JSONLD.build(m).hasMenuSection[0].hasMenuItem[0];
  assert.equal(item.offers, undefined);
  // Better to omit than emit a bogus offers block (would harm SEO).
});

// ============== Currency + locale ==============
test('build respects menu.meta.currency', () => {
  const m = SCHEMA.blankMenu();
  m.meta.currency = 'EUR';
  m.sections.push(SCHEMA.blankSection({ name: 'X', position: 0 }));
  m.dishes.push(SCHEMA.blankDish({ sectionId: m.sections[0].id, name: 'D', price: '10' }));
  const item = JSONLD.build(m).hasMenuSection[0].hasMenuItem[0];
  assert.equal(item.offers.priceCurrency, 'EUR');
});

test('build emits inLanguage from locale', () => {
  const en = SCHEMA.blankMenu(); en.meta.locale = 'en';
  const es = SCHEMA.blankMenu(); es.meta.locale = 'es';
  assert.equal(JSONLD.build(en).inLanguage, 'en');
  assert.equal(JSONLD.build(es).inLanguage, 'es');
});

// ============== Nutrition ==============
test('build emits NutritionInformation when calories present', () => {
  const m = SCHEMA.blankMenu();
  m.sections.push(SCHEMA.blankSection({ name: 'X', position: 0 }));
  m.dishes.push(SCHEMA.blankDish({ sectionId: m.sections[0].id, name: 'D', price: '10', calories: '450' }));
  const item = JSONLD.build(m).hasMenuSection[0].hasMenuItem[0];
  assert.equal(item.nutrition['@type'], 'NutritionInformation');
  assert.equal(item.nutrition.calories, '450 calories');
});

test('build omits nutrition when calories missing or non-numeric', () => {
  const m = SCHEMA.blankMenu();
  m.sections.push(SCHEMA.blankSection({ name: 'X', position: 0 }));
  m.dishes.push(SCHEMA.blankDish({ sectionId: m.sections[0].id, name: 'D', price: '10', calories: 'lots' }));
  const item = JSONLD.build(m).hasMenuSection[0].hasMenuItem[0];
  assert.equal(item.nutrition, undefined);
});

// ============== Output formats ==============
test('emitInline returns valid JSON parseable back into the same graph', () => {
  const m = buildMenuFromV2({ rows: [{ kind: 'section', name: 'X' }, { kind: 'dish', name: 'D', price: '5' }] });
  const json = JSONLD.emitInline(m);
  const parsed = JSON.parse(json);
  assert.equal(parsed['@type'], 'Menu');
});

test('emitScriptTag wraps in a script tag', () => {
  const m = SCHEMA.blankMenu();
  const tag = JSONLD.emitScriptTag(m);
  assert.match(tag, /^<script type="application\/ld\+json">/);
  assert.match(tag, /<\/script>$/);
});

test('section + dish ordering follows position', () => {
  const m = SCHEMA.blankMenu();
  // Add sections out of order; emitter must sort.
  const s1 = SCHEMA.blankSection({ name: 'B', position: 1 });
  const s0 = SCHEMA.blankSection({ name: 'A', position: 0 });
  m.sections.push(s1, s0);
  m.dishes.push(SCHEMA.blankDish({ sectionId: s1.id, name: 'b1', position: 1 }));
  m.dishes.push(SCHEMA.blankDish({ sectionId: s1.id, name: 'b0', position: 0 }));
  m.dishes.push(SCHEMA.blankDish({ sectionId: s0.id, name: 'a0', position: 0 }));
  const j = JSONLD.build(m);
  assert.equal(j.hasMenuSection[0].name, 'A', 'sections sorted by position');
  assert.equal(j.hasMenuSection[1].name, 'B');
  assert.equal(j.hasMenuSection[1].hasMenuItem[0].name, 'b0', 'dishes sorted by position');
  assert.equal(j.hasMenuSection[1].hasMenuItem[1].name, 'b1');
});
