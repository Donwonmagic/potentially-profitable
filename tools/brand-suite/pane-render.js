/**
 * Brand Suite — Muntin Pane renderer.
 *
 * Composes a 1200×1260 PNG (1200×1200 muntin grid + 60px footer strip)
 * that arranges the user's logo, palette, typography sample, and the
 * restaurant fixture into the same 2×2 asymmetric layout as the
 * Muntin Digital mark — so the export takes the shape of the brand it
 * came from. The output is the free analog of the paid Brand Board
 * PDF: a single PNG a restaurant owner can email to a designer, post
 * to Instagram, or print.
 *
 * Privacy invariants:
 *   - Pure rendering. No fetch, no storage, no DOM mutation outside
 *     the offscreen canvas this module creates.
 *   - The logo Image must already be loaded (the page passes the same
 *     Image object it used for preview); this module never reads from
 *     the network or constructs new image URLs.
 *   - Output is delivered as a PNG Blob via canvas.toBlob() so it
 *     stays same-origin and never leaves the device.
 *
 * Usage:
 *   const canvas = renderMuntinPane({
 *     palette, logoImage, locale, contrastRatio, deriveAccessiblePair
 *   });
 *   canvasToPngBlob(canvas).then(blob => download(blob));
 */

(function(){
  // ------------------------------------------------------------
  // Geometry — derived from /brand/mark/mark-square-ink.svg.
  // The mark divides its inner square with a vertical muntin at
  // 50% and a horizontal muntin at ~33.7% from top, giving the top
  // panes one third of the height and the bottom panes two thirds.
  // We mirror those proportions so the output is unmistakably
  // Muntin Digital — no watermark needed.
  // ------------------------------------------------------------
  var W              = 1200;
  var H_PANE         = 1200;
  var H_FOOTER       = 60;
  var H              = H_PANE + H_FOOTER;
  var STROKE         = 8;
  var V_MUNTIN_X     = W / 2;                // vertical crossbar (centered)
  var H_MUNTIN_Y     = Math.round(H_PANE * (31 / 92));  // 31/92 from the SVG: ~404
  var PANE_PAD       = 32;                   // inner padding inside each pane
  var INK            = '#14161A';
  var CREAM          = '#FAF7F2';
  var STONE          = '#5A5752';
  var STROKE_COLOR   = INK;

  // Fonts that are present site-wide. Browsers fall back gracefully
  // if Fraunces/Inter aren't loaded — the pane still renders.
  var FONT_DISPLAY = '"Fraunces", "Times New Roman", serif';
  var FONT_BODY    = '"Inter", -apple-system, "Segoe UI", sans-serif';

  // ------------------------------------------------------------
  // Color helpers — duplicated minimally so this module can ship
  // standalone. The page also passes its own deriveAccessiblePair
  // and contrastRatio in via the deps object below for parity with
  // what the rest of the tool already computed.
  // ------------------------------------------------------------
  function pickGround(primaryHex, deps){
    var rCream = deps.contrastRatio(primaryHex, CREAM);
    var rInk   = deps.contrastRatio(primaryHex, INK);
    return rCream >= rInk
      ? { ground: CREAM, on: INK,   label: 'cream' }
      : { ground: INK,   on: CREAM, label: 'ink'   };
  }

  // ------------------------------------------------------------
  // Drawing primitives
  // ------------------------------------------------------------
  function drawStrokeFrame(ctx){
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H_PANE);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE;
    ctx.lineCap = 'butt';
    // Outer rectangle
    ctx.strokeRect(STROKE / 2, STROKE / 2, W - STROKE, H_PANE - STROKE);
    // Vertical muntin
    ctx.beginPath();
    ctx.moveTo(V_MUNTIN_X, 0);
    ctx.lineTo(V_MUNTIN_X, H_PANE);
    ctx.stroke();
    // Horizontal muntin
    ctx.beginPath();
    ctx.moveTo(0, H_MUNTIN_Y);
    ctx.lineTo(W, H_MUNTIN_Y);
    ctx.stroke();
  }

  function paneRects(){
    // Each pane bounds in (x, y, w, h), inset by stroke so the muntin
    // crossbars stay visually crisp.
    var s = STROKE;
    return {
      tl: { x: s, y: s, w: V_MUNTIN_X - s - s/2, h: H_MUNTIN_Y - s - s/2 },
      tr: { x: V_MUNTIN_X + s/2, y: s, w: W - V_MUNTIN_X - s - s/2, h: H_MUNTIN_Y - s - s/2 },
      bl: { x: s, y: H_MUNTIN_Y + s/2, w: V_MUNTIN_X - s - s/2, h: H_PANE - H_MUNTIN_Y - s - s/2 },
      br: { x: V_MUNTIN_X + s/2, y: H_MUNTIN_Y + s/2, w: W - V_MUNTIN_X - s - s/2, h: H_PANE - H_MUNTIN_Y - s - s/2 }
    };
  }

  // Top-left pane: logo on the higher-contrast ground.
  function drawLogoPane(ctx, rect, logoImage, ground){
    ctx.save();
    ctx.fillStyle = ground.ground;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    if (logoImage && logoImage.naturalWidth && logoImage.naturalHeight) {
      var iw = logoImage.naturalWidth, ih = logoImage.naturalHeight;
      var maxW = rect.w - PANE_PAD * 2;
      var maxH = rect.h - PANE_PAD * 2;
      var scale = Math.min(maxW / iw, maxH / ih);
      var dw = iw * scale, dh = ih * scale;
      var dx = rect.x + (rect.w - dw) / 2;
      var dy = rect.y + (rect.h - dh) / 2;
      ctx.drawImage(logoImage, dx, dy, dw, dh);
    }
    ctx.restore();
  }

  // Top-right pane: palette strip — five chips with hex + role + share.
  function drawPalettePane(ctx, rect, palette, roleNames){
    ctx.save();
    ctx.fillStyle = CREAM;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    var chips = palette.slice(0, 5);
    if (!chips.length) { ctx.restore(); return; }
    var pad = PANE_PAD;
    var labelH = 70;
    var swatchTop = rect.y + pad;
    var swatchH = rect.h - pad * 2 - labelH;
    var totalW = rect.w - pad * 2;
    var gap = 12;
    var chipW = (totalW - gap * (chips.length - 1)) / chips.length;

    chips.forEach(function(entry, i){
      var x = rect.x + pad + i * (chipW + gap);
      // Swatch
      ctx.fillStyle = entry.hex;
      ctx.fillRect(x, swatchTop, chipW, swatchH);
      // Hairline border (matches site's --line treatment)
      ctx.strokeStyle = 'rgba(20,22,26,0.10)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, swatchTop + 0.5, chipW - 1, swatchH - 1);
      // Role label
      ctx.fillStyle = STONE;
      ctx.font = '600 11px ' + FONT_BODY;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      var role = (roleNames[i] || ('Color ' + (i + 1))).toUpperCase();
      ctx.fillText(role, x, swatchTop + swatchH + 12);
      // Hex
      ctx.fillStyle = INK;
      ctx.font = '600 14px ui-monospace, SFMono-Regular, Consolas, monospace';
      ctx.fillText(entry.hex.toUpperCase(), x, swatchTop + swatchH + 28);
      // Share
      ctx.fillStyle = STONE;
      ctx.font = '500 12px ' + FONT_BODY;
      ctx.fillText(Math.round(entry.dominancePct * 100) + '% share', x, swatchTop + swatchH + 48);
    });
    ctx.restore();
  }

  // Bottom-left pane: typography sample with on-palette text colors.
  function drawTypographyPane(ctx, rect, palette, deps, strings){
    ctx.save();
    var primary   = palette[0] ? palette[0].hex : INK;
    var secondary = palette[1] ? palette[1].hex : CREAM;
    ctx.fillStyle = secondary;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    var displayColor = deps.deriveAccessiblePair(primary, secondary);
    var bodyColor    = deps.deriveAccessiblePair(palette[4] ? palette[4].hex : INK, secondary);
    var captionColor = deps.deriveAccessiblePair(palette[2] ? palette[2].hex : primary, secondary);

    var pad = PANE_PAD + 8;
    var x = rect.x + pad;
    var y = rect.y + pad;
    var maxW = rect.w - pad * 2;

    // Eyebrow caption
    ctx.fillStyle = captionColor;
    ctx.font = '600 12px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.eyebrow.toUpperCase(), x, y);
    y += 28;

    // Display heading
    ctx.fillStyle = displayColor;
    ctx.font = '500 56px ' + FONT_DISPLAY;
    var heading = strings.display;
    var lines = wrapText(ctx, heading, maxW);
    lines.slice(0, 2).forEach(function(line){
      ctx.fillText(line, x, y);
      y += 64;
    });
    y += 12;

    // Body sample
    ctx.fillStyle = bodyColor;
    ctx.font = '400 19px ' + FONT_BODY;
    var bodyLines = wrapText(ctx, strings.body, maxW);
    bodyLines.slice(0, 4).forEach(function(line){
      ctx.fillText(line, x, y);
      y += 28;
    });
    y += 8;

    // Disclosure
    ctx.fillStyle = STONE;
    ctx.font = 'italic 400 12px ' + FONT_BODY;
    ctx.fillText(strings.disclaimer, x, rect.y + rect.h - pad - 14);

    ctx.restore();
  }

  // Bottom-right pane: condensed restaurant fixture.
  function drawFixturePane(ctx, rect, palette, deps, strings){
    ctx.save();
    var primary   = palette[0] ? palette[0].hex : INK;
    var secondary = palette[1] ? palette[1].hex : CREAM;
    var accent1   = palette[2] ? palette[2].hex : primary;
    var accent2   = palette[3] ? palette[3].hex : secondary;
    var neutral   = palette[4] ? palette[4].hex : INK;

    ctx.fillStyle = secondary;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    var pad = PANE_PAD + 4;
    var x = rect.x + pad;
    var y = rect.y + pad;
    var maxW = rect.w - pad * 2;

    // Eyebrow
    ctx.fillStyle = deps.deriveAccessiblePair(accent1, secondary);
    ctx.font = '600 12px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.eyebrow.toUpperCase(), x, y);
    y += 26;

    // Display
    ctx.fillStyle = deps.deriveAccessiblePair(primary, secondary);
    ctx.font = '500 38px ' + FONT_DISPLAY;
    var hdLines = wrapText(ctx, strings.heading, maxW);
    hdLines.slice(0, 2).forEach(function(line){
      ctx.fillText(line, x, y);
      y += 44;
    });
    y += 10;

    // Accent bar
    ctx.fillStyle = accent1;
    ctx.fillRect(x, y, 60, 3);
    y += 18;

    // Menu surface
    var menuY = y;
    var menuH = 168;
    ctx.fillStyle = accent2;
    ctx.fillRect(x, menuY, maxW, menuH);

    var menuTextHeading = deps.deriveAccessiblePair(primary, accent2);
    var menuTextBody    = deps.deriveAccessiblePair(neutral, accent2);
    var menuTextPrice   = deps.deriveAccessiblePair(accent1, accent2);
    var menuPad = 18;

    // Row 1
    var rowY = menuY + menuPad;
    ctx.fillStyle = menuTextHeading;
    ctx.font = '600 18px ' + FONT_BODY;
    ctx.fillText(strings.dish1.name, x + menuPad, rowY);
    ctx.fillStyle = menuTextPrice;
    ctx.textAlign = 'right';
    ctx.fillText(strings.dish1.price, x + maxW - menuPad, rowY);
    ctx.textAlign = 'left';
    ctx.fillStyle = menuTextBody;
    ctx.font = '400 13px ' + FONT_BODY;
    ctx.fillText(strings.dish1.desc, x + menuPad, rowY + 24);

    // Row 2
    rowY += 64;
    ctx.fillStyle = menuTextHeading;
    ctx.font = '600 18px ' + FONT_BODY;
    ctx.fillText(strings.dish2.name, x + menuPad, rowY);
    ctx.fillStyle = menuTextPrice;
    ctx.textAlign = 'right';
    ctx.fillText(strings.dish2.price, x + maxW - menuPad, rowY);
    ctx.textAlign = 'left';
    ctx.fillStyle = menuTextBody;
    ctx.font = '400 13px ' + FONT_BODY;
    ctx.fillText(strings.dish2.desc, x + menuPad, rowY + 24);

    y = menuY + menuH + 18;

    // CTA pill
    var ctaText = deps.contrastRatio(CREAM, primary) >= deps.contrastRatio(INK, primary) ? CREAM : INK;
    ctx.fillStyle = primary;
    var ctaW = 200, ctaH = 44;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, ctaW, ctaH, 999) : roundRectPath(ctx, x, y, ctaW, ctaH, 22);
    ctx.fill();
    ctx.fillStyle = ctaText;
    ctx.font = '600 14px ' + FONT_BODY;
    ctx.textBaseline = 'middle';
    ctx.fillText(strings.cta, x + 22, y + ctaH / 2);

    ctx.restore();
  }

  function roundRectPath(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawFooter(ctx, footerStrings){
    ctx.save();
    ctx.fillStyle = INK;
    ctx.fillRect(0, H_PANE, W, H_FOOTER);
    ctx.fillStyle = CREAM;
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(footerStrings.left, 24, H_PANE + H_FOOTER / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(250,247,242,0.7)';
    ctx.fillText(footerStrings.right, W - 24, H_PANE + H_FOOTER / 2);
    ctx.restore();
  }

  function wrapText(ctx, text, maxWidth){
    var words = String(text).split(/\s+/);
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

  // ------------------------------------------------------------
  // Public entry: renderMuntinPane
  //
  //   opts.palette  — array of { hex, dominancePct }
  //   opts.logoImage — already-loaded HTMLImageElement (preview img)
  //   opts.contrastRatio, opts.deriveAccessiblePair — from window.BS
  //   opts.roleNames — ['Primary','Secondary',...] (locale-aware)
  //   opts.strings   — { typography: {...}, fixture: {...}, footer: {...} }
  // ------------------------------------------------------------
  function renderMuntinPane(opts){
    var palette = (opts && opts.palette) || [];
    var canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // Background frame in cream so any pane that doesn't paint a fill
    // stays on-brand. The strokes are drawn on top of pane fills.
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);

    var rects = paneRects();
    var deps = {
      contrastRatio:        opts.contrastRatio,
      deriveAccessiblePair: opts.deriveAccessiblePair
    };
    var ground = pickGround(palette[0] ? palette[0].hex : INK, deps);

    drawLogoPane(ctx, rects.tl, opts.logoImage, ground);
    drawPalettePane(ctx, rects.tr, palette, opts.roleNames || []);
    drawTypographyPane(ctx, rects.bl, palette, deps, opts.strings.typography);
    drawFixturePane(ctx, rects.br, palette, deps, opts.strings.fixture);

    // Strokes last so the muntin frame sits above pane content.
    drawStrokeFrame(ctx);
    // Re-paint footer below the stroke frame.
    drawFooter(ctx, opts.strings.footer);

    return canvas;
  }

  function canvasToPngBlob(canvas){
    return new Promise(function(resolve, reject){
      try {
        canvas.toBlob(function(blob){
          if (!blob) reject(new Error('toBlob-null'));
          else resolve(blob);
        }, 'image/png');
      } catch (e) { reject(e); }
    });
  }

  // ------------------------------------------------------------
  // Default copy strings — plain English. The page passes locale-
  // appropriate strings so the Spanish mirror gets Spanish copy.
  // ------------------------------------------------------------
  var DEFAULT_STRINGS_EN = {
    typography: {
      eyebrow: 'Sample pairing',
      display: 'Structure brings clarity.',
      body: 'A line of body copy in your supporting text color, sized for legibility on the surface above. Long-enough that you can see the rhythm of paragraphs, not just one sentence.',
      disclaimer: 'A pairing to try — not a recommendation.'
    },
    fixture: {
      eyebrow: 'Osteria Giardino · Silver Spring',
      heading: 'Rustic pastas and natural wine, made by hand.',
      dish1:   { name: 'Cacio e pepe',     price: '$24', desc: 'Tonnarelli, pecorino romano, cracked pepper.' },
      dish2:   { name: 'Brodetto di pesce', price: '$38', desc: 'Adriatic fish stew, salsa verde.' },
      cta: 'Reserve a table'
    },
    footer: {
      left: 'Generated by Brand Suite',
      right: 'muntin.digital/tools/brand-suite/'
    }
  };

  var DEFAULT_STRINGS_ES = {
    typography: {
      eyebrow: 'Pareja de muestra',
      display: 'La estructura aporta claridad.',
      body: 'Una línea de texto en tu color de apoyo, dimensionada para leerse cómoda sobre la superficie de arriba. Suficientemente larga para mostrar el ritmo de un párrafo, no solo una frase.',
      disclaimer: 'Una combinación para probar — no una recomendación.'
    },
    fixture: {
      eyebrow: 'Osteria Giardino · Silver Spring',
      heading: 'Pastas rústicas y vino natural, hechos a mano.',
      dish1:   { name: 'Cacio e pepe',      price: '$24', desc: 'Tonnarelli, pecorino romano, pimienta negra.' },
      dish2:   { name: 'Brodetto di pesce', price: '$38', desc: 'Caldo adriático de pescado, salsa verde.' },
      cta: 'Reservar mesa'
    },
    footer: {
      left: 'Generado con Suite de Marca',
      right: 'muntin.digital/es/tools/brand-suite/'
    }
  };

  var api = {
    renderMuntinPane:    renderMuntinPane,
    canvasToPngBlob:     canvasToPngBlob,
    DEFAULT_STRINGS_EN:  DEFAULT_STRINGS_EN,
    DEFAULT_STRINGS_ES:  DEFAULT_STRINGS_ES
  };

  if (typeof window !== 'undefined') window.BSPane = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
