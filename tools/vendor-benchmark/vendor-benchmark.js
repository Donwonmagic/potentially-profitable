/**
 * Vendor Benchmark — UI controller (EN + ES, one file, zero inline drift).
 *
 * Collects a set of DATED purchases for one item and answers the question an
 * operator actually asks at the walk-in door: my carton went up — is that the
 * MARKET, or my VENDOR? It reads document.documentElement.lang for locale, so
 * the English and Spanish pages load the exact same controller; every load-
 * bearing verdict string comes from the shared bilingual modules
 * (bench-lookup.js + cost-index-format.js), and the page chrome from the T dict
 * below.
 *
 * Honesty + privacy posture (enforced by check-tool-no-fetch.mjs and the
 * data-promise rail): no network, no third-party storage. On-device state goes
 * through MuntinContext (localStorage bus) only; rendering goes through
 * MuntinSafeHtml so a typed item can never inject markup. The market math is
 * pure and lives in MuntinMarketWindow.
 */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var SH = window.MuntinSafeHtml;
  var Bench = window.MuntinBench;
  var MW = window.MuntinMarketWindow;
  var CTX = window.MuntinContext;
  if (!SH || !MW) return;

  var ES = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2) === 'es';
  var BASE = ES ? '/es' : '';
  var h = SH.h, sh = SH.safeHtml, setHTML = SH.setHTML;

  // ---- localized page chrome (verdicts come from the shared modules) --------
  var T = ES ? {
    itemLabel: 'Artículo', itemHint: '— como aparece en tu factura',
    itemPlaceholder: 'ej. ribeye, lomo de res, aceite de oliva 3L',
    unitLabel: 'Precio por',
    dateLabel: 'Fecha', priceLabel: 'Precio ($)',
    add: 'Agregar una compra', example: 'Cargar el ejemplo', clear: 'Borrar',
    removeAria: 'Quitar esta compra',
    purchasesLegend: 'Tus compras con fecha',
    scaffoldHint: 'Agrega dos o más facturas con fecha del mismo artículo. Cuantas más fechas, más nítida la comparación con el mercado.',
    exampleTag: 'Ejemplo',
    // result headings
    yourMoveEyebrow: 'Tu movimiento', marketEyebrow: 'El mercado, en tu misma ventana',
    gapWord: 'de diferencia', pointsWord: 'puntos',
    aboveMarket: 'por encima del mercado', belowMarket: 'por debajo del mercado', inlineMarket: 'en línea con el mercado',
    beyond: 'más allá de lo que explica el movimiento del mercado, por',
    ownHistoryEyebrow: 'Frente a tu propio historial',
    chartYou: 'Tú', chartMarket: 'Mercado', chartAria: 'Tu precio frente al precio mayorista del mercado, ambos indexados a 100 al inicio de tu ventana.',
    timelineEyebrow: 'Tu ventana, fecha por fecha',
    thDate: 'Fecha', thYou: 'Tu precio', thYouCum: 'Tú (acum.)', thMarketCum: 'Mercado (acum.)',
    attributionWholesale: 'Referencia mayorista — tu precio entregado normalmente es mayor.',
    attributionSources: 'Fuentes', attributionAsOf: 'Lecturas de mercado',
    attributionConf: 'Confianza',
    conf: { high: 'alta', medium: 'media', low: 'baja', directional: 'direccional' },
    seeReading: 'Ver la lectura completa en el Índice de costos',
    noMatchHead: 'Aún no tenemos una referencia de mercado para esto.',
    noMatchBody: 'Vendor Benchmark todavía compara tu precio contra tu propio historial (arriba). Revisa el Índice de costos para ver qué artículos sí seguimos.',
    levelAt: 'Tu nivel está dentro de un margen de entrega normal frente a la referencia mayorista.',
    levelAbove: 'Tu nivel también corre por encima de la referencia mayorista',
    ondevice: 'Guardado solo en este dispositivo — nunca se envía a ningún lado.',
    clearSaved: 'Borrar lo guardado',
    // ledger funnel
    ledgerSoft: '¿Quieres esto vigilado por ti? Muntin Ledger marca la próxima subida en cuanto archivas la factura.',
    ledgerStrongEyebrow: 'Deja de revisar proveedores a mano',
    ledgerStrongHead: 'Lo escribiste a mano. Ledger lo lee por ti.',
    ledgerStrongBody1: 'Escribiste estas fechas y precios uno por uno.',
    ledgerStrongBody2: 'Muntin Ledger los lee directo de una foto o PDF de la factura — líneas, precios y fechas, sin retipear — los archiva en un registro que puedes buscar, y marca la próxima subida contra tu propio historial.',
    ledgerStrongBody3: 'La lectura de facturas es determinista: plantillas y reglas, sin modelo de lenguaje leyendo tus documentos.',
    earlyAccess: 'En acceso anticipado.',
    seeLedger: 'Conoce Muntin Ledger', seePlate: 'Abrir Costo del Plato',
    plateHook: '¿Y qué le hace esto al margen de tus platillos? Costo del Plato lo recuesta ingrediente por ingrediente.',
    marketOrVendor: '¿Esa subida es el mercado, o tu proveedor?',
    errItem: 'Escribe el nombre del artículo.',
    errRows: 'Agrega al menos dos compras con fecha y precio.'
  } : {
    itemLabel: 'Item', itemHint: '— as it reads on your invoice',
    itemPlaceholder: 'e.g. ribeye, beef tenderloin, olive oil 3L',
    unitLabel: 'Priced per',
    dateLabel: 'Date', priceLabel: 'Price ($)',
    add: 'Add a purchase', example: 'Load the example', clear: 'Clear',
    removeAria: 'Remove this purchase',
    purchasesLegend: 'Your dated purchases',
    scaffoldHint: 'Add two or more dated invoices for the same item. The more dates, the sharper the read against the market.',
    exampleTag: 'Example',
    yourMoveEyebrow: 'Your move', marketEyebrow: 'The market, over your same window',
    gapWord: 'gap', pointsWord: 'points',
    aboveMarket: 'above the market', belowMarket: 'below the market', inlineMarket: 'in line with the market',
    beyond: 'beyond what the market’s move explains, at',
    ownHistoryEyebrow: 'Against your own history',
    chartYou: 'You', chartMarket: 'Market', chartAria: 'Your price versus the wholesale market price, both indexed to 100 at the start of your window.',
    timelineEyebrow: 'Your window, date by date',
    thDate: 'Date', thYou: 'Your price', thYouCum: 'You (cum.)', thMarketCum: 'Market (cum.)',
    attributionWholesale: 'Wholesale reference — your delivered price normally runs higher.',
    attributionSources: 'Sources', attributionAsOf: 'Market reads',
    attributionConf: 'Confidence',
    conf: { high: 'high', medium: 'medium', low: 'low', directional: 'directional' },
    seeReading: 'See the full reading in the Cost Index',
    noMatchHead: 'No market reference for this yet.',
    noMatchBody: 'Vendor Benchmark still checks your price against your own history (above). See the Cost Index for the items we track.',
    levelAt: 'Your level sits within a normal delivered markup over the wholesale reference.',
    levelAbove: 'Your level also runs above the wholesale reference',
    ondevice: 'Saved on this device only — never sent anywhere.',
    clearSaved: 'Clear saved',
    ledgerSoft: 'Want this watched for you? Muntin Ledger flags the next hike the moment you file the invoice.',
    ledgerStrongEyebrow: 'Stop checking vendors by hand',
    ledgerStrongHead: 'You typed this in by hand. Ledger reads it for you.',
    ledgerStrongBody1: 'You typed these dates and prices in one at a time.',
    ledgerStrongBody2: 'Muntin Ledger reads them straight off a photo or PDF of the invoice — line items, prices and dates, no retyping — files them in a searchable ledger, and flags the next hike against your own history.',
    ledgerStrongBody3: 'The invoice reading is deterministic: templates and rules, no language model ever reads your documents.',
    earlyAccess: 'In early access.',
    seeLedger: 'See Muntin Ledger', seePlate: 'Open Plate Cost',
    plateHook: 'And what does this do to your dish margins? Plate Cost re-costs it ingredient by ingredient.',
    marketOrVendor: 'Is that increase the market, or your vendor?',
    errItem: 'Enter the item name.',
    errRows: 'Add at least two purchases with a date and price.'
  };

  // ---- small formatters ------------------------------------------------------
  function money(cents) { return '$' + (Math.round(cents) / 100).toFixed(2); }
  function pctStr(p) {
    var a = Math.abs(p * 100);
    var s = a.toFixed(a < 10 ? 1 : 0).replace(/\.0$/, '');
    return (p > 0 ? '+' : p < 0 ? '−' : '') + s + '%';
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function isoMinusDays(iso, days) {
    var ms = MW.parseISODay(iso);
    if (ms == null) return iso;
    var d = new Date(ms - days * 86400000);
    return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }
  function fmtDate(iso) {
    var ms = MW.parseISODay(iso);
    if (ms == null) return iso;
    try {
      return new Date(ms).toLocaleDateString(ES ? 'es' : 'en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    } catch (_) { return iso; }
  }
  function track(name, props) {
    try { if (window.plausible) window.plausible(name, props ? { props: props } : undefined); } catch (_) {}
  }

  // ---- DOM handles -----------------------------------------------------------
  var itemEl = document.getElementById('vbItem');
  var unitEl = document.getElementById('vbUnit');
  var rowsEl = document.getElementById('vbPurchases');
  var resultEl = document.getElementById('vbResult');
  var errEl = document.getElementById('vbErr');
  var addBtn = document.getElementById('vbAdd');
  var exampleBtn = document.getElementById('vbExample');
  var clearBtn = document.getElementById('vbClear');
  var matchChip = document.getElementById('vbMatchChip');
  if (!itemEl || !unitEl || !rowsEl || !resultEl) return;

  // ---- repeatable dated-purchase rows (DOM-built; the DOM is the state) ------
  function buildRow(data) {
    data = data || {};
    var row = document.createElement('div');
    row.className = 'vb-prow';
    row.setAttribute('role', 'group');

    var dWrap = document.createElement('div');
    dWrap.className = 'vb-field vb-field--date';
    var dLab = document.createElement('label');
    dLab.textContent = T.dateLabel;
    var dInput = document.createElement('input');
    dInput.type = 'date'; dInput.className = 'vb-input'; dInput.setAttribute('data-field', 'date');
    dInput.setAttribute('aria-label', T.dateLabel);
    if (data.date) dInput.value = data.date;
    var dId = 'vbd' + Math.round(performance.now() * 1000) + Math.floor(performance.now() % 97);
    dLab.setAttribute('for', dId); dInput.id = dId;
    dWrap.appendChild(dLab); dWrap.appendChild(dInput);

    var pWrap = document.createElement('div');
    pWrap.className = 'vb-field vb-field--price';
    var pLab = document.createElement('label');
    pLab.textContent = T.priceLabel;
    var pInput = document.createElement('input');
    pInput.type = 'number'; pInput.className = 'vb-input'; pInput.setAttribute('data-field', 'price');
    pInput.setAttribute('inputmode', 'decimal'); pInput.setAttribute('min', '0'); pInput.setAttribute('step', '0.01');
    pInput.setAttribute('placeholder', '0.00'); pInput.setAttribute('aria-label', T.priceLabel);
    if (data.price != null && data.price !== '') pInput.value = data.price;
    var pId = 'vbp' + Math.round(performance.now() * 1000) + Math.floor(performance.now() % 89);
    pLab.setAttribute('for', pId); pInput.id = pId;
    pWrap.appendChild(pLab); pWrap.appendChild(pInput);

    var rm = document.createElement('button');
    rm.type = 'button'; rm.className = 'vb-remove';
    rm.setAttribute('aria-label', T.removeAria); rm.setAttribute('title', T.removeAria);
    rm.appendChild(document.createTextNode('×'));

    row.appendChild(dWrap); row.appendChild(pWrap); row.appendChild(rm);
    return row;
  }

  function renderRows(list) {
    while (rowsEl.firstChild) rowsEl.removeChild(rowsEl.firstChild);
    (list && list.length ? list : [{}, {}]).forEach(function (r) { rowsEl.appendChild(buildRow(r)); });
    relabelRows();
  }
  function relabelRows() {
    var rows = rowsEl.querySelectorAll('.vb-prow');
    for (var i = 0; i < rows.length; i++) {
      rows[i].setAttribute('aria-label', (ES ? 'Compra ' : 'Purchase ') + (i + 1));
    }
  }
  function readRows() {
    var out = [];
    var rows = rowsEl.querySelectorAll('.vb-prow');
    for (var i = 0; i < rows.length; i++) {
      var d = rows[i].querySelector('[data-field="date"]');
      var p = rows[i].querySelector('[data-field="price"]');
      out.push({ date: d ? d.value : '', price: p ? p.value : '' });
    }
    return out;
  }

  // ---- compute + persist -----------------------------------------------------
  var debounceT = null;
  function schedule() { clearTimeout(debounceT); debounceT = setTimeout(run, 260); }

  function currentPurchases() {
    var unit = unitEl.value;
    return readRows().map(function (r) {
      var price = parseFloat(r.price);
      return { date: r.date, cents: isFinite(price) ? Math.round(price * 100) : NaN, unit: unit, priceRaw: r.price };
    });
  }

  function persist(item, unit, rows) {
    if (!CTX || typeof CTX.merge !== 'function') return;
    try {
      CTX.merge({ vbSession: { item: item, unit: unit, purchases: rows, at: Date.now() } });
    } catch (_) {}
  }

  function run() {
    if (errEl) errEl.hidden = true;
    var item = (itemEl.value || '').trim();
    var unit = unitEl.value;
    var rows = readRows();
    persist(item, unit, rows);

    var purchases = currentPurchases().filter(function (p) {
      return p.cents > 0 && MW.parseISODay(p.date) != null;
    }).map(function (p) { return { cents: p.cents, date: p.date, unit: p.unit }; });

    // Live match chip (shows the tool recognized the item in the Cost Index).
    updateMatchChip(item);

    if (!item || purchases.length < 2) {
      while (resultEl.firstChild) resultEl.removeChild(resultEl.firstChild);
      resultEl.removeAttribute('data-has-result');
      return;
    }

    var res = MW.compute({ item: item, purchases: purchases, locale: ES ? 'es' : 'en' });
    render(res);
    resultEl.setAttribute('data-has-result', '1');

    track('Bench Multi-Date Computed', {
      tier: res.tier,
      dates: purchases.length <= 2 ? '2' : (purchases.length <= 4 ? '3-4' : '5+'),
      market: res.market.available ? (res.market.res && res.market.res.ok ? (res.market.res.thin ? 'thin' : (res.market.say ? res.market.say.tone : 'na')) : 'refused') : res.market.reason
    });
  }

  function updateMatchChip(item) {
    if (!matchChip) return;
    var Lookup = window.MuntinCostIndexLookup;
    var seed = window.MUNTIN_COST_INDEX;
    if (!Lookup || !seed || !item) { matchChip.hidden = true; return; }
    var ref = null;
    try { ref = Lookup.match(item, seed); } catch (_) { ref = null; }
    if (ref) {
      var label = (ES ? ref.label_es : ref.label_en) || ref.key;
      setHTML(matchChip, h`<span class="vb-chip-dot" aria-hidden="true"></span>${ES ? 'Coincide con el mercado: ' : 'Market match: '}<strong>${label}</strong>`);
      matchChip.hidden = false;
    } else {
      matchChip.hidden = true;
    }
  }

  // ---- two-line chart: your price vs market, indexed to 100 at window start --
  function chartSvg(res) {
    var m = res.market;
    if (!m.available || !m.series || m.series.values.length < 2) return '';
    var W = 640, H = 240, padL = 44, padR = 16, padT = 22, padB = 34;
    var t0 = MW.parseISODay(res.firstDate), t1 = MW.parseISODay(res.lastDate);
    if (t0 == null || t1 == null || t1 <= t0) return '';

    // Your points (rebased to 100 at first).
    var yourPts = res.purchases.map(function (p) {
      return { t: MW.parseISODay(p.date), v: 100 * p.cents / res.firstCents };
    });
    // Market series clipped to the window, rebased to 100 at the market value
    // nearest the first date.
    var mkNear0 = null, best0 = Infinity;
    for (var i = 0; i < m.series.values.length; i++) {
      var dt = MW.parseISODay(m.series.dates[i]);
      if (dt == null) continue;
      var g = Math.abs(dt - t0);
      if (g < best0) { best0 = g; mkNear0 = m.series.values[i]; }
    }
    if (!mkNear0) return '';
    var mkPts = [];
    for (var j = 0; j < m.series.values.length; j++) {
      var dtj = MW.parseISODay(m.series.dates[j]);
      if (dtj == null || dtj < t0 - 4 * 86400000 || dtj > t1 + 4 * 86400000) continue;
      mkPts.push({ t: Math.max(t0, Math.min(t1, dtj)), v: 100 * m.series.values[j] / mkNear0 });
    }
    if (mkPts.length < 2) {
      // Not enough in-window market points to draw a line; show endpoints.
      mkPts = [{ t: t0, v: 100 }];
      if (m.res && m.res.ok) mkPts.push({ t: t1, v: 100 * (1 + m.res.marketPct) });
    }

    var allV = yourPts.map(function (p) { return p.v; }).concat(mkPts.map(function (p) { return p.v; }));
    var minV = Math.min.apply(null, allV), maxV = Math.max.apply(null, allV);
    var padV = Math.max(2, (maxV - minV) * 0.12);
    minV -= padV; maxV += padV;
    var range = (maxV - minV) || 1;
    function X(t) { return padL + (W - padL - padR) * (t - t0) / (t1 - t0); }
    function Y(v) { return padT + (H - padT - padB) * (1 - (v - minV) / range); }

    function pathOf(pts) {
      return pts.map(function (p, i) { return (i ? 'L' : 'M') + X(p.t).toFixed(1) + ',' + Y(p.v).toFixed(1); }).join('');
    }
    var tone = (m.say && m.say.tone) || 'info';

    // gridline at 100 (the shared start baseline)
    var y100 = Y(100).toFixed(1);
    var svg =
      '<svg class="vb-chart" data-tone="' + escAttr(tone) + '" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H +
      '" role="img" aria-label="' + escAttr(T.chartAria) + '" preserveAspectRatio="xMidYMid meet">' +
      '<line x1="' + padL + '" y1="' + y100 + '" x2="' + (W - padR) + '" y2="' + y100 + '" class="vb-chart-base" stroke-dasharray="2 4"/>' +
      // market line (neutral, dashed)
      '<path d="' + pathOf(mkPts) + '" fill="none" class="vb-chart-market" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round" stroke-linecap="round"/>' +
      // your line (tone-colored via CSS, solid)
      '<path d="' + pathOf(yourPts) + '" fill="none" class="vb-chart-you" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>';
    // your dots
    yourPts.forEach(function (p) {
      svg += '<circle class="vb-chart-dot" cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="3.4"/>';
    });
    // axis labels: start & end dates, and the two endpoint index values
    svg += '<text x="' + padL + '" y="' + (H - 10) + '" class="vb-chart-axis" text-anchor="start">' + escAttr(fmtDate(res.firstDate)) + '</text>';
    svg += '<text x="' + (W - padR) + '" y="' + (H - 10) + '" class="vb-chart-axis" text-anchor="end">' + escAttr(fmtDate(res.lastDate)) + '</text>';
    svg += '<text x="' + (padL - 6) + '" y="' + (Y(100) + 4).toFixed(1) + '" class="vb-chart-axis" text-anchor="end">100</text>';
    svg += '</svg>';
    return svg;
  }
  function escAttr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---- the result -----------------------------------------------------------
  function render(res) {
    var m = res.market;
    var blocks = [];

    // 1) THE HEADLINE — the gap (only a full verdict when the market data supports it)
    blocks.push(headlineBlock(res));

    // 2) THE CHART
    var svg = chartSvg(res);
    if (svg) {
      blocks.push(h`<figure class="vb-chartwrap">${sh(svg)}<figcaption class="vb-chart-legend"><span class="vb-legend-you">${T.chartYou}</span><span class="vb-legend-mkt">${T.chartMarket}</span></figcaption></figure>`);
    }

    // 3) YOUR OWN HISTORY verdict (secondary — the trailing-median call)
    if (res.talkingPoint) {
      blocks.push(h`<div class="vb-subcard"><span class="vb-eyebrow">${T.ownHistoryEyebrow}</span><span class="vb-badge" data-tier="${res.tier}">${tierLabel(res.tier)}</span><p class="vb-verdict">${res.talkingPoint}</p></div>`);
    }

    // 4) TIMELINE (>=3 dated purchases)
    if (m.available && m.legs && m.legs.length >= 3) {
      blocks.push(timelineBlock(res));
    }

    // 5) ATTRIBUTION (only when a market read exists)
    if (m.available) {
      blocks.push(attributionBlock(res));
    }

    // 6) THE FUNNEL
    blocks.push(funnelBlock(res));

    // 7) on-device + clear
    blocks.push(h`<p class="vb-ondevice">${T.ondevice} <button type="button" class="vb-linkbtn" id="vbClearSaved">${T.clearSaved}</button></p>`);

    setHTML(resultEl, h`<div class="vb-result-inner">${blocks}</div>`);
    var cs = document.getElementById('vbClearSaved');
    if (cs) cs.addEventListener('click', clearAll);
  }

  function tierLabel(tier) {
    var en = { hike: 'Price hike', watch: 'Worth a glance', steady: 'In line', 'mixed-units': 'Check the units', insufficient: 'Add a price' };
    var es = { hike: 'Subida de precio', watch: 'Para vigilar', steady: 'En línea', 'mixed-units': 'Revisa las unidades', insufficient: 'Agrega un precio' };
    return (ES ? es : en)[tier] || tier;
  }

  function headlineBlock(res) {
    var m = res.market;
    var yourPct = res.yourChangePct;
    var yourLine = h`<div class="vb-metric"><span class="vb-metric-eyebrow">${T.yourMoveEyebrow}</span><span class="vb-metric-num" data-dir="${yourPct > 0 ? 'up' : yourPct < 0 ? 'down' : 'flat'}">${pctStr(yourPct)}</span><span class="vb-metric-sub">${money(res.firstCents)} → ${money(res.lastCents)}${res.unit ? ' /' + res.unit : ''}</span></div>`;

    // no market reference at all
    if (!m.available) {
      if (m.reason === 'no-match' || m.reason === 'no-series' || m.reason === 'no-index') {
        return h`<div class="vb-headline vb-headline--info">${yourLine}<div class="vb-headline-note"><h2 class="vb-h2">${T.noMatchHead}</h2><p>${T.noMatchBody}</p><p><a class="vb-inlink" href="${BASE}/cost-index/">${T.seeReading} <span aria-hidden="true">→</span></a></p></div></div>`;
      }
      return h`${yourLine}`;
    }

    var marketPct = (m.res && m.res.ok) ? m.res.marketPct : null;
    var marketLine = (marketPct != null)
      ? h`<div class="vb-metric"><span class="vb-metric-eyebrow">${T.marketEyebrow}</span><span class="vb-metric-num vb-metric-num--mkt" data-dir="${marketPct > 0 ? 'up' : marketPct < 0 ? 'down' : 'flat'}">${pctStr(marketPct)}</span><span class="vb-metric-sub">${m.label}${m.marketUnit ? ' · $/' + m.marketUnit : ''}</span></div>`
      : h`<div class="vb-metric"><span class="vb-metric-eyebrow">${T.marketEyebrow}</span><span class="vb-metric-num vb-metric-num--mkt" data-dir="flat">—</span><span class="vb-metric-sub">${m.label}</span></div>`;

    var verdict = '';
    var tone = (m.say && m.say.tone) || 'info';
    if (m.res && m.res.ok && !m.res.thin && m.say && m.say.ok) {
      // The star line: the gap, tone-colored.
      var gapPts = Math.abs(m.res.gapPts);
      var dirWord = m.res.gapPts >= 3 ? T.aboveMarket : m.res.gapPts <= -3 ? T.belowMarket : T.inlineMarket;
      var excess = (m.res.gapPts >= 3 && m.res.excessCents > 0)
        ? h`<p class="vb-headline-excess">${money(m.res.excessCents)}${res.unit ? '/' + res.unit : ''} ${T.beyond} ${fmtDate(res.firstDate)}–${fmtDate(res.lastDate)}.</p>`
        : '';
      verdict = h`<div class="vb-gap" data-tone="${tone}"><span class="vb-gap-num">${gapPts.toFixed(gapPts < 10 ? 1 : 0)}</span><span class="vb-gap-word">${T.pointsWord} ${dirWord}</span></div><p class="vb-headline-say">${m.say.headline}</p>${excess}`;
    } else if (m.say && m.say.headline) {
      // honest hedge / soft refusal (thin, too-close, out-of-range)
      verdict = h`<div class="vb-hedge" data-tone="${tone}"><p class="vb-headline-say">${m.say.headline}</p>${m.say.detail ? h`<p class="vb-headline-detail">${m.say.detail}</p>` : ''}</div>`;
    }

    return h`<div class="vb-headline" data-tone="${tone}"><div class="vb-metrics">${yourLine}<span class="vb-vs" aria-hidden="true">vs</span>${marketLine}</div>${verdict}</div>`;
  }

  function timelineBlock(res) {
    var m = res.market;
    var rows = m.legs.map(function (leg) {
      return h`<tr><td>${fmtDate(leg.date)}</td><td class="vb-num">${money(leg.cents)}</td><td class="vb-num" data-dir="${leg.yourCumPct > 0 ? 'up' : leg.yourCumPct < 0 ? 'down' : 'flat'}">${leg.yourCumPct === 0 ? '—' : pctStr(leg.yourCumPct)}</td><td class="vb-num vb-num--mkt" data-dir="${leg.marketCumPct == null ? 'flat' : leg.marketCumPct > 0 ? 'up' : leg.marketCumPct < 0 ? 'down' : 'flat'}">${leg.marketCumPct == null ? '—' : (leg.marketCumPct === 0 ? '—' : pctStr(leg.marketCumPct))}</td></tr>`;
    });
    return h`<div class="vb-subcard"><span class="vb-eyebrow">${T.timelineEyebrow}</span><div class="vb-timeline-wrap"><table class="vb-timeline"><thead><tr><th scope="col">${T.thDate}</th><th scope="col" class="vb-num">${T.thYou}</th><th scope="col" class="vb-num">${T.thYouCum}</th><th scope="col" class="vb-num">${T.thMarketCum}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function attributionBlock(res) {
    var m = res.market;
    var sources = (m.sources && m.sources.length) ? m.sources.map(labelForSource).join(', ') : 'USDA';
    var conf = m.confidence ? (T.conf[m.confidence] || m.confidence) : null;
    var reads = (m.series && m.series.values) ? m.series.values.length : 0;
    var window = (m.res && m.res.ok) ? (fmtDate(m.res.marketADate) + ' – ' + fmtDate(m.res.marketBDate)) : (m.seriesStart ? fmtDate(m.seriesStart) + ' – ' + fmtDate(m.seriesEnd) : '');
    var levelNote = '';
    if (m.level && m.level.comparable) {
      if (m.level.verdict === 'far-above-reference' || m.level.verdict === 'above-reference') {
        levelNote = h`<p class="vb-attr-level">${T.levelAbove} (${(m.level.gapPct > 0 ? '+' : '') + m.level.gapPct}%).</p>`;
      } else if (m.level.verdict === 'at-reference') {
        levelNote = h`<p class="vb-attr-level">${T.levelAt}</p>`;
      }
    }
    return h`<div class="vb-attr"><p class="vb-attr-wholesale">${T.attributionWholesale}</p><dl class="vb-attr-dl"><div><dt>${T.attributionSources}</dt><dd>${sources}</dd></div><div><dt>${T.attributionAsOf}</dt><dd>${window} · ${String(reads)}</dd></div>${conf ? h`<div><dt>${T.attributionConf}</dt><dd>${conf}</dd></div>` : ''}</dl>${levelNote}<p><a class="vb-inlink" href="${BASE}/cost-index/${m.key}/">${T.seeReading} <span aria-hidden="true">→</span></a></p></div>`;
  }

  function funnelBlock(res) {
    var m = res.market;
    var strong = (m.available && m.res && m.res.ok && !m.res.thin && m.say && m.say.tone === 'over') || res.tier === 'hike';
    var plate = h`<p class="vb-crosslink">${T.plateHook} <a class="vb-inlink" href="${BASE}/tools/plate-cost/">${T.seePlate} <span aria-hidden="true">→</span></a></p>`;

    if (strong) {
      return h`<aside class="vb-ledger" aria-labelledby="vbLedgerH"><span class="vb-ledger-eyebrow">${T.ledgerStrongEyebrow}</span><h2 class="vb-ledger-h" id="vbLedgerH">${T.ledgerStrongHead}</h2><p class="vb-ledger-lede">${T.marketOrVendor}</p><p class="vb-ledger-body"><strong>${T.ledgerStrongBody1}</strong> ${T.ledgerStrongBody2}</p><p class="vb-ledger-fine">${T.ledgerStrongBody3} ${T.earlyAccess}</p><a class="vb-ledger-cta plausible-event-name=Ledger+Route+Click plausible-event-source=vendor-benchmark" href="https://ledger.muntin.digital/">${T.seeLedger} <span aria-hidden="true">→</span></a></aside>${plate}`;
    }
    return h`<div class="vb-softbridge"><p>${T.ledgerSoft} <a class="vb-inlink plausible-event-name=Ledger+Route+Click plausible-event-source=vendor-benchmark" href="https://ledger.muntin.digital/">${T.seeLedger} <span aria-hidden="true">→</span></a></p></div>${plate}`;
  }

  var SOURCE_LABEL = {
    'usda': 'USDA (wholesale)', 'usda-lmr': 'USDA Livestock (LMR)',
    'usda-ams': 'USDA Market News', 'usda-ams-national': 'USDA Market News — National',
    'usda-ams-atlanta': 'USDA Market News — Atlanta', 'usda-ams-boston': 'USDA Market News — Boston',
    'usda-ams-baltimore': 'USDA Market News — Baltimore', 'usda-ams-chicago': 'USDA Market News — Chicago',
    'usda-ams-los-angeles': 'USDA Market News — Los Angeles', 'bls': 'BLS', 'fred': 'FRED'
  };
  function labelForSource(s) {
    return SOURCE_LABEL[s] || String(s).replace(/-/g, ' ').replace(/\busda\b/i, 'USDA');
  }

  // ---- actions ---------------------------------------------------------------
  function addRow() {
    var rows = readRows();
    var lastDate = rows.length ? rows[rows.length - 1].date : todayISO();
    rowsEl.appendChild(buildRow({ date: lastDate ? isoMinusDays(lastDate, -21) : todayISO() }));
    relabelRows();
    var inputs = rowsEl.querySelectorAll('.vb-prow:last-child input');
    if (inputs[0]) inputs[0].focus();
    schedule();
  }
  function clearAll() {
    itemEl.value = '';
    renderRows([{ date: isoMinusDays(todayISO(), 42) }, { date: todayISO() }]);
    while (resultEl.firstChild) resultEl.removeChild(resultEl.firstChild);
    resultEl.removeAttribute('data-has-result');
    if (matchChip) matchChip.hidden = true;
    if (CTX && typeof CTX.merge === 'function') { try { CTX.merge({ vbSession: null }); } catch (_) {} }
    itemEl.focus();
  }
  function loadExample() {
    // Illustrative operator prices; the market side is real, sourced USDA data.
    itemEl.value = 'ribeye';
    unitEl.value = 'lb';
    renderRows([
      { date: '2026-03-02', price: '12.20' },
      { date: '2026-04-06', price: '13.10' },
      { date: '2026-05-04', price: '14.40' }
    ]);
    track('Bench Example Loaded');
    run();
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---- restore / init --------------------------------------------------------
  function restore() {
    var saved = null;
    if (CTX && typeof CTX.get === 'function') { try { saved = CTX.get('vbSession'); } catch (_) { saved = null; } }
    if (saved && saved.item && Array.isArray(saved.purchases) && saved.purchases.length) {
      itemEl.value = saved.item;
      if (saved.unit) unitEl.value = saved.unit;
      renderRows(saved.purchases);
      run();
      return;
    }
    // Fresh: a two-row scaffold with a sensible 6-week window.
    renderRows([{ date: isoMinusDays(todayISO(), 42) }, { date: todayISO() }]);
  }

  rowsEl.addEventListener('input', schedule);
  rowsEl.addEventListener('change', schedule);
  rowsEl.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.vb-remove') : null;
    if (btn) {
      var row = btn.closest('.vb-prow');
      if (row && rowsEl.querySelectorAll('.vb-prow').length > 1) { row.remove(); relabelRows(); schedule(); }
    }
  });
  itemEl.addEventListener('input', schedule);
  unitEl.addEventListener('change', schedule);
  if (addBtn) { addBtn.textContent = '+ ' + T.add; addBtn.addEventListener('click', addRow); }
  if (exampleBtn) { exampleBtn.textContent = T.example; exampleBtn.addEventListener('click', loadExample); }
  if (clearBtn) { clearBtn.textContent = T.clear; clearBtn.addEventListener('click', clearAll); }

  restore();
  track('Bench Loaded');
})();
