/* Pressure Lab — the playable, deterministic "where it's headed" instrument.
   Drag a leading-indicator slider and watch the engine re-score the direction
   live, with the math (P = Σ weight × sign × signal) drawn out in front of you.
   It is 100% INFERRED: it never shows a price (the engine has none), the verdict
   vocabulary is hedged + banned-verb-free (lint target for check-pressure-
   honesty.mjs), and a user-moved scenario is always stamped hypothetical.
   Pure DOM (no innerHTML), reduced-motion-safe, locale-aware, fail-silent. */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var root = document.getElementById('pressureLab');
  var RULES = window.MUNTIN_PRESSURE_RULES;
  var LIVE = window.MUNTIN_PRESSURE_LIVE;
  var ENGINE = window.MuntinCostPressure;
  if (!root || !RULES || !LIVE || !ENGINE || !ENGINE.assess) return;   // fail-silent

  var es = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2) === 'es';
  function L(en, esStr) { return es ? esStr : en; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function pct(v) { return (v >= 0 ? '+' : '') + Math.round(v * 100) + '%'; }
  var reduce = false;
  try { reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Hedged, banned-verb-free verdict vocabulary (the gate lints this object).
  var PHRASE = {
    building: L('cost pressure looks to be building — the leading signals lean higher', 'la presión de costo parece ir en aumento — las señales adelantadas apuntan al alza'),
    easing:   L('cost pressure looks to be easing — the leading signals lean lower', 'la presión de costo parece ceder — las señales adelantadas apuntan a la baja'),
    steady:   L('signals are mixed — no clear lean right now', 'señales mixtas — sin una tendencia clara por ahora'),
    unknown:  L('not enough signal to call', 'sin señal suficiente para concluir')
  };
  var DIR_GLYPH = { building: '▲', easing: '▼', steady: '◆', unknown: '·' };
  var CONF_WORD = { high: L('high', 'alta'), moderate: L('moderate', 'media'), low: L('low', 'baja') };
  var INDICATOR_NAME = {
    'feed-futures': L('Feed (corn/soy) futures', 'Futuros de forraje (maíz/soya)'),
    'broiler-placements': L('Broiler chick placements', 'Colocación de pollitos'),
    'cattle-on-feed-placements': L('Cattle-on-feed placements', 'Ganado en engorda'),
    'hogs-market-supply': L('Market-hog supply', 'Oferta de cerdos'),
    'cold-storage-poultry': L('Cold-storage stocks', 'Inventario en frío'),
    'cold-storage-beef': L('Cold-storage stocks', 'Inventario en frío'),
    'cold-storage-pork': L('Cold-storage stocks', 'Inventario en frío'),
    'ams-shipments': L('Produce shipments', 'Envíos de producto'),
    'freeze-alert': L('Freeze warnings', 'Alertas de helada'),
    'drought-ca-az': L('Drought (CA/AZ)', 'Sequía (CA/AZ)'),
    'drought-fl-ca': L('Drought (FL/CA)', 'Sequía (FL/CA)'),
    'drought': L('Drought', 'Sequía'),
    'crop-condition': L('Crop condition', 'Condición del cultivo'),
    'diesel': L('Diesel / freight', 'Diésel / flete')
  };
  function indName(id) { return INDICATOR_NAME[id] || id; }

  // ---- State: live base (immutable) + user scenario (working copy) ----------
  var item = (location.hash.match(/[#&]it=([a-z0-9-]+)/) || [])[1] || 'chicken-breast';
  if (!RULES.items[item]) item = Object.keys(RULES.items)[0];
  var panel = Object.assign({}, RULES.defaults, RULES.items[item], { item: item });
  var indicators = (panel.indicators || []);
  var base = Object.assign({}, (LIVE.observations && LIVE.observations[item]) || {});
  var scenario = Object.assign({}, base);
  var anchorDate = (LIVE.anchor && LIVE.anchor[item]) || null;

  function assessFor(obsMap) {
    var observations = {};
    for (var id in obsMap) observations[id] = { changePct: obsMap[id], asOf: LIVE.asOf };
    return ENGINE.assess(panel, observations, { anchorPrintDate: anchorDate, asOf: LIVE.asOf, ruleVersion: RULES._version });
  }
  function modified() { for (var id in scenario) if (scenario[id] !== base[id]) return true; return false; }

  // ---- Build the DOM once; mutate on recompute ------------------------------
  root.setAttribute('data-layer', 'inferred');
  root.textContent = '';

  var verdict = el('div', 'plab-verdict');
  var vArrow = el('span', 'plab-arrow');
  var vText = el('p', 'plab-verdict__line');
  var vMeta = el('p', 'plab-verdict__meta');
  verdict.appendChild(vArrow); verdict.appendChild(vText); verdict.appendChild(vMeta);
  // aria-live: announce the changing verdict (debounced), SR carries the meaning.
  var live = el('p', 'plab-sr');
  live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');
  root.appendChild(verdict); root.appendChild(live);

  var board = el('div', 'plab-board');
  root.appendChild(board);

  var controls = el('div', 'plab-controls');
  var ctrlHead = el('p', 'plab-controls__head', L('Drag a signal to explore', 'Mueve una señal para explorar'));
  controls.appendChild(ctrlHead);
  var sliderEls = {};
  indicators.forEach(function (ind) {
    var row = el('div', 'plab-ctrl');
    var lab = el('label', 'plab-ctrl__label');
    var id = 'plab-' + ind.id;
    lab.setAttribute('for', id);
    lab.appendChild(el('span', 'plab-ctrl__name', indName(ind.id)));
    var val = el('span', 'plab-ctrl__val', pct(scenario[ind.id] || 0));
    lab.appendChild(val);
    var input = document.createElement('input');
    input.type = 'range'; input.id = id; input.min = '-0.30'; input.max = '0.30'; input.step = '0.01';
    input.value = String(scenario[ind.id] || 0);
    input.setAttribute('aria-describedby', 'plab-verdict-sr');
    input.addEventListener('input', function () {
      scenario[ind.id] = parseFloat(input.value);
      val.textContent = pct(scenario[ind.id]);
      recompute();
    });
    row.appendChild(lab); row.appendChild(input);
    controls.appendChild(row);
    sliderEls[ind.id] = { input: input, val: val };
  });
  var resetBtn = el('button', 'plab-reset', L('↺ Reset to live read', '↺ Volver a la lectura en vivo'));
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', function () {
    scenario = Object.assign({}, base);
    indicators.forEach(function (ind) {
      sliderEls[ind.id].input.value = String(scenario[ind.id] || 0);
      sliderEls[ind.id].val.textContent = pct(scenario[ind.id] || 0);
    });
    recompute();
  });
  controls.appendChild(resetBtn);
  root.appendChild(controls);

  var foot = el('p', 'plab-foot', L(
    'Inferred from public USDA/EIA leading indicators — a direction, never a price.',
    'Inferido de indicadores públicos adelantados de USDA/EIA — una dirección, nunca un precio.'));
  root.appendChild(foot);

  // ---- Paint ----------------------------------------------------------------
  var liveVerdict = assessFor(base);
  var announceTimer = null, lastSaid = '';

  function paint(r) {
    var dir = r.under_review ? 'steady' : r.direction;
    vArrow.textContent = DIR_GLYPH[dir] || '·';
    vArrow.setAttribute('data-dir', dir);
    var who = modified() ? L('Your scenario', 'Tu escenario') : L('Live read', 'Lectura en vivo');
    vText.textContent = who + ': ' + (PHRASE[dir] || PHRASE.unknown) + '.';
    var metaBits = [L('confidence', 'confianza') + ' ' + (CONF_WORD[r.confidence] || r.confidence)];
    if (modified()) metaBits.unshift(L('hypothetical', 'hipotético'));
    else metaBits.unshift(L('inferred', 'inferido'));
    vMeta.textContent = metaBits.join(' · ');
    root.setAttribute('data-scenario', modified() ? 'modified' : 'live');

    // Scorecard: one bar per contributor (weight × signed_signal), tone by push,
    // then a cumulative P needle against ±cutoff (the line a move must clear).
    board.textContent = '';
    var maxW = 1;
    (r.contributors || []).forEach(function (c) { if (c.weight > maxW) maxW = c.weight; });
    (r.contributors || []).forEach(function (c) {
      var rowEl = el('div', 'plab-bar');
      rowEl.appendChild(el('span', 'plab-bar__name', indName(c.indicator)));
      var track = el('span', 'plab-bar__track');
      var fill = el('span', 'plab-bar__fill');
      var tone = c.signed_signal > 0 ? 'up' : c.signed_signal < 0 ? 'down' : 'flat';
      fill.setAttribute('data-push', tone);
      var w = (Math.abs(c.signed_signal) ? c.weight : 0) / maxW * 100;
      if (!reduce) fill.style.transition = 'width .25s ease';
      fill.style.width = (Math.max(w, c.signed_signal === 0 ? 6 : w)) + '%';
      if (c.signed_signal === 0) fill.setAttribute('data-zero', '1');
      track.appendChild(fill);
      rowEl.appendChild(track);
      rowEl.appendChild(el('span', 'plab-bar__push', c.signed_signal > 0 ? L('↑ up', '↑ alza') : c.signed_signal < 0 ? L('↓ down', '↓ baja') : L('— steady', '— estable')));
      board.appendChild(rowEl);
    });
    // Cumulative score vs cutoff
    var T = r.cutoff || 2;
    var scale = Math.max(T + 1, Math.abs(r.score) + 1);
    var sumRow = el('div', 'plab-sum');
    sumRow.appendChild(el('span', 'plab-sum__label', L('Score vs the line', 'Puntaje vs la línea')));
    var meter = el('span', 'plab-meter');
    var needle = el('span', 'plab-meter__needle');
    var leftPct = ((r.score + scale) / (2 * scale)) * 100;
    if (!reduce) needle.style.transition = 'left .25s ease';
    needle.style.left = leftPct + '%';
    needle.setAttribute('data-dir', dir);
    var lineLo = el('span', 'plab-meter__line'); lineLo.style.left = (((-T) + scale) / (2 * scale) * 100) + '%';
    var lineHi = el('span', 'plab-meter__line'); lineHi.style.left = ((T + scale) / (2 * scale) * 100) + '%';
    meter.appendChild(lineLo); meter.appendChild(lineHi); meter.appendChild(needle);
    sumRow.appendChild(meter);
    sumRow.appendChild(el('span', 'plab-sum__num', 'P=' + r.score + ' · ' + L('line', 'línea') + ' ±' + T));
    board.appendChild(sumRow);

    // Debounced SR announcement — only when it actually changes.
    var nUp = (r.contributors || []).filter(function (c) { return c.signed_signal > 0; }).length;
    var sentence = who + ': ' + (PHRASE[dir] || PHRASE.unknown) + ', ' + (CONF_WORD[r.confidence] || r.confidence) + ' ' + L('confidence', 'confianza') +
      '. ' + L('Score', 'Puntaje') + ' ' + r.score + ' ' + L('against a line of', 'contra una línea de') + ' ' + T + '.';
    if (sentence !== lastSaid) {
      clearTimeout(announceTimer);
      announceTimer = setTimeout(function () { live.textContent = sentence; lastSaid = sentence; }, 350);
    }
  }

  function recompute() { paint(assessFor(scenario)); }
  recompute();
})();
