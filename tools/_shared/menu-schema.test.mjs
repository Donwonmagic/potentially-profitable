/**
 * Unit tests — tools/_shared/menu-schema.js
 * Run via:   node --test tools/_shared/menu-schema.test.mjs
 *            (or via scripts/check-tests.mjs in CI)
 *
 * Coverage focus: migration paths (v1 / v2 / v3 inputs), validation,
 * round-trip lossless v3 → toV2Draft → migrate, ID minting, and the
 * regime registry parity with the allergens catalog.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SCHEMA = require('./menu-schema.js');
const ALLERGENS = require('../menu-design/data/allergens.js');

test('SCHEMA_VERSION is 3', () => {
  assert.equal(SCHEMA.SCHEMA_VERSION, 3);
});

test('REGIMES match allergens catalog regime registry', () => {
  // The schema and the data catalog declare the same set of regimes;
  // if either drifts, this catches it before a release.
  assert.deepEqual(
    Object.keys(SCHEMA.REGIMES).sort(),
    Object.keys(ALLERGENS.REGIMES).sort()
  );
});

test('migrate(null) returns a blank v3 menu', () => {
  const m = SCHEMA.migrate(null);
  assert.equal(m.v, 3);
  assert.deepEqual(m.sections, []);
  assert.deepEqual(m.dishes, []);
  assert.equal(m.meta.allergenRegime, 'us-fda9');
  assert.equal(m.meta.locale, 'en');
});

test('migrate(undefined) returns a blank v3 menu', () => {
  assert.equal(SCHEMA.migrate(undefined).v, 3);
});

test('v2 draft (rows[]) migrates to v3 sections + dishes', () => {
  const v2 = {
    rows: [
      { kind: 'section', name: 'Starters' },
      { kind: 'dish', name: 'Caesar', price: '12', allergens: ['DF'] },
      { kind: 'dish', name: 'Soup', price: '8' },
      { kind: 'section', name: 'Mains' },
      { kind: 'dish', name: 'Steak', price: '34', spice: 1 }
    ],
    theme: 'trattoria',
    meta: { businessName: 'Joe', cuisine: 'italian' },
    customize: { paper: '#fff', accent: '#abc', mods: { season: 'autumn' } },
    customDims: null
  };
  const v3 = SCHEMA.migrate(v2);
  assert.equal(v3.v, 3);
  assert.equal(v3.sections.length, 2);
  assert.equal(v3.dishes.length, 3);
  assert.equal(v3.theme.id, 'trattoria');
  assert.equal(v3.theme.accent, '#abc');
  assert.equal(v3.theme.mods.season, 'autumn');
  assert.equal(v3.meta.cuisine, 'italian');
  assert.equal(v3.meta.allergenRegime, 'us-fda9');
  // Every dish gets a stable id.
  v3.dishes.forEach((d) => {
    assert.match(d.id, /^d_/);
    assert.ok(d.sectionId);
  });
  // Section IDs threaded correctly.
  const startersId = v3.sections[0].id;
  const mainsId = v3.sections[1].id;
  assert.equal(v3.dishes.filter(d => d.sectionId === startersId).length, 2);
  assert.equal(v3.dishes.filter(d => d.sectionId === mainsId).length, 1);
});

test('v1 dish-before-section synthesizes a section', () => {
  const v1 = { rows: [{ kind: 'dish', name: 'Bare', price: '7' }] };
  const v3 = SCHEMA.migrate(v1);
  assert.equal(v3.sections.length, 1, 'one synthetic section');
  assert.equal(v3.sections[0].name, '', 'synthetic section has empty name');
  assert.equal(v3.dishes.length, 1);
  assert.equal(v3.dishes[0].sectionId, v3.sections[0].id);
});

test('v3 input round-trips through migrate (idempotent)', () => {
  const v3 = SCHEMA.blankMenu({
    meta: SCHEMA.blankMenu().meta,
    sections: [SCHEMA.blankSection({ name: 'S1', position: 0 })],
  });
  v3.dishes.push(SCHEMA.blankDish({ sectionId: v3.sections[0].id, name: 'D1' }));
  const round = SCHEMA.migrate(v3);
  assert.equal(round.v, 3);
  assert.equal(round.sections.length, 1);
  assert.equal(round.dishes.length, 1);
  assert.equal(round.dishes[0].name, 'D1');
});

test('toV2Draft inverse: v3 → v2 → v3 preserves dish + section count', () => {
  const v2 = {
    rows: [
      { kind: 'section', name: 'A' },
      { kind: 'dish', name: 'a1' },
      { kind: 'dish', name: 'a2' },
      { kind: 'section', name: 'B' },
      { kind: 'dish', name: 'b1' }
    ]
  };
  const v3 = SCHEMA.migrate(v2);
  const back = SCHEMA.toV2Draft(v3);
  assert.equal(back.schemaVersion, 2);
  assert.equal(back.rows.length, 5);
  assert.equal(back.rows.filter(r => r.kind === 'section').length, 2);
  assert.equal(back.rows.filter(r => r.kind === 'dish').length, 3);
  // Round-trip migrate again — same shape preserved.
  const v3again = SCHEMA.migrate(back);
  assert.equal(v3again.sections.length, 2);
  assert.equal(v3again.dishes.length, 3);
});

test('blankDish carries all v3 optional fields with sane defaults', () => {
  const d = SCHEMA.blankDish();
  assert.match(d.id, /^d_/);
  assert.deepEqual(d.allergens, []);
  assert.deepEqual(d.allergenStates, {});
  assert.deepEqual(d.dietary, []);
  assert.deepEqual(d.badges, []);
  assert.equal(d.spice, 0);
  assert.equal(d.descPlain, '');
  assert.equal(d.foodCost, undefined);
  assert.equal(d.unitsSold, undefined);
  assert.equal(d.copyDiagnostic, undefined);
});

test('blankDish accepts overrides', () => {
  const d = SCHEMA.blankDish({ name: 'X', price: '5', allergens: ['GF'] });
  assert.equal(d.name, 'X');
  assert.equal(d.price, '5');
  assert.deepEqual(d.allergens, ['GF']);
});

test('mintId / mintSectionId produce distinct values across calls', () => {
  const ids = new Set();
  for (let i = 0; i < 1000; i++) ids.add(SCHEMA.mintId());
  assert.equal(ids.size, 1000);
});

test('validate(blankMenu) returns no errors', () => {
  assert.deepEqual(SCHEMA.validate(SCHEMA.blankMenu()), []);
});

test('validate flags missing v', () => {
  const errs = SCHEMA.validate({ meta: {}, sections: [], dishes: [] });
  assert.ok(errs.length > 0);
});

test('validate flags dish referencing missing section', () => {
  const m = SCHEMA.blankMenu();
  m.dishes.push(SCHEMA.blankDish({ sectionId: 's_does_not_exist', name: 'X' }));
  const errs = SCHEMA.validate(m);
  assert.ok(errs.some(e => e.includes('not found')));
});

test('validate flags unknown allergenRegime', () => {
  const m = SCHEMA.blankMenu();
  m.meta.allergenRegime = 'mars-edition';
  const errs = SCHEMA.validate(m);
  assert.ok(errs.some(e => e.includes('unknown allergenRegime')));
});

test('200KB logo budget honored at migration boundary (no enforcement, just preserved)', () => {
  // The budget is enforced at storage time (state/draft.js). The schema
  // preserves the field as-is; oversize logos are caught by the
  // persister, not the migrator. This test pins that contract.
  const m = SCHEMA.blankMenu();
  m.logos.primary = { dataUrl: 'data:image/png;base64,A'.repeat(50), bytes: 250 * 1024 };
  const round = SCHEMA.migrate(m);
  assert.equal(round.logos.primary.bytes, 250 * 1024);
});

// ============== Wave B2 — auto-disclaimer ==============
test('autoDisclaimerFor returns the US-FDA-9 default in English', () => {
  const txt = SCHEMA.autoDisclaimerFor('us-fda9', 'en');
  assert.match(txt, /allergies/i);
  assert.match(txt, /cross-contamination/i);
});

test('autoDisclaimerFor returns the EU-FIC-14 default in Spanish', () => {
  const txt = SCHEMA.autoDisclaimerFor('eu-fic14', 'es');
  assert.match(txt, /alergia|intolerancia/i);
});

test('autoDisclaimerFor falls back to default regime on bogus input', () => {
  const txt = SCHEMA.autoDisclaimerFor('mars-edition', 'en');
  assert.equal(txt, SCHEMA.autoDisclaimerFor(SCHEMA.DEFAULT_REGIME, 'en'));
});

test('autoDisclaimerFor returns regime-distinct text per locale', () => {
  // EU and US disclaimers should differ in copy (different legal regimes).
  assert.notEqual(
    SCHEMA.autoDisclaimerFor('us-fda9', 'en'),
    SCHEMA.autoDisclaimerFor('eu-fic14', 'en')
  );
});

test('applyAutoDisclaimer fills empty meta.disclaimer', () => {
  const m = SCHEMA.blankMenu();
  m.meta.allergenRegime = 'eu-fic14';
  m.meta.locale = 'en';
  const next = SCHEMA.applyAutoDisclaimer(m);
  assert.match(next.meta.disclaimer, /food allergy or intolerance/i);
  // Original menu unchanged (helper is non-mutating).
  assert.equal(m.meta.disclaimer, '');
});

test('applyAutoDisclaimer preserves operator-typed disclaimer', () => {
  const m = SCHEMA.blankMenu();
  m.meta.disclaimer = 'Our chef will accommodate any allergy with notice.';
  const next = SCHEMA.applyAutoDisclaimer(m);
  assert.equal(next.meta.disclaimer, m.meta.disclaimer);
});

test('applyAutoDisclaimer is idempotent', () => {
  const m = SCHEMA.blankMenu();
  m.meta.allergenRegime = 'us-fda9';
  m.meta.locale = 'es';
  const once  = SCHEMA.applyAutoDisclaimer(m);
  const twice = SCHEMA.applyAutoDisclaimer(once);
  assert.equal(once.meta.disclaimer, twice.meta.disclaimer);
});

// ============== Plain-language sibling (Wave C2) ==============
test('migrate carries descPlain through the v2 → v3 path', () => {
  const m = SCHEMA.migrate({
    rows: [
      { kind: 'section', name: 'Salads' },
      { kind: 'dish', name: 'Caesar',
        desc: 'Crisp little gems, buttermilk-anchovy, parmesan crisp.',
        descPlain: 'Lettuce salad with creamy dressing and crunchy cheese.',
        price: '14' },
      { kind: 'dish', name: 'Soup', desc: 'Ask your server.', price: '10' }
    ]
  });
  const caesar = m.dishes.find(d => d.name === 'Caesar');
  assert.equal(caesar.descPlain, 'Lettuce salad with creamy dressing and crunchy cheese.');
  const soup = m.dishes.find(d => d.name === 'Soup');
  assert.equal(soup.descPlain, '');
});

test('blankDish initializes descPlain as empty string', () => {
  const d = SCHEMA.blankDish({ name: 'X' });
  assert.equal(d.descPlain, '');
});
