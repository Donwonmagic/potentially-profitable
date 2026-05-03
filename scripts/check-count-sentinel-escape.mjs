#!/usr/bin/env node
/**
 * Phase-2 cohesion guard — catch HTML-escaped count sentinels.
 *
 * Background. The site uses <!-- count:KEY -->VALUE<!-- /count -->
 * sentinels as the single source of truth for nav/footer counts
 * (139 glossary terms, 15 free tools, 18 articles). The injector
 * lives at scripts/inject-site-counts.mjs and matches the literal
 * comment markers `<!-- count:` and `<!-- /count -->`.
 *
 * Failure mode this script catches. If a page ever renders the
 * sentinel as TEXT instead of as an HTML comment — i.e. with
 * `&lt;!--` and `--&gt;` — the injector regex stops matching and
 * the value silently freezes. We hit this exact bug at scale: 247
 * glossary pages froze at 135 and shipped that count for weeks.
 *
 * Pattern matched here:
 *   &lt;!-- count:[\w.]+ --&gt;[^&]*&lt;!-- /count --&gt;
 *
 * Modes:
 *   node scripts/check-count-sentinel-escape.mjs          # warn
 *   node scripts/check-count-sentinel-escape.mjs --check  # fail-CI
 */

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

const ESCAPED_SENTINEL = /&lt;!-- count:[\w.]+ --&gt;[^&]*&lt;!-- \/count --&gt;/g;

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

const violations = [];
for (const file of collectHtml(repoRoot)) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    if (ESCAPED_SENTINEL.test(line)) {
      violations.push({
        file: path.relative(repoRoot, file),
        line: i + 1,
        snippet: line.trim().slice(0, 120),
      });
    }
    ESCAPED_SENTINEL.lastIndex = 0;
  });
}

if (violations.length === 0) {
  console.log('Count sentinel escape: clean.');
  process.exit(0);
}

console.error(`\nFound ${violations.length} HTML-escaped count sentinel(s):\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}`);
  console.error(`    ${v.snippet}`);
}
console.error(
  '\nFix: replace `&lt;!-- count:KEY --&gt;VALUE&lt;!-- /count --&gt;`',
);
console.error('with literal HTML comments so inject-site-counts.mjs can find them:');
console.error('     `<!-- count:KEY -->VALUE<!-- /count -->`');
console.error('Then run: node scripts/inject-site-counts.mjs\n');

process.exit(checkMode ? 1 : 0);
