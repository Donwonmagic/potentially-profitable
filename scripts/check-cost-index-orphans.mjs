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
 *   - `gatedSlugs()` in build-cost-index-pages.mjs requires THREE things —
 *     membership in the ING_META literal, `points[0]`, AND an entry in
 *     data/cost-index-labels.json — so losing ANY of them stops the page being
 *     regenerated. The label map is hand-curated and loaded inside a try/catch
 *     that degrades silently to `{}`, so a lost label freezes a page just as
 *     completely as lost data, while the data still looks healthy. This gate
 *     checks all three; an earlier version modelled only `points[0]` and would
 *     have reported those orphans as clean;
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
export function findOrphans(pages, ingredients, nonIngredient, labels = null, ingMeta = null) {
  const issues = [];
  for (const { rel, slug } of pages) {
    if (nonIngredient.has(slug)) continue;
    const entry = ingredients[slug];
    if (!entry) {
      issues.push(`${rel} is published but "${slug}" is absent from data/cost-index.json — the page will never be regenerated again and its price is frozen.`);
    } else if (!Array.isArray(entry.points) || !entry.points[0]) {
      issues.push(`${rel} is published but "${slug}" has no points[0] — gatedSlugs() skips it, so the page is frozen at its last build.`);
    } else if (labels && !labels[slug]) {
      // gatedSlugs() has THREE terms, not one. LABELS comes from the
      // hand-curated data/cost-index-labels.json, loaded inside a try/catch that
      // degrades silently to {} — so losing one label freezes that page just as
      // completely as losing its data, with the data still looking healthy.
      issues.push(`${rel} is published but "${slug}" has no entry in data/cost-index-labels.json — gatedSlugs() requires a label, so the page is frozen at its last build.`);
    } else if (ingMeta && !ingMeta.has(slug)) {
      issues.push(`${rel} is published but "${slug}" is not in ING_META (build-cost-index-pages.mjs) — gatedSlugs() iterates ING_META, so the page is frozen at its last build.`);
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

/**
 * The ING_META key set, read out of build-cost-index-pages.mjs. It is a source
 * literal rather than a data file, so this parses the keys of the object —
 * gatedSlugs() iterates it, and a slug removed from it freezes that page.
 */
export function parseIngMetaKeys(src) {
  const at = src.indexOf('const ING_META = {');
  if (at === -1) return null;
  const open = src.indexOf('{', at);
  let depth = 0;
  let end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  const body = src.slice(open + 1, end);
  const keys = new Set();
  // Top-level keys only: `'slug': { … }` or `slug: { … }` at depth 1.
  let d = 0;
  for (const m of body.matchAll(/(?:^|[,{])\s*'?([a-z0-9-]+)'?\s*:\s*\{|\{|\}/gm)) {
    if (m[0] === '{') { d++; continue; }
    if (m[0] === '}') { d--; continue; }
    if (d === 0 && m[1]) keys.add(m[1]);
    d++;
  }
  return keys.size ? keys : null;
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

  // gatedSlugs() has three terms. Healthy data is not enough — a page also
  // freezes if its LABEL or its ING_META key disappears, and an earlier version
  // of this gate modelled only points[0] and reported those orphans as clean.
  const live = [{ rel: 'cost-index/ribeye/index.html', slug: 'ribeye' }];
  const data = { ribeye: { points: [{ asOf: '2026-07-28' }] } };
  const withLabel = { ribeye: 'Ribeye' };
  const withMeta = new Set(['ribeye']);
  const three = [
    ['all three terms present passes', findOrphans(live, data, NI, withLabel, withMeta).length, 0],
    ['a lost label is an orphan', findOrphans(live, data, NI, {}, withMeta).length, 1],
    ['a removed ING_META key is an orphan', findOrphans(live, data, NI, withLabel, new Set()).length, 1],
  ];
  for (const [name, got, expected] of three) {
    if (got !== expected) { console.error(`  ✗ ${name}: expected ${expected} issue(s), got ${got}`); failed++; }
  }

  // The ING_META parser must find the real keys, not the nested ones.
  const keys = parseIngMetaKeys("const ING_META = {\n  ribeye: { unit: 'lb', cut: { grade: 'choice' } },\n  'whole-crab': { unit: 'lb' },\n};\n");
  if (!keys || keys.size !== 2 || !keys.has('ribeye') || !keys.has('whole-crab')) {
    console.error(`  ✗ parseIngMetaKeys: expected {ribeye, whole-crab}, got ${keys ? [...keys].join(',') : 'null'}`); failed++;
  }
  if (parseIngMetaKeys('no ING_META here') !== null) {
    console.error('  ✗ parseIngMetaKeys: a missing literal must return null so the gate fails loudly'); failed++;
  }
  if (failed) { console.error(`✗ check-cost-index-orphans self-test: ${failed}/${cases.length} case(s) failed.`); process.exit(1); }
  console.log(`check-cost-index-orphans self-test: ${cases.length + three.length + 2}/${cases.length + three.length + 2} passed.`);
  process.exit(0);
}

function main() {
  if (process.argv.includes('--self-test')) selfTest();

  const pages = collectPages();
  const index = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8'));
  const labels = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-labels.json'), 'utf8')).labels || {};
  const ingMeta = parseIngMetaKeys(fs.readFileSync(path.join(repoRoot, 'scripts/build-cost-index-pages.mjs'), 'utf8'));
  if (!ingMeta) {
    console.error('✗ check-cost-index-orphans: could not parse ING_META out of build-cost-index-pages.mjs.');
    console.error('  gatedSlugs() iterates it, so skipping that term would leave a real orphan path uncovered. Update parseIngMetaKeys().');
    process.exit(1);
  }
  const issues = findOrphans(pages, index.ingredients || {}, NON_INGREDIENT, labels, ingMeta);

  if (issues.length) {
    console.error(`✗ Cost-index orphans: ${issues.length} published page(s) have no live data:`);
    for (const i of issues) console.error(`  - ${i}`);
    console.error('  Slugs are final-forever, so deleting the directory is NOT the remedy — it would satisfy this gate silently,');
  console.error('  which is the quiet drop the gate exists to prevent. Pick a real disposal and record it:');
  console.error('    1. Re-source the feed (check-cost-index-series-freshness.mjs shows whether that is even open —');
  console.error('       a KNOWN_SOURCE_LATENT slug has no free wholesale source, so for those this branch is closed).');
  console.error('    2. Render a terminal last-good state on the page ("this feed stopped publishing; last measured <date>"),');
  console.error('       history preserved, excluded from the basket — the codebase already speaks this at basket level.');
  console.error('    3. Retire the slug deliberately: a dated entry + 301 target, cross-checked against the Worker redirect map.');
  console.error('  NOTE (2026-07-30): options 2 and 3 have no runbook or precedent yet — no cost-index ingredient page has ever');
  console.error('  been retired. The first slug to trip this gate needs that decision made, not a quick fix.');
    process.exit(1);
  }
  const checked = pages.filter((p) => !NON_INGREDIENT.has(p.slug)).length;
  console.log(`cost-index orphans: OK — ${checked} published ingredient page(s) (EN+ES) all still have live data in data/cost-index.json.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
