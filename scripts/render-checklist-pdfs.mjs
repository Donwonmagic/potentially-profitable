#!/usr/bin/env node
// Render the restaurant + wellness checklist pages to static PDFs
// that live alongside each page and are linked as direct downloads
// from the "Save it for later" section.
//
// Run this whenever the checklist content or the print CSS changes:
//
//   node scripts/render-checklist-pdfs.mjs
//
// Starts a short-lived static server on port 8734, renders both pages
// with Puppeteer's print pipeline (@media print CSS + headerTemplate/
// footerTemplate running footer), writes Letter-size PDFs next to the
// source HTML files, then shuts the server down.
//
// Puppeteer draws the running footer via footerTemplate rather than
// CSS position:fixed — Chrome's print engine doesn't reserve page
// space for position:fixed content, so a CSS-only footer would overlay
// body text at the page break.

import { spawn } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PORT = 8734;
const BASE = `http://127.0.0.1:${PORT}`;

const targets = [
  {
    url: `${BASE}/resources/restaurant-website-checklist/`,
    out: 'resources/restaurant-website-checklist/muntin-restaurant-website-checklist.pdf',
  },
  {
    url: `${BASE}/resources/wellness-website-checklist/`,
    out: 'resources/wellness-website-checklist/muntin-wellness-website-checklist.pdf',
  },
];

// Running footer: attribution + Score fill-in + double rule.
// Rendered by Chrome in the reserved bottom page margin, so it sits
// below body content on every page without overlapping.
const FOOTER = `
<style>
  .muntin-foot {
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    font-size: 7.5pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #555;
    width: 100%;
    padding: 6pt 0.55in 0;
    margin: 0 auto;
    border-top: 3pt double #111;
    text-align: center;
    -webkit-print-color-adjust: exact;
    box-sizing: border-box;
  }
  .muntin-foot .sep { padding: 0 10pt; }
  .muntin-foot .score-line {
    display: inline-block;
    width: 90pt;
    border-bottom: 0.8pt solid #111;
    vertical-align: -1pt;
    margin-left: 6pt;
    height: 10pt;
  }
</style>
<div class="muntin-foot">
  Muntin Digital<span class="sep">&middot;</span>muntin.digital<span class="sep">&middot;</span>Score<span class="score-line"></span>
</div>`;
const HEADER = '<span></span>'; // empty — suppress Chrome's default date/URL stamp

async function main() {
  // 1. Start a simple static server from the repo root.
  const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
    cwd: ROOT,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  // Give the server a moment to bind.
  await sleep(800);

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
    });

    for (const t of targets) {
      const page = await browser.newPage();
      await page.emulateMediaType('print');
      await page.goto(t.url, { waitUntil: 'networkidle0', timeout: 30000 });
      // Let the page's self-hosted webfonts finish loading.
      await page.evaluateHandle('document.fonts.ready');

      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: HEADER,
        footerTemplate: FOOTER,
        // Bottom margin reserves the footer strip; keep in sync with
        // the running footer height above.
        margin: { top: '0.4in', bottom: '0.8in', left: '0.55in', right: '0.55in' },
      });

      const outPath = resolve(ROOT, t.out);
      writeFileSync(outPath, pdf);
      console.log('wrote', t.out, '·', pdf.length, 'bytes');
      await page.close();
    }

    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
