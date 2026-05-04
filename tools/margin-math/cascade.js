/**
 * Margin Math cross-tool cascade (Wave 10.10).
 *
 * Audit-flagged greenfield wiring: Margin Math has historically
 * operated on direct user inputs (foodCostPct, laborCostPct, ...)
 * with no MuntinContext touch point. This module is the bridge —
 * it reads MuntinContext.dishCostHistory (written by Plate Cost
 * when stale-banner accepts cause cost shifts), aggregates the
 * weighted food-cost shift, and surfaces a "break-even shifted"
 * banner when the change crosses a threshold.
 *
 * Strategy:
 *   1. Cold-load read of dishCostHistory.
 *   2. For each dish with ≥2 entries, compute prior vs latest plate
 *      cost. Aggregate (mix-weighted by `units` pulled from
 *      MuntinContext.dishes if present, else equal weight).
 *   3. Compute the implied foodCostPct shift (assumes the operator's
 *      typed `foodCostPct` was correct before the change; we delta
 *      it).
 *   4. Re-run mmBreakEven via MM.compute against the shifted FC%
 *      and surface "Break-even shifted from 38 → 41 covers/night
 *      because beef rose 12% on last week's Sysco invoice."
 *
 * Empty / no-data state: silent. Cascade never blocks the standalone
 * Margin Math flow.
 *
 * Privacy posture: pure read of plaintext aggregates. No fetch.
 */
