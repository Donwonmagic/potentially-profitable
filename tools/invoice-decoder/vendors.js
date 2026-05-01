/**
 * Invoice Decoder — vendors.js (Wave B3).
 *
 * Vendor-aware parser registry. Each vendor exports a detect()
 * function that decides whether the OCR'd top-of-page text
 * matches that vendor's letterhead, plus optional parser hints
 * (column anchors, header skip patterns) that bias the generic
 * 5-pattern parser toward that vendor's known layout.
 *
 * detect(text) returns { score: 0..1, label }; the orchestrator
 * picks the highest-scoring vendor or falls through to the
 * generic parser when no vendor passes the 0.5 threshold.
 *
 * Atomic-sprint cadence: each vendor lands in its own commit so
 * the diff per signature stays small and inspectable. Sysco
 * ships first (most common across independent restaurants).
 */
(function (root) {
  'use strict';

  function topText(text, n) {
    return String(text || '').slice(0, n || 600).toLowerCase();
  }

  // Vendor: Sysco. Letterhead matches vary across regional ops
  // (Sysco Houston, Sysco Memphis, Sysco-branded subsidiaries),
  // so detect() scores positives for any of: brand mention,
  // SKU column header, "ship to" pattern, customer-number stamp.
  // Threshold is 0.5; a single brand mention alone is enough.
  var SYSCO = {
    id: 'sysco',
    label_en: 'Sysco',
    label_es: 'Sysco',
    detect: function (ocrText) {
      var top = topText(ocrText, 800);
      var score = 0;
      if (/\bsysco\b/.test(top)) score += 0.6;
      if (/sysco\s+(houston|chicago|atlanta|memphis|kansas|denver|seattle|portland|baltimore|cincinnati|nashville|jacksonville)/i.test(top)) score += 0.2;
      if (/customer\s+number\s*:?\s*\d{6,}/.test(top)) score += 0.15;
      if (/\bsupc\b|\bsupc#\b/.test(top)) score += 0.15; // Sysco Universal Product Code
      if (/sysco\s+pickup/.test(top)) score += 0.1;
      return { score: Math.min(1, score), label: SYSCO.label_en };
    },
    // Parser hints: Sysco prints SKU / qty / unit / desc / unit-
    // price / extended-price. The shipped Pattern D in parse.js
    // already handles SKU-prefixed lines, so for v1 we don't
    // override the parser — we just bias confidence upward when
    // we know it's Sysco.
    confidenceBoost: 12,
    // Header lines specific to Sysco invoices that the generic
    // header-skip regex might miss.
    headerLines: [
      /^pack\s+brand\s+description/i,
      /^supc\s+pack\s+size/i,
      /^marketplace\s+order/i
    ]
  };

  var REGISTRY = [SYSCO];

  // detectVendor returns highest-scoring vendor with score >=
  // threshold (0.5), or null when none match. Caller falls
  // through to the generic parser when null.
  function detectVendor(ocrText, threshold) {
    var t = (typeof threshold === 'number') ? threshold : 0.5;
    var best = null;
    for (var i = 0; i < REGISTRY.length; i++) {
      var v = REGISTRY[i];
      var r = v.detect(ocrText);
      if (r && r.score >= t && (!best || r.score > best.score)) {
        best = { id: v.id, label: r.label, score: r.score, vendor: v };
      }
    }
    return best;
  }

  function applyVendorBoost(rows, vendor) {
    if (!vendor || !vendor.vendor) return rows;
    var boost = vendor.vendor.confidenceBoost || 0;
    rows.forEach(function (r) {
      r.confidence = Math.min(100, (r.confidence || 0) + boost);
      r.vendorDetected = vendor.id;
    });
    return rows;
  }

  var api = {
    REGISTRY: REGISTRY,
    detectVendor: detectVendor,
    applyVendorBoost: applyVendorBoost
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_VENDORS = api;
})(typeof window !== 'undefined' ? window : null);
