#!/usr/bin/env node
/**
 * Phase-3-perf — wire the CSS shell split into the actual page <head>.
 *
 * The shell split (PR #246) generated assets/site-{core,tool,article}.css
 * from the monolithic assets/site.css, but no page actually referenced
 * the new files — every one of the 494 pages still loaded the full
 * site.css (~80 KB gzipped) on every request. The shells were dead
 * bytes on disk.
 *
 * This injector wires the tool shell into pages that need it. For
 * any page under /tools/ or /es/tools/, the link block:
 *
 *   <link rel="preload" as="style" href="/assets/site.css?v=…"
 *         onload="this.onload=null;this.rel='stylesheet'">
 *   <noscript><link rel="stylesheet" href="/assets/site.css?v=…"></noscript>
 *
 * is replaced by:
 *
 *   <link rel="preload" as="style" href="/assets/site-core.css?v=…"
 *         onload="this.onload=null;this.rel='stylesheet'">
 *   <link rel="preload" as="style" href="/assets/site-tool.css?v=…"
 *         onload="this.onload=null;this.rel='stylesheet'">
 *   <noscript>
 *     <link rel="stylesheet" href="/assets/site-core.css?v=…">
 *     <link rel="stylesheet" href="/assets/site-tool.css?v=…">
 *   </noscript>
 *
 * Tool-page net byte impact (gzipped):
 *   Before:  site.css                       80 KB
 *   After:   site-core.css + site-tool.css  47 KB   (-33 KB / -41%)
 *
 * Why only tool pages in this iteration: tool pages are the most
 * well-defined subset (path-anchored, no ambiguity) AND they're the
 * page type with the worst current LCP (5–6s on /tools/seo-grader/
 * per the launch-plan baseline). Article-shell wiring follows in a
 * separate PR after we've seen the LHCI numbers move on this one.
 *
 * Idempotent: if the page already references site-core.css, skip.
 *
 * Usage:
 *   node scripts/inject-css-shells.mjs           # rewrite in place
 *   node scripts/inject-css-shells.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const CACHE_BUST = '20260503-shells';

// Match either attribute order on the preload + the noscript fallback
// pair. The noscript MUST follow the preload immediately (whitespace
// allowed); other inter-mixed tags break the assumption.
const LINK_BLOCK_RE = /<link\s+rel="preload"\s+as="style"\s+href="\/assets\/site\.css\?v=[^"]+"\s+onload="[^"]+"><\/link>?\s*\n?<noscript><link\s+rel="stylesheet"\s+href="\/assets\/site\.css\?v=[^"]+"><\/noscript>/;

// Same shape but the <link> tag in the wild may be self-closing-ish
// (no </link>). Cover both.
const LINK_BLOCK_RE_VARIANTS = [
  /<link\s+rel="preload"\s+as="style"\s+href="\/assets\/site\.css\?v=[^"]+"\s+onload="[^"]+">\s*\n?<noscript><link\s+rel="stylesheet"\s+href="\/assets\/site\.css\?v=[^"]+"><\/noscript>/,
];

function isToolPath(rel) {
  const p = rel.split(path.sep).join('/');
  return /^(?:es\/)?tools\//.test(p);
}

// Article-shell pages: long-form content surfaces that need the
// citation drawer, listen player, KnitRail, post-end CTA, inline
// graphics, glossary popover, etc. Per-page byte savings is smaller
// than tool pages (article shell is heavier than tool shell) but
// the cumulative win across ~350 pages is real, and core.css amortizes
// across navigation patterns that mix marketing → blog → glossary.
//
// Excludes /learn/checklists/<slug>/ (uses checklist UI primitives that
// live in core), /learn/ landing (mixed shell needs — defer), and the
// /glossary/<topic>/ topic-cluster index pages (use the topic styles
// in article shell, but they also pull homepage utility classes from
// core; defer until measured).
function isArticlePath(rel) {
  const p = rel.split(path.sep).join('/');
  return /^(?:es\/)?(?:blog|glossary)\//.test(p)
      || /^(?:es\/)?learn\/(?:research|topics)\//.test(p);
}

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist'
        || e.name === '_includes' || e.name === 'src' || e.name === 'scripts'
        || e.name === 'assets' || e.name === 'docs' || e.name === 'brand'
        || e.name === '.wrangler') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function buildShellBlock(supplementalShell) {
  const corePreload = `<link rel="preload" as="style" href="/assets/site-core.css?v=${CACHE_BUST}" onload="this.onload=null;this.rel='stylesheet'">`;
  const supPreload  = `<link rel="preload" as="style" href="/assets/site-${supplementalShell}.css?v=${CACHE_BUST}" onload="this.onload=null;this.rel='stylesheet'">`;
  const noscript    = `<noscript><link rel="stylesheet" href="/assets/site-core.css?v=${CACHE_BUST}"><link rel="stylesheet" href="/assets/site-${supplementalShell}.css?v=${CACHE_BUST}"></noscript>`;
  return `${corePreload}\n${supPreload}\n${noscript}`;
}

const toolBlock    = buildShellBlock('tool');
const articleBlock = buildShellBlock('article');
const coreSig      = `site-core.css?v=${CACHE_BUST}`;

let changed = 0;
const changedFiles = [];

for (const file of listHtml(repoRoot)) {
  const rel = path.relative(repoRoot, file);
  let supplementalShell = null;
  let newBlock = null;
  if (isToolPath(rel))         { supplementalShell = 'tool';    newBlock = toolBlock;    }
  else if (isArticlePath(rel)) { supplementalShell = 'article'; newBlock = articleBlock; }
  else continue;

  const src = fs.readFileSync(file, 'utf8');

  // Idempotency: if the page already has core + the right supplemental
  // shell at the current cache-bust, leave it alone.
  if (src.includes(coreSig) && src.includes(`site-${supplementalShell}.css?v=${CACHE_BUST}`)) continue;

  let next = src;
  let replaced = false;
  for (const re of LINK_BLOCK_RE_VARIANTS) {
    if (re.test(next)) {
      next = next.replace(re, newBlock);
      replaced = true;
      break;
    }
  }

  if (!replaced) continue;

  if (next !== src) {
    changed++;
    changedFiles.push(rel);
    if (!checkOnly) fs.writeFileSync(file, next);
  }
}

if (checkOnly && changed > 0) {
  console.error(`inject-css-shells: ${changed} shell-injected page(s) would change:`);
  for (const f of changedFiles.slice(0, 10)) console.error(`  ${f}`);
  if (changedFiles.length > 10) console.error(`  …and ${changedFiles.length - 10} more`);
  process.exit(1);
}

console.log(`inject-css-shells: ${changed} shell-injected page(s) ${checkOnly ? 'would change' : 'updated'}.`);
