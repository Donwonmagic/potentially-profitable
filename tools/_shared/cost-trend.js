/**
 * Cost-trend derivations (Phase 7 W4-8).
 *
 * Pure functions over MuntinContext.invoiceTrend (the 12-deep ring
 * buffer pushed by Invoice Decoder on every save). Used by:
 *
 *   - Invoice Decoder result panel — drift banner above parsed rows
 *   - Cost Pulse dashboard (Wave 9 W9-8)
 *   - Plate Cost stale-cost banner (Wave 9 W9-1)
 *   - Margin Math food-cost-band slider hint (Wave 9 W9-3)
 *   - GBP Grader category-shift CTA (Wave 9 W9-4)
 *
 * No DOM, no fetch, no localStorage writes — read-only derivations
 * a caller can render however they like.
 */
(function (root) {
  'use strict';

  // Median of an array of numbers; ignores null / undefined / NaN.
  function median(arr) {
    var clean = (arr || []).filter(function (n) {
      return typeof n === 'number' && isFinite(n);
    }).slice().sort(function (a, b) { return a - b; });
    if (!clean.length) return null;
    var mid = Math.floor(clean.length / 2);
    return clean.length % 2 === 1 ? clean[mid] : (clean[mid - 1] + clean[mid]) / 2;
  }

  // Pull every category total seen across the trend and merge into
  // a flat array per category. Skips the `latestCount` newest entries
  // when computing baseline (so latest doesn't pollute its own median).
  function categoryTotalsAcross(trend, latestCount) {
    if (!Array.isArray(trend)) return {};
    var skip = latestCount || 0;
    var per = {};
    trend.slice(skip).forEach(function (entry) {
      var totals = entry && entry.totalsByCategory;
      if (!totals) return;
      Object.keys(totals).forEach(function (k) {
        (per[k] = per[k] || []).push(totals[k]);
      });
    });
    return per;
  }

  // Compute rolling median per category over the trend. Returns
  // { category: median } across the last `weeks` entries, omitting
  // the very newest (so callers can compare it independently).
  function computeRollingMedian(trend, weeks) {
    weeks = weeks || 4;
    if (!Array.isArray(trend) || trend.length < 2) return {};
    var window = trend.slice(1, 1 + weeks);  // skip the latest, take next N
    var per = categoryTotalsAcross(window, 0);
    var out = {};
    Object.keys(per).forEach(function (k) {
      var m = median(per[k]);
      if (m != null) out[k] = +m.toFixed(2);
    });
    return out;
  }

  // Detect drift in the LATEST trend entry vs. rolling median.
  // Returns an array of { category, latest, baseline, deltaPct,
  // direction } for every category whose latest deviates by more
  // than `pctThreshold` (default 15%).
  function detectDrift(trend, opts) {
    opts = opts || {};
    var threshold = opts.thresholdPct != null ? opts.thresholdPct : 15;
    if (!Array.isArray(trend) || trend.length < 2) return [];
    var latest = trend[0] && trend[0].totalsByCategory;
    if (!latest) return [];
    var baseline = computeRollingMedian(trend, opts.weeks || 4);
    var out = [];
    Object.keys(latest).forEach(function (cat) {
      var v = latest[cat];
      var b = baseline[cat];
      if (b == null || b === 0) return;
      var deltaPct = ((v - b) / b) * 100;
      if (Math.abs(deltaPct) >= threshold) {
        out.push({
          category:  cat,
          latest:    +v.toFixed(2),
          baseline:  +b.toFixed(2),
          deltaPct:  +deltaPct.toFixed(1),
          direction: deltaPct > 0 ? 'up' : 'down'
        });
      }
    });
    // Largest absolute drift first.
    out.sort(function (a, b) { return Math.abs(b.deltaPct) - Math.abs(a.deltaPct); });
    return out;
  }

  // Plain-language coaching for a drift entry.
  function hintForDrift(category, direction, locale) {
    var es = (locale === 'es');
    var c = String(category || '').toLowerCase();
    if (c === 'protein' && direction === 'up') {
      return es ? 'La proteína subió. Revisa precios con tu proveedor o cambia de corte por una semana.'
                : 'Protein costs jumped. Call your supplier or switch cuts for a week.';
    }
    if (c === 'protein' && direction === 'down') {
      return es ? 'La proteína bajó. Mira si tu proveedor está liquidando — buena ventana para una promoción.'
                : 'Protein dropped. Likely a clearance — good window for a special.';
    }
    if (c === 'produce' && direction === 'up') {
      return es ? 'Las verduras subieron. Es estacional — considera un menú de temporada o ajustar precios de ensaladas.'
                : 'Produce up. Likely seasonal — consider a seasonal menu or salad reprice.';
    }
    if (c === 'paper' && direction === 'up') {
      return es ? 'El papel subió. Compara con un mayorista alterno; el papel rara vez es estacional.'
                : 'Paper costs up. Cross-check a backup wholesaler — paper rarely shifts seasonally.';
    }
    if (c === 'cleaning' && direction === 'up') {
      return es ? 'Los químicos subieron. Pide cotización a otro distribuidor.'
                : 'Cleaning costs up. Get a quote from a backup distributor.';
    }
    return es ? 'Movimiento mayor en esta categoría — revisa antes de pasarlo a tus precios de menú.'
              : 'Big move in this category — review before passing it to your menu prices.';
  }

  // Compute share-shifts: how each category's % of total invoice
  // spend has moved between the latest entry and the median over the
  // prior `lookback` entries. Returns { category, latestPct, baselinePct, deltaPp }
  // for any category whose share moved by more than `ppThreshold`
  // percentage points (default 10).
  function computeShareShifts(trend, opts) {
    opts = opts || {};
    var lookback = opts.lookback || 4;
    var ppThreshold = opts.ppThreshold != null ? opts.ppThreshold : 10;
    if (!Array.isArray(trend) || trend.length < 2) return [];
    function shareMap(entry) {
      if (!entry || !entry.totalsByCategory) return {};
      var sum = 0;
      Object.keys(entry.totalsByCategory).forEach(function (k) {
        sum += entry.totalsByCategory[k] || 0;
      });
      if (sum === 0) return {};
      var out = {};
      Object.keys(entry.totalsByCategory).forEach(function (k) {
        out[k] = ((entry.totalsByCategory[k] || 0) / sum) * 100;
      });
      return out;
    }
    var latestShares = shareMap(trend[0]);
    var prevShares = trend.slice(1, 1 + lookback).map(shareMap);
    var per = {};
    prevShares.forEach(function (m) {
      Object.keys(m).forEach(function (k) { (per[k] = per[k] || []).push(m[k]); });
    });
    var out = [];
    Object.keys(latestShares).forEach(function (cat) {
      var prevList = per[cat] || [];
      var baseline = median(prevList);
      if (baseline == null) return;
      var deltaPp = latestShares[cat] - baseline;
      if (Math.abs(deltaPp) >= ppThreshold) {
        out.push({
          category:    cat,
          latestPct:   +latestShares[cat].toFixed(1),
          baselinePct: +baseline.toFixed(1),
          deltaPp:     +deltaPp.toFixed(1)
        });
      }
    });
    out.sort(function (a, b) { return Math.abs(b.deltaPp) - Math.abs(a.deltaPp); });
    return out;
  }

  // Food-cost band over the trend. Used by Margin Math to snap the
  // food-cost % slider into the operator's actual recent range and
  // warn when they drag below the floor. Requires a revenueHint
  // (operator-typed weekly sales) to convert dollars into a ratio.
  function computeFoodCostBand(trend, revenueHint, opts) {
    opts = opts || {};
    var minEntries = opts.minEntries || 3;
    if (!Array.isArray(trend) || trend.length < minEntries) return null;
    if (!revenueHint || !isFinite(revenueHint) || revenueHint <= 0) return null;
    var ratios = trend.slice(0, 8).map(function (e) {
      return (e && typeof e.parsedSum === 'number') ? (e.parsedSum / revenueHint) * 100 : null;
    }).filter(function (r) { return r != null && isFinite(r); });
    if (ratios.length < minEntries) return null;
    var sorted = ratios.slice().sort(function (a, b) { return a - b; });
    return {
      currentlyAt: +ratios[0].toFixed(1),
      low:         +sorted[0].toFixed(1),
      high:        +sorted[sorted.length - 1].toFixed(1),
      median:      +(median(sorted) || 0).toFixed(1),
      sampleSize:  ratios.length
    };
  }

  var api = {
    median:               median,
    computeRollingMedian: computeRollingMedian,
    detectDrift:          detectDrift,
    hintForDrift:         hintForDrift,
    computeShareShifts:   computeShareShifts,
    computeFoodCostBand:  computeFoodCostBand
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuntinCostTrend = api;
})(typeof window !== 'undefined' ? window : null);
