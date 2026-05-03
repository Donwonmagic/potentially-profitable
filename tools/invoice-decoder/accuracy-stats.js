/**
 * Invoice Decoder — on-device accuracy stats (Wave E.1).
 *
 * Counts what the operator corrects, never serializes the corrections
 * themselves. Stored in localStorage as a small JSON blob (counters
 * only — no row text, no SKUs, no descriptions, no vendor item
 * details). Surfaces "Your accuracy: 94% across 23 invoices" in the
 * onboarding returning-user banner and the proof flyout, both
 * operator-visible only.
 *
 * Privacy posture (invariant I-12 in PRIVACY-INVARIANTS.md):
 *   - Counters NEVER leave the device. The telemetry sentinel in
 *     telemetry.js scans every fetch / XHR body for the keys
 *     'accuracyStats', 'byField', 'correctedRows' and throws if
 *     they appear in any outbound payload.
 *   - The data captured is integer-typed only: rowCount, correction
 *     count, invoice count, last30-day rolling buckets. No strings
 *     beyond a vendor id from the static MID_VENDORS allowlist.
 *   - Operator can reset the counter from the UI (recovery hook for
 *     "I want to start fresh" or "I'm handing the device to someone
 *     else").
 *
 * Schema versioning: the storage value is wrapped in
 *   { schemaVersion: 1, ... }
 * so a future schema change can migrate gracefully (read older
 * shape, project to new). Today's reader rejects anything else.
 */
