/**
 * Plate Market Recost — the Index-only "Live Plate Margin" engine.
 *
 * The composable sibling of dish-drift.js. Where dish-drift recosts a dish
 * against the operator's CONTRACT prices × their latest INVOICE reads (the
 * Index+Decoder path), this module recosts a saved dish against the live
 * Cost Index MARKET — with no invoices, no account, no Decoder. One module on
 * (the Cost Index) and a recipe the operator already typed is enough to answer:
 * "the market moved — what does this plate cost now, and did it fall below
 * target margin since I priced it?"
 *
 * MODULE CONTRACT
 *   Minimum:  Cost Index (window.MUNTIN_COST_INDEX) + a recipe (dish rows).
 *   Degraded: an ingredient with no firm market level, or sold in a unit we
 *             can't bridge to the portion (carton / head / sack vs oz), is
 *             EXCLUDED from the plate total and reported as unpriced — never
 *             guessed. A fuzzy ("propose") name match is surfaced as a
 *             suggestion, never silently summed into a dollar figure.
 *   Enhances: +Decoder → swap the market level for the operator's actual paid
 *             price per line (dish-drift). +Inventory → weight by on-hand.
 *             +Ledger → roll the per-dish delta into the P&L.
 *
 * HONESTY (load vs delivered): the Cost Index is a WHOLESALE reference, never
 * the operator's delivered price. Every entry carries wholesaleReference:true
 * and the caller MUST say so ("wholesale reference — delivered usually higher").
 * Only medium+ confidence dollar levels are used (MuntinCostIndexLookup gates
 * this); only exact/stem ("auto") matches are summed into the plate total.
 *
 * Pure, deterministic. No DOM, no fetch, no localStorage. Browser global:
 * window.MuntinPlateMarketRecost. Node: module.exports (so it is unit-testable).
 */
