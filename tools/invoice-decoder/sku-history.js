/**
 * Invoice Decoder — per-SKU price history + contract watch
 * (Waves 1.1 / 1.2 / 2.3).
 *
 * Tracks per-SKU price observations across saved invoices so the
 * verification UI can surface:
 *   - "You paid $X. Last time: $Y. 90-day median: $Z."
 *   - Anomaly badges when this invoice's price is ≥15% off the
 *     operator's own rolling median.
 *   - Vendor Pulse Strip ("Chicken thigh +18%, Cilantro +9%").
 *   - Contract-price watch — flags any line where the actual
 *     price exceeds an operator-set negotiated price.
 *
 * Privacy posture:
 *   - All data lives in MuntinContext (localStorage) on the device.
 *   - Plaintext is OK because these are aggregates (price/qty/unit
 *     by stem, no descriptions, no SKUs, no raw OCR text).
 *   - Capped at 200 stems × 24 entries each (~80KB worst case).
 *   - Never crosses the network. Same posture as `invoiceTrend`.
 *
 * Storage shape (additive on MuntinContext):
 *   {
 *     skuHistory: {
 *       [stem]: [{ vendor, ts, qty, unit, unitPrice }, ... up to 24]
 *     },
 *     contractPrices: {
 *       [stem]: { unitPrice, vendor, unit, setAt }
 *     }
 *   }
 */
