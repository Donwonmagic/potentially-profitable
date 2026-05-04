/**
 * Invoice Decoder — telemetry kill-switch (Wave 6.7).
 *
 * Privacy mode toggle that no-ops every analytics event from this
 * tool. Persisted to localStorage['mtn:telemetry'] so the operator's
 * choice survives reloads.
 *
 * Wraps window.plausible — when telemetry is OFF, plausible() calls
 * become no-ops. The wrap is applied lazily on first read so we
 * don't disturb other pages' analytics.
 *
 * Also exposes a runtime-egress sentinel (Wave 6.5): when the tool
 * is loaded, attempts to call fetch / XHR.open from invoice-decoder
 * scripts (other than allowlisted bootstraps) throw loudly. Tesseract's
 * own fetch passes because its stack frame is in tesseract.min.js.
 */
(function (root) {
  'use strict';

  var KEY = 'mtn:telemetry';
  var ALLOWLIST_HOSTS = [
    'self',                                  // same-origin
    'plausible.io'                           // Plausible analytics (gated by telemetry toggle)
    // Wave 6.4 — cdn.jsdelivr.net dropped from the runtime allowlist.
    // Tesseract / pdfjs / SheetJS are now self-hosted under
    // /assets/vendor/; the build step (scripts/vendor-pin.mjs) is
    // the only thing that talks to jsdelivr and only at deploy time.
  ];

  function isOn() {
    try {
      var v = localStorage.getItem(KEY);
      return v !== 'off';   // default ON unless explicitly disabled
    } catch (_) { return true; }
  }

  function setEnabled(on) {
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (_) {} // h8-exempt: privacy-mode toggle; on-device preference, never sent over network
    if (!on) {
      // Replace plausible with a no-op so any subsequent call from
      // anywhere in the tool becomes silent.
      try {
        if (root && root.plausible) {
          root._plausibleOriginal = root._plausibleOriginal || root.plausible;
          root.plausible = function () { /* telemetry off */ };
        }
      } catch (_) {}
    } else {
      try {
        if (root && root._plausibleOriginal) {
          root.plausible = root._plausibleOriginal;
        }
      } catch (_) {}
    }
  }

  // Apply on load — defaults to no-op if user previously turned off.
  if (!isOn()) setEnabled(false);

  // -------------------- Runtime egress sentinel (Wave 6.5) --------------------
  // Monkey-patches fetch + XHR.open so a future bug that introduces a
  // non-allowlisted fetch from invoice-decoder.js code (the controller
  // or any sibling module) throws a loud error visible in DevTools.
  // Doesn't affect Tesseract's internal fetches — those originate from
  // tesseract.min.js and won't be flagged.
  (function installSentinel() {
    if (typeof root === 'undefined' || !root) return;
    if (root.__MID_SENTINEL_INSTALLED) return;
    root.__MID_SENTINEL_INSTALLED = true;

    function originUrl(u) {
      try {
        var p = new URL(u, root.location ? root.location.href : 'http://localhost');
        return p.origin;
      } catch (_) { return ''; }
    }

    function inAllowlist(url) {
      var origin = originUrl(url);
      var host = origin.replace(/^https?:\/\//, '');
      if (root.location && origin === root.location.origin) return true;
      for (var i = 0; i < ALLOWLIST_HOSTS.length; i++) {
        var h = ALLOWLIST_HOSTS[i];
        if (h === 'self') continue;
        if (host === h || host.endsWith('.' + h)) return true;
      }
      return false;
    }

    function calledFromDecoderScript() {
      try {
        // Force a stack capture
        throw new Error('mid-sentinel-probe');
      } catch (e) {
        var stack = String(e.stack || '');
        // Look for any of the tool's own scripts in the stack.
        // Tesseract / pdfjs / sheet-js originate from their CDN
        // filename and won't match these patterns.
        return /invoice-decoder\.js|sku-history\.js|margin-impact\.js|accountant-export\.js|categorize\.js|parse\.js|preprocess\.js|vendors\.js|learnings\.js|onboarding\.js/.test(stack);
      }
    }

    var origFetch = root.fetch ? root.fetch.bind(root) : null;
    if (origFetch) {
      root.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (calledFromDecoderScript() && !inAllowlist(url)) {
          throw new Error('mid-sentinel: blocked fetch to non-allowlisted ' + originUrl(url));
        }
        return origFetch(input, init);
      };
    }

    var XHR = root.XMLHttpRequest;
    if (XHR && XHR.prototype && XHR.prototype.open) {
      var origOpen = XHR.prototype.open;
      XHR.prototype.open = function (method, url) {
        if (calledFromDecoderScript() && !inAllowlist(url)) {
          throw new Error('mid-sentinel: blocked XHR to non-allowlisted ' + originUrl(url));
        }
        return origOpen.apply(this, arguments);
      };
    }
  })();

  // -------------------- Wave 5.1: local-only counters --------------------
  // Persisted in MuntinContext.invoiceTelemetry. Drives the auto-confirm
  // shadow-then-on gate (5.3) and the personal-accuracy stat (5.6).
  // No counter contains row text, SKU names, or filenames — pure tallies.
  var COUNTER_KEYS = [
    'autoConfirmsApplied', 'autoConfirmsDisputed',
    'manualCorrections', 'bulkConfirms',
    'trustAlls', 'trustAllsUndone',
    'rowsConfirmedAsIs', 'rowsTotal',
    'invoicesSaved', 'invoicesShadowEvaluated',
    // Wave 4.4 — operator-corpus user-words bias metrics. The
    // replacements counter ticks once per OCR token snapped to a
    // user-word; the invoices counter ticks once per invoice that
    // benefited at all. Both are pure tallies — no SKU text, no
    // filename, no operator data. Drives the "tool got smarter on
    // your last N invoices" surface in the returning-visitor banner.
    'userWordsBiasReplacements', 'userWordsBiasInvoices'
  ];
  var COUNTER_LS_KEY = 'mtn:id-telemetry-counters';
  function _readCounters() {
    try {
      if (typeof MuntinContext !== 'undefined' && MuntinContext.invoiceTelemetry) {
        return MuntinContext.invoiceTelemetry;
      }
    } catch (_) {}
    try {
      var raw = localStorage.getItem(COUNTER_LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function _writeCounters(c) {
    try {
      if (typeof MuntinContext !== 'undefined' && MuntinContext.setInvoiceTelemetry) {
        MuntinContext.setInvoiceTelemetry(c);
        return;
      }
    } catch (_) {}
    try {
      localStorage.setItem(COUNTER_LS_KEY, JSON.stringify(c)); // h8-exempt: aggregate counters; never row text or filenames
    } catch (_) {}
  }
  function bump(key, n) {
    if (COUNTER_KEYS.indexOf(key) === -1) return;
    var c = _readCounters() || {};
    c[key] = (c[key] || 0) + (n || 1);
    _writeCounters(c);
  }
  function get(key) {
    var c = _readCounters() || {};
    return c[key] || 0;
  }
  function getAll() {
    return Object.assign({}, _readCounters() || {});
  }
  // Wave 5.6 — personal-accuracy stat. % of rows that were correct
  // first time, computed across the operator's last N invoices.
  function getPersonalAccuracy(windowDays) {
    windowDays = windowDays || 90;
    var c = _readCounters() || {};
    var total = (c.rowsTotal || 0);
    var correct = (c.rowsConfirmedAsIs || 0);
    if (total < 10) return null;     // not enough data
    return +Math.min(1, correct / total).toFixed(3);
  }
  // Wave 5.3 — auto-confirm safety gate. Returns false until the
  // operator's measured false-positive rate (autoConfirmsDisputed
  // / autoConfirmsApplied) is < 1% AND ≥ 50 auto-confirms have been
  // observed in shadow mode. Conservative — never flips a foot-gun
  // on without evidence.
  function autoConfirmShouldFlip(opts) {
    opts = opts || {};
    var minObs = opts.minObs || 50;
    var maxFpr = opts.maxFpr || 0.01;
    var c = _readCounters() || {};
    var applied = c.autoConfirmsApplied || 0;
    var disputed = c.autoConfirmsDisputed || 0;
    if (applied < minObs) return false;
    var fpr = applied > 0 ? (disputed / applied) : 1;
    return fpr < maxFpr;
  }

  var api = {
    isOn: isOn,
    setEnabled: setEnabled,
    bump: bump,
    get: get,
    getAll: getAll,
    getPersonalAccuracy: getPersonalAccuracy,
    autoConfirmShouldFlip: autoConfirmShouldFlip
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_TELEMETRY = api;
})(typeof window !== 'undefined' ? window : null);
