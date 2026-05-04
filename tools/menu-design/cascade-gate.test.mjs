/**
 * Unit test — Pull-It-Back-From-The-Grave fit cascade (data layer).
 * Run via:  node --test tools/menu-design/cascade-gate.test.mjs
 *
 * The cascade itself runs in a browser DOM (paginatePreviewDom uses
 * getBoundingClientRect + reflows), so we can't fully exercise it from
 * Node. This test validates the data-layer pieces the cascade depends on:
 *
 *   1. Every theme in themes.js declares twoColPromotable explicitly.
 *      The 6 opt-out themes (tasting/chef-counter/room-service/
 *      dessert/cocktail/wine-list) declare false. Every other theme
 *      declares true.
 *
 *   2. The 2-col eligibility gate (paper-points >= 400 AND flow
 *      !== 'panel' AND theme.twoColPromotable !== false) returns the
 *      correct boolean for each of the 6 test-matrix cases.
 *
 *   3. The PDF renderer's gate (paper.w - 2*margin >= 400 AND
 *      (theme.columns === 2 OR (forceTwoCol AND promotable))) agrees
 *      with the preview gate for the same cases.
 *
 * If any of these break in the future, the cascade fix regresses
 * silently and a 10-dish brunch goes back to 3 pages.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repoRoot   = path.resolve(__dirname, '../..');

function loadModule(rel) {
  const src = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
  const root = {};
  const ctx = { window: root };
  ctx.global = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return root;
}

const themesRoot = loadModule('tools/menu-design/themes.js');
const papersRoot = loadModule('tools/menu-design/data/papers.js');

const THEMES = themesRoot.MD_THEMES.THEMES;
const PAPERS = papersRoot.MD_PAPERS.PAPERS;

const OPT_OUT = new Set([
  'tasting-omakase', 'chef-counter', 'room-service-hotel',
  'dessert-only', 'cocktail-deco', 'wine-list-formal'
]);

// ============================================================
//  1. Every theme declares twoColPromotable explicitly.
// ============================================================
test('every theme declares twoColPromotable', () => {
  const ids = Object.keys(THEMES);
  assert.equal(ids.length, 37, 'expected 37 themes');
  for (const id of ids) {
    const theme = THEMES[id];
    assert.equal(typeof theme.twoColPromotable, 'boolean',
      `theme ${id} missing twoColPromotable boolean`);
  }
});

test('opt-out themes are exactly the 6 editorial-pace themes', () => {
  const ids = Object.keys(THEMES);
  const declaredOptOut = ids.filter((id) => THEMES[id].twoColPromotable === false);
  assert.deepEqual(declaredOptOut.sort(), Array.from(OPT_OUT).sort(),
    'opt-out theme set drift; review themes.js');
});

test('opt-in themes are 31 (37 total - 6 opt-out)', () => {
  const ids = Object.keys(THEMES);
  const optIn = ids.filter((id) => THEMES[id].twoColPromotable === true);
  assert.equal(optIn.length, 31);
});

// ============================================================
//  2. The eligibility gate returns the right boolean for each
//     of the 6 test-matrix cases.
// ============================================================

// Mirror the gate from menu-design.js:2435-2440. Keep this in sync.
function previewGate(paperKey, themeId) {
  const paper = PAPERS[paperKey];
  const theme = THEMES[themeId];
  if (!paper || !theme) return null;
  const paperContentPt = (paper.w || 612) - 2 * (paper.margin || 48);
  const themePromotable = theme.twoColPromotable !== false;
  return paperContentPt >= 400
      && paper.flow !== 'panel'
      && themePromotable;
}

test('test matrix case 1: Letter cafe-counter is eligible', () => {
  // 10-dish brunch. The defect screenshot. Must pass.
  assert.equal(previewGate('letter', 'cafe-counter'), true);
});

test('test matrix case 2: Letter trattoria is eligible', () => {
  // 16-dish trattoria. Must promote to 2-col.
  assert.equal(previewGate('letter', 'trattoria'), true);
});

test('test matrix case 3: Letter modern-minimal is eligible', () => {
  // 27-dish menu. Must promote to 2-col + minor shrink.
  assert.equal(previewGate('letter', 'modern-minimal'), true);
});

test('test matrix case 4: Letter modern-minimal is eligible (53 dishes)', () => {
  // Same theme/paper as case 3; cascade depth tests 53-dish escape valve.
  assert.equal(previewGate('letter', 'modern-minimal'), true);
});

test('test matrix case 5: Letter tasting-omakase is INELIGIBLE (theme opt-out)', () => {
  // Tasting menu must stay 1-col regardless of paper width.
  assert.equal(previewGate('letter', 'tasting-omakase'), false);
});

test('test matrix case 6: wine-narrow wine-list-formal is INELIGIBLE (paper too narrow + theme opt-out)', () => {
  // Wine list paper is 306pt wide; content area = 306 - 2*24 = 258pt < 400.
  // Even if the theme opted in, paper would gate it. Theme also opted out.
  assert.equal(previewGate('wine-narrow', 'wine-list-formal'), false);
});

test('panel-flow papers are never eligible', () => {
  // Tri-fold, table-tent, bi-fold all flow as 'panel' and have their
  // own paginator. The gate must reject these explicitly.
  for (const key of ['bifold-letter', 'trifold-letter-z', 'table-tent']) {
    assert.equal(previewGate(key, 'cafe-counter'), false,
      `panel paper ${key} should never be 2-col eligible`);
  }
});

// ============================================================
//  3. PDF renderer gate agrees with preview gate on the matrix.
// ============================================================

// Mirror the PDF gate from menu-render-pdf.js:1471-1480. Keep in sync.
function pdfGate(paperKey, themeId, opts) {
  const paper = PAPERS[paperKey];
  const theme = THEMES[themeId];
  if (!paper || !theme) return null;
  const minTwoColW = 400;
  const paperWideEnough = (paper.w - 2 * (paper.margin || 48) >= minTwoColW);
  const promotable = theme.twoColPromotable !== false;
  const forceTwoCol = !!(opts && opts.forceTwoCol);
  return !((opts && opts.quietMode))
      && paperWideEnough
      && (theme.columns === 2 || (forceTwoCol && promotable));
}

test('PDF gate: native-2-col theme always 2-cols on wide paper', () => {
  // diner-counter has columns: 2 native. Should 2-col Letter regardless
  // of forceTwoCol or twoColPromotable.
  assert.equal(pdfGate('letter', 'diner-counter', {}), true);
  assert.equal(pdfGate('letter', 'diner-counter', { forceTwoCol: false }), true);
});

test('PDF gate: cafe-counter (1-col native) only 2-cols when forceTwoCol set', () => {
  // The Wave 1+3 fix: forceTwoCol from preview cascade promotes 1-col
  // themes that have twoColPromotable: true.
  assert.equal(pdfGate('letter', 'cafe-counter', {}), false);
  assert.equal(pdfGate('letter', 'cafe-counter', { forceTwoCol: true }), true);
});

test('PDF gate: tasting-omakase NEVER 2-cols even with forceTwoCol', () => {
  // Belt-and-suspenders: even if the orchestrator passes forceTwoCol
  // (which it shouldn't, since the preview gate also rejects), the PDF
  // gate must reject because twoColPromotable is false.
  assert.equal(pdfGate('letter', 'tasting-omakase', {}), false);
  assert.equal(pdfGate('letter', 'tasting-omakase', { forceTwoCol: true }), false);
});

test('PDF gate: wine-narrow paper rejected regardless of theme', () => {
  // 306pt - 2*24pt = 258pt < 400pt minTwoColW.
  assert.equal(pdfGate('wine-narrow', 'wine-list-formal', { forceTwoCol: true }), false);
  assert.equal(pdfGate('wine-narrow', 'cafe-counter', { forceTwoCol: true }), false);
});

test('PDF gate: quiet mode forces 1-col on any theme/paper', () => {
  // Accessibility mode strips decoration and forces single column.
  assert.equal(pdfGate('letter', 'diner-counter', { quietMode: true }), false);
  assert.equal(pdfGate('letter', 'cafe-counter', { quietMode: true, forceTwoCol: true }), false);
});

// ============================================================
//  4. Paper sanity check — minTwoColW threshold matches between
//     preview (menu-design.js) and PDF (menu-render-pdf.js).
// ============================================================

test('Letter content area is wide enough for 2-col (sanity)', () => {
  const letter = PAPERS.letter;
  const contentPt = letter.w - 2 * letter.margin;
  assert.equal(contentPt, 516, 'Letter content area should be 516pt');
  assert.ok(contentPt >= 400, 'Letter must clear the 400pt 2-col threshold');
});

test('wine-narrow content area is too narrow for 2-col (sanity)', () => {
  const wine = PAPERS['wine-narrow'];
  const contentPt = wine.w - 2 * wine.margin;
  assert.ok(contentPt < 400,
    `wine-narrow content area (${contentPt}pt) must be below 400pt threshold`);
});
