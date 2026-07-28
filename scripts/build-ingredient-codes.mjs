#!/usr/bin/env node
/**
 * build-ingredient-codes.mjs — the identity crosswalk: every Cost Index slug to every
 * federal/agency code that stands for it, with the GRANULARITY and the BINDING that say
 * how far the identity can be trusted. Completes ADR-017's crosswalk half.
 *
 * WHY A CROSSWALK NEEDS MORE THAN (slug, code). Five authorities already map our slugs to
 * their own identifiers, and they do NOT agree about what an "ingredient" is:
 *
 *   census_hs       226 codes -> 155 slugs   121 at HS6, 104 at HS10, 1 at HS8
 *   usda_nass       102 slugs                26 carry a class split, 76 do not
 *   usda_ers         71 slugs                all at commodity scope
 *   noaa_fisheries   20 categories           each SERVES several slugs
 *   ghcn_weather     28 slugs -> 7 regions   a growing region, not the ingredient
 *
 * Publishing a flat (slug, authority, code) table would imply those are the same kind of
 * fact. They are not, and ADR-017 section 3 already depends on the difference: the
 * import-reliance ratio is WITHHELD when a broad HS6 export is set against a narrow NASS
 * commodity's production, because that granularity mismatch forms a bogus share. That guard
 * lives in code today and is invisible to anyone reading our published data. This file makes
 * it inspectable.
 *
 * TWO COLUMNS CARRY THE HONESTY:
 *
 * `granularity` — an ABSOLUTE, cross-authority level, so two rows can be compared without
 *   knowing either authority's internal scheme. Mechanically derived, never judged:
 *     line      finer than a commodity  (HS10 statistical line, HS8, NASS commodity+class)
 *     commodity the commodity itself    (HS6, NASS commodity alone, ERS commodity)
 *     group     coarser than a commodity(NOAA category, which serves several slugs)
 *     proxy     NOT an identity of the ingredient at all (a weather region that stands in
 *               for where it grows)
 *
 * `binding` — whether the slug and the code are actually one-to-one:
 *     exact                  one slug, one code
 *     slug_aggregates_codes  this slug sums several codes (shrimp-head-on spans 16 HS10
 *                            lines by count band)
 *     code_shared_by_slugs   THIS CODE ALSO STANDS FOR ANOTHER INGREDIENT. 24 HS codes do:
 *                            080550 is "LEMONS AND LIMES" for both lemon and lime;
 *                            0201305045 "...LOIN" is both striploin and beef-tenderloin.
 *                            Any per-slug figure drawn from a shared code is really the
 *                            PAIR'S combined figure attributed to one of them. `shared_with`
 *                            names the others so a reader can see it rather than infer it.
 *     aggregate_and_shared   both at once
 *
 * WHAT THIS FILE IS NOT. An identity map, never a measurement: no price, no volume, no
 * share, no ranking, no forecast. ADR-017 section 1's "value never volume" is satisfied
 * trivially because no quantity appears here at all. A code's presence means "this is the
 * federal identifier we read for this ingredient" — never that the ingredient is imported,
 * grown domestically, or scarce.
 *
 * LICENSE. CC BY 4.0, not CC0. The CODES are US-government works, but the MAPPING from a
 * culinary slug to them is Muntin's editorial work — the `muntin_compilation` side of the
 * split named in cost-index/open-data-catalog.json. Calling it CC0 would be the same
 * over-claim class as the llms.txt leak fixed in 7592d7363.
 *
 *   node scripts/build-ingredient-codes.mjs           # write
 *   node scripts/build-ingredient-codes.mjs --check   # exit 1 if stale
 *   node scripts/build-ingredient-codes.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));

export const GRANULARITY = ['line', 'commodity', 'group', 'proxy'];
export const BINDING = ['exact', 'slug_aggregates_codes', 'code_shared_by_slugs', 'aggregate_and_shared'];

/** HS granularity is the code's own length — the schedule's built-in level marker. */
export function hsLevel(code) {
  const n = String(code).length;
  if (n === 10) return { granularity: 'line', native: 'hs10' };
  if (n === 8) return { granularity: 'line', native: 'hs8' };
  if (n === 6) return { granularity: 'commodity', native: 'hs6' };
  return null;                                   // unknown length -> caller must reject
}

export function bindingOf(slugCodeCount, codeSlugCount) {
  const agg = slugCodeCount > 1, shared = codeSlugCount > 1;
  if (agg && shared) return 'aggregate_and_shared';
  if (agg) return 'slug_aggregates_codes';
  if (shared) return 'code_shared_by_slugs';
  return 'exact';
}

