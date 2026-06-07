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

  // "Your basket" — track ingredients; the selection (never prices) lives in the
  // URL hash (#basket=romaine,butter), so it is shareable with no storage and no
  // fetch. Arriving with a basket link opens in "only tracked" view.
  var basket = {};
  (function () {
    var m = (location.hash || '').match(/[#&]basket=([^&]*)/);
    if (m) decodeURIComponent(m[1]).split(',').forEach(function (k) { if (k) basket[k] = 1; });
  })();
  var basketOnly = Object.keys(basket).length > 0;
  var query = '';
  function basketKeys() { return Object.keys(basket); }
  function writeBasket() {
    var keys = basketKeys();
    try {
      if (keys.length) history.replaceState(null, '', '#basket=' + keys.map(encodeURIComponent).join(','));
      else history.replaceState(null, '', location.pathname + location.search);
    } catch (e) { /* history may be unavailable */ }
  }
  function applyFilters() {
    var keys = basketKeys();
    Array.prototype.forEach.call(listEl.querySelectorAll('.cp-market-item'), function (c) {
      var k = c.getAttribute('data-key') || '';
      var nm = c.getAttribute('data-name') || '';
      var hideByQuery = query !== '' && nm.indexOf(query) === -1;
      var hideByBasket = basketOnly && keys.length > 0 && !basket[k];
      c.hidden = hideByQuery || hideByBasket;
    });
  }
  function trackButton(key) {
    var on = !!basket[key];
    var b = el('button', 'cp-track', on ? L('★ Tracking', '★ Siguiendo') : L('☆ Track', '☆ Seguir'));
    b.type = 'button';
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', L('Track this ingredient', 'Seguir este ingrediente'));
    b.addEventListener('click', function () {
      if (basket[key]) delete basket[key]; else basket[key] = 1;
      var now = !!basket[key];
      b.setAttribute('aria-pressed', now ? 'true' : 'false');
      b.textContent = now ? L('★ Tracking', '★ Siguiendo') : L('☆ Track', '☆ Seguir');
      writeBasket();
      updateBasketBar();
      applyFilters();
    });
    return b;
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
  function parseMoney(v) {
    var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.]/g, ''));
    return isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
  }
  // "Where you sit" band — CSP-safe SVG (rects only, preserveAspectRatio none).
  // Shows the p25–p75 typical band, the median tick, and the operator's price
  // as a pin (rust above band / teal below / ink inside). Decorative; the
  // verdict text carries the meaning.
  function bandSvg(p25, p75, median, userCents) {
    var NS = 'http://www.w3.org/2000/svg';
    var W = 240, H = 34, pad = 8;
    var lo = Math.min(p25, userCents), hi = Math.max(p75, userCents);
    var spanRaw = (hi - lo) || Math.max(1, hi);
    lo -= spanRaw * 0.12; hi += spanRaw * 0.12;
    var span = (hi - lo) || 1;
    function X(v) { return pad + ((v - lo) / span) * (W - 2 * pad); }
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '100%'); svg.setAttribute('height', String(H));
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'cp-band'); svg.setAttribute('aria-hidden', 'true');
    function rect(x, y, w, h, fill) {
      var r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', x.toFixed(1)); r.setAttribute('y', String(y));
      r.setAttribute('width', Math.max(0.5, w).toFixed(1)); r.setAttribute('height', String(h));
      r.setAttribute('fill', fill); svg.appendChild(r);
    }
    rect(pad, 16, W - 2 * pad, 2, 'var(--line)');           // baseline
    rect(X(p25), 13, X(p75) - X(p25), 8, 'var(--cream-2)');  // typical band
    rect(X(median) - 0.75, 10, 1.5, 14, 'var(--stone)');     // median tick
    var pos = userCents < p25 ? 'below' : userCents > p75 ? 'above' : 'in';
    var pin = pos === 'above' ? 'var(--rust)' : pos === 'below' ? 'var(--teal)' : 'var(--ink)';
    rect(X(userCents) - 1.25, 6, 2.5, 22, pin);              // your pin
    return svg;
  }
  function renderYou(out, lvl, val) {
    while (out.firstChild) out.removeChild(out.firstChild);
    var cents = parseMoney(val);
    if (cents == null) return;
    var p25 = lvl.rangeCents[0], p75 = lvl.rangeCents[1], median = lvl.medianCents;
    var pos = cents < p25 ? 'below' : cents > p75 ? 'above' : 'in';
    out.appendChild(bandSvg(p25, p75, median, cents));
    var band = money(p25) + '–' + money(p75);
    var verdict = el('p', 'cp-you-verdict',
      pos === 'above'
        ? L('You pay ' + money(cents) + ' — above the typical ' + band + '. Worth a vendor conversation.',
            'Pagas ' + money(cents) + ' — arriba del rango típico ' + band + '. Vale una conversación con tu proveedor.')
        : pos === 'below'
          ? L('You pay ' + money(cents) + ' — below the typical ' + band + '. Good deal.',
              'Pagas ' + money(cents) + ' — abajo del rango típico ' + band + '. Buen precio.')
          : L('You pay ' + money(cents) + ' — right in the typical ' + band + '.',
              'Pagas ' + money(cents) + ' — dentro del rango típico ' + band + '.'));
    verdict.setAttribute('data-pos', pos);
    out.appendChild(verdict);
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

  var movers = [];
  (DATA.ingredients || []).forEach(function (ing) {
    var r = MuntinCompositePrice.assess(ing.input || {});
    var name = L(ing.label_en, ing.label_es);
    var unit = L(ing.unit_en || 'unit', ing.unit_es || 'unidad');
    var lvl = r.level;
    movers.push({ name: name, dir: r.trend.dir, pct: r.trend.pct });
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
    if (ing.key) fig.id = 'ci-' + ing.key;          // deep anchor: /…/#ci-romaine
    if (ing.key) fig.setAttribute('data-key', ing.key); // for the basket
    fig.setAttribute('data-name', name.toLowerCase()); // for the filter
    fig.setAttribute('data-audio-alt',
      name + '. ' + rangeText + '. ' + L('The market is ', 'El mercado va ') + trendText + ', ' +
      conf + ' ' + L('confidence', 'confianza') + '. ' + metaText + '.');

    var head = el('div', 'cp-market-head');
    head.appendChild(el('span', 'cp-market-name', name));
    var chip = el('span', 'cp-conf', conf);
    chip.setAttribute('data-level', r.confidence);
    var headRight = el('span', 'cp-head-right');
    headRight.appendChild(chip);
    if (ing.key) headRight.appendChild(trackButton(ing.key));
    head.appendChild(headRight);
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

    // "Where do you sit?" — operator types their price, sees it pinned on the
    // band. A free taste of vendor-vs-market; only when there's a real level.
    if (lvl) {
      var you = el('div', 'cp-you');
      var lab = el('label', 'cp-you-label');
      lab.setAttribute('for', 'cpYou-' + ing.key);
      lab.appendChild(document.createTextNode(
        L('What do you pay? ($ a ' + unit + ', optional)', '¿Cuánto pagas? ($ por ' + unit + ', opcional)')));
      var inp = el('input', 'cp-you-input');
      inp.type = 'text'; inp.id = 'cpYou-' + ing.key; inp.inputMode = 'decimal';
      inp.setAttribute('autocomplete', 'off'); inp.placeholder = '$';
      var youOut = el('div', 'cp-you-out');
      youOut.setAttribute('role', 'status'); youOut.setAttribute('aria-live', 'polite');
      (function (o, level) {
        inp.addEventListener('input', function () { renderYou(o, level, inp.value); });
      })(youOut, lvl);
      you.appendChild(lab); you.appendChild(inp); you.appendChild(youOut);
      fig.appendChild(you);
    }

    // Screen-reader numbers table.
    var srt = el('div', 'cp-sr-only');
    var caption = name + ': ' + rangeText + '; ' + trendText + '; ' + conf + ' ' + L('confidence', 'confianza') + '; ' + metaText + '.';
    srt.appendChild(el('p', null, caption));
    fig.appendChild(srt);

    listEl.appendChild(fig);
  });

  // Scan-level orientation above the cards: lead with the gestalt, then detail.
  var ups = movers.filter(function (m) { return m.dir === 'up'; }).length;
  var downs = movers.filter(function (m) { return m.dir === 'down'; }).length;
  var biggest = movers.slice().filter(function (m) { return m.pct != null; })
    .sort(function (a, b) { return Math.abs(b.pct) - Math.abs(a.pct); })[0];
  var sum = el('p', 'cp-market-summary');
  var sumText = L(movers.length + ' ingredients tracked. ', movers.length + ' ingredientes. ')
    + L(ups + ' rising, ' + downs + ' easing.', ups + ' suben, ' + downs + ' bajan.');
  if (biggest && biggest.pct != null) {
    var bdir = biggest.dir === 'up' ? L('up', 'arriba') : biggest.dir === 'down' ? L('down', 'abajo') : L('flat', 'estable');
    var bpct = Math.abs(Math.round(biggest.pct * 100)) + '%';
    sumText += ' ' + L('Biggest move: ' + biggest.name + ' ' + bdir + ' ' + bpct + '.',
                       'Mayor cambio: ' + biggest.name + ' ' + bdir + ' ' + bpct + '.');
  }
  sum.textContent = sumText;
  if (movers.length) listEl.insertBefore(sum, listEl.firstChild);

  // Filter — appears once the list is long enough to need it (i.e. live data).
  if (movers.length >= 8) {
    var srch = el('input', 'cp-market-search');
    srch.type = 'search';
    srch.setAttribute('aria-label', L('Filter ingredients', 'Filtrar ingredientes'));
    srch.placeholder = L('Filter ingredients…', 'Filtrar ingredientes…');
    srch.addEventListener('input', function () {
      query = srch.value.toLowerCase().trim();
      applyFilters();
    });
    listEl.insertBefore(srch, listEl.firstChild);
  }

  // "Your basket" bar — sits above the list, shows how many ingredients you're
  // tracking, lets you narrow to just those, and clears the selection (which
  // also clears the shareable URL). Built once; updateBasketBar() keeps it live.
  var basketBar = null, basketCountEl = null, basketOnlyBox = null;
  function buildBasketBar() {
    basketBar = el('div', 'cp-basket-bar');
    basketBar.id = 'cpBasketBar';
    basketCountEl = el('span', 'cp-basket-count');
    basketBar.appendChild(basketCountEl);

    var onlyLabel = el('label', 'cp-basket-only');
    basketOnlyBox = el('input');
    basketOnlyBox.type = 'checkbox';
    basketOnlyBox.checked = basketOnly;
    basketOnlyBox.addEventListener('change', function () {
      basketOnly = basketOnlyBox.checked;
      applyFilters();
    });
    onlyLabel.appendChild(basketOnlyBox);
    onlyLabel.appendChild(document.createTextNode(' ' + L('Show only tracked', 'Mostrar solo seguidos')));
    basketBar.appendChild(onlyLabel);

    var clear = el('button', 'cp-basket-clear', L('Clear', 'Borrar'));
    clear.type = 'button';
    clear.addEventListener('click', function () {
      basket = {};
      basketOnly = false;
      if (basketOnlyBox) basketOnlyBox.checked = false;
      Array.prototype.forEach.call(listEl.querySelectorAll('.cp-track'), function (b) {
        b.setAttribute('aria-pressed', 'false');
        b.textContent = L('☆ Track', '☆ Seguir');
      });
      writeBasket();
      updateBasketBar();
      applyFilters();
    });
    basketBar.appendChild(clear);
    listEl.insertBefore(basketBar, listEl.firstChild);
  }
  function updateBasketBar() {
    var n = basketKeys().length;
    if (!n) {
      if (basketBar) basketBar.hidden = true;
      basketOnly = false;
      return;
    }
    if (!basketBar) buildBasketBar();
    basketBar.hidden = false;
    basketCountEl.textContent = L(
      n + (n === 1 ? ' ingredient tracked' : ' ingredients tracked'),
      n + (n === 1 ? ' ingrediente seguido' : ' ingredientes seguidos'));
  }
  updateBasketBar();
  applyFilters();

  // Deep anchor: a URL like /…/#ci-romaine should bring that card into view +
  // flag it. The browser's initial hash scroll fired before these JS-built
  // cards existed, so do it here after render.
  if (location.hash && /^#ci-[a-z0-9-]+$/i.test(location.hash)) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) {
      target.classList.add('cp-market-hit');
      if (target.scrollIntoView) target.scrollIntoView({ block: 'center' });
    }
  }

  // Methodology disclosure — trust by showing how the read is made.
  var method = el('details', 'cp-method');
  method.appendChild(el('summary', null, L('How we read the market', 'Cómo leemos el mercado')));
  var mp = el('div', 'cp-method-body');
  [
    L('Range: the typical price across public sources — the middle half, p25 to p75. We never blend different price types (delivered, wholesale, an index) into one number.',
      'Rango: el precio típico entre fuentes públicas — la mitad central, p25 a p75. Nunca mezclamos tipos de precio distintos (entregado, mayoreo, índice) en un solo número.'),
    L('Trend: a blended rate of change across sources, built so one bad feed cannot swing it, and mirror feeds count once.',
      'Tendencia: un cambio combinado entre fuentes, hecho para que una fuente mala no lo mueva, y las fuentes espejo cuentan una vez.'),
    L('Confidence: steps from high down to directional as sources thin out — fewer agreeing sources, a wider and more cautious read.',
      'Confianza: baja de alta a direccional cuando hay menos fuentes — menos fuentes de acuerdo, una lectura más amplia y prudente.'),
    L('Freshness: "As of" shows the oldest contributing date, not when we fetched. A stale source is dropped, never carried forward.',
      'Frescura: "Al" muestra la fecha más antigua que aporta, no cuándo consultamos. Una fuente vieja se descarta, nunca se arrastra.')
  ].forEach(function (txt) { mp.appendChild(el('p', null, txt)); });
  method.appendChild(mp);
  card.insertBefore(method, document.getElementById('cpMarketCta'));

  var cta = document.getElementById('cpMarketCta');
  cta.appendChild(document.createTextNode(L('Want this checked against your own invoices? ', '¿Quieres comparar esto con tus propias facturas? ')));
  var a = el('a', 'plausible-event-name=Ledger+Route+Click plausible-event-source=cost-pulse-market', 'Muntin Ledger');
  a.href = 'https://ledger.muntin.digital/';
  cta.appendChild(a);
  cta.appendChild(document.createTextNode(L(
    ' tells you if your vendor is above market on a line — and re-costs the dishes that use it.',
    ' te dice si tu proveedor está por encima del mercado en una línea — y recuesta los platillos que la usan.')));

  // Cross-wire to the free Plate Cost calculator (cost a dish that uses these).
  var xlink = el('p', 'cp-market-crosslink');
  xlink.appendChild(document.createTextNode(L('Costing a specific dish? ', '¿Costeando un platillo? ')));
  var px = el('a', null, L('Use the free Plate Cost calculator', 'Usa la calculadora Plate Cost gratis'));
  px.href = '/tools/plate-cost/';
  xlink.appendChild(px);
  xlink.appendChild(document.createTextNode('.'));
  card.insertBefore(xlink, document.getElementById('cpMarketCta'));

  card.hidden = false;
})();
