/**
 * Unit tests — tools/menu-design/state/reducer.js + store.js
 * Run via:   node --test tools/menu-design/state/reducer.test.mjs
 *
 * Coverage focus: every action type returns a sensible new state,
 * undo/redo round-trip via the store, autosave-debounce subscription.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SCHEMA = require('../../_shared/menu-schema.js');
const REDUCER = require('./reducer.js');
const STORE = require('./store.js');
const ACT = require('./actions.js').ACTIONS;

function blankState() {
  return SCHEMA.migrate(null);
}

function withSeed() {
  return SCHEMA.migrate({
    rows: [
      { kind: 'section', name: 'Starters' },
      { kind: 'dish', name: 'Caesar', price: '12', allergens: ['DF'] },
      { kind: 'dish', name: 'Soup',   price: '8'  },
      { kind: 'section', name: 'Mains' },
      { kind: 'dish', name: 'Steak',  price: '34' }
    ],
    theme: 'trattoria',
    meta: { businessName: 'Joe' }
  });
}

// ============== Reducer purity ==============
test('reducer returns same state on action without type', () => {
  const s = blankState();
  assert.equal(REDUCER.reduce(s, {}), s);
});

test('reducer throws on unknown action type', () => {
  assert.throws(() => REDUCER.reduce(blankState(), { type: 'BOGUS' }), /unknown action/);
});

test('reducer never mutates input state', () => {
  const s = withSeed();
  const before = JSON.stringify(s);
  REDUCER.reduce(s, { type: ACT.DISH_ADD, payload: { sectionId: s.sections[0].id } });
  assert.equal(JSON.stringify(s), before);
});

// ============== DISH ==============
test('DISH_ADD appends to specified section at end position', () => {
  const s = withSeed();
  const sid = s.sections[0].id;
  const next = REDUCER.reduce(s, { type: ACT.DISH_ADD, payload: { sectionId: sid, dish: { name: 'Bread' } } });
  const inSection = next.dishes.filter(d => d.sectionId === sid);
  assert.equal(inSection.length, 3);
  assert.equal(inSection[2].name, 'Bread');
  assert.equal(inSection[2].position, 2);
});

test('DISH_ADD without sectionId appends to last section', () => {
  const s = withSeed();
  const lastSec = s.sections[s.sections.length - 1].id;
  const next = REDUCER.reduce(s, { type: ACT.DISH_ADD, payload: { dish: { name: 'Wine' } } });
  assert.equal(next.dishes[next.dishes.length - 1].sectionId, lastSec);
});

test('DISH_UPDATE patches only specified fields', () => {
  const s = withSeed();
  const id = s.dishes[0].id;
  const next = REDUCER.reduce(s, { type: ACT.DISH_UPDATE, payload: { id, patch: { price: '14', desc: 'crisp' } } });
  const updated = next.dishes.find(d => d.id === id);
  assert.equal(updated.price, '14');
  assert.equal(updated.desc, 'crisp');
  assert.equal(updated.name, 'Caesar', 'untouched field preserved');
});

test('DISH_REMOVE drops the dish and renormalizes positions', () => {
  const s = withSeed();
  const sid = s.sections[0].id;
  const targetId = s.dishes.find(d => d.sectionId === sid && d.name === 'Caesar').id;
  const next = REDUCER.reduce(s, { type: ACT.DISH_REMOVE, payload: { id: targetId } });
  const inSection = next.dishes.filter(d => d.sectionId === sid);
  assert.equal(inSection.length, 1);
  assert.equal(inSection[0].position, 0, 'remaining dish renormalized to 0');
});

test('DISH_REORDER moves within section, renormalizes positions', () => {
  const s = withSeed();
  const sid = s.sections[0].id;
  const soupId = s.dishes.find(d => d.name === 'Soup').id;
  const next = REDUCER.reduce(s, { type: ACT.DISH_REORDER, payload: { id: soupId, toIndex: 0 } });
  const inSection = next.dishes.filter(d => d.sectionId === sid).sort((a,b) => a.position - b.position);
  assert.equal(inSection[0].name, 'Soup');
  assert.equal(inSection[1].name, 'Caesar');
});

test('DISH_MOVE_SECTION transfers between sections', () => {
  const s = withSeed();
  const startersId = s.sections[0].id;
  const mainsId = s.sections[1].id;
  const soupId = s.dishes.find(d => d.name === 'Soup').id;
  const next = REDUCER.reduce(s, { type: ACT.DISH_MOVE_SECTION, payload: { id: soupId, sectionId: mainsId, toIndex: 0 } });
  assert.equal(next.dishes.find(d => d.id === soupId).sectionId, mainsId);
  assert.equal(next.dishes.filter(d => d.sectionId === startersId).length, 1);
});

// ============== SECTION ==============
test('SECTION_ADD appends a new section', () => {
  const s = withSeed();
  const next = REDUCER.reduce(s, { type: ACT.SECTION_ADD, payload: { name: 'Desserts' } });
  assert.equal(next.sections.length, 3);
  assert.equal(next.sections[next.sections.length - 1].name, 'Desserts');
});

test('SECTION_REMOVE absorbs dishes into the previous section by default', () => {
  const s = withSeed();
  const startersId = s.sections[0].id;
  const mainsId = s.sections[1].id;
  const next = REDUCER.reduce(s, { type: ACT.SECTION_REMOVE, payload: { id: mainsId } });
  // Mains gone; Steak absorbed into Starters
  assert.equal(next.sections.length, 1);
  assert.equal(next.sections[0].id, startersId);
  assert.equal(next.dishes.length, 3);
  assert.equal(next.dishes.every(d => d.sectionId === startersId), true);
});

test('SECTION_REMOVE with dishStrategy=remove drops dishes too', () => {
  const s = withSeed();
  const mainsId = s.sections[1].id;
  const next = REDUCER.reduce(s, { type: ACT.SECTION_REMOVE, payload: { id: mainsId, dishStrategy: 'remove' } });
  assert.equal(next.sections.length, 1);
  assert.equal(next.dishes.length, 2, 'Steak dropped');
});

test('SECTION_REORDER swaps positions', () => {
  const s = withSeed();
  const mainsId = s.sections[1].id;
  const next = REDUCER.reduce(s, { type: ACT.SECTION_REORDER, payload: { id: mainsId, toIndex: 0 } });
  assert.equal(next.sections[0].name, 'Mains');
  assert.equal(next.sections[1].name, 'Starters');
});

// ============== ALLERGEN ==============
test('ALLERGEN_TOGGLE adds and removes a code', () => {
  const s = withSeed();
  const id = s.dishes[0].id;
  let next = REDUCER.reduce(s, { type: ACT.ALLERGEN_TOGGLE, payload: { id, code: 'GF' } });
  assert.deepEqual(next.dishes.find(d => d.id === id).allergens.sort(), ['DF', 'GF']);
  next = REDUCER.reduce(next, { type: ACT.ALLERGEN_TOGGLE, payload: { id, code: 'GF' } });
  assert.deepEqual(next.dishes.find(d => d.id === id).allergens, ['DF']);
});

test('ALLERGEN_TOGGLE with explicit on=false is idempotent when absent', () => {
  const s = withSeed();
  const id = s.dishes[0].id;
  const next = REDUCER.reduce(s, { type: ACT.ALLERGEN_TOGGLE, payload: { id, code: 'XX', on: false } });
  assert.deepEqual(next.dishes.find(d => d.id === id).allergens, ['DF']);
});

test('ALLERGEN_SET_STATE marks may-contain', () => {
  const s = withSeed();
  const id = s.dishes[0].id;
  const next = REDUCER.reduce(s, { type: ACT.ALLERGEN_SET_STATE, payload: { id, code: 'N', state: 'may' } });
  const d = next.dishes.find(x => x.id === id);
  assert.equal(d.allergenStates['N'], 'may');
  assert.ok(d.allergens.includes('N'), 'auto-adds the code to allergens[]');
});

test('REGIME_SET only accepts known regimes', () => {
  const s = withSeed();
  const ok = REDUCER.reduce(s, { type: ACT.REGIME_SET, payload: { regime: 'eu-fic14' } });
  assert.equal(ok.meta.allergenRegime, 'eu-fic14');
  const bad = REDUCER.reduce(s, { type: ACT.REGIME_SET, payload: { regime: 'mars-1' } });
  assert.equal(bad.meta.allergenRegime, 'us-fda9', 'unknown regime ignored');
});

// ============== THEME + META ==============
test('THEME_SET and META_UPDATE update only the relevant slice', () => {
  const s = withSeed();
  let next = REDUCER.reduce(s, { type: ACT.THEME_SET, payload: { themeId: 'brasserie' } });
  assert.equal(next.theme.id, 'brasserie');
  next = REDUCER.reduce(next, { type: ACT.META_UPDATE, payload: { tagline: 'Since 1992' } });
  assert.equal(next.meta.tagline, 'Since 1992');
  assert.equal(next.theme.id, 'brasserie', 'theme preserved across meta update');
});

test('THEME_MOD_SET only accepts known mod keys', () => {
  const s = withSeed();
  const ok = REDUCER.reduce(s, { type: ACT.THEME_MOD_SET, payload: { mod: 'season', value: 'winter' } });
  assert.equal(ok.theme.mods.season, 'winter');
  const noop = REDUCER.reduce(s, { type: ACT.THEME_MOD_SET, payload: { mod: 'unknown', value: 'x' } });
  assert.deepEqual(noop.theme.mods, s.theme.mods);
});

// ============== STORE: undo / redo / persist ==============
test('store.dispatch + undo + redo round-trip', () => {
  const store = STORE.create({ initialMenu: withSeed(), persistDebounceMs: 1 });
  const id = store.getState().dishes[0].id;
  const before = store.getState().dishes[0].allergens.slice();
  store.dispatch({ type: ACT.ALLERGEN_TOGGLE, payload: { id, code: 'GF' } });
  assert.notDeepEqual(store.getState().dishes[0].allergens, before);
  store.undo();
  assert.deepEqual(store.getState().dishes[0].allergens, before);
  store.redo();
  assert.notDeepEqual(store.getState().dishes[0].allergens, before);
});

test('store.subscribe is called on every change', () => {
  const store = STORE.create({ initialMenu: withSeed(), persistDebounceMs: 1 });
  let count = 0;
  const unsub = store.subscribe(() => { count++; });
  store.dispatch({ type: ACT.SECTION_ADD, payload: { name: 'X' } });
  store.dispatch({ type: ACT.META_UPDATE, payload: { tagline: 'T' } });
  unsub();
  store.dispatch({ type: ACT.META_UPDATE, payload: { tagline: 'T2' } });
  assert.equal(count, 2);
});

test('store autosave debounces and fires once', async () => {
  let persists = 0;
  const store = STORE.create({
    initialMenu: withSeed(),
    onPersist: () => persists++,
    persistDebounceMs: 5
  });
  store.dispatch({ type: ACT.META_UPDATE, payload: { tagline: 'A' } });
  store.dispatch({ type: ACT.META_UPDATE, payload: { tagline: 'B' } });
  store.dispatch({ type: ACT.META_UPDATE, payload: { tagline: 'C' } });
  await new Promise(r => setTimeout(r, 30));
  assert.equal(persists, 1, 'three rapid dispatches collapse to one persist');
});

test('store.canUndo / canRedo reflect history depth', () => {
  const store = STORE.create({ initialMenu: withSeed(), persistDebounceMs: 1 });
  assert.equal(store.canUndo(), false);
  store.dispatch({ type: ACT.SECTION_ADD, payload: { name: 'X' } });
  assert.equal(store.canUndo(), true);
  assert.equal(store.canRedo(), false);
  store.undo();
  assert.equal(store.canUndo(), false);
  assert.equal(store.canRedo(), true);
});

// ============== MENU_REPLACE / PASTE_INGEST ==============
test('MENU_REPLACE swaps the entire canonical menu', () => {
  const s = withSeed();
  const fresh = SCHEMA.blankMenu();
  fresh.meta.businessName = 'Otra';
  const next = REDUCER.reduce(s, { type: ACT.MENU_REPLACE, payload: { menu: fresh } });
  assert.equal(next.meta.businessName, 'Otra');
  assert.equal(next.dishes.length, 0);
});

test('MENU_PASTE_INGEST keeps theme + meta, replaces sections + dishes', () => {
  const s = withSeed();
  const next = REDUCER.reduce(s, { type: ACT.MENU_PASTE_INGEST, payload: { rows: [
    { kind: 'section', name: 'Cocktails' },
    { kind: 'dish', name: 'Negroni', price: '14' }
  ]}});
  assert.equal(next.theme.id, 'trattoria', 'theme preserved');
  assert.equal(next.meta.businessName, 'Joe', 'meta preserved');
  assert.equal(next.sections.length, 1);
  assert.equal(next.sections[0].name, 'Cocktails');
  assert.equal(next.dishes[0].name, 'Negroni');
});
