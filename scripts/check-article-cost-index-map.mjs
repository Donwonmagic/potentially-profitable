#!/usr/bin/env node
/**
 * check-article-cost-index-map.mjs — the gate for the curated corpus <-> Cost
 * Index edge list (data/article-cost-index-map.json).
 *
 * The map is the ONLY join between the corpus and the index. It exists because
 * naive entity matching is disqualified here: matching ingredient names against
 * article bodies flags 55/55 articles ("apple" hits Apple the company;
 * lemon / lime / date / turkey / sage / ginger / romaine are homographs with
 * brands, dates and place names). So the join is an explicit committed edge
 * list, curated by a human who read the paragraph — the same posture as
 * data/cross-surface-map.json and data/ingredient-aliases.json.
 *
 * This gate proves the map cannot ship a broken surface:
 *
 *   - every article key is '<library|blog>/<slug>' and resolves to a real
 *     <key>/index.html (the discipline sourced-claims.json#used_in lost —
 *     20 of its 78 edges point at articles that do not exist);
 *   - every ingredient key is a REAL Cost Index key
 *     (data/cost-index-sources.json#ingredients);
 *   - every ingredient key has a RENDERED page at cost-index/<key>/index.html.
 *     231 keys are tracked but only ~94 have pages — an undeclared key would
 *     ship a 404 from a high-traffic article;
 *   - the ES mirror, when data/i18n-slug-map.json declares one, exists on disk
 *     (warn, not fail — an ES mirror is optional; check-locale-parity.mjs
 *     already SKIPs blog/ and library/);
 *   - no duplicate ingredient inside an entry, and the array is non-empty and
 *     within _cap (default 5) — the injected block must stay a tile, not a
 *     directory;
 *   - anchor_h2_id, when declared, exists as <h2 id="..."> in the EN article
 *     (warn — the injector silently no-ops rather than misplace itself);
 *   - `reviewed` is an ISO date; warns past 365 days. Same manual-bump posture
 *     as `retrievedAt` in data/cost-index-drivers.json.
 *
 * WHAT THIS GATE DELIBERATELY DOES NOT DO: it never asserts an edge is
 * *correct*. "This article discusses beef" is a curatorial statement about our
 * own text, not a claim about the world, so there is nothing here for a fact
 * gate to adjudicate. It only proves every edge RESOLVES.
 *
 *   node scripts/check-article-cost-index-map.mjs            # report + exit 0
 *   node scripts/check-article-cost-index-map.mjs --check    # CI gate (exit 1)
 *   node scripts/check-article-cost-index-map.mjs --self-test
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP = path.join(repoRoot, 'data/article-cost-index-map.json');
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const KEY_RE = /^(library|blog)\/[a-z0-9][a-z0-9-]*$/;

/**
 * Pure, injectable. `env` carries every side-effecting lookup so the self-test
 * can drive it with no filesystem at all.
 *   env.costKeys      Set<string>  — tracked ingredient keys
 *   env.pageExists(k) bool         — cost-index/<k>/index.html is on disk
 *   env.articleHtml(k) string|null — <key>/index.html source, or null
 *   env.esSlug(k)     string|null  — declared ES slug, or null
 *   env.esExists(k,s) bool         — the ES mirror file is on disk
 *   env.today         'YYYY-MM-DD' — for the staleness warning only
 */
