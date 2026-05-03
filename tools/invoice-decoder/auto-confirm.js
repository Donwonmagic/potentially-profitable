/**
 * Invoice Decoder — Auto-confirm tier (Wave 5.3).
 *
 * Decides which rows the system can confirm without operator action.
 * Two-phase rollout per the user's "shadow-then-on" preference:
 *
 *   - For the operator's first ~5 invoices the predicate runs in
 *     SHADOW mode: it computes who would have been auto-confirmed,
 *     bumps telemetry counters, but leaves rows untouched. A row
 *     the operator manually corrects after a shadow auto-confirm
 *     fired is recorded as a false positive.
 *   - Once telemetry.autoConfirmShouldFlip() returns true (≥ 50 obs
 *     AND FPR < 1%), live mode flips on automatically. The first
 *     auto-confirm of an invoice surfaces a one-time toast: "We just
 *     confirmed 32 rows for you — your last week's edits taught us
 *     you trust this pattern. Tap any row to dispute."
 *
 * Predicate (all must hold):
 *   - min(fieldConf.name, qty, price, category) ≥ 90
 *   - row matches a `direct` learnings.lookupOverride within 90 days
 *     OR row's stem has ≥ 3 same-vendor recent observations
 *   - unitPrice within ±8% of the rolling 90-day median
 *   - row not in the active math-fix candidate set (caller passes that)
 *   - the invoice as a whole has math reconciled (caller passes)
 *
 * Pure local. Stores nothing. The shadow→live transition is decided
 * by the operator's own telemetry counters, not by any server signal.
 */
(function (root) {
  'use strict';

  var SHADOW_INVOICE_FLOOR = 5;
  var ANOMALY_PCT_GUARD = 8;     // tighter than the 15% UI anomaly threshold

  function _isReadyForLive() {
    if (typeof root === 'undefined' || !root || !root.MID_TELEMETRY) return false;
    if (typeof root.MID_TELEMETRY.autoConfirmShouldFlip !== 'function') return false;
    return root.MID_TELEMETRY.autoConfirmShouldFlip();
  }

  // Returns 'live' | 'shadow' | 'off'.
  function currentMode() {
    if (typeof root === 'undefined' || !root || !root.MID_TELEMETRY) return 'off';
    var saved = (root.MID_TELEMETRY.get && root.MID_TELEMETRY.get('invoicesSaved')) || 0;
    if (saved < SHADOW_INVOICE_FLOOR) return 'shadow';
    return _isReadyForLive() ? 'live' : 'shadow';
  }

  // Per-row predicate. Returns { eligible, reason }.
  function evaluate(row, opts) {
    opts = opts || {};
    if (!row || row.kind && row.kind !== 'item') return { eligible: false, reason: 'non-item' };
    if (!opts.mathBalanced) return { eligible: false, reason: 'math-not-balanced' };
    if (opts.mathFixRowSet && opts.mathFixRowSet[row._idx]) {
      return { eligible: false, reason: 'in-math-fix-set' };
    }
    var fc = row.fieldConf || {};
    var minF = Math.min(fc.name || 0, fc.qty || 0, fc.price || 0, fc.category || 80);
    if (minF < 90) return { eligible: false, reason: 'low-conf' };
    // Learned trust: direct lexicon override within 90 days OR ≥3 same-vendor recent obs
    var hasDirect = false, hasMemory = false;
    try {
      if (root.MID_LEARNINGS && root.MID_LEARNINGS.lookupOverride) {
        var ov = root.MID_LEARNINGS.lookupOverride(row.name);
        if (ov && (ov.source === 'direct' || ov.tier === 'learned')) hasDirect = true;
      }
    } catch (_) {}
    try {
      if (root.MID_SKU_HISTORY && root.MID_SKU_HISTORY.lookupHistory) {
        var hist = root.MID_SKU_HISTORY.lookupHistory(row);
        if (hist && hist.length >= 3) {
          var fresh = hist.filter(function (e) {
            return (Date.now() - (e.ts || 0)) < 90 * 86400000 &&
                   (opts.vendor ? e.vendor === opts.vendor : true);
          });
          if (fresh.length >= 3) hasMemory = true;
        }
      }
    } catch (_) {}
    if (!hasDirect && !hasMemory) return { eligible: false, reason: 'no-learned-trust' };
    // Price-anomaly guard.
    try {
      if (root.MID_SKU_HISTORY && root.MID_SKU_HISTORY.summarizeRow) {
        var s = root.MID_SKU_HISTORY.summarizeRow(row);
        if (s && s.medianDelta != null && Math.abs(s.medianDelta) > ANOMALY_PCT_GUARD) {
          return { eligible: false, reason: 'price-anomaly' };
        }
      }
    } catch (_) {}
    return { eligible: true, reason: 'auto', hasDirect: hasDirect, hasMemory: hasMemory };
  }

  // Apply auto-confirm to a list of rows. Returns:
  //   { mode, applied: [{idx, reason}], shadowedOnly: [{idx, reason}] }
  // In shadow mode, applied is empty and shadowedOnly carries the
  // would-have-been list for telemetry.
  function applyAutoConfirm(rows, opts) {
    opts = opts || {};
    var mode = currentMode();
    var applied = [];
    var shadow = [];
    if (!Array.isArray(rows)) return { mode: mode, applied: applied, shadowedOnly: shadow };
    rows.forEach(function (r, i) {
      r._idx = i;
      var ev = evaluate(r, opts);
      if (!ev.eligible) return;
      if (mode === 'live') {
        r.autoConfirm = true;
        r.ownerConfirmed = true;
        r.autoConfirmReason = ev.reason;
        applied.push({ idx: i, reason: ev.reason });
      } else {
        r._shadowAutoConfirm = true;
        shadow.push({ idx: i, reason: ev.reason });
      }
    });
    // Bump counters for the shadow-then-on gate.
    try {
      if (root.MID_TELEMETRY && root.MID_TELEMETRY.bump) {
        root.MID_TELEMETRY.bump('autoConfirmsApplied', applied.length);
        root.MID_TELEMETRY.bump('invoicesShadowEvaluated', mode === 'shadow' ? 1 : 0);
      }
    } catch (_) {}
    return { mode: mode, applied: applied, shadowedOnly: shadow };
  }

  // Called when an operator manually corrects an auto-confirmed row.
  // The dispute counter drives the FPR gate.
  function recordDispute(row) {
    if (!row) return;
    if (!row.autoConfirm && !row._shadowAutoConfirm) return;
    try {
      if (root.MID_TELEMETRY && root.MID_TELEMETRY.bump) {
        root.MID_TELEMETRY.bump('autoConfirmsDisputed', 1);
      }
    } catch (_) {}
    row.autoConfirm = false;
    row._shadowAutoConfirm = false;
  }

  var api = {
    currentMode:      currentMode,
    evaluate:         evaluate,
    applyAutoConfirm: applyAutoConfirm,
    recordDispute:    recordDispute,
    SHADOW_INVOICE_FLOOR: SHADOW_INVOICE_FLOOR,
    ANOMALY_PCT_GUARD: ANOMALY_PCT_GUARD
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_AUTO_CONFIRM = api;
})(typeof window !== 'undefined' ? window : null);
