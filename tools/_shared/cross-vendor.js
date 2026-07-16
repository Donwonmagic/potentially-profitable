/**
 * Shared cross-vendor compare (Wave 10.13).
 *
 * Audit-flagged for cross-tool reuse: MID_SKU_HISTORY.compareAcrossVendors
 * (in invoice-decoder/sku-history.js) is invoice-decoder-private today.
 * Plate Cost's vendor-swap simulator needs the same logic without
 * load-coupling against invoice-decoder modules.
 *
 * This module reads MuntinContext.skuHistory directly — same data
 * source — and exposes the same per-vendor-median projection.
 *
 * Returns sorted ascending by median price; cheapest first. null when
 * fewer than 2 vendors meet the ≥3-sample bar.
 */
(function (root) {
  'use strict';

  function _ctx() {
    if (typeof root !== 'undefined' && root && root.MuntinContext) return root.MuntinContext;
    if (typeof require !== 'undefined') {
      try { return require('./context-bus.js'); } catch (_) { return null; }
    }
    return null;
  }
  function _stem() {
    if (typeof root !== 'undefined' && root && root.MuntinStem) return root.MuntinStem;
    if (typeof require !== 'undefined') {
      try { return require('./stem.js'); } catch (_) { return null; }
    }
    return null;
  }

  // Parity with apps/api cross-vendor.ts: only compare prices from the same
  // recent period so a market move can't masquerade as a vendor markup. (The
  // storefront skuHistory carries no currency, so the currency guard the TS port
  // adds has no analogue here; everything else mirrors.)
  var CONTEMPORANEITY_WINDOW_MS = 120 * 24 * 60 * 60 * 1000;
  // How far apart two vendors' buying periods may sit and still compare — a
  // vendor SWITCH produces disjoint-but-adjacent clusters, so a bounded gap
  // (not literal overlap) is required. Parity with cross-vendor.ts.
  var MAX_INTERVENDOR_GAP_MS = 45 * 24 * 60 * 60 * 1000;

  function compare(rowOrName) {
    var ctx = _ctx();
    var stem = _stem();
    if (!ctx || !stem) return null;
    var key = stem.extractStem((rowOrName && rowOrName.name) || rowOrName);
    if (!key) return null;
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    if (!data) return null;
    var list = (data.skuHistory && data.skuHistory[key]) || [];
    if (!list.length) return null;

    // Eligible entries only (numeric price + a unit) — an ineligible row must
    // never move the unit/anchor selection below.
    var eligible = list.filter(function (e) {
      return e && typeof e.comparablePrice === 'number' && e.comparableUnit;
    });
    if (eligible.length < 2) return null;

    // Dominant base unit (or the caller's).
    var rowUnit = rowOrName && rowOrName.comparable && rowOrName.comparable.baseUnit;
    if (!rowUnit) {
      var unitCounts = {};
      eligible.forEach(function (e) {
        unitCounts[e.comparableUnit] = (unitCounts[e.comparableUnit] || 0) + 1;
      });
      var bestUnit = null, bestCount = 0;
      Object.keys(unitCounts).forEach(function (u) {
        if (unitCounts[u] > bestCount) { bestUnit = u; bestCount = unitCounts[u]; }
      });
      rowUnit = bestUnit;
    }
    if (!rowUnit) return null;
    var pool = eligible.filter(function (e) { return e.comparableUnit === rowUnit; });

    // Contemporaneity window: drop entries older than 120d before the newest
    // on-unit entry. Fail-open only when NO entry carries a ts.
    var anchor = -Infinity;
    pool.forEach(function (e) { if (typeof e.ts === 'number' && e.ts > anchor) anchor = e.ts; });
    var windowed = anchor === -Infinity ? pool : pool.filter(function (e) {
      return typeof e.ts !== 'number' || e.ts >= anchor - CONTEMPORANEITY_WINDOW_MS;
    });

    // Per-vendor pools + the date range each vendor was actually bought in.
    var perVendor = {};
    windowed.forEach(function (e) {
      if (!e.vendor) return;
      var g = perVendor[e.vendor] || (perVendor[e.vendor] = { prices: [], min: Infinity, max: -Infinity });
      g.prices.push(e.comparablePrice);
      if (typeof e.ts === 'number') {
        if (e.ts < g.min) g.min = e.ts;
        if (e.ts > g.max) g.max = e.ts;
      }
    });

    var candidates = Object.keys(perVendor).map(function (v) {
      return { vendor: v, prices: perVendor[v].prices, min: perVendor[v].min, max: perVendor[v].max };
    }).filter(function (c) { return c.prices.length >= 3; });
    if (candidates.length < 2) return null;

    // Inter-vendor contemporaneity: the compared vendors' buying periods must be
    // close in time — overlapping OR adjacent within a bounded gap (a vendor
    // SWITCH is disjoint-but-adjacent). Reject only seasonally-apart clusters.
    var latestStart = -Infinity, earliestEnd = Infinity;
    candidates.forEach(function (c) {
      if (c.min > latestStart) latestStart = c.min;
      if (c.max < earliestEnd) earliestEnd = c.max;
    });
    if (isFinite(latestStart) && isFinite(earliestEnd) && (latestStart - earliestEnd) > MAX_INTERVENDOR_GAP_MS) return null;

    var rows = candidates.map(function (c) {
      var sorted = c.prices.slice().sort(function (a, b) { return a - b; });
      var mid = Math.floor(sorted.length / 2);
      var med = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      return {
        vendor:           c.vendor,
        medianComparable: +med.toFixed(4),
        comparableUnit:   rowUnit,
        observations:     c.prices.length
      };
    });
    rows.sort(function (a, b) { return a.medianComparable - b.medianComparable; });
    var cheapest = rows[0].medianComparable;
    rows.forEach(function (r) {
      r.gapPctVsCheapest = cheapest > 0
        ? +(((r.medianComparable - cheapest) / cheapest) * 100).toFixed(1)
        : 0;
    });
    return rows;
  }

  // Convenience: monthly delta projection for a swap from currentVendor
  // to targetVendor, given a recipe row's portion + covers/week.
  function projectMonthlySaving(args) {
    args = args || {};
    var name = args.name;
    var currentVendor = args.currentVendor;
    var targetVendor  = args.targetVendor;
    var portionQty    = parseFloat(args.portionQty) || 0;
    var portionUnit   = args.portionUnit || '';
    var coversPerWeek = parseFloat(args.coversPerWeek) || 0;
    if (!name || !currentVendor || !targetVendor || !portionQty || !portionUnit || !coversPerWeek) return null;
    var rows = compare({ name: name });
    if (!rows) return null;
    var current = rows.find(function (r) { return r.vendor === currentVendor; });
    var target  = rows.find(function (r) { return r.vendor === targetVendor; });
    if (!current || !target) return null;
    if (current.comparableUnit !== target.comparableUnit) return null;
    var bridge = (typeof root !== 'undefined' && root && root.MuntinPortionBridge);
    if (!bridge || !bridge.unitsCompatible(current.comparableUnit, portionUnit)) return null;
    var oneBaseInPortionUnit = bridge.convertQuantity(1, current.comparableUnit, portionUnit);
    if (!oneBaseInPortionUnit || oneBaseInPortionUnit <= 0) return null;
    var currentPerPortion = (current.medianComparable / oneBaseInPortionUnit) * portionQty;
    var targetPerPortion  = (target.medianComparable  / oneBaseInPortionUnit) * portionQty;
    var savingPerPortion  = currentPerPortion - targetPerPortion;
    var weekly  = savingPerPortion * coversPerWeek;
    var monthly = weekly * 4.345;     // typical weeks/month
    return {
      currentVendor:  currentVendor,
      targetVendor:   targetVendor,
      savingPerPortion: +savingPerPortion.toFixed(4),
      savingPerWeek:    +weekly.toFixed(2),
      savingPerMonth:   +monthly.toFixed(2),
      coversPerWeek:    coversPerWeek
    };
  }

  var api = {
    compare:               compare,
    projectMonthlySaving:  projectMonthlySaving
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinCrossVendor = api;
  if (root) root.MuntinCrossVendor = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
