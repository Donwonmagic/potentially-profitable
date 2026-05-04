/**
 * Shareable insight cards (Wave 13.1).
 *
 * When a high-leverage insight fires (contract overcharge, vendor
 * switch ROI, supplier health drop), compose a square 1080×1350 PNG
 * the operator can share to a chefs' group chat. The card watermarks
 * the tool — every screenshot becomes a referral.
 *
 * Privacy: SKU names are redacted to "Item A / Item B / …" by
 * default. The operator can toggle "show SKU names" in the share
 * dialog if they're sharing internally.
 *
 * Implementation: pure 2D canvas (no external libs). Tries
 * OffscreenCanvas when available; falls back to a hidden <canvas>.
 *
 * Public API:
 *   compose(template, data)   → Promise<Blob>      PNG blob
 *   share(template, data)     → Promise<void>      navigator.share or download
 */
(function (root) {
  'use strict';

  if (typeof root === 'undefined' || !root) return;

  var WIDTH = 1080, HEIGHT = 1350;
  var BG = '#FAF7F2', INK = '#14161A', INK_SOFT = '#2A2D33', TEAL = '#1F4E5B', RUST = '#B25C2A';

  function _ctxOnCanvas() {
    if (typeof OffscreenCanvas !== 'undefined') {
      return new OffscreenCanvas(WIDTH, HEIGHT).getContext('2d');
    }
    var c = document.createElement('canvas');
    c.width = WIDTH; c.height = HEIGHT;
    return c.getContext('2d');
  }

  function _drawHeader(ctx, eyebrow, headline, accent) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = accent || TEAL;
    ctx.fillRect(0, 0, WIDTH, 12);
    ctx.fillStyle = INK_SOFT;
    ctx.font = '600 28px -apple-system, system-ui, sans-serif';
    ctx.fillText(String(eyebrow || '').toUpperCase(), 64, 100);
    ctx.fillStyle = INK;
    ctx.font = '500 64px Georgia, serif';
    _wrapText(ctx, String(headline || ''), 64, 200, WIDTH - 128, 80);
  }

  function _wrapText(ctx, text, x, y, maxW, lineH) {
    var words = String(text).split(/\s+/);
    var line = '', cy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxW && i > 0) {
        ctx.fillText(line.trim(), x, cy);
        cy += lineH;
        line = words[i] + ' ';
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, cy);
    return cy;
  }

  function _drawFooter(ctx) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = '600 24px -apple-system, system-ui, sans-serif';
    ctx.fillText('Caught by Muntin Invoice Decoder · muntin.digital', 64, HEIGHT - 64);
    ctx.fillStyle = TEAL;
    ctx.font = '400 18px -apple-system, system-ui, sans-serif';
    ctx.fillText('Free, on-device, encrypted. Open the Network tab — it stays empty.', 64, HEIGHT - 32);
  }

  function _redactedLabels(items, redact) {
    if (!redact) return items.map(function (it, i) { return Object.assign({}, it, { _label: it.label }); });
    return items.map(function (it, i) {
      var label = 'Item ' + String.fromCharCode(65 + i);
      return Object.assign({}, it, { _label: label });
    });
  }

  // template = 'contract-overage' | 'vendor-switch' | 'supplier-health'
  function compose(template, data, opts) {
    opts = opts || {};
    var redact = (opts.redact !== false);     // default redact ON for safety
    return new Promise(function (resolve, reject) {
      try {
        var ctx = _ctxOnCanvas();
        if (template === 'contract-overage') {
          _drawHeader(ctx, data.vendor + ' overcharged', '$' + Number(data.totalOvercharge || 0).toFixed(2), RUST);
          ctx.fillStyle = INK;
          ctx.font = '500 42px Georgia, serif';
          ctx.fillText(String(data.lineCount || 0) + ' line' + (data.lineCount === 1 ? '' : 's') + ' over contract this week', 64, 480);
          var items = _redactedLabels(data.items || [], redact).slice(0, 6);
          ctx.font = '400 30px -apple-system, system-ui, sans-serif';
          var y = 580;
          items.forEach(function (it) {
            ctx.fillStyle = INK_SOFT;
            ctx.fillText('• ' + it._label, 80, y);
            ctx.fillStyle = RUST;
            var amt = '+$' + Number(it.overcharge || 0).toFixed(2);
            ctx.fillText(amt, WIDTH - 64 - ctx.measureText(amt).width, y);
            y += 56;
          });
          _drawFooter(ctx);
        } else if (template === 'vendor-switch') {
          _drawHeader(ctx, 'Switching ' + (data.from || '') + ' → ' + (data.to || ''), '$' + Number(data.monthlyDelta || 0).toFixed(0) + '/mo', TEAL);
          ctx.fillStyle = INK;
          ctx.font = '500 38px Georgia, serif';
          _wrapText(ctx, 'Across ' + (data.skuCount || 0) + ' SKUs in your purchase history. Cross-vendor median per ' + (data.unit || 'unit') + '.', 64, 460, WIDTH - 128, 50);
          _drawFooter(ctx);
        } else if (template === 'supplier-health') {
          _drawHeader(ctx, (data.vendor || '') + ' supplier health', String(data.score || 0) + '/100', data.score < 60 ? RUST : TEAL);
          ctx.fillStyle = INK_SOFT;
          ctx.font = '400 30px -apple-system, system-ui, sans-serif';
          var stats = data.stats || {};
          ctx.fillText('Backorder ' + (stats.backorderRate || 0) + '%', 80, 520);
          ctx.fillText('Price CV ' + (stats.priceCV || 0) + '%', 80, 580);
          ctx.fillText(String(stats.invoicesSeen || 0) + ' invoices observed', 80, 640);
          _drawFooter(ctx);
        } else {
          reject(new Error('unknown template'));
          return;
        }
        // Convert canvas → blob.
        if (ctx.canvas.convertToBlob) {
          ctx.canvas.convertToBlob({ type: 'image/png' }).then(resolve).catch(reject);
        } else {
          ctx.canvas.toBlob(function (blob) {
            blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'));
          }, 'image/png');
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  function share(template, data, opts) {
    return compose(template, data, opts).then(function (blob) {
      var fname = 'muntin-' + template + '-' + Date.now() + '.png';
      var file = new File([blob], fname, { type: 'image/png' });
      // Try Web Share API first (mobile-native).
      if (root.navigator && root.navigator.canShare && root.navigator.canShare({ files: [file] })) {
        return root.navigator.share({ files: [file], title: 'Muntin Invoice Decoder' });
      }
      // Fallback: trigger download.
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = fname;
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { a.remove(); URL.revokeObjectURL(url); } catch (_) {} }, 200);
      return Promise.resolve();
    }).then(function () {
      if (root.plausible) {
        try { root.plausible('Invoice Decoder Insight Card Shared', { props: { template: template } }); } catch (_) {}
      }
    });
  }

  var api = { compose: compose, share: share };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_INSIGHT_CARD = api;
})(typeof window !== 'undefined' ? window : null);
