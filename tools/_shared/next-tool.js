/**
 * Phase 4 — next-tool recommender.
 *
 * Reads the owner-curated rules in tools/_shared/next-tool-map.json and
 * picks the best "what to do next" card to render at the bottom of a
 * tool's result. Rules are matched in declaration order; first hit
 * wins. If nothing matches, render() returns null and the calling
 * tool shows no card.
 *
 * The map is loaded asynchronously the first time render() is called
 * (or via preload()). After load it's cached. Tools that want
 * synchronous behaviour should call preload() during init.
 *
 * Tool URL resolution: every rule's `to` is a tool slug. The helper
 * resolves to the locale-appropriate URL using the same convention
 * the rest of the suite uses (/tools/<slug>/ for EN, /es/tools/<slug>/
 * for ES). Special-case 'audits/restaurant' which is a nested path.
 *
 * Usage at the end of a tool's render:
 *
 *   MuntinNextTool.render({
 *     mount: document.getElementById('myResult'),
 *     from: 'plate-cost',
 *     signals: { dishSaved: true, needsMenuMix: true },
 *     locale: document.documentElement.lang === 'es' ? 'es' : 'en'
 *   });
 *
 * Pure DOM construction; safe-html shim is used implicitly via
 * textContent. No dependencies beyond fetch.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof self !== 'undefined') {
    self.MuntinNextTool = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAP_URL = '/tools/_shared/next-tool-map.json';
  var cache = null;
  var inflight = null;

  function fetchMap() {
    if (cache) return Promise.resolve(cache);
    if (inflight) return inflight;
    inflight = fetch(MAP_URL, { credentials: 'omit' }) // h8-exempt: internal static JSON (owner-curated next-tool map), no user data sent
      .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)); })
      .then(function (json) { cache = json; inflight = null; return json; })
      .catch(function (e) { inflight = null; throw e; });
    return inflight;
  }

  function preload() { return fetchMap().catch(function(){}); }

  // Match a rule's `match` clause against the signals object.
  // Supported value forms:
  //   - boolean: signal must equal that boolean
  //   - 'any': signal must be truthy (any value)
  //   - 'low': numeric signal must be < 60 (audits/scores convention)
  //   - string: exact match against String(signal)
  function matches(matchClause, signals) {
    if (!matchClause || typeof matchClause !== 'object') return true;
    if (!signals || typeof signals !== 'object') return false;
    var keys = Object.keys(matchClause);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var expected = matchClause[k];
      var actual = signals[k];
      if (expected === 'any') {
        if (!actual) return false;
      } else if (expected === 'low') {
        if (typeof actual !== 'number' || actual >= 60) return false;
      } else if (typeof expected === 'boolean') {
        if (Boolean(actual) !== expected) return false;
      } else {
        if (String(actual) !== String(expected)) return false;
      }
    }
    return true;
  }

  function resolveUrl(slug, locale) {
    if (!slug) return null;
    var prefix = locale === 'es' ? '/es/tools/' : '/tools/';
    // audits/restaurant is the only nested slug today; keep it literal.
    return prefix + slug + '/';
  }

  // pick({ from, signals, rules }) -> matched rule or null
  function pick(spec, rules) {
    if (!Array.isArray(rules)) return null;
    var from = spec && spec.from;
    if (!from) return null;
    var signals = (spec && spec.signals) || {};
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (!r || r.from !== from) continue;
      if (matches(r.match, signals)) return r;
    }
    return null;
  }

  // Build the result card as a detached DOM node so callers can
  // append wherever they want. Two states: a real recommendation
  // (rendered) or null (render() returns silently).
  function buildCard(rule, locale) {
    var nav = document.createElement('nav');
    nav.className = 'mtn-next-tool';
    nav.setAttribute('aria-label',
      locale === 'es' ? 'Próxima herramienta sugerida' : 'Recommended next tool');

    var eyebrow = document.createElement('p');
    eyebrow.className = 'mtn-next-tool__eyebrow';
    eyebrow.textContent = locale === 'es' ? 'Lo que sigue' : 'What\'s next';
    nav.appendChild(eyebrow);

    var body = document.createElement('p');
    body.className = 'mtn-next-tool__body';
    body.textContent = locale === 'es' ? (rule.label_es || rule.label_en) : rule.label_en;
    nav.appendChild(body);

    var url = resolveUrl(rule.to, locale);
    if (url) {
      var a = document.createElement('a');
      a.className = 'mtn-next-tool__link';
      a.href = url;
      a.textContent = (locale === 'es' ? 'Abrir herramienta sugerida' : 'Open recommended tool') + ' →';
      nav.appendChild(a);
    }
    return nav;
  }

  function render(spec) {
    if (!spec || !spec.mount || !spec.from) return Promise.resolve(null);
    var locale = spec.locale === 'es' ? 'es' : 'en';
    return fetchMap().then(function (map) {
      var rule = pick(spec, (map && map.rules) || []);
      if (!rule) return null;
      var card = buildCard(rule, locale);
      // Replace any prior recommendation so re-renders don't stack.
      var existing = spec.mount.querySelector('.mtn-next-tool');
      if (existing && existing.parentNode === spec.mount) {
        spec.mount.removeChild(existing);
      }
      spec.mount.appendChild(card);
      return rule;
    }).catch(function () { return null; });
  }

  return {
    preload: preload,
    pick: pick, // exposed for tests
    render: render,
    _matches: matches // exposed for tests
  };
}));
