/**
 * Menu Copy Inspector — Copy Card renderer.
 *
 * Composes a 1200×1500 PNG that takes the shape of the annotation
 * overlay itself: each item's original copy on one side, the
 * diagnostic gloss on the other. The signature deliverable for this
 * tool — a single shareable image a chef, copywriter, or accountant
 * can email or print without ever needing the URL.
 *
 * Privacy invariants (mirrors menu-engineering/card-render.js):
 *   - Pure rendering. No fetch, no storage, no DOM mutation outside
 *     the offscreen canvas this module creates.
 *   - Output via canvas.toBlob() so bytes stay same-origin.
 *
 * Usage:
 *   const canvases = renderCopyCards({ summary, strings });
 *   canvases is an array — multi-item menus produce multiple cards,
 *   each capped at MAX_ITEMS_PER_CARD items.
 *   canvasToPngBlob(canvas).then(blob => download(blob));
 */

(function(){
  // ------------------------------------------------------------
  // Geometry. Total canvas 1200×1500:
  //   header   0    .. 120   (120 px)  — ink ground, title + date
  //   body     120  .. 1200  (1080 px) — 4 item rows × 270 px
  //   legend   1200 .. 1440  (240 px)  — colour code + teaching notes
  //   footer   1440 .. 1500  (60 px)
  // ------------------------------------------------------------
  var W              = 1200;
  var H              = 1500;
  var H_HEADER       = 120;
  var H_BODY         = 1080;
  var H_LEGEND       = 240;
  var H_FOOTER       = 60;
  var MAX_ITEMS_PER_CARD = 4;
  var ROW_H          = 270;

  var INK            = '#14161A';
  var CREAM          = '#FAF7F2';
  var CREAM2         = '#F2EEE5';
  var STONE          = '#5A5752';
  var LINE           = '#E5E0D8';

  var MARK_COLORS = {
    sensory:    '#1F4E5B',
    provenance: '#3A6BB3',
    technique:  '#C68A2C',
    hedge:      '#B8541A'
  };
  var VERDICT_COLORS = {
    polish:  '#1F4E5B',
    edit:    '#C68A2C',
    rewrite: '#B8541A'
  };

  var FONT_DISPLAY = '"Fraunces", "Times New Roman", serif';
  var FONT_BODY    = '"Inter", -apple-system, "Segoe UI", sans-serif';
  var FONT_SERIF   = 'Georgia, "Times New Roman", serif';

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
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

  function clip(ctx, text, maxWidth, suffix) {
    suffix = suffix == null ? '…' : suffix;
    if (ctx.measureText(text).width <= maxWidth) return text;
    var s = String(text);
    while (s.length > 1 && ctx.measureText(s + suffix).width > maxWidth) s = s.slice(0, -1);
    return s + suffix;
  }

  // Build a flat token-stream from the description that lets us draw
  // the annotated copy with per-token marks. Each token is an object
  // {text, kind} where kind is null or one of sensory/provenance/
  // technique/hedge. Whitespace tokens keep kind null.
  function tokenizeWithMarks(description, scored) {
    var marks = {};
    function mark(words, kind, priority){
      (words || []).forEach(function(w){
        var t = String(w).toLowerCase().replace(/[.,;:!?]+$/g, '');
        if (!marks[t] || marks[t].priority < priority) {
          marks[t] = { kind: kind, priority: priority };
        }
      });
    }
    if (scored) {
      mark(scored.hedges.hits.map(function(h){ return h.word; }), 'hedge', 4);
      mark(scored.sensory.hits.map(function(h){ return h.word; }), 'sensory', 3);
      mark(scored.technique.hits, 'technique', 2);
      mark(scored.provenance.hits.map(function(h){ return h.word; }), 'provenance', 1);
    }
    var parts = String(description || '').split(/(\s+)/);
    return parts.map(function(part){
      if (/^\s+$/.test(part) || !part) return { text: part, kind: null };
      var stripped = part.toLowerCase().replace(/^[^a-z0-9]+/, '').replace(/[^a-z0-9'-]+$/, '');
      var hit = marks[stripped] || marks[part.toLowerCase().replace(/[.,;:!?]+$/g, '')];
      return { text: part, kind: hit ? hit.kind : null };
    });
  }

  // Draw a single text run with optional underline mark. Advances
  // the cursor; wraps at maxRight; returns the new (x, y).
  function drawAnnotatedTokens(ctx, tokens, x0, y, maxRight, lineHeight, font) {
    ctx.font = font;
    ctx.textBaseline = 'alphabetic';
    var x = x0;
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i];
      if (!tok.text) continue;
      var w = ctx.measureText(tok.text).width;
      // Wrap: if non-whitespace and would overflow, break to next line.
      if (!/^\s+$/.test(tok.text) && x + w > maxRight) {
        x = x0;
        y += lineHeight;
      }
      // Hedge: paint a soft background highlight first.
      if (tok.kind === 'hedge') {
        ctx.fillStyle = 'rgba(184,84,26,0.10)';
        ctx.fillRect(x, y - lineHeight + 6, w, lineHeight - 4);
      }
      // Draw the text.
      ctx.fillStyle = INK;
      ctx.fillText(tok.text, x, y);
      // Underline if marked.
      if (tok.kind && MARK_COLORS[tok.kind]) {
        ctx.strokeStyle = MARK_COLORS[tok.kind];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x + w, y + 4);
        ctx.stroke();
      }
      x += w;
    }
    return { x: x, y: y };
  }

  // ------------------------------------------------------------
  // Header
  // ------------------------------------------------------------
  function drawHeader(ctx, strings, idx, total) {
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

    var pageLabel = total > 1 ? (strings.page + ' ' + (idx + 1) + ' / ' + total) : '';
    ctx.fillStyle = 'rgba(250,247,242,0.72)';
    ctx.textAlign = 'right';
    ctx.font = '500 14px ' + FONT_BODY;
    ctx.fillText(strings.date, W - 48, 86);
    if (pageLabel) {
      ctx.fillStyle = CREAM;
      ctx.font = '500 13px ' + FONT_BODY;
      ctx.fillText(pageLabel, W - 48, 50);
    } else {
      ctx.fillStyle = CREAM;
      ctx.font = '500 13px ' + FONT_BODY;
      ctx.fillText(strings.brand, W - 48, 50);
    }
  }

  // ------------------------------------------------------------
  // One item row — annotated description on left, scorecard right.
  // ------------------------------------------------------------
  function drawItemRow(ctx, item, top, strings) {
    var pad = 32;
    var divider = Math.round(W * 0.62);          // left/right column split
    var leftRight = divider - 24;
    var rightLeft = divider + 8;

    // Background card
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(pad, top + 12, W - pad * 2, ROW_H - 24);
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 0.5, top + 12.5, W - pad * 2 - 1, ROW_H - 24 - 1);

    // Left column — name + annotated description.
    ctx.fillStyle = INK;
    ctx.font = '600 18px ' + FONT_BODY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(clip(ctx, item.name || '(' + strings.unnamed + ')', leftRight - pad - 16), pad + 16, top + 30);

    if (item.price) {
      ctx.fillStyle = STONE;
      ctx.font = '500 14px ui-monospace, SFMono-Regular, Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(item.price, leftRight - 8, top + 32);
      ctx.textAlign = 'left';
    }

    // Annotated description, drawn token-by-token with inline marks.
    var tokens = tokenizeWithMarks(item.description, item);
    drawAnnotatedTokens(ctx, tokens, pad + 16, top + 80, leftRight - 16, 26, '500 16px ' + FONT_SERIF);

    // Right column — scorecard.
    var rx = rightLeft;
    var ry = top + 28;

    // Verdict pill + score
    ctx.fillStyle = VERDICT_COLORS[item.verdict] || INK;
    var pillW = 100, pillH = 28;
    if (ctx.roundRect) {
      ctx.beginPath(); ctx.roundRect(rx, ry, pillW, pillH, 999); ctx.fill();
    } else {
      ctx.fillRect(rx, ry, pillW, pillH);
    }
    ctx.fillStyle = CREAM;
    ctx.font = '700 11px ' + FONT_BODY;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(String(item.verdict).toUpperCase(), rx + pillW / 2, ry + pillH / 2 + 1);

    ctx.fillStyle = INK;
    ctx.font = '600 26px ui-monospace, SFMono-Regular, Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(String(item.score), rx + pillW + 18, ry + pillH / 2);
    ctx.fillStyle = STONE;
    ctx.font = '500 12px ' + FONT_BODY;
    ctx.fillText('/ 100', rx + pillW + 18 + ctx.measureText(String(item.score)).width + 4, ry + pillH / 2 + 4);

    // Six metric bars
    var metrics = [
      { label: strings.metricSensory,  value: item.sensory.count + ' words', n: Math.min(item.sensory.count, 5) / 5, color: MARK_COLORS.sensory },
      { label: strings.metricProvenance, value: item.provenance.count + ' signals', n: Math.min(item.provenance.count, 4) / 4, color: MARK_COLORS.provenance },
      { label: strings.metricTechnique, value: item.technique.count + ' words', n: Math.min(item.technique.count, 4) / 4, color: MARK_COLORS.technique },
      { label: strings.metricLength,    value: item.length.words + ' words', n: ({ 'in-range': 1, 'short-edge': 0.6, 'long-edge': 0.6, 'short': 0.2, 'long': 0.2 })[item.length.verdict] || 0, color: STONE },
      { label: strings.metricHedge,     value: item.hedges.count + ' flagged', n: 1 - Math.min(item.hedges.count, 5) / 5, color: MARK_COLORS.hedge },
      { label: strings.metricPricing,   value: item.pricing.hasPrice ? item.pricing.raw : '—', n: item.pricing.hasPrice ? 0.7 : 0, color: '#7A6FB3' }
    ];
    var barTop = ry + pillH + 22;
    metrics.forEach(function(m, i){
      var by = barTop + i * 30;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.font = '600 10px ' + FONT_BODY;
      ctx.fillStyle = STONE;
      ctx.fillText(String(m.label).toUpperCase(), rx, by);
      ctx.fillStyle = INK;
      ctx.font = '500 12px ' + FONT_BODY;
      ctx.textAlign = 'right';
      ctx.fillText(String(m.value), W - 48, by);
      // Bar
      var bw = W - 48 - rx;
      ctx.fillStyle = LINE;
      ctx.fillRect(rx, by + 16, bw, 4);
      ctx.fillStyle = m.color;
      ctx.fillRect(rx, by + 16, Math.max(2, bw * Math.max(0, Math.min(1, m.n))), 4);
    });
  }

  // ------------------------------------------------------------
  // Legend strip — teaches the reader of the printed Card what each
  // color means, without needing to open the URL.
  // ------------------------------------------------------------
  function drawLegend(ctx, strings) {
    var top = H_HEADER + H_BODY;
    ctx.fillStyle = CREAM2;
    ctx.fillRect(0, top, W, H_LEGEND);
    ctx.fillStyle = INK;
    ctx.font = '500 18px ' + FONT_DISPLAY;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(strings.legendTitle, 48, top + 18);

    var items = [
      { kind: 'sensory',    title: strings.legend.sensory.title,    body: strings.legend.sensory.body },
      { kind: 'provenance', title: strings.legend.provenance.title, body: strings.legend.provenance.body },
      { kind: 'technique',  title: strings.legend.technique.title,  body: strings.legend.technique.body },
      { kind: 'hedge',      title: strings.legend.hedge.title,      body: strings.legend.hedge.body }
    ];
    var colW = (W - 48 * 2 - 24 * 3) / 4;
    var rowY = top + 60;
    items.forEach(function(it, i){
      var x = 48 + i * (colW + 24);
      // Color underline beneath title
      ctx.strokeStyle = MARK_COLORS[it.kind];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, rowY);
      ctx.lineTo(x + 24, rowY);
      ctx.stroke();
      // Title
      ctx.fillStyle = INK;
      ctx.font = '600 13px ' + FONT_BODY;
      ctx.textBaseline = 'top';
      ctx.fillText(it.title, x, rowY + 8);
      // Body (wrapped)
      ctx.fillStyle = STONE;
      ctx.font = '400 12px ' + FONT_BODY;
      var bodyLines = wrapText(ctx, it.body, colW);
      bodyLines.slice(0, 6).forEach(function(line, li){
        ctx.fillText(line, x, rowY + 32 + li * 16);
      });
    });
  }

  // ------------------------------------------------------------
  // Footer
  // ------------------------------------------------------------
  function drawFooter(ctx, strings) {
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
  // Public API. Returns an ARRAY of canvases — one per page; each
  // page holds up to MAX_ITEMS_PER_CARD items. The page header
  // shows page X / Y when total > 1.
  // ------------------------------------------------------------
  function renderCopyCards(opts) {
    opts = opts || {};
    var summary = opts.summary || { items: [] };
    var items = summary.items || [];
    var strings = opts.strings || DEFAULT_STRINGS_EN;

    if (!items.length) {
      var canvas = makeCanvas();
      var ctx = canvas.getContext('2d');
      drawBackdrop(ctx);
      drawHeader(ctx, strings, 0, 1);
      ctx.fillStyle = STONE;
      ctx.font = '500 18px ' + FONT_BODY;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(strings.empty, W / 2, H_HEADER + H_BODY / 2);
      drawLegend(ctx, strings);
      drawFooter(ctx, strings);
      return [canvas];
    }

    // Chunk items into pages of MAX_ITEMS_PER_CARD.
    var pages = [];
    for (var i = 0; i < items.length; i += MAX_ITEMS_PER_CARD) {
      pages.push(items.slice(i, i + MAX_ITEMS_PER_CARD));
    }
    return pages.map(function(page, idx){
      var canvas = makeCanvas();
      var ctx = canvas.getContext('2d');
      drawBackdrop(ctx);
      drawHeader(ctx, strings, idx, pages.length);
      page.forEach(function(item, ri){
        drawItemRow(ctx, item, H_HEADER + ri * ROW_H, strings);
      });
      drawLegend(ctx, strings);
      drawFooter(ctx, strings);
      return canvas;
    });
  }

  function makeCanvas() {
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    return canvas;
  }
  function drawBackdrop(ctx) {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, W, H);
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

  // ------------------------------------------------------------
  // Default copy strings — page passes locale-appropriate strings.
  // ------------------------------------------------------------
  var DEFAULT_STRINGS_EN = {
    title:    'Menu Copy Diagnostics',
    subtitle: 'A teaching tool — not a rewriter',
    brand:    'Muntin Digital',
    page:     'Page',
    date:     new Date().toISOString().slice(0, 10),
    unnamed:  'unnamed',
    empty:    'No items to diagnose.',
    metricSensory:    'Sensory',
    metricProvenance: 'Provenance',
    metricTechnique:  'Technique',
    metricLength:     'Length',
    metricHedge:      'Hedge',
    metricPricing:    'Pricing',
    legendTitle: 'How to read this',
    legend: {
      sensory:    { title: 'Sensory adjective', body: 'Flavor / texture / temperature / preparation. Wansink (2005) found descriptive labels lift selection +27% on average.' },
      provenance: { title: 'Provenance signal', body: 'A named producer, region, breed, or aging duration. Lifts selection 13–20% in restaurant studies.' },
      technique:  { title: 'Technique word',    body: 'What was DONE to the food. Communicates competence; an Aaker-style brand-claim signal.' },
      hedge:      { title: 'Hedge word',        body: '"Just", "simply", "fresh", "delicious" — Cornell research links these to reduced selection rate. Drag.' }
    },
    footerLeft:  'Generated by Menu Copy Inspector',
    footerRight: 'muntin.digital/tools/menu-copy/'
  };

  var DEFAULT_STRINGS_ES = {
    title:    'Diagnóstico de copy de menú',
    subtitle: 'Una herramienta para enseñar — no para reescribir',
    brand:    'Muntin Digital',
    page:     'Página',
    date:     new Date().toISOString().slice(0, 10),
    unnamed:  'sin nombre',
    empty:    'Sin platos para diagnosticar.',
    metricSensory:    'Sensorial',
    metricProvenance: 'Procedencia',
    metricTechnique:  'Técnica',
    metricLength:     'Extensión',
    metricHedge:      'Relleno',
    metricPricing:    'Precio',
    legendTitle: 'Cómo leer esto',
    legend: {
      sensory:    { title: 'Adjetivo sensorial', body: 'Sabor / textura / temperatura / preparación. Wansink (2005) halló que las etiquetas descriptivas elevan la selección +27% en promedio.' },
      provenance: { title: 'Señal de procedencia', body: 'Un productor nombrado, región, raza, o tiempo de añejamiento. Eleva la selección 13–20% en estudios.' },
      technique:  { title: 'Palabra de técnica', body: 'Lo que se le HIZO a la comida. Comunica competencia; señal de marca tipo Aaker.' },
      hedge:      { title: 'Palabra de relleno', body: '"Just", "simply", "fresh", "delicioso" — investigación de Cornell las liga con menor tasa de selección. Arrastra.' }
    },
    footerLeft:  'Generado con Inspector de Copy de Menú',
    footerRight: 'muntin.digital/es/tools/menu-copy/'
  };

  var api = {
    renderCopyCards:    renderCopyCards,
    canvasToPngBlob:    canvasToPngBlob,
    DEFAULT_STRINGS_EN: DEFAULT_STRINGS_EN,
    DEFAULT_STRINGS_ES: DEFAULT_STRINGS_ES,
    MAX_ITEMS_PER_CARD: MAX_ITEMS_PER_CARD
  };

  if (typeof window !== 'undefined') window.MCCard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
