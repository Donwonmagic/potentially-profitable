/**
 * Live Plate Margin — the menu-wide market-recost panel (storefront half).
 *
 * Reads the operator's saved dishes (MuntinContext) and recosts each one against
 * the live Cost Index (MuntinPlateMarketRecost), then renders a compact
 * "your menu at today's market" panel: which dishes drifted, by how much, and
 * which crossed below their food-cost target — with NO invoices, NO account,
 * NO Decoder. The Cost Index alone earns this.
 *
 * HONESTY: the index is a WHOLESALE reference, never the delivered price; the
 * panel says so in words. Unpriced and fuzzy-matched ingredients are excluded
 * from the dollar figures and the coverage line shows it ("covers N of M").
 *
 * SAFE BY DESIGN: fully additive + fail-silent, exactly like cost-index-hint.js.
 * It reads the bus + seed + engine; if any is missing, or there are no saved
 * dishes with a firm market match, it renders nothing and removes its own node.
 * It never edits the existing compute/render path; textContent only (a dish or
 * ingredient name the operator typed can never inject markup).
 */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var PANEL_ID = 'pcMarketRecost';

  function init() {
    try {
      var ctx = window.MuntinContext;
      var seed = window.MUNTIN_COST_INDEX;
      var engine = window.MuntinPlateMarketRecost;
      if (!ctx || typeof ctx.read !== 'function' || !seed || !engine || !engine.compute) return;

      var es = (document.documentElement.lang || 'en').slice(0, 2) === 'es';
      var base = es ? '/es' : '';

      var style = document.createElement('style');
      style.textContent =
        '#' + PANEL_ID + '{margin:18px 0 0;border:1px solid #E4E0D8;border-radius:12px;padding:14px 16px;background:#FbFaF7;font-size:13px;line-height:1.5;color:#2B2F36}' +
        '#' + PANEL_ID + ' h3{font-size:14px;margin:0 0 4px;color:#1A1C20}' +
        '#' + PANEL_ID + ' .pc-mr-note{font-size:11.5px;color:#6B7079;margin:0 0 10px}' +
        '#' + PANEL_ID + ' .pc-mr-dish{padding:8px 0;border-top:1px solid #EEEAE1}' +
        '#' + PANEL_ID + ' .pc-mr-dish:first-of-type{border-top:0}' +
        '#' + PANEL_ID + ' .pc-mr-name{font-weight:600}' +
        '#' + PANEL_ID + ' .pc-mr-up{color:#A8412A;font-weight:600}' +
        '#' + PANEL_ID + ' .pc-mr-down{color:#2F7A53;font-weight:600}' +
        '#' + PANEL_ID + ' .pc-mr-pill{display:inline-block;font-size:11px;font-weight:600;color:#A8412A;background:#F6E7E2;border-radius:999px;padding:1px 8px;margin-left:6px}' +
        '#' + PANEL_ID + ' .pc-mr-cover{font-size:11.5px;color:#6B7079}' +
        '#' + PANEL_ID + ' .pc-mr-drv{font-size:11.5px;color:#4A4F59;margin:2px 0 0}' +
        '#' + PANEL_ID + ' .pc-mr-drv a{color:#2A50C8;text-decoration:none;border-bottom:1px dashed currentColor}';
      document.head.appendChild(style);

      function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }
      function pct(n) { return (n > 0 ? '+' : '') + n.toFixed(1) + '%'; }
      function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
      }

      function anchor() {
        return document.getElementById('pcResult') ||
               document.getElementById('pcActions') ||
               document.querySelector('main');
      }

      function renderDish(entry) {
        var wrap = el('div', 'pc-mr-dish');
        var head = el('div');
        head.appendChild(el('span', 'pc-mr-name', entry.dish + ' '));
        var up = entry.deltaPct >= 0;
        head.appendChild(el('span', up ? 'pc-mr-up' : 'pc-mr-down',
          money(entry.enteredPlateCost) + ' → ' + money(entry.marketPlateCost) + '  (' + pct(entry.deltaPct) + ')'));
        if (entry.belowTarget) {
          head.appendChild(el('span', 'pc-mr-pill',
            (es ? 'Bajo objetivo de margen' : 'Below target margin')));
        }
        wrap.appendChild(head);

        if (entry.marketFoodCostPct != null) {
          wrap.appendChild(el('div', 'pc-mr-cover',
            (es ? 'Costo de alimento: ' : 'Food cost: ') +
            entry.enteredFoodCostPct.toFixed(1) + '% → ' + entry.marketFoodCostPct.toFixed(1) +
            '% (' + (es ? 'objetivo ' : 'target ') + entry.targetPct + '%)'));
        }

        var top = entry.drivers && entry.drivers[0];
        if (top) {
          var d = el('div', 'pc-mr-drv');
          d.appendChild(document.createTextNode((es ? 'Mayor causa: ' : 'Top driver: ') + top.ingredient + ' '));
          var a = el('a', null, money(top.marketPerPortion) + (es ? '/porción' : '/portion'));
          a.href = base + '/cost-index/' + top.costIndexKey + '/';
          d.appendChild(a);
          wrap.appendChild(d);
        }

        var skipped = (entry.totalLines - entry.coveredLines);
        if (skipped > 0) {
          wrap.appendChild(el('div', 'pc-mr-cover',
            (es ? 'Cubre ' : 'Covers ') + entry.coveredLines + (es ? ' de ' : ' of ') + entry.totalLines +
            (es ? ' ingredientes (los no indexados se excluyen).' : ' ingredients (unpriced ones excluded).')));
        }
        return wrap;
      }

      function render() {
        var existing = document.getElementById(PANEL_ID);
        var data = ctx.read() || {};
        var dishes = Array.isArray(data.dishes) ? data.dishes : [];
        var entries = [];
        try { entries = engine.compute({ seed: seed, dishes: dishes }) || []; } catch (_) { entries = []; }

        if (!entries.length) { if (existing) existing.remove(); return; }

        var host = anchor();
        if (!host) return;

        var panel = existing || el('section');
        panel.id = PANEL_ID;
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-live', 'polite');
        panel.textContent = '';

        panel.appendChild(el('h3', null,
          (es ? 'Margen del plato en vivo — tu menú al mercado de hoy' : 'Live plate margin — your menu at today’s market')));
        panel.appendChild(el('p', 'pc-mr-note',
          (es
            ? 'Recosteado con el Índice de Costos de Muntin (referencia mayorista — tu precio entregado suele ser mayor). Sin facturas, sin cuenta.'
            : 'Recosted against the Muntin Cost Index (wholesale reference — your delivered price is usually higher). No invoices, no account.')));

        entries.slice(0, 8).forEach(function (entry) { panel.appendChild(renderDish(entry)); });

        if (!existing) {
          if (host.parentNode) host.parentNode.insertBefore(panel, host.nextSibling);
          else host.appendChild(panel);
        }
      }

      // Recompute on load, on cross-tab bus writes, and (debounced) when the
      // operator edits the recipe grid in this tab.
      render();
      if (typeof ctx.subscribe === 'function') { try { ctx.subscribe(render); } catch (_) {} }
      var t = null;
      document.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { try { render(); } catch (_) {} }, 450);
      });
    } catch (_) { /* fail-silent: the calculator must work without this */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
