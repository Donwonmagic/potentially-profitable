/**
 * Invoice Decoder — vendor URL + SRI registry (Wave 6.4).
 *
 * Single source of truth for how the runtime loads its third-party
 * dependencies (Tesseract / pdfjs / SheetJS). The build-time
 * scripts/vendor-pin.mjs writes /assets/vendor/_integrity.json with
 * SHA-384 hashes for each pinned file; this module exposes the URLs
 * + integrity strings to ocr.js / pdf-extract.js / csv-extract.js.
 *
 * Failure mode: when /assets/vendor/_integrity.json is missing (i.e.,
 * the vendor-pin step didn't run, or pinned offline) we fall back
 * to the legacy CDN URLs without SRI. The runtime stays functional;
 * the CSP is the only line of defense in that transitional state.
 *
 * Privacy: zero fetch from this module beyond the integrity manifest
 * itself (same-origin). The actual vendor JS loads happen from the
 * consumer modules, decorated with `integrity` + `crossorigin` when
 * the manifest provides them.
 */
(function (root) {
  'use strict';

  // Pinned versions. Bumping these requires re-running vendor-pin.
  var TESSERACT_VERSION   = '5.1.1';
  var PDFJS_VERSION       = '4.5.136';
  var XLSX_VERSION        = '0.20.3';
  var TESSCORE_VERSION    = '5.0.0';
  var TESSDATA_VERSION    = '4.0.0';

  var HASHWASM_VERSION = '4.11.0';
  // Wave 13.3 — pdf-lib for annotated PDF export. Lazy-loaded only
  // when the operator triggers Save-as-annotated-PDF; ~470 KB cost
  // never paid by non-users. Pinned alongside the other vendors so
  // the SRI manifest covers it once vendor-pin.mjs runs.
  var PDFLIB_VERSION = '1.17.1';
  // Wave 9.2 — PaddleOCR-WASM (mobile-v3) as a second OCR engine on
  // capable devices. The @paddlejs-models/ocr package + its model
  // weights ship from our own origin; no external fetch at runtime.
  var PADDLEOCR_VERSION = '2.2.5';

  // Self-hosted URLs the runtime prefers.
  var SELF = {
    tesseract:     '/assets/vendor/tesseract.js@'      + TESSERACT_VERSION + '/tesseract.min.js',
    tesseractWorker: '/assets/vendor/tesseract.js@'    + TESSERACT_VERSION + '/worker.min.js',
    pdfjs:         '/assets/vendor/pdfjs-dist@'        + PDFJS_VERSION    + '/pdf.min.mjs',
    pdfjsWorker:   '/assets/vendor/pdfjs-dist@'        + PDFJS_VERSION    + '/pdf.worker.min.mjs',
    xlsx:          '/assets/vendor/xlsx@'              + XLSX_VERSION     + '/xlsx.mjs',
    tessCorePath:  '/assets/vendor/tesseract.js-core@' + TESSCORE_VERSION + '/',
    tessLangPath:  '/assets/vendor/tessdata-'          + TESSDATA_VERSION + '/',
    argon2:        '/assets/vendor/hash-wasm@'         + HASHWASM_VERSION + '/argon2.umd.min.js',
    pdflib:        '/assets/vendor/pdf-lib@'           + PDFLIB_VERSION   + '/pdf-lib.min.js',
    paddleocr:     '/assets/vendor/paddleocr@'         + PADDLEOCR_VERSION + '/index.mjs'
  };

  // Legacy CDN fallbacks. Only used when the build's vendor-pin
  // step didn't run (rare / dev / offline build). Once we ship a
  // CSP that excludes these, the fallback becomes a hard error —
  // intentional, because shipping without SRI is a privacy
  // regression we want to surface loudly.
  var LEGACY = {
    tesseract:   'https://cdn.jsdelivr.net/npm/tesseract.js@'   + TESSERACT_VERSION + '/dist/tesseract.min.js',
    pdfjs:       'https://cdn.jsdelivr.net/npm/pdfjs-dist@'     + PDFJS_VERSION    + '/build/pdf.min.mjs',
    pdfjsWorker: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@'     + PDFJS_VERSION    + '/build/pdf.worker.min.mjs',
    xlsx:        'https://cdn.jsdelivr.net/npm/xlsx@'           + XLSX_VERSION     + '/xlsx.mjs',
    pdflib:      'https://cdn.jsdelivr.net/npm/pdf-lib@'        + PDFLIB_VERSION   + '/dist/pdf-lib.min.js'
  };

  // Cached integrity manifest (loaded once per session).
  var __manifestPromise = null;
  function loadManifest() {
    if (__manifestPromise) return __manifestPromise;
    if (typeof fetch === 'undefined') {
      return Promise.resolve(null);
    }
    __manifestPromise = fetch('/assets/vendor/_integrity.json', { // h8-exempt: same-origin SRI manifest fetch
      credentials: 'omit',
      cache:       'no-cache'
    }).then(function (r) {
      if (!r.ok) return null;
      return r.json();
    }).then(function (j) {
      if (!j || !j.files) return null;
      // Empty files object signals an offline build; treat as null.
      if (Object.keys(j.files).length === 0) return null;
      return j;
    }).catch(function () { return null; });
    return __manifestPromise;
  }

  // Resolve a logical name to { url, integrity }. When the integrity
  // manifest loaded successfully, the same-origin URL + SHA-384 are
  // returned. Otherwise we fall back to the legacy CDN URL with no
  // integrity (browser will load via the existing CSP).
  function resolve(name) {
    return loadManifest().then(function (manifest) {
      if (manifest && manifest.files && manifest.files[SELF[name]]) {
        return {
          url:       SELF[name],
          integrity: manifest.files[SELF[name]].sha384,
          source:    'self-hosted'
        };
      }
      // Special cases for paths used by Tesseract internally —
      // they're directories, not single files; just hand back the
      // self-hosted base path with no SRI (Tesseract fetches its
      // own assets and verifies internally via WASM checks).
      if (name === 'tessCorePath' || name === 'tessLangPath') {
        return {
          url:       SELF[name],
          integrity: null,
          source:    manifest ? 'self-hosted' : 'cdn-fallback'
        };
      }
      return {
        url:       LEGACY[name] || null,
        integrity: null,
        source:    'cdn-fallback'
      };
    });
  }

  // Helper: load a script tag with SRI when available. Resolves
  // to the script element on load, rejects on error. Used for
  // classic <script src> loads (Tesseract.js).
  function loadScript(name) {
    return resolve(name).then(function (r) {
      if (!r.url) return Promise.reject(new Error('no URL for ' + name));
      return new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = r.url;
        s.async = true;
        s.crossOrigin = 'anonymous';
        s.referrerPolicy = 'no-referrer';
        if (r.integrity) s.integrity = r.integrity;
        s.onload = function () { res(s); };
        s.onerror = function () { rej(new Error('Could not load ' + name + ' from ' + r.url)); };
        document.head.appendChild(s);
      });
    });
  }

  // Helper: ESM dynamic import for modules. Native ESM imports don't
  // support SRI yet (Import Maps integrity proposal isn't widely
  // shipped); we still get same-origin enforcement via CSP, plus the
  // build-time hash verification in vendor-pin.mjs. When SRI for
  // ESM lands in browsers we'll switch to that.
  function importModule(name) {
    return resolve(name).then(function (r) {
      if (!r.url) return Promise.reject(new Error('no URL for ' + name));
      return import(/* @vite-ignore */ /* webpackIgnore: true */ r.url);
    });
  }

  var api = {
    SELF:           SELF,
    LEGACY:         LEGACY,
    TESSERACT_VERSION: TESSERACT_VERSION,
    PDFJS_VERSION:     PDFJS_VERSION,
    XLSX_VERSION:      XLSX_VERSION,
    TESSCORE_VERSION:  TESSCORE_VERSION,
    TESSDATA_VERSION:  TESSDATA_VERSION,
    HASHWASM_VERSION:  HASHWASM_VERSION,
    PDFLIB_VERSION:    PDFLIB_VERSION,
    PADDLEOCR_VERSION: PADDLEOCR_VERSION,
    loadManifest:   loadManifest,
    resolve:        resolve,
    loadScript:     loadScript,
    importModule:   importModule
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_VENDORS_CFG = api;
})(typeof window !== 'undefined' ? window : null);
