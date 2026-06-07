/**
 * Shared cost-index-sources — PURE source normalizers for the Cost Index.
 *
 * Translates raw FRED / BLS / USDA AMS payloads into the one shape the
 * composite engine consumes, separating the pure normalize*() (fixture-
 * testable) from the impure fetch (the worker). A source changing its JSON
 * shape is caught by a fixture test here, never silently poisoning the index.
 * Adapter output: { source, basis, unit, points:[{date,value}] } oldest→newest.
 *
 * PARITY CONTRACT (canonical source). Muntin Ledger ships a behaviour-identical
 * port; cost-index-sources.test.mjs is mirrored verbatim there.
 */
(function (root) {
  'use strict';

  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }

  function isoDate(d) {
    if (!d) return null;
    var s = String(d).trim();
    var ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) return ymd[1] + '-' + ymd[2] + '-' + ymd[3];
    var mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mdy) return mdy[3] + '-' + ('0' + mdy[1]).slice(-2) + '-' + ('0' + mdy[2]).slice(-2);
    return null;
  }

  function normalizeFred(json, meta) {
    meta = meta || {};
    var obs = (json && json.observations) || [];
    var points = obs.map(function (o) {
      var v = (o.value === '.' || o.value == null) ? null : parseFloat(o.value);
      var date = isoDate(o.date);
      return (date && v != null && isFinite(v)) ? { date: date, value: v } : null;
    }).filter(Boolean).sort(byDate);
    return { source: meta.source || 'fred', basis: meta.basis || 'index', unit: meta.unit || 'index', points: points };
  }

  function normalizeBls(json, meta) {
    meta = meta || {};
    var series = json && json.Results && json.Results.series && json.Results.series[0];
    var data = (series && series.data) || [];
    var points = data.map(function (d) {
      if (!d || !d.period || d.period[0] !== 'M' || d.period === 'M13') return null;
      var mm = d.period.slice(1);
      var v = parseFloat(d.value);
      return isFinite(v) ? { date: d.year + '-' + mm + '-01', value: v } : null;
    }).filter(Boolean).sort(byDate);
    return { source: meta.source || 'bls', basis: meta.basis || 'index', unit: meta.unit || 'index', points: points };
  }

  function num(s) {
    if (typeof s === 'number') return isFinite(s) ? s : null;
    if (s == null) return null;
    var n = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : null;
  }

  function reduceAmsRow(row, reducer, fields) {
    fields = fields || {};
    if (!row) return null;
    reducer = reducer || 'single';
    if (reducer === 'mostlyMid') {
      var ml = num(row[fields.mostlyLow || 'mostly_low']);
      var mh = num(row[fields.mostlyHigh || 'mostly_high']);
      if (ml != null && mh != null) return (ml + mh) / 2;
      var lo = num(row[fields.low || 'low_price']);
      var hi = num(row[fields.high || 'high_price']);
      if (lo != null && hi != null) return (lo + hi) / 2;
      return null;
    }
    if (reducer === 'valuePerPound') {
      var d = num(row[fields.dollars || 'dollars']);
      var p = num(row[fields.pounds || 'pounds']);
      return (d != null && p != null && p > 0) ? d / p : null;
    }
    if (reducer === 'wtdAvg') {
      return num(row[fields.price || 'wtd_avg_price']);
    }
    return num(row[fields.price || 'avg_price']);
  }

  // Convert a reported price unit to the composite's base ($ per the ingredient's
  // unit). Cents→dollars and $/cwt→$/lb both scale by 0.01; an unknown/absent
  // unit is left as-is. A wrong factor is caught downstream by the bounds gate.
  function priceUnitFactor(pu) {
    var s = String(pu || '').toLowerCase();
    if (s.indexOf('cent') !== -1) return 0.01;                                       // cents per X → dollars per X
    if (s.indexOf('cwt') !== -1 || s.indexOf('hundredweight') !== -1) return 0.01;   // $/cwt → $/lb (100 lb)
    return 1;
  }

  function normalizeAms(json, meta) {
    meta = meta || {};
    var rows = (json && (json.results || json.report || json.data)) || [];
    var dateField = meta.dateField || 'report_date';
    var commodity = meta.commodity ? String(meta.commodity).toLowerCase() : null;
    var matchFields = Array.isArray(meta.matchFields) ? meta.matchFields : null;
    var factor = priceUnitFactor(meta.priceUnit);
    var rowMatches = function (r) {
      if (!commodity) return true;
      // matchFields restricts the commodity match to named columns (e.g. ["item"]
      // on the National Chicken Report); default scans every string field.
      var keys = matchFields || Object.keys(r);
      for (var i = 0; i < keys.length; i++) {
        var v = r[keys[i]];
        if (typeof v === 'string' && v.toLowerCase().indexOf(commodity) !== -1) return true;
      }
      return false;
    };
    var amsMedian = function (a) {
      if (!a.length) return null;
      var s = a.slice().sort(function (x, y) { return x - y; });
      var m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };
    var byDateMap = {};
    rows.forEach(function (r) {
      if (!r || !rowMatches(r)) return;
      var v = reduceAmsRow(r, meta.reducer, meta.fields);
      if (v != null && isFinite(v)) v = v * factor;                            // unit-normalize before binning
      var date = isoDate(r[dateField]);
      if (date && v != null && isFinite(v)) (byDateMap[date] = byDateMap[date] || []).push(v);
    });
    var points = Object.keys(byDateMap)
      .map(function (d) { return { date: d, value: amsMedian(byDateMap[d]) }; })
      .sort(byDate);
    return { source: meta.source || 'usda-ams', basis: meta.basis || 'wholesale', unit: meta.unit || 'usd', points: points };
  }

  function latestDate(outputs) {
    var d = null;
    (outputs || []).forEach(function (o) {
      ((o && o.points) || []).forEach(function (p) { if (!d || p.date > d) d = p.date; });
    });
    return d;
  }

  function buildCompositeInput(outputs, opts) {
    opts = opts || {};
    var sourceSeries = {};
    var levelObs = [];
    (outputs || []).forEach(function (o) {
      if (!o || !Array.isArray(o.points) || !o.points.length) return;
      sourceSeries[o.source] = { basis: o.basis, values: o.points.map(function (p) { return p.value; }), weight: o.weight, family: o.family };
      if (o.basis !== 'index') {
        var latest = o.points[o.points.length - 1];
        levelObs.push({ source: o.source, basis: o.basis, valueCents: Math.round(latest.value * 100), date: latest.date, family: o.family });
      }
    });
    return { levelObs: levelObs, sourceSeries: sourceSeries, asOf: opts.asOf || latestDate(outputs) };
  }

  var api = {
    isoDate: isoDate,
    normalizeFred: normalizeFred,
    normalizeBls: normalizeBls,
    reduceAmsRow: reduceAmsRow,
    normalizeAms: normalizeAms,
    buildCompositeInput: buildCompositeInput
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostIndexSources = api;
  if (root) root.MuntinCostIndexSources = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
