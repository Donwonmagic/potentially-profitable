/**
 * Menu Engineering Matrix — Menu Card renderer.
 *
 * Composes a 1200×1500 PNG that takes the shape of the matrix
 * itself: an ink header band, the 2×2 matrix as the main panel
 * with items plotted and labelled, a four-cell action band naming
 * the items in each quadrant alongside the Kasavana action, and a
 * footer strip. The signature deliverable for this tool — a single
 * shareable image a chef, partner, or accountant can email, post,
 * or print without needing the URL.
 *
 * Privacy invariants (mirrors brand-suite/pane-render.js):
 *   - Pure rendering. No fetch, no storage, no DOM mutation outside
 *     the offscreen canvas this module creates.
 *   - Output via canvas.toBlob() so the bytes stay same-origin.
 *
 * Usage:
 *   const canvas = renderMenuCard({
 *     summary, locale, strings
 *   });
 *   canvasToPngBlob(canvas).then(blob => download(blob));
 */

(function(){
  // ------------------------------------------------------------
  // Geometry. Total canvas 1200×1500 split:
  //   header   0   ..  120  (120 px)
  //   matrix   120 ..  920  (800 px)
  //   actions  920 .. 1440  (520 px, four equal cells)
  //   footer  1440 .. 1500  (60 px)
  // ------------------------------------------------------------
  var W              = 1200;
  var H              = 1500;
  var H_HEADER       = 120;
  var H_MATRIX       = 800;
  var H_ACTIONS      = 520;
  var H_FOOTER       = 60;

  var INK            = '#14161A';
  var CREAM          = '#FAF7F2';
  var CREAM2         = '#F2EEE5';
  var STONE          = '#5A5752';
  var LINE           = '#E5E0D8';

  var Q_COLORS = {
    Star:      '#1F4E5B',
    Plowhorse: '#C68A2C',
    Puzzle:    '#6E5DB3',
    Dog:       '#B8541A'
  };
  var Q_TINTS = {
    Star:      '#F0F4F5',
    Plowhorse: '#FAF4E7',
    Puzzle:    '#F1EFF7',
    Dog:       '#FAEFE7'
  };

  // System fonts — the rasteriser doesn't have to wait for web-font
  // loading and the PNG renders consistently across machines.
  var FONT_DISPLAY = '"Fraunces", "Times New Roman", serif';
  var FONT_BODY    = '"Inter", -apple-system, "Segoe UI", sans-serif';

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  function fmtMoney(n){
    return '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtPct(n){ return Math.round(n * 100) + '%'; }

  function wrapText(ctx, text, maxWidth) {
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

  function clip(text, ctx, maxWidth, suffix){
    suffix = suffix == null ? '…' : suffix;
    if (ctx.measureText(text).width <= maxWidth) return text;
    var s = String(text);
    while (s.length > 1 && ctx.measureText(s + suffix).width > maxWidth) s = s.slice(0, -1);
    return s + suffix;
  }

  // ------------------------------------------------------------
  // Header band
  // ------------------------------------------------------------
  function drawHeader(ctx, strings){
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H_HEADER);

    ctx.fillStyle = CREAM;
    ctx.font = '600 32px ' + FONT_DISPLAY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(strings.title, 48, 50);

    ctx.fillStyle = 'rgba(250,247,242,0.72)';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.fillText(strings.subtitle, 48, 86);

    // Right-side date
    ctx.fillStyle = 'rgba(250,247,242,0.72)';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.textAlign = 'right';
    ctx.fillText(strings.date, W - 48, 86);

    ctx.fillStyle = CREAM;
    ctx.font = '500 13px ' + FONT_BODY;
    ctx.textAlign = 'right';
    ctx.fillText(strings.brand, W - 48, 50);
  }

  // ------------------------------------------------------------
  // Matrix panel — 2×2 with median split, dots, labels
  // ------------------------------------------------------------
  function drawMatrix(ctx, summary, strings){
    var top = H_HEADER;
    // Inset for matrix area
    var pad = 60;
    var x0 = pad;
    var x1 = W - pad;
    var y0 = top + 50;          // leave room for "The Matrix" title
    var y1 = top + H_MATRIX - 60; // leave room for axis label

    // Matrix title
    ctx.fillStyle = INK;
    ctx.font = '500 22px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.matrixTitle, pad, top + 16);

    // Background panel
    ctx.fillStyle = CREAM;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, x1 - x0 - 1, y1 - y0 - 1);

    var items = summary.items;
    if (!items.length) {
      ctx.fillStyle = STONE;
      ctx.font = '500 16px ' + FONT_BODY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(strings.matrixEmpty, (x0 + x1) / 2, (y0 + y1) / 2);
      return;
    }

    // Compute axis ranges. Same logic as the on-page SVG matrix so the
    // PNG matches what the user sees.
    var cms = items.map(function(i){ return i.cm_dollars; });
    var shares = items.map(function(i){ return i.share; });
    var minCm = Math.min.apply(null, cms.concat(0));
    var maxCm = Math.max.apply(null, cms);
    var maxShare = Math.max.apply(null, shares);
    if (maxCm === minCm) maxCm = minCm + 1;
    if (maxShare === 0) maxShare = 1;
    var cmRange = maxCm - minCm;
    minCm -= cmRange * 0.08;
    maxCm += cmRange * 0.08;
    maxShare = maxShare * 1.10;

    function sx(cm){ return x0 + ((cm - minCm) / (maxCm - minCm)) * (x1 - x0); }
    function sy(sh){ return y1 - (sh / maxShare) * (y1 - y0); }

    var medX = sx(summary.thresholds.median_cm_dollars);
    var medY = sy(summary.thresholds.median_share);

    // Quadrant tints (subtle)
    ctx.fillStyle = Q_TINTS.Star;      ctx.fillRect(medX, y0, x1 - medX, medY - y0);
    ctx.fillStyle = Q_TINTS.Plowhorse; ctx.fillRect(x0, y0, medX - x0, medY - y0);
    ctx.fillStyle = Q_TINTS.Puzzle;    ctx.fillRect(medX, medY, x1 - medX, y1 - medY);
    ctx.fillStyle = Q_TINTS.Dog;       ctx.fillRect(x0, medY, medX - x0, y1 - medY);

    // Median lines
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(medX, y0); ctx.lineTo(medX, y1);
    ctx.moveTo(x0, medY); ctx.lineTo(x1, medY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quadrant labels (plain English in the right corner of each cell)
    ctx.fillStyle = STONE;
    ctx.font = '500 13px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.quadrants.Plowhorse, x0 + 12, y0 + 10);
    ctx.textAlign = 'right';
    ctx.fillText(strings.quadrants.Star,      x1 - 12, y0 + 10);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(strings.quadrants.Dog,       x0 + 12, y1 - 10);
    ctx.textAlign = 'right';
    ctx.fillText(strings.quadrants.Puzzle,    x1 - 12, y1 - 10);

    // Axis labels
    ctx.fillStyle = INK;
    ctx.font = '500 13px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillText(strings.axisX, (x0 + x1) / 2, y1 + 18);
    // Y-axis label rotated
    ctx.save();
    ctx.translate(28, (y0 + y1) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(strings.axisY, 0, 0);
    ctx.restore();

    // Plot each item.
    items.forEach(function(it){
      var cx = sx(it.cm_dollars);
      var cy = sy(it.share);
      var color = Q_COLORS[it.quadrant] || INK;
      // Halo
      ctx.fillStyle = CREAM;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
      ctx.fill();
      // Label
      if (it.item) {
        ctx.fillStyle = INK;
        ctx.font = '500 12px ' + FONT_BODY;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        var label = clip(it.item, ctx, 180);
        ctx.fillText(label, cx + 12, cy);
      }
    });
  }

  // ------------------------------------------------------------
  // Action band — four-cell strip, one per quadrant
  // ------------------------------------------------------------
  function drawActions(ctx, summary, strings){
    var top = H_HEADER + H_MATRIX;
    var cellW = W / 4;
    var cellH = H_ACTIONS;

    // Section title
    ctx.fillStyle = INK;
    ctx.font = '500 22px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.actionsTitle, 60, top + 16);

    var bandTop = top + 60;
    var bandH = cellH - 60;

    // Group items by quadrant
    var byQ = { Star: [], Plowhorse: [], Puzzle: [], Dog: [] };
    summary.items.forEach(function(it){ if (byQ[it.quadrant]) byQ[it.quadrant].push(it); });

    var QORDER = ['Star', 'Plowhorse', 'Puzzle', 'Dog'];
    QORDER.forEach(function(q, i){
      var x = i * cellW;
      var y = bandTop;
      // Cell tint
      ctx.fillStyle = Q_TINTS[q];
      ctx.fillRect(x, y, cellW, bandH);
      // Left accent bar
      ctx.fillStyle = Q_COLORS[q];
      ctx.fillRect(x, y, 4, bandH);
      // Quadrant name + count
      ctx.fillStyle = INK;
      ctx.font = '600 18px ' + FONT_DISPLAY;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(strings.quadrantLabels[q] + ' (' + byQ[q].length + ')', x + 18, y + 16);

      // Headline + detail
      var action = strings.actions[q];
      ctx.fillStyle = INK;
      ctx.font = '600 13px ' + FONT_BODY;
      ctx.fillText(action.headline, x + 18, y + 44);

      ctx.fillStyle = STONE;
      ctx.font = '400 12px ' + FONT_BODY;
      var detailLines = wrapText(ctx, action.detail, cellW - 36);
      var dy = y + 64;
      detailLines.slice(0, 5).forEach(function(line){
        ctx.fillText(line, x + 18, dy);
        dy += 16;
      });

      // Item names — up to 5
      ctx.fillStyle = INK;
      ctx.font = '500 11px ui-monospace, SFMono-Regular, Consolas, monospace';
      var iy = dy + 12;
      var listed = byQ[q].slice(0, 5);
      listed.forEach(function(it){
        var name = clip(it.item || '(unnamed)', ctx, cellW - 80);
        var meta = '  ' + fmtMoney(it.cm_dollars) + ' · ' + fmtPct(it.share);
        ctx.fillText('• ' + name, x + 18, iy);
        ctx.fillStyle = STONE;
        ctx.fillText(meta, x + 18 + ctx.measureText('• ' + name).width, iy);
        ctx.fillStyle = INK;
        iy += 14;
        if (iy > y + bandH - 20) return;
      });
      if (byQ[q].length > 5) {
        ctx.fillStyle = STONE;
        ctx.font = 'italic 400 11px ' + FONT_BODY;
        ctx.fillText('+ ' + (byQ[q].length - 5) + ' more…', x + 18, iy);
      }
      if (byQ[q].length === 0) {
        ctx.fillStyle = STONE;
        ctx.font = 'italic 400 12px ' + FONT_BODY;
        ctx.fillText(strings.actionsEmpty, x + 18, iy);
      }
    });
  }

  // ------------------------------------------------------------
  // Footer strip
  // ------------------------------------------------------------
  function drawFooter(ctx, strings){
    ctx.fillStyle = INK;
    ctx.fillRect(0, H - H_FOOTER, W, H_FOOTER);
    ctx.fillStyle = CREAM;
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(strings.footerLeft, 24, H - H_FOOTER / 2);
    ctx.fillStyle = 'rgba(250,247,242,0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(strings.footerRight, W - 24, H - H_FOOTER / 2);
  }

  // ------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------
  function renderMenuCard(opts){
    opts = opts || {};
    var summary = opts.summary || { items: [], totals: {}, thresholds: { median_cm_dollars: 0, median_share: 0 } };
    var strings = opts.strings || DEFAULT_STRINGS_EN;

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = CREAM2;
    ctx.fillRect(0, 0, W, H);

    drawHeader(ctx, strings);
    drawMatrix(ctx, summary, strings);
    drawActions(ctx, summary, strings);
    drawFooter(ctx, strings);

    return canvas;
  }

  function canvasToPngBlob(canvas){
    return new Promise(function(resolve, reject){
      try {
        canvas.toBlob(function(blob){
          if (blob) resolve(blob); else reject(new Error('toBlob-null'));
        }, 'image/png');
      } catch (e) { reject(e); }
    });
  }

  // ------------------------------------------------------------
  // Default copy strings (the page passes locale-appropriate strings)
  // ------------------------------------------------------------
  var DEFAULT_STRINGS_EN = {
    title:    'Menu Action Plan',
    subtitle: 'Stars · Plowhorses · Puzzles · Dogs',
    brand:    'Muntin Digital',
    date:     new Date().toISOString().slice(0, 10),
    matrixTitle:  'The matrix',
    matrixEmpty:  'No items to plot.',
    actionsTitle: 'Action plan by quadrant',
    actionsEmpty: 'No items in this quadrant.',
    axisX:        'Contribution margin per sale  →',
    axisY:        '↑  Share of total covers',
    quadrants: {
      Star:      'Stars · push them',
      Plowhorse: 'Plowhorses · popular but thin',
      Puzzle:    'Puzzles · reposition',
      Dog:       'Dogs · drop or replace'
    },
    quadrantLabels: {
      Star:      'Stars',
      Plowhorse: 'Plowhorses',
      Puzzle:    'Puzzles',
      Dog:       'Dogs'
    },
    actions: {
      Star:      { headline: 'Protect them.',           detail: "These already work. Don't mess with the recipe; protect the price; feature them in photos and the server's spiel." },
      Plowhorse: { headline: 'Re-engineer the cost.',   detail: 'Popular but margin-thin. Walk the recipe back: a 5–10% portion or sourcing change can lift CM without losing volume.' },
      Puzzle:    { headline: 'Reposition them.',        detail: 'Profitable but ignored. Re-photograph, re-describe, move higher on the menu, train the staff to suggest.' },
      Dog:       { headline: 'Drop or replace.',        detail: "Low margin, low volume. Every Dog you keep is a slot you can't use for something better." }
    },
    footerLeft:  'Generated by Menu Engineering Matrix',
    footerRight: 'muntin.digital/tools/menu-engineering/'
  };

  var DEFAULT_STRINGS_ES = {
    title:    'Plan de acción del menú',
    subtitle: 'Estrellas · Caballos de tiro · Acertijos · Perros',
    brand:    'Muntin Digital',
    date:     new Date().toISOString().slice(0, 10),
    matrixTitle:  'La matriz',
    matrixEmpty:  'Sin platos para graficar.',
    actionsTitle: 'Plan de acción por cuadrante',
    actionsEmpty: 'Sin platos en este cuadrante.',
    axisX:        'Margen de contribución por venta  →',
    axisY:        '↑  Cuota de cubiertos vendidos',
    quadrants: {
      Star:      'Estrellas · impúlsalas',
      Plowhorse: 'Caballos de tiro · populares pero delgados',
      Puzzle:    'Acertijos · reposiciona',
      Dog:       'Perros · descarta o reemplaza'
    },
    quadrantLabels: {
      Star:      'Estrellas',
      Plowhorse: 'Caballos de tiro',
      Puzzle:    'Acertijos',
      Dog:       'Perros'
    },
    actions: {
      Star:      { headline: 'Protégelos.',                detail: 'Ya funcionan. No toques la receta; cuida el precio; lúcelos en fotos y en la sugerencia del mesero.' },
      Plowhorse: { headline: 'Re-ingeniería de costo.',    detail: 'Populares pero de margen delgado. Repasa la receta: un cambio de 5–10% en porción o proveedor puede subir el CM sin perder volumen.' },
      Puzzle:    { headline: 'Reposiciónalos.',            detail: 'Rentables pero ignorados. Re-fotografía, redescribe, súbelos en el menú, entrena al equipo a sugerirlos.' },
      Dog:       { headline: 'Descarta o reemplaza.',      detail: 'Bajo margen, bajo volumen. Cada Perro que mantienes es un espacio que no puedes usar para algo mejor.' }
    },
    footerLeft:  'Generado con Matriz de Ingeniería de Menú',
    footerRight: 'muntin.digital/es/tools/menu-engineering/'
  };

  var api = {
    renderMenuCard:      renderMenuCard,
    canvasToPngBlob:     canvasToPngBlob,
    DEFAULT_STRINGS_EN:  DEFAULT_STRINGS_EN,
    DEFAULT_STRINGS_ES:  DEFAULT_STRINGS_ES
  };

  if (typeof window !== 'undefined') window.MECard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
