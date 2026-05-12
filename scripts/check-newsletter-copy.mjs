#!/usr/bin/env node
/**
 * Phase G.10 (Growth) — guard the newsletter capture copy.
 *
 * The brand frame is "I send a short note when I publish something" —
 * Don's voice, not corporate-SaaS. This check fails CI if:
 *
 *   1. The required framing string is missing from either footer
 *      ("when I publish something" / "cuando publique algo").
 *   2. The forbidden corporate-SaaS register appears anywhere
 *      ("subscribe to our newsletter", "join our community",
 *      "join our list", "exclusive content", "members-only",
 *      "súmate a nuestra comunidad", etc.).
 *
 * Scope: every footer + page-content HTML file. The check is
 * intentionally loud — if a future Don-doesn't-write-this drift
 * lands the CI fails before merge.
 *
 *   node scripts/check-newsletter-copy.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const REQUIRED = [
  { file: '_includes/footer.html',     phrase: 'when I publish something' },
  { file: '_includes/es/footer.html',  phrase: 'cuando publique algo' },
];

const FORBIDDEN_PHRASES = [
  /subscribe to our newsletter/i,
  /join our (?:community|list|tribe|family|club)/i,
  /exclusive content/i,
  /members[- ]only/i,
  /sign up for our newsletter/i,
  /unete a nuestra comunidad/i,
  /s[uú]mate a nuestra (?:comunidad|tribu|familia)/i,
  /contenido exclusivo/i,
];

const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'dist', '.wrangler', 'docs', 'drafts']);
// Allow internal files where these strings are TARGET PATTERNS to flag
// on third-party restaurant sites (the Muntin Audit's own check), not
// Muntin copy. Plus this script itself.
const ALLOW_FILES = new Set([
  path.join(repoRoot, 'scripts/check-newsletter-copy.mjs'),
  path.join(repoRoot, 'tools/audits/restaurant/restaurant-checks.js'),
  // The ES mirror at es/tools/audits/restaurant/restaurant-checks.js
  // was deleted in commit c1f6c9d0 (the ES page loads the canonical
  // /tools/audits/restaurant/restaurant-checks.js directly). Stale
  // allowlist entry removed.
]);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && (e.name.endsWith('.html') || e.name.endsWith('.js') || e.name.endsWith('.mjs') || e.name.endsWith('.json'))) yield p;
  }
}

const failures = [];

for (const { file, phrase } of REQUIRED) {
  const full = path.join(repoRoot, file);
  if (!fs.existsSync(full)) {
    failures.push(`${file}: missing — newsletter-capture sentinel not deployed`);
    continue;
  }
  const src = fs.readFileSync(full, 'utf8');
  if (!src.toLowerCase().includes(phrase.toLowerCase())) {
    failures.push(`${file}: missing required framing phrase "${phrase}"`);
  }
}

let scanned = 0;
for (const file of walk(repoRoot)) {
  if (ALLOW_FILES.has(file)) continue;
  scanned++;
  const src = fs.readFileSync(file, 'utf8');
  for (const re of FORBIDDEN_PHRASES) {
    if (re.test(src)) {
      const m = src.match(re);
      failures.push(`${path.relative(repoRoot, file)}: contains forbidden corporate-SaaS phrase: ${m ? m[0] : re.source}`);
    }
  }
}

if (failures.length) {
  console.error(`Newsletter copy: ${failures.length} drift(s):`);
  for (const f of failures) console.error('  ✗ ' + f);
  console.error('\nKeep Don\'s voice: "I send a short note when I publish something."');
  console.error('Never "subscribe to our newsletter" / "join our community" / corporate-SaaS register.');
  process.exit(1);
}
console.log(`Newsletter copy: required framing present in both footers; no forbidden phrases across ${scanned} file(s).`);
