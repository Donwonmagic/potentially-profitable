/**
 * Muntin — composite price engine (the Cost Index core).
 *
 * Turns price signals from MULTIPLE sources into one honest, defensible
 * composite over time. The hard rule it enforces: you cannot average a
 * wholesale terminal price, a producer-price INDEX, and a delivered
 * invoice price into a single "price" — they measure different things.
 * So this engine separates the two questions that actually have
 * answers:
 *
 *   1. LEVEL  ($/unit right now) — anchored on the single most
 *      delivered-relevant basis available, reported as a RANGE
 *      (p25–p75), never a false-precise point. Index sources never
 *      contribute a level (they have no dollar value).
 *
 *   2. TREND  (rate of change) — the cross-source-robust signal. Every
 *      source, including a unitless index, gives a reliable % change.
 *      We blend the per-source rates of change with a WEIGHTED MEDIAN,
 *      so the composite trend holds even when the levels are not
 *      comparable.
 *
 * Every composite point keeps full provenance (source + date) so the
 * number is citeable, and a confidence that falls when sources are few
 * or disagree. Lead with direction; show level as a labeled range.
 *
 * This is the deterministic core. The live fetch of public-domain
 * sources (USDA AMS, BLS PPI, FRED, NOAA) and the k-anonymous
 * first-party (Ledger) feed happen upstream in CI/prod and hand this
 * engine plain observations. Pure, no network, no LLM. Integer cents.
 *
 * Browser: window.MuntinComposite. Node: module.exports.
 */