(function (root) {
  'use strict';

  var KEY = 'mtn:invoice-decoder:accuracy-stats:v1';
  var SCHEMA_VERSION = 1;
  var WINDOW_DAYS = 90;       // rolling-window length for the byDay bucket
  var MAX_VENDORS = 30;       // belt-and-suspenders cap on byVendor map

  // --------------------------- Storage --------------------------

  function readStats() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blankStats();
      var s = JSON.parse(raw);
      if (!s || s.schemaVersion !== SCHEMA_VERSION) return blankStats();
      // Defensive: ensure every required field is present so callers
      // never have to null-check.
      if (typeof s.totalRows !== 'number')      s.totalRows = 0;
      if (typeof s.correctedRows !== 'number')  s.correctedRows = 0;
      if (typeof s.totalInvoices !== 'number')  s.totalInvoices = 0;
      if (!s.byField || typeof s.byField !== 'object') s.byField = {};
      if (!s.byVendor || typeof s.byVendor !== 'object') s.byVendor = {};
      if (!Array.isArray(s.last90)) s.last90 = [];
      return s;
    } catch (_) { return blankStats(); }
  }

  function writeStats(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {}
  }

  function blankStats() {
    return {
      schemaVersion: SCHEMA_VERSION,
      totalRows:     0,
      correctedRows: 0,
      totalInvoices: 0,
      byField:  {},                 // { name: {corrected}, qty: ..., ... }
      byVendor: {},                 // { sysco: {rows, corrected}, ... }
      last90:   [],                 // [{ d: 'YYYY-MM-DD', rows, corrections }]
      createdAt: Date.now()
    };
  }

  // ---------------------- Internal helpers ----------------------

  function todayKey() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function pruneLast90(s) {
    // Drop buckets older than WINDOW_DAYS. Keep order so consumers
    // can read trend without re-sorting.
    var cutoff = Date.now() - (WINDOW_DAYS * 86400000);
    s.last90 = s.last90.filter(function (bucket) {
      // Lazy parse: tolerate missing/garbage timestamps by keeping
      // the most recent 90 entries regardless.
      var t = Date.parse(bucket.d + 'T00:00:00Z');
      return isFinite(t) ? t >= cutoff : true;
    });
    if (s.last90.length > WINDOW_DAYS) {
      s.last90 = s.last90.slice(-WINDOW_DAYS);
    }
  }

  function getOrCreateBucket(s, dKey) {
    for (var i = s.last90.length - 1; i >= 0; i--) {
      if (s.last90[i].d === dKey) return s.last90[i];
    }
    var bucket = { d: dKey, rows: 0, corrections: 0 };
    s.last90.push(bucket);
    return bucket;
  }

  function safeVendorId(vendorId) {
    // Defensive: vendor id should be a short slug. Refuse anything
    // long / non-slug-looking so a stray "row text" in this slot
    // can't leak through later if some caller misused the API.
    if (!vendorId) return null;
    var v = String(vendorId).toLowerCase().slice(0, 32);
    if (!/^[a-z0-9_\-]{1,32}$/.test(v)) return null;
    return v;
  }

  function safeFieldId(field) {
    if (!field) return null;
    var allowed = ['name', 'qty', 'unit', 'unitPrice', 'lineTotal', 'category', 'pack', 'kind'];
    for (var i = 0; i < allowed.length; i++) {
      if (allowed[i] === field) return field;
    }
    return null;
  }

  // ---------------------- Public API ----------------------------

  // Called once per parsed invoice. rowCount is the number of rows
  // emitted by parseLines (already capped at 200). vendorId is a
  // slug from MID_VENDORS or null.
  function recordInvoice(rowCount, vendorId) {
    if (typeof rowCount !== 'number' || rowCount < 0) return;
    var s = readStats();
    s.totalInvoices += 1;
    s.totalRows += rowCount;
    var v = safeVendorId(vendorId);
    if (v) {
      var slot = s.byVendor[v] || { rows: 0, corrected: 0 };
      slot.rows += rowCount;
      s.byVendor[v] = slot;
      // Cap the vendor map size — drop the lowest-count entry if
      // we've exceeded the cap. This is purely defensive; in
      // practice an operator deals with <10 distributors.
      var vendorIds = Object.keys(s.byVendor);
      if (vendorIds.length > MAX_VENDORS) {
        var lowest = vendorIds[0];
        var lowestCount = s.byVendor[lowest].rows;
        for (var i = 1; i < vendorIds.length; i++) {
          if (s.byVendor[vendorIds[i]].rows < lowestCount) {
            lowest = vendorIds[i];
            lowestCount = s.byVendor[vendorIds[i]].rows;
          }
        }
        if (lowest !== v) delete s.byVendor[lowest];
      }
    }
    var bucket = getOrCreateBucket(s, todayKey());
    bucket.rows += rowCount;
    pruneLast90(s);
    writeStats(s);
  }

  // Called from commitCellEdit (or any other operator-correction
  // hook). field is one of name/qty/unit/unitPrice/lineTotal/category
  // /pack/kind. vendorId is the invoice's vendor (so we can compute
  // per-vendor accuracy) or null.
  function recordCorrection(field, vendorId) {
    var f = safeFieldId(field);
    if (!f) return;
    var s = readStats();
    s.correctedRows += 1;
    s.byField[f] = (s.byField[f] || 0) + 1;
    var v = safeVendorId(vendorId);
    if (v) {
      var slot = s.byVendor[v] || { rows: 0, corrected: 0 };
      slot.corrected += 1;
      s.byVendor[v] = slot;
    }
    var bucket = getOrCreateBucket(s, todayKey());
    bucket.corrections += 1;
    pruneLast90(s);
    writeStats(s);
  }

  // Operator-readable summary. Returns:
  //   {
  //     accuracy: 0..1 (overall),
  //     n: totalInvoices,
  //     totalRows, correctedRows,
  //     byVendor: [{ vendor, accuracy, rows }] sorted desc by rows,
  //     byField: { name, qty, ... } correction counts,
  //     trend30: [{d, rows, corrections, accuracy}] last 30 days
  //   }
  function getSummary() {
    var s = readStats();
    var accuracy = s.totalRows > 0
      ? Math.max(0, Math.min(1, 1 - (s.correctedRows / s.totalRows)))
      : null;
    var byVendor = Object.keys(s.byVendor).map(function (v) {
      var slot = s.byVendor[v];
      return {
        vendor: v,
        rows: slot.rows,
        corrected: slot.corrected,
        accuracy: slot.rows > 0 ? Math.max(0, Math.min(1, 1 - (slot.corrected / slot.rows))) : null
      };
    }).sort(function (a, b) { return b.rows - a.rows; });
    var trendCutoff = Date.now() - (30 * 86400000);
    var trend30 = s.last90.filter(function (bucket) {
      var t = Date.parse(bucket.d + 'T00:00:00Z');
      return isFinite(t) ? t >= trendCutoff : false;
    }).map(function (bucket) {
      return {
        d: bucket.d,
        rows: bucket.rows,
        corrections: bucket.corrections,
        accuracy: bucket.rows > 0 ? Math.max(0, Math.min(1, 1 - (bucket.corrections / bucket.rows))) : null
      };
    });
    return {
      accuracy:      accuracy,
      n:             s.totalInvoices,
      totalRows:     s.totalRows,
      correctedRows: s.correctedRows,
      byVendor:      byVendor,
      byField:       Object.assign({}, s.byField),
      trend30:       trend30,
      createdAt:     s.createdAt
    };
  }

  // Operator-initiated reset. The reason field is for human
  // legibility only — never written to disk, never sent anywhere.
  function reset(reason) {
    void reason; // accepted for caller clarity; not persisted
    try { localStorage.removeItem(KEY); } catch (_) {}
  }

  // -------------------- Module export ---------------------------

  var api = {
    recordInvoice:    recordInvoice,
    recordCorrection: recordCorrection,
    getSummary:       getSummary,
    reset:            reset,
    // Test hooks. Exposed so the privacy CI (E.4) can install a
    // counter and assert no key from the schema appears in any
    // outbound payload.
    _readRaw:        readStats,
    _SCHEMA_VERSION: SCHEMA_VERSION,
    _STORAGE_KEY:    KEY
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_ACCURACY = api;
})(typeof window !== 'undefined' ? window : null);
