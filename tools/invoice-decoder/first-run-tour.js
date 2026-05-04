/**
 * First-run tour (Wave 14.6).
 *
 * After a sample run completes (or when the operator clicks "Take
 * the 60-second tour"), spotlight five existing features in
 * sequence with a tooltip overlay:
 *
 *   1. Parsed rows + confidence chips     "Every line, sorted."
 *   2. The math reconciliation card or vendor-pulse strip
 *                                          "We catch the math + the
 *                                           overcharges."
 *   3. The owner-insights cards            "Insights you didn't ask for."
 *   4. The Save button                     "Save → encrypted on this
 *                                           device. Open DevTools."
 *   5. Cross-tool cascade preview          "Plate Cost auto-updates.
 *                                           Menu Engineering re-buckets.
 *                                           Margin Math shifts break-even.
 *                                           [Open Plate Cost ↗]"
 *
 * Skips steps whose target element isn't visible (e.g., insights
 * cards only render when triggers fire). Tour completion stored in
 * MuntinContext.invoiceDecoder.tourCompletedAt; subsequent loads
 * don't auto-open.
 *
 * Privacy: no fetch, no DOM-mounted iframe, no third-party tour lib.
 */
(function (root) {
  'use strict';
  if (typeof root === 'undefined' || !root || !root.document) return;

  var STEPS = [
    {
      id: 'rows',
      target: '#idParsed',
      title: 'Every line, sorted.',
      body: 'We OCR each line, classify it into one of nine restaurant categories (protein, produce, dairy …), and surface a confidence chip per row. Amber = double-check. Green = ready.'
    },
    {
      id: 'pulse',
      target: '#idVendorPulse, #idTrustSummary, #idMathFix',
      title: 'Math + contract overcharges, surfaced.',
      body: 'When the math is off by more than rounding, a one-tap fix lands at the row that broke it. Contract overages get a "Share this catch" CTA — operators screenshot these.'
    },
    {
      id: 'insights',
      target: '#idInsights, #idWhatIf',
      title: 'Insights you didn\'t ask for.',
      body: 'Top dishes affected, predictive reorder shortlist, vendor-switch ROI, supplier health. Each card hidden until its trigger fires — no noise on a clean invoice.'
    },
    {
      id: 'save',
      target: '#idSaveBtn, #idBulkSave, .id-bulk-save',
      title: 'Save → encrypted on your device.',
      body: 'AES-GCM-256, PBKDF2-SHA256-250k. Open DevTools → Network and watch: a single POST goes out, body is base64 ciphertext. Search the body for any of your dish names. You won\'t find them.'
    },
    {
      id: 'cascade',
      target: '#idHandoff, .id-honesty',
      title: 'Plate Cost auto-updates.',
      body: 'When you save, every recipe that uses items from this invoice gets new prices. Menu Engineering re-buckets quadrants. Margin Math shifts break-even covers. Cost Pulse renders the recipe ripple. The cascade runs entirely on this device.',
      cta: { label: 'Open Plate Cost ↗', href: '/tools/plate-cost/' }
    }
  ];

  function _ctx() {
    return (typeof root.MuntinContext !== 'undefined' && root.MuntinContext) || null;
  }
  function _markTourCompleted() {
    var c = _ctx();
    if (!c) return;
    try {
      var data = c.read() || {};
      var inv = Object.assign({}, data.invoiceDecoder || {}, { tourCompletedAt: Date.now() });
      c.merge({ invoiceDecoder: inv });
    } catch (_) {}
  }
  function _isTourCompleted() {
    var c = _ctx();
    if (!c) return false;
    try {
      var data = c.read() || {};
      return !!(data.invoiceDecoder && data.invoiceDecoder.tourCompletedAt);
    } catch (_) { return false; }
  }

  function _firstVisibleTarget(selectorList) {
    var sels = String(selectorList || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (!el) continue;
      var visible = !el.hidden && el.offsetParent !== null;
      if (visible) return el;
    }
    return null;
  }

  function _scrollIntoView(el) {
    if (!el) return;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
  }

  function _mountOverlay() {
    if (document.getElementById('idTourOverlay')) return document.getElementById('idTourOverlay');
    var overlay = document.createElement('div');
    overlay.id = 'idTourOverlay';
    overlay.className = 'id-tour-overlay';
    overlay.innerHTML =
      '<div class="id-tour-spotlight" id="idTourSpotlight"></div>' +
      '<div class="id-tour-tip" id="idTourTip" role="dialog" aria-modal="true" aria-labelledby="idTourTitle">' +
        '<p class="id-tour-step" id="idTourStep"></p>' +
        '<h3 class="id-tour-title" id="idTourTitle"></h3>' +
        '<p class="id-tour-body" id="idTourBody"></p>' +
        '<div class="id-tour-actions">' +
          '<button type="button" class="id-tour-skip" id="idTourSkip">Skip the tour</button>' +
          '<div style="flex:1"></div>' +
          '<button type="button" class="id-tour-back" id="idTourBack">Back</button>' +
          '<button type="button" class="id-tour-next id-tour-primary" id="idTourNext">Next</button>' +
          '<a class="id-tour-cta id-tour-primary" id="idTourCta" hidden></a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  var _state = { idx: 0, sequence: [] };

  function start(opts) {
    opts = opts || {};
    var sequence = STEPS.filter(function (step) { return _firstVisibleTarget(step.target); });
    if (!sequence.length) return false;
    _state.sequence = sequence;
    _state.idx = 0;
    var overlay = _mountOverlay();
    overlay.classList.add('is-open');
    _renderStep();
    if (root.plausible) {
      try { root.plausible('Invoice Decoder Tour Started', { props: { source: opts.source || 'auto' } }); } catch (_) {}
    }
    return true;
  }

  function _renderStep() {
    var overlay = document.getElementById('idTourOverlay');
    if (!overlay) return;
    var step = _state.sequence[_state.idx];
    if (!step) { _finish(); return; }
    var target = _firstVisibleTarget(step.target);
    if (!target) { _next(); return; }
    _scrollIntoView(target);
    setTimeout(function () { _placeSpotlight(target, step); }, 300);
  }

  function _placeSpotlight(target, step) {
    var rect = target.getBoundingClientRect();
    var spot = document.getElementById('idTourSpotlight');
    var tip  = document.getElementById('idTourTip');
    var pad = 8;
    spot.style.top    = (rect.top + window.scrollY - pad) + 'px';
    spot.style.left   = (rect.left + window.scrollX - pad) + 'px';
    spot.style.width  = (rect.width + pad * 2) + 'px';
    spot.style.height = (rect.height + pad * 2) + 'px';
    document.getElementById('idTourStep').textContent =
      'Step ' + (_state.idx + 1) + ' of ' + _state.sequence.length;
    document.getElementById('idTourTitle').textContent = step.title;
    document.getElementById('idTourBody').textContent  = step.body;
    var cta = document.getElementById('idTourCta');
    var nextBtn = document.getElementById('idTourNext');
    if (step.cta) {
      cta.textContent = step.cta.label;
      cta.href = step.cta.href;
      cta.hidden = false;
      cta.target = '_blank';
      cta.rel = 'noopener';
      nextBtn.textContent = 'Done';
    } else {
      cta.hidden = true;
      nextBtn.textContent = (_state.idx === _state.sequence.length - 1) ? 'Done' : 'Next';
    }
    var backBtn = document.getElementById('idTourBack');
    backBtn.disabled = _state.idx === 0;
    // Tip placement: below the spotlight when there's room, otherwise above.
    var tipTop = rect.bottom + window.scrollY + 16;
    var viewport = window.innerHeight + window.scrollY;
    if (tipTop + 200 > viewport) tipTop = Math.max(window.scrollY + 16, rect.top + window.scrollY - 240);
    tip.style.top = tipTop + 'px';
    tip.style.opacity = '1';
  }

  function _next() {
    if (_state.idx >= _state.sequence.length - 1) { _finish(); return; }
    _state.idx++;
    _renderStep();
  }
  function _back() {
    if (_state.idx <= 0) return;
    _state.idx--;
    _renderStep();
  }
  function _finish() {
    var overlay = document.getElementById('idTourOverlay');
    if (overlay) overlay.classList.remove('is-open');
    _markTourCompleted();
    if (root.plausible) {
      try { root.plausible('Invoice Decoder Tour Completed'); } catch (_) {}
    }
  }
  function _skip() {
    var overlay = document.getElementById('idTourOverlay');
    if (overlay) overlay.classList.remove('is-open');
    _markTourCompleted();
    if (root.plausible) {
      try { root.plausible('Invoice Decoder Tour Skipped', { props: { atStep: String(_state.idx + 1) } }); } catch (_) {}
    }
  }

  function init() {
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t) return;
      if (t.id === 'idTourNext') _next();
      else if (t.id === 'idTourBack') _back();
      else if (t.id === 'idTourSkip') _skip();
      else if (t.id === 'idTourCta') {
        // Operator clicked through to Plate Cost — count as completed.
        _markTourCompleted();
      } else if (t.id === 'idTourLaunch') {
        start({ source: 'manual' });
      }
    });
    document.addEventListener('keydown', function (ev) {
      var overlay = document.getElementById('idTourOverlay');
      if (!overlay || !overlay.classList.contains('is-open')) return;
      if (ev.key === 'Escape') _skip();
      if (ev.key === 'ArrowRight') _next();
      if (ev.key === 'ArrowLeft')  _back();
    });
    // Auto-trigger after a sample run completes (the controller fires
    // mid:sample-rendered when MID_DECODER_RENDER is invoked from
    // onboarding.js's first-run path).
    root.addEventListener('mid:sample-rendered', function () {
      if (_isTourCompleted()) return;
      setTimeout(function () { start({ source: 'sample' }); }, 800);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  var api = {
    start:           start,
    _isCompleted:    _isTourCompleted,
    _markCompleted:  _markTourCompleted,
    STEPS:           STEPS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_TOUR = api;
})(typeof window !== 'undefined' ? window : null);
