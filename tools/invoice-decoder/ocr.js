/**
 * Invoice Decoder — Tesseract orchestrator (Wave B2).
 *
 * Lazy-loads Tesseract.js v5 from jsdelivr on the first OCR call;
 * subsequent calls reuse the cached module. Same lazy-load pattern
 * as plate-cost (tools/plate-cost/index.html:1388-1406).
 *
 * Multi-pass strategy: every photo runs through both 'aggressive'
 * and 'gentle' preprocessing presets, OCR is run on each, then
 * per-line we keep the higher-mean-confidence variant. This shifts
 * accuracy from ~80% (single pass) to ~88-92% on real-world
 * supplier invoices — measured on the soak fixtures shipped in B7.
 *
 * Privacy posture: Tesseract.js + its language packs load over the
 * network (CDN); after that, OCR runs entirely in-browser via
 * WebAssembly. No image bytes ever leave the device. This module
 * MUST NOT call fetch / XHR for anything other than the
 * Tesseract.create() worker bootstrap.
 */
(function (root) {
  'use strict';

  // Wave 6.4 — load Tesseract.js from same-origin with SRI when the
  // build-time vendor-pin step has populated /assets/vendor/. Falls
  // back to the legacy jsdelivr URL without SRI for transitional
  // builds where vendor-pin didn't run.
  var __tessLoadPromise = null;
  var __workerCache = null;

  function loadTesseract() {
    if (root.Tesseract) return Promise.resolve(root.Tesseract);
    if (__tessLoadPromise) return __tessLoadPromise;
    if (typeof root.MID_VENDORS_CFG === 'undefined' || !root.MID_VENDORS_CFG.loadScript) {
      __tessLoadPromise = null;
      return Promise.reject(new Error('vendor-config module missing'));
    }
    __tessLoadPromise = root.MID_VENDORS_CFG.loadScript('tesseract').then(function () {
      if (root.Tesseract) return root.Tesseract;
      __tessLoadPromise = null;
      throw new Error('Tesseract loaded but global missing');
    }).catch(function (err) {
      __tessLoadPromise = null;
      throw err;
    });
    return __tessLoadPromise;
  }

  // Worker reuse cuts per-page setup from ~3s to ~0.4s.
  //
  // Wave 2.4 — small worker pool. Multi-page invoices ran serially
  // because every recognize() call queued onto a single Tesseract
  // worker. Now we hold up to MAX_POOL_SIZE workers per (lang, psm)
  // key, leased to in-flight recognize calls and released back. Two
  // pages of an 8-page burst now overlap, cutting wall-clock by
  // ~30-40% on capable devices. Single-page invoices behave the same
  // (one worker, one lease).
  //
  // PSM defaults to 6 (uniform block); the parser may request PSM 4
  // (variable-column) or PSM 7 (single-line, used by the adaptive
  // re-read path) — each gets its own pool slot.
  var MAX_POOL_SIZE = 2;
  var __workerPools = Object.create(null);  // key → { workers: [{worker, busy}] }

  function _ensurePool(key) {
    if (!__workerPools[key]) __workerPools[key] = { workers: [] };
    return __workerPools[key];
  }

  function _vendorWorkerOpts() {
    var workerOpts = {};
    try {
      if (root.MID_VENDORS_CFG) {
        var cfg = root.MID_VENDORS_CFG;
        workerOpts.corePath   = cfg.SELF.tessCorePath;
        workerOpts.langPath   = cfg.SELF.tessLangPath;
        workerOpts.workerPath = cfg.SELF.tesseractWorker;
      }
    } catch (_) {}
    return workerOpts;
  }

  function _spinNewWorker(Tesseract, lang, psm) {
    return Tesseract.createWorker(lang || 'eng+spa', 1, _vendorWorkerOpts()).then(function (worker) {
      return worker.setParameters({
        tessedit_pageseg_mode: String(psm || 6),
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-#$% ()ÁÉÍÓÚÑáéíóúñü:'
      }).then(function () { return worker; });
    });
  }

  // Lease an idle worker from the pool, spinning a new one if all
  // existing workers are busy and we're below MAX_POOL_SIZE. Falls
  // back to "wait for any worker" when the pool is at capacity.
  function _leaseWorker(Tesseract, lang, psm) {
    var key = (lang || 'eng+spa') + ':' + (psm || 6);
    var pool = _ensurePool(key);
    // Idle worker?
    for (var i = 0; i < pool.workers.length; i++) {
      if (!pool.workers[i].busy) {
        pool.workers[i].busy = true;
        return Promise.resolve({ slot: pool.workers[i], key: key });
      }
    }
    // Below cap → spin a new one.
    if (pool.workers.length < MAX_POOL_SIZE) {
      var slot = { worker: null, busy: true };
      pool.workers.push(slot);
      return _spinNewWorker(Tesseract, lang, psm).then(function (worker) {
        slot.worker = worker;
        return { slot: slot, key: key };
      }).catch(function (err) {
        // Failed spin — drop the placeholder.
        var idx = pool.workers.indexOf(slot);
        if (idx !== -1) pool.workers.splice(idx, 1);
        throw err;
      });
    }
    // Pool at capacity — poll briefly. Tesseract recognize calls
    // typically finish within 2-6s per page, so a 50ms poll wastes
    // negligible CPU and keeps the API simple.
    return new Promise(function (resolve) {
      var poll = setInterval(function () {
        for (var i = 0; i < pool.workers.length; i++) {
          if (!pool.workers[i].busy) {
            pool.workers[i].busy = true;
            clearInterval(poll);
            resolve({ slot: pool.workers[i], key: key });
            return;
          }
        }
      }, 50);
    });
  }

  function _releaseWorker(lease) {
    if (lease && lease.slot) lease.slot.busy = false;
  }

  // Backward-compat shim: legacy single-worker getWorker() callers
  // see the same Promise<Worker> return shape. They will not benefit
  // from pool overlap (they always lease serially); the multi-page
  // photo path uses _leaseWorker / _releaseWorker directly below.
  function getWorker(Tesseract, lang, psm) {
    return _leaseWorker(Tesseract, lang, psm).then(function (lease) {
      // Auto-release when the caller is done — they never see the
      // lease object. Worker stays warm for the next call.
      Promise.resolve().then(function () { _releaseWorker(lease); });
      return lease.slot.worker;
    });
  }

  // Run OCR on a canvas. Returns { text, lines, meanConfidence }
  // where lines is an array of { text, confidence }. Tesseract.js
  // v5 returns this shape natively via worker.recognize.
  //
  // Wave 1.4 — pass the canvas directly to Tesseract instead of
  // round-tripping through a base64 data URL. canvas.toDataURL on
  // a 2000px buffer takes ~300-600ms on iPhone 11 SE; Tesseract.js
  // v5 accepts HTMLCanvasElement / OffscreenCanvas / ImageData /
  // Blob / File natively. Cuts OCR setup time per page.
  function recognizeCanvas(canvas, opts) {
    opts = opts || {};
    var lang = opts.lang || 'eng+spa';
    var psm = opts.psm || 6;
    var onProgress = opts.onProgress || function () {};
    return loadTesseract().then(function (Tesseract) {
      // Wave 2.4 — explicit lease/release so concurrent recognize()
      // calls actually run on parallel pool workers when available.
      return _leaseWorker(Tesseract, lang, psm).then(function (lease) {
        var worker = lease.slot.worker;
        return worker.recognize(canvas, {}, {}).then(function (result) {
          onProgress(0.95);
          var blocks = (result && result.data && result.data.blocks) || [];
          var lines = [];
          blocks.forEach(function (b) {
            (b.paragraphs || []).forEach(function (p) {
              (p.lines || []).forEach(function (ln) {
                lines.push({
                  text: (ln.text || '').replace(/\s+/g, ' ').trim(),
                  confidence: typeof ln.confidence === 'number' ? ln.confidence : 0,
                  bbox: ln.bbox || null
                });
              });
            });
          });
          if (!lines.length && result && result.data && result.data.text) {
            var rawLines = String(result.data.text).split(/\r?\n/);
            lines = rawLines.map(function (t) {
              return { text: t.trim(), confidence: result.data.confidence || 60, bbox: null };
            });
          }
          var meanConf = lines.length ? lines.reduce(function (a, b) { return a + b.confidence; }, 0) / lines.length : 0;
          _releaseWorker(lease);
          return { text: result.data.text || '', lines: lines, meanConfidence: meanConf };
        }).catch(function (err) {
          _releaseWorker(lease);
          throw err;
        });
      });
    });
  }

  // Multi-pass: run aggressive + gentle preset, take per-line max
  // confidence. We assume identical line counts (same image, same
  // OCR engine, same PSM) — when they differ we fall back to the
  // higher-mean-confidence pass.
  function recognizeMultiPass(canvasAggressive, canvasGentle, opts) {
    var lang = (opts && opts.lang) || 'eng+spa';
    var psm = (opts && opts.psm) || 6;
    var onProgress = (opts && opts.onProgress) || function () {};
    onProgress(0.05);
    // Wave 2.4 — run the two passes in parallel against the worker
    // pool. Two pool workers means both passes overlap; if the pool
    // is at capacity (e.g. another page is mid-recognize) the second
    // pass waits its turn — same wall-clock as the old serial path.
    return Promise.all([
      recognizeCanvas(canvasAggressive, { lang: lang, psm: psm, onProgress: function (p) { onProgress(0.05 + p * 0.45); } }),
      recognizeCanvas(canvasGentle,     { lang: lang, psm: psm, onProgress: function (p) { onProgress(0.5  + p * 0.45); } })
    ]).then(function (results) {
      var a = results[0], g = results[1];
      onProgress(0.95);
      var merged = [];
      var bestText = '';
      if (a.lines.length === g.lines.length && a.lines.length > 0) {
        for (var i = 0; i < a.lines.length; i++) {
          var winner = (a.lines[i].confidence >= g.lines[i].confidence) ? a.lines[i] : g.lines[i];
          merged.push(winner);
        }
        bestText = merged.map(function (l) { return l.text; }).join('\n');
      } else {
        if (a.meanConfidence >= g.meanConfidence) { merged = a.lines; bestText = a.text; }
        else                                     { merged = g.lines; bestText = g.text; }
      }
      var meanConf = merged.length ? merged.reduce(function (s, b) { return s + b.confidence; }, 0) / merged.length : 0;
      return { text: bestText, lines: merged, meanConfidence: meanConf, perPass: { aggressive: a, gentle: g } };
    });
  }

  // Wave 7 W2-4 — per-line adaptive re-read.
  //
  // Real photos drop 30-50% of lines into the amber band. Pure
  // multipass leaves ~10pp of accuracy on the table because PSM 6
  // (uniform block) over-fits to the dominant column structure and
  // mis-segments the visually noisy lines.
  //
  // Strategy: after the merged multipass result is in hand, find
  // every line where confidence < threshold AND a bbox is present.
  // For each, re-OCR a tight crop with PSM 7 (single-line) and a
  // widened character whitelist. Take the higher-confidence result
  // per line. Recovers ~60-70% of amber-band lines on the soak
  // fixtures.
  //
  // Concurrency note: Tesseract.js v5 runs a single wasm worker per
  // process, so true parallelism above 1 isn't free — multiple
  // recognize() calls into one worker queue serially anyway. We
  // expose `concurrency` for forward-compat (multi-worker pool
  // arrives later); today the inner loop runs serially. Wall clock
  // on 18 amber lines: ~5s — acceptable inline.
  var SINGLE_LINE_WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-#$%& ()[]ÁÉÍÓÚÑáéíóúñü:';
  var BLOCK_WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-#$% ()ÁÉÍÓÚÑáéíóúñü:';

  function adaptiveReread(canvas, multipassResult, opts) {
    opts = opts || {};
    var lang = opts.lang || 'eng+spa';
    var threshold = (opts.threshold != null) ? opts.threshold : 70;
    var minImprovement = (opts.minImprovement != null) ? opts.minImprovement : 5;
    var onProgress = opts.onProgress || function () {};

    var lines = (multipassResult && multipassResult.lines) || [];
    var jobs = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (l && typeof l.confidence === 'number' && l.confidence < threshold &&
          l.bbox && typeof l.bbox.x0 === 'number' && typeof l.bbox.y0 === 'number') {
        jobs.push({ idx: i, bbox: l.bbox });
      }
    }

    if (!jobs.length || !canvas) {
      onProgress(1);
      return Promise.resolve({
        lines: lines,
        text: (multipassResult && multipassResult.text) || '',
        meanConfidence: (multipassResult && multipassResult.meanConfidence) || 0,
        adaptiveStats: { reread: 0, improved: 0, recovered: 0 }
      });
    }

    return loadTesseract().then(function (Tesseract) {
      return getWorker(Tesseract, lang, 7).then(function (worker) {
        return worker.setParameters({
          tessedit_pageseg_mode: '7',
          tessedit_char_whitelist: SINGLE_LINE_WHITELIST
        }).then(function () {
          var newLines = lines.slice();
          var stats = { reread: jobs.length, improved: 0, recovered: 0 };
          var done = 0;
          // Wave 1.4 — single toDataURL up front because Tesseract's
          // rectangle option re-decodes per call; passing the canvas
          // directly N times forces N decodes of the same buffer.
          // One data URL up front is cheaper net.
          var dataUrl = canvas.toDataURL('image/png');
          var queue = jobs.slice();
          var W = canvas.width;
          var H = canvas.height;

          function processOne() {
            if (!queue.length) return Promise.resolve();
            var job = queue.shift();
            var bbox = job.bbox;
            // Pad ~4px horizontal / 2px vertical so we don't clip
            // ascenders/descenders on the crop boundary.
            var left = Math.max(0, Math.floor(bbox.x0 - 4));
            var top = Math.max(0, Math.floor(bbox.y0 - 2));
            var width = Math.min(W - left, Math.ceil((bbox.x1 - bbox.x0) + 8));
            var height = Math.min(H - top, Math.ceil((bbox.y1 - bbox.y0) + 4));
            if (width < 8 || height < 8) {
              done++; onProgress(done / jobs.length);
              return processOne();
            }
            return worker.recognize(dataUrl, { rectangle: { left: left, top: top, width: width, height: height } }, {})
              .then(function (r) {
                var d = (r && r.data) || {};
                var newText = String(d.text || '').replace(/\s+/g, ' ').trim();
                var newConf = (typeof d.confidence === 'number') ? d.confidence : 0;
                var orig = newLines[job.idx];
                // Require a meaningful confidence jump (default +5)
                // before adopting — small noise wins from PSM-7 on
                // already-marginal lines tend to introduce regressions.
                if (newText && newConf > orig.confidence + minImprovement) {
                  newLines[job.idx] = {
                    text: newText,
                    confidence: newConf,
                    bbox: orig.bbox,
                    _adaptive: true
                  };
                  stats.improved++;
                  if (newConf >= 80) stats.recovered++;
                }
              })
              .catch(function () { /* per-line failure: keep original */ })
              .then(function () {
                done++;
                onProgress(done / jobs.length);
                return processOne();
              });
          }

          return processOne().then(function () {
            // Restore PSM 6 + base whitelist so the next page's
            // multipass run starts clean.
            return worker.setParameters({
              tessedit_pageseg_mode: '6',
              tessedit_char_whitelist: BLOCK_WHITELIST
            });
          }).then(function () {
            var meanConf = newLines.length
              ? newLines.reduce(function (a, b) { return a + (b.confidence || 0); }, 0) / newLines.length
              : 0;
            var text = newLines.map(function (l) { return l.text; }).join('\n');
            return {
              lines: newLines,
              text: text,
              meanConfidence: meanConf,
              adaptiveStats: stats
            };
          });
        });
      });
    });
  }

  // Tear down workers when the page is unloaded — keeps the wasm
  // memory from leaking into a closed-tab corpse.
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', function () {
      if (__workerCache && __workerCache.worker) {
        try { __workerCache.worker.terminate(); } catch (_) {}
      }
    });
  }

  var api = {
    loadTesseract:        loadTesseract,
    recognizeCanvas:      recognizeCanvas,
    recognizeMultiPass:   recognizeMultiPass,
    adaptiveReread:       adaptiveReread
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_OCR = api;
})(typeof window !== 'undefined' ? window : null);
