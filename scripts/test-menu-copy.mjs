#!/usr/bin/env node
// Menu Copy Inspector — rules-engine regression tests.
// Run via: `node scripts/test-menu-copy.mjs`
//
// Three categories of assertion (mirrors test-menu-engineering.mjs):
//
// 1. Lexicon math: for each rule family, hand-crafted descriptions
//    with known-correct expected scores.
// 2. Aggregate verdicts: the polish / edit / rewrite call across
//    canonical fixtures (over-hedged, all-signal, too-short, too-long).
// 3. Privacy / bucket purity: every bucket helper returns values only
//    from its enumerated allow-list, swept across full input ranges
//    + poison-string inputs.
//
// Exits non-zero on failure.

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const M = require('../tools/menu-copy/menu-copy.js');

let failures = 0;
function assertEq(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + label +
              (ok ? '' : '  (expected ' + JSON.stringify(expected) +
                        ', got ' + JSON.stringify(actual) + ')'));
  if (!ok) failures++;
}
function assert(label, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + label);
  if (!cond) failures++;
}

// ------------------------------------------------------------
// Tokenisation helpers
// ------------------------------------------------------------
assertEq('wordCount empty',     M.wordCount(''), 0);
assertEq('wordCount short',     M.wordCount('Pasta.'), 1);
assertEq('wordCount typical',   M.wordCount('Tonnarelli with smoky pecorino and pepper.'), 6);
assertEq('wordCount with punctuation', M.wordCount('A, B, C — and D.'), 5);
assertEq('wordCount em-dash skipped',  M.wordCount('foo — bar'), 2);

assertEq('normalizeWord trim punct', M.normalizeWord('Smoky,'), 'smoky');
assertEq('normalizeWord trailing dot', M.normalizeWord('oil.'), 'oil');
assertEq('normalizeWord paren', M.normalizeWord('(brined)'), 'brined');

// ------------------------------------------------------------
// Sensory scorer
// ------------------------------------------------------------
{
  const r = M.scoreSensory('Smoky pecorino with crispy edges and a piping-hot finish.');
  assert('sensory finds smoky', r.hits.some(h => h.word === 'smoky' && h.category === 'flavor'));
  assert('sensory finds crispy', r.hits.some(h => h.word === 'crispy'));
  assert('sensory >= 2 categories', r.categoriesUsed >= 2);
}
{
  const r = M.scoreSensory('Pasta.');
  assertEq('sensory empty count', r.count, 0);
  assertEq('sensory empty cats',  r.categoriesUsed, 0);
}
{
  // Sensory dedupes across categories — a word fires in exactly one.
  const r = M.scoreSensory('Smoky smoky smoky pecorino');
  assertEq('sensory dedupes same word', r.count, 1);
}
{
  // Multi-word entry "al dente" matches as a phrase.
  const r = M.scoreSensory('Tonnarelli al dente with cracked pepper.');
  assert('sensory finds "al dente"', r.hits.some(h => h.word === 'al dente'));
}

// ------------------------------------------------------------
// Provenance scorer
// ------------------------------------------------------------
{
  const r = M.scoreProvenance('House-made guanciale from Cream Line Dairy, dry-aged 48 hours.');
  assert('provenance "house-made" keyword', r.hits.some(h => h.kind === 'keyword' && h.word === 'house-made'));
  assert('provenance numeric "48 hours"',   r.hits.some(h => h.kind === 'numeric'));
  assert('provenance capitalized name',     r.hits.some(h => h.kind === 'capitalized'));
  assert('provenance count >= 3',           r.count >= 3);
}
{
  const r = M.scoreProvenance('Bolognese over rigatoni.');
  assertEq('provenance empty count', r.count, 0);
}
{
  const r = M.scoreProvenance('Branzino from the Adriatic, salt-baked whole.');
  assert('provenance Adriatic region', r.hits.some(h => h.kind === 'region' && h.word === 'adriatic'));
}
{
  // Two-word capitalised phrases match.
  const r = M.scoreProvenance('Eggs from Cream Line Dairy with smoked sea salt.');
  assert('provenance Cream Line Dairy proper noun', r.hits.some(h => h.kind === 'capitalized' && /Cream Line/.test(h.word)));
}

// ------------------------------------------------------------
// Technique scorer
// ------------------------------------------------------------
{
  const r = M.scoreTechnique('Wood-fired branzino with charred lemon and smoked sea salt.');
  assert('technique wood-fired', r.hits.some(h => /wood-fired|fire/i.test(h)));
  assert('technique charred',    r.hits.some(h => /charred|char/i.test(h)));
  assert('technique smoked',     r.hits.some(h => /smoked|smok/i.test(h)));
}
{
  const r = M.scoreTechnique('Caesar salad.');
  assertEq('technique empty', r.count, 0);
}

