/**
 * Muntin — Pressure source normalizers.
 *
 * Pure transforms from each FREE public API's raw response → the single number
 * the pressure engine wants: a window % change for one leading indicator. Built
 * dark + fixture-tested so scripts/fetch-pressure-observations.mjs can light the
 * Pressure layer the moment two free keys (USDA NASS + EIA) are provisioned —
 * the same "engine first, keys later" path the Cost Index itself took.
 *
 * Sources covered (all free): USDA NASS Quick Stats, EIA Open Data v2, USDA AMS
 * My Market News (MARS), US Drought Monitor REST, NWS api.weather.gov alerts.
 *
 * No network, no DOM — just parsing + arithmetic, so every branch is testable.
 * Node: module.exports. Browser: window.MuntinPressureSources (unused there).
 */
(function (root) {
  'use strict';

  // "$1,234.5" / "1,234" / 12.3 → number, else null.
  function parseNum(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    if (v == null) return null;
    var n = parseFloat(String(v).replace(/[$,\s]/g, ''));
    return isFinite(n) ? n : null;
  }

  // % change first→last across an oldest→newest numeric series.
  function windowChange(values) {
    var v = (values || []).filter(function (x) { return typeof x === 'number' && isFinite(x); });
    if (v.length < 2) return null;
    var a = v[0], b = v[v.length - 1];
    if (a === 0) return null;
    return (b - a) / Math.abs(a);
  }

  // ---- USDA NASS Quick Stats ----------------------------------------
  // rows: [{ Value, year, reference_period_desc|begin_code, ... }]. Returns the
  // numeric values sorted oldest→newest by (year, period), most-recent `tail`.
  function nassSeries(rows, opts) {
    opts = opts || {};
    var key = opts.valueKey || 'Value';
    var arr = (rows || []).map(function (r) {
      return { v: parseNum(r[key]), y: parseNum(r.year), p: String(r.reference_period_desc || r.begin_code || r.period || '') };
    }).filter(function (r) { return r.v != null; });
    arr.sort(function (a, b) { return (a.y - b.y) || a.p.localeCompare(b.p); });
    var vals = arr.map(function (r) { return r.v; });
    return opts.tail ? vals.slice(-opts.tail) : vals;
  }

  // ---- EIA Open Data v2 ---------------------------------------------
  // json: { response: { data: [{ period, value }] } } (newest-first or oldest).
  function eiaSeries(json, opts) {
    opts = opts || {};
    var data = (json && json.response && json.response.data) || json.data || [];
    var arr = data.map(function (d) { return { v: parseNum(d.value != null ? d.value : d[opts.valueKey]), p: String(d.period || '') }; })
      .filter(function (d) { return d.v != null; });
    arr.sort(function (a, b) { return a.p.localeCompare(b.p); });   // ISO periods sort lexically
    var vals = arr.map(function (d) { return d.v; });
    return opts.tail ? vals.slice(-opts.tail) : vals;
  }

  // ---- USDA AMS My Market News (MARS) -------------------------------
  // rows: report results; pull a numeric `field` per dated row.
  function amsSeries(rows, opts) {
    opts = opts || {};
    var field = opts.field || 'price';
    var dateKey = opts.dateKey || 'report_date';
    var arr = (rows || []).map(function (r) { return { v: parseNum(r[field]), d: String(r[dateKey] || r.report_begin_date || '') }; })
      .filter(function (r) { return r.v != null; });
    arr.sort(function (a, b) { return a.d.localeCompare(b.d); });
    var vals = arr.map(function (r) { return r.v; });
    return opts.tail ? vals.slice(-opts.tail) : vals;
  }

  // ---- US Drought Monitor -------------------------------------------
  // rows: [{ MapDate|ValidStart, D0..D4 }]. Returns a series of the summed
  // SEVERE-area share (default D2+D3+D4), oldest→newest — rising = worse.
  function usdmSeverity(rows, opts) {
    opts = opts || {};
    var cats = opts.categories || ['D2', 'D3', 'D4'];
    var arr = (rows || []).map(function (r) {
      var sum = 0, any = false;
      cats.forEach(function (c) { var n = parseNum(r[c]); if (n != null) { sum += n; any = true; } });
      return { v: any ? sum : null, d: String(r.MapDate || r.ValidStart || r.validStart || '') };
    }).filter(function (r) { return r.v != null; });
    arr.sort(function (a, b) { return a.d.localeCompare(b.d); });
    return arr.map(function (r) { return r.v; });
  }

  // ---- NWS api.weather.gov active alerts ----------------------------
  // geojson: { features: [{ properties: { event, areaDesc } }] }. Returns true
  // if any active alert matches one of `events` in the named `areaMatch` regex.
  function nwsFreezeActive(geojson, opts) {
    opts = opts || {};
    var events = opts.events || ['Freeze Warning', 'Hard Freeze Warning', 'Freeze Watch'];
    var areaRe = opts.areaMatch ? new RegExp(opts.areaMatch, 'i') : null;
    var feats = (geojson && geojson.features) || [];
    for (var i = 0; i < feats.length; i++) {
      var p = (feats[i] && feats[i].properties) || {};
      if (events.indexOf(p.event) < 0) continue;
      if (areaRe && !areaRe.test(String(p.areaDesc || ''))) continue;
      return true;
    }
    return false;
  }

  // An active event encoded as a change the engine will read as a +1 signal.
  function eventSignal(active) { return active ? 1 : 0; }

  var api = {
    parseNum: parseNum, windowChange: windowChange,
    nassSeries: nassSeries, eiaSeries: eiaSeries, amsSeries: amsSeries,
    usdmSeverity: usdmSeverity, nwsFreezeActive: nwsFreezeActive, eventSignal: eventSignal
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinPressureSources = api;
  if (root) root.MuntinPressureSources = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
