#!/usr/bin/env node
/**
 * build-cost-index-feed.mjs — the Cost Index DATA feed (machine-readable catalog).
 *
 * Frontier idea #3, the half that serves machines: llms.txt / feed-llm.json already
 * expose the ARTICLE corpus, but nothing exposed the price DATA as one discoverable,
 * citable surface — a consumer had to know every per-ingredient series.json URL in
 * advance. This assembles one catalog at /cost-index/feed.json: every shipping
 * ingredient's current wholesale reference + the link to its full series and (where it
 * exists) its embeddable card. A neutral, citable wholesale-price index a quant could
 * pull or an LLM could cite — the kind of source a POS giant won't publish because the
 * number implicates vendor markups.
 *
 * Authoritative + drift-free: built ONLY from the published per-ingredient series.json
 * (the same gated feed the pages ship), so the catalog can never disagree with them.
 * Carries no derived trend or forecast — just the measured reference + provenance, so
 * the no-forecast methodology promise is untouched. Like calibration.json it's a routable
 * .json (not an index.html), so the sitemap/parity walkers leave it alone.
 *
 * PURE & DETERMINISTIC (no `now`): --check pins it in CI.
 *
 *   node scripts/build-cost-index-feed.mjs            # write cost-index/feed.json
 *   node scripts/build-cost-index-feed.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-index-feed.mjs --self-test
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CI_DIR = path.join(repo, 'cost-index');
const OUT = path.join(repo, 'cost-index/feed.json');
const ORIGIN = 'https://muntin.digital';
const DISCLAIMER =
  'Wholesale reference prices compiled from public U.S. market sources (USDA AMS/LMR, BLS, FRED, EIA, NOAA). ' +
  'US dollars per listed unit. Not a delivered or retail price. Measured levels only — never a forecast.';

function rd(p) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; } }

// Every shipping ingredient = a directory under cost-index/ that ships a series.json.
function shippingSlugs() {
  return readdirSync(CI_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(path.join(CI_DIR, e.name, 'series.json')))
    .map((e) => e.name)
    .sort();                              // deterministic order
}

function entryFor(slug) {
  const s = rd(path.join(CI_DIR, slug, 'series.json'));
  if (!s || !Array.isArray(s.observations) || !s.observations.length) return null;
  const obs = s.observations.filter((o) => typeof o.priceUsd === 'number');
  if (!obs.length) return null;
  const last = obs[obs.length - 1];
  const urls = {
    page: `${ORIGIN}/cost-index/${slug}/`,
    series: `${ORIGIN}/cost-index/${slug}/series.json`,
    seriesCsv: `${ORIGIN}/cost-index/${slug}/series.csv`,
  };
  if (existsSync(path.join(CI_DIR, slug, 'embed.html'))) urls.embed = `${ORIGIN}/cost-index/${slug}/embed.html`;
  return {
    slug,
    name: s.name || slug,
    unit: s.unit || null,
    basis: s.basis || 'wholesale',
    currency: s.currency || 'USD',
    asOf: s.asOf || last.date,
    reference: { date: last.date, priceUsd: last.priceUsd, source: last.source || null },
    observations: obs.length,
    urls,
  };
}

function build() {
  const ingredients = shippingSlugs().map(entryFor).filter(Boolean);
  const freshest = ingredients.reduce((m, e) => (e.asOf > m ? e.asOf : m), '');
  return {
    _doc: 'Machine-readable catalog of the Muntin Cost Index. One entry per shipping ingredient with its current wholesale reference and links to the full series (JSON/CSV) and embeddable card. Built by scripts/build-cost-index-feed.mjs from the published per-ingredient series.json; deterministic; CI re-checks with --check. Cite the per-ingredient page or series URL.',
    _version: 1,
    origin: ORIGIN,
    index: `${ORIGIN}/cost-index/`,
    calibration: `${ORIGIN}/cost-index/calibration.json`,
    revisions: `${ORIGIN}/cost-index/revisions.json`,
    disclaimer: DISCLAIMER,
    freshestAsOf: freshest || null,
    count: ingredients.length,
    ingredients,
  };
}

function main() {
  const feed = build();
  const json = JSON.stringify(feed, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    // Expected = every series dir that ships an actual reading (a scaffold series.json with
    // zero observations, e.g. cantaloupe, legitimately has no reference to publish).
    const withReading = shippingSlugs().filter((s) => entryFor(s));
    const ribeye = feed.ingredients.find((e) => e.slug === 'ribeye');
    const checks = [
      ['catalog covers every series with a reading', feed.count === withReading.length && feed.count > 0],
      ['every entry has slug + asOf + numeric reference + page url', feed.ingredients.every((e) =>
        e.slug && e.asOf && typeof e.reference.priceUsd === 'number' && /^https:\/\//.test(e.urls.page))],
      ['freshestAsOf is the max asOf', feed.ingredients.every((e) => e.asOf <= feed.freshestAsOf)],
      ['ribeye exposes its embed card', !!(ribeye && ribeye.urls.embed)],
      ['sorted by slug', feed.ingredients.map((e) => e.slug).join(',') === feed.ingredients.map((e) => e.slug).slice().sort().join(',')],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(feed)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-index-feed self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (cur !== json) { console.error('✗ cost-index feed is stale — run: node scripts/build-cost-index-feed.mjs'); process.exit(1); }
    console.log(`✓ cost-index feed in sync (${feed.count} ingredient(s)).`);
    return;
  }

  writeFileSync(OUT, json);
  console.log(`Wrote cost-index/feed.json — ${feed.count} ingredient(s), freshest ${feed.freshestAsOf}.`);
}

main();
