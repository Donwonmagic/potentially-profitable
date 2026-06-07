/**
 * Muntin — the Restaurant Basket (headline Cost Index).
 *
 * Composes the per-ingredient composite TRENDS (from composite-price.js) into
 * ONE honest headline number: a weighted rate-of-change for a declared, frozen
 * basket (data/cost-basket-weights.json). The discipline:
 *   - weighted MEDIAN of per-ingredient % moves (robust to one wild ingredient),
 *     never a mean;
 *   - it is a basis-AGNOSTIC % move (a % is comparable across wholesale/retail/
 *     index — a LEVEL is not), so the basket NEVER reports a price level and
 *     never claims "what restaurants pay";
 *   - coverage (share of basket weight that actually priced) and agreement drive
 *     a confidence that steps down honestly when the basket is thin;
 *   - asOf is the OLDEST contributing date (a freshness floor, not fetch-time).
 *
 * Pure, no network, no LLM. Browser: window.MuntinBasket. Node: module.exports.
 */
(function (root) {
  'use strict';

  var C = (typeof require === 'function')
    ? require('./composite-price.js')
    : (root && root.MuntinComposite);

  var FLAT = 0.005; // ±0.5% = flat (matches the engine's trend threshold)

  /**
   * basketTrend(results, weights) -> the headline.
   *   results: { [ingredient]: MuntinComposite.assess result } (uses .trend.pct + .asOf)
   *   weights: { [ingredient]: number } (the frozen declared basket)
   * Returns { pct, dir, agreement, coverage, nContributing, nDeclared, asOf,
   *           confidence, contributors }. pct is null when nothing priced.
   */
  function basketTrend(results, weights) {
    results = results || {};
    weights = weights || {};
    var declared = Object.keys(weights);
    var totalW = declared.reduce(function (s, k) { return s + (weights[k] || 0); }, 0) || 1;

    var contrib = [], asOf = null;
    declared.forEach(function (k) {
      var r = results[k];
      if (!r || !r.trend || typeof r.trend.pct !== 'number' || !isFinite(r.trend.pct)) return;
      contrib.push({ ingredient: k, pct: r.trend.pct, w: weights[k] || 0 });
      if (r.asOf && (!asOf || r.asOf < asOf)) asOf = r.asOf; // oldest contributing date = honest "as of"
    });

    if (!contrib.length) {
      return { pct: null, dir: 'flat', agreement: 0, coverage: 0, nContributing: 0, nDeclared: declared.length, asOf: null, confidence: 'low', contributors: [] };
    }

    var pct = C.weightedMedian(contrib.map(function (c) { return { v: c.pct, w: c.w }; }));
    var contribW = contrib.reduce(function (s, c) { return s + c.w; }, 0);
    var coverage = contribW / totalW;
    var dir = pct > FLAT ? 'up' : pct < -FLAT ? 'down' : 'flat';
    var agreeW = contrib.reduce(function (s, c) {
      var d = c.pct > FLAT ? 'up' : c.pct < -FLAT ? 'down' : 'flat';
      return d === dir ? s + c.w : s;
    }, 0);
    var agreement = +(agreeW / contribW).toFixed(3);

    var confidence = (coverage >= 0.6 && contrib.length >= 6 && agreement >= 0.6) ? 'high'
      : (coverage >= 0.4 && contrib.length >= 4) ? 'medium'
      : 'low';

    return {
      pct: pct, dir: dir, agreement: agreement,
      coverage: +coverage.toFixed(3), nContributing: contrib.length, nDeclared: declared.length,
      asOf: asOf, confidence: confidence,
      contributors: contrib
        .map(function (c) { return { ingredient: c.ingredient, pct: c.pct, weight: c.w }; })
        .sort(function (a, b) { return b.weight - a.weight; })
    };
  }

  /** Honest one-line phrasing — direction of a declared basket, never a level. */
  function basketPhrase(b) {
    if (!b || b.pct == null) return 'Not enough of the basket priced yet to publish a headline.';
    var fp = (b.pct >= 0 ? '+' : '') + (b.pct * 100).toFixed(1).replace(/\.0$/, '') + '%';
    return 'The Muntin Restaurant Basket moved ' + b.dir + ' ' + fp + ' over the window ('
      + Math.round(b.coverage * 100) + '% of the basket priced, ' + b.nContributing + ' of ' + b.nDeclared
      + ' ingredients; confidence ' + b.confidence + '). A weighted trend across public wholesale/index '
      + 'sources — the direction of a declared basket, not a price level.';
  }

  var api = { basketTrend: basketTrend, basketPhrase: basketPhrase };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinBasket = api;
  if (root) root.MuntinBasket = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
