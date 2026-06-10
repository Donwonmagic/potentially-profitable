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
  // rows: [{ Value, year, begin_code, reference_period_desc, ... }]. Returns the
  // numeric values sorted oldest→newest, most-recent `tail`.
  //
  // Ordering key is the NUMERIC `begin_code` (week# 1–52 or month# 1–12), NOT the
  // human `reference_period_desc`. That label does not sort chronologically:
  // lexically "WEEK #20" < "WEEK #9" (the "2" beats the "9"), and "MAY" < "MARCH"
  // alphabetically — both wrong. NASS always returns begin_code; we lean on it and
  // fall back to the period string only when it is somehow absent.
  function nassSeries(rows, opts) {
    opts = opts || {};
    var key = opts.valueKey || 'Value';
    var arr = (rows || []).map(function (r) {
      return { v: parseNum(r[key]), y: parseNum(r.year), c: parseNum(r.begin_code), p: String(r.reference_period_desc || r.period || '') };
    }).filter(function (r) { return r.v != null; });
    arr.sort(function (a, b) {
      if ((a.y || 0) !== (b.y || 0)) return (a.y || 0) - (b.y || 0);
      if (a.c != null && b.c != null && a.c !== b.c) return a.c - b.c;
      return a.p.localeCompare(b.p);
    });
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
    // One MARS report carries every commodity; keep only the rows for this spec's
    // commodity (server-side `q` should already narrow it, but filter defensively
    // so a shared report can't bleed onion volume into the tomato series).
    var comKey = opts.commodityKey || 'commodity';
    var com = opts.commodity ? String(opts.commodity).toUpperCase() : null;
    var arr = (rows || []).filter(function (r) {
      return !com || String((r && r[comKey]) || '').toUpperCase().indexOf(com) >= 0;
    }).map(function (r) { return { v: parseNum(r[field]), d: String(r[dateKey] || r.report_begin_date || r.report_end_date || '') }; })
      .filter(function (r) { return r.v != null; });
    arr.sort(function (a, b) { return a.d.localeCompare(b.d); });
    var vals = arr.map(function (r) { return r.v; });
    return opts.tail ? vals.slice(-opts.tail) : vals;
  }

  // ---- US Drought Monitor -------------------------------------------
  // rows: [{ MapDate|ValidStart, D0..D4 }]. Returns a series of the summed
  // SEVERE-area share (default D2+D3+D4), oldest→newest — rising = worse.
  //
  // Multi-area specs (aoi=06,04 → CA+AZ) return one row per state per date; we
  // collapse to one point per date by AVERAGING the states' severe shares, so the
  // window % change reads a single regional trend and not an interleaved
  // two-state zig-zag. Single-area is the degenerate case (one row per date).
  function usdmSeverity(rows, opts) {
    opts = opts || {};
    // The USDM JSON capitalizes inconsistently across endpoints (MapDate vs
    // mapDate, D2 vs d2). Match keys case-insensitively so the share series
    // builds regardless of which casing the service returns.
    var cats = (opts.categories || ['D2', 'D3', 'D4']).map(function (c) { return c.toLowerCase(); });
    var byDate = {};
    (rows || []).forEach(function (r) {
      if (!r || typeof r !== 'object') return;
      var lc = {}; Object.keys(r).forEach(function (k) { lc[k.toLowerCase()] = r[k]; });
      var sum = 0, any = false;
      cats.forEach(function (c) { var n = parseNum(lc[c]); if (n != null) { sum += n; any = true; } });
      if (!any) return;
      var d = String(lc.mapdate || lc.validstart || lc.validend || '');
      (byDate[d] = byDate[d] || []).push(sum);
    });
    var series = Object.keys(byDate).sort(function (a, b) { return a.localeCompare(b); })
      .map(function (d) { var a = byDate[d]; return a.reduce(function (s, x) { return s + x; }, 0) / a.length; });
    // Honor `tail` like every other source: change over the recent N readings,
    // NOT the full ~5-month fetch window (which exploded a low-base drought into
    // a 337% "change"). USDM is weekly, so tail:5 ≈ a 5-week window.
    return opts.tail ? series.slice(-opts.tail) : series;
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

  // ---- AMS produce MOVEMENT aggregate -------------------------------
  // Rows pooled from EVERY active Daily Movement city report (one report carries
  // many commodities; many rows per day per origin/mode). For one commodity it
  // builds three WEEKLY signals — national volume, import share, and YoY pace —
  // so the produce panel reads supply the way the meat panels read cold storage.
  //   rows: [{ '1 lb units', 'import/Export', report_begin_date, commodity, ... }]
  //   opts: { commodity, commodityExact, volumeField, commodityKey, dateField, tail }
  // Returns { volume:[weekly lbs], importShare:[weekly 0..1], pace:Δ|null, weeks:N }.
  function movementAggregate(rows, opts) {
    opts = opts || {};
    var vol = opts.volumeField || '1 lb units';
    var dateField = opts.dateField || 'report_begin_date';
    var comKey = opts.commodityKey || 'commodity';
    var com = opts.commodity ? String(opts.commodity).toUpperCase() : null;
    var exact = !!opts.commodityExact;
    var tail = opts.tail || 6;
    var WEEK = 7 * 864e5;
    function wkKey(s) { var m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); if (!m) return null; return Math.floor(Date.UTC(+m[3], +m[1] - 1, +m[2]) / WEEK); }
    function isImport(r) { return /^\s*i/i.test(String(r['import/Export'] || r.import_export || '')); }
    var byWeek = {};
    (rows || []).forEach(function (r) {
      if (!r) return;
      var cu = String(r[comKey] || '').toUpperCase();
      if (com && (exact ? cu !== com : cu.indexOf(com) < 0)) return;
      var v = parseNum(r[vol]); if (v == null) return;
      var wk = wkKey(r[dateField]); if (wk == null) return;
      var b = byWeek[wk] || (byWeek[wk] = { total: 0, imp: 0 });
      b.total += v; if (isImport(r)) b.imp += v;
    });
    var weeks = Object.keys(byWeek).map(Number).sort(function (a, b) { return a - b; });
    var volSeries = weeks.map(function (w) { return byWeek[w].total; });
    var impSeries = weeks.map(function (w) { return byWeek[w].total > 0 ? byWeek[w].imp / byWeek[w].total : 0; });
    // YoY pace: trailing 4 weeks now vs the same 4 weeks ~52 weeks back (a window,
    // not one week, so a single missing report can't swing it). null if either
    // side is absent — pace just doesn't emit rather than inventing a number.
    var pace = null;
    if (weeks.length) {
      var last = weeks[weeks.length - 1];
      var range = function (lo, hi) { var s = 0, n = 0; weeks.forEach(function (w) { if (w >= lo && w <= hi) { s += byWeek[w].total; n++; } }); return n ? s : null; };
      var now4 = range(last - 3, last), prev4 = range(last - 55, last - 52);
      if (now4 != null && prev4 != null && prev4 > 0) pace = now4 / prev4 - 1;
    }
    return { volume: tail ? volSeries.slice(-tail) : volSeries, importShare: tail ? impSeries.slice(-tail) : impSeries, pace: pace, weeks: weeks.length };
  }

  var api = {
    parseNum: parseNum, windowChange: windowChange,
    nassSeries: nassSeries, eiaSeries: eiaSeries, amsSeries: amsSeries,
    usdmSeverity: usdmSeverity, nwsFreezeActive: nwsFreezeActive, eventSignal: eventSignal,
    movementAggregate: movementAggregate
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinPressureSources = api;
  if (root) root.MuntinPressureSources = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
