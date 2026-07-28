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
// (no </link>). Cover both. Order matters: try the preload+swap
// pattern first (the canonical post-#245 shape), then the older
// render-blocking direct stylesheet form (used on a few pre-#245
// pages that never got the critical-CSS treatment).
const LINK_BLOCK_RE_VARIANTS = [
  // Critical-CSS preload + onload-swap + noscript fallback (PR #245).
  /<link\s+rel="preload"\s+as="style"\s+href="\/assets\/site\.css\?v=[^"]+"\s+onload="[^"]+">\s*\n?<noscript><link\s+rel="stylesheet"\s+href="\/assets\/site\.css\?v=[^"]+"><\/noscript>/,
  // Legacy render-blocking direct stylesheet (pre-#245). Appears on
  // /services/menu-polish/ and a couple of other late-arriving pages
  // whose generators predate the critical-CSS pattern.
  /<link\s+rel="stylesheet"\s+href="\/assets\/site\.css\?v=[^"]+"\s*\/?>/,
];

function isToolPath(rel) {
  const p = rel.split(path.sep).join('/');
  // The /sheets/ HUB index reuses the tool-cluster card system
  // (.tool-cluster/.tool-card--compact/.tool-grid/.tool-chipnav/.tool-goals),
  // all of which live in site-tool.css — so the hub needs the tool shell or
  // its entire card catalog ships unstyled. The 46 sheet DETAIL pages use
  // their own /assets/sheets.css and carry no tool-* classes, so they stay
  // core-only (see isCoreOnlyPath). Scope this to the two hub indexes only.
  if (p === 'sheets/index.html' || p === 'es/sheets/index.html') return true;
  return /^(?:es\/)?tools\//.test(p);
}

// Core-only pages: ship just site-core.css with no supplemental shell.
// Used for pages whose markup pulls only core primitives (no citation
// drawer, listen player, glossary popover, knit-rail, editorial
// callouts, etc.). Saves another ~32 KB gzip versus core+article on
// pages that don't need article styles.
//
// Today: just /sheets/ + /es/sheets/ (audited 2026-05-04, zero tool-
// or article-only classes after the foot-newsletter / skip-link /
// sr-only / nav-toggle re-bucketing). Marketing surfaces (homepage,
// /services/, /window/, /studio/) STILL use article-shell classes
// (.reveal, .learn-tool*, .services-collapse-*, .recently-added__head)
// so they can't go core-only without first moving those rules. Defer.
function isCoreOnlyPath(rel) {
  const p = rel.split(path.sep).join('/');
  return /^(?:es\/)?sheets\//.test(p);
}

