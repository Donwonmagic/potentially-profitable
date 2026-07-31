#!/usr/bin/env node
/**
 * fetch-food-recalls.mjs — openFDA Food Enforcement (recall) adapter, wave-1 of the corpus-expansion
 * fetch list (data/corpus-fetch-list.json). It pulls dated, documented food recalls into the ADR-011
 * events lane as CO-OCCURRENCE — an event flag beside a price window, NEVER an asserted price cause
 * or magnitude. openFDA is US-FDA public domain (CC0), so the normalized subset is redistributable.
 *
 * The raw feed is ~10k recalls, most of them finished products that never touch a tracked ingredient.
 * So the adapter FILTERS at fetch time to recalls whose product text mentions one of the ~169 tracked
 * ingredients (cost-index/ingredient-state-record.json), tagging each kept recall with the matched
 * slug(s) — that IS the ingredient join, done honestly (a whole-word/phrase match on the product
 * text, not an inferred cause). The committed file is the small, relevant, tagged set.
 *
 * Per ADR-013 the LIVE fetch runs on the operator Mac (network); the container proves the transform +
 * the matcher offline with a synthetic fixture.
 *
 *   node scripts/fetch-food-recalls.mjs                 # demo: normalize + match a synthetic fixture, no network
 *   node scripts/fetch-food-recalls.mjs --self-test     # CI: pin the transform, the matcher, the framing
 *   node scripts/fetch-food-recalls.mjs --live          # operator Mac: fetch openFDA, filter, write data/food-recalls.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://api.fda.gov/food/enforcement.json';
const OUT = 'data/food-recalls.json';
const ISR = 'cost-index/ingredient-state-record.json';
const SINCE = '20200101';

// Ingredient names that are too generic as a standalone word to be an honest match on free product
// text (they fire on finished goods — "brown BUTTER cookie dough"). Filled from live output review.
const STOPWORDS = new Set(['butter', 'oil', 'cream', 'milk', 'sugar', 'salt', 'water', 'rice', 'corn', 'egg']);

// A recall is a DATED, DOCUMENTED EVENT. Keep the factual recall fields; add nothing interpretive.
function normalize(r) {
  const d = (s) => /^\d{8}$/.test(s || '') ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : (s || null);
  const clamp = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  return {
    recall_number: r.recall_number || null,
    event_id: r.event_id || null,
    report_date: d(r.report_date),
    initiated: d(r.recall_initiation_date),
    classification: r.classification || null, // FDA severity Class I/II/III — a published fact, not our judgment
    status: r.status || null,
    product: clamp(r.product_description, 180),
    reason: clamp(r.reason_for_recall, 220),
    firm: clamp(r.recalling_firm, 90),
    states: clamp(r.distribution_pattern, 120),
    product_type: r.product_type || null,
  };
}

// Fold accents to ASCII BEFORE the [^a-z ] strip. Without this, "Jalapeño" lowercases to
// "jalapeño", the strip turns "ñ" into a SPACE, and the keyword becomes "jalape o" — a phrase
// that appears in no product text on earth. The slug then reports zero recalls forever, and the
// zero reads as a food-safety fact instead of a string bug. Found 2026-07-31 by the discovery
// run's kill panel: 4 openFDA rows name jalapeños (one is "Supreme Jalapenos Diced") and none
// carried the jalapeno slug. Must be applied to BOTH sides — keyword and product text — or an
// accented product description fails to match an un-accented keyword.
const deburr = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');

// Derive one match phrase per ingredient from its display name (drop parentheticals + non-letters).
function ingredientKeywords(isr) {
  return (isr.ingredients || isr || []).map((r) => {
    const kw = deburr(r.name).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
    return { slug: r.slug, kw };
  }).filter((x) => x.slug && x.kw && x.kw.length >= 3 && !STOPWORDS.has(x.kw));
}

// Whole-word / whole-phrase match (+ a naive plural) of an ingredient phrase in the product text.
// PRODUCT ONLY — never the reason field, which is full of allergen warnings ("undeclared cashew")
// that would false-match a sunflower recall to cashew. Returns the matched slugs.
function matchSlugs(product, kws) {
  const p = ' ' + deburr(product).toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hits = [];
  for (const { slug, kw } of kws) if (p.includes(' ' + kw + ' ') || p.includes(' ' + kw + 's ')) hits.push(slug);
  return hits;
}

// The honest signal is a FRESH-COMMODITY recall (the raw ingredient you buy), not a finished good that
// merely names an ingredient as a flavor. Keep a match only when the product reads like the commodity:
// a fresh/raw cue is present, OR the name is short (the product basically IS the ingredient) — and
// never when a processed-form word (rings/pudding/chips/sauce/…) is present.
const FRESH_CUE = /\b(fresh|raw|whole|organic|bulk|sprouts?|leafy|bunch|clamshell|shell[- ]?on|head|cut|diced|sliced|peeled|produce)\b/;
const PROCESSED_CUE = /\b(rings?|pudding|cookies?|candy|chocolate|lassi|sauce|dressing|snacks?|bars?|drinks?|beverage|dessert|cakes?|cheesecake|pie|ice[- ]?cream|sherbe?r?t|sorbet|gelato|custard|froyo|flavou?red|seasoning|marshmallow|cereal|granola|chips?|crackers?|jerky|bread|muffins?|smoothie|latte|syrup|jam|jelly|spread|dip|salad|burgers?|fillets?|sandwich|sandwiches|patty|patties|pizza|wraps?|meals?|kit|entree|hummus|deli|tacos?|burritos?|sushi|rolls?|nuggets?|tenders?|dumplings?)\b/;
function isFreshCommodity(product) {
  const p = deburr(product).toLowerCase();
  if (PROCESSED_CUE.test(p)) return false;
  const words = p.replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean).length;
  return FRESH_CUE.test(p) || words <= 5;
}

/**
 * Measure the matcher's own arity bias, so the disclosure carries numbers instead of adjectives.
 * matchSlugs needs the WHOLE phrase present verbatim, so a multi-word display name ("Salmon
 * skin-on fillet" -> "salmon skin on fillet") can only match a product description that happens to
 * use that exact word sequence — which almost never occurs. Single-word names have no such barrier.
 * Computed from the built output every time, never hand-typed, so it cannot go stale.
 */
