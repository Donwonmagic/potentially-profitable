#!/usr/bin/env node
// Sprint 1 (Cohesion) — flag user-visible "Workbench" strings.
//
// The product is "the Workshop" in user copy. The URL stays
// /workbench/ and the codebase keeps its `wb-*` / `MuntinWorkbench`
// identifiers (those migrate in Sprint 3). This script catches new
// user-facing "Workbench" strings before they ship.
//
// Modes:
//   node scripts/check-name-coherence.mjs         # report + exit 0 (warn-only)
//   node scripts/check-name-coherence.mjs --check # report + exit 1 if any unexpected hits
//
// In Sprint 1 the default is warn-only so unrelated PRs aren't blocked
// while remaining edge cases get cleaned up. Sprint 16 (CI guardrails)
// promotes --check to fail-CI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

// Only scan HTML — that's where user copy lives. Server JS in src/,
// client JS in assets/ (where the shared helper has correct EN copy
// already), and tooling in scripts/ are deliberately out of scope.
const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

// A line is "allowed" to mention Workbench if it matches any of these.
// Comments, code identifiers, URLs, file refs, Plausible event names
// (Sprint 15 renames those) — none of these reach the user.
const ALLOWED_PATTERNS = [
  /\/workbench[\/?#-]/,                         // URLs and paths: /workbench/, /workbench/?id=, /workbench-save
  /MuntinWorkbench/,                            // global JS identifier
  /\bjs-wb-[A-Za-z]/,                           // JS hook classes (js-wb-watch-attach, js-wb-delete, etc.)
  /\bwb(?:Handle|List|Save|Box|Btn|Link|Text|Msg|Watch|Loading|Empty|Error)\b/, // variable / id names
  /'Workbench (?:Save|Open Saved|Watch Attach|Watch Detach|Account Delete Request)'/, // Plausible event names (Sprint 15)
  /workbench-save(?:-pattern)?/,                // file refs (.js / .md)
  /^\s*(?:\/\/|\/\*|\*|<!--)/,                  // line is a JS/CSS/HTML comment
  /Save-to-Workbench/,                          // hyphenated form is comment-only
  /a saved Workbench item/,                     // rehydration-flow JS comment phrase
  /Workbench rehydrate use one path/,           // speed-test rehydration comment
];

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

function isAllowed(line) {
  return ALLOWED_PATTERNS.some((rx) => rx.test(line));
}

const hits = [];

for (const file of collectHtml(repoRoot)) {
  const src   = fs.readFileSync(file, 'utf8');
  if (!src.includes('Workbench')) continue;
  const rel   = path.relative(repoRoot, file);
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.includes('Workbench')) continue;
    if (isAllowed(line)) continue;
    hits.push({ file: rel, line: i + 1, text: line.trim().slice(0, 120) });
  }
}

if (hits.length) {
  console.log(`Name-coherence: ${hits.length} unexpected "Workbench" reference(s):\n`);
  for (const h of hits) console.log(`  ${h.file}:${h.line}  ${h.text}`);
  console.log('\nThe product is "the Workshop" in user copy. The URL /workbench/ and codebase\nidentifiers (MuntinWorkbench, wb-*) are allowed. See ALLOWED_PATTERNS above.');
} else {
  console.log('Name-coherence: clean.');
}

if (checkMode && hits.length > 0) {
  // Sprint 16 — promoted to fail-CI. To temporarily allow drift,
  // run without --check (warn-only).
  process.exit(1);
}
