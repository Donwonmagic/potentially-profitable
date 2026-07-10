#!/usr/bin/env node
/**
 * check-cost-index-picker.mjs — fail-CI gate for the Vendor Benchmark
 * ingredient-picker manifest (data/cost-index-picker.js).
 *
 * The manifest is a generated data layer (scripts/build-cost-index-picker.mjs)
 * that a coming ingredient dropdown will read. This gate pins it to its two
 * upstream sources so a hand-edit, a rule drift, or a stale rebuild can never
 * ship an ingredient the tool can't honestly benchmark:
 *
 *   1. LENGTH   — one manifest entry per browser-seed ingredient (data/cost-index.js).
 *   2. KEYS     — every manifest key is a seed key; the two sets are a bijection.
 *   3. FIELDS   — label_en/label_es/unit_en/unit_es are non-empty AND equal the
 *                 seed's own values (no invented or drifted labels/units).
 *   4. GROUP    — group is a real category in the shared taxonomy
 *                 (scripts/lib/cost-index-categories.mjs) AND equals categoryOf(key).
 *   5. DOLLARREF— dollarRef, recomputed from the seed via the EXACT reference()
 *                 rule (tools/_shared/cost-index-lookup.js), equals the manifest.
 *
 * SINGLE-SOURCE DRIFT GUARD: the picker derives group from the shared taxonomy
 * module; the page generator (scripts/build-cost-index-pages.mjs) still carries
 * its own inline CATEGORIES / CATEGORY_ORDER / ING_META literals. This gate
 * re-parses those literals and asserts the shared module equals them EXACTLY, so
 * the two copies can never diverge silently — edit one and CI fails until both agree.
 *
 *   node scripts/check-cost-index-picker.mjs             # report + fail on any violation
 *   node scripts/check-cost-index-picker.mjs --self-test # exercise the validators on fixtures
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { CATEGORIES, CATEGORY_ORDER, INGREDIENT_CATEGORY, categoryOf } from './lib/cost-index-categories.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// THE dollar-reference rule — byte-for-byte with tools/_shared/cost-index-lookup.js
// reference(). Recomputed here so a manifest hand-edit (or a rule drift in the
// build) fails the gate instead of shipping.
function dollarRefOf(it) {
  const a = (it && it.assessment) || {};
  const lvl = a.level || null;
  const conf = a.confidence || null;
  const firm = conf === 'high' || conf === 'medium';
  return !!(lvl && typeof lvl.medianCents === 'number' && lvl.basis !== 'index' && firm);
}

const isNonEmptyStr = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Pure manifest validator — returns an array of human-readable error strings
 * (empty === valid). Reused by the self-test with synthetic inputs.
 *
 * @param {Array} items      the manifest array (window.MUNTIN_CI_PICKER)
 * @param {Array} seedIngs   seed.ingredients (each with key, labels, units, assessment)
 * @param {Object} categories the valid category label map (keys are valid groups)
 * @param {(k:string)=>string|null} catOf  ingredient → category resolver
 */
export function validateManifest(items, seedIngs, categories, catOf) {
  const errors = [];
  if (!Array.isArray(items)) { errors.push('manifest is not an array'); return errors; }
  if (!Array.isArray(seedIngs)) { errors.push('seed ingredients not an array'); return errors; }

  // 1. length parity
  if (items.length !== seedIngs.length) {
    errors.push(`length ${items.length} != seed ingredient count ${seedIngs.length}`);
  }

  const seedByKey = new Map(seedIngs.map((s) => [s.key, s]));
  const validGroups = new Set(Object.keys(categories));
  const seen = new Set();

  for (const it of items) {
    const k = it && it.key;
    if (!isNonEmptyStr(k)) { errors.push(`entry with missing/blank key: ${JSON.stringify(it)}`); continue; }
    // 2. key ∈ seed, no duplicates
    if (seen.has(k)) { errors.push(`${k}: duplicate key in manifest`); }
    seen.add(k);
    const seed = seedByKey.get(k);
    if (!seed) { errors.push(`${k}: not a seed ingredient key`); continue; }

    // 3. fields non-empty AND equal to the seed's own values
    const expectUnitEn = seed.unit_en || 'unit';
    const expectUnitEs = seed.unit_es || 'unidad';
    for (const f of ['label_en', 'label_es', 'unit_en', 'unit_es']) {
      if (!isNonEmptyStr(it[f])) errors.push(`${k}: ${f} is empty`);
    }
    if (it.label_en !== seed.label_en) errors.push(`${k}: label_en '${it.label_en}' != seed '${seed.label_en}'`);
    if (it.label_es !== seed.label_es) errors.push(`${k}: label_es '${it.label_es}' != seed '${seed.label_es}'`);
    if (it.unit_en !== expectUnitEn) errors.push(`${k}: unit_en '${it.unit_en}' != seed '${expectUnitEn}'`);
    if (it.unit_es !== expectUnitEs) errors.push(`${k}: unit_es '${it.unit_es}' != seed '${expectUnitEs}'`);

    // 4. group is a valid category AND matches the shared taxonomy resolver
    if (!validGroups.has(it.group)) {
      errors.push(`${k}: group '${it.group}' is not a valid category`);
    }
    const expectGroup = catOf(k);
    if (it.group !== expectGroup) {
      errors.push(`${k}: group '${it.group}' != taxonomy '${expectGroup}'`);
    }

    // 5. dollarRef recomputed from the seed via the exact rule
    const expectDollar = dollarRefOf(seed);
    if (it.dollarRef !== expectDollar) {
      errors.push(`${k}: dollarRef ${it.dollarRef} != recomputed ${expectDollar}`);
    }
  }

  // Every seed ingredient must be represented (bijection, not just subset).
  for (const s of seedIngs) {
    if (!seen.has(s.key)) errors.push(`${s.key}: seed ingredient missing from manifest`);
  }
  return errors;
}