export function arityBias(kept, kws) {
  const tally = {};
  for (const r of kept) for (const s of r.slugs) tally[s] = (tally[s] || 0) + 1;
  const bucket = { single: [], multi: [] };
  for (const k of kws) (k.kw.split(' ').length === 1 ? bucket.single : bucket.multi).push(tally[k.slug] || 0);
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const mean = (a) => (a.length ? sum(a) / a.length : 0);
  const zero = (a) => a.filter((x) => x === 0).length;
  const total = sum(bucket.single) + sum(bucket.multi);
  const r2 = (n) => Math.round(n * 100) / 100;
  return {
    singleWordSlugs: bucket.single.length,
    multiWordSlugs: bucket.multi.length,
    meanTagsPerSingleWordSlug: r2(mean(bucket.single)),
    meanTagsPerMultiWordSlug: r2(mean(bucket.multi)),
    biasRatio: mean(bucket.multi) > 0 ? r2(mean(bucket.single) / mean(bucket.multi)) : null,
    pctOfTagsToSingleWord: total ? r2(sum(bucket.single) / total * 100) : null,
    zeroTagSingleWord: zero(bucket.single),
    zeroTagMultiWord: zero(bucket.multi),
  };
}

/**
 * A "recall count" is a count of NOTICES, and one outbreak can emit dozens. Measured on the live
 * file: 718 notices are only 315 events (median 1 notice, max 70), and a slug's total is routinely
 * one event — iceberg-lettuce's 5 notices are a single event, red-onion's 31 are 65% one event.
 * Ranking ingredients by notice count therefore ranks outbreak paperwork, not exposure. Computed
 * from the output on every build so the disclosure cannot drift from the data.
 */
export function eventConcentration(kept) {
  const perEvent = {}
  const perSlug = {}
  for (const r of kept) {
    perEvent[r.event_id] = (perEvent[r.event_id] || 0) + 1
    for (const s of r.slugs) {
      perSlug[s] = perSlug[s] || {}
      perSlug[s][r.event_id] = (perSlug[s][r.event_id] || 0) + 1
    }
  }
  const sizes = Object.values(perEvent).sort((a, b) => a - b)
  const worst = Object.entries(perSlug)
    .map(([slug, ev]) => {
      const v = Object.values(ev)
      const total = v.reduce((a, b) => a + b, 0)
      return { slug, notices: total, largestEvent: Math.max(...v) }
    })
    .filter((x) => x.notices >= 5)
    .sort((a, b) => b.largestEvent / b.notices - a.largestEvent / a.notices)
    .slice(0, 5)
    .map((x) => `${x.slug} (${x.largestEvent}/${x.notices})`)
  return {
    notices: kept.length,
    distinctEvents: sizes.length,
    medianNoticesPerEvent: sizes.length ? sizes[Math.floor(sizes.length / 2)] : null,
    maxNoticesPerEvent: sizes.length ? sizes[sizes.length - 1] : null,
    singleNoticeEvents: sizes.filter((x) => x === 1).length,
    mostConcentratedSlugs: worst,
    note: sizes.length
      ? `${kept.length} notices are only ${sizes.length} distinct events (median ${sizes[Math.floor(sizes.length / 2)]}, max ${sizes[sizes.length - 1]}). A slug's count is frequently ONE outbreak: ${worst.join(', ')}. Counting notices counts outbreak paperwork, not exposure.`
      : 'No rows to measure.',
  }
}