// ------------------------------------------------------------
// Length scorer
// ------------------------------------------------------------
{
  assertEq('length 1 word → short',          M.scoreLength('Pasta.').verdict, 'short');
  assertEq('length 7 words → short-edge',    M.scoreLength('Pasta with smoky pecorino and pepper.').verdict, 'short-edge');
  assertEq('length 12 words → in-range',     M.scoreLength('Tonnarelli with smoky pecorino, cracked pepper, and a finishing crack of oil.').verdict, 'in-range');
  assertEq('length 18 words → long-edge',    M.scoreLength('Tonnarelli with deeply smoky pecorino, cracked pepper, and a finishing crack of Tuscan olive oil — beautiful.').verdict, 'long-edge');
  // 30+ words → long
  const longText = 'Tonnarelli with smoky pecorino and cracked pepper served over a bed of charred radicchio with shaved fennel and pickled shallots and a drizzle of aged balsamic from Modena and finished with sea salt.';
  assertEq('length 30+ words → long', M.scoreLength(longText).verdict, 'long');
}
{
  // Fine-dining tier shifts the range.
  const r = M.scoreLength('Tonnarelli with smoky pecorino, cracked pepper, finishing oil.', 'fineDining');
  // 8 words is below fine-dining minimum (12), so short.
  assert('fine-dining 8 words is short', r.verdict === 'short' || r.verdict === 'short-edge');
}

// ------------------------------------------------------------
// Hedge scorer
// ------------------------------------------------------------
{
  const r = M.scoreHedges('Our nice fresh delicious house salad — just simply amazing.');
  assert('hedges count >= 6', r.count >= 6);
  assert('hedge "just" flagged',   r.hits.some(h => h.word === 'just'));
  assert('hedge "fresh" flagged',  r.hits.some(h => h.word === 'fresh'));
  assert('every hedge has a reason', r.hits.every(h => typeof h.reason === 'string' && h.reason.length > 0));
}
{
  const r = M.scoreHedges('Tonnarelli with smoky pecorino.');
  assertEq('hedge-free count', r.count, 0);
}
{
  // Hedges dedupe within an item.
  const r = M.scoreHedges('Just just just simply.');
  assertEq('hedges dedupe', r.count, 2);
}

// ------------------------------------------------------------
// Pricing scorer
// ------------------------------------------------------------
{
  const r = M.scorePricing('$24');
  assertEq('price has dollar sign', r.dollarSign, true);
  assertEq('price decimals 0',      r.decimals, 0);
  assert('price reads as confident', r.signals.some(s => /confident|fine-dining/i.test(s)));
}
{
  const r = M.scorePricing('19.95');
  assertEq('charm price detected', r.charm, true);
  assertEq('charm no dollar sign', r.dollarSign, false);
}
{
  const r = M.scorePricing('$24.00');
  assertEq('trailing zeros detected', r.trailingZeros, true);
}
{
  const r = M.scorePricing('');
  assertEq('empty price hasPrice false', r.hasPrice, false);
}
{
  const r = M.scorePricing('not a price');
  assertEq('non-numeric price hasPrice false', r.hasPrice, false);
}

// ------------------------------------------------------------
// Aggregate verdict — canonical fixtures
// ------------------------------------------------------------

// "Polish" — all signals present, in-range length, no hedges.
{
  const r = M.scoreItem({
    name: 'Tonnarelli',
    price: '$24',
    description: 'Hand-rolled tonnarelli with smoky pecorino, cracked pepper, and aged Tuscan olive oil.'
  });
  assertEq('polish fixture verdict', r.verdict, 'polish');
  assert('polish score >= 65', r.score >= 65);
}

// "Rewrite" — over-hedged, no signals.
{
  const r = M.scoreItem({
    name: 'Salad',
    price: '$12.99',
    description: 'Our nice fresh delicious house salad — just simply amazing.'
  });
  assertEq('rewrite fixture verdict', r.verdict, 'rewrite');
  assert('rewrite score <= 40', r.score <= 40);
}

// "Edit" — middle ground.
{
  const r = M.scoreItem({
    name: 'Pasta',
    price: '$22',
    description: 'Bolognese over fresh rigatoni with parmesan.'
  });
  assert('edit fixture is edit or rewrite',
         r.verdict === 'edit' || r.verdict === 'rewrite');
}

// Single-color "Pasta." → rewrite (length).
{
  const r = M.scoreItem({ name: 'Pasta', price: '$22', description: 'Pasta.' });
  assertEq('one-word verdict', r.verdict, 'rewrite');
}

// VERDICTS enum stability
assertEq('VERDICTS exposes 3', M.VERDICTS, ['polish', 'edit', 'rewrite']);

