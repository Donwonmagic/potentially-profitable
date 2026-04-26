/**
 * Plate Cost Calculator — Plate Card renderer.
 *
 * Composes a 1200×1500 PNG built to the "extraordinary first-impression"
 * bar from §3a of the Plate Cost plan. Every Plate Card carries the
 * Muntin credit at 60% opacity, paints with Fraunces+Inter when the
 * page's web fonts are loaded, and survives a black-and-white kitchen
 * inkjet print without information loss.
 *
 * Geometry:
 *   header  0    .. 160   (160 px, ink ground) — dish + plate-cost
 *   body    160  .. 1440  (1280 px, cream)     — recipe + scorecards
 *   footer  1440 .. 1500  (60 px, ink ground)  — Muntin credit
 *
 * Privacy invariants (mirrors the four prior card-render modules):
 *   - Pure rendering. No fetch, no storage, no DOM mutation outside
 *     the offscreen canvas this module creates.
 *   - Output via canvas.toBlob() so the bytes stay same-origin.
 *
 * Usage:
 *   await window.PCCard.awaitFonts();
 *   const canvas = window.PCCard.renderPlateCard({
 *     recipe, summary, suggested,
 *     strings: window.PCCard.DEFAULT_STRINGS_EN
 *   });
 *   window.PCCard.canvasToPngBlob(canvas).then(download);
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
  // 60 px outer margin per the §3a margin-discipline rule.
  var OUTER_PAD = 60;

  var INK    = '#14161A';
  var CREAM  = '#FAF7F2';
  var CREAM2 = '#F2EEE5';
  var STONE  = '#5A5752';
  var TEAL   = '#1F4E5B';
  var LINE   = '#E5E0D8';

  // Verdict colours — neutral to amber to rust. Used only as a tint
  // accent; never the sole signal.
  var CONFIDENCE_COLOR = {
    high:   '#1F4E5B',
    medium: '#C68A2C',
    low:    '#B8541A'
  };

  var FONT_DISPLAY = '"Fraunces", "Times New Roman", serif';
  var FONT_BODY    = '"Inter", -apple-system, "Segoe UI", sans-serif';
  var FONT_MONO    = 'ui-monospace, "Berkeley Mono", "JetBrains Mono", "IBM Plex Mono", Menlo, Consolas, monospace';

  // ------------------------------------------------------------
  // Helpers (text wrapping, money formatting, clip-with-ellipsis)
  // ------------------------------------------------------------
  function fmtMoney(n) {
    if (!isFinite(n)) return '$0.00';
    var sign = n < 0 ? '-' : '';
    var abs = Math.abs(Number(n));
    return sign + '$' + abs.toFixed(2);
  }
  function fmtPct(n) {
    if (!isFinite(n)) return '—';
    return Math.round(Number(n) * 100) + '%';
  }
  function wrapText(ctx, text, maxWidth) {
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
  function clip(ctx, text, maxWidth) {
    var s = String(text == null ? '' : text);
    if (ctx.measureText(s).width <= maxWidth) return s;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxWidth) s = s.slice(0, -1);
    return s + '…';
  }

  // ------------------------------------------------------------
  // Public API stubs — body draw functions filled in subsequent
  // sprints. Functions defined as named declarations so the
  // dual-export wiring at the bottom can reference them in order.
  // ------------------------------------------------------------
  // ------------------------------------------------------------
  // Header band — ink ground, dish name on the left at 36 px in
  // Fraunces, plate-cost eyebrow underneath in mono. Date stamp +
  // confidence pill on the right. 60 px keep-out from each edge.
  // ------------------------------------------------------------
  function drawHeader(ctx, recipe, summary, strings) {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H_HEADER);

    var pad = OUTER_PAD;
    var leftLimit = W * 0.62;     // dish name + eyebrow live in left 62%
    var rightStart = W - pad;

    // Dish name (Fraunces, 36 px). Falls back to Times New Roman if
    // Fraunces hasn't loaded — page wraps the call in awaitFonts().
    ctx.fillStyle = CREAM;
    ctx.font = '500 36px ' + FONT_DISPLAY;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    var nameMaxW = leftLimit - pad - 8;
    var dishName = clip(ctx, recipe.name || strings.headerEyebrow, nameMaxW);
    ctx.fillText(dishName, pad, 64);

    // Eyebrow line: "Plate cost: $X.XX" — large mono with tabular nums.
    var costStr = strings.plateLabel + ': ' + fmtMoney(summary.plateCost);
    ctx.font = '600 28px ' + FONT_MONO;
    ctx.fillStyle = 'rgba(250,247,242,0.92)';
    ctx.fillText(costStr, pad, 110);

    // Eyebrow caption — small detail under the cost.
    ctx.font = '500 12px ' + FONT_BODY;
    ctx.fillStyle = 'rgba(250,247,242,0.6)';
    ctx.fillText(strings.headerSubtitle, pad, 134);

    // Right-side: date stamp at the top, confidence pill underneath.
    ctx.font = '500 13px ' + FONT_MONO;
    ctx.fillStyle = 'rgba(250,247,242,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(strings.date, rightStart, 56);

    // Confidence pill — coloured, but the *text* on the pill is the
    // load-bearing signal so a B&W print still reads.
    var conf = summary.confidence || 'high';
    var pillText = (conf === 'low') ? strings.confidenceLow
                  : (conf === 'medium' ? strings.confidenceMed : strings.confidenceHigh);
    var pillColor = CONFIDENCE_COLOR[conf] || CONFIDENCE_COLOR.high;
    ctx.font = '700 11px ' + FONT_BODY;
    var pillW = ctx.measureText(pillText).width + 22;
    var pillH = 22;
    var pillX = rightStart - pillW;
    var pillY = 76;
    ctx.fillStyle = pillColor;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(pillX, pillY, pillW, pillH, 999); ctx.fill(); }
    else ctx.fillRect(pillX, pillY, pillW, pillH);
    ctx.fillStyle = CREAM;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pillText.toUpperCase(), pillX + pillW / 2, pillY + pillH / 2 + 1);

    // Hairline under the header band — subtle ink-on-ink so the
    // body's cream ground transitions cleanly.
    ctx.strokeStyle = 'rgba(250,247,242,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H_HEADER - 0.5);
    ctx.lineTo(W, H_HEADER - 0.5);
    ctx.stroke();
  }
  // ------------------------------------------------------------
  // Recipe table — left column, ~60% width. Five columns: ingredient
  // (serif, left-aligned) and four numeric columns in tabular mono so
  // the cents align cleanly down the page. Row height is generous so
  // the line reads at arm's length under fluorescent kitchen lights.
  // ------------------------------------------------------------
  function drawRecipeTable(ctx, recipe, summary, strings, region) {
    var x0 = region.x, y0 = region.y, w = region.w;
    var pad = 18;

    // Panel ground — white card on cream, hairline border.
    ctx.fillStyle = '#FFFFFF';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x0, y0, w, region.h, 6); ctx.fill(); }
    else ctx.fillRect(x0, y0, w, region.h);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x0 + 0.5, y0 + 0.5, w - 1, region.h - 1, 6); ctx.stroke(); }
    else ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, region.h - 1);

    // Title
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.recipeTitle, x0 + pad, y0 + pad);

    // Column geometry — ingredient takes 36% of inner width; the four
    // numeric columns split the remaining 64% evenly.
    var innerX = x0 + pad;
    var innerW = w - pad * 2;
    var colIngW = Math.round(innerW * 0.40);
    var numColW = Math.floor((innerW - colIngW) / 4);
    var col1 = innerX;
    var col2 = innerX + colIngW;
    var col3 = col2 + numColW;
    var col4 = col3 + numColW;
    var col5 = col4 + numColW;
    var rightEdge = innerX + innerW;

    // Header row
    var headerY = y0 + 56;
    ctx.fillStyle = STONE;
    ctx.font = '700 10px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.fillText(strings.colIngredient.toUpperCase(), col1, headerY);
    ctx.textAlign = 'right';
    ctx.fillText(strings.colApCost.toUpperCase(),     col3, headerY);
    ctx.fillText(strings.colYield.toUpperCase(),      col4, headerY);
    ctx.fillText(strings.colUsed.toUpperCase(),       col5, headerY);
    ctx.fillText(strings.colEpUsedCost.toUpperCase(), rightEdge, headerY);

    // Header underline
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(col1, headerY + 18);
    ctx.lineTo(rightEdge, headerY + 18);
    ctx.stroke();

    // Body rows — tabular mono on every numeric, serif italic on the
    // ingredient name so the table feels like a chef's prep sheet.
    var ingredients = (summary && summary.ingredients) || [];
    var rowsRecipe  = (recipe && recipe.rows) || [];
    var rowH = 28;
    var rowsTop = headerY + 28;
    var rowsBottom = y0 + region.h - 64; // leave room for footnote + totals
    var maxRows = Math.max(0, Math.floor((rowsBottom - rowsTop) / rowH));
    var visible = ingredients.slice(0, maxRows);

    visible.forEach(function(ing, i){
      var ry = rowsTop + i * rowH;

      // Subtle row stripe for legibility (every other row).
      if (i % 2 === 1) {
        ctx.fillStyle = CREAM2;
        ctx.fillRect(col1 - 4, ry - 4, innerW + 8, rowH);
      }

      // Ingredient name — serif italic, clipped to column.
      ctx.fillStyle = INK;
      ctx.font = '400 italic 14px ' + FONT_DISPLAY;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      var name = ing.ingredient || (rowsRecipe[i] && rowsRecipe[i].ingredient) || '—';
      ctx.fillText(clip(ctx, name, colIngW - 8), col1, ry + 4);

      // Numeric columns — tabular mono.
      ctx.font = '500 13px ' + FONT_MONO;
      ctx.fillStyle = INK;
      ctx.textAlign = 'right';

      // AP $/unit
      ctx.fillText(ing.apUnitCost ? fmtMoney(ing.apUnitCost) : '—', col3, ry + 4);

      // Yield
      ctx.fillText(ing.yieldPercent != null && isFinite(ing.yieldPercent)
        ? fmtPct(ing.yieldPercent) : '—', col4, ry + 4);

      // Used qty + unit
      var usedQ = rowsRecipe[i] ? rowsRecipe[i].usedQty : '';
      var usedU = rowsRecipe[i] ? rowsRecipe[i].usedUnit : '';
      var usedStr = (usedQ ? usedQ : '—') + (usedU ? ' ' + usedU : '');
      ctx.fillText(clip(ctx, usedStr, numColW - 8), col5, ry + 4);

      // Cost on plate (the whole reason for the table)
      var costColor = ing.warning && ing.warning !== 'unknown-yield' ? STONE : INK;
      ctx.fillStyle = costColor;
      ctx.fillText(ing.usedCost ? fmtMoney(ing.usedCost) : '—', rightEdge, ry + 4);
    });

    // Truncation hint if more rows than fit.
    if (ingredients.length > maxRows) {
      ctx.fillStyle = STONE;
      ctx.font = 'italic 400 11px ' + FONT_BODY;
      ctx.textAlign = 'left';
      ctx.fillText('+ ' + (ingredients.length - maxRows) + ' more in JSON export',
                   col1, rowsTop + maxRows * rowH + 4);
    }

    // Totals strip — batch + plate cost in tabular mono, separated
    // from the body by a hairline.
    var totalsY = y0 + region.h - 52;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(col1, totalsY - 2);
    ctx.lineTo(rightEdge, totalsY - 2);
    ctx.stroke();

    ctx.fillStyle = STONE;
    ctx.font = '700 10px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.batchLabel.toUpperCase() + '  ·  ' +
                 strings.portionsLabel.toUpperCase() + ' ' + (recipe.portions || 1),
                 col1, totalsY + 4);

    ctx.fillStyle = INK;
    ctx.font = '600 16px ' + FONT_MONO;
    ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(summary.batchCost), rightEdge, totalsY + 2);

    // Method footnote — small caption under the table that lets the
    // chef audit AP→EP→plate without opening the URL.
    ctx.fillStyle = STONE;
    ctx.font = 'italic 400 11px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    var fn = wrapText(ctx, strings.methodFootnote, innerW);
    var fnY = y0 + region.h - 24;
    fn.slice(0, 1).forEach(function(line){
      ctx.fillText(line, col1, fnY);
    });
  }
  // ------------------------------------------------------------
  // Right column — three stacked panels.
  //   1. Plate-cost headline (the number, hero size)
  //   2. Three suggested menu prices at 28% / 30% / 33% targets
  //   3. Method legend / honest-limits caption
  // ------------------------------------------------------------
  function drawScorecards(ctx, summary, suggested, strings, region) {
    var x0 = region.x, y0 = region.y, w = region.w, h = region.h;
    var pad = 18;

    // Panel split — top panel taller (the headline owns the eye); the
    // pricing panel below is sized to fit three rows; the third panel
    // is the residual.
    var headlineH = 240;
    var pricingH  = 320;
    var legendH   = h - headlineH - pricingH - 24; // 24 = total gaps

    // ---- 1. Plate-cost headline panel ----
    var hX = x0, hY = y0, hW = w, hH = headlineH;
    ctx.fillStyle = '#FFFFFF';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(hX, hY, hW, hH, 6); ctx.fill(); }
    else ctx.fillRect(hX, hY, hW, hH);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(hX + 0.5, hY + 0.5, hW - 1, hH - 1, 6); ctx.stroke(); }
    else ctx.strokeRect(hX + 0.5, hY + 0.5, hW - 1, hH - 1);

    // Eyebrow
    ctx.fillStyle = STONE;
    ctx.font = '700 10px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.plateLabel.toUpperCase(), hX + pad, hY + pad);

    // The number — Fraunces, 56 px, generous breathing room.
    ctx.fillStyle = INK;
    ctx.font = '500 56px ' + FONT_DISPLAY;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(fmtMoney(summary.plateCost), hX + pad, hY + 100);

    // Per-portion explainer
    ctx.fillStyle = STONE;
    ctx.font = '400 12.5px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    var ex = wrapText(ctx, strings.plateExplainer, hW - pad * 2);
    ex.slice(0, 3).forEach(function(line, i){
      ctx.fillText(line, hX + pad, hY + 130 + i * 18);
    });

    // Footnote line — show batch breakdown if a batch recipe.
    if (summary.batchCost && summary.plateCost && summary.batchCost > summary.plateCost + 0.005) {
      ctx.fillStyle = STONE;
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillText(fmtMoney(summary.batchCost) + ' batch  ·  ' +
                   '÷ ' + (summary.portions || 1) + ' portions', hX + pad, hY + hH - 28);
    }

    // ---- 2. Suggested-prices panel ----
    var sX = x0, sY = y0 + headlineH + 12, sW = w, sH = pricingH;
    ctx.fillStyle = '#FFFFFF';
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(sX, sY, sW, sH, 6); ctx.fill(); }
    else ctx.fillRect(sX, sY, sW, sH);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(sX + 0.5, sY + 0.5, sW - 1, sH - 1, 6); ctx.stroke(); }
    else ctx.strokeRect(sX + 0.5, sY + 0.5, sW - 1, sH - 1);

    ctx.fillStyle = INK;
    ctx.font = '500 16px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.suggestedTitle, sX + pad, sY + pad);

    ctx.fillStyle = STONE;
    ctx.font = '400 11.5px ' + FONT_BODY;
    var sd = wrapText(ctx, strings.suggestedDek, sW - pad * 2);
    sd.slice(0, 2).forEach(function(line, i){
      ctx.fillText(line, sX + pad, sY + pad + 24 + i * 16);
    });

    // Three rows — target % | price | CM kept
    var rowsTop = sY + 76;
    var rowH = (sH - 100) / 3;
    (suggested || []).slice(0, 3).forEach(function(p, i){
      var ry = rowsTop + i * rowH;
      // Hairline divider above each row except the first.
      if (i > 0) {
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sX + pad, ry - 6);
        ctx.lineTo(sX + sW - pad, ry - 6);
        ctx.stroke();
      }
      // Target %
      ctx.fillStyle = INK;
      ctx.font = '700 14px ' + FONT_MONO;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(Math.round((p.target || 0) * 100) + '%', sX + pad, ry);

      // Label
      ctx.font = '600 10px ' + FONT_BODY;
      ctx.fillStyle = STONE;
      ctx.fillText(String(p.label || '').toUpperCase(), sX + pad + 56, ry + 1);

      // Price (tabular display)
      ctx.font = '500 22px ' + FONT_DISPLAY;
      ctx.fillStyle = INK;
      ctx.textAlign = 'right';
      ctx.fillText(fmtMoney(p.price || 0), sX + sW - pad, ry - 4);

      // CM kept caption
      ctx.font = '500 11px ' + FONT_MONO;
      ctx.fillStyle = STONE;
      ctx.fillText('+' + fmtMoney(p.cmDollars || 0) + '  ' + strings.cmKept,
                   sX + sW - pad, ry + 22);
    });

    // ---- 3. Method legend panel ----
    if (legendH > 80) {
      var lX = x0, lY = sY + sH + 12, lW = w, lH = legendH;
      ctx.fillStyle = CREAM2;
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(lX, lY, lW, lH, 6); ctx.fill(); }
      else ctx.fillRect(lX, lY, lW, lH);

      ctx.fillStyle = INK;
      ctx.font = '500 13px ' + FONT_DISPLAY;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('AP → EP → plate', lX + pad, lY + pad);

      ctx.fillStyle = STONE;
      ctx.font = '400 11.5px ' + FONT_BODY;
      var ml = wrapText(ctx, strings.methodFootnote, lW - pad * 2);
      ml.slice(0, 4).forEach(function(line, i){
        ctx.fillText(line, lX + pad, lY + pad + 22 + i * 16);
      });
    }
  }
  // ------------------------------------------------------------
  // Footer — unified with the other four Cards. Ink ground; single
  // recessive cream-on-ink line at 60 % opacity. 48 px keep-out from
  // each edge per the §3a margin discipline.
  // ------------------------------------------------------------
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

  function renderPlateCard(opts) {
    opts = opts || {};
    var recipe    = opts.recipe    || { name: '', portions: 1, rows: [] };
    var summary   = opts.summary   || { plateCost: 0, batchCost: 0, ingredients: [], confidence: 'high', warnings: [] };
    var suggested = opts.suggested || [];
    var strings   = opts.strings   || DEFAULT_STRINGS_EN;

    var canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = CREAM2;
    ctx.fillRect(0, 0, W, H);

    drawHeader(ctx, recipe, summary, strings);
    drawRecipeTable(ctx, recipe, summary, strings, {
      x: OUTER_PAD,
      y: BODY_TOP + 24,
      w: Math.round((W - OUTER_PAD * 2) * 0.60),
      h: BODY_BOT - BODY_TOP - 48
    });
    drawScorecards(ctx, summary, suggested, strings, {
      x: OUTER_PAD + Math.round((W - OUTER_PAD * 2) * 0.60) + 24,
      y: BODY_TOP + 24,
      w: Math.round((W - OUTER_PAD * 2) * 0.40) - 24,
      h: BODY_BOT - BODY_TOP - 48
    });
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

  // Resolve when the page's web fonts (Fraunces, Inter) are ready.
  // No-op under Node / older browsers — the fallback stack still
  // renders intentionally.
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
    headerEyebrow:   'Plate cost',
    headerSubtitle:  'A working line — for the kitchen wall',
    brand:           'Muntin Digital',
    date:            new Date().toISOString().slice(0, 10),
    recipeTitle:     'Recipe — invoice → plate',
    colIngredient:   'Ingredient',
    colApCost:       'AP $/unit',
    colYield:        'Yield',
    colUsed:         'Used',
    colEpUsedCost:   'Cost on plate',
    methodFootnote:  'AP$ ÷ yield = EP$ on a usable unit · EP$ × portion = cost on this plate.',
    portionsLabel:   'Portions',
    batchLabel:      'Batch cost',
    plateLabel:      'Plate cost',
    plateExplainer:  'Ingredients only. Excludes labour and overhead.',
    suggestedTitle:  'Suggested menu prices',
    suggestedDek:    'Working backwards from a target food-cost percent.',
    cmKept:          'Kept per plate',
    confidenceHigh:  'High confidence',
    confidenceMed:   'Medium confidence',
    confidenceLow:   'Low confidence',
    footerLeft:      'Generated by Muntin · Plate Cost Calculator · muntin.digital',
    footerRight:     new Date().toISOString().slice(0, 10)
  };

  var DEFAULT_STRINGS_ES = {
    headerEyebrow:   'Costo del plato',
    headerSubtitle:  'Una herramienta — para la pared de la cocina',
    brand:           'Muntin Digital',
    date:            new Date().toISOString().slice(0, 10),
    recipeTitle:     'Receta — de la factura al plato',
    colIngredient:   'Ingrediente',
    colApCost:       'AP $/unidad',
    colYield:        'Rend.',
    colUsed:         'Usado',
    colEpUsedCost:   'Costo en plato',
    methodFootnote:  'AP$ ÷ rend. = EP$ por unidad usable · EP$ × porción = costo en este plato.',
    portionsLabel:   'Porciones',
    batchLabel:      'Costo de la tanda',
    plateLabel:      'Costo del plato',
    plateExplainer:  'Solo ingredientes. No incluye mano de obra ni gastos generales.',
    suggestedTitle:  'Precios de menú sugeridos',
    suggestedDek:    'Trabajando hacia atrás desde un costo de alimento meta.',
    cmKept:          'Te quedas por plato',
    confidenceHigh:  'Alta confianza',
    confidenceMed:   'Confianza media',
    confidenceLow:   'Baja confianza',
    footerLeft:      'Generado por Muntin · Calculadora de Costo del Plato · muntin.digital',
    footerRight:     new Date().toISOString().slice(0, 10)
  };

  // ------------------------------------------------------------
  // Public API surface
  // ------------------------------------------------------------
  var api = {
    renderPlateCard:    renderPlateCard,
    canvasToPngBlob:    canvasToPngBlob,
    awaitFonts:         awaitFonts,
    DEFAULT_STRINGS_EN: DEFAULT_STRINGS_EN,
    DEFAULT_STRINGS_ES: DEFAULT_STRINGS_ES,
    W: W, H: H
  };

  if (typeof window !== 'undefined') window.PCCard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
