/**
 * Invoice Decoder — margin-impact callout (Wave 2.6).
 *
 * When the operator has Plate Cost dishes saved (via MuntinContext
 * .dishes), and this invoice's price changes touch one of those
 * dishes' ingredients, surface "this invoice shifts Caesar food cost
 * +1.4 pp, burger +0.8 pp" inside the cross-tool handoff panel.
 *
 * Pure derivation over local data. No fetch. No analytics events
 * carry row-level content.
 *
 * Dish shape (from plate-cost):
 *   { name, price, foodCost, units }
 * where `units` is roughly an array of { ingredient, qty, unit, unitCost }.
 * We're conservative: we degrade gracefully when the shape is missing
 * fields rather than guessing.
 */
(function (root) {
  'use strict';

  function ctx() {
    return (typeof root !== 'undefined' && root && root.MuntinContext) ? root.MuntinContext : null;
  }

  function stemOf(name) {
    if (root && root.MID_LEARNINGS && typeof root.MID_LEARNINGS.extractStem === 'function') {
      return root.MID_LEARNINGS.extractStem(name);
    }
    return String(name || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Best-match between a dish ingredient name and a parsed-row stem.
  // Returns the matched parsed-row index, or -1.
  function findRowMatch(ingredientName, parsedRows) {
    var iStem = stemOf(ingredientName);
    if (!iStem || iStem.length < 3) return -1;
    for (var i = 0; i < parsedRows.length; i++) {
      var r = parsedRows[i];
      if (!r || (r.kind && r.kind !== 'item')) continue;
      var rStem = stemOf(r.name);
      if (!rStem) continue;
      if (rStem.indexOf(iStem) !== -1 || iStem.indexOf(rStem) !== -1) return i;
    }
    return -1;
  }

  // Compute the food-cost delta in percentage points for one dish
  // given the parsed rows and the dish's previous foodCost.
  // Returns null when we can't compute (no units, no price, etc.).
  function dishImpact(dish, parsedRows) {
    if (!dish || !dish.price || dish.price <= 0) return null;
    if (!Array.isArray(dish.units) || !dish.units.length) return null;
    var newCost = 0;
    var hasMatch = false;
    var oldCost = 0;
    for (var i = 0; i < dish.units.length; i++) {
      var u = dish.units[i];
      if (!u || !u.ingredient) continue;
      var qty = (typeof u.qty === 'number') ? u.qty : 1;
      var unitCost = (typeof u.unitCost === 'number') ? u.unitCost : 0;
      oldCost += qty * unitCost;
      var rowIdx = findRowMatch(u.ingredient, parsedRows);
      if (rowIdx === -1) {
        newCost += qty * unitCost;
        continue;
      }
      var row = parsedRows[rowIdx];
      var rowUnitPrice = (typeof row.unitPrice === 'number')
        ? row.unitPrice
        : (row.lineTotal && row.qty ? row.lineTotal / row.qty : null);
      if (rowUnitPrice == null) {
        newCost += qty * unitCost;
        continue;
      }
      hasMatch = true;
      newCost += qty * rowUnitPrice;
    }
    if (!hasMatch) return null;
    if (dish.price <= 0) return null;
    var newPct = (newCost / dish.price) * 100;
    var oldPct = (typeof dish.foodCost === 'number')
      ? dish.foodCost
      : (oldCost > 0 ? (oldCost / dish.price) * 100 : null);
    if (oldPct == null) return null;
    var deltaPp = newPct - oldPct;
    return {
      dishName:  dish.name,
      oldPct:    +oldPct.toFixed(2),
      newPct:    +newPct.toFixed(2),
      deltaPp:   +deltaPp.toFixed(2),
      direction: deltaPp > 0 ? 'up' : (deltaPp < 0 ? 'down' : 'flat')
    };
  }

  // Walks every saved dish and returns the list of impacts ≥ minPp.
  function computeImpacts(parsedRows, opts) {
    opts = opts || {};
    var minPp = (opts.minPp != null) ? opts.minPp : 0.5;
    var c = ctx();
    if (!c) return [];
    var data = c.read() || {};
    var dishes = Array.isArray(data.dishes) ? data.dishes : [];
    if (!dishes.length) return [];
    var out = [];
    dishes.forEach(function (d) {
      var hit = dishImpact(d, parsedRows);
      if (hit && Math.abs(hit.deltaPp) >= minPp) out.push(hit);
    });
    out.sort(function (a, b) { return Math.abs(b.deltaPp) - Math.abs(a.deltaPp); });
    return out;
  }

  var api = {
    computeImpacts: computeImpacts,
    dishImpact:     dishImpact
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_MARGIN = api;
})(typeof window !== 'undefined' ? window : null);
