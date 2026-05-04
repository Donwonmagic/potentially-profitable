/**
 * Notification body templates (Wave E).
 *
 * Twelve verbatim template strings (six categories × two locales),
 * all ≤ 60 characters. Each takes a tokens object and returns the
 * filled-in body. A privacy guard at fill time drops tokens whose
 * source is not present in MuntinContext data the operator has
 * already seen — so a notification body can never carry a stem name
 * the operator hasn't already had on-device.
 *
 * Returns null when the privacy guard rejects a fill — caller is
 * expected to either fall back to a generic body or skip the
 * notification entirely.
 */
(function (root) {
  'use strict';

  var TEMPLATES = {
    DRIFT: {
      en: '{stem} up {pct}%. ~${impact}/mo at this pace.',
      es: '{stem} sube {pct}%. ~${impact}/mes a este ritmo.'
    },
    OVERCHARGE: {
      en: '{vendor}: ${over} over contract this month.',
      es: '{vendor}: ${over} sobre contrato este mes.'
    },
    RELIABILITY: {
      en: '{vendor} reliability slipped to {score}/100.',
      es: '{vendor} fiabilidad bajó a {score}/100.'
    },
    MARGIN: {
      en: '{dish} margin down {pp}pp after today\'s invoice.',
      es: '{dish}: margen baja {pp}pp tras la factura de hoy.'
    },
    DAILY: {
      en: 'Today: ${spend}, {n} invoices. {movers} movers.',
      es: 'Hoy: ${spend}, {n} facturas. {movers} cambios.'
    },
    WEEKLY: {
      en: 'Week: ${spend}. Top mover: {stem} {pct}%.',
      es: 'Semana: ${spend}. Mayor cambio: {stem} {pct}%.'
    }
  };

  function _es() {
    try { return (root.document && root.document.documentElement.lang || 'en').toLowerCase().slice(0, 2) === 'es'; }
    catch (_) { return false; }
  }

  // Privacy guard: every {stem} token must already exist in
  // MuntinContext.skuHistory; every {vendor} token must already exist
  // in MuntinContext.invoiceTrend or contractPrices; every {dish}
  // token must already be in dishCostHistory. New labels never appear
  // in a notification body.
  function _knownStems() {
    var ctx = root && root.MuntinContext;
    if (!ctx || typeof ctx.read !== 'function') return null;
    try {
      var d = ctx.read() || {};
      return Object.keys((d && d.skuHistory) || {});
    } catch (_) { return null; }
  }
  function _knownVendors() {
    var ctx = root && root.MuntinContext;
    if (!ctx) return null;
    try {
      var d = ctx.read() || {};
      var set = Object.create(null);
      var trend = ctx.readTrend ? ctx.readTrend() : (d.invoiceTrend || []);
      (trend || []).forEach(function (e) { if (e && e.vendor) set[e.vendor] = true; });
      Object.keys((d.contractPrices) || {}).forEach(function (k) {
        var c = d.contractPrices[k];
        if (c && c.vendor) set[c.vendor] = true;
      });
      return Object.keys(set);
    } catch (_) { return null; }
  }
  function _knownDishes() {
    var ctx = root && root.MuntinContext;
    if (!ctx) return null;
    try {
      var d = ctx.read() || {};
      return Object.keys((d && d.dishCostHistory) || {});
    } catch (_) { return null; }
  }

  function _fill(template, tokens) {
    return template.replace(/\{(\w+)\}/g, function (_, k) {
      var v = tokens[k];
      return (v === undefined || v === null) ? '' : String(v);
    });
  }

  // Render — returns the filled body or null when the privacy guard
  // rejects (e.g., {stem} token not in skuHistory).
  function build(category, tokens, opts) {
    opts = opts || {};
    var t = TEMPLATES[category];
    if (!t) return null;
    var locale = opts.locale || (_es() ? 'es' : 'en');
    var template = t[locale] || t.en;

    // Privacy guard
    if (tokens.stem) {
      var stems = _knownStems();
      if (stems && stems.indexOf(tokens.stem) === -1) return null;
    }
    if (tokens.vendor) {
      var vendors = _knownVendors();
      if (vendors && vendors.indexOf(tokens.vendor) === -1) return null;
    }
    if (tokens.dish) {
      var dishes = _knownDishes();
      if (dishes && dishes.indexOf(tokens.dish) === -1) return null;
    }

    var filled = _fill(template, tokens);
    // Final length cap — Notification body display works best at ≤60 chars.
    if (filled.length > 110) filled = filled.slice(0, 107) + '…';
    return filled;
  }

  function title(category, opts) {
    var locale = (opts && opts.locale) || (_es() ? 'es' : 'en');
    var en = {
      DRIFT:       'Price drift on a SKU',
      OVERCHARGE:  'Contract overcharge',
      RELIABILITY: 'Supplier reliability',
      MARGIN:      'Dish margin shift',
      DAILY:       'Today\'s briefing',
      WEEKLY:      'Weekly summary'
    };
    var es = {
      DRIFT:       'Cambio de precio',
      OVERCHARGE:  'Sobrecargo de contrato',
      RELIABILITY: 'Fiabilidad del proveedor',
      MARGIN:      'Margen del platillo',
      DAILY:       'Resumen de hoy',
      WEEKLY:      'Resumen semanal'
    };
    return (locale === 'es' ? es : en)[category] || (locale === 'es' ? 'Aviso' : 'Heads-up');
  }

  var api = {
    build:  build,
    title:  title,
    TEMPLATES: TEMPLATES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_NOTIFY_TEMPLATES = api;
})(typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : null));
