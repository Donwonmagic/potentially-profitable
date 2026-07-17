// Bespoke OG card for the 2026 restaurant cost-storm dispatch (EN only).
//
// Not a cards.json template — a hand-composed share image for this one post.
// Concept: "the calm pane, five fronts pushing." A muntin window pane holds the
// tame menu average (+3.4%); five colored pressure arrows press inward on it
// from every side — BEEF (rust), COFFEE (coral), TARIFFS (gold), LABOR (muted),
// CARDS (blue) — the P&L squeezed on five clocks under one calm number. On the
// 2026 "Golden Hour" brand system (build-og-cards.mjs palette + muntin field).
//
//   node scripts/render-bespoke-og-cost-storm.mjs
//
// Renders a 2400x1260 PNG (2x the 1200x630 og:image viewBox) to brand/og/.
// resvg-js is loaded from /tmp/og-render-deps; fonts from assets/fonts/pdf.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTS_DIR = path.join(REPO, 'assets', 'fonts', 'pdf');
const OUT_DIR = path.join(REPO, 'brand', 'og');

const P = {
  ink: '#16181D', cream: '#F6F7F8', blue: '#2A50C8', rust: '#C42E2E',
  gold: '#E08A00', coral: '#FF6B5C', muted: '#4A4F59', rule: '#E3E5E9',
  paneEdge: '#C9CCD3',
};
const W = 1200, H = 630;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Whisper-muntin field: the brand window grid tiled as a ~5% texture.
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

// A pressure arrow: shaft from (x1,y1) toward a tip at (x2,y2), triangular head.
function arrow(x1, y1, x2, y2, color, w = 8, head = 20) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const bx = x2 - ux * head, by = y2 - uy * head;
  const px = -uy, py = ux, hw = head * 0.62;
  const a = [bx + px * hw, by + py * hw], b = [bx - px * hw, by - py * hw];
  return `<line x1="${x1}" y1="${y1}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
  <polygon points="${x2},${y2} ${a[0].toFixed(1)},${a[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}" fill="${color}"/>`;
}

