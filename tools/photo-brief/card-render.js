/**
 * Photo Brief Builder — Card renderer.
 *
 * Composes two 1200×1500 PNGs, both built to the §3a six-dimension
 * first-impression bar from day one — the same load-bearing rule
 * the five prior Cards already meet.
 *
 *   1. Photo Brief — shoot-day asset. Header (dish + plate-cost
 *      eyebrow analogue, here: shot-count + photographer), three
 *      body regions (surface coverage strip + shot-list table +
 *      math/naming/palette legend), unified Muntin footer at 60%
 *      opacity. The photographer holds it during the shoot.
 *
 *   2. Brand Photo Card — long-tail asset. Brand palette + canonical
 *      aspect ratios + naming convention. Lives on the kitchen wall
 *      like the Plate Card does.
 *
 * Privacy invariants (mirrors brand-suite/pane-render.js,
 * menu-engineering/card-render.js, menu-copy/card-render.js,
 * open-hours/sign-render.js, plate-cost/card-render.js):
 *   - Pure rendering. No fetch, no storage, no DOM mutation outside
 *     the offscreen canvas this module creates.
 *   - Output via canvas.toBlob() so bytes stay same-origin.
 *   - awaitFonts() resolves on document.fonts.ready (no-op under
 *     Node / older browsers).
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
  var BODY_TOP  = H_HEADER;
  var BODY_BOT  = H - H_FOOTER;
  var OUTER_PAD = 60;            // §3a margin-discipline (60 px)

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
  function fmtMoney(n){
    if (!isFinite(n) || n <= 0) return '$0';
    return '$' + Math.round(Number(n)).toLocaleString();
  }
  function ratioLabel(r){
    var presets = [[16/9,'16:9'],[1.91,'1.91:1'],[3/2,'3:2'],[1,'1:1'],[9/16,'9:16'],[4/3,'4:3']];
    for (var i = 0; i < presets.length; i++) {
      if (Math.abs(presets[i][0] - r) < 0.005) return presets[i][1];
    }
    return r.toFixed(2);
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
  function clip(ctx, text, maxWidth){
    var s = String(text == null ? '' : text);
    if (ctx.measureText(s).width <= maxWidth) return s;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
    return s + '…';
  }

  // ------------------------------------------------------------
  // Header band — restaurant name in 36 px Fraunces on the left;
  // photographer + date eyebrow underneath. Right side gets the
  // shot-count chip + brand-palette swatch row (the photographer's
  // colour reference). 60 px keep-out per §3a margin discipline.
  // ------------------------------------------------------------
  function drawBriefHeader(ctx, opts, strings) {
    var isCard  = !!opts._isCard;
    var pad     = OUTER_PAD;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H_HEADER);

    var name = String(opts.restaurant || (isCard ? strings.cardTitle : strings.briefTitle));
    ctx.fillStyle = CREAM;
    ctx.font = '500 36px ' + FONT_DISPLAY;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    var nameMaxW = (W * 0.62) - pad - 8;
    ctx.fillText(clip(ctx, name, nameMaxW), pad, 64);

    // Eyebrow: tool title · photographer · date — in mono so the
    // shoot-day reader scans it like a slate.
    var photog = opts.photographer ? ' · ' + opts.photographer : '';
    var eyebrow = (isCard ? strings.cardTitle : strings.briefTitle) + photog + ' · ' + strings.date;
    ctx.font = '500 13px ' + FONT_MONO;
    ctx.fillStyle = 'rgba(250,247,242,0.7)';
    ctx.fillText(clip(ctx, eyebrow, nameMaxW), pad, 96);

    // Eyebrow caption — the briefer line under the slate-style line.
    ctx.font = '500 12px ' + FONT_BODY;
    ctx.fillStyle = 'rgba(250,247,242,0.6)';
    ctx.fillText(isCard ? strings.cardEyebrow : strings.briefEyebrow, pad, 122);

    // Right side: shot-count chip (Brief only) and brand-palette
    // swatch row (both Cards). The swatches are the photographer's
    // colour key on every page.
    var rightStart = W - pad;
    if (!isCard) {
      var dedup = (opts.summary && opts.summary.dedup) ? opts.summary.dedup.dedup : 0;
      var chipText = String(dedup) + ' source frames';
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

    // Brand palette swatch row — six 28-px squares, leftmost is the
    // outer ink-stroke, the next 5 are the brand's colours. If no
    // palette is provided, the row falls back to the site neutrals.
    var palette = (opts.palette && opts.palette.length) ? opts.palette.slice(0, 5)
                                                         : [TEAL, '#C68A2C', CREAM, INK, STONE];
    var swatchSize = 28;
    var swatchGap  = 6;
    var swatchY    = isCard ? 100 : 88;
    var swatchTotalW = swatchSize * palette.length + swatchGap * (palette.length - 1);
    var swatchX = rightStart - swatchTotalW;
    palette.forEach(function(hex, i){
      ctx.fillStyle = hex;
      ctx.fillRect(swatchX + i * (swatchSize + swatchGap), swatchY, swatchSize, swatchSize);
    });
    if (isCard) {
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillStyle = 'rgba(250,247,242,0.5)';
      ctx.textAlign = 'right';
      ctx.fillText('Brand palette', rightStart, swatchY - 8);
    }

    // Hairline between the header and body.
    ctx.strokeStyle = 'rgba(250,247,242,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H_HEADER - 0.5);
    ctx.lineTo(W, H_HEADER - 0.5);
    ctx.stroke();
  }

  // ------------------------------------------------------------
  // Region A — surface coverage strip. A horizontal row of 80×80
  // tiles, one per ticked destination surface. Each tile shows the
  // 3:2 source frame with the destination's crop outlined.
  // ------------------------------------------------------------
  function drawCoverageStrip(ctx, opts, region) {
    var x0 = region.x, y0 = region.y, w = region.w;
    var pad = 18;

    // Title
    ctx.fillStyle = INK;
    ctx.font = '500 16px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(opts._stringsCoverage || (opts.strings && opts.strings.coverageTitle) || 'Surface coverage',
                 x0, y0);

    var coverage = opts.coverage || [];
    if (!coverage.length) {
      ctx.fillStyle = STONE;
      ctx.font = 'italic 400 12px ' + FONT_BODY;
      ctx.fillText('No surfaces selected.', x0, y0 + 28);
      return;
    }

    // Lay out tiles. Source frame is 3:2 — render as 96×64 source
    // with destination crop overlaid in teal.
    var tileW    = 156;
    var tileH    = 200;
    var tileGap  = 10;
    var tilesPerRow = Math.max(1, Math.floor((w + tileGap) / (tileW + tileGap)));
    var startX = x0;
    var startY = y0 + 26;

    coverage.slice(0, tilesPerRow * 2).forEach(function(c, i){
      var col = i % tilesPerRow;
      var row = Math.floor(i / tilesPerRow);
      var tx = startX + col * (tileW + tileGap);
      var ty = startY + row * (tileH + 18);

      // Tile card
      ctx.fillStyle = '#FFFFFF';
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(tx, ty, tileW, tileH, 6); ctx.fill(); }
      else ctx.fillRect(tx, ty, tileW, tileH);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(tx + 0.5, ty + 0.5, tileW - 1, tileH - 1, 6); ctx.stroke(); }
      else ctx.strokeRect(tx + 0.5, ty + 0.5, tileW - 1, tileH - 1);

      // Source frame outline (cream 3:2, 120×80, centred horizontally)
      var srcW = 120, srcH = 80;
      var srcX = tx + (tileW - srcW) / 2;
      var srcY = ty + 40;
      ctx.fillStyle = CREAM2;
      ctx.fillRect(srcX, srcY, srcW, srcH);
      ctx.strokeStyle = STONE; ctx.lineWidth = 1;
      ctx.strokeRect(srcX + 0.5, srcY + 0.5, srcW - 1, srcH - 1);

      // Destination crop overlay — compute crop rectangle from §2.1.
      var srcRatio = srcW / srcH; // 1.5 = 3:2
      var dstRatio = (c.surface && c.surface.ratio) || 1;
      var cropW, cropH, cropX, cropY;
      if (Math.abs(srcRatio - dstRatio) < 1e-3) {
        cropW = srcW; cropH = srcH; cropX = srcX; cropY = srcY;
      } else if (srcRatio > dstRatio) {
        cropH = srcH;
        cropW = srcH * dstRatio;
        cropX = srcX + (srcW - cropW) / 2;
        cropY = srcY;
      } else {
        cropW = srcW;
        cropH = srcW / dstRatio;
        cropX = srcX;
        cropY = srcY + (srcH - cropH) / 2;
      }
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 2;
      ctx.strokeRect(cropX, cropY, cropW, cropH);

      // Title (surface name)
      ctx.fillStyle = INK;
      ctx.font = '600 13px ' + FONT_BODY;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(clip(ctx, c.surface.label, tileW - pad), tx + pad/2, ty + 12);

      // Ratio + pixels
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillStyle = STONE;
      ctx.fillText(ratioLabel(c.surface.ratio) + ' · ' +
                   c.surface.pixels.w + '×' + c.surface.pixels.h,
                   tx + pad/2, ty + tileH - 22);
    });
  }
  // ------------------------------------------------------------
  // Region B — shot-list table. Numbered rows, fixed columns. The
  // photographer reads this during the shoot like a slate.
  // ------------------------------------------------------------
  function drawShotList(ctx, opts, strings, region) {
    var x0 = region.x, y0 = region.y, w = region.w;
    var pad = 18;

    // Panel ground
    ctx.fillStyle = '#FFFFFF';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x0, y0, w, region.h, 6); ctx.fill(); }
    else ctx.fillRect(x0, y0, w, region.h);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x0 + 0.5, y0 + 0.5, w - 1, region.h - 1, 6); ctx.stroke(); }
    else ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, region.h - 1);

    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.shotListTitle, x0 + pad, y0 + pad);

    // Column geometry: # / Dish / Cat. / Angle / Lighting / Crops to / Neg
    var innerX = x0 + pad;
    var innerW = w - pad * 2;
    var col1 = innerX;                       // # (28)
    var col2 = col1 + 32;                    // Dish (~30%)
    var col3 = col2 + Math.round(innerW * 0.26); // Cat.
    var col4 = col3 + 70;                    // Angle
    var col5 = col4 + 92;                    // Lighting
    var col6 = col5 + 100;                   // Crops to (the rest)
    var col7 = innerX + innerW;              // Neg edge

    // Header row
    var headerY = y0 + 56;
    ctx.fillStyle = STONE;
    ctx.font = '700 10px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.colNum.toUpperCase(),      col1, headerY);
    ctx.fillText(strings.colDish.toUpperCase(),     col2, headerY);
    ctx.fillText(strings.colCat.toUpperCase(),      col3, headerY);
    ctx.fillText(strings.colAngle.toUpperCase(),    col4, headerY);
    ctx.fillText(strings.colLighting.toUpperCase(), col5, headerY);
    ctx.fillText(strings.colCrop.toUpperCase(),     col6, headerY);
    ctx.textAlign = 'right';
    ctx.fillText(strings.colNeg.toUpperCase(),      col7, headerY);

    // Header underline
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(col1, headerY + 18);
    ctx.lineTo(col7, headerY + 18);
    ctx.stroke();

    // Body rows. Each entry is a (dish, row) pair from dedupShotList.
    var rowH = 30;
    var rowsTop = headerY + 30;
    var rowsBottom = y0 + region.h - 24;
    var maxRows = Math.max(0, Math.floor((rowsBottom - rowsTop) / rowH));
    var flat = [];
    var perDish = (opts.summary && opts.summary.dedup && opts.summary.dedup.perDish) || [];
    perDish.forEach(function(d){
      d.rows.forEach(function(r){
        flat.push({ dish: d, row: r });
      });
    });

    var visible = flat.slice(0, maxRows);
    visible.forEach(function(entry, i){
      var ry = rowsTop + i * rowH;
      // Row stripe
      if (i % 2 === 1) {
        ctx.fillStyle = CREAM2;
        ctx.fillRect(col1 - 4, ry - 4, innerW + 8, rowH);
      }

      ctx.fillStyle = INK;
      ctx.textBaseline = 'top';

      // # — tabular mono, prominent
      ctx.font = '700 13px ' + FONT_MONO;
      ctx.textAlign = 'left';
      ctx.fillText(String(i + 1).padStart(2, '0'), col1, ry + 6);

      // Dish — serif italic, clipped
      ctx.font = '400 italic 14px ' + FONT_DISPLAY;
      ctx.fillText(clip(ctx, entry.dish.name || '—', col3 - col2 - 8), col2, ry + 6);

      // Cat. — Inter
      ctx.font = '500 12px ' + FONT_BODY;
      ctx.fillStyle = STONE;
      ctx.fillText(clip(ctx, entry.dish.category || '—', col4 - col3 - 8), col3, ry + 7);

      // Angle / Lighting — mono enums
      ctx.font = '500 12px ' + FONT_MONO;
      ctx.fillStyle = INK;
      ctx.fillText(clip(ctx, entry.row.angle || '—',    col5 - col4 - 8), col4, ry + 7);
      ctx.fillText(clip(ctx, entry.row.lighting || '—', col6 - col5 - 8), col5, ry + 7);

      // Crops to — comma-separated surfaces
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillStyle = TEAL;
      var surfaces = (entry.row.surfaces || []).join(', ');
      ctx.fillText(clip(ctx, surfaces, col7 - col6 - 80), col6, ry + 8);

      // Neg-space (right-aligned)
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillStyle = STONE;
      ctx.textAlign = 'right';
      ctx.fillText(entry.row.negSpace || 'none', col7, ry + 8);
    });

    // Truncation hint if longer than fits
    if (flat.length > maxRows) {
      ctx.fillStyle = STONE;
      ctx.font = 'italic 400 11px ' + FONT_BODY;
      ctx.textAlign = 'left';
      ctx.fillText('+ ' + (flat.length - maxRows) + ' more in the .csv export',
                   col1, rowsTop + maxRows * rowH + 4);
    }
  }

  // ------------------------------------------------------------
  // Region C — math summary + naming convention + palette legend.
  // Three small stacked panels; the math panel gets the largest
  // type so the source-frame count reads as the section's headline.
  // ------------------------------------------------------------
  function drawBriefLegend(ctx, opts, strings, region) {
    var x0 = region.x, y0 = region.y, w = region.w, h = region.h;
    var pad = 14;

    ctx.fillStyle = CREAM2;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 6); ctx.fill(); }
    else ctx.fillRect(x0, y0, w, h);

    var colW = (w - pad * 4) / 3;
    var col1X = x0 + pad;
    var col2X = col1X + colW + pad;
    var col3X = col2X + colW + pad;
    var inY  = y0 + pad;

    // Math panel
    var dedup = (opts.summary && opts.summary.dedup) ? opts.summary.dedup : { naive: 0, dedup: 0 };
    var roi   = (opts.summary && opts.summary.roi)   ? opts.summary.roi   : { totalCost: 0, costPerShot: 0, days: 0 };
    ctx.fillStyle = STONE;
    ctx.font = '700 10px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.legendMath.toUpperCase(), col1X, inY);

    ctx.fillStyle = INK;
    ctx.font = '500 28px ' + FONT_DISPLAY;
    ctx.fillText(String(dedup.dedup), col1X, inY + 18);
    ctx.fillStyle = STONE;
    ctx.font = '500 11px ' + FONT_MONO;
    ctx.fillText('from ' + dedup.naive + ' naive', col1X, inY + 60);
    ctx.font = '500 11px ' + FONT_BODY;
    ctx.fillStyle = INK;
    ctx.fillText(roi.days + ' day' + (roi.days === 1 ? '' : 's') + ' · ' + fmtMoney(roi.totalCost), col1X, inY + 80);
    ctx.fillStyle = STONE;
    ctx.font = '400 11px ' + FONT_BODY;
    var fn = wrapText(ctx, strings.methodFootnote, colW);
    fn.slice(0, 3).forEach(function(line, idx){
      ctx.fillText(line, col1X, inY + 102 + idx * 14);
    });

    // Naming convention panel
    ctx.fillStyle = STONE;
    ctx.font = '700 10px ' + FONT_BODY;
    ctx.fillText(strings.legendNaming.toUpperCase(), col2X, inY);
    ctx.fillStyle = INK;
    ctx.font = '500 12px ' + FONT_MONO;
    ctx.fillText(clip(ctx, strings.namingExample, colW), col2X, inY + 22);
    ctx.fillStyle = STONE;
    ctx.font = '400 11px ' + FONT_BODY;
    var nameNote = 'Hand the photographer this convention so files come back named the way you need.';
    var nn = wrapText(ctx, nameNote, colW);
    nn.slice(0, 4).forEach(function(line, idx){
      ctx.fillText(line, col2X, inY + 48 + idx * 14);
    });

    // Brand palette panel
    ctx.fillStyle = STONE;
    ctx.font = '700 10px ' + FONT_BODY;
    ctx.fillText(strings.legendPalette.toUpperCase(), col3X, inY);
    var palette = (opts.palette && opts.palette.length) ? opts.palette.slice(0, 5)
                                                         : [TEAL, '#C68A2C', CREAM, INK, STONE];
    var swatchSize = 26;
    var swatchGap  = 5;
    palette.forEach(function(hex, i){
      var sx = col3X + i * (swatchSize + swatchGap);
      var sy = inY + 22;
      ctx.fillStyle = hex;
      ctx.fillRect(sx, sy, swatchSize, swatchSize);
      ctx.strokeStyle = 'rgba(20,22,26,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, swatchSize - 1, swatchSize - 1);
    });
    // Hex codes underneath
    ctx.fillStyle = STONE;
    ctx.font = '500 9px ' + FONT_MONO;
    palette.forEach(function(hex, i){
      var sx = col3X + i * (swatchSize + swatchGap);
      ctx.fillText(String(hex).toUpperCase().slice(0, 7), sx, inY + 22 + swatchSize + 4);
    });
  }

  // ------------------------------------------------------------
  // Brand Photo Card body — three regions stacked vertically.
  // Palette top, canonical aspect ratios middle, naming convention
  // bottom. Designed to live on the kitchen wall like the Plate
  // Card — the lasting decisions in writing.
  // ------------------------------------------------------------
  function drawCardBody(ctx, opts, strings) {
    var pad = OUTER_PAD;
    var x0 = pad;
    var y0 = BODY_TOP + 24;
    var w  = W - pad * 2;

    // Section 1 — Brand palette
    ctx.fillStyle = INK;
    ctx.font = '500 22px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardPaletteTitle, x0, y0);

    var palette = (opts.palette && opts.palette.length) ? opts.palette.slice(0, 5)
                                                         : [TEAL, '#C68A2C', CREAM, INK, STONE];
    var roleNames = ['Primary', 'Secondary', 'Accent 1', 'Accent 2', 'Neutral'];
    var chipW = (w - 16 * (palette.length - 1)) / palette.length;
    var chipH = 130;
    palette.forEach(function(hex, i){
      var cx = x0 + i * (chipW + 16);
      var cy = y0 + 36;
      ctx.fillStyle = hex;
      ctx.fillRect(cx, cy, chipW, chipH);
      ctx.strokeStyle = 'rgba(20,22,26,0.10)'; ctx.lineWidth = 1;
      ctx.strokeRect(cx + 0.5, cy + 0.5, chipW - 1, chipH - 1);
      // Role + hex caption
      ctx.fillStyle = STONE;
      ctx.font = '700 10px ' + FONT_BODY;
      ctx.textBaseline = 'top';
      ctx.fillText((roleNames[i] || ('Color ' + (i + 1))).toUpperCase(), cx, cy + chipH + 8);
      ctx.fillStyle = INK;
      ctx.font = '600 13px ' + FONT_MONO;
      ctx.fillText(String(hex).toUpperCase().slice(0, 7), cx, cy + chipH + 24);
    });

    // Section 2 — Canonical aspect ratios (the surfaces the
    // restaurant uses, with one-line composition note each)
    var sec2y = y0 + 36 + chipH + 56;
    ctx.fillStyle = INK;
    ctx.font = '500 22px ' + FONT_DISPLAY;
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardSurfacesTitle, x0, sec2y);

    var surfaces = opts.coverage || [];
    var rowH = 32;
    var rowsTop = sec2y + 36;
    surfaces.slice(0, 8).forEach(function(c, i){
      var ry = rowsTop + i * rowH;
      if (i % 2 === 1) {
        ctx.fillStyle = CREAM2;
        ctx.fillRect(x0, ry - 4, w, rowH);
      }
      // Surface label
      ctx.fillStyle = INK;
      ctx.font = '500 14px ' + FONT_BODY;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(c.surface.label, x0 + 8, ry + 4);
      // Aspect + pixels
      ctx.font = '500 12px ' + FONT_MONO;
      ctx.fillStyle = STONE;
      ctx.fillText(ratioLabel(c.surface.ratio) + '  ·  ' +
                   c.surface.pixels.w + '×' + c.surface.pixels.h,
                   x0 + 240, ry + 6);
      // Neg-space note
      ctx.fillStyle = TEAL;
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.textAlign = 'right';
      ctx.fillText('neg-space: ' + (c.surface.negDefault || 'none'), x0 + w - 8, ry + 6);
    });
    if (!surfaces.length) {
      ctx.fillStyle = STONE;
      ctx.font = 'italic 400 12px ' + FONT_BODY;
      ctx.fillText('No surfaces selected. Re-run with destinations ticked.', x0 + 8, rowsTop + 4);
    }

    // Section 3 — Naming convention + canonical angles (compact)
    var sec3y = rowsTop + Math.max(1, Math.min(8, surfaces.length || 1)) * rowH + 24;
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textAlign = 'left';
    ctx.fillText(strings.cardNamingTitle, x0, sec3y);
    ctx.fillStyle = INK;
    ctx.font = '500 14px ' + FONT_MONO;
    ctx.fillText(clip(ctx, strings.namingExample, w - 8), x0 + 8, sec3y + 30);
    ctx.fillStyle = STONE;
    ctx.font = '500 11px ' + FONT_BODY;
    ctx.fillText('Use this for every shot — paid pro, hire stringer, owner iPhone.', x0 + 8, sec3y + 56);
  }
  function drawFooter(ctx, strings) {
    // Unified across all six Cards: ink ground, single recessive
    // cream-on-ink line at 60% opacity. 48 px keep-out from each
    // edge per §3a margin discipline.
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

  // ------------------------------------------------------------
  // Public render entry-points
  // ------------------------------------------------------------
  function renderPhotoBrief(opts) {
    opts = opts || {};
    var strings = opts.strings || DEFAULT_STRINGS_EN;
    var canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = CREAM2;
    ctx.fillRect(0, 0, W, H);
    drawBriefHeader(ctx, opts, strings);
    drawCoverageStrip(ctx, opts, {
      x: OUTER_PAD,
      y: BODY_TOP + 24,
      w: W - OUTER_PAD * 2,
      h: 320
    });
    drawShotList(ctx, opts, strings, {
      x: OUTER_PAD,
      y: BODY_TOP + 24 + 340,
      w: W - OUTER_PAD * 2,
      h: 720
    });
    drawBriefLegend(ctx, opts, strings, {
      x: OUTER_PAD,
      y: BODY_TOP + 24 + 340 + 740,
      w: W - OUTER_PAD * 2,
      h: BODY_BOT - (BODY_TOP + 24 + 340 + 740) - 24
    });
    drawFooter(ctx, strings);
    return canvas;
  }

  function renderBrandPhotoCard(opts) {
    opts = opts || {};
    var strings = opts.strings || DEFAULT_STRINGS_EN;
    var canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = CREAM2;
    ctx.fillRect(0, 0, W, H);
    drawBriefHeader(ctx, Object.assign({}, opts, { _isCard: true }), strings);
    drawCardBody(ctx, opts, strings);
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

  // ------------------------------------------------------------
  // Default copy strings — page passes locale-appropriate strings.
  // Footer follows the unified "Generated by Muntin · ... ·
  // muntin.digital" pattern locked by the cards-QA suite.
  // ------------------------------------------------------------
  var DEFAULT_STRINGS_EN = {
    briefTitle:        'Photo Brief',
    briefEyebrow:      'Shoot-day shot list',
    cardTitle:         'Photo Standards',
    cardEyebrow:       'For every shoot, every shooter',
    brand:             'Muntin Digital',
    date:              new Date().toISOString().slice(0, 10),
    coverageTitle:     'Surface coverage · 3:2 source crops',
    shotListTitle:     'Shot list · invoice → shutter → surface',
    colNum:            '#',
    colDish:           'Dish',
    colCat:            'Cat.',
    colAngle:          'Angle',
    colLighting:       'Lighting',
    colCrop:           'Crops to',
    colNeg:            'Neg-space',
    legendMath:        'Source frames',
    legendNaming:      'Naming convention',
    legendPalette:     'Brand palette',
    namingExample:     'YYYY-MM-DD-restaurant-dish-surface-take.jpg',
    cardPaletteTitle:  'Brand palette',
    cardSurfacesTitle: 'Canonical aspect ratios',
    cardNamingTitle:   'Naming convention',
    cardAnglesTitle:   'Canonical angles',
    methodFootnote:    'One source frame can serve multiple destinations via crop math. Total frames < dishes × surfaces.',
    footerLeft:        'Generated by Muntin · Photo Brief Builder · muntin.digital',
    footerRight:       new Date().toISOString().slice(0, 10)
  };

  var DEFAULT_STRINGS_ES = {
    briefTitle:        'Brief de Fotos',
    briefEyebrow:      'Lista de tomas para el día de la sesión',
    cardTitle:         'Estándares de Foto',
    cardEyebrow:       'Para cada sesión, cada fotógrafo',
    brand:             'Muntin Digital',
    date:              new Date().toISOString().slice(0, 10),
    coverageTitle:     'Cobertura de superficies · cortes desde 3:2',
    shotListTitle:     'Lista de tomas · de la factura al obturador a la superficie',
    colNum:            '#',
    colDish:           'Plato',
    colCat:            'Cat.',
    colAngle:          'Ángulo',
    colLighting:       'Luz',
    colCrop:           'Corta a',
    colNeg:            'Espacio neg.',
    legendMath:        'Tomas fuente',
    legendNaming:      'Convención de nombres',
    legendPalette:     'Paleta de marca',
    namingExample:     'AAAA-MM-DD-restaurante-plato-superficie-toma.jpg',
    cardPaletteTitle:  'Paleta de marca',
    cardSurfacesTitle: 'Proporciones canónicas',
    cardNamingTitle:   'Convención de nombres',
    cardAnglesTitle:   'Ángulos canónicos',
    methodFootnote:    'Una toma fuente sirve varios destinos con corte de aspecto. Total de tomas < platos × superficies.',
    footerLeft:        'Generado por Muntin · Constructor de Brief de Fotos · muntin.digital',
    footerRight:       new Date().toISOString().slice(0, 10)
  };

  // ------------------------------------------------------------
  // Public API surface
  // ------------------------------------------------------------
  var api = {
    renderPhotoBrief:    renderPhotoBrief,
    renderBrandPhotoCard:renderBrandPhotoCard,
    canvasToPngBlob:     canvasToPngBlob,
    awaitFonts:          awaitFonts,
    DEFAULT_STRINGS_EN:  DEFAULT_STRINGS_EN,
    DEFAULT_STRINGS_ES:  DEFAULT_STRINGS_ES,
    W: W, H: H
  };

  if (typeof window !== 'undefined') window.PBCard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
