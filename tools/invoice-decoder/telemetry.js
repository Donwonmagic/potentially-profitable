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

    // Wave E.2 — payload key-scan. Defense-in-depth above the
    // origin allowlist: even when a fetch is going to a permitted
    // host (same-origin /api/workbench/save, plausible.io), we
    // refuse to send any body that mentions a forbidden key. These
    // keys name on-device-only state (accuracy counters, source
    // bboxes, raw OCR text, learned brand registry) that the
    // operator's privacy contract says never leaves the device.
    // A bug that accidentally serializes one of these into a
    // request body produces a loud sentinel error in DevTools
    // instead of a silent leak.
    var FORBIDDEN_KEYS = [
      'accuracyStats',     // E.1 on-device accuracy counters
      'byField',           // sub-key of accuracy counters
      'correctedRows',     // sub-key of accuracy counters
      'sourceBbox',        // D.4 verify-panel cropped image bbox
      'sourceCanvas',      // D.4 source raster (memory-only)
      'rawOcr',            // raw Tesseract output before parse
      '_rawOcrText',       // internal field on parse result
      'brandRegistry',     // C.6 per-operator brand registry
      'learnedVendorTemplates' // C.7 induced grammars
    ];

    function bodyHasForbiddenKey(body) {
      if (body == null) return null;
      var text = null;
      if (typeof body === 'string') {
        text = body;
      } else if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
        text = body.toString();
      } else if (typeof Blob !== 'undefined' && body instanceof Blob && body.type &&
                 /^(application\/json|application\/x-www-form-urlencoded|text\/)/.test(body.type)) {
        // Blobs of known text types we *could* read — but reading is
        // async and we don't want to delay the fetch. Skip; the
        // origin guard + the explicit string/URLSearchParams checks
        // catch the realistic invoice-decoder write paths.
        return null;
      } else {
        // FormData / ArrayBuffer / TypedArray / Stream — opaque to
        // the scan. The encrypted-envelope save path uses
        // URLSearchParams, so this is the relevant slot.
        return null;
      }
      for (var i = 0; i < FORBIDDEN_KEYS.length; i++) {
        if (text.indexOf(FORBIDDEN_KEYS[i]) !== -1) return FORBIDDEN_KEYS[i];
      }
      return null;
    }

    var origFetch = root.fetch ? root.fetch.bind(root) : null;
    if (origFetch) {
      root.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : (input && input.url) || '';
        if (calledFromDecoderScript() && !inAllowlist(url)) {
          throw new Error('mid-sentinel: blocked fetch to non-allowlisted ' + originUrl(url));
        }
        // Wave E.2 — payload key-scan even on allowlisted hosts.
        if (calledFromDecoderScript() && init && init.body) {
          var hit = bodyHasForbiddenKey(init.body);
          if (hit) {
            throw new Error('mid-sentinel: blocked fetch — body contains forbidden key "' + hit + '" (on-device-only state)');
          }
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
      // For XHR, body inspection happens at .send() time. Mirror the
      // fetch-side scan so a stray XHR write of an on-device key
      // throws too.
      var origSend = XHR.prototype.send;
      XHR.prototype.send = function (body) {
        if (calledFromDecoderScript()) {
          var hit = bodyHasForbiddenKey(body);
          if (hit) {
            throw new Error('mid-sentinel: blocked XHR send — body contains forbidden key "' + hit + '"');
          }
        }
        return origSend.apply(this, arguments);
      };
    }
  })();

  var api = {
    isOn: isOn,
    setEnabled: setEnabled
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_TELEMETRY = api;
})(typeof window !== 'undefined' ? window : null);