/**
 * Pure validator for the manifest's `groups` block (the picker's category headers).
 * Groups must be the taxonomy's own labels — display order via categoryOrder,
 * restricted to groups that actually have ≥1 item, labels equal to CATEGORIES —
 * so the tool's headers can never drift from the public Cost Index category pages.
 *
 * @param {Array} groups   [{ key, label_en, label_es }] from the manifest
 * @param {Array} items    the manifest items (each with a .group)
 * @param {Object} categories the taxonomy label map ({ key: { en, es } })
 * @param {Array} categoryOrder the taxonomy display order
 */
export function validateGroups(groups, items, categories, categoryOrder) {
  const errors = [];
  if (!Array.isArray(groups)) { errors.push('manifest.groups is not an array'); return errors; }
  if (!Array.isArray(items)) { errors.push('manifest.items is not an array (groups check)'); return errors; }

  // The set of groups that SHOULD appear = distinct item.group values, in taxonomy order.
  const present = new Set(items.map((it) => it && it.group).filter(Boolean));
  const expectKeys = categoryOrder.filter((k) => present.has(k));

  const gotKeys = groups.map((g) => g && g.key);
  if (gotKeys.join('|') !== expectKeys.join('|')) {
    errors.push(`groups order/set '${gotKeys.join(',')}' != expected '${expectKeys.join(',')}' (taxonomy order, populated only)`);
  }

  for (const g of groups) {
    const k = g && g.key;
    if (!isNonEmptyStr(k)) { errors.push(`group entry with missing/blank key: ${JSON.stringify(g)}`); continue; }
    const cat = categories[k];
    if (!cat) { errors.push(`group '${k}' is not a taxonomy category`); continue; }
    if (g.label_en !== cat.en) errors.push(`group '${k}': label_en '${g.label_en}' != taxonomy '${cat.en}'`);
    if (g.label_es !== cat.es) errors.push(`group '${k}': label_es '${g.label_es}' != taxonomy '${cat.es}'`);
  }
  return errors;
}

/**
 * HONESTY ROUND-TRIP: the ingredient picker writes a verbatim seed label into the
 * item field, and the tool then resolves that string back to a Cost Index item via
 * MuntinCostIndexLookup.match(). If a label resolves to a DIFFERENT item, the picker
 * silently benchmarks the operator's price against the wrong wholesale series and
 * prints a false "Market match" — a breach of the honesty contract. So every picker
 * label (EN and ES) must resolve to its OWN item. matchFn is injected (the real
 * lookup in the live check; a fake in the self-test).
 *
 * @param {Array} items   manifest items (each with key, label_en, label_es)
 * @param {Object} seed   the seed passed to matchFn (seed.ingredients or the array)
 * @param {(name:string, seed:any)=>({key:string}|null)} matchFn  the lookup
 */
export function validateRoundTrip(items, seed, matchFn) {
  const errors = [];
  if (typeof matchFn !== 'function') { errors.push('round-trip: no match function available'); return errors; }
  if (!Array.isArray(items)) { errors.push('round-trip: items is not an array'); return errors; }
  for (const it of items) {
    for (const f of ['label_en', 'label_es']) {
      const label = it && it[f];
      if (!isNonEmptyStr(label)) continue;
      let got = null;
      try { const r = matchFn(label, seed); got = r && r.key; }
      catch (e) { errors.push(`${it.key}: match(${f}) threw ${e.message}`); continue; }
      if (got !== it.key) {
        errors.push(`${it.key}: match(${f}="${label}") -> ${got || 'null'} (a picker label must resolve to its own item — honesty round-trip)`);
      }
    }
  }
  return errors;
}

