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
    itemPlaceholder: 'ej. ribeye, pechuga de pollo, tomate',
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
    receiptDepthDeep: function (n, cadence, from, to) { return 'De ' + n + ' lecturas mayoristas ' + cadence + ' del USDA, ' + from + '–' + to + '.'; },
    receiptDepthShort: 'De un historial de mercado reciente y corto.',
    rcWeekly: 'semanales', rcMonthly: 'mensuales',
    rcReads: 'Lecturas', rcWindow: 'Ventana de mercado cubierta', rcOff: 'días de tu fecha',
    rcNearest: 'Lectura mayorista más cercana a tu',
    badPrice: 'No pudimos leer este precio.',
    ondevice: 'Guardado solo en este dispositivo — nunca se envía a ningún lado.',
    clearSaved: 'Borrar lo guardado', saveContract: 'Guardar este precio en tu perfil de costos', contractSaved: 'Guardado en tu perfil de costos',
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
    spikeStructural: 'Ese movimiento del mercado se ha sostenido en las lecturas recientes.',
    spikeSpike: 'El mercado subió y luego retrocedió en parte.',
    spikeEasing: 'El mercado ha estado por debajo de su base reciente.',
    spikeEmerging: 'El movimiento del mercado es reciente — observa la próxima lectura antes de actuar.',
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
    bookLead: 'Tu libro —', bookItems: 'artículos en seguimiento.',
    bookWorst: 'Mayor diferencia del proveedor:', bookCall: 'La línea que vale la pena llamar primero.',
    bookOver: 'de tus líneas corren por encima del mercado — Ledger las vigila todas.',
    forecastEyebrow: 'La próxima lectura del mercado',
    errItem: 'Escribe el nombre del artículo.',
    errRows: 'Agrega al menos dos compras con fecha y precio.',
    // ingredient picker (combobox)
    pickToggle: 'Mostrar ingredientes que podemos comparar',
    pickListAria: 'Artículos que Vendor Benchmark puede leer frente al mercado',
    pickScopeTitle: function (n) { return 'Los ' + n + ' artículos que podemos leer frente al mercado mayorista'; },
    pickScopeNote: 'Todos comparan el movimiento del mercado. Más a medida que crece el Índice de costos.',
    pickDescribe: function (n) { return 'Los ' + n + ' artículos que podemos comparar; escribe lo que sea — tu propio texto también funciona.'; },
    pickRefSr: ' — referencia firme de dólar mayorista',
    pickRefLegend: '$ señala un nivel firme de dólar mayorista — una cifra de mercado, no un precio a pagar. Tu precio entregado es mayor.',
    pickEmptyHead: 'No está en nuestra lista de comparación.',
    pickEmptyBody: 'Déjalo como lo escribiste — Vendor Benchmark igual lo compara contra tu propio historial de precios. Revisa el Índice de costos para ver qué leemos frente al mercado.',
    pickCount: function (n) { return n + (n === 1 ? ' coincidencia' : ' coincidencias'); },
    pickCountZero: 'Sin coincidencias — tu texto se comparará igual.',
    // market context (ADR-012) — the REFERENCE's own state, never the operator's price
    ctxEyebrow: 'Contexto de mercado',
    ctxElevated: function (label, pct) { return 'Ahora mismo la referencia mayorista de ' + label + ' corre alrededor de ' + pct + '% por encima de su propia norma del último año — cuando el mercado va alto, parte de una subida es el mercado, no tu proveedor.'; },
    ctxDepressed: function (label, pct) { return 'Ahora mismo la referencia mayorista de ' + label + ' corre alrededor de ' + pct + '% por debajo de su propia norma del último año — un precio que parece justo frente a un mercado flojo aún puede merecer una segunda mirada.'; },
    ctxVolatile: function (label) { return 'La referencia mayorista de ' + label + ' es una serie históricamente volátil — su propia norma varía mucho de una temporada a otra.'; },
    ctxVolTag: ' También es una serie históricamente volátil.',
    ctxEvent: function (label) { return 'Coincide en el trasfondo (no es una causa): ' + label + '.'; },
    chartAriaDyn: function (yourR, mkR, gapAbs, gapSign) { return 'Tu precio terminó cerca de ' + yourR + ', el mercado cerca de ' + mkR + ', ambos indexados a 100 al inicio de tu ventana — ' + (gapAbs < 1 ? 'en línea con el mercado' : ('unos ' + gapAbs + ' puntos ' + (gapSign > 0 ? 'por encima' : 'por debajo') + ' del mercado')) + '.'; },
    chartAriaThin: ' Las lecturas del mercado son escasas, así que esta línea es aproximada.'
  } : {
    itemLabel: 'Item', itemHint: '— as it reads on your invoice',
    itemPlaceholder: 'e.g. ribeye, chicken breast, tomato',
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
    // Post-audit (2026-07, HIGH-1): derive cadence + span per item — the deep series
    // are heterogeneous (beef is monthly, eggs spans ~1.4 years), so a blanket
    // "3 years of weekly reads" was false for several items.
    receiptDepthDeep: function (n, cadence, from, to) { return 'Drawn from ' + n + ' ' + cadence + ' USDA wholesale reads, ' + from + '–' + to + '.'; },
    receiptDepthShort: 'Drawn from recent, short market history.',
    rcWeekly: 'weekly', rcMonthly: 'monthly',
    rcReads: 'Reads', rcWindow: 'Covered market window', rcOff: 'days off your date',
    rcNearest: 'Nearest wholesale read to your',
    badPrice: 'Couldn’t read this price.',
    ondevice: 'Saved on this device only — never sent anywhere.',
    clearSaved: 'Clear saved', saveContract: 'Save this price to your cost profile', contractSaved: 'Saved to your cost profile',
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
    spikeStructural: 'That market move has held across the recent reads.',
    spikeSpike: 'The market ran up, then partly pulled back.',
    spikeEasing: 'The market has been running below its recent baseline.',
    spikeEmerging: 'The market move is recent — watch the next read before you act on it.',
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
    bookLead: 'Your book —', bookItems: 'items tracked.',
    bookWorst: 'Widest vendor gap:', bookCall: 'The line worth a call first.',
    bookOver: 'of your lines run above the market — Ledger watches every one.',
    forecastEyebrow: 'The market’s next print',
    errItem: 'Enter the item name.',
    errRows: 'Add at least two purchases with a date and price.',
    // ingredient picker (combobox)
    pickToggle: 'Show benchmarkable ingredients',
    pickListAria: 'Items Vendor Benchmark can read against the market',
    pickScopeTitle: function (n) { return 'The ' + n + ' items we can read against the wholesale market'; },
    pickScopeNote: 'Every one benchmarks the market’s move. More as the Cost Index grows.',
    pickDescribe: function (n) { return 'The ' + n + ' items we can benchmark; type anything — your own text still works.'; },
    pickRefSr: ' — firm wholesale dollar reference',
    pickRefLegend: '$ marks a firm wholesale dollar level — a market figure, not a price to pay. Your delivered price runs higher.',
    pickEmptyHead: 'Not on our benchmark list.',
    pickEmptyBody: 'Keep it as you typed it — Vendor Benchmark still checks it against your own price history. See the Cost Index for what we read against the market.',
    pickCount: function (n) { return n + (n === 1 ? ' match' : ' matches'); },
    pickCountZero: 'No matches — your typed text will still be benchmarked.',
    // market context (ADR-012) — the REFERENCE's own state, never the operator's price
    ctxEyebrow: 'Market context',
    ctxElevated: function (label, pct) { return 'Right now the wholesale reference for ' + label + ' runs about ' + pct + '% above its own trailing-year normal — when the market itself runs high, part of a price rise is the market, not your vendor.'; },
    ctxDepressed: function (label, pct) { return 'Right now the wholesale reference for ' + label + ' runs about ' + pct + '% below its own trailing-year normal — a price that looks fair against a soft market can still be worth a second look.'; },
    ctxVolatile: function (label) { return 'The wholesale reference for ' + label + ' is a historically volatile series — its own normal swings widely from season to season.'; },
    ctxVolTag: ' It is also a historically volatile series.',
    ctxEvent: function (label) { return 'Co-occurring in the backdrop (not a cause): ' + label + '.'; },
    chartAriaDyn: function (yourR, mkR, gapAbs, gapSign) { return 'Your price ended near ' + yourR + ', the market near ' + mkR + ', both indexed to 100 at your window start — ' + (gapAbs < 1 ? 'in line with the market' : ('about ' + gapAbs + ' points ' + (gapSign > 0 ? 'above' : 'below') + ' the market')) + '.'; },
    chartAriaThin: ' Market reads are thin, so this line is approximate.'
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
    pHint.id = pId + '-hint';
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
      if (bad) {
        pEl.setAttribute('aria-invalid', 'true');
        if (hint.id) pEl.setAttribute('aria-describedby', hint.id); // WCAG 3.3.1: name the error
      } else {
        pEl.removeAttribute('aria-invalid');
        pEl.removeAttribute('aria-describedby');
      }
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
  var JOURNAL_KEY = 'vbJournal', JOURNAL_CAP = 40, CHECK_CAP = 12, SESSION_MS = 1800000; // 30-min sitting
  function readJournal() { try { var j = CTX && CTX.get(JOURNAL_KEY); return (j && typeof j === 'object') ? j : {}; } catch (_) { return {}; } }
  function writeJournal(map) { if (CTX && typeof CTX.merge === 'function') { var p = {}; p[JOURNAL_KEY] = map; try { CTX.merge(p); } catch (_) {} } }
  function journalKeyFor(res) { return (res.market && res.market.key) || ('item:' + (res.item || '').toLowerCase().replace(/\s+/g, ' ').trim()); }
  // Each entry carries a capped, newest-first RING of checks so "since your last check"
  // survives a refresh — the trend reads the prior check from storage, not an in-memory
  // var. Old flat entries synthesize a single-check ring (back-compat reader).
  function ringOf(e) {
    if (!e) return [];
    if (Array.isArray(e.checks) && e.checks.length) return e.checks;
    if (typeof e.gapPts === 'number' || e.at) return [{ at: e.at || 0, gapPts: (typeof e.gapPts === 'number' ? e.gapPts : null), yourPct: e.yourPct, marketPct: e.marketPct }];
    return [];
  }
  // Baseline for the trend note: the newest check from a PRIOR sitting (checks within
  // SESSION_MS of the newest are the same sitting still being edited, not a comparison).
  function priorCheck(res) {
    var ring = ringOf(readJournal()[journalKeyFor(res)]);
    if (!ring.length) return null;
    if ((Date.now() - (ring[0].at || 0)) < SESSION_MS) return ring[1] || null;
    return ring[0];
  }
  function saveToJournal(res, rows) {
    if (!CTX || !res.item) return;
    var clean = rows.filter(function (r) { return r.date && String(r.price).trim() !== ''; });
    if (clean.length < 2) return;
    var map = readJournal();
    var k = journalKeyFor(res);
    var m = res.market;
    var check = {
      at: Date.now(),
      gapPts: (m && m.res && m.res.ok && !m.res.thin) ? m.res.gapPts : null,
      yourPct: res.yourChangePct,
      marketPct: (m && m.res && m.res.ok) ? m.res.marketPct : null,
      lastCents: res.lastCents, firstDate: res.firstDate, lastDate: res.lastDate
    };
    // Same sitting (within SESSION_MS) updates the newest check; a later visit
    // prepends a new one — so the ring is one entry per sitting, not per keystroke.
    var ring = ringOf(map[k]);
    if (ring.length && (check.at - (ring[0].at || 0)) < SESSION_MS) { ring = ring.slice(); ring[0] = check; }
    else { ring = [check].concat(ring); }
    if (ring.length > CHECK_CAP) ring = ring.slice(0, CHECK_CAP);
    map[k] = {
      item: res.item, unit: res.unit, purchases: clean, at: check.at,
      gapPts: check.gapPts, yourPct: check.yourPct, marketPct: check.marketPct,
      tier: res.tier, thin: !!(m && m.res && m.res.thin), checks: ring
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
    // MS3 — the whole-book worklist: rank the operator's tracked items and name the
    // one line worth a call first. The prioritized-negotiation view across the book,
    // built on the journal the operator already filled — honest, on-device, no
    // per-item spend claim (weighting is what Ledger does across the whole invoice).
    var rollup = '';
    var withGap = items.filter(function (x) { return typeof x.e.gapPts === 'number'; });
    if (withGap.length >= 2) {
      var worst = withGap[0]; // already sorted by |gap| desc
      var overCount = withGap.filter(function (x) { return x.e.gapPts >= 3; }).length;
      var g = Math.abs(worst.e.gapPts).toFixed(worst.e.gapPts < 10 ? 1 : 0);
      rollup = h`<div class="vb-book"><p class="vb-book-lead">${T.bookLead} ${String(withGap.length)} ${T.bookItems}</p><p class="vb-book-worst" data-tone="over"><strong>${T.bookWorst}</strong> ${worst.e.item} — ${g} ${T.pointsWord}. ${T.bookCall}</p>${overCount > 1 ? h`<p class="vb-book-count">${String(overCount)} ${T.bookOver} <a class="vb-inlink plausible-event-name=Ledger+Route+Click plausible-event-source=vendor-benchmark" href="https://ledger.muntin.digital/">${T.seeLedger} <span aria-hidden="true">→</span></a></p>` : ''}</div>`;
    }
    setHTML(railEl, h`<div class="vb-journal-head"><span class="vb-eyebrow">${T.jTitle}</span><button type="button" class="vb-linkbtn" data-jclear>${T.jClear}</button></div>${rollup}<div class="vb-journal-grid">${chips}</div>`);
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
        run(); // the trend note reads the prior check from storage (survives refresh)
        revealResult(true); // explicit reopen — land focus on the verdict, motion-gated
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
    updateProvenanceAsOf(); // fill the as-of date as soon as the seed lands (before any early return)
    var item = (itemEl.value || '').trim();
    var unit = unitEl.value;
    var rows = readRows();
    persist(item, unit, rows);
    flagBadPrices();
    updatePriceTokens(); renderCarry(); // keep the privacy counter live as rows change

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

    // Dynamic aria-label — the chart STATES its conclusion so a screen-reader user
    // hears the takeaway (and the thin/approximate hedge a sighted user sees).
    var yEnd = yourPts.length ? yourPts[yourPts.length - 1].v : 100;
    var mEnd = mkPts.length ? mkPts[mkPts.length - 1].v : 100;
    var gapSign = yEnd - mEnd;
    var ariaLabel = T.chartAriaDyn(Math.round(yEnd), Math.round(mEnd), Math.abs(Math.round(gapSign)), gapSign) + (uncertain ? T.chartAriaThin : '');

    var svg =
      '<svg class="vb-chart" data-tone="' + escAttr(tone) + '"' + (uncertain ? ' data-uncertain="1"' : '') +
      ' width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H +
      '" role="img" aria-label="' + escAttr(ariaLabel) + '"' + (tableId ? ' aria-describedby="' + tableId + '"' : '') + ' preserveAspectRatio="xMidYMid meet">' +
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
    // Read the UN-augmented series (HIGH-2): the spliced live-level endpoint is a
    // basis discontinuity, not a price move, and would fabricate a spike/easing read.
    var s = m.seriesRaw || m.series;
    var vals = s.values, dates = s.dates, N = vals.length, start = Math.max(0, N - 26);
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

  // MS4 — consent-gated cost-spine writer. VB captures a real, dated, unit-tagged
  // DELIVERED price; on an explicit click we seed it into the shared cost profile
  // (MuntinContext.contractPrices) that the rest of the suite reads for drift. It
  // is the operator's OWN price, never a "fair"/"should-pay" price. Never silent.
  function saveContractPrice(res) {
    if (!CTX || typeof CTX.merge !== 'function' || !res.item || !(res.lastCents > 0)) return false;
    var stem = (window.MuntinStem && window.MuntinStem.extractStem) ? window.MuntinStem.extractStem(res.item) : res.item.toLowerCase().trim();
    if (!stem) return false;
    var all = {};
    try { all = CTX.get('contractPrices') || {}; } catch (_) { all = {}; }
    all[stem] = { item: res.item, unit: res.unit || null, perUnitCents: res.lastCents, at: Date.now(), date: res.lastDate || null, source: 'vendor-benchmark' };
    try { CTX.merge({ contractPrices: all }); return true; } catch (_) { return false; }
  }

  var lastRes = null;
  // a11y helpers — respect reduced-motion for programmatic scrolls, and move focus
  // to the verdict heading ONLY on the two explicit user actions (never on keystroke),
  // so a keyboard / screen-reader user lands on the answer, not mid-form.
  function reducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function revealResult(focusVerdict) {
    if (focusVerdict) {
      var vh = document.getElementById('vbVerdictH');
      if (vh) { try { vh.focus({ preventScroll: true }); } catch (_) { try { vh.focus(); } catch (__) {} } }
    }
    if (resultEl && resultEl.scrollIntoView) resultEl.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }

  // Provenance strip — fill the live scope count (eager picker manifest) and the as-of
  // date (the reference set's generation date, once the lazy seed lands). Never a fake
  // date: the cell stays "—" until the real value is available.
  function initProvenance() {
    var countEl = document.getElementById('vbProvCount');
    if (countEl) {
      var pk = window.MUNTIN_CI_PICKER;
      var n = pk && (typeof pk.count === 'number' ? pk.count : ((pk.items && pk.items.length) || (Array.isArray(pk) ? pk.length : 0)));
      if (n) countEl.textContent = String(n);
    }
    updateProvenanceAsOf();
  }
  function updateProvenanceAsOf() {
    var el = document.getElementById('vbProvAsOf');
    if (!el || /\d/.test(el.textContent)) return; // already filled with a real date
    var seed = window.MUNTIN_COST_INDEX;
    var iso = seed && (seed.generatedAt || seed.asOf);
    if (iso) el.textContent = fmtDate(String(iso).slice(0, 10));
  }

  // ---- privacy monitor: PROVE the prices never leave the device --------------
  // An OBSERVE-ONLY shim wraps the outbound network APIs *by reference* (it saves the
  // original and calls through it — it never writes a fetch()/sendBeacon()/new
  // XMLHttpRequest() call, the send-literals the no-fetch invariant forbids). It scans
  // each outbound request for the exact price string the operator typed; because VB
  // never transmits prices the count holds at 0 — a live, watchable zero. It NEVER
  // blocks, alters, or originates a request; every wrapper passes arguments straight
  // through, and all inspection is wrapped in try/catch so a bug can't break the call.
  var vbPriceTokens = []; // current typed price strings (len>=4), watched by the shim
  var vbCarryCount = 0;   // outbound requests observed carrying a price token (stays 0)
  function vbScan(payload) {
    try {
      if (!vbPriceTokens.length || payload == null) return;
      var s = (typeof payload === 'string') ? payload
        : (payload && typeof payload === 'object') ? (function () { try { return JSON.stringify(payload); } catch (_) { return String(payload); } })()
        : String(payload);
      for (var i = 0; i < vbPriceTokens.length; i++) {
        if (s.indexOf(vbPriceTokens[i]) !== -1) { vbCarryCount++; renderCarry(); return; }
      }
    } catch (_) {}
  }
  (function installPrivacyMonitor() {
    try {
      var of = window.fetch;
      if (typeof of === 'function') {
        window.fetch = function (input, init) {
          try { vbScan(typeof input === 'string' ? input : (input && input.url)); if (init && init.body != null) vbScan(init.body); } catch (_) {}
          return of.apply(this, arguments);
        };
      }
      var ob = navigator.sendBeacon;
      if (typeof ob === 'function') {
        navigator.sendBeacon = function (url, data) {
          try { vbScan(url); if (data != null) vbScan(data); } catch (_) {}
          return ob.apply(navigator, arguments);
        };
      }
      if (window.XMLHttpRequest && XMLHttpRequest.prototype) {
        var oo = XMLHttpRequest.prototype.open, os = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function (method, url) { try { this.__vbUrl = url; } catch (_) {} return oo.apply(this, arguments); };
        XMLHttpRequest.prototype.send = function (body) { try { vbScan(this.__vbUrl); if (body != null) vbScan(body); } catch (_) {} return os.apply(this, arguments); };
      }
    } catch (_) {}
  })();
  function vbPriceCount() {
    if (!rowsEl) return 0;
    var rows = rowsEl.querySelectorAll('.vb-prow'), n = 0;
    for (var i = 0; i < rows.length; i++) {
      var pEl = rows[i].querySelector('[data-field="price"]');
      if (pEl && String(pEl.value || '').trim() !== '' && parsePrice(pEl.value) != null) n++;
    }
    return n;
  }
  function updatePriceTokens() {
    if (!rowsEl) { vbPriceTokens = []; return; }
    var rows = rowsEl.querySelectorAll('.vb-prow'), toks = [];
    for (var i = 0; i < rows.length; i++) {
      var pEl = rows[i].querySelector('[data-field="price"]');
      var v = pEl ? String(pEl.value || '').trim() : '';
      if (v.length >= 4) toks.push(v); // len>=4 avoids false matches on "0" / "12" etc.
    }
    vbPriceTokens = toks;
  }
  function renderCarry() {
    var nEl = document.getElementById('vbCarryN');
    if (nEl) nEl.textContent = String(vbPriceCount());
    var cEl = document.getElementById('vbCarryC');
    if (cEl) { cEl.textContent = String(vbCarryCount); if (vbCarryCount === 0) cEl.setAttribute('data-zero', '1'); else cEl.removeAttribute('data-zero'); }
  }

  // ADR-012 market context — the REFERENCE's OWN state (elevated/depressed vs its
  // trailing-year normal + volatility + a co-occurring documented event), NEVER the
  // operator's price, so it needs no lead-lag gate. Reads the lazy MUNTIN_COST_CONTEXT
  // seed (silent until it lands); neutral --vb-signal chrome, never a verdict tone.
  function contextBlock(res) {
    var m = res.market;
    if (!m || !m.available || !m.key) return '';
    var CTX = window.MUNTIN_COST_CONTEXT;
    if (!CTX) return '';
    var c = CTX[m.key];
    if (!c) return '';
    var label = m.label || res.item;
    var now = c.now || null;
    var state = now && now.state;
    var hasState = state === 'elevated' || state === 'depressed';
    var volWild = c.vol === 'wild' || c.vol === 'swingy';
    var ev = (c.recentEvent && c.recentEvent.recent) ? c.recentEvent : null;
    // Fire only on a LIVE signal — the reference elevated/depressed vs its own normal,
    // or a recent documented event. Volatility is a modifier on those, never a
    // standalone trigger (nearly every series is volatile — it would surface on all).
    if (!hasState && !ev) return '';

    var say = '';
    if (hasState) {
      say = state === 'elevated' ? T.ctxElevated(label, Math.abs(now.pct)) : T.ctxDepressed(label, Math.abs(now.pct));
      if (volWild) say += T.ctxVolTag;
    } else if (volWild) {
      say = T.ctxVolatile(label);
    }
    var sayLine = say ? h`<p class="vb-context-say">${say}</p>` : '';
    var eventLine = ev ? h`<p class="vb-context-event">${T.ctxEvent(ev.label)}</p>` : '';
    if (!sayLine && !eventLine) return '';
    return h`<div class="vb-context" data-state="${state || 'normal'}"><span class="vb-eyebrow">${T.ctxEyebrow}</span>${sayLine}${eventLine}</div>`;
  }

  function render(res) {
    var m = res.market;
    lastRes = res;
    var spike = classifyMarketSpike(res);
    chartModel = null;
    var blocks = [];

    // 1) THE HEADLINE — the gap (only a full verdict when the market data supports it)
    blocks.push(headlineBlock(res));

    // 1a) MARKET CONTEXT — the reference's own state vs its normal (ADR-012); reframes
    //     the market number without ever touching the operator's price.
    var ctx = contextBlock(res); if (ctx) blocks.push(ctx);

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

    // 7) on-device + clear + (consent) seed the cost profile
    var saveContract = (res.lastCents > 0)
      ? h` · <button type="button" class="vb-linkbtn" data-save-contract>${T.saveContract}</button>`
      : '';
    blocks.push(h`<p class="vb-ondevice">${T.ondevice} <button type="button" class="vb-linkbtn" id="vbClearSaved">${T.clearSaved}</button>${saveContract}</p>`);

    setHTML(resultEl, h`<div class="vb-result-inner">${blocks}</div>`);
    wireChartHover();
  }

  // One delegated handler for everything inside the re-rendered result.
  function onResultClick(e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#vbClearSaved')) { clearAll(); return; }
    var saveBtn = t.closest('[data-save-contract]');
    if (saveBtn) {
      if (lastRes && saveContractPrice(lastRes)) { saveBtn.textContent = T.contractSaved; saveBtn.disabled = true; }
      track('Bench Contract Saved');
      return;
    }
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

  // MS2 — regime-break: GATED OFF (statistical-rigor audit, 2026-07, finding C4/
  // CRIT-3). Pettitt's null hypothesis is an i.i.d. series with no change; a
  // wholesale price LEVEL series is near-unit-root (trending, autocorrelated),
  // which violates that null. Under it the test fires on 83–100% of driftless
  // random walks and pure trends that contain NO real step — and on the shipped
  // series it flags a "significant break" on ~64–98% of items, announcing a smooth
  // drift as "the whole market stepped up around {date}." There is also no
  // effect-size floor and no multiplicity control across ingredients. The date and
  // arithmetic are only meaningful once a real step is established, which this gate
  // never did. Re-enable ONLY after the change-point test runs on first differences
  // with a step-vs-trend model check (BIC), a volatility-scaled magnitude floor,
  // a block-bootstrap null, and BH/BY correction (charter P0-3). Until then we do
  // not assert a market-wide "step" from this tool.
  function regimeBreakBlock() { return ''; }

  // MS1 — the honest next-print band: a coverage-VALIDATED conformal interval on the
  // deep wholesale series, expressed as an ASYMMETRIC ±% (never a $ level, to avoid a
  // "should-pay" misread) with its RAW, un-tuned walk-forward hit-rate and a Wilson
  // range around it. Post-audit honesty (2026-07, C1/CRIT-2, HIGH-1/HIGH-6):
  //  · the coverage is the leakage-free RAW rate (no calibrate) with its CI, framed as
  //    "target 80%, held X%" — never a band silently widened to report its own target;
  //  · degenerate (flat/stale → "±0%, right 100%") and uninformative (half-width > 30%
  //    of level) bands are WITHHELD, as is any series without a publishable rate;
  //  · the horizon is stated per the series' real cadence (next week vs next month);
  //  · the interval's up/down asymmetry is shown, never collapsed to a symmetric ±.
  function forecastBlock(res) {
    var m = res.market;
    // Forward math reads the UN-augmented series (HIGH-2) so a spliced live-level
    // endpoint (a national-vs-regional basis seam) is never scored as a one-step move.
    var s = m && m.seriesRaw ? m.seriesRaw : (m && m.series);
    if (!CONF || !m || !m.available || m.seriesKind !== 'deep' || !s || s.values.length < 24) return '';
    if (m.confidence === 'low' || m.confidence === 'directional') return '';
    var out;
    try { out = CONF.conformalNext(s.values); } catch (_) { return ''; }
    if (!out || out.coverage == null || out.degenerate || !(out.point > 0)) return '';
    if (out.upPct == null || out.downPct == null) return '';
    var up = Math.round(out.upPct * 100), down = Math.round(out.downPct * 100);
    if (out.halfWidthPct > 0.30) return '';                 // too wide to be a useful bound
    if (!(up > 0) && !(down > 0)) return '';
    var cov = Math.round(out.coverage * 100);
    var lo = Math.round((out.coverageLo != null ? out.coverageLo : out.coverage) * 100);
    var hi = Math.round((out.coverageHi != null ? out.coverageHi : out.coverage) * 100);
    var reads = out.nTested;
    var monthly = seriesCadenceMonthly(s.dates);
    var per = monthly ? (ES ? 'mensual' : 'monthly') : (ES ? 'semanal' : 'weekly');
    // Asymmetric band; note the skew only when up/down clearly differ.
    var ratio = down > 0 ? up / down : (up > 0 ? Infinity : 1);
    var skew = '';
    if (ratio >= 1.6) skew = ES ? ' — el riesgo se inclina al alza' : ' — the risk is skewed upward';
    else if (ratio > 0 && ratio <= 0.625) skew = ES ? ' — el riesgo se inclina a la baja' : ' — the risk is skewed downward';
    var bandStr = '−' + String(down) + '% / +' + String(up) + '%';
    var headline = ES
      ? ('Una banda con objetivo del 80% de este ancho ha capturado la próxima lectura ' + per + ' cerca del ' + cov + '% de las veces (' + lo + '–' + hi + '% en ' + reads + ' lecturas).')
      : ('An 80%-target band this wide has caught the next ' + per + ' print about ' + cov + '% of the time (' + lo + '–' + hi + '% across ' + reads + ' reads).');
    var bandLine = ES
      ? ('Ahora mismo va de ' + bandStr + skew + '.')
      : ('Right now it runs ' + bandStr + skew + '.');
    var fine = ES
      ? ('El movimiento del mercado mayorista, no tu precio entregado; el flete y el margen pueden moverlo distinto.')
      : ('Wholesale market movement, not your delivered price — freight and margin can move yours differently.');
    return h`<div class="vb-forecast"><span class="vb-eyebrow">${T.forecastEyebrow}</span><p>${headline}</p><p class="vb-forecast-band">${bandLine}</p><p class="vb-forecast-fine">${fine}</p></div>`;
  }

  // Cadence of a dated series (median gap ≥ 20d → monthly), so the forecast horizon
  // is stated truthfully ("next month" for beef, "next week" for produce).
  function seriesCadenceMonthly(dates) {
    if (!dates || dates.length < 3) return false;
    var gaps = [];
    for (var i = 1; i < dates.length; i++) {
      var a = MW.parseISODay(dates[i - 1]), b = MW.parseISODay(dates[i]);
      if (a != null && b != null) gaps.push((b - a) / 86400000);
    }
    if (!gaps.length) return false;
    gaps.sort(function (x, y) { return x - y; });
    return gaps[Math.floor(gaps.length / 2)] >= 20;
  }

  function journalTrendBlock(res) {
    var m = res.market;
    if (!(m && m.res && m.res.ok && !m.res.thin)) return '';
    var prior = priorCheck(res); // from storage — survives a page refresh
    if (!prior || typeof prior.gapPts !== 'number' || !prior.at) return '';
    var now = m.res.gapPts, was = prior.gapPts;
    if (Math.abs(now - was) < 1) return '';
    var widened = Math.abs(now) > Math.abs(was);
    return h`<p class="vb-jtrend" data-tone="${widened ? 'over' : 'under'}">${T.jSince} ${relTime(prior.at)}, ${widened ? T.jWiden : T.jNarrow} ${Math.abs(was).toFixed(was < 10 ? 1 : 0)} → ${Math.abs(now).toFixed(now < 10 ? 1 : 0)} ${T.pointsWord}.</p>`;
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
        return h`<div class="vb-headline vb-headline--info">${yourLine}<div class="vb-headline-note"><h2 class="vb-h2" id="vbVerdictH" tabindex="-1">${T.noMatchHead}</h2><p>${T.noMatchBody}</p><p><a class="vb-inlink" href="${BASE}/cost-index/">${T.seeReading} <span aria-hidden="true">→</span></a></p></div></div>`;
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
      verdict = h`<div class="vb-gap" data-tone="${tone}"><span class="vb-gap-num">${gapPts.toFixed(gapPts < 10 ? 1 : 0)}</span><span class="vb-gap-word">${T.pointsWord} ${dirWord}</span></div><h2 class="vb-headline-say vb-verdict-h" id="vbVerdictH" tabindex="-1">${m.say.headline}</h2>${excess}${anchor}`;
    } else if (m.say && m.say.headline) {
      // honest hedge / soft refusal (thin, too-close, out-of-range)
      verdict = h`<div class="vb-hedge" data-tone="${tone}"><h2 class="vb-headline-say vb-verdict-h" id="vbVerdictH" tabindex="-1">${m.say.headline}</h2>${m.say.detail ? h`<p class="vb-headline-detail">${m.say.detail}</p>` : ''}</div>`;
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
    var reads = (m.series && m.series.values) ? m.series.values.length : 0;
    var depth;
    if (m.seriesKind === 'deep' && m.series && m.series.dates && m.series.dates.length >= 2) {
      var cadWord = seriesCadenceMonthly(m.series.dates) ? T.rcMonthly : T.rcWeekly;
      var from = fmtDate(m.seriesStart || m.series.dates[0]);
      var to = fmtDate(m.seriesEnd || m.series.dates[m.series.dates.length - 1]);
      depth = T.receiptDepthDeep(reads, cadWord, from, to);
    } else {
      depth = T.receiptDepthShort;
    }
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
    revealResult(true); // explicit example load — land focus on the verdict, motion-gated
  }

  // ---- ingredient picker (combobox) — progressive enhancement over #vbItem ---
  // The picker manifest (window.MUNTIN_CI_PICKER, eager first-paint) lists the
  // items the tool can honestly benchmark. This enhances the free-text item field
  // into an ARIA-1.2 editable combobox with a grouped, filterable listbox. No-JS
  // or manifest-missing => the plain #vbItem input, unchanged. On select we write
  // the resolvable label and dispatch 'input' (the existing pipeline re-matches it);
  // we NEVER touch #vbUnit (the manifest carries carton/sack units that are not
  // <select> options, and the unit is "as it reads on your invoice"). All picker
  // chrome uses --vb-signal / neutral ink — never a verdict tone.
  function initItemCombo() {
    var PICK = window.MUNTIN_CI_PICKER;
    if (!PICK || !Array.isArray(PICK.items) || !PICK.items.length || !itemEl) return;
    var field = itemEl.closest ? itemEl.closest('.vb-field') : null;
    if (!field || field.getAttribute('data-vb-combo') === '1') return; // idempotent
    field.setAttribute('data-vb-combo', '1');
    field.classList.add('vb-combo', 'is-live');

    var items = PICK.items;
    var groupsMeta = Array.isArray(PICK.groups) ? PICK.groups : [];
    var n = items.length;
    var LB_ID = 'vbPickList';

    function norm(s) {
      return (s == null ? '' : String(s)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    // ARIA on the input (applied at runtime so the no-JS field stays clean)
    itemEl.setAttribute('role', 'combobox');
    itemEl.setAttribute('aria-expanded', 'false');
    itemEl.setAttribute('aria-controls', LB_ID);
    itemEl.setAttribute('aria-autocomplete', 'list');
    itemEl.setAttribute('aria-haspopup', 'listbox');
    itemEl.setAttribute('spellcheck', 'false');
    itemEl.classList.add('vb-input--combo');

    // sr-only scope note, referenced via aria-describedby (heard on focus)
    var note = document.createElement('p');
    note.id = 'vbItemComboNote'; note.className = 'sr-only'; note.textContent = T.pickDescribe(n);
    var priorDesc = itemEl.getAttribute('aria-describedby');
    itemEl.setAttribute('aria-describedby', (priorDesc ? priorDesc + ' ' : '') + 'vbItemComboNote');
    field.appendChild(note); // must be in the DOM for aria-describedby to resolve

    // caret / toggle button (pointer affordance; out of the tab order)
    var caret = document.createElement('button');
    caret.type = 'button'; caret.className = 'vb-combo-caret'; caret.tabIndex = -1;
    caret.setAttribute('aria-label', T.pickToggle);
    caret.setAttribute('aria-controls', LB_ID);
    caret.setAttribute('aria-expanded', 'false');
    caret.textContent = '▾'; // ▾
    itemEl.insertAdjacentElement('afterend', caret);

    // listbox
    var listbox = document.createElement('div');
    listbox.id = LB_ID; listbox.className = 'vb-pick-list'; listbox.hidden = true;
    listbox.setAttribute('role', 'listbox');
    listbox.setAttribute('aria-label', T.pickListAria);

    // sticky scope header (presentational, always visible while filtering)
    var scope = document.createElement('div');
    scope.className = 'vb-pick-scope'; scope.setAttribute('role', 'presentation');
    var scTitle = document.createElement('div'); scTitle.className = 'vb-pick-scope__title'; scTitle.textContent = T.pickScopeTitle(n);
    var scNote = document.createElement('div'); scNote.className = 'vb-pick-scope__note'; scNote.textContent = T.pickScopeNote;
    scope.appendChild(scTitle); scope.appendChild(scNote);
    listbox.appendChild(scope);

    var groupLabel = {};
    groupsMeta.forEach(function (g) { groupLabel[g.key] = ES ? g.label_es : g.label_en; });

    // options, grouped in manifest order (already sorted group→label by the builder)
    var optionRefs = [];   // { el, item, group, labelText, norm }
    var groupEls = {};      // groupKey -> { el, headCount }
    var curKey = null, curGroupEl = null;
    items.forEach(function (it) {
      if (it.group !== curKey) {
        curKey = it.group;
        var gEl = document.createElement('div');
        gEl.setAttribute('role', 'group');
        var gLabel = groupLabel[it.group] || it.group;
        gEl.setAttribute('aria-label', gLabel);
        var head = document.createElement('div');
        head.className = 'vb-pick-grouphead'; head.setAttribute('role', 'presentation');
        var hName = document.createElement('span'); hName.className = 'vb-pick-grouphead__name'; hName.textContent = gLabel;
        var hCount = document.createElement('span'); hCount.className = 'vb-pick-grouphead__count'; hCount.setAttribute('aria-hidden', 'true');
        head.appendChild(hName); head.appendChild(hCount);
        gEl.appendChild(head);
        listbox.appendChild(gEl);
        groupEls[it.group] = { el: gEl, headCount: hCount };
        curGroupEl = gEl;
      }
      var lbl = ES ? it.label_es : it.label_en;
      var opt = document.createElement('div');
      opt.id = 'vb-opt-' + it.key; opt.className = 'vb-pick-opt';
      opt.setAttribute('role', 'option'); opt.setAttribute('aria-selected', 'false');
      var labelEl = document.createElement('span'); labelEl.className = 'vb-pick-opt__label'; labelEl.textContent = lbl;
      opt.appendChild(labelEl);
      if (it.dollarRef) {
        var ref = document.createElement('span'); ref.className = 'vb-pick-opt__ref'; ref.setAttribute('aria-hidden', 'true');
        ref.textContent = '$'; ref.title = T.pickRefLegend;
        opt.appendChild(ref);
        var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = T.pickRefSr;
        labelEl.appendChild(sr); // fold into the option's accessible name
      }
      var unit = document.createElement('span'); unit.className = 'vb-pick-opt__unit';
      unit.textContent = '/' + (ES ? it.unit_es : it.unit_en);
      opt.appendChild(unit);
      curGroupEl.appendChild(opt);
      optionRefs.push({ el: opt, item: it, group: it.group, labelText: lbl, norm: norm(lbl + ' ' + it.key) });
    });

    // empty (no-match) state — presentational, invites free-text
    var empty = document.createElement('div');
    empty.className = 'vb-pick-empty'; empty.setAttribute('role', 'presentation'); empty.hidden = true;
    var eHead = document.createElement('div'); eHead.className = 'vb-pick-empty__head'; eHead.textContent = T.pickEmptyHead;
    var eBody = document.createElement('p'); eBody.className = 'vb-pick-empty__body'; eBody.textContent = T.pickEmptyBody;
    empty.appendChild(eHead); empty.appendChild(eBody);
    listbox.appendChild(empty);

    // sticky footer legend for the $ marker (presentational)
    var legend = document.createElement('div');
    legend.className = 'vb-pick-legend'; legend.setAttribute('role', 'presentation'); legend.textContent = T.pickRefLegend;
    listbox.appendChild(legend);

    field.appendChild(listbox);

    // sr-only status region for filter counts (polite; self-clears)
    var status = document.createElement('div');
    status.className = 'vb-pick-status sr-only'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    field.appendChild(status);

    // ---- state + behavior ----
    var open = false, activeIdx = -1, activeEl = null, results = optionRefs.slice(), statusT = null;

    // Clear the outgoing option by REFERENCE (activeEl), never by results[activeIdx]:
    // filter() reassigns `results` to a fresh array, so an index would clear the
    // wrong element and strand a stale is-active / aria-selected on the real one.
    function setActive(idx) {
      if (activeEl) { activeEl.classList.remove('is-active'); activeEl.setAttribute('aria-selected', 'false'); activeEl = null; }
      activeIdx = idx;
      if (idx >= 0 && results[idx]) {
        activeEl = results[idx].el;
        activeEl.classList.add('is-active'); activeEl.setAttribute('aria-selected', 'true');
        itemEl.setAttribute('aria-activedescendant', activeEl.id);
        if (activeEl.scrollIntoView) activeEl.scrollIntoView({ block: 'nearest' });
      } else {
        itemEl.removeAttribute('aria-activedescendant');
      }
    }
    function openList() {
      if (open) return;
      open = true; listbox.hidden = false; field.classList.add('is-open');
      itemEl.setAttribute('aria-expanded', 'true'); caret.setAttribute('aria-expanded', 'true');
    }
    function closeList() {
      setActive(-1);
      if (!open) return;
      open = false; listbox.hidden = true; field.classList.remove('is-open');
      itemEl.setAttribute('aria-expanded', 'false'); caret.setAttribute('aria-expanded', 'false');
      if (statusT) { clearTimeout(statusT); statusT = null; }
      status.textContent = '';
    }
    function announceCount(nRes) {
      if (statusT) clearTimeout(statusT);
      statusT = setTimeout(function () {
        status.textContent = nRes > 0 ? T.pickCount(nRes) : T.pickCountZero;
      }, 350);
    }
    function filter(q) {
      var nq = norm(q); results = [];
      var perGroup = {};
      optionRefs.forEach(function (o) {
        var show = nq === '' || o.norm.indexOf(nq) !== -1;
        o.el.hidden = !show;
        if (show) { results.push(o); perGroup[o.group] = (perGroup[o.group] || 0) + 1; }
      });
      Object.keys(groupEls).forEach(function (gk) {
        var c = perGroup[gk] || 0;
        groupEls[gk].el.hidden = c === 0;
        groupEls[gk].headCount.textContent = c ? String(c) : '';
      });
      empty.hidden = results.length !== 0;
      setActive(-1);
      announceCount(results.length);
    }
    function applySelection(o) {
      itemEl.value = o.labelText;
      closeList();
      itemEl.dispatchEvent(new Event('input', { bubbles: true })); // drives the existing pipeline
      try { track('Bench Picker Select', { group: o.group }); } catch (_) {}
    }
    function selectAndStay(o) { // Enter / pointer path — keep focus in the field
      applySelection(o);
      try { var L = itemEl.value.length; itemEl.setSelectionRange(L, L); } catch (_) {}
      itemEl.focus();
    }
    function optFromEl(el) {
      for (var i = 0; i < optionRefs.length; i++) { if (optionRefs[i].el === el) return optionRefs[i]; }
      return null;
    }

    // filter as the user types (real keystrokes only — the synthetic 'input' from
    // applySelection must not reopen/refilter; the separate 'schedule' listener,
    // which does the compute, does not gate on isTrusted so it still recomputes)
    itemEl.addEventListener('input', function (e) {
      if (!e.isTrusted) return;
      filter(itemEl.value);
      if (itemEl.value.trim() !== '') openList();
    });

    itemEl.addEventListener('keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!open) { filter(itemEl.value); openList(); }
          if (results.length) setActive(activeIdx < results.length - 1 ? activeIdx + 1 : results.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!open) { filter(itemEl.value); openList(); if (results.length) setActive(results.length - 1); break; }
          if (activeIdx <= 0) setActive(-1); else setActive(activeIdx - 1);
          break;
        case 'Enter':
          if (open && activeIdx >= 0 && results[activeIdx]) { e.preventDefault(); selectAndStay(results[activeIdx]); }
          else if (open) { closeList(); }
          break;
        case 'Escape':
          if (open) { e.preventDefault(); closeList(); }
          break;
        case 'Tab':
          if (open && activeIdx >= 0 && results[activeIdx]) { applySelection(results[activeIdx]); } // let Tab move focus on
          else if (open) { closeList(); }
          break;
        default: break;
      }
    });

    caret.addEventListener('click', function () {
      if (open) { closeList(); } else { filter(itemEl.value); openList(); }
      itemEl.focus();
    });

    // select on pointerdown + preventDefault so focusout doesn't close before the tap resolves
    listbox.addEventListener('pointerdown', function (e) {
      var el = e.target.closest ? e.target.closest('.vb-pick-opt') : null;
      if (!el) return;
      e.preventDefault();
      var o = optFromEl(el);
      if (o) selectAndStay(o);
    });
    // belt-and-suspenders for assistive-tech synthetic clicks
    listbox.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('.vb-pick-opt') : null;
      if (!el) return;
      var o = optFromEl(el);
      if (o && itemEl.value !== o.labelText) selectAndStay(o);
    });

    // close when focus leaves the composite
    field.addEventListener('focusout', function (e) {
      if (!field.contains(e.relatedTarget)) closeList();
    });
    // fallback for browsers with unreliable relatedTarget (older Safari)
    document.addEventListener('pointerdown', function (e) {
      if (open && !field.contains(e.target)) closeList();
    });
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
  initItemCombo();
  initProvenance();
  renderCarry();
  injectExtras();
  injectJournalRail();
  renderJournalRail();
  loadSeeds();
  restore();
  track('Bench Loaded');
})();
