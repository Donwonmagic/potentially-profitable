#!/usr/bin/env node
/**
 * Phase H.8 — assert every tool page carries the Data Promise rail
 * sentinel pair, with the canonical 3-line content. Drift = fail
 * (a hand-edit that breaks the rail HTML must be reverted, not
 * accepted into the build).
 *
 *   node scripts/check-data-promise-rail.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SENTINEL_OPEN = '<!-- data-promise:start -->';
const SENTINEL_CLOSE = '<!-- data-promise:end -->';

function findToolPages() {
  const out = [];
  for (const root of ['tools', 'es/tools']) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    function walk(rel) {
      const full = path.join(fullRoot, rel);
      for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        // Skip internal diagnostic surfaces (_compare/, _diag/, etc.).
        if (entry.name.startsWith('_')) continue;
        const sub = path.posix.join(rel, entry.name);
        const idx = path.join(fullRoot, sub, 'index.html');
        if (fs.existsSync(idx)) out.push(idx);
        walk(sub);
      }
    }
    walk('');
  }
  return out;
}

const failures = [];
for (const file of findToolPages()) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(SENTINEL_OPEN) || !src.includes(SENTINEL_CLOSE)) {
    failures.push(`${path.relative(repoRoot, file)}: missing data-promise sentinel pair`);
    continue;
  }
  // Check the rail carries the canonical class and the security link.
  const start = src.indexOf(SENTINEL_OPEN);
  const end = src.indexOf(SENTINEL_CLOSE);
  const block = src.slice(start, end);
  if (!block.includes('class="tool-data-promise"')) {
    failures.push(`${path.relative(repoRoot, file)}: rail block missing class="tool-data-promise"`);
  }
  if (!/href="\/(?:es\/)?security\/"/.test(block)) {
    failures.push(`${path.relative(repoRoot, file)}: rail does not link to /security/`);
  }
  if (!/href="\/(?:es\/)?learn\/checklists\/audit-any-tool\/"/.test(block)) {
    failures.push(`${path.relative(repoRoot, file)}: rail does not link to audit-any-tool checklist`);
  }
}

if (failures.length) {
  console.error(`Data promise rail: ${failures.length} drift(s):`);
  for (const f of failures.slice(0, 10)) console.error('  ✗ ' + f);
  if (failures.length > 10) console.error(`  … and ${failures.length - 10} more`);
  console.error('\nRun: node scripts/inject-tool-data-promise.mjs');
  process.exit(1);
}
console.log(`Data promise rail: clean across ${findToolPages().length} tool page(s).`);
