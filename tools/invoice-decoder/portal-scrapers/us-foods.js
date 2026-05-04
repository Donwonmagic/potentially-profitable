/**
 * US Foods usfoods.com order-detail scraper (Wave 13.5).
 * See sysco.js for design + privacy notes.
 */
(function () {
  'use strict';
  var rows = [];
  var items = document.querySelectorAll('.line-item-row, [data-line-item], li.order-line');
  Array.prototype.forEach.call(items, function (li) {
    var sku  = li.querySelector('[data-sku], .sku-code');
    var name = li.querySelector('[data-desc], .product-description, .item-name');
    var qty  = li.querySelector('[data-qty], .qty-input, .ordered-qty');
    var unit = li.querySelector('[data-unit-price], .unit-price');
    var line = li.querySelector('[data-line-total], .extended-price');
    rows.push({
      sku:       (sku  && sku.textContent  || sku  && sku.value  || '').trim(),
      name:      (name && name.textContent || '').trim(),
      qty:       parseFloat((qty  && qty.textContent  || qty  && qty.value  || '').trim()) || null,
      unitPrice: parseFloat(((unit && unit.textContent || '').replace(/[$,]/g, '').trim())) || null,
      lineTotal: parseFloat(((line && line.textContent || '').replace(/[$,]/g, '').trim())) || null
    });
  });
  if (!rows.length) { alert('No US Foods line items found on this page.'); return; }
  var payload = { vendor: 'us-foods', capturedAt: Date.now(), sourceUrl: location.href, rows: rows };
  var hash = encodeURIComponent(JSON.stringify(payload));
  if (hash.length > 8192) { alert('Too many rows for the bookmarklet — export to CSV and drop into the tool.'); return; }
  window.open('https://muntin.digital/tools/invoice-decoder/?intake=portal#' + hash, '_blank');
})();
