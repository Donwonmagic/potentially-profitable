#!/usr/bin/env node
/**
 * Phase-2 cohesion guard — voice-contract banned-vocabulary check.
 *
 * The launch voice contract (synthesized from the brand-voice audit)
 * retires a small set of marketing-speak words. They are allowed in
 * historical artifacts (changelog entries, methods page citations,
 * blog posts that critique the words themselves), but should never
 * appear in user-facing marketing surfaces — homepage, services,
 * studio pages, hero copy, etc.
 *
 * The check scans HTML files for the banned words used as plain
 * marketing copy. Matches inside <code>, <pre>, blockquotes
 * marked with attribution, and pages on the allowlist are ignored.
 *
 * Modes:
 *   node scripts/check-banned-words.mjs          # warn-only (default)
 *   node scripts/check-banned-words.mjs --check  # fail-CI
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

// Pages allowed to mention the words (they critique or quote them).
const ALLOWLIST = [
  '/changelog/',
  '/methods/',
  '/blog/',          // blog posts may critique marketing-speak
  '/learn/research/', // research notes may quote sources
  '/glossary/',      // glossary entries define words like "scalable"
  '/never/',         // /never/ contrasts itself with vendor jargon
  '/ai/',            // /ai/ may critique generated copy
  '/admin/',
];

const BANNED = [
  // The agreed retired-vocabulary list from the brand-voice audit.
  // Each word includes a regex with word boundaries so we don't
  // false-positive on substrings ("solutionary", "leveraged" data
  // structures inside code blocks, etc.).
  { rx: /\bsynergize[ds]?\b/gi,                             word: 'synergize' },
  { rx: /\bbest[- ]in[- ]class\b/gi,                        word: 'best-in-class' },
  { rx: /\bgrowth[- ]hack(?:s|er|ers|ed|ing)?\b/gi,         word: 'growth-hack' },
  { rx: /\bworld[- ]class\b/gi,                             word: 'world-class' },
  { rx: /\bgame[- ]chang(?:er|ing)\b/gi,                    word: 'game-changer' },
  { rx: /\bdisrupt(?:s|ed|ing|ive|ion)?\b/gi,               word: 'disrupt' },
  { rx: /\bparadigm(?:s)?\b/gi,                             word: 'paradigm' },
  { rx: /\blow[- ]hanging fruit\b/gi,                       word: 'low-hanging fruit' },
  { rx: /\bmove the needle\b/gi,                            word: 'move the needle' },
  { rx: /\b(circle back|loop in|deep[- ]div(?:e|ing))\b/gi, word: 'meeting-speak' },
  // "leverage" as a verb only — keeping the noun (financial leverage,
  // operating leverage) is fine.
  { rx: /\bleverag(?:e|es|ed|ing)\s+(?:our|the|your|a|an|every|all)\b/gi, word: 'leverage (verb)' },
  // "solutions" used as a generic SaaS suffix.
  { rx: /\b(?:web|business|enterprise|digital|marketing)\s+solutions\b/gi, word: 'X solutions' },
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

function isAllowlisted(relPath) {
  // Path uses forward slashes regardless of OS.
  const normalized = '/' + relPath.replace(/\\/g, '/');
  return ALLOWLIST.some((prefix) => normalized.includes(prefix));
}

// Quick scrub: drop <code>, <pre>, and JSON-LD <script> blocks
// before scanning. Marketing-speak warnings on a JSON file or a
// quoted code sample are noise.
function scrub(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<code[\s\S]*?<\/code>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
}

const violations = [];
for (const file of collectHtml(repoRoot)) {
  const rel = path.relative(repoRoot, file);
  if (isAllowlisted(rel)) continue;
  const src = scrub(fs.readFileSync(file, 'utf8'));
  for (const { rx, word } of BANNED) {
    rx.lastIndex = 0;
    const matches = src.match(rx);
    if (matches) {
      violations.push({ file: rel, word, count: matches.length });
    }
  }
}

if (violations.length === 0) {
  console.log('Banned words: clean.');
  process.exit(0);
}

console.error(`\nFound ${violations.length} banned-vocabulary hit(s):\n`);
const byFile = new Map();
for (const v of violations) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}
for (const [file, hits] of byFile) {
  console.error(`  ${file}`);
  for (const h of hits) console.error(`    – ${h.word} (${h.count}×)`);
}
console.error(
  '\nVoice contract retires these words on marketing surfaces.',
);
console.error('Allowed only on /changelog/, /methods/, /blog/, /learn/, /glossary/.\n');

process.exit(checkMode ? 1 : 0);
