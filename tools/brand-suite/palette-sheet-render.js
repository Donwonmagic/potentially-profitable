/**
 * Brand Suite — Palette Sheet renderer.
 *
 * Composes a 1200×1500 PNG built to the §3a six-dimension first-
 * impression bar that locks the prior six Cards (Pane, Menu Card,
 * Copy Card, Storefront Sign, Plate Card, Photo Brief, Brand Photo
 * Card). The Palette Sheet is the new "colours on paper" deliverable
 * — a focused printable showing just the palette, the contrast grid,
 * and the naming convention. Designed for the kitchen wall, the
 * printer hand-off, and the designer brief.
 *
 * Geometry:
 *   header  0    .. 160   (160 px, ink ground) — name + harmony chip
 *   region A 184  .. 760   (576 px, cream)      — five colour chips
 *   region B 784  .. 1184  (400 px, cream)      — contrast grid matrix
 *   region C 1208 .. 1440  (232 px, cream)      — harmony + naming
 *   footer  1440 .. 1500  (60 px, ink ground)  — Muntin credit
 *
 * Privacy invariants (mirrors the prior six card-render modules):
 *   - Pure rendering. No fetch, no storage, no DOM mutation outside
 *     the offscreen canvas this module creates.
 *   - Output via canvas.toBlob() so bytes stay same-origin.
 */

