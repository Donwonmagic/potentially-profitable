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
        var famRecent = {};
        obs.forEach(function (o) {
          var f = o.family || o.source;
          (famGroups[f] = famGroups[f] || []).push(o.valueCents);
          if (Array.isArray(o.recent)) o.recent.forEach(function (v) { if (typeof v === 'number' && isFinite(v) && v > 0) (famRecent[f] = famRecent[f] || []).push(v); });
        });
        var famKeys = Object.keys(famGroups);
        var vals = famKeys.map(function (f) { return median(famGroups[f]); });
        var medianCents = Math.round(median(vals));
        var range = [Math.round(percentile(vals, 0.25)), Math.round(percentile(vals, 0.75))];
        // Rolling-MAD band: a market's recent (weekly-resampled) volatility, so a
        // lone source gets an honest width instead of a $X–$X point. De-correlated
        // per family (each market's deviations around its OWN median) so cross-
        // market level gaps don't masquerade as volatility. Union with p25–p75.
        var devPool = [];
        famKeys.forEach(function (f) {
          var arr = famRecent[f]; if (!arr || arr.length < 2) return;
          var fm = median(arr);
          arr.forEach(function (v) { devPool.push(Math.abs(v - fm)); });
        });
        var rangeBasis = famKeys.length >= 2 ? 'markets' : 'point';
        if (devPool.length >= 4) {
          var k = 0.6745 * 1.4826 * median(devPool);   // robust half-IQR from MAD
          if (k > 0) {
            range = [Math.round(Math.min(range[0], medianCents - k)), Math.round(Math.max(range[1], medianCents + k))];
            if (rangeBasis === 'point') rangeBasis = 'volatility';
          }
        }
        // Measured market spread: the actual reported low–high band the source
        // PUBLISHED (USDA AMS carries low_price/high_price per terminal). When
        // present it's the most honest width we have — a real trading range, not a
        // synthetic volatility or percentile band — so union it in and let it NAME
        // the band whenever it sets an edge. Never narrows (union only).
        var measLo = null, measHi = null;
        obs.forEach(function (o) {
          var sp = o.spreadCents;
          if (!sp || typeof sp.lo !== 'number' || typeof sp.hi !== 'number') return;
          if (!isFinite(sp.lo) || !isFinite(sp.hi) || sp.lo <= 0 || sp.hi < sp.lo) return;
          measLo = measLo == null ? sp.lo : Math.min(measLo, sp.lo);
          measHi = measHi == null ? sp.hi : Math.max(measHi, sp.hi);
        });
        if (measLo != null && measHi != null) {
          var newLo = Math.min(range[0], Math.round(measLo));
          var newHi = Math.max(range[1], Math.round(measHi));
          if (newLo < range[0] || newHi > range[1]) rangeBasis = 'measured';
          range = [newLo, newHi];
        }
        // Level-agreement: do the INDEPENDENT methodologies (types) agree on the
        // dollar level? Robust relative dispersion of the per-type medians
        // (1.4826·MAD / median). When two+ types disagree, the level can't earn
        // 'high' on count alone — confidenceFor reads this to cap.
        var typeGroups = {};
        obs.forEach(function (o) { var t = o.type || o.family || o.source; (typeGroups[t] = typeGroups[t] || []).push(o.valueCents); });
        var typeMedians = Object.keys(typeGroups).map(function (t) { return median(typeGroups[t]); });
        var typeDispersion = 0;
        if (typeMedians.length >= 2) {
          var tm = median(typeMedians);
          var tdevs = typeMedians.map(function (v) { return Math.abs(v - tm); });
          typeDispersion = tm > 0 ? +((1.4826 * median(tdevs)) / tm).toFixed(4) : 0;
        }
        return {
          basis: basis,
          medianCents: medianCents,
          rangeCents: range,
          rangeBasis: rangeBasis,
          typeDispersion: typeDispersion,
          nObs: obs.length,
          nFamilies: famKeys.length,
          nSources: distinct(obs.map(function (o) { return o.source; })),
          nTypes: distinct(obs.map(function (o) { return o.type || o.family || o.source; })),
          provenance: obs.map(function (o) { return { source: o.source, type: o.type || o.family || o.source, valueCents: o.valueCents, date: o.date || null }; })
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
    if (!valid.length) return { pct: null, dir: 'flat', agreement: 0, nSources: 0, nFamilies: 0, nTypes: 0, noise: null };
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
    return { pct: pct, dir: dir, agreement: +(sameDir / collapsed.length).toFixed(3), nSources: distinct(valid.map(function (c) { return c.source; })), nFamilies: collapsed.length, nTypes: distinct(valid.map(function (c) { return c.type || c.family || c.source; })) };
  }

  // Confidence is gated on INDEPENDENT source TYPES, never correlated markets:
  // six USDA-AMS terminals are one methodology (nTypes=1) even though they are
  // six families. Level- and trend-confidence are computed separately and the
  // headline is their MIN — one weak axis caps the read (you cannot buy "high"
  // with a strong level while the trend can't be corroborated, or vice-versa).
  // Theil–Sen robust line fit (median of pairwise slopes) — outlier-resistant,
  // so one bad print can't swing the detrend.
  function theilSen(v) {
    var slopes = [];
    for (var i = 0; i < v.length; i++) for (var j = i + 1; j < v.length; j++) slopes.push((v[j] - v[i]) / (j - i));
    var slope = median(slopes);
    return { slope: slope, intercept: median(v.map(function (y, i) { return y - slope * i; })) };
  }
  // Trend stability: detrend, then residual scatter relative to level. A smooth
  // steep move (romaine spike) reads ~0; a jagged series reads high — noise
  // dressed as a trend. Null until ≥4 reads.
  function residualNoise(values) {
    var v = (values || []).filter(function (x) { return typeof x === 'number' && isFinite(x); });
    if (v.length < 4) return null;
    var ts = theilSen(v);
    var resid = v.map(function (y, i) { return Math.abs(y - (ts.intercept + ts.slope * i)); });
    var m = median(v);
    if (m <= 0) return null;
    return +((1.4826 * median(resid)) / m).toFixed(4);
  }

  function confidenceFor(level, trend) {
    var lt = level ? (level.nTypes != null ? level.nTypes : (level.nFamilies != null ? level.nFamilies : level.nSources)) : 0;
    var tt = trend ? (trend.nTypes != null ? trend.nTypes : (trend.nFamilies != null ? trend.nFamilies : trend.nSources)) : 0;
    var agree = trend ? trend.agreement : 0;
    // No usable dollar level → direction-only (when a trend exists), else low.
    if (!level) return (trend && trend.pct != null && tt >= 1) ? 'directional' : 'low';
    var levelCeil = lt >= 2 ? 2 : lt >= 1 ? 1 : 0;            // 2=high · 1=medium · 0=low
    // Independent dollar types that DISAGREE (>15% robust CoV — a wiring/commodity
    // mismatch, not normal cross-source spread) can't buy 'high'.
    if (lt >= 2 && level.typeDispersion != null && level.typeDispersion > 0.15) levelCeil = 1;
    var trendCeil;
    if (!trend || trend.pct == null) trendCeil = 2;          // no trend signal → don't cap the level
    else trendCeil = (tt >= 2 && agree >= 0.66) ? 2 : (tt >= 2 && agree >= 0.33) ? 1 : 0;
    // Stability: a jagged path is noise dressed as a trend — endpoints agreeing
    // doesn't redeem it. >20% residual scatter → low; >8% → at most medium.
    if (trend && trend.noise != null) {
      if (trend.noise > 0.20) trendCeil = 0;
      else if (trend.noise > 0.08 && trendCeil > 1) trendCeil = 1;
    }
    return ['low', 'medium', 'high'][Math.min(levelCeil, trendCeil)];
  }

  function fmtPct(p) { return (p >= 0 ? '+' : '') + (p * 100).toFixed(1).replace(/\.0$/, '') + '%'; }
  function dollars(c) { return '$' + (Math.round(c) / 100).toFixed(2); }

  function levelPhrase(level) {
    var band = dollars(level.rangeCents[0]) + '–' + dollars(level.rangeCents[1]);
    var degenerate = level.rangeCents[0] === level.rangeCents[1];
    if (level.rangeBasis === 'measured' && !degenerate)
      return 'About ' + band + ' (' + level.basis + ' reference — band from reported market low–high)';
    if (level.rangeBasis === 'volatility' && !degenerate)
      return 'About ' + band + ' (' + level.basis + ' reference, single market — band from recent volatility)';
    if (level.rangeBasis === 'markets' && !degenerate)
      return 'About ' + band + ' (' + level.basis + ' reference)';
    return 'About ' + dollars(level.rangeCents[0]) + ' (' + level.basis + ' reference, single source — range not yet measurable)';
  }

  function assess(input) {
    input = input || {};
    var opts = input.opts || {};
    var level = compositeLevel(input.levelObs || [], opts);
    var series = input.sourceSeries || {};
    var changes = Object.keys(series).map(function (src) {
      var s = series[src] || {};
      var pct = windowChange(s.values);
      return pct == null ? null : { source: src, pct: pct, weight: s.weight, family: s.family, type: s.type };
    }).filter(Boolean);
    var trend = blendTrend(changes);
    // Stability per de-correlated family, then the median across families.
    var noiseByFam = {};
    Object.keys(series).forEach(function (src) {
      var s = series[src] || {}; var f = s.family || src;
      var nz = residualNoise(s.values);
      if (nz != null) (noiseByFam[f] = noiseByFam[f] || []).push(nz);
    });
    var famNoise = Object.keys(noiseByFam).map(function (f) { return median(noiseByFam[f]); });
    trend.noise = famNoise.length ? median(famNoise) : null;
    var confidence = confidenceFor(level, trend);

    var provenance = [];
    if (level) level.provenance.forEach(function (p) { provenance.push({ kind: 'level', source: p.source, type: p.type, valueCents: p.valueCents, date: p.date }); });
    Object.keys(series).forEach(function (src) { var s = series[src] || {}; provenance.push({ kind: 'trend', source: src, type: s.type || s.family || src, basis: s.basis }); });

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