// ---- Parse the inline taxonomy literals still in build-cost-index-pages.mjs --
// so the shared module can be asserted equal to them (single-source drift guard).
function parseInlineTaxonomy(src) {
  const sliceBlock = (startTok) => {
    const i = src.indexOf(startTok);
    if (i < 0) return null;
    const rest = src.slice(i + startTok.length);
    const end = rest.indexOf('\n};');
    return end < 0 ? null : rest.slice(0, end);
  };

  // CATEGORIES: `key: { en: 'X', es: 'Y' }` (key bare or single-quoted).
  const catBlock = sliceBlock('const CATEGORIES = {');
  const categories = {};
  if (catBlock) {
    const re = /(?:'([\w-]+)'|([A-Za-z][\w-]*))\s*:\s*\{\s*en:\s*'([^']*)'\s*,\s*es:\s*'([^']*)'\s*\}/g;
    let m;
    while ((m = re.exec(catBlock))) {
      const key = m[1] || m[2];
      categories[key] = { en: m[3], es: m[4] };
    }
  }

  // CATEGORY_ORDER: a single-line array of quoted keys.
  const orderLine = (src.match(/const CATEGORY_ORDER\s*=\s*\[([^\]]*)\]/) || [, ''])[1];
  const categoryOrder = [...orderLine.matchAll(/'([\w-]+)'/g)].map((x) => x[1]);

  // ING_META: `'key': { cat: 'xxx', ... }` — take the cat field per ingredient.
  const metaBlock = sliceBlock('const ING_META = {');
  const ingredientCategory = {};
  if (metaBlock) {
    const re = /'([a-z0-9-]+)'\s*:\s*\{\s*cat:\s*'([a-z-]+)'/g;
    let m;
    while ((m = re.exec(metaBlock))) ingredientCategory[m[1]] = m[2];
  }
  return { categories, categoryOrder, ingredientCategory };
}

function crossCheckTaxonomy(shared, inline) {
  const errors = [];
  // CATEGORIES: same keys + same en/es.
  const sk = Object.keys(shared.CATEGORIES);
  const ik = Object.keys(inline.categories);
  if (sk.length !== ik.length || sk.some((k) => !inline.categories[k])) {
    errors.push(`CATEGORIES keys differ: shared [${sk.join(',')}] vs inline [${ik.join(',')}]`);
  }
  for (const k of sk) {
    const a = shared.CATEGORIES[k], b = inline.categories[k];
    if (!b) continue;
    if (a.en !== b.en || a.es !== b.es) {
      errors.push(`CATEGORIES['${k}'] label mismatch: shared {en:'${a.en}',es:'${a.es}'} vs inline {en:'${b.en}',es:'${b.es}'}`);
    }
  }
  // CATEGORY_ORDER: identical arrays.
  if (shared.CATEGORY_ORDER.join(',') !== inline.categoryOrder.join(',')) {
    errors.push(`CATEGORY_ORDER differs: shared [${shared.CATEGORY_ORDER.join(',')}] vs inline [${inline.categoryOrder.join(',')}]`);
  }
  // INGREDIENT_CATEGORY == ING_META cat map (both directions, same value).
  const ski = Object.keys(shared.INGREDIENT_CATEGORY);
  const iki = Object.keys(inline.ingredientCategory);
  const missShared = iki.filter((k) => !(k in shared.INGREDIENT_CATEGORY));
  const missInline = ski.filter((k) => !(k in inline.ingredientCategory));
  if (missShared.length) errors.push(`ING_META keys missing from shared module: ${missShared.join(', ')}`);
  if (missInline.length) errors.push(`shared module keys missing from ING_META: ${missInline.join(', ')}`);
  for (const k of ski) {
    if (k in inline.ingredientCategory && shared.INGREDIENT_CATEGORY[k] !== inline.ingredientCategory[k]) {
      errors.push(`category for '${k}' differs: shared '${shared.INGREDIENT_CATEGORY[k]}' vs inline '${inline.ingredientCategory[k]}'`);
    }
  }
  return errors;
}

