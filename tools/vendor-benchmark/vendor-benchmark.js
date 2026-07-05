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
  var PARSE = window.MuntinParse;
  var SPIKE = window.MuntinSpike;
  var ASK = window.MuntinVendorAsk;
  var CONF = window.MuntinConformal;
  var ANOM = window.MuntinAnomaly;
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
    chartUncertain: 'Lecturas de mercado escasas — línea aproximada', showNumbers: 'Ver los números', tipGap: 'Diferencia:',
    timelineEyebrow: 'Tu ventana, fecha por fecha',
    thDate: 'Fecha', thYou: 'Tu precio', thYouCum: 'Tú (acum.)', thMarketCum: 'Mercado (acum.)',
    attributionWholesale: 'Referencia mayorista — tu precio entregado normalmente es mayor.',
    attributionSources: 'Fuentes', attributionAsOf: 'Lecturas de mercado',
    attributionConf: 'Confianza',
    conf: { high: 'alta', medium: 'media', low: 'baja', directional: 'direccional' },
    seeReading: 'Ver la lectura completa en el Índice de costos',
    marketLoading: 'Leyendo el mercado…',
    marketFailed: 'No se pudo cargar la referencia de mercado — tu comparación con tu propio historial sigue válida.',
    noMatchHead: 'Aún no tenemos una referencia de mercado para esto.',
    noMatchBody: 'Vendor Benchmark todavía compara tu precio contra tu propio historial (arriba). Revisa el Índice de costos para ver qué artículos sí seguimos.',
    levelAt: 'Tu nivel está dentro de un margen de entrega normal frente a la referencia mayorista.',
    levelAbove: 'Tu nivel también corre por encima de la referencia mayorista',
    levelCalib: 'El flete y la distribución normalmente suman margen, así que tómalo como tu nivel — no como prueba de una factura inflada. La tasa de cambio de arriba es la señal más fuerte.',
    receiptSummary: 'Cómo se midió esta diferencia',
    receiptDepthDeep: 'De 3 años de lecturas mayoristas semanales del USDA.',
    receiptDepthShort: 'De un historial de mercado reciente y corto.',
    rcReads: 'Lecturas', rcWindow: 'Ventana de mercado cubierta', rcOff: 'días de tu fecha',
    rcNearest: 'Lectura mayorista más cercana a tu',
    badPrice: 'No pudimos leer este precio.',
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
    anchorLead: 'Al ritmo del mercado, estarías cerca de', anchorTail: '— estás en',
    spikeStructural: 'Ese movimiento del mercado se ha sostenido — parece un reajuste real, no un pico.',
    spikeSpike: 'El mercado subió y luego retrocedió — puede que no se sostenga.',
    spikeEasing: 'El mercado ha ido bajando últimamente.',
    spikeEmerging: 'El movimiento del mercado es reciente y aún no se asienta — observa la próxima lectura.',
    ledgerCleanHead: 'Esta vez, tu proveedor siguió al mercado.',
    ledgerCleanBody: 'La única forma de saber que sigue así es vigilar cada factura — que es lo que hace Muntin Ledger.',
    ledgerThinHead: 'Aquí retuvimos la conclusión de mercado.',
    ledgerThinBody: 'Ledger igual lo archiva y marca una subida contra tu propio historial de precios.',
    askEyebrow: 'Llévaselo a tu proveedor', askCopy: 'Copiar', askCopied: 'Copiado',
    vendorNameLabel: 'Nombre del proveedor', vendorNamePlaceholder: 'tu proveedor',
    volumeLabel: '¿Cuánto compras por semana?', volumeUnitSuffix: 'por semana', volumeHint: 'opcional — para ver el impacto en dólares',
    volumeLead: 'A ese ritmo, esta diferencia corre cerca de', volumePerWeek: 'por semana', volumePerYear: 'al año si se mantiene',
    briefBtn: 'Preparar la hoja para tu proveedor', briefPrint: 'Imprimir', briefCopy: 'Copiar el resumen', briefCopied: 'Resumen copiado',
    jTitle: 'Tus artículos guardados', jClear: 'Borrar guardados', jThin: 'vigilar',
    jSince: 'Desde tu última revisión', jWiden: 'la diferencia creció', jNarrow: 'la diferencia se redujo',
    regimeLead: 'Todo el mercado cambió de nivel cerca del',
    regimeUp: 'un alza de todo el mercado, no solo tu proveedor — si se mantiene, prepárate para reajustar.',
    regimeDown: 'una baja de todo el mercado — un momento para renegociar.',
    forecastEyebrow: 'La próxima lectura del mercado',
    forecastA: 'El mayorista de este artículo suele moverse dentro de', forecastB: 'entre lecturas — una banda que ha cubierto',
    forecastC: 'de las últimas', forecastD: 'lecturas.',
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
    chartUncertain: 'Thin market reads — line is approximate', showNumbers: 'Show the numbers', tipGap: 'Gap:',
    timelineEyebrow: 'Your window, date by date',
    thDate: 'Date', thYou: 'Your price', thYouCum: 'You (cum.)', thMarketCum: 'Market (cum.)',
    attributionWholesale: 'Wholesale reference — your delivered price normally runs higher.',
    attributionSources: 'Sources', attributionAsOf: 'Market reads',
    attributionConf: 'Confidence',
    conf: { high: 'high', medium: 'medium', low: 'low', directional: 'directional' },
    seeReading: 'See the full reading in the Cost Index',
    marketLoading: 'Reading the market…',
    marketFailed: 'Couldn’t load the market reference — your own-history check below still stands.',
    noMatchHead: 'No market reference for this yet.',
    noMatchBody: 'Vendor Benchmark still checks your price against your own history (above). See the Cost Index for the items we track.',
    levelAt: 'Your level sits within a normal delivered markup over the wholesale reference.',
    levelAbove: 'Your level also runs above the wholesale reference',
    levelCalib: 'Freight and distribution normally add markup, so read this as your level — not proof of a padded bill. The rate-of-change above is the stronger signal.',
    receiptSummary: 'How this gap was measured',
    receiptDepthDeep: 'Drawn from 3 years of weekly USDA wholesale reads.',
    receiptDepthShort: 'Drawn from recent, short market history.',
    rcReads: 'Reads', rcWindow: 'Covered market window', rcOff: 'days off your date',
    rcNearest: 'Nearest wholesale read to your',
    badPrice: 'Couldn’t read this price.',
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
    anchorLead: 'At the market’s rate, you’d be near', anchorTail: '— you’re at',
    spikeStructural: 'That market move has held — this looks like a real reset, not a blip.',
    spikeSpike: 'The market ran up then pulled back — it may not hold.',
    spikeEasing: 'The market has been easing lately.',
    spikeEmerging: 'The market move is recent and hasn’t settled yet — watch the next read.',
    ledgerCleanHead: 'This time, your vendor tracked the market.',
    ledgerCleanBody: 'The only way to know it stays that way is to watch every invoice — which is what Muntin Ledger does.',
    ledgerThinHead: 'We held the market call here.',
    ledgerThinBody: 'Ledger still files this and flags a hike against your own price history.',
    askEyebrow: 'Take this to your vendor', askCopy: 'Copy', askCopied: 'Copied',
    vendorNameLabel: 'Vendor name', vendorNamePlaceholder: 'your vendor',
    volumeLabel: 'About how much do you buy a week?', volumeUnitSuffix: 'a week', volumeHint: 'optional — to see the dollar impact',
    volumeLead: 'At that pace, this gap runs about', volumePerWeek: 'a week', volumePerYear: 'a year if it holds',
    briefBtn: 'Make a one-page brief for your rep', briefPrint: 'Print', briefCopy: 'Copy the summary', briefCopied: 'Summary copied',
    jTitle: 'Your saved items', jClear: 'Clear saved items', jThin: 'watch',
    jSince: 'Since your last check', jWiden: 'the gap widened', jNarrow: 'the gap narrowed',
    regimeLead: 'The whole market shifted level around',
    regimeUp: 'a market-wide step up, not just your vendor — if it holds, expect to re-price.',
    regimeDown: 'a market-wide step down — a moment to renegotiate.',
    forecastEyebrow: 'The market’s next print',
    forecastA: 'Wholesale for this item usually moves within', forecastB: 'between reads — a band that has held for',
    forecastC: 'of the last', forecastD: 'reads.',
    errItem: 'Enter the item name.',
    errRows: 'Add at least two purchases with a date and price.'
  };

  // ---- small formatters ------------------------------------------------------
  function money(cents) { return '$' + (Math.round(cents) / 100).toFixed(2); }
  function moneyRound(cents) { return '$' + String(Math.round(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  // Whole dollars (with thousands separators) once past $100 — "$1,218" beats
  // "$1217.53" for the materiality figures; cents below that.
  function moneyAuto(cents) { return Math.abs(cents) >= 10000 ? moneyRound(cents) : money(cents); }
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

  // ---- lazy market seeds -----------------------------------------------------
  // The two Cost Index seeds are ~1MB; loading them render-blocking delays first
  // paint on a cheap kitchen phone. They ship as inert <script type=
  // "text/muntin-lazy-seed" data-src>; we promote them on idle. The own-history
  // verdict needs no seed and renders immediately; the market half fills in when
  // the seeds land. No fetch — a same-origin <script>, exactly like site.js.
  function seedsPresent() { return !!window.MUNTIN_COST_INDEX; }
  var seedsFailed = false, seedsRequested = false;
  function loadSeeds() {
    if (seedsPresent() || seedsRequested) return;
    var tags = document.querySelectorAll('script[type="text/muntin-lazy-seed"]');
    if (!tags.length) return; // seeds were shipped eager (no-JS/legacy) — nothing to do
    seedsRequested = true;
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 200); };
    idle(function () {
      Array.prototype.forEach.call(tags, function (tag) {
        var src = tag.getAttribute('data-src'); if (!src) return;
        var sc = document.createElement('script'); sc.src = src; sc.async = true;
        sc.onload = function () { run(); };                 // recompute the market half
        sc.onerror = function () { seedsFailed = true; run(); };
        document.head.appendChild(sc);
      });
    });
  }

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
    // type=text (not number): a number input silently rejects a comma-decimal
    // (ES "12,20") and hands back an empty value, which would drop the row and
    // move the window endpoints. We accept any format and parse it ourselves.
    pInput.type = 'text'; pInput.className = 'vb-input'; pInput.setAttribute('data-field', 'price');
    pInput.setAttribute('inputmode', 'decimal'); pInput.setAttribute('autocomplete', 'off');
    pInput.setAttribute('placeholder', '0.00'); pInput.setAttribute('aria-label', T.priceLabel);
    if (data.price != null && data.price !== '') pInput.value = data.price;
    var pId = 'vbp' + Math.round(performance.now() * 1000) + Math.floor(performance.now() % 89);
    pLab.setAttribute('for', pId); pInput.id = pId;
    var pHint = document.createElement('span');
    pHint.className = 'vb-prow-hint'; pHint.setAttribute('data-role', 'badprice'); pHint.hidden = true;
    pHint.textContent = T.badPrice;
    pWrap.appendChild(pLab); pWrap.appendChild(pInput); pWrap.appendChild(pHint);

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
  var chartModel = null; // populated by chartSvg; read by the hover crosshair
  function schedule() { clearTimeout(debounceT); debounceT = setTimeout(run, 260); }

  // Locale-aware price parse. Under ES a comma is the decimal ("12,20"); the
  // shared MuntinParse handles currency symbols, thousands separators and both
  // decimal conventions. Falls back to a comma-swap parseFloat if the module
  // is absent so the tool degrades rather than dropping every row.
  function parsePrice(raw) {
    if (raw == null || String(raw).trim() === '') return null;
    if (PARSE && typeof PARSE.parseLooseNumber === 'function') {
      var r = PARSE.parseLooseNumber(raw, { defaultLocale: ES ? 'eu' : 'us', nonNegative: true });
      return (typeof r.value === 'number' && isFinite(r.value)) ? r.value : null;
    }
    var n = parseFloat(String(raw).replace(',', '.'));
    return isFinite(n) && n >= 0 ? n : null;
  }

  function currentPurchases() {
    var unit = unitEl.value;
    return readRows().map(function (r) {
      var price = parsePrice(r.price);
      return { date: r.date, cents: price != null && price > 0 ? Math.round(price * 100) : NaN, unit: unit, priceRaw: r.price };
    });
  }

  // Flag rows whose price is present but unreadable, so a bad entry is shown —
  // never silently dropped (which would falsify the window).
  function flagBadPrices() {
    var rows = rowsEl.querySelectorAll('.vb-prow');
    for (var i = 0; i < rows.length; i++) {
      var pEl = rows[i].querySelector('[data-field="price"]');
      var hint = rows[i].querySelector('[data-role="badprice"]');
      if (!pEl || !hint) continue;
      var raw = (pEl.value || '').trim();
      var bad = raw !== '' && parsePrice(raw) == null;
      hint.hidden = !bad;
      if (bad) pEl.setAttribute('aria-invalid', 'true'); else pEl.removeAttribute('aria-invalid');
      rows[i].classList.toggle('vb-prow--bad', bad);
    }
  }

  function persist(item, unit, rows) {
    if (!CTX || typeof CTX.merge !== 'function') return;
    try {
      CTX.merge({ vbSession: { item: item, unit: unit, purchases: rows, at: Date.now() } });
    } catch (_) {}
  }

  // ---- the Price Journal: a private, on-device log of every check ------------
  // A one-shot calculator becomes a compounding cost record the operator owns.
  // Keyed by market key (or item name); each entry is the full state to reopen
  // plus the last honest gap. LRU-capped. All via MuntinContext — never leaves
  // the device. This is the accumulation moat and the honest Ledger on-ramp.
  var JOURNAL_KEY = 'vbJournal', JOURNAL_CAP = 40;
  var reopenBaseline = null; // {gapPts, at} stashed on reopen, for the trend note
  function readJournal() { try { var j = CTX && CTX.get(JOURNAL_KEY); return (j && typeof j === 'object') ? j : {}; } catch (_) { return {}; } }
  function writeJournal(map) { if (CTX && typeof CTX.merge === 'function') { var p = {}; p[JOURNAL_KEY] = map; try { CTX.merge(p); } catch (_) {} } }
  function journalKeyFor(res) { return (res.market && res.market.key) || ('item:' + (res.item || '').toLowerCase().replace(/\s+/g, ' ').trim()); }
  function saveToJournal(res, rows) {
    if (!CTX || !res.item) return;
    var clean = rows.filter(function (r) { return r.date && String(r.price).trim() !== ''; });
    if (clean.length < 2) return;
    var map = readJournal();
    var k = journalKeyFor(res);
    var m = res.market;
    map[k] = {
      item: res.item, unit: res.unit, purchases: clean, at: Date.now(),
      gapPts: (m && m.res && m.res.ok && !m.res.thin) ? m.res.gapPts : null,
      yourPct: res.yourChangePct,
      marketPct: (m && m.res && m.res.ok) ? m.res.marketPct : null,
      tier: res.tier, thin: !!(m && m.res && m.res.thin)
    };
    var keys = Object.keys(map);
    if (keys.length > JOURNAL_CAP) {
      keys.map(function (kk) { return { kk: kk, at: (map[kk] && map[kk].at) || 0 }; })
        .sort(function (a, b) { return a.at - b.at; })
        .slice(0, keys.length - JOURNAL_CAP)
        .forEach(function (e) { delete map[e.kk]; });
    }
    writeJournal(map);
  }
  function relTime(ts) {
    var days = Math.floor((Date.now() - ts) / 86400000);
    if (days < 1) return ES ? 'hoy' : 'today';
    if (days === 1) return ES ? 'ayer' : 'yesterday';
    if (days < 14) return ES ? ('hace ' + days + ' días') : (days + ' days ago');
    var wk = Math.round(days / 7);
    return ES ? ('hace ' + wk + ' semanas') : (wk + ' weeks ago');
  }
  var railEl = null;
  function injectJournalRail() {
    if (railEl || document.getElementById('vbJournalRail')) return;
    var panel = document.querySelector('.vb-panel');
    if (!panel || !panel.parentNode) return;
    railEl = document.createElement('div');
    railEl.id = 'vbJournalRail'; railEl.className = 'vb-journal'; railEl.hidden = true;
    railEl.addEventListener('click', onRailClick);
    panel.parentNode.insertBefore(railEl, panel.nextSibling);
  }
  function renderJournalRail() {
    if (!railEl) return;
    var map = readJournal();
    var items = Object.keys(map).map(function (k) { return { k: k, e: map[k] }; })
      .filter(function (x) { return x.e && x.e.item; })
      .sort(function (a, b) { return (Math.abs(b.e.gapPts || 0) - Math.abs(a.e.gapPts || 0)); });
    if (!items.length) { railEl.hidden = true; setHTML(railEl, ''); return; }
    var chips = items.map(function (x) {
      var e = x.e;
      var gapTxt = (typeof e.gapPts === 'number')
        ? h`<span class="vb-jchip-gap" data-tone="${e.gapPts >= 3 ? 'over' : e.gapPts <= -3 ? 'under' : 'match'}">${Math.abs(e.gapPts).toFixed(e.gapPts < 10 ? 1 : 0)} ${T.pointsWord}</span>`
        : h`<span class="vb-jchip-gap" data-tone="watch">${T.jThin}</span>`;
      return h`<button type="button" class="vb-jchip" data-jkey="${x.k}"><span class="vb-jchip-name">${e.item}</span>${gapTxt}<span class="vb-jchip-when">${relTime(e.at)}</span></button>`;
    });
    setHTML(railEl, h`<div class="vb-journal-head"><span class="vb-eyebrow">${T.jTitle}</span><button type="button" class="vb-linkbtn" data-jclear>${T.jClear}</button></div><div class="vb-journal-grid">${chips}</div>`);
    railEl.hidden = false;
  }
  function onRailClick(e) {
    var t = e.target; if (!t || !t.closest) return;
    if (t.closest('[data-jclear]')) { writeJournal({}); renderJournalRail(); return; }
    var chip = t.closest('.vb-jchip');
    if (chip) {
      var map = readJournal(); var entry = map[chip.getAttribute('data-jkey')];
      if (entry && entry.item) {
        itemEl.value = entry.item; if (entry.unit) unitEl.value = entry.unit;
        renderRows(entry.purchases);
        reopenBaseline = (typeof entry.gapPts === 'number') ? { gapPts: entry.gapPts, at: entry.at, key: chip.getAttribute('data-jkey') } : null;
        run();
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  // Screen-reader announcer. The result container is re-injected on every
  // keystroke, so it must NOT be an aria-live region (a SR would hear half-typed
  // fragments). Instead we push the settled, purpose-built srText sentence into a
  // dedicated polite live region on a delay longer than the compute debounce.
  var announceEl = null, announceT = null;
  function ensureAnnouncer() {
    if (announceEl || !resultEl.parentNode) return;
    resultEl.removeAttribute('aria-live');
    announceEl = document.createElement('p');
    announceEl.className = 'sr-only'; announceEl.setAttribute('role', 'status'); announceEl.setAttribute('aria-live', 'polite');
    resultEl.parentNode.insertBefore(announceEl, resultEl);
  }
  function scheduleAnnounce(res) {
    if (!announceEl) return;
    clearTimeout(announceT);
    announceT = setTimeout(function () {
      var m = res.market || {};
      var text = (m.say && m.say.srText) ? m.say.srText
        : (m.say && m.say.headline) ? (m.say.headline + (m.say.detail ? ' ' + m.say.detail : ''))
        : (res.talkingPoint || '');
      announceEl.textContent = text;
    }, 950);
  }

  function run() {
    if (errEl) errEl.hidden = true;
    var item = (itemEl.value || '').trim();
    var unit = unitEl.value;
    var rows = readRows();
    persist(item, unit, rows);
    flagBadPrices();

    var purchases = currentPurchases().filter(function (p) {
      return p.cents > 0 && MW.parseISODay(p.date) != null;
    }).map(function (p) { return { cents: p.cents, date: p.date, unit: p.unit }; });

    // Live match chip (shows the tool recognized the item in the Cost Index).
    updateMatchChip(item);

    if (!item || purchases.length < 2) {
      while (resultEl.firstChild) resultEl.removeChild(resultEl.firstChild);
      resultEl.removeAttribute('data-has-result');
      if (announceEl) { clearTimeout(announceT); announceEl.textContent = ''; }
      return;
    }

    var res = MW.compute({ item: item, purchases: purchases, locale: ES ? 'es' : 'en' });
    render(res);
    scheduleAnnounce(res);
    saveToJournal(res, rows);
    renderJournalRail();
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
  // Shades the divergence wedge (the gap IS the story), direct-labels the two
  // endpoints, and honours the withhold rule IN the chart: an uncertain market
  // (thin data or too few in-window reads) draws faint-dotted with no wedge, so
  // the picture never asserts more than the data supports.
  function chartSvg(res, tableId) {
    var m = res.market;
    if (!m.available || !m.series || m.series.values.length < 2) return '';
    var W = 640, H = 240, padL = 44, padR = 40, padT = 22, padB = 34;
    var t0 = MW.parseISODay(res.firstDate), t1 = MW.parseISODay(res.lastDate);
    if (t0 == null || t1 == null || t1 <= t0) return '';

    var yourPts = res.purchases.map(function (p) {
      return { t: MW.parseISODay(p.date), v: 100 * p.cents / res.firstCents, date: p.date, cents: p.cents };
    });
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
    // Synthetic = we had to fabricate the market endpoints (no real in-window
    // reads). Uncertain = synthetic OR the verdict itself was thin.
    var synthetic = false;
    if (mkPts.length < 2) {
      synthetic = true;
      mkPts = [{ t: t0, v: 100 }];
      if (m.res && m.res.ok) mkPts.push({ t: t1, v: 100 * (1 + m.res.marketPct) });
    }
    var uncertain = synthetic || (m.res && m.res.thin);
    if (mkPts.length < 2) return '';

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
    yourPts.forEach(function (p) { p.x = X(p.t); p.y = Y(p.v); });
    mkPts.forEach(function (p) { p.x = X(p.t); p.y = Y(p.v); });
    // Model the hover crosshair reads (populated as a side effect of render).
    chartModel = { W: W, H: H, padL: padL, padR: padR, padT: padT, padB: padB, t0: t0, t1: t1, yourPts: yourPts, mkPts: mkPts, uncertain: uncertain };
    var tone = (m.say && m.say.tone) || 'info';
    var y100 = Y(100).toFixed(1);

    var svg =
      '<svg class="vb-chart" data-tone="' + escAttr(tone) + '"' + (uncertain ? ' data-uncertain="1"' : '') +
      ' width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H +
      '" role="img" aria-label="' + escAttr(T.chartAria) + '"' + (tableId ? ' aria-describedby="' + tableId + '"' : '') + ' preserveAspectRatio="xMidYMid meet">' +
      '<line x1="' + padL + '" y1="' + y100 + '" x2="' + (W - padR) + '" y2="' + y100 + '" class="vb-chart-base"/>';

    // Divergence wedge — only when the market line is real (never over a
    // fabricated or thin market). Redundant to the solid-vs-dashed channel, so CVD-safe.
    if (!uncertain && yourPts.length >= 2 && mkPts.length >= 2) {
      var poly = yourPts.map(function (p) { return X(p.t).toFixed(1) + ',' + Y(p.v).toFixed(1); })
        .concat(mkPts.slice().reverse().map(function (p) { return X(p.t).toFixed(1) + ',' + Y(p.v).toFixed(1); }));
      svg += '<polygon class="vb-chart-wedge" points="' + poly.join(' ') + '"/>';
    }

    svg += '<path d="' + pathOf(mkPts) + '" fill="none" class="vb-chart-market" stroke-width="2" stroke-dasharray="' + (uncertain ? '2 5' : '5 4') + '" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<path d="' + pathOf(yourPts) + '" fill="none" class="vb-chart-you" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>';
    yourPts.forEach(function (p) {
      svg += '<circle class="vb-chart-dot" cx="' + X(p.t).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="3.4"/>';
    });

    // Direct endpoint labels (index values) — the reader sees where each line
    // ended without hunting the axis. Nudged apart if they'd collide.
    var yEnd = yourPts[yourPts.length - 1], mEnd = mkPts[mkPts.length - 1];
    var yY = Y(yEnd.v), mY = Y(mEnd.v);
    if (Math.abs(yY - mY) < 12) { if (yEnd.v >= mEnd.v) { yY -= 6; mY += 6; } else { yY += 6; mY -= 6; } }
    svg += '<text x="' + (W - padR + 4) + '" y="' + (yY + 3.5).toFixed(1) + '" class="vb-chart-endlabel vb-chart-endlabel--you" text-anchor="start">' + Math.round(yEnd.v) + '</text>';
    svg += '<text x="' + (W - padR + 4) + '" y="' + (mY + 3.5).toFixed(1) + '" class="vb-chart-endlabel vb-chart-endlabel--mkt" text-anchor="start">' + Math.round(mEnd.v) + '</text>';

    // Axis labels + the "100" baseline tick + an uncertain-market micro-note.
    svg += '<text x="' + padL + '" y="' + (H - 10) + '" class="vb-chart-axis" text-anchor="start">' + escAttr(fmtDate(res.firstDate)) + '</text>';
    svg += '<text x="' + (W - padR) + '" y="' + (H - 10) + '" class="vb-chart-axis" text-anchor="end">' + escAttr(fmtDate(res.lastDate)) + '</text>';
    svg += '<text x="' + (padL - 6) + '" y="' + (Y(100) + 4).toFixed(1) + '" class="vb-chart-axis" text-anchor="end">100</text>';
    if (uncertain) {
      svg += '<text x="' + ((padL + W - padR) / 2).toFixed(1) + '" y="' + (padT - 8) + '" class="vb-chart-note" text-anchor="middle">' + escAttr(T.chartUncertain) + '</text>';
    }
    svg += '</svg>';
    return svg;
  }

  // The chart's accessible twin — a keyboard-reachable table of the same numbers,
  // rendered in EVERY case (not only when a timeline shows), so the chart is
  // never the only way to the values.
  function chartTable(res, tableId) {
    var m = res.market;
    if (!m.available || !m.legs || !m.legs.length) return '';
    var rows = m.legs.map(function (leg) {
      return h`<tr><td>${fmtDate(leg.date)}</td><td class="vb-num">${money(leg.cents)}</td><td class="vb-num" data-dir="${leg.yourCumPct > 0 ? 'up' : leg.yourCumPct < 0 ? 'down' : 'flat'}">${leg.yourCumPct === 0 ? '—' : pctStr(leg.yourCumPct)}</td><td class="vb-num vb-num--mkt" data-dir="${leg.marketCumPct == null ? 'flat' : leg.marketCumPct > 0 ? 'up' : leg.marketCumPct < 0 ? 'down' : 'flat'}">${leg.marketCumPct == null ? '—' : (leg.marketCumPct === 0 ? '—' : pctStr(leg.marketCumPct))}</td></tr>`;
    });
    return h`<details class="vb-chart-table" id="${tableId}"><summary>${T.showNumbers}</summary><div class="vb-timeline-wrap"><table class="vb-timeline"><thead><tr><th scope="col">${T.thDate}</th><th scope="col" class="vb-num">${T.thYou}</th><th scope="col" class="vb-num">${T.thYouCum}</th><th scope="col" class="vb-num">${T.thMarketCum}</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }
  function escAttr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Spike-vs-structural read of the MARKET move — "will it stick?". Judged over a
  // recent window (not the full 3-yr series, which over-calls "structural" against
  // the long-run floor). Withholds below the classifier's minimum history.
  function classifyMarketSpike(res) {
    var m = res.market;
    if (!SPIKE || !m || !m.available || !(m.res && m.res.ok) || !m.series || !m.series.values) return null;
    // Only characterize "will it stick?" when the market actually moved in the
    // operator's window — otherwise a recent-regime read (e.g. "structural")
    // pinned under a "+0.5%" headline reads as a contradiction.
    if (Math.abs(m.res.marketPct) < 0.05) return null;
    var vals = m.series.values, dates = m.series.dates, N = vals.length, start = Math.max(0, N - 26);
    var pts = [];
    for (var i = N - 1; i >= start; i--) {          // newest first
      if (typeof vals[i] === 'number' && vals[i] > 0) pts.push({ level: { medianCents: vals[i] }, asOf: dates[i] });
    }
    if (pts.length < 8) return null;
    try { return SPIKE.classify(pts); } catch (_) { return null; }
  }
  function spikeSay(spike) {
    if (!spike) return null;
    if (spike.verdict === 'structural') return { tone: 'over', text: T.spikeStructural };
    if (spike.verdict === 'spike') return { tone: 'watch', text: T.spikeSpike };
    if (spike.verdict === 'easing') return { tone: 'under', text: T.spikeEasing };
    if (spike.verdict === 'emerging') return { tone: 'watch', text: T.spikeEmerging };
    return null; // flat / insufficient → withhold
  }

  // "At the market's rate, you'd be near $Y" — the honest counter-number. Rides on
  // the operator's OWN first-window price moved only by the sourced market %-change
  // (excessCents = lastCents − impliedBCents), never "the market supports $Y".
  function anchorCentsOf(res) {
    var m = res.market;
    if (!(m && m.res && m.res.ok) || typeof m.res.excessCents !== 'number') return null;
    var c = res.lastCents - m.res.excessCents;
    return c > 0 ? c : null;
  }

  // ---- the result -----------------------------------------------------------
  // Hover crosshair — turns the static chart into an instrument you interrogate.
  // Enhances, never gates: every value is also in the table twin and on keyboard.
  function nearestByT(pts, t) {
    var best = null, bd = Infinity;
    for (var i = 0; i < pts.length; i++) { var d = Math.abs(pts[i].t - t); if (d < bd) { bd = d; best = pts[i]; } }
    return best;
  }
  function wireChartHover() {
    if (!chartModel) return;
    var wrap = resultEl.querySelector('.vb-chartwrap');
    var svg = wrap && wrap.querySelector('.vb-chart');
    if (!wrap || !svg) return;
    var model = chartModel, NS = 'http://www.w3.org/2000/svg';
    var cross = document.createElementNS(NS, 'line');
    cross.setAttribute('class', 'vb-chart-cross'); cross.setAttribute('y1', model.padT); cross.setAttribute('y2', model.H - model.padB);
    cross.style.display = 'none'; svg.appendChild(cross);
    var dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('class', 'vb-chart-cross-dot'); dot.setAttribute('r', 4); dot.style.display = 'none'; svg.appendChild(dot);
    var tip = document.createElement('div'); tip.className = 'vb-chart-tip'; tip.hidden = true; wrap.appendChild(tip);

    function show(clientX) {
      var rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      var frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      var plotX = Math.max(model.padL, Math.min(model.W - model.padR, frac * model.W));
      var t = model.t0 + (plotX - model.padL) / (model.W - model.padL - model.padR) * (model.t1 - model.t0);
      var yn = nearestByT(model.yourPts, t);
      if (!yn) return;
      var mn = nearestByT(model.mkPts, yn.t);
      cross.setAttribute('x1', yn.x); cross.setAttribute('x2', yn.x); cross.style.display = '';
      dot.setAttribute('cx', yn.x); dot.setAttribute('cy', yn.y); dot.style.display = '';
      tip.textContent = '';
      var dl = document.createElement('div'); dl.className = 'vb-tip-date'; dl.textContent = fmtDate(yn.date); tip.appendChild(dl);
      var r1 = document.createElement('div'); r1.className = 'vb-tip-row';
      var v1 = document.createElement('strong'); v1.textContent = money(yn.cents); r1.appendChild(v1);
      r1.appendChild(document.createTextNode(' · ' + T.chartYou + ' ' + Math.round(yn.v))); tip.appendChild(r1);
      if (mn) {
        var r2 = document.createElement('div'); r2.className = 'vb-tip-row';
        var v2 = document.createElement('strong'); v2.textContent = String(Math.round(mn.v)); r2.appendChild(v2);
        r2.appendChild(document.createTextNode(' · ' + T.chartMarket)); tip.appendChild(r2);
        var gap = Math.round(yn.v) - Math.round(mn.v);
        var r3 = document.createElement('div'); r3.className = 'vb-tip-gap';
        r3.textContent = T.tipGap + ' ' + (gap > 0 ? '+' : '') + gap; tip.appendChild(r3);
      }
      tip.hidden = false;
      var wrapRect = wrap.getBoundingClientRect();
      var px = (yn.x / model.W) * rect.width + (rect.left - wrapRect.left);
      tip.style.left = Math.max(4, Math.min(wrapRect.width - tip.offsetWidth - 4, px - tip.offsetWidth / 2)) + 'px';
    }
    function hide() { cross.style.display = 'none'; dot.style.display = 'none'; tip.hidden = true; }
    svg.addEventListener('pointermove', function (e) { show(e.clientX); });
    svg.addEventListener('pointerdown', function (e) { show(e.clientX); }); // tap-to-inspect on touch
    svg.addEventListener('pointerleave', hide);
  }

  function render(res) {
    var m = res.market;
    var spike = classifyMarketSpike(res);
    chartModel = null;
    var blocks = [];

    // 1) THE HEADLINE — the gap (only a full verdict when the market data supports it)
    blocks.push(headlineBlock(res));

    // 1b) "Will it stick?" — spike-vs-structural read of the market move.
    var sSay = spikeSay(spike);
    if (sSay) {
      blocks.push(h`<p class="vb-spike" data-tone="${sSay.tone}">${sSay.text}</p>`);
    }

    // 1c) "Since your last check" — only when this item was reopened from the journal.
    var jt = journalTrendBlock(res);
    if (jt) blocks.push(jt);

    // 2) THE CHART + its accessible table twin (the numbers are never chart-only)
    var tableId = 'vbChartTable';
    var svg = chartSvg(res, tableId);
    if (svg) {
      blocks.push(h`<figure class="vb-chartwrap">${sh(svg)}<figcaption class="vb-chart-legend"><span class="vb-legend-you">${T.chartYou}</span><span class="vb-legend-mkt">${T.chartMarket}</span></figcaption>${chartTable(res, tableId)}</figure>`);
    }

    // 2b) THE ACTION — the exact line to read to the rep + the brief (only on a real vendor gap)
    var action = actionBlock(res, spike);
    if (action) blocks.push(action);

    // 3) YOUR OWN HISTORY verdict (secondary — the trailing-median call)
    if (res.talkingPoint) {
      blocks.push(h`<div class="vb-subcard"><span class="vb-eyebrow">${T.ownHistoryEyebrow}</span><span class="vb-badge" data-tier="${res.tier}">${tierLabel(res.tier)}</span><p class="vb-verdict">${res.talkingPoint}</p></div>`);
    }

    // 4) MARKET OUTLOOK — regime-break (did the whole market step?) + the honest
    //    coverage-validated next-print forecast. Both self-withhold on thin data.
    var rb = regimeBreakBlock(res); if (rb) blocks.push(rb);
    var fc = forecastBlock(res); if (fc) blocks.push(fc);

    // 5) ATTRIBUTION (only when a market read exists)
    if (m.available) {
      blocks.push(attributionBlock(res));
    }

    // 6) THE FUNNEL
    blocks.push(funnelBlock(res, spike));

    // 7) on-device + clear
    blocks.push(h`<p class="vb-ondevice">${T.ondevice} <button type="button" class="vb-linkbtn" id="vbClearSaved">${T.clearSaved}</button></p>`);

    setHTML(resultEl, h`<div class="vb-result-inner">${blocks}</div>`);
    wireChartHover();
  }

  // One delegated handler for everything inside the re-rendered result.
  function onResultClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#vbClearSaved')) { clearAll(); return; }
    var copyBtn = t.closest('.vb-copy');
    if (copyBtn) {
      var action = copyBtn.closest('.vb-action');
      var isBrief = copyBtn.hasAttribute('data-copy-brief');
      var text;
      if (isBrief) { var b = action && action.querySelector('[data-brief]'); text = b ? b.getAttribute('data-brief-text') : ''; }
      else { var a = action && action.querySelector('.vb-ask'); text = a ? a.textContent : ''; }
      copyText(text, copyBtn, isBrief ? T.briefCopied : T.askCopied);
      track(isBrief ? 'Bench Brief Copied' : 'Bench Ask Copied');
      return;
    }
    var printBtn = t.closest('.vb-print-btn');
    if (printBtn) { doPrint(printBtn.closest('.vb-action')); track('Bench Brief Printed'); }
  }

  // MS2 — regime-break: did the WHOLE market step to a new level (Pettitt), or is
  // this one vendor? Only asserted when the break is significant AND lands inside/
  // adjacent to the operator's window (an old break isn't why their invoice moved).
  function regimeBreakBlock(res) {
    var m = res.market;
    if (!ANOM || !m || !m.available || !m.series || !m.series.values || m.series.values.length < 16) return '';
    // Judge a RECENT window — Pettitt on the full 3-yr series surfaces a 2-year-old
    // structural shift, not why this invoice moved. A break in the recent window
    // near the operator's dates is the coherent, relevant one.
    var vals = m.series.values, dates = m.series.dates, N = vals.length, start = Math.max(0, N - 30);
    var rv = vals.slice(start), rd = dates.slice(start), cp;
    if (rv.length < 12) return '';
    try { cp = ANOM.pettitt(rv); } catch (_) { return ''; }
    if (!cp || !cp.significant || cp.index == null) return '';
    var bd = rd[cp.index]; if (!bd) return '';
    var bt = MW.parseISODay(bd), f = MW.parseISODay(res.firstDate), l = MW.parseISODay(res.lastDate);
    if (bt == null || f == null || l == null) return '';
    if (bt < f - 45 * 86400000 || bt > l + 21 * 86400000) return ''; // not near the operator's window
    var before = rv.slice(0, cp.index + 1), after = rv.slice(cp.index + 1);
    if (!after.length) return '';
    var up = ANOM.median(after) > ANOM.median(before);
    return h`<p class="vb-outlook" data-tone="${up ? 'over' : 'under'}"><strong>${T.regimeLead} ${fmtDate(bd)}</strong> — ${up ? T.regimeUp : T.regimeDown}</p>`;
  }

  // MS1 — the honest next-print band: a coverage-VALIDATED conformal interval on the
  // deep wholesale series, expressed as a ±% (never a $ level to avoid a "should-pay"
  // misread) with its walk-forward hit-rate. Withheld on thin/short history or when
  // coverage can't be published.
  function forecastBlock(res) {
    var m = res.market;
    if (!CONF || !m || !m.available || m.seriesKind !== 'deep' || !m.series || m.series.values.length < 24) return '';
    if (m.confidence === 'low' || m.confidence === 'directional') return '';
    var out;
    try { out = CONF.conformalNext(m.series.values, { calibrate: true }); } catch (_) { return ''; }
    if (!out || !out.interval || out.coverage == null || !(out.point > 0)) return '';
    var point = out.point, lo = out.interval[0], hi = out.interval[1];
    var band = Math.round(Math.max((hi - point) / point, (point - lo) / point) * 100);
    if (!(band > 0) || band > 60) return '';
    var cov = Math.round(out.coverage * 100), reads = out.nTested;
    return h`<div class="vb-forecast"><span class="vb-eyebrow">${T.forecastEyebrow}</span><p>${T.forecastA} ±${String(band)}% ${T.forecastB} ${String(cov)}% ${T.forecastC} ${String(reads)} ${T.forecastD}</p><p class="vb-forecast-fine">${T.attributionWholesale}</p></div>`;
  }

  function journalTrendBlock(res) {
    if (!reopenBaseline || reopenBaseline.key !== journalKeyFor(res)) return '';
    var m = res.market;
    if (!(m && m.res && m.res.ok && !m.res.thin)) return '';
    var now = m.res.gapPts, was = reopenBaseline.gapPts;
    if (Math.abs(now - was) < 1) return '';
    var widened = Math.abs(now) > Math.abs(was);
    return h`<p class="vb-jtrend" data-tone="${widened ? 'over' : 'under'}">${T.jSince} ${relTime(reopenBaseline.at)}, ${widened ? T.jWiden : T.jNarrow} ${Math.abs(was).toFixed(was < 10 ? 1 : 0)} → ${Math.abs(now).toFixed(now < 10 ? 1 : 0)} ${T.pointsWord}.</p>`;
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
      // Distinguish "seeds still loading / failed" from "no reference for this
      // item" — saying "not tracked" while the market is mid-load is a misstatement.
      if (!seedsPresent()) {
        var msg = seedsFailed ? T.marketFailed : T.marketLoading;
        return h`<div class="vb-headline">${yourLine}<div class="vb-headline-note"><p class="vb-loading${seedsFailed ? '' : ' vb-loading--pulse'}" role="status">${msg}</p></div></div>`;
      }
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
      var uSuf = res.unit ? '/' + res.unit : '';
      var excess = (m.res.gapPts >= 3 && m.res.excessCents > 0)
        ? h`<p class="vb-headline-excess">${money(m.res.excessCents)}${uSuf} ${T.beyond} ${fmtDate(res.firstDate)}–${fmtDate(res.lastDate)}.</p>`
        : '';
      var anchorCents = anchorCentsOf(res);
      var anchor = (m.res.gapPts >= 3 && m.res.excessCents > 0 && anchorCents != null)
        ? h`<p class="vb-anchor"><strong>${T.anchorLead}</strong> ${money(anchorCents)}${uSuf} ${T.anchorTail} ${money(res.lastCents)}${uSuf}.</p>`
        : '';
      verdict = h`<div class="vb-gap" data-tone="${tone}"><span class="vb-gap-num">${gapPts.toFixed(gapPts < 10 ? 1 : 0)}</span><span class="vb-gap-word">${T.pointsWord} ${dirWord}</span></div><p class="vb-headline-say">${m.say.headline}</p>${excess}${anchor}`;
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

  // The wholesale market value at a specific series date (the reads the verdict
  // snapped to are always exact series dates), for the receipt.
  function marketValueAt(m, dateStr) {
    if (!m.series || !m.series.dates) return null;
    for (var i = 0; i < m.series.dates.length; i++) {
      if (m.series.dates[i] === dateStr) return m.series.values[i];
    }
    return null;
  }

  // The receipt: a default-collapsed disclosure of the exact two dated wholesale
  // reads the gap was measured between, how far each sat from the invoice date,
  // and how deep the series is. Pure disclosure of numbers the math already used.
  function receiptBits(res) {
    var m = res.market;
    if (!(m.res && m.res.ok)) return '';
    var valA = marketValueAt(m, m.res.marketADate);
    var valB = marketValueAt(m, m.res.marketBDate);
    var depth = m.seriesKind === 'deep' ? T.receiptDepthDeep : T.receiptDepthShort;
    var reads = (m.series && m.series.values) ? m.series.values.length : 0;
    var lineA = h`<li>${T.rcNearest} ${fmtDate(res.firstDate)}: <strong>${fmtDate(m.res.marketADate)}</strong>${valA != null ? h`, ${money(valA)}` : ''} <span class="vb-rc-off">(~${String(m.res.aGapDays)} ${T.rcOff})</span></li>`;
    var lineB = h`<li>${T.rcNearest} ${fmtDate(res.lastDate)}: <strong>${fmtDate(m.res.marketBDate)}</strong>${valB != null ? h`, ${money(valB)}` : ''} <span class="vb-rc-off">(~${String(m.res.bGapDays)} ${T.rcOff})</span></li>`;
    return h`<details class="vb-receipt"><summary>${T.receiptSummary}</summary><ul class="vb-rc-list">${lineA}${lineB}</ul><p class="vb-rc-meta">${T.rcWindow}: ${fmtDate(m.res.marketADate)} – ${fmtDate(m.res.marketBDate)} · ${T.rcReads}: ${String(reads)}. ${depth}</p></details>`;
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
        // State the fact and defuse it in the same breath — a delivered price
        // above the wholesale reference is normal, never proof of overpaying.
        levelNote = h`<p class="vb-attr-level">${T.levelAbove} (${(m.level.gapPct > 0 ? '+' : '') + m.level.gapPct}%). ${T.levelCalib}</p>`;
      } else if (m.level.verdict === 'at-reference') {
        levelNote = h`<p class="vb-attr-level">${T.levelAt}</p>`;
      }
    }
    return h`<div class="vb-attr"><p class="vb-attr-wholesale">${T.attributionWholesale}</p><dl class="vb-attr-dl"><div><dt>${T.attributionSources}</dt><dd>${sources}</dd></div><div><dt>${T.attributionAsOf}</dt><dd>${window} · ${String(reads)}</dd></div>${conf ? h`<div><dt>${T.attributionConf}</dt><dd>${conf}</dd></div>` : ''}</dl>${levelNote}${receiptBits(res)}<p><a class="vb-inlink" href="${BASE}/cost-index/${m.key}/">${T.seeReading} <span aria-hidden="true">→</span></a></p></div>`;
  }

  function softBridge(head, body) {
    return h`<div class="vb-softbridge"><p>${head ? h`<strong>${head}</strong> ` : ''}${body} <a class="vb-inlink plausible-event-name=Ledger+Route+Click plausible-event-source=vendor-benchmark" href="https://ledger.muntin.digital/">${T.seeLedger} <span aria-hidden="true">→</span></a></p></div>`;
  }
  function funnelBlock(res, spike) {
    var m = res.market;
    var okMarket = m.available && m.res && m.res.ok;
    var isOver = okMarket && !m.res.thin && m.say && m.say.tone === 'over';
    // A reverting spike softens the vendor framing — never send an operator to
    // fight a vendor over a market move that may not hold.
    var spikeReverting = spike && spike.verdict === 'spike';
    var strong = (isOver && !spikeReverting) || res.tier === 'hike';
    var plate = h`<p class="vb-crosslink">${T.plateHook} <a class="vb-inlink" href="${BASE}/tools/plate-cost/">${T.seePlate} <span aria-hidden="true">→</span></a></p>`;

    if (strong) {
      return h`<aside class="vb-ledger" aria-labelledby="vbLedgerH"><span class="vb-ledger-eyebrow">${T.ledgerStrongEyebrow}</span><h2 class="vb-ledger-h" id="vbLedgerH">${T.ledgerStrongHead}</h2><p class="vb-ledger-lede">${T.marketOrVendor}</p><p class="vb-ledger-body"><strong>${T.ledgerStrongBody1}</strong> ${T.ledgerStrongBody2}</p><p class="vb-ledger-fine">${T.ledgerStrongBody3} ${T.earlyAccess}</p><a class="vb-ledger-cta plausible-event-name=Ledger+Route+Click plausible-event-source=vendor-benchmark" href="https://ledger.muntin.digital/">${T.seeLedger} <span aria-hidden="true">→</span></a></aside>${plate}`;
    }
    // Clean vendor — this time they tracked the market. Don't sell a false alarm.
    if (okMarket && !m.res.thin && m.say && (m.say.tone === 'match' || m.say.tone === 'under') && !isOver) {
      return h`${softBridge(T.ledgerCleanHead, T.ledgerCleanBody)}${plate}`;
    }
    // Withheld / thin market call — the honest-hedge trust moment.
    if (m.available && m.res && (m.res.thin || !m.res.ok)) {
      return h`${softBridge(T.ledgerThinHead, T.ledgerThinBody)}${plate}`;
    }
    // No market reference, or an over-but-reverting spike → the plain soft bridge.
    return h`${softBridge(null, T.ledgerSoft)}${plate}`;
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

  // ---- optional form extras: vendor name + weekly volume ---------------------
  // Injected into the form (not the re-rendered result) so they keep focus and
  // value across recomputes. Collapsed by default so the default form stays clean.
  var vendorEl = null, volumeEl = null;
  function injectExtras() {
    var panel = document.querySelector('.vb-panel');
    if (!panel || document.getElementById('vbVendor')) return;
    var det = document.createElement('details'); det.className = 'vb-more';
    var sum = document.createElement('summary');
    sum.textContent = ES ? 'Nombre del proveedor y volumen semanal (opcional)' : 'Vendor name & weekly volume (optional)';
    det.appendChild(sum);
    var grid = document.createElement('div'); grid.className = 'vb-more-grid';

    var vf = document.createElement('div'); vf.className = 'vb-field';
    var vl = document.createElement('label'); vl.setAttribute('for', 'vbVendor'); vl.textContent = T.vendorNameLabel;
    vendorEl = document.createElement('input');
    vendorEl.type = 'text'; vendorEl.id = 'vbVendor'; vendorEl.className = 'vb-input';
    vendorEl.setAttribute('autocomplete', 'off'); vendorEl.setAttribute('placeholder', T.vendorNamePlaceholder);
    vf.appendChild(vl); vf.appendChild(vendorEl);

    var qf = document.createElement('div'); qf.className = 'vb-field';
    var ql = document.createElement('label'); ql.setAttribute('for', 'vbVolume');
    ql.appendChild(document.createTextNode(T.volumeLabel + ' '));
    var qh = document.createElement('span'); qh.className = 'vb-hint'; qh.textContent = '— ' + T.volumeHint;
    ql.appendChild(qh);
    volumeEl = document.createElement('input');
    volumeEl.type = 'text'; volumeEl.id = 'vbVolume'; volumeEl.className = 'vb-input';
    volumeEl.setAttribute('inputmode', 'decimal'); volumeEl.setAttribute('autocomplete', 'off'); volumeEl.setAttribute('placeholder', '0');
    qf.appendChild(ql); qf.appendChild(volumeEl);

    grid.appendChild(vf); grid.appendChild(qf); det.appendChild(grid); panel.appendChild(det);
    vendorEl.addEventListener('input', schedule);
    volumeEl.addEventListener('input', schedule);
  }
  function currentVendor() { return (vendorEl && vendorEl.value.trim()) || null; }
  function currentVolume() { return volumeEl ? parsePrice(volumeEl.value) : null; }

  // ---- the action: take this to your rep ------------------------------------
  function composeBrief(res, askText) {
    var m = res.market;
    var uSuf = res.unit ? '/' + res.unit : '';
    var L = [];
    L.push((ES ? 'Artículo: ' : 'Item: ') + res.item + ' (' + fmtDate(res.firstDate) + ' – ' + fmtDate(res.lastDate) + ')');
    L.push((ES ? 'Tu precio: ' : 'Your price: ') + money(res.firstCents) + ' → ' + money(res.lastCents) + uSuf + ' (' + pctStr(res.yourChangePct) + ')');
    if (m.res && m.res.ok) L.push((ES ? 'Mercado mayorista, misma ventana: ' : 'Wholesale market, same window: ') + pctStr(m.res.marketPct));
    if (m.res && m.res.ok) L.push((ES ? 'Diferencia del proveedor: ' : 'Vendor gap: ') + Math.abs(m.res.gapPts).toFixed(m.res.gapPts < 10 ? 1 : 0) + ' ' + T.pointsWord + (m.res.excessCents > 0 ? ' (' + money(m.res.excessCents) + uSuf + ')' : ''));
    var anchorCents = anchorCentsOf(res);
    if (anchorCents != null) L.push(T.anchorLead + ' ' + money(anchorCents) + uSuf + ' ' + T.anchorTail + ' ' + money(res.lastCents) + uSuf + '.');
    var vol = currentVolume();
    if (vol != null && vol > 0 && vol < 100000 && m.res && m.res.excessCents > 0) {
      var perYear = (m.res.excessCents / 100) * vol * 52;
      L.push(T.volumeLead + ' ' + moneyAuto(Math.round(perYear * 100 / 52)) + ' ' + T.volumePerWeek + ' — ' + moneyAuto(Math.round(perYear * 100)) + ' ' + T.volumePerYear + '.');
    }
    if (askText) { L.push(''); L.push(askText); }
    L.push('');
    L.push((ES ? 'Fuente: Muntin Cost Index (mayorista USDA). ' : 'Source: Muntin Cost Index (USDA wholesale). ') + T.attributionWholesale);
    return L.join('\n');
  }

  function actionBlock(res, spike) {
    var m = res.market;
    if (!(m.available && m.res && m.res.ok && !m.res.thin && m.say && m.say.tone === 'over' && m.res.gapPts >= 3)) return '';
    if (spike && spike.verdict === 'spike') return ''; // don't script a fight over a reverting spike

    var askText = '';
    if (ASK && typeof ASK.build === 'function') {
      try {
        // Explicit attribution — only 'vendor' when the gate above passed, so the
        // module never fabricates a one-sided read. It discloses both numbers.
        var card = ASK.build({
          decomposition: { attribution: 'vendor', gated: false },
          ingredient: m.label, vendor: currentVendor() || T.vendorNamePlaceholder,
          ownDeltaPct: m.res.ownerPct, marketDeltaPct: m.res.marketPct,
          unitPriceText: money(res.lastCents) + (res.unit ? '/' + res.unit : ''),
          locale: ES ? 'es' : 'en'
        });
        if (card && card.ask) askText = card.ask;
      } catch (_) {}
    }

    var vol = currentVolume(), volLine = '';
    if (vol != null && vol > 0 && vol < 100000 && m.res.excessCents > 0) {
      var perWeek = (m.res.excessCents / 100) * vol, perYear = perWeek * 52;
      volLine = h`<p class="vb-vol"><strong>${T.volumeLead} ${moneyAuto(Math.round(perWeek * 100))} ${T.volumePerWeek}</strong> — ${moneyAuto(Math.round(perYear * 100))} ${T.volumePerYear}.</p>`;
    }

    var briefText = composeBrief(res, askText);
    var briefLines = briefText.split('\n').map(function (l) { return l ? h`<p>${l}</p>` : h`<p> </p>`; });
    var askP = askText ? h`<p class="vb-ask">${askText}</p>` : '';
    return h`<div class="vb-action"><span class="vb-eyebrow">${T.askEyebrow}</span>${askP}${volLine}<div class="vb-action-btns">${askText ? h`<button type="button" class="vb-btn vb-copy" data-copy-ask>${T.askCopy}</button>` : ''}<button type="button" class="vb-btn vb-copy" data-copy-brief>${T.briefCopy}</button><button type="button" class="vb-btn vb-print-btn">${T.briefPrint}</button></div><div class="vb-brief" data-brief data-brief-text="${briefText}" hidden>${briefLines}</div></div>`;
  }

  // Copy / print plumbing (delegated on resultEl; clipboard is on-device, no network).
  function execCopy(text) {
    try {
      var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'absolute'; ta.style.left = '-9999px'; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    } catch (_) {}
  }
  function copyText(text, btn, doneLabel) {
    if (!text) return;
    var restore = btn.textContent;
    var done = function () { btn.textContent = doneLabel; setTimeout(function () { btn.textContent = restore; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { execCopy(text); done(); });
    } else { execCopy(text); done(); }
  }
  function doPrint(action) {
    var brief = action ? action.querySelector('[data-brief]') : null;
    if (!brief) { try { window.print(); } catch (_) {} return; }
    document.documentElement.classList.add('vb-printing');
    brief.hidden = false;
    var after = function () {
      document.documentElement.classList.remove('vb-printing');
      brief.hidden = true; window.removeEventListener('afterprint', after);
    };
    window.addEventListener('afterprint', after);
    try { window.print(); } catch (_) {}
    setTimeout(after, 2000);
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
    reopenBaseline = null;
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

  resultEl.addEventListener('click', onResultClick);
  ensureAnnouncer();
  injectExtras();
  injectJournalRail();
  renderJournalRail();
  loadSeeds();
  restore();
  track('Bench Loaded');
})();
