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

// Derive one match phrase per ingredient from its display name (drop parentheticals + non-letters).
function ingredientKeywords(isr) {
  return (isr.ingredients || isr || []).map((r) => {
    const kw = String(r.name || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
    return { slug: r.slug, kw };
  }).filter((x) => x.slug && x.kw && x.kw.length >= 3 && !STOPWORDS.has(x.kw));
}

// Whole-word / whole-phrase match (+ a naive plural) of an ingredient phrase in the product text.
// Returns the matched slugs; a recall with none is dropped (not relevant to a tracked ingredient).
function matchSlugs(product, kws) {
  const p = ' ' + String(product || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const hits = [];
  for (const { slug, kw } of kws) if (p.includes(' ' + kw + ' ') || p.includes(' ' + kw + 's ')) hits.push(slug);
  return hits;
}

function assemble(rawResults, kws, fetchedAt) {
  const kept = [];
  for (const r of rawResults) {
    const rec = normalize(r);
    const slugs = matchSlugs(rec.product + ' ' + rec.reason, kws);
    if (slugs.length) kept.push({ ...rec, slugs });
  }
  return {
    _doc: 'openFDA Food Enforcement (recall) events for the Cost Index events lane (ADR-011), FILTERED to recalls whose product text mentions a tracked ingredient (slug-tagged). Each row is a DATED, DOCUMENTED recall, surfaced as CO-OCCURRENCE beside a price window — NEVER an asserted price cause, magnitude, or forecast. The slug tag is a whole-word text match on the product, not an inferred link. Source: openFDA (US FDA), public domain (CC0). Built by scripts/fetch-food-recalls.mjs --live on the operator Mac.',
    source: `openFDA Food Enforcement — ${ENDPOINT}`,
    license: 'CC0-1.0 / public-domain-usgov',
    framing: 'co-occurrence, never cause',
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
    { recall_number: 'F-DEMO-0001', event_id: '00000', report_date: '20260115', recall_initiation_date: '20260110', classification: 'Class I', status: 'Ongoing', product_description: 'Fresh Cilantro and diced Onion tray, 12 oz (synthetic demo item)', reason_for_recall: 'Illustrative demo reason — potential contamination; synthetic sample, not a real recall', recalling_firm: 'Example Produce Co.', distribution_pattern: 'MD, VA, DC', product_type: 'Food' },
    { recall_number: 'F-DEMO-0002', event_id: '00001', report_date: '20260203', recall_initiation_date: '20260130', classification: 'Class II', status: 'Completed', product_description: 'Brown Butter Chocolate Chunk Cookie Dough (synthetic demo item)', reason_for_recall: 'Illustrative demo reason — mislabeling; synthetic sample', recalling_firm: 'Example Bakery Co.', distribution_pattern: 'Nationwide', product_type: 'Food' },
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
  const out = assemble(DEMO.results, kws, null);
  eq('filter drops the cookie-dough (no tracked ingredient)', out.matched, 1);
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

if (process.argv.includes('--self-test')) { selfTest(); }
else if (process.argv.includes('--live')) { live().catch((e) => { console.error('fetch-food-recalls --live failed:', e.message); process.exit(1); }); }
else {
  const kws = ingredientKeywords(loadIsr());
  const out = assemble(DEMO.results, kws, null);
  console.log(`DEMO (synthetic sample, no network) — ${out.matched} of ${out.fetched_total} fixture recalls mention a tracked ingredient:\n`);
  console.log(JSON.stringify(out, null, 2));
  console.log(`\nRun with --live on the operator Mac to fetch openFDA, filter, and write ${OUT}.`);
}