// ------------------------------------------------------------
// Action ladder — produces context-appropriate moves
// ------------------------------------------------------------
{
  const scored = M.scoreItem({
    name: 'Salad',
    price: '$12',
    description: 'Our nice fresh house salad.'
  });
  const moves = M.actionLadder(scored);
  assert('action ladder suggests cutting hedges', moves.some(m => /hedge/i.test(m.headline)));
  assert('action ladder suggests sensory adj',  moves.some(m => /sensory/i.test(m.headline)));
  assert('every move has lift + headline + detail',
         moves.every(m => m.lift && m.headline && m.detail));
}

// scoreMenu summary
{
  const items = [
    { name: 'A', description: 'Pasta.', price: '$10' },                                  // rewrite
    { name: 'B', description: 'Hand-rolled tonnarelli with smoky pecorino and cracked pepper.', price: '$22' }, // polish
    { name: 'C', description: 'Our nice fresh delicious salad.', price: '$8' }            // rewrite
  ];
  const r = M.scoreMenu(items);
  assertEq('scoreMenu count', r.summary.itemCount, 3);
  assertEq('scoreMenu rewriteCount', r.summary.rewriteCount, 2);
  assert('avgWordCount > 0', r.summary.avgWordCount > 0);
}

// ------------------------------------------------------------
// Privacy-critical bucket helpers — enum purity + poison test
// ------------------------------------------------------------
{
  const seen = new Set();
  for (let n = 0; n <= 30; n++) seen.add(M.bucketItemCount(n));
  for (const v of seen) {
    if (!M.ITEM_COUNT_BUCKETS.includes(v)) {
      console.log('FAIL  bucketItemCount non-enum: ' + JSON.stringify(v));
      failures++;
    }
  }
  console.log('PASS  bucketItemCount sweep (' + seen.size + ' unique, all in enum)');
}
assertEq('itemCount 0  → 1',     M.bucketItemCount(0),  '1');
assertEq('itemCount 1  → 1',     M.bucketItemCount(1),  '1');
assertEq('itemCount 3  → 2-5',   M.bucketItemCount(3),  '2-5');
assertEq('itemCount 5  → 2-5',   M.bucketItemCount(5),  '2-5');
assertEq('itemCount 6  → 6-15',  M.bucketItemCount(6),  '6-15');
assertEq('itemCount 15 → 6-15',  M.bucketItemCount(15), '6-15');
assertEq('itemCount 16 → gt-15', M.bucketItemCount(16), 'gt-15');

{
  const seen = new Set();
  for (let n = 0; n <= 40; n++) seen.add(M.bucketAvgWordCount(n));
  for (const v of seen) {
    if (!M.AVG_WORD_BUCKETS.includes(v)) {
      console.log('FAIL  bucketAvgWordCount non-enum: ' + JSON.stringify(v));
      failures++;
    }
  }
  console.log('PASS  bucketAvgWordCount sweep (' + seen.size + ' unique, all in enum)');
}
assertEq('avg 5.5  → lt-6', M.bucketAvgWordCount(5.5), 'lt-6');
assertEq('avg 8    → 6-12', M.bucketAvgWordCount(8),    '6-12');
assertEq('avg 14   → 12-20', M.bucketAvgWordCount(14),  '12-20');
assertEq('avg 25   → gt-20', M.bucketAvgWordCount(25),  'gt-20');

assertEq('rewriteRatio 0/10 → none',     M.bucketRewriteRatio(10, 0),  'none');
assertEq('rewriteRatio 0/0  → none',     M.bucketRewriteRatio(0, 0),   'none');
assertEq('rewriteRatio 1/20 → lt-25',    M.bucketRewriteRatio(20, 1),  'lt-25pct');
assertEq('rewriteRatio 6/20 → 25-50',    M.bucketRewriteRatio(20, 6),  '25-50pct');
assertEq('rewriteRatio 12/20 → gt-50',   M.bucketRewriteRatio(20, 12), 'gt-50pct');

// Poison-string tests
{
  const poison = 'SECRET_DISH_NAME';
  assert('no SECRET leak from bucketItemCount',
         ('' + M.bucketItemCount(poison)).indexOf('SECRET') === -1);
  assert('no SECRET leak from bucketAvgWordCount',
         ('' + M.bucketAvgWordCount(poison)).indexOf('SECRET') === -1);
  assert('no SECRET leak from bucketRewriteRatio',
         ('' + M.bucketRewriteRatio(poison, poison)).indexOf('SECRET') === -1);
}

// ------------------------------------------------------------
// Summary
// ------------------------------------------------------------
if (failures > 0) {
  console.error('\n' + failures + ' test(s) failed');
  process.exit(1);
}
console.log('\nAll tests passed.');
