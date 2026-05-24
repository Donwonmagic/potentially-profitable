/**
 * Workshop Kit widget: before-after-slider
 *
 * A single-handle reveal slider for "before vs after" rhetorical
 * comparisons. The 'after' content sits underneath; the 'before'
 * content sits on top, clipped to a draggable percentage of the
 * container's width (horizontal) or height (vertical). Dragging the
 * handle wipes between the two.
 *
 * Used by: L5b (audit — before/after a site refresh), L9b (photo
 * refresh triage — stock photo vs real photo), L13 (review response
 * — defensive opener vs name-own-repair opener). Viewer-only;
 * doesn't write to MuntinContext.
 *
 * Markup expected:
 *
 *   <section class="course-widget" data-widget="before-after-slider">
 *     <script type="application/json" class="before-after-config">
 *       {
 *         "before": {"label":"Before","label-es":"Antes","html":"<p>…</p>"},
 *         "after":  {"label":"After","label-es":"Después","html":"<p>…</p>"},
 *         "axis":   "horizontal",
 *         "initialPosition": 0.5
 *       }
 *     </script>
 *   </section>
 *
 * before.html / after.html are rendered as-is. Lesson author owns
 * safety of body content (these are lesson assets, not operator
 * input). For images, embed an <img> tag.
 *
 * Axis: 'horizontal' (default) splits left/right; 'vertical' splits
 * top/bottom. initialPosition is 0..1 (default 0.5 — handle starts
 * centered).
 *
 * Accessibility:
 *   - The handle is a role="slider" button with aria-valuemin=0 /
 *     aria-valuemax=100 / aria-valuenow={percent} / aria-valuetext
 *     reporting the labels ("70% Before, 30% After").
 *   - Arrow keys move the handle 5% per press; Shift+arrow 25%;
 *     Home/End jump to 0/100.
 *   - The labels are also visually rendered above the slider so a
 *     sighted user knows which side is which without dragging.
 *   - prefers-reduced-motion respected: the handle transitions are
 *     instant.
 */

export const tag = 'before-after-slider';
export const contextKeys = [];   // viewer-only widget

function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function pickLocaleField(obj, field, locale) {
  if (!obj) return '';
  return (locale === 'es' && obj[field + '-es']) ? obj[field + '-es'] : (obj[field] || '');
}

