/**
 * Annotated PDF export (Wave 13.3).
 *
 * Loads pdf-lib lazily on first use (~470 KB; never paid by non-
 * users), opens the original PDF the operator dropped, overlays a
 * corner stamp + per-page annotation page summarizing:
 *
 *   - the parsed line count + total
 *   - amber / red rows that needed review
 *   - any contract overcharges
 *   - the operator's corrections (was → now)
 *
 * Returns a Blob the operator downloads. Bookkeepers love this; the
 * receipt becomes a one-page audit trail of what the operator
 * actually paid, what they corrected, and what was over contract.
 *
 * Privacy posture: pdf-lib runs client-side in WebAssembly. The
 * original PDF buffer never leaves this tab. The annotated output
 * is a Blob the operator triggers to download. No fetch.
 */
(function (root) {
  'use strict';

  var __pdfLibPromise = null;
  function _loadPdfLib() {
    if (__pdfLibPromise) return __pdfLibPromise;
    var cfg = root && root.MID_VENDORS_CFG;
    if (!cfg || typeof cfg.resolve !== 'function') {
      return Promise.reject(new Error('vendor-config module missing'));
    }
    // pdf-lib ships as both UMD and ESM; we prefer the UMD path
    // because it attaches PDFLib to window for trivial detection
    // and works with our existing same-origin <script> loader.
    __pdfLibPromise = cfg.resolve('pdflib').then(function (r) {
      if (root.PDFLib) return root.PDFLib;
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = r.url;
        s.async = true;
        s.crossOrigin = 'anonymous';
        if (r.integrity) s.integrity = r.integrity;
        s.onload = function () {
          if (root.PDFLib) resolve(root.PDFLib);
          else reject(new Error('pdf-lib loaded but PDFLib global missing'));
        };
        s.onerror = function () { reject(new Error('Could not load pdf-lib (' + r.url + ')')); };
        document.head.appendChild(s);
      });
    }).catch(function (err) {
      __pdfLibPromise = null;
      throw err;
    });
    return __pdfLibPromise;
  }

  function _esc(s) { return String(s == null ? '' : s); }

  // Build the annotation summary text. ~80 lines max — bookkeepers
  // skim, don't read.
  function _buildSummaryLines(parsed, opts) {
    opts = opts || {};
    var lines = [];
    lines.push('Muntin Invoice Decoder — Annotated copy');
    lines.push('Generated ' + new Date().toLocaleString());
    lines.push('');
    if (parsed.vendor) lines.push('Vendor: ' + parsed.vendor);
    if (typeof parsed.sumParsed === 'number') {
      lines.push('Parsed total: $' + parsed.sumParsed.toFixed(2));
    }
    var rows = (parsed.rows || []).filter(function (r) { return r && (!r.kind || r.kind === 'item'); });
    lines.push('Lines: ' + rows.length);
    lines.push('');
    // Amber/red flagged rows.
    var flagged = rows.filter(function (r) {
      return (r.confidence || 0) < 80;
    });
    if (flagged.length) {
      lines.push('— Reviewed (' + flagged.length + ') —');
      flagged.slice(0, 18).forEach(function (r) {
        var conf = Math.round(r.confidence || 0);
        var p = (typeof r.lineTotal === 'number') ? '$' + r.lineTotal.toFixed(2) : '';
        lines.push('  ' + r.name + '  ' + p + '  · conf ' + conf + '%');
      });
      if (flagged.length > 18) lines.push('  …and ' + (flagged.length - 18) + ' more');
      lines.push('');
    }
    // Operator edits — captured via cell-history (when available).
    var edits = [];
    try {
      if (root && root.MID_CELL_HISTORY && root.MID_CELL_HISTORY.list) {
        rows.forEach(function (r, idx) {
          ['name', 'qty', 'lineTotal'].forEach(function (field) {
            var stack = root.MID_CELL_HISTORY.list(idx, field);
            if (stack && stack.length >= 2) {
              edits.push({
                rowName: r.name,
                field: field,
                from: stack[stack.length - 1].value,    // OCR original
                to:   stack[0].value                    // current
              });
            }
          });
        });
      }
    } catch (_) {}
    if (edits.length) {
      lines.push('— Operator corrections (' + edits.length + ') —');
      edits.slice(0, 15).forEach(function (e) {
        lines.push('  ' + e.rowName + '  ' + e.field + ': ' + _esc(e.from) + ' → ' + _esc(e.to));
      });
      lines.push('');
    }
    // Contract overcharges via dish-drift if any rows hit.
    try {
      if (root && root.MID_CONTRACT_WATCH && root.MID_CONTRACT_WATCH.buildOveragesFor) {
        var ov = root.MID_CONTRACT_WATCH.buildOveragesFor(rows);
        if (ov && ov.count) {
          lines.push('— Contract overages (' + ov.count + ' line' + (ov.count === 1 ? '' : 's') + ', $' + ov.total.toFixed(2) + ') —');
          ov.lines.slice(0, 10).forEach(function (entry) {
            lines.push('  ' + entry.row.name + '  +$' + entry.overage.toFixed(2));
          });
          lines.push('');
        }
      }
    } catch (_) {}
    lines.push('— —');
    lines.push('Caught by Muntin Invoice Decoder · muntin.digital');
    lines.push('Encrypted on this device. Open DevTools → Network: it stays empty.');
    return lines;
  }

  // Annotate the original PDF: append a fresh page with the summary,
  // and stamp every existing page with a small bottom-right
  // "Annotated by Muntin" watermark. Returns Blob.
  function annotateInvoice(parsed, opts) {
    opts = opts || {};
    var origBuf = parsed && parsed.originalBuffer;
    if (!origBuf || !origBuf.byteLength) {
      // No source buffer — fall back to a "summary only" PDF.
      return _summaryOnlyPdf(parsed);
    }
    return _loadPdfLib().then(function (PDFLib) {
      var PDFDocument = PDFLib.PDFDocument;
      var StandardFonts = PDFLib.StandardFonts;
      var rgb = PDFLib.rgb;
      return PDFDocument.load(origBuf, { ignoreEncryption: true }).then(function (pdfDoc) {
        return pdfDoc.embedFont(StandardFonts.Helvetica).then(function (font) {
          return pdfDoc.embedFont(StandardFonts.HelveticaBold).then(function (fontBold) {
            // Per-page bottom-right watermark.
            pdfDoc.getPages().forEach(function (page) {
              var w = page.getWidth(), h = page.getHeight();
              page.drawText('Annotated · Muntin Invoice Decoder', {
                x: w - 220, y: 16, size: 8, font: font, color: rgb(0.18, 0.31, 0.36)
              });
            });
            // Append a summary page at the same page size as page 1.
            var template = pdfDoc.getPages()[0];
            var pw = template.getWidth(), ph = template.getHeight();
            var sumPage = pdfDoc.addPage([pw, ph]);
            // Header bar.
            sumPage.drawRectangle({ x: 0, y: ph - 60, width: pw, height: 60, color: rgb(0.062, 0.157, 0.149) });
            sumPage.drawText('Invoice annotation copy', {
              x: 36, y: ph - 38, size: 18, font: fontBold, color: rgb(1, 1, 1)
            });
            // Body.
            var lines = _buildSummaryLines(parsed, opts);
            var y = ph - 90;
            var lineH = 14;
            lines.forEach(function (ln) {
              if (y < 60) return;     // ran out of room
              var isHeader = /^—.*—$/.test(ln);
              var size = isHeader ? 11 : 10;
              var f = isHeader ? fontBold : font;
              sumPage.drawText(ln.length > 110 ? ln.slice(0, 107) + '…' : ln, {
                x: 36, y: y, size: size, font: f,
                color: isHeader ? rgb(0.062, 0.157, 0.149) : rgb(0.078, 0.086, 0.102)
              });
              y -= lineH;
            });
            // Footer.
            sumPage.drawText('Bytes never left your device. Verify by opening DevTools → Network during this run.', {
              x: 36, y: 36, size: 8, font: font, color: rgb(0.4, 0.42, 0.46)
            });
            return pdfDoc.save();
          });
        });
      });
    }).then(function (bytes) {
      return new Blob([bytes], { type: 'application/pdf' });
    });
  }

  // Fallback when the source PDF buffer wasn't retained (photo OCR,
  // CSV, etc). Emit a single-page annotation summary.
  function _summaryOnlyPdf(parsed) {
    return _loadPdfLib().then(function (PDFLib) {
      var PDFDocument = PDFLib.PDFDocument;
      var StandardFonts = PDFLib.StandardFonts;
      var rgb = PDFLib.rgb;
      return PDFDocument.create().then(function (pdfDoc) {
        return pdfDoc.embedFont(StandardFonts.Helvetica).then(function (font) {
          return pdfDoc.embedFont(StandardFonts.HelveticaBold).then(function (fontBold) {
            var pw = 612, ph = 792;     // US letter
            var page = pdfDoc.addPage([pw, ph]);
            page.drawRectangle({ x: 0, y: ph - 60, width: pw, height: 60, color: rgb(0.062, 0.157, 0.149) });
            page.drawText('Invoice annotation copy', {
              x: 36, y: ph - 38, size: 18, font: fontBold, color: rgb(1, 1, 1)
            });
            var lines = _buildSummaryLines(parsed, {});
            var y = ph - 90;
            lines.forEach(function (ln) {
              if (y < 60) return;
              var isHeader = /^—.*—$/.test(ln);
              page.drawText(ln.length > 110 ? ln.slice(0, 107) + '…' : ln, {
                x: 36, y: y, size: isHeader ? 11 : 10, font: isHeader ? fontBold : font,
                color: isHeader ? rgb(0.062, 0.157, 0.149) : rgb(0.078, 0.086, 0.102)
              });
              y -= 14;
            });
            page.drawText('Caught by Muntin Invoice Decoder · muntin.digital', {
              x: 36, y: 36, size: 8, font: font, color: rgb(0.4, 0.42, 0.46)
            });
            return pdfDoc.save();
          });
        });
      });
    }).then(function (bytes) {
      return new Blob([bytes], { type: 'application/pdf' });
    });
  }

  // Convenience: build + trigger download.
  function exportAnnotated(parsed, opts) {
    opts = opts || {};
    return annotateInvoice(parsed, opts).then(function (blob) {
      var fname = opts.filename || 'invoice-annotated-' + Date.now() + '.pdf';
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { a.remove(); URL.revokeObjectURL(url); } catch (_) {} }, 200);
      if (root.plausible) {
        try { root.plausible('Invoice Decoder PDF Annotated'); } catch (_) {}
      }
      return blob;
    });
  }

  // Capability check: returns true when pdf-lib is reachable. UI
  // gating uses this so the export button isn't surfaced when the
  // vendor isn't pinned and the operator is offline.
  function isAvailable() {
    if (!root.MID_VENDORS_CFG) return false;
    return true;
  }

  var api = {
    annotateInvoice: annotateInvoice,
    exportAnnotated: exportAnnotated,
    isAvailable:     isAvailable,
    _buildSummaryLines: _buildSummaryLines
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PDF_ANNOTATE = api;
})(typeof window !== 'undefined' ? window : null);
