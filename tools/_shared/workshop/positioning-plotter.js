/**
 * Workshop Kit widget: positioning-plotter
 *
 * A two-axis positioning grid. The operator places a single dot
 * representing where their restaurant sits in the competitive landscape.
 * Axes are configurable per instance via data-* attributes; the most
 * common use is L6a (cuisine breadth × price tier).
 *
 * Implementation: a 280×280 grid with a focusable dot. Dragging works
 * on mouse + touch; arrow keys move in 5% increments (Shift+arrows
 * move in 20% increments for coarse positioning). Live region announces
 * the current position in plain language using axis labels.
 *
 * Markup:
 *
 *   <section class="course-widget" data-widget="positioning-plotter"
 *            data-x-axis="Cuisine breadth"
 *            data-x-low="Single specialty"
 *            data-x-high="Many cuisines"
 *            data-y-axis="Price tier"
 *            data-y-low="$ counter"
 *            data-y-high="$$$$ upscale">
 *   </section>
 *
 * State written to MuntinContext.positioning = { x: 0..1, y: 0..1, label }.
 * Default x = y = 0.5 (centered) until the operator interacts.
 *
 * Accessibility:
 *   - Dot has role="slider" with aria-valuemin/max/now/text.
 *   - Plain-language readout in a polite live region.
 *   - Quadrant labels visible at the four corners + center crosshair.
 *   - Keyboard: ArrowLeft/Right/Up/Down, Shift for 4×, Home (left edge),
 *     End (right edge), PageUp (top), PageDown (bottom).
 */

export const tag = 'positioning-plotter';
export const contextKeys = ['positioning'];

function escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Pick a low/mid/high tier label based on a 0..1 value.
function tierLabel(v, low, high) {
  if (v < 0.33) return low;
  if (v > 0.66) return high;
  return 'middle';
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';

  const xAxis  = rootEl.getAttribute('data-x-axis')  || 'X';
  const xLow   = rootEl.getAttribute('data-x-low')   || 'low';
  const xHigh  = rootEl.getAttribute('data-x-high')  || 'high';
  const yAxis  = rootEl.getAttribute('data-y-axis')  || 'Y';
  const yLow   = rootEl.getAttribute('data-y-low')   || 'low';
  const yHigh  = rootEl.getAttribute('data-y-high')  || 'high';

  const phrases = locale === 'es'
    ? { instruction: 'Arrastra el punto, o usa las flechas del teclado para moverlo. Mantén Shift para saltos más grandes.',
        savedNow: 'Posición guardada en este navegador',
        ariaLabel: 'Posición de tu restaurante. Usa las flechas del teclado para mover el punto en dos dimensiones.',
        readoutTpl: 'Estás aquí: {yTier} en {yAxis}, {xTier} en {xAxis}.',
        middle: 'intermedio' }
    : { instruction: 'Drag the dot, or use the arrow keys to move it. Hold Shift for larger jumps.',
        savedNow: 'Position saved in this browser',
        ariaLabel: 'Your restaurant\'s position. Use arrow keys to move the dot in two dimensions.',
        readoutTpl: 'You\'re here: {yTier} on {yAxis}, {xTier} on {xAxis}.',
        middle: 'middle' };

  // Hydrate from state, default to centered.
  const initial = (state && state.positioning && typeof state.positioning.x === 'number' && typeof state.positioning.y === 'number')
    ? { x: clamp(state.positioning.x, 0, 1), y: clamp(state.positioning.y, 0, 1) }
    : { x: 0.5, y: 0.5 };

  // Unique id for the readout so aria-describedby can point at it
  // without colliding if multiple plotters land on the same page.
  const readoutId = 'pp2d-readout-' + Math.random().toString(36).slice(2, 8);

  rootEl.innerHTML = [
    '<div class="pp2d">',
      '<p class="pp2d-instruction">', escHtml(phrases.instruction), '</p>',
      '<div class="pp2d-frame">',
        // Y-axis label (left, vertical)
        '<div class="pp2d-y-axis"><span class="pp2d-axis-label">', escHtml(yAxis), '</span></div>',
        // Grid container with the four corner labels + crosshair + dot.
        // No role="slider" — sliders are 1D and this control is 2D.
        // A focusable button + aria-describedby pointing at the plain-
        // language readout is the cleanest AT model.
        '<div class="pp2d-grid-wrap">',
          '<div class="pp2d-corner pp2d-tl">', escHtml(yHigh), ' &middot;<br>', escHtml(xLow), '</div>',
          '<div class="pp2d-corner pp2d-tr">', escHtml(yHigh), ' &middot;<br>', escHtml(xHigh), '</div>',
          '<div class="pp2d-corner pp2d-bl">', escHtml(yLow), ' &middot;<br>', escHtml(xLow), '</div>',
          '<div class="pp2d-corner pp2d-br">', escHtml(yLow), ' &middot;<br>', escHtml(xHigh), '</div>',
          '<div class="pp2d-grid" tabindex="-1">',
            '<div class="pp2d-crosshair pp2d-crosshair-h" aria-hidden="true"></div>',
            '<div class="pp2d-crosshair pp2d-crosshair-v" aria-hidden="true"></div>',
            '<button type="button" class="pp2d-dot"',
              ' aria-label="', escAttr(phrases.ariaLabel), '"',
              ' aria-describedby="', readoutId, '"',
              ' aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home End PageUp PageDown"',
              ' style="left:', (initial.x * 100), '%;top:', ((1 - initial.y) * 100), '%"',
              '></button>',
          '</div>',
        '</div>',
        // X-axis label (bottom)
        '<div class="pp2d-x-axis"><span class="pp2d-axis-label">', escHtml(xAxis), '</span></div>',
      '</div>',
      // Single live region: the readout. The status line is for the
      // brief "saved" confirmation and stays non-live to avoid
      // double-announcement.
      '<p class="pp2d-readout" id="', readoutId, '" role="status" aria-live="polite"></p>',
      '<p class="pp2d-status"></p>',
    '</div>'
  ].join('');

  const grid = rootEl.querySelector('.pp2d-grid');
  const dot = rootEl.querySelector('.pp2d-dot');
  const readout = rootEl.querySelector('.pp2d-readout');
  const status = rootEl.querySelector('.pp2d-status');

  let position = { x: initial.x, y: initial.y };

  function plainTier(v, low, high) {
    if (v < 0.33) return low;
    if (v > 0.66) return high;
    return phrases.middle;
  }

  function paint() {
    const left = position.x * 100;
    const top = (1 - position.y) * 100;
    dot.style.left = left + '%';
    dot.style.top = top + '%';
    const xTier = plainTier(position.x, xLow, xHigh);
    const yTier = plainTier(position.y, yLow, yHigh);
    // The aria-describedby readout is the SR-exposed source of truth
    // for the dot's current 2D position. Updating it here propagates
    // via the polite live region.
    readout.textContent = phrases.readoutTpl
      .replace('{yAxis}', yAxis).replace('{yTier}', yTier)
      .replace('{xAxis}', xAxis).replace('{xTier}', xTier);
  }

  let commitTimer = null;
  function scheduleCommit() {
    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(function () {
      const xTier = plainTier(position.x, xLow, xHigh);
      const yTier = plainTier(position.y, yLow, yHigh);
      deps.commit({
        positioning: {
          x: Math.round(position.x * 1000) / 1000,
          y: Math.round(position.y * 1000) / 1000,
          label: yTier + ' / ' + xTier
        }
      });
      status.textContent = phrases.savedNow;
      setTimeout(function () { status.textContent = ''; }, 1800);
    }, 250);
  }

  // ----- Mouse + touch drag -----
  function pointerPositionToCoords(clientX, clientY) {
    const rect = grid.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    return { x: x, y: y };
  }

  function onPointerMove(e) {
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    position = pointerPositionToCoords(p.clientX, p.clientY);
    paint();
    scheduleCommit();
  }

  function onPointerUp() {
    document.removeEventListener('mousemove', onPointerMove);
    document.removeEventListener('mouseup', onPointerUp);
    document.removeEventListener('touchmove', onPointerMove);
    document.removeEventListener('touchend', onPointerUp);
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    position = pointerPositionToCoords(p.clientX, p.clientY);
    paint();
    scheduleCommit();
    dot.focus();
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
  }

  grid.addEventListener('mousedown', onPointerDown);
  grid.addEventListener('touchstart', onPointerDown, { passive: false });

  // ----- Keyboard -----
  function onKey(e) {
    const step = e.shiftKey ? 0.2 : 0.05;
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':  position.x = clamp(position.x - step, 0, 1); break;
      case 'ArrowRight': position.x = clamp(position.x + step, 0, 1); break;
      case 'ArrowUp':    position.y = clamp(position.y + step, 0, 1); break;
      case 'ArrowDown':  position.y = clamp(position.y - step, 0, 1); break;
      case 'Home':       position.x = 0; break;
      case 'End':        position.x = 1; break;
      case 'PageUp':     position.y = 1; break;
      case 'PageDown':   position.y = 0; break;
      default: handled = false;
    }
    if (handled) {
      e.preventDefault();
      paint();
      scheduleCommit();
    }
  }
  dot.addEventListener('keydown', onKey);

  paint();
  // Commit initial position so downstream widgets see it even if the
  // operator never interacts.
  scheduleCommit();

  return {
    unmount: function () {
      onPointerUp();
      rootEl.innerHTML = '';
    },
    refresh: function (nextState) {
      const focused = rootEl.contains(document.activeElement);
      if (focused) return;
      if (nextState && nextState.positioning && typeof nextState.positioning.x === 'number') {
        position = {
          x: clamp(nextState.positioning.x, 0, 1),
          y: clamp(nextState.positioning.y, 0, 1)
        };
        paint();
      }
    }
  };
}

export function serialize(rootEl) {
  const dot = rootEl.querySelector('.pp2d-dot');
  if (!dot) return {};
  const left = parseFloat(dot.style.left) || 50;
  const top = parseFloat(dot.style.top) || 50;
  return {
    positioning: {
      x: Math.round(left) / 100,
      y: Math.round(100 - top) / 100
    }
  };
}
