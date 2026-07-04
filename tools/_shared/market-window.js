/**
 * Muntin Market Window — your price change vs. the market's change over the
 * SAME dates (Vendor Benchmark, Layer 2).
 *
 * Vendor Benchmark's Layer 1 (bench-lookup.js) answers "did this price move out
 * of line with MY OWN history?" — a trailing-median hike verdict that mirrors
 * Muntin Ledger's rule to the cent. This module adds the yardstick an operator
 * actually asks for at the walk-in door: a carton going up tells you nothing
 * alone — is that the MARKET, or is that my VENDOR padding the margin?
 *
 * Given a set of DATED purchases for one item, it:
 *   1. delegates the own-history verdict to Bench.assess (never re-derives it,
 *      so the two surfaces can't contradict);
 *   2. measures the operator's own %-change across the window (first -> last);
 *   3. reads the live Cost Index wholesale series for the matched item and
 *      measures the MARKET's %-change over that operator's exact window,
 *      delegating the honest endpoint math to MuntinCostFormat.thenVsNow —
 *      the same adversarially-audited function the Cost Pulse panel ships;
 *   4. places the operator's latest price against the wholesale reference LEVEL
 *      via MuntinFairPriceGap, so "your rate moved fine but your level is high"
 *      is also visible.
 *
 * THE HONESTY RULES (inherited, non-negotiable)
 * ---------------------------------------------
 *   - The Cost Index is a WHOLESALE reference; a delivered foodservice price
 *     legitimately runs above it. This module reports MOVEMENT (percent, unit-
 *     and basis-robust) as the primary comparison, never "you should pay $X".
 *   - thenVsNow refuses dates outside the series (>45 days from any read),
 *     out-of-order dates, spans under 14 days, and flags THIN evidence (a
 *     low/directional-confidence item, or fewer than 6 market reads) so a
 *     noisy short window never becomes a vendor accusation.
 *   - No fabricated series, no market read where the data doesn't cover the
 *     window — the caller renders "not covered, and why".
 *
 * Pure + deterministic: no DOM, no network, no storage. Persistence stays in
 * bench-lookup.js (on-device history); the market seeds are handed in (browser:
 * window.MUNTIN_COST_INDEX + window.MUNTIN_COST_INDEX_HISTORY, both same-origin
 * <script> globals — no fetch). Safe to require() in Node for tests; attaches to
 * window.MuntinMarketWindow in the browser.
 */