(function(){
  'use strict';

  // ------------------------------------------------------------
  // Geometry & palette
  // ------------------------------------------------------------
  var W         = 1200;
  var H         = 1500;
  var H_HEADER  = 160;
  var H_FOOTER  = 60;
  var OUTER_PAD = 60;

  var INK    = '#14161A';
  var CREAM  = '#FAF7F2';
  var CREAM2 = '#F2EEE5';
  var STONE  = '#5A5752';
  var TEAL   = '#1F4E5B';
  var LINE   = '#E5E0D8';

  var FONT_DISPLAY = '"Fraunces", "Times New Roman", serif';
  var FONT_BODY    = '"Inter", -apple-system, "Segoe UI", sans-serif';
  var FONT_MONO    = 'ui-monospace, "Berkeley Mono", "JetBrains Mono", "IBM Plex Mono", Menlo, Consolas, monospace';

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  function clip(ctx, text, maxWidth) {
    var s = String(text == null ? '' : text);
    if (ctx.measureText(s).width <= maxWidth) return s;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
    return s + '…';
  }
  function wrapText(ctx, text, maxWidth){
    var words = String(text || '').split(/\s+/);
    var lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = words[i]; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function hexToRgbLocal(hex){
    if (typeof window !== 'undefined' && window.BS && window.BS.hexToRgb) return window.BS.hexToRgb(hex);
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function(c){ return c + c; }).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
  }
  function contrastRatioLocal(a, b){
    if (typeof window !== 'undefined' && window.BS && window.BS.contrastRatio) return window.BS.contrastRatio(a, b);
    return 1;
  }
  function gradeContrastLocal(r){
    if (typeof window !== 'undefined' && window.BS && window.BS.gradeContrast) return window.BS.gradeContrast(r);
    if (r >= 7) return 'AAA';
    if (r >= 4.5) return 'AA';
    if (r >= 3) return 'AA-large';
    return 'fail';
  }
  function rgbToCmykLocal(r, g, b){
    if (typeof window !== 'undefined' && window.BS && window.BS.rgbToCmyk) return window.BS.rgbToCmyk(r, g, b);
    return { c: 0, m: 0, y: 0, k: 0 };
  }

  // Stubs filled in by subsequent sprints.
  function drawHeader(ctx, opts, strings) {
    var pad = OUTER_PAD;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H_HEADER);

    // Restaurant name (or generic title)
    var name = String(opts.restaurant || strings.title);
    ctx.fillStyle = CREAM;
    ctx.font = '500 36px ' + FONT_DISPLAY;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    var nameMaxW = (W * 0.62) - pad - 8;
    ctx.fillText(clip(ctx, name, nameMaxW), pad, 64);

    // Eyebrow line — slate-style: title + date
    var eyebrow = strings.title + ' · ' + strings.date;
    ctx.font = '500 13px ' + FONT_MONO;
    ctx.fillStyle = 'rgba(250,247,242,0.7)';
    ctx.fillText(clip(ctx, eyebrow, nameMaxW), pad, 96);

    // Subtitle caption
    ctx.font = '500 12px ' + FONT_BODY;
    ctx.fillStyle = 'rgba(250,247,242,0.6)';
    ctx.fillText(strings.eyebrow, pad, 122);

    // Right-side: harmony name + count chip (if provided)
    var rightStart = W - pad;
    if (opts.harmonyLabel) {
      var chipText = opts.harmonyLabel + (opts.count ? ' · ' + opts.count + ' colours' : '');
      ctx.fillStyle = TEAL;
      ctx.font = '700 11px ' + FONT_BODY;
      var chipW = ctx.measureText(chipText.toUpperCase()).width + 22;
      var chipH = 24;
      var chipX = rightStart - chipW;
      var chipY = 50;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(chipX, chipY, chipW, chipH, 999); ctx.fill(); }
      else ctx.fillRect(chipX, chipY, chipW, chipH);
      ctx.fillStyle = CREAM;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(chipText.toUpperCase(), chipX + chipW / 2, chipY + chipH / 2 + 1);
    }

    // Hairline between the header and body.
    ctx.strokeStyle = 'rgba(250,247,242,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H_HEADER - 0.5);
    ctx.lineTo(W, H_HEADER - 0.5);
    ctx.stroke();
  }
  function drawColourChips(ctx, opts, strings) {
    var palette = (opts.palette || []).slice(0, 5);
    if (!palette.length) return;
    var pad = OUTER_PAD;
    var topY = H_HEADER + 24;
    var regionH = 576;
    var innerW = W - pad * 2;
    var roleNames = strings.roleNames || ['Primary', 'Secondary', 'Accent 1', 'Accent 2', 'Neutral'];

    // Title
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.chipsTitle, pad, topY);

    // Five chips laid out evenly across the row.
    var chipsTop = topY + 32;
    var chipsH   = regionH - 40;
    var gap      = 14;
    var chipW    = (innerW - gap * (palette.length - 1)) / palette.length;
    var swatchH  = chipsH - 138;  // leave room for labels below

    palette.forEach(function(entry, i){
      var x = pad + i * (chipW + gap);
      // Swatch
      ctx.fillStyle = entry.hex;
      ctx.fillRect(x, chipsTop, chipW, swatchH);
      // Hairline border (so a near-cream chip has visible edge)
      ctx.strokeStyle = 'rgba(20,22,26,0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, chipsTop + 0.5, chipW - 1, swatchH - 1);

      // Role label
      var labelY = chipsTop + swatchH + 14;
      ctx.fillStyle = STONE;
      ctx.font = '700 10px ' + FONT_BODY;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText((roleNames[i] || 'Color ' + (i + 1)).toUpperCase(), x, labelY);

      // Hex (large, mono)
      ctx.fillStyle = INK;
      ctx.font = '600 18px ' + FONT_MONO;
      ctx.fillText(String(entry.hex || '').toUpperCase(), x, labelY + 18);

      // RGB triplet
      var rgb = hexToRgbLocal(entry.hex);
      var rgbText = rgb ? 'RGB ' + rgb.r + '·' + rgb.g + '·' + rgb.b : 'RGB —';
      ctx.fillStyle = STONE;
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillText(rgbText, x, labelY + 46);

      // CMYK approximation
      var cmyk = rgb ? rgbToCmykLocal(rgb.r, rgb.g, rgb.b) : { c: 0, m: 0, y: 0, k: 0 };
      var cmykText = 'CMYK ' + cmyk.c + '·' + cmyk.m + '·' + cmyk.y + '·' + cmyk.k;
      ctx.fillText(cmykText, x, labelY + 64);

      // Token name (CSS variable hint)
      var tokenVar = entry.roleVar || ('--brand-color-' + (i + 1));
      ctx.fillStyle = TEAL;
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillText(clip(ctx, tokenVar, chipW - 4), x, labelY + 86);
    });
  }
  function drawContrastGrid(ctx, opts, strings) {
    var palette = (opts.palette || []).slice(0, 5);
    if (!palette.length) return;
    var pad   = OUTER_PAD;
    var topY  = H_HEADER + 24 + 576 + 24;  // below Region A
    var regionH = 400;
    var innerW = W - pad * 2;

    // Title + dek
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.contrastTitle, pad, topY);
    ctx.fillStyle = STONE;
    ctx.font = '500 12px ' + FONT_BODY;
    ctx.fillText(strings.contrastDek, pad, topY + 26);

    // Grid: (n+1) × (n+1) cells, top-left empty, header row + col with
    // colour swatches + hex, body cells with contrast ratio.
    var n = palette.length;
    var gridTop = topY + 60;
    var headerSize = 52;
    var availW = innerW - headerSize;
    var availH = regionH - 60 - headerSize;
    var cellW = availW / n;
    var cellH = availH / n;

    // Header row (top) — colour swatches above each column
    palette.forEach(function(entry, c){
      var x = pad + headerSize + c * cellW;
      ctx.fillStyle = entry.hex;
      ctx.fillRect(x + 4, gridTop, cellW - 8, headerSize - 8);
      ctx.strokeStyle = 'rgba(20,22,26,0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 4.5, gridTop + 0.5, cellW - 9, headerSize - 9);
      // Hex label below the swatch (inside the header row)
      ctx.fillStyle = STONE;
      ctx.font = '500 10px ' + FONT_MONO;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      ctx.fillText(String(entry.hex || '').toUpperCase(), x + cellW / 2, gridTop + headerSize - 14);
    });

    // Header col (left) — colour swatches beside each row
    palette.forEach(function(entry, r){
      var y = gridTop + headerSize + r * cellH;
      ctx.fillStyle = entry.hex;
      ctx.fillRect(pad, y + 4, headerSize - 8, cellH - 8);
      ctx.strokeStyle = 'rgba(20,22,26,0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(pad + 0.5, y + 4.5, headerSize - 9, cellH - 9);
    });

    // Body cells — contrast ratio for (row, col) pair, coloured by grade.
    var gradeBg = { 'AAA': '#E6F4EC', 'AA': '#E9F0EF', 'AA-large': '#FAF4E7', 'fail': '#FAEFE7' };
    var gradeFg = { 'AAA': '#1F9D55', 'AA': '#1F4E5B', 'AA-large': '#956A1A', 'fail': '#B8541A' };

    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var x = pad + headerSize + c * cellW;
        var y = gridTop + headerSize + r * cellH;
        if (r === c) {
          // Diagonal — same colour pair, no meaningful ratio
          ctx.fillStyle = CREAM2;
          ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
          ctx.fillStyle = STONE;
          ctx.font = '400 11px ' + FONT_BODY;
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          ctx.fillText('—', x + cellW / 2, y + cellH / 2);
          continue;
        }
        var rowHex = palette[r].hex;
        var colHex = palette[c].hex;
        var ratio = contrastRatioLocal(rowHex, colHex);
        var grade = gradeContrastLocal(ratio);
        ctx.fillStyle = gradeBg[grade] || CREAM2;
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
        // Ratio (large)
        ctx.fillStyle = gradeFg[grade] || INK;
        ctx.font = '600 13px ' + FONT_MONO;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(ratio.toFixed(1), x + cellW / 2, y + cellH / 2 - 6);
        // Grade label
        ctx.font = '700 9px ' + FONT_BODY;
        ctx.fillText(grade.toUpperCase(), x + cellW / 2, y + cellH / 2 + 8);
      }
    }
  }
  function drawHarmonyLegend(ctx, opts, strings) {
    var pad   = OUTER_PAD;
    var topY  = H_HEADER + 24 + 576 + 24 + 400 + 24;  // below Region B
    var regionH = (H - H_FOOTER) - topY - 24;
    var innerW = W - pad * 2;
    var halfW  = (innerW - 24) / 2;

    // Two columns: left = harmony summary; right = naming convention.
    // Left column
    ctx.fillStyle = INK;
    ctx.font = '500 16px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.harmonyTitle, pad, topY);

    var harmonyText = opts.harmonyDescription
      || (opts.harmonyLabel ? opts.harmonyLabel + ' palette.' : 'A custom palette.');
    ctx.fillStyle = STONE;
    ctx.font = '400 12.5px ' + FONT_BODY;
    var harmonyLines = wrapText(ctx, harmonyText, halfW);
    harmonyLines.slice(0, 5).forEach(function(line, idx){
      ctx.fillText(line, pad, topY + 24 + idx * 18);
    });

    // Right column — naming convention
    var rightX = pad + halfW + 24;
    ctx.fillStyle = INK;
    ctx.font = '500 16px ' + FONT_DISPLAY;
    ctx.fillText(strings.namingTitle, rightX, topY);

    var palette = (opts.palette || []).slice(0, 5);
    var roleNames = strings.roleNames || ['Primary', 'Secondary', 'Accent 1', 'Accent 2', 'Neutral'];
    palette.forEach(function(entry, i){
      var rowY = topY + 24 + i * 18;
      ctx.fillStyle = STONE;
      ctx.font = '500 11px ' + FONT_BODY;
      ctx.textAlign = 'left';
      ctx.fillText((roleNames[i] || 'Color ' + (i + 1)) + ':', rightX, rowY);
      ctx.fillStyle = INK;
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillText(entry.roleVar || ('--brand-color-' + (i + 1)), rightX + 110, rowY);
    });

    // Naming hint at the bottom of the right column
    var hintY = topY + 24 + Math.max(palette.length, 5) * 18 + 8;
    ctx.fillStyle = STONE;
    ctx.font = 'italic 400 11px ' + FONT_BODY;
    var hintLines = wrapText(ctx, strings.namingHint, halfW);
    hintLines.slice(0, 3).forEach(function(line, idx){
      ctx.fillText(line, rightX, hintY + idx * 14);
    });
  }

  function drawFooter(ctx, strings) {
    ctx.fillStyle = INK;
    ctx.fillRect(0, H - H_FOOTER, W, H_FOOTER);
    ctx.fillStyle = 'rgba(250,247,242,0.6)';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(strings.footerLeft, 48, H - H_FOOTER / 2);
    ctx.textAlign = 'right';
    ctx.fillText(strings.footerRight, W - 48, H - H_FOOTER / 2);
  }

  function renderPaletteSheet(opts) {
    opts = opts || {};
    var strings = opts.strings || DEFAULT_STRINGS_EN;
    var canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = CREAM2;
    ctx.fillRect(0, 0, W, H);
    drawHeader(ctx, opts, strings);
    drawColourChips(ctx, opts, strings);
    drawContrastGrid(ctx, opts, strings);
    drawHarmonyLegend(ctx, opts, strings);
    drawFooter(ctx, strings);
    return canvas;
  }

  function canvasToPngBlob(canvas) {
    return new Promise(function(resolve, reject){
      try {
        canvas.toBlob(function(blob){
          if (blob) resolve(blob); else reject(new Error('toBlob-null'));
        }, 'image/png');
      } catch (e) { reject(e); }
    });
  }
  function awaitFonts() {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.ready) {
      return Promise.resolve();
    }
    return document.fonts.ready;
  }

  var DEFAULT_STRINGS_EN = {
    title:           'Brand palette',
    eyebrow:         'Colours on paper',
    brand:           'Muntin Digital',
    date:            new Date().toISOString().slice(0, 10),
    chipsTitle:      'The five colours',
    contrastTitle:   'Contrast grid · WCAG 2.1',
    contrastDek:     'Each cell shows the contrast ratio of the row colour against the column colour.',
    harmonyTitle:    'About this palette',
    namingTitle:     'Naming convention',
    namingHint:      'Use --brand-* tokens in CSS, brand.* in design tokens, role names in your style guide.',
    roleNames:       ['Primary', 'Secondary', 'Accent 1', 'Accent 2', 'Neutral'],
    cmykLabel:       'CMYK',
    rgbLabel:        'RGB',
    hexLabel:        'HEX',
    footerLeft:      'Generated by Muntin · Brand Suite · muntin.digital',
    footerRight:     new Date().toISOString().slice(0, 10)
  };

  var DEFAULT_STRINGS_ES = {
    title:           'Paleta de marca',
    eyebrow:         'Los colores en papel',
    brand:           'Muntin Digital',
    date:            new Date().toISOString().slice(0, 10),
    chipsTitle:      'Los cinco colores',
    contrastTitle:   'Cuadrícula de contraste · WCAG 2.1',
    contrastDek:     'Cada celda muestra el contraste del color de la fila contra el color de la columna.',
    harmonyTitle:    'Sobre esta paleta',
    namingTitle:     'Convención de nombres',
    namingHint:      'Usa tokens --brand-* en CSS, brand.* en design tokens, nombres de rol en tu guía de estilo.',
    roleNames:       ['Color base', 'Secundario', 'Acento 1', 'Acento 2', 'Neutro'],
    cmykLabel:       'CMYK',
    rgbLabel:        'RGB',
    hexLabel:        'HEX',
    footerLeft:      'Generado por Muntin · Suite de Marca · muntin.digital',
    footerRight:     new Date().toISOString().slice(0, 10)
  };

  var api = {
    renderPaletteSheet:  renderPaletteSheet,
    canvasToPngBlob:     canvasToPngBlob,
    awaitFonts:          awaitFonts,
    DEFAULT_STRINGS_EN:  DEFAULT_STRINGS_EN,
    DEFAULT_STRINGS_ES:  DEFAULT_STRINGS_ES,
    W: W, H: H
  };

  if (typeof window !== 'undefined') window.BSPaletteSheet = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
