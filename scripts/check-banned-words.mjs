#!/usr/bin/env node
// Phase 1 (Launch refresh) — flag retired-vocabulary words in user copy.
//
// The voice contract retires generic SaaS / agency vocabulary ("solutions,"
// "leverage," "best-in-class," etc.). Drift back into these words is the
// fastest way to lose the calm, plainspoken voice the brand depends on.
//
// This check is conservative — it only flags exact whole-word matches in
// HTML body content (not inside <script>, <style>, or HTML comments) and
// allows scoped exceptions for legitimate uses (e.g. "scalable" inside a
// services-page bullet describing technical scaling).
//
// Modes:
//   node scripts/check-banned-words.mjs         # report + exit 0 (warn)
//   node scripts/check-banned-words.mjs --check # exit 1 if any hits

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

// Whole-word case-insensitive match. Each entry MUST be a single word
// or a closed two-word phrase; longer phrases live in PHRASES below.
const BANNED_WORDS = [
  'leverage', 'leveraged', 'leveraging',
  'synergize', 'synergy', 'synergies',
  'solutions',
  'best-in-class',
  'world-class',
  'growth-hack', 'growth-hacking',
  'unleash', 'unleashing',
  'unlock', 'unlocking',
  'empower', 'empowering',
  'ecosystem',
  'paradigm',
  'disrupt', 'disruptive',
  'robust',
  'scalable',
  'transformative',
  'mission-critical',
];

const BANNED_PHRASES = [
  'low-hanging fruit',
  'move the needle',
  'circle back',
  'loop in',
  'deep-dive', 'deep dive',
  'reach out', 'reach-out',
  'partner up',
  'dive in',
];

// Allowed-context patterns: lines/contexts where the word is fine.
// Anything matching one of these REs on the same line is exempted.
const ALLOWED_PATTERNS = [
  /^\s*(?:\/\/|\/\*|\*|<!--)/,     // line is a JS/CSS/HTML comment
  /class=["'][^"']*\b(?:scalable|robust|unlock)\b/i, // CSS class names
  /[Tt]he stack scales/,           // Don's known phrasing about platform scaling
  /scales? from marketing/,        // FAQ language about engineering scope
  /scalable to e-commerce/,        // Scoped, technical
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

// Strip <script>...</script> and <style>...</style> blocks before
// scanning so embedded JS/CSS keywords ("disrupt", etc.) don't trip
// the check.
function stripCodeBlocks(s) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
}

const patterns = [];
for (const w of BANNED_WORDS) {
  patterns.push([w, new RegExp('\\b' + w.replace(/-/g, '[\\-]') + '\\b', 'gi')]);
}
for (const p of BANNED_PHRASES) {
  patterns.push([p, new RegExp('\\b' + p.replace(/-/g, '[\\-\\s]').replace(/\s+/g, '\\s+') + '\\b', 'gi')]);
}

let total = 0;
const offenders = [];

for (const file of collectHtml(repoRoot)) {
  const src = fs.readFileSync(file, 'utf8');
  const stripped = stripCodeBlocks(src);
  const lines = stripped.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOWED_PATTERNS.some((re) => re.test(line))) continue;
    for (const [word, re] of patterns) {
      re.lastIndex = 0;
      if (re.test(line)) {
        total++;
        offenders.push({ file: path.relative(repoRoot, file), line: i + 1, word, snippet: line.trim().slice(0, 120) });
      }
    }
  }
}

if (offenders.length === 0) {
  console.log('Banned words: clean.');
  process.exit(0);
}

console.log('Banned words: ' + total + ' hit(s).');
for (const o of offenders.slice(0, 50)) {
  console.log('  ' + o.file + ':' + o.line + ' [' + o.word + ']  ' + o.snippet);
}
if (offenders.length > 50) console.log('  ... ' + (offenders.length - 50) + ' more.');

process.exit(checkMode ? 1 : 0);
