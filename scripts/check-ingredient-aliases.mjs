#!/usr/bin/env node
/**
 * check-ingredient-aliases.mjs — the fact-gate for the distributor-tie alias
 * registry (data/ingredient-aliases.json).
 *
 * The registry collapses generic distributor labels (scallion → green-onion,
 * aubergine → eggplant) onto ONE Cost Index key so the same item under a
 * different name reads as one tracked price. For that collapse to be honest the
 * registry has to be unambiguous and sourced. This gate proves:
 *
 *   - every canonical key is a REAL Cost Index ingredient key
 *     (data/cost-index-sources.json#ingredients) — an alias can only point at
 *     something the index actually tracks;
 *   - every alias stem is already in extractStem() canonical form
 *     (tools/_shared/stem.js) — lowercase, accent-stripped, pack-token-free —
 *     so it will actually match a stem extracted from a real SKU line;
 *   - no stem SHADOWS a different tracked ingredient (a stem may not equal any
 *     Cost Index key's own de-slugged name) — that would make the collapse
 *     ambiguous (e.g. aliasing "tomato" under "cherry-tomato");
 *   - no stem maps to two canonical keys (globally unique);
 *   - each entry declares a boolean `verified` (verified:false = staged, same
 *     regime as staged price sources — present but dormant until confirmed
 *     against a real catalog).
 *
 * Usage:
 *   node scripts/check-ingredient-aliases.mjs            # report + exit 0
 *   node scripts/check-ingredient-aliases.mjs --check    # CI gate (exit 1 on any issue)
 *   node scripts/check-ingredient-aliases.mjs --self-test
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const REGISTRY = path.join(repoRoot, 'data/ingredient-aliases.json');
const { extractStem } = require(path.join(repoRoot, 'tools/_shared/stem.js'));

// de-slug a Cost Index key to the stem its own name would normalize to, so we
// can forbid an alias from shadowing a different tracked ingredient.
const deSlug = (k) => extractStem(String(k).replace(/-/g, ' '));

export function aliasIssues(registry, costKeys) {
  const issues = [];
  const keys = new Set(costKeys || []);
  const keyStems = new Map();                 // de-slug stem → owning key
  for (const k of keys) keyStems.set(deSlug(k), k);
  const aliases = (registry && registry.aliases) || {};
  const stemOwner = new Map();                // stem → canonical key (global uniqueness)
  for (const [canon, entry] of Object.entries(aliases)) {
    const at = `[${canon}]`;
    if (!keys.has(canon)) issues.push(`${at} not a Cost Index key`);
    if (!entry || !Array.isArray(entry.stems) || !entry.stems.length) { issues.push(`${at} needs a non-empty stems[]`); continue; }
    if (typeof entry.verified !== 'boolean') issues.push(`${at} needs a boolean "verified"`);
    for (const stem of entry.stems) {
      if (typeof stem !== 'string' || !stem.trim()) { issues.push(`${at} has an empty stem`); continue; }
      if (extractStem(stem) !== stem) { issues.push(`${at} stem "${stem}" is not in canonical extractStem form (expected "${extractStem(stem)}")`); continue; }
      const shadows = keyStems.get(stem);
      if (shadows && shadows !== canon) issues.push(`${at} stem "${stem}" shadows the tracked key "${shadows}"`);
      const prev = stemOwner.get(stem);
      if (prev && prev !== canon) issues.push(`${at} stem "${stem}" already maps to "${prev}" (a stem must collapse to one key)`);
      stemOwner.set(stem, canon);
    }
  }
  return issues;
}

function costKeysFromSources() {
  const s = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index-sources.json'), 'utf8'));
  return Object.keys(s.ingredients || {});
}

function run(check) {
  let registry;
  try { registry = JSON.parse(readFileSync(REGISTRY, 'utf8')); }
  catch (e) { console.error(`check-ingredient-aliases: cannot read registry: ${e.message}`); return 1; }
  const costKeys = costKeysFromSources();
  const issues = aliasIssues(registry, costKeys);
  const aliases = (registry && registry.aliases) || {};
  const nCanon = Object.keys(aliases).length;
  const nStems = Object.values(aliases).reduce((a, e) => a + ((e && e.stems) || []).length, 0);
  const nVerified = Object.values(aliases).filter((e) => e && e.verified).length;
  if (issues.length) {
    issues.forEach((i) => console.log('  ✗ ' + i));
    console.error(`check-ingredient-aliases: ${issues.length} issue(s) across ${nCanon} canonical key(s).`);
    return check ? 1 : 0;
  }
  console.log(`check-ingredient-aliases: ${nCanon} canonical key(s), ${nStems} alias stem(s) (${nVerified} verified, ${nCanon - nVerified} staged); all resolve, are canonical, and are unambiguous.`);
  return 0;
}

function selfTest() {
  const costKeys = ['green-onion', 'eggplant', 'tomato', 'cherry-tomato', 'shrimp'];
  const ok = aliasIssues({ aliases: { 'green-onion': { stems: ['scallion'], verified: false } } }, costKeys);
  const badKey = aliasIssues({ aliases: { 'not-tracked': { stems: ['x'], verified: false } } }, costKeys);
  const dirtyStem = aliasIssues({ aliases: { eggplant: { stems: ['Aubergine 12CT'], verified: false } } }, costKeys);
  const shadow = aliasIssues({ aliases: { 'cherry-tomato': { stems: ['tomato'], verified: false } } }, costKeys);
  const dupe = aliasIssues({ aliases: { 'green-onion': { stems: ['prawn'], verified: false }, shrimp: { stems: ['prawn'], verified: false } } }, costKeys);
  const noVer = aliasIssues({ aliases: { eggplant: { stems: ['aubergine'] } } }, costKeys);
  const a = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exitCode = 1; } };
  a(ok.length === 0, 'valid alias passes');
  a(badKey.some((i) => /not a Cost Index key/.test(i)), 'non-tracked canonical caught');
  a(dirtyStem.some((i) => /canonical extractStem form/.test(i)), 'non-canonical stem caught');
  a(shadow.some((i) => /shadows the tracked key/.test(i)), 'shadowing stem caught');
  a(dupe.some((i) => /must collapse to one key/.test(i)), 'duplicate stem caught');
  a(noVer.some((i) => /boolean "verified"/.test(i)), 'missing verified caught');
  console.log(process.exitCode ? 'ingredient-aliases self-test: FAILURES above.' : 'ingredient-aliases self-test: 6/6 passed.');
  return process.exitCode || 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest());
  process.exit(run(process.argv.includes('--check')));
}