(function (root) {
  'use strict';

  if (typeof root === 'undefined' || !root || !root.document) return;
  if (typeof root.MM === 'undefined') return;

  function _readCurrentInputs() {
    var ticketEl   = document.getElementById('mmTicket');
    var foodEl     = document.getElementById('mmFoodCost');
    var laborEl    = document.getElementById('mmLaborCost');
    var fixedEl    = document.getElementById('mmFixed');
    var nightlyEl  = document.getElementById('mmNightly');
    if (!ticketEl || !foodEl || !laborEl) return null;
    return {
      ticket:       parseFloat(ticketEl.value) || 0,
      foodCostPct:  parseFloat(foodEl.value)   || 0,
      laborCostPct: parseFloat(laborEl.value)  || 0,
      fixedDollars: parseFloat(fixedEl && fixedEl.value) || 0,
      coversPerNight: parseFloat(nightlyEl && nightlyEl.value) || 0
    };
  }

  // Aggregate per-dish cost shift across all dishes that have a
  // recent invoice-driven update. Returns { weightedDeltaPct, drivers,
  // strongestVendor, sampleCount } or null if insufficient data.
  function _aggregateCostShift() {
    if (typeof root.MuntinContext === 'undefined') return null;
    if (typeof root.MuntinContext.readDishCostHistory !== 'function') return null;
    var history = root.MuntinContext.readDishCostHistory();
    var dishes = (root.MuntinContext.read() || {}).dishes || [];
    var weights = {};
    dishes.forEach(function (d) {
      if (d && d.name) weights[d.name] = (typeof d.units === 'number' && d.units > 0) ? d.units : 1;
    });
    var totalWeight = 0;
    var weightedDelta = 0;
    var drivers = [];
    var sampleCount = 0;
    var vendorCounts = {};
    Object.keys(history || {}).forEach(function (dishKey) {
      var ring = history[dishKey];
      if (!Array.isArray(ring) || ring.length < 2) return;
      var newest = ring[0], prior = ring[1];
      if (!newest || typeof newest.foodCost !== 'number') return;
      if (!prior  || typeof prior.foodCost  !== 'number' || prior.foodCost <= 0) return;
      // Only consider entries within the last 14 days — older shifts
      // are stale.
      if (Date.now() - (newest.ts || 0) > 14 * 86400000) return;
      var deltaPct = (newest.foodCost - prior.foodCost) / prior.foodCost;
      if (Math.abs(deltaPct) < 0.02) return;
      var w = weights[dishKey] || 1;
      totalWeight += w;
      weightedDelta += deltaPct * w;
      drivers.push({ dish: dishKey, deltaPct: deltaPct, vendor: newest.vendorTrigger || null });
      sampleCount++;
      if (newest.vendorTrigger) {
        vendorCounts[newest.vendorTrigger] = (vendorCounts[newest.vendorTrigger] || 0) + 1;
      }
    });
    if (!sampleCount || !totalWeight) return null;
    var weightedDeltaPct = weightedDelta / totalWeight;
    var strongestVendor = null, topCount = 0;
    Object.keys(vendorCounts).forEach(function (v) {
      if (vendorCounts[v] > topCount) { topCount = vendorCounts[v]; strongestVendor = v; }
    });
    drivers.sort(function (a, b) { return Math.abs(b.deltaPct) - Math.abs(a.deltaPct); });
    return {
      weightedDeltaPct: weightedDeltaPct,
      drivers: drivers.slice(0, 3),
      strongestVendor: strongestVendor,
      sampleCount: sampleCount
    };
  }

  function refresh() {
    var cur = _readCurrentInputs();
    if (!cur || !cur.ticket || !cur.foodCostPct) return;
    var shift = _aggregateCostShift();
    if (!shift) {
      _hideBanner();
      return;
    }
    // The operator's typed foodCostPct is the CURRENT (post-shift)
    // value. To compute the delta in covers, we re-run with the prior
    // FC% (= current / (1 + shift.weightedDeltaPct), bounded).
    var fcPctFraction = (cur.foodCostPct > 1) ? cur.foodCostPct / 100 : cur.foodCostPct;
    var priorFcPct = fcPctFraction / (1 + shift.weightedDeltaPct);
    if (priorFcPct <= 0 || priorFcPct >= 1) { _hideBanner(); return; }
    var laborFraction = (cur.laborCostPct > 1) ? cur.laborCostPct / 100 : cur.laborCostPct;
    if (typeof root.MM.mmBreakEven !== 'function') { _hideBanner(); return; }
    var nowResult = root.MM.mmBreakEven({
      ticket: cur.ticket,
      foodCostPct: fcPctFraction,
      laborCostPct: laborFraction,
      fixedDollars: cur.fixedDollars,
      coversPerNight: cur.coversPerNight
    });
    var thenResult = root.MM.mmBreakEven({
      ticket: cur.ticket,
      foodCostPct: priorFcPct,
      laborCostPct: laborFraction,
      fixedDollars: cur.fixedDollars,
      coversPerNight: cur.coversPerNight
    });
    if (!nowResult || !thenResult) { _hideBanner(); return; }
    var nowCovers = nowResult.breakEvenCoversPerNight || nowResult.breakEvenCovers || null;
    var thenCovers = thenResult.breakEvenCoversPerNight || thenResult.breakEvenCovers || null;
    if (nowCovers == null || thenCovers == null) { _hideBanner(); return; }
    var diff = nowCovers - thenCovers;
    if (Math.abs(diff) < 0.5) { _hideBanner(); return; }
    _renderBanner({
      now: Math.round(nowCovers),
      then: Math.round(thenCovers),
      diff: Math.round(diff),
      shift: shift
    });
    if (root.plausible) {
      try { root.plausible('Margin Math Break-Even Shift', { props: { dir: diff > 0 ? 'up' : 'down' } }); } catch (_) {}
    }
  }

  function _findOrCreateBanner() {
    var existing = document.getElementById('mmCascadeBanner');
    if (existing) return existing;
    var anchor = document.querySelector('#mmBreakEvenResult, .mm-result, #mmResults') ||
                 document.querySelector('main') || document.body;
    if (!anchor) return null;
    var el = document.createElement('div');
    el.id = 'mmCascadeBanner';
    el.className = 'mm-cascade-banner';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.hidden = true;
    anchor.parentNode.insertBefore(el, anchor);
    return el;
  }
  function _hideBanner() {
    var el = document.getElementById('mmCascadeBanner');
    if (el) { el.hidden = true; el.innerHTML = ''; }
  }
  function _renderBanner(view) {
    var el = _findOrCreateBanner();
    if (!el) return;
    var sign = view.diff > 0 ? '+' : '';
    var driver = view.shift.drivers[0];
    var driverStr = driver
      ? (' driven by ' + driver.dish + ' (' + (driver.deltaPct > 0 ? '+' : '') + (driver.deltaPct * 100).toFixed(0) + '% on ' + (driver.vendor || 'last invoice') + ')')
      : '';
    el.innerHTML =
      '<div class="mm-cascade">' +
        '<p class="mm-cascade-msg">' +
          '<strong>Break-even shifted from ' + view.then + ' → ' + view.now + ' covers/night</strong>' +
          ' (' + sign + view.diff + ')' +
          driverStr + '.' +
        '</p>' +
      '</div>';
    el.hidden = false;
  }

  function init() {
    refresh();
    if (root.MuntinContext && typeof root.MuntinContext.subscribe === 'function') {
      root.MuntinContext.subscribe(function (changes) {
        var keys = changes && changes.changedKeys;
        if (!keys || keys.indexOf('dishCostHistory') !== -1) refresh();
      });
    }
    // Refresh when the operator changes their inputs.
    ['mmTicket', 'mmFoodCost', 'mmLaborCost', 'mmFixed', 'mmNightly'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', refresh);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var api = { refresh: refresh, _aggregateCostShift: _aggregateCostShift };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MarginMathCascade = api;
})(typeof window !== 'undefined' ? window : null);
