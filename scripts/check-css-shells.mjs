#!/usr/bin/env node
/**
 * Phase 3B-perf — CSS shell split validator.
 *
 * Verifies the three shell files emitted by build-css-shells.mjs are
 * a sound partition of assets/site.css:
 *
 *   1. Round-trip: concatenating core+tool+article (modulo the
 *      auto-generated file headers) produces exactly the bytes of
 *      site.css. No rule lost; no rule duplicated.
 *
 *   2. Cascade safety: no selector appears in BOTH core AND a
 *      supplemental shell (tool or article). Supplemental shells
 *      must be additive — if tool.css contained a rule that core.css
 *      also contained, the load order would matter and async loading
 *      makes order racy. Same selector can appear inside both
 *      tool AND article (those load mutually exclusively per page),
 *      but never core+supplemental.
 *
 *   3. Build freshness: running `build-css-shells.mjs --check` would
 *      not change the shell files. (Catches manual edits to the
 *      generated outputs.)
 *
 *   node scripts/check-css-shells.mjs           # report + exit 0
 *   node scripts/check-css-shells.mjs --check   # exit 1 on any violation
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const SOURCE = path.join(REPO, 'assets', 'site.css');
const SHELLS = {
  core:    path.join(REPO, 'assets', 'site-core.css'),
  tool:    path.join(REPO, 'assets', 'site-tool.css'),
  article: path.join(REPO, 'assets', 'site-article.css'),
};

const violations = [];

// === Check 1 — build is fresh ===
const buildRes = spawnSync(process.execPath, [path.join(REPO, 'scripts', 'build-css-shells.mjs'), '--check'], {
  encoding: 'utf8',
});
if (buildRes.status !== 0) {
  violations.push({
    kind: 'stale-build',
    detail: 'site.css has changed since the shells were last built. Run: node scripts/build-css-shells.mjs',
  });
}

// === Check 2 — round-trip ===
//
// Strip the auto-generated file headers + the per-section header
// comments we inject during build, then verify line-by-line that the
// concatenation reproduces site.css exactly.
function readShellWithoutGeneratedHeaders(p) {
  const raw = fs.readFileSync(p, 'utf8');
  // Drop the leading file-header block (between the first `/*` and `*/`).
  const afterHeader = raw.replace(/^\/\*[\s\S]*?\*\/\s*\n?/, '');
  // Drop every per-section header line we inject during build.
  return afterHeader.replace(/^\/\* ===== \[(?:core|tool|article)\][^*]*\*\/\n?/gm, '');
}

const sourceText = fs.readFileSync(SOURCE, 'utf8');
const reassembled =
  readShellWithoutGeneratedHeaders(SHELLS.core) +
  readShellWithoutGeneratedHeaders(SHELLS.tool) +
  readShellWithoutGeneratedHeaders(SHELLS.article);

// The shells emit sections in the original site.css order WITHIN each
// shell, not globally. So we can't byte-compare directly. Instead:
// (a) tokenize both into "rules" (each top-level selector{...} block),
// (b) check that the multiset of rules matches.
function tokenizeRules(css) {
  // Strip /* ... */ comments first.
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Each rule is a selector list followed by { ... } (allowing nested
  // braces for @media etc). Simple brace-counter walk.
  const out = [];
  let depth = 0;
  let buf = '';
  let inSelector = true;
  let selector = '';
  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i];
    if (depth === 0 && ch === '{') {
      depth = 1;
      buf = '{';
      continue;
    }
    if (depth === 0) {
      selector += ch;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    buf += ch;
    if (depth === 0) {
      const sel = selector.trim();
      const body = buf.trim();
      if (sel) out.push({ sel, body });
      selector = '';
      buf = '';
    }
  }
  return out;
}

const sourceRules = tokenizeRules(sourceText);
const reassembledRules = tokenizeRules(reassembled);

if (sourceRules.length !== reassembledRules.length) {
  violations.push({
    kind: 'rule-count-mismatch',
    detail: `site.css has ${sourceRules.length} top-level rules; shells reassemble to ${reassembledRules.length}`,
  });
} else {
  // Compare bag-equality via a sorted-list join.
  const srcKeys = sourceRules.map((r) => r.sel + r.body).sort();
  const reKeys  = reassembledRules.map((r) => r.sel + r.body).sort();
  let mismatch = 0;
  for (let i = 0; i < srcKeys.length; i++) {
    if (srcKeys[i] !== reKeys[i]) {
      mismatch++;
      if (mismatch <= 3) {
        violations.push({
          kind: 'rule-mismatch',
          detail: `Rule[${i}] in site.css: "${srcKeys[i].slice(0, 80)}…"\n              vs shells:    "${reKeys[i].slice(0, 80)}…"`,
        });
      }
    }
  }
  if (mismatch > 3) {
    violations.push({
      kind: 'rule-mismatch-summary',
      detail: `… and ${mismatch - 3} more rule mismatches`,
    });
  }
}

// === Check 3 — no selector duplicated across shells ===
//
// Cascade safety. The check is on raw selector strings (after a
// trim/normalize pass). Same selector in both core AND a supplemental
// shell is a violation. Same selector in tool AND article is fine
// (those load mutually exclusively per page).
function selectorsIn(filePath) {
  const rules = tokenizeRules(fs.readFileSync(filePath, 'utf8'));
  // Skip @media/@supports/@font-face wrappers — their selectors are
  // intrinsically scoped and "duplication" inside one is allowed.
  const out = new Set();
  for (const r of rules) {
    if (r.sel.startsWith('@')) continue;
    // Split selector lists ("a, b, c {...}") and trim whitespace.
    for (const s of r.sel.split(',')) {
      const norm = s.trim().replace(/\s+/g, ' ');
      if (norm) out.add(norm);
    }
  }
  return out;
}

const coreSels    = selectorsIn(SHELLS.core);
const toolSels    = selectorsIn(SHELLS.tool);
const articleSels = selectorsIn(SHELLS.article);

const coreToolDup    = [...coreSels].filter((s) => toolSels.has(s));
const coreArticleDup = [...coreSels].filter((s) => articleSels.has(s));

if (coreToolDup.length) {
  violations.push({
    kind: 'core-tool-duplication',
    detail: `${coreToolDup.length} selector(s) appear in both core AND tool: ${coreToolDup.slice(0, 5).join(' · ')}${coreToolDup.length > 5 ? ` … and ${coreToolDup.length - 5} more` : ''}`,
  });
}
if (coreArticleDup.length) {
  violations.push({
    kind: 'core-article-duplication',
    detail: `${coreArticleDup.length} selector(s) appear in both core AND article: ${coreArticleDup.slice(0, 5).join(' · ')}${coreArticleDup.length > 5 ? ` … and ${coreArticleDup.length - 5} more` : ''}`,
  });
}

// === Report ===
if (violations.length === 0) {
  const sumKB = ((fs.statSync(SHELLS.core).size + fs.statSync(SHELLS.tool).size + fs.statSync(SHELLS.article).size) / 1024).toFixed(1);
  const srcKB = (fs.statSync(SOURCE).size / 1024).toFixed(1);
  console.log(`CSS shells: clean. ${sourceRules.length} rules across 3 shells.`);
  console.log(`  source:  ${srcKB} KB`);
  console.log(`  core:    ${(fs.statSync(SHELLS.core).size / 1024).toFixed(1)} KB`);
  console.log(`  tool:    ${(fs.statSync(SHELLS.tool).size / 1024).toFixed(1)} KB`);
  console.log(`  article: ${(fs.statSync(SHELLS.article).size / 1024).toFixed(1)} KB`);
  console.log(`  sum:     ${sumKB} KB (overhead = file headers)`);
  process.exit(0);
}

console.log(`CSS shells: ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.log(`  ✗ [${v.kind}]`);
  console.log(`    ${v.detail}\n`);
}
console.log(`Fix: re-run scripts/build-css-shells.mjs after editing site.css,\nand reclassify any selector that triggered a core+supplemental duplication\nby moving it to one shell only (typically core).`);

if (checkMode) process.exit(1);
process.exit(0);