function assemble(rawResults, kws, fetchedAt) {
  const kept = [];
  for (const r of rawResults) {
    const rec = normalize(r);
    if (!isFreshCommodity(rec.product)) continue;      // drop finished/processed goods
    const slugs = matchSlugs(rec.product, kws);         // product only — never the allergen-laden reason
    if (slugs.length) kept.push({ ...rec, slugs });
  }
  const bias = arityBias(kept, kws);
  const events = eventConcentration(kept);
  return {
    _doc: 'openFDA Food Enforcement (recall) events for the Cost Index events lane (ADR-011), FILTERED to recalls whose product text mentions a tracked ingredient (slug-tagged). Each row is a DATED, DOCUMENTED recall, surfaced as CO-OCCURRENCE beside a price window — NEVER an asserted price cause, magnitude, or forecast. The slug tag is a whole-word text match on the product, not an inferred link. Source: openFDA (US FDA), public domain (CC0). Built by scripts/fetch-food-recalls.mjs --live on the operator Mac. READ coverageLimits BEFORE COMPARING SLUGS: this instrument is blind to whole categories, so a zero here is not a safety record.',
    source: `openFDA Food Enforcement — ${ENDPOINT}`,
    license: 'CC0-1.0 / public-domain-usgov',
    framing: 'co-occurrence, never cause',
    // An absence in this file is an INSTRUMENT LIMIT, not evidence of safety. Publishing a
    // cross-slug recall comparison without these caveats would assert a fact the source cannot
    // support. Surfaced 2026-07-31 when the discovery run's kill panel used recall counts to
    // compare withheld vs published ingredients and the comparison collapsed on this.
    coverageLimits: {
      jurisdiction: 'openFDA Food Enforcement covers FDA-regulated food only. Meat, poultry, and processed egg products are USDA/FSIS jurisdiction and are ABSENT from this endpoint entirely — verified: across the tracked panel, beef, pork, and every chicken slug have zero product-text mentions in the full result set. A zero recall count for those slugs is guaranteed by the source, not measured.',
      matching: 'Slug tags come from a whole-word text match on the product description. An ingredient named only in the reason field, spelled unusually, or referenced by a brand name is not tagged.',
      // MEASURED, not asserted — recomputed on every build from the output itself. The matcher
      // requires the whole display name verbatim, so a multi-word name can only match a product
      // description using that exact word sequence. It is the single largest distortion in this
      // file: a multi-word ingredient's zero usually means "unmatchable name", not "no recalls".
      nameArityBias: {
        ...bias,
        note: `Multi-word ingredient names are tagged ~${bias.biasRatio ?? '?'}x less often than single-word names (${bias.meanTagsPerMultiWordSlug} vs ${bias.meanTagsPerSingleWordSlug} tags per slug), and ${bias.zeroTagMultiWord} of ${bias.multiWordSlugs} multi-word slugs have zero tags versus ${bias.zeroTagSingleWord} of ${bias.singleWordSlugs} single-word slugs. This is a property of the MATCHER, not of food safety.`,
      },
      // MEASURED, not asserted — recomputed on every build. The second reason counts are not
      // comparable: a slug's total is frequently one outbreak's notice paperwork.
      eventConcentration: events,
      freshCommodityFilter: 'Finished and processed goods are dropped on purpose (isFreshCommodity), so this is a raw-commodity recall record, not total recall volume for an ingredient.',
      notComparable: 'Recall COUNTS are not comparable across slugs of different categories. Use within-slug over time, never slug-vs-slug as an exposure ranking.',
    },
    fetchedAt: fetchedAt || null,
    since: SINCE,
    fetched_total: rawResults.length,
    matched: kept.length,
    recalls: kept,
  };
}

