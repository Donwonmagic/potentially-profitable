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
    var withWords = !!(opts && opts.withWords);
    return loadTesseract().then(function (Tesseract) {
      // Wave 2.4 — explicit lease/release so concurrent recognize()
      // calls actually run on parallel pool workers when available.
      return _leaseWorker(Tesseract, lang, psm).then(function (lease) {
        var worker = lease.slot.worker;
        return worker.recognize(canvas, {}, {}).then(function (result) {
          onProgress(0.95);
          var blocks = (result && result.data && result.data.blocks) || [];
          var lines = [];
          var allWords = withWords ? [] : null;
          blocks.forEach(function (b) {
            (b.paragraphs || []).forEach(function (p) {
              (p.lines || []).forEach(function (ln) {
                var lineWords = (ln.words || []).map(function (w) {
                  return {
                    text: String(w.text || '').trim(),
                    confidence: typeof w.confidence === 'number' ? w.confidence : 0,
                    bbox: w.bbox || null
                  };
                }).filter(function (w) { return w.text.length > 0; });
                if (allWords && lineWords.length) Array.prototype.push.apply(allWords, lineWords);
                // Always attach lineWords to the line so the
                // user-words bias (Wave 4.4) has data to work on for
                // every recognize() call, not just the column-
                // orchestrator path. Memory cost is transient — the
                // OCR result is discarded after parse.
                lines.push({
                  text: (ln.text || '').replace(/\s+/g, ' ').trim(),
                  confidence: typeof ln.confidence === 'number' ? ln.confidence : 0,
                  bbox: ln.bbox || null,
                  words: lineWords
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
          // Wave 4.4 + pattern atlas 4/5 — two-tier OCR bias:
          //   1. UNIVERSAL confusion atlas — fires from invoice #1
          //      against canonical digit/letter substitutions on the
          //      fonts distributors use (8↔B, 0↔O, 5↔S, 1↔I/l/L,
          //      2↔Z, 6↔G, $↔S, %↔9, /↔1).
          //   2. OPERATOR vocabulary bias — once the operator has
          //      ≥5 corrections, edit-distance matches into their
          //      personal SKU dictionary.
          // Universal runs first so user-words sees a cleaner token
          // pool; the two layers compound. Mutates lines[].words and
          // rebuilds lines[].text on every change.
          var biasReplacements = 0;
          var universalBiasReplacements = 0;
          if (typeof root !== 'undefined' && root && root.MID_USER_WORDS_BIAS) {
            try {
              if (root.MID_USER_WORDS_BIAS.applyAllToLines) {
                var both = root.MID_USER_WORDS_BIAS.applyAllToLines(lines);
                universalBiasReplacements = both.universal || 0;
                biasReplacements          = both.operator  || 0;
              } else {
                biasReplacements = root.MID_USER_WORDS_BIAS.applyToLines(lines) || 0;
              }
            } catch (_) {}
          }
          var rebuiltText = result.data.text || '';
          if (biasReplacements > 0 || universalBiasReplacements > 0) {
            // Reassemble the flat text blob from the corrected lines so
            // downstream consumers (parse.js) see both bias layers.
            rebuiltText = lines.map(function (l) { return l.text; }).join('\n');
          }
          var meanConf = lines.length ? lines.reduce(function (a, b) { return a + b.confidence; }, 0) / lines.length : 0;
          _releaseWorker(lease);
          return {
            text: rebuiltText,
            lines: lines,
            meanConfidence: meanConf,
            words: allWords,
            userWordsBiasCount: biasReplacements,
            universalBiasCount: universalBiasReplacements
          };
        }).catch(function (err) {
          _releaseWorker(lease);
          throw err;
        });
      });
    });
  }
  // Wave 4.1 wiring helper — convenience entry point for the columns
  // orchestrator. Always sets withWords:true so reconstructColumns
  // can project word-density along X.
  function recognizeCanvasWithWords(canvas, opts) {
    opts = opts || {};
    opts.withWords = true;
    return recognizeCanvas(canvas, opts);
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
      // Wave 4.4 — surface the per-pass bias counts so the controller
      // can attribute each invoice's compounding learning. The merged
      // count is the SUM of both passes (each pass's bias is independent
      // since recognize() runs the bias on its own line set).
      var biasCount = (a.userWordsBiasCount || 0) + (g.userWordsBiasCount || 0);
      return {
        text: bestText, lines: merged, meanConfidence: meanConf,
        perPass: { aggressive: a, gentle: g },
        userWordsBiasCount: biasCount
      };
    });
  }

  // -------------------- Wave 9.2: Tesseract+Paddle ensemble --------------------
  //
  // Run the existing Tesseract multipass AND the PaddleOCR adapter in
  // parallel, then merge by spatial bbox alignment. For each Tesseract
  // line, look for an overlapping Paddle line; the per-line winner is
  // whichever engine reported higher confidence on that text region.
  // Lines with no Paddle counterpart fall through to the Tesseract
  // result; lines that Paddle found but Tesseract missed get appended.
  //
  // Privacy: no network, both engines run locally. The Paddle path
  // gracefully degrades — when the engine isn't loaded (lean device,
  // model unavailable, init error) the merge collapses to Tesseract-
  // only and the operator sees no error.
  //
  // Returns the same shape as recognizeMultiPass with one extra field:
  //   ensembleStats: { tesseractLines, paddleLines, merged, replacedByPaddle }
  function recognizeMultiPassEnsemble(canvasAggressive, canvasGentle, opts) {
    // Post-audit cleanup: the V1 PaddleOCR ensemble (Wave 9.2) was
    // removed because the upstream @paddlejs-models/ocr package
    // disappeared from npm and the model paths at the Paddle.js
    // repo rotted. The integration was always falling back to
    // Tesseract-only via the heavyEnabled() check anyway.
    //
    // The function name is preserved because shim and controller
    // call sites assume it exists on V1; ocr-shim.js then
    // escalates to the V2 ONNX path when V1 returns suspiciously
    // little, which is where the actual ensemble effect now lives
    // (V1 Tesseract → V2 PP-OCRv3 ONNX).
    return recognizeMultiPass(canvasAggressive, canvasGentle, opts);
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

  // -------------------- Wave 4.2: per-region OCR --------------------
  // Re-runs OCR on a tight crop of the canvas defined by a column
  // bbox (from MID_PARSE.reconstructColumns) with a column-tuned
  // character whitelist:
  //   price columns: '0123456789.,$()-'
  //   description columns: alpha + space (PSM 7 single-line)
  //   qty columns: '0123456789.'
  //
  // Concurrency bounded by the same worker pool as recognizeCanvas.
  // Returns { text, lines, meanConfidence } for the cropped region.
  // Exposed for the orchestrator to call when MID_PARSE.reconstructColumns
  // returns a column layout; not auto-wired to avoid soak-fixture
  // regression risk (today's parser path doesn't carry bbox data).
  var WHITELISTS = {
    price: '0123456789.,$()-',
    qty:   '0123456789.',
    desc:  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,/-#&()ÁÉÍÓÚÑáéíóúñü',
    unit:  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./'
  };
  function recognizeRegion(canvas, region, opts) {
    if (!canvas || !region) return Promise.reject(new Error('canvas + region required'));
    opts = opts || {};
    var label = region.label || 'desc';
    var whitelist = opts.whitelist || WHITELISTS[label] || WHITELISTS.desc;
    var psm = opts.psm || (label === 'desc' ? 7 : 7);
    // Crop the region into a temporary canvas.
    var x0 = Math.max(0, Math.floor(region.x0 || 0));
    var y0 = Math.max(0, Math.floor(region.y0 || 0));
    var x1 = Math.min(canvas.width, Math.ceil(region.x1 || canvas.width));
    var y1 = Math.min(canvas.height, Math.ceil(region.y1 || canvas.height));
    var w = x1 - x0, h = y1 - y0;
    if (w <= 0 || h <= 0) return Promise.reject(new Error('invalid region'));
    var crop = document.createElement('canvas');
    crop.width = w; crop.height = h;
    crop.getContext('2d').drawImage(canvas, x0, y0, w, h, 0, 0, w, h);
    return loadTesseract().then(function (Tesseract) {
      return _leaseWorker(Tesseract, opts.lang || 'eng+spa', psm).then(function (lease) {
        var worker = lease.slot.worker;
        return worker.setParameters({
          tessedit_pageseg_mode: String(psm),
          tessedit_char_whitelist: whitelist
        }).then(function () {
          return worker.recognize(crop, {}, {});
        }).then(function (result) {
          var blocks = (result && result.data && result.data.blocks) || [];
          var lines = [];
          blocks.forEach(function (b) {
            (b.paragraphs || []).forEach(function (p) {
              (p.lines || []).forEach(function (ln) {
                lines.push({
                  text: (ln.text || '').replace(/\s+/g, ' ').trim(),
                  confidence: typeof ln.confidence === 'number' ? ln.confidence : 0
                });
              });
            });
          });
          var meanConf = lines.length ? lines.reduce(function (a, b) { return a + b.confidence; }, 0) / lines.length : 0;
          // Restore PSM 6 + base whitelist for the next pool lease.
          return worker.setParameters({
            tessedit_pageseg_mode: '6',
            tessedit_char_whitelist: BLOCK_WHITELIST
          }).then(function () {
            _releaseWorker(lease);
            return {
              text: result.data.text || '',
              lines: lines,
              meanConfidence: meanConf,
              region: { x0: x0, y0: y0, x1: x1, y1: y1, label: label }
            };
          });
        }).catch(function (err) {
          _releaseWorker(lease);
          throw err;
        });
      });
    });
  }

  var api = {
    loadTesseract:        loadTesseract,
    recognizeCanvas:      recognizeCanvas,
    recognizeMultiPass:   recognizeMultiPass,
    recognizeMultiPassEnsemble: recognizeMultiPassEnsemble,
    adaptiveReread:       adaptiveReread,
    recognizeRegion:      recognizeRegion,
    recognizeCanvasWithWords: recognizeCanvasWithWords,
    REGION_WHITELISTS:    WHITELISTS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_OCR = api;
})(typeof window !== 'undefined' ? window : null);