export function mapIssues(map, env) {
  const issues = [];
  const warnings = [];
  const articles = (map && map.articles) || {};
  const cap = Number.isInteger(map && map._cap) ? map._cap : 5;
  if (!map || !ISO_RE.test(String(map._lastReviewed || ''))) {
    issues.push('_lastReviewed must be an ISO date (YYYY-MM-DD)');
  }
  if (!Object.keys(articles).length) issues.push('articles{} is empty');

  for (const [key, entry] of Object.entries(articles)) {
    const at = `[${key}]`;
    if (!KEY_RE.test(key)) { issues.push(`${at} key must be '<library|blog>/<slug>'`); continue; }
    const html = env.articleHtml(key);
    if (html == null) { issues.push(`${at} no ${key}/index.html on disk`); continue; }

    const ings = entry && entry.ingredients;
    if (!Array.isArray(ings) || !ings.length) { issues.push(`${at} needs a non-empty ingredients[]`); continue; }
    if (ings.length > cap) issues.push(`${at} declares ${ings.length} ingredients (cap is ${cap}) — the block is a tile, not a directory`);

    const seen = new Set();
    for (const k of ings) {
      if (typeof k !== 'string' || !k.trim()) { issues.push(`${at} has an empty ingredient key`); continue; }
      if (seen.has(k)) { issues.push(`${at} lists "${k}" twice`); continue; }
      seen.add(k);
      if (!env.costKeys.has(k)) { issues.push(`${at} "${k}" is not a Cost Index key`); continue; }
      if (!env.pageExists(k)) issues.push(`${at} "${k}" is tracked but has no cost-index/${k}/index.html — linking it would ship a 404`);
    }

    if (!ISO_RE.test(String((entry && entry.reviewed) || ''))) {
      issues.push(`${at} needs an ISO "reviewed" date`);
    } else if (env.today && daysBetween(entry.reviewed, env.today) > 365) {
      warnings.push(`${at} reviewed ${entry.reviewed} — over a year ago; re-read the article`);
    }

    if (entry && entry.anchor_h2_id) {
      const re = new RegExp(`<h2\\b[^>]*\\bid="${entry.anchor_h2_id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
      if (!re.test(html)) warnings.push(`${at} anchor_h2_id="${entry.anchor_h2_id}" not found — the block will fall back to the first H2`);
    }

    const es = env.esSlug(key);
    if (es && !env.esExists(key, es)) {
      warnings.push(`${at} i18n-slug-map declares ES "${es}" but the file is missing — the block ships EN-only`);
    }
  }
  return { issues, warnings };
}

function daysBetween(a, b) {
  const ms = Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z');
  return Number.isFinite(ms) ? Math.round(ms / 86400000) : 0;
}

function realEnv() {
  const sources = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index-sources.json'), 'utf8'));
  const i18n = (() => {
    try { return JSON.parse(readFileSync(path.join(repoRoot, 'data/i18n-slug-map.json'), 'utf8')); }
    catch { return {}; }
  })();
  const rd = (rel) => { try { return readFileSync(path.join(repoRoot, rel), 'utf8'); } catch { return null; } };
  return {
    costKeys: new Set(Object.keys(sources.ingredients || {})),
    pageExists: (k) => existsSync(path.join(repoRoot, 'cost-index', k, 'index.html')),
    articleHtml: (key) => rd(`${key}/index.html`),
    esSlug: (key) => {
      const [ns, slug] = key.split('/');
      return (i18n[ns] && i18n[ns][slug]) || null;
    },
    esExists: (key, es) => existsSync(path.join(repoRoot, 'es', key.split('/')[0], es, 'index.html')),
    today: new Date().toISOString().slice(0, 10),
  };
}

function run(check) {
  let map;
  try { map = JSON.parse(readFileSync(MAP, 'utf8')); }
  catch (e) { console.error(`check-article-cost-index-map: cannot read map: ${e.message}`); return 1; }
  const { issues, warnings } = mapIssues(map, realEnv());
  const nArticles = Object.keys(map.articles || {}).length;
  const nEdges = Object.values(map.articles || {}).reduce((a, e) => a + ((e && e.ingredients) || []).length, 0);
  for (const w of warnings) console.log('  ! ' + w);
  if (issues.length) {
    issues.forEach((i) => console.log('  ✗ ' + i));
    console.error(`check-article-cost-index-map: ${issues.length} issue(s) across ${nArticles} article(s).`);
    return check ? 1 : 0;
  }
  console.log(`check-article-cost-index-map: ${nArticles} article(s), ${nEdges} edge(s); every article and every ingredient page resolves. ${warnings.length} warning(s).`);
  return 0;
}

function selfTest() {
  const env = {
    costKeys: new Set(['ribeye', 'eggs', 'pork-belly']),
    pageExists: (k) => k !== 'pork-belly',            // tracked but pageless
    articleHtml: (key) => (key === 'library/real' ? '<h2 id="cut">Cut</h2>' : null),
    esSlug: () => null,
    esExists: () => true,
    today: '2026-07-28',
  };
  const base = { _lastReviewed: '2026-07-28', _cap: 5 };
  const mk = (articles) => mapIssues({ ...base, articles }, env);
  const ok = mk({ 'library/real': { ingredients: ['ribeye'], reviewed: '2026-07-28', anchor_h2_id: 'cut' } });
  const ghost = mk({ 'library/ghost': { ingredients: ['ribeye'], reviewed: '2026-07-28' } });
  const badKey = mk({ 'notes/real': { ingredients: ['ribeye'], reviewed: '2026-07-28' } });
  const untracked = mk({ 'library/real': { ingredients: ['unicorn'], reviewed: '2026-07-28' } });
  const pageless = mk({ 'library/real': { ingredients: ['pork-belly'], reviewed: '2026-07-28' } });
  const dupe = mk({ 'library/real': { ingredients: ['ribeye', 'ribeye'], reviewed: '2026-07-28' } });
  const overCap = mk({ 'library/real': { ingredients: ['ribeye', 'eggs', 'ribeye2', 'a', 'b', 'c'], reviewed: '2026-07-28' } });
  const noDate = mk({ 'library/real': { ingredients: ['ribeye'] } });
  const stale = mk({ 'library/real': { ingredients: ['ribeye'], reviewed: '2024-01-01' } });
  const badAnchor = mk({ 'library/real': { ingredients: ['ribeye'], reviewed: '2026-07-28', anchor_h2_id: 'nope' } });
  const a = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exitCode = 1; } };
  a(ok.issues.length === 0 && ok.warnings.length === 0, 'valid entry passes clean');
  a(ghost.issues.some((i) => /no library\/ghost\/index\.html/.test(i)), 'dangling article caught');
  a(badKey.issues.some((i) => /must be '<library\|blog>/.test(i)), 'bad namespace caught');
  a(untracked.issues.some((i) => /not a Cost Index key/.test(i)), 'untracked ingredient caught');
  a(pageless.issues.some((i) => /would ship a 404/.test(i)), 'tracked-but-pageless caught');
  a(dupe.issues.some((i) => /twice/.test(i)), 'duplicate ingredient caught');
  a(overCap.issues.some((i) => /cap is 5/.test(i)), 'over-cap caught');
  a(noDate.issues.some((i) => /ISO "reviewed"/.test(i)), 'missing reviewed caught');
  a(stale.warnings.some((w) => /over a year ago/.test(w)), 'stale review warned');
  a(badAnchor.warnings.some((w) => /not found/.test(w)), 'missing anchor warned (not failed)');
  console.log(process.exitCode ? 'article-cost-index-map self-test: FAILURES above.' : 'article-cost-index-map self-test: 10/10 passed.');
  return process.exitCode || 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--self-test')) process.exit(selfTest());
  process.exit(run(process.argv.includes('--check')));
}
