#!/usr/bin/env node
/**
 * Fabrication blocklist — pre-publish gate against the patterns that
 * have historically returned to the library as invented facts.
 *
 * History (May 2026 fact-check round): earlier waves drafted authoritative-
 * sounding industry analysis with invented operator data dressed as
 * first-party experience. "The two restaurants I manage." "100-restaurant
 * DMV cohort." "90 days of paired queries." "$4,000 incremental margin."
 * None were ever pulled from a real source. Don was rightfully furious.
 *
 * This check blocks these patterns at publish time so they can't come
 * back. If a future article legitimately needs to make one of the blocked
 * claims, it either has to be added to data/sourced-claims.json with a
 * real source URL, or labeled illustrative in the prose, or removed.
 *
 * The pattern registry now lives in scripts/lib/fabrication-patterns.mjs so
 * the language-aware audio gate (scripts/check-audio-fabrications.mjs) can
 * share the exact same rules. This file scans HTML / JSON / MD / MJS source;
 * the audio gate scans the per-language audio narration JSON that this file
 * deliberately skips (see SKIP_PATHS below).
 *
 * Patterns blocked (see the registry for the full list + per-language tags):
 *   1. "two restaurants I manage" / "manages two DMV restaurants" /
 *      "los dos restaurantes que manejo" / "maneja dos restaurantes" —
 *      the keystone bio fabrication (real bio: full-time at Tacombi
 *      Bethesda only, per data/sourced-claims.json).
 *   2. "paired-restaurant ledgers" / "AI Overviews citation-tracking" —
 *      the two invented datasets named on the old /methods/ page.
 *   3. Specific cohort sizes followed by percentage distributions
 *      ("100-restaurant DMV cohort", "50-restaurant audit") — pattern
 *      consistently came back as invented sampling.
 *   4. Quarterly AI Overview percentages outside the registered claim
 *      ("Q1 2024 ~6%", "Q3 2025 ~16%", "Q2 2026 ~20%") — only the
 *      March 2025 13.14% figure has a real source.
 *   5. Specific incremental-margin dollar swings tied to a date
 *      ("$4,000 incremental margin", "kept margin climbed 56%") —
 *      these were always fabricated; rewrite as illustrative ranges.
 *
 * Articles that legitimately need to discuss these topics can either:
 *   (a) frame the number as illustrative ("a single-digit dip in
 *       week one"),
 *   (b) cite a real source via <details class="cite">…</details>,
 *   (c) add the specific claim to data/sourced-claims.json with the
 *       source URL and date_verified.
 *
 *   node scripts/check-fabrications.mjs           # report violations
 *   node scripts/check-fabrications.mjs --check   # exit 1 if any found
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  repoRoot,
  BLOCKED,
  ALLOWED_DEEP_LINKS,
  ALLOWED_CONTEXTS,
  normalizeUrlMatch,
} from './lib/fabrication-patterns.mjs';

// Files to skip — historical changelog (should be allowed to reference
// the patterns to explain what was cut), the audit-page reader-addressing
// "you manage two or more restaurants" phrasing, and any draft notes.
const SKIP_PATHS = [
  /\/changelog\//,
  /\/drafts\//,
  /scripts\/check-fabrications\.mjs$/, // this file
  /scripts\/check-audio-fabrications\.mjs$/, // the audio gate documents the patterns
  /scripts\/test-audio-fabrications\.mjs$/, // its tests use the patterns as fixtures
  /scripts\/lib\/fabrication-patterns\.mjs$/, // the shared pattern registry
  /docs\/editorial\//, // the editorial OS (doctrine, ground-truth, scorecard, ADRs) documents the blocked patterns + the re-render backlog, like docs/fact-check.md
  /scripts\/inject-article-author-card\.mjs$/, // template (cleaned)
  /scripts\/sweep-two-restaurants/, // the cleanup script itself
  /data\/sourced-claims\.json$/, // the registry itself
  /docs\/fact-check\.md$/, // the rule doc documents the blocked patterns
  /docs\/voice-canon-blog\.md$/, // blog canon documents the same blocked patterns
  /docs\/release-notes\/.*audio-retranslate\.md$/, // re-render runbook documents which patterns were cut
  // 2026-06-08: the Spanish F5 voice-clone reference transcript (quoted in
  // this README, stored verbatim in the un-scanned don-reference.es.txt and
  // paired with Don's don-reference.es.m4a recording) still carries the
  // retired "Administro dos restaurantes" bio. Fixing it means re-recording
  // the reference, not editing text — a confirm-tier task owned by Don,
  // tracked in docs/editorial/ground-truth-pack.md. Skipped until re-recorded.
  /scripts\/voice-refs\/README\.md$/,
  /\.git\//,
  /node_modules\//,
  /\/audio(\.[a-z]+)?\.json$/, // audio narration files — fact-checked by the language-aware check-audio-fabrications.mjs
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (SKIP_PATHS.some((re) => re.test(p))) continue;
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (['.html', '.json', '.md', '.mjs'].includes(ext)) out.push(p);
    }
  }
  return out;
}

const files = walk(repoRoot);
const violations = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const rule of BLOCKED) {
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(text)) !== null) {
      // Inspect ~120 chars of context to allow legitimate uses.
      const start = Math.max(0, match.index - 60);
      const end = Math.min(text.length, match.index + match[0].length + 60);
      const ctx = text.slice(start, end);
      if (ALLOWED_CONTEXTS.some((re) => re.test(ctx))) continue;
      // If this match is a URL that's been verified and registered in
      // data/sourced-claims.json with url_status: "deep-link", let it
      // through. The registry is the system-of-record for verified URLs.
      const matched = match[0];
      if (matched.startsWith('http') && ALLOWED_DEEP_LINKS.has(normalizeUrlMatch(matched))) continue;
      // Line number for the operator
      const lineNum = text.slice(0, match.index).split('\n').length;
      violations.push({
        file: path.relative(repoRoot, file),
        line: lineNum,
        label: rule.label,
        match: match[0],
        fix: rule.fix,
      });
    }
  }
}

const checkOnly = process.argv.includes('--check');

if (violations.length === 0) {
  console.log('check-fabrications: 0 blocklist hits.');
  process.exit(0);
}

console.error(`check-fabrications: ${violations.length} blocklist hit(s):\n`);
// Group by file for readability
const byFile = new Map();
for (const v of violations) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}
for (const [file, vs] of byFile) {
  console.error(`  ${file}`);
  for (const v of vs) {
    console.error(`    L${v.line}: ${v.label}`);
    console.error(`           matched: "${v.match.replace(/\s+/g, ' ').slice(0, 80)}"`);
    console.error(`           fix: ${v.fix}`);
  }
  console.error('');
}
console.error('See data/sourced-claims.json for the registry of verified claims.');
console.error('See docs/fact-check.md for the editorial rule.');
process.exit(checkOnly ? 1 : 1);
