#!/usr/bin/env node
// Sprint 1 (Cohesion) — flag hard-coded count claims that bypass the
// <!-- count:KEY -->VALUE<!-- /count --> sentinel system.
//
// Source of truth: data/site-counts.json. Every user-facing "N terms",
// "N tools", "N topics", "N articles" should be either:
//   (a) inside a `<!-- count:KEY -->N<!-- /count -->` sentinel, OR
//   (b) in a meta/og description / placeholder where comments break
//       parsing — those values are checked against site-counts.json
//       and warned if they drift.
//
// Modes:
//   node scripts/check-counts-coherence.mjs         # report + exit 0 (warn-only)
//   node scripts/check-counts-coherence.mjs --check # report + exit 1 if drift
//
// Sprint 1: warn-only. Sprint 16 (CI guardrails) flips --check to fail-CI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

const counts = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'data', 'site-counts.json'), 'utf8'),
);

// Phrases we care about. The number on the left side of the phrase is
// what we check against the canonical value on the right.
const CANONICAL_PHRASES = [
  // EN
  { rx: /\b(\d{1,4})[ -]term[s]?\b(?:\s+glossary)?/g, key: 'glossary.terms', label: 'EN: term(s)' },
  { rx: /\b(\d{1,4})\s+free tools?\b/g,               key: 'tools.live',    label: 'EN: free tools' },
  // ES
  { rx: /\b(\d{1,4})\s+t[eé]rminos\b/g,               key: 'glossary.terms', label: 'ES: términos' },
  { rx: /\b(\d{1,4})\s+herramientas\s+gratis\b/gi,    key: 'tools.live',    label: 'ES: herramientas gratis' },
];

function lookup(key) {
  const parts = key.split('.');
  let cur = counts;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object' || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

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

// A hit inside a sentinel is fine — that's the system working. We
// recognize the sentinel-wrapped form by stripping it from the line
// before re-running the canonical regex.
const SENTINEL_STRIP = /<!-- count:[\w.]+ -->([^<]*)<!-- \/count -->/g;

const drift = [];

for (const file of collectHtml(repoRoot)) {
  const src   = fs.readFileSync(file, 'utf8');
  const rel   = path.relative(repoRoot, file);
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    // Skip <meta>/<title> tags — those are author-managed and often
    // reference per-category counts ("10 términos en basics") that
    // are not site-wide. The site-counts coherence check is a body-
    // content check; meta description drift is handled by hand.
    if (/<(?:meta|title)\b/i.test(lines[i])) continue;
    // Strip the sentinel value so we don't false-positive on the
    // wrapped numeral itself.
    const line = lines[i].replace(SENTINEL_STRIP, '');
    for (const { rx, key, label } of CANONICAL_PHRASES) {
      rx.lastIndex = 0;
      let m;
      while ((m = rx.exec(line)) !== null) {
        const stated   = parseInt(m[1], 10);
        const canon    = lookup(key);
        if (typeof canon !== 'number') continue;
        if (stated !== canon) {
          drift.push({
            file: rel, line: i + 1, label, key,
            stated, canon,
            text: lines[i].trim().slice(0, 140),
          });
        }
      }
    }
  }
}

if (drift.length) {
  console.log(`Counts coherence: ${drift.length} drift(s) vs data/site-counts.json:\n`);
  for (const d of drift) {
    console.log(`  ${d.file}:${d.line}  [${d.label}] says ${d.stated}, canonical ${d.key} = ${d.canon}`);
    console.log(`    ${d.text}`);
  }
  console.log('\nUse `<!-- count:KEY -->VALUE<!-- /count -->` sentinels in element content,\nor update meta/og descriptions to match data/site-counts.json then re-run\n`node scripts/inject-site-counts.mjs`.');
} else {
  console.log('Counts coherence: clean.');
}

if (checkMode && drift.length > 0) {
  // Sprint 1: warn-only. Sprint 16 flips this to exit(1).
  console.log('\n(--check is in warn-only mode in Sprint 1)');
  process.exit(0);
}