(function (root) {
  'use strict';

  var STEM_CAP = 200;
  var ENTRY_CAP_PER_STEM = 24;
  var CONTRACT_CAP = 100;
  var ANOMALY_THRESHOLD_PCT = 15;
  var MIN_OBSERVATIONS_FOR_ANOMALY = 3;
  var STALE_CONTRACT_DAYS = 90;

  // Resolve at-call (not at IIFE-capture) so test harnesses that
  // re-seed `global.window` between blocks see the new MuntinContext.
  function getRoot() {
    var g = (typeof globalThis !== 'undefined') ? globalThis : null;
    if (g && g.window) return g.window;
    if (typeof window !== 'undefined') return window;
    return g;
  }
  function ctx() {
    var r = getRoot();
    if (!r || !r.MuntinContext) return null;
    return r.MuntinContext;
  }

  // Stem extraction lives in learnings.js; reuse to keep the
  // normalization rule identical across modules.
  function stemOf(name) {
    var r = getRoot();
    if (r && r.MID_LEARNINGS && typeof r.MID_LEARNINGS.extractStem === 'function') {
      return r.MID_LEARNINGS.extractStem(name);
    }
    // Fallback when learnings.js hasn't loaded (e.g. unit tests).
    return String(name || '')
      .toLowerCase()
      .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
      .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\b\d+\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function readStore() {
    var c = ctx();
    if (!c) return { skuHistory: {}, contractPrices: {} };
    var data = c.read() || {};
    return {
      skuHistory:     data.skuHistory     || {},
      contractPrices: data.contractPrices || {}
    };
  }

  function writeStore(patch) {
    var c = ctx();
    if (!c) return false;
    return c.merge(patch);
  }

  // Append a price observation for one row. Returns the stem key
  // used so callers can group multi-row updates without re-stemming.
  // Pack-aware: when row.comparable carries a per-base-unit price,
  // we record it alongside raw unitPrice so cross-vendor + pack-
  // change drift detection can use the more meaningful metric.
  function recordObservation(row, vendor) {
    if (!row || typeof row !== 'object') return null;
    if (typeof row.unitPrice !== 'number' && typeof row.lineTotal !== 'number') return null;
    var stem = stemOf(row.name);
    if (!stem || stem.length < 3) return null;
    var unitPrice = (typeof row.unitPrice === 'number')
      ? row.unitPrice
      : (row.lineTotal && row.qty ? row.lineTotal / row.qty : null);
    if (unitPrice == null || !isFinite(unitPrice) || unitPrice <= 0) return null;
    var s = readStore();
    var list = Array.isArray(s.skuHistory[stem]) ? s.skuHistory[stem].slice() : [];
    var entry = {
      vendor:    vendor || row.vendorDetected || null,
      ts:        Date.now(),
      qty:       (typeof row.qty === 'number') ? row.qty : null,
      unit:      row.unit || null,
      unitPrice: +unitPrice.toFixed(4)
    };
    if (row.comparable && typeof row.comparable.perBaseUnit === 'number') {
      entry.comparablePrice = row.comparable.perBaseUnit;
      entry.comparableUnit  = row.comparable.baseUnit;
    }
    list.unshift(entry);
    if (list.length > ENTRY_CAP_PER_STEM) list = list.slice(0, ENTRY_CAP_PER_STEM);
    s.skuHistory[stem] = list;
    // Cap total stems — drop stems with the oldest single newest entry.
    var stemKeys = Object.keys(s.skuHistory);
    if (stemKeys.length > STEM_CAP) {
      var oldest = stemKeys
        .map(function (k) { return { k: k, ts: (s.skuHistory[k][0] && s.skuHistory[k][0].ts) || 0 }; })
        .sort(function (a, b) { return a.ts - b.ts; })
        .slice(0, stemKeys.length - STEM_CAP)
        .map(function (e) { return e.k; });
      oldest.forEach(function (k) { delete s.skuHistory[k]; });
    }
    writeStore({ skuHistory: s.skuHistory });
    return stem;
  }

  // Convenience: record many observations in one write.
  function recordObservations(rows, vendor) {
    if (!Array.isArray(rows)) return [];
    var s = readStore();
    var stems = [];
    rows.forEach(function (row) {
      if (!row || row.kind && row.kind !== 'item') return; // skip credits/deposits
      var stem = stemOf(row.name);
      if (!stem || stem.length < 3) return;
      var unitPrice = (typeof row.unitPrice === 'number')
        ? row.unitPrice
        : (row.lineTotal && row.qty ? row.lineTotal / row.qty : null);
      if (unitPrice == null || !isFinite(unitPrice) || unitPrice <= 0) return;
      var list = Array.isArray(s.skuHistory[stem]) ? s.skuHistory[stem].slice() : [];
      var entry = {
        vendor:    vendor || row.vendorDetected || null,
        ts:        Date.now(),
        qty:       (typeof row.qty === 'number') ? row.qty : null,
        unit:      row.unit || null,
        unitPrice: +unitPrice.toFixed(4)
      };
      if (row.comparable && typeof row.comparable.perBaseUnit === 'number') {
        entry.comparablePrice = row.comparable.perBaseUnit;
        entry.comparableUnit  = row.comparable.baseUnit;
      }
      list.unshift(entry);
      if (list.length > ENTRY_CAP_PER_STEM) list = list.slice(0, ENTRY_CAP_PER_STEM);
      s.skuHistory[stem] = list;
      stems.push(stem);
    });
    var stemKeys = Object.keys(s.skuHistory);
    if (stemKeys.length > STEM_CAP) {
      var oldest = stemKeys
        .map(function (k) { return { k: k, ts: (s.skuHistory[k][0] && s.skuHistory[k][0].ts) || 0 }; })
        .sort(function (a, b) { return a.ts - b.ts; })
        .slice(0, stemKeys.length - STEM_CAP)
        .map(function (e) { return e.k; });
      oldest.forEach(function (k) { delete s.skuHistory[k]; });
    }
    writeStore({ skuHistory: s.skuHistory });
    return stems;
  }

  // Wave 4.5 — same-vendor SKU memory bias. Given a candidate row
  // name and a vendor id, look across the operator's stem store for
  // close matches recently observed from the same vendor. Returns
  // { stem, distance, observations, lastSeen, lastUnitPrice } when a
  // single dominant match exists within edit-distance ≤ 2 AND ≥ 2
  // recent observations, null otherwise. Conservative — fires only
  // on real matches; never on first-time SKUs.
  function _editDistance(a, b) {
    if (a === b) return 0;
    var alen = a.length, blen = b.length;
    if (!alen) return blen;
    if (!blen) return alen;
    if (Math.abs(alen - blen) > 2) return Infinity;
    var prev = new Array(blen + 1);
    var curr = new Array(blen + 1);
    for (var j = 0; j <= blen; j++) prev[j] = j;
    for (var i = 1; i <= alen; i++) {
      curr[0] = i;
      for (var j2 = 1; j2 <= blen; j2++) {
        var cost = (a.charAt(i - 1) === b.charAt(j2 - 1)) ? 0 : 1;
        curr[j2] = Math.min(curr[j2 - 1] + 1, prev[j2] + 1, prev[j2 - 1] + cost);
      }
      var tmp = prev; prev = curr; curr = tmp;
    }
    return prev[blen];
  }
  function findClosestVendorMemory(name, vendor) {
    var queryStem = stemOf(name);
    if (!queryStem || queryStem.length < 4) return null;
    var s = readStore();
    var stems = Object.keys(s.skuHistory || {});
    var best = null;
    var bestDist = 3; // max edit distance we'll accept
    var horizon = Date.now() - 90 * 86400000;
    stems.forEach(function (stem) {
      if (Math.abs(stem.length - queryStem.length) > 2) return;
      var list = s.skuHistory[stem] || [];
      // Filter to same-vendor recent observations.
      var recent = list.filter(function (e) {
        return (vendor ? (e.vendor === vendor) : true) && e.ts > horizon;
      });
      if (recent.length < 2) return;
      var d = _editDistance(stem, queryStem);
      if (d < bestDist) {
        bestDist = d;
        best = {
          stem: stem,
          distance: d,
          observations: recent.length,
          lastSeen: recent[0].ts,
          lastUnitPrice: recent[0].unitPrice,
          lastUnit: recent[0].unit
        };
      }
    });
    return best;
  }

  // Returns history list for a row's stem, optionally constrained to
  // matching unit (so case-priced and each-priced entries stay
  // separate). Newest-first order.
  function lookupHistory(row, opts) {
    var stem = stemOf(row && row.name);
    if (!stem) return [];
    var s = readStore();
    var list = s.skuHistory[stem] || [];
    if (opts && opts.unit) {
      list = list.filter(function (e) {
        return !e.unit || !opts.unit || String(e.unit).toLowerCase() === String(opts.unit).toLowerCase();
      });
    }
    return list.slice();
  }

  // Median of the last N observations excluding the most-recent
  // (which is presumably the row currently under review).
  function rollingMedian(history, opts) {
    opts = opts || {};
    var skip = opts.skipLatest ? 1 : 0;
    var window = opts.window || 90;     // days
    var minN = opts.minN || MIN_OBSERVATIONS_FOR_ANOMALY;
    var cutoff = Date.now() - window * 86400000;
    var pool = history.slice(skip).filter(function (e) {
      return e && typeof e.unitPrice === 'number' && e.ts >= cutoff;
    });
    if (pool.length < minN) return null;
    var sorted = pool.map(function (e) { return e.unitPrice; }).sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // Wave 1.1 — per-row drift summary. Returns null when the row has
  // no comparable history (first time we've seen this stem).
  //
  // Pack-aware: when the current row + history both carry
  // comparablePrice (via pack-pricing.js), the drift metric uses
  // the comparable per-base-unit price. This means a vendor changing
  // from 12-pack to 24-pack of the same beer doesn't show as a
  // "+100%" anomaly — the per-oz price is what actually moved.
  // Falls back to raw unitPrice when comparable data isn't present
  // (older history entries, ambiguous packs, count-only items).
  //
  //   {
  //     unitPrice, lastPrice, median90, deltaPct, medianDelta,
  //     direction: 'up' | 'down' | 'flat',
  //     isAnomaly, observations,
  //     // when pack-aware:
  //     comparablePrice, comparableUnit, basis: 'pack' | 'unit'
  //   }
  function summarizeRow(row) {
    if (!row || (typeof row.unitPrice !== 'number' && (typeof row.lineTotal !== 'number' || !row.qty))) return null;
    var rawUnitPrice = (typeof row.unitPrice === 'number')
      ? row.unitPrice
      : row.lineTotal / row.qty;
    if (!isFinite(rawUnitPrice) || rawUnitPrice <= 0) return null;
    var history = lookupHistory(row);
    if (!history.length) return { unitPrice: +rawUnitPrice.toFixed(4), observations: 0 };

    // Pack-aware path: prefer comparablePrice when the current row
    // AND ≥half of the recent history share the SAME base unit.
    // This avoids comparing $/lb to $/oz when a row's pack notation
    // changes shape between weeks.
    var currentComp = (row.comparable && typeof row.comparable.perBaseUnit === 'number')
      ? { perBaseUnit: row.comparable.perBaseUnit, baseUnit: row.comparable.baseUnit }
      : null;
    var compHistory = history.filter(function (h) {
      return typeof h.comparablePrice === 'number' && h.comparableUnit === (currentComp && currentComp.baseUnit);
    });
    var usingComparable = currentComp && compHistory.length >= Math.max(2, Math.floor(history.length / 2));

    var price       = usingComparable ? currentComp.perBaseUnit : rawUnitPrice;
    var lastPriceEntry = usingComparable ? compHistory[0] : history[0];
    var lastPrice   = usingComparable
      ? (lastPriceEntry && lastPriceEntry.comparablePrice)
      : (lastPriceEntry && lastPriceEntry.unitPrice);
    var medSource   = usingComparable
      ? compHistory.map(function (h) { return { unitPrice: h.comparablePrice, ts: h.ts }; })
      : history;
    var med = rollingMedian(medSource, { skipLatest: false, window: 90 });

    var deltaPct = (lastPrice && lastPrice > 0)
      ? ((price - lastPrice) / lastPrice) * 100
      : null;
    var medianDelta = (med && med > 0)
      ? ((price - med) / med) * 100
      : null;
    var dir = 'flat';
    if (deltaPct != null) {
      if (deltaPct > 1) dir = 'up';
      else if (deltaPct < -1) dir = 'down';
    }
    var observationsCount = usingComparable ? compHistory.length : history.length;
    var isAnomaly = (medianDelta != null && Math.abs(medianDelta) >= ANOMALY_THRESHOLD_PCT && observationsCount >= MIN_OBSERVATIONS_FOR_ANOMALY);
    return {
      unitPrice:        +rawUnitPrice.toFixed(4),
      lastPrice:        lastPrice != null ? +lastPrice.toFixed(4) : null,
      median90:         med != null ? +med.toFixed(4) : null,
      deltaPct:         deltaPct != null ? +deltaPct.toFixed(1) : null,
      medianDelta:      medianDelta != null ? +medianDelta.toFixed(1) : null,
      direction:        dir,
      isAnomaly:        !!isAnomaly,
      observations:     observationsCount,
      comparablePrice:  usingComparable ? +price.toFixed(4) : null,
      comparableUnit:   usingComparable ? currentComp.baseUnit : null,
      basis:            usingComparable ? 'pack' : 'unit'
    };
  }

  // Wave 2.3 — Vendor Pulse top movers. Returns up to N rows whose
  // current price has moved most against rolling median, ranked by
  // absolute delta × dollar weight.
  function topMovers(rows, opts) {
    opts = opts || {};
    var max = opts.max || 3;
    var minPct = (opts.minPct != null) ? opts.minPct : 5;
    var movers = [];
    rows.forEach(function (r) {
      if (!r || (r.kind && r.kind !== 'item')) return;
      var s = summarizeRow(r);
      if (!s) return;
      if (s.medianDelta == null || Math.abs(s.medianDelta) < minPct) return;
      var weight = Math.abs(s.medianDelta) * (r.lineTotal || s.unitPrice || 0);
      movers.push({
        name:        r.name,
        category:    r.category || null,
        deltaPct:    s.medianDelta,
        unitPrice:   s.unitPrice,
        median90:    s.median90,
        observations: s.observations,
        weight:      weight
      });
    });
    movers.sort(function (a, b) { return b.weight - a.weight; });
    return movers.slice(0, max);
  }

  // ---------------------------------------------------------------
  // Cross-vendor SKU comparison (domain-expert layer).
  //
  // For a given row stem, group every observation by vendor and
  // return { vendor, medianComparable, comparableUnit, observations,
  // gapPctVsCheapest } per vendor — sorted by price ascending. The
  // operator instantly sees "you buy this from 2 vendors; the
  // cheapest charges $0.117/fl_oz vs $0.146/fl_oz here."
  //
  // Conservative requirements to avoid noise:
  //   - Each vendor needs ≥3 observations before we report it.
  //   - All reported observations must share the same comparableUnit
  //     (we never compare $/lb to $/fl_oz).
  //   - Returns null when only one vendor exists or none have enough
  //     observations.
  // ---------------------------------------------------------------
  function compareAcrossVendors(rowOrName) {
    var stem = stemOf((rowOrName && rowOrName.name) || rowOrName);
    if (!stem) return null;
    var s = readStore();
    var list = s.skuHistory[stem] || [];
    if (!list.length) return null;
    // Bucket per vendor, only keep entries with comparablePrice in
    // the same unit. Use the row's own comparableUnit if provided,
    // otherwise pick whichever comparableUnit is most common.
    var rowUnit = rowOrName && rowOrName.comparable && rowOrName.comparable.baseUnit;
    if (!rowUnit) {
      var unitCounts = {};
      for (var i = 0; i < list.length; i++) {
        var u = list[i].comparableUnit;
        if (u) unitCounts[u] = (unitCounts[u] || 0) + 1;
      }
      var bestUnit = null, bestCount = 0;
      Object.keys(unitCounts).forEach(function (u) {
        if (unitCounts[u] > bestCount) { bestUnit = u; bestCount = unitCounts[u]; }
      });
      rowUnit = bestUnit;
    }
    if (!rowUnit) return null;
    var perVendor = {};
    list.forEach(function (e) {
      if (!e.vendor || typeof e.comparablePrice !== 'number') return;
      if (e.comparableUnit !== rowUnit) return;
      (perVendor[e.vendor] = perVendor[e.vendor] || []).push(e.comparablePrice);
    });
    var vendors = Object.keys(perVendor);
    if (vendors.length < 2) return null;
    // Compute median per vendor, drop vendors with <3 samples.
    var rows = [];
    vendors.forEach(function (v) {
      var pool = perVendor[v];
      if (pool.length < 3) return;
      var sorted = pool.slice().sort(function (a, b) { return a - b; });
      var mid = Math.floor(sorted.length / 2);
      var med = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      rows.push({
        vendor:           v,
        medianComparable: +med.toFixed(4),
        comparableUnit:   rowUnit,
        observations:     pool.length
      });
    });
    if (rows.length < 2) return null;
    rows.sort(function (a, b) { return a.medianComparable - b.medianComparable; });
    var cheapest = rows[0].medianComparable;
    rows.forEach(function (r) {
      r.gapPctVsCheapest = cheapest > 0
        ? +(((r.medianComparable - cheapest) / cheapest) * 100).toFixed(1)
        : 0;
    });
    return rows;
  }

  // ---------------------------------------------------------------
  // Volume-weighted invoice drift (domain-expert layer).
  //
  // Per-row drift × row dollar value, summed across the invoice.
  // Operator's actual question is "is THIS invoice expensive vs my
  // typical?" — not "are 12 rows up by some unweighted average?"
  // A row that's +20% on a $4 line moves the answer less than a row
  // that's +8% on a $200 line.
  //
  // Returns:
  //   {
  //     totalDriftDollars,         // sum of per-row drift in $
  //     totalDriftPct,             // weighted % vs baseline cost
  //     baselineDollars,           // sum of (line at median price)
  //     ratedRows,                 // count of rows with usable history
  //     byCategory: { protein: { drift, baseline, pct }, ... },
  //     topDrivers: [{ name, deltaPct, lineTotal, deltaDollars }, ...]
  //   }
  // ---------------------------------------------------------------
  function computeInvoiceDrift(rows) {
    if (!Array.isArray(rows)) return null;
    var totalDelta   = 0;
    var totalBaseline = 0;
    var ratedRows   = 0;
    var byCategory  = {};
    var drivers     = [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r) continue;
      // Skip non-item rows (tax, credit, deposit, discount, surcharge).
      if (r.kind && r.kind !== 'item') continue;
      if (typeof r.lineTotal !== 'number' || r.lineTotal <= 0) continue;
      var summary = summarizeRow(r);
      if (!summary || summary.medianDelta == null || summary.observations < MIN_OBSERVATIONS_FOR_ANOMALY) continue;
      var deltaFraction = summary.medianDelta / 100;
      // Baseline cost = lineTotal / (1 + deltaFraction). Keeps the
      // rollup comparable: total today vs total at the median price.
      var baseline = r.lineTotal / (1 + deltaFraction);
      var deltaDollars = r.lineTotal - baseline;
      totalDelta    += deltaDollars;
      totalBaseline += baseline;
      ratedRows++;
      var cat = r.category || 'uncategorized';
      var bucket = byCategory[cat] || { drift: 0, baseline: 0, lines: 0 };
      bucket.drift    += deltaDollars;
      bucket.baseline += baseline;
      bucket.lines    += 1;
      byCategory[cat] = bucket;
      drivers.push({
        name:         r.name,
        category:     r.category,
        deltaPct:     summary.medianDelta,
        lineTotal:    r.lineTotal,
        deltaDollars: +deltaDollars.toFixed(2)
      });
    }
    if (!ratedRows) return null;
    drivers.sort(function (a, b) { return Math.abs(b.deltaDollars) - Math.abs(a.deltaDollars); });
    var perCatOut = {};
    Object.keys(byCategory).forEach(function (k) {
      var b = byCategory[k];
      perCatOut[k] = {
        drift:    +b.drift.toFixed(2),
        baseline: +b.baseline.toFixed(2),
        pct:      b.baseline > 0 ? +((b.drift / b.baseline) * 100).toFixed(1) : 0,
        lines:    b.lines
      };
    });
    return {
      totalDriftDollars: +totalDelta.toFixed(2),
      totalDriftPct:     totalBaseline > 0 ? +((totalDelta / totalBaseline) * 100).toFixed(1) : 0,
      baselineDollars:   +totalBaseline.toFixed(2),
      ratedRows:         ratedRows,
      byCategory:        perCatOut,
      topDrivers:        drivers.slice(0, 5)
    };
  }

  // ---------------------------------------------------------------
  // Wave 1.2 — Contract-price watch (extended for comparable units).
  //
  // Operator types a negotiated price for one SKU; future invoices
  // flag any line where the actual price exceeds the contract.
  // Reconciliation report sums total $ overcharged across the period.
  //
  // Pack-aware extension: when opts.comparablePrice + opts.comparableUnit
  // are provided, we store them. checkRow() compares in the comparable
  // unit when both row + contract carry compatible comparables — so
  // an operator who negotiated "$3.20/lb chicken thigh" gets correctly
  // flagged whether the next invoice prices it as $/lb or as a 5LB
  // case at $16.
  // ---------------------------------------------------------------
  function setContract(rowName, unitPrice, opts) {
    if (typeof unitPrice !== 'number' || unitPrice <= 0) return false;
    var stem = stemOf(rowName);
    if (!stem) return false;
    var s = readStore();
    var contracts = s.contractPrices || {};
    var entry = {
      unitPrice: +unitPrice.toFixed(4),
      vendor:    (opts && opts.vendor) || null,
      unit:      (opts && opts.unit) || null,
      setAt:     Date.now()
    };
    if (opts && typeof opts.comparablePrice === 'number' && opts.comparableUnit) {
      entry.comparablePrice = +opts.comparablePrice.toFixed(4);
      entry.comparableUnit  = opts.comparableUnit;
    }
    contracts[stem] = entry;
    var keys = Object.keys(contracts);
    if (keys.length > CONTRACT_CAP) {
      // Drop oldest by setAt
      var oldest = keys.map(function (k) {
        return { k: k, t: contracts[k].setAt || 0 };
      }).sort(function (a, b) { return a.t - b.t; }).slice(0, keys.length - CONTRACT_CAP);
      oldest.forEach(function (e) { delete contracts[e.k]; });
    }
    writeStore({ contractPrices: contracts });
    return true;
  }

  function clearContract(rowName) {
    var stem = stemOf(rowName);
    if (!stem) return false;
    var s = readStore();
    var contracts = s.contractPrices || {};
    if (contracts[stem]) delete contracts[stem];
    writeStore({ contractPrices: contracts });
    return true;
  }

  function lookupContract(rowName) {
    var stem = stemOf(rowName);
    if (!stem) return null;
    var s = readStore();
    var c = s.contractPrices && s.contractPrices[stem];
    if (!c) return null;
    var staleMs = STALE_CONTRACT_DAYS * 86400000;
    var out = {
      unitPrice: c.unitPrice,
      vendor:    c.vendor,
      unit:      c.unit,
      setAt:     c.setAt,
      isStale:   (Date.now() - (c.setAt || 0)) > staleMs
    };
    // Pack-aware fields propagate so checkRow can do unit-correct math.
    if (typeof c.comparablePrice === 'number' && c.comparableUnit) {
      out.comparablePrice = c.comparablePrice;
      out.comparableUnit  = c.comparableUnit;
    }
    return out;
  }

  // For one parsed-row, compute "did we overpay vs contract?" Returns
  // null when no contract exists for the stem, an object otherwise.
  //
  // Pack-aware: when BOTH the contract and the row carry compatible
  // comparable prices (same baseUnit), compare in that unit. The
  // overcharge $ is computed off the row's totalQuantity in the
  // comparable unit so it stays accurate across pack-size changes.
  // Falls back to raw unitPrice when comparable data is missing on
  // either side.
  function checkRow(row) {
    var contract = lookupContract(row && row.name);
    if (!contract) return null;
    // Pack-aware path.
    if (contract.comparablePrice != null && contract.comparableUnit &&
        row && row.comparable &&
        row.comparable.baseUnit === contract.comparableUnit &&
        typeof row.comparable.perBaseUnit === 'number') {
      var cDiff = row.comparable.perBaseUnit - contract.comparablePrice;
      var cDiffPct = contract.comparablePrice > 0
        ? (cDiff / contract.comparablePrice) * 100
        : 0;
      var totalQ = row.comparable.totalQuantity || 0;
      return {
        contractPrice:        contract.unitPrice,
        contractComparable:   contract.comparablePrice,
        contractComparableUnit: contract.comparableUnit,
        actualPrice:          +(row.comparable.perBaseUnit).toFixed(4),
        actualComparable:     +(row.comparable.perBaseUnit).toFixed(4),
        actualComparableUnit: row.comparable.baseUnit,
        diffPerUnit:          +cDiff.toFixed(4),
        diffPct:              +cDiffPct.toFixed(1),
        overcharge:           +((cDiff * totalQ)).toFixed(2),
        isOver:               cDiff > (contract.comparablePrice * 0.005),
        isUnder:              cDiff < -(contract.comparablePrice * 0.005),
        isStale:              contract.isStale,
        vendor:               contract.vendor,
        basis:                'comparable'
      };
    }
    // Legacy unit-price path.
    var unitPrice = (typeof row.unitPrice === 'number')
      ? row.unitPrice
      : (row.lineTotal && row.qty ? row.lineTotal / row.qty : null);
    if (unitPrice == null) return null;
    var diff = unitPrice - contract.unitPrice;
    var diffPct = contract.unitPrice > 0 ? (diff / contract.unitPrice) * 100 : 0;
    var qty = (typeof row.qty === 'number' && row.qty > 0) ? row.qty : 1;
    return {
      contractPrice: contract.unitPrice,
      actualPrice:   +unitPrice.toFixed(4),
      diffPerUnit:   +diff.toFixed(4),
      diffPct:       +diffPct.toFixed(1),
      overcharge:    +(diff * qty).toFixed(2),
      isOver:        diff > 0.005,
      isUnder:       diff < -0.005,
      isStale:       contract.isStale,
      vendor:        contract.vendor,
      basis:         'unit'
    };
  }

  // Sum overcharges across an entire invoice — used by the
  // reconciliation-note button.
  function reconcileInvoice(rows) {
    if (!Array.isArray(rows)) return null;
    var total = 0;
    var lines = [];
    rows.forEach(function (r) {
      var check = checkRow(r);
      if (!check || !check.isOver) return;
      lines.push(Object.assign({ name: r.name }, check));
      total += check.overcharge;
    });
    if (!lines.length) return null;
    return {
      totalOvercharge: +total.toFixed(2),
      lineCount:       lines.length,
      lines:           lines
    };
  }

  function clearAll() {
    writeStore({ skuHistory: {}, contractPrices: {} });
  }

  // Wave 11.5 — per-(stem, vendor) price corridor for numeric
  // coherence checks. Returns { p10, median, p90, n } over the last
  // 8 observations matching the optional vendor filter, or null when
  // the operator's history doesn't have ≥4 samples for that key.
  // Used by parse.js to flag rows whose unit price falls outside
  // the operator's typical band — catches OCR digit-swaps that the
  // qty × price = lineTotal check misses.
  function priceCorridor(stemKey, opts) {
    if (!stemKey) return null;
    var s = readStore();
    var list = (s.skuHistory && s.skuHistory[stemKey]) || [];
    if (!list.length) return null;
    var vendor = opts && opts.vendor;
    var pool = list.filter(function (e) {
      if (vendor && e.vendor !== vendor) return false;
      return typeof e.unitPrice === 'number' && e.unitPrice > 0;
    }).slice(0, 8);
    if (pool.length < 4) return null;
    var sorted = pool.map(function (e) { return e.unitPrice; }).sort(function (a, b) { return a - b; });
    var pct = function (p) {
      var i = (sorted.length - 1) * p;
      var lo = Math.floor(i), hi = Math.ceil(i);
      if (lo === hi) return sorted[lo];
      return sorted[lo] + (i - lo) * (sorted[hi] - sorted[lo]);
    };
    return {
      p10:    +pct(0.1).toFixed(4),
      median: +pct(0.5).toFixed(4),
      p90:    +pct(0.9).toFixed(4),
      n:      pool.length
    };
  }

  // Wave 10.3 — sync projection of latest observation per stem.
  //
  // Cross-tool consumers (Plate Cost, Menu Engineering, Margin Math)
  // need a fast plaintext map of stem → most-recent comparable price
  // for ghost-chip rendering without the async device-key decrypt
  // path that readInvoiceItems() uses. The newest entry in each
  // skuHistory[stem] array IS that latest observation — we expose a
  // thin sync projection rather than maintaining a parallel store
  // (saves ~24 KB localStorage and one source of drift).
  //
  // Returns: { [stem]: { perBaseUnit, baseUnit, vendor, ts, qty, unit, source } }
  //
  // - perBaseUnit / baseUnit come from comparablePrice / comparableUnit
  //   when present (pack-aware row); otherwise fall back to unitPrice
  //   in the row's raw unit. source signals which path won.
  // - Stems with empty history are omitted.
  function latestByStem(opts) {
    opts = opts || {};
    var s = readStore();
    var map = s.skuHistory || {};
    var out = Object.create(null);
    var stems = Object.keys(map);
    var minObs = opts.minObservations || 1;
    for (var i = 0; i < stems.length; i++) {
      var stem = stems[i];
      var list = map[stem];
      if (!Array.isArray(list) || list.length < minObs) continue;
      var latest = list[0];
      if (!latest) continue;
      // Prefer comparable (pack-aware) when present.
      if (typeof latest.comparablePrice === 'number' && latest.comparableUnit) {
        out[stem] = {
          perBaseUnit: +latest.comparablePrice.toFixed(4),
          baseUnit:    latest.comparableUnit,
          vendor:      latest.vendor || null,
          ts:          latest.ts || 0,
          qty:         latest.qty || null,
          unit:        latest.unit || null,
          source:      'pack'
        };
      } else if (typeof latest.unitPrice === 'number' && latest.unit) {
        out[stem] = {
          perBaseUnit: +latest.unitPrice.toFixed(4),
          baseUnit:    String(latest.unit).toLowerCase(),
          vendor:      latest.vendor || null,
          ts:          latest.ts || 0,
          qty:         latest.qty || null,
          unit:        latest.unit || null,
          source:      'unit'
        };
      }
    }
    return out;
  }

  var api = {
    // Phase 1 — observation
    recordObservation:  recordObservation,
    recordObservations: recordObservations,
    lookupHistory:      lookupHistory,
    findClosestVendorMemory: findClosestVendorMemory,
    priceCorridor:      priceCorridor,
    rollingMedian:      rollingMedian,
    summarizeRow:       summarizeRow,
    topMovers:          topMovers,
    // Wave 10.3 — sync projection for cross-tool consumers
    latestByStem:       latestByStem,
    // Phase 2 — contract
    setContract:        setContract,
    clearContract:      clearContract,
    lookupContract:     lookupContract,
    checkRow:           checkRow,
    reconcileInvoice:   reconcileInvoice,
    // Domain-expert layer (cross-vendor + invoice-level drift)
    compareAcrossVendors: compareAcrossVendors,
    computeInvoiceDrift:  computeInvoiceDrift,
    // utility
    stemOf:             stemOf,
    clearAll:           clearAll,
    // constants
    ANOMALY_THRESHOLD_PCT: ANOMALY_THRESHOLD_PCT,
    STEM_CAP:           STEM_CAP,
    ENTRY_CAP_PER_STEM: ENTRY_CAP_PER_STEM,
    CONTRACT_CAP:       CONTRACT_CAP,
    STALE_CONTRACT_DAYS: STALE_CONTRACT_DAYS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_SKU_HISTORY = api;
})(typeof window !== 'undefined' ? window : null);
