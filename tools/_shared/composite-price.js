/**
 * Shared composite-price — the Cost Index core.
 *
 * Separates LEVEL (anchored on the most delivered-relevant basis, p25–p75
 * range, indexes never contribute a dollar level) from TREND (weighted-median
 * rate-of-change across sources). Never averages incommensurable bases. Mirror
 * sources sharing a `family` are de-correlated so echoes can't fake dispersion
 * or dominate a move. Pure, integer cents, no fetch/DOM.
 *
 * PARITY CONTRACT (canonical source). Muntin Ledger ships a behaviour-identical
 * TypeScript port; the 13 vectors in composite-price.test.mjs are mirrored
 * verbatim there. Change one side, change the other in the same change.
 */
(function (root) {
  'use strict';

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
    var items = pairs.filter(function (p) { return isFinite(p.v) && p.w > 0; }).sort(function (a, b) { return a.v - b.v; });
    if (!items.length) return 0;
    var total = items.reduce(function (s, p) { return s + p.w; }, 0);
    var acc = 0;
    for (var i = 0; i < items.length; i++) {
      acc += items[i].w;
      if (acc >= total / 2) return items[i].v;
    }
    return items[items.length - 1].v;
  }

  function distinct(arr) {
    var seen = {}, n = 0;
    arr.forEach(function (x) { if (x != null && !seen[x]) { seen[x] = 1; n++; } });
    return n;
  }

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
        var famGroups = {};
        obs.forEach(function (o) { var f = o.family || o.source; (famGroups[f] = famGroups[f] || []).push(o.valueCents); });
        var famKeys = Object.keys(famGroups);
        var vals = famKeys.map(function (f) { return median(famGroups[f]); });
        return {
          basis: basis,
          medianCents: Math.round(median(vals)),
          rangeCents: [Math.round(percentile(vals, 0.25)), Math.round(percentile(vals, 0.75))],
          nObs: obs.length,
          nFamilies: famKeys.length,
          nSources: distinct(obs.map(function (o) { return o.source; })),
          provenance: obs.map(function (o) { return { source: o.source, valueCents: o.valueCents, date: o.date || null }; })
        };
      }
    }
    return null;
  }

  function windowChange(values) {
    var v = (values || []).filter(function (x) { return typeof x === 'number' && isFinite(x); });
    if (v.length < 2) return null;
    var first = v[0], last = v[v.length - 1];
    if (first <= 0) return null;
    return (last - first) / first;
  }

  function blendTrend(changes) {
    var valid = (changes || []).filter(function (c) { return c && typeof c.pct === 'number' && isFinite(c.pct); });
    if (!valid.length) return { pct: null, dir: 'flat', agreement: 0, nSources: 0, nFamilies: 0 };
    var fam = {};
    valid.forEach(function (c) { var f = c.family || c.source; (fam[f] = fam[f] || []).push(c); });
    var collapsed = Object.keys(fam).map(function (f) {
      var m = fam[f];
      return { pct: median(m.map(function (x) { return x.pct; })), w: Math.max.apply(null, m.map(function (x) { return (x.weight && x.weight > 0 ? x.weight : 1); })) };
    });
    var pct = weightedMedian(collapsed.map(function (c) { return { v: c.pct, w: c.w }; }));
    var FLAT = 0.005;
    var dir = pct > FLAT ? 'up' : pct < -FLAT ? 'down' : 'flat';
    var sameDir = collapsed.filter(function (c) {
      var d = c.pct > FLAT ? 'up' : c.pct < -FLAT ? 'down' : 'flat';
      return d === dir;
    }).length;
    return { pct: pct, dir: dir, agreement: +(sameDir / collapsed.length).toFixed(3), nSources: distinct(valid.map(function (c) { return c.source; })), nFamilies: collapsed.length };
  }

  function confidenceFor(level, trend) {
    var nLvl = level ? (level.nFamilies != null ? level.nFamilies : level.nSources) : 0;
    var nTrd = trend ? (trend.nFamilies != null ? trend.nFamilies : trend.nSources) : 0;
    var agree = trend ? trend.agreement : 0;
    if (!level && nTrd >= 2 && agree >= 0.66) return 'directional';
    if (nLvl >= 2 && nTrd >= 3 && agree >= 0.75) return 'high';
    if (nLvl >= 1 && nTrd >= 2 && agree >= 0.6) return 'medium';
    return 'low';
  }

  function fmtPct(p) { return (p >= 0 ? '+' : '') + (p * 100).toFixed(1).replace(/\.0$/, '') + '%'; }
  function dollars(c) { return '$' + (Math.round(c) / 100).toFixed(2); }

  function levelPhrase(level) {
    var nFam = (level.nFamilies != null ? level.nFamilies : level.nSources);
    var single = nFam <= 1 || level.rangeCents[0] === level.rangeCents[1];
    return single
      ? 'About ' + dollars(level.rangeCents[0]) + ' (' + level.basis + ' reference, single source — range not yet measurable)'
      : 'About ' + dollars(level.rangeCents[0]) + '–' + dollars(level.rangeCents[1]) + ' (' + level.basis + ' reference)';
  }

  function assess(input) {
    input = input || {};
    var opts = input.opts || {};
    var level = compositeLevel(input.levelObs || [], opts);
    var series = input.sourceSeries || {};
    var changes = Object.keys(series).map(function (src) {
      var s = series[src] || {};
      var pct = windowChange(s.values);
      return pct == null ? null : { source: src, pct: pct, weight: s.weight, family: s.family };
    }).filter(Boolean);
    var trend = blendTrend(changes);
    var confidence = confidenceFor(level, trend);

    var provenance = [];
    if (level) level.provenance.forEach(function (p) { provenance.push({ kind: 'level', source: p.source, valueCents: p.valueCents, date: p.date }); });
    Object.keys(series).forEach(function (src) { provenance.push({ kind: 'trend', source: src, basis: series[src].basis }); });

    var label;
    var dirWord = trend.dir === 'up' ? 'up' : trend.dir === 'down' ? 'down' : 'flat';
    if (level && trend.pct != null) {
      label = levelPhrase(level) + ', ' + dirWord + ' ' + fmtPct(trend.pct) + ' over the window. ' +
        level.nSources + '+ source(s) for level, ' + trend.nSources + ' for trend.';
    } else if (trend.pct != null) {
      label = 'Directional only — no comparable price level. The market moved ' + dirWord + ' ' +
        fmtPct(trend.pct) + ' across ' + trend.nSources + ' source(s).';
    } else if (level) {
      label = levelPhrase(level) + '. Not enough history yet for a trend.';
    } else {
      label = 'Not enough data yet.';
    }

    return { level: level, trend: trend, confidence: confidence, asOf: input.asOf || null, label: label, provenance: provenance };
  }

  var api = {
    DEFAULT_LEVEL_PRIORITY: DEFAULT_LEVEL_PRIORITY,
    median: median,
    percentile: percentile,
    weightedMedian: weightedMedian,
    compositeLevel: compositeLevel,
    windowChange: windowChange,
    blendTrend: blendTrend,
    assess: assess
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCompositePrice = api;
  if (root) root.MuntinCompositePrice = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
