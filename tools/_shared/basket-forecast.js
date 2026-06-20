/**
 * Basket Forecast — a directional outlook for the basket you actually buy.
 *
 * The "weather service" capability, Index-only: it composes the already-validated
 * frontier layers into one honest forward read.
 *
 *   - cost-pressure (data/cost-pressure.json) — per-item DIRECTION + confidence,
 *     proven edges only. No price in the layer, so none is invented here.
 *   - the backtest verdict (data/cost-forecast-backtest.json) — the GOVERNOR.
 *     coneHonestThroughH is how far a forward directional call actually beats a
 *     naive baseline. If it's 0, this module makes NO forward call and reports the
 *     measured pressure state only. It never forecasts further than the data earns.
 *   - seasonality (data/seasonality.json) — optional context: is an item near its
 *     own seasonal low/high this month.
 *
 * Storability gates the advice (grounded: storables — dry goods, oils, sauces —
 * can be forward-locked; proteins/produce move with the market and cannot). So a
 * building cost yields "lock/pre-buy" only when the item stores; otherwise
 * "watch & negotiate". An easing cost is a feature-it-now cue.
 *
 * MODULE CONTRACT
 *   Minimum:  cost-pressure + the backtest verdict → a default-basket outlook.
 *   Degraded: backtest says forecasts don't beat baseline → outlook
 *             'no-forward-call', measured state only. No proven edges → 'steady'
 *             with empty movers. Nothing is ever forecast beyond coneHonestThroughH.
 *   Enhances: + the operator's basket (basketSlugs from saved recipes) → their
 *             real mix; + seasonality → seasonal-low/high cues; +Inventory →
 *             quantity & timing (true buy-now-or-wait).
 *
 * Pure, deterministic. No DOM/network/level. Inputs passed in (testable).
 * Browser: window.MuntinBasketForecast. Node: module.exports.
 */
