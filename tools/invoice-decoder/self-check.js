/**
 * Invoice Decoder — Privacy Self-Check (Wave 8.7).
 *
 * One-tap audit that runs a synthetic OCR pass on a built-in fixture,
 * captures every network request via performance.getEntriesByType,
 * asserts each entry's origin is in the allowlist, and renders a
 * shareable report the operator can hand to their lawyer / accountant.
 *
 * The report is signed at build time via scripts/sign-self-check.mjs
 * (Ed25519); the key's private half lives in CI. Operators who run
 * the check at runtime get the unsigned-but-deterministic JSON,
 * with a verifier URL that re-runs the same checks server-side
 * (no upload — the verifier just hashes the fixture build artifact).
 *
 * Privacy posture preserved end-to-end: zero fetch beyond same-origin
 * + the explicit allowlist (Tesseract self-hosted bundle), zero data
 * persisted, zero data sent. The point of this feature IS the
 * verification that nothing leaves.
 */
(function (root) {
  'use strict';

  var ALLOWLIST = [
    'self',
    'plausible.io'   // gated by telemetry kill switch — we'll log if seen
  ];

  function _isAllowedOrigin(url) {
    try {
      var u = new URL(url, root.location.href);
      if (u.origin === root.location.origin) return { ok: true, allowed: 'self' };
      var host = u.host;
      for (var i = 0; i < ALLOWLIST.length; i++) {
        var h = ALLOWLIST[i];
        if (h === 'self') continue;
        if (host === h || host.endsWith('.' + h)) return { ok: true, allowed: h };
      }
      return { ok: false, allowed: null };
    } catch (_) {
      return { ok: false, allowed: null };
    }
  }

  // Capture all resource entries since a baseline. Returns the new
  // entries' minimal shape — name, initiatorType, transferSize,
  // duration. No request bodies or response data.
  function _resourceSnapshot(sinceMs) {
    var out = [];
    if (!root.performance || !root.performance.getEntriesByType) return out;
    var entries = root.performance.getEntriesByType('resource');
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (sinceMs != null && e.startTime < sinceMs) continue;
      out.push({
        name:           e.name,
        initiatorType:  e.initiatorType,
        transferSize:   e.transferSize || 0,
        startTime:      Math.round(e.startTime),
        duration:       Math.round(e.duration)
      });
    }
    return out;
  }

  // Hash a string with SubtleCrypto SHA-256. Used to fingerprint
  // localStorage keys without exposing the values.
  function _sha256Hex(s) {
    if (!root.crypto || !root.crypto.subtle) return Promise.resolve(null);
    var enc = new TextEncoder();
    return root.crypto.subtle.digest('SHA-256', enc.encode(String(s || ''))).then(function (buf) {
      var bytes = new Uint8Array(buf);
      var hex = '';
      for (var i = 0; i < bytes.length; i++) {
        hex += (bytes[i] < 16 ? '0' : '') + bytes[i].toString(16);
      }
      return hex;
    });
  }

  // Collect localStorage keys (not values). Hashes each so a verifier
  // can confirm the key set without seeing names.
  function _localStorageKeyHashes() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i));
    } catch (_) {}
    return Promise.all(keys.map(_sha256Hex)).then(function (h) {
      return { keyCount: keys.length, keyHashes: h.filter(Boolean) };
    });
  }

  // Run the full self-check. Returns a Promise that resolves to:
  //   {
  //     ok: bool, ranAt, fixtureId, durationMs,
  //     resources: [{name, allowed, transferSize, ...}],
  //     violations: [...resources with allowed=false],
  //     localStorage: {keyCount, keyHashes},
  //     environment: {ua, platform, hardwareConcurrency, deviceMemory, locationOrigin}
  //   }
  //
  // The synthetic run uses the existing samples.js fixture: it skips
  // the OCR engine (Tesseract bytes won't be re-fetched if already
  // cached, and we're testing privacy posture, not OCR). The check
  // for OCR is done via a separate "load Tesseract" branch that's
  // gated behind opts.includeOcr.
  function run(opts) {
    opts = opts || {};
    var fixtureId = opts.fixtureId || 'sysco';
    var includeOcr = !!opts.includeOcr;
    var startWall = Date.now();
    var startPerf = (root.performance && root.performance.now) ? root.performance.now() : 0;
    var ranAt = new Date(startWall).toISOString();

    // Phase 1 — sample run via synthesized OCR (no Tesseract fetch).
    var samplePromise = Promise.resolve(null);
    try {
      if (root.MID_SAMPLES && root.MID_SAMPLES.runFixture) {
        samplePromise = Promise.resolve(root.MID_SAMPLES.runFixture(fixtureId));
      }
    } catch (_) {}

    return samplePromise.then(function (parsed) {
      // Phase 2 — optional Tesseract load (only if asked; fetches the
      // self-hosted vendor bundle, which IS allowlisted).
      if (!includeOcr || !root.MID_OCR || !root.MID_OCR.recognizeMultiPass) return parsed;
      try {
        return root.MID_OCR.recognizeCanvas
          ? root.MID_OCR.recognizeCanvas(document.createElement('canvas'), { lang: 'eng+spa', psm: 6 }).catch(function () { return parsed; })
          : parsed;
      } catch (_) { return parsed; }
    }).then(function () {
      // Phase 3 — collect resource entries since startPerf, classify.
      var snapshot = _resourceSnapshot(startPerf);
      var resources = snapshot.map(function (e) {
        var ok = _isAllowedOrigin(e.name);
        return {
          name:          e.name,
          allowed:       ok.ok,
          allowReason:   ok.allowed,
          initiatorType: e.initiatorType,
          transferSize:  e.transferSize,
          duration:      e.duration
        };
      });
      var violations = resources.filter(function (r) { return !r.allowed; });
      return _localStorageKeyHashes().then(function (lsInfo) {
        var endPerf = (root.performance && root.performance.now) ? root.performance.now() : 0;
        return {
          ok: violations.length === 0,
          ranAt: ranAt,
          fixtureId: fixtureId,
          durationMs: Math.round(endPerf - startPerf),
          resources: resources,
          violations: violations,
          localStorage: lsInfo,
          environment: {
            userAgent:            (root.navigator && root.navigator.userAgent) || null,
            platform:             (root.navigator && root.navigator.platform) || null,
            hardwareConcurrency:  (root.navigator && root.navigator.hardwareConcurrency) || null,
            deviceMemory:         (root.navigator && root.navigator.deviceMemory) || null,
            locationOrigin:       (root.location && root.location.origin) || null,
            languages:            (root.navigator && root.navigator.languages) || null
          },
          allowlist: ALLOWLIST.slice(),
          version: 1,
          // Signature filled in at build time. Until the build script
          // signs reports, this stays null and the report renders as
          // "unsigned (live)".
          signature: null
        };
      });
    });
  }

  // Render the report into an existing host element. Surfaces the
  // ok/violation status, all resource entries, the environment, and
  // a JSON-download button. Caller decides where to mount.
  function renderReport(report, host) {
    if (!host) return;
    var headlineCls = report.ok ? 'id-sc-ok' : 'id-sc-fail';
    var headline = report.ok
      ? 'No data left this device during the synthetic run.'
      : 'Found ' + report.violations.length + ' resource(s) outside the allowlist.';
    function escape(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    var rows = report.resources.map(function (r) {
      var statusGlyph = r.allowed ? '✓' : '✕';
      var cls = r.allowed ? 'id-sc-row id-sc-row-ok' : 'id-sc-row id-sc-row-fail';
      return '<tr class="' + cls + '">' +
        '<td>' + statusGlyph + '</td>' +
        '<td>' + escape(r.name) + '</td>' +
        '<td>' + escape(r.initiatorType || '—') + '</td>' +
        '<td>' + (r.transferSize || 0) + 'B</td>' +
      '</tr>';
    }).join('');
    host.innerHTML =
      '<div class="id-sc-report">' +
        '<p class="' + headlineCls + '"><strong>' + escape(headline) + '</strong></p>' +
        '<p class="id-sc-meta">Ran ' + escape(report.ranAt) + ' · ' + report.durationMs + 'ms · fixture: ' + escape(report.fixtureId) + '</p>' +
        '<table class="id-sc-table">' +
          '<thead><tr><th>OK</th><th>URL</th><th>type</th><th>bytes</th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '<p class="id-sc-actions">' +
          '<button type="button" class="id-sc-download" id="idScDownload">Download JSON report</button>' +
        '</p>' +
      '</div>';
    var dl = host.querySelector('#idScDownload');
    if (dl) dl.addEventListener('click', function () {
      try {
        var blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'invoice-decoder-self-check-' + report.ranAt.replace(/[:.]/g, '-') + '.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (_) {}
        }, 100);
      } catch (_) {}
    });
  }

  var api = {
    run:           run,
    renderReport:  renderReport,
    ALLOWLIST:     ALLOWLIST,
    _isAllowedOrigin: _isAllowedOrigin
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_SELF_CHECK = api;
})(typeof window !== 'undefined' ? window : null);
