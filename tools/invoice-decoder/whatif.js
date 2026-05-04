/**
 * What-if pricing simulator (Wave 13.6).
 *
 * "Drag a category onto a vendor → see monthly delta winners/losers
 * per SKU." Cross-vendor data already exists; this module is the
 * compute layer + a small render hook.
 *
 * Public API:
 *   simulate({category, fromVendor, toVendor})
 *     → { winners: [...], losers: [...], netMonthly: $ }
 */
(function (root) {
  'use strict';

  function _ctx() {
    if (typeof root !== 'undefined' && root && root.MuntinContext) return root.MuntinContext;
    if (typeof require !== 'undefined') {
      try { return require('../_shared/context-bus.js'); } catch (_) { return null; }
    }
    return null;
  }

  function _median(arr) {
    if (!arr.length) return 0;
    var s = arr.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function simulate(args) {
    args = args || {};
    var ctx = _ctx();
    if (!ctx) return null;
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    if (!data || !data.skuHistory) return null;
    var fromVendor = args.fromVendor;
    var toVendor   = args.toVendor;
    if (!fromVendor || !toVendor || fromVendor === toVendor) return null;
    var winners = [], losers = [];
    var netMonthly = 0;
    Object.keys(data.skuHistory).forEach(function (stem) {
      var list = data.skuHistory[stem];
      if (!Array.isArray(list) || list.length < 4) return;
      var fromPrices = list.filter(function (e) { return e.vendor === fromVendor && typeof e.unitPrice === 'number'; }).map(function (e) { return e.unitPrice; });
      var toPrices   = list.filter(function (e) { return e.vendor === toVendor   && typeof e.unitPrice === 'number'; }).map(function (e) { return e.unitPrice; });
      if (fromPrices.length < 2 || toPrices.length < 2) return;
      var fromMed = _median(fromPrices);
      var toMed   = _median(toPrices);
      var monthlyQty = list.filter(function (e) { return e.vendor === fromVendor && (Date.now() - e.ts) < 30 * 86400000; })
                          .reduce(function (s, e) { return s + (e.qty || 1); }, 0);
      if (monthlyQty <= 0) return;
      var perUnitDelta = fromMed - toMed;       // positive = saving
      var monthlyDelta = perUnitDelta * monthlyQty;
      netMonthly += monthlyDelta;
      var entry = { stem: stem, fromMed: +fromMed.toFixed(4), toMed: +toMed.toFixed(4), perUnitDelta: +perUnitDelta.toFixed(4), monthlyDelta: +monthlyDelta.toFixed(2), qty: monthlyQty };
      if (perUnitDelta > 0) winners.push(entry); else losers.push(entry);
    });
    if (!winners.length && !losers.length) return null;
    winners.sort(function (a, b) { return b.monthlyDelta - a.monthlyDelta; });
    losers.sort(function (a, b) { return a.monthlyDelta - b.monthlyDelta; });
    return {
      fromVendor: fromVendor,
      toVendor:   toVendor,
      winners:    winners.slice(0, 8),
      losers:     losers.slice(0, 8),
      netMonthly: +netMonthly.toFixed(2)
    };
  }

  // List vendors with ≥3 invoices, for the simulator's vendor picker.
  function eligibleVendors() {
    var ctx = _ctx();
    if (!ctx) return [];
    var trend = (typeof ctx.readTrend === 'function') ? ctx.readTrend() : [];
    var counts = {};
    trend.forEach(function (e) { if (e.vendor) counts[e.vendor] = (counts[e.vendor] || 0) + 1; });
    return Object.keys(counts).filter(function (v) { return counts[v] >= 3; })
      .map(function (v) { return { vendor: v, count: counts[v] }; })
      .sort(function (a, b) { return b.count - a.count; });
  }

  var api = { simulate: simulate, eligibleVendors: eligibleVendors };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_WHATIF = api;
})(typeof window !== 'undefined' ? window : null);
