/**
 * Sysco shop.sysco.com order-history scraper (Wave 13.5).
 *
 * Operator visits their Sysco order detail page, clicks the
 * "Send to Invoice Decoder" bookmarklet. The bookmarklet runs ON
 * THE SYSCO ORIGIN (the operator's already-authenticated session),
 * walks the visible order grid, normalizes rows to the same shape
 * MID_CSV_EXTRACT emits, writes them to sessionStorage on the same
 * origin, and opens the Invoice Decoder PWA which reads them via
 * a same-origin deeplink.
 *
 * Privacy: the bookmarklet is operator code running on Sysco's site;
 * Muntin servers see exactly the same network footprint as a manual
 * paste. The receive flow on the PWA side reads from session
 * storage on muntin.digital — operator must be on both origins.
 *
 * For build, this source is bundled + minified into a javascript:
 * URL ≤ 4KB by scripts/build-bookmarklets.mjs.
 */
(function () {
  'use strict';
  var rows = [];
  // Sysco's order grid is identified by table#orderHistoryGrid (or
  // the .orderLineItem rows on the SPA detail view). We try both.
  var trs = document.querySelectorAll('#orderHistoryGrid tbody tr, .orderLineItem');
  Array.prototype.forEach.call(trs, function (tr) {
    var cells = tr.querySelectorAll('td, [data-cell]');
    if (cells.length < 5) return;
    rows.push({
      sku:       (cells[0] && cells[0].textContent || '').trim(),
      name:      (cells[2] && cells[2].textContent || '').trim(),
      qty:       parseFloat((cells[4] && cells[4].textContent || '').trim()) || null,
      unitPrice: parseFloat(((cells[5] && cells[5].textContent || '').replace(/[$,]/g, '').trim())) || null,
      lineTotal: parseFloat(((cells[7] && cells[7].textContent || '').replace(/[$,]/g, '').trim())) || null
    });
  });
  if (!rows.length) {
    alert('No order rows found. Make sure you are on the Sysco order-detail page.');
    return;
  }
  var payload = {
    vendor: 'sysco',
    capturedAt: Date.now(),
    sourceUrl: location.href,
    rows: rows
  };
  // Stash in sessionStorage on this origin (sysco.com). The PWA
  // can't read across origins, so we open the PWA via a deeplink
  // that the receiving end then reads via window.opener.postMessage.
  // For the bookmarklet flow, simpler: encode payload in the URL
  // hash (cap 2KB) and the PWA's intake handler decodes.
  try {
    var hash = encodeURIComponent(JSON.stringify(payload));
    if (hash.length > 8192) {
      alert('Order has too many rows for the bookmarklet flow — please export to CSV and drop into the tool.');
      return;
    }
    window.open('https://muntin.digital/tools/invoice-decoder/?intake=portal#' + hash, '_blank');
  } catch (err) {
    alert('Could not hand off to Invoice Decoder: ' + err.message);
  }
})();
