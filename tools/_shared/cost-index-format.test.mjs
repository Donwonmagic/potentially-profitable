/**
 * Unit tests — tools/_shared/cost-index-format.js
 * Run:  node --test tools/_shared/cost-index-format.test.mjs
 *
 * Pins the operator-facing honesty rules of the phrasing helpers that were
 * untestable while they lived inside the cost-index-ui.js DOM IIFE.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const make = require('./cost-index-format.js');
const EN = make(false);
const ES = make(true);

test('sparkShape: <2 reads is silent; otherwise names direction; notes gaps; localizes', () => {
  assert.equal(EN.sparkShape([100]), '');
  assert.match(EN.sparkShape([100, 90, 120]), /rose over the period/);
  assert.match(EN.sparkShape([120, 110, 100]), /eased over the period/);
  assert.match(EN.sparkShape([100, 101]), /held about steady/);          // <4% change
  assert.match(EN.sparkShape([100, null, 130]), /some weeks missing/);    // honest gap note
  assert.match(ES.sparkShape([100, 90, 120]), /subió en el periodo/);
});

test('percentileLine: an honest COUNT (of its last N), never a smoothed percentile; needs >=8', () => {
  assert.equal(EN.percentileLine([1, 2, 3, 4, 5, 6, 7]), '');             // <8 reads → silent
  const top = EN.percentileLine([1, 2, 3, 4, 5, 6, 7, 8, 9]);            // today is the highest
  assert.match(top, /Higher than 8 of its last 8 weekly reads/);
  assert.match(top, /near the top of its recent range/);
  assert.doesNotMatch(top, /percentile/);                                // never implies a fitted curve
  const bottom = EN.percentileLine([9, 8, 7, 6, 5, 4, 3, 2, 1]);        // today is the lowest
  assert.match(bottom, /Higher than 0 of its last 8/);
  assert.match(bottom, /near the bottom/);
});

test('weekOverWeek: $-anchored, ~7d window, gap-safe, flat under 1%, null on bad input', () => {
  const r = EN.weekOverWeek([1000, 1100], ['2026-05-01', '2026-05-08'], 'lb');
  assert.match(r.text, /up \+10%/);
  assert.match(r.text, /\$1\.00 a lb/);                                  // anchors the % to a dollar
  // never bridges a >11-day gap into a "last week" claim:
  assert.equal(EN.weekOverWeek([1000, 1100], ['2026-04-01', '2026-05-08'], 'lb'), null);
  // flat when the step is under 1%:
  assert.match(EN.weekOverWeek([1000, 1000], ['2026-05-01', '2026-05-08'], 'lb').text, /About flat/);
  // dates must be 1:1 with values:
  assert.equal(EN.weekOverWeek([1000, 1100], ['2026-05-08'], 'lb'), null);
  assert.match(ES.weekOverWeek([1000, 1100], ['2026-05-01', '2026-05-08'], 'lb').text, /Frente a la semana pasada/);
});

test('flagVerb: thin data never says re-price; verdicts map to buy/hold/watch', () => {
  const struct = { verdict: 'structural', elevatedWeeks: 3 };
  assert.equal(EN.flagVerb(struct, 'medium').tone, 'reprice');
  assert.match(EN.flagVerb(struct, 'medium').verb, /Consider re-pricing/);
  assert.equal(EN.flagVerb(struct, 'low').tone, 'watch');                // thin → hedge, never reprice
  assert.equal(EN.flagVerb(struct, 'directional').tone, 'watch');
  assert.equal(EN.flagVerb({ verdict: 'spike' }, 'medium').tone, 'hold');
  assert.equal(EN.flagVerb({ verdict: 'easing' }, 'medium').tone, 'hold');
  assert.equal(EN.flagVerb({ verdict: 'emerging' }, 'medium').tone, 'watch');
  assert.equal(EN.flagVerb(null, 'medium'), null);
  assert.equal(ES.flagVerb(struct, 'medium').verb, 'Considera ajustar el precio');
});
