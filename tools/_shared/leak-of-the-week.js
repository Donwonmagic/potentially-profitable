/**
 * Leak of the Week — the intelligence layer's one honest answer.
 *
 * The composable capstone: it consumes whatever signals are available and returns
 * the SINGLE highest-value cost action this week — no dashboard to read, no nag.
 * It fuses the capabilities already shipped, each honesty-gated at the source:
 *
 *   - plate drift   (MuntinPlateMarketRecost) — a saved dish whose cost rose vs
 *                    the market since you priced it. $-quantified PER PLATE from
 *                    the operator's own recipe — a real number.
 *   - overpay       (MuntinFairPriceGap)      — a saved price sitting FAR above
 *                    the wholesale reference (directional; never an overpayment
 *                    claim from wholesale alone, see fair-price-gap.js).
 *   - cost pressure (data/cost-pressure.json) — a basket item with building cost
 *                    over the coming weeks, proven edges only. Directional: the
 *                    pressure layer carries NO price, so no $ is invented.
 *
 * MODULE CONTRACT
 *   Minimum:  Cost Index (seed) + cost-pressure → a directional market leak.
 *   Degraded: with no saved dishes/prices, only the directional pressure leak is
 *             offered; if nothing clears the bars, returns { leak: null } — it
 *             stays quietly dark rather than inventing an action.
 *   Enhances: + saved recipes → $-quantified plate-drift leaks (rank first);
 *             + saved prices → overpay leaks; +Decoder → real per-line overpay;
 *             +Inventory → waste/shrink leaks; +Ledger → P&L-weighted ranking.
 *
 * Ranking is honest: a leak with a real per-plate $ outranks a directional one;
 * directional leaks are ordered overpay (act now) then pressure (act soon).
 *
 * Pure, deterministic. No DOM/network. Inputs are passed in (so it is testable);
 * the browser panel supplies dishes + saved prices + the pressure manifest.
 * Browser: window.MuntinLeakOfTheWeek. Node: module.exports.
 */