function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';
  const cfgScript = rootEl.querySelector('script.before-after-config[type="application/json"]');
  let cfg = { before: null, after: null, axis: 'horizontal', initialPosition: 0.5 };
  if (cfgScript) {
    try { cfg = Object.assign(cfg, JSON.parse(cfgScript.textContent)); }
    catch (e) {
      console.warn('[workshop:before-after-slider] invalid JSON', e);
      rootEl.innerHTML = '<p class="workshop-error">Before/after content failed to load.</p>';
      return { unmount: function () { rootEl.innerHTML = ''; } };
    }
  }
  if (!cfg.before || !cfg.after) {
    rootEl.innerHTML = '<p class="workshop-error">Before/after slider needs both `before` and `after` entries.</p>';
    return { unmount: function () { rootEl.innerHTML = ''; } };
  }

  const isHorizontal = cfg.axis !== 'vertical';
  const initial = clamp(typeof cfg.initialPosition === 'number' ? cfg.initialPosition : 0.5, 0, 1);

  const beforeLabel = pickLocaleField(cfg.before, 'label', locale) || (locale === 'es' ? 'Antes' : 'Before');
  const afterLabel  = pickLocaleField(cfg.after, 'label', locale)  || (locale === 'es' ? 'Después' : 'After');
  const beforeHtml  = pickLocaleField(cfg.before, 'html', locale);
  const afterHtml   = pickLocaleField(cfg.after, 'html', locale);

  const ariaText = locale === 'es' ? 'Posición: {n}% mostrando "Antes", {m}% mostrando "Después"'
                                   : 'Position: {n}% showing "Before", {m}% showing "After"';

  rootEl.innerHTML = [
    '<div class="bas" data-axis="', isHorizontal ? 'horizontal' : 'vertical', '">',
      '<div class="bas-labels">',
        '<span class="bas-label bas-label--before">', escHtml(beforeLabel), '</span>',
        '<span class="bas-label bas-label--after">', escHtml(afterLabel), '</span>',
      '</div>',
      '<div class="bas-frame">',
        '<div class="bas-after">', afterHtml, '</div>',
        '<div class="bas-before" style="', isHorizontal ? 'clip-path:inset(0 ' + ((1 - initial) * 100) + '% 0 0)'
                                                       : 'clip-path:inset(0 0 ' + ((1 - initial) * 100) + '% 0)', '">',
          beforeHtml,
        '</div>',
        '<button type="button" class="bas-handle" role="slider"',
          ' aria-orientation="', isHorizontal ? 'horizontal' : 'vertical', '"',
          ' aria-valuemin="0" aria-valuemax="100"',
          ' aria-valuenow="', Math.round(initial * 100), '"',
          ' aria-valuetext="', escAttr(ariaText.replace('{n}', Math.round(initial * 100)).replace('{m}', Math.round((1 - initial) * 100))), '"',
          ' style="', isHorizontal ? 'left:' + (initial * 100) + '%' : 'top:' + (initial * 100) + '%', '"',
        '><span aria-hidden="true">', isHorizontal ? '◀▶' : '▲▼', '</span></button>',
      '</div>',
    '</div>'
  ].join('');

  const frame  = rootEl.querySelector('.bas-frame');
  const before = rootEl.querySelector('.bas-before');
  const handle = rootEl.querySelector('.bas-handle');

  let position = initial;
  let dragging = false;

  function applyPosition(p) {
    position = clamp(p, 0, 1);
    const pctShown = Math.round(position * 100);
    const pctHidden = 100 - pctShown;
    if (isHorizontal) {
      before.style.clipPath = 'inset(0 ' + pctHidden + '% 0 0)';
      handle.style.left = pctShown + '%';
    } else {
      before.style.clipPath = 'inset(0 0 ' + pctHidden + '% 0)';
      handle.style.top = pctShown + '%';
    }
    handle.setAttribute('aria-valuenow', String(pctShown));
    handle.setAttribute('aria-valuetext', ariaText.replace('{n}', pctShown).replace('{m}', pctHidden));
  }

  function clientToPosition(clientX, clientY) {
    const rect = frame.getBoundingClientRect();
    if (isHorizontal) {
      if (!rect.width) return position;
      return clamp((clientX - rect.left) / rect.width, 0, 1);
    }
    if (!rect.height) return position;
    return clamp((clientY - rect.top) / rect.height, 0, 1);
  }

  function onPointerDown(e) {
    dragging = true;
    handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
    applyPosition(clientToPosition(e.clientX, e.clientY));
    e.preventDefault();
  }
  function onPointerMove(e) {
    if (!dragging) return;
    applyPosition(clientToPosition(e.clientX, e.clientY));
  }
  function onPointerUp(e) {
    dragging = false;
    if (handle.releasePointerCapture && e.pointerId !== undefined) {
      try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  }

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove);
  handle.addEventListener('pointerup',   onPointerUp);
  handle.addEventListener('pointercancel', onPointerUp);

  // Frame-level click jumps the handle to the click position. Useful
  // on touch where dragging the small handle is fiddly.
  frame.addEventListener('click', function (e) {
    if (e.target === handle || handle.contains(e.target)) return;
    applyPosition(clientToPosition(e.clientX, e.clientY));
  });

  handle.addEventListener('keydown', function (e) {
    const big = e.shiftKey ? 0.25 : 0.05;
    let next = position;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = position - big;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = position + big;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    applyPosition(next);
  });

  return {
    unmount: function () {
      rootEl.innerHTML = '';
    }
  };
}

export function serialize() { return {}; }
