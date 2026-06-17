#!/usr/bin/env node
/**
 * Per-language audio fabrication gate.
 *
 * The HTML/JSON fact gate (scripts/check-fabrications.mjs) deliberately
 * skips the audio narration files, yet CLAUDE.md and the voice canons say
 * the spoken script "must clear the fact gate in every language" — because
 * the renderer (Kokoro / F5) reads chunks[].text VERBATIM in six languages
 * (en/es/fr/it/pt/zh). A fabrication that reaches an audio.<lang>.json is a
 * fabrication spoken aloud before any human re-reads it. This gate closes
 * that hole.
 *
 * It scans every per-post narration file — audio.json (source language) and
 * audio.<lang>.json — in two tiers:
 *
 *   1. PATTERN TIER (fail-CI): the shared fabrication registry
 *      (scripts/lib/fabrication-patterns.mjs), applied per spoken language:
 *        - 'invariant' rules (fabricated source deep-links) on EVERY file —
 *          a bad URL reads identically in Mandarin as in English;
 *        - 'en' rules on audio.json; 'es' rules on audio.es.json.
 *      The verified-deep-link allowlist (data/sourced-claims.json) and the
 *      addressing-the-reader ALLOWED_CONTEXTS apply exactly as in the HTML
 *      gate.
 *
 *   2. NUMERIC-PARITY TIER (warn-first): narration is generated FROM the
 *      already-fact-gated article, so every number/percent/dollar/year the
 *      audio speaks should also appear in the source. For each non-source
 *      file we flag any numeric token that is NOT present in the sibling
 *      index.html (∪ the source audio.json). This is the genuinely
 *      language-invariant catch for fr/it/pt/zh: an invented "56%" or
 *      "$4,000" hallucinated in translation surfaces here even though the
 *      surrounding prose is in a language the gate can't pattern-match.
 *      Warn-only for now (prints, does not fail) so we can seed PARITY_ALLOW
 *      for legitimate formatting diffs before promoting it to fail-CI — the
 *      same warn-first→fail rollout the repo used for banned-words.
 *
 *   node scripts/check-audio-fabrications.mjs           # report
 *   node scripts/check-audio-fabrications.mjs --check   # exit 1 on pattern hits
 *
 * Known residual (logged in docs/editorial/decisions/ADR-001): a freshly
 * MISTRANSLATED prose fabrication in fr/it/pt/zh that carries no rogue
 * number and no URL is not caught here. Promoting numeric-parity to fail-CI
 * and (later) a spoken-language detector are the follow-ons.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  repoRoot,
  BLOCKED,
  ALLOWED_DEEP_LINKS,
  ALLOWED_CONTEXTS,
  normalizeUrlMatch,
} from './lib/fabrication-patterns.mjs';

const __filename = fileURLToPath(import.meta.url);

// Per-post narration files only. Precise basename match so the audio
// COVERAGE manifest (data/article-audio.json), the pronunciation lexicon
// (data/audio-pronunciation.json), and the translations.<lang>.json
// label bundles are all excluded — this gate is about the SPOKEN script.
const AUDIO_BASENAME = /^audio\.json$|^audio\.[a-z]{2}\.json$/;

const SKIP_DIRS = [/\.git\//, /node_modules\//, /\/drafts\//, /(^|\/)dist\//];

// Numeric tokens that are allowed to appear in narration without a source
// match (formatting artifacts, not claims). Seed dated entries here only
// after confirming a parity warning is a false positive, never to silence a
// real invented figure. Empty by intent at launch.
const PARITY_ALLOW = new Set([
  // 2026-06-08: Chinese myriad grouping. zh groups by 万 (10^4): the EN
  // "11.8 million mobile pages" is faithfully rendered "1180万" (1180 × 10^4),
  // so "1180" has no EN digit-run. Structural number-system difference, not
  // drift (learn/research/mobile-page-speed-3-second-rule/audio.zh.json).
  '1180',
]);

// Known-stale narration awaiting a full re-render. These posts were rendered
// BEFORE the May-2026 fact-check cleanup, so their audio (text + MP3) still
// speaks the retired "two restaurants" bio in all six languages even though
// the source HTML is now clean. A text-only edit would hide the fabrication
// from this gate while the MP3 kept speaking it, so the only honest fix is to
// re-render via scripts/render-post-audio.mjs — a confirm-tier task owned by
// Don (needs the TTS toolchain). Until then these dirs are waived from the
// PATTERN tier so the gate stays green for all other content; every run still
// prints them loudly so they cannot be forgotten. Remove an entry the moment
// its post is re-rendered (the gate flags waivers that no longer match).
export const STALE_AUDIO_WAIVERS = [
  {
    dir: 'learn/research/dmv-restaurant-gbp-audit-2026',
    note: '2026-06-08: stale render (audio gen 2026-05-09) — two-restaurants bio, 6 langs. HTML clean. Awaiting re-render.',
  },
  {
    dir: 'learn/research/the-1-percent-margin-audit-50-restaurant-websites-2026',
    note: '2026-06-08: stale render (audio gen 2026-05-09) — two-restaurants bio, 6 langs. HTML clean. Awaiting re-render.',
  },
  {
    dir: 'library/does-my-restaurant-need-a-website',
    note: '2026-06-08: stale render (audio gen 2026-05-10) — two-restaurants bio, 6 langs. HTML clean. Awaiting re-render.',
  },
  {
    dir: 'library/how-to-tell-if-a-restaurant-tool-is-safe',
    note: '2026-06-17: stale render — speaks "Kept margin climbed 56%" (the DoorDash recirculation-card figure de-fabricated in HTML; this audio predates the fix). HTML clean. Awaiting re-render.',
  },
];

export function waiverFor(rel) {
  return STALE_AUDIO_WAIVERS.find((w) => rel === w.dir || rel.startsWith(w.dir + '/'));
}

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (SKIP_DIRS.some((re) => re.test(p + '/'))) continue;
    if (entry.isDirectory()) walk(p, out);
    else if (entry.isFile() && AUDIO_BASENAME.test(entry.name)) out.push(p);
  }
  return out;
}

export function langOf(basename) {
  if (basename === 'audio.json') return 'en'; // unsuffixed = source track
  const m = basename.match(/^audio\.([a-z]{2})\.json$/);
  return m ? m[1] : 'en';
}

// Concatenate the spoken text of a narration manifest.
export function spokenText(absPath) {
  try {
    const data = JSON.parse(fs.readFileSync(absPath, 'utf8'));
    if (!Array.isArray(data.chunks)) return '';
    return data.chunks.map((c) => (c && typeof c.text === 'string' ? c.text : '')).join('\n');
  } catch {
    return '';
  }
}

// Compare the multiset of digit-RUNS, not value-normalized numbers. Locale
// makes "." vs "," ambiguous (decimal vs thousands: "1.176,28" es ==
// "$1,176.28" en) and K/M abbreviations expand differently per language
// ("$133K" -> "133.000"), so value-normalization invents phantom tokens (an
// earlier pass flagged a non-existent "117628" by stripping the decimal out
// of "1.176,28"). Digit-runs are separator-, decimal-, and spacing-invariant.
// We drop runs of <=2 digits and all-zero runs — cents, small counts, and the
// "000" halves of thousands groups — which are formatting noise, not the kind
// of figure a fabrication turns on. Stays a warn-first drift signal (ADR-001):
// coarser, but free of the locale false positives that made v1 unusable.
export function extractNumbers(text) {
  const out = new Set();
  if (!text) return out;
  // A run of digits, optionally grouped by separators/spaces.
  const re = /\d[\d.,   ]*\d|\d/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    // Split each matched span into bare digit-runs (separator-invariant).
    for (const run of m[0].split(/\D+/)) {
      const tok = run.replace(/^0+(?=\d)/, ''); // drop leading zeros
      if (tok.length <= 2) continue; // cents / small counts / thousands halves
      if (/^0+$/.test(tok)) continue; // all-zero run
      out.add(tok);
    }
  }
  return out;
}

// A rule applies to a spoken language when it is invariant, or its langs tag
// includes that language (currently en / es).
export function ruleAppliesTo(rule, lang) {
  const tags = rule.langs || ['invariant'];
  return tags.includes('invariant') || tags.includes(lang);
}

export function scanPatterns(text, lang) {
  const hits = [];
  for (const rule of BLOCKED) {
    if (!ruleAppliesTo(rule, lang)) continue;
    rule.pattern.lastIndex = 0;
    let match;
    while ((match = rule.pattern.exec(text)) !== null) {
      const start = Math.max(0, match.index - 60);
      const end = Math.min(text.length, match.index + match[0].length + 60);
      const ctx = text.slice(start, end);
      if (ALLOWED_CONTEXTS.some((re) => re.test(ctx))) continue;
      const matched = match[0];
      if (matched.startsWith('http') && ALLOWED_DEEP_LINKS.has(normalizeUrlMatch(matched))) continue;
      const lineNum = text.slice(0, match.index).split('\n').length;
      hits.push({ line: lineNum, label: rule.label, match: matched, fix: rule.fix });
    }
  }
  return hits;
}

// Joined form of separator-grouped numbers: "$3,000" -> "3000", "1.176,28"
// -> "117628". Added to the SOURCE set so a separator-less language (zh/ja
// write "3000", not "3,000") matches an EN/es source whose digit-runs were
// atomized by the comma/period. Source-only: it can only make matching MORE
// conservative, never invent a spoken flag.
function joinedNumbers(text) {
  const out = new Set();
  if (!text) return out;
  const re = /\d[\d.,   ]*\d/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const tok = m[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    if (tok.length >= 3 && !/^0+$/.test(tok)) out.add(tok);
  }
  return out;
}

// Source-of-truth numbers for a post: the fact-gated article HTML plus the
// source-language narration. A number the translation speaks that is absent
// here was introduced after the gate — the parity signal. We index both the
// digit-runs and the joined forms so locale separator conventions (separated
// vs separator-less) don't create phantom mismatches.
function sourceNumbers(dir) {
  const nums = new Set();
  for (const name of ['index.html', 'audio.json']) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) {
      const text = fs.readFileSync(p, 'utf8');
      for (const n of extractNumbers(text)) nums.add(n);
      for (const n of joinedNumbers(text)) nums.add(n);
    }
  }
  return nums;
}

function main() {
const files = walk(repoRoot);
const patternViolations = [];
const parityWarnings = [];
const waivedHits = []; // pattern hits inside a known-stale, awaiting-re-render post
const waiversUsed = new Set();

for (const file of files) {
  const rel = path.relative(repoRoot, file);
  const base = path.basename(file);
  const lang = langOf(base);
  const text = spokenText(file);
  if (!text) continue;

  const waiver = waiverFor(rel);
  for (const h of scanPatterns(text, lang)) {
    if (waiver) {
      waiversUsed.add(waiver.dir);
      waivedHits.push({ file: rel, ...h });
    } else {
      patternViolations.push({ file: rel, ...h });
    }
  }

  // Parity only for non-source tracks (audio.json defines the baseline).
  if (base !== 'audio.json') {
    const src = sourceNumbers(path.dirname(file));
    const spoken = extractNumbers(text);
    const stray = [...spoken].filter((n) => !src.has(n) && !PARITY_ALLOW.has(n));
    if (stray.length) parityWarnings.push({ file: rel, lang, stray });
  }
}

const checkOnly = process.argv.includes('--check');

// ---- Known-stale waivers (loud, never silent) ----
if (waivedHits.length) {
  console.warn(
    `check-audio-fabrications: ${waivedHits.length} pattern hit(s) WAIVED as known-stale, awaiting re-render:`
  );
  for (const w of STALE_AUDIO_WAIVERS) {
    if (waiversUsed.has(w.dir)) {
      const n = waivedHits.filter((h) => h.file.startsWith(w.dir)).length;
      console.warn(`  ${w.dir}/ — ${n} hit(s) — ${w.note}`);
    }
  }
  console.warn(
    '  These are tracked re-render tasks (docs/editorial/ground-truth-pack.md). '
      + 'Re-render via scripts/render-post-audio.mjs, then delete the waiver.\n'
  );
}
// Flag waivers that no longer match anything — keep the allowlist honest.
const staleWaivers = STALE_AUDIO_WAIVERS.filter((w) => !waiversUsed.has(w.dir));
if (staleWaivers.length) {
  console.warn('check-audio-fabrications: waiver(s) no longer needed — remove from STALE_AUDIO_WAIVERS:');
  for (const w of staleWaivers) console.warn(`  ${w.dir}/`);
  console.warn('');
}

// ---- Numeric-parity warnings (warn-first; never affect exit code yet) ----
if (parityWarnings.length) {
  console.warn(
    `check-audio-fabrications: numeric-parity warnings (warn-only) — ${parityWarnings.length} file(s):`
  );
  for (const w of parityWarnings) {
    console.warn(`  ${w.file} [${w.lang}] numbers not found in source: ${w.stray.join(', ')}`);
  }
  console.warn(
    '  Review: a spoken figure absent from the article is a translation drift. '
      + 'If it is a formatting artifact, add it to PARITY_ALLOW with a dated reason.\n'
  );
}

// ---- Pattern-tier violations (fail-CI) ----
if (patternViolations.length === 0) {
  console.log(`check-audio-fabrications: 0 pattern hits across ${files.length} narration file(s).`);
  process.exit(0);
}

console.error(`check-audio-fabrications: ${patternViolations.length} pattern hit(s) in spoken scripts:\n`);
const byFile = new Map();
for (const v of patternViolations) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}
for (const [file, vs] of byFile) {
  console.error(`  ${file}`);
  for (const v of vs) {
    console.error(`    L${v.line}: ${v.label}`);
    console.error(`           spoken: "${v.match.replace(/\s+/g, ' ').slice(0, 80)}"`);
    console.error(`           fix: ${v.fix}`);
  }
  console.error('');
}
console.error('Audio narration is read aloud verbatim. Do not hand-edit the spoken text to');
console.error('hide a fabrication — fix the source article and re-render via');
console.error('scripts/render-post-audio.mjs. See docs/fact-check.md for the editorial rule.');
process.exit(checkOnly ? 1 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) main();