// Synthetic fixture — NOT real recalls (F-DEMO numbers, Example firms). One mentions tracked
// ingredients (onion, cilantro), one is a finished good that matches nothing → dropped by the filter.
const DEMO = {
  results: [
    { recall_number: 'F-DEMO-0001', event_id: '00000', report_date: '20260115', recall_initiation_date: '20260110', classification: 'Class I', status: 'Ongoing', product_description: 'Fresh Cilantro and diced Onion tray, 12 oz', reason_for_recall: 'Illustrative demo reason — potential contamination; synthetic sample, not a real recall', recalling_firm: 'Example Produce Co.', distribution_pattern: 'MD, VA, DC', product_type: 'Food' },
    { recall_number: 'F-DEMO-0002', event_id: '00001', report_date: '20260203', recall_initiation_date: '20260130', classification: 'Class II', status: 'Completed', product_description: 'Brown Butter Chocolate Chunk Cookie Dough', reason_for_recall: 'Illustrative demo reason — mislabeling; synthetic sample', recalling_firm: 'Example Bakery Co.', distribution_pattern: 'Nationwide', product_type: 'Food' },
    { recall_number: 'F-DEMO-0003', event_id: '00002', report_date: '20260220', recall_initiation_date: '20260215', classification: 'Class III', status: 'Ongoing', product_description: 'Wise Sour Cream & Onion Potato Chips, 3.75 oz', reason_for_recall: 'Illustrative demo reason — undeclared allergen; synthetic sample', recalling_firm: 'Example Snack Co.', distribution_pattern: 'Nationwide', product_type: 'Food' },
  ],
};

