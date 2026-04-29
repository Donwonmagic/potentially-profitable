/**
 * Shared four-states helper for tool result regions (Sprint 5).
 *
 * Every URL-fetching tool ships its own bespoke loading/error UX.
 * Today: a button label flicker and a native alert() popup. This
 * module unifies them so the user experiences the same shapes
 * across every tool — same skeleton on load, same inline error
 * card on failure.
 *
 * Anatomy on the host page:
 *
 *   <button id="seoSubmit">Grade it</button>
 *   <div class="tool-states-slot" id="seoStates"></div>
 *   <div class="seo-result" id="seoResult">
 *     <!-- the tool's existing result markup -->
 *   </div>
 *
 * Wiring (typical fetch flow):
 *
 *   var states = MuntinStates.attach({
 *     slotEl: document.getElementById('seoStates'),
 *     locale: document.documentElement.lang === 'es' ? 'es' : 'en',
 *   });
 *
 *   form.addEventListener('submit', function (e) {
 *     e.preventDefault();
 *     btn.disabled = true; btn.textContent = 'Grading…';
 *     states.setLoading();
 *     fetch(api).then(...).then(function (data) {
 *       renderResult(data);    // tool's existing renderer
 *       states.setSuccess();   // hides skeleton; result region stays as-is
 *     }).catch(function (err) {
 *       var classified = MuntinFetchError.classifyFetchError(err, response);
 *       states.setError(classified);   // inline error card; no alert()
 *     }).finally(function () {
 *       btn.disabled = false; btn.textContent = 'Grade it';
 *     });
 *   });
 *
 * The slot manages its own visibility via [data-state]; the tool's
 * own result region is untouched.
 */

(function (root) {
  'use strict';

  // Localized headlines per error kind. Bodies come from
  // MuntinFetchError.MESSAGES (already localized there).
  var ERROR_HEADLINES = {
    'rate-limit':   { en: 'Rate-limited',         es: 'Limitado por velocidad' },
    'timeout':      { en: 'That site is slow',    es: 'Ese sitio está lento'   },
    'bot-block':    { en: 'Blocked by the site',  es: 'Bloqueado por el sitio' },
    'not-found':    { en: 'Page not found',       es: 'Página no encontrada'   },
    'server-error': { en: 'The site is down',     es: 'El sitio está caído'    },
    'cors':         { en: 'Limited access',       es: 'Acceso limitado'        },
    'network':      { en: 'Couldn’t reach',  es: 'No pudimos conectar'    },
    'unknown':      { en: 'Something went wrong', es: 'Algo salió mal'         }
  };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c];
    });
  }

  function attach(opts) {
    if (!opts || !opts.slotEl) return null;
    var slotEl    = opts.slotEl;
    var locale    = (opts.locale === 'es') ? 'es' : 'en';
    // Default skeleton: a single card with three lines (matches the
    // visual weight of most tool result cards). Override per tool if
    // you want a multi-card skeleton.
    var shape     = opts.skeletonShape || ['80', '60', '40'];

    function clear() {
      while (slotEl.firstChild) slotEl.removeChild(slotEl.firstChild);
    }

    function setLoading() {
      clear();
      slotEl.setAttribute('data-state', 'loading');
      slotEl.setAttribute('aria-busy', 'true');
      var skeleton = document.createElement('div');
      skeleton.className = 'tool-skeleton';
      skeleton.setAttribute('aria-hidden', 'true');
      var card = document.createElement('div');
      card.className = 'tool-skeleton-card';
      shape.forEach(function (w) {
        var line = document.createElement('div');
        line.className = 'tool-skeleton-line';
        line.setAttribute('data-w', w);
        card.appendChild(line);
      });
      skeleton.appendChild(card);
      slotEl.appendChild(skeleton);
    }

    function setError(classified) {
      clear();
      slotEl.setAttribute('data-state', 'error');
      slotEl.setAttribute('aria-busy', 'false');

      var kind     = (classified && classified.kind) || 'unknown';
      var headline = (ERROR_HEADLINES[kind] || ERROR_HEADLINES.unknown)[locale];
      var body     = (classified && (locale === 'es' ? classified.messageEs : classified.messageEn))
                  || (typeof classified === 'string' ? classified : '');

      var meta = '';
      if (classified && typeof classified.retryAfterSec === 'number' && classified.retryAfterSec > 0) {
        meta = locale === 'es'
          ? 'Vuelve a intentarlo en aproximadamente ' + classified.retryAfterSec + ' segundos.'
          : 'Try again in about ' + classified.retryAfterSec + ' seconds.';
      }

      var errEl = document.createElement('div');
      errEl.className = 'tool-error';
      errEl.setAttribute('role', 'alert');
      errEl.innerHTML =
        '<p class="tool-error-headline">' + escapeHtml(headline) + '</p>' +
        '<p class="tool-error-body">' + escapeHtml(body) + '</p>' +
        (meta ? '<p class="tool-error-meta">' + escapeHtml(meta) + '</p>' : '');
      slotEl.appendChild(errEl);
    }

    function setSuccess() {
      clear();
      slotEl.setAttribute('data-state', 'idle');
      slotEl.setAttribute('aria-busy', 'false');
    }

    function reset() {
      clear();
      slotEl.setAttribute('data-state', 'idle');
      slotEl.setAttribute('aria-busy', 'false');
    }

    // Initialize to idle.
    reset();

    return {
      setLoading: setLoading,
      setError:   setError,
      setSuccess: setSuccess,
      reset:      reset,
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { attach: attach, ERROR_HEADLINES: ERROR_HEADLINES };
  } else {
    root.MuntinStates = { attach: attach, ERROR_HEADLINES: ERROR_HEADLINES };
  }
})(typeof self !== 'undefined' ? self : this);
