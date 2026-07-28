#!/usr/bin/env node
/**
 * check-yield-agreement.mjs — no ingredient may publish TWO different edible-yield
 * numbers on two live surfaces.
 *
 * THE DEFECT. Two yield tables exist and both reach readers:
 *
 *   data/ingredient-yields.json  `yield`       → /library/ingredient-yields/<slug>/
 *                                                 (+ cost-index pages, the CC-BY state
 *                                                 record, the recost tool)
 *   data/ingredient-depth.json   `edibleYield` → the "Full profile" table on
 *                                                 /cost-index/menu-pricing/
 *
 * 112 slugs carry a value in both and 46 disagree. Most of those never collide, because
 * the profile table renders a different cohort than the library pages. But 22 slugs land
 * on BOTH surfaces, and 7 of them publish two different numbers — e.g. Swiss chard reads
 * 92% on /cost-index/menu-pricing/ and 75% on /library/ingredient-yields/swiss-chard/.
 *
 * WHY THIS IS NOT "ONE TABLE IS WRONG". BOTH sides are cited, to DIFFERENT authorities:
 *
 *   ingredient-yields.json  -> `yield_key` resolves into the canonical YIELD_TABLE in
 *                              tools/plate-cost/plate-cost.js (the Culinary Institute of
 *                              America standard yield tables + the Restaurant Association
 *                              purchasing handbook), and check-ingredient-yields.mjs
 *                              already gates every entry against it.
 *   ingredient-depth.json   -> `yieldSource` names USDA FoodData Central, The Book of
 *                              Yields, FAO, NCHFP or trade yield charts, and `cutSpec`
 *                              states the cut the number applies to.
 *
 * Reading the cut specs shows the pairs frequently measure DIFFERENT THINGS:
 *
 *   swiss-chard   0.92 = stems + leaves both used (leaves-only ~0.60)   vs CIA 0.75
 *   orange        0.50 = JUICE from a reamed Valencia (navel ~0.40)     vs CIA 0.55
 *   branzino      0.35 = two skin-on fillets                            vs CIA 0.55
 *   mussels       0.25 = shucked meat from live in-shell                vs CIA 0.35
 *
 * So the defect is not an uncited number — it is that a yield percentage is published
 * WITHOUT the cut spec and authority that give it meaning. Two defensible measurements
 * then read to an operator as the site contradicting itself, with no way to tell which
 * matches the product they actually buy. Resolving each is an editorial call (it changes
 * published trim-tax math and the CIA table is a deliberate single source of truth for the
 * plate-cost tool), so this gate does NOT silently pick a winner. It:
 *
 *   1. pins the 7 known collisions as dated, individually-reasoned entries, and
 *   2. FAILS on an 8th — no new contradiction can appear unnoticed.
 *
 * It reads the RENDERED pages, not the JSON, because the invariant is about what a reader
 * sees. A zero-size cohort therefore fails loudly rather than passing vacuously: if the
 * markup changes and the scraper silently matches nothing, that is a broken gate, not a
 * clean bill of health.
 *
 *   node scripts/check-yield-agreement.mjs
 *   node scripts/check-yield-agreement.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE_PAGE = 'cost-index/menu-pricing/index.html';
const LIB = (slug) => `library/ingredient-yields/${slug}/index.html`;

// Tolerance in percentage points. 1pp absorbs rounding between 0.345->35% and 0.35->35%;
// anything larger is a genuine disagreement a reader would see.
const TOL_PP = 1;

/**
 * Known collisions, 2026-07-28. Each is a real disagreement left in place because the two
 * numbers measure different cut specs and choosing one changes published trim-tax math —
 * an editorial decision, not a lint fix. Removing a line here is how a fix gets recorded.
 */
