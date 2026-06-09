#!/usr/bin/env node
/**
 * Studio voice-boundary guard — the mirror of the product's
 * check-voice-boundary.mjs.
 *
 * The register split (docs/brand/voice-and-naming-architecture.md): the studio
 * (muntin.digital) is ONE person — Don, first-person "I", "never we". The
 * product (Muntin Ledger) is the system — "we" (mechanism) + "you". The
 * product gate blocks the studio persona "Don" leaking into product copy;
 * this gate blocks the inverse — a fake-team / corporate "we" leaking into the
 * studio's own marketing voice.
 *
 * SCOPE: the studio's OWN-VOICE marketing surfaces only. CONTENT registers are
 * excluded by intent: library/blog/learn articles legitimately QUOTE operators
 * and show example copy ("Thank you — our team works hard…" in the
 * review-response playbook), which is the operator's voice, not the studio's.
 * Scanning those would be all false positives. <blockquote> is scrubbed for
 * the same reason.
 *
 * The fake-team vocabulary is kept inline here (the studio's check-banned-words
 * holds the marketing-cliché vocabulary; this is a distinct, narrowly-scoped
 * boundary concern). If a shared cross-repo banned-vocabulary catalog lands,
 * these patterns should move into its `studio` tier.
 *
 *   node scripts/check-studio-voice-boundary.mjs          # report, exit 0
 *   node scripts/check-studio-voice-boundary.mjs --check  # exit 1 on a hit
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

// Fake-team tells — unambiguous on a one-person studio. NOT a bare "we"
// (rhetorical/inclusive "we" is fine); only the corporate-team constructions.
const BANNED = [
  { rx: /\bour team\b/gi,   why: "The studio is one person (Don, 'I'). Use 'I'/'my'." },
  { rx: /\bour staff\b/gi,  why: "Solo studio — no staff. Use 'I'/'my'." },
  { rx: /\bour company\b/gi, why: "Solo studio. Say 'my studio' or 'Muntin Digital'." },
  { rx: /\bour (?:experts|engineers|designers|developers|consultants|specialists|agents)\b/gi, why: "Implies a team of specialists. The studio is one operator." },
  { rx: /\bthe team (?:at|here|behind)\b/gi, why: "Fake-team framing. The studio is Don, singular." },
  { rx: /\b(?:we['’]re|we are) a team\b/gi, why: "The studio is one person, not a team." },
  { rx: /\ba team of\b/gi,  why: "Fake-team framing on a solo studio. Use the first-person singular." },
];

// Excluded: infra dirs, and the CONTENT registers (which quote operators and
// show example copy). What remains is the studio's own marketing voice.
const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
  // content registers — not the studio's own voice:
  'library', 'blog', 'glossary', 'tools', 'sheets', 'learn', 'course', 'es',
]);

// Pages allowed to use the words (they critique / quote them).
const ALLOWLIST = ['/changelog/', '/methods/', '/never/', '/ai/', '/admin/'];

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

function isAllowlisted(relPath) {
  const normalized = '/' + relPath.replace(/\\/g, '/');
  return ALLOWLIST.some((prefix) => normalized.includes(prefix));
}

// Drop code/quote blocks: <code>, <pre>, <script>, <style>, <blockquote>.
function scrub(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<code[\s\S]*?<\/code>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<blockquote[\s\S]*?<\/blockquote>/g, '');
}

const violations = [];
for (const file of collectHtml(repoRoot)) {
  const rel = path.relative(repoRoot, file);
  if (isAllowlisted(rel)) continue;
  const src = scrub(fs.readFileSync(file, 'utf8'));
  for (const { rx, why } of BANNED) {
    rx.lastIndex = 0;
    const matches = src.match(rx);
    if (matches) violations.push({ file: rel, match: matches[0], why, count: matches.length });
  }
}

if (violations.length === 0) {
  console.log('Studio voice boundary: clean (no fake-team "we" on studio surfaces).');
  process.exit(0);
}

console.error(`\nStudio voice boundary: ${violations.length} fake-team hit(s):`);
const byFile = new Map();
for (const v of violations) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}
for (const [file, hs] of byFile) {
  console.error(`  ${file}`);
  for (const h of hs) console.error(`    – "${h.match}" (${h.count}×): ${h.why}`);
}
console.error('\nThe studio speaks first-person singular (Don, "I"), never a fake-team "we".');
console.error('Register split: docs/brand/voice-and-naming-architecture.md.\n');
process.exit(checkMode ? 1 : 0);
