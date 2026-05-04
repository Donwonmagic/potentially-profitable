/**
 * Invoice Decoder — PDF text-layer extraction (Phase 7 W2-1).
 *
 * Distributor-emailed PDFs (Sysco, US Foods, GFS, Restaurant
 * Depot) are >99% accurate via PDF.js text-layer extraction —
 * the text is already digitized in the PDF, no OCR required.
 * Phase 6 W6-2 promised this path in the UI ("PDF · Best") but
 * the input chip never wired up; the audit flagged it as the
 * single largest accuracy unlock the tool was missing.
 *
 * This module exposes MID_PDF_EXTRACT.extractPdf(file) →
 * Promise<{ lines, text, fullText, pages, fontsFallback }>.
 * Output shape matches what MID_PARSE.parseLines expects so the
 * caller (invoice-decoder.js) hands it straight through.
 *
 * Privacy posture:
 *   - PDF.js loads lazily from jsdelivr ON FIRST PDF TAP only —
 *     no page-weight cost for non-users.
 *   - File is read into an ArrayBuffer in the browser; PDF.js
 *     parses in a Web Worker (Worker URL also CDN, same origin
 *     contract as the main lib).
 *   - No network call carries the PDF bytes anywhere.
 *   - Failures (encrypted, image-only, multi-column overlap)
 *     surface honest fallback paths — never silent partial reads.
 */
