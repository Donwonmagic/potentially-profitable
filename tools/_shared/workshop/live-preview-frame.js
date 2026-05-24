/**
 * Workshop Kit widget: live-preview-frame
 *
 * Renders a sandboxed <iframe> showing a miniature, live preview of the
 * operator's restaurant site as it stands right now. Reads from
 * MuntinContext.readRestaurantProfile() plus a few additional context
 * keys (palette, onePromise) and re-renders whenever a sibling widget
 * commits a change.
 *
 * This is the foundational widget — it powers the "Your site so far"
 * rail in every bootcamp lesson, and it's the canonical example future
 * Workshop Kit authors look at when building new widgets.
 *
 * Architecture: this module is intentionally THIN. The actual rendering
 * lives in course/m4-launch/generator/templates/page-home.template.js,
 * which is the single source of truth shared with the L14 generator.
 * That means "what the operator sees in the rail" and "what gets
 * generated when they hit download" cannot drift.
 *
 * Accessibility: the iframe is hidden from assistive tech (aria-hidden +
 * tabindex=-1). A semantic <dl> summary lives alongside it as the AT-
 * exposed source of truth, and the live region announces specific value
 * changes ("Name: Joe's Taqueria") rather than vague deltas.
 *
 * Markup expected:
 *
 *   <section class="course-widget" data-widget="live-preview-frame"
 *            data-preview-page="home">
 *     <!-- engine mounts here -->
 *   </section>
 *
 * No fetches. No account. Same posture as every other Muntin tool.
 */

import { renderHome, renderHomeSummary, summarizeChange, contrastRatio } from '/course/m4-launch/generator/templates/page-home.template.js';

export const tag = 'live-preview-frame';
export const contextKeys = ['palette', 'onePromise', 'customerParagraph'];

function readState() {
  const ctx = (typeof window !== 'undefined' && window.MuntinContext && window.MuntinContext.read()) || {};
  const profile = (typeof window !== 'undefined' && window.MuntinContext
                   && typeof window.MuntinContext.readRestaurantProfile === 'function'
                   ? window.MuntinContext.readRestaurantProfile() : null) || null;
  return {
    palette: ctx.palette,
    onePromise: ctx.onePromise,
    customerParagraph: ctx.customerParagraph,
    restaurantProfile: profile
  };
}

function detectLocale(rootEl) {
  // Prefer the widget's own data-locale, then the page <html lang>,
  // then default to 'en'. Course lesson pages always set <html lang>;
  // demo pages and embedded contexts may not.
  const widgetLocale = rootEl.getAttribute('data-locale');
  if (widgetLocale && /^[a-z]{2}$/i.test(widgetLocale)) return widgetLocale.toLowerCase();
  const docLang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  return docLang.startsWith('es') ? 'es' : 'en';
}

