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

  function ctx() {
    if (typeof root === 'undefined' || !root || !root.MuntinContext) return null;
    return root.MuntinContext;
  }

  // Stem extraction lives in learnings.js; reuse to keep the
  // normalization rule identical across modules.
  function stemOf(name) {
    if (root && root.MID_LEARNINGS && typeof root.MID_LEARNINGS.extractStem === 'function') {
      return root.MID_LEARNINGS.extractStem(name);
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
  // Wave 1.2 — Contract-price watch.
  //
  // Operator types a negotiated price for one SKU; future invoices
  // flag any line where the actual price exceeds the contract.
  // Reconciliation report sums total $ overcharged across the period.
  // ---------------------------------------------------------------
  function setContract(rowName, unitPrice, opts) {
    if (typeof unitPrice !== 'number' || unitPrice <= 0) return false;
    var stem = stemOf(rowName);
    if (!stem) return false;
    var s = readStore();
    var contracts = s.contractPrices || {};
    contracts[stem] = {
      unitPrice: +unitPrice.toFixed(4),
      vendor:    (opts && opts.vendor) || null,
      unit:      (opts && opts.unit) || null,
      setAt:     Date.now()
    };
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
    return {
      unitPrice: c.unitPrice,
      vendor:    c.vendor,
      unit:      c.unit,
      setAt:     c.setAt,
      isStale:   (Date.now() - (c.setAt || 0)) > staleMs
    };
  }

  // For one parsed-row, compute "did we overpay vs contract?" Returns
  // null when no contract exists for the stem, an object otherwise.
  function checkRow(row) {
    var contract = lookupContract(row && row.name);
    if (!contract) return null;
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
      vendor:        contract.vendor
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

  var api = {
    // Phase 1 — observation
    recordObservation:  recordObservation,
    recordObservations: recordObservations,
    lookupHistory:      lookupHistory,
    rollingMedian:      rollingMedian,
    summarizeRow:       summarizeRow,
    topMovers:          topMovers,
    // Phase 2 — contract
    setContract:        setContract,
    clearContract:      clearContract,
    lookupContract:     lookupContract,
    checkRow:           checkRow,
    reconcileInvoice:   reconcileInvoice,
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