export function buildRows(src) {
  const rows = [];
  const problems = [];

  // ── census_hs: keyed by CODE, with a slugs[] fan-out ───────────────────────
  const hs = (src.hs && src.hs.codes) || {};
  const slugCodes = new Map();
  for (const [code, v] of Object.entries(hs)) {
    for (const s of (v.slugs || [])) slugCodes.set(s, (slugCodes.get(s) || 0) + 1);
  }
  for (const [code, v] of Object.entries(hs)) {
    const lvl = hsLevel(code);
    if (!lvl) { problems.push(`census_hs code "${code}" has an unrecognised length (${String(code).length}); HS levels are 6, 8 or 10.`); continue; }
    const slugs = v.slugs || [];
    if (!slugs.length) { problems.push(`census_hs code "${code}" binds no slug.`); continue; }
    for (const s of slugs) {
      rows.push({
        slug: s, authority: 'census_hs', code: String(code), label: v.sdesc || '',
        granularity: lvl.granularity, native_level: lvl.native,
        binding: bindingOf(slugCodes.get(s) || 1, slugs.length),
        shared_with: slugs.filter((x) => x !== s).join(';'),
        note: v.note || '',
      });
    }
  }

  // ── usda_nass: keyed by SLUG; a `class` split is one level finer ───────────
  for (const [s, v] of Object.entries((src.nass && src.nass.codes) || {})) {
    const cls = v.class || '';
    rows.push({
      slug: s, authority: 'usda_nass',
      code: cls ? `${v.commodity} / ${cls}` : String(v.commodity || ''),
      label: v.commodity || '',
      granularity: cls ? 'line' : 'commodity',
      native_level: cls ? 'nass_commodity_class' : 'nass_commodity',
      binding: 'exact', shared_with: '', note: v.note || '',
    });
  }

  // ── usda_ers ──────────────────────────────────────────────────────────────
  for (const [s, v] of Object.entries((src.ers && src.ers.map) || {})) {
    rows.push({
      slug: s, authority: 'usda_ers', code: String(v.commodity || ''), label: v.group || '',
      granularity: 'commodity', native_level: 'ers_commodity',
      binding: 'exact', shared_with: '', note: v.scope ? `scope: ${v.scope}` : '',
    });
  }

  // ── noaa_fisheries: a CATEGORY serves several slugs -> coarser than commodity
  for (const c of (src.noaa && src.noaa.categories) || []) {
    const serves = c.serves || [];
    for (const s of serves) {
      rows.push({
        slug: s, authority: 'noaa_fisheries', code: String(c.id || ''), label: c.label || '',
        granularity: 'group', native_level: 'noaa_category',
        binding: serves.length > 1 ? 'code_shared_by_slugs' : 'exact',
        shared_with: serves.filter((x) => x !== s).join(';'),
        note: c.wild_note || '',
      });
    }
  }

  // ── ghcn_weather: a REGION, not an identity of the ingredient ──────────────
  const regions = (src.weather && src.weather.regions) || {};
  const wcodes = (src.weather && src.weather.codes) || {};
  const regionUse = new Map();
  for (const v of Object.values(wcodes)) regionUse.set(v.land, (regionUse.get(v.land) || 0) + 1);
  for (const [s, v] of Object.entries(wcodes)) {
    const reg = regions[v.land] || {};
    rows.push({
      slug: s, authority: 'ghcn_weather', code: String(v.land || ''), label: reg.note || '',
      granularity: 'proxy', native_level: 'weather_region',
      binding: (regionUse.get(v.land) || 1) > 1 ? 'code_shared_by_slugs' : 'exact',
      shared_with: Object.entries(wcodes).filter(([o, ov]) => ov.land === v.land && o !== s).map(([o]) => o).join(';'),
      note: v.origin ? `stated origin: ${v.origin}` : '',
    });
  }

  rows.sort((a, b) => a.slug.localeCompare(b.slug) || a.authority.localeCompare(b.authority) || a.code.localeCompare(b.code));
  return { rows, problems };
}

