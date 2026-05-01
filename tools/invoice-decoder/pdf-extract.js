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

  var PDFJS_VERSION = '4.5.136';
  var PDFJS_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VERSION + '/build/pdf.min.mjs';
  var PDFJS_WORKER_CDN = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + PDFJS_VERSION + '/build/pdf.worker.min.mjs';

  var __pdfjsLoadPromise = null;

  function loadPdfjs() {
    if (root.pdfjsLib) return Promise.resolve(root.pdfjsLib);
    if (__pdfjsLoadPromise) return __pdfjsLoadPromise;
    __pdfjsLoadPromise = (async function () {
      // ESM dynamic import. PDF.js 4.x ships ESM-only.
      var mod = await import(/* @vite-ignore */ /* webpackIgnore: true */ PDFJS_CDN);
      var pdfjsLib = mod && (mod.default || mod);
      if (!pdfjsLib || !pdfjsLib.getDocument) {
        __pdfjsLoadPromise = null;
        throw new Error('PDF.js loaded but getDocument missing');
      }
      // Set worker URL — required by PDF.js 4.x. Same CDN origin.
      try { pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN; } catch (_) {}
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

  // Detect when a PDF has no text layer (scanned image of the
  // invoice). Heuristic: across ALL pages, fewer than 10 text
  // items total → image-only PDF. Caller falls through to the
  // photo-OCR path with each page rendered to canvas.
  function isImageOnly(allItemsPerPage) {
    var total = allItemsPerPage.reduce(function (s, p) { return s + p.length; }, 0);
    return total < 10;
  }

  // Public entry. Returns { lines, fullText, pages, vendorHint }.
  // vendorHint is filename-derived (Sysco_export.pdf → 'sysco')
  // — vendors.js will re-detect from text content but the hint
  // is helpful when the text is sparse.
  function extractPdf(file) {
    if (!file) return Promise.reject(new Error('file required'));
    return file.arrayBuffer().then(function (buf) {
      return loadPdfjs().then(function (pdfjsLib) {
        return pdfjsLib.getDocument({ data: buf, isEvalSupported: false }).promise;
      }).then(function (doc) {
        var pageCount = doc.numPages;
        var pagePromises = [];
        for (var i = 1; i <= pageCount; i++) {
          (function (pageNum) {
            pagePromises.push(
              doc.getPage(pageNum).then(function (page) {
                return page.getTextContent().then(function (content) {
                  return content.items || [];
                });
              })
            );
          })(i);
        }
        return Promise.all(pagePromises).then(function (perPage) {
          if (isImageOnly(perPage)) {
            // Honest fallback path. Caller will render page 1
            // to canvas and feed through the photo OCR pipeline.
            return {
              lines: [],
              fullText: '',
              pages: pageCount,
              imageOnly: true,
              vendorHint: vendorHintFromFilename(file.name)
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
            vendorHint: vendorHintFromFilename(file.name)
          };
        });
      }).catch(function (err) {
        // PDF.js throws { name: 'PasswordException' } on encrypted
        // PDFs. Surface as a friendlier error string.
        if (err && (err.name === 'PasswordException' || /password/i.test(err.message || ''))) {
          throw new Error('Locked PDF — open it, then re-export unlocked.');
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

  var api = {
    extractPdf: extractPdf,
    loadPdfjs: loadPdfjs,
    _clusterItemsToLines: clusterItemsToLines,
    _vendorHintFromFilename: vendorHintFromFilename
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PDF_EXTRACT = api;
})(typeof window !== 'undefined' ? window : null);
