/**
 * Open Hours — Storefront Sign + Open Hours Card renderer.
 *
 * Two distinct outputs, both same-origin Canvas 2D, both via toBlob().
 *
 *   Storefront Sign — 1200×1800 (letter portrait at ~150 DPI).
 *   The signature deliverable. The owner prints, trims, tapes inside
 *   the door, OR slots into an A-frame board, OR posts to Instagram
 *   before holiday closures. No watermark; the URL is a discreet
 *   footer line so a designer can find the source.
 *
 *   Open Hours Card — 1200×1500. Companion shareable. Bundles the
 *   weekly grid, upcoming closures, JSON-LD code block, and cross-
 *   platform paste blocks into one image — used when the owner is
 *   forwarding the analysis to a partner or developer instead of
 *   printing for the door.
 *
 * Privacy invariants (mirrors brand-suite/pane-render.js,
 * menu-engineering/card-render.js, menu-copy/card-render.js):
 *   - Pure rendering. No fetch, no storage, no DOM mutation outside
 *     the offscreen canvas this module creates.
 *   - Output via canvas.toBlob() so bytes stay same-origin.
 */

(function(){
  // ------------------------------------------------------------
  // Geometry
  // ------------------------------------------------------------
  var SIGN_W = 1200;
  var SIGN_H = 1800;
  var CARD_W = 1200;
  var CARD_H = 1500;

  var INK    = '#14161A';
  var CREAM  = '#FAF7F2';
  var CREAM2 = '#F2EEE5';
  var STONE  = '#5A5752';
  var TEAL   = '#1F4E5B';
  var LINE   = '#E5E0D8';

  var FONT_DISPLAY = '"Fraunces", "Times New Roman", serif';
  var FONT_BODY    = '"Inter", -apple-system, "Segoe UI", sans-serif';

  // ------------------------------------------------------------
  // Helpers (shared with the existing card-render modules in spirit)
  // ------------------------------------------------------------
  function roundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    var words = String(text || '').split(/\s+/);
    var lines = [];
    var current = '';
    for (var i = 0; i < words.length; i++) {
      var test = current ? current + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = words[i];
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function fmtHolidayShort(iso, locale) {
    if (!iso) return '';
    var p = String(iso).split('-');
    if (p.length !== 3) return iso;
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    return d.toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US',
      { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  // ------------------------------------------------------------
  // Storefront Sign — vertical layout, large legible type
  // ------------------------------------------------------------
  function renderStorefrontSign(opts) {
    opts = opts || {};
    var summary = opts.summary || { week: {}, name: '', city: '' };
    var closures = opts.closures || [];
    var strings = opts.strings || DEFAULT_STRINGS_EN;
    var locale = opts.locale || 'en';
    var formatTime = opts.formatTime || function(t){ return t || ''; };

    var canvas = document.createElement('canvas');
    canvas.width = SIGN_W;
    canvas.height = SIGN_H;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, SIGN_W, SIGN_H);

    // Outer hairline frame for printed visual containment.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, SIGN_W - 80, SIGN_H - 80);

    // Restaurant name (huge, display)
    var name = summary.name || strings.placeholderName;
    ctx.fillStyle = INK;
    ctx.font = '500 84px ' + FONT_DISPLAY;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';
    var nameLines = wrapText(ctx, name, SIGN_W - 200);
    var ny = 160;
    nameLines.slice(0, 2).forEach(function(l, i){
      ctx.fillText(l, SIGN_W / 2, ny + i * 92);
    });

    // Eyebrow under the name
    ctx.fillStyle = STONE;
    ctx.font = '600 18px ' + FONT_BODY;
    ctx.textBaseline = 'alphabetic';
    var eyebrow = strings.signEyebrow.toUpperCase();
    // Letterspacing trick — draw chars with a fixed gap.
    ctx.save();
    ctx.translate(0, 0);
    drawTrackedText(ctx, eyebrow, SIGN_W / 2, ny + nameLines.length * 92 + 30, 4);
    ctx.restore();

    // "Open hours" heading
    var weekY = 380;
    ctx.fillStyle = INK;
    ctx.font = '500 36px ' + FONT_DISPLAY;
    ctx.textAlign = 'left';
    ctx.fillText(strings.signWeeklyHeader, 100, weekY);

    // A horizontal rule under the heading.
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, weekY + 14);
    ctx.lineTo(SIGN_W - 100, weekY + 14);
    ctx.stroke();

    // Per-day rows. 7 days × 60 px = 420; comfortable.
    var rowH = 64;
    var rowY = weekY + 60;
    var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var DAY_FULL_LOCAL = locale === 'es'
      ? ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    DAYS.forEach(function(d, idx){
      var y = rowY + idx * rowH;
      // Day name
      ctx.fillStyle = INK;
      ctx.font = '500 28px ' + FONT_DISPLAY;
      ctx.textAlign = 'left';
      ctx.fillText(capitalize(DAY_FULL_LOCAL[idx]), 110, y);
      // Hours (right-aligned)
      var services = (summary.week && summary.week[d]) || [];
      var label;
      if (!services.length) {
        label = strings.signClosed;
        ctx.fillStyle = STONE;
      } else {
        label = services.map(function(s){
          return formatTime(s.opens, locale) + ' – ' + formatTime(s.closes, locale);
        }).join('  ·  ');
        ctx.fillStyle = INK;
      }
      ctx.font = '500 26px ' + FONT_BODY;
      ctx.textAlign = 'right';
      ctx.fillText(label, SIGN_W - 110, y);
      // Subtle divider between rows
      if (idx < DAYS.length - 1) {
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(110, y + 22);
        ctx.lineTo(SIGN_W - 110, y + 22);
        ctx.stroke();
      }
    });

    // Closures — show up to 4 upcoming.
    var closuresY = rowY + 7 * rowH + 50;
    var upcoming = closures.slice(0, 4);
    if (upcoming.length) {
      ctx.fillStyle = INK;
      ctx.font = '500 28px ' + FONT_DISPLAY;
      ctx.textAlign = 'left';
      ctx.fillText(strings.signClosuresHeader, 100, closuresY);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, closuresY + 14);
      ctx.lineTo(SIGN_W - 100, closuresY + 14);
      ctx.stroke();
      var cy = closuresY + 56;
      upcoming.forEach(function(c, i){
        ctx.fillStyle = INK;
        ctx.font = '500 22px ' + FONT_BODY;
        ctx.textAlign = 'left';
        var label = fmtHolidayShort(c.date, locale) + '  —  ' + (c.name || strings.signClosed);
        ctx.fillText(label, 110, cy + i * 38);
      });
    }

    // Footer: "Always-current hours at [URL]" + the unified Muntin
    // credit. The credit is centered, tracked, recessive — calm enough
    // to read like a maker's stamp on the inside cover of a book.
    ctx.fillStyle = STONE;
    ctx.font = '500 16px ' + FONT_BODY;
    ctx.textAlign = 'center';
    ctx.fillText(strings.signFooterPrefix + ' ' + (summary.city || ''), SIGN_W / 2, SIGN_H - 96);
    ctx.fillStyle = 'rgba(20,22,26,0.6)';
    ctx.font = '500 12px ' + FONT_BODY;
    drawTrackedText(ctx, (strings.signFooterCredit || '').toUpperCase(), SIGN_W / 2, SIGN_H - 64, 3);

    return canvas;
  }

  function drawTrackedText(ctx, text, cx, y, tracking) {
    // Hand-rolled letter-spacing for the eyebrow + footer credit.
    // Ample tracking turns the tiny line into a typographic accent.
    if (!text) return;
    ctx.textAlign = 'left';
    var chars = text.split('');
    var widths = chars.map(function(c){ return ctx.measureText(c).width + tracking; });
    var total = widths.reduce(function(a, b){ return a + b; }, 0) - tracking;
    var x = cx - total / 2;
    chars.forEach(function(c, i){
      ctx.fillText(c, x, y);
      x += widths[i];
    });
  }
  function capitalize(s) {
    return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
  }

  // ------------------------------------------------------------
  // Open Hours Card — companion shareable image
  //   header (120) + body (1140) + footer (60)
  //   body split:
  //     top-left  (560×560)  — weekly grid
  //     top-right (560×560)  — upcoming closures
  //     bottom-left (560×580) — JSON-LD code block
  //     bottom-right (560×580) — cross-platform copy blocks
  // ------------------------------------------------------------
  function renderOpenHoursCard(opts) {
    opts = opts || {};
    var summary = opts.summary || { week: {}, name: '', city: '' };
    var closures = opts.closures || [];
    var jsonLd = opts.jsonLd || '';
    var googleCopy = opts.googleCopy || '';
    var strings = opts.strings || DEFAULT_STRINGS_EN;
    var locale = opts.locale || 'en';
    var formatTime = opts.formatTime || function(t){ return t || ''; };

    var canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = CREAM2;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Header
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, CARD_W, 120);
    ctx.fillStyle = CREAM;
    ctx.font = '600 30px ' + FONT_DISPLAY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardTitle, 48, 50);
    ctx.fillStyle = 'rgba(250,247,242,0.72)';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.fillText(summary.name || '—', 48, 86);
    ctx.fillStyle = 'rgba(250,247,242,0.72)';
    ctx.textAlign = 'right';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.fillText(strings.date, CARD_W - 48, 86);
    ctx.fillStyle = CREAM;
    ctx.font = '500 13px ' + FONT_BODY;
    ctx.fillText(strings.brand, CARD_W - 48, 50);

    // Body — 4 panels
    var pad = 40;
    var panelW = (CARD_W - pad * 3) / 2;
    var topPanelH = 540;
    var bottomPanelH = 540;
    var topY = 120 + 30;
    var bottomY = topY + topPanelH + 20;

    // Top-left — weekly grid
    drawCardPanel(ctx, pad, topY, panelW, topPanelH);
    drawWeekPanel(ctx, summary, pad + 24, topY + 24, panelW - 48, topPanelH - 48, strings, locale, formatTime);

    // Top-right — closures
    drawCardPanel(ctx, pad * 2 + panelW, topY, panelW, topPanelH);
    drawClosuresPanel(ctx, closures, pad * 2 + panelW + 24, topY + 24, panelW - 48, topPanelH - 48, strings, locale);

    // Bottom-left — JSON-LD
    drawCardPanel(ctx, pad, bottomY, panelW, bottomPanelH, INK);
    drawCodePanel(ctx, jsonLd, pad + 18, bottomY + 24, panelW - 36, bottomPanelH - 48, strings.cardJsonLdLabel);

    // Bottom-right — Google copy
    drawCardPanel(ctx, pad * 2 + panelW, bottomY, panelW, bottomPanelH);
    drawGooglePanel(ctx, googleCopy, pad * 2 + panelW + 24, bottomY + 24, panelW - 48, bottomPanelH - 48, strings.cardGoogleLabel);

    // Unified footer treatment across all five Cards: ink ground,
    // single recessive cream-on-ink line at 60% opacity. 48 px keep-out
    // from each edge.
    ctx.fillStyle = INK;
    ctx.fillRect(0, CARD_H - 60, CARD_W, 60);
    ctx.fillStyle = 'rgba(250,247,242,0.6)';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardFooterLeft, 48, CARD_H - 30);
    ctx.textAlign = 'right';
    ctx.fillText(strings.cardFooterRight, CARD_W - 48, CARD_H - 30);

    return canvas;
  }

  function drawCardPanel(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill || '#FFFFFF';
    roundRect(ctx, x, y, w, h, 8); ctx.fill();
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 8); ctx.stroke();
  }

  function drawWeekPanel(ctx, summary, x, y, w, h, strings, locale, formatTime) {
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardWeekLabel, x, y);
    var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var DAY_FULL_LOCAL = locale === 'es'
      ? ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
      : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var rowH = (h - 36) / 7;
    var ry = y + 36;
    DAYS.forEach(function(d, idx){
      var yy = ry + idx * rowH;
      ctx.fillStyle = INK;
      ctx.font = '500 14px ' + FONT_BODY;
      ctx.textAlign = 'left';
      ctx.fillText(capitalize(DAY_FULL_LOCAL[idx]), x, yy);
      var services = (summary.week && summary.week[d]) || [];
      var label = !services.length ? strings.signClosed
        : services.map(function(s){ return formatTime(s.opens, locale) + ' – ' + formatTime(s.closes, locale); }).join(' · ');
      ctx.fillStyle = services.length ? INK : STONE;
      ctx.font = '500 13px ' + FONT_BODY;
      ctx.textAlign = 'right';
      ctx.fillText(label, x + w, yy);
    });
  }

  function drawClosuresPanel(ctx, closures, x, y, w, h, strings, locale) {
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardClosuresLabel, x, y);
    var list = (closures || []).slice(0, 12);
    if (!list.length) {
      ctx.fillStyle = STONE;
      ctx.font = 'italic 13px ' + FONT_BODY;
      ctx.fillText(strings.cardClosuresEmpty, x, y + 36);
      return;
    }
    list.forEach(function(c, i){
      var yy = y + 36 + i * 30;
      ctx.fillStyle = INK;
      ctx.font = '500 13px ' + FONT_BODY;
      ctx.textAlign = 'left';
      ctx.fillText(fmtHolidayShort(c.date, locale), x, yy);
      ctx.fillStyle = STONE;
      ctx.font = '400 13px ' + FONT_BODY;
      ctx.fillText(c.name || '', x + 90, yy);
    });
  }

  function drawCodePanel(ctx, code, x, y, w, h, label) {
    ctx.fillStyle = CREAM;
    ctx.font = '600 11px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(String(label || '').toUpperCase(), x, y);
    var lines = String(code || '').split('\n').slice(0, 22);
    ctx.fillStyle = '#A8DCE0';
    ctx.font = '400 10px ui-monospace, SFMono-Regular, Consolas, monospace';
    lines.forEach(function(line, i){
      // Truncate long lines.
      var l = line.length > 78 ? line.slice(0, 76) + '…' : line;
      ctx.fillText(l, x, y + 24 + i * 14);
    });
  }

  function drawGooglePanel(ctx, copy, x, y, w, h, label) {
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y);
    var lines = String(copy || '').split('\n').slice(0, 8);
    ctx.fillStyle = INK;
    ctx.font = '400 12.5px ui-monospace, SFMono-Regular, Consolas, monospace';
    lines.forEach(function(line, i){
      ctx.fillText(line, x, y + 36 + i * 22);
    });
  }

  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------
  function canvasToPngBlob(canvas) {
    return new Promise(function(resolve, reject){
      try {
        canvas.toBlob(function(blob){
          if (blob) resolve(blob); else reject(new Error('toBlob-null'));
        }, 'image/png');
      } catch (e) { reject(e); }
    });
  }

  // Resolve when the page's web fonts (Fraunces, Inter) are ready, so
  // the Sign / Card paint with their proper display face. No-op in
  // environments without document.fonts (jsdom, older browsers).
  function awaitFonts() {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.ready) {
      return Promise.resolve();
    }
    return document.fonts.ready;
  }

  // ------------------------------------------------------------
  // Default copy strings
  // ------------------------------------------------------------
  var DEFAULT_STRINGS_EN = {
    placeholderName: 'Your Restaurant',
    signEyebrow: 'Open Hours',
    signWeeklyHeader: 'Weekly hours',
    signClosed: 'Closed',
    signClosuresHeader: 'Upcoming closures',
    signFooterPrefix: 'Always-current hours at',
    signFooterCredit: 'Generated by Muntin · Open Hours · muntin.digital',
    cardTitle: 'Open Hours',
    cardWeekLabel: 'Weekly schedule',
    cardClosuresLabel: 'Upcoming closures',
    cardClosuresEmpty: 'No closures selected.',
    cardJsonLdLabel: 'For your website (JSON-LD)',
    cardGoogleLabel: 'For Google Business Profile',
    date: new Date().toISOString().slice(0, 10),
    brand: 'Muntin Digital',
    cardFooterLeft: 'Generated by Muntin · Open Hours · muntin.digital',
    cardFooterRight: new Date().toISOString().slice(0, 10)
  };

  var DEFAULT_STRINGS_ES = {
    placeholderName: 'Tu Restaurante',
    signEyebrow: 'Horario Abierto',
    signWeeklyHeader: 'Horario semanal',
    signClosed: 'Cerrado',
    signClosuresHeader: 'Próximos cierres',
    signFooterPrefix: 'Horario actualizado en',
    signFooterCredit: 'Generado por Muntin · Horario Abierto · muntin.digital',
    cardTitle: 'Horario Abierto',
    cardWeekLabel: 'Horario semanal',
    cardClosuresLabel: 'Próximos cierres',
    cardClosuresEmpty: 'Sin cierres seleccionados.',
    cardJsonLdLabel: 'Para tu sitio web (JSON-LD)',
    cardGoogleLabel: 'Para Google Business Profile',
    date: new Date().toISOString().slice(0, 10),
    brand: 'Muntin Digital',
    cardFooterLeft: 'Generado por Muntin · Horario Abierto · muntin.digital',
    cardFooterRight: new Date().toISOString().slice(0, 10)
  };

  var api = {
    renderStorefrontSign: renderStorefrontSign,
    renderOpenHoursCard:  renderOpenHoursCard,
    canvasToPngBlob:      canvasToPngBlob,
    awaitFonts:           awaitFonts,
    DEFAULT_STRINGS_EN:   DEFAULT_STRINGS_EN,
    DEFAULT_STRINGS_ES:   DEFAULT_STRINGS_ES,
    SIGN_W: SIGN_W, SIGN_H: SIGN_H,
    CARD_W: CARD_W, CARD_H: CARD_H
  };

  if (typeof window !== 'undefined') window.OHSign = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
