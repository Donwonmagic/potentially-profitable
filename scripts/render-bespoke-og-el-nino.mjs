// Bespoke OG card for the El Niño / food-prices dispatch (EN + ES).
//
// Not a cards.json template — a hand-composed share image for this one post.
// Concept: "loud sky, calm receipt." From today, two lines diverge — El Niño
// intensifying (rust, 81%) and the food-price index easing (brand blue, -0.3%)
// — read through the whisper-muntin window field. On the 2026 "Golden Hour"
// brand system (data/muntin.tokens.json spine + build-og-cards.mjs palette).
//
//   node scripts/render-bespoke-og-el-nino.mjs
//
// Renders 2400x1260 PNGs (2x the 1200x630 og:image viewBox) to brand/og/.
// resvg-js is loaded from /tmp/og-render-deps (npm i --prefix there if missing);
// fonts come from assets/fonts/pdf (Fraunces + Inter .ttf).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTS_DIR = path.join(REPO, 'assets', 'fonts', 'pdf');
const OUT_DIR = path.join(REPO, 'brand', 'og');

const P = {
  ink: '#16181D', cream: '#F6F7F8', blue: '#2A50C8', rust: '#C42E2E',
  gold: '#FFB020', coral: '#FF6B5C', muted: '#4A4F59', rule: '#E3E5E9',
};
const W = 1200, H = 630;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Whisper-muntin field: the brand window grid tiled as a ~4.5% texture.
function muntinField() {
  const cell = 140, inset = 18, inner = cell - inset * 2, lintel = Math.round(inner * 0.35);
  return `
  <pattern id="muntin" x="0" y="0" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">
    <g transform="translate(${inset},${inset})" fill="none" stroke="${P.ink}" stroke-width="1.5" stroke-linecap="square">
      <rect x="0" y="0" width="${inner}" height="${inner}"/>
      <line x1="${inner / 2}" y1="0" x2="${inner / 2}" y2="${inner}"/>
      <line x1="0" y1="${lintel}" x2="${inner}" y2="${lintel}"/>
    </g>
  </pattern>`;
}

