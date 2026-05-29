/**
 * L14 generator accordion-stepper auto-advance + mini-map sync.
 *
 * On mobile (≤ 768px) the three sections of the generator page —
 * Readiness checklist / What's in the ZIP / Download — render as
 * <details class="gen-step"> elements stacked vertically. This script:
 *
 *   1. Watches the readinessCount text for "X / 8 ready" and lights
 *      the corresponding mini-map dot.
 *   2. Auto-opens the "Download" step once the download button
 *      becomes enabled (signal from generator.js).
 *   3. Auto-pauses the auto-advance if the operator is mid-editing
 *      another step (document.activeElement test + 2s debounce).
 *
 * Pure progressive enhancement — every section remains usable if
 * this script never loads. The desktop layout (display:contents)
 * makes the script effectively a no-op above 768px.
 *
 * No fetches. No localStorage. No side effects beyond the DOM.
 */

(function () {
  if (typeof window === 'undefined' || !document.body) return;

  var stepCheck = document.querySelector('details.gen-step[data-step="checklist"]');
  var stepInv   = document.querySelector('details.gen-step[data-step="inventory"]');
  var stepDl    = document.querySelector('details.gen-step[data-step="download"]');
  var stepperMap = document.querySelector('.gen-stepper-map');
  var downloadBtn = document.getElementById('downloadBtn');
  var readinessCount = document.getElementById('readinessCount');
  if (!stepCheck || !stepInv || !stepDl) return;

  var mqMobile = window.matchMedia('(max-width: 768px)');
  var lastInteraction = 0;

  function markActive(name) {
    if (!stepperMap) return;
    var dots = stepperMap.querySelectorAll('.dot');
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var n = d.getAttribute('data-step-dot');
      d.removeAttribute('data-active');
      d.removeAttribute('aria-current');
      if (n === name) {
        d.setAttribute('data-active', 'true');
        d.setAttribute('aria-current', 'step');
      }
    }
  }

  function markReady(name, ready) {
    if (!stepperMap) return;
    var dot = stepperMap.querySelector('.dot[data-step-dot="' + name + '"]');
    if (!dot) return;
    if (ready) dot.setAttribute('data-ready', 'true');
    else dot.removeAttribute('data-ready');
  }

  function inFocus(stepEl) {
    var ae = document.activeElement;
    if (!ae || ae === document.body) return false;
    return stepEl.contains(ae);
  }

  function maybeAdvance() {
    if (!mqMobile.matches) return;
    if (Date.now() - lastInteraction < 2000) {
      setTimeout(maybeAdvance, 600);
      return;
    }
    // If readiness is fully green, open the download step (if not
    // already explicitly closed by the operator).
    if (downloadBtn && !downloadBtn.disabled && !stepDl.open) {
      if (inFocus(stepCheck) || inFocus(stepInv)) return; // operator still editing
      stepDl.open = true;
      markActive('download');
      markReady('checklist', true);
      markReady('inventory', true);
    }
  }

  // Click anywhere inside a step = "operator interacted with this step".
  [stepCheck, stepInv, stepDl].forEach(function (s) {
    s.addEventListener('click', function () { lastInteraction = Date.now(); });
    s.addEventListener('toggle', function () {
      if (!s.open) return;
      var name = s.getAttribute('data-step');
      markActive(name);
    });
    // Focus-within behavior
    s.addEventListener('focusin', function () { lastInteraction = Date.now(); });
  });

  // Watch readinessCount text for "X / 8 ready" — extract the X.
  if (readinessCount) {
    var observer = new MutationObserver(function () {
      var txt = (readinessCount.textContent || '').trim();
      var m = txt.match(/(\d+)\s*\/\s*(\d+)/);
      if (!m) return;
      var done = parseInt(m[1], 10), total = parseInt(m[2], 10);
      if (done >= total) {
        markReady('checklist', true);
        maybeAdvance();
      } else {
        markReady('checklist', false);
      }
    });
    observer.observe(readinessCount, { childList: true, characterData: true, subtree: true });
  }

  // Watch downloadBtn for enable transition.
  if (downloadBtn) {
    var bObs = new MutationObserver(function () {
      if (!downloadBtn.disabled) maybeAdvance();
    });
    bObs.observe(downloadBtn, { attributes: true, attributeFilter: ['disabled'] });
  }
})();
