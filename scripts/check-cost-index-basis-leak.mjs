#!/usr/bin/env node
/**
 * check-cost-index-basis-leak.mjs — the basis-honesty leak gate.
 *
 * THE RAIL: the Cost Index renders a $ price ONLY on a real dollar basis
 * (delivered / wholesale / retail). index / farm-gate / customs are
 * direction/shape/education-only and must NEVER surface as a $ level (a stored
 * index/NOAA-import-unit-value ~$4 reads as "$4.03/lb" the instant a consumer
 * treats it as a price). composite-price.isDollarBasis enforces this when the
 * engine BUILDS a level; this gate asserts it holds across every PUBLISHED
 * surface and keeps honest books on the SOURCE.
 *
 * TRUST THE SOURCE, NOT THE LABEL (the hard lesson): a rendered surface can carry
 * a self-declared basis that LIES — salmon-fillet's stale series.json declared
 * basis="wholesale" while every observation was a NOAA import unit-value (source
 * basis index). A gate that trusted the surface's own basis field passed it clean.
 * So every rendered $ is cross-referenced against the SOURCE OF TRUTH
 * (data/cost-index.json): a $ ships honestly only if that ingredient has a real
 * dollar-basis level in the source. A non-$ source basis (or an explicit non-$
 * self-label) carrying a $ is a LEAK regardless of what the surface calls it.
 *
 * TWO POSTURES:
 *   HARD-FAIL — the surfaces a consumer/quant/AI actually reads:
 *     · browser seed            data/cost-index.js       → assessment.level
 *     · JSON index feed         cost-index/index.json     → priceLow/Median/HighUsd
 *     · JSON reference feed      cost-index/feed.json      → reference.priceUsd (+low/high)
 *     · CSV index feed          cost-index/index.csv      → price_low/median/high_usd
 *     · per-ingredient series   cost-index/<slug>/series.json + series.csv → priceUsd
 *     · weekly digest CSV       cost-index/week-*.csv     → median_cents
 *   TRACKED (fail-closed, content-bound) — the SOURCE data/cost-index.json:
 *     10 index-basis seafood carry a $ level at their newest non-null points[].level
 *     but are SUPPRESSED from every rendered surface. Each is bound to its exact
 *     {basis, medianCents}; a NEW non-$ source level, or a mutated known one, FAILS.
 *   ORPHAN (info) — a rendered surface shipping a $ for a slug ABSENT from the
 *     source (e.g. poblano-pepper, genuine wholesale but dropped by a re-fetch):
 *     reported as a stale orphan pending republish, not a basis lie.
 *
 *   node scripts/check-cost-index-basis-leak.mjs             # CI gate
 *   node scripts/check-cost-index-basis-leak.mjs --self-test # pin the detector
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const rd = (p) => { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } };
const rdText = (p) => { try { return readFileSync(path.join(repo, p), 'utf8'); } catch { return null; } };

export const DOLLAR_BASES = ['delivered', 'wholesale', 'retail'];
export const isDollarBasis = (b) => DOLLAR_BASES.indexOf(b) >= 0;

// The index-basis seafood that carry a $ level at their newest non-null
// points[].level in the SOURCE (data/cost-index.json — NOAA import unit-values)
// but are suppressed from every rendered surface. Content-bound {basis, medianCents}
// so a mutated or newly-added key cannot be silently absorbed (a bare count check
// would pass when a 10th key is added alongside its allowlist entry). Set 2026-07-02;
// salmon-fillet joined the day its stale mislabeled series.json was withdrawn.
export const KNOWN_SOURCE_LATENT = new Map([
  ['octopus', { basis: 'index', medianCents: 429 }],
  ['salmon-fillet', { basis: 'index', medianCents: 558 }],
  ['salmon-skin-on-fillet', { basis: 'index', medianCents: 558 }],
  ['scallops', { basis: 'index', medianCents: 865 }],
  ['tuna-loin', { basis: 'index', medianCents: 522 }],
  ['whole-crab', { basis: 'index', medianCents: 994 }],
  ['whole-halibut', { basis: 'index', medianCents: 931 }],
  ['whole-lobster', { basis: 'index', medianCents: 1090 }],
  ['whole-salmon', { basis: 'index', medianCents: 403 }],
  ['whole-trout', { basis: 'index', medianCents: 396 }],
]);

// RFC-4180-ish CSV line parser — quoted fields with commas (e.g. "Butter (AA, bulk)").
export function parseCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === ',') { out.push(cur); cur = ''; }
    else if (ch === '"') q = true;
    else cur += ch;
  }
  out.push(cur); return out;
}
const feedArray = (feed) => (!feed ? [] : Array.isArray(feed) ? feed : feed.ingredients || feed.items || (Object.values(feed).find(Array.isArray)) || []);
const numify = (v) => (v != null && v !== '' && isFinite(Number(v)) ? Number(v) : null);

// The $ figure (cents) a level exposes, under any of its dollar-bearing fields —
// medianCents, rangeCents[0], or provenance[].valueCents — coerced via isFinite so a
// numeric-string ('35046') is caught too (the rendered checks already coerce this way).
export function levelCents(l) {
  if (!l) return null;
  if (numify(l.medianCents) != null) return numify(l.medianCents);
  if (Array.isArray(l.rangeCents) && numify(l.rangeCents[0]) != null) return numify(l.rangeCents[0]);
  if (Array.isArray(l.provenance)) for (const p of l.provenance) if (p && numify(p.valueCents) != null) return numify(p.valueCents);
  return null;
}

// The source model: for each slug, its newest non-null level's basis + $ figure,
// and whether it has ANY dollar-basis level anywhere in its points. points are
// newest-first, so the first level found is the one the engine would render from.
export function buildSourceModel(index) {
  const model = {};
  for (const [k, ing] of Object.entries((index && index.ingredients) || {})) {
    let effBasis = null, effCents = null, hasAnyLevel = false, hasDollarLevel = false;
    for (const p of (ing && ing.points) || []) {
      const l = p && p.level;
      const c = levelCents(l);
      if (c == null) continue;
      hasAnyLevel = true;
      if (effBasis == null) { effBasis = l.basis; effCents = c; }
      if (isDollarBasis(l.basis)) hasDollarLevel = true;
    }
    model[k] = { present: true, hasAnyLevel, hasDollarLevel, effBasis, effCents };
  }
  return model;
}

// Verdict for a rendered $ on `slug` carrying self-declared basis `selfBasis`.
// Trust the source: leak on an explicit non-$ self-label OR a source whose NEWEST
// non-null level is non-$; orphan when the source doesn't know the slug. Judge on the
// newest level (src.effBasis) — the one the engine renders from — NOT "did any point in
// history ever carry a $ level": a slug whose newest level is index but that retains an
// OLD wholesale level renders index yet would pass a hasDollarLevel check (the exact
// salmon-fillet class), so this must match the SOURCE posture, which also uses the newest.
function renderVerdict(slug, selfBasis, model) {
  if (selfBasis != null && !isDollarBasis(selfBasis)) return { kind: 'leak', why: `self-basis="${selfBasis}" (non-$)` };
  const src = model[slug];
  if (!src || !src.hasAnyLevel) return { kind: 'orphan', why: src ? 'in source but has no level' : 'absent from the source index' };
  if (!isDollarBasis(src.effBasis)) return { kind: 'leak', why: `source newest level basis="${src.effBasis}" (non-$)` };
  return { kind: 'ok' };
}

// scan → { errors[] (hard-fail: a RENDERED surface leaks a $ on a non-$ basis),
//          tracked[] (info: known content-bound SOURCE-level latent),
//          orphans[] (info: rendered $ for a slug the source doesn't back) }.
export function scan({ index, seedIng, indexJson, feedJson, indexCsv, weekCsvs, weekJsons, series } = {}) {
  const errors = [], tracked = [], orphans = [];
  const model = buildSourceModel(index);
  const emit = (slug, selfBasis, usd, surface) => {
    if (!usd.length) return;
    const v = renderVerdict(slug, selfBasis, model);
    const tag = `${surface}: ${slug} ships $ ${usd.join('/')}`;
    if (v.kind === 'leak') errors.push(`${tag} — ${v.why}`);
    else if (v.kind === 'orphan') orphans.push(`${tag} — ${v.why} (stale orphan pending republish)`);
  };

  // --- SOURCE (data/cost-index.json): newest non-null non-$ level → tracked (bound) or NEW-leak ---
  for (const [k, ing] of Object.entries((index && index.ingredients) || {})) {
    let lvl = null;
    for (const p of (ing && ing.points) || []) { if (p && p.level && levelCents(p.level) != null) { lvl = p.level; break; } }
    if (!lvl || isDollarBasis(lvl.basis)) continue;
    const cents = levelCents(lvl);
    const bound = KNOWN_SOURCE_LATENT.get(k);
    const base = `data/cost-index.json: ${k} newest level is basis="${lvl.basis}" (non-$) with $${(cents / 100).toFixed(2)} (${cents}c)`;
    if (bound && bound.basis === lvl.basis && bound.medianCents === cents) tracked.push(base + ' [suppressed from every rendered surface — tracked hygiene]');
    else errors.push(base + (bound ? ` — MUTATED known-latent (bound ${bound.basis}/${bound.medianCents}c)` : ' — NEW non-$ source level, not in the content-bound known set'));
  }

  // --- RENDERED: browser seed (assessment.level) ---
  for (const it of seedIng || []) {
    const lvl = (it.assessment && it.assessment.level) || it.level || null;
    const c = levelCents(lvl);
    if (c != null) emit(it.key || it.slug || '?', lvl && lvl.basis, [`$${(c / 100).toFixed(2)}`], 'seed');
  }
  // --- RENDERED: cost-index/index.json ---
  for (const it of feedArray(indexJson)) {
    const usd = [it.priceMedianUsd, it.priceLowUsd, it.priceHighUsd, it.price_median_usd, it.price_low_usd, it.price_high_usd].map(numify).filter((v) => v != null);
    emit(it.slug || it.key || '?', it.basis || (it.level && it.level.basis), usd, 'index.json');
  }
  // --- RENDERED: cost-index/feed.json ---
  for (const it of feedArray(feedJson)) {
    const ref = it.reference || {};
    const usd = [ref.priceUsd, ref.priceLowUsd, ref.priceHighUsd, it.priceMedianUsd].map(numify).filter((v) => v != null);
    emit(it.slug || it.key || '?', it.basis || (it.level && it.level.basis), usd, 'feed.json');
  }
  // --- RENDERED: cost-index/index.csv (basis + price_*_usd columns) ---
  if (indexCsv) {
    const lines = indexCsv.trim().split(/\r?\n/), head = parseCsvLine(lines[0]);
    const si = head.indexOf('slug'), bi = head.indexOf('basis');
    const pis = ['price_low_usd', 'price_median_usd', 'price_high_usd'].map((c) => head.indexOf(c)).filter((i) => i >= 0);
    for (const line of lines.slice(1)) {
      const c = parseCsvLine(line);
      const usd = pis.map((i) => numify(c[i])).filter((v) => v != null);
      emit(c[si] || '?', bi >= 0 ? c[bi] : null, usd, 'index.csv');
    }
  }
  // --- RENDERED: per-ingredient series.json + series.csv ---
  for (const s of series || []) {
    if (s.json) {
      const usd = (s.json.observations || []).map((o) => numify(o && o.priceUsd)).filter((v) => v != null);
      emit(s.slug, s.json.basis, usd, `${s.slug}/series.json`);
    }
    if (s.csv) {
      const lines = s.csv.trim().split(/\r?\n/), head = parseCsvLine(lines[0]);
      const pi = head.indexOf('price_usd'), bi = head.indexOf('basis');
      if (pi >= 0) {
        const usd = [], bset = new Set();
        for (const line of lines.slice(1)) { const c = parseCsvLine(line); const v = numify(c[pi]); if (v != null) usd.push(v); if (bi >= 0 && c[bi]) bset.add(c[bi]); }
        emit(s.slug, bset.size === 1 ? [...bset][0] : (s.json && s.json.basis) || null, usd.slice(0, 1), `${s.slug}/series.csv`);
      }
    }
  }
  // --- RENDERED: cost-index/week-*.csv (median_cents = a $ cents level) ---
  for (const wc of weekCsvs || []) {
    if (!wc || !wc.text) continue;
    const lines = wc.text.trim().split(/\r?\n/), head = parseCsvLine(lines[0]);
    const ii = head.indexOf('ingredient'), mi = head.indexOf('median_cents');
    if (ii < 0 || mi < 0) continue;
    for (const line of lines.slice(1)) {
      const c = parseCsvLine(line), v = numify(c[mi]);
      if (v != null) emit(c[ii] || '?', null, [`${(v / 100).toFixed(2)} (median_cents ${c[mi]})`], wc.name);
    }
  }
  // --- RENDERED: cost-index/week-*.json (.flags[].medianCents — same $ level as the CSV, but no basis field) ---
  for (const wj of weekJsons || []) {
    if (!wj || !wj.json || !Array.isArray(wj.json.flags)) continue;
    for (const f of wj.json.flags) {
      const v = numify(f && f.medianCents);
      if (v != null) emit(f.ingredient || f.slug || '?', f.basis || null, [`${(v / 100).toFixed(2)} (flags.medianCents ${f.medianCents})`], wj.name);
    }
  }
  return { errors, tracked, orphans };
}

function loadSeedIngredients() {
  try { global.window = {}; require(path.join(repo, 'data/cost-index.js')); return (global.window.MUNTIN_COST_INDEX && global.window.MUNTIN_COST_INDEX.ingredients) || []; } catch { return []; }
}
function loadWeekCsvs() {
  try { return readdirSync(path.join(repo, 'cost-index')).filter((f) => /^week-.*\.csv$/.test(f)).map((f) => ({ name: f, text: rdText(path.join('cost-index', f)) })); } catch { return []; }
}
function loadWeekJsons() {
  try { return readdirSync(path.join(repo, 'cost-index')).filter((f) => /^week-.*\.json$/.test(f)).map((f) => ({ name: f, json: rd(path.join('cost-index', f)) })); } catch { return []; }
}
function loadSeries() {
  try {
    return readdirSync(path.join(repo, 'cost-index'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(path.join(repo, 'cost-index', e.name, 'series.json')))
      .map((e) => ({ slug: e.name, json: rd(path.join('cost-index', e.name, 'series.json')), csv: rdText(path.join('cost-index', e.name, 'series.csv')) }));
  } catch { return []; }
}
const liveSurfaces = () => ({
  index: rd('data/cost-index.json'), seedIng: loadSeedIngredients(),
  indexJson: rd('cost-index/index.json'), feedJson: rd('cost-index/feed.json'),
  indexCsv: rdText('cost-index/index.csv'), weekCsvs: loadWeekCsvs(), weekJsons: loadWeekJsons(), series: loadSeries(),
});

function selfTest() {
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  FAIL:', m); } };
  const src = (ings) => ({ index: { ingredients: ings } });
  const lvl = (basis, medianCents) => ({ points: [{ level: { basis, medianCents } }] });
  const wholesaleSrc = { ribeye: lvl('wholesale', 1314) };

  // SOURCE posture ---------------------------------------------------------
  ok(scan(src({ ribeye: lvl('wholesale', 1314) })).errors.length === 0, 'source: wholesale + $ level → no error');
  const known = scan(src({ 'whole-salmon': lvl('index', 403) }));
  ok(known.errors.length === 0 && known.tracked.some((t) => /whole-salmon/.test(t)), 'source: KNOWN content-bound seafood → tracked, not error');
  ok(scan(src({ 'whole-salmon': lvl('index', 999) })).errors.some((e) => /MUTATED/.test(e)), 'source: known key with a MUTATED medianCents → hard fail');
  ok(scan(src({ 'vegetable-oil': lvl('index', 35046) })).errors.some((e) => /NEW non-\$ source/.test(e)), 'source: NEW non-$ level → hard fail (fail-closed)');
  ok(scan(src({ 'salmon-fillet': { points: [{ level: null }, { level: { basis: 'index', medianCents: 558 } }] } })).tracked.some((t) => /salmon-fillet/.test(t)), 'source: non-$ level at points[1] (newest non-null) → tracked, not missed');
  ok(scan(src({ x: { points: [{ level: { basis: 'index', rangeCents: [34900, 35200] } }] } })).errors.some((e) => /NEW non-\$/.test(e)), 'source: non-$ level with $ in rangeCents (no medianCents) → caught');
  ok(scan(src({ x: { points: [{ level: { basis: 'index', provenance: [{ valueCents: 35046 }] } }] } })).errors.some((e) => /NEW non-\$/.test(e)), 'source: non-$ level with $ only in provenance.valueCents → caught');
  ok(scan(src({ x: { points: [{ level: { basis: 'index', medianCents: '35046' } }] } })).errors.some((e) => /NEW non-\$/.test(e)), 'source: non-$ level with a string medianCents → caught (isFinite coercion)');

  // RENDERED postures — trust the SOURCE, not the self-declared label -------
  ok(scan({ index: { ingredients: wholesaleSrc }, seedIng: [{ key: 'ribeye', assessment: { level: { basis: 'wholesale', medianCents: 1314 } } }] }).errors.length === 0, 'seed: dollar source + $ → fine');
  ok(scan({ index: { ingredients: { veg: lvl('index', 35046) } }, seedIng: [{ key: 'veg', assessment: { level: { basis: 'wholesale', medianCents: 35046 } } }] }).errors.some((e) => /seed.*veg/.test(e)), 'seed: LABEL says wholesale but SOURCE is index → leak caught (do not trust the label)');
  ok(scan({ index: { ingredients: { veg: lvl('index', 35046) } }, feedJson: [{ slug: 'veg', basis: 'wholesale', reference: { priceUsd: 350.46 } }] }).errors.some((e) => /feed\.json.*veg/.test(e)), 'feed.json: mislabeled wholesale over an index source → leak caught (the salmon-fillet class)');
  ok(scan({ index: { ingredients: { veg: lvl('index', 35046) } }, series: [{ slug: 'veg', json: { basis: 'wholesale', observations: [{ priceUsd: 350.46 }] } }] }).errors.some((e) => /veg\/series\.json/.test(e)), 'series.json: mislabeled wholesale over an index source → leak caught');
  // NEWEST level, not "any historical $ level": a slug whose newest level is index but
  // that retains an OLD wholesale level renders index → a rendered $ must still be a leak.
  ok(scan({ index: { ingredients: { sal: { points: [{ level: { basis: 'index', medianCents: 403 } }, { level: { basis: 'wholesale', medianCents: 380 } }] } } }, series: [{ slug: 'sal', json: { basis: 'wholesale', observations: [{ priceUsd: 4.03 }] } }] }).errors.some((e) => /sal\/series\.json.*non-\$/.test(e)), 'newest-level: index newest over an OLD wholesale level + rendered $ → leak (not waved through by a stale $ level)');
  ok(scan({ index: { ingredients: wholesaleSrc }, indexJson: [{ slug: 'ribeye', basis: 'wholesale', priceLowUsd: 12.6 }] }).errors.length === 0, 'index.json: dollar source + priceLowUsd alone → fine');
  ok(scan({ index: { ingredients: { veg: lvl('index', 35046) } }, indexJson: [{ slug: 'veg', basis: 'index', priceLowUsd: 349 }] }).errors.some((e) => /index\.json.*veg/.test(e)), 'index.json: non-$ + priceLowUsd ALONE → leak caught');
  ok(scan({ index: { ingredients: {} }, feedJson: [{ slug: 'poblano-pepper', basis: 'wholesale', reference: { priceUsd: 33 } }] }).orphans.some((o) => /poblano/.test(o)) && !scan({ index: { ingredients: {} }, feedJson: [{ slug: 'poblano-pepper', basis: 'wholesale', reference: { priceUsd: 33 } }] }).errors.length, 'feed.json: $ for a source-absent slug → ORPHAN (info), not a hard fail');
  ok(scan({ index: { ingredients: { veg: lvl('index', 35046) } }, indexCsv: 'slug,basis,price_median_usd\nveg,index,350.46' }).errors.some((e) => /index\.csv.*veg/.test(e)), 'index.csv: non-$ + price column → leak caught');
  ok(scan({ index: { ingredients: { veg: lvl('index', 35046) } }, weekCsvs: [{ name: 'week-x.csv', text: 'ingredient,pct_vs_baseline,direction,flag,median_cents,elevated_weeks\nveg,0.1,up,,35046,4' }] }).errors.some((e) => /week-x\.csv.*veg/.test(e)), 'week csv: non-$ source + median_cents → leak caught');
  ok(scan({ index: { ingredients: { veg: lvl('index', 35046) } }, weekJsons: [{ name: 'week-x.json', json: { flags: [{ ingredient: 'veg', medianCents: 35046 }] } }] }).errors.some((e) => /week-x\.json.*veg/.test(e)), 'week json: non-$ source + flags.medianCents → leak caught (the JSON digest is scanned too)');

  // LIVE data --------------------------------------------------------------
  const live = scan(liveSurfaces());
  ok(live.errors.length === 0, `live: NO rendered-surface leak (${live.errors.length}${live.errors[0] ? ': ' + live.errors[0] : ''})`);
  ok(live.tracked.length === KNOWN_SOURCE_LATENT.size, `live: exactly the ${KNOWN_SOURCE_LATENT.size} content-bound source-latent items tracked (got ${live.tracked.length})`);
  ok(live.orphans.every((o) => /poblano-pepper/.test(o)), `live: the only rendered orphan is poblano-pepper (got ${live.orphans.length})`);

  console.log(`basis-leak self-test: ${pass}/${pass + fail} passed.`);
  return fail === 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  if (process.argv.includes('--self-test')) {
    process.exit(selfTest() ? 0 : 1);
  } else {
    const { errors, tracked, orphans } = scan(liveSurfaces());
    if (tracked.length) {
      console.log(`ℹ basis-leak: ${tracked.length} content-bound source-level latent item(s) in data/cost-index.json (suppressed from every rendered surface; pending engine-level level-suppression).`);
    }
    if (orphans.length) {
      console.log(`ℹ basis-leak: ${orphans.length} rendered orphan(s) — a $ shipped for a slug the source no longer backs (stale, pending republish):`);
      orphans.slice(0, 12).forEach((o) => console.log('  · ' + o));
    }
    if (errors.length) {
      console.error(`✗ basis-leak gate: ${errors.length} non-$-basis $-level leak(s):`);
      errors.slice(0, 25).forEach((e) => console.error('  - ' + e));
      process.exit(1);
    }
    console.log('✓ basis-leak gate: OK — every rendered $ (seed, index.json, feed.json, index.csv, per-ingredient series, weekly digest) traces to a dollar-basis level in the source; no index/farm-gate/customs basis leaks a price.');
  }
}