function card() {
  // Pentagon of five fronts pressing inward on the calm menu average.
  const cx = 942, cy = 322, paneR = 92;
  const tailR = 140, tipR = 98, labelR = 160, ringR = 140;

  // Five fronts at pentagon vertices, clockwise from the crown (top).
  // Arrow strokes keep the bright pressure hue; the two warm labels
  // (coral, gold) get a darker fill so they clear 3:1 on the cream pane
  // even in a downscaled social thumbnail.
  const fronts = [
    { name: 'BEEF',    color: P.rust,  ang: -90 },
    { name: 'COFFEE',  color: P.coral, labelColor: '#C7452F', ang: -18 },
    { name: 'CARDS',   color: P.blue,  ang: 54 },
    { name: 'LABOR',   color: P.muted, ang: 126 },
    { name: 'TARIFFS', color: P.gold,  labelColor: '#B26B00', ang: 198 },
  ];
  const pt = (r, ang) => {
    const a = (ang * Math.PI) / 180;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  // Faint pentagon frame through the arrow tails.
  const ring = fronts.map((f) => pt(ringR, f.ang).map((n) => n.toFixed(1)).join(',')).join(' ');

  // Arrows + labels.
  const spokes = fronts.map((f) => {
    const [tx, ty] = pt(tailR, f.ang);
    const [px, py] = pt(tipR, f.ang);
    const [lx, ly] = pt(labelR, f.ang);
    const ux = Math.cos((f.ang * Math.PI) / 180);
    const uy = Math.sin((f.ang * Math.PI) / 180);
    const anchor = ux > 0.25 ? 'start' : ux < -0.25 ? 'end' : 'middle';
    const dy = Math.abs(uy) < 0.3 ? 6 : uy < 0 ? -4 : 18; // center sides, lift crown, drop base
    return `${arrow(tx, ty, px, py, f.color)}
  <text x="${lx.toFixed(1)}" y="${(ly + dy).toFixed(1)}" font-family="Inter, sans-serif" font-size="19" font-weight="700" fill="${f.labelColor || f.color}" text-anchor="${anchor}">${f.name}</text>`;
  }).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${muntinField()}
    <radialGradient id="dawn" cx="88%" cy="6%" r="80%">
      <stop offset="0%" stop-color="${P.gold}" stop-opacity="0.16"/>
      <stop offset="30%" stop-color="${P.coral}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${P.coral}" stop-opacity="0"/>
    </radialGradient>
    <filter id="paneShadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="6" stdDeviation="11" flood-color="${P.ink}" flood-opacity="0.10"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="${P.cream}"/>
  <rect width="${W}" height="${H}" fill="url(#muntin)" opacity="0.05"/>
  <rect width="${W}" height="${H}" fill="url(#dawn)"/>
  <rect x="0" y="0" width="10" height="${H}" fill="${P.blue}"/>

  <!-- left column -->
  <text x="80" y="120" font-family="Inter, sans-serif" font-size="17" font-weight="600" letter-spacing="2.6" fill="${P.muted}">THE COST INDEX &#183; DISPATCH</text>

  <text x="78" y="232" font-family="Fraunces, Georgia, serif" font-size="43" font-weight="600" fill="${P.ink}" letter-spacing="-0.5">The menu looks calm.</text>
  <text x="78" y="294" font-family="Fraunces, Georgia, serif" font-style="italic" font-size="43" font-weight="600" fill="${P.blue}" letter-spacing="-0.5">Five fronts are pushing.</text>

  <text x="80" y="356" font-family="Inter, sans-serif" font-size="19" font-weight="500" fill="${P.muted}">One tame average. Five clocks.</text>
  <text x="80" y="388" font-family="Inter, sans-serif" font-size="19" font-weight="600" fill="${P.ink}">42% of operators didn&#8217;t profit.</text>

  <!-- pentagon frame -->
  <polygon points="${ring}" fill="none" stroke="${P.paneEdge}" stroke-width="1.5" opacity="0.5" stroke-linejoin="round"/>

  <!-- the calm pane at the center -->
  <g filter="url(#paneShadow)">
    <circle cx="${cx}" cy="${cy}" r="${paneR}" fill="${P.cream}" stroke="${P.paneEdge}" stroke-width="2"/>
  </g>
  <text x="${cx}" y="${cy - 36}" font-family="Inter, sans-serif" font-size="13" font-weight="600" letter-spacing="1.5" fill="${P.muted}" text-anchor="middle">MENU &#183; 2026</text>
  <text x="${cx}" y="${cy + 18}" font-family="Fraunces, Georgia, serif" font-size="54" font-weight="600" fill="${P.blue}" text-anchor="middle">+3.4%</text>
  <text x="${cx}" y="${cy + 58}" font-family="Inter, sans-serif" font-size="14" fill="${P.muted}" text-anchor="middle">the calm average</text>

  <!-- five fronts pressing inward -->
  ${spokes}

  <!-- footer -->
  <line x1="80" y1="545" x2="1120" y2="545" stroke="${P.rule}" stroke-width="1.5"/>
  <text x="80" y="578" font-family="Inter, sans-serif" font-size="16" font-weight="500" fill="${P.muted}">By Don Goldstein</text>
  <text x="1120" y="578" font-family="Inter, sans-serif" font-size="16" font-weight="600" letter-spacing="0.4" fill="${P.ink}" text-anchor="end">muntin.digital</text>
</svg>`;
}

const { Resvg } = await import('/tmp/og-render-deps/node_modules/@resvg/resvg-js/index.js');
const fontFiles = fs.readdirSync(FONTS_DIR).filter((f) => f.endsWith('.ttf')).map((f) => path.join(FONTS_DIR, f));

const svg = card();
fs.writeFileSync(path.join(OUT_DIR, 'blog-restaurant-cost-pressure-2026.svg'), svg);
const r = new Resvg(svg, {
  fitTo: { mode: 'width', value: 2400 },
  font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' },
});
const out = path.join(OUT_DIR, 'blog-restaurant-cost-pressure-2026.png');
fs.writeFileSync(out, r.render().asPng());
console.log(`wrote ${out}`);
