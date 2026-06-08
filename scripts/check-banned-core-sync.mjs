#!/usr/bin/env node
/**
 * Tier-1 banned-core sync guard.
 *
 * The shared cross-brand Tier-1 vocabulary lives in TWO gate files —
 * {site}/scripts/check-banned-words.mjs and
 * {product}/scripts/check-verboten-phrases.mjs — and the canon (§3a) says
 * "keep the two lists in sync." Prose does not hold that line; this gate does.
 *
 * Single source of truth: data/banned-core.json (vendored byte-identically
 * into both repos). This check:
 *   1. Parses the local gate's `tier1-core:start … tier1-core:end` block and
 *      asserts its regex bodies (and, where present, names) match the manifest.
 *   2. If the sibling repo is reachable (env MUNTIN_SIBLING_REPO, or a default
 *      sibling dir), asserts its vendored manifest is byte-identical to ours and
 *      validates its gate block too. When the sibling is absent (a single-repo
 *      CI), that arm is skipped with a notice — never a silent pass on real drift.
 *
 * Modes:
 *   node scripts/check-banned-core-sync.mjs            # report + fail on drift
 *   node scripts/check-banned-core-sync.mjs --check    # same (harness alias)
 *   node scripts/check-banned-core-sync.mjs --self-test # prove drift is caught
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

// Gate files this guard knows how to parse, by repo-relative path. A repo
// carries one of them; the sibling carries the other.
const GATE_FILES = [
  'scripts/check-banned-words.mjs',       // {site}
  'scripts/check-verboten-phrases.mjs',   // {product}
];

const MANIFEST_REL = 'data/banned-core.json';

// Pull the regex bodies (and any `word:` names) out of a gate file's
// tier1-core sentinel block. Bodies contain no '/' or ',', so a per-literal
// match is unambiguous.
function extractTier1(gateSource, label) {
  const start = gateSource.indexOf('tier1-core:start');
  const end = gateSource.indexOf('tier1-core:end');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${label}: missing tier1-core:start/end sentinels`);
  }
  const block = gateSource.slice(start, end);
  const bodies = [];
  const names = [];
  const re = /(?:rx|pattern):\s*\/(.+?)\/[a-z]*\s*,/g;
  let m;
  while ((m = re.exec(block))) bodies.push(m[1]);
  const nre = /word:\s*'([^']+)'/g;
  while ((m = nre.exec(block))) names.push(m[1]);
  return { bodies, names };
}

function loadManifest(file, label) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`${label}: cannot read/parse ${file} — ${e.message}`);
  }
  if (!Array.isArray(parsed.tier1)) throw new Error(`${label}: no tier1[] array`);
  return parsed.tier1;
}

const sortedJoin = (arr) => [...arr].sort().join('\n');

const problems = [];
const notes = [];

// ── self-test ────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  const manifest = loadManifest(path.join(repoRoot, MANIFEST_REL), 'manifest');
  const canonical = manifest.map((e) => e.body);
  // a gate that drops one core word must be caught
  const drifted = canonical.slice(1);
  const ok1 = sortedJoin(drifted) !== sortedJoin(canonical);
  // a gate that adds a stray word must be caught
  const extra = [...canonical, '\\bextra\\b'];
  const ok2 = sortedJoin(extra) !== sortedJoin(canonical);
  // a renamed body (anchor dropped) must be caught
  const mutated = canonical.map((b, i) => (i === 0 ? b.replace(/\\b/g, '') : b));
  const ok3 = sortedJoin(mutated) !== sortedJoin(canonical);
  if (ok1 && ok2 && ok3) {
    console.log('check-banned-core-sync --self-test: PASS (drop, add, and mutate all detected).');
    process.exit(0);
  }
  console.error('check-banned-core-sync --self-test: FAIL', { ok1, ok2, ok3 });
  process.exit(1);
}

// ── canonical manifest (this repo) ─────────────────────────────────────────
const manifestPath = path.join(repoRoot, MANIFEST_REL);
const manifest = loadManifest(manifestPath, 'local manifest');
const canonBodies = manifest.map((e) => e.body);
const canonNames = manifest.map((e) => e.name);
const manifestRaw = fs.readFileSync(manifestPath, 'utf8');

function validateGate(absGatePath, label, { checkNames }) {
  const src = fs.readFileSync(absGatePath, 'utf8');
  const { bodies, names } = extractTier1(src, label);
  if (sortedJoin(bodies) !== sortedJoin(canonBodies)) {
    problems.push(
      `${label}: Tier-1 regex bodies differ from ${MANIFEST_REL}.\n` +
        `      gate:     ${sortedJoin(bodies).replace(/\n/g, ' | ')}\n` +
        `      manifest: ${sortedJoin(canonBodies).replace(/\n/g, ' | ')}`,
    );
  }
  if (checkNames && names.length && sortedJoin(names) !== sortedJoin(canonNames)) {
    problems.push(`${label}: Tier-1 names differ from manifest.`);
  }
  notes.push(`  ✓ ${label}: ${bodies.length} Tier-1 entries match.`);
}

// Local gate(s)
let localGateFound = false;
for (const rel of GATE_FILES) {
  const abs = path.join(repoRoot, rel);
  if (fs.existsSync(abs)) {
    localGateFound = true;
    validateGate(abs, `local ${rel}`, { checkNames: rel.includes('check-banned-words') });
  }
}
if (!localGateFound) problems.push(`no known gate file found under ${repoRoot}`);

// ── sibling repo (cross-repo arm) ──────────────────────────────────────────
function findSibling() {
  const candidates = [
    process.env.MUNTIN_SIBLING_REPO,
    path.resolve(repoRoot, '..', 'Muntin-Invoice-Decoder'),
    path.resolve(repoRoot, '..', 'muntin-invoice-decoder'),
    path.resolve(repoRoot, '..', 'potentially-profitable'),
  ].filter(Boolean);
  for (const c of candidates) {
    if (path.resolve(c) === repoRoot) continue; // not ourselves
    if (fs.existsSync(path.join(c, MANIFEST_REL))) return c;
  }
  return null;
}

const sibling = findSibling();
if (sibling) {
  // manifests must be byte-identical
  const sibRaw = fs.readFileSync(path.join(sibling, MANIFEST_REL), 'utf8');
  if (sibRaw !== manifestRaw) {
    problems.push(
      `sibling manifest ${path.join(sibling, MANIFEST_REL)} is NOT byte-identical to this repo's ${MANIFEST_REL}. Copy one over the other.`,
    );
  } else {
    notes.push(`  ✓ sibling manifest byte-identical (${path.basename(sibling)}).`);
  }
  for (const rel of GATE_FILES) {
    const abs = path.join(sibling, rel);
    if (fs.existsSync(abs)) {
      validateGate(abs, `sibling ${rel}`, { checkNames: rel.includes('check-banned-words') });
    }
  }
} else {
  notes.push('  · sibling repo not present — cross-repo arm skipped (single-repo run).');
}

// ── verdict ────────────────────────────────────────────────────────────────
if (problems.length === 0) {
  console.log('Banned-core sync: clean.');
  for (const n of notes) console.log(n);
  process.exit(0);
}
console.error('\nBanned-core sync DRIFT:\n');
for (const p of problems) console.error('  ✗ ' + p);
console.error('\nThe shared Tier-1 core must match data/banned-core.json in both gates.');
console.error('Canon: docs/brand/voice-and-naming-architecture.md §3a.\n');
process.exit(1);
