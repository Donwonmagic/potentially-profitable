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

test('vsLastYear: ~year-back, $-anchored, "double/half" flourish, gap-safe, dormant otherwise', () => {
  const dbl = EN.vsLastYear([500, 1000], ['2025-05-08', '2026-05-08'], 'dozen');
  assert.match(dbl.text, /Vs last year: up \+100% \(about double\)/);
  assert.match(dbl.text, /\$5\.00 a dozen/);
  const half = EN.vsLastYear([1000, 500], ['2025-05-08', '2026-05-08'], 'dozen');
  assert.match(half.text, /down −50% \(about half\)/);
  // only ~a year back counts — a 200-day-old prior read is not "last year":
  assert.equal(EN.vsLastYear([500, 1000], ['2025-10-20', '2026-05-08'], 'dozen'), null);
  // ~flat within 3%:
  assert.match(EN.vsLastYear([1000, 1010], ['2025-05-08', '2026-05-08'], 'dozen').text, /About the same as a year ago/);
  // dormant until a year of history exists (weekly series spanning weeks, not a year):
  assert.equal(EN.vsLastYear([100, 110, 120], ['2026-05-01', '2026-05-08', '2026-05-15'], 'lb'), null);
  assert.match(ES.vsLastYear([500, 1000], ['2025-05-08', '2026-05-08'], 'dozen').text, /Frente al año pasado/);
});

test('heartbeat: calm local "you last checked {when}"; silent on first/same-day; no urgency', () => {
  const DAY = 86400000;
  const now = Date.parse('2026-06-08T12:00:00Z');
  assert.equal(EN.heartbeat(null, now), null);                       // first visit → silent
  assert.equal(EN.heartbeat(now - DAY / 2, now), null);              // same day → no nag
  assert.match(EN.heartbeat(now - DAY, now), /You last checked these prices yesterday\./);
  assert.match(EN.heartbeat(now - 3 * DAY, now), /3 days ago/);
  assert.match(EN.heartbeat(now - 9 * DAY, now), /about a week ago/);
  assert.match(EN.heartbeat(now - 21 * DAY, now), /3 weeks ago/);
  assert.match(ES.heartbeat(now - DAY, now), /Revisaste estos precios por última vez ayer\./);
  // no streaks / counts / urgency words ever:
  assert.doesNotMatch(EN.heartbeat(now - 5 * DAY, now), /streak|don't miss|hurry|act now|\d+ in a row/i);
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