function loadIsr() { return JSON.parse(fs.readFileSync(path.join(repo, ISR), 'utf8')); }

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const r = normalize(DEMO.results[0]);
  eq('report_date YYYYMMDD → YYYY-MM-DD', r.report_date, '2026-01-15');
  eq('FDA classification preserved verbatim', r.classification, 'Class I');
  eq('only factual recall keys', Object.keys(r).sort().join(','), ['classification', 'event_id', 'firm', 'initiated', 'product', 'product_type', 'reason', 'recall_number', 'report_date', 'states', 'status'].join(','));
  // matcher — whole-word/phrase, plural, STOPWORD guard
  const kws = [{ slug: 'onion', kw: 'onion' }, { slug: 'cilantro', kw: 'cilantro' }, { slug: 'butter-lettuce', kw: 'butter lettuce' }];
  eq('matches whole word', matchSlugs('Fresh Cilantro tray', kws), ['cilantro']);
  eq('matches simple plural', matchSlugs('Diced Onions 12 oz', kws), ['onion']);
  eq('no partial-word false positive', matchSlugs('Onionskin paper wrap', kws), []);
  eq('matches a two-word phrase', matchSlugs('Butter Lettuce clamshell', kws), ['butter-lettuce']);
  eq('generic word "butter" is stopworded out of ingredientKeywords', ingredientKeywords({ ingredients: [{ slug: 'butter', name: 'Butter (AA, bulk)' }] }).length, 0);
  // accent folding — the "jalape o" class of silent zero (regression, 2026-07-31)
  eq('accented display name folds to an ASCII keyword', ingredientKeywords({ ingredients: [{ slug: 'jalapeno', name: 'Jalapeño' }] })[0].kw, 'jalapeno');
  const jkw = [{ slug: 'jalapeno', kw: 'jalapeno' }];
  eq('un-accented product text matches', matchSlugs('Supreme Jalapenos Diced 7 OZ', jkw), ['jalapeno']);
  eq('accented product text matches the same keyword', matchSlugs('Fresh Jalapeño peppers, bulk', jkw), ['jalapeno']);
  eq('accent folding does not create a false positive', matchSlugs('Fresh Poblano peppers, bulk', jkw), []);
  eq('accented name survives the fresh-commodity gate', isFreshCommodity('Fresh Jalapeño peppers, bulk'), true);
  // coverage limits must ship with the data, or a zero reads as a safety record
  const cl = assemble([], [], null).coverageLimits;
  eq('coverageLimits present', typeof cl === 'object' && cl !== null, true);
  eq('discloses the USDA/FSIS jurisdiction gap', /FSIS/.test(cl.jurisdiction), true);
  eq('warns counts are not comparable across slugs', /not comparable/i.test(cl.notComparable), true);
  // arity bias — measured from the output, never hand-typed
  const bkw = [{ slug: 'one', kw: 'kale' }, { slug: 'two', kw: 'salmon skin on fillet' }];
  const bkept = [{ slugs: ['one'] }, { slugs: ['one'] }, { slugs: ['one', 'two'] }];
  const bias = arityBias(bkept, bkw);
  eq('counts single- vs multi-word slugs', [bias.singleWordSlugs, bias.multiWordSlugs], [1, 1]);
  eq('mean tags per single-word slug', bias.meanTagsPerSingleWordSlug, 3);
  eq('mean tags per multi-word slug', bias.meanTagsPerMultiWordSlug, 1);
  eq('bias ratio is single/multi', bias.biasRatio, 3);
  eq('share of tags to single-word', bias.pctOfTagsToSingleWord, 75);
  eq('zero-tag multi-word counted', arityBias([], bkw).zeroTagMultiWord, 1);
  eq('no divide-by-zero when nothing matched', arityBias([], bkw).biasRatio, null);
  eq('empty keyword set does not throw', arityBias([], []).pctOfTagsToSingleWord, null);
  eq('bias ships inside coverageLimits', typeof cl.nameArityBias === 'object' && /property of the MATCHER/.test(cl.nameArityBias.note), true);
  // event concentration — a slug's count is often one outbreak's paperwork
  const ec = eventConcentration([
    { event_id: 'E1', slugs: ['a'] }, { event_id: 'E1', slugs: ['a'] }, { event_id: 'E1', slugs: ['a'] },
    { event_id: 'E1', slugs: ['a'] }, { event_id: 'E1', slugs: ['a'] }, { event_id: 'E2', slugs: ['b'] },
  ]);
  eq('counts notices vs distinct events', [ec.notices, ec.distinctEvents], [6, 2]);
  eq('max notices in one event', ec.maxNoticesPerEvent, 5);
  eq('single-notice events counted', ec.singleNoticeEvents, 1);
  eq('names the most concentrated slug (>=5 notices)', ec.mostConcentratedSlugs[0], 'a (5/5)');
  eq('a slug under 5 notices is not ranked', ec.mostConcentratedSlugs.length, 1);
  eq('empty input does not throw', eventConcentration([]).distinctEvents, 0);
  eq('empty input yields a stated note, never a fake number', eventConcentration([]).note, 'No rows to measure.');
  eq('event concentration ships inside coverageLimits', typeof cl.eventConcentration === 'object', true);
  // fresh-commodity gate — the honesty filter that keeps raw-ingredient recalls, drops finished goods
  eq('fresh cue → kept', isFreshCommodity('Fresh Cilantro and diced Onion tray, 12 oz'), true);
  eq('short commodity name → kept', isFreshCommodity('Romaine Lettuce 10 oz'), true);
  eq('processed form (chips) → dropped even though it names onion', isFreshCommodity('Wise Sour Cream & Onion Potato Chips, 3.75 oz'), false);
  eq('long finished product with no fresh cue → dropped', isFreshCommodity('Chicken Fillet Deluxe Sandwich with Bacon and Cheese'), false);
  eq('prepared deli salad → dropped (salad is not a fresh cue)', isFreshCommodity('boichik bagels Whitefish Salad'), false);
  eq('short dessert name → dropped (cheesecake)', isFreshCommodity('Strawberry Cheesecake The Original'), false);
  eq('brand "Fresh …" burger → dropped (processed wins over the fresh cue)', isFreshCommodity('Fresh to You Burger with Bacon'), false);
  eq('frozen dessert (sherbert/sorbet) → dropped', [isFreshCommodity("Loard's Lime Sherbert 32 oz"), isFreshCommodity('Mango Sorbet')], [false, false]);
  const out = assemble(DEMO.results, kws, null);
  eq('filter keeps only the fresh cilantro/onion tray (drops cookie dough + onion chips)', out.matched, 1);
  eq('kept recall carries slug tags', out.recalls[0].slugs.sort().join(','), 'cilantro,onion');
  eq('framing is co-occurrence, never cause', out.framing, 'co-occurrence, never cause');
  eq('CC0 public domain', out.license, 'CC0-1.0 / public-domain-usgov');
  console.log(`fetch-food-recalls self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

async function live() {
  const kws = ingredientKeywords(loadIsr());
  const all = [];
  const LIMIT = 1000;
  for (let skip = 0; skip < 26000; skip += LIMIT) {
    const url = `${ENDPOINT}?search=report_date:[${SINCE}+TO+29991231]&limit=${LIMIT}&skip=${skip}&sort=report_date:desc`;
    let res;
    for (let attempt = 0; attempt < 4; attempt++) {
      try { res = await fetch(url); break; } catch (e) { if (attempt === 3) throw e; await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); }
    }
    if (res.status === 404) break; // openFDA 404s when skip runs past the result set
    if (!res.ok) throw new Error(`openFDA HTTP ${res.status} at skip=${skip}`);
    const json = await res.json();
    const results = (json && json.results) || [];
    all.push(...results);
    if (results.length < LIMIT) break;
  }
  const out = assemble(all, kws, new Date().toISOString());
  fs.writeFileSync(path.join(repo, OUT), JSON.stringify(out, null, 2) + '\n');
  console.log(`fetch-food-recalls: ${out.matched} of ${out.fetched_total} recalls since ${SINCE} mention a tracked ingredient → wrote ${OUT}.`);
}

/**
 * Offline PARTIAL repair. Re-runs slug matching over the rows already stored in
 * data/food-recalls.json, whose product text is preserved verbatim. Fixes rows that are in the
 * file but under-tagged (the jalapeño class of bug) without needing network or the operator Mac.
 *
 * PARTIAL, and the limit is structural: rows that matched NO slug at fetch time were never
 * written, so a recall that only ever mentioned jalapeños is not in the file and cannot be
 * recovered here. Only --live restores those. Reports both numbers so the gap stays visible.
 */
function retag() {
  const p = path.join(repo, OUT);
  const cur = JSON.parse(fs.readFileSync(p, 'utf8'));
  const kws = ingredientKeywords(loadIsr());
  let changed = 0;
  const added = {};
  const recalls = (cur.recalls || []).map((r) => {
    const next = matchSlugs(r.product, kws);
    const before = (r.slugs || []).slice().sort().join(',');
    const after = next.slice().sort().join(',');
    if (before !== after) {
      changed++;
      for (const s of next) if (!(r.slugs || []).includes(s)) added[s] = (added[s] || 0) + 1;
    }
    return { ...r, slugs: next };
  }).filter((r) => r.slugs.length);
  // assemble() gives the shell, but it is called with NO raw rows here (the rows are already
  // normalized), so its computed coverageLimits.nameArityBias would describe an empty set.
  // Recompute it from the rows we actually retagged, or the disclosure would publish all-zeros.
  const shell = assemble([], kws, cur.fetchedAt);
  const out = {
    ...shell,
    coverageLimits: {
      ...shell.coverageLimits,
      nameArityBias: { ...arityBias(recalls, kws), note: shell.coverageLimits.nameArityBias.note },
      eventConcentration: eventConcentration(recalls),
    },
    fetchedAt: cur.fetchedAt,
    since: cur.since,
    fetched_total: cur.fetched_total,
    matched: recalls.length,
    recalls,
  };
  // Rebuild the note against the real numbers (the shell's note was written from the empty set).
  const b = out.coverageLimits.nameArityBias;
  b.note = `Multi-word ingredient names are tagged ~${b.biasRatio ?? '?'}x less often than single-word names (${b.meanTagsPerMultiWordSlug} vs ${b.meanTagsPerSingleWordSlug} tags per slug), and ${b.zeroTagMultiWord} of ${b.multiWordSlugs} multi-word slugs have zero tags versus ${b.zeroTagSingleWord} of ${b.singleWordSlugs} single-word slugs. This is a property of the MATCHER, not of food safety.`;
  fs.writeFileSync(p, JSON.stringify(out, null, 2) + '\n');
  console.log(`fetch-food-recalls --retag: re-tagged ${cur.recalls.length} stored rows; ${changed} changed.`);
  console.log('  slugs gaining tags:', Object.keys(added).length ? JSON.stringify(added) : 'none');
  console.log('  NOTE: rows that matched nothing at fetch time were never stored and are NOT recoverable offline — run --live for those.');
}

if (process.argv.includes('--self-test')) { selfTest(); }
else if (process.argv.includes('--retag')) { retag(); }
else if (process.argv.includes('--live')) { live().catch((e) => { console.error('fetch-food-recalls --live failed:', e.message); process.exit(1); }); }
else {
  const kws = ingredientKeywords(loadIsr());
  const out = assemble(DEMO.results, kws, null);
  console.log(`DEMO (synthetic sample, no network) — ${out.matched} of ${out.fetched_total} fixture recalls mention a tracked ingredient:\n`);
  console.log(JSON.stringify(out, null, 2));
  console.log(`\nRun with --live on the operator Mac to fetch openFDA, filter, and write ${OUT}.`);
}
