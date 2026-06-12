/**
 * Plate Cost ✕ Cost Index — the connected loop (storefront half).
 *
 * Annotates each recipe row whose ingredient matches a Cost Index key with its
 * current WHOLESALE REFERENCE, and offers a one-tap "use as estimate" that fills
 * the AP price. This is the bridge a market move needs to reach "what this dish
 * now costs": type "Ribeye", see the live index read, start from it.
 *
 * HONESTY (load vs delivered): the index is a wholesale reference, never the
 * operator's delivered price. The hint says so, in words, every time; "use as
 * estimate" is a labelled starting point, not a claim about their invoice. Only
 * medium+ confidence dollar levels are offered (MuntinCostIndexLookup gates it).
 *
 * SAFE BY DESIGN: fully additive + fail-silent. It reads the seed
 * (window.MUNTIN_COST_INDEX) and the shared matcher (MuntinCostIndexLookup); if
 * either is missing, or the rows table isn't found, it does nothing. It never
 * edits the existing compute/render path — it appends a hint node to the
 * ingredient cell and, on "use", writes the AP inputs and dispatches the same
 * 'input' events a keystroke would, so the tool recomputes through its own code.
 */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  function init() {
    try {
      var rowsEl = document.getElementById('pcRows');
      var seed = window.MUNTIN_COST_INDEX;
      var lookup = window.MuntinCostIndexLookup;
      if (!rowsEl || !seed || !lookup || !lookup.match) return;

      var es = (document.documentElement.lang || 'en').slice(0, 2) === 'es';
      var base = es ? '/es' : '';

      var style = document.createElement('style');
      style.textContent =
        '.pc-ci-hint{display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin-top:5px;font-size:11.5px;line-height:1.35;color:#4A4F59}' +
        '.pc-ci-hint a{color:#2A50C8;text-decoration:none;border-bottom:1px dashed currentColor}' +
        '.pc-ci-hint__use{font:inherit;cursor:pointer;border:1px solid #2A50C8;color:#2A50C8;background:#fff;border-radius:999px;padding:1px 8px}' +
        '.pc-ci-hint__use:hover{background:#2A50C8;color:#fff}';
      document.head.appendChild(style);

      function money(c) { return '$' + (Math.round(c) / 100).toFixed(2); }

      function setField(tr, field, value) {
        var el = tr.querySelector('[data-field="' + field + '"]');
        if (!el) return;
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }

      function annotate(tr) {
        var input = tr.querySelector('[data-field="ingredient"]');
        if (!input) return;
        var cell = input.closest('td') || input.parentNode;
        var existing = cell.querySelector('.pc-ci-hint');
        var ref = input.value ? lookup.match(input.value, seed) : null;
        if (!ref || ref.wholesaleCents == null) { if (existing) existing.remove(); return; }

        var unit = es ? ref.unit_es : ref.unit_en;
        var label = es ? ref.label_es : ref.label_en;
        var price = money(ref.wholesaleCents) + '/' + unit;
        var lead = ref.tier === 'propose'
          ? (es ? 'Parece ' : 'Looks like ') + label + ': '
          : (es ? 'Índice de Costos: ' : 'Cost Index: ');
        var tail = es ? ' mayorista — el entregado suele ser mayor.' : ' wholesale — delivered usually higher.';

        var hint = existing || document.createElement('div');
        hint.className = 'pc-ci-hint';
        hint.textContent = '';
        var txt = document.createElement('span');
        var a = document.createElement('a');
        a.href = base + '/cost-index/' + ref.key + '/';
        a.textContent = '~' + price;
        a.title = es ? 'Ver la lectura completa' : 'See the full reading';
        txt.appendChild(document.createTextNode(lead));
        txt.appendChild(a);
        txt.appendChild(document.createTextNode(tail));
        hint.appendChild(txt);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pc-ci-hint__use';
        btn.textContent = es ? 'Usar como estimado' : 'Use as estimate';
        btn.addEventListener('click', function () {
          setField(tr, 'apPrice', (ref.wholesaleCents / 100).toFixed(2));
          setField(tr, 'apQty', '1');
          var unitSel = tr.querySelector('[data-field="apUnit"]');
          if (unitSel && Array.prototype.some.call(unitSel.options, function (o) { return o.value === ref.unit_en; })) {
            unitSel.value = ref.unit_en;
            unitSel.dispatchEvent(new Event('change', { bubbles: true }));
          }
          tr.setAttribute('data-ap-price-source', 'cost-index');
        });
        hint.appendChild(btn);

        if (!existing) cell.appendChild(hint);
      }

      function annotateAll() {
        Array.prototype.forEach.call(rowsEl.querySelectorAll('tr'), annotate);
      }

      var t = null;
      rowsEl.addEventListener('input', function (e) {
        var f = e.target && e.target.getAttribute && e.target.getAttribute('data-field');
        if (f !== 'ingredient') return;
        var tr = e.target.closest('tr');
        if (!tr) return;
        clearTimeout(t);
        t = setTimeout(function () { try { annotate(tr); } catch (_) {} }, 250);
      });

      // Re-annotate when rows are added/removed/re-rendered. childList only (not
      // subtree), so appending our own hint span inside a cell can't re-trigger.
      if (typeof MutationObserver !== 'undefined') {
        new MutationObserver(function () { try { annotateAll(); } catch (_) {} })
          .observe(rowsEl, { childList: true });
      }
      annotateAll();
    } catch (_) { /* fail-silent: the calculator must work without this */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