function runCheck() {
  const errors = [];

  let seed, manifestDoc;
  try { seed = require(path.join(repoRoot, 'data/cost-index.js')); }
  catch (e) { console.error('cost-index picker: cannot read data/cost-index.js —', e.message); process.exit(1); }
  try { manifestDoc = require(path.join(repoRoot, 'data/cost-index-picker.js')); }
  catch (e) { console.error('cost-index picker: cannot read data/cost-index-picker.js (run scripts/build-cost-index-picker.mjs) —', e.message); process.exit(1); }

  if (!manifestDoc || !Array.isArray(manifestDoc.items)) {
    console.error('cost-index picker: manifest is not { items: [...] } — run scripts/build-cost-index-picker.mjs.');
    process.exit(1);
  }
  const manifest = manifestDoc.items;
  const seedIngs = (seed && seed.ingredients) || [];
  errors.push(...validateManifest(manifest, seedIngs, CATEGORIES, categoryOf));
  errors.push(...validateGroups(manifestDoc.groups, manifest, CATEGORIES, CATEGORY_ORDER));

  // Honesty round-trip: load the SAME lookup the tool uses (browser-equivalent —
  // MuntinStem + MuntinSkuMatch attached via a global.self shim) and assert every
  // picker label resolves to its own item.
  let matchFn = null;
  try {
    if (typeof globalThis.self === 'undefined') globalThis.self = globalThis;
    require(path.join(repoRoot, 'tools/_shared/stem.js'));
    require(path.join(repoRoot, 'tools/_shared/sku-match.js'));
    matchFn = require(path.join(repoRoot, 'tools/_shared/cost-index-lookup.js')).match;
  } catch (e) {
    errors.push(`round-trip: could not load the lookup modules (${e.message})`);
  }
  if (matchFn) errors.push(...validateRoundTrip(manifest, seed, matchFn));

  // Single-source drift guard against the page generator's inline literals.
  let inline = null;
  try {
    const src = readFileSync(path.join(repoRoot, 'scripts/build-cost-index-pages.mjs'), 'utf8');
    inline = parseInlineTaxonomy(src);
  } catch (e) {
    errors.push(`could not read build-cost-index-pages.mjs for the drift check: ${e.message}`);
  }
  if (inline) {
    if (!Object.keys(inline.categories).length) errors.push('drift check: could not parse inline CATEGORIES');
    if (!inline.categoryOrder.length) errors.push('drift check: could not parse inline CATEGORY_ORDER');
    if (!Object.keys(inline.ingredientCategory).length) errors.push('drift check: could not parse inline ING_META');
    errors.push(...crossCheckTaxonomy({ CATEGORIES, CATEGORY_ORDER, INGREDIENT_CATEGORY }, inline));
  }

  if (errors.length) {
    console.error(`Cost-index picker: ${errors.length} violation(s):`);
    for (const e of errors) console.error('  ✗ ' + e);
    process.exit(1);
  }
  const dr = manifest.filter((x) => x.dollarRef).length;
  const ng = Array.isArray(manifestDoc.groups) ? manifestDoc.groups.length : 0;
  console.log(`Cost-index picker: OK — ${manifest.length} ingredient(s), ${dr} with a firm dollar reference, ${ng} group(s); taxonomy in lockstep with build-cost-index-pages.mjs.`);
  process.exit(0);
}