export const WAIVERS = {
  'whole-branzino': '2026-07-28: 35% = two skin-on fillets (depth cutSpec, Reluctant Gourmet / fish-yield charts) vs CIA YIELD_TABLE 55%, consistent with gutted-and-scaled whole fish rather than fillets. Both cited, different cuts; needs an editorial call on which one the pages publish.',
  'swiss-chard': '2026-07-28: 92% = stem ends trimmed, stems AND leaves used (depth cutSpec); leaves-only with ribs discarded is ~0.60. CIA YIELD_TABLE says 75%, between the two specs.',
  'pumpkin': '2026-07-28: 70% = sugar/pie pumpkin peeled+seeded (USDA ~30% refuse, Book of Yields); CIA YIELD_TABLE says 55%, closer to the carving pumpkin the same cutSpec calls out as much lower.',
  'arugula': '2026-07-28: 95% = cleaned/bagged baby arugula (trade yield charts); CIA YIELD_TABLE 85% matches the bunched-with-stems case the same cutSpec names. Both true for their form.',
  'mussels': '2026-07-28: 25% = shucked meat from live in-shell after culling (FAO: 8-20%, blue mussel ~20%, plump cultivated ~30%); CIA YIELD_TABLE 35% sits at the top of that range; the CIA spec is not stated on the page.',
  'orange': '2026-07-28: 50% = JUICE yield from a reamed Valencia (navel ~0.40); CIA YIELD_TABLE says 55%. Juice yield and edible flesh are different quantities and should not share a column.',
  'mango': '2026-07-28: 68% = peeled, pit removed (National Mango Board ~0.69, US Foods/USDA AH-102 69%); CIA YIELD_TABLE 65%. Within the varietal spread (0.60-0.70) but still two published numbers.',
};