(function (root) {
  'use strict';

  var CONF = { high: 3, moderate: 2, medium: 2, low: 1, directional: 0 };

  // Conservative storability: default NOT storable unless the slug clearly names a
  // shelf-stable staple. Better to withhold a "lock it" cue than to tell someone
  // to stockpile something perishable.
  var STORABLE_RE = /(^|-)(oil|rice|flour|sugar|bean|lentil|pasta|vinegar|honey|salt|oat|grain|cornmeal|canned|dried|sauce|syrup)(-|$)/;
  function isStorable(slug, cat) {
    if (cat && /oil|grain|dry|canned|sweetener|condiment|pantry/.test(String(cat))) return true;
    return STORABLE_RE.test(String(slug || ''));
  }

  function num(v) { var n = (typeof v === 'number') ? v : parseFloat(v); return isFinite(n) ? n : null; }

  // Seasonal cue from a ready seasonality record: is `month` (1-12) in the
  // cheapest or priciest third of the item's own monthly medians?
  function seasonalNote(rec, month) {
    if (!rec || !rec.ready || !rec.months || !month) return null;
    var vals = [];
    Object.keys(rec.months).forEach(function (m) {
      var c = num(rec.months[m].medianCents);
      if (c != null) vals.push({ m: +m, c: c });
    });
    if (vals.length < 6) return null;
    var here = rec.months[String(month)] && num(rec.months[String(month)].medianCents);
    if (here == null) return null;
    var sorted = vals.map(function (v) { return v.c; }).sort(function (a, b) { return a - b; });
    var p33 = sorted[Math.floor(sorted.length / 3)];
    var p67 = sorted[Math.floor((2 * sorted.length) / 3)];
    if (here <= p33) return 'seasonal-low';
    if (here >= p67) return 'seasonal-high';
    return null;
  }

  function actionFor(direction, storable) {
    if (direction === 'building') return storable ? 'lock-or-prebuy' : 'watch-negotiate';
    if (direction === 'easing') return 'feature-now';
    return 'hold';
  }

  /**
   * forecast({ pressure, backtest, seasonality, basketSlugs, month, labels }) -> result
   */
  function forecast(opts) {
    opts = opts || {};
    var items = (opts.pressure && opts.pressure.items) || null;
    var verdict = (opts.backtest && opts.backtest.verdict) || {};
    var horizonHonest = num(verdict.coneHonestThroughH) || 0;
    var seasonalUseful = verdict.seasonalUseful === true;
    var basket = opts.basketSlugs ? new Set([].concat(opts.basketSlugs)) : null;
    var labels = (opts.labels && (opts.labels.labels || opts.labels)) || {};
    var seas = (opts.seasonality && (opts.seasonality.ingredients || opts.seasonality)) || null;
    var month = num(opts.month);

    var base = {
      horizonHonest: horizonHonest,
      seasonalUseful: seasonalUseful,
      outlook: 'steady',
      counts: { building: 0, easing: 0, steady: 0, n: 0 },
      movers: [],
      lockCandidates: [],
      watchCandidates: [],
      featureCandidates: [],
      note: ''
    };
    if (!items) { base.note = 'No cost-pressure signal available.'; return base; }

    function seasRec(slug) {
      if (!seas) return null;
      if (Array.isArray(seas)) { for (var i = 0; i < seas.length; i++) if (seas[i].key === slug) return seas[i]; return null; }
      return seas[slug] || null;
    }

    var movers = [];
    Object.keys(items).forEach(function (slug) {
      var p = items[slug];
      if (!p || p.under_review) return;                       // proven edges only
      if (basket && !basket.has(slug)) return;
      var dir = p.direction;
      if (dir !== 'building' && dir !== 'easing' && dir !== 'steady') return;
      base.counts.n++;
      if (dir === 'building') base.counts.building++;
      else if (dir === 'easing') base.counts.easing++;
      else base.counts.steady++;
      if ((CONF[p.confidence] || 0) < 2) return;             // moderate+ only for the call
      if (dir === 'steady') return;
      var storable = isStorable(slug, labels[slug] && (labels[slug].cat || labels[slug].category));
      movers.push({
        slug: slug, direction: dir, confidence: p.confidence,
        storable: storable, action: actionFor(dir, storable),
        seasonalNote: seasonalUseful ? seasonalNote(seasRec(slug), month) : null,
        _rank: (CONF[p.confidence] || 0)
      });
    });

    movers.sort(function (a, b) { return b._rank - a._rank || a.slug.localeCompare(b.slug); });
    base.movers = movers.slice(0, 6).map(function (m) { delete m._rank; return m; });
    base.lockCandidates = movers.filter(function (m) { return m.action === 'lock-or-prebuy'; }).map(function (m) { return m.slug; });
    base.watchCandidates = movers.filter(function (m) { return m.action === 'watch-negotiate'; }).map(function (m) { return m.slug; });
    base.featureCandidates = movers.filter(function (m) { return m.action === 'feature-now'; }).map(function (m) { return m.slug; });

    if (horizonHonest <= 0) {
      base.outlook = 'no-forward-call';
      base.note = 'The backtest does not yet clear a forward directional call beyond the measured read; showing measured pressure state only.';
      return base;
    }
    var b = base.counts.building, e = base.counts.easing;
    if (b > e * 1.5 && b > 0) base.outlook = 'building';
    else if (e > b * 1.5 && e > 0) base.outlook = 'easing';
    else if (b === 0 && e === 0) base.outlook = 'steady';
    else base.outlook = 'mixed';
    base.note = 'Directional outlook ~' + horizonHonest + ' print(s) ahead (the reach the backtest earns), proven edges only. Wholesale direction, not a price or a guarantee.';
    return base;
  }

  var api = { forecast: forecast, isStorable: isStorable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinBasketForecast = api;
  if (root) root.MuntinBasketForecast = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
