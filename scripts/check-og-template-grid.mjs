#!/usr/bin/env node
/**
 * Phase A — assert renderGlossary in build-og-cards.mjs uses the
 * shared `gridRow()` and `fitTitle()` primitives instead of inlined
 * y-coordinate constants and hard-coded font sizes for variable
 * titles. Future render* functions (Storefront Health, etc.) opt in
 * by satisfying the same pattern.
 *
 * Why: prior to Phase A every renderer duplicated the y-grid math.
 * The glossary whitespace bug and the absence of a Storefront Health
 * renderer share that root cause. Enforcing the pattern locks in
 * the cohesion fix.
 *
 * Usage:
 *   node scripts/check-og-template-grid.mjs --check
 *
 * Exits 0 if all guarded renderers use the primitives; 1 otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SOURCE = path.join(repoRoot, 'scripts', 'build-og-cards.mjs');

// Renderers that MUST route layout through the primitives. Add new
// kinds here when their render* lands (Storefront Health joins in
// Phase C.4).
const GUARDED = ['renderGlossary'];

function extractFunctionBody(src, name) {
  const re = new RegExp('function\\s+' + name + '\\s*\\(', 'm');
  const m = src.match(re);
  if (!m) return null;
  const start = m.index;
  let depth = 0;
  let i = src.indexOf('{', start);
  if (i < 0) return null;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function main() {
  const src = fs.readFileSync(SOURCE, 'utf8');
  const failures = [];

  for (const name of GUARDED) {
    const body = extractFunctionBody(src, name);
    if (!body) {
      failures.push(`${name}: function not found in build-og-cards.mjs`);
      continue;
    }
    if (!/gridRow\s*\(/.test(body)) {
      failures.push(`${name}: must call gridRow() for at least one y-coordinate`);
    }
    if (!/fitTitle\s*\(/.test(body)) {
      failures.push(`${name}: must call fitTitle() for variable title sizing`);
    }
  }

  if (failures.length) {
    console.error('OG template grid:');
    for (const f of failures) console.error('  ✗ ' + f);
    process.exit(1);
  }
  console.log(`OG template grid: ${GUARDED.length} renderer(s) compliant.`);
}

main();