function selfTest() {
  // A tiny synthetic world: two categories, three seed ingredients.
  const cats = { alpha: { en: 'Alpha', es: 'Alfa' }, beta: { en: 'Beta', es: 'Beta' } };
  const cat = { a1: 'alpha', a2: 'alpha', b1: 'beta' };
  const catOf = (k) => (k in cat ? cat[k] : null);
  const seedIngs = [
    // dollarRef TRUE: medium confidence, wholesale (non-index) dollar level.
    { key: 'a1', label_en: 'A One', label_es: 'A Uno', unit_en: 'lb', unit_es: 'libra', assessment: { confidence: 'medium', level: { medianCents: 500, basis: 'wholesale' } } },
    // dollarRef FALSE: index basis (never a dollar level even at high confidence).
    { key: 'a2', label_en: 'A Two', label_es: 'A Dos', unit_en: 'lb', unit_es: 'libra', assessment: { confidence: 'high', level: { medianCents: 200, basis: 'index' } } },
    // dollarRef FALSE: low confidence.
    { key: 'b1', label_en: 'B One', label_es: 'B Uno', unit_en: 'each', unit_es: 'cada', assessment: { confidence: 'low', level: { medianCents: 999, basis: 'wholesale' } } },
  ];
  const good = seedIngs.map((s) => ({ key: s.key, label_en: s.label_en, label_es: s.label_es, unit_en: s.unit_en, unit_es: s.unit_es, group: catOf(s.key), dollarRef: dollarRefOf(s) }));

  const cases = [];
  const add = (name, expectFail, mutate) => {
    const items = good.map((x) => ({ ...x }));
    if (mutate) mutate(items);
    const errs = validateManifest(items, seedIngs, cats, catOf);
    const failed = errs.length > 0;
    cases.push({ name, ok: failed === expectFail, expectFail, errs });
  };

  add('valid manifest passes', false, null);
  add('wrong length fails', true, (it) => it.pop());
  add('unknown key fails', true, (it) => { it[0].key = 'zz'; });
  add('empty label fails', true, (it) => { it[0].label_en = ''; });
  add('drifted label fails', true, (it) => { it[0].label_en = 'Mangled'; });
  add('drifted unit fails', true, (it) => { it[0].unit_en = 'kg'; });
  add('bad group fails', true, (it) => { it[0].group = 'gamma'; });
  add('wrong (valid) group fails', true, (it) => { it[2].group = 'alpha'; }); // b1 is beta
  add('flipped dollarRef true→false fails', true, (it) => { it[0].dollarRef = false; });
  add('flipped dollarRef false→true fails', true, (it) => { it[1].dollarRef = true; });
  add('duplicate key fails', true, (it) => { it[1].key = it[0].key; });

  // Cross-check helper: identical taxonomies pass, a single divergence fails.
  const sharedT = { CATEGORIES: cats, CATEGORY_ORDER: ['alpha', 'beta'], INGREDIENT_CATEGORY: cat };
  const inlineSame = { categories: cats, categoryOrder: ['alpha', 'beta'], ingredientCategory: { ...cat } };
  const inlineDrift = { categories: cats, categoryOrder: ['alpha', 'beta'], ingredientCategory: { ...cat, b1: 'alpha' } };
  cases.push({ name: 'taxonomy match passes', ok: crossCheckTaxonomy(sharedT, inlineSame).length === 0, expectFail: false, errs: [] });
  cases.push({ name: 'taxonomy drift fails', ok: crossCheckTaxonomy(sharedT, inlineDrift).length > 0, expectFail: true, errs: [] });

  // validateGroups: correct group block passes; order/label/set drift fails.
  const goodGroups = [
    { key: 'alpha', label_en: 'Alpha', label_es: 'Alfa' },
    { key: 'beta', label_en: 'Beta', label_es: 'Beta' },
  ];
  const gcase = (name, expectFail, groups) => {
    const errs = validateGroups(groups, good, cats, ['alpha', 'beta']);
    cases.push({ name, ok: (errs.length > 0) === expectFail, expectFail, errs });
  };
  gcase('groups valid passes', false, goodGroups.map((g) => ({ ...g })));
  gcase('groups wrong order fails', true, [goodGroups[1], goodGroups[0]]);
  gcase('groups missing populated fails', true, [goodGroups[0]]);
  gcase('groups drifted label fails', true, [{ key: 'alpha', label_en: 'Alfa!', label_es: 'Alfa' }, goodGroups[1]]);
  gcase('groups extra unpopulated fails', true, [...goodGroups, { key: 'gamma', label_en: 'G', label_es: 'G' }]);

  // validateRoundTrip: a label that resolves to its own item passes; a cross-item
  // resolution fails (this is the butter-lettuce class of honesty bug).
  const rtItems = [
    { key: 'a1', label_en: 'A One', label_es: 'A Uno' },
    { key: 'a2', label_en: 'A Two', label_es: 'A Dos' },
  ];
  const okMatch = (label) => ({ key: /one|uno/i.test(label) ? 'a1' : 'a2' });
  const badMatch = () => ({ key: 'a1' }); // always a1 -> a2's labels mis-resolve
  const nullMatch = () => null;
  cases.push({ name: 'round-trip valid passes', ok: validateRoundTrip(rtItems, {}, okMatch).length === 0, expectFail: false, errs: [] });
  cases.push({ name: 'round-trip cross-item fails', ok: validateRoundTrip(rtItems, {}, badMatch).length > 0, expectFail: true, errs: [] });
  cases.push({ name: 'round-trip null-resolve fails', ok: validateRoundTrip(rtItems, {}, nullMatch).length > 0, expectFail: true, errs: [] });

  const failed = cases.filter((c) => !c.ok);
  for (const c of failed) console.error(`  ✗ self-test case FAILED: ${c.name} (errs: ${JSON.stringify(c.errs)})`);
  console.log(`cost-index picker self-test: ${cases.length - failed.length}/${cases.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();
else runCheck();
