/**
 * Shared fetch-error classifier for the Muntin Digital toolkit.
 *
 * Every URL/audit tool (Speed Test, Mobile Check, Schema Check, SEO
 * Grader, Tech Stack, Compare, Restaurant Audit) currently shows
 * variations of "Could not scan that URL. Try again." on every kind
 * of failure — rate-limited, timed out, 4xx, 5xx, bot-blocked,
 * network-down. The owner has no actionable next step.
 *
 * This module returns a discriminated record:
 *
 *   {
 *     kind: 'rate-limit' | 'timeout' | 'bot-block' | 'not-found'
 *         | 'server-error' | 'cors' | 'network' | 'unknown',
 *     messageEn: string,
 *     messageEs: string,
 *     retryAfterSec: number | null
 *   }
 *
 * Pass to `localizedMessage(classified, locale)` to pick the right
 * language. The retryAfterSec hint comes from the HTTP Retry-After
 * header (when present) or a kind-specific default (rate-limit → 30s,
 * server-error → 60s, etc.) so callers can show a countdown.
 *
 * Pure function; safe to import in Node tests.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinFetchError = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ----- localized message templates (kind → {en, es}) -----
  var MESSAGES = {
    'rate-limit': {
      en: 'Google is rate-limiting us right now. Wait about 30 seconds and try again.',
      es: 'Google nos está limitando ahora mismo. Espera unos 30 segundos y vuelve a intentarlo.'
    },
    'timeout': {
      en: 'That site took longer than 8 seconds to respond. Try again, or check that the address is reachable from a regular browser tab.',
      es: 'Ese sitio tardó más de 8 segundos en responder. Inténtalo otra vez, o verifica que la dirección sea accesible desde una pestaña normal del navegador.'
    },
    'bot-block': {
      en: 'That site blocks automated checks (Cloudflare or similar). Try a different page on the same site (e.g. /menu), or warm the URL in your browser first so the security check is satisfied.',
      es: 'Ese sitio bloquea chequeos automáticos (Cloudflare u otro). Prueba con otra página del mismo sitio (por ejemplo /menu), o abre la URL en tu navegador primero para que pase la verificación de seguridad.'
    },
    'not-found': {
      en: 'That URL returns 404 — page not found. Check the address; common cause is a trailing slash or a stale link.',
      es: 'Esa URL devuelve 404 — página no encontrada. Verifica la dirección; lo común es una barra final o un enlace caducado.'
    },
    'server-error': {
      en: 'That site is currently returning a server error (5xx). It might be a temporary outage — try again in a few minutes.',
      es: 'Ese sitio está devolviendo un error de servidor (5xx). Puede ser una caída temporal — inténtalo de nuevo en unos minutos.'
    },
    'cors': {
      en: 'That site doesn\'t allow direct browser checks (CORS policy). Some audits still work — others may show partial results.',
      es: 'Ese sitio no permite chequeos directos desde el navegador (política CORS). Algunas auditorías aún funcionan — otras pueden mostrar resultados parciales.'
    },
    'network': {
      en: 'Couldn\'t reach that URL. Check your connection or that the address is correct (we automatically prefix https://).',
      es: 'No se pudo acceder a esa URL. Verifica tu conexión o que la dirección sea correcta (agregamos https:// automáticamente).'
    },
    'unknown': {
      en: 'Something went wrong while reading that URL. Try again, or open the address in a regular browser tab to see what loads.',
      es: 'Algo salió mal al leer esa URL. Inténtalo de nuevo, o abre la dirección en una pestaña normal del navegador para ver qué carga.'
    }
  };

  // Default retry-after seconds per kind. Used when the HTTP
  // Retry-After header is absent.
  var DEFAULT_RETRY = {
    'rate-limit':   30,
    'server-error': 60,
    'timeout':      10,
    'cors':         null,
    'network':      null,
    'not-found':    null,
    'bot-block':    null,
    'unknown':      null
  };

  // ----- the classifier -----
  function classifyFetchError(err, response) {
    // err is whatever the fetch threw / rejected with (or null when
    // the fetch resolved but the response is bad).
    // response is the Response object if we got one, else null.
    var kind = 'unknown';
    var retryAfterSec = null;

    if (response && typeof response.status === 'number') {
      // HTTP responded — classify by status.
      var status = response.status;
      var headerRetry = null;
      if (response.headers && typeof response.headers.get === 'function') {
        var ra = response.headers.get('retry-after');
        if (ra) {
          var parsed = parseInt(ra, 10);
          if (isFinite(parsed) && parsed > 0) headerRetry = parsed;
        }
      }
      if (status === 429) kind = 'rate-limit';
      else if (status === 404) kind = 'not-found';
      else if (status >= 500 && status < 600) kind = 'server-error';
      else if (status === 403) {
        // Read body if we can — Cloudflare etc. mark themselves
        // explicitly. Caller can pass a `bodySnippet` field on the
        // response-shaped argument to short-circuit.
        var hint = (response.bodySnippet || '').toLowerCase();
        if (/cloudflare|forbidden|denied|attention required|access denied/.test(hint)) {
          kind = 'bot-block';
        } else {
          kind = 'bot-block'; // 403 alone is still likely bot-block
        }
      }
      else if (status >= 400 && status < 500) kind = 'unknown';
      retryAfterSec = headerRetry || DEFAULT_RETRY[kind];
    } else if (err) {
      // No response — examine the error.
      var name = (err.name || '').toLowerCase();
      var msg  = (err.message || '').toLowerCase();
      if (name === 'aborterror' || /aborted|timeout/.test(msg)) {
        kind = 'timeout';
      } else if (/cors/.test(msg)) {
        kind = 'cors';
      } else if (name === 'typeerror' && /failed to fetch|networkerror/.test(msg)) {
        kind = 'network';
      } else {
        kind = 'unknown';
      }
      retryAfterSec = DEFAULT_RETRY[kind];
    }

    var template = MESSAGES[kind] || MESSAGES.unknown;
    return {
      kind: kind,
      messageEn: template.en,
      messageEs: template.es,
      retryAfterSec: retryAfterSec
    };
  }

  // Convenience: pick the locale-appropriate message string.
  function localizedMessage(classified, locale) {
    if (!classified) return '';
    return locale === 'es' ? classified.messageEs : classified.messageEn;
  }

  return {
    classifyFetchError: classifyFetchError,
    localizedMessage:   localizedMessage,
    MESSAGES:           MESSAGES,
    DEFAULT_RETRY:      DEFAULT_RETRY
  };
}));