(function (root) {
  'use strict';

  function _lookup() {
    if (root && root.MuntinCostIndexLookup) return root.MuntinCostIndexLookup;
    if (typeof require !== 'undefined') {
      try { return require('./cost-index-lookup.js'); } catch (_) { return null; }
    }
    return null;
  }
  function _bridge() {
    if (root && root.MuntinPortionBridge) return root.MuntinPortionBridge;
    if (typeof require !== 'undefined') {
      try { return require('./portion-bridge.js'); } catch (_) { return null; }
    }
    return null;
  }

  function num(v) {
    var n = (typeof v === 'number') ? v : parseFloat(v);
    return isFinite(n) ? n : null;
  }

  // Yield is stored as a 0–1 fraction (ingredient-yields.json uses 0.75). Be
  // defensive: a "75" typed into the Yield % column means 0.75. Clamp to a sane
  // band so an absurd value can't distort a plate cost.
  function normYield(v) {
    var y = num(v);
    if (y == null || y <= 0) return 1;
    if (y > 1.5) y = y / 100;
    if (y <= 0) return 1;
    return Math.min(y, 5);
  }

  function rowsOf(dish) {
    if (!dish) return [];
    if (Array.isArray(dish.rows)) return dish.rows;
    if (Array.isArray(dish.units)) return dish.units;
    return [];
  }

  // Per-portion cost of an ingredient at a given $/baseUnit, via the shared
  // portion bridge. Returns a number or null when units don't bridge.
  function perPortion(bridge, perBaseUnit, baseUnit, portion, yieldPercent) {
    if (perBaseUnit == null || perBaseUnit <= 0 || !baseUnit) return null;
    var q = bridge.quoteAtPortion({
      comparable: { perBaseUnit: perBaseUnit, baseUnit: baseUnit },
      portion: portion,
      yieldPercent: yieldPercent
    });
    return (q && q.compatible) ? q.perPortionCost : null;
  }

  /**
   * compute({ dishes, seed, targetPct }) -> entry[]
   *
   * entry = {
   *   dish, enteredPlateCost, marketPlateCost, deltaDollar, deltaPct,
   *   coveredLines, totalLines, wholesaleReference: true,
   *   marketFoodCostPct, enteredFoodCostPct, targetPct, belowTarget, crossedTarget,
   *   drivers: [{ ingredient, enteredPerPortion, marketPerPortion, deltaPerPortion,
   *               costIndexKey, baseUnit, basis, asOf, confidence }],
   *   suggestions: [{ ingredient, costIndexKey, reason:'fuzzy-match' }],
   *   unpriced:    [{ ingredient, reason }]
   * }
   *
   * Sorted by |deltaPct| descending. Dishes with no covered line, or no entered
   * baseline to compare against, are omitted (no honest comparison exists).
   */
  function compute(opts) {
    opts = opts || {};
    var lookup = opts.lookup || _lookup();
    var bridge = opts.bridge || _bridge();
    var seed = opts.seed || (root && root.MUNTIN_COST_INDEX) || null;
    var dishes = Array.isArray(opts.dishes) ? opts.dishes : [];
    var targetPct = num(opts.targetPct);
    if (targetPct == null || targetPct <= 0) targetPct = 30; // food-cost % target
    if (!lookup || !lookup.match || !bridge || !seed || !dishes.length) return [];

    var out = [];
    dishes.forEach(function (dish) {
      var rows = rowsOf(dish);
      if (!rows.length) return;

      var enteredPlateCost = 0, marketPlateCost = 0;
      var drivers = [], suggestions = [], unpriced = [];
      var totalLines = 0;

      rows.forEach(function (row) {
        if (!row) return;
        var name = row.ingredient || row.name;
        if (!name) return;
        totalLines++;

        var portion = {
          qty: num(row.usedQty != null ? row.usedQty : row.qty) || 0,
          unit: row.usedUnit || row.unit || row.apUnit
        };
        var yieldPercent = normYield(row.yieldPercent);

        var ref = lookup.match(name, seed);
        if (!ref || ref.wholesaleCents == null) {
          unpriced.push({ ingredient: name, reason: ref ? 'no-market-level' : 'no-match' });
          return;
        }
        // Honesty: a fuzzy match is a suggestion, never a silently-summed dollar.
        if (ref.tier !== 'auto') {
          suggestions.push({ ingredient: name, costIndexKey: ref.key, reason: 'fuzzy-match' });
          return;
        }

        var marketCost = perPortion(bridge, ref.wholesaleCents / 100, ref.unit_en, portion, yieldPercent);
        if (marketCost == null) {
          // Market level exists but its unit (e.g. carton/head) won't bridge to
          // this portion — exclude rather than guess a density.
          unpriced.push({ ingredient: name, reason: 'unit-not-comparable' });
          return;
        }

        // Operator's own baseline: AP price is per AP unit, across AP qty.
        var apPrice = num(row.apPrice);
        var apQty = num(row.apQty);
        if (!apQty || apQty <= 0) apQty = 1;
        var enteredCost = (apPrice != null && apPrice > 0)
          ? perPortion(bridge, apPrice / apQty, row.apUnit, portion, yieldPercent)
          : null;
        if (enteredCost == null) {
          // We can read the market but not a comparable baseline — list it so the
          // total stays apples-to-apples.
          unpriced.push({ ingredient: name, reason: 'no-baseline' });
          return;
        }

        enteredPlateCost += enteredCost;
        marketPlateCost += marketCost;
        drivers.push({
          ingredient: name,
          enteredPerPortion: +enteredCost.toFixed(4),
          marketPerPortion: +marketCost.toFixed(4),
          deltaPerPortion: +(marketCost - enteredCost).toFixed(4),
          costIndexKey: ref.key,
          baseUnit: ref.unit_en,
          basis: ref.basis || null,
          asOf: ref.asOf || null,
          confidence: ref.confidence || null
        });
      });

      if (!drivers.length || enteredPlateCost <= 0) return;

      var deltaDollar = marketPlateCost - enteredPlateCost;
      var deltaPct = (deltaDollar / enteredPlateCost) * 100;

      var entry = {
        dish: dish.name || '(unnamed)',
        enteredPlateCost: +enteredPlateCost.toFixed(4),
        marketPlateCost: +marketPlateCost.toFixed(4),
        deltaDollar: +deltaDollar.toFixed(4),
        deltaPct: +deltaPct.toFixed(2),
        coveredLines: drivers.length,
        totalLines: totalLines,
        wholesaleReference: true,
        targetPct: targetPct,
        marketFoodCostPct: null,
        enteredFoodCostPct: null,
        belowTarget: null,
        crossedTarget: null,
        drivers: drivers.sort(function (a, b) {
          return Math.abs(b.deltaPerPortion) - Math.abs(a.deltaPerPortion);
        }),
        suggestions: suggestions,
        unpriced: unpriced
      };

      var price = num(dish.price);
      if (price != null && price > 0) {
        var ent = (enteredPlateCost / price) * 100;
        var mkt = (marketPlateCost / price) * 100;
        entry.enteredFoodCostPct = +ent.toFixed(2);
        entry.marketFoodCostPct = +mkt.toFixed(2);
        entry.belowTarget = mkt > targetPct;            // food cost over target → margin under target
        entry.crossedTarget = ent <= targetPct && mkt > targetPct;
      }

      out.push(entry);
    });

    out.sort(function (a, b) { return Math.abs(b.deltaPct) - Math.abs(a.deltaPct); });
    return out;
  }

  var api = { compute: compute };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof self !== 'undefined') self.MuntinPlateMarketRecost = api;
  if (root) root.MuntinPlateMarketRecost = api;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
