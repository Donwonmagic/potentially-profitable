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
 * THE SECOND ACCEPTED STATE (added 2026-07-31, ADR-021): a page may also be
 * RETIRED. build-cost-index.mjs archives an ingredient's last-good state in
 * data/cost-index-retired.json at the moment it drops it, and
 * build-cost-index-pages.mjs rebuilds the page as a terminal render — "this
 * series stopped publishing, last measured <date>", history preserved, out of
 * the basket. Without that state the gate had only failing answers to offer: the
 * note below said options 2 and 3 had no precedent, so every dead feed would
 * red CI until someone hand-built one.
 *
 * The archive alone does NOT satisfy this gate. The published page must actually
 * carry the `cost-index:retired` marker, so listing a slug in a JSON file can
 * never mute the check for a page nobody rebuilt — that would reintroduce the
 * silent freeze through the door meant to fix it.
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
export function findOrphans(pages, ingredients, nonIngredient, labels = null, ingMeta = null, retired = null, isTerminal = null) {
  const issues = [];
  for (const { rel, slug } of pages) {
    if (nonIngredient.has(slug)) continue;
    const entry = ingredients[slug];
    const arch = retired ? retired[slug] : null;
    const hasData = !!(entry && Array.isArray(entry.points) && entry.points[0]);

    // RETIRED — the deliberate end-state (ADR-021). The data is gone on purpose,
    // and the page has been rebuilt to say so. Accepting this state is what lets
    // a dead feed resolve at all; the two guards below are what stop it from
    // becoming a mute button.
    if (arch) {
      if (hasData) {
        // Both states at once. build-cost-index.mjs clears the archive entry the
        // moment an ingredient is vendored again, so this means the archive was
        // hand-edited or a build was skipped — and while it lasts the page
        // builder silently prefers the live render, so the "retirement" is a
        // claim in a file that nothing on the site reflects.
        issues.push(`${rel}: "${slug}" has BOTH live data in data/cost-index.json and an entry in data/cost-index-retired.json — it cannot be both. Re-run build-cost-index.mjs (it drops the archive entry when a feed comes back) or remove the entry by hand.`);
      } else if (isTerminal && !isTerminal(rel)) {
        // The archive says retired; the published bytes still say otherwise.
        // Without this check, adding a slug to the archive would satisfy the
        // gate while the frozen page stayed live — which is precisely the
        // failure this gate was written to catch, re-entering through the fix.
        issues.push(`${rel} is listed in data/cost-index-retired.json but the published page is NOT the terminal render (no cost-index:retired marker) — it is still showing its last live state as if current. Run: node scripts/build-cost-index-pages.mjs`);
      } else if (labels && !labels[slug]) {
        issues.push(`${rel} is retired but "${slug}" has no entry in data/cost-index-labels.json — retiredSlugs() requires a label, so the terminal page can never be rebuilt either.`);
      } else if (ingMeta && !ingMeta.has(slug)) {
        issues.push(`${rel} is retired but "${slug}" is not in ING_META (build-cost-index-pages.mjs) — retiredSlugs() iterates ING_META, so the terminal page can never be rebuilt either.`);
      }
      continue;
    }

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
  // The retired/live contradiction, checked against the ARCHIVE rather than the
  // page list, so it is caught even for a slug that has no published page (the
  // loop above can only see slugs that do).
  const seen = new Set(pages.map((p) => p.slug));
  for (const slug of Object.keys(retired || {})) {
    if (seen.has(slug)) continue;   // already reported above, with its page path
    if (ingredients[slug] && Array.isArray(ingredients[slug].points) && ingredients[slug].points[0]) {
      issues.push(`"${slug}" has BOTH live data in data/cost-index.json and an entry in data/cost-index-retired.json — it cannot be both. Re-run build-cost-index.mjs.`);
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

  // RETIREMENT — the second accepted end-state, and the guards that keep it from
  // becoming a way to silence the gate.
  const dead = [{ rel: 'cost-index/scallops/index.html', slug: 'scallops' }];
  const arch = { scallops: { retiredOn: '2026-08-29', lastMeasured: '2026-05-01' } };
  const yes = () => true, no = () => false;
  const ret = [
    ['a retired slug with a terminal page passes',
      findOrphans(dead, {}, NI, { scallops: 'Scallops' }, new Set(['scallops']), arch, yes).length, 0],
    ['a retired slug whose page was NOT rebuilt still fails',
      findOrphans(dead, {}, NI, { scallops: 'Scallops' }, new Set(['scallops']), arch, no).length, 1],
    ['archived AND live at once is a contradiction',
      findOrphans(dead, { scallops: { points: [{ asOf: '2026-07-28' }] } }, NI, { scallops: 'Scallops' }, new Set(['scallops']), arch, yes).length, 1],
    ['the contradiction is caught even with no published page',
      findOrphans([], { scallops: { points: [{ asOf: '2026-07-28' }] } }, NI, null, null, arch, yes).length, 1],
    ['a retired slug that lost its label cannot be rebuilt either',
      findOrphans(dead, {}, NI, {}, new Set(['scallops']), arch, yes).length, 1],
    ['a retired slug dropped from ING_META cannot be rebuilt either',
      findOrphans(dead, {}, NI, { scallops: 'Scallops' }, new Set(), arch, yes).length, 1],
    ['an archive entry for a slug with no page is not an issue',
      findOrphans([], {}, NI, null, null, arch, yes).length, 0],
    ['with no archive at all, a dropped ingredient is still an orphan',
      findOrphans(dead, {}, NI, null, null, {}, yes).length, 1],
  ];
  for (const [name, got, expected] of ret) {
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
  const total = cases.length + three.length + ret.length + 2;
  if (failed) { console.error(`✗ check-cost-index-orphans self-test: ${failed}/${total} case(s) failed.`); process.exit(1); }
  console.log(`check-cost-index-orphans self-test: ${total}/${total} passed.`);
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
  const retiredPath = path.join(repoRoot, 'data/cost-index-retired.json');
  let retired = {};
  if (fs.existsSync(retiredPath)) {
    try { retired = JSON.parse(fs.readFileSync(retiredPath, 'utf8')).retired || {}; }
    catch (e) {
      // Degrading to {} here would report every terminal page as an orphan —
      // noisy but SAFE, which is the wrong instinct to encode: it trains the
      // reader to ignore this gate. Say what is actually wrong instead.
      console.error(`✗ check-cost-index-orphans: data/cost-index-retired.json is unreadable (${e.message}).`);
      console.error('  It is the record of which pages are deliberately terminal. Fix the file or delete it deliberately.');
      process.exit(1);
    }
  }
  const isTerminal = (rel) => {
    try { return fs.readFileSync(path.join(repoRoot, rel), 'utf8').includes('cost-index:retired'); }
    catch { return false; }
  };
  const issues = findOrphans(pages, index.ingredients || {}, NON_INGREDIENT, labels, ingMeta, retired, isTerminal);

  if (issues.length) {
    console.error(`✗ Cost-index orphans: ${issues.length} published page(s) have no live data:`);
    for (const i of issues) console.error(`  - ${i}`);
    console.error('  Slugs are final-forever, so deleting the directory is NOT the remedy — it would satisfy this gate silently,');
    console.error('  which is the quiet drop the gate exists to prevent. Two dispositions are supported:');
    console.error('    1. RE-SOURCE the feed. check-cost-index-series-freshness.mjs shows whether that is even open — a');
    console.error('       KNOWN_SOURCE_LATENT slug has no free wholesale source, so for those this branch is closed.');
    console.error('    2. RETIRE it (ADR-021). This is now built and needs no hand-authoring: a keyed refresh archives the');
    console.error('       last-good state, and `node scripts/build-cost-index-pages.mjs` renders the terminal page ("this');
    console.error('       series stopped publishing, last measured <date>"), history preserved, out of the basket, URL alive.');
    console.error('       If the archive entry already exists, this gate is telling you the PAGE has not been rebuilt yet.');
    process.exit(1);
  }
  const checked = pages.filter((p) => !NON_INGREDIENT.has(p.slug)).length;
  console.log(`cost-index orphans: OK — ${checked} published ingredient page(s) (EN+ES) all still have live data in data/cost-index.json.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
