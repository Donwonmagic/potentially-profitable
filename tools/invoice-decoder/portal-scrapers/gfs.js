/**
 * GFS gfs.com order-detail scraper (Wave 13.5).
 * See sysco.js for design + privacy notes.
 */
(function () {
  'use strict';
  var rows = [];
  var trs = document.querySelectorAll('table.order-lines tbody tr, .order-line-row');
  Array.prototype.forEach.call(trs, function (tr) {
    var cells = tr.querySelectorAll('td');
    if (cells.length < 4) return;
    rows.push({
      sku:       (cells[0] && cells[0].textContent || '').trim(),
      name:      (cells[1] && cells[1].textContent || '').trim(),
      qty:       parseFloat((cells[2] && cells[2].textContent || '').trim()) || null,
      unitPrice: parseFloat(((cells[3] && cells[3].textContent || '').replace(/[$,]/g, '').trim())) || null,
      lineTotal: parseFloat(((cells[4] && cells[4].textContent || '').replace(/[$,]/g, '').trim())) || null
    });
  });
  if (!rows.length) { alert('No GFS line items found on this page.'); return; }
  var payload = { vendor: 'gfs', capturedAt: Date.now(), sourceUrl: location.href, rows: rows };
  var hash = encodeURIComponent(JSON.stringify(payload));
  if (hash.length > 8192) { alert('Too many rows for the bookmarklet — export to CSV and drop into the tool.'); return; }
  window.open('https://muntin.digital/tools/invoice-decoder/?intake=portal#' + hash, '_blank');
})();