export function mount(rootEl, state, deps) {
  const page = rootEl.getAttribute('data-preview-page') || 'home';
  const locale = (deps && deps.locale) || detectLocale(rootEl);

  rootEl.innerHTML = [
    '<div class="lpf">',
      '<div class="lpf-bar" aria-hidden="true">',
        '<span class="lpf-bar-dot"></span>',
        '<span class="lpf-bar-dot"></span>',
        '<span class="lpf-bar-dot"></span>',
        '<span class="lpf-bar-url">your-restaurant.com/', page === 'home' ? '' : page, '</span>',
      '</div>',
      // Iframe is hidden from assistive tech; the <dl> summary below is
      // the AT-exposed source of truth. Sandbox is empty (most
      // restrictive) since the srcdoc is fully self-contained.
      '<iframe class="lpf-frame" sandbox="" tabindex="-1" aria-hidden="true" title="Live preview (visual only)" loading="lazy"></iframe>',
      '<div class="lpf-summary sr-only" aria-live="off"></div>',
      '<p class="lpf-caption" role="status" aria-live="polite"></p>',
      '<p class="lpf-contrast-warn" hidden></p>',
    '</div>'
  ].join('');

  const iframe  = rootEl.querySelector('.lpf-frame');
  const summary = rootEl.querySelector('.lpf-summary');
  const caption = rootEl.querySelector('.lpf-caption');
  const warn    = rootEl.querySelector('.lpf-contrast-warn');

  // Localized phrases used in the widget's own chrome (not in the
  // rendered preview document — those live in the shared template).
  const phrases = locale === 'es'
    ? { previewOther:    'Vista previa de "{page}" llega en una lección futura.',
        previewCaption:  'Vista previa: página {page} (aún no creada)',
        updateFirstPaint:'La vista previa se actualiza a medida que terminas las lecciones.',
        contrastWarnHi:  'El contraste de tu paleta está bajo ({ratio}:1). Los clientes con vista baja tendrán problemas para leer.',
        contrastWarnLo:  'El contraste de tu paleta está muy bajo ({ratio}:1) — el texto puede ser ilegible.' }
    : { previewOther:    'Preview for "{page}" arrives in a later lesson.',
        previewCaption:  'Preview: {page} page (not yet built)',
        updateFirstPaint:'Preview updates as you finish lessons.',
        contrastWarnHi:  'Your palette contrast is low ({ratio}:1). Low-vision diners will struggle to read it.',
        contrastWarnLo:  'Your palette contrast is very low ({ratio}:1) — the text may be unreadable.' };

  let prevState = null;

  function paint(nextState) {
    if (page !== 'home') {
      const stub = phrases.previewOther.replace('{page}', page);
      iframe.srcdoc = '<!doctype html><body style="font-family:-apple-system,sans-serif;padding:24px;color:#6B6B6B;background:#F3EEE3;margin:0">' + stub.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</body>';
      caption.textContent = phrases.previewCaption.replace('{page}', page);
      summary.innerHTML = '';
      return;
    }

    // Render the iframe via the shared template — same module the L14
    // generator imports. Drift cannot happen.
    iframe.srcdoc = renderHome(nextState, { locale: locale });

    // Render the AT-exposed semantic summary alongside.
    summary.innerHTML = renderHomeSummary(nextState, { locale: locale });

    // Announce only what changed, not just which fields are present.
    const changeText = summarizeChange(prevState, nextState, { locale: locale });
    caption.textContent = changeText || phrases.updateFirstPaint;

    // Contrast guard: if the operator picked a palette, check
    // accent-on-cream contrast and warn if below 4.5:1 (WCAG AA for
    // normal text). The warning is *advisory* — we never block — but
    // it's perceivable both visually and via the same aria-live caption.
    if (Array.isArray(nextState.palette) && nextState.palette.length >= 2) {
      const ratio = contrastRatio(nextState.palette[0], nextState.palette[1]);
      const r = ratio.toFixed(1);
      if (ratio < 3.0) {
        warn.hidden = false;
        warn.textContent = phrases.contrastWarnLo.replace('{ratio}', r);
        warn.setAttribute('data-severity', 'critical');
      } else if (ratio < 4.5) {
        warn.hidden = false;
        warn.textContent = phrases.contrastWarnHi.replace('{ratio}', r);
        warn.setAttribute('data-severity', 'warning');
      } else {
        warn.hidden = true;
        warn.textContent = '';
        warn.removeAttribute('data-severity');
      }
    } else {
      warn.hidden = true;
      warn.textContent = '';
    }

    prevState = nextState;
  }

  paint(state);

  function onChange() { paint(readState()); }
  const eventName = (typeof window !== 'undefined' && window.WorkshopKit && window.WorkshopKit.CONTEXT_CHANGE_EVENT) || 'mtn:context-change';
  window.addEventListener(eventName, onChange);
  // Also catch cross-tab updates (storage events on the shared bus).
  window.addEventListener('storage', function (e) {
    if (!e || !e.key || e.key === 'mtn:context') onChange();
  });

  return {
    unmount: function () {
      window.removeEventListener(eventName, onChange);
      rootEl.innerHTML = '';
    },
    refresh: function (nextState) { paint(nextState); }
  };
}

export function serialize() {
  // The preview frame is a viewer, not a data-entry widget.
  return {};
}
