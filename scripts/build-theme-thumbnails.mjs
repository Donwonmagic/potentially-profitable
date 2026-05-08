#!/usr/bin/env node
/**
 * Build a real SVG thumbnail per theme — high-fidelity preview that
 * actually represents what the operator's menu will look like in
 * each theme. Replaces the canvas-painted placeholders with proper
 * vector renders that:
 *
 *   - use the theme's actual displayFamily / bodyFamily strings via
 *     SVG <text font-family> (browser uses whatever @font-face
 *     declarations are loaded; falls back gracefully to system stack)
 *   - honor sectionCase + letterSpacing on the section header
 *   - draw the real divider style (box / hand-rule / ornament /
 *     whitespace) as proper SVG primitives
 *   - render leader-dots as a true SVG line with stroke-dasharray
 *     between dish name and price (no overlap, no fence)
 *   - vary dish samples by cuisine (italian → Bruschetta/Caprese/
 *     Carbonara, mexican → Guacamole/Tacos al pastor/Pollo asado,
 *     etc)
 *   - render an allergen pill in the theme's accent color
 *   - layer paper texture as an SVG <pattern> when the theme calls
 *     for it
 *
 * Output: one SVG per theme at /assets/menu-design-thumbs/<id>.svg
 * (220 × 120 viewBox; scales infinitely on the device pixel ratio).
 *
 * Idempotent — re-running with no theme changes is a no-op. Wired
 * into scripts/check-all.mjs as a build-invariant guard so themes.js
 * drift triggers regen.
 *
 *   node scripts/build-theme-thumbnails.mjs
 *   node scripts/build-theme-thumbnails.mjs --check   # fails if drift
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');
const require    = createRequire(import.meta.url);
const DECOR      = require(path.join(repoRoot, 'tools/_shared/menu-renderers/cuisine-decor.js'));

const THUMB_DIR = path.join(repoRoot, 'assets/menu-design-thumbs');
const THUMB_JS  = path.join(repoRoot, 'tools/menu-design/theme-thumbs.js');
const VW = 220, VH = 120;

// ---- Load themes.js via vm sandbox -------------------------------
function loadThemes() {
  const src = fs.readFileSync(path.join(repoRoot, 'data/menu-design-themes.js'), 'utf8');
  const win = {};
  const moduleObj = { exports: {} };
  const ctx = vm.createContext({
    window: win, module: moduleObj,
    Math, Date, Object, Array, String, Number, JSON,
    parseFloat, parseInt, isFinite, isNaN, Boolean
  });
  vm.runInContext(src, ctx);
  const api = moduleObj.exports;
  // The MD_THEMES surface exposes list() → array of theme IDs (strings)
  // and get(id) → full theme object. We resolve every ID to its object.
  if (api && typeof api.list === 'function' && typeof api.get === 'function') {
    return api.list().map(id => Object.assign({ id: id }, api.get(id) || {}));
  }
  if (api && api.THEMES) {
    return Object.entries(api.THEMES).map(([id, t]) => Object.assign({ id: id }, t));
  }
  if (win.MD_THEMES && win.MD_THEMES.list && win.MD_THEMES.get) {
    return win.MD_THEMES.list().map(id => Object.assign({ id: id }, win.MD_THEMES.get(id) || {}));
  }
  throw new Error('Could not load themes from themes.js');
}

// ---- Cuisine + content-type → section + dishes -------------------
function sectionFor(theme) {
  const ct = theme.contentType || 'standard';
  if (ct === 'tasting')  return 'COURSE I';
  if (ct === 'wine')     return 'BY THE GLASS';
  if (ct === 'cocktail') return 'CLASSICS';
  if (ct === 'dessert')  return 'DOLCI';
  if (ct === 'kids')     return 'FOR THE LITTLES';
  const ch = (theme.cuisineHint || []).map(String);
  const has = re => ch.some(s => re.test(s));
  if (has(/italian|trattor|pasta/i))                  return 'ANTIPASTI';
  if (has(/mexic|taco|cantina/i))                     return 'ANTOJITOS';
  if (has(/french|bistro|francesa/i))                 return 'ENTRÉES';
  if (has(/asian|thai|viet|japan|kor|ramen|sushi/i))  return 'STARTERS';
  if (has(/seafood|oyster|fish|maris|pesc/i))         return 'RAW BAR';
  if (has(/steak|chop|parr|asad/i))                   return 'CUTS';
  if (has(/bbq|barbec|smoke|brisket/i))               return 'FROM THE PIT';
  if (has(/diner|breakfast|burger|sandwich|deli/i))   return 'OPENERS';
  if (has(/farm|seasonal|garden|plant/i))             return 'FROM THE GARDEN';
  if (has(/cafe|bakery|patisserie/i))                 return 'PASTRIES';
  if (has(/pizza|slice/i))                            return 'PIES';
  if (has(/tapas|pinchos/i))                          return 'TAPAS';
  if (has(/brew|tap|gastropub/i))                     return 'TO BEGIN';
  return 'STARTERS';
}

function dishesFor(theme) {
  const ct = theme.contentType || 'standard';
  if (ct === 'tasting')  return [['Course I', ''], ['Course II', ''], ['Course III', '']];
  if (ct === 'wine')     return [['Pinot Noir, 2021', '14'], ['Sancerre, 2022', '17'], ['Champagne brut', '22']];
  if (ct === 'cocktail') return [['Old fashioned', '14'], ['Negroni', '13'], ['French 75', '15']];
  if (ct === 'dessert')  return [['Tiramisu', '11'], ['Crème brûlée', '10'], ['Sorbet trio', '9']];
  if (ct === 'kids')     return [['Mac & cheese', '7'], ['Chicken tenders', '8'], ['PB&J', '5']];
  const ch = (theme.cuisineHint || []).map(String);
  const has = re => ch.some(s => re.test(s));
  if (has(/italian|trattor/i))                          return [['Bruschetta', '9'], ['Caprese', '13'], ['Carbonara', '21']];
  if (has(/mexic|taco/i))                               return [['Guacamole', '12'], ['Tacos al pastor', '14'], ['Pollo asado', '22']];
  if (has(/french|bistro/i))                            return [['Soupe à l’oignon', '12'], ['Steak frites', '32'], ['Tarte du jour', '11']];
  if (has(/asian|thai|viet|japan|kor|ramen|sushi/i))   return [['Spring rolls', '9'], ['Pad thai', '17'], ['Bibimbap', '19']];
  if (has(/seafood|oyster|fish|maris|pesc/i))          return [['Oysters, half doz', '24'], ['Crab cake', '18'], ['Branzino', '38']];
  if (has(/steak|chop|parr|asad/i))                    return [['Bone-in ribeye', '62'], ['NY strip', '48'], ['Filet mignon', '54']];
  if (has(/bbq|barbec|smoke/i))                        return [['Brisket, 1/2 lb', '22'], ['Pulled pork', '17'], ['Cornbread', '6']];
  if (has(/diner|breakfast|burger/i))                  return [['Pancakes', '11'], ['Eggs benedict', '15'], ['House burger', '17']];
  if (has(/farm|garden|plant/i))                       return [['Beet salad', '14'], ['Duck breast', '34'], ['Lamb tagine', '32']];
  if (has(/cafe|bakery|patisser/i))                    return [['Almond croissant', '5'], ['Pain au chocolat', '4'], ['Quiche du jour', '12']];
  if (has(/pizza|slice/i))                             return [['Margherita', '14'], ['Funghi', '17'], ['Diavola', '18']];
  if (has(/tapas|pinchos/i))                           return [['Pan con tomate', '7'], ['Croquetas', '11'], ['Patatas bravas', '9']];
  if (has(/brew|tap|gastropub/i))                      return [['Wings', '14'], ['Pretzel + mustard', '10'], ['House burger', '17']];
  return [['Caesar salad', '14'], ['House bread', '6'], ['Roast chicken', '28']];
}

// ---- Helpers ------------------------------------------------------
const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function applyCase(s, mode) {
  if (mode === 'capitalize') return String(s).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  if (mode === 'small-caps') return String(s).toUpperCase();
  return String(s).toUpperCase();
}

function colorMix(c1, c2, ratio) {
  const p = c => {
    let s = String(c || '#000').replace('#', '');
    if (s.length === 3) s = s.split('').map(x => x + x).join('');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = p(c1), [r2, g2, b2] = p(c2);
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  return `rgb(${r},${g},${b})`;
}

// ---- Cuisine-decoration shim (data + builders live in the shared
// tools/_shared/menu-renderers/cuisine-decor.js module so the same
// decoration shows up in the picker thumbnail, the live preview,
// the QR-menu HTML output, and the print PDF). ----
const decorationSvg = (theme) => DECOR.svgFragment(theme);


// ---- SVG fragment builders ---------------------------------------
function paperRect(theme) {
  const paper = theme.paper || '#FAF6EE';
  let out = `  <rect x="0" y="0" width="${VW}" height="${VH}" fill="${paper}"/>\n`;
  if (theme.paperTexture) {
    const tint = colorMix(paper, theme.ink || '#14161A', 0.06);
    out += `  <pattern id="speckle-${esc(theme.id)}" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">\n`;
    out += `    <rect width="1" height="1" fill="${tint}"/>\n`;
    out += `    <rect x="2" y="2" width="1" height="1" fill="${tint}" opacity="0.6"/>\n`;
    out += `  </pattern>\n`;
    out += `  <rect x="0" y="0" width="${VW}" height="${VH}" fill="url(#speckle-${esc(theme.id)})" opacity="0.65"/>\n`;
  }
  return out;
}

function divider(theme, y) {
  const style = theme.dividerStyle || 'whitespace';
  const col = theme.muted || theme.accent || '#7C6F60';
  if (style === 'box') {
    return `  <rect x="${VW * 0.18}" y="${y - 12}" width="${VW * 0.64}" height="14" fill="none" stroke="${theme.ink || '#14161A'}" stroke-width="0.6"/>\n`;
  }
  if (style === 'hand-rule') {
    return `  <line x1="${VW * 0.20}" y1="${y}" x2="${VW * 0.80}" y2="${y}" stroke="${col}" stroke-width="0.5"/>\n`;
  }
  if (style === 'ornament') {
    const accent = theme.accent || col;
    return [
      `  <line x1="${VW * 0.20}" y1="${y}" x2="${VW * 0.42}" y2="${y}" stroke="${col}" stroke-width="0.5"/>`,
      `  <line x1="${VW * 0.58}" y1="${y}" x2="${VW * 0.80}" y2="${y}" stroke="${col}" stroke-width="0.5"/>`,
      `  <polygon points="${VW * 0.50},${y - 2.5} ${VW * 0.515},${y} ${VW * 0.50},${y + 2.5} ${VW * 0.485},${y}" fill="${accent}"/>`
    ].join('\n') + '\n';
  }
  return '';
}

function dishRow(theme, dish, x0, x1, y, bodyPx) {
  const ink = theme.ink || '#14161A';
  const bodyFamily = (theme.bodyFamily || 'Georgia, serif').replace(/"/g, "'");
  const name = esc(String(dish[0]).slice(0, 30));
  const price = esc(String(dish[1] || ''));
  let out = '';
  out += `  <text x="${x0}" y="${y}" font-family="${bodyFamily}" font-size="${bodyPx}" fill="${ink}" text-anchor="start">${name}</text>\n`;
  if (price) {
    out += `  <text x="${x1}" y="${y}" font-family="${bodyFamily}" font-size="${bodyPx}" fill="${ink}" text-anchor="end">${price}</text>\n`;
    if (theme.priceStyle === 'leader-dots') {
      // Leader dots — light dotted line that fills the gap between
      // approximate end-of-name and start-of-price. Approximation
      // because SVG doesn't measure text without font metrics; we
      // estimate name width = name.length * bodyPx * 0.45 and price
      // width = price.length * bodyPx * 0.5.
      const nameW = name.length * bodyPx * 0.45;
      const priceW = price.length * bodyPx * 0.5;
      const dotsX0 = x0 + nameW + 3;
      const dotsX1 = x1 - priceW - 3;
      const muted = theme.muted || '#9A958B';
      out += `  <line x1="${dotsX0}" y1="${y - 1.5}" x2="${dotsX1}" y2="${y - 1.5}" stroke="${muted}" stroke-width="0.45" stroke-dasharray="0.5,1.6"/>\n`;
    }
  }
  return out;
}

function allergenPill(theme, x, y, code) {
  const accent = theme.accent || '#1F4E5B';
  const paper = theme.paper || '#FAF6EE';
  const w = 14, h = 9;
  return [
    `  <rect x="${x}" y="${y - h + 2}" width="${w}" height="${h}" rx="3" ry="3" fill="${accent}"/>`,
    `  <text x="${x + w / 2}" y="${y - 1}" font-family="Inter, system-ui, sans-serif" font-size="6" font-weight="700" fill="${paper}" text-anchor="middle">${esc(code)}</text>`
  ].join('\n') + '\n';
}

// ---- Per-theme SVG composer --------------------------------------
function buildSvg(theme) {
  const paper = theme.paper || '#FAF6EE';
  const ink = theme.ink || '#14161A';
  const accent = theme.accent || '#1F4E5B';
  const muted = theme.muted || '#7C6F60';
  const displayFamily = (theme.displayFamily || 'Georgia, serif').replace(/"/g, "'");
  const bodyFamily = (theme.bodyFamily || displayFamily).replace(/"/g, "'");
  const ls = theme.letterSpacing === 'wide' ? 1.2 : 0.4;

  const titleText = esc(theme.label_en || theme.id || 'Menu').slice(0, 18);
  const sectionRaw = sectionFor(theme);
  const sectionText = esc(applyCase(sectionRaw, theme.sectionCase || 'uppercase'));
  const dishes = dishesFor(theme);

  const titlePx = theme.contentType === 'kids' ? 14 : 13;
  const sectionPx = theme.sectionCase === 'small-caps' ? 7.5 : 8.5;
  const bodyPx = 7.2;
  const labelPx = 6.5;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${esc(theme.label_en || theme.id)} preview">\n`;
  svg += paperRect(theme);
  // Cuisine-specific Muntin decoration — sits behind the menu content
  // at low opacity so the thumbnail reads as a curated template, not
  // a blank page. Selection map in decorationFor(); art in
  // CUISINE_DECOR. Empty string when no decoration matches.
  svg += decorationSvg(theme);

  // Title
  let y = 16;
  svg += `  <text x="${VW / 2}" y="${y}" font-family="${displayFamily}" font-size="${titlePx}" font-weight="500" fill="${ink}" text-anchor="middle">${titleText}</text>\n`;
  y += 8;

  // Optional ornament glyph for ornament-style themes
  if (theme.dividerStyle === 'ornament') {
    svg += `  <polygon points="${VW / 2 - 3},${y} ${VW / 2},${y - 3} ${VW / 2 + 3},${y} ${VW / 2},${y + 3}" fill="${accent}"/>\n`;
    y += 6;
  }

  // Section header
  y += 8;
  svg += `  <text x="${VW / 2}" y="${y}" font-family="${displayFamily}" font-size="${sectionPx}" font-weight="600" fill="${accent}" text-anchor="middle" letter-spacing="${ls}">${sectionText}</text>\n`;

  // Section divider
  y += 6;
  svg += divider(theme, y);
  y += 8;

  // Body dishes — single or two-column
  const x0 = VW * 0.10;
  const x1 = VW * 0.90;
  const rowGap = bodyPx + 4;

  if (theme.columns === 2 && dishes.length >= 2) {
    const left = dishes.slice(0, Math.ceil(dishes.length / 2));
    const right = dishes.slice(Math.ceil(dishes.length / 2));
    const midGap = VW * 0.04;
    const leftX1 = VW / 2 - midGap / 2;
    const rightX0 = VW / 2 + midGap / 2;
    left.forEach((d, i) => { svg += dishRow(theme, d, x0, leftX1, y + i * rowGap, bodyPx); });
    right.forEach((d, i) => { svg += dishRow(theme, d, rightX0, x1, y + i * rowGap, bodyPx); });
    y += Math.max(left.length, right.length) * rowGap;
  } else {
    dishes.forEach((d, i) => { svg += dishRow(theme, d, x0, x1, y + i * rowGap, bodyPx); });
    y += dishes.length * rowGap;
  }

  // Allergen pill on first dish
  if (theme.contentType !== 'tasting' &&
      theme.contentType !== 'wine' &&
      theme.contentType !== 'cocktail') {
    svg += allergenPill(theme, x0, y + 2, 'V');
  }

  // Bottom — theme name in muted body type
  let label = esc(theme.label_en || theme.id || '');
  if (label.length > 24) label = label.slice(0, 24) + '…';
  svg += `  <text x="${VW / 2}" y="${VH - 4}" font-family="${bodyFamily}" font-size="${labelPx}" font-weight="500" fill="${muted}" text-anchor="middle">${label}</text>\n`;

  svg += '</svg>\n';
  return svg;
}

// ---- Run ----------------------------------------------------------
const themes = loadThemes();
console.log(`Loaded ${themes.length} themes`);

if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });

let drift = 0;
let written = 0;
let unchanged = 0;
const seen = new Set();

for (const theme of themes) {
  if (!theme || !theme.id) continue;
  const svg = buildSvg(theme);
  const file = path.join(THUMB_DIR, theme.id + '.svg');
  seen.add(theme.id + '.svg');
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (cur === svg) { unchanged++; continue; }
  if (checkMode) { drift++; console.log(`  would update: assets/menu-design-thumbs/${theme.id}.svg`); continue; }
  fs.writeFileSync(file, svg);
  written++;
}

// Clean up orphan SVGs (themes that got renamed/removed)
const orphans = [];
if (fs.existsSync(THUMB_DIR)) {
  for (const f of fs.readdirSync(THUMB_DIR)) {
    if (!f.endsWith('.svg')) continue;
    if (seen.has(f)) continue;
    orphans.push(f);
    if (!checkMode) fs.unlinkSync(path.join(THUMB_DIR, f));
    else { drift++; console.log(`  would delete: assets/menu-design-thumbs/${f}`); }
  }
}

// Bundle every SVG into a single JS module so the picker can inline
// the SVG into the page DOM (instead of using <img>). Inline SVG
// inherits page-context @font-face declarations — the moment the
// operator's downloaded Cormorant / Playfair / Bebas / etc lands in
// /assets/fonts/ + @font-face is wired in site.css, every thumbnail
// renders in its actual typography with zero further work.
const bundleLines = [];
bundleLines.push('/**');
bundleLines.push(' * Auto-generated by scripts/build-theme-thumbnails.mjs.');
bundleLines.push(' * Inline SVG strings keyed by theme id. Picker JS inlines via');
bundleLines.push(' * innerHTML so the SVG <text> elements use whatever @font-face');
bundleLines.push(' * fonts the page has loaded. Edit themes.js + re-run, never edit');
bundleLines.push(' * this file directly.');
bundleLines.push(' */');
bundleLines.push('(function (root) {');
bundleLines.push('  \'use strict\';');
bundleLines.push('  var THUMBS = {');
for (const theme of themes) {
  if (!theme || !theme.id) continue;
  // Re-build the SVG so the bundle and the per-file SVGs always agree.
  const svg = buildSvg(theme).replace(/\n/g, '\\n').replace(/'/g, "\\'");
  bundleLines.push(`    '${theme.id}': '${svg}',`);
}
bundleLines.push('  };');
bundleLines.push('  var api = { THUMBS: THUMBS, get: function (id) { return THUMBS[id] || null; } };');
bundleLines.push('  if (typeof module !== \'undefined\' && module.exports) module.exports = api;');
bundleLines.push('  if (root) root.MD_THUMBS = api;');
bundleLines.push('})(typeof window !== \'undefined\' ? window : null);');
const bundleBody = bundleLines.join('\n') + '\n';
const bundleCur  = fs.existsSync(THUMB_JS) ? fs.readFileSync(THUMB_JS, 'utf8') : '';
let bundleDrift  = 0;
if (bundleCur !== bundleBody) {
  if (checkMode) {
    bundleDrift = 1;
    console.log('  would update: tools/menu-design/theme-thumbs.js');
  } else {
    fs.writeFileSync(THUMB_JS, bundleBody);
    console.log('wrote: tools/menu-design/theme-thumbs.js (' + Math.round(bundleBody.length / 1024) + ' KB raw)');
  }
}

if (checkMode) {
  if (drift + bundleDrift > 0) {
    console.log(`\nTheme thumbnail drift: ${drift + bundleDrift} item(s) need re-generation.`);
    console.log(`Run: node scripts/build-theme-thumbnails.mjs`);
    process.exit(1);
  }
  console.log(`Theme thumbnails: ${themes.length} themes; ${unchanged} unchanged; bundle in sync; 0 drift.`);
} else {
  console.log(`Theme thumbnails: ${written} written, ${unchanged} unchanged, ${orphans.length} orphan(s) removed.`);
}
