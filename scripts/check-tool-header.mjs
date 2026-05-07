#!/usr/bin/env node
// Sprint 7 (Cohesion) — verify the tool page header pattern.
//
// Documented in docs/design-system.md §Tool shell. Every tool's
// hero eyebrow must begin with the locked tool-meta prefix:
//
//   EN: "Free tool · <qualifier>"
//   ES: "Herramienta gratis · <qualifier>"
//
// Never starts with "Muntin Digital" or "A Muntin Digital tool"
// (the brand lives in the nav logo, not the tool meta line).
//
// Modes:
//   node scripts/check-tool-header.mjs         # report + exit 0 (warn-only)
//   node scripts/check-tool-header.mjs --check # report + exit 1 if drift
//
// Sprint 7: warn-only. Sprint 16 flips --check to fail-CI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

// Pages excluded from the check. Catalog pages (tools/, audits/)
// list multiple tools and use a different eyebrow vocabulary
// (e.g. "Free tools" / "Free audits"). Individual tool pages are
// the only ones the "Free tool · <qualifier>" rule applies to.
// Internal diagnostic surfaces (noindex,nofollow, no nav link)
// like the invoice-decoder _compare/ page also get a different
// shell — no eyebrow, dev-flavoured layout — and are excluded.
const EXCLUDE = new Set([
  'tools/index.html',
  'es/tools/index.html',
  'tools/audits/index.html',
  'es/tools/audits/index.html',
  'tools/invoice-decoder/_compare/index.html',
]);

// EN + ES tool-meta prefixes. The eyebrow must START with one of
// these (allowing for HTML entities like &middot; or unicode ·).
const VALID_PREFIXES = [
  /^Free tool\s*(?:&middot;|·)/,
  /^Herramienta gratis\s*(?:&middot;|·)/,
];

function collectToolPages(root, out = [], rel = '') {
  for (const entry of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const sub = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) collectToolPages(root, out, sub);
    else if (entry.isFile() && entry.name === 'index.html') out.push(sub);
  }
  return out;
}

const enPages = collectToolPages(path.join(repoRoot, 'tools')).map((p) => `tools/${p}`);
const esPages = collectToolPages(path.join(repoRoot, 'es', 'tools')).map((p) => `es/tools/${p}`);
// Filter out hard-coded EXCLUDE entries AND any path segment starting
// with '_' (internal diagnostic surfaces like _compare/, _diag/, etc.).
// Prefix-based skip means new internal pages don't need a one-off
// EXCLUDE entry — they just need a leading-underscore directory.
const all     = [...enPages, ...esPages].filter((p) =>
  !EXCLUDE.has(p) && !p.split('/').some((seg) => seg.startsWith('_'))
);

const drift = [];

for (const rel of all) {
  const file = path.join(repoRoot, rel);
  const src  = fs.readFileSync(file, 'utf8');

  // Find the FIRST eyebrow on the page — that's the hero eyebrow.
  // (Subsequent eyebrows on a page are section labels, not the
  // tool meta line.)
  const m = src.match(/<span\s+class="eyebrow"[^>]*>([\s\S]*?)<\/span>/);
  if (!m) {
    drift.push({ file: rel, kind: 'no-eyebrow', detail: 'No <span class="eyebrow"> found in the page.' });
    continue;
  }
  const text = m[1].trim();
  const ok = VALID_PREFIXES.some((rx) => rx.test(text));
  if (!ok) {
    drift.push({
      file:   rel,
      kind:   'bad-prefix',
      detail: `Hero eyebrow does not start with "Free tool · " (EN) or "Herramienta gratis · " (ES). Found: "${text.slice(0, 80)}"`,
    });
  }
}

if (drift.length === 0) {
  console.log(`Tool header: clean. (${all.length} tool pages checked.)`);
} else {
  console.log(`Tool header: ${drift.length} drift(s) in ${all.length} tool pages:\n`);
  for (const d of drift) {
    console.log(`  [${d.kind}] ${d.file}`);
    console.log(`    ${d.detail}\n`);
  }
  console.log('See docs/design-system.md §Tool shell for the locked pattern.');
}

if (checkMode && drift.length > 0) {
  // Sprint 16 — promoted to fail-CI.
  process.exit(1);
}