(function (root) {
  'use strict';

  // Wave 6.4 — PDF.js loads from same-origin via the vendor-config
  // resolver. Native ESM dynamic imports don't yet support SRI, but
  // we still get same-origin enforcement via CSP + the build-time
  // SHA-384 verification baked into vendor-pin.mjs. (Once Import
  // Maps' integrity proposal lands across browsers we'll switch.)
  var __pdfjsLoadPromise = null;

  function loadPdfjs() {
    if (root.pdfjsLib) return Promise.resolve(root.pdfjsLib);
    if (__pdfjsLoadPromise) return __pdfjsLoadPromise;
    if (typeof root.MID_VENDORS_CFG === 'undefined' || !root.MID_VENDORS_CFG.importModule) {
      return Promise.reject(new Error('vendor-config module missing'));
    }
    __pdfjsLoadPromise = (async function () {
      var cfg = root.MID_VENDORS_CFG;
      var mod = await cfg.importModule('pdfjs');
      var pdfjsLib = mod && (mod.default || mod);
      if (!pdfjsLib || !pdfjsLib.getDocument) {
        __pdfjsLoadPromise = null;
        throw new Error('PDF.js loaded but getDocument missing');
      }
      // Set worker URL via the resolver too; same-origin path.
      try {
        var wkr = await cfg.resolve('pdfjsWorker');
        if (wkr && wkr.url) pdfjsLib.GlobalWorkerOptions.workerSrc = wkr.url;
      } catch (_) {}
      root.pdfjsLib = pdfjsLib;
      return pdfjsLib;
    })().catch(function (err) {
      __pdfjsLoadPromise = null;
      throw new Error('Could not load PDF reader — check your network. (' + (err && err.message ? err.message : 'load failed') + ')');
    });
    return __pdfjsLoadPromise;
  }

  // Y-coordinate clustering. items within ~3pt vertical → same
  // line. Sort within each cluster by X. Join with spaces.
  // Note: PDF coordinate system has Y increasing UP, so a higher
  // Y means closer to top of page. We bucket by rounded Y.
  function clusterItemsToLines(items) {
    if (!items || !items.length) return [];
    // Tolerance for grouping items into the same line. 3pt is
    // typical for body text leading; tightened to 2pt for
    // dense invoice rows (saves dollar-amount drift onto the
    // wrong line).
    var TOL = 2;
    // First, sort by Y descending (top to bottom).
    var sorted = items.slice().sort(function (a, b) {
      var ay = (a.transform && a.transform[5]) || 0;
      var by = (b.transform && b.transform[5]) || 0;
      return by - ay;
    });
    var clusters = [];
    sorted.forEach(function (item) {
      var y = (item.transform && item.transform[5]) || 0;
      // Find existing cluster within tolerance; otherwise start new.
      var hit = null;
      for (var i = clusters.length - 1; i >= 0; i--) {
        if (Math.abs(clusters[i].y - y) <= TOL) { hit = clusters[i]; break; }
        // Items are sorted top-down; once we're more than TOL
        // below the most recent cluster, no more matches possible.
        if (clusters[i].y - y > TOL) break;
      }
      if (!hit) {
        hit = { y: y, items: [] };
        clusters.push(hit);
      }
      hit.items.push(item);
    });
    // Within each cluster, sort by X ascending and join.
    var lines = clusters.map(function (cluster) {
      cluster.items.sort(function (a, b) {
        var ax = (a.transform && a.transform[4]) || 0;
        var bx = (b.transform && b.transform[4]) || 0;
        return ax - bx;
      });
      // Smart-space: insert ' ' between items if their X-gap
      // is wider than ~1.5x a typical character width. Otherwise
      // they're adjacent runs of the same word and join directly.
      var text = '';
      var lastEnd = -Infinity;
      cluster.items.forEach(function (item) {
        var x = (item.transform && item.transform[4]) || 0;
        var w = item.width || 0;
        var gap = x - lastEnd;
        if (text && gap > 4) text += ' ';
        text += String(item.str || '');
        lastEnd = x + w;
      });
      return {
        text: text.replace(/\s+/g, ' ').trim(),
        confidence: 99,                  // PDF text layer is authoritative
        bbox: null                       // not used downstream for PDF rows
      };
    }).filter(function (l) { return l.text.length > 0; });
    return lines;
  }

  // Wave 1.3 — richer classifier. Replaces the original `isImageOnly`
  // (< 10 text items) with a multi-signal decision.
  //
  // Signals:
  //   textCoverage: union of text-item bbox area / page area (sums
  //     individual item width × ~font-size; a noisy proxy for "how
  //     much of the page is real text"). < 2% across all pages = image.
  //   avgItemLen: mean string length across items. Auto-OCR overlays
  //     and page-number-only PDFs report tiny strings; < 3 chars on
  //     average across ≥ 20 items = junk text layer.
  //   producer / creator: PDFs from desktop/mobile scanners (ScanSnap,
  //     Adobe Scan, ...) almost always emit image-only output even
  //     when they add a search overlay. Override to image/hybrid.
  //   pages: total page count, used to scale thresholds.
  //
  // Returns one of:
  //   'text'   — clean text layer, use it directly (>99% accurate)
  //   'image'  — no useful text, rasterize + OCR
  //   'hybrid' — text layer present but unreliable; rasterize too
  //              and let the caller pick whichever yields more rows.
  function classifyPdfPages(perPageItems, meta, perPageInfo) {
    perPageInfo = perPageInfo || [];
    var totalItems = perPageItems.reduce(function (s, p) { return s + p.length; }, 0);
    var charCount = 0;
    var coveredArea = 0;
    var pageArea = 0;
    perPageItems.forEach(function (items, idx) {
      items.forEach(function (it) {
        var s = String(it.str || '');
        charCount += s.length;
        // PDF.js item.width is the rendered width of the text run
        // in user-space units; height is approximated as ~font size.
        var h = (it.transform && Math.abs(it.transform[3])) || (it.height || 10);
        coveredArea += (it.width || 0) * h;
      });
      var pi = perPageInfo[idx];
      if (pi && pi.viewport) {
        pageArea += pi.viewport.width * pi.viewport.height;
      }
    });
    var textCoverage = pageArea > 0 ? (coveredArea / pageArea) : 0;
    var avgItemLen = totalItems > 0 ? (charCount / totalItems) : 0;

    // Producer / creator hint from PDF metadata.
    var producer = '';
    var creator = '';
    try {
      if (meta && meta.info) {
        producer = String(meta.info.Producer || '').trim();
        creator = String(meta.info.Creator || '').trim();
      }
    } catch (_) {}
    var scannerHint = null;
    var SCANNER_RE = /(scansnap|adobe\s*scan|brother|epson\s*scan|canoscan|canon\s*ij|hp\s*scan|fujitsu|kodak\s*alaris|xerox|ricoh|kyocera|microsoft\s*lens|camscanner|genius\s*scan)/i;
    if (SCANNER_RE.test(producer + ' ' + creator)) {
      scannerHint = (producer || creator).trim();
    }

    // Decision tree.
    // Hard rule: scanner producer always means image-only or hybrid.
    if (scannerHint) {
      if (totalItems < 20 || avgItemLen < 3) return { kind: 'image', textCoverage: textCoverage, avgItemLen: avgItemLen, scannerHint: scannerHint, producer: producer, creator: creator };
      return { kind: 'hybrid', textCoverage: textCoverage, avgItemLen: avgItemLen, scannerHint: scannerHint, producer: producer, creator: creator };
    }
    // No useful text whatsoever.
    if (totalItems < 10) return { kind: 'image', textCoverage: textCoverage, avgItemLen: avgItemLen, scannerHint: null, producer: producer, creator: creator };
    // Sparse / junk text overlay.
    if (textCoverage < 0.02 && totalItems < 60) return { kind: 'image', textCoverage: textCoverage, avgItemLen: avgItemLen, scannerHint: null, producer: producer, creator: creator };
    if (avgItemLen < 3 && totalItems < 80) return { kind: 'image', textCoverage: textCoverage, avgItemLen: avgItemLen, scannerHint: null, producer: producer, creator: creator };
    // Borderline — text is present but thin. Caller may want to run
    // both paths and merge, especially on scanned PDFs with auto-OCR.
    if (textCoverage < 0.05 || (textCoverage < 0.10 && avgItemLen < 5)) {
      return { kind: 'hybrid', textCoverage: textCoverage, avgItemLen: avgItemLen, scannerHint: null, producer: producer, creator: creator };
    }
    return { kind: 'text', textCoverage: textCoverage, avgItemLen: avgItemLen, scannerHint: null, producer: producer, creator: creator };
  }
  // Backward-compat wrapper. Old callers use `isImageOnly([items])`.
  function isImageOnly(allItemsPerPage) {
    var c = classifyPdfPages(allItemsPerPage, null, []);
    return c.kind === 'image';
  }

  // Public entry. Returns { lines, fullText, pages, vendorHint }.
  // vendorHint is filename-derived (Sysco_export.pdf → 'sysco')
  // — vendors.js will re-detect from text content but the hint
  // is helpful when the text is sparse.
  function extractPdf(file, opts) {
    if (!file) return Promise.reject(new Error('file required'));
    opts = opts || {};
    return file.arrayBuffer().then(function (buf) {
      // Wave 13.3 — retain the original buffer so the annotator
      // (pdf-annotate.js) can write annotation overlays onto a copy
      // of the source PDF without re-fetching. We pass a CLONE into
      // pdfjsLib.getDocument because some pdf.js versions detach the
      // underlying ArrayBuffer once parsing starts; the annotator
      // needs a clean buffer.
      var origBuf = buf.slice(0);
      return loadPdfjs().then(function (pdfjsLib) {
        var docOpts = { data: buf, isEvalSupported: false };
        // Wave 1.5 — accept an optional password from the caller.
        if (opts.password) docOpts.password = opts.password;
        return pdfjsLib.getDocument(docOpts).promise.then(function (d) {
          d.__origBuf = origBuf;     // attach so callers can read after
          return d;
        });
      }).then(function (doc) {
        var pageCount = doc.numPages;
        // Wave 1.3 — read metadata so the classifier can react to
        // /Producer (e.g. "ScanSnap Manager"). Best-effort; many
        // PDFs lack metadata and that's fine.
        var metaPromise = doc.getMetadata().catch(function () { return null; });
        var pagePromises = [];
        for (var i = 1; i <= pageCount; i++) {
          (function (pageNum) {
            pagePromises.push(
              doc.getPage(pageNum).then(function (page) {
                var viewport = page.getViewport({ scale: 1 });
                return page.getTextContent().then(function (content) {
                  return {
                    items: content.items || [],
                    viewport: { width: viewport.width, height: viewport.height }
                  };
                });
              })
            );
          })(i);
        }
        return Promise.all([metaPromise, Promise.all(pagePromises)]).then(function (parts) {
          var meta = parts[0];
          var perPageRich = parts[1];
          var perPage = perPageRich.map(function (p) { return p.items; });
          var perPageInfo = perPageRich.map(function (p) { return { viewport: p.viewport }; });
          var cls = classifyPdfPages(perPage, meta, perPageInfo);
          if (cls.kind === 'image') {
            // Honest fallback path. Caller will render each page to
            // canvas and feed through the photo OCR pipeline.
            return {
              lines: [],
              fullText: '',
              pages: pageCount,
              imageOnly: true,
              classification: cls,
              vendorHint: vendorHintFromFilename(file.name),
              scannerHint: cls.scannerHint || null,
              originalBuffer: origBuf
            };
          }
          // Each page → cluster into lines → flatten across all pages.
          var allLines = [];
          perPage.forEach(function (items) {
            allLines = allLines.concat(clusterItemsToLines(items));
          });
          var fullText = allLines.map(function (l) { return l.text; }).join('\n');
          return {
            lines: allLines,
            fullText: fullText,
            pages: pageCount,
            imageOnly: false,
            // Hybrid kind — caller may rasterize too and merge whichever
            // yields more parseable rows.
            hybrid: cls.kind === 'hybrid',
            classification: cls,
            vendorHint: vendorHintFromFilename(file.name),
            scannerHint: cls.scannerHint || null,
            // Wave 13.3 — original PDF bytes for the annotated-export
            // path. Caller (invoice-decoder.js) stashes on
            // lastReadParsed so the export button can read it later.
            originalBuffer: origBuf
          };
        });
      }).catch(function (err) {
        // PDF.js throws { name: 'PasswordException' } on encrypted
        // PDFs. Surface a structured signal so the caller (Wave 1.5)
        // can prompt for a password rather than a hard error.
        if (err && (err.name === 'PasswordException' || /password/i.test(err.message || ''))) {
          var e = new Error('Locked PDF — enter the password to read it.');
          e.code = 'PDF_PASSWORD_REQUIRED';
          throw e;
        }
        if (err && /InvalidPDF/i.test(err.message || '')) {
          throw new Error('That doesn\'t look like a valid PDF — re-export from your distributor portal.');
        }
        throw err;
      });
    });
  }

  function vendorHintFromFilename(name) {
    var n = String(name || '').toLowerCase();
    if (/sysco/.test(n)) return 'sysco';
    if (/us[\-_]?foods/.test(n)) return 'us-foods';
    if (/gfs|gordon[\-_]?food/.test(n)) return 'gfs';
    if (/restaurant[\-_]?depot|rdepot/.test(n)) return 'restaurant-depot';
    if (/shamrock/.test(n)) return 'shamrock';
    if (/sygma/.test(n)) return 'sygma';
    return null;
  }

  // ScanSnap and other desktop-scanner PDFs ship as PDF wrappers
  // around scanned page images — no text layer to extract. Until
  // this helper landed, the tool gave up on those PDFs and pushed
  // operators back to the photo path. We now render each page to
  // a JPEG File using the already-loaded PDF.js worker and hand
  // the result to handlePhotoFiles(), which runs the same
  // preprocess + multi-pass OCR pipeline used for camera shots.
  //
  // Privacy: rasterization happens entirely in this tab, in the
  // self-hosted PDF.js worker. No bytes leave the device. Same
  // posture as the text-layer path.
  //
  // Memory: cap at 8 pages (matches the photo-path cap) and
  // serial render so the canvas pool peaks at one page worth.
  // Each canvas is released (width=0) after its blob is taken.
  function rasterizeImageOnlyPdf(file, opts) {
    if (!file) return Promise.reject(new Error('file required'));
    opts = opts || {};
    // Wave 1.5 — also accept a password here so the caller can pass
    // the same one through after a successful unlock prompt.
    var password = opts.password || null;
    var maxPages = opts.maxPages || 8;
    // Target ~220 DPI — legible 8pt invoice text after Otsu without
    // ballooning the JPEG; 2.0 scale clamped at 2400 long edge keeps
    // a typical letter page around 2400×3100, ~1.5 MB JPEG @ q=0.92.
    var scale = opts.scale || 2.0;
    var maxLongEdge = opts.maxLongEdge || 2400;
    var jpegQuality = opts.jpegQuality || 0.92;
    var onProgress = (typeof opts.onProgress === 'function') ? opts.onProgress : null;
    var baseName = (file.name || 'scan.pdf').replace(/\.pdf$/i, '');

    return file.arrayBuffer().then(function (buf) {
      return loadPdfjs().then(function (pdfjsLib) {
        var docOpts = { data: buf, isEvalSupported: false };
        if (password) docOpts.password = password;
        return pdfjsLib.getDocument(docOpts).promise;
      }).then(function (doc) {
        var totalPages = Math.min(doc.numPages, maxPages);
        var truncated = doc.numPages > maxPages;
        var files = [];

        function renderOne(idx) {
          if (idx > totalPages) {
            return Promise.resolve({ files: files, totalPages: doc.numPages, truncated: truncated });
          }
          if (onProgress) {
            try { onProgress(idx, totalPages, 'render'); } catch (_) {}
          }
          return doc.getPage(idx).then(function (page) {
            // Honor any page-level rotation metadata.
            var baseViewport = page.getViewport({ scale: 1, rotation: page.rotate || 0 });
            var longEdge = Math.max(baseViewport.width, baseViewport.height);
            // Don't exceed maxLongEdge after applying the scale.
            var effScale = Math.min(scale, maxLongEdge / longEdge);
            if (!isFinite(effScale) || effScale <= 0) effScale = 1;
            var viewport = page.getViewport({ scale: effScale, rotation: page.rotate || 0 });
            var canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(viewport.width));
            canvas.height = Math.max(1, Math.round(viewport.height));
            var ctx = canvas.getContext('2d');
            // White background — invoices print on white paper, and
            // PDF.js preserves transparency for unpainted regions.
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function () {
              return new Promise(function (resolve, reject) {
                canvas.toBlob(function (blob) {
                  if (!blob) {
                    reject(new Error('Could not encode page ' + idx + ' as image.'));
                    return;
                  }
                  var pageFile = new File(
                    [blob],
                    baseName + '-p' + idx + '.jpg',
                    { type: 'image/jpeg' }
                  );
                  files.push(pageFile);
                  // Release the canvas backing buffer right away so
                  // subsequent pages don't pile up on low-memory phones.
                  try { canvas.width = 0; canvas.height = 0; } catch (_) {}
                  resolve();
                }, 'image/jpeg', jpegQuality);
              });
            });
          }).then(function () {
            return renderOne(idx + 1);
          });
        }

        return renderOne(1);
      });
    }).catch(function (err) {
      if (err && (err.name === 'PasswordException' || /password/i.test(err.message || ''))) {
        var e = new Error('Locked PDF — enter the password to read it.');
        e.code = 'PDF_PASSWORD_REQUIRED';
        throw e;
      }
      if (err && /InvalidPDF/i.test(err.message || '')) {
        throw new Error('That doesn\'t look like a valid PDF — re-export from your distributor portal.');
      }
      throw err;
    });
  }

  var api = {
    extractPdf: extractPdf,
    rasterizeImageOnlyPdf: rasterizeImageOnlyPdf,
    classifyPdfPages: classifyPdfPages,
    isImageOnly: isImageOnly,
    loadPdfjs: loadPdfjs,
    _clusterItemsToLines: clusterItemsToLines,
    _vendorHintFromFilename: vendorHintFromFilename
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PDF_EXTRACT = api;
})(typeof window !== 'undefined' ? window : null);
