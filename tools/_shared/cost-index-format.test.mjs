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

// then-vs-now — the owner-Δ% vs market-Δ% comparison. Market HISTORY series (used
// only to find the "then" read); the market "now" endpoint is the live level + its
// generatedAt date, passed in opts so the window END is always a fresh read.
const MKT = [1000, 1020, 1040, 1100, 1120, 1130];                      // history (6 reads → not thin), cents
const MKT_DATES = ['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-05-15'];
// Standard opts: live level 1150 @ 2026-06-01, "today" the same week, firm confidence.
const O = (over) => Object.assign({ marketNowCents: 1150, marketNowDate: '2026-06-01',
  nowDateStr: '2026-06-02', confidence: 'high' }, over);

test('thenVsNow: owner outpaced the market → dollar-led "over" verdict, names the real window', () => {
  // owner 1000→1300 (+30%); market 2026-01 (1000) → live 1150 (+15%)
  const r = EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2026-01-01' }));
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.ownerPct - 0.30) < 1e-9);
  assert.ok(Math.abs(r.marketPct - 0.15) < 1e-9);
  assert.equal(r.marketThenDate, '2026-01-01');
  assert.equal(r.marketNowDate, '2026-06-01');                         // live date, not series tail
  // excess = 1300 − 1000*(1150/1000) = 1300 − 1150 = 150¢ beyond the market's move
  assert.ok(Math.abs(r.excessCents - 150) < 1e-6);
  const say = EN.thenVsNowSay(r, 'case');
  assert.equal(say.tone, 'over');
  assert.match(say.headline, /\$1\.50 a case beyond the market/);      // the repeatable number
  assert.doesNotMatch(say.headline, /percentage points|points/);       // jargon dropped
});

test('thenVsNow: owner tracked the market → "match" reframed as confirmation, no false alarm', () => {
  const r = EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1150, thenDateStr: '2026-01-01' }));
  const say = EN.thenVsNowSay(r, 'case');
  assert.equal(say.tone, 'match');
  assert.match(say.headline, /Confirmed/);
});

test('thenVsNow: owner beat the market → "under" tone', () => {
  const r = EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1000, thenDateStr: '2026-01-01' }));
  assert.equal(EN.thenVsNowSay(r, 'case').tone, 'under');
});

test('thenVsNow: percent comparison is unit/basis robust (index series gives same verdict)', () => {
  const idx = [100, 102, 104, 110, 112, 113];                         // same shape, index scale (6 reads)
  const r = EN.thenVsNow(idx, MKT_DATES, O({ marketNowCents: 115, thenCents: 1000, nowCents: 1300, thenDateStr: '2026-01-01' }));
  assert.ok(Math.abs(r.marketPct - 0.15) < 1e-9);                      // index movement == price movement
  assert.equal(EN.thenVsNowSay(r, 'case').tone, 'over');
});

// ── audit BLOCKER 2 — thin evidence must hedge, never accuse ──────────────────
test('thenVsNow: a 2-read series or directional confidence → "watch", not a verdict', () => {
  const thin = EN.thenVsNow([1000, 1120], ['2026-01-01', '2026-05-01'],
    O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2026-01-01' }));
  assert.equal(thin.thin, true);                                       // <6 reads
  assert.equal(EN.thenVsNowSay(thin, 'case').tone, 'watch');
  const dir = EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2026-01-01', confidence: 'directional' }));
  assert.equal(EN.thenVsNowSay(dir, 'case').tone, 'watch');
});

// ── audit BLOCKER 1 — stale live read carries a caveat ───────────────────────
test('thenVsNow: a stale live read (now far from today) appends a staleness caveat', () => {
  const r = EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2026-01-01', nowDateStr: '2026-09-01' }));
  assert.ok(r.nowGapDays > 14);
  assert.match(EN.thenVsNowSay(r, 'case').note, /days old/);
});

test('thenVsNow: refuses a date before the series, hands back the covered window', () => {
  const r = EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2024-01-01' }));
  assert.equal(r.reason, 'outofrange');
  assert.match(EN.thenVsNowSay(r, 'case').headline, /2026-01-01 to 2026-05-15/);   // earliest→latest series date
});

// ── audit HIGH 3 — future date is rejected strictly (no +1-day slack) ─────────
test('thenVsNow: future date rejected; same-as-live date leaves no window', () => {
  assert.equal(EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2027-01-01' })).reason, 'future');
  assert.equal(EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2026-06-01' })).reason, 'future'); // == live date
  // a "then" date whose nearest read sits <14 days before the live read → no window
  assert.equal(EN.thenVsNow([1000, 1145], ['2026-01-01', '2026-05-25'],
    O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2026-05-25' })).reason, 'tooclose');
});

// ── audit MEDIUM 5 — absurd ratios rejected, not printed as fact ──────────────
test('thenVsNow: a fat-fingered cent value is rejected, not reported as +9,999,900%', () => {
  assert.equal(EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1, nowCents: 100000, thenDateStr: '2026-01-01' })).reason, 'price');
});

// ── audit MEDIUM 6 — strict ISO; locale date strings rejected ─────────────────
test('thenVsNow: non-ISO/locale date strings are rejected (UTC-consistent parsing)', () => {
  assert.equal(EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '01/15/2026' })).reason, 'date');
  assert.equal(EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: 'not-a-date' })).reason, 'date');
});

// ── audit MEDIUM 7 — equidistant tie-break pinned (keeps the EARLIER read) ─────
test('thenVsNow: an exactly-midway date deterministically matches the earlier read', () => {
  // 2026-01-16 is 15 days from Jan 1, 16 from Feb 1 → nearer Jan 1; the tie-break
  // keeps the earlier read on a true tie. Pin the selection so a refactor can't drift it.
  const r = EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2026-01-16' }));
  assert.equal(r.marketThenDate, '2026-01-01');
});

test('thenVsNow: incomplete input is silent (null)', () => {
  assert.equal(EN.thenVsNowSay(EN.thenVsNow(MKT, MKT_DATES, O({ thenCents: 0, nowCents: 1300, thenDateStr: '2026-01-01' })), 'case'), null);
});

test('thenVsNow: ES localizes the verdict', () => {
  const r = ES.thenVsNow(MKT, MKT_DATES, O({ thenCents: 1000, nowCents: 1300, thenDateStr: '2026-01-01' }));
  assert.match(ES.thenVsNowSay(r, 'caja').headline, /más allá del movimiento del mercado/);
});