// Article-shell pages: long-form content surfaces that need the
// citation drawer, listen player, KnitRail, post-end CTA, inline
// graphics, glossary popover, etc. Per-page byte savings is smaller
// than tool pages (article shell is heavier than tool shell) but
// the cumulative win across ~350 pages is real, and core.css amortizes
// across navigation patterns that mix marketing → blog → glossary.
//
// ALSO covers marketing-style content surfaces that use article-shell
// primitives (.reveal, .learn-tools, .services-collapse-*,
// .recently-added__head): the homepage, services pages, work case
// studies, /window/, /studio/<city>/, /for/<industry>/, /never/,
// /ai/, /receipts/, /methods/, /changelog/, /library/, learn hub +
// start-here, /learn/checklists/<slug>/, plus legal pages and 404.
// Before this pass, those 87 marketing pages still loaded the
// monolithic /assets/site.css render-blocking — same shell-split
// gap as tool pages had before #256. Per-page win: -5 KB gzipped
// (75 KB → 70 KB) and core.css stays warm in cache across cross-
// type navigation.
//
// Skip list: admin/* (auth-gated, may have unique chrome),
// workbench/ (JS app), sign-in/, account/ (minimal layouts),
// system/ (colophon kept on monolith deliberately). These keep
// loading site.css until a focused per-surface audit confirms
// shell-split safety.
function isArticlePath(rel) {
  const p = rel.split(path.sep).join('/');
  // Long-form content surfaces (original article-shell scope):
  if (/^(?:es\/)?(?:blog|glossary)\//.test(p)) return true;
  if (/^(?:es\/)?learn\/(?:research|topics)\//.test(p)) return true;

  // Skip: admin / workbench / sign-in / account / system / _includes
  // -- not marketing, may need different shell or no shell at all.
  if (/^(?:es\/)?(?:admin|workbench|sign-in|account|system)\//.test(p)) return false;
  if (/^_includes\//.test(p)) return false;

  // Marketing surfaces. Cover by (a) explicit roots and (b) recursive
  // directories whose contents share marketing-shell needs.
  if (/^(?:es\/)?(?:about|services|work|window|studio|for|never|ai|receipts|methods|security|privacy|accessibility|cookies|terms|library|changelog)(\/|\.html$)/.test(p)) return true;
  if (/^(?:es\/)?learn\/(?:index\.html$|start-here\/|checklists\/)/.test(p)) return true;
  if (/^(?:es\/)?learn(?:\/index\.html)?$/.test(p)) return true;

  // Locale roots + EN root. (Match index.html exactly so we don't
  // sweep up /es/index.html under the wrong path.)
  if (p === 'index.html' || p === 'es/index.html') return true;

  // 404 pages — both EN and ES.
  if (p === '404.html' || p === 'es/404.html') return true;

  return false;
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
  if (!supplementalShell) {
    // Core-only mode — single preload, single noscript fallback.
    const noscript = `<noscript><link rel="stylesheet" href="/assets/site-core.css?v=${CACHE_BUST}"></noscript>`;
    return `${corePreload}\n${noscript}`;
  }
  const supPreload = `<link rel="preload" as="style" href="/assets/site-${supplementalShell}.css?v=${CACHE_BUST}" onload="this.onload=null;this.rel='stylesheet'">`;
  const noscript   = `<noscript><link rel="stylesheet" href="/assets/site-core.css?v=${CACHE_BUST}"><link rel="stylesheet" href="/assets/site-${supplementalShell}.css?v=${CACHE_BUST}"></noscript>`;
  return `${corePreload}\n${supPreload}\n${noscript}`;
}

const toolBlock     = buildShellBlock('tool');
const articleBlock  = buildShellBlock('article');
const coreOnlyBlock = buildShellBlock(null);
const coreSig       = `site-core.css?v=${CACHE_BUST}`;

let changed = 0;
const changedFiles = [];

for (const file of listHtml(repoRoot)) {
  const rel = path.relative(repoRoot, file);
  let supplementalShell = null;
  let newBlock = null;
  let mode = null;
  if (isToolPath(rel))          { supplementalShell = 'tool';    newBlock = toolBlock;     mode = 'tool';     }
  else if (isArticlePath(rel))  { supplementalShell = 'article'; newBlock = articleBlock;  mode = 'article';  }
  else if (isCoreOnlyPath(rel)) { supplementalShell = null;      newBlock = coreOnlyBlock; mode = 'core-only';}
  else continue;

  const src = fs.readFileSync(file, 'utf8');

  // Idempotency: if the page already has core (and the right supplemental
  // shell, when applicable) at the current cache-bust, leave it alone.
  // For core-only mode, also confirm NO supplemental shell is present —
  // otherwise we'd skip an over-loaded page that legitimately needs a
  // trim down to core.
  if (mode === 'core-only') {
    const hasCore = src.includes(coreSig);
    const hasTool = src.includes(`site-tool.css?v=${CACHE_BUST}`);
    const hasArt  = src.includes(`site-article.css?v=${CACHE_BUST}`);
    if (hasCore && !hasTool && !hasArt) continue;
  } else if (src.includes(coreSig) && src.includes(`site-${supplementalShell}.css?v=${CACHE_BUST}`)) {
    continue;
  }

  let next = src;
  let replaced = false;
  for (const re of LINK_BLOCK_RE_VARIANTS) {
    if (re.test(next)) {
      next = next.replace(re, newBlock);
      replaced = true;
      break;
    }
  }

  // Re-shell case: a page previously assigned the core-only block whose
  // path now needs a supplemental shell — e.g. the /sheets/ hub moving
  // to the tool shell once it adopted the tool-cluster card system. Its
  // block is already site-core.css (not the monolithic site.css the
  // variants above match), so match the standalone core preload+noscript
  // pair (any cache-bust) and upgrade it. Idempotent: a core+supplemental
  // block never matches this (the noscript carries a second <link>).
  if (!replaced && supplementalShell) {
    const CORE_ONLY_RE = /<link\s+rel="preload"\s+as="style"\s+href="\/assets\/site-core\.css\?v=[^"]+"\s+onload="[^"]+">\s*\n?<noscript><link\s+rel="stylesheet"\s+href="\/assets\/site-core\.css\?v=[^"]+"><\/noscript>/;
    if (CORE_ONLY_RE.test(next)) {
      next = next.replace(CORE_ONLY_RE, newBlock);
      replaced = true;
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
