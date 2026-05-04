/**
 * Menu Engineering cross-tool cascade (Wave 10.8).
 *
 * Audit-flagged greenfield wiring: Menu Engineering historically
 * operated on a passed-in array of items with no MuntinContext touch
 * point. This module is the bridge — it subscribes to
 * MuntinContext.dishCostHistory updates (written by Plate Cost when
 * stale-banner accepts cause cost shifts), and overlays a "moved
 * last invoice" tag on the matching menu-engineering row when the
 * dish's quadrant classification flips because of the price change.
 *
 * The module renders ONLY when:
 *   (a) MuntinContext.dishCostHistory has entries
 *   (b) The current Menu Engineering analysis includes a dish whose
 *       latest cost-history entry differs by ≥ 5% from prior
 *   (c) That dish would now classify into a different quadrant if
 *       the new cost replaced the typed cost
 *
 * Empty / no-data state: silent. The cascade never blocks the
 * standalone Menu Engineering flow.
 *
 * Privacy posture: pure read of MuntinContext aggregates. No fetch,
 * no decrypt. Plaintext aggregates only — same posture as
 * invoiceTrend.
 */
(function (root) {
  'use strict';

  if (typeof root === 'undefined' || !root || !root.document) return;
  if (typeof root.ME === 'undefined' || typeof root.ME.meSummariseMenu !== 'function') return;

  var QUADRANT_LABELS = {
    star:      'Star',
    plowhorse: 'Plowhorse',
    puzzle:    'Puzzle',
    dog:       'Dog'
  };

  // Each menu-engineering row in the DOM carries the typed name + price
  // + cost + units fields. We need a way to map a dish name back to a
  // table row. Menu Engineering's existing row markup uses
  // <tr data-row-idx>; the input fields use data-field hooks identical
  // to Plate Cost's pattern.
  function _findRowByDishName(name) {
    if (!name) return null;
    var trs = document.querySelectorAll('[data-me-row], tr[data-row-idx]');
    for (var i = 0; i < trs.length; i++) {
      var nameInput = trs[i].querySelector('[data-field="name"]');
      if (nameInput && String(nameInput.value || '').trim().toLowerCase() === name.toLowerCase()) {
        return trs[i];
      }
    }
    return null;
  }

  function _readMenuItemsFromDom() {
    var items = [];
    var trs = document.querySelectorAll('[data-me-row], tr[data-row-idx]');
    for (var i = 0; i < trs.length; i++) {
      var nameI  = trs[i].querySelector('[data-field="name"]');
      var priceI = trs[i].querySelector('[data-field="price"]');
      var costI  = trs[i].querySelector('[data-field="cost"]');
      var unitsI = trs[i].querySelector('[data-field="units"]');
      if (!nameI) continue;
      var n = String(nameI.value || '').trim();
      if (!n) continue;
      items.push({
        name:  n,
        price: parseFloat(priceI && priceI.value) || 0,
        cost:  parseFloat(costI  && costI.value)  || 0,
        units: parseFloat(unitsI && unitsI.value) || 0
      });
    }
    return items;
  }

  function _classifyQuadrant(item, summary) {
    if (!summary || !summary.items || !summary.items.length) return null;
    var match = summary.items.find(function (e) { return e.name === item.name; });
    return match ? match.classification : null;
  }

  function refresh() {
    if (typeof root.MuntinContext === 'undefined' || typeof root.MuntinContext.readDishCostHistory !== 'function') return;
    var history = root.MuntinContext.readDishCostHistory();
    if (!history || !Object.keys(history).length) return;
    var items = _readMenuItemsFromDom();
    if (!items.length) return;
    var baselineSummary = root.ME.meSummariseMenu(items);
    if (!baselineSummary || !Array.isArray(baselineSummary.items)) return;

    var movedDishes = [];
    items.forEach(function (it) {
      var ring = history[it.name];
      if (!Array.isArray(ring) || ring.length < 1) return;
      var latest = ring[0];
      var prior  = ring[1];
      if (!latest || typeof latest.foodCost !== 'number') return;
      var newCost = latest.foodCost;
      var oldCost = it.cost;
      if (oldCost <= 0) return;
      var deltaPct = (newCost - oldCost) / oldCost;
      if (Math.abs(deltaPct) < 0.05) return;
      // Re-classify with the new cost.
      var alt = items.map(function (x) {
        return (x.name === it.name) ? Object.assign({}, x, { cost: newCost }) : x;
      });
      var altSummary = root.ME.meSummariseMenu(alt);
      var oldQ = _classifyQuadrant(it, baselineSummary);
      var newQ = _classifyQuadrant({ name: it.name }, altSummary);
      if (oldQ && newQ && oldQ !== newQ) {
        movedDishes.push({
          name:    it.name,
          fromQ:   oldQ,
          toQ:     newQ,
          oldCost: oldCost,
          newCost: newCost,
          deltaPct: deltaPct,
          vendorTrigger: latest.vendorTrigger || null
        });
      }
    });

    _renderMovedTags(movedDishes);
    if (movedDishes.length && root.plausible) {
      try { root.plausible('Menu Engineering Bucket Move', { props: { count_bucket: movedDishes.length < 3 ? '<3' : '3+' } }); } catch (_) {}
    }
  }

  function _renderMovedTags(moved) {
    // Clear any prior cascade tags first.
    Array.prototype.forEach.call(document.querySelectorAll('.me-cascade-tag'), function (el) {
      try { el.parentNode.removeChild(el); } catch (_) {}
    });
    if (!moved.length) return;
    moved.forEach(function (m) {
      var row = _findRowByDishName(m.name);
      if (!row) return;
      var tag = document.createElement('span');
      tag.className = 'me-cascade-tag';
      tag.setAttribute('role', 'note');
      tag.title = m.name + ' moved from ' + (QUADRANT_LABELS[m.fromQ] || m.fromQ) +
                  ' → ' + (QUADRANT_LABELS[m.toQ] || m.toQ) +
                  ' (cost ' + (m.deltaPct > 0 ? '+' : '') + (m.deltaPct * 100).toFixed(1) + '% from ' +
                  (m.vendorTrigger || 'last invoice') + ')';
      tag.textContent = '↻ ' + (QUADRANT_LABELS[m.toQ] || m.toQ).toLowerCase();
      var nameInput = row.querySelector('[data-field="name"]');
      if (nameInput && nameInput.parentNode) {
        nameInput.parentNode.appendChild(tag);
      }
    });
  }

  function init() {
    refresh();
    if (root.MuntinContext && typeof root.MuntinContext.subscribe === 'function') {
      root.MuntinContext.subscribe(function (changes) {
        // Only refresh on relevant key changes.
        var keys = changes && changes.changedKeys;
        if (!keys || keys.indexOf('dishCostHistory') !== -1 || keys.indexOf('dishes') !== -1) {
          refresh();
        }
      });
    }
    // Same-tab refresh hook: tools that update MuntinContext within
    // the same tab don't fire the storage event. Listen for our own
    // synthetic 'mid:dish-cost-changed' event.
    if (typeof root.addEventListener === 'function') {
      root.addEventListener('mid:dish-cost-changed', refresh);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var api = { refresh: refresh, _readMenuItemsFromDom: _readMenuItemsFromDom };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MenuEngineeringCascade = api;
})(typeof window !== 'undefined' ? window : null);
