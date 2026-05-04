/**
 * Invoice Decoder — onboarding + sample-run + returning-visitor
 * (Wave 5.1 / 5.5 / 5.6).
 *
 * Surfaces a sample-demo strip on first visit (so the operator can
 * watch the pipeline run on a fixture before risking their own
 * data); a returning-visitor banner with stats once they have ≥1
 * saved invoice; a resume affordance when an abandoned run was
 * detected; and a personal-accuracy stat once the operator's
 * confirmation history exists.
 *
 * Privacy posture: pure on-device. Reads MuntinContext.
 * invoiceDecoder.{hasRun, runs, accuracySamples}, writes to it
 * after each save.
 */
(function (root) {
  'use strict';

  function ctx() {
    return (typeof root !== 'undefined' && root && root.MuntinContext) ? root.MuntinContext : null;
  }

  function getState() {
    var c = ctx();
    if (!c) return {};
    var data = c.read() || {};
    return data.invoiceDecoder || {};
  }

  function setState(patch) {
    var c = ctx();
    if (!c) return false;
    var current = c.read() || {};
    var existing = current.invoiceDecoder || {};
    return c.merge({ invoiceDecoder: Object.assign({}, existing, patch) });
  }

  // ---------------------- Sample fixtures ----------------------
  // Pre-baked OCR output so the operator sees the full pipeline
  // (parsing → categorizing → confidence → save flow) on a sample
  // before they upload their own. Each fixture is a string of OCR
  // lines that the existing parser handles natively.
  var SAMPLES = {
    'sysco': {
      label: 'Sysco invoice',
      labelEs: 'Factura Sysco',
      fullText:
        'SYSCO HOUSTON\n' +
        'Customer Number: 1842371\n' +
        'SUPC Pack Description Qty Unit Price\n' +
        '0123456 12/16OZ ROMAINE HEARTS 24CT 2 CS $48.00\n' +
        '0234567 10LB GROUND CHUCK 2 CS $58.00\n' +
        '0345678 5LB SALMON FILLET 1 CS $62.50\n' +
        '0456789 6/1GAL OLIVE OIL 1 CS $48.00\n' +
        '0567890 24CT TO-GO CONTAINER 1 CS $34.00\n' +
        'INVOICE TOTAL: $250.50\n'
    },
    'rest-depot': {
      label: 'Restaurant Depot',
      labelEs: 'Restaurant Depot',
      fullText:
        'RESTAURANT DEPOT WAREHOUSE 18\n' +
        'MEMBER PRICE\n' +
        '3 LB CEBOLLA BLANCA 50 LB BAG $24.00\n' +
        '2 CASE TOMATO 25 LB CASE $48.00\n' +
        '1 CASE PAPER NAPKIN 5000CT $32.00\n' +
        '4 LB QUESO OAXACA $36.00\n' +
        '1 GAL ACEITE VEGETAL $18.00\n'
    },
    'produce': {
      label: 'Produce jobber',
      labelEs: 'Mayorista de verduras',
      fullText:
        'EAST END PRODUCE CO.\n' +
        'Invoice 4421\n' +
        '12 LB ROMAINE HEARTS $34.00\n' +
        '8 LB CILANTRO BUNCH $14.40\n' +
        '5 LB AVOCADO HASS $24.00\n' +
        '4 LB JALAPEÑO PEPPERS $9.60\n' +
        '6 LB TOMATO ROMA 25LB $19.20\n' +
        'Subtotal $101.20\n'
    }
  };

  // Convert a fixture into the same fake-OCR shape the test runner uses.
  function fakeOcrLines(fullText) {
    return String(fullText).split('\n').filter(function (l) { return l.trim(); }).map(function (t) {
      return { text: t, confidence: 80 + Math.floor(Math.random() * 15) };
    });
  }

  // Run a sample fixture through the live pipeline. Returns the
  // parsed object via callback (controller calls renderParsed).
  function runSample(id, callback) {
    var fx = SAMPLES[id];
    if (!fx) { if (callback) callback(null); return; }
    if (typeof MID_PARSE === 'undefined' || typeof MID_VENDORS === 'undefined' || typeof MID_CATEGORIZE === 'undefined') {
      if (callback) callback(null);
      return;
    }
    var ocrLines = fakeOcrLines(fx.fullText);
    var parsed = MID_PARSE.parseLines(ocrLines, fx.fullText);
    var vMatch = MID_VENDORS.detectVendor(fx.fullText);
    if (vMatch) {
      MID_VENDORS.applyVendorBoost(parsed.rows, vMatch);
      parsed.vendor = vMatch.id;
    }
    parsed.rows.forEach(function (r) {
      var c = MID_CATEGORIZE.classify(r);
      r.category = c.category;
      r.categoryConfidence = c.confidence;
      r.categoryTier = c.tier;
      r.tags = c.tags || [];
    });
    parsed._isSample = true;
    parsed._sampleId = id;
    if (callback) callback(parsed);
  }

  // Mark sample completion.
  function markSampleCompleted(id) {
    var s = getState();
    var samplesRun = Array.isArray(s.samplesRun) ? s.samplesRun.slice() : [];
    if (samplesRun.indexOf(id) === -1) samplesRun.push(id);
    setState({ samplesRun: samplesRun });
  }

  // ---------------------- Run tracking ----------------------
  function markFirstRun() { setState({ hasRun: true, firstRunAt: Date.now() }); }

  function recordSave(saveCount) {
    setState({
      hasRun: true,
      runs: (saveCount != null) ? saveCount : ((getState().runs || 0) + 1),
      lastSavedAt: Date.now()
    });
  }

  // Track owner-confirmation accuracy: how often did rows ship as-is
  // without an edit? Bucket the per-invoice rate to a small ring so
  // we can show "On your last 5 invoices, 94% read correctly first time."
  function recordAccuracySample(rate) {
    if (typeof rate !== 'number' || !isFinite(rate)) return;
    var s = getState();
    var samples = Array.isArray(s.accuracySamples) ? s.accuracySamples.slice() : [];
    samples.unshift(+rate.toFixed(3));
    if (samples.length > 12) samples = samples.slice(0, 12);
    setState({ accuracySamples: samples });
  }

  function personalAccuracySummary() {
    var s = getState();
    var samples = Array.isArray(s.accuracySamples) ? s.accuracySamples : [];
    if (samples.length < 3) return null;
    var sample = samples.slice(0, 5);
    var sum = sample.reduce(function (a, b) { return a + b; }, 0);
    return {
      sampleSize: sample.length,
      averagePct: Math.round((sum / sample.length) * 100)
    };
  }

  // ---------------------- Abandonment resume ----------------------
  // We persist a tiny "session in progress" record after preprocessing
  // completes. If the user abandons the tab, on next load we offer to
  // resume. Capped to 24h freshness; never auto-applied.
  var RESUME_KEY = 'mtn:invoice-decoder:resume';
  function saveResumeRecord(rec) {
    try { localStorage.setItem(RESUME_KEY, JSON.stringify({ ts: Date.now(), record: rec })); } catch (_) {} // h8-exempt: resume-metadata stays on device; never POSTed
  }
  function readResumeRecord() {
    try {
      var raw = localStorage.getItem(RESUME_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || (Date.now() - (parsed.ts || 0)) > 86400000) return null;
      return parsed.record;
    } catch (_) { return null; }
  }
  function clearResumeRecord() {
    try { localStorage.removeItem(RESUME_KEY); } catch (_) {}
  }

  // ---------------------- Wiring ----------------------
  function wireFirstRun() {
    if (typeof document === 'undefined') return;
    var host = document.getElementById('idFirstRun');
    if (!host) return;
    var s = getState();
    if (s.hasRun) { host.hidden = true; return; }
    host.hidden = false;
    Array.prototype.forEach.call(host.querySelectorAll('.id-firstrun-btn'), function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-sample');
        runSample(id, function (parsed) {
          if (!parsed) return;
          // Surface a banner above the result panel: "this was a sample."
          var note = document.createElement('div');
          note.className = 'id-resume';
          note.innerHTML =
            '<p class="id-resume-msg"><strong>Sample run.</strong> Your real invoice runs the same way — your data never leaves your phone.</p>';
          var parsedEl = document.getElementById('idParsed');
          if (parsedEl && parsedEl.parentNode) parsedEl.parentNode.insertBefore(note, parsedEl);
          // Run through the controller's renderParsed if exposed.
          if (typeof root.MID_DECODER_RENDER === 'function') {
            root.MID_DECODER_RENDER(parsed);
          }
          // Wave 14.6 — let the first-run tour module know a sample
          // has rendered, so it can spotlight the cross-tool spine.
          try {
            root.dispatchEvent(new CustomEvent('mid:sample-rendered', { detail: { id: id } }));
          } catch (_) {}
          markSampleCompleted(id);
          if (root.plausible) {
            try { root.plausible('Invoice Decoder Sample Started', { props: { fixture: id } }); } catch (_) {}
          }
        });
      });
    });
  }

  function wireResume() {
    if (typeof document === 'undefined') return;
    var host = document.getElementById('idResume');
    if (!host) return;
    var rec = readResumeRecord();
    if (!rec) { host.hidden = true; return; }
    host.hidden = false;
    var btn = host.querySelector('.id-resume-btn');
    var dis = host.querySelector('.id-resume-dismiss');
    if (btn) btn.addEventListener('click', function () {
      if (typeof root.MID_DECODER_RESUME === 'function') {
        root.MID_DECODER_RESUME(rec);
      }
      clearResumeRecord();
      host.hidden = true;
    });
    if (dis) dis.addEventListener('click', function () {
      clearResumeRecord();
      host.hidden = true;
    });
  }

  // Wave 5.5 + 5.6 — returning-visitor banner + personal accuracy
  // stat. Inserts a top-of-page strip after the input chips when
  // (a) the operator has run before AND (b) we have ≥1 trend entry.
  function wireReturningVisitor() {
    if (typeof document === 'undefined') return;
    var s = getState();
    if (!s.hasRun || !s.runs) return;
    var host = document.getElementById('idInputs');
    if (!host || !host.parentNode) return;
    if (document.getElementById('idReturning')) return;  // idempotent
    var trend = (typeof root.MuntinContext !== 'undefined' && root.MuntinContext.readTrend)
      ? root.MuntinContext.readTrend() : [];
    if (!trend.length) return;
    var banner = document.createElement('div');
    banner.id = 'idReturning';
    banner.className = 'id-returning';
    var es = (root.document && root.document.documentElement && root.document.documentElement.lang === 'es');
    var stat = personalAccuracySummary();
    var statText = stat
      ? (es
        ? '<span class="id-returning-stat">' + stat.averagePct + '%</span> de tus filas se leyeron bien al primer intento en tus últimas ' + stat.sampleSize + ' facturas.'
        : '<span class="id-returning-stat">' + stat.averagePct + '%</span> of rows read correctly first time across your last ' + stat.sampleSize + ' invoices.')
      : '';
    var lastSum = trend[0] && trend[0].parsedSum ? '$' + trend[0].parsedSum.toFixed(2) : '—';
    banner.innerHTML =
      '<p class="id-returning-msg">' +
        '<strong>' + (es ? 'Bienvenido de vuelta.' : 'Welcome back.') + '</strong> ' +
        s.runs + (es ? ' factura' : ' invoice') + (s.runs === 1 ? '' : (es ? 's' : 's')) +
        (es ? ' guardada' : ' saved') + (s.runs === 1 ? '' : (es ? 's' : 's')) +
        ' · ' + (es ? 'última' : 'last') + ': ' + lastSum + '. ' +
        statText +
      '</p>';
    host.parentNode.insertBefore(banner, host);
  }

  // Wave 3.3 — Cmd-K command palette. Searchable overlay listing
  // every keyboard shortcut + workflow action.
  function wireCmdK() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('idCmdK')) return;
    var es = (document.documentElement && document.documentElement.lang === 'es');
    var COMMANDS = [
      { label: es ? 'Confirmar renglón enfocado' : 'Confirm focused row', kbd: 'Y', act: function () { var b = document.querySelector('.id-row-act-yes'); if (b) b.click(); } },
      { label: es ? 'Marcar y quitar' : 'Flag and remove', kbd: 'N', act: function () { var b = document.querySelector('.id-row-act-no'); if (b) b.click(); } },
      { label: es ? 'Confirmar el resto tal cual' : 'Confirm the rest as-is', kbd: '', act: function () { var b = document.getElementById('idBulkConfirm'); if (b && !b.disabled) b.click(); } },
      { label: es ? 'Ordenar por riesgo' : 'Sort by risk', kbd: '', act: function () { var b = document.getElementById('idSortToggle'); if (b) b.click(); } },
      { label: es ? 'Filtrar: por revisar' : 'Filter: needs review', kbd: '', act: function () { var b = document.querySelector('[data-filter="needReview"]'); if (b) b.click(); } },
      { label: es ? 'Filtrar: confirmados' : 'Filter: confirmed', kbd: '', act: function () { var b = document.querySelector('[data-filter="confirmed"]'); if (b) b.click(); } },
      { label: es ? 'Filtrar: todos' : 'Filter: all', kbd: '', act: function () { var b = document.querySelector('[data-filter="all"]'); if (b) b.click(); } },
      { label: es ? 'Exportar para QuickBooks Online' : 'Export for QuickBooks Online', kbd: '', act: function () { var b = document.querySelector('[data-fmt="qbo"]'); if (b) b.click(); } },
      { label: es ? 'Exportar para Xero' : 'Export for Xero', kbd: '', act: function () { var b = document.querySelector('[data-fmt="xero"]'); if (b) b.click(); } },
      { label: es ? 'Exportar genérico (CSV)' : 'Export generic ledger CSV', kbd: '', act: function () { var b = document.querySelector('[data-fmt="generic"]'); if (b) b.click(); } },
      { label: es ? 'Guardar a Workshop' : 'Save to Workshop', kbd: '', act: function () { var b = document.getElementById('idBulkSave'); if (b && !b.disabled) b.click(); } },
      { label: es ? 'Modo privacidad (apagar telemetría)' : 'Privacy mode (telemetry off)', kbd: '', act: function () { try { root.MID_TELEMETRY.setEnabled(false); alert(es ? 'Telemetría apagada.' : 'Telemetry off.'); } catch (_) {} } }
    ];

    var backdrop = document.createElement('div');
    backdrop.id = 'idCmdK';
    backdrop.className = 'id-cmdk-backdrop';
    backdrop.hidden = true;
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', es ? 'Paleta de comandos' : 'Command palette');
    backdrop.innerHTML =
      '<div class="id-cmdk-sheet">' +
        '<input type="text" id="idCmdKInput" class="id-cmdk-input" placeholder="' + (es ? 'Buscar un comando…' : 'Search a command…') + '" aria-label="' + (es ? 'Buscar comando' : 'Search command') + '" />' +
        '<ul id="idCmdKList" class="id-cmdk-list"></ul>' +
      '</div>';
    document.body.appendChild(backdrop);

    var input = backdrop.querySelector('#idCmdKInput');
    var list = backdrop.querySelector('#idCmdKList');
    var selectedIdx = 0;
    var visible = COMMANDS.slice();

    function render() {
      if (!visible.length) {
        list.innerHTML = '<li class="id-cmdk-empty">' + (es ? 'Sin coincidencias' : 'No matches') + '</li>';
        return;
      }
      list.innerHTML = visible.map(function (c, i) {
        return '<li class="id-cmdk-item" data-idx="' + i + '" aria-selected="' + (i === selectedIdx ? 'true' : 'false') + '">' +
          '<span>' + c.label + '</span>' +
          (c.kbd ? '<kbd>' + c.kbd + '</kbd>' : '') +
        '</li>';
      }).join('');
    }
    function filter(q) {
      var qq = String(q || '').toLowerCase();
      visible = qq
        ? COMMANDS.filter(function (c) { return c.label.toLowerCase().indexOf(qq) !== -1; })
        : COMMANDS.slice();
      selectedIdx = 0;
      render();
    }
    function open() {
      backdrop.hidden = false;
      input.value = '';
      filter('');
      setTimeout(function () { input.focus(); }, 0);
    }
    function close() {
      backdrop.hidden = true;
    }
    function execute(idx) {
      var cmd = visible[idx];
      if (!cmd) return;
      close();
      try { cmd.act(); } catch (_) {}
    }

    input.addEventListener('input', function () { filter(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(visible.length - 1, selectedIdx + 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(0, selectedIdx - 1); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); execute(selectedIdx); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    list.addEventListener('click', function (e) {
      var li = e.target.closest && e.target.closest('.id-cmdk-item');
      if (!li) return;
      execute(parseInt(li.getAttribute('data-idx'), 10));
    });
    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (backdrop.hidden) open();
        else close();
      }
    });
  }

  // Wave 6.6 — Privacy Self-Check. Records resource entries during a
  // synthetic OCR run on a sample fixture, asserts every entry is in
  // the allowlist, and prints a diff-able report. Single button next
  // to the verify-yourself disclosure.
  function wireSelfCheck() {
    if (typeof document === 'undefined') return;
    var honesty = document.querySelector('.id-honesty');
    if (!honesty) return;
    if (document.getElementById('idSelfCheck')) return;
    var es = (document.documentElement && document.documentElement.lang === 'es');
    var panel = document.createElement('div');
    panel.id = 'idSelfCheck';
    panel.className = 'id-selfcheck';
    panel.innerHTML =
      '<button type="button" class="id-selfcheck-btn" id="idSelfCheckBtn">' +
        (es ? 'Auditar privacidad ahora' : 'Run a privacy self-check') +
      '</button>' +
      '<pre class="id-selfcheck-out" id="idSelfCheckOut" aria-live="polite"></pre>';
    honesty.appendChild(panel);
    var btn = panel.querySelector('#idSelfCheckBtn');
    var out = panel.querySelector('#idSelfCheckOut');
    btn.addEventListener('click', function () {
      var ALLOWED = ['plausible.io'];
      try {
        var origin = root.location ? root.location.origin : '';
        try { performance.clearResourceTimings(); } catch (_) {}
        // Run a sample so resources fire.
        runSample('sysco', function () {
          setTimeout(function () {
            var entries = (performance.getEntriesByType('resource') || []).map(function (e) {
              try {
                var u = new URL(e.name);
                return { host: u.host, ok: u.origin === origin || ALLOWED.some(function (h) { return u.host === h || u.host.endsWith('.' + h); }) };
              } catch (_) { return { host: e.name, ok: false }; }
            });
            var bad = entries.filter(function (e) { return !e.ok; });
            var report = (es ? 'Auditoría de privacidad' : 'Privacy self-check') + '\n';
            report += '— ' + entries.length + (es ? ' solicitudes vistas' : ' resource requests observed') + '\n';
            entries.forEach(function (e) { report += (e.ok ? '✓ ' : '✗ ') + e.host + '\n'; });
            report += '\n';
            report += bad.length === 0
              ? (es ? '✓ Todas las solicitudes están en la lista permitida (mismo origen + plausible + jsdelivr).'
                    : '✓ Every request is on the allowlist (same-origin + plausible + jsdelivr).')
              : (es ? '✗ ' + bad.length + ' solicitudes fuera de la lista — REPORTA ESTO.'
                    : '✗ ' + bad.length + ' off-allowlist requests — PLEASE REPORT.');
            out.textContent = report;
            out.classList.add('show');
          }, 800);
        });
      } catch (e) {
        out.textContent = (es ? 'Falló la auditoría: ' : 'Self-check failed: ') + (e.message || e);
        out.classList.add('show');
      }
    });
  }

  function ready(fn) {
    if (typeof document === 'undefined') return;
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    wireFirstRun();
    wireResume();
    wireReturningVisitor();
    wireCmdK();
    wireSelfCheck();
  });

  var api = {
    SAMPLES:                SAMPLES,
    runSample:              runSample,
    markFirstRun:           markFirstRun,
    markSampleCompleted:    markSampleCompleted,
    recordSave:             recordSave,
    recordAccuracySample:   recordAccuracySample,
    personalAccuracySummary: personalAccuracySummary,
    saveResumeRecord:       saveResumeRecord,
    readResumeRecord:       readResumeRecord,
    clearResumeRecord:      clearResumeRecord,
    getState:               getState
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_ONBOARDING = api;
})(typeof window !== 'undefined' ? window : null);
