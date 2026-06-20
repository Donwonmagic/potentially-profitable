/**
 * Fair-Price Gap — the market half of Muntin Bench (storefront panel).
 *
 * Bench compares a price to the operator's OWN history. This panel adds the
 * other yardstick: the same item + price placed against the live Cost Index
 * wholesale reference — the conflict-free market a distributor can't honestly
 * give you. Compute lives in tools/_shared/fair-price-gap.js (MuntinFairPriceGap),
 * which keeps the honesty rule: the index is a WHOLESALE reference, delivered
 * runs higher, so a price above the reference is NOT called overpaying — only an
 * EXTREME gap raises a directional "worth asking" flag.
 *
 * SAFE BY DESIGN: additive + fail-silent (mirrors cost-index-hint.js). Reads the
 * seed + module; if either is missing, or the form isn't found, it does nothing.
 * It never touches Bench's own compute/render; textContent only, so a typed item
 * can't inject markup.
 */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  function init() {
    try {
      var seed = window.MUNTIN_COST_INDEX;
      var FPG = window.MuntinFairPriceGap;
      var form = document.getElementById('vbForm');
      var itemEl = document.getElementById('vbItem');
      var latestEl = document.getElementById('vbLatest');
      var unitEl = document.getElementById('vbUnit');
      var resultEl = document.getElementById('vbResult');
      if (!seed || !FPG || !FPG.assess || !form || !itemEl || !latestEl || !unitEl || !resultEl) return;

      var es = (document.documentElement.lang || 'en').slice(0, 2) === 'es';
      var base = es ? '/es' : '';

      var style = document.createElement('style');
      style.textContent =
        '#vbMarketGap{margin:14px 0 0;border:1px solid #E4E0D8;border-radius:12px;padding:13px 15px;background:#FbFaF7;font-size:13px;line-height:1.5;color:#2B2F36}' +
        '#vbMarketGap h3{font-size:13px;margin:0 0 4px;color:#1A1C20;text-transform:uppercase;letter-spacing:.04em}' +
        '#vbMarketGap .vbmg-num{font-weight:600}' +
        '#vbMarketGap .vbmg-ask{margin-top:8px;padding:8px 10px;border-radius:8px;background:#F6E7E2;color:#8E3A24}' +
        '#vbMarketGap .vbmg-tail{font-size:11.5px;color:#6B7079;margin-top:6px}' +
        '#vbMarketGap a{color:#2A50C8;text-decoration:none;border-bottom:1px dashed currentColor}';
      document.head.appendChild(style);

      var panel = document.createElement('div');
      panel.id = 'vbMarketGap';
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-live', 'polite');
      panel.hidden = true;
      if (resultEl.parentNode) resultEl.parentNode.insertBefore(panel, resultEl.nextSibling);

      function money(c) { return '$' + (Math.round(c) / 100).toFixed(2); }
      function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
      function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

      function render() {
        var item = (itemEl.value || '').trim();
        var latest = parseFloat(latestEl.value);
        if (!item || !(latest > 0)) { panel.hidden = true; clear(panel); return; }
        var r;
        try { r = FPG.assess({ item: item, paidCents: Math.round(latest * 100), unit: unitEl.value, seed: seed }); }
        catch (_) { panel.hidden = true; return; }

        clear(panel);
        panel.appendChild(el('h3', null, es ? 'Frente al mercado' : 'Versus the market'));

        if (!r.matched) { panel.appendChild(el('p', null, es ? 'Aún no hay referencia de mercado para este artículo.' : 'No Cost Index reference for this item yet.')); panel.hidden = false; return; }

        if (!r.comparable) {
          var msg;
          if (r.reason === 'unit-mismatch') msg = es ? 'No se puede comparar esta unidad con la del mercado (por ' + r.marketUnit + ') sin el tamaño del paquete.' : 'Can’t compare this unit to the market unit (per ' + r.marketUnit + ') without the pack size.';
          else msg = es ? 'Rastreado en el Índice, pero aún sin nivel mayorista firme — solo dirección.' : 'Tracked in the Cost Index, but no firm wholesale level yet — direction only.';
          panel.appendChild(el('p', null, msg));
          var lk0 = el('p', 'vbmg-tail'); var a0 = el('a', null, es ? 'Ver la lectura' : 'See the reading'); a0.href = base + '/cost-index/' + r.costIndexKey + '/'; lk0.appendChild(a0); panel.appendChild(lk0);
          panel.hidden = false; return;
        }

        var sign = r.gapPct > 0 ? '+' : '';
        var line = el('p');
        line.appendChild(document.createTextNode((es ? 'Referencia mayorista del Índice: ~' : 'Cost Index wholesale reference: ~') + money(r.marketCents) + '/' + r.marketUnit + ' (' + (r.confidence || '') + '). '));
        line.appendChild(el('span', 'vbmg-num', (es ? 'Pagas ' : 'You’re ') + sign + r.gapPct + '% ' + (es ? 'vs la referencia.' : 'vs the reference.')));
        panel.appendChild(line);

        if (r.worthAsking) {
          panel.appendChild(el('p', 'vbmg-ask', (es
            ? sign + r.gapPct + '% está muy por encima de un margen de entrega normal. Vale la pena preguntar a tu proveedor o cotizar un segundo — la compra agregada suele ahorrar 10–30%.'
            : sign + r.gapPct + '% is well beyond a normal delivered markup. Worth asking your rep, or pricing a second vendor — aggregated buying typically saves 10–30%.')));
        } else if (r.verdict === 'below-reference') {
          panel.appendChild(el('p', null, es ? 'Por debajo de la referencia — verifica la especificación o el paquete.' : 'Below the reference — double-check the spec or pack size.'));
        }

        var tail = el('p', 'vbmg-tail');
        tail.appendChild(document.createTextNode(es ? 'Referencia mayorista — tu precio entregado suele ser mayor. ' : 'Wholesale reference — your delivered price normally runs higher. '));
        var a = el('a', null, es ? 'Ver la lectura completa' : 'See the full reading'); a.href = base + '/cost-index/' + r.costIndexKey + '/';
        tail.appendChild(a);
        panel.appendChild(tail);
        panel.hidden = false;
      }

      var t = null;
      form.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { try { render(); } catch (_) {} }, 300); });
      form.addEventListener('submit', function () { setTimeout(function () { try { render(); } catch (_) {} }, 0); });
    } catch (_) { /* fail-silent: Bench must work without this */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
