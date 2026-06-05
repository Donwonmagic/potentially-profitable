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
    return { source: meta.source || 'fred', basis: meta.basis || 'index', unit: meta.unit || null, points: points };
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

  /** First non-empty field value among a list of candidate keys (field
   *  aliases — different AMS reports name the same column differently:
   *  mostly_low_price vs mostly_low). Returns null when none is present. */
  function pickField(row, keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k && row[k] != null && row[k] !== '') return row[k];
    }
    return null;
  }

  /**
   * Price-unit awareness. AMS varies the price unit PER REPORT: the National
   * Chicken Report quotes "Cents Per Lb" (so 145.72 means $1.4572/lb), while the
   * terminal produce reports quote dollars per package. Read the row's price_unit
   * so a cents value never reaches the engine wearing a dollars costume — the
   * exact bug that made $1.46/lb breast look like $145/lb and get hard-rejected.
   * Returns { scale } (cents→dollars) and { unit } (lb/dozen/cwt when stated).
   */
  function priceMeta(row, fields) {
    // The LMR Datamart omits a price_unit field but quotes $/cwt — so a spec can
    // declare `unitFallback` (e.g. "Dollars Per Cwt") used when the row is silent.
    var pu = String((row && row[(fields && fields.priceUnit) || 'price_unit']) || (fields && fields.unitFallback) || '').toLowerCase();
    var perCwt = /cwt|hundredweight/.test(pu);             // LMR boxed-beef/pork quote $/cwt → ÷100 for $/lb
    var scale = (/cent/.test(pu) ? 0.01 : 1) * (perCwt ? 0.01 : 1);   // cents→dollars and/or cwt→lb
    var unit = (perCwt || /lb|pound/.test(pu)) ? 'lb'
      : (/dozen|\bdoz\b/.test(pu) ? 'dozen' : null);        // null = unit not stated (e.g. produce per-package)
    return { scale: scale, unit: unit };
  }

  /** Midpoint of the "mostly" band, falling back to the full low/high range.
   *  Field aliases: terminal reports use mostly_low_price/mostly_high_price (the
   *  _price suffix); others use mostly_low/mostly_high. Returns null if absent. */
  function bandMid(row, fields) {
    var ml = num(pickField(row, [fields.mostlyLow, 'mostly_low_price', 'mostly_low']));
    var mh = num(pickField(row, [fields.mostlyHigh, 'mostly_high_price', 'mostly_high']));
    if (ml != null && mh != null) return (ml + mh) / 2;
    var lo = num(pickField(row, [fields.low, 'low_price', 'price_range_low', 'low']));   // price_range_low = LMR
    var hi = num(pickField(row, [fields.high, 'high_price', 'price_range_high', 'high']));
    if (lo != null && hi != null) return (lo + hi) / 2;
    return null;
  }

  /**
   * Collapse one USDA AMS report row to a single deterministic number, in
   * DOLLARS (cents auto-converted via price_unit). Reducer is mapping config:
   *   - 'wtdAvg'       → the volume-weighted average (wtd_avg_price) when the
   *                      report carries it (the most honest single number),
   *                      else the band midpoint. Use for the chicken report.
   *   - 'mostlyMid'    → midpoint of the mostly band (fallback low/high). The
   *                      standard terminal-report read.
   *   - 'valuePerPound'→ dollars / pounds (value+quantity reports, NOAA-style).
   *   - 'single'       → a single named field (fields.price | 'avg_price').
   * Returns null when the needed fields are missing (row dropped, never guessed).
   */
  function reduceAmsRow(row, reducer, fields) {
    if (!row) return null;
    fields = fields || {};
    reducer = reducer || 'single';
    var raw;
    if (reducer === 'wtdAvg') {
      raw = num(pickField(row, [fields.wtdAvg, 'wtd_avg_price', 'weighted_average', 'avg_price']));
      if (raw == null) raw = bandMid(row, fields);
    } else if (reducer === 'mostlyMid') {
      raw = bandMid(row, fields);
    } else if (reducer === 'valuePerPound') {
      var d = num(row[fields.dollars || 'dollars']);
      var p = num(row[fields.pounds || 'pounds']);
      raw = (d != null && p != null && p > 0) ? d / p : null;
    } else {
      raw = num(row[fields.price || 'avg_price']);
    }
    return raw == null ? null : raw * priceMeta(row, fields).scale;
  }

  /** USDA AMS Market News report rows. Format varies by report, so the
   *  reducer + field names are configurable (per the mapping file).
   *  meta.commodity (string) filters a MULTI-commodity report (e.g. a terminal
   *  "Vegetables" report holding lettuce, tomatoes, peppers) down to the rows
   *  for one ingredient — matched field-agnostically against any string value
   *  in the row. Surviving rows are grouped by date (median per date), so one
   *  market yields one clean series. */
  function _amsMedian(a) {
    if (!a.length) return null;
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function normalizeAms(json, meta) {
    meta = meta || {};
    var rows = (json && (json.results || json.report || json.data)) || [];
    var dateField = meta.dateField || 'report_date';
    var commodity = meta.commodity ? String(meta.commodity).toLowerCase() : null;
    // Match the commodity in DESCRIPTIVE fields only — not every string. The old
    // field-agnostic scan also hit region="National", price_unit, office names,
    // grades, so a term could match noise. Override with meta.matchFields.
    // Field names match CASE-INSENSITIVELY — LMR uses "Item_Description", MARS
    // uses "item"/"commodity". Override the set with meta.matchFields.
    var matchFields = (meta.matchFields || ['commodity', 'item', 'item_description', 'cut', 'description', 'variety', 'class', 'grade', 'category', 'primal'])
      .map(function (s) { return String(s).toLowerCase(); });
    function rowMatches(r) {
      if (!commodity) return true;
      for (var k in r) {
        if (!Object.prototype.hasOwnProperty.call(r, k)) continue;
        if (matchFields.indexOf(k.toLowerCase()) === -1) continue;
        var v = r[k];
        if (typeof v === 'string' && v.toLowerCase().indexOf(commodity) !== -1) return true;
      }
      return false;
    }
    // Thread a per-source price-unit fallback (LMR omits the field but is $/cwt).
    var f = Object.assign({}, meta.fields, meta.priceUnit ? { unitFallback: meta.priceUnit } : {});
    var byDate = {}, detectedUnit = null;
    rows.forEach(function (r) {
      if (!r || !rowMatches(r)) return;
      var v = reduceAmsRow(r, meta.reducer, f);
      var date = isoDate(r[dateField]);
      if (date && v != null && isFinite(v) && v > 0) {
        (byDate[date] = byDate[date] || []).push(v);
        if (!detectedUnit) detectedUnit = priceMeta(r, f).unit;   // carry the real unit so the quality gate can catch a flip
      }
    });
    var points = Object.keys(byDate).map(function (d) { return { date: d, value: _amsMedian(byDate[d]) }; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return { source: meta.source || 'usda-ams', basis: meta.basis || 'wholesale', unit: detectedUnit || meta.unit || null, points: points };
  }

  var KG_PER_LB = 2.2046226218;

  /**
   * NOAA Fisheries trade_data (ORDS) → an import UNIT VALUE per month.
   * Because most US shrimp/salmon is imported, customs value÷volume is a
   * landed/wholesale-ADJACENT proxy (NOT delivered, NOT retail) — labeled as such.
   * Aggregation differs from a price report: we SUM dollars and SUM kilos across
   * all matching import rows in a month, then divide (a volume-weighted unit
   * value), and convert $/kg → $/lb. meta.commodity matches the species in the
   * descriptive fields; export rows are excluded. Returns one point per month.
   */
  function normalizeNoaaTrade(json, meta) {
    meta = meta || {};
    var rows = (json && (json.items || json.results || json.data)) || [];
    var commodity = meta.commodity ? String(meta.commodity).toLowerCase() : null;
    var nameFields = (meta.matchFields || ['name', 'hts_description', 'product', 'products', 'commodity_name', 'description'])
      .map(function (s) { return String(s).toLowerCase(); });
    var htsPrefix = meta.hts ? String(meta.hts) : null;
    var tradeField = meta.tradeField || 'source';   // NOAA trade_data flags direction in `source` = "IMP" / "EXP"

    function isImport(r) {
      // Direction is the abbreviated `source` field ("IMP"/"EXP") — NOT the word
      // "export", so we must match the code, or exports silently inflate the value.
      var tt = String((r[tradeField] != null ? r[tradeField] : '')).trim().toUpperCase();
      if (tt) return tt === 'IMP' || tt === 'IMPORT' || tt.indexOf('IMP') === 0;
      return true;   // no direction field → assume the query scoped to imports
    }
    function matches(r) {
      if (htsPrefix) { var h = String(r.hts_number || r.hts || r.hts_code || ''); if (h.indexOf(htsPrefix) === 0) return true; }
      if (!commodity) return !htsPrefix;   // no filter → all (only if no hts either)
      for (var i = 0; i < nameFields.length; i++) {
        for (var k in r) {
          if (!Object.prototype.hasOwnProperty.call(r, k)) continue;
          if (k.toLowerCase() !== nameFields[i]) continue;
          var v = r[k];
          if (typeof v === 'string' && v.toLowerCase().indexOf(commodity) !== -1) return true;
        }
      }
      return false;
    }

    var byPeriod = {};
    rows.forEach(function (r) {
      if (!r || !isImport(r) || !matches(r)) return;
      var kilos = num(pickField(r, ['kilos', 'kg', 'volume', 'quantity']));
      var val = num(pickField(r, ['val', 'value', 'dollars', 'value_usd']));
      if (kilos == null || val == null || kilos <= 0) return;
      var y = r.year != null ? r.year : (r.yr != null ? r.yr : null);
      var mo = r.month != null ? r.month : (r.mo != null ? r.mo : null);
      if (y == null) return;
      var key = mo != null ? (y + '-' + ('0' + mo).slice(-2)) : (y + '-01');   // month if present, else year
      var b = byPeriod[key] || (byPeriod[key] = { val: 0, kg: 0 });
      b.val += val; b.kg += kilos;
    });
    var points = Object.keys(byPeriod).sort().map(function (k) {
      var b = byPeriod[k];
      return { date: k + '-01', value: (b.val / b.kg) / KG_PER_LB };   // $/kg → $/lb
    });
    return { source: meta.source || 'noaa', basis: meta.basis || 'wholesale', unit: meta.unit || 'lb', points: points };
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
      sourceSeries[o.source] = { basis: o.basis, values: o.points.map(function (p) { return p.value; }), weight: o.weight, family: o.family, type: o.type };
      // A non-index source contributes a LEVEL only if it's level-eligible — a
      // STALE source still feeds the trend (its history is real) but must NOT
      // anchor a current level. levelEligible:false (set by the composer for
      // stale obs) keeps a discontinued/lagging series out of the level.
      if (o.basis !== 'index' && o.levelEligible !== false) {
        var latest = o.points[o.points.length - 1];
        levelObs.push({ source: o.source, basis: o.basis, valueCents: Math.round(latest.value * 100), date: latest.date, family: o.family, type: o.type, unit: o.unit });
      }
    });
    return { levelObs: levelObs, sourceSeries: sourceSeries, asOf: opts.asOf || latestDate(outputs) };
  }

  var api = {
    isoDate: isoDate,
    normalizeFred: normalizeFred,
    normalizeBls: normalizeBls,
    normalizeAms: normalizeAms,
    normalizeNoaaTrade: normalizeNoaaTrade,
    reduceAmsRow: reduceAmsRow,
    buildCompositeInput: buildCompositeInput
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCostIndexSources = api;
  if (root) root.MuntinCostIndexSources = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
