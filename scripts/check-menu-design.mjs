#!/usr/bin/env node
/**
 * Menu Design Suite — internal consistency check.
 *
 * Runs as part of scripts/check-all.mjs. Asserts that the tool's
 * many cross-cutting concerns stay aligned:
 *
 *   1. Required module files are present + parseable
 *   2. data/allergens.js + data/badges.js + data/allergen-glyphs.js
 *      catalogs agree on code IDs (one ID per allergen across all 3)
 *   3. The PDF + HTML + text emitters' inline allergen mirrors carry
 *      every code that data/allergens.js declares
 *   4. index.html script tags load extracted modules BEFORE
 *      menu-design.js (load-order dependency)
 *   5. Every theme in themes.js declares the required token shape
 *   6. Every paper key in PAPERS has the v2 catalog fields
 *
 * Fails CI on any drift; the failing assertion names which contract
 * broke so the fix is mechanical.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const toolDir    = path.join(repoRoot, 'tools/menu-design');

const failures = [];
function assert(cond, msg) { if (!cond) failures.push(msg); }

// 1. Required module files present + node-parseable.
const REQUIRED = [
  'index.html',
  'menu-design.js',
  'menu-render-pdf.js',
  'menu-render-html.js',
  'menu-render-text.js',
  'themes.js',
  'data/allergens.js',
  'data/badges.js',
  'data/allergen-glyphs.js',
  'infra/dom.js',
  'infra/i18n.js'
];
for (const rel of REQUIRED) {
  const p = path.join(toolDir, rel);
  assert(fs.existsSync(p), `missing required file: tools/menu-design/${rel}`);
}

// 2. Catalog ID consistency. Load the data modules with a require-
// shaped polyfill (they all expose module.exports).
async function loadModule(rel) {
  const p = path.join(toolDir, rel);
  if (!fs.existsSync(p)) return null;
  try {
    const src = fs.readFileSync(p, 'utf8');
    const wrapped = src + '\n;module.exports = (typeof module !== "undefined" && module.exports) ? module.exports : {};';
    const mod = { exports: {} };
    new Function('module', 'exports', 'window', wrapped)(mod, mod.exports, undefined);
    return mod.exports;
  } catch (e) {
    failures.push(`failed to load tools/menu-design/${rel}: ${e.message}`);
    return null;
  }
}
const allergens = await loadModule('data/allergens.js');
const badges    = await loadModule('data/badges.js');
const glyphs    = await loadModule('data/allergen-glyphs.js');
const themes    = await loadModule('themes.js');
const pdf       = await loadModule('menu-render-pdf.js');
const text      = await loadModule('menu-render-text.js');

if (allergens && allergens.CODES) {
  assert(Array.isArray(allergens.CODES), 'allergens.CODES must be an array');
  // Each code must have id + label_en + label_es.
  for (const c of allergens.CODES) {
    assert(c.id && c.label_en && c.label_es,
      `allergen code missing required fields: ${JSON.stringify(c)}`);
  }
  // Allergen IDs must each have a glyph entry in MD_GLYPHS.
  if (glyphs && glyphs.GLYPHS) {
    for (const c of allergens.CODES) {
      assert(glyphs.has(c.id),
        `allergen "${c.id}" has no matching glyph in data/allergen-glyphs.js`);
    }
  }
}
if (badges && badges.BADGES) {
  for (const b of badges.BADGES) {
    assert(b.id && b.label_en && b.label_es && b.glyph,
      `badge missing required fields: ${JSON.stringify(b)}`);
  }
}

// 3. PDF + text emitter mirrors agree on codes.
const pdfSrc  = fs.existsSync(path.join(toolDir, 'menu-render-pdf.js'))
  ? fs.readFileSync(path.join(toolDir, 'menu-render-pdf.js'), 'utf8') : '';
const textSrc = fs.existsSync(path.join(toolDir, 'menu-render-text.js'))
  ? fs.readFileSync(path.join(toolDir, 'menu-render-text.js'), 'utf8') : '';
const htmlSrc = fs.existsSync(path.join(toolDir, 'menu-render-html.js'))
  ? fs.readFileSync(path.join(toolDir, 'menu-render-html.js'), 'utf8') : '';
if (allergens && allergens.CODES) {
  for (const c of allergens.CODES) {
    // PDF mirror
    assert(new RegExp(`\\b${c.id}\\s*:\\s*\\{`).test(pdfSrc),
      `menu-render-pdf.js PDF_ALLERGENS mirror missing entry for "${c.id}"`);
    // Text mirror
    assert(new RegExp(`\\b${c.id}\\s*:\\s*\\{`).test(textSrc),
      `menu-render-text.js TXT_ALLERGENS mirror missing entry for "${c.id}"`);
    // HTML mirror
    assert(new RegExp(`\\b${c.id}\\s*:\\s*\\{`).test(htmlSrc),
      `menu-render-html.js HTML_ALLERGENS mirror missing entry for "${c.id}"`);
  }
}

// 4. index.html load-order: data + infra modules must come BEFORE
// menu-design.js so the orchestrator reads MD_* globals at parse time.
const htmlDoc = fs.existsSync(path.join(toolDir, 'index.html'))
  ? fs.readFileSync(path.join(toolDir, 'index.html'), 'utf8') : '';
const orderedScripts = Array.from(htmlDoc.matchAll(/<script src="\.\/([^"?]+)/g)).map(m => m[1]);
const orchestratorIdx = orderedScripts.indexOf('menu-design.js');
const requiredBefore = ['data/allergens.js', 'data/badges.js', 'data/allergen-glyphs.js', 'infra/dom.js', 'infra/i18n.js', 'themes.js'];
if (orchestratorIdx !== -1) {
  for (const dep of requiredBefore) {
    const di = orderedScripts.indexOf(dep);
    assert(di !== -1 && di < orchestratorIdx,
      `index.html load order: ${dep} must load before menu-design.js`);
  }
}

// 5. Theme registry — every theme has the required token shape.
if (themes && themes.THEMES) {
  const requiredKeys = [
    'id','label_en','label_es','blurb_en','blurb_es',
    'paper','ink','accent','muted',
    'bodyFamily','displayFamily',
    'h1Pt','h2Pt','bodyPt','descPt',
    'priceStyle','dividerStyle','columns','logoSlot',
    'paperFloors','cuisineHint'
  ];
  for (const id of Object.keys(themes.THEMES)) {
    const t = themes.THEMES[id];
    for (const k of requiredKeys) {
      assert(t[k] !== undefined, `theme "${id}" missing required key "${k}"`);
    }
    // paperFloors values must be valid PAPERS keys.
    if (Array.isArray(t.paperFloors) && pdf && pdf.PAPERS) {
      for (const pk of t.paperFloors) {
        assert(pdf.PAPERS[pk] !== undefined,
          `theme "${id}" paperFloors references unknown paper key "${pk}"`);
      }
    }
  }
}

// 6. PAPERS — every entry has the v2 catalog fields.
if (pdf && pdf.PAPERS) {
  for (const key of Object.keys(pdf.PAPERS)) {
    const p = pdf.PAPERS[key];
    assert(typeof p.w === 'number' && typeof p.h === 'number',
      `paper "${key}" missing w/h dimensions`);
    assert(typeof p.flow === 'string',
      `paper "${key}" missing flow ('page' | 'panel')`);
    assert(typeof p.cat === 'string',
      `paper "${key}" missing cat (sheet|folded|table|board|digital|custom)`);
    assert(typeof p.label === 'string',
      `paper "${key}" missing operator-facing label`);
    if (p.flow === 'panel') {
      assert(typeof p.panels === 'number',
        `panel-flow paper "${key}" missing panel count`);
      assert(Array.isArray(p.panelMap),
        `panel-flow paper "${key}" missing panelMap`);
    }
  }
}

if (failures.length) {
  console.error(`Menu-Design consistency: ${failures.length} failure(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Menu-Design consistency: all checks passed (${(allergens && allergens.CODES) ? allergens.CODES.length : '?'} allergens, ${(themes && themes.THEMES) ? Object.keys(themes.THEMES).length : '?'} themes, ${(pdf && pdf.PAPERS) ? Object.keys(pdf.PAPERS).length : '?'} papers).`);
