#!/usr/bin/env node
/**
 * check-retired-links.mjs — guard against hard links to retired / redirect-only
 * paths in the site's chrome + funnel surfaces.
 *
 * Background: the 2026-06 product-only migration retired 8 off-funnel tools +
 * the top-level /start/ triage + the restaurant-website audit. They now resolve
 * ONLY via the Worker 301 map (src/lib/tool-redirects.js + the /start/ handler in
 * src/worker.js). A hard <a href> to one of those paths ships a 301 hop and, in
 * the worst case, advertises a product that no longer exists — the homepage's
 * primary mobile CTA did exactly that (label "Run free audit" → the retired
 * audit) until this gate landed, and check-all had no link guard to catch it.
 *
 * Policy:
 *   - FAIL on any retired-path link in a CHROME / funnel surface (the front
 *     door, the nav + footer partials, the hub pages, the trust pages). That is
 *     the loud, high-traffic real estate where a stale link is a real
 *     conversion + credibility bug.
 *   - WARN-report the long tail of in-content (article / glossary / sheet) body
 *     links. Those resolve cleanly via the 301 and live in lower-traffic, often
 *     services-era content; clearing them is tracked roadmap debt, not a blocker.
 *
 *   node scripts/check-retired-links.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Retired paths (resolve only via the Worker 301 map). EN form; the scan also
// matches the /es/-prefixed mirror of each. Keep in sync with
// src/lib/tool-redirects.js + the /start/ handling in src/worker.js.
const RETIRED = [
  '/tools/audits/restaurant/',
  '/tools/gbp-grader/',
  '/tools/store-hours/',
  '/tools/storefront-health/',
  '/tools/menu-copy/',
  '/tools/photo-brief/',
  '/tools/menu-converter/',
  '/tools/brand-suite/',
  '/start/',
];

// Chrome + funnel surfaces that must NEVER hard-link a retired path. The
// _includes/ partials (nav, footer) are added programmatically below — they
// propagate sitewide, so a retired link there is the worst case.
const CHROME = [
  'index.html', 'es/index.html',
  'tools/index.html', 'es/tools/index.html',
  'cost-index/index.html', 'es/cost-index/index.html',
  'library/index.html', 'es/library/index.html',
  'never/index.html', 'es/never/index.html',
  'security/index.html', 'es/security/index.html',
  'ai/index.html', 'es/ai/index.html',
  'trust/index.html', 'es/trust/index.html',
  'receipts/index.html', 'es/receipts/index.html',
  'methods/index.html', 'es/methods/index.html',
  'ledger/index.html', 'es/ledger/index.html',
];
// NOTE: /changelog/ is intentionally NOT in CHROME. It is a historical ledger —
// a "shipped X on date Y" entry legitimately links a tool that was retired
// later (e.g. menu-converter, shipped 2026-05-02, retired 2026-06). Those links
// 301 cleanly and rewriting history would be wrong. The warn scan still counts
// them.

const readSafe = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };

// A hard <a href> to the path or its /es/ mirror. We match the href attribute
// only, so the Worker source, the redirect tables, and prose that merely names a
// path are not flagged — just real links a browser would follow.
function linksTo(html, p) {
  return html.includes('href="' + p + '"') || html.includes('href="/es' + p + '"');
}

function collectHtml(dir, out = [], skip = new Set()) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (skip.has(e.name)) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) collectHtml(fp, out, skip);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
  return out;
}

// ---- chrome / funnel surfaces (fail-CI) -----------------------------------
const chromeFiles = [
  ...CHROME.map((r) => path.join(repoRoot, r)),
  ...collectHtml(path.join(repoRoot, '_includes')),
];
const failures = [];
for (const f of chromeFiles) {
  const html = readSafe(f);
  if (!html) continue;
  for (const p of RETIRED) {
    if (linksTo(html, p)) failures.push(`${path.relative(repoRoot, f)} → ${p}`);
  }
}

// ---- global long-tail scan (warn) -----------------------------------------
const SKIP = new Set(['node_modules', '.git', '.wrangler', 'dist', 'src', 'scripts', 'docs', '_includes']);
let tail = 0;
for (const f of collectHtml(repoRoot, [], SKIP)) {
  const html = readSafe(f);
  if (RETIRED.some((p) => linksTo(html, p))) tail++;
}

if (failures.length) {
  console.error(`check-retired-links: ${failures.length} retired-path link(s) in chrome/funnel surfaces (fail-CI):`);
  for (const x of failures) console.error('  ✗ ' + x);
  console.error('Fix: repoint to a live on-funnel target — the retired path only resolves via a 301.');
  process.exit(1);
}
console.log(`check-retired-links: chrome/funnel surfaces clean. ${tail} in-content page(s) still 301-link a retired path (tracked roadmap debt).`);
