/**
 * Unit tests — tools/_shared/menu-renderers/studio-brief.js
 * Run via:   node --test tools/_shared/menu-renderers/studio-brief.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SCHEMA = require('../menu-schema.js');
const BRIEF = require('./studio-brief.js');

function seed() {
  return SCHEMA.migrate({
    rows: [
      { kind: 'section', name: 'Antipasti', blurb: 'Few small plates' },
      { kind: 'dish', name: 'Bruschetta', price: '8',  desc: 'house bread', allergens: ['DF', 'V'] },
      { kind: 'dish', name: 'Caprese',    price: '11', desc: 'mozzarella + tomato', allergens: ['VG'] },
      { kind: 'section', name: 'Pasta' },
      { kind: 'dish', name: 'Carbonara',  price: '18', allergens: ['E', 'GF'], badges: ['popular'] },
      { kind: 'dish', name: 'Cacio',      price: '16' }
    ],
    theme: 'trattoria',
    meta: { businessName: 'Da Marco', cuisine: 'italian', tagline: 'Since 1992', locale: 'en' },
    customize: { paper: '#fff', accent: '#9c2e3b', mods: { season: 'autumn' } }
  });
}

// ============== summarize ==============
test('summarize: counts roll up correctly', () => {
  const s = BRIEF.summarize(seed());
  assert.equal(s.counts.sections, 2);
  assert.equal(s.counts.dishes, 4);
  assert.ok(s.counts.allergens >= 4);
});

test('summarize: business block carries meta verbatim', () => {
  const s = BRIEF.summarize(seed());
  assert.equal(s.business.name, 'Da Marco');
  assert.equal(s.business.tagline, 'Since 1992');
  assert.equal(s.business.cuisine, 'italian');
  assert.equal(s.business.locale, 'en');
  assert.equal(s.business.allergenRegime, 'us-fda9');
});

test('summarize: priceRange aggregates correctly', () => {
  const s = BRIEF.summarize(seed());
  assert.equal(s.priceRange.min, 8);
  assert.equal(s.priceRange.max, 18);
  assert.equal(s.priceRange.count, 4);
});

test('summarize: per-section roll-ups (dish counts + price ranges)', () => {
  const s = BRIEF.summarize(seed());
  const antipasti = s.sections.find(x => x.name === 'Antipasti');
  const pasta = s.sections.find(x => x.name === 'Pasta');
  assert.equal(antipasti.dishCount, 2);
  assert.equal(pasta.dishCount, 2);
  assert.equal(antipasti.priceRange.min, 8);
  assert.equal(pasta.priceRange.min, 16);
});

test('summarize: allergensUsed and dietaryUsed are deduped', () => {
  const s = BRIEF.summarize(seed());
  assert.equal(new Set(s.allergensUsed).size, s.allergensUsed.length);
  // V, DF, VG, E, GF expected
  ['V', 'DF', 'VG', 'E', 'GF'].forEach(c => {
    assert.ok(s.allergensUsed.includes(c), 'expected allergen ' + c);
  });
});

test('summarize: theme block carries id, accent, paper, mods', () => {
  const s = BRIEF.summarize(seed());
  assert.equal(s.theme.id, 'trattoria');
  assert.equal(s.theme.accent, '#9c2e3b');
  assert.equal(s.theme.mods.season, 'autumn');
});

test('summarize: handles a totally blank menu', () => {
  const s = BRIEF.summarize(SCHEMA.blankMenu());
  assert.equal(s.counts.dishes, 0);
  assert.equal(s.priceRange, null);
  assert.deepEqual(s.allergensUsed, []);
});

// ============== Cross-tool diagnostics ==============
test('summarize: foodCost diagnostic rolls up when sister-tool data present', () => {
  const m = seed();
  // Inject menu-engineering data on two of four dishes.
  m.dishes[0].foodCost = 2.4;   // Bruschetta $8
  m.dishes[2].foodCost = 5.4;   // Carbonara $18
  const s = BRIEF.summarize(m);
  assert.ok(s.diagnostics.foodCost);
  assert.equal(s.diagnostics.foodCost.dishCount, 2);
  assert.equal(s.diagnostics.foodCost.coverage, 0.5);
  // (2.4/8 + 5.4/18) / 2 = (0.30 + 0.30) / 2 = 0.30
  assert.ok(Math.abs(s.diagnostics.foodCost.avgRatio - 0.30) < 0.001);
});

test('summarize: copyDiagnostic rolls up when present', () => {
  const m = seed();
  m.dishes[0].copyDiagnostic = { score: 80 };
  m.dishes[1].copyDiagnostic = { score: 60 };
  const s = BRIEF.summarize(m);
  assert.ok(s.diagnostics.copy);
  assert.equal(s.diagnostics.copy.dishCount, 2);
  assert.equal(s.diagnostics.copy.avgScore, 70);
});

test('summarize: omits cross-tool diagnostics when absent', () => {
  const s = BRIEF.summarize(seed());
  assert.equal(s.diagnostics.foodCost, null);
  assert.equal(s.diagnostics.copy, null);
});

// ============== Markdown output ==============
test('toMarkdown produces a non-empty brief with key sections', () => {
  const md = BRIEF.toMarkdown(seed());
  assert.match(md, /Studio brief/);
  assert.match(md, /Da Marco/);
  assert.match(md, /At a glance/);
  assert.match(md, /Sections:/);
  assert.match(md, /Antipasti/);
  assert.match(md, /Pasta/);
  assert.match(md, /Theme \+ brand/);
  assert.match(md, /trattoria/);
  assert.match(md, /Allergen \+ dietary/);
  assert.match(md, /Provenance/);
});

test('toMarkdown surfaces foodCost diagnostic when present', () => {
  const m = seed();
  m.dishes[0].foodCost = 2.4;
  m.dishes[2].foodCost = 5.4;
  const md = BRIEF.toMarkdown(m);
  assert.match(md, /Profitability/);
  assert.match(md, /food-cost ratio/);
});

test('toMarkdown handles a blank menu without crashing', () => {
  const md = BRIEF.toMarkdown(SCHEMA.blankMenu());
  assert.match(md, /Studio brief/);
});

test('toMarkdown uses correct currency symbol per meta.currency', () => {
  const m = seed();
  m.meta.currency = 'EUR';
  const md = BRIEF.toMarkdown(m);
  assert.match(md, /€8\.00/);
  assert.match(md, /€18\.00/);
});

// ============== URL-fragment transport ==============
test('toUrlFragment / fromUrlFragment round-trip', () => {
  const m = seed();
  const frag = BRIEF.toUrlFragment(m);
  // base64url contains only [A-Za-z0-9_-]
  assert.match(frag, /^[A-Za-z0-9_-]+$/);
  const decoded = BRIEF.fromUrlFragment(frag);
  assert.equal(decoded.business.name, 'Da Marco');
  assert.equal(decoded.counts.dishes, 4);
  assert.equal(decoded.theme.id, 'trattoria');
});

test('fromUrlFragment returns null on bogus input', () => {
  assert.equal(BRIEF.fromUrlFragment('not!base64!url'), null);
  assert.equal(BRIEF.fromUrlFragment(''), null);
});

test('toUrlFragment produces the same shape every call (modulo timestamp)', () => {
  const m = seed();
  const a = BRIEF.fromUrlFragment(BRIEF.toUrlFragment(m));
  const b = BRIEF.fromUrlFragment(BRIEF.toUrlFragment(m));
  // Strip timestamp before deep-equal
  delete a.generatedAt; delete b.generatedAt;
  delete a.source;      delete b.source;
  assert.deepEqual(a, b);
});

test('URL fragment stays under 8KB for a 50-dish menu (typical mailto: limit)', () => {
  // Build a 50-dish menu with realistic content.
  const m = SCHEMA.blankMenu();
  m.meta.businessName = 'A Big Place';
  for (let i = 0; i < 5; i++) {
    const sec = SCHEMA.blankSection({ name: 'Section ' + (i + 1), position: i });
    m.sections.push(sec);
    for (let j = 0; j < 10; j++) {
      m.dishes.push(SCHEMA.blankDish({
        sectionId: sec.id,
        position: j,
        name: 'Dish ' + (i + 1) + '.' + (j + 1),
        desc: 'A medium-length sensory description of the dish, with provenance.',
        price: String(8 + j * 3),
        allergens: ['DF', 'GF']
      }));
    }
  }
  const frag = BRIEF.toUrlFragment(m);
  assert.ok(frag.length < 8192, 'fragment was ' + frag.length + ' bytes');
});

// ============== priceRange helper edge cases ==============
test('_priceRange handles non-numeric prices', () => {
  const dishes = [{ price: '12' }, { price: 'Market Price' }, { price: '18' }];
  const pr = BRIEF._priceRange(dishes);
  assert.equal(pr.count, 2);
  assert.equal(pr.min, 12);
  assert.equal(pr.max, 18);
});

test('_priceRange returns null when no numeric prices', () => {
  const dishes = [{ price: 'TBD' }, { price: '' }];
  assert.equal(BRIEF._priceRange(dishes), null);
});
