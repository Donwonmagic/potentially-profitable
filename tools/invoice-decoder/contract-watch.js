/**
 * Invoice Decoder — Contract-price reconciliation report (Wave 2.2).
 *
 * Thin formatter on top of sku-history's `checkRow` + `lookupContract`.
 * No persistence here — this module reads MuntinContext.invoiceTrend
 * (already populated on save by invoice-decoder.js) and the operator's
 * `contractPrices` to build a copy-paste reconciliation note like:
 *
 *   "Sysco overcharged $37.80 across 4 lines vs. our contract this
 *    week (Apr 22 – Apr 28):
 *    - Beef tenderloin 10LB: $30.50/lb vs. $28.00 contract  (+$25.00)
 *    - Romaine 24CT: $48.00 vs. $44.00 contract             (+$4.00)
 *    ..."
 *
 * Usage:
 *   var note = MID_CONTRACT_WATCH.buildNoteFor({rows, vendor, since: 7})
 *
 * Privacy posture: everything computed locally over the operator's own
 * trend buffer. Nothing leaves the device.
 */
(function (root) {
  'use strict';

  function _now() { return Date.now(); }

  // Format a per-row overage line. Pack-aware when the row + contract
  // share a comparable unit (handled by sku-history.checkRow).
  function _formatRowLine(row, check) {
    var name = String(row.name || '').trim();
    var actualPrice = (typeof row.unitPrice === 'number') ? row.unitPrice :
      (row.lineTotal && row.qty ? row.lineTotal / row.qty : null);
    var unit = row.unit || (check && check.unit) || '';
    var contractPrice = (check && check.contractPrice) || null;
    var overcharge = (check && check.overcharge) || null;
    var p = function (n) {
      if (n == null || !isFinite(n)) return '?';
      // Currency-ish format with up to 4 decimals trimmed.
      return '$' + (Math.abs(n) >= 1 ? n.toFixed(2) : n.toFixed(4).replace(/\.?0+$/, ''));
    };
    var actualStr = p(actualPrice) + (unit ? '/' + unit : '');
    var contractStr = p(contractPrice) + (unit ? '/' + unit : '');
    var overStr = (overcharge != null && overcharge >= 0)
      ? '(+' + p(overcharge) + ')'
      : '';
    return '- ' + name + ': ' + actualStr + ' vs. ' + contractStr + ' contract ' + overStr;
  }

  // Compute the overage list for a single invoice's rows. Returns
  //   { lines: [{row, check, overage}], total, count }
  function buildOveragesFor(rows) {
    if (typeof MID_SKU_HISTORY === 'undefined' || !MID_SKU_HISTORY.checkRow) {
      return { lines: [], total: 0, count: 0 };
    }
    var lines = [];
    var total = 0;
    (rows || []).forEach(function (r) {
      if (!r || (r.kind && r.kind !== 'item')) return;
      try {
        var check = MID_SKU_HISTORY.checkRow(r);
        if (!check) return;
        if (typeof check.overcharge === 'number' && check.overcharge > 0.01) {
          lines.push({ row: r, check: check, overage: check.overcharge });
          total += check.overcharge;
        }
      } catch (_) {}
    });
    // Sort biggest overage first.
    lines.sort(function (a, b) { return b.overage - a.overage; });
    return {
      lines: lines,
      total: +total.toFixed(2),
      count: lines.length
    };
  }

  // Build a copy-paste-ready reconciliation note. `opts.rows` is the
  // current invoice's parsed rows (required); `opts.vendor` is the
  // human label for the email. Locale-aware via `tt`-shim caller.
  function buildNoteFor(opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    var vendor = opts.vendor || 'Vendor';
    var dateLabel = opts.dateLabel || _isoDate(_now());
    var locale = opts.locale || 'en';
    var ov = buildOveragesFor(rows);
    if (!ov.count) return null;
    var header = (locale === 'es')
      ? vendor + ' nos cobró de más $' + ov.total.toFixed(2) +
        ' en ' + ov.count + ' línea' + (ov.count === 1 ? '' : 's') +
        ' vs. nuestro contrato (factura del ' + dateLabel + '):'
      : vendor + ' overcharged $' + ov.total.toFixed(2) +
        ' across ' + ov.count + ' line' + (ov.count === 1 ? '' : 's') +
        ' vs. our contract (' + dateLabel + ' invoice):';
    var body = ov.lines.map(function (e) { return _formatRowLine(e.row, e.check); }).join('\n');
    var footer = (locale === 'es')
      ? '\n\nPor favor emítenos un crédito o ajuste la próxima factura. Gracias.'
      : '\n\nPlease issue a credit or adjust the next invoice. Thank you.';
    return header + '\n' + body + footer;
  }

  function _isoDate(ts) {
    var d = new Date(ts);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }

  // Best-effort copy-to-clipboard with a tiny synchronous fallback.
  function copyToClipboard(text) {
    if (!text) return Promise.resolve(false);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; })
        .catch(function () { return _legacyCopy(text); });
    }
    return Promise.resolve(_legacyCopy(text));
  }
  function _legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (_) { return false; }
  }

  var api = {
    buildOveragesFor: buildOveragesFor,
    buildNoteFor:     buildNoteFor,
    copyToClipboard:  copyToClipboard,
    _formatRowLine:   _formatRowLine
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CONTRACT_WATCH = api;
})(typeof window !== 'undefined' ? window : null);
