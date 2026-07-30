#!/usr/bin/env node
/**
 * check-cost-index-orphans.mjs — no published ingredient page may outlive its data.
 *
 * THE FAILURE THIS EXISTS TO CATCH (found 2026-07-30, never previously gated):
 * `scripts/build-cost-index.mjs` drops an ingredient from data/cost-index.json
 * when every one of its points fails the vendor predicate — the carry-forward
 * path's `if (!kept.length) continue;`. That drop is DESIGN-INTENDED for the
 * data (a dead feed must age out rather than freeze a stale level), but it is
 * silent, and nothing downstream cleans up after it:
 *
 *   - `gatedSlugs()` in build-cost-index-pages.mjs requires `points[0]`, so a
 *     dropped ingredient simply stops being regenerated;
 *   - nothing deletes cost-index/<slug>/index.html or its /es/ mirror, and
 *     build-sitemap.mjs walks directories, so the page stays published and
 *     stays in sitemap.xml;
 *   - the page builder's own --check only diffs files it still generates, so
 *     the orphan is invisible to it.
 *
 * Net effect: the price freezes permanently on a live, published, bilingual
 * page while every gate reads green — the exact inversion of the honesty
 * rationale in check-cost-index-sync.mjs ("a stale point must never render as
 * a 'current' price"). Slugs are final-forever here, so the answer is never
 * "delete the page quietly"; it is "notice, then decide".
 *
 * Simulated against the committed data on 2026-07-30: the next refresh drops
 * 1 ingredient (scallops), 2026-08-30 drops 11, 2026-09-30 drops 26.
 *
 * The rule is one-directional and deliberately so: every published page must
 * have live data. Data WITHOUT a page is fine — that is coverage in progress
 * (100 ingredients, 94 pages today).
 *
 *   node scripts/check-cost-index-orphans.mjs
 *   node scripts/check-cost-index-orphans.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Directories under cost-index/ that are editorial surfaces, not ingredients.
 * Kept explicit rather than pattern-matched: a typo'd ingredient slug must show
 * up as an orphan, not be silently swallowed by a clever heuristic. The gate
 * cross-checks this list against the data (below), so an entry that later
 * becomes a real ingredient is reported instead of masking it.
 */
const NON_INGREDIENT = new Set([
  'basket',       // the composite basket explainer
  'events',       // the notable-price-events surface (ADR-011)
  'lab',          // methodology lab
  'menu-pricing', // the menu-pricing playbook (ADR-016)
  'methodology',  // how the index is built
  'sources',      // the source register
  'weekly',       // the edition archive (ADR-010)
]);

/**
 * findOrphans — pure core, so --self-test can drive it without a filesystem.
 *
 * @param {Array<{rel: string, slug: string}>} pages  published ingredient pages
 * @param {Record<string, {points?: Array<unknown>}>} ingredients  data/cost-index.json ingredients
 * @param {Set<string>} nonIngredient  editorial-surface allowlist
 * @returns {string[]} issue strings (empty when clean)
 */
export function findOrphans(pages, ingredients, nonIngredient) {
  const issues = [];
  for (const { rel, slug } of pages) {
    if (nonIngredient.has(slug)) continue;
    const entry = ingredients[slug];
    if (!entry) {
      issues.push(`${rel} is published but "${slug}" is absent from data/cost-index.json — the page will never be regenerated again and its price is frozen.`);
    } else if (!Array.isArray(entry.points) || !entry.points[0]) {
      issues.push(`${rel} is published but "${slug}" has no points[0] — gatedSlugs() skips it, so the page is frozen at its last build.`);
    }
  }
  // The allowlist must not be able to hide a real ingredient.
  for (const slug of nonIngredient) {
    if (ingredients[slug]) {
      issues.push(`"${slug}" is on the NON_INGREDIENT allowlist but IS an ingredient in data/cost-index.json — remove it from the allowlist so its page is actually checked.`);
    }
  }
  return issues;
}

/** Published ingredient-page dirs across the EN + ES trees. */
function collectPages() {
  const pages = [];
  for (const dir of ['cost-index', 'es/cost-index']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const rel = `${dir}/${entry.name}/index.html`;
      if (!fs.existsSync(path.join(repoRoot, rel))) continue; // a dir with no page is not published
      pages.push({ rel, slug: entry.name });
    }
  }
  return pages;
}

function selfTest() {
  const NI = new Set(['events']);
  const cases = [
    ['clean tree passes',
      [{ rel: 'cost-index/ribeye/index.html', slug: 'ribeye' }],
      { ribeye: { points: [{ asOf: '2026-07-28' }] } }, 0],
    ['ingredient dropped from data is an orphan',
      [{ rel: 'cost-index/scallops/index.html', slug: 'scallops' }],
      { ribeye: { points: [{ asOf: '2026-07-28' }] } }, 1],
    ['ingredient present but emptied of points is an orphan',
      [{ rel: 'cost-index/scallops/index.html', slug: 'scallops' }],
      { scallops: { points: [] } }, 1],
    ['ES mirror is checked too',
      [{ rel: 'es/cost-index/octopus/index.html', slug: 'octopus' }],
      {}, 1],
    ['editorial surface is exempt',
      [{ rel: 'cost-index/events/index.html', slug: 'events' }],
      {}, 0],
    ['allowlist cannot mask a real ingredient',
      [], { events: { points: [{ asOf: '2026-07-28' }] } }, 1],
    ['data without a page is fine (coverage in progress)',
      [], { ribeye: { points: [{ asOf: '2026-07-28' }] } }, 0],
  ];
  let failed = 0;
  for (const [name, pages, ingredients, expected] of cases) {
    const got = findOrphans(pages, ingredients, NI).length;
    if (got !== expected) { console.error(`  ✗ ${name}: expected ${expected} issue(s), got ${got}`); failed++; }
  }
  if (failed) { console.error(`✗ check-cost-index-orphans self-test: ${failed}/${cases.length} case(s) failed.`); process.exit(1); }
  console.log(`check-cost-index-orphans self-test: ${cases.length}/${cases.length} passed.`);
  process.exit(0);
}

function main() {
  if (process.argv.includes('--self-test')) selfTest();

  const pages = collectPages();
  const index = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8'));
  const issues = findOrphans(pages, index.ingredients || {}, NON_INGREDIENT);

  if (issues.length) {
    console.error(`✗ Cost-index orphans: ${issues.length} published page(s) have no live data:`);
    for (const i of issues) console.error(`  - ${i}`);
    console.error('  Slugs are final-forever: re-source the feed, or retire the page deliberately (301 + sitemap), never leave it frozen.');
    process.exit(1);
  }
  const checked = pages.filter((p) => !NON_INGREDIENT.has(p.slug)).length;
  console.log(`cost-index orphans: OK — ${checked} published ingredient page(s) (EN+ES) all still have live data in data/cost-index.json.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