function card(t) {
  // right-side diverging viz — shared origin "today", El Niño up, food prices down
  const ox = 656, oy = 316;                 // origin ("today")
  const rustEnd = [892, 210], blueEnd = [892, 424];
  const rustPath = `M ${ox} ${oy} C 744 302, 806 254, ${rustEnd[0]} ${rustEnd[1]}`;
  const bluePath = `M ${ox} ${oy} C 744 330, 806 380, ${blueEnd[0]} ${blueEnd[1]}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${muntinField()}
    <radialGradient id="dawn" cx="88%" cy="6%" r="70%">
      <stop offset="0%" stop-color="${P.gold}" stop-opacity="0.20"/>
      <stop offset="34%" stop-color="${P.coral}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${P.coral}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="${P.cream}"/>
  <rect width="${W}" height="${H}" fill="url(#muntin)" opacity="0.05"/>
  <rect width="${W}" height="${H}" fill="url(#dawn)"/>
  <rect x="0" y="0" width="10" height="${H}" fill="${P.blue}"/>

  <!-- left column -->
  <text x="80" y="120" font-family="Inter, sans-serif" font-size="17" font-weight="600" letter-spacing="2.6" fill="${P.muted}">${esc(t.eyebrow)}</text>

  <text x="78" y="216" font-family="Fraunces, Georgia, serif" font-size="${t.h1size}" font-weight="600" fill="${P.ink}" letter-spacing="-0.5">${esc(t.h1a)}</text>
  <text x="78" y="${216 + t.h1lh}" font-family="Fraunces, Georgia, serif" font-size="${t.h1size}" font-weight="600" fill="${P.ink}" letter-spacing="-0.5">${esc(t.h1b)}</text>

  <text x="80" y="${300 + t.h1lh}" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="33" font-weight="500" fill="${P.blue}">${esc(t.h2a)}</text>
  <text x="80" y="${342 + t.h1lh}" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="33" font-weight="500" fill="${P.blue}">${esc(t.h2b)}</text>

  <!-- right column: diverge-from-today -->
  <line x1="${ox}" y1="150" x2="${ox}" y2="486" stroke="${P.rule}" stroke-width="2"/>
  <text x="${ox}" y="140" font-family="Inter, sans-serif" font-size="13" font-weight="600" letter-spacing="1.5" fill="${P.muted}" text-anchor="middle">${esc(t.today)}</text>

  <path d="${rustPath}" fill="none" stroke="${P.rust}" stroke-width="5" stroke-linecap="round"/>
  <path d="${bluePath}" fill="none" stroke="${P.blue}" stroke-width="5" stroke-linecap="round"/>
  <circle cx="${ox}" cy="${oy}" r="7" fill="${P.ink}"/>
  <circle cx="${rustEnd[0]}" cy="${rustEnd[1]}" r="7" fill="${P.rust}"/>
  <circle cx="${blueEnd[0]}" cy="${blueEnd[1]}" r="7" fill="${P.blue}"/>

  <!-- dotted leaders bridge each endpoint to its value (clear air, still linked) -->
  <line x1="${rustEnd[0] + 14}" y1="${rustEnd[1]}" x2="1030" y2="${rustEnd[1]}" stroke="${P.rust}" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round" opacity="0.45"/>
  <line x1="${blueEnd[0] + 14}" y1="${blueEnd[1]}" x2="998" y2="${blueEnd[1]}" stroke="${P.blue}" stroke-width="2.5" stroke-dasharray="1 7" stroke-linecap="round" opacity="0.45"/>

  <!-- on-line labels -->
  <text x="752" y="232" font-family="Inter, sans-serif" font-size="19" font-weight="700" fill="${P.rust}" text-anchor="middle">${esc(t.up)} &#8593;</text>
  <text x="748" y="424" font-family="Inter, sans-serif" font-size="19" font-weight="700" fill="${P.blue}" text-anchor="middle">${esc(t.down)} &#8595;</text>

  <!-- payoff numbers, well clear of the line endpoints -->
  <text x="1120" y="226" font-family="Fraunces, Georgia, serif" font-size="46" font-weight="600" fill="${P.rust}" text-anchor="end">81%</text>
  <text x="1120" y="248" font-family="Inter, sans-serif" font-size="13" fill="${P.muted}" text-anchor="end">${esc(t.upSub)}</text>
  <text x="1120" y="440" font-family="Fraunces, Georgia, serif" font-size="42" font-weight="600" fill="${P.blue}" text-anchor="end">&#8722;0.3%</text>
  <text x="1120" y="462" font-family="Inter, sans-serif" font-size="13" fill="${P.muted}" text-anchor="end">${esc(t.downSub)}</text>

  <!-- footer -->
  <line x1="80" y1="545" x2="1120" y2="545" stroke="${P.rule}" stroke-width="1.5"/>
  <text x="80" y="578" font-family="Inter, sans-serif" font-size="16" font-weight="500" fill="${P.muted}">${esc(t.by)}</text>
  <text x="1120" y="578" font-family="Inter, sans-serif" font-size="16" font-weight="600" letter-spacing="0.4" fill="${P.ink}" text-anchor="end">muntin.digital</text>
</svg>`;
}

const EN = {
  eyebrow: 'THE COST INDEX · DISPATCH',
  h1a: 'A historic El Niño', h1b: 'is forming.', h1size: 54, h1lh: 62,
  h2a: 'Your food invoices', h2b: "haven't noticed.",
  today: 'TODAY', up: 'El Niño', down: 'Food prices',
  upSub: 'very strong · NOAA', downSub: 'FAO index · June',
  by: 'By Don Goldstein',
};
const ES = {
  eyebrow: 'EL ÍNDICE DE COSTOS · DESPACHO',
  h1a: 'Se forma un El Niño', h1b: 'histórico.', h1size: 50, h1lh: 60,
  h2a: 'Tus facturas de comida', h2b: 'no se han enterado.',
  today: 'HOY', up: 'El Niño', down: 'Precios',
  upSub: 'muy fuerte · NOAA', downSub: 'índice FAO · junio',
  by: 'Por Don Goldstein',
};

const { Resvg } = await import('/tmp/og-render-deps/node_modules/@resvg/resvg-js/index.js');
const fontFiles = fs.readdirSync(FONTS_DIR).filter((f) => f.endsWith('.ttf')).map((f) => path.join(FONTS_DIR, f));

for (const [lang, t, slug] of [
  ['en', EN, 'blog-el-nino-food-prices-2026'],
  ['es', ES, 'blog-el-nino-y-precios-de-alimentos-2026'],
]) {
  const svg = card(t);
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: 2400 },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  });
  const out = path.join(OUT_DIR, `${slug}.png`);
  fs.writeFileSync(out, r.render().asPng());
  console.log(`wrote ${out} (${lang})`);
}
