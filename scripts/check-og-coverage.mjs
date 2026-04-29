#!/usr/bin/env node
/**
 * Sprint 8 (Cohesion) — OG card coverage guard.
 *
 * Sibling to scripts/check-og-images.mjs (which verifies every
 * og:image reference resolves to a file). This script enforces
 * the SHAPE of OG coverage:
 *
 *   - Every blog post must have its own per-post card (not the
 *     generic blog.png fallback).
 *   - Every tool page must have its own per-tool card.
 *   - Every research note must have its own card.
 *   - Every topic page must have its own topic-<slug>.png card.
 *   - Catalog / hub pages (homepage, services, about, work,
 *     /tools/, /learn/, /system/, glossary index, blog index)
 *     should each have their own card.
 *
 * Glossary term entries (`/glossary/<slug>/`) are EXEMPT — by
 * design they all share the single glossary.png card. The brand-
 * recognition payoff outweighs 261 per-term cards.
 *
 * Modes:
 *   node scripts/check-og-coverage.mjs         # report + exit 0 (warn-only)
 *   node scripts/check-og-coverage.mjs --check # report + exit 1 if drift
 *
 * Sprint 8: warn-only. Sprint 16: fail-CI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const OG_PREFIX = 'https://muntin.digital/brand/og/';

// Generic fallback cards — falling back to one of these is fine
// for the page kinds it's designed for, but flagged when a more
// specific card should exist.
const GENERIC_FALLBACKS = new Set([
  'home.png',
  'home-es.png',
  'blog.png',
  'blog-es.png',
  'tools.png',
  'tools-es.png',
  'glossary.png',
  'glossary-es.png',
  'research.png',
  'research-es.png',
  'audit.png',
  'audit-es.png',
]);

// Pages that legitimately use a generic fallback. Glossary terms
// are exempt by design.
function isExemptFromCoverage(rel) {
  // Glossary term pages — share glossary.png by design.
  if (/^glossary\/[^/]+\/index\.html$/.test(rel)) return true;
  if (/^es\/glossary\/[^/]+\/index\.html$/.test(rel)) return true;
  // The glossary INDEX uses glossary.png appropriately.
  if (rel === 'glossary/index.html' || rel === 'es/glossary/index.html') return true;
  // Blog / tools / research INDEX pages legitimately use the
  // catalog card. Each individual post/tool/note must have its
  // own — that's enforced below.
  if (rel === 'blog/index.html' || rel === 'es/blog/index.html') return true;
  if (rel === 'tools/index.html' || rel === 'es/tools/index.html') return true;
  if (rel === 'learn/research/index.html' || rel === 'es/learn/research/index.html') return true;
  // Audits hub uses audit.png.
  if (rel === 'tools/audits/index.html' || rel === 'es/tools/audits/index.html') return true;
  return false;
}

// Pages that REQUIRE a per-X card (not a generic fallback).
function requiresOwnCard(rel) {
  // Blog post (not the index).
  if (/^blog\/[^/]+\/index\.html$/.test(rel) && rel !== 'blog/index.html') return true;
  if (/^es\/blog\/[^/]+\/index\.html$/.test(rel) && rel !== 'es/blog/index.html') return true;
  // Blog drafts are nested deeper — same rule.
  if (/^blog\/drafts\/[^/]+\/index\.html$/.test(rel)) return true;
  if (/^es\/blog\/drafts\/[^/]+\/index\.html$/.test(rel)) return true;
  // Tool page (not the index, not the audits hub).
  if (/^tools\/[^/]+\/index\.html$/.test(rel) && rel !== 'tools/index.html') return true;
  if (/^es\/tools\/[^/]+\/index\.html$/.test(rel) && rel !== 'es/tools/index.html') return true;
  // The audit tool itself (nested at /tools/audits/restaurant/).
  if (/^tools\/audits\/[^/]+\/index\.html$/.test(rel) && rel !== 'tools/audits/index.html') return true;
  if (/^es\/tools\/audits\/[^/]+\/index\.html$/.test(rel) && rel !== 'es/tools/audits/index.html') return true;
  // Research note.
  if (/^learn\/research\/[^/]+\/index\.html$/.test(rel) && rel !== 'learn/research/index.html') return true;
  if (/^es\/learn\/research\/[^/]+\/index\.html$/.test(rel) && rel !== 'es/learn/research/index.html') return true;
  // Topic page.
  if (/^learn\/topics\/[^/]+\/index\.html$/.test(rel) && rel !== 'learn/topics/index.html') return true;
  if (/^es\/learn\/topics\/[^/]+\/index\.html$/.test(rel) && rel !== 'es/learn/topics/index.html') return true;
  return false;
}

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// Match both attribute orderings: property-then-content (EN convention)
// and content-then-property (ES convention, post-translation pipeline).
const META_RE_PROP_FIRST = /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/;
const META_RE_CONT_FIRST = /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/;
function findOgImage(src) {
  const a = src.match(META_RE_PROP_FIRST);
  if (a) return a[1];
  const b = src.match(META_RE_CONT_FIRST);
  if (b) return b[1];
  return null;
}

const drift = [];
let pagesChecked = 0;

for (const file of walk(repoRoot)) {
  const rel = path.relative(repoRoot, file).split(path.sep).join('/');
  if (isExemptFromCoverage(rel)) continue;
  if (!requiresOwnCard(rel)) continue;
  pagesChecked++;
  const src  = fs.readFileSync(file, 'utf8');
  const href = findOgImage(src);
  if (!href) {
    drift.push({ file: rel, kind: 'missing-og', detail: 'No og:image meta tag found.' });
    continue;
  }
  if (!href.startsWith(OG_PREFIX)) {
    drift.push({ file: rel, kind: 'foreign-og', detail: `og:image points outside brand/og/: ${href}` });
    continue;
  }
  const fileName = href.slice(OG_PREFIX.length);
  if (GENERIC_FALLBACKS.has(fileName)) {
    drift.push({
      file: rel,
      kind: 'generic-fallback',
      detail: `Falls back to generic ${fileName} — should have its own per-page card. Add an entry to brand/og/cards.json and run scripts/build-og-cards.mjs.`,
    });
  }
}

if (drift.length === 0) {
  console.log(`OG coverage: clean. (${pagesChecked} pages checked.)`);
} else {
  console.log(`OG coverage: ${drift.length} drift(s) in ${pagesChecked} pages:\n`);
  for (const d of drift) {
    console.log(`  [${d.kind}] ${d.file}`);
    console.log(`    ${d.detail}\n`);
  }
  console.log('See docs/design-system.md §OG cards for the rule.');
}

if (checkMode && drift.length > 0) {
  // Sprint 16 — promoted to fail-CI.
  process.exit(1);
}
