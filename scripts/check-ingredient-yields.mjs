#!/usr/bin/env node
/**
 * check-ingredient-yields.mjs — the manifest fact-gate for ingredient pages.
 *
 * data/ingredient-yields.json drives every ingredient-yield page. This gate
 * proves the manifest is well-formed AND that every rendered yield is SOURCED:
 *   - yield_key entries must resolve in the canonical YIELD_TABLE
 *     (tools/plate-cost/plate-cost.js, the cited CIA source) AND match its value
 *     to 3dp — so a typo'd yield can never ship (it's the same number, one home).
 *   - the few entries with no table key must declare a yield_source (e.g.
 *     "usda-fbg") so an unsourced yield is impossible.
 * Plus structural rules: unique kebab slug, valid category, bilingual name +
 * units, yield in (0,1].
 *
 * Usage:
 *   node scripts/check-ingredient-yields.mjs            # report + exit 0
 *   node scripts/check-ingredient-yields.mjs --check    # CI gate (exit 1 on any issue)
 *   node scripts/check-ingredient-yields.mjs --self-test
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(repoRoot, 'data/ingredient-yields.json');

// The valid category keys, kept in lockstep with CATEGORIES in the builder.
const CATEGORIES = new Set(['greens', 'cruciferous', 'stalks', 'allium', 'root', 'tuber',
  'fruiting', 'fruit', 'citrus', 'meat', 'beef', 'seafood', 'shellfish', 'mushroom', 'herbs']);

// Read the canonical YIELD_TABLE (the cited CIA/USDA source) straight from
// plate-cost.js so this gate and the pages share one truth.
export function readYieldTable() {
  const pc = readFileSync(path.join(repoRoot, 'tools/plate-cost/plate-cost.js'), 'utf8');
  const m = pc.match(/var YIELD_TABLE\s*=\s*\{([\s\S]*?)\n {2}\};/);
  const tbl = {};
  if (m) for (const x of m[1].matchAll(/['"]([^'"]+)['"]\s*:\s*([0-9.]+)/g)) tbl[x[1]] = parseFloat(x[2]);
  return tbl;
}

export function manifestIssues(rows, tbl) {
  const issues = [];
  const seen = new Set();
  for (const r of rows || []) {
    const at = `[${r && r.slug ? r.slug : '?'}]`;
    if (!r || typeof r.slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)) { issues.push(`${at} slug missing or not kebab-case`); continue; }
    if (seen.has(r.slug)) issues.push(`${at} duplicate slug`);
    seen.add(r.slug);
    if (!r.en || !r.es) issues.push(`${at} needs both en and es names`);
    if (!r.unit_en || !r.unit_es) issues.push(`${at} needs both unit_en and unit_es`);
    if (!CATEGORIES.has(r.cat)) issues.push(`${at} unknown cat "${r.cat}"`);
    if (!(typeof r.yield === 'number' && r.yield > 0 && r.yield <= 1)) issues.push(`${at} yield must be in (0,1], got ${r.yield}`);
    // The sourced-yield proof:
    if (r.yield_key != null) {
      if (!(r.yield_key in tbl)) issues.push(`${at} yield_key "${r.yield_key}" not in YIELD_TABLE`);
      else if (Math.abs(tbl[r.yield_key] - r.yield) > 5e-4) issues.push(`${at} yield ${r.yield} != YIELD_TABLE["${r.yield_key}"]=${tbl[r.yield_key]} (drift)`);
    } else if (!r.yield_source) {
      issues.push(`${at} has no yield_key and no yield_source — yield must be sourced`);
    }
  }
  return issues;
}

function run(check) {
  let rows;
  try { rows = JSON.parse(readFileSync(MANIFEST, 'utf8')); }
  catch (e) { console.error(`check-ingredient-yields: cannot read manifest: ${e.message}`); return 1; }
  const tbl = readYieldTable();
  const issues = manifestIssues(rows, tbl);
  const keyed = rows.filter((r) => r.yield_key).length;
  const fbg = rows.filter((r) => r.yield_source).length;
  if (issues.length) {
    issues.forEach((i) => console.log('  ✗ ' + i));
    console.error(`check-ingredient-yields: ${issues.length} issue(s) across ${rows.length} ingredient(s).`);
    return check ? 1 : 0;
  }
  console.log(`check-ingredient-yields: ${rows.length} ingredient(s) — ${keyed} yield_key-sourced (match CIA table), ${fbg} USDA-FBG-sourced; all well-formed.`);
  return 0;
}

function selfTest() {
  const tbl = { romaine: 0.75, ribeye: 0.75 };
  const ok = manifestIssues([{ slug: 'romaine-lettuce', en: 'R', es: 'R', unit_en: 'head', unit_es: 'pieza', cat: 'greens', yield: 0.75, yield_key: 'romaine' }], tbl);
  const drift = manifestIssues([{ slug: 'x', en: 'X', es: 'X', unit_en: 'lb', unit_es: 'libra', cat: 'greens', yield: 0.60, yield_key: 'romaine' }], tbl);
  const noSrc = manifestIssues([{ slug: 'y', en: 'Y', es: 'Y', unit_en: 'lb', unit_es: 'libra', cat: 'greens', yield: 0.5 }], tbl);
  const fbg = manifestIssues([{ slug: 'z', en: 'Z', es: 'Z', unit_en: 'lb', unit_es: 'libra', cat: 'greens', yield: 0.5, yield_source: 'usda-fbg' }], tbl);
  const badSlug = manifestIssues([{ slug: 'Bad_Slug', en: 'B', es: 'B', unit_en: 'lb', unit_es: 'libra', cat: 'greens', yield: 0.5, yield_source: 'x' }], tbl);
  const a = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exitCode = 1; } };
  a(ok.length === 0, 'valid keyed entry passes');
  a(drift.some((i) => /drift/.test(i)), 'value drift caught');
  a(noSrc.some((i) => /must be sourced/.test(i)), 'unsourced yield caught');
  a(fbg.length === 0, 'fbg-sourced entry passes');
  a(badSlug.some((i) => /kebab/.test(i)), 'bad slug caught');
  console.log(process.exitCode ? 'ingredient-yields self-test: FAILURES above.' : 'ingredient-yields self-test: 5/5 passed.');
  return process.exitCode || 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest());
  process.exit(run(process.argv.includes('--check')));
}
