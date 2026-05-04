/* Article viz module — Phase-1 scaffold.
 *
 * Self-bootstrapping; no exports. Loaded with <script src="…" defer>
 * only on article pages that opt in (the page builder emits the tag
 * when it detects [data-viz] in the page body, or the article author
 * adds it inline). The .reveal IntersectionObserver in assets/site.js
 * already handles the .viz-bars[data-animate="grow"] entry-into-view
 * trigger for free — that's why this module does NOT include a
 * reveal observer; we don't want two observers fighting over the
 * same elements.
 *
 * Phase-1 capabilities (light, deferred, perf-aware):
 *   - data-viz-sortable: click <th> to sort the table by that column
 *   - data-viz-slider:   range input that recomputes a derived
 *                        textContent/attribute on linked targets
 *
 * Phase-2 will add: BeforeAfterSlider clip-path driver, scrollytelling
 * step toggler. All compositor-only animations; bail out cleanly when
 * prefers-reduced-motion is set.
 *
 * Size budget: ~3 KB minified. If this module grows past ~6 KB,
 * split per-feature. */

(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  var reduced = false;
  try {
    reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (_) { /* old browsers — assume motion ok */ }

  // ============================================================
  // Sortable tables (table[data-viz-sortable])
  //
  // Click any <th> to sort by that column. Numeric vs string detection
  // is automatic: if every cell in the column parses as a number
  // (after stripping $, %, commas, en-dash minus, parentheses for
  // negatives), the column sorts numerically. Otherwise locale-aware
  // string compare.
  //
  // Toggles ascending/descending on repeated clicks; sets
  // aria-sort="ascending|descending|none" for screen readers.
  // ============================================================
  function parseNumeric(s) {
    if (s == null) return NaN;
    var t = String(s)
      .replace(/[−–—]/g, '-')   // unicode minuses → ASCII -
      .replace(/[$,\s%]/g, '')
      .replace(/^\((.*)\)$/, '-$1');           // (3.14) → -3.14
    if (t === '' || t === '-') return NaN;
    var n = parseFloat(t);
    return isFinite(n) ? n : NaN;
  }

  function bindSortableTable(table) {
    var thead = table.tHead;
    if (!thead || !thead.rows.length) return;
    var headerRow = thead.rows[0];
    var ths = headerRow.cells;
    var tbody = table.tBodies[0];
    if (!tbody) return;

    for (var i = 0; i < ths.length; i++) {
      (function (th, colIdx) {
        if (th.dataset.vizSortableSkip === 'true') return;
        th.tabIndex = 0;
        th.setAttribute('aria-sort', 'none');
        th.style.cursor = 'pointer';
        th.style.userSelect = 'none';

        function toggle() {
          var rows = Array.prototype.slice.call(tbody.rows);
          var current = th.getAttribute('aria-sort');
          var nextDir = current === 'ascending' ? 'descending' : 'ascending';

          // Reset siblings.
          for (var j = 0; j < ths.length; j++) {
            if (ths[j] !== th) ths[j].setAttribute('aria-sort', 'none');
          }
          th.setAttribute('aria-sort', nextDir);

          var allNumeric = rows.every(function (r) {
            var c = r.cells[colIdx];
            return c && !isNaN(parseNumeric(c.textContent));
          });

          rows.sort(function (a, b) {
            var av = a.cells[colIdx] ? a.cells[colIdx].textContent : '';
            var bv = b.cells[colIdx] ? b.cells[colIdx].textContent : '';
            var cmp;
            if (allNumeric) {
              cmp = parseNumeric(av) - parseNumeric(bv);
            } else {
              cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
            }
            return nextDir === 'ascending' ? cmp : -cmp;
          });

          var frag = document.createDocumentFragment();
          for (var k = 0; k < rows.length; k++) frag.appendChild(rows[k]);
          tbody.appendChild(frag);
        }

        th.addEventListener('click', toggle);
        th.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });
      })(ths[i], i);
    }
  }

  // ============================================================
  // Linked sliders ([data-viz-slider])
  //
  // <input type="range" data-viz-slider data-target="#out" data-format="currency">
  // Updates target.textContent on input. Supports formats: 'currency',
  // 'percent', 'number', 'raw' (default).
  //
  // For more elaborate widgets (the DoorDash CostWaterfall commission
  // slider), pages can subscribe to the same input directly with their
  // own listener — this module just covers the simple cases.
  // ============================================================
  function fmt(value, kind) {
    var n = parseFloat(value);
    if (!isFinite(n)) return String(value);
    if (kind === 'currency') return '$' + n.toFixed(2);
    if (kind === 'percent')  return n.toFixed(1) + '%';
    if (kind === 'number')   return n.toLocaleString();
    return String(value);
  }

  function bindLinkedSlider(input) {
    var sel = input.dataset.target;
    if (!sel) return;
    var target = document.querySelector(sel);
    if (!target) return;
    var kind = input.dataset.format || 'raw';
    function update() { target.textContent = fmt(input.value, kind); }
    input.addEventListener('input', update);
    update();
  }

  // ============================================================
  // Cost waterfall ([data-viz-waterfall])
  //
  // Drives a .viz-waterfall widget from a single range input. Config
  // is JSON on the wrapper:
  //
  //   <div class="viz-waterfall" data-viz-waterfall
  //        data-vw-config='{"ticket":42,"variableSeg":"commission",
  //                         "baseRate":0.30,"baseKeep":0.184}'>
  //     ...segments + legend rows...
  //     <input type="range" data-vw-slider min="15" max="35" value="30">
  //   </div>
  //
  // When the slider moves, the segment marked
  // [data-vw-seg="commission"] grows/shrinks and the [data-vw-seg=
  // "keep"] segment absorbs the difference (so total stays 1.0). The
  // matching legend rows update their dollar + percent text. Other
  // segments stay constant. Layout properties (flex-basis) are ok to
  // animate here because the parent .viz-waterfall has a fixed height
  // and width — no document reflow.
  // ============================================================
  function bindWaterfall(root) {
    var slider = root.querySelector('input[type="range"][data-vw-slider]');
    if (!slider) return;
    var cfg;
    try { cfg = JSON.parse(root.dataset.vwConfig || '{}'); }
    catch (_) { cfg = {}; }
    var ticket    = +cfg.ticket    || 0;
    var variable  = cfg.variableSeg || 'commission';
    var baseRate  = +cfg.baseRate  || 0;
    var baseKeep  = +cfg.baseKeep  || 0;
    if (!ticket || !baseRate || !baseKeep) return;

    var variableSeg = root.querySelector('[data-vw-seg="' + variable + '"]');
    var keepSeg     = root.querySelector('[data-vw-seg="keep"]');
    var variableRow = root.querySelector('[data-vw-row="' + variable + '"]');
    var keepRow     = root.querySelector('[data-vw-row="keep"]');
    var displays    = root.querySelectorAll('[data-vw-display]');

    function setText(el, sel, val) {
      if (!el) return;
      var t = el.querySelector(sel);
      if (t) t.textContent = val;
    }

    function update() {
      var rate = parseFloat(slider.value) / 100;
      if (!isFinite(rate)) return;

      // Range-shape the slider track fill (--p custom property)
      var min = parseFloat(slider.min) || 0;
      var max = parseFloat(slider.max) || 100;
      var pct = ((parseFloat(slider.value) - min) / (max - min)) * 100;
      slider.style.setProperty('--p', pct + '%');

      var keepRate = baseKeep - (rate - baseRate);
      if (keepRate < 0) keepRate = 0;

      if (variableSeg) variableSeg.style.setProperty('--w', rate.toFixed(4));
      if (keepSeg)     keepSeg.style.setProperty('--w', keepRate.toFixed(4));

      // Segment text labels (the percent badge inside each segment).
      if (variableSeg) variableSeg.textContent = (rate * 100).toFixed(rate < 0.10 ? 1 : 0) + '%';
      if (keepSeg)     keepSeg.textContent     = (keepRate * 100).toFixed(1) + '%';

      // Legend rows — dollar amount + percent of ticket.
      setText(variableRow, '[data-vw-amount]', (ticket * rate).toFixed(2));
      setText(variableRow, '[data-vw-pct]',    (rate * 100).toFixed(1));
      setText(keepRow,     '[data-vw-amount]', (ticket * keepRate).toFixed(2));
      setText(keepRow,     '[data-vw-pct]',    (keepRate * 100).toFixed(1));

      // Any [data-vw-display] echoes the rate as an integer percent
      // (e.g., the "30%" inline in the prose / slider readout).
      for (var i = 0; i < displays.length; i++) {
        displays[i].textContent = (rate * 100).toFixed(0);
      }
    }

    slider.addEventListener('input', update);
    update();
  }

  // ============================================================
  // Boot
  // ============================================================
  function boot() {
    var tables = document.querySelectorAll('table[data-viz-sortable]');
    for (var i = 0; i < tables.length; i++) bindSortableTable(tables[i]);

    var sliders = document.querySelectorAll('input[type="range"][data-viz-slider]');
    for (var j = 0; j < sliders.length; j++) bindLinkedSlider(sliders[j]);

    var waterfalls = document.querySelectorAll('[data-viz-waterfall]');
    for (var k = 0; k < waterfalls.length; k++) bindWaterfall(waterfalls[k]);
  }

  // Suppress unused-var warning while preserving the reference for
  // Phase-2 features that will branch on reduced motion.
  void reduced;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
