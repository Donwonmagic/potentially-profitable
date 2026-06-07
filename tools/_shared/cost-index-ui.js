/* Cost Index — market-context overlay. Renders for everyone (public data),
   independent of saved invoices. Reads window.MUNTIN_COST_INDEX (seed artifact,
   no fetch) and runs MuntinCompositePrice.assess() in the browser. Pure DOM
   construction + textContent (no innerHTML) so it can't inject and stays within
   the no-innerHTML budget. Locale-aware via <html lang>, so EN + ES share it. */
(function () {
  'use strict';
  var card = document.getElementById('cpMarketCard');
  var listEl = document.getElementById('cpMarketList');
  var DATA = (typeof window !== 'undefined') ? window.MUNTIN_COST_INDEX : null;
  if (!card || !listEl || !DATA || typeof MuntinCompositePrice === 'undefined') return;

  var es = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2) === 'es';
  function L(en, esStr) { return es ? esStr : en; }
  function money(c) { return '$' + (Math.round(c) / 100).toFixed(2); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  // Pick a series to draw: prefer a dollar (non-index) series, longest wins.
  function pickSeries(input) {
    var ss = (input && input.sourceSeries) || {};
    var best = null, bestLen = 0, bestDollar = false;
    Object.keys(ss).forEach(function (k) {
      var s = ss[k];
      if (!s || !Array.isArray(s.values)) return;
      var isDollar = s.basis !== 'index';
      if ((isDollar && !bestDollar) || (isDollar === bestDollar && s.values.length > bestLen)) {
        best = s.values; bestLen = s.values.length; bestDollar = isDollar;
      }
    });
    return best;
  }
  // Trend sparkline as DOM-built SVG (no innerHTML). Decorative (aria-hidden);
  // the figure's data-audio-alt + sr-only line carry the numbers. No animation,
  // so it's reduced-motion-safe and adds no layout shift.
  function sparkSvg(values, dir) {
    var NS = 'http://www.w3.org/2000/svg';
    var w = 132, h = 30, pad = 3;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', String(w)); svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('class', 'cp-market-spark'); svg.setAttribute('aria-hidden', 'true');
    var vals = values.filter(function (v) { return typeof v === 'number' && isFinite(v); });
    if (vals.length < 2) return svg;
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), span = (max - min) || 1;
    var step = (w - 2 * pad) / (vals.length - 1);
    var color = dir === 'up' ? 'var(--rust)' : dir === 'down' ? 'var(--teal)' : 'var(--stone)';
    var pts = vals.map(function (v, i) {
      var x = pad + i * step, y = h - pad - ((v - min) / span) * (h - 2 * pad);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    var pl = document.createElementNS(NS, 'polyline');
    pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', color);
    pl.setAttribute('stroke-width', '1.5'); pl.setAttribute('stroke-linejoin', 'round'); pl.setAttribute('stroke-linecap', 'round');
    pl.setAttribute('points', pts);
    svg.appendChild(pl);
    var lx = pad + (vals.length - 1) * step, ly = h - pad - ((vals[vals.length - 1] - min) / span) * (h - 2 * pad);
    var dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('cx', lx.toFixed(1)); dot.setAttribute('cy', ly.toFixed(1)); dot.setAttribute('r', '2.2'); dot.setAttribute('fill', color);
    svg.appendChild(dot);
    return svg;
  }

  document.getElementById('cpMarketHeading').textContent = L("What the market's doing", 'Qué hace el mercado');
  document.getElementById('cpMarketDek').textContent = L(
    'Wholesale and index signals for common ingredients, blended across public sources. Use it to tell a real market move from a vendor markup.',
    'Señales de mayoreo e índices para ingredientes comunes, combinadas de fuentes públicas. Úsalo para distinguir un movimiento real del mercado de un sobreprecio del proveedor.');
  if (DATA.status === 'preview') {
    var pv = document.getElementById('cpMarketPreview');
    pv.hidden = false;
    pv.textContent = L(
      'Sample preview — illustrative figures, not live market data. Live USDA, BLS, and FRED sources connect soon.',
      'Vista de muestra — cifras ilustrativas, no datos de mercado en vivo. Las fuentes USDA, BLS y FRED se conectan pronto.');
  }

  var confWordMap = {
    high: L('high', 'alta'), medium: L('medium', 'media'),
    low: L('low', 'baja'), directional: L('directional', 'direccional')
  };

  (DATA.ingredients || []).forEach(function (ing) {
    var r = MuntinCompositePrice.assess(ing.input || {});
    var name = L(ing.label_en, ing.label_es);
    var unit = L(ing.unit_en || 'unit', ing.unit_es || 'unidad');
    var lvl = r.level;
    var single = !lvl || lvl.nFamilies <= 1 || lvl.rangeCents[0] === lvl.rangeCents[1];
    var rangeText = !lvl
      ? L('No clear price level yet', 'Sin nivel de precio claro aún')
      : single
        ? L('About ' + money(lvl.rangeCents[0]) + ' a ' + unit + ' (one source — range not measurable yet)',
            'Cerca de ' + money(lvl.rangeCents[0]) + ' por ' + unit + ' (una fuente — rango aún no medible)')
        : L('About ' + money(lvl.rangeCents[0]) + '–' + money(lvl.rangeCents[1]) + ' a ' + unit,
            'Cerca de ' + money(lvl.rangeCents[0]) + '–' + money(lvl.rangeCents[1]) + ' por ' + unit);

    var pct = r.trend.pct;
    var dirWord = r.trend.dir === 'up' ? L('up', 'arriba') : r.trend.dir === 'down' ? L('down', 'abajo') : L('flat', 'estable');
    var pctTxt = pct == null ? '' : Math.abs(Math.round(pct * 100)) + '%';
    var trendText = pct == null
      ? L('Not enough history yet for a trend', 'Sin suficiente historial para una tendencia')
      : L(dirWord + ' ' + pctTxt + ' over the window', dirWord + ' ' + pctTxt + ' en el periodo');

    var conf = confWordMap[r.confidence] || r.confidence;
    var nSrc = (r.trend && r.trend.nSources) || (lvl ? lvl.nSources : 0);
    var metaText = (r.asOf ? L('As of ', 'Al ') + r.asOf + ' · ' : '') + nSrc + ' ' + L('sources', 'fuentes');

    var fig = el('figure', 'cp-market-item');
    fig.setAttribute('data-audio-alt',
      name + '. ' + rangeText + '. ' + L('The market is ', 'El mercado va ') + trendText + ', ' +
      conf + ' ' + L('confidence', 'confianza') + '. ' + metaText + '.');

    var head = el('div', 'cp-market-head');
    head.appendChild(el('span', 'cp-market-name', name));
    var chip = el('span', 'cp-conf', conf);
    chip.setAttribute('data-level', r.confidence);
    head.appendChild(chip);
    fig.appendChild(head);

    fig.appendChild(el('p', 'cp-market-range', rangeText));
    var tEl = el('p', 'cp-market-trend', (r.trend.dir === 'up' ? '▲ ' : r.trend.dir === 'down' ? '▼ ' : '● ') + trendText);
    tEl.setAttribute('data-dir', r.trend.dir);
    fig.appendChild(tEl);

    var sparkVals = pickSeries(ing.input);
    if (sparkVals && sparkVals.length >= 2) fig.appendChild(sparkSvg(sparkVals, r.trend.dir));

    if (ing.seasonal) {
      fig.appendChild(el('p', 'cp-market-seasonal',
        L('Looks seasonal — it may ease, so holding is often smarter than re-pricing.',
          'Parece de temporada — podría bajar, así que mantener suele ser mejor que subir el precio.')));
    }

    fig.appendChild(el('p', 'cp-market-meta', metaText));

    // Provenance drawer — which sources fed this read.
    var prov = el('details', 'cp-market-prov');
    prov.appendChild(el('summary', null, L('Where this comes from', 'De dónde viene')));
    var ul = el('ul', null);
    (r.provenance || []).forEach(function (p) {
      var kind = p.kind === 'level' ? L('level', 'nivel') : L('trend', 'tendencia');
      ul.appendChild(el('li', null, p.source + ' (' + kind + (p.date ? ', ' + p.date : '') + ')'));
    });
    prov.appendChild(ul);
    fig.appendChild(prov);

    fig.appendChild(el('figcaption', null,
      L('Read the range first, then the direction — and check whether your invoice agrees.',
        'Lee primero el rango, luego la dirección — y revisa si tu factura coincide.')));

    // Screen-reader numbers table.
    var srt = el('div', 'cp-sr-only');
    var caption = name + ': ' + rangeText + '; ' + trendText + '; ' + conf + ' ' + L('confidence', 'confianza') + '; ' + metaText + '.';
    srt.appendChild(el('p', null, caption));
    fig.appendChild(srt);

    listEl.appendChild(fig);
  });

  var cta = document.getElementById('cpMarketCta');
  cta.appendChild(document.createTextNode(L('Want this checked against your own invoices? ', '¿Quieres comparar esto con tus propias facturas? ')));
  var a = el('a', 'plausible-event-name=Ledger+Route+Click plausible-event-source=cost-pulse-market', 'Muntin Ledger');
  a.href = 'https://ledger.muntin.digital/';
  cta.appendChild(a);
  cta.appendChild(document.createTextNode(L(
    ' tells you if your vendor is above market on a line — and re-costs the dishes that use it.',
    ' te dice si tu proveedor está por encima del mercado en una línea — y recuesta los platillos que la usan.')));

  card.hidden = false;
})();
