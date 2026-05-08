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

  // Slice 2 — onnxruntime-web powers the v2 OCR pipeline. ESM entry
  // point + WASM kernels (SIMD-threaded preferred; the runtime
  // falls back to single-thread WASM on iOS Safari without
  // cross-origin isolation). All paths are same-origin, no
  // outbound fetch required at runtime.
  var ORT_VERSION = '1.20.1';

  // Slice 2 — ONNX model weights for the v2 pipeline.
  // PP-OCRv3 mobile is the lean tier (every device, ~10 MB);
  // PP-OCRv4 mobile is the capable tier (silent background upgrade,
  // ~17 MB more); DocLayNet heron + TableFormer fast are the
  // heavy tier (lazy on demand for difficult invoices).
  // Versions track the directory layout vendor-pin writes; bumping
  // requires re-running vendor-pin.mjs.
  var PPOCR_V3_VERSION = 'v3-en';
  var PPOCR_V4_VERSION = 'v4-en';
  var DOCLING_MODELS_VERSION = 'v2';

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
    paddleocr:     '/assets/vendor/paddleocr@'         + PADDLEOCR_VERSION + '/index.mjs',
    // Slice 2 — onnxruntime-web (ESM entry + WASM kernels).
    // ortMjs is loaded via dynamic import; the WASM blobs are
    // streamed from these paths by ORT itself when it picks an
    // execution provider.
    ortMjs:                 '/assets/vendor/onnxruntime-web@' + ORT_VERSION + '/ort.min.mjs',
    ortJs:                  '/assets/vendor/onnxruntime-web@' + ORT_VERSION + '/ort.min.js',
    ortWasmSimdThreadedMjs: '/assets/vendor/onnxruntime-web@' + ORT_VERSION + '/ort-wasm-simd-threaded.mjs',
    ortWasmSimdThreaded:    '/assets/vendor/onnxruntime-web@' + ORT_VERSION + '/ort-wasm-simd-threaded.wasm',
    ortJsepMjs:             '/assets/vendor/onnxruntime-web@' + ORT_VERSION + '/ort-wasm-simd-threaded.jsep.mjs',
    ortJsepWasm:            '/assets/vendor/onnxruntime-web@' + ORT_VERSION + '/ort-wasm-simd-threaded.jsep.wasm',
    // Slice 2 — PP-OCR ONNX weights. v3 ships on every device;
    // v4 is fetched silently in the background after the first
    // successful read on capable devices and supersedes v3 from
    // the second invoice onward.
    ppocrV3Det:  '/assets/vendor/ppocr@'  + PPOCR_V3_VERSION + '/det.onnx',
    ppocrV3Rec:  '/assets/vendor/ppocr@'  + PPOCR_V3_VERSION + '/rec.onnx',
    ppocrV3Cls:  '/assets/vendor/ppocr@'  + PPOCR_V3_VERSION + '/cls.onnx',
    ppocrV3Dict: '/assets/vendor/ppocr@'  + PPOCR_V3_VERSION + '/dict.txt',
    ppocrV4Det:  '/assets/vendor/ppocr@'  + PPOCR_V4_VERSION + '/det.onnx',
    ppocrV4Rec:  '/assets/vendor/ppocr@'  + PPOCR_V4_VERSION + '/rec.onnx',
    ppocrV4Dict: '/assets/vendor/ppocr@'  + PPOCR_V4_VERSION + '/dict.txt',
    // Slice 2 — Docling layout + table models. Heavy-tier lazy;
    // the runtime only fetches these when layout heuristics
    // report a low-confidence table region on a difficult invoice.
    doclingLayoutHeron: '/assets/vendor/ds4sd@' + DOCLING_MODELS_VERSION + '/docling-layout-heron.onnx',
    tableformerFast:    '/assets/vendor/ds4sd@' + DOCLING_MODELS_VERSION + '/tableformer-fast.onnx'
  };

  // Audit fix (privacy H2): the LEGACY CDN-fallback map is gone.
  // Previously, when /assets/vendor/_integrity.json was missing
  // or empty, resolve(name) would fall through to a cdn.jsdelivr
  // .net URL with no SRI. The CSP `connect-src 'self'` already
  // blocked the network request, but the dead-code path obscured
  // the privacy posture and tripped the egress-check linter on
  // any future scanner that walks string literals. By deleting
  // the map and returning a clean rejection from resolve() when
  // the manifest is absent, we make "the manifest must exist or
  // the load fails loudly" the explicit contract — which matches
  // the comment block at line 28 of vendor-pin.mjs.

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
  // returned. Audit fix (privacy H2): when the manifest is absent
  // and SELF has no entry for the name (or has only a self-hosted
  // path that the manifest doesn't cover), we hand back the
  // same-origin path with no SRI rather than reaching for a CDN.
  // The browser still loads from /assets/vendor/* as long as the
  // build wrote the file; if it didn't, the load fails loudly.
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
          source:    manifest ? 'self-hosted' : 'self-hosted-no-sri'
        };
      }
      // No manifest, but SELF still has the path. Same-origin only;
      // if the file isn't there, the load fails — we never reach
      // for a CDN. (See audit privacy H2: the LEGACY map was
      // deleted; CSP `connect-src 'self'` was the only thing
      // saving us before.)
      if (SELF[name]) {
        return {
          url:       SELF[name],
          integrity: null,
          source:    'self-hosted-no-sri'
        };
      }
      return { url: null, integrity: null, source: 'unresolved' };
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
    TESSERACT_VERSION: TESSERACT_VERSION,
    PDFJS_VERSION:     PDFJS_VERSION,
    XLSX_VERSION:      XLSX_VERSION,
    TESSCORE_VERSION:  TESSCORE_VERSION,
    TESSDATA_VERSION:  TESSDATA_VERSION,
    HASHWASM_VERSION:  HASHWASM_VERSION,
    PDFLIB_VERSION:    PDFLIB_VERSION,
    PADDLEOCR_VERSION: PADDLEOCR_VERSION,
    ORT_VERSION:            ORT_VERSION,
    PPOCR_V3_VERSION:       PPOCR_V3_VERSION,
    PPOCR_V4_VERSION:       PPOCR_V4_VERSION,
    DOCLING_MODELS_VERSION: DOCLING_MODELS_VERSION,
    loadManifest:   loadManifest,
    resolve:        resolve,
    loadScript:     loadScript,
    importModule:   importModule
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_VENDORS_CFG = api;
})(typeof window !== 'undefined' ? window : null);
