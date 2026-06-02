/**
 * Muntin — Cost Index source adapters (PURE normalizers).
 *
 * The seam between raw upstream API payloads and the composite engine
 * (tools/_shared/composite-price.js). Each public source speaks a
 * different dialect (FRED observations, BLS v2 series, USDA AMS report
 * rows); these functions translate each into the ONE shape the engine
 * consumes, separating the pure `normalize*()` (unit-testable on
 * fixtures, no network) from the impure fetch (which lives in the
 * CI/prod build worker and imports these). That separation is the
 * whole point: a source changing its JSON shape is caught by a fixture
 * test here, never silently poisoning the index.
 *
 * Adapter output shape: { source, basis, unit, points: [{date,value}] }
 *   - basis 'index'  → value is a unitless index number (TREND only).
 *   - basis 'wholesale'|'delivered'|'retail' → value is USD per unit
 *     (LEVEL: converted to cents downstream).
 *   - points are ordered oldest→newest.
 *
 * Pure, no network, no LLM. Browser: window.MuntinCostIndexSources.
 * Node: module.exports.
 */
(function (root) {
  'use strict';

  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }

  // 'MM/DD/YYYY' | 'YYYY-MM-DD' | Date-ish → 'YYYY-MM-DD' (or null).
  function isoDate(d) {
    if (!d) return null;
    var s = String(d).trim();
    var ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) return ymd[1] + '-' + ymd[2] + '-' + ymd[3];
    var mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (mdy) return mdy[3] + '-' + ('0' + mdy[1]).slice(-2) + '-' + ('0' + mdy[2]).slice(-2);
    return null;
  }

  /** FRED: { observations: [{ date:'YYYY-MM-DD', value:'123.4' | '.' }] }.
   *  '.' is FRED's missing-value marker — dropped, never zeroed. */
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

  /** BLS v2: { Results: { series: [{ data: [{ year, period:'M01'..'M12'|'M13', value }] }] } }.
   *  'M13' is the annual average — skipped so it can't double-count. */
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

  /** Strip currency/whitespace → number, or null. */
  function num(s) {
    if (typeof s === 'number') return isFinite(s) ? s : null;
    if (s == null) return null;
    var n = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : null;
  }

  /**
   * Collapse one USDA AMS report row to a single deterministic number.
   * AMS reports prices as RANGES, not points, so the reducer is part of
   * the mapping config (data/cost-index-sources.json):
   *   - 'mostlyMid'    → midpoint of mostly_low..mostly_high (fallback
   *                      low_price..high_price). The standard wholesale read.
   *   - 'valuePerPound'→ dollars / pounds (for value+quantity reports, e.g. NOAA-style).
   *   - 'single'       → a single named field (fields.price | 'avg_price').
   * Returns null when the needed fields are missing (row is then dropped,
   * never guessed).
   */
  function reduceAmsRow(row, reducer, fields) {
    if (!row) return null;
    fields = fields || {};
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
    return num(row[fields.price || 'avg_price']);
  }

  /** USDA AMS Market News report rows. Format varies by report, so the
   *  reducer + field names are configurable (per the mapping file). */
  function normalizeAms(json, meta) {
    meta = meta || {};
    var rows = (json && (json.results || json.report || json.data)) || [];
    var dateField = meta.dateField || 'report_date';
    var points = rows.map(function (r) {
      if (!r) return null;
      var v = reduceAmsRow(r, meta.reducer, meta.fields);
      var date = isoDate(r[dateField]);
      return (date && v != null && isFinite(v)) ? { date: date, value: v } : null;
    }).filter(Boolean).sort(byDate);
    return { source: meta.source || 'usda-ams', basis: meta.basis || 'wholesale', unit: meta.unit || 'usd', points: points };
  }

  function latestDate(outputs) {
    var d = null;
    (outputs || []).forEach(function (o) {
      (o && o.points || []).forEach(function (p) { if (!d || p.date > d) d = p.date; });
    });
    return d;
  }

  /**
   * Fold normalized adapter outputs into the composite engine's input.
   * - sourceSeries[source] = { basis, values:[oldest..newest] } (TREND, all sources).
   * - levelObs = latest point of each NON-index source → { valueCents } (LEVEL).
   * Returns { levelObs, sourceSeries, asOf } ready for MuntinComposite.assess().
   */
  function buildCompositeInput(outputs, opts) {
    opts = opts || {};
    var sourceSeries = {}, levelObs = [];
    (outputs || []).forEach(function (o) {
      if (!o || !Array.isArray(o.points) || !o.points.length) return;
      sourceSeries[o.source] = { basis: o.basis, values: o.points.map(function (p) { return p.value; }), weight: o.weight };
      if (o.basis !== 'index') {
        var latest = o.points[o.points.length - 1];
        levelObs.push({ source: o.source, basis: o.basis, valueCents: Math.round(latest.value * 100), date: latest.date });
      }
    });
    return { levelObs: levelObs, sourceSeries: sourceSeries, asOf: opts.asOf || latestDate(outputs) };
  }

  var api = {
    isoDate: isoDate,
    normalizeFred: normalizeFred,
    normalizeBls: normalizeBls,
    normalizeAms: normalizeAms,
    reduceAmsRow: reduceAmsRow,
    buildCompositeInput: buildCompositeInput
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostIndexSources = api;
  if (root) root.MuntinCostIndexSources = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