(function (root) {
  'use strict';

  var DAY = 86400000;

  // Resolve a sibling _shared module: browser global first, then Node require.
  function _mod(globalName, file) {
    if (root && root[globalName]) return root[globalName];
    if (typeof require !== 'undefined') {
      try { return require(file); } catch (_) { return null; }
    }
    return null;
  }

  // Strict ISO day -> UTC ms. Mirrors cost-index-format.js parseISODay verbatim
  // so an operator's typed date and the market series share ONE clock (a local
  // vs UTC mix would shift a matched read by a day near month boundaries).
  function parseISODay(s) {
    if (typeof s !== 'string') return null;
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    var ms = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    return isFinite(ms) ? ms : null;
  }
  function dayToTs(dateStr) {
    var ms = parseISODay(dateStr);
    return ms == null ? null : ms;
  }
  function median(values) {
    var s = values.slice().sort(function (a, b) { return a - b; });
    var n = s.length;
    if (!n) return 0;
    var mid = Math.floor(n / 2);
    return n % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  /**
   * The market wholesale series for an ingredient key, newest LAST.
   * Prefers the deep 3-year weekly history (window.MUNTIN_COST_INDEX_HISTORY —
   * a second same-origin <script>) so an operator can compare a delivery months
   * back; falls back to the ingredient's short daily `assessment.history[]`
   * (strictly more complete than the columnar `spark`), then to `spark`.
   * Only WHOLESALE-basis rows contribute a dollar value — an index-basis row
   * is a movement, never a level, and is dropped from a $-series.
   * Returns { values:[cents], dates:[iso], kind:'deep'|'short'|'spark',
   *           sources:[…] } or null.
   */
  function seriesForKey(key, opts) {
    opts = opts || {};
    var seed = opts.seed || (root && root.MUNTIN_COST_INDEX) || null;
    var deep = opts.deep || (root && root.MUNTIN_COST_INDEX_HISTORY) || null;
    if (!key) return null;

    var d = deep && deep[key];
    if (Array.isArray(d) && d.length >= 2) {
      return {
        values: d.map(function (p) { return p[1]; }),
        dates: d.map(function (p) { return p[0]; }),
        kind: 'deep',
        sources: ['usda']
      };
    }

    var ing = null;
    if (seed && Array.isArray(seed.ingredients)) {
      for (var i = 0; i < seed.ingredients.length; i++) {
        if (seed.ingredients[i].key === key) { ing = seed.ingredients[i]; break; }
      }
    }
    if (!ing) return null;
    var a = ing.assessment || {};

    // Collapse assessment.history[] by date (median across same-date regions),
    // wholesale-only. Sorted ascending.
    var hist = Array.isArray(a.history) ? a.history : [];
    if (hist.length) {
      var byDate = {};
      var order = [];
      var srcSet = {};
      for (var j = 0; j < hist.length; j++) {
        var r = hist[j];
        if (!r || r.basis !== 'wholesale') continue;
        if (!(typeof r.valueCents === 'number' && r.valueCents > 0)) continue;
        if (!byDate[r.date]) { byDate[r.date] = []; order.push(r.date); }
        byDate[r.date].push(r.valueCents);
        if (r.source) srcSet[r.source] = true;
      }
      order.sort();
      if (order.length >= 2) {
        return {
          values: order.map(function (dt) { return Math.round(median(byDate[dt])); }),
          dates: order,
          kind: 'short',
          sources: Object.keys(srcSet)
        };
      }
    }

    // Last resort: the columnar spark mirror.
    if (Array.isArray(ing.spark) && Array.isArray(ing.spark_dates) &&
        ing.spark.length === ing.spark_dates.length && ing.spark.length >= 2) {
      return { values: ing.spark.slice(), dates: ing.spark_dates.slice(), kind: 'spark', sources: [] };
    }
    return null;
  }

  // Nearest market reading to a date within a gap tolerance. Ties keep the
  // EARLIER read (parity with thenVsNow). Returns { cents, date, gapDays } or null.
  function nearestReading(series, dateStr, maxGapDays) {
    var t = parseISODay(dateStr);
    if (t == null || !series || !series.values.length) return null;
    var bi = -1, bd = Infinity;
    for (var i = 0; i < series.values.length; i++) {
      var v = series.values[i];
      if (!(typeof v === 'number' && isFinite(v) && v > 0)) continue;
      var dt = parseISODay(series.dates[i]);
      if (dt == null) continue;
      var diff = Math.abs(dt - t);
      if (diff < bd) { bd = diff; bi = i; }
    }
    if (bi < 0) return null;
    var gapDays = Math.round(bd / DAY);
    if (maxGapDays != null && gapDays > maxGapDays) return null;
    return { cents: series.values[bi], date: series.dates[bi], gapDays: gapDays };
  }

  /**
   * The one call the UI makes.
   *
   * input = {
   *   item,                                  // free-typed name
   *   purchases: [{ cents:int, date:'YYYY-MM-DD', unit? }],   // >=1, any order
   *   seed?, deep?,                          // Cost Index globals (browser auto)
   *   locale?                                // 'en' | 'es'
   * }
   *
   * Returns a stable, render-ready shape (see fields below). Never throws;
   * degrades to { tier:'insufficient' } on empty input.
   */
  function compute(input) {
    input = input || {};
    var locale = (input.locale === 'es') ? 'es' : 'en';
    var item = (input.item || '').toString().trim();
    var seed = input.seed || (root && root.MUNTIN_COST_INDEX) || null;
    var deep = input.deep || (root && root.MUNTIN_COST_INDEX_HISTORY) || null;

    var raw = Array.isArray(input.purchases) ? input.purchases : [];
    // Keep only usable rows (positive cents + parseable date), sort ascending.
    var purchases = raw.filter(function (p) {
      return p && typeof p.cents === 'number' && isFinite(p.cents) && p.cents > 0 && parseISODay(p.date) != null;
    }).slice().sort(function (a, b) { return parseISODay(a.date) - parseISODay(b.date); });

    var Bench = _mod('MuntinBench', './bench-lookup.js');

    var out = {
      item: item,
      locale: locale,
      purchases: purchases,
      observationCount: purchases.length,
      tier: 'insufficient',
      talkingPoint: '',
      yourChangePct: null,
      firstCents: null, lastCents: null,
      firstDate: null, lastDate: null, spanDays: null,
      unit: null,
      market: { available: false, reason: 'need-two' }
    };

    // Own-history verdict — delegate to Bench so the two surfaces never disagree.
    if (Bench && typeof Bench.assess === 'function') {
      var observations = purchases.map(function (p) {
        return { cents: Math.round(p.cents), ts: dayToTs(p.date), unit: p.unit };
      });
      var v = Bench.assess({ item: item, observations: observations, locale: locale });
      out.tier = v.tier;
      out.talkingPoint = v.talkingPoint;
      out.medianCents = v.medianCents;
      out.latestCents = v.latestCents;
      out.deltaCents = v.deltaCents;
      out.deltaPct = v.deltaPct;
      out.baseUnit = v.baseUnit;
      out.unitReason = v.unitReason;
    }

    if (purchases.length < 2) {
      out.market = { available: false, reason: 'need-two' };
      return out;
    }

    var first = purchases[0], last = purchases[purchases.length - 1];
    out.firstCents = Math.round(first.cents);
    out.lastCents = Math.round(last.cents);
    out.firstDate = first.date;
    out.lastDate = last.date;
    out.unit = last.unit || first.unit || null;
    out.spanDays = Math.round((parseISODay(last.date) - parseISODay(first.date)) / DAY);
    out.yourChangePct = (last.cents - first.cents) / first.cents;

    out.market = marketWindow({
      item: item, first: first, last: last, purchases: purchases,
      seed: seed, deep: deep, locale: locale
    });
    return out;
  }

  // The market half. Isolated so it can return a stable "not available" shape
  // for every honest refusal (no match / no series / out of range / thin).
  function marketWindow(ctx) {
    var locale = ctx.locale;
    var Lookup = _mod('MuntinCostIndexLookup', './cost-index-lookup.js');
    var Format = _mod('MuntinCostFormat', './cost-index-format.js');
    var FPG = _mod('MuntinFairPriceGap', './fair-price-gap.js');
    var seed = ctx.seed, deep = ctx.deep;

    if (!Lookup || !Format || !seed) {
      return { available: false, reason: 'no-index' };
    }
    var ref = Lookup.match(ctx.item, seed);
    if (!ref) return { available: false, reason: 'no-match' };

    var series = seriesForKey(ref.key, { seed: seed, deep: deep });

    // Recent-invoice augmentation: append the live level at generatedAt so a
    // just-received invoice still snaps to a real endpoint (mirrors the UI).
    var ing = null;
    if (Array.isArray(seed.ingredients)) {
      for (var i = 0; i < seed.ingredients.length; i++) {
        if (seed.ingredients[i].key === ref.key) { ing = seed.ingredients[i]; break; }
      }
    }
    if (series && ing && ing.assessment && ing.assessment.level &&
        ing.assessment.level.medianCents > 0 && seed.generatedAt) {
      var tail = series.dates[series.dates.length - 1];
      if (parseISODay(seed.generatedAt) != null && parseISODay(tail) != null &&
          parseISODay(seed.generatedAt) > parseISODay(tail)) {
        series = {
          values: series.values.concat([ing.assessment.level.medianCents]),
          dates: series.dates.concat([seed.generatedAt]),
          kind: series.kind,
          sources: series.sources
        };
      }
    }

    var base = {
      available: false,
      key: ref.key,
      label: (locale === 'es' ? ref.label_es : ref.label_en) || ref.key,
      marketUnit: (locale === 'es' ? ref.unit_es : ref.unit_en) || null,
      confidence: ref.confidence || null,
      matchTier: ref.tier || null
    };

    if (!series || series.values.length < 2) {
      base.reason = 'no-series';
      return base;
    }
    base.seriesKind = series.kind;
    base.sources = series.sources;
    base.seriesStart = series.dates[0];
    base.seriesEnd = series.dates[series.dates.length - 1];

    var fmt = Format(locale === 'es');
    var res = fmt.thenVsNow(series.values, series.dates, {
      aCents: ctx.first.cents,
      bCents: ctx.last.cents,
      aDateStr: ctx.first.date,
      bDateStr: ctx.last.date,
      confidence: ref.confidence
    });
    var say = fmt.thenVsNowSay(res, base.marketUnit || (locale === 'es' ? 'unidad' : 'unit'));

    // Per-purchase timeline: nearest market read + cumulative change from the
    // first purchase, for both the operator and the market. Illustrative context
    // for the chart; each leg's market read is null when no read is within range.
    var legs = ctx.purchases.map(function (p) {
      var nr = nearestReading(series, p.date, 45);
      return {
        date: p.date,
        cents: Math.round(p.cents),
        yourCumPct: (p.cents - ctx.first.cents) / ctx.first.cents,
        marketCents: nr ? nr.cents : null,
        marketDate: nr ? nr.date : null,
        marketGapDays: nr ? nr.gapDays : null
      };
    });
    // Market cumulative %-change per leg, off the first leg's market read.
    var firstMarket = legs[0].marketCents;
    legs.forEach(function (leg) {
      leg.marketCumPct = (firstMarket && leg.marketCents)
        ? (leg.marketCents - firstMarket) / firstMarket
        : null;
    });

    // Wholesale-reference LEVEL check (rate-of-change is primary; this is the
    // complementary "is your absolute level far above wholesale" read).
    var level = null;
    if (FPG && typeof FPG.assess === 'function' && ctx.last.unit) {
      try {
        level = FPG.assess({ item: ctx.item, paidCents: ctx.last.cents, unit: ctx.last.unit, seed: seed });
      } catch (_) { level = null; }
    }

    base.available = true;
    base.res = res;                // raw thenVsNow result (ok/reason/pcts/gapPts/excessCents)
    base.say = say;                // locale prose { ok, tone, headline, detail, note, srText }
    base.series = { values: series.values, dates: series.dates, kind: series.kind };
    base.legs = legs;
    base.level = level;            // fair-price-gap level result (may be null / not comparable)
    return base;
  }

  var api = {
    DAY: DAY,
    parseISODay: parseISODay,
    dayToTs: dayToTs,
    seriesForKey: seriesForKey,
    nearestReading: nearestReading,
    compute: compute
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinMarketWindow = api;
  if (root) root.MuntinMarketWindow = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : this));
