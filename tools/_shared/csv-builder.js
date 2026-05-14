/**
 * Shared CSV builder for the Muntin Digital toolkit.
 *
 * Six+ tools (cost-pulse, plate-cost, menu-engineering, audits/restaurant,
 * seo-grader, gbp-grader, brand-suite) each have their own CSV export
 * function with subtle differences: some quote every field, some quote
 * only when needed; some escape embedded quotes, some don't; some use
 * \r\n line endings (Excel-friendly), some use \n. End-users get
 * inconsistent exports.
 *
 * This module produces RFC-4180 compliant CSV with a few opinionated
 * defaults: \r\n line endings (for Excel + LibreOffice + Sheets), always
 * quote fields containing a delimiter / quote / newline, never quote
 * pure numeric strings (so Excel parses them as numbers), prepend a
 * BOM by default so Excel auto-detects UTF-8.
 *
 * Usage:
 *   const csv = MuntinCsv.build({
 *     headers: ['Date', 'Vendor', 'Total'],
 *     rows: [
 *       ['2026-05-01', 'Sysco', 1234.5],
 *       ['2026-05-08', 'US Foods', 980.25],
 *     ],
 *   });
 *   MuntinCsv.download(csv, 'invoices-2026-05.csv');
 *
 * Pure functions (except download() which hits the DOM); safe in Node.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinCsv = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_DELIM = ',';
  var DEFAULT_EOL   = '\r\n';
  var BOM           = '﻿';

  var NUMERIC_RE = /^-?\d+(?:\.\d+)?$/;

  function quoteCell(value, delim) {
    if (value == null) return '';
    var s = String(value);
    // Treat pure numeric strings (and numbers) as unquoted so spreadsheet
    // apps parse them as numbers, not strings.
    if (typeof value === 'number' && isFinite(value)) return String(value);
    var needsQuote = s.indexOf(delim) !== -1 ||
                     s.indexOf('"') !== -1 ||
                     s.indexOf('\n') !== -1 ||
                     s.indexOf('\r') !== -1;
    if (!needsQuote) return s;
    // RFC 4180: double the embedded quotes, wrap in quotes.
    return '"' + s.replace(/"/g, '""') + '"';
  }

  // build({ headers, rows, delim, eol, bom }) -> string
  function build(spec) {
    spec = spec || {};
    var delim = spec.delim || DEFAULT_DELIM;
    var eol   = spec.eol   || DEFAULT_EOL;
    var withBom = spec.bom !== false;
    var lines = [];
    if (Array.isArray(spec.headers) && spec.headers.length) {
      lines.push(spec.headers.map(function (h) { return quoteCell(h, delim); }).join(delim));
    }
    if (Array.isArray(spec.rows)) {
      for (var i = 0; i < spec.rows.length; i++) {
        var row = spec.rows[i] || [];
        var cells = [];
        for (var j = 0; j < row.length; j++) {
          cells.push(quoteCell(row[j], delim));
        }
        lines.push(cells.join(delim));
      }
    }
    return (withBom ? BOM : '') + lines.join(eol) + eol;
  }

  // Build a Blob ready for download / share APIs.
  function toBlob(csvString) {
    if (typeof Blob === 'undefined') return null;
    return new Blob([csvString], { type: 'text/csv;charset=utf-8' });
  }

  // Trigger a download. Works in modern browsers including iOS Safari
  // when the user gesture is fresh.
  function download(csvString, filename) {
    if (typeof document === 'undefined') return false;
    var blob = toBlob(csvString);
    if (!blob) return false;
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.csv';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revocation slightly — some Safari versions need it.
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  }

  return {
    build: build,
    toBlob: toBlob,
    download: download,
    _quoteCell: quoteCell // exposed for testing only
  };
}));
