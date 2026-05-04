#!/usr/bin/env node
// Regenerates TTF font files at /assets/fonts/pdf/ from the WOFF2
// sources at /assets/fonts/. The TTFs are consumed by jsPDF (via
// addFileToVFS + addFont) inside two tools:
//
//   1. tools/audits/restaurant/ — Fraunces + Inter (Muntin's body faces).
//   2. tools/menu-design/      — adds Cormorant Garamond, Playfair
//                                Display, Quattrocento, Noto Serif,
//                                Cormorant SC, Bebas Neue, Alfa Slab.
//                                Each face matches a theme's display
//                                font so the printed menu looks set,
//                                not rendered.
//
// jsPDF 2.x's addFont API only understands uncompressed TTF/OTF, so
// the site's WOFF2 assets need a one-time conversion. The generated
// TTFs are checked in so production never runs this script — rerun
// this only when the upstream WOFF2 files change.
//
//   Requirements: npm i -D wawoff2
//   Usage:        node scripts/build-pdf-fonts.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import wawoff from 'wawoff2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '../assets/fonts');
const DST = path.resolve(__dirname, '../assets/fonts/pdf');

const FONTS = [
  // Site-wide body faces (used by the restaurant audit tool).
  ['fraunces-v38-latin-regular.woff2', 'fraunces-400.ttf'],
  ['fraunces-v38-latin-500.woff2',     'fraunces-500.ttf'],
  ['fraunces-v38-latin-600.woff2',     'fraunces-600.ttf'],
  ['inter-v20-latin-regular.woff2',    'inter-400.ttf'],
  ['inter-v20-latin-500.woff2',        'inter-500.ttf'],
  ['inter-v20-latin-600.woff2',        'inter-600.ttf'],
  // Menu Design Suite display + body faces. Matches the theme display
  // hints in tools/menu-design/themes.js so cocktail-deco prints in
  // Playfair, trattoria in Quattrocento, tasting-omakase in Cormorant,
  // pizza-counter / food-truck / bbq-smoke in Bebas, kids-bright in
  // Alfa Slab, and Noto Serif as a general European fallback.
  ['cormorant-garamond-v21-latin/cormorant-garamond-v21-latin-regular.woff2', 'cormorant-400.ttf'],
  ['cormorant-garamond-v21-latin/cormorant-garamond-v21-latin-italic.woff2',  'cormorant-400i.ttf'],
  ['cormorant-garamond-v21-latin/cormorant-garamond-v21-latin-600.woff2',     'cormorant-600.ttf'],
  ['cormorant-sc-v19-latin-regular.woff2',                                    'cormorant-sc-400.ttf'],
  ['playfair-display-v40-latin/playfair-display-v40-latin-regular.woff2',     'playfair-400.ttf'],
  ['playfair-display-v40-latin/playfair-display-v40-latin-italic.woff2',      'playfair-400i.ttf'],
  ['playfair-display-v40-latin/playfair-display-v40-latin-700.woff2',         'playfair-700.ttf'],
  ['quattrocento-v24-latin/quattrocento-v24-latin-regular.woff2',             'quattrocento-400.ttf'],
  ['quattrocento-v24-latin/quattrocento-v24-latin-700.woff2',                 'quattrocento-700.ttf'],
  ['noto-serif-v33-latin/noto-serif-v33-latin-regular.woff2',                 'noto-serif-400.ttf'],
  ['noto-serif-v33-latin/noto-serif-v33-latin-italic.woff2',                  'noto-serif-400i.ttf'],
  ['bebas-neue-v16-latin-regular.woff2',                                      'bebas-neue-400.ttf'],
  ['alfa-slab-one-v21-latin-regular.woff2',                                   'alfa-slab-400.ttf']
];

fs.mkdirSync(DST, { recursive: true });

let total = 0;
for (const [srcName, dstName] of FONTS) {
  const srcPath = path.join(SRC, srcName);
  const dstPath = path.join(DST, dstName);
  const woff2   = fs.readFileSync(srcPath);
  const ttf     = await wawoff.decompress(woff2);
  const bytes   = Buffer.from(ttf);
  fs.writeFileSync(dstPath, bytes);
  total += bytes.length;
  console.log(`${dstName.padEnd(24)} ${bytes.length.toString().padStart(7)} bytes`);
}
console.log(`${'TOTAL'.padEnd(24)} ${total.toString().padStart(7)} bytes`);
