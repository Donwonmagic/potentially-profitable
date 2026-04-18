#!/usr/bin/env node
// Regenerates TTF font files at /assets/fonts/pdf/ from the WOFF2
// sources at /assets/fonts/. The TTFs are consumed by jsPDF inside
// the restaurant audit tool (tools/audits/restaurant/index.html) via
// addFileToVFS + addFont so the generated PDF renders in Fraunces and
// Inter — the real Muntin typefaces — instead of jsPDF's Helvetica
// default.
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
  ['fraunces-v38-latin-regular.woff2', 'fraunces-400.ttf'],
  ['fraunces-v38-latin-500.woff2',     'fraunces-500.ttf'],
  ['fraunces-v38-latin-600.woff2',     'fraunces-600.ttf'],
  ['inter-v20-latin-regular.woff2',    'inter-400.ttf'],
  ['inter-v20-latin-500.woff2',        'inter-500.ttf'],
  ['inter-v20-latin-600.woff2',        'inter-600.ttf']
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
  console.log(`${dstName.padEnd(20)} ${bytes.length.toString().padStart(7)} bytes`);
}
console.log(`${'TOTAL'.padEnd(20)} ${total.toString().padStart(7)} bytes`);
