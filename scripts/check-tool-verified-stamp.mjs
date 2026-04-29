#!/usr/bin/env node
/**
 * Phase G.1 (Growth) — assert every tool page renders the
 * "Last verified" stamp inside the sentinel pair. The stamp
 * is the cheapest freshness signal we ship to crawlers + AI
 * engines: it tells them how recently the underlying logic
 * was reviewed, separately from the page's HTML mtime.
 *
 *   node scripts/check-tool-verified-stamp.mjs --check
 *
 * Exits 0 when every tool page has the stamp + a valid ISO
 * date in <time datetime="">; 1 with a per-file report
 * otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SENTINEL_OPEN  = '<!-- tool-verified:start -->';
const SENTINEL_CLOSE = '<!-- tool-verified:end -->';
const TIME_RE = /<time\s+datetime="(\d{4}-\d{2}-\d{2})"/;

function findToolPages() {
  const out = [];
  for (const root of ['tools', 'es/tools']) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    function walk(rel) {
      const full = path.join(fullRoot, rel);
      for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const sub = path.join(rel, entry.name);
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
const files = findToolPages();
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(repoRoot, file);
  if (!src.includes(SENTINEL_OPEN) || !src.includes(SENTINEL_CLOSE)) {
    failures.push(`${rel}: missing tool-verified sentinel pair`);
    continue;
  }
  const start = src.indexOf(SENTINEL_OPEN);
  const end = src.indexOf(SENTINEL_CLOSE, start);
  const block = src.slice(start, end);
  const m = block.match(TIME_RE);
  if (!m) {
    failures.push(`${rel}: tool-verified block has no <time datetime="YYYY-MM-DD">`);
  }
}

if (failures.length) {
  console.error(`Tool verified stamp: ${failures.length} issue(s) across ${files.length} tool page(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error('\nRun: node scripts/inject-tool-verified-stamp.mjs');
  process.exit(1);
}
console.log(`Tool verified stamp: ${files.length} tool page(s) clean.`);
