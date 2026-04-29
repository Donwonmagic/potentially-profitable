#!/usr/bin/env node
/**
 * Sprint 15 (Cohesion) — analytics event vocabulary lock.
 *
 * The canonical list of Plausible event names lives in
 * tools/_shared/analytics.js's EVENTS registry. This script greps
 * every window.plausible('…') call site across the codebase and
 * flags any event name not in the registry. Catches typos and
 * silent vocabulary drift — adding a new event MUST happen in the
 * registry first.
 *
 * Modes:
 *   node scripts/check-analytics-vocabulary.mjs         # report + exit 0
 *   node scripts/check-analytics-vocabulary.mjs --check # report + exit 1
 *
 * Sprint 15: warn-only. Sprint 16 flips --check to fail-CI.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

// Load the canonical registry from the analytics module — single
// source of truth.
const analyticsModule = await import(
  path.join(repoRoot, 'tools', '_shared', 'analytics.js')
);
const ALLOWED = new Set(analyticsModule.default.EVENT_NAMES);

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler',
]);

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), exts, out);
    } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// window.plausible('NAME', ...) — accepts either single or double quotes.
const CALL_RE = /window\.plausible\(\s*(['"])([^'"]+)\1/g;

const drift   = [];
const used    = new Set();
let callsSeen = 0;

for (const file of walk(repoRoot, ['.html', '.js', '.mjs'])) {
  // Skip the registry file itself — its strings are the allowlist,
  // not call sites.
  const rel = path.relative(repoRoot, file);
  if (rel === 'tools/_shared/analytics.js') continue;
  // Skip the checker itself.
  if (rel === 'scripts/check-analytics-vocabulary.mjs') continue;

  const src = fs.readFileSync(file, 'utf8');
  CALL_RE.lastIndex = 0;
  let m;
  while ((m = CALL_RE.exec(src)) !== null) {
    callsSeen++;
    const name = m[2];
    used.add(name);
    if (!ALLOWED.has(name)) {
      const lineNo = src.slice(0, m.index).split('\n').length;
      drift.push({ file: rel, line: lineNo, name });
    }
  }
}

// Stale entries — registered but no longer fired anywhere.
const stale = [];
for (const name of ALLOWED) {
  if (!used.has(name)) stale.push(name);
}

if (drift.length === 0 && stale.length === 0) {
  console.log(`Analytics vocabulary: clean. (${callsSeen} call site(s); ${ALLOWED.size} registered events.)`);
} else {
  if (drift.length) {
    console.log(`Analytics vocabulary: ${drift.length} unregistered event name(s):\n`);
    for (const d of drift) {
      console.log(`  ${d.file}:${d.line}  fires '${d.name}'`);
    }
    console.log('\nAdd the event to the EVENTS registry in');
    console.log('tools/_shared/analytics.js, or correct the typo at the call site.');
  }
  if (stale.length) {
    console.log(`\n${stale.length} registered event name(s) not currently fired (may be stale):`);
    for (const name of stale) console.log(`  '${name}'`);
    console.log('Trim from the registry once the call sites are confirmed retired.');
  }
}

if (checkMode && drift.length > 0) {
  // Sprint 15: warn-only on drift. Stale entries are informational,
  // never block CI. Sprint 16 flips drift to exit(1).
  console.log('\n(--check is in warn-only mode in Sprint 15)');
  process.exit(0);
}
