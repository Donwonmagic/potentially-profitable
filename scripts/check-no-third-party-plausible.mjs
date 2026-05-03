#!/usr/bin/env node
/**
 * Phase 3B (cohesion) — no third-party Plausible.
 *
 * After the Phase 3B Plausible self-host cutover, the tracker
 * loads from /assets/p.js (same origin) and events POST to
 * /api/event (proxied by src/worker.js to plausible.io upstream).
 * The site no longer carries a third-party request to plausible.io
 * on any pageview, which is the substance of the privacy promise
 * on /never/, /privacy.html, and /cookies.html.
 *
 * This guard fails the build if any HTML file reintroduces a
 * direct plausible.io reference — script src, preconnect,
 * dns-prefetch, or any other URL form that would re-establish the
 * third-party request. Allowed exceptions:
 *
 *   - External links to plausible.io documentation pages (/data-policy,
 *     /privacy-focused-web-analytics) on the trust pages — those are
 *     prose citations to Plausible's own docs, not script loads.
 *   - The /assets/p.js file itself, which is Plausible's tracker code
 *     (committed by /pull/242).
 *
 *   node scripts/check-no-third-party-plausible.mjs           # report + exit 0
 *   node scripts/check-no-third-party-plausible.mjs --check   # exit 1 on drift
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

// Patterns that re-establish the third-party request:
//   <script src="https://plausible.io/...">
//   <link rel="preconnect" href="https://plausible.io">
//   <link rel="dns-prefetch" href="https://plausible.io">
//   plausible.init({ endpoint: 'https://plausible.io/api/event' })
const FORBIDDEN_PATTERNS = [
  {
    name: 'script src to plausible.io',
    re: /<script[^>]*src="https?:\/\/plausible\.io[^"]*"[^>]*>/i,
  },
  {
    name: '<link rel="preconnect"> to plausible.io',
    re: /<link[^>]*rel="preconnect"[^>]*href="https?:\/\/plausible\.io[^"]*"/i,
  },
  {
    name: '<link rel="dns-prefetch"> to plausible.io',
    re: /<link[^>]*rel="dns-prefetch"[^>]*href="https?:\/\/plausible\.io[^"]*"/i,
  },
  {
    name: 'plausible.init endpoint pointing at plausible.io',
    re: /plausible\.init\s*\(\s*\{[^}]*endpoint:\s*['"]https?:\/\/plausible\.io[^'"]*['"]/i,
  },
];

// Allowed: anchor href to plausible.io for documentation citation.
// e.g. <a href="https://plausible.io/data-policy">. We DON'T flag those.

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name.endsWith('.html')) yield p;
  }
}

const offenders = [];
let scanned = 0;

for (const file of walk(repoRoot)) {
  scanned++;
  let src;
  try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }
  for (const { name, re } of FORBIDDEN_PATTERNS) {
    if (re.test(src)) {
      offenders.push({ file: path.relative(repoRoot, file), pattern: name });
    }
  }
}

if (offenders.length === 0) {
  console.log(`No third-party Plausible: clean. (${scanned} pages scanned.)`);
  process.exit(0);
}

console.log(`No third-party Plausible: ${offenders.length} drift hit(s) across ${new Set(offenders.map((o) => o.file)).size} file(s):\n`);
for (const o of offenders.slice(0, 20)) {
  console.log(`  ${o.file}  ${o.pattern}`);
}
if (offenders.length > 20) console.log(`  … and ${offenders.length - 20} more.`);
console.log(`\nFix: replace the third-party reference with the self-hosted equivalent —\n  <script src="/assets/p.js?v=20260503" defer></script>\n  plausible.init({ endpoint: '/api/event' })\nand drop any plausible.io preconnect / dns-prefetch lines from the head.`);

if (checkMode) process.exit(1);
process.exit(0);
