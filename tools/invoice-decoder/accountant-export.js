/**
 * Invoice Decoder — Accountant CSV / IIF exporter (Wave 4.6).
 *
 * Generates five formats entirely in-browser via Blob + download:
 *   - QuickBooks Online Bills CSV
 *   - QuickBooks Desktop IIF (transactions + splits)
 *   - Xero Bills CSV
 *   - ContPaqi/Aspel CSV (Spanish, comma-decimal locale)
 *   - Generic ledger CSV
 *
 * Privacy: zero fetch. Operator's parsed rows in, downloadable file
 * out. Column-mapping rules live in `gl-accounts.js` so adding a new
 * accounting platform is a config change, not code surgery.
 *
 * Each row's `kind` (item / credit / deposit / surcharge) maps to a
 * different default GL bucket so the accountant doesn't need to
 * re-classify; operator can override per-row before download.
 */
(function (root) {
  'use strict';

  // GL account suggestions per (category, kind) pair. Maps to each
  // platform's typical chart-of-accounts. Restaurants vary, so these
  // are *suggestions* the operator can override in the UI.
  var GL = {
    qbo: {
      protein:        '5010 Food: Meat',
      seafood:        '5015 Food: Seafood',
      produce:        '5020 Food: Produce',
      dairy:          '5025 Food: Dairy',
      'dry-goods':    '5030 Food: Dry Goods',
      'herbs-spices': '5035 Food: Herbs & Spices',
      paper:          '5050 Supplies: Paper Goods',
      cleaning:       '5055 Supplies: Cleaning',
      beverage:       '5060 Beverage Cost',
      _credit:        '5990 Vendor Credits',
      _deposit:       '5995 Bottle Deposits',
      _surcharge:     '5070 Delivery & Surcharges',
      _none:          '5099 Cost of Sales: Other'
    },
    qbd: {
      protein:        'Food Cost:Meat',
      seafood:        'Food Cost:Seafood',
      produce:        'Food Cost:Produce',
      dairy:          'Food Cost:Dairy',
      'dry-goods':    'Food Cost:Dry Goods',
      'herbs-spices': 'Food Cost:Spices',
      paper:          'Supplies:Paper',
      cleaning:       'Supplies:Cleaning',
      beverage:       'Beverage Cost',
      _credit:        'Vendor Credits',
      _deposit:       'Bottle Deposits',
      _surcharge:     'Delivery Surcharge',
      _none:          'Cost of Sales:Other'
    },
    xero: {
      protein:        '310',
      seafood:        '311',
      produce:        '312',
      dairy:          '313',
      'dry-goods':    '314',
      'herbs-spices': '315',
      paper:          '320',
      cleaning:       '321',
      beverage:       '316',
      _credit:        '399',
      _deposit:       '398',
      _surcharge:     '325',
      _none:          '300'
    },
    contpaqi: {
      protein:        '5010-001-000',
      seafood:        '5010-002-000',
      produce:        '5020-001-000',
      dairy:          '5025-001-000',
      'dry-goods':    '5030-001-000',
      'herbs-spices': '5035-001-000',
      paper:          '5050-001-000',
      cleaning:       '5055-001-000',
      beverage:       '5060-001-000',
      _credit:        '5990-001-000',
      _deposit:       '5995-001-000',
      _surcharge:     '5070-001-000',
      _none:          '5099-001-000'
    }
  };

  function suggestGL(platform, row) {
    var table = GL[platform] || GL.qbo;
    if (row && row.kind && row.kind !== 'item' && table['_' + row.kind]) {
      return table['_' + row.kind];
    }
    if (row && row.category && table[row.category]) return table[row.category];
    return table._none || '';
  }

  function csvEscape(v) {
    var s = (v == null) ? '' : String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function rowsToCSV(rowArrays) {
    return rowArrays.map(function (cols) {
      return cols.map(csvEscape).join(',');
    }).join('\r\n') + '\r\n';
  }

  function fmtDate(ts, locale) {
    var d = new Date(ts || Date.now());
    if (locale === 'es') {
      // dd/mm/yyyy for ContPaqi
      return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    }
    // mm/dd/yyyy for QBO + Xero
    return ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2) + '/' + d.getFullYear();
  }

  function fmtAmount(n, locale) {
    if (locale === 'es') {
      // ContPaqi expects 1.234,56
      var fixed = (Math.round((n || 0) * 100) / 100).toFixed(2);
      var parts = fixed.split('.');
      var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return intPart + ',' + parts[1];
    }
    return (Math.round((n || 0) * 100) / 100).toFixed(2);
  }

  // ---------- Per-format exporters ----------

  function exportQboBills(invoice, opts) {
    opts = opts || {};
    var rows = [['BillNo', 'Vendor', 'BillDate', 'DueDate', 'Terms', 'Memo', 'Account', 'LineDescription', 'LineAmount']];
    var billNo = opts.billNo || ('INV-' + Math.floor((invoice.savedAt || Date.now()) / 1000));
    var vendor = invoice.vendor || opts.defaultVendor || 'Unknown Vendor';
    var billDate = fmtDate(invoice.savedAt);
    var dueDate = fmtDate((invoice.savedAt || Date.now()) + 30 * 86400000);
    (invoice.rows || []).forEach(function (r) {
      var amt = (r.lineTotal || 0).toFixed(2);
      rows.push([
        billNo, vendor, billDate, dueDate, opts.terms || 'Net 30',
        opts.memo || ('Invoice Decoder import — ' + (r.kind || 'item')),
        suggestGL('qbo', r),
        r.name || '',
        amt
      ]);
    });
    return { filename: 'invoice-decoder-qbo-' + billNo + '.csv', mime: 'text/csv', body: rowsToCSV(rows) };
  }

  function exportXeroBills(invoice, opts) {
    opts = opts || {};
    var rows = [['*ContactName', '*InvoiceNumber', '*InvoiceDate', '*DueDate', '*Description', '*Quantity', '*UnitAmount', '*AccountCode', '*TaxType']];
    var billNo = opts.billNo || ('INV-' + Math.floor((invoice.savedAt || Date.now()) / 1000));
    var vendor = invoice.vendor || opts.defaultVendor || 'Unknown Vendor';
    var billDate = fmtDate(invoice.savedAt);
    var dueDate = fmtDate((invoice.savedAt || Date.now()) + 30 * 86400000);
    (invoice.rows || []).forEach(function (r) {
      var qty = (typeof r.qty === 'number' && r.qty > 0) ? r.qty : 1;
      var unit = (r.lineTotal != null) ? (r.lineTotal / qty) : 0;
      rows.push([
        vendor, billNo, billDate, dueDate,
        r.name || '',
        qty,
        unit.toFixed(4),
        suggestGL('xero', r),
        opts.taxType || 'Tax Exempt'
      ]);
    });
    return { filename: 'invoice-decoder-xero-' + billNo + '.csv', mime: 'text/csv', body: rowsToCSV(rows) };
  }

  function exportContPaqi(invoice, opts) {
    opts = opts || {};
    var rows = [['Folio', 'Proveedor', 'Fecha', 'Concepto', 'Cantidad', 'PrecioUnitario', 'Importe', 'CuentaContable']];
    var folio = opts.folio || ('FACT-' + Math.floor((invoice.savedAt || Date.now()) / 1000));
    var vendor = invoice.vendor || opts.defaultVendor || 'Proveedor sin nombre';
    var billDate = fmtDate(invoice.savedAt, 'es');
    (invoice.rows || []).forEach(function (r) {
      var qty = (typeof r.qty === 'number' && r.qty > 0) ? r.qty : 1;
      var unit = (r.lineTotal != null) ? (r.lineTotal / qty) : 0;
      rows.push([
        folio, vendor, billDate,
        r.name || '',
        qty,
        fmtAmount(unit, 'es'),
        fmtAmount(r.lineTotal || 0, 'es'),
        suggestGL('contpaqi', r)
      ]);
    });
    return { filename: 'decoder-factura-' + folio + '.csv', mime: 'text/csv', body: rowsToCSV(rows) };
  }

  function exportGenericLedger(invoice, opts) {
    opts = opts || {};
    var rows = [['VendorName', 'InvoiceNumber', 'InvoiceDate', 'LineDescription', 'Category', 'Kind', 'Quantity', 'Unit', 'UnitPrice', 'LineTotal', 'SuggestedGL', 'PackCase', 'PackUnit', 'PackUnitSize', 'Tags']];
    var billNo = opts.billNo || ('INV-' + Math.floor((invoice.savedAt || Date.now()) / 1000));
    var vendor = invoice.vendor || opts.defaultVendor || 'Unknown Vendor';
    var billDate = fmtDate(invoice.savedAt);
    (invoice.rows || []).forEach(function (r) {
      var qty = (typeof r.qty === 'number') ? r.qty : '';
      var unit = (r.unit != null) ? r.unit : '';
      var unitPrice = (r.lineTotal != null && r.qty) ? (r.lineTotal / r.qty).toFixed(4) : '';
      rows.push([
        vendor, billNo, billDate,
        r.name || '',
        r.category || '',
        r.kind || 'item',
        qty, unit, unitPrice,
        (r.lineTotal || 0).toFixed(2),
        suggestGL('qbo', r),
        (r.pack && r.pack.caseQty) || '',
        (r.pack && r.pack.unit) || '',
        (r.pack && r.pack.unitSize) || '',
        (r.tags || []).join('|')
      ]);
    });
    return { filename: 'invoice-decoder-ledger-' + billNo + '.csv', mime: 'text/csv', body: rowsToCSV(rows) };
  }

  // QBD IIF — tab-delimited transaction blocks. One !TRNS / !SPL /
  // !ENDTRNS triple per invoice; each line item becomes a SPL row.
  function exportQbdIIF(invoice, opts) {
    opts = opts || {};
    var billNo = opts.billNo || ('INV-' + Math.floor((invoice.savedAt || Date.now()) / 1000));
    var vendor = invoice.vendor || opts.defaultVendor || 'Unknown Vendor';
    var billDate = fmtDate(invoice.savedAt);
    var totalAmt = (invoice.rows || []).reduce(function (a, r) { return a + (r.lineTotal || 0); }, 0);
    var lines = [];
    lines.push(['!TRNS', 'TRNSTYPE', 'DATE', 'ACCNT', 'NAME', 'AMOUNT', 'DOCNUM', 'MEMO'].join('\t'));
    lines.push(['!SPL', 'TRNSTYPE', 'DATE', 'ACCNT', 'NAME', 'AMOUNT', 'DOCNUM', 'MEMO'].join('\t'));
    lines.push(['!ENDTRNS'].join('\t'));
    lines.push(['TRNS', 'BILL', billDate, 'Accounts Payable', vendor, '-' + totalAmt.toFixed(2), billNo, 'Invoice Decoder import'].join('\t'));
    (invoice.rows || []).forEach(function (r) {
      lines.push(['SPL', 'BILL', billDate, suggestGL('qbd', r), vendor, (r.lineTotal || 0).toFixed(2), billNo, r.name || ''].join('\t'));
    });
    lines.push(['ENDTRNS'].join('\t'));
    return { filename: 'invoice-decoder-qbd-' + billNo + '.iif', mime: 'application/octet-stream', body: lines.join('\n') + '\n' };
  }

  function exportInvoice(format, invoice, opts) {
    switch (format) {
      case 'qbo':       return exportQboBills(invoice, opts);
      case 'qbd':       return exportQbdIIF(invoice, opts);
      case 'xero':      return exportXeroBills(invoice, opts);
      case 'contpaqi':  return exportContPaqi(invoice, opts);
      case 'generic':   return exportGenericLedger(invoice, opts);
      default:          return exportGenericLedger(invoice, opts);
    }
  }

  // Trigger a browser download for the artifact returned by exportInvoice.
  function download(artifact) {
    if (typeof document === 'undefined' || !artifact) return false;
    var blob = new Blob([artifact.body], { type: artifact.mime || 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = artifact.filename || 'invoice-decoder-export.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
    return true;
  }

  var api = {
    GL:                 GL,
    suggestGL:          suggestGL,
    exportInvoice:      exportInvoice,
    exportQboBills:     exportQboBills,
    exportQbdIIF:       exportQbdIIF,
    exportXeroBills:    exportXeroBills,
    exportContPaqi:     exportContPaqi,
    exportGenericLedger: exportGenericLedger,
    download:           download
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_ACCOUNTANT = api;
})(typeof window !== 'undefined' ? window : null);
