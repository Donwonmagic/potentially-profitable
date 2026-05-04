/**
 * Per-dish contract drift (Wave 10.11).
 *
 * Walks the operator's contract prices × the current latest invoice
 * stem prices × dish recipes; for each dish whose ingredient prices
 * have moved above contract, computes the dish-level dollar impact
 * AND the food-cost-percentage shift implied by the change.
 *
 * Result shape:
 *   [
 *     {
 *       dish: 'Burger',
 *       deltaPctOnDish: 4.0,       // % shift in plate cost
 *       overchargeOnDish: 0.34,    // $/portion attributable to overage
 *       drivers: [
 *         { ingredient: 'Ground beef',
 *           contractPerBaseUnit: 4.00,
 *           actualPerBaseUnit:   4.20,
 *           baseUnit:            'lb',
 *           perPortionImpact:    0.20,
 *           vendor:              'sysco' },
 *         ...
 *       ]
 *     },
 *     ...
 *   ]
 *
 * Sorted by |deltaPctOnDish| descending.
 *
 * Privacy: pure read of plaintext aggregates (skuHistory,
 * contractPrices, dishes). No fetch.
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
  function _bridge() {
    if (typeof root !== 'undefined' && root && root.MuntinPortionBridge) return root.MuntinPortionBridge;
    if (typeof require !== 'undefined') {
      try { return require('./portion-bridge.js'); } catch (_) { return null; }
    }
    return null;
  }

  // Compute per-dish drift entries. Returns [] when data is missing.
  function compute(opts) {
    opts = opts || {};
    var ctx = _ctx();
    var stem = _stem();
    var bridge = _bridge();
    if (!ctx || !stem || !bridge) return [];
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    if (!data) return [];
    var contracts = data.contractPrices || {};
    var dishes = Array.isArray(data.dishes) ? data.dishes : [];
    var latest = (typeof ctx.latestSkuByStem === 'function') ? ctx.latestSkuByStem() : {};
    if (!Object.keys(contracts).length || !dishes.length) return [];

    var out = [];
    dishes.forEach(function (dish) {
      var ingredients = Array.isArray(dish && dish.rows) ? dish.rows : (Array.isArray(dish && dish.units) ? dish.units : []);
      if (!ingredients.length) return;
      var basePlateCost = 0, newPlateCost = 0;
      var drivers = [];
      ingredients.forEach(function (ing) {
        if (!ing) return;
        var name = ing.ingredient || ing.name;
        if (!name) return;
        var key = stem.extractStem(name);
        if (!key) return;
        var contract = contracts[key];
        var actual = latest[key];
        // Compute per-portion contract cost.
        var portion = {
          qty: parseFloat(ing.usedQty || ing.qty || 0) || 0,
          unit: ing.usedUnit || ing.unit || ing.apUnit
        };
        if (!portion.qty || !portion.unit) return;
        var y = (typeof ing.yieldPercent === 'number' ? ing.yieldPercent : parseFloat(ing.yieldPercent)) || 1;
        if (!isFinite(y) || y <= 0) y = 1;
        if (!contract || typeof contract.unitPrice !== 'number') return;
        var contractBaseUnit = contract.comparableUnit || contract.unit || ing.apUnit;
        var contractPerBase  = (contract.comparablePrice != null) ? contract.comparablePrice : contract.unitPrice;
        if (!contractBaseUnit || typeof contractPerBase !== 'number') return;
        // Skip cross-family contract vs portion.
        if (!bridge.unitsCompatible(contractBaseUnit, portion.unit)) return;
        var contractPortionQuote = bridge.quoteAtPortion({
          comparable: { perBaseUnit: contractPerBase, baseUnit: contractBaseUnit },
          portion: portion,
          yieldPercent: y
        });
        if (!contractPortionQuote || !contractPortionQuote.compatible) return;
        var actualPortionQuote = null;
        if (actual && bridge.unitsCompatible(actual.baseUnit, portion.unit)) {
          actualPortionQuote = bridge.quoteAtPortion({
            comparable: { perBaseUnit: actual.perBaseUnit, baseUnit: actual.baseUnit },
            portion: portion,
            yieldPercent: y
          });
        }
        var contractCost = contractPortionQuote.perPortionCost;
        var actualCost   = (actualPortionQuote && actualPortionQuote.compatible)
                              ? actualPortionQuote.perPortionCost
                              : (parseFloat(ing.apPrice) || 0) * portion.qty;
        basePlateCost += contractCost;
        newPlateCost  += actualCost;
        var perPortionImpact = actualCost - contractCost;
        if (Math.abs(perPortionImpact) > 0.005) {
          drivers.push({
            ingredient: name,
            contractPerBaseUnit: +contractPerBase.toFixed(4),
            actualPerBaseUnit:   actual ? +actual.perBaseUnit.toFixed(4) : null,
            baseUnit:   contractBaseUnit,
            perPortionImpact: +perPortionImpact.toFixed(4),
            vendor:     (actual && actual.vendor) || null
          });
        }
      });
      if (basePlateCost <= 0 || !drivers.length) return;
      var deltaPctOnDish = ((newPlateCost - basePlateCost) / basePlateCost) * 100;
      if (Math.abs(deltaPctOnDish) < 1) return;
      drivers.sort(function (a, b) { return Math.abs(b.perPortionImpact) - Math.abs(a.perPortionImpact); });
      out.push({
        dish: dish.name || '(unnamed)',
        deltaPctOnDish: +deltaPctOnDish.toFixed(2),
        overchargeOnDish: +(newPlateCost - basePlateCost).toFixed(4),
        contractPlateCost: +basePlateCost.toFixed(4),
        actualPlateCost:   +newPlateCost.toFixed(4),
        drivers: drivers
      });
    });
    out.sort(function (a, b) { return Math.abs(b.deltaPctOnDish) - Math.abs(a.deltaPctOnDish); });
    return out;
  }

  var api = { compute: compute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinDishDrift = api;
  if (root) root.MuntinDishDrift = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
