/*
 * Operator Sheets — shared CSV / clipboard / print helper.
 *
 * Loaded on every /sheets/<slug>/ page. All operations are
 * client-side: no fetch, no upload, no analytics on the values.
 *
 * Public globals (attached to window so per-sheet scripts can use
 * them without a build step):
 *
 *   window.SheetCsv.download(rows, filename)      — Blob + revoke
 *   window.SheetCsv.toClipboardText(rows)         — return TSV string
 *   window.SheetCsv.copyToClipboard(text, btn?)   — async + flash UX
 *   window.SheetCsv.print(opts?)                  — window.print()
 *   window.SheetCsv.escapeCell(value)             — RFC-4180 quote
 *   window.SheetCsv.collectFormRows(formEl, opts) — flat key/value pairs
 *   window.SheetCsv.collectTableRows(tableEl)     — header + body 2D
 *
 * No bundler. Plain script tag. Targets evergreen browsers (Cloudflare
 * Pages traffic profile). No polyfills shipped.
 */
(function () {
  'use strict';

  if (window.SheetCsv) return; // idempotent on accidental double-load

  function escapeCell(v) {
    if (v == null) return '';
    var s = String(v);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function rowsToCsv(rows) {
    if (!Array.isArray(rows)) return '';
    return rows.map(function (r) {
      return (Array.isArray(r) ? r : [r]).map(escapeCell).join(',');
    }).join('\r\n') + '\r\n';
  }

  function rowsToTsv(rows) {
    if (!Array.isArray(rows)) return '';
    return rows.map(function (r) {
      return (Array.isArray(r) ? r : [r]).map(function (v) {
        return v == null ? '' : String(v).replace(/[\t\r\n]/g, ' ');
      }).join('\t');
    }).join('\n');
  }

  function download(rows, filename) {
    var csv = rowsToCsv(rows);
    // Prepend a UTF-8 BOM so Excel treats the file as UTF-8 instead
    // of guessing Windows-1252 (which mangles é, ñ, ¿, etc.).
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = filename || 'sheet.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      a.remove();
      URL.revokeObjectURL(url);
    }, 0);
  }

  function toClipboardText(rows) {
    return rowsToTsv(rows);
  }

  function copyToClipboard(text, btn) {
    function flash(ok) {
      if (!btn) return;
      var prev = btn.textContent;
      btn.textContent = ok ? (btn.dataset.copiedLabel || 'Copied') : (btn.dataset.failedLabel || 'Copy failed');
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = prev;
        btn.disabled = false;
      }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { flash(true); },
        function () { fallbackCopy(text); flash(true); }
      );
    }
    fallbackCopy(text);
    flash(true);
    return Promise.resolve();
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) { /* ignore */ }
    ta.remove();
  }

  function print() { window.print(); }

  // Walk a <form> and extract one [name, value] row per labeled field.
  // For unlabeled fields (no <label>), falls back to placeholder or
  // name. Honors data-csv-skip on a field to opt out (e.g. honeypots).
  function collectFormRows(form, opts) {
    if (!form) return [];
    var rows = [['Field', 'Value']];
    var labels = {};
    Array.prototype.forEach.call(form.querySelectorAll('label'), function (lab) {
      var f = lab.htmlFor && document.getElementById(lab.htmlFor);
      if (f) labels[f.name || f.id] = (lab.textContent || '').replace(/\s+/g, ' ').trim();
    });
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.dataset && el.dataset.csvSkip != null) return;
      if (el.type === 'submit' || el.type === 'button' || el.type === 'reset') return;
      var label = labels[el.name] || el.placeholder || el.name;
      var v = el.type === 'checkbox' ? (el.checked ? 'yes' : 'no')
            : el.type === 'radio'    ? (el.checked ? el.value : null)
            : el.value;
      if (v == null) return;
      rows.push([label, v]);
    });
    return rows;
  }

  // Walk an HTML table (the sheet-row-table pattern) and extract
  // header + body rows as a 2D array of strings.
  function collectTableRows(table) {
    if (!table) return [];
    var rows = [];
    Array.prototype.forEach.call(table.querySelectorAll('thead tr'), function (tr) {
      rows.push(Array.prototype.map.call(tr.children, function (cell) {
        return (cell.textContent || '').replace(/\s+/g, ' ').trim();
      }));
    });
    Array.prototype.forEach.call(table.querySelectorAll('tbody tr'), function (tr) {
      rows.push(Array.prototype.map.call(tr.children, function (cell) {
        var input = cell.querySelector('input, select, textarea');
        if (input) {
          if (input.type === 'checkbox') return input.checked ? 'yes' : 'no';
          return (input.value || '').toString();
        }
        return (cell.textContent || '').replace(/\s+/g, ' ').trim();
      }));
    });
    return rows;
  }

  window.SheetCsv = {
    download: download,
    toClipboardText: toClipboardText,
    copyToClipboard: copyToClipboard,
    print: print,
    escapeCell: escapeCell,
    rowsToCsv: rowsToCsv,
    rowsToTsv: rowsToTsv,
    collectFormRows: collectFormRows,
    collectTableRows: collectTableRows,
  };
})();
