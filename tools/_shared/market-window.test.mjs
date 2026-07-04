/**
 * Pins the market-window math for Vendor Benchmark Layer 2: the operator's
 * %-change across dated purchases, delegation of the own-history verdict to
 * Bench, and the honest Cost Index market-window comparison.
 *
 *   node --test tools/_shared/market-window.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const MW = require('./market-window.js');
const Bench = require('./bench-lookup.js');

// A tiny synthetic Cost Index seed + deep-history global, so the market math is
// pinned without depending on the shipped (and evolving) data seed.
const SEED = {
  status: 'live',
  generatedAt: '2026-06-20',
  ingredients: [
    {
      key: 'widget',
      label_en: 'Widget', label_es: 'Widget',
      unit_en: 'lb', unit_es: 'libra',
      assessment: {
        asOf: '2026-06-18',
        confidence: 'medium',
        level: { basis: 'wholesale', medianCents: 1000, rangeCents: [900, 1100] },
        history: [
          { date: '2026-03-01', valueCents: 1000, source: 'usda-lmr', basis: 'wholesale' },
          { date: '2026-04-01', valueCents: 1020, source: 'usda-lmr', basis: 'wholesale' },
          { date: '2026-05-01', valueCents: 1030, source: 'usda-lmr', basis: 'wholesale' },
          { date: '2026-06-01', valueCents: 1050, source: 'usda-lmr', basis: 'wholesale' }
        ]
      }
    },
    {
      key: 'thinstuff',
      label_en: 'Thinstuff', label_es: 'Thinstuff',
      unit_en: 'lb', unit_es: 'libra',
      assessment: {
        asOf: '2026-06-18',
        confidence: 'low',
        level: { basis: 'wholesale', medianCents: 500 },
        history: [
          { date: '2026-03-01', valueCents: 500, source: 'usda-ams', basis: 'wholesale' },
          { date: '2026-06-01', valueCents: 520, source: 'usda-ams', basis: 'wholesale' }
        ]
      }
    }
  ]
};
// Deep weekly history for widget: dense enough that thenVsNow is NOT thin.
const DEEP = {
  widget: (function () {
    const rows = [];
    // 30 weekly points from 2026-01-01, market drifting +5% total.
    let d = Date.UTC(2026, 0, 1);
    for (let i = 0; i < 30; i++) {
      const iso = new Date(d).toISOString().slice(0, 10);
      rows.push([iso, Math.round(1000 * (1 + 0.05 * (i / 29)))]);
      d += 7 * 86400000;
    }
    return rows;
  })()
};

test('your %-change is first->last across dated purchases', () => {
  const r = MW.compute({
    item: 'mystery',
    purchases: [
      { cents: 1000, date: '2026-01-01', unit: 'lb' },
      { cents: 1100, date: '2026-03-01', unit: 'lb' },
      { cents: 1250, date: '2026-06-01', unit: 'lb' }
    ]
  });
  assert.equal(Math.round(r.yourChangePct * 1000), 250); // (1250-1000)/1000 = 0.25
  assert.equal(r.firstCents, 1000);
  assert.equal(r.lastCents, 1250);
  assert.equal(r.spanDays, MW.parseISODay('2026-06-01') === null ? null : 151);
});

test('purchases are sorted before the window is measured (out-of-order input)', () => {
  const r = MW.compute({
    item: 'mystery',
    purchases: [
      { cents: 1250, date: '2026-06-01', unit: 'lb' },
      { cents: 1000, date: '2026-01-01', unit: 'lb' }
    ]
  });
  assert.equal(r.firstDate, '2026-01-01');
  assert.equal(r.lastDate, '2026-06-01');
  assert.ok(r.yourChangePct > 0);
});

test('own-history verdict is delegated to Bench (parity, never re-derived)', () => {
  const purchases = [
    { cents: 2000, date: '2026-01-01', unit: 'lb' },
    { cents: 2600, date: '2026-06-01', unit: 'lb' }
  ];
  const obs = purchases.map((p) => ({ cents: p.cents, ts: MW.dayToTs(p.date), unit: p.unit }));
  const r = MW.compute({ item: 'x', purchases });
  assert.equal(r.tier, Bench.assess({ item: 'x', observations: obs }).tier);
  assert.equal(r.tier, 'hike'); // +30% and +$6 clears the 8%/$5 co-gate
});

test('market window: measured item returns an honest above/at/below verdict', () => {
  // Operator pays +25% over a window where the market only drifts ~+5%.
  const r = MW.compute({
    item: 'widget',
    purchases: [
      { cents: 1000, date: '2026-01-08', unit: 'lb' },
      { cents: 1250, date: '2026-06-01', unit: 'lb' }
    ],
    seed: SEED, deep: DEEP
  });
  assert.equal(r.market.available, true);
  assert.equal(r.market.key, 'widget');
  assert.equal(r.market.res.ok, true);
  assert.equal(r.market.res.thin, false, 'deep history is dense enough to not be thin');
  assert.ok(r.market.res.ownerPct > r.market.res.marketPct);
  assert.equal(r.market.say.tone, 'over'); // your rate outran the market's
});

test('market window: thin/short series withholds the verdict (honest hedge)', () => {
  // "thinstuff" has confidence:low and only 2 reads -> thenVsNow marks it thin.
  const r = MW.compute({
    item: 'thinstuff',
    purchases: [
      { cents: 500, date: '2026-03-01', unit: 'lb' },
      { cents: 700, date: '2026-06-01', unit: 'lb' }
    ],
    seed: SEED, deep: {}
  });
  assert.equal(r.market.available, true);
  assert.equal(r.market.res.thin, true);
  assert.equal(r.market.say.tone, 'watch'); // not a verdict
});

test('market window: no Cost Index match returns a stable not-available shape', () => {
  const r = MW.compute({
    item: 'zzzzz-unknown-item',
    purchases: [
      { cents: 100, date: '2026-01-01', unit: 'lb' },
      { cents: 200, date: '2026-06-01', unit: 'lb' }
    ],
    seed: SEED, deep: {}
  });
  assert.equal(r.market.available, false);
  assert.equal(r.market.reason, 'no-match');
});

test('market window: two dates too close together refuses (soft, not a verdict)', () => {
  const r = MW.compute({
    item: 'widget',
    purchases: [
      { cents: 1000, date: '2026-05-25', unit: 'lb' },
      { cents: 1050, date: '2026-05-30', unit: 'lb' } // 5-day span < 14
    ],
    seed: SEED, deep: DEEP
  });
  assert.equal(r.market.res.ok, false);
  assert.equal(r.market.res.reason, 'tooclose');
});

test('legs expose per-purchase cumulative change for the chart', () => {
  const r = MW.compute({
    item: 'widget',
    purchases: [
      { cents: 1000, date: '2026-01-08', unit: 'lb' },
      { cents: 1120, date: '2026-03-15', unit: 'lb' },
      { cents: 1250, date: '2026-06-01', unit: 'lb' }
    ],
    seed: SEED, deep: DEEP
  });
  assert.equal(r.market.legs.length, 3);
  assert.equal(r.market.legs[0].yourCumPct, 0);
  assert.equal(Math.round(r.market.legs[2].yourCumPct * 100), 25);
  assert.ok(r.market.legs[2].marketCents > 0);
});

test('seriesForKey prefers deep history when present', () => {
  const s = MW.seriesForKey('widget', { seed: SEED, deep: DEEP });
  assert.equal(s.kind, 'deep');
  assert.ok(s.values.length >= 30);
});

test('seriesForKey falls back to assessment.history when no deep series', () => {
  const s = MW.seriesForKey('widget', { seed: SEED, deep: {} });
  assert.equal(s.kind, 'short');
  assert.equal(s.values.length, 4);
});

test('degrades to a stable shape on empty input, never throws', () => {
  assert.equal(MW.compute({}).tier, 'insufficient');
  assert.equal(MW.compute({}).market.available, false);
  assert.equal(MW.compute({ purchases: [] }).observationCount, 0);
});
