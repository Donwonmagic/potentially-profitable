/*
 * Operator Sheets — SVG-only visualization helpers.
 *
 * Two functions, no library, no canvas. Both return an SVG string
 * the caller can drop into the DOM via innerHTML. Print stylesheet
 * hides .sheet-viz so heatmaps don't blow up the printable form.
 *
 *   window.SheetViz.sparkline(values, opts) → SVG string
 *   window.SheetViz.heatmap(grid, opts)     → SVG string
 *
 * Both are zero-dependency, pure functions of inputs. No reads from
 * the network, no analytics on the values. They preserve the
 * "your numbers never leave the page" posture by definition.
 */
(function () {
  'use strict';

  if (window.SheetViz) return; // idempotent

  // Brand tokens that match the existing band scheme.
  var BAND_COLOR = {
    good: '#1F6B3A',
    warn: '#8A3E16',
    bad:  '#B8541A',
    idle: '#6B6B6B',
  };
  var TEAL = '#1F4E5B';
  var INK_SOFT = '#2A2D33';
  var CREAM_2 = '#F3EEE3';

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  /**
   * sparkline(values, opts)
   *
   * @param {Array<number>} values   small series, e.g. last 4-12 saves
   * @param {Object}        opts
   * @param {string=}       opts.band  'good'|'warn'|'bad'|'idle' — line + dot color
   * @param {number=}       opts.width   default 120
   * @param {number=}       opts.height  default 28
   * @param {string=}       opts.label   accessible label (rendered as <title>)
   *
   * Returns: '<svg ...>…</svg>' string. Empty/short series → empty string.
   */
  function sparkline(values, opts) {
    opts = opts || {};
    if (!Array.isArray(values)) return '';
    var clean = values.filter(isNum);
    if (clean.length < 2) return '';
    var w = opts.width  || 120;
    var h = opts.height || 28;
    var pad = 2;
    var min = Math.min.apply(null, clean);
    var max = Math.max.apply(null, clean);
    var range = max - min || 1; // avoid divide-by-zero on flat lines
    var step = clean.length > 1 ? (w - pad * 2) / (clean.length - 1) : 0;

    var points = clean.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - ((v - min) / range) * (h - pad * 2);
      return [x, y];
    });

    var color = BAND_COLOR[opts.band] || TEAL;
    var path = points.map(function (p, i) {
      return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    }).join(' ');
    var last = points[points.length - 1];
    var title = opts.label ? '<title>' + escapeXml(opts.label) + '</title>' : '';
    var fill = '<path d="' + path + ' L' + last[0].toFixed(1) + ' ' + h + ' L' + pad + ' ' + h + ' Z" fill="' + color + '" opacity="0.08"/>';

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + escapeAttr(opts.label || 'Trend') + '">',
      title,
      fill,
      '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      '<circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="2.4" fill="' + color + '"/>',
      '</svg>',
    ].join('');
  }

  /**
   * heatmap(grid, opts)
   *
   * @param {Array<Array<number>>} grid     2D matrix of values
   * @param {Object}               opts
   * @param {Array<string>=}       opts.colLabels  optional X-axis labels
   * @param {Array<string>=}       opts.rowLabels  optional Y-axis labels
   * @param {number=}              opts.cellSize   default 18
   * @param {string=}              opts.label      accessible <title>
   *
   * Single-hue ramp (cream → teal); the value's normalized position
   * sets opacity. Empty cells render as cream.
   */
  function heatmap(grid, opts) {
    opts = opts || {};
    if (!Array.isArray(grid) || !grid.length) return '';
    var rows = grid.length;
    var cols = grid[0].length;
    var cell = opts.cellSize || 18;
    var labelW = opts.rowLabels ? 56 : 0;
    var labelH = opts.colLabels ? 16 : 0;
    var w = labelW + cols * cell + 2;
    var h = labelH + rows * cell + 2;

    // Find min/max of finite values.
    var min = Infinity, max = -Infinity;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var v = grid[r][c];
        if (isNum(v)) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    if (!isFinite(min)) return '';
    var range = max - min || 1;

    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + escapeAttr(opts.label || 'Heatmap') + '">',
    ];
    if (opts.label) parts.push('<title>' + escapeXml(opts.label) + '</title>');

    // Column labels (above grid).
    if (opts.colLabels) {
      for (var ci = 0; ci < cols; ci++) {
        var cx = labelW + ci * cell + cell / 2;
        parts.push('<text x="' + cx + '" y="' + (labelH - 4) + '" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="9" fill="' + INK_SOFT + '" font-weight="600">' + escapeXml(String(opts.colLabels[ci] || '')) + '</text>');
      }
    }

    // Cells + row labels.
    for (var ri = 0; ri < rows; ri++) {
      var cy = labelH + ri * cell + cell / 2;
      if (opts.rowLabels) {
        parts.push('<text x="' + (labelW - 6) + '" y="' + (cy + 3) + '" text-anchor="end" font-family="Inter, system-ui, sans-serif" font-size="9" fill="' + INK_SOFT + '" font-weight="600">' + escapeXml(String(opts.rowLabels[ri] || '')) + '</text>');
      }
      for (var col = 0; col < cols; col++) {
        var x = labelW + col * cell;
        var y = labelH + ri * cell;
        var val = grid[ri][col];
        var alpha = isNum(val) ? clamp((val - min) / range, 0, 1) * 0.85 + 0.06 : 0;
        var fillColor = isNum(val) ? TEAL : CREAM_2;
        parts.push('<rect x="' + x + '" y="' + y + '" width="' + (cell - 1) + '" height="' + (cell - 1) + '" fill="' + fillColor + '" fill-opacity="' + alpha.toFixed(3) + '" stroke="' + CREAM_2 + '" stroke-width="0.5"/>');
      }
    }

    parts.push('</svg>');
    return parts.join('');
  }

  function escapeXml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c];
    });
  }
  function escapeAttr(s) { return escapeXml(s); }

  window.SheetViz = {
    sparkline: sparkline,
    heatmap: heatmap,
  };
})();
