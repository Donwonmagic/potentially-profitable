#!/usr/bin/env node
/**
 * build-cost-index-proxies.mjs — derive each Cost Index ingredient's LEVEL
 * provenance from the source registry (data/cost-index-sources.json): does it
 * have an independent wholesale $-level, or only a directional/index source, and
 * which ingredients draw the SAME underlying source (so their levels are not
 * independent of each other)?
 *
 * This is the honest, upstream-derived counterpart to the structural clone scan
 * in build-cost-index-audit.mjs. The registry knows the truth: e.g. ground-pork
 * and pork-shoulder both read LMR 2498 `pork_butt` (a documented proxy), the
 * salmon variants share one NOAA HTS pair, shrimp is `basis:index` (no level),
 * and vegetable-oil has only PPI sources (directional — no dollar level exists).
 * Nothing is invented and no verified flag is touched; this only surfaces what
 * the registry already encodes, as a manifest the pipeline and audit can consume.
 *
 *   node scripts/build-cost-index-proxies.mjs            # write data/cost-index-proxies.json
 *   node scripts/build-cost-index-proxies.mjs --check    # CI: exit 1 if stale
 *   node scripts/build-cost-index-proxies.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repo = path.resolve(path.dirname(__filename), '..');
const OUT = path.join(repo, 'data', 'cost-index-proxies.json');
const rd = (p) => { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } };

// The LEVEL source for an ingredient (what produces a publishable $-level), and
// whether that level is independent. A trailing FRED/BLS `basis:index` entry is a
// TREND source, never a level — so an ingredient with only those is directional.
function levelSource(e) {
  if (e.lmr) {
    const f = e.lmr.fields && e.lmr.fields.price;
    const cols = Array.isArray(f) ? f.join('|') : (f ? String(f) : '');
    const tag = e.lmr.commodity || cols || '?';
    return { basis: 'wholesale', key: 'lmr:' + e.lmr.reportId + ':' + tag };
  }
  if (e.noaa && e.noaa.basis !== 'index') {
    const hts = Array.isArray(e.noaa.hts) ? e.noaa.hts.slice().sort().join('+') : String(e.noaa.hts || '');
    return { basis: 'wholesale', key: 'noaa:' + hts };
  }
  return { basis: 'index', key: null }; // PPI/index or NOAA index → directional, no $-level
}

function build() {
  const reg = rd('data/cost-index-sources.json');
  if (!reg || !reg.ingredients) return { _doc: 'inputs missing', _version: 1, error: 'missing-inputs' };
  const R = reg.ingredients;
  const slugs = Object.keys(R).sort();

  // Group ingredients by their LEVEL sourceKey (non-null = has a wholesale level).
  const byKey = {};
  const ing = {};
  for (const k of slugs) {
    const ls = levelSource(R[k] || {});
    ing[k] = { levelBasis: ls.basis, sourceKey: ls.key, independentLevel: ls.basis === 'wholesale', sharedWith: [] };
    if (ls.key) (byKey[ls.key] = byKey[ls.key] || []).push(k);
  }

  // Ingredients that draw the SAME level source are not independent of each other.
  const sharedSourceGroups = [];
  for (const key of Object.keys(byKey).sort()) {
    const members = byKey[key].slice().sort();
    if (members.length < 2) continue;
    sharedSourceGroups.push({ sourceKey: key, members, canonical: members[0] });
    for (const m of members) {
      ing[m].independentLevel = false;
      ing[m].sharedWith = members.filter((x) => x !== m);
    }
  }

  const withWholesale = slugs.filter((k) => ing[k].levelBasis === 'wholesale').length;
  const indexOnly = slugs.length - withWholesale;
  const ingredientsSharingSource = sharedSourceGroups.reduce((n, g) => n + g.members.length, 0);

  return {
    _doc: 'Per-ingredient LEVEL provenance, derived from data/cost-index-sources.json. levelBasis "wholesale" = an LMR/NOAA source yields a $-level; "index" = only PPI/index (FRED/BLS) or NOAA index sources exist → DIRECTIONAL, no dollar level. sharedSourceGroups = ingredients drawing the identical level source (their levels are not independent — e.g. a documented proxy). Derived only; nothing invented, no verified flag touched. Deterministic. Built by scripts/build-cost-index-proxies.mjs; CI re-checks with --check.',
    _version: 1,
    source: { registry: 'data/cost-index-sources.json' },
    asOf: reg.generatedAt || reg._version || null,
    summary: {
      count: slugs.length,
      withWholesaleLevel: withWholesale,
      indexOnly,
      sharedSourceGroups: sharedSourceGroups.length,
      ingredientsSharingSource
    },
    sharedSourceGroups,
    ingredients: ing
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    const s = report.summary || {};
    const checks = [
      ['inputs present', !report.error],
      ['shared groups have >=2 members', report.sharedSourceGroups.every((g) => g.members.length >= 2)],
      ['index-basis ingredients are not independent levels', Object.values(report.ingredients).every((v) => v.levelBasis !== 'index' || v.independentLevel === false)],
      ['shared-group members are flagged non-independent', report.sharedSourceGroups.every((g) => g.members.every((m) => report.ingredients[m].independentLevel === false))],
      ['summary counts match', s.sharedSourceGroups === report.sharedSourceGroups.length && (s.withWholesaleLevel + s.indexOnly) === s.count],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)]
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-index-proxies self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let cur = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    if (cur !== json) { console.error('✗ cost-index proxies is stale — run: node scripts/build-cost-index-proxies.mjs'); process.exit(1); }
    console.log('✓ cost-index proxies in sync with the registry.');
    return;
  }

  writeFileSync(OUT, json);
  const s = report.summary;
  console.log(`cost-index-proxies: ${s.withWholesaleLevel} wholesale-level, ${s.indexOnly} index-only, ${s.sharedSourceGroups} shared-source group(s) across ${s.count} ingredient(s).`);
}

main();
