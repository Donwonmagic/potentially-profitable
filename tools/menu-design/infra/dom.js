/**
 * Menu Design Suite — Shared DOM + image helpers (W18 extraction).
 *
 * owns:    escHtml, downloadBlob, downscaleImage
 * exports: MD_DOM on window; module.exports for tests
 * deps:    none (DOM-dependent at runtime; helpers degrade silently
 *          in Node test contexts via typeof guards)
 * why:     These helpers were inlined in menu-design.js and shared
 *          by the templates loader, the export buttons, and the
 *          photo / hero pickers. Centralizing them lets the future
 *          tests/menu-design/ fixtures reach in.
 */
(function (root) {
  'use strict';

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Trigger a browser download from a string Blob. No-ops in Node.
  function downloadBlob(content, filename, mime) {
    if (typeof document === 'undefined') return;
    var blob = new Blob([content], { type: mime || 'application/octet-stream' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(a.href);
    }, 4000);
  }

  // Downscale an image File to maxDim via canvas; encodes as JPEG
  // (or PNG when source is PNG to preserve transparency). Invokes
  // cb(dataUrl, w, h); cb(null) on failure.
  function downscaleImage(file, maxDim, quality, cb) {
    if (!file || !cb) return cb && cb(null);
    if (typeof FileReader === 'undefined') return cb(null);
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var ratio = img.naturalWidth / img.naturalHeight;
        var tw, th;
        if (img.naturalWidth <= maxDim && img.naturalHeight <= maxDim) {
          tw = img.naturalWidth; th = img.naturalHeight;
        } else if (ratio >= 1) {
          tw = maxDim; th = Math.round(maxDim / ratio);
        } else {
          th = maxDim; tw = Math.round(maxDim * ratio);
        }
        var canvas = document.createElement('canvas');
        canvas.width = tw; canvas.height = th;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, tw, th);
        try {
          var mime = (file.type === 'image/png') ? 'image/png' : 'image/jpeg';
          var url = canvas.toDataURL(mime, quality || 0.82);
          cb(url, tw, th);
        } catch (_) { cb(null); }
      };
      img.onerror = function () { cb(null); };
      img.src = String(reader.result);
    };
    reader.onerror = function () { cb(null); };
    reader.readAsDataURL(file);
  }

  // Detect whether the operator's preference is reduced motion.
  // Used by the celebration overlay + encouragement toast gating.
  function reducedMotion() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }

  // Wave studio-quality (WCAG 2.2 AA) — screen-reader announce helper.
  // Writes a short message into a polite live region so AT users hear
  // confirmation of operations that happen visually without focus
  // shift (dish add/remove, undo, redo, draft saved, theme change).
  // Looks up the region by id; lazy-creates a hidden one if missing
  // (defensive — host page should declare <div id="mdSrAnnounce"
  // class="visually-hidden" aria-live="polite" aria-atomic="true">).
  function announce(msg) {
    if (typeof document === 'undefined') return;
    if (!msg) return;
    var el = document.getElementById('mdSrAnnounce');
    if (!el) {
      el = document.createElement('div');
      el.id = 'mdSrAnnounce';
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      el.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';
      document.body.appendChild(el);
    }
    // Toggle pattern: clear then set so the same message announces
    // again if fired in quick succession (some screen readers dedupe).
    el.textContent = '';
    setTimeout(function () { el.textContent = String(msg); }, 50);
  }

  var api = {
    escHtml:        escHtml,
    downloadBlob:   downloadBlob,
    downscaleImage: downscaleImage,
    reducedMotion:  reducedMotion,
    announce:       announce
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_DOM = api;
})(typeof window !== 'undefined' ? window : null);