(function (root) {
  'use strict';

  // Level bases in priority order (most delivered-relevant first).
  // 'index' is deliberately ABSENT — an index carries no dollar level.
  var DEFAULT_LEVEL_PRIORITY = ['delivered', 'wholesale', 'retail'];

  function median(values) {
    if (!values.length) return 0;
    var s = values.slice().sort(function (a, b) { return a - b; });
    var n = s.length, mid = Math.floor(n / 2);
    return n % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }
  function percentile(values, p) {
    if (!values.length) return 0;
    var s = values.slice().sort(function (a, b) { return a - b; });
    if (s.length === 1) return s[0];
    var idx = (s.length - 1) * p;
    var lo = Math.floor(idx), hi = Math.ceil(idx);
    if (lo === hi) return s[lo];
    return s[lo] + (s[hi] - s[lo]) * (idx - lo);
  }
  function weightedMedian(pairs) {
    // pairs: [{ v, w }]. Returns the value at the cumulative-weight midpoint.
    var items = pairs.filter(function (p) { return isFinite(p.v) && p.w > 0; })
      .sort(function (a, b) { return a.v - b.v; });
    if (!items.length) return 0;
    var total = items.reduce(function (s, p) { return s + p.w; }, 0);
    var acc = 0;
    for (var i = 0; i < items.length; i++) {
      acc += items[i].w;
      if (acc >= total / 2) return items[i].v;
    }
    return items[items.length - 1].v;
  }

  /**
   * compositeLevel(observations, opts) -> the honest LEVEL for one period.
   * observations: [{ source, basis, valueCents, date, weight? }].
   * Anchors on the first basis in priority order that has observations;
   * NEVER mixes bases (delivered $10 + wholesale $6 → anchors delivered
   * $10, not an $8 average that's true of neither). Returns null when no
   * level-bearing basis is present (e.g. index-only).
   */
  function compositeLevel(observations, opts) {
    opts = opts || {};
    var priority = opts.levelPriority || DEFAULT_LEVEL_PRIORITY;
    var byBasis = {};
    (observations || []).forEach(function (o) {
      if (!o || o.basis === 'index') return;
      if (typeof o.valueCents !== 'number' || !isFinite(o.valueCents) || o.valueCents <= 0) return;
      (byBasis[o.basis] = byBasis[o.basis] || []).push(o);
    });
    for (var i = 0; i < priority.length; i++) {
      var basis = priority[i];
      var obs = byBasis[basis];
      if (obs && obs.length) {
        var vals = obs.map(function (o) { return o.valueCents; });
        return {
          basis: basis,
          medianCents: Math.round(median(vals)),
          rangeCents: [Math.round(percentile(vals, 0.25)), Math.round(percentile(vals, 0.75))],
          nObs: obs.length,
          nSources: distinct(obs.map(function (o) { return o.source; })),
          provenance: obs.map(function (o) { return { source: o.source, valueCents: o.valueCents, date: o.date || null }; })
        };
      }
    }
    return null;
  }

  function distinct(arr) {
    var seen = {}; var n = 0;
    arr.forEach(function (x) { if (x != null && !seen[x]) { seen[x] = 1; n++; } });
    return n;
  }

  /** Window rate-of-change for one source's ordered series [oldest..newest].
   *  Works for a dollar level OR a unitless index — both yield a clean %. */
  function windowChange(values) {
    var v = (values || []).filter(function (x) { return typeof x === 'number' && isFinite(x); });
    if (v.length < 2) return null;
    var first = v[0], last = v[v.length - 1];
    if (first <= 0) return null;
    return (last - first) / first;
  }

  /**
   * blendTrend(changes) -> composite rate of change across sources.
   * changes: [{ source, pct, weight? }] — each source's own % move.
   * Uses a weighted median (robust to one bad source) and reports how
   * much the sources AGREE on direction (the honesty signal).
   */
  function blendTrend(changes) {
    var valid = (changes || []).filter(function (c) { return c && typeof c.pct === 'number' && isFinite(c.pct); });
    if (!valid.length) return { pct: null, dir: 'flat', agreement: 0, nSources: 0 };
    var pct = weightedMedian(valid.map(function (c) { return { v: c.pct, w: (c.weight > 0 ? c.weight : 1) }; }));
    var FLAT = 0.005; // ±0.5% = flat
    var dir = pct > FLAT ? 'up' : pct < -FLAT ? 'down' : 'flat';
    var sameDir = valid.filter(function (c) {
      var d = c.pct > FLAT ? 'up' : c.pct < -FLAT ? 'down' : 'flat';
      return d === dir;
    }).length;
    return {
      pct: pct,
      dir: dir,
      agreement: +(sameDir / valid.length).toFixed(3),
      nSources: distinct(valid.map(function (c) { return c.source; }))
    };
  }

  function confidenceFor(level, trend) {
    // Honest confidence: needs a real level AND corroborated direction.
    var nLvl = level ? level.nSources : 0;
    var nTrd = trend ? trend.nSources : 0;
    var agree = trend ? trend.agreement : 0;
    if (!level && nTrd >= 2 && agree >= 0.66) return 'directional'; // trend only, no level
    if (nLvl >= 2 && nTrd >= 3 && agree >= 0.75) return 'high';
    if ((nLvl >= 1 && nTrd >= 2 && agree >= 0.6)) return 'medium';
    return 'low';
  }

  function fmtPct(p) { return (p >= 0 ? '+' : '') + (p * 100).toFixed(1).replace(/\.0$/, '') + '%'; }
  function dollars(c) { return '$' + (Math.round(c) / 100).toFixed(2); }

  /**
   * assess({ levelObs, sourceSeries, opts }) -> one composite Cost-Index
   * point.
   *   levelObs:     observations for the latest period (level).
   *   sourceSeries: { [sourceKey]: { basis, values:[oldest..newest], weight? } }
   *                 — each source's own series, for the trend blend.
   * Returns { level, trend, confidence, label, provenance, asOf }.
   * `label` is honest copy that leads with direction and never claims a
   * level the data can't support.
   */
  function assess(input) {
    input = input || {};
    var opts = input.opts || {};
    var level = compositeLevel(input.levelObs || [], opts);
    var series = input.sourceSeries || {};
    var changes = Object.keys(series).map(function (src) {
      var s = series[src] || {};
      var pct = windowChange(s.values);
      return pct == null ? null : { source: src, pct: pct, weight: s.weight };
    }).filter(Boolean);
    var trend = blendTrend(changes);
    var confidence = confidenceFor(level, trend);

    var provenance = [];
    if (level) level.provenance.forEach(function (p) { provenance.push({ kind: 'level', source: p.source, valueCents: p.valueCents, date: p.date }); });
    Object.keys(series).forEach(function (src) { provenance.push({ kind: 'trend', source: src, basis: series[src].basis }); });

    var label;
    var dirWord = trend.dir === 'up' ? 'up' : trend.dir === 'down' ? 'down' : 'flat';
    if (level && trend.pct != null) {
      label = 'About ' + dollars(level.rangeCents[0]) + '–' + dollars(level.rangeCents[1]) +
        ' (' + level.basis + ' reference), ' + dirWord + ' ' + fmtPct(trend.pct) + ' over the window. ' +
        level.nSources + '+ sources for level, ' + trend.nSources + ' for trend.';
    } else if (trend.pct != null) {
      label = 'Directional only — no comparable price level. The market moved ' + dirWord + ' ' +
        fmtPct(trend.pct) + ' across ' + trend.nSources + ' source(s).';
    } else if (level) {
      label = 'About ' + dollars(level.rangeCents[0]) + '–' + dollars(level.rangeCents[1]) +
        ' (' + level.basis + ' reference). Not enough history yet for a trend.';
    } else {
      label = 'Not enough data yet.';
    }

    return {
      level: level,
      trend: trend,
      confidence: confidence,
      asOf: input.asOf || null,
      label: label,
      provenance: provenance
    };
  }

  var api = {
    DEFAULT_LEVEL_PRIORITY: DEFAULT_LEVEL_PRIORITY,
    median: median,
    percentile: percentile,
    weightedMedian: weightedMedian,
    windowChange: windowChange,
    compositeLevel: compositeLevel,
    blendTrend: blendTrend,
    assess: assess
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinComposite = api;
  if (root) root.MuntinComposite = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