const COLS = ['slug', 'authority', 'code', 'label', 'granularity', 'native_level', 'binding', 'shared_with', 'note'];
const csvCell = (v) => {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows) => [COLS.join(','), ...rows.map((r) => COLS.map((c) => csvCell(r[c])).join(','))].join('\n') + '\n';

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  let fail = 0, ran = 0;
  const t = (n, c) => { ran++; if (!c) { console.error('  ✗', n); fail++; } };

  t('HS10 is finer than a commodity', hsLevel('0201305045').granularity === 'line');
  t('HS6 is the commodity level', hsLevel('080550').granularity === 'commodity');
  t('HS8 is finer than HS6, not equal to it', hsLevel('12345678').granularity === 'line');
  t('an unrecognised HS length is rejected, never guessed', hsLevel('1234') === null);

  t('one-to-one is exact', bindingOf(1, 1) === 'exact');
  t('a slug spanning codes aggregates', bindingOf(16, 1) === 'slug_aggregates_codes');
  t('a code serving two slugs is shared', bindingOf(1, 2) === 'code_shared_by_slugs');
  t('both at once is reported as both', bindingOf(16, 2) === 'aggregate_and_shared');

  const src = {
    hs: { codes: {
      '080550': { sdesc: 'LEMONS AND LIMES, FRESH OR DRIED', slugs: ['lime', 'lemon'] },
      '070200': { sdesc: 'TOMATOES', slugs: ['tomato'] },
      '0201305045': { sdesc: 'LOIN', slugs: ['striploin'] },
      '1234': { sdesc: 'bad', slugs: ['x'] },
      '070999': { sdesc: 'orphan', slugs: [] },
    } },
    nass: { codes: { tomato: { commodity: 'TOMATOES', class: 'FRESH MARKET', note: 'n' }, okra: { commodity: 'OKRA' } } },
    ers: { map: { avocado: { group: 'fruit-fresh', commodity: 'Fresh avocados', scope: 'commodity' } } },
    noaa: { categories: [{ id: 'shrimp', label: 'Shrimp', serves: ['shrimp', 'shrimp-head-on'], wild_note: 'w' }] },
    weather: { regions: { 'mx-michoacan': { note: 'Michoacan' } }, codes: { avocado: { land: 'mx-michoacan', origin: 'Mexico 88%' } } },
  };
  const { rows, problems } = buildRows(src);

  t('a malformed code is a reported problem, not a silent drop', problems.some((p) => /1234/.test(p)));
  t('a code binding no slug is reported', problems.some((p) => /070999/.test(p)));
  t('neither malformed row reaches the output', !rows.some((r) => r.code === '1234' || r.code === '070999'));

  const lime = rows.find((r) => r.slug === 'lime' && r.authority === 'census_hs');
  t('a shared HS code is flagged shared', lime.binding === 'code_shared_by_slugs');
  t('shared_with NAMES the other ingredient', lime.shared_with === 'lemon');
  t('the shared row still carries the source description', /LEMONS AND LIMES/.test(lime.label));
  const tom = rows.find((r) => r.slug === 'tomato' && r.authority === 'census_hs');
  t('an unshared code is exact', tom.binding === 'exact' && tom.shared_with === '');

  const nt = rows.find((r) => r.slug === 'tomato' && r.authority === 'usda_nass');
  t('a NASS class split is one level finer', nt.granularity === 'line' && nt.native_level === 'nass_commodity_class');
  t('the class is visible in the code, not lost', /FRESH MARKET/.test(nt.code));
  t('NASS without a class stays at commodity', rows.find((r) => r.slug === 'okra' && r.authority === 'usda_nass').granularity === 'commodity');

  const shrimp = rows.find((r) => r.slug === 'shrimp' && r.authority === 'noaa_fisheries');
  t('a NOAA category is coarser than a commodity', shrimp.granularity === 'group');
  t('a NOAA category serving 2 slugs is shared', shrimp.binding === 'code_shared_by_slugs' && shrimp.shared_with === 'shrimp-head-on');

  const wx = rows.find((r) => r.authority === 'ghcn_weather');
  t('a weather region is a proxy, never an identity', wx.granularity === 'proxy');
  t('the weather row keeps its stated origin', /Mexico 88%/.test(wx.note));

  t('every row carries a legal granularity', rows.every((r) => GRANULARITY.includes(r.granularity)));
  t('every row carries a legal binding', rows.every((r) => BINDING.includes(r.binding)));
  t('no row carries a quantity, price or share', rows.every((r) => !/\b(price|usd|\$|tonne|kg\b|lbs?\b|volume|share)\b/i.test(`${r.label} ${r.note}`)));

  const csv = toCsv(rows);
  t('CSV header is the declared column set', csv.split('\n')[0] === COLS.join(','));
  t('a comma inside a description is quoted, not column-splitting', csv.includes('"LEMONS AND LIMES, FRESH OR DRIED"'));
  t('every CSV row has the same field count as the header', (() => {
    const n = COLS.length;
    return csv.trim().split('\n').every((line) => {
      let q = false, c = 1;
      for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) c++; }
      return c === n;
    });
  })());
  t('rows are deterministically ordered', toCsv(buildRows(src).rows) === csv);

  if (fail) { console.error(`build-ingredient-codes self-test: ${fail} of ${ran} failed.`); process.exit(1); }
  console.log(`build-ingredient-codes self-test: ${ran}/${ran} passed (HS levels, binding, shared codes, proxy tier, CSV quoting, determinism).`);
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
function run() {
  const CHECK = process.argv.includes('--check');
  const src = {
    hs: rd('data/ingredient-hs-codes.json'),
    nass: rd('data/ingredient-nass-codes.json'),
    ers: rd('data/ingredient-ers-codes.json'),
    noaa: rd('data/ingredient-noaa-codes.json'),
    weather: rd('data/ingredient-weather-codes.json'),
  };
  const { rows, problems } = buildRows(src);
  if (problems.length) {
    for (const p of problems.slice(0, 10)) console.error('  ✗ ' + p);
    console.error(`✗ ingredient-codes: ${problems.length} malformed source entr(ies) — fix the code table rather than publishing a crosswalk that hides them.`);
    process.exit(1);
  }

  // Every slug must resolve against a known ingredient — priced, yield-listed, or a
  // registered specialty item (ADR-017 sec.4: registration is inert until data lands).
  const known = new Set([
    ...Object.keys(rd('data/cost-index.json').ingredients || {}),
    ...rd('data/ingredient-yields.json').map((x) => x.slug),
    ...(rd('data/ingredient-specialty.json').ingredients || []).map((x) => x.slug),
  ]);
  const orphan = [...new Set(rows.map((r) => r.slug))].filter((s) => !known.has(s));
  if (orphan.length) {
    console.error(`✗ ingredient-codes: ${orphan.length} slug(s) map to a federal code but name no known ingredient (${orphan.slice(0, 8).join(', ')}).`);
    process.exit(1);
  }

  const byAuth = {};
  for (const r of rows) byAuth[r.authority] = (byAuth[r.authority] || 0) + 1;
  const shared = rows.filter((r) => r.binding === 'code_shared_by_slugs' || r.binding === 'aggregate_and_shared').length;

  const csv = toCsv(rows);
  const json = JSON.stringify({
    dataset: 'Muntin Cost Index — Ingredient Identity Crosswalk',
    url: 'https://muntin.digital/cost-index/',
    license: 'CC BY 4.0',
    license_url: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Muntin Cost Index (muntin.digital)',
    rights: {
      mapping_columns: 'CC BY 4.0 (Muntin Cost Index) — the slug-to-code mapping is Muntin editorial work.',
      code_columns: 'The codes and their descriptions are US Government works — public domain (17 USC 105).',
    },
    honesty_note: 'An identity map, never a measurement. No price, no volume, no share, no ranking, no forecast. A code here means "this is the federal identifier we read for this ingredient" — never that the ingredient is imported, grown domestically, or scarce. `granularity` is an absolute cross-authority level (line finer than commodity, group coarser, proxy = not an identity of the ingredient at all). `binding` = code_shared_by_slugs means the source CANNOT separate the listed ingredients, so any per-slug figure drawn from that code is really the combined figure for all of them.',
    counts: { rows: rows.length, slugs: new Set(rows.map((r) => r.slug)).size, byAuthority: byAuth, sharedCodeRows: shared },
    columns: COLS,
    granularity: GRANULARITY,
    binding: BINDING,
    rows,
  }, null, 2) + '\n';

  const targets = [['cost-index/ingredient-codes.csv', csv], ['cost-index/ingredient-codes.json', json]];
  if (CHECK) {
    let drift = 0;
    for (const [p, content] of targets) {
      const cur = fs.existsSync(path.join(repo, p)) ? fs.readFileSync(path.join(repo, p), 'utf8') : '';
      if (cur !== content) { console.error(`DRIFT: ${p} is stale — run: node scripts/build-ingredient-codes.mjs`); drift++; }
    }
    if (drift) process.exit(1);
    console.log(`✓ ingredient-codes: ${rows.length} row(s), ${new Set(rows.map((r) => r.slug)).size} slug(s), ${shared} shared-code row(s) disclosed — in sync.`);
  } else {
    for (const [p, content] of targets) fs.writeFileSync(path.join(repo, p), content);
    console.log(`ingredient-codes: wrote ${rows.length} rows across ${Object.keys(byAuth).length} authorities (${Object.entries(byAuth).map(([k, v]) => `${k} ${v}`).join(', ')}); ${shared} row(s) flagged as a shared code.`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run();
