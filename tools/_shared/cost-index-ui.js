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
  if (!card || !listEl || !DATA || typeof MuntinCompositePrice === 'undefined' || typeof MuntinCostFormat === 'undefined') return;

  var es = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2) === 'es';
  var FMT = MuntinCostFormat(es);   // pure honesty-phrasing helpers (cost-index-format.js)
  function L(en, esStr) { return es ? esStr : en; }
  function money(c) { return '$' + (Math.round(c) / 100).toFixed(2); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  // Privacy-respecting analytics: only ingredient keys + categorical labels
  // (verdict, action) ever leave — never the operator's typed price. Best-effort
  // and guarded, so a missing/blocked Plausible never breaks the tool.
  function track(name, props) {
    try { if (window.plausible) window.plausible(name, props ? { props: props } : undefined); }
    catch (e) { /* analytics is best-effort */ }
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
    // Only ever touch the basket segment of the hash — never clobber a
    // #ci-<ingredient> deep anchor (a load-bearing AI-Overview entry path).
    var parts = (location.hash || '').replace(/^#/, '').split('&')
      .filter(function (p) { return p && p.indexOf('basket=') !== 0; });
    if (keys.length) parts.push('basket=' + keys.map(encodeURIComponent).join(','));
    var hash = parts.length ? '#' + parts.join('&') : '';
    try { history.replaceState(null, '', location.pathname + location.search + hash); }
    catch (e) { /* history may be unavailable */ }
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
      if (now) track('Cost Index Ingredient Tracked', { ingredient: key });
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
  function sparkSvg(values, dir, confidence, fresh) {
    var NS = 'http://www.w3.org/2000/svg';
    var w = 132, h = 30, pad = 3;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', String(w)); svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('class', 'cp-market-spark'); svg.setAttribute('aria-hidden', 'true');
    var finite = values.filter(function (v) { return typeof v === 'number' && isFinite(v); });
    if (finite.length < 2) return svg;
    var min = Math.min.apply(null, finite), max = Math.max.apply(null, finite), span = (max - min) || 1;
    var n = values.length;
    var step = n > 1 ? (w - 2 * pad) / (n - 1) : 0;
    var color = dir === 'up' ? 'var(--rust)' : dir === 'down' ? 'var(--teal)' : 'var(--stone)';
    var thin = confidence === 'low' || confidence === 'directional';   // dashed = provisional read
    function X(i) { return pad + i * step; }
    function Y(v) { return h - pad - ((v - min) / span) * (h - 2 * pad); }
    // Today-in-its-own-range: a faint band at this ingredient's OWN p25–p75 over
    // the window, so the eye sees whether today's endpoint sits high or low in
    // its recent spread (fuses with the percentile-of-history sentence). Drawn
    // first → behind the line. Grayscale-safe (a light gray fill, no color
    // dependency). Needs >=12 valid weeks for the spread to mean anything.
    if (finite.length >= 12) {
      var sorted = finite.slice().sort(function (a, b) { return a - b; });
      function q(p) { var pos = (sorted.length - 1) * p, b = Math.floor(pos), rest = pos - b; return sorted[b + 1] !== undefined ? sorted[b] + rest * (sorted[b + 1] - sorted[b]) : sorted[b]; }
      var yTop = Y(q(0.75)), yBot = Y(q(0.25));
      var bandRect = document.createElementNS(NS, 'rect');
      bandRect.setAttribute('x', pad.toFixed(1));
      bandRect.setAttribute('width', (w - 2 * pad).toFixed(1));
      bandRect.setAttribute('y', Math.min(yTop, yBot).toFixed(1));
      bandRect.setAttribute('height', Math.max(0.5, Math.abs(yBot - yTop)).toFixed(1));
      bandRect.setAttribute('fill', 'var(--stone)'); bandRect.setAttribute('fill-opacity', '0.16');
      bandRect.setAttribute('class', 'cp-spark-band');
      svg.appendChild(bandRect);
    }
    // Break the line at gaps (null/non-finite weeks) — NEVER bridge a missing
    // week into a straight line, which would lie about continuity. Each run of
    // present weeks is its own polyline; a lone point is a dot.
    var seg = [], lastIdx = -1, lastVal = null;
    function flush() {
      if (seg.length >= 2) {
        var pl = document.createElementNS(NS, 'polyline');
        pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', color);
        pl.setAttribute('stroke-width', thin ? '1.2' : '1.5');
        pl.setAttribute('stroke-linejoin', 'round'); pl.setAttribute('stroke-linecap', 'round');
        if (thin) { pl.setAttribute('stroke-dasharray', '3,3'); pl.setAttribute('stroke-opacity', '0.85'); }
        pl.setAttribute('points', seg.join(' '));
        svg.appendChild(pl);
      } else if (seg.length === 1) {
        var p = seg[0].split(',');
        var d1 = document.createElementNS(NS, 'circle');
        d1.setAttribute('cx', p[0]); d1.setAttribute('cy', p[1]); d1.setAttribute('r', '1.6'); d1.setAttribute('fill', color);
        svg.appendChild(d1);
      }
      seg = [];
    }
    for (var i = 0; i < n; i++) {
      var v = values[i];
      if (typeof v === 'number' && isFinite(v)) { seg.push(X(i).toFixed(1) + ',' + Y(v).toFixed(1)); lastIdx = i; lastVal = v; }
      else { flush(); }
    }
    flush();
    if (lastIdx >= 0) {
      // Freshness as a non-color channel: a solid dot when the latest read is
      // current, a hollow ring when it has aged (the static page self-signals
      // staleness without a rebuild). Survives grayscale — ring vs. fill, not hue.
      var dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', X(lastIdx).toFixed(1)); dot.setAttribute('cy', Y(lastVal).toFixed(1));
      if (fresh === false) {
        dot.setAttribute('r', '2.4'); dot.setAttribute('fill', 'var(--surface-1, #fff)');
        dot.setAttribute('stroke', color); dot.setAttribute('stroke-width', '1.3');
      } else {
        dot.setAttribute('r', '2.2'); dot.setAttribute('fill', color);
      }
      svg.appendChild(dot);
    }
    return svg;
  }
  // Plain-language "shape sentence" for the audio/sr text — the spark itself is
  // aria-hidden, so without this the weekly history is invisible to non-sighted
  // and low-numeracy readers. Notes gaps honestly.
  function sparkShape(values) { return FMT.sparkShape(values); }
  // Percentile-of-history, stated as an honest COUNT (never a smoothed "85th
  // percentile" — that implies a fitted distribution we don't have). Separates
  // "expensive" from "rising": today can sit inside the typical band yet at the
  // top of its OWN recent range. Needs >=8 valid weekly reads; the window is all
  // the history that exists, so we say "of its last N" — never "all-time".
  function percentileLine(values) { return FMT.percentileLine(values); }
  // Week-over-week — the single most recent step, the number operators repeat
  // ("eggs up a dime a dozen since last week"). Honest across cadences: finds
  // the read closest to 7 days before the latest (window 4–11 days), never an
  // index-1 guess that could span a month of gaps. Anchors the % to a dollar.
  // Skipped on index/directional reads (a $ delta would be meaningless). Returns
  // { text, srText } or null. `dates` must be 1:1 with `values`.
  function weekOverWeek(values, dates, unit) { return FMT.weekOverWeek(values, dates, unit); }
  function vsLastYear(values, dates, unit) { return FMT.vsLastYear(values, dates, unit); }
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
    if (cents == null) return null;
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
    return pos;
  }

  // Negotiation helper — when an operator sits above the band, offer a vendor
  // note they can edit, copy, or open in their mail app. Client-side only (no
  // fetch); the draft cites their own price + the displayed range, framed as a
  // "typical range from public sources" — never as a live or authoritative
  // quote. Built once per ingredient; renderYou toggles it per keystroke.
  var preview = DATA.status === 'preview';

  // Live "where you're overpaying most" — as the operator enters prices, rank the
  // ingredients where they sit furthest above the typical top (p75). Turns
  // scattered inputs into one prioritized action list. Client-side; gaps are per
  // the displayed unit, so we don't sum across mismatched units.
  var youState = {};
  var youSummaryEl = null, youSummaryLast = '';
  function updateYouSummary() {
    var aboves = Object.keys(youState).map(function (k) { return youState[k]; })
      .filter(function (s) { return s.pos === 'above' && s.gap > 0; })
      .sort(function (a, b) { return b.gap - a.gap; });
    if (!aboves.length) {
      if (youSummaryEl) { youSummaryEl.hidden = true; youSummaryEl.textContent = ''; youSummaryLast = ''; }
      return;
    }
    if (!youSummaryEl) {
      youSummaryEl = el('div', 'cp-you-summary');
      // Visual prioritization aid placed just above the cards (not above the
      // basket bar / search). Not a live region: each card's own aria-live
      // verdict already speaks the facts, so this avoids triple-announcing.
      listEl.insertBefore(youSummaryEl, listEl.querySelector('.cp-market-item'));
    }
    youSummaryEl.hidden = false;
    var n = aboves.length, top = aboves[0];
    var lead = L(
      'Above the typical range on ' + n + (n === 1 ? ' ingredient' : ' ingredients') + '. ',
      'Arriba del rango típico en ' + n + (n === 1 ? ' ingrediente' : ' ingredientes') + '. ');
    var biggest = L(
      'Biggest gap: ' + top.name + ' (' + money(top.gap) + ' over per ' + top.unit + ').',
      'Mayor diferencia: ' + top.name + ' (' + money(top.gap) + ' de más por ' + top.unit + ').');
    var txt = lead + biggest;
    if (txt !== youSummaryLast) { youSummaryEl.textContent = txt; youSummaryLast = txt; }
  }

  function vendorDraft(name, unit, cents, band) {
    return L(
      'Hi [vendor rep],\n\n' +
      'Thank you for taking care of my orders — I value working with you and want to keep my business here.\n\n' +
      'I am reviewing my food costs and had a question about ' + name + ' (' + unit + '). ' +
      'I currently pay ' + money(cents) + ' per ' + unit + '. ' +
      'Public market data shows a typical range of ' + band + ' per ' + unit + ' right now, ' +
      'so I wanted to ask if we can look at it together.\n\n' +
      'I order this regularly and plan to keep doing so. Is there room to bring my price closer to that range, ' +
      'or a different pack or standing order that would help?\n\n' +
      'Could you let me know before my next order?\n\n' +
      'Thanks again,\n[your name]\n[restaurant name]',

      'Hola [proveedor]:\n\n' +
      'Gracias por atender mis pedidos. Valoro trabajar con usted y quiero seguir comprando aquí.\n\n' +
      'Estoy revisando mis costos y tengo una pregunta sobre ' + name + ' (' + unit + '). ' +
      'Actualmente pago ' + money(cents) + ' por ' + unit + '. ' +
      'Los datos públicos del mercado muestran un rango típico de ' + band + ' por ' + unit + ' en este momento, ' +
      'así que quería pedirle que lo revisemos juntos.\n\n' +
      'Compro este producto con regularidad y pienso seguir haciéndolo. ¿Habría posibilidad de acercar mi precio a ese rango, ' +
      'o algún tamaño de presentación o pedido fijo que ayude?\n\n' +
      '¿Me podría avisar antes de mi próximo pedido?\n\n' +
      'Gracias de nuevo,\n[su nombre]\n[su restaurante]');
  }
  function buildVendorNote(ing, unit) {
    var key = ing.key || ('x' + Math.random().toString(36).slice(2));
    var root = el('div', 'cp-note');
    var toggle = el('button', 'cp-note-toggle', L('Draft a vendor note', 'Redactar nota al proveedor'));
    toggle.type = 'button';
    var regionId = 'cpNote-' + key;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', regionId);
    root.appendChild(toggle);

    var region = el('div', 'cp-note-region');
    region.id = regionId;
    region.hidden = true;
    if (preview) {
      region.appendChild(el('p', 'cp-note-caution',
        L('Sample range — confirm the live number before you send this.',
          'Rango de muestra — confirma el número real antes de enviar esto.')));
    }
    var taId = 'cpNoteText-' + key;
    var lab = el('label', 'cp-note-label', L('Edit before you send', 'Edítalo antes de enviar'));
    lab.setAttribute('for', taId);
    region.appendChild(lab);

    var ta = el('textarea', 'cp-note-text');
    ta.id = taId; ta.rows = 9;
    ta.setAttribute('autocomplete', 'off');
    var dirty = false;

    var actions = el('div', 'cp-note-actions');
    var copy = el('button', 'cp-note-copy', L('Copy', 'Copiar'));
    copy.type = 'button';
    var mail = el('a', 'cp-note-mail', L('Open in email', 'Abrir en correo'));
    mail.href = 'mailto:';
    var status = el('span', 'cp-note-status');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    actions.appendChild(copy); actions.appendChild(mail); actions.appendChild(status);
    region.appendChild(ta); region.appendChild(actions);
    root.appendChild(region);

    var nm = (L(ing.label_en, ing.label_es) || ing.key || '');
    function mailtoHref(body) {
      var subject = L('Pricing question — ', 'Consulta de precio — ') + nm;
      return 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }
    ta.addEventListener('input', function () { dirty = true; mail.href = mailtoHref(ta.value); });

    var statusTimer = null;
    function setStatus(txt) {
      status.textContent = txt;
      if (statusTimer) clearTimeout(statusTimer);
      statusTimer = setTimeout(function () { status.textContent = ''; }, 4000);
    }
    copy.addEventListener('click', function () {
      function manualCopy() {
        try { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); } catch (e2) { /* noop */ }
        setStatus(L('Press Ctrl/Cmd-C to copy the selected text', 'Pulsa Ctrl/Cmd-C para copiar el texto seleccionado'));
      }
      track('Cost Index Vendor Note', { action: 'copied', ingredient: ing.key || '' });
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ta.value).then(function () { setStatus(L('Copied', 'Copiado')); }, manualCopy);
          return;
        }
      } catch (e) { /* clipboard access can throw */ }
      manualCopy();
    });
    mail.addEventListener('click', function () {
      track('Cost Index Vendor Note', { action: 'mailto', ingredient: ing.key || '' });
    });
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      region.hidden = !open;
      if (open) { track('Cost Index Vendor Note', { action: 'opened', ingredient: ing.key || '' }); if (ta.focus) ta.focus(); }
    });

    function fill(cents, band) {
      if (!dirty) ta.value = vendorDraft(nm, unit, cents, band);
      mail.href = mailtoHref(ta.value);
    }
    function collapse() {
      toggle.setAttribute('aria-expanded', 'false');
      region.hidden = true;
      status.textContent = '';
      if (statusTimer) clearTimeout(statusTimer);
      dirty = false; // re-entry regenerates a fresh draft; never cite a stale price
    }
    return { root: root, fill: fill, collapse: collapse };
  }

  document.getElementById('cpMarketHeading').textContent = L("What the market's doing", 'Qué hace el mercado');
  var dekEl = document.getElementById('cpMarketDek');
  dekEl.textContent = L(
    'Wholesale and index signals for common ingredients, blended across public sources. Use it to tell a real market move from a vendor markup.',
    'Señales de mayoreo e índices para ingredientes comunes, combinadas de fuentes públicas. Úsalo para distinguir un movimiento real del mercado de un sobreprecio del proveedor.');

  // Freshness trust line — the seed's top-level build date, surfaced verbatim so
  // an operator (and an answer engine) sees how current the whole read is at a
  // glance. Dynamic from the seed; never a hardcoded date. Sits under the dek.
  if (DATA.generatedAt) {
    var freshEl = el('p', 'cp-market-asof');
    freshEl.appendChild(el('strong', null, L('Market data as of ', 'Datos de mercado al ')));
    freshEl.appendChild(document.createTextNode(DATA.generatedAt));
    dekEl.parentNode.insertBefore(freshEl, dekEl.nextSibling);
  }
  if (DATA.status === 'preview') {
    var pv = document.getElementById('cpMarketPreview');
    pv.hidden = false;
    pv.textContent = L(
      'Sample preview — illustrative figures, not live market data. Live USDA, BLS, and FRED sources connect soon.',
      'Vista de muestra — cifras ilustrativas, no datos de mercado en vivo. Las fuentes USDA, BLS y FRED se conectan pronto.');
  }

  // Learning primer — teach the five signals once, in plain diner language, so a
  // first-timer (or a tired, limited-English owner) can read any card. One shared
  // <details> (no per-card noise), glossary-linked, bilingual.
  (function () {
    function item(lead, body, term, linkText) {
      var p = el('p', 'cp-learn-item');
      p.appendChild(el('strong', null, lead + ' '));
      p.appendChild(document.createTextNode(body));
      if (term) {
        p.appendChild(document.createTextNode(' '));
        var a = el('a', null, linkText);
        a.href = (es ? '/es' : '') + '/glossary/' + term + '/';
        p.appendChild(a);
        p.appendChild(document.createTextNode('.'));
      }
      return p;
    }
    var learn = el('details', 'cp-learn');
    learn.appendChild(el('summary', null, L('New here? How to read these cards', '¿Primera vez? Cómo leer estas tarjetas')));
    var lb = el('div', 'cp-learn-body');
    lb.appendChild(item(L('The range', 'El rango'),
      L('is the typical price — the middle half of what kitchens pay, low to high. Your job is to find which side of it you sit on.',
        'es el precio típico — la mitad central de lo que pagan las cocinas, de bajo a alto. Tu tarea es ver de qué lado estás.'),
      'cost-index', L('What a cost index is', 'Qué es un índice de costos')));
    lb.appendChild(item(L('Market or your vendor?', '¿El mercado o tu proveedor?'),
      L('When the trend here moves, the whole market moved. If your invoice jumped but this stayed flat, that points to your vendor — worth a conversation.',
        'Cuando la tendencia aquí se mueve, se movió todo el mercado. Si tu factura subió pero esto siguió estable, apunta a tu proveedor — vale una conversación.')));
    lb.appendChild(item(L('Confidence', 'Confianza'),
      L('is how much the public sources agree. Strong means several line up; an early or rough read is a hint, not a fact — wait for more before a big call.',
        'es cuánto coinciden las fuentes públicas. Sólida significa que varias concuerdan; una lectura temprana o aproximada es un indicio, no un hecho — espera antes de una decisión grande.'),
      'data-literacy', L('reading the data', 'leer los datos')));
    lb.appendChild(item(L('"As of"', '"Al"'),
      L('is the date of the oldest source behind the number. An old date means treat it as a starting point and check it against your own invoice.',
        'es la fecha de la fuente más antigua detrás del número. Una fecha vieja: tómalo como punto de partida y compáralo con tu factura.'),
      'last-updated-signal', L('the freshness signal', 'la señal de frescura')));
    lb.appendChild(item(L('The line', 'La línea'),
      L('is the last few weeks. One week can spike for any reason; the shape over time tells you whether a move is real and sticking, or only a passing bounce.',
        'son las últimas semanas. Una semana puede saltar por cualquier motivo; la forma en el tiempo te dice si un movimiento es real y se sostiene, o solo un rebote pasajero.')));
    learn.appendChild(lb);
    card.insertBefore(learn, document.getElementById('cpMarketPreview'));
  })();

  var confWordMap = {
    high: L('high', 'alta'), medium: L('medium', 'media'),
    low: L('low', 'baja'), directional: L('directional', 'direccional')
  };
  // What the confidence word MEANS, in plain terms (for the chip's aria-label and
  // the audio/sr text) — "directional" is jargon to a tired, non-native reader.
  var confPhraseMap = {
    high: L('Strong read — several sources agree.', 'Lectura sólida — varias fuentes coinciden.'),
    medium: L('Fair read — a few sources.', 'Lectura aceptable — pocas fuentes.'),
    low: L('Rough read — thin data.', 'Lectura aproximada — pocos datos.'),
    directional: L('Early hint only — not a firm number.', 'Solo una señal temprana — no es un número firme.')
  };

  // Turn the build-time spike/structural flag into a plain SUGGESTION — never a
  // command. Calibrated to confidence: a thin read can never say "re-price". The
  // operator decides; we only say what the data leans toward. Returns
  // { tone:'reprice'|'hold'|'watch', verb, note } or null.
  function flagVerb(flag, confidence) {
    if (!flag || !flag.verdict) return null;
    // Single source of truth: tools/_shared/cost-verdict.js. The inline switch
    // below is kept as a fallback so the dashboard never breaks if that script
    // isn't loaded (e.g. an older cached page).
    var V = (typeof MuntinCostVerdict !== 'undefined' && MuntinCostVerdict) ||
            (typeof self !== 'undefined' && self.MuntinCostVerdict) ||
            (typeof window !== 'undefined' && window.MuntinCostVerdict);
    if (V && V.verdict) {
      var sv = V.verdict(flag, confidence);
      return sv ? { tone: sv.tone, verb: L(sv.verb_en, sv.verb_es), note: L(sv.note_en, sv.note_es) } : null;
    }
    var thin = confidence === 'low' || confidence === 'directional';
    var wk = flag.elevatedWeeks;
    switch (flag.verdict) {
      case 'structural':
        if (thin) return { tone: 'watch', verb: L('Watch', 'Observa'), note: L('Up and holding, but the data is thin — wait for more before a big call.', 'Sube y se mantiene, pero hay pocos datos — espera más antes de una decisión grande.') };
        return { tone: 'reprice', verb: L('Consider re-pricing', 'Considera ajustar el precio'), note: L('Up and holding' + (wk ? ' for ' + wk + ' weeks' : '') + ' — this looks like a real reset, not a blip. Many operators would re-price the dishes that use it.', 'Sube y se mantiene' + (wk ? ' por ' + wk + ' semanas' : '') + ' — parece un cambio real, no un repunte. Muchos operadores ajustarían el precio de los platillos que lo usan.') };
      case 'spike':
        return { tone: 'hold', verb: L('Hold', 'Espera'), note: L('Jumped, then pulled back — this often reverts. Re-pricing now risks chasing a number that is already falling.', 'Subió y luego bajó — suele revertir. Ajustar ahora arriesga perseguir un número que ya está cayendo.') };
      case 'easing':
        return { tone: 'hold', verb: L('Hold', 'Espera'), note: L('Easing — this can be a chance to renegotiate, not a reason to re-price.', 'Bajando — puede ser oportunidad de renegociar, no razón para reajustar.') };
      case 'emerging':
        return { tone: 'watch', verb: L('Watch', 'Observa'), note: L('A real move, but it has not held yet. Give it a couple of weeks.', 'Un movimiento real, pero aún no se sostiene. Dale un par de semanas.') };
      case 'flat':
        return { tone: 'hold', verb: L('Hold', 'Espera'), note: L('Inside its usual range — nothing to do.', 'Dentro de su rango usual — nada que hacer.') };
      default: // insufficient
        return { tone: 'watch', verb: L('Watch', 'Observa'), note: L('Too new to call — too little history so far. Treat the price as real until a pattern shows.', 'Muy nuevo para concluir — poco historial aún. Trata el precio como real hasta que se vea un patrón.') };
    }
  }

  var movers = [];
  (DATA.ingredients || []).forEach(function (ing) {
    // Live seed carries the baked, fact-gated assessment (already an assess()
    // shape); preview seed carries raw input we run the engine on in-browser.
    var r = ing.assessment || MuntinCompositePrice.assess(ing.input || {});
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
    // On a 'directional' read the data is too thin to stand behind a precise
    // percent — showing one would overstate the signal. Give the direction with
    // an honest hedge instead (the fact-gate ethos applied to the UI).
    var soften = r.confidence === 'directional' && r.trend.dir !== 'flat';
    // Numeracy aid: anchor the percent to a dollar an operator recognizes
    // (derived from the displayed median + pct — no new data, fact-gate-safe).
    var deltaTxt = '';
    if (!soften && pct != null && lvl && typeof lvl.medianCents === 'number' && r.trend.dir !== 'flat') {
      var deltaCents = Math.abs(Math.round(lvl.medianCents - lvl.medianCents / (1 + pct)));
      if (deltaCents > 0) deltaTxt = L(' — about ' + money(deltaCents) + ' ' + (r.trend.dir === 'up' ? 'more' : 'less') + ' a ' + unit + ' over the window',
                                       ' — cerca de ' + money(deltaCents) + ' ' + (r.trend.dir === 'up' ? 'más' : 'menos') + ' por ' + unit + ' en el periodo');
    }
    var trendText = pct == null
      ? L('Not enough history yet for a trend', 'Sin suficiente historial para una tendencia')
      : soften
        ? L(dirWord + ' — early signal, not a firm number yet', dirWord + ' — señal temprana, aún no es un número firme')
        : L(dirWord + ' ' + pctTxt + ' over the window', dirWord + ' ' + pctTxt + ' en el periodo') + deltaTxt;

    var conf = confWordMap[r.confidence] || r.confidence;
    var nSrc = (r.trend && r.trend.nSources) || (lvl ? lvl.nSources : 0);
    var metaText = (r.asOf ? L('As of ', 'Al ') + r.asOf + ' · ' : '') + nSrc + ' ' + L('sources', 'fuentes');

    var fig = el('figure', 'cp-market-item');
    if (ing.key) fig.id = 'ci-' + ing.key;          // deep anchor: /…/#ci-romaine
    if (ing.key) fig.setAttribute('data-key', ing.key); // for the basket
    fig.setAttribute('data-name', name.toLowerCase()); // for the filter
    var confPhrase = confPhraseMap[r.confidence] || (conf + ' ' + L('confidence', 'confianza'));
    fig.setAttribute('data-audio-alt',
      name + '. ' + rangeText + '. ' + L('The market is ', 'El mercado va ') + trendText + '. ' +
      confPhrase + ' ' + metaText + '.');

    var head = el('div', 'cp-market-head');
    // Real heading: each ingredient name is an <h3> nesting under the section's
    // <h2> (#cpMarketHeading), so the card grid has a proper outline + SR landmark
    // nav. Safe re: the h2-anchor-id gate — that gate only scans static <h2> in
    // blog/glossary/learn, never these JS-built tool cards.
    head.appendChild(el('h3', 'cp-market-name', name));
    var chip = el('span', 'cp-conf', conf);
    chip.setAttribute('data-level', r.confidence);
    chip.setAttribute('aria-label', confPhrase);   // chip shows the short word; SR hears what it means
    var headRight = el('span', 'cp-head-right');
    // Coverage-tier badge — the honesty label: a `measured` card is a published
    // USDA wholesale price taken as-is; `derived` is an estimate with no measured
    // level. Tells the operator how much to trust the number at a glance.
    if (ing.tier) {
      var tierBadge = el('span', 'cp-tier', ({ measured: L('measured', 'medido'), derived: L('estimate', 'estim.'), absent: L('no data', 'sin datos') })[ing.tier] || ing.tier);
      tierBadge.setAttribute('data-tier', ing.tier);
      tierBadge.setAttribute('title', ing.tier === 'measured'
        ? L('A published USDA wholesale price, taken as-is.', 'Un precio mayorista publicado del USDA, tal cual.')
        : L('An estimate from public indicators — no measured price level.', 'Una estimación de indicadores públicos — sin nivel de precio medido.'));
      headRight.appendChild(tierBadge);
    }
    headRight.appendChild(chip);
    if (ing.key) headRight.appendChild(trackButton(ing.key));
    head.appendChild(headRight);
    fig.appendChild(head);

    fig.appendChild(el('p', 'cp-market-range', rangeText));
    // Yield-adjusted TRUE plate cost — the wholesale level converted to cost per
    // USABLE unit (illustrative trim yield; the operator's own yield governs). The
    // number no public index shows: what the trim actually costs you.
    if (ing.epCents && ing.yield && lvl) {
      var yPct = Math.round(ing.yield * 100);
      var plateTxt = L('True cost ≈ ' + money(ing.epCents) + ' per usable ' + unit + ' (' + yPct + '% trim yield)',
                       'Costo real ≈ ' + money(ing.epCents) + ' por ' + unit + ' utilizable (rendimiento ' + yPct + '%)');
      var plateEl = el('p', 'cp-market-plate', plateTxt);
      plateEl.setAttribute('title', L('Wholesale price ÷ typical trim yield = true cost per usable unit. Your own yield governs.',
                                      'Precio mayorista ÷ rendimiento típico = costo real por unidad utilizable. Tu propio rendimiento manda.'));
      fig.appendChild(plateEl);
      fig.setAttribute('data-audio-alt', (fig.getAttribute('data-audio-alt') || '') + ' ' + plateTxt + '.');
    }
    var tEl = el('p', 'cp-market-trend', (r.trend.dir === 'up' ? '▲ ' : r.trend.dir === 'down' ? '▼ ' : '● ') + trendText);
    tEl.setAttribute('data-dir', r.trend.dir);
    fig.appendChild(tEl);

    // "What would you do?" — a confidence-calibrated suggestion (never a command).
    var fv = flagVerb(ing.flag, r.confidence);
    if (fv) {
      var vEl = el('p', 'cp-market-verdict');
      var vChip = el('span', 'cp-verb', fv.verb);
      vChip.setAttribute('data-tone', fv.tone);
      vEl.appendChild(vChip);
      vEl.appendChild(el('span', 'cp-verb-note', ' ' + fv.note));
      fig.appendChild(vEl);
      fig.setAttribute('data-audio-alt', (fig.getAttribute('data-audio-alt') || '') + ' ' + fv.verb + '. ' + fv.note);
    }

    // Outlook — the INFERRED pressure overlay (direction only, never a price).
    // Fail-silent: shown only when the seed carries a pressure summary.
    var pr = ing.pressure;
    if (pr && pr.direction && pr.direction !== 'unknown') {
      var dir = pr.under_review ? 'review' : pr.direction;
      var oLine = ({
        building: L('Outlook: cost pressure looks to be building.', 'Perspectiva: la presión de costo parece ir en aumento.'),
        easing:   L('Outlook: cost pressure looks to be easing.', 'Perspectiva: la presión de costo parece ceder.'),
        steady:   L('Outlook: signals are mixed — no clear lean yet.', 'Perspectiva: señales mixtas — sin tendencia clara aún.'),
        review:   L('Outlook: awaiting the next measured price.', 'Perspectiva: a la espera de la próxima lectura medida.')
      })[dir];
      if (oLine) {
        var oEl = el('p', 'cp-market-outlook');
        oEl.setAttribute('data-layer', 'inferred');
        oEl.appendChild(el('span', 'cp-outlook-line', oLine));
        oEl.appendChild(el('span', 'cp-outlook-chip', ' (' + L('inferred', 'inferido') + ' · ' + (pr.confidence || '') + ')'));
        fig.appendChild(oEl);
        fig.setAttribute('data-audio-alt', (fig.getAttribute('data-audio-alt') || '') + ' ' + oLine);
      }
    }

    var sparkVals = ing.spark || pickSeries(ing.input);
    var sparkText = '';
    var pctText = '';
    var wowText = '';
    if (sparkVals && sparkVals.length >= 2) {
      // Freshness of the latest read, measured at render time so an aged static
      // page self-signals: solid dot ≤21 days old, hollow ring beyond.
      var fresh = true;
      if (Array.isArray(ing.spark_dates) && ing.spark_dates.length) {
        var lastDms = Date.parse(ing.spark_dates[ing.spark_dates.length - 1]);
        if (isFinite(lastDms)) fresh = (Date.now() - lastDms) <= 21 * 86400000;
      }
      fig.appendChild(sparkSvg(sparkVals, r.trend.dir, r.confidence, fresh));
      sparkText = sparkShape(sparkVals);
      if (!fresh) sparkText = (sparkText ? sparkText + ' ' : '') + L('This reading has not refreshed in over three weeks.', 'Esta lectura no se ha actualizado en más de tres semanas.');
      if (sparkText) fig.setAttribute('data-audio-alt', (fig.getAttribute('data-audio-alt') || '') + ' ' + sparkText);
      // "today vs its own recent range" — only on a firm read (a directional/thin
      // series can't carry an honest percentile).
      if (r.confidence !== 'directional') {
        pctText = percentileLine(sparkVals);
        if (pctText) {
          fig.appendChild(el('p', 'cp-market-percentile', pctText));
          fig.setAttribute('data-audio-alt', (fig.getAttribute('data-audio-alt') || '') + ' ' + pctText);
        }
        // Week-over-week step in $ — only on a dollar-priced read (not an index),
        // where the $-anchored delta is honest.
        if (lvl && (!ing.spark_meta || ing.spark_meta.basis !== 'index')) {
          var wow = weekOverWeek(sparkVals, ing.spark_dates, unit);
          if (wow) {
            fig.appendChild(el('p', 'cp-market-wow', wow.text));
            wowText = wow.srText;
            fig.setAttribute('data-audio-alt', (fig.getAttribute('data-audio-alt') || '') + ' ' + wow.srText);
          }
          // Vs-last-year — dormant (null) until ~a year of weekly history exists,
          // then self-activates. Styled like the week line.
          var vly = vsLastYear(sparkVals, ing.spark_dates, unit);
          if (vly) {
            fig.appendChild(el('p', 'cp-market-wow cp-market-vly', vly.text));
            fig.setAttribute('data-audio-alt', (fig.getAttribute('data-audio-alt') || '') + ' ' + vly.srText);
          }
        }
      }
    }
    // Cite the curve, and never let an index series read as a dollar price.
    var sm = ing.spark_meta;
    if (sm) {
      var citeTxt = L('Price history: ', 'Historial de precio: ') + sm.source + ', ' + sm.from + '–' + sm.to
        + (sm.basis === 'index' ? L(' (index, not $)', ' (índice, no $)') : '');
      fig.appendChild(el('p', 'cp-spark-cite', citeTxt));
      fig.setAttribute('data-audio-alt', (fig.getAttribute('data-audio-alt') || '') + ' ' + citeTxt + '.');
    }

    // Sourced seasonality primer (S2) supersedes the generic seasonal nudge.
    if (ing.seasonEd && ing.seasonEd.note_en) {
      var se = ing.seasonEd;
      var seTxt = L('In season: ', 'En temporada: ') + L(se.peak_en, se.peak_es) + '. ' + L(se.note_en, se.note_es);
      var seP = el('p', 'cp-market-seasonal', seTxt);
      if (se.source) {
        var seCite = el('span', 'cp-cite-src', ' (' + se.source + ')');
        seP.appendChild(seCite);
      }
      fig.appendChild(seP);
    } else if (ing.seasonal) {
      fig.appendChild(el('p', 'cp-market-seasonal',
        L('Looks seasonal — it may ease, so holding is often smarter than re-pricing.',
          'Parece de temporada — podría bajar, así que mantener suele ser mejor que subir el precio.')));
    }

    // S3 — measured seasonal read: where is today's level vs. OUR typical level for
    // this calendar month? Only present for ingredients the engine marked `ready`
    // (>=2yr per month); the normal + band come from the seed, the comparison is
    // computed here against the live level (methodology §7 keeps the artifact pure).
    if (ing.seasonalNormals && lvl && typeof lvl.medianCents === 'number') {
      var nowMM = (new Date()).toISOString().slice(5, 7);
      var norm = ing.seasonalNormals[nowMM];
      if (norm && typeof norm.medianCents === 'number' && norm.medianCents > 0) {
        var MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        var MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        var mName = L(MONTHS_EN[parseInt(nowMM, 10) - 1], MONTHS_ES[parseInt(nowMM, 10) - 1]);
        var dPct = Math.abs(Math.round((lvl.medianCents - norm.medianCents) / norm.medianCents * 100));
        var aboveBand = typeof norm.p75Cents === 'number' && lvl.medianCents > norm.p75Cents;
        var belowBand = typeof norm.p25Cents === 'number' && lvl.medianCents < norm.p25Cents;
        var seasonalReadTxt = aboveBand
          ? L('About ' + dPct + '% above the typical ' + mName + '.', 'Alrededor de ' + dPct + '% por encima del ' + mName + ' típico.')
          : belowBand
            ? L('About ' + dPct + '% below the typical ' + mName + '.', 'Alrededor de ' + dPct + '% por debajo del ' + mName + ' típico.')
            : L('In line with the typical ' + mName + ' (within its usual range).', 'En línea con el ' + mName + ' típico (dentro de su rango habitual).');
        fig.appendChild(el('p', 'cp-market-seasonal-read', seasonalReadTxt));
      }
    }

    fig.appendChild(el('p', 'cp-market-meta', metaText));

    // Dashboard → yield-page deep link (the other half of the two-way wiring).
    // Only when the seed marked a real ingredient-yield leaf for this key.
    if (ing.yieldSlug) {
      var yl = el('p', 'cp-market-yield');
      var ya = el('a', null, L('Yield & EP math', 'Rendimiento y costo EP'));
      ya.href = (es ? '/es' : '') + '/library/ingredient-yields/' + ing.yieldSlug + '/';
      ya.appendChild(document.createTextNode(' →'));
      yl.appendChild(ya);
      fig.appendChild(yl);
    }

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
      var note = buildVendorNote(ing, unit);
      note.root.hidden = true;
      (function (o, level, h) {
        var priceFired = false, debounce = null;
        function update() {
          var pos = renderYou(o, level, inp.value);
          var cents = parseMoney(inp.value);
          if (pos && !priceFired) {
            priceFired = true;
            track('Cost Index Price Entered', { ingredient: ing.key || '', verdict: pos });
          }
          youState[ing.key || name] = {
            name: name, unit: unit, pos: pos,
            gap: (pos === 'above' && cents != null) ? (cents - level.rangeCents[1]) : 0
          };
          updateYouSummary();
          if (pos === 'above') {
            var band = money(level.rangeCents[0]) + '–' + money(level.rangeCents[1]);
            h.fill(cents, band);
            h.root.hidden = false;
          } else {
            h.root.hidden = true;
            h.collapse();
          }
        }
        // Debounce: the verdict lives in an aria-live region, so updating on every
        // keystroke machine-guns a screen reader mid-typing. Settle ~350ms first.
        inp.addEventListener('input', function () {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(update, 350);
        });
      })(youOut, lvl, note);
      you.appendChild(lab); you.appendChild(inp); you.appendChild(youOut); you.appendChild(note.root);
      fig.appendChild(you);
    }

    // Screen-reader numbers table.
    var srt = el('div', 'cp-sr-only');
    var caption = name + ': ' + rangeText + '; ' + trendText + '; ' + confPhrase + '; ' + metaText + '.'
      + (sparkText ? ' ' + sparkText : '')
      + (pctText ? ' ' + pctText : '')
      + (wowText ? ' ' + wowText : '')
      + (fv ? ' ' + fv.verb + '. ' + fv.note : '')
      + (sm ? ' ' + L('Price history from ', 'Historial de precio de ') + sm.source + ', ' + sm.from + ' ' + L('to', 'a') + ' ' + sm.to + (sm.basis === 'index' ? L(' (index, not a dollar price)', ' (índice, no un precio en dólares)') : '') + '.' : '');
    srt.appendChild(el('p', null, caption));
    fig.appendChild(srt);

    listEl.appendChild(fig);
  });

  // Coverage honesty — the `absent` gaps, explained. Making "no public data, and
  // here's the structural reason" a first-class, VISIBLE state is the trust play:
  // we only show a price a public USDA series backs; everything else says why not.
  if (DATA.coverage && DATA.coverage.gaps && DATA.coverage.gaps.length) {
    var gaps = DATA.coverage.gaps;
    var det = el('details', 'cp-coverage-gaps');
    det.appendChild(el('summary', 'cp-coverage-summary',
      L('Not yet covered (' + gaps.length + ') — and why', 'Aún sin cobertura (' + gaps.length + ') — y por qué')));
    det.appendChild(el('p', 'cp-coverage-note',
      L('We show a price only when a public USDA series backs it. These have no free wholesale source yet — listed so the gap is honest, not hidden.',
        'Mostramos un precio solo cuando una serie pública del USDA lo respalda. Estos aún no tienen fuente mayorista gratuita — se listan para que la falta sea honesta, no oculta.')));
    var ul = el('ul', 'cp-coverage-list');
    gaps.forEach(function (g) {
      var li = el('li', 'cp-coverage-item');
      li.appendChild(el('span', 'cp-coverage-name', L(g.label_en, g.label_es)));
      if (g.reason) li.appendChild(el('span', 'cp-coverage-reason', ' — ' + g.reason));
      ul.appendChild(li);
    });
    det.appendChild(ul);
    listEl.appendChild(det);
  }

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

  // Lead with the gestalt: the plain one-line summary is the orienting element,
  // so force it above the basket bar / search controls (each of those prepended
  // at firstChild above). A tired reader gets the "what moved" sentence first.
  if (movers.length && sum.parentNode === listEl) listEl.insertBefore(sum, listEl.firstChild);

  // Deep anchor: a URL like /…/#ci-romaine should bring that card into view +
  // flag it. The browser's initial hash scroll fired before these JS-built
  // cards existed, so do it here after render.
  var ciMatch = (location.hash || '').match(/^#(ci-[a-z0-9-]+)/i);
  if (ciMatch) {
    var target = document.getElementById(ciMatch[1]);
    if (target) {
      target.classList.add('cp-market-hit');
      if (target.scrollIntoView) target.scrollIntoView({ block: 'center' });
    }
  }

  // Methodology disclosure — trust by showing how the read is made.
  var method = el('details', 'cp-method');
  method.appendChild(el('summary', null, L('How we read the market', 'Cómo leemos el mercado')));
  var mp = el('div', 'cp-method-body');
  // Lead with the liftable one-sentence definition + a glossary anchor, so a
  // reader (and an answer engine) gets a clean, attributable "what this is"
  // co-located with the data.
  (function () {
    var defP = el('p', 'cp-method-def');
    defP.appendChild(document.createTextNode(L(
      'A cost index is a read of where common ingredients are priced across public market sources — a typical range and a direction, never your delivered price. ',
      'Un índice de costos es una lectura de dónde se ubican los precios de ingredientes comunes en fuentes públicas — un rango típico y una dirección, nunca tu precio entregado. ')));
    var defA = el('a', null, L('What a cost index is', 'Qué es un índice de costos'));
    defA.href = (es ? '/es' : '') + '/glossary/cost-index/';
    defP.appendChild(defA);
    defP.appendChild(document.createTextNode('.'));
    mp.appendChild(defP);
  })();
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
  // Prominent link to the full, dated, citable methodology — the surface's
  // strongest trust + quotability asset. Travels with the card in any locale.
  (function () {
    var moreP = el('p', 'cp-method-more');
    var moreA = el('a', null, L('Read the full methodology', 'Lee la metodología completa'));
    moreA.href = (es ? '/es' : '') + '/cost-index/methodology/';
    moreA.appendChild(document.createTextNode(' →'));
    moreP.appendChild(moreA);
    mp.appendChild(moreP);
  })();
  method.appendChild(mp);
  card.insertBefore(method, document.getElementById('cpMarketCta'));

  // Drivers — the "why" strip. Public commodities (corn/diesel…) that tend to
  // move BEFORE the ingredients above. Framed as association, never cause, and
  // only naming leads actually shown on this surface. Collapsed by default.
  if (Array.isArray(DATA.drivers) && DATA.drivers.length) {
    var nameByKey = {};
    (DATA.ingredients || []).forEach(function (ig) { if (ig.key) nameByKey[ig.key] = L(ig.label_en, ig.label_es); });
    var dWrap = el('details', 'cp-drivers');
    dWrap.appendChild(el('summary', null, L("Why it's moving", 'Por qué se mueve')));
    var dBody = el('div', 'cp-drivers-body');
    dBody.appendChild(el('p', 'cp-drivers-lead', L(
      'These public commodities tend to move before the ingredients above — an association, not a proven cause.',
      'Estas materias primas públicas suelen moverse antes que los ingredientes de arriba — una asociación, no una causa comprobada.')));
    DATA.drivers.forEach(function (d) {
      var dir = (d.trend && d.trend.dir) || 'flat';
      var dpct = d.trend && d.trend.pct;
      var dWord = dir === 'up' ? L('up', 'arriba') : dir === 'down' ? L('down', 'abajo') : L('flat', 'estable');
      var dPctTxt = dpct == null ? '' : ' ' + Math.abs(Math.round(dpct * 100)) + '%';
      var row = el('div', 'cp-driver');
      var dhead = el('div', 'cp-driver-head');
      dhead.appendChild(el('span', 'cp-driver-name', L(d.label_en, d.label_es)));
      var dt = el('span', 'cp-driver-trend', (dir === 'up' ? '▲ ' : dir === 'down' ? '▼ ' : '● ') + dWord + dPctTxt);
      dt.setAttribute('data-dir', dir);
      dhead.appendChild(dt);
      row.appendChild(dhead);
      if (Array.isArray(d.spark) && d.spark.length >= 2) row.appendChild(sparkSvg(d.spark, dir));
      var leads = (d.leads || []).filter(function (k) { return nameByKey[k]; }).slice(0, 2).map(function (k) { return nameByKey[k]; });
      if (leads.length) {
        row.appendChild(el('p', 'cp-driver-leads',
          L('Tends to move before ' + leads.join(', ') + '.', 'Suele moverse antes que ' + leads.join(', ') + '.')));
      }
      dBody.appendChild(row);
    });
    dWrap.appendChild(dBody);
    card.insertBefore(dWrap, document.getElementById('cpMarketCta'));
  }

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
  px.href = (es ? '/es' : '') + '/tools/plate-cost/';
  xlink.appendChild(px);
  xlink.appendChild(document.createTextNode('.'));
  card.insertBefore(xlink, document.getElementById('cpMarketCta'));

  // Cross-wire to Bench — the complement: this card reads the MARKET; Bench
  // reads the operator's OWN saved prices ("did my vendor move me out of line").
  var blink = el('p', 'cp-market-crosslink');
  blink.appendChild(document.createTextNode(L('Checking your own price history instead? ', '¿Revisas tu propio historial de precios? ')));
  var bx = el('a', null, L('See if a vendor moved you out of line with Bench', 'Mira si un proveedor te sacó de línea con Bench'));
  bx.href = (es ? '/es' : '') + '/tools/vendor-benchmark/';
  blink.appendChild(bx);
  blink.appendChild(document.createTextNode('.'));
  card.insertBefore(blink, document.getElementById('cpMarketCta'));

  // NOTE: a cross-visit "since you last looked" heartbeat would need
  // localStorage/sessionStorage, which /security/ claim #4 forbids for this tool
  // (enforced by check-tool-no-fetch.mjs). The phrasing helper exists and is
  // tested (MuntinCostFormat.heartbeat), but wiring it is a founder decision —
  // it would require exempting cost-pulse from claim 4 (a public-promise change).

  card.hidden = false;
})();
