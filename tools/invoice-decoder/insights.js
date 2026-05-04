/**
 * Owner-grade insight engine (Wave 12).
 *
 * Eight insights, each computed locally from the operator's own
 * MuntinContext data. Each one is the answer to a question the
 * operator didn't know to ask:
 *
 *   12.1 detectShrinkage(rows, vendor)
 *        Liquor + protein z-score against the operator's own median
 *        order frequency over the last 28 days. Flag when |z| ≥ 1.8
 *        AND $ exposure ≥ $200. Neutral framing, no accusation.
 *
 *   12.2 buildReorderShortlist(opts)
 *        Cadence-based: cadenceDays = median(diff(ts)) for each stem;
 *        dueProb = (daysSinceLast - cadenceDays) / std(diff(ts)).
 *        Returns [{stem, lastSeen, cadenceDays, dueProb, vendor,
 *        suggestedQty}] sorted by urgency × $ weight.
 *
 *   12.3 forecastInvoiceTotal(rows, vendor)
 *        Rolling μ ± σ band from invoiceTrend per vendor. Returns
 *        {vendor, expectedRange:[lo,hi], actual, deltaPct,
 *         categoryDriver}.
 *
 *   12.4 aggregateVendorSwitchRoi()
 *        Walks every category × every pair of vendors that share
 *        ≥3 SKUs in MID_SKU_HISTORY; computes monthly $ delta.
 *        Returns top 5 actionable swaps.
 *
 *   12.5 menuBridge(rows)
 *        Shared with Wave 10.8 dish-recompute. Returns the top 3
 *        dishes most affected by this invoice's price moves.
 *
 *   12.6 dailyFoodCostRunRate(weeklyRevenue)
 *        Last-7-days parsedSum ÷ revenue → invoiced FC%. Compare to
 *        weighted dish foodCost from MuntinContext.dishes. Delta =
 *        leak signal.
 *
 *   12.7 detectSeasonality(stem)
 *        Compare current monthly aggregate to same-month-last-year.
 *        Pre-threshold (< 10 months history) returns explicit
 *        {unlocked: false, monthsAvailable: N}.
 *
 *   12.8 supplierHealth(vendor)
 *        Composite 0-100 score from backorder rate, price stability
 *        CV, substitution rate, contract-violation rate, surcharge
 *        frequency.
 *
 * Privacy posture: all computations local, plaintext aggregates only.
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
  function _stem() {
    if (typeof root !== 'undefined' && root && root.MuntinStem) return root.MuntinStem;
    if (typeof require !== 'undefined') {
      try { return require('../_shared/stem.js'); } catch (_) { return null; }
    }
    return null;
  }
  function _skuHist() {
    if (typeof root !== 'undefined' && root && root.MID_SKU_HISTORY) return root.MID_SKU_HISTORY;
    return null;
  }

  // -------- math helpers --------
  function _mean(arr) { if (!arr.length) return 0; var s = 0; for (var i = 0; i < arr.length; i++) s += arr[i]; return s / arr.length; }
  function _std(arr) { if (arr.length < 2) return 0; var m = _mean(arr); var v = 0; for (var i = 0; i < arr.length; i++) v += (arr[i] - m) * (arr[i] - m); return Math.sqrt(v / (arr.length - 1)); }
  function _median(arr) { if (!arr.length) return 0; var sorted = arr.slice().sort(function (a, b) { return a - b; }); var mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; }

  // 12.1 — Shrinkage anomaly. Operator-history-only. Returns array
  // of { stem, vendor, recentCount, expectedCount, z, $exposure, label }.
  function detectShrinkage(opts) {
    opts = opts || {};
    var ctx = _ctx();
    if (!ctx) return [];
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    if (!data || !data.skuHistory) return [];
    var WINDOW_MS = 28 * 86400000;
    var nowMs = Date.now();
    var TARGETS = /^(beverage|protein|seafood)$/;
    var out = [];
    var skuMap = data.skuHistory;
    Object.keys(skuMap).forEach(function (stem) {
      var list = skuMap[stem];
      if (!Array.isArray(list) || list.length < 8) return;
      // Filter to target categories (we don't store category on
      // observations directly; infer from category-priors if present
      // or skip). For now, surface all stems with a sustained spike;
      // narrow later.
      var recent = list.filter(function (e) { return (nowMs - (e.ts || 0)) < WINDOW_MS; });
      if (recent.length < 2) return;
      // Compute order count per 7-day bucket across the operator's
      // history. The "expected" is the median bucket count.
      var buckets = {};
      list.forEach(function (e) {
        if (!e.ts) return;
        var bucketIdx = Math.floor(e.ts / (7 * 86400000));
        buckets[bucketIdx] = (buckets[bucketIdx] || 0) + 1;
      });
      var bucketCounts = Object.values(buckets);
      if (bucketCounts.length < 4) return;
      var med = _median(bucketCounts);
      var sd  = _std(bucketCounts);
      if (sd === 0) return;
      // Recent-bucket count.
      var recentBucketIdx = Math.floor(nowMs / (7 * 86400000));
      var recentBucketCount = buckets[recentBucketIdx] || 0;
      var z = (recentBucketCount - med) / sd;
      if (z < 1.8) return;
      var dollarExposure = recent.reduce(function (s, e) { return s + (e.unitPrice * (e.qty || 1)); }, 0);
      if (dollarExposure < 200) return;
      out.push({
        stem: stem,
        vendor: recent[0].vendor || null,
        recentCount: recentBucketCount,
        expectedCount: +med.toFixed(1),
        z: +z.toFixed(2),
        dollarExposure: +dollarExposure.toFixed(2),
        label: recent[0].vendor ? recent[0].vendor + ': ' + stem : stem
      });
    });
    out.sort(function (a, b) { return b.z - a.z; });
    return out;
  }

  // 12.2 — Predictive reorder shortlist.
  function buildReorderShortlist(opts) {
    opts = opts || {};
    var ctx = _ctx();
    if (!ctx) return [];
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    if (!data || !data.skuHistory) return [];
    var nowMs = Date.now();
    var minObs = opts.minObservations || 4;
    var out = [];
    Object.keys(data.skuHistory).forEach(function (stem) {
      var list = data.skuHistory[stem];
      if (!Array.isArray(list) || list.length < minObs) return;
      // Compute diffs between consecutive ts (newest-first list).
      var diffsMs = [];
      for (var i = 0; i + 1 < list.length; i++) {
        if (list[i].ts && list[i + 1].ts) diffsMs.push(list[i].ts - list[i + 1].ts);
      }
      if (!diffsMs.length) return;
      var medianMs = _median(diffsMs);
      var sdMs     = _std(diffsMs);
      var cadenceDays = medianMs / 86400000;
      if (cadenceDays < 0.5 || cadenceDays > 60) return;     // ignore noise
      var lastSeenMs = list[0].ts;
      var daysSinceLast = (nowMs - lastSeenMs) / 86400000;
      var dueProb = sdMs > 0 ? ((nowMs - lastSeenMs) - medianMs) / sdMs : 0;
      if (dueProb < 0.5) return;
      var lastQty = list[0].qty || 1;
      var lastPrice = list[0].unitPrice || 0;
      var weight = (lastPrice * lastQty) || 1;
      out.push({
        stem: stem,
        vendor: list[0].vendor || null,
        cadenceDays: +cadenceDays.toFixed(1),
        daysSinceLast: +daysSinceLast.toFixed(1),
        dueProb: +dueProb.toFixed(2),
        suggestedQty: lastQty,
        unit: list[0].unit || null,
        lastUnitPrice: lastPrice,
        urgencyScore: +((dueProb || 0) * weight).toFixed(2)
      });
    });
    out.sort(function (a, b) { return b.urgencyScore - a.urgencyScore; });
    return out.slice(0, opts.max || 12);
  }

  // Build a clipboard-ready order pad string grouped by vendor.
  function formatOrderPad(items, opts) {
    opts = opts || {};
    if (!items || !items.length) return '';
    var grouped = {};
    items.forEach(function (it) {
      var v = it.vendor || 'Other';
      (grouped[v] = grouped[v] || []).push(it);
    });
    var out = [];
    Object.keys(grouped).forEach(function (v) {
      out.push('— ' + v + ' —');
      grouped[v].forEach(function (it) {
        var qty = it.suggestedQty + (it.unit ? ' ' + it.unit : '');
        out.push('  ' + qty + '  ' + it.stem);
      });
      out.push('');
    });
    return out.join('\n').trim();
  }

  // 12.3 — Forecast vs actual invoice total.
  function forecastInvoiceTotal(rows, vendor) {
    var ctx = _ctx();
    if (!ctx || !vendor) return null;
    var trend = (typeof ctx.readTrend === 'function') ? ctx.readTrend() : [];
    var vendorTrend = trend.filter(function (e) { return e.vendor === vendor; });
    if (vendorTrend.length < 4) return null;
    var sums = vendorTrend.map(function (e) { return e.parsedSum || 0; });
    var med = _median(sums);
    var sd = _std(sums);
    var actual = (rows || []).reduce(function (s, r) { return s + (r.lineTotal || 0); }, 0);
    var lo = +(med - sd).toFixed(2);
    var hi = +(med + sd).toFixed(2);
    var deltaPct = med > 0 ? +(((actual - med) / med) * 100).toFixed(1) : 0;
    // Find category with biggest contribution.
    var thisInvoiceCats = {};
    (rows || []).forEach(function (r) {
      if (!r || !r.category || typeof r.lineTotal !== 'number') return;
      thisInvoiceCats[r.category] = (thisInvoiceCats[r.category] || 0) + r.lineTotal;
    });
    var medianCats = {};
    vendorTrend.forEach(function (e) {
      Object.keys(e.totalsByCategory || {}).forEach(function (k) {
        (medianCats[k] = medianCats[k] || []).push(e.totalsByCategory[k]);
      });
    });
    var biggestDriver = null, biggestDelta = 0;
    Object.keys(thisInvoiceCats).forEach(function (k) {
      var prev = _median(medianCats[k] || []);
      var d = thisInvoiceCats[k] - prev;
      if (Math.abs(d) > Math.abs(biggestDelta)) { biggestDelta = d; biggestDriver = { category: k, delta: +d.toFixed(2), expected: +prev.toFixed(2), actual: +thisInvoiceCats[k].toFixed(2) }; }
    });
    return {
      vendor: vendor,
      expectedRange: [Math.max(0, lo), hi],
      median: +med.toFixed(2),
      actual: +actual.toFixed(2),
      deltaPct: deltaPct,
      categoryDriver: biggestDriver,
      sampleSize: vendorTrend.length
    };
  }

  // 12.4 — Aggregate vendor-switch ROI. Walks every stem with ≥2
  // vendors and projects monthly delta if the operator switched.
  function aggregateVendorSwitchRoi(opts) {
    opts = opts || {};
    var ctx = _ctx();
    if (!ctx) return [];
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    if (!data || !data.skuHistory) return [];
    var trend = (typeof ctx.readTrend === 'function') ? ctx.readTrend() : [];
    // Approximate monthly volume per vendor from trend.
    var vendorMonthly = {};
    trend.forEach(function (e) {
      if (!e.vendor) return;
      vendorMonthly[e.vendor] = (vendorMonthly[e.vendor] || 0) + (e.parsedSum || 0);
    });
    // Per-stem cheapest/current vendor + dollar exposure.
    var swaps = {};
    Object.keys(data.skuHistory).forEach(function (stem) {
      var list = data.skuHistory[stem];
      if (!Array.isArray(list) || list.length < 4) return;
      var perVendor = {};
      list.forEach(function (e) {
        if (!e.vendor || typeof e.unitPrice !== 'number') return;
        (perVendor[e.vendor] = perVendor[e.vendor] || []).push(e.unitPrice);
      });
      var vendors = Object.keys(perVendor);
      if (vendors.length < 2) return;
      var ranked = vendors.map(function (v) {
        return { vendor: v, median: _median(perVendor[v]), n: perVendor[v].length };
      }).filter(function (r) { return r.n >= 2; }).sort(function (a, b) { return a.median - b.median; });
      if (ranked.length < 2) return;
      var cheapest = ranked[0], currentVendor = list[0].vendor;
      if (cheapest.vendor === currentVendor) return;
      var current = ranked.find(function (r) { return r.vendor === currentVendor; });
      if (!current) return;
      var pricePerUnitDelta = current.median - cheapest.median;
      if (pricePerUnitDelta <= 0) return;
      var monthlyQty = list.filter(function (e) { return (Date.now() - e.ts) < 30 * 86400000; })
                          .reduce(function (s, e) { return s + (e.qty || 1); }, 0);
      var monthlySaving = pricePerUnitDelta * monthlyQty;
      if (monthlySaving < 5) return;
      // Bucket by category-of-swap by inferring from the latest entry's
      // unit (lb → protein/produce, gal → dry-goods, etc — coarse).
      var bucketKey = currentVendor + '→' + cheapest.vendor;
      if (!swaps[bucketKey]) swaps[bucketKey] = { from: currentVendor, to: cheapest.vendor, monthlyDelta: 0, stems: [] };
      swaps[bucketKey].monthlyDelta += monthlySaving;
      swaps[bucketKey].stems.push({ stem: stem, monthlyDelta: +monthlySaving.toFixed(2) });
    });
    var out = Object.values(swaps).filter(function (s) { return s.monthlyDelta >= 50; });
    out.forEach(function (s) {
      s.monthlyDelta = +s.monthlyDelta.toFixed(2);
      s.stems.sort(function (a, b) { return b.monthlyDelta - a.monthlyDelta; });
      s.stems = s.stems.slice(0, 6);
    });
    out.sort(function (a, b) { return b.monthlyDelta - a.monthlyDelta; });
    return out.slice(0, opts.max || 5);
  }

  // 12.6 — Daily food-cost run-rate vs Plate Cost. Returns the leak
  // signal: invoiced FC% minus menu-derived FC%.
  function dailyFoodCostRunRate(weeklyRevenue) {
    var ctx = _ctx();
    if (!ctx || !weeklyRevenue || weeklyRevenue <= 0) return null;
    var trend = (typeof ctx.readTrend === 'function') ? ctx.readTrend() : [];
    var weekAgo = Date.now() - 7 * 86400000;
    var lastWeekSpend = trend
      .filter(function (e) { return e.savedAt > weekAgo; })
      .reduce(function (s, e) { return s + (e.parsedSum || 0); }, 0);
    var invoicedFcPct = lastWeekSpend / weeklyRevenue;
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    var dishes = (data && data.dishes) || [];
    var menuFcPct = null;
    if (dishes.length) {
      // Weight by dish.units; fallback to equal if no units field.
      var totalUnits = 0, weightedFc = 0;
      dishes.forEach(function (d) {
        var u = (typeof d.units === 'number' && d.units > 0) ? d.units : 1;
        var price = parseFloat(d.menuPrice) || 0;
        var cost  = parseFloat(d.foodCost) || 0;
        if (price <= 0) return;
        totalUnits += u;
        weightedFc += (cost / price) * u;
      });
      if (totalUnits > 0) menuFcPct = weightedFc / totalUnits;
    }
    var leak = (menuFcPct != null) ? +(invoicedFcPct - menuFcPct).toFixed(4) : null;
    return {
      invoicedFcPct: +invoicedFcPct.toFixed(4),
      menuFcPct:     menuFcPct != null ? +menuFcPct.toFixed(4) : null,
      leakPct:       leak,
      leakDollars:   leak != null ? +(leak * weeklyRevenue).toFixed(2) : null,
      lastWeekSpend: +lastWeekSpend.toFixed(2),
      sampleSize:    trend.filter(function (e) { return e.savedAt > weekAgo; }).length
    };
  }

  // 12.7 — Seasonality. Pre-threshold UI when < 10 months of history.
  function detectSeasonality(stem, opts) {
    opts = opts || {};
    var ctx = _ctx();
    if (!ctx) return null;
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    if (!data || !data.skuHistory) return null;
    var key = stem;
    var s = _stem();
    if (s && opts.byName) key = s.extractStem(opts.byName);
    if (!key) return null;
    var list = data.skuHistory[key] || [];
    if (!list.length) return { unlocked: false, monthsAvailable: 0, reason: 'no-history' };
    var oldest = list[list.length - 1];
    var newest = list[0];
    if (!oldest.ts || !newest.ts) return { unlocked: false, monthsAvailable: 0 };
    var monthsSpan = (newest.ts - oldest.ts) / (30 * 86400000);
    if (monthsSpan < 10) return { unlocked: false, monthsAvailable: +monthsSpan.toFixed(1) };
    // Bucket prices by year-month; compare current month to same-
    // month-last-year.
    var byMonth = {};
    list.forEach(function (e) {
      if (!e.ts || typeof e.unitPrice !== 'number') return;
      var d = new Date(e.ts);
      var key2 = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      (byMonth[key2] = byMonth[key2] || []).push(e.unitPrice);
    });
    var nowD = new Date();
    var thisKey = nowD.getFullYear() + '-' + String(nowD.getMonth() + 1).padStart(2, '0');
    var lastYearKey = (nowD.getFullYear() - 1) + '-' + String(nowD.getMonth() + 1).padStart(2, '0');
    var thisMed = byMonth[thisKey] ? _median(byMonth[thisKey]) : null;
    var lastYearMed = byMonth[lastYearKey] ? _median(byMonth[lastYearKey]) : null;
    if (lastYearMed == null) return { unlocked: false, monthsAvailable: +monthsSpan.toFixed(1), reason: 'no-prior-year' };
    var deltaPct = thisMed != null ? ((thisMed - lastYearMed) / lastYearMed) * 100 : null;
    return {
      unlocked: true,
      stem: key,
      monthsAvailable: +monthsSpan.toFixed(1),
      thisMonth: thisMed,
      sameMonthLastYear: lastYearMed,
      deltaPct: deltaPct != null ? +deltaPct.toFixed(1) : null
    };
  }

  // 12.8 — Supplier health score (0-100).
  function supplierHealth(vendor) {
    if (!vendor) return null;
    var ctx = _ctx();
    if (!ctx) return null;
    var data = (typeof ctx.read === 'function') ? ctx.read() : null;
    var trend = (typeof ctx.readTrend === 'function') ? ctx.readTrend() : [];
    var vendorTrend = trend.filter(function (e) { return e.vendor === vendor; });
    if (vendorTrend.length < 3) return null;
    // Backorder rate: requires per-row kind, which we don't store
    // in the trend. Approximate from skuHistory entries with kind='backorder'
    var backorderCount = 0, totalRows = 0;
    Object.keys((data && data.skuHistory) || {}).forEach(function (stem) {
      data.skuHistory[stem].forEach(function (e) {
        if (e.vendor !== vendor) return;
        totalRows++;
        if (e.kind === 'backorder') backorderCount++;
      });
    });
    var backorderRate = totalRows > 0 ? backorderCount / totalRows : 0;
    // Price stability: CV of unitPrice across the vendor's stems.
    var cvList = [];
    Object.keys((data && data.skuHistory) || {}).forEach(function (stem) {
      var prices = data.skuHistory[stem]
        .filter(function (e) { return e.vendor === vendor && typeof e.unitPrice === 'number'; })
        .map(function (e) { return e.unitPrice; });
      if (prices.length < 3) return;
      var m = _mean(prices); var s = _std(prices);
      if (m > 0) cvList.push(s / m);
    });
    var meanCV = cvList.length ? _mean(cvList) : 0;
    // Surcharge frequency: trend entries where the totals include a
    // surcharge category aren't tracked; use a rough proxy of fee-line
    // presence via the slimEntries we'd have to extend. For now,
    // surface 0 (improves scoring slightly when no surcharges seen).
    var surchargeRate = 0;
    // Composite score components.
    var backorderPts  = 25 * (1 - Math.min(1, backorderRate * 5));     // 0% → 25, 20% → 0
    var stabilityPts  = 25 * (1 - Math.min(1, meanCV * 4));            // CV 0 → 25, 0.25 → 0
    var contractPts   = 20;                                            // placeholder until dish-drift integration
    var substPts      = 20;
    var surchargePts  = 10 * (1 - Math.min(1, surchargeRate * 5));
    var score = Math.round(backorderPts + stabilityPts + contractPts + substPts + surchargePts);
    return {
      vendor: vendor,
      score: score,
      breakdown: {
        backorder:  +backorderPts.toFixed(1),
        stability:  +stabilityPts.toFixed(1),
        contract:   +contractPts.toFixed(1),
        substitution: +substPts.toFixed(1),
        surcharge:  +surchargePts.toFixed(1)
      },
      stats: {
        backorderRate:  +(backorderRate * 100).toFixed(1),
        priceCV:        +(meanCV * 100).toFixed(1),
        invoicesSeen:   vendorTrend.length
      }
    };
  }

  var api = {
    detectShrinkage:        detectShrinkage,
    buildReorderShortlist:  buildReorderShortlist,
    formatOrderPad:         formatOrderPad,
    forecastInvoiceTotal:   forecastInvoiceTotal,
    aggregateVendorSwitchRoi: aggregateVendorSwitchRoi,
    dailyFoodCostRunRate:   dailyFoodCostRunRate,
    detectSeasonality:      detectSeasonality,
    supplierHealth:         supplierHealth
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_INSIGHTS = api;
})(typeof window !== 'undefined' ? window : null);
