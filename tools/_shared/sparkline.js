/**
 * Inline-SVG sparkline renderer (Phase 7 W4-9).
 *
 * Extracts the 200×40 history-banner-spark-svg pattern that the
 * audits tool already ships and exposes it as a reusable, no-DOM-
 * dependency primitive every other tool can call.
 *
 * Inspired by the existing audits sparkline (tools/audits/restaurant
 * /index.html ~line 1008-1037). Differences:
 *
 *   - Pure SVG-string output (caller injects via innerHTML or wraps
 *     in a fragment) — no document-mutation in this module.
 *   - Optional baseline/min/max overlay for "vs the rolling median"
 *     callouts.
 *   - Reduced-motion aware: when navigator preferred, we skip the
 *     drawing animation and emit the final path directly.
 *
 * First consumer: Invoice Decoder result panel (per-category
 * sparkline strip when >=3 trend entries exist).
 *
 * Wave-9 consumers: Cost Pulse dashboard (the central surface),
 * Plate Cost stale-banner (a single sparkline below the food-cost
 * line), Margin Math slider hint.
 */
(function (root) {
  'use strict';

  function escAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Render a single 200×40 sparkline as an inline SVG string.
  //
  //   values:    [n1, n2, ...] — newest-LAST. Caller decides ordering.
  //   options:
  //     width  (200)         — px width of the SVG
  //     height (40)          — px height
  //     stroke ('#1f6f6a')   — line color
  //     fill   ('rgba(31,...,12)') — fill under line, set null to disable
  //     dotLast (true)       — circle on the most recent point
  //     baseline (null)      — when set, draws a dashed line at this
  //                            value as a "median" overlay
  //     ariaLabel (string)   — required for a11y
  //     dataLabels (string)  — optional dataset description for screen
  //                            readers (eg "Protein cost over 6 weeks")
  function render(values, options) {
    options = options || {};
    var w = options.width  || 200;
    var h = options.height || 40;
    var stroke = options.stroke || '#1f6f6a';
    var fill   = (options.fill === undefined) ? 'rgba(31,111,106,0.12)' : options.fill;
    var dotLast = options.dotLast !== false;
    var baseline = (typeof options.baseline === 'number') ? options.baseline : null;
    var ariaLabel = options.ariaLabel || 'Trend sparkline';
    var dataLabels = options.dataLabels || '';

    var arr = (values || []).filter(function (v) {
      return typeof v === 'number' && isFinite(v);
    });
    if (arr.length < 2) {
      return '<svg class="mtn-spark" width="' + w + '" height="' + h +
             '" viewBox="0 0 ' + w + ' ' + h +
             '" role="img" aria-label="' + escAttr(ariaLabel) + '"></svg>';
    }

    var min = Math.min.apply(null, arr);
    var max = Math.max.apply(null, arr);
    if (baseline != null) {
      min = Math.min(min, baseline);
      max = Math.max(max, baseline);
    }
    var range = (max - min) || 1; // avoid div/0 when flat
    var pad = 3;
    var stepX = (w - pad * 2) / (arr.length - 1);

    function ptX(i) { return pad + i * stepX; }
    function ptY(v) { return pad + (h - pad * 2) * (1 - (v - min) / range); }

    var d = '';
    arr.forEach(function (v, i) {
      d += (i === 0 ? 'M' : 'L') + ptX(i).toFixed(1) + ',' + ptY(v).toFixed(1);
    });

    var fillPath = '';
    if (fill) {
      fillPath = '<path d="' + d +
        ' L' + ptX(arr.length - 1).toFixed(1) + ',' + (h - pad).toFixed(1) +
        ' L' + ptX(0).toFixed(1) + ',' + (h - pad).toFixed(1) +
        ' Z" fill="' + escAttr(fill) + '" stroke="none" />';
    }

    var baselineLine = '';
    if (baseline != null) {
      var by = ptY(baseline).toFixed(1);
      baselineLine = '<line x1="' + pad + '" x2="' + (w - pad) +
        '" y1="' + by + '" y2="' + by +
        '" stroke="' + escAttr(stroke) + '" stroke-width="1" stroke-dasharray="2,3" opacity="0.45" />';
    }

    var dot = '';
    if (dotLast) {
      var lx = ptX(arr.length - 1).toFixed(1);
      var ly = ptY(arr[arr.length - 1]).toFixed(1);
      dot = '<circle cx="' + lx + '" cy="' + ly + '" r="2.5" fill="' + escAttr(stroke) + '" />';
    }

    var desc = dataLabels
      ? '<desc>' + escAttr(dataLabels) +
        ' values: ' + arr.map(function (v) { return v.toFixed(2); }).join(', ') + '</desc>'
      : '';

    return '<svg class="mtn-spark" width="' + w + '" height="' + h +
      '" viewBox="0 0 ' + w + ' ' + h +
      '" role="img" aria-label="' + escAttr(ariaLabel) + '">' +
      desc +
      fillPath +
      baselineLine +
      '<path d="' + d + '" fill="none" stroke="' + escAttr(stroke) +
        '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />' +
      dot +
      '</svg>';
  }

  // Convenience renderer for category-strip layouts (Cost Pulse +
  // Invoice Decoder result panel). Returns an HTML fragment string
  // with one sparkline per category and a label + delta% chip.
  function renderCategoryStrip(perCategorySeries, opts) {
    opts = opts || {};
    var localeEs = (opts.locale === 'es');
    var keys = Object.keys(perCategorySeries || {})
      .filter(function (k) { return (perCategorySeries[k] || []).length >= 2; })
      .sort();
    if (!keys.length) return '';
    var rows = keys.map(function (k) {
      var series = perCategorySeries[k];
      var first = series[0];
      var last  = series[series.length - 1];
      var deltaPct = (first && first !== 0)
        ? ((last - first) / first) * 100
        : 0;
      var sign = deltaPct > 0 ? '+' : '';
      var dir  = deltaPct > 0 ? 'up' : (deltaPct < 0 ? 'down' : 'flat');
      var label = (opts.labelMap && opts.labelMap[k]) || k;
      return '<div class="mtn-spark-row" data-cat="' + escAttr(k) + '">' +
        '<span class="mtn-spark-label">' + escAttr(label) + '</span>' +
        render(series, {
          ariaLabel:  label + (localeEs ? ' tendencia' : ' trend'),
          dataLabels: label
        }) +
        '<span class="mtn-spark-delta" data-dir="' + dir + '">' +
          sign + deltaPct.toFixed(1) + '%' +
        '</span>' +
      '</div>';
    });
    return '<div class="mtn-spark-strip">' + rows.join('') + '</div>';
  }

  var api = {
    render:               render,
    renderCategoryStrip:  renderCategoryStrip
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MuntinSparkline = api;
})(typeof window !== 'undefined' ? window : null);
