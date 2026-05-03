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
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const THUMB_DIR = path.join(repoRoot, 'assets/menu-design-thumbs');
const THUMB_JS  = path.join(repoRoot, 'tools/menu-design/theme-thumbs.js');
const VW = 220, VH = 120;

// ---- Load themes.js via vm sandbox -------------------------------
function loadThemes() {
  const src = fs.readFileSync(path.join(repoRoot, 'tools/menu-design/themes.js'), 'utf8');
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

// ---- Muntin cuisine-decoration library ---------------------------
// Each cuisine cluster gets a tasteful low-opacity motif rendered
// behind the menu content. Drawn in 24-unit local coords; emitted
// inside a <g transform="translate(...) scale(...)"> so positioning
// is consistent. Stroke-current-style + fill-current so the theme's
// muted/accent color carries through without per-decoration tuning.
//
// Visual language: single-stroke line art, 1.0–1.4 unit weight,
// 12% opacity. Goal is to suggest cuisine identity at a glance
// without competing with the menu typography.
const CUISINE_DECOR = {
  // Italian — olive branch in top-right corner
  'olive-branch': {
    paths: [
      'M2 12 Q9 8 18 5',                                  // stem
      'M5 11 Q3 8 1 9 Q3 11 5 11',                        // leaf 1
      'M9 9.5 Q7 6 5 7 Q7 9 9 10',                        // leaf 2
      'M13 8 Q11 5 9 6 Q11 8 13 8.5',                     // leaf 3
      'M16 6.7 Q14 4 12 5 Q14 7 16 7.3'                   // leaf 4
    ],
    extras: ['<circle cx="17" cy="5.4" r="0.6"/>',         // olive 1
             '<circle cx="14" cy="6.5" r="0.55"/>',        // olive 2
             '<circle cx="11" cy="7.7" r="0.5"/>']         // olive 3
  },
  // Mexican — talavera-tile rosette
  'talavera': {
    paths: [
      'M12 2 L13 8 L19 7 L14 11 L18 17 L12 14 L6 17 L10 11 L5 7 L11 8 Z'
    ],
    extras: ['<circle cx="12" cy="11" r="1.2"/>',
             '<circle cx="12" cy="11" r="2.4" fill="none" stroke="currentColor" stroke-width="0.4"/>']
  },
  // French — fleur-de-lis
  'fleur-de-lis': {
    paths: [
      'M12 3 Q11 7 8 9 Q10 10 11 13 L11 19 Q9 17 6 17 Q9 15 9 12 Q11 11 12 8',
      'M12 3 Q13 7 16 9 Q14 10 13 13 L13 19 Q15 17 18 17 Q15 15 15 12 Q13 11 12 8',
      'M9 13 L15 13'
    ],
    extras: []
  },
  // Asian (general / Japanese / Vietnamese / Korean) — minimalist crane
  'crane': {
    paths: [
      'M3 14 Q8 12 11 13 L13 13 Q15 11 18 8 L20 7',       // body + neck
      'M11 13 Q11 16 9 18 M11 13 Q12 16 11 18',           // legs
      'M19.5 7.5 L21 6.5 M19.5 7.5 L20.5 8.5'             // beak
    ],
    extras: ['<circle cx="19" cy="7.8" r="0.35"/>']
  },
  // Seafood / coastal — gentle wave at top
  'wave': {
    paths: [
      'M0 6 Q3 3 6 6 T12 6 T18 6 T24 6',
      'M0 9.5 Q3 7 6 9.5 T12 9.5 T18 9.5 T24 9.5'
    ],
    extras: []
  },
  // Steakhouse / formal — laurel wreath corner
  'laurel': {
    paths: [
      'M3 18 Q5 14 8 12 Q11 10 13 8 Q15 6 17 5',          // arc
      'M5 16 L7 17 M7 14 L9 15 M9 12 L11 13 M11 10 L13 11 M13 8 L15 9 M15 6 L17 7'
    ],
    extras: []
  },
  // Cafe / bakery — coffee bean cluster
  'coffee-bean': {
    paths: [
      'M5 5 Q7 3 9 5 Q7 7 5 5 M5 5 Q7 5 9 5',
      'M11 8 Q13 6 15 8 Q13 10 11 8 M11 8 Q13 8 15 8',
      'M7 12 Q9 10 11 12 Q9 14 7 12 M7 12 Q9 12 11 12'
    ],
    extras: []
  },
  // Tasting / omakase — single sumi-e brush stroke
  'brush-stroke': {
    paths: [
      'M2 14 Q6 6 14 9 Q19 11 22 7'
    ],
    extras: ['<circle cx="22" cy="7" r="0.7"/>']
  },
  // Wine list — grape cluster
  'grape-cluster': {
    paths: [
      'M12 2 Q14 4 13 7',                                 // stem
      'M11 7 L13 7'
    ],
    extras: [
      '<circle cx="10" cy="9" r="1.6"/>',
      '<circle cx="14" cy="9" r="1.6"/>',
      '<circle cx="8" cy="12" r="1.6"/>',
      '<circle cx="12" cy="12" r="1.6"/>',
      '<circle cx="16" cy="12" r="1.6"/>',
      '<circle cx="10" cy="15" r="1.6"/>',
      '<circle cx="14" cy="15" r="1.6"/>',
      '<circle cx="12" cy="18" r="1.6"/>'
    ]
  },
  // Cocktail / deco — radiating fan
  'deco-fan': {
    paths: [
      'M12 20 L4 6 M12 20 L7 5 M12 20 L12 4 M12 20 L17 5 M12 20 L20 6',
      'M4 6 Q12 2 20 6'
    ],
    extras: []
  },
  // Pizza counter — slice with topping dots
  'pizza-slice': {
    paths: [
      'M12 3 L4 19 L20 19 Z',                             // slice
      'M5 17 L19 17'                                       // crust line
    ],
    extras: [
      '<circle cx="10" cy="11" r="0.9"/>',
      '<circle cx="14" cy="11" r="0.9"/>',
      '<circle cx="12" cy="14" r="0.9"/>'
    ]
  },
  // BBQ / brewpub — wood grain
  'wood-grain': {
    paths: [
      'M0 4 Q6 5 12 4 T24 4',
      'M0 9 Q6 10 12 9 T24 9',
      'M0 14 Q6 13 12 14 T24 14',
      'M0 19 Q6 20 12 19 T24 19'
    ],
    extras: []
  },
  // Plant-forward / farm — leaf cluster
  'leaf-cluster': {
    paths: [
      'M12 4 Q8 8 8 14 Q12 12 12 18',                     // leaf 1 (left)
      'M12 4 Q16 8 16 14 Q12 12 12 18',                   // leaf 2 (right)
      'M12 4 L12 18'                                       // central spine
    ],
    extras: []
  },
  // Kids — confetti dots
  'confetti': {
    paths: [],
    extras: [
      '<circle cx="3" cy="4" r="1.2"/>',
      '<circle cx="20" cy="3" r="1"/>',
      '<circle cx="6" cy="14" r="0.9"/>',
      '<circle cx="18" cy="13" r="1.3"/>',
      '<circle cx="11" cy="6" r="0.8"/>',
      '<circle cx="14" cy="18" r="1.1"/>',
      '<circle cx="22" cy="9" r="0.7"/>',
      '<rect x="2" y="11" width="2" height="2" transform="rotate(20 3 12)"/>',
      '<rect x="20" y="17" width="1.6" height="1.6" transform="rotate(35 20.8 17.8)"/>'
    ]
  },
  // Tapas / spanish — geometric tile star
  'spanish-tile': {
    paths: [
      'M12 2 L15 9 L22 9 L17 13 L19 20 L12 16 L5 20 L7 13 L2 9 L9 9 Z'
    ],
    extras: ['<circle cx="12" cy="12" r="1.5" fill="none" stroke="currentColor" stroke-width="0.5"/>']
  },
  // Diner / breakfast — coffee cup with steam
  'coffee-cup': {
    paths: [
      'M5 12 L5 17 Q5 19 7 19 L15 19 Q17 19 17 17 L17 12 Z',
      'M17 13 Q20 13 20 16 Q20 18 17 18',                  // handle
      'M8 6 Q9 8 8 10 M11 5 Q12 7 11 9 M14 6 Q15 8 14 10'  // steam
    ],
    extras: []
  }
};

// Map cuisineHint patterns to a decoration key + position+scale.
// Returns {key, x, y, s} or null when no decoration fits.
function decorationFor(theme) {
  const ct = theme.contentType || 'standard';
  const ch = (theme.cuisineHint || []).map(String);
  const has = re => ch.some(s => re.test(s));

  // Content-type wins (tasting / wine / cocktail / dessert / kids)
  if (ct === 'tasting')  return { key: 'brush-stroke', x: 8, y: 88, s: 1.3 };
  if (ct === 'wine')     return { key: 'grape-cluster', x: 178, y: 38, s: 1.2 };
  if (ct === 'cocktail') return { key: 'deco-fan',     x: 178, y: 38, s: 1.3 };
  if (ct === 'kids')     return { key: 'confetti',     x: 0,   y: 0,  s: 4 };

  if (has(/italian|trattor|pasta/i))                  return { key: 'olive-branch', x: 175, y: 38, s: 1.4 };
  if (has(/mexic|taco|cantina/i))                     return { key: 'talavera',     x: 178, y: 38, s: 1.3 };
  if (has(/french|bistro|francesa|brasser/i))         return { key: 'fleur-de-lis', x: 180, y: 36, s: 1.4 };
  if (has(/japan|ramen|sushi|izakaya|noodle/i))       return { key: 'crane',        x: 4,   y: 86, s: 1.3 };
  if (has(/asian|thai|viet|kor/i))                    return { key: 'crane',        x: 4,   y: 86, s: 1.3 };
  if (has(/seafood|oyster|fish|maris|pesc|raw bar/i)) return { key: 'wave',         x: 0,   y: 0,  s: 9.2 };
  if (has(/steak|chop|parr|asad|grill/i))             return { key: 'laurel',       x: 175, y: 36, s: 1.5 };
  if (has(/cafe|café|bakery|patisser|coffee/i))       return { key: 'coffee-bean',  x: 178, y: 38, s: 1.3 };
  if (has(/pizza|slice/i))                            return { key: 'pizza-slice',  x: 178, y: 38, s: 1.3 };
  if (has(/bbq|barbec|smoke|brisket|brewpub|brewery/i)) return { key: 'wood-grain', x: 0,   y: 28, s: 9.2 };
  if (has(/farm|garden|plant|seasonal/i))             return { key: 'leaf-cluster', x: 178, y: 36, s: 1.4 };
  if (has(/tapas|pinchos|spanish|andaluz/i))          return { key: 'spanish-tile', x: 178, y: 38, s: 1.3 };
  if (has(/diner|breakfast|burger/i))                 return { key: 'coffee-cup',   x: 178, y: 36, s: 1.4 };
  if (has(/dessert|patisserie|dolci/i))               return { key: 'leaf-cluster', x: 178, y: 36, s: 1.4 };
  return null;
}

// Render the decoration as an inline <g>. Color = theme.muted at
// 12% opacity (16% for kids/tasting/wave variants). Stroke 1.0-unit.
function decorationSvg(theme) {
  const dec = decorationFor(theme);
  if (!dec) return '';
  const motif = CUISINE_DECOR[dec.key];
  if (!motif) return '';
  const muted = theme.muted || theme.accent || '#7C6F60';
  const opacity = (dec.key === 'kids' || dec.key === 'wave' || dec.key === 'wood-grain') ? 0.10 : 0.13;
  const sw = dec.key === 'wave' || dec.key === 'wood-grain' || dec.key === 'brush-stroke' ? 1.4 : 1.0;
  let inner = '';
  motif.paths.forEach(d => {
    inner += `    <path d="${d}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  });
  motif.extras.forEach(e => {
    // extras are pre-built SVG fragments; default fill=currentColor unless overridden
    inner += '    ' + (e.includes('fill=') ? e : e.replace(/<(circle|rect)/, '<$1 fill="currentColor"')) + '\n';
  });
  return `  <g transform="translate(${dec.x} ${dec.y}) scale(${dec.s})" color="${muted}" opacity="${opacity}" aria-hidden="true">\n${inner}  </g>\n`;
}

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
