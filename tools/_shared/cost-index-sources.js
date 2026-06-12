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

  // Look up a row value by field name(s). `name` may be a STRING or an ARRAY of
  // fallback names (try each until one is present) — report column spellings vary
  // and are sometimes only confirmable live, so a spec can list candidates.
  function pickField(row, name, dflt) {
    var list = Array.isArray(name) ? name : (name != null ? [name] : []);
    if (dflt != null) list = list.concat([dflt]);
    for (var i = 0; i < list.length; i++) {
      var v = row[list[i]];
      if (v != null && v !== '') return v;
    }
    return undefined;
  }
  function reduceAmsRow(row, reducer, fields) {
    fields = fields || {};
    if (!row) return null;
    reducer = reducer || 'single';
    if (reducer === 'mostlyMid') {
      var ml = num(pickField(row, fields.mostlyLow, 'mostly_low'));
      var mh = num(pickField(row, fields.mostlyHigh, 'mostly_high'));
      if (ml != null && mh != null) return (ml + mh) / 2;
      var lo = num(pickField(row, fields.low, 'low_price'));
      var hi = num(pickField(row, fields.high, 'high_price'));
      if (lo != null && hi != null) return (lo + hi) / 2;
      return null;
    }
    if (reducer === 'valuePerPound') {
      var d = num(pickField(row, fields.dollars, 'dollars'));
      var p = num(pickField(row, fields.pounds, 'pounds'));
      return (d != null && p != null && p > 0) ? d / p : null;
    }
    if (reducer === 'wtdAvg') {
      return num(pickField(row, fields.price, 'wtd_avg_price'));
    }
    return num(pickField(row, fields.price, 'avg_price'));
  }

  // The reported low–high band for ONE row (terminal market). Prefer the full
  // low_price..high_price (the complete trading range); fall back to the
  // mostly_low..mostly_high typical-trade range. Returns null unless both ends
  // are present and ordered — a measured band must bracket, never invert.
  function amsRowSpread(row, fields) {
    fields = fields || {};
    var lo = num(pickField(row, fields.low, 'low_price'));
    var hi = num(pickField(row, fields.high, 'high_price'));
    if (lo == null || hi == null) {
      lo = num(pickField(row, fields.mostlyLow, 'mostly_low'));
      hi = num(pickField(row, fields.mostlyHigh, 'mostly_high'));
    }
    if (lo == null || hi == null || hi < lo) return null;
    return { lo: lo, hi: hi };
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
    var exact = !!meta.commodityExact;   // EQUALS, not contains — e.g. eggs "Large" must not catch "Extra Large"
    var factor = priceUnitFactor(meta.priceUnit);
    var rowMatches = function (r) {
      if (!commodity) return true;
      // matchFields restricts the commodity match to named columns (e.g. ["item"]
      // on the National Chicken Report); default scans every string field.
      var keys = matchFields || Object.keys(r);
      for (var i = 0; i < keys.length; i++) {
        var v = r[keys[i]];
        if (typeof v !== 'string') continue;
        var lv = v.toLowerCase().trim();
        if (exact ? lv === commodity : lv.indexOf(commodity) !== -1) return true;
      }
      return false;
    };
    var amsMedian = function (a) {
      if (!a.length) return null;
      var s = a.slice().sort(function (x, y) { return x - y; });
      var m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };
    // Optional multi-field filter for granular reports (e.g. shell eggs:
    // class=Large, color=White, environment=Caged) — EVERY pair must match
    // (case-insensitive equals), isolating one product instead of blending.
    var filters = (meta.filters && typeof meta.filters === 'object') ? meta.filters : null;
    var filtersMatch = function (r) {
      if (!filters) return true;
      for (var k in filters) if (Object.prototype.hasOwnProperty.call(filters, k)) {
        var want = String(filters[k]).toLowerCase().trim();
        var got = (r[k] == null ? '' : String(r[k])).toLowerCase().trim();
        if (got !== want) return false;
      }
      return true;
    };
    var byDateMap = {};
    var spreadByDate = {};   // date → { lo: min reported low, hi: max reported high } across markets
    rows.forEach(function (r) {
      if (!r || !rowMatches(r) || !filtersMatch(r)) return;
      var v = reduceAmsRow(r, meta.reducer, meta.fields);
      var sp = amsRowSpread(r, meta.fields);
      // Prefer the row's OWN reported unit (priceUnitField) over a fixed
      // meta.priceUnit — removes the cents-vs-dollars guess for mixed reports.
      var f = meta.priceUnitField ? priceUnitFactor(r[meta.priceUnitField]) : factor;
      if (v != null && isFinite(v)) v = v * f;                                 // unit-normalize before binning
      var date = isoDate(r[dateField]);
      if (date && v != null && isFinite(v)) (byDateMap[date] = byDateMap[date] || []).push(v);
      // Same unit-normalization for the measured band; widen across markets.
      if (date && sp && isFinite(sp.lo) && isFinite(sp.hi)) {
        var slo = sp.lo * f, shi = sp.hi * f;
        var cur = spreadByDate[date];
        spreadByDate[date] = cur
          ? { lo: Math.min(cur.lo, slo), hi: Math.max(cur.hi, shi) }
          : { lo: slo, hi: shi };
      }
    });
    var points = Object.keys(byDateMap)
      .map(function (d) {
        var pt = { date: d, value: amsMedian(byDateMap[d]) };
        if (spreadByDate[d]) { pt.lo = spreadByDate[d].lo; pt.hi = spreadByDate[d].hi; }
        return pt;
      })
      .sort(byDate);
    return { source: meta.source || 'usda-ams', basis: meta.basis || 'wholesale', unit: meta.unit || 'usd', points: points };
  }

  // EIA API v2: rows at json.response.data[]; period is 'YYYY-MM' (monthly) or
  // 'YYYY' (annual); the value column is meta.value (e.g. 'price', a STRING since
  // 2024) and units live under 'price-units'. Recent months can be null → skip.
  // Drivers only — basis 'index' (an energy direction signal, never a $ level).
  function normalizeEia(json, meta) {
    meta = meta || {};
    var rows = (json && json.response && json.response.data) || [];
    var valueCol = meta.value || 'price';
    var points = rows.map(function (r) {
      if (!r) return null;
      var raw = r[valueCol];
      var v = (raw == null) ? null : parseFloat(raw);
      var p = String(r.period || '');
      var date = /^\d{4}-\d{2}$/.test(p) ? p + '-01' : (/^\d{4}$/.test(p) ? p + '-01-01' : isoDate(p));
      return (date && v != null && isFinite(v)) ? { date: date, value: v } : null;
    }).filter(Boolean).sort(byDate);
    return { source: meta.source || 'eia', basis: meta.basis || 'index', unit: meta.unit || 'index', points: points };
  }

  // NOAA Fisheries FOSS trade_data: { items:[ {year, month(1-12), name(UPPER),
  // hts_number(10-digit), source:'IMP'|'EXP'|'RE-EXP', val(USD customs), kilos} ] }.
  // No price field — compute a volume-weighted monthly IMPORT unit value:
  // sum(val)/sum(kilos) → $/kg → $/lb (÷2.20462). Filter to imports of the
  // commodity by HTS prefix (+ optional name guard). basis is per-spec: salmon
  // fillet 'wholesale' (a conservative landed-adjacent level, inside bounds);
  // shrimp 'index' (import value runs below a usable wholesale price → trend only).
  function normalizeNoaaTrade(json, meta) {
    meta = meta || {};
    var items = (json && (json.items || json.results || json.data)) || [];
    var htsPrefixes = Array.isArray(meta.hts) ? meta.hts.map(String) : (meta.hts ? [String(meta.hts)] : null);
    var nameRe = meta.nameMatch ? new RegExp(meta.nameMatch, 'i') : null;
    var pad2 = function (n) { n = String(n); return n.length < 2 ? '0' + n : n; };
    var matches = function (r) {
      if (String(r.source || '').toUpperCase() !== 'IMP') return false;                 // imports only
      if (meta.edibleOnly && String(r.edible_code || '').toUpperCase() !== 'E') return false;
      var hts = String(r.hts_number || '');
      if (htsPrefixes && !htsPrefixes.some(function (p) { return hts.indexOf(p) === 0; })) return false;
      if (nameRe && !nameRe.test(String(r.name || ''))) return false;
      return true;
    };
    var acc = {};
    items.forEach(function (r) {
      if (!r || !matches(r)) return;
      if (r.year == null || r.month == null) return;
      var key = String(r.year) + '-' + pad2(r.month);
      var val = num(r.val), kilos = num(r.kilos);
      if (val == null || kilos == null || kilos <= 0) return;
      var a = acc[key] || (acc[key] = { val: 0, kilos: 0 });
      a.val += val; a.kilos += kilos;
    });
    var points = Object.keys(acc).map(function (key) {
      return { date: key + '-01', value: (acc[key].val / acc[key].kilos) / 2.20462 };   // $/kg → $/lb
    }).sort(byDate);
    return { source: meta.source || 'noaa', basis: meta.basis || 'wholesale', unit: meta.unit || 'lb', points: points };
  }

  function latestDate(outputs) {
    var d = null;
    (outputs || []).forEach(function (o) {
      ((o && o.points) || []).forEach(function (p) { if (!d || p.date > d) d = p.date; });
    });
    return d;
  }

  // Weekly-resampled tail (last value per ISO-ish week, last n weeks, in cents) —
  // feeds composite-price's rolling-MAD band. Resampling first so daily
  // autocorrelation can't shrink the deviation and understate the band.
  function weeklyTail(points, n) {
    var pts = (points || []).filter(function (p) { return p && isFinite(Date.parse(p.date)) && typeof p.value === 'number'; })
      .slice().sort(function (a, b) { return Date.parse(a.date) - Date.parse(b.date); });
    var byWeek = {};
    pts.forEach(function (p) { byWeek[Math.floor(Date.parse(p.date) / (7 * 86400000))] = p.value; });
    var keys = Object.keys(byWeek).map(Number).sort(function (a, b) { return a - b; });
    if (n && keys.length > n) keys = keys.slice(keys.length - n);
    return keys.map(function (wk) { return Math.round(byWeek[wk] * 100); });
  }

  function buildCompositeInput(outputs, opts) {
    opts = opts || {};
    var sourceSeries = {};
    var levelObs = [];
    (outputs || []).forEach(function (o) {
      if (!o || !Array.isArray(o.points) || !o.points.length) return;
      sourceSeries[o.source] = { basis: o.basis, values: o.points.map(function (p) { return p.value; }), weight: o.weight, family: o.family, type: o.type };
      if (o.basis !== 'index') {
        var latest = o.points[o.points.length - 1];
        var obsRow = { source: o.source, basis: o.basis, valueCents: Math.round(latest.value * 100), date: latest.date, family: o.family, type: o.type, recent: weeklyTail(o.points, 8) };
        // Carry the latest day's measured low–high band (cents) so compositeLevel
        // can widen the range to the real reported spread, not just volatility.
        if (typeof latest.lo === 'number' && typeof latest.hi === 'number' && isFinite(latest.lo) && isFinite(latest.hi)) {
          obsRow.spreadCents = { lo: Math.round(latest.lo * 100), hi: Math.round(latest.hi * 100) };
        }
        levelObs.push(obsRow);
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
    normalizeEia: normalizeEia,
    normalizeNoaaTrade: normalizeNoaaTrade,
    buildCompositeInput: buildCompositeInput
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostIndexSources = api;
  if (root) root.MuntinCostIndexSources = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