(function (root) {
  'use strict';

  function _recost(opts) {
    if (opts && opts.recost) return opts.recost;
    if (root && root.MuntinPlateMarketRecost) return root.MuntinPlateMarketRecost;
    if (typeof require !== 'undefined') { try { return require('./plate-market-recost.js'); } catch (_) { return null; } }
    return null;
  }
  function _fairPrice(opts) {
    if (opts && opts.fairPrice) return opts.fairPrice;
    if (root && root.MuntinFairPriceGap) return root.MuntinFairPriceGap;
    if (typeof require !== 'undefined') { try { return require('./fair-price-gap.js'); } catch (_) { return null; } }
    return null;
  }

  function num(v) { var n = (typeof v === 'number') ? v : parseFloat(v); return isFinite(n) ? n : null; }

  // Confidence rank for ordering directional pressure leaks.
  var CONF = { high: 3, moderate: 2, medium: 2, low: 1, directional: 0 };

  /**
   * pick({ seed, dishes, savedPrices, pressure, basketSlugs, targetPct }) -> { leak, runnersUp }
   *
   * dishes:       context-bus dishes [{ name, price, rows|units }]
   * savedPrices:  [{ item, paidCents, unit }]  (e.g. Bench's latest reads)
   * pressure:     data/cost-pressure.json { items: { slug: {direction,confidence,under_review} } }
   * basketSlugs:  optional set/array of Cost Index slugs the operator buys (limits
   *               the pressure leak to their basket; otherwise the whole panel)
   *
   * leak / runnersUp entries:
   *   { type, title, detail, dollarsPerPlate|null, directional, action, costIndexKey|null, magnitude }
   */
  function pick(opts) {
    opts = opts || {};
    var seed = opts.seed || (root && root.MUNTIN_COST_INDEX) || null;
    var dishes = Array.isArray(opts.dishes) ? opts.dishes : [];
    var savedPrices = Array.isArray(opts.savedPrices) ? opts.savedPrices : [];
    var pressure = opts.pressure || null;
    var basket = opts.basketSlugs ? new Set([].concat(opts.basketSlugs)) : null;
    var candidates = [];

    // --- plate drift ($-quantified, per plate) ---
    var recost = _recost(opts);
    if (recost && recost.compute && seed && dishes.length) {
      var entries = [];
      try { entries = recost.compute({ seed: seed, dishes: dishes, targetPct: opts.targetPct }) || []; } catch (_) { entries = []; }
      entries.forEach(function (e) {
        if (!(e.deltaDollar > 0)) return; // only a COST INCREASE is a leak
        candidates.push({
          type: 'plate-drift',
          title: e.dish,
          dollarsPerPlate: e.deltaDollar,
          directional: false,
          magnitude: e.deltaDollar,
          costIndexKey: (e.drivers && e.drivers[0] && e.drivers[0].costIndexKey) || null,
          detail: 'Market cost is up ' + e.deltaPct + '% on this plate since you priced it' +
            (e.belowTarget ? ' — now over its food-cost target.' : '.'),
          action: 'Recost it and decide: re-engineer, or raise this one plate.'
        });
      });
    }

    // --- overpay vs market reference (directional) ---
    var fp = _fairPrice(opts);
    if (fp && fp.assess && seed && savedPrices.length) {
      savedPrices.forEach(function (sp) {
        var r;
        try { r = fp.assess({ item: sp.item, paidCents: num(sp.paidCents), unit: sp.unit, seed: seed }); } catch (_) { r = null; }
        if (r && r.comparable && r.worthAsking) {
          candidates.push({
            type: 'overpay',
            title: sp.item,
            dollarsPerPlate: null,
            directional: true,
            magnitude: r.gapPct,
            costIndexKey: r.costIndexKey || null,
            detail: 'You pay +' + r.gapPct + '% vs the wholesale reference — well beyond a normal delivered markup.',
            action: 'Ask your rep, or price a second vendor (aggregated buying typically saves 10–30%).'
          });
        }
      });
    }

    // --- cost pressure building (directional, proven edges only) ---
    var items = pressure && pressure.items;
    if (items) {
      var best = null;
      Object.keys(items).forEach(function (slug) {
        var p = items[slug];
        if (!p || p.direction !== 'building' || p.under_review) return;
        if (basket && !basket.has(slug)) return;
        if ((CONF[p.confidence] || 0) < 2) return; // moderate+ only
        var mag = (CONF[p.confidence] || 0) + Math.abs(num(p.score) || 0) / 100;
        if (!best || mag > best._mag) best = { p: p, slug: slug, _mag: mag };
      });
      if (best) {
        candidates.push({
          type: 'cost-pressure',
          title: best.slug,
          dollarsPerPlate: null,
          directional: true,
          magnitude: best._mag,
          costIndexKey: best.slug,
          detail: 'Cost pressure is building on ' + best.slug + ' over the coming weeks (' + best.p.confidence + ' confidence).',
          action: 'If it stores, consider locking or pre-buying before the move.'
        });
      }
    }

    // --- rank: real $ first (by $), then directional (overpay before pressure) ---
    var TYPE_RANK = { 'plate-drift': 3, 'overpay': 2, 'cost-pressure': 1 };
    candidates.sort(function (a, b) {
      var ad = a.dollarsPerPlate != null, bd = b.dollarsPerPlate != null;
      if (ad !== bd) return ad ? -1 : 1;
      if (ad && bd) return b.dollarsPerPlate - a.dollarsPerPlate;
      if (TYPE_RANK[a.type] !== TYPE_RANK[b.type]) return TYPE_RANK[b.type] - TYPE_RANK[a.type];
      return (b.magnitude || 0) - (a.magnitude || 0);
    });

    if (!candidates.length) return { leak: null, runnersUp: [] };
    return { leak: candidates[0], runnersUp: candidates.slice(1, 3) };
  }

  var api = { pick: pick };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinLeakOfTheWeek = api;
  if (root) root.MuntinLeakOfTheWeek = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
