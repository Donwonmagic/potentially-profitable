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
    try { localStorage.setItem(RESUME_KEY, JSON.stringify({ ts: Date.now(), record: rec })); } catch (_) {}
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

  function ready(fn) {
    if (typeof document === 'undefined') return;
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    wireFirstRun();
    wireResume();
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
