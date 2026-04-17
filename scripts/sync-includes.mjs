#!/usr/bin/env node
// Sync the canonical nav + footer from _includes/ into every HTML page.
//
// Single source of truth lives in _includes/nav.html and _includes/footer.html.
// This script finds the nav block and the site footer block in every .html
// file under the repo and replaces them with the partial content. Run after
// editing either partial, and during the deploy build so a stale page can't
// ship.
//
// Zero dependencies. POSIX Node only.
//
//   node scripts/sync-includes.mjs           # rewrites all pages in place
//   node scripts/sync-includes.mjs --check   # exits non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts'
]);

// The nav is shared across every page — sync it everywhere.
// The footer's "Free tools" column diverges on the tool-utility pages
// (/tools/compare/, /tools/speed-test/, etc.) which cross-link inside
// the tool ecosystem. Nav sync on these pages is still safe; footer
// sync is not. The self-selecting signal is reliable enough: a page's
// existing footer that already links to the restaurant checklist is
// using the canonical main-funnel footer; anything else is a tool
// utility page and gets left alone.
const FOOTER_MAIN_FUNNEL_MARKER = '/resources/restaurant-website-checklist/';

// The nav block: <header class="nav" id="nav">...</header>.
// Single occurrence per page; anchored by the unique id.
const NAV_RE = /<header class="nav" id="nav">[\s\S]*?<\/header>/;

// The site footer: <footer> that contains <div class="foot-grid">.
// This discriminator keeps us from touching any <footer> inside an article
// body (e.g. a blog post byline footer), if one ever shows up.
const FOOTER_RE = /<footer>[\s\S]*?<div class="foot-grid">[\s\S]*?<\/footer>/;

const navTemplate    = fs.readFileSync(path.join(repoRoot, '_includes', 'nav.html'), 'utf8').trimEnd();
const footerTemplate = fs.readFileSync(path.join(repoRoot, '_includes', 'footer.html'), 'utf8').trimEnd();

function collectHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectHtml(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function renderNav(relPath) {
  // index.html at repo root keeps href="#main" so clicking the logo scrolls
  // to top without a full page reload. Every other page goes home.
  const logoHref = relPath === 'index.html' ? '#main' : '/';
  return navTemplate.replaceAll('{{LOGO_HREF}}', logoHref);
}

let changed = 0;
let skipped = 0;
let footerSkipped = 0;
const problems = [];

for (const file of collectHtml(repoRoot)) {
  const rel = path.relative(repoRoot, file);
  const src = fs.readFileSync(file, 'utf8');

  const hasNav    = NAV_RE.test(src);
  const hasFooter = FOOTER_RE.test(src);
  if (!hasNav && !hasFooter) { skipped++; continue; }

  // Only sync the footer if this page is using the canonical main-funnel
  // footer. Tool-utility pages carry a different "Free tools" column and
  // are detected by the absence of the canonical marker.
  const footerIsCanonical = hasFooter && src.match(FOOTER_RE)[0].includes(FOOTER_MAIN_FUNNEL_MARKER);

  let next = src;
  if (hasNav)             next = next.replace(NAV_RE, renderNav(rel));
  if (footerIsCanonical)  next = next.replace(FOOTER_RE, footerTemplate);
  if (hasFooter && !footerIsCanonical) footerSkipped++;

  if (!hasNav || !hasFooter) {
    problems.push(`${rel}: missing ${!hasNav ? 'nav' : ''}${!hasNav && !hasFooter ? ' and ' : ''}${!hasFooter ? 'footer' : ''}`);
  }

  if (next !== src) {
    if (!checkOnly) fs.writeFileSync(file, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${rel}`);
  }
}

if (problems.length) {
  console.warn('\nwarnings:');
  for (const p of problems) console.warn(`  ${p}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s), skipped ${skipped} (no nav/footer), ${footerSkipped} tool-utility footer(s) preserved.`);

if (checkOnly && changed > 0) process.exit(1);