const rdFile = (rel) => {
  const p = path.join(repo, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};

/** Edible-yield % per ingredient name from the "Full profile" table. */
export function profileYields(html) {
  const i = html.indexOf('pb-prof-h');
  if (i < 0) return {};
  const j = html.indexOf('</table>', i);
  const sec = j > 0 ? html.slice(i, j) : html.slice(i);
  const out = {};
  for (const m of sec.matchAll(/<th scope="row">(.*?)<\/th><td class="pb-num">(\d+)%<\/td>/g)) {
    const nm = m[1].replace(/<[^>]+>/g, '').replace(/new$/, '').trim();
    if (nm) out[nm] = Number(m[2]);
  }
  return out;
}

/** The yield % a library ingredient-yields page states in its worked example. */
export function libraryYield(html) {
  const hits = [...html.matchAll(/At (\d+)% yield/g)].map((m) => Number(m[1]));
  if (!hits.length) return null;
  return hits.every((h) => h === hits[0]) ? hits[0] : null;   // internally inconsistent -> null
}

export function disagreements(profile, libOf, nameToSlug, tolPp = TOL_PP) {
  const found = [];
  let compared = 0;
  for (const [name, pct] of Object.entries(profile)) {
    const slug = nameToSlug[name];
    if (!slug) continue;
    const lib = libOf(slug);
    if (lib == null) continue;
    compared++;
    if (Math.abs(lib - pct) > tolPp) found.push({ slug, name, profile: pct, library: lib });
  }
  return { compared, found };
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  let fail = 0, ran = 0;
  const t = (n, c) => { ran++; if (!c) { console.error('  ✗', n); fail++; } };

  const page = '<h2 id="pb-prof-h">x</h2><table><tr><th scope="row">Swiss chard</th><td class="pb-num">92%</td><td class="pb-num">—</td></tr>'
             + '<tr><th scope="row">Mango<span>new</span></th><td class="pb-num">68%</td></tr></table>'
             + '<table><tr><th scope="row">Decoy</th><td class="pb-num">11%</td></tr></table>';
  const p = profileYields(page);
  t('reads the profile table', p['Swiss chard'] === 92);
  t('strips the "new" tag from a name', p['Mango'] === 68);
  t('stops at the end of the profile table', p['Decoy'] === undefined);
  t('no profile table -> empty, not a throw', Object.keys(profileYields('<div>x</div>')).length === 0);

  t('reads a library page yield', libraryYield('<p>At 75% yield, your real cost…</p>') === 75);
  t('agreeing repeats collapse to one value', libraryYield('At 75% yield … At 75% yield') === 75);
  t('a page disagreeing with ITSELF reports null, never a guess', libraryYield('At 75% yield … At 80% yield') === null);
  t('no yield sentence -> null', libraryYield('<p>nothing</p>') === null);

  const n2s = { 'Swiss chard': 'swiss-chard', 'Mango': 'mango' };
  const d = disagreements(p, (s) => ({ 'swiss-chard': 75, mango: 68 }[s] ?? null), n2s);
  t('counts what it actually compared', d.compared === 2);
  t('flags the real disagreement', d.found.length === 1 && d.found[0].slug === 'swiss-chard');
  t('does not flag an agreeing pair', !d.found.some((x) => x.slug === 'mango'));
  t('1pp rounding slack is tolerated on a real row', !disagreements(p, () => 91, n2s).found.some((x) => x.slug === 'swiss-chard'));
  t('a 1pp gap passes', disagreements({ A: 50 }, () => 51, { A: 'a' }).found.length === 0);
  t('a 2pp gap fails', disagreements({ A: 50 }, () => 52, { A: 'a' }).found.length === 1);
  t('a slug with no library page is skipped, not failed', disagreements({ A: 50 }, () => null, { A: 'a' }).compared === 0);
  t('every waiver carries a dated reason', Object.values(WAIVERS).every((r) => /^\d{4}-\d{2}-\d{2}:/.test(r)));

  if (fail) { console.error(`check-yield-agreement self-test: ${fail} of ${ran} failed.`); process.exit(1); }
  console.log(`check-yield-agreement self-test: ${ran}/${ran} passed (table scoping, self-inconsistent pages, tolerance, waiver hygiene).`);
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
// Guarded so the module can be imported (by a test, or to reuse the parsers) without
// executing the gate — same main-guard pattern as build-ingredient-state-record.mjs.
function run() {
  const profileHtml = rdFile(PROFILE_PAGE);
  if (!profileHtml) { console.error(`✗ yield-agreement: ${PROFILE_PAGE} missing.`); process.exit(1); }

  const depth = JSON.parse(fs.readFileSync(path.join(repo, 'data/ingredient-depth.json'), 'utf8')).ingredients || {};
  const nameToSlug = {};
  for (const [slug, v] of Object.entries(depth)) if (v && v.en) nameToSlug[String(v.en).trim()] = slug;

  const profile = profileYields(profileHtml);
  const libOf = (slug) => { const h = rdFile(LIB(slug)); return h ? libraryYield(h) : null; };
  const { compared, found } = disagreements(profile, libOf, nameToSlug);

  // A scraper that silently matches nothing must not read as "all clear".
  if (!Object.keys(profile).length || compared < 5) {
    console.error(`✗ yield-agreement: only ${compared} ingredient(s) compared from ${Object.keys(profile).length} profile row(s) — the page markup likely changed and this gate is no longer measuring anything. Fix the scraper before trusting a pass.`);
    process.exit(1);
  }

  const unwaived = found.filter((f) => !WAIVERS[f.slug]);
  const stale = Object.keys(WAIVERS).filter((s) => !found.some((f) => f.slug === s));

  for (const f of found) {
    const tag = WAIVERS[f.slug] ? 'waived' : 'NEW';
    console.log(`  ${tag === 'NEW' ? '✗' : '·'} ${f.name} (${f.slug}): /cost-index/menu-pricing/ says ${f.profile}%, /library/ingredient-yields/${f.slug}/ says ${f.library}% [${tag}]`);
  }
  if (stale.length) {
    console.error(`✗ yield-agreement: ${stale.length} waiver(s) no longer describe a real disagreement (${stale.join(', ')}) — delete them so the list keeps meaning what it says.`);
  }
  if (unwaived.length) {
    console.error(`✗ yield-agreement: ${unwaived.length} ingredient(s) publish two different edible yields with no recorded reason. Either reconcile the tables or record why the two cut specs differ.`);
  }
  if (unwaived.length || stale.length) process.exit(1);
  console.log(`✓ yield-agreement: ${compared} ingredient(s) on both surfaces, ${found.length} known cut-spec collision(s) waived, 0 new.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
