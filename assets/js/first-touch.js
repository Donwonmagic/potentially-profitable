/**
 * Phase G.9 (Growth) — first-touch attribution + AI-search referrer
 * detection + bounded-cardinality returning-visitor signal.
 *
 * Runs once per page on every Muntin page (loaded by site.js or
 * inlined in <head> on critical pages). Stores three things in
 * localStorage:
 *
 *   muntin_first       JSON: { firstSource, firstLandingPath,
 *                              firstTimestamp, utm: {…} }
 *                      Set ONCE on the very first visit. Never overwritten.
 *
 *   muntin_session     JSON: { sessionId, lastSeenAt, exposures: {} }
 *                      Rotates every 30 min of inactivity. Used to
 *                      dedupe "Returning Visitor" + "AI Search Landing"
 *                      events to once-per-session.
 *
 * Cardinality is bounded by enums:
 *   firstSource     ∈ {organic, direct, social, email, referral, ai-search}
 *   AI engine       ∈ {chatgpt, perplexity, copilot, gemini, claude,
 *                       you, phind, kagi}
 *   landingKind     ∈ {article, tool, glossary, home, other}
 *   daysSinceFirst  ∈ {0, 1-3, 4-7, 8-30, 31-90, 91-365, 365+}
 *
 *   muntin.firstTouch()      → returns the cached first-touch record
 *   muntin.aiSearchEngine()  → returns the AI-search engine name or null
 *
 * No network requests; everything reads document.referrer + URL params.
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  var STORAGE_FIRST   = 'muntin_first';
  var STORAGE_SESSION = 'muntin_session';
  var SESSION_MS      = 30 * 60 * 1000;

  var AI_ENGINES = [
    { engine: 'chatgpt',    re: /(?:^|\.)(?:chatgpt|chat\.openai)\.com$/i },
    { engine: 'perplexity', re: /(?:^|\.)perplexity\.ai$/i },
    { engine: 'copilot',    re: /(?:^|\.)(?:copilot\.microsoft|bing)\.com$/i },
    { engine: 'gemini',     re: /(?:^|\.)gemini\.google\.com$/i },
    { engine: 'claude',     re: /(?:^|\.)claude\.ai$/i },
    { engine: 'you',        re: /(?:^|\.)you\.com$/i },
    { engine: 'phind',      re: /(?:^|\.)phind\.com$/i },
    { engine: 'kagi',       re: /(?:^|\.)kagi\.com$/i },
  ];

  var ORGANIC_HOSTS = /(google|bing|duckduckgo|yandex|baidu|yahoo|ecosia|brave)\./i;
  var SOCIAL_HOSTS  = /(twitter|x\.com|facebook|fb\.com|instagram|linkedin|reddit|youtube|tiktok|pinterest|threads)\./i;
  var EMAIL_HOSTS   = /(mail\.google|outlook\.live|outlook\.office|mail\.yahoo|protonmail)\./i;

  function safeRead(key) {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; }
  }
  function safeWrite(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) { /* quota / private mode */ }
  }

  function detectAiEngine(referrerHost) {
    for (var i = 0; i < AI_ENGINES.length; i++) {
      if (AI_ENGINES[i].re.test(referrerHost)) return AI_ENGINES[i].engine;
    }
    return null;
  }

  function detectFirstSource(refHost, params) {
    if (params.utm_source) {
      var src = String(params.utm_source).toLowerCase();
      if (src === 'newsletter' || src === 'lifecycle') return 'email';
      if (src === 'rss' || src === 'feed')             return 'referral';
    }
    if (!refHost) return 'direct';
    if (detectAiEngine(refHost))   return 'ai-search';
    if (ORGANIC_HOSTS.test(refHost)) return 'organic';
    if (SOCIAL_HOSTS.test(refHost))  return 'social';
    if (EMAIL_HOSTS.test(refHost))   return 'email';
    return 'referral';
  }

  function detectLandingKind(path) {
    if (/^\/(?:es\/)?blog\//.test(path))     return 'article';
    if (/^\/(?:es\/)?tools\//.test(path))    return 'tool';
    if (/^\/(?:es\/)?glossary\//.test(path)) return 'glossary';
    if (path === '/' || path === '/es/')     return 'home';
    return 'other';
  }

  function bucketDays(days) {
    if (days < 1)   return '0';
    if (days <= 3)  return '1-3';
    if (days <= 7)  return '4-7';
    if (days <= 30) return '8-30';
    if (days <= 90) return '31-90';
    if (days <= 365) return '91-365';
    return '365+';
  }

  function readUrlParams() {
    var p = {};
    try {
      var sp = new URLSearchParams(window.location.search);
      ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function (k) {
        var v = sp.get(k);
        if (v) p[k] = v.slice(0, 60);
      });
    } catch (_) { /* IE fallback unused */ }
    return p;
  }

  function refHost() {
    try {
      if (!document.referrer) return '';
      return new URL(document.referrer).host;
    } catch (_) { return ''; }
  }

  // Establish or update first-touch record.
  var first = safeRead(STORAGE_FIRST);
  if (!first || !first.firstSource) {
    var rh = refHost();
    var params = readUrlParams();
    first = {
      firstSource: detectFirstSource(rh, params),
      firstLandingPath: location.pathname,
      firstTimestamp: Date.now(),
      utm: params,
    };
    safeWrite(STORAGE_FIRST, first);
  }

  // Session record (30-min inactivity rotation).
  var sess = safeRead(STORAGE_SESSION);
  var nowMs = Date.now();
  if (!sess || (nowMs - (sess.lastSeenAt || 0)) > SESSION_MS) {
    sess = { sessionId: String(nowMs) + '-' + Math.random().toString(36).slice(2, 8), lastSeenAt: nowMs, exposures: {} };
  } else {
    sess.lastSeenAt = nowMs;
  }
  safeWrite(STORAGE_SESSION, sess);

  function fireOnce(eventName, propsBuilder) {
    if (sess.exposures[eventName]) return;
    sess.exposures[eventName] = 1;
    safeWrite(STORAGE_SESSION, sess);
    if (typeof window.plausible === 'function') {
      try { window.plausible(eventName, { props: propsBuilder() }); } catch (_) {}
    }
  }

  // Returning Visitor — fires once per session for any visit ≥1d after first.
  var daysSinceFirst = Math.floor((nowMs - first.firstTimestamp) / 86400000);
  if (daysSinceFirst >= 1) {
    fireOnce('Returning Visitor', function () {
      return {
        firstSource:    first.firstSource,
        daysSinceFirst: bucketDays(daysSinceFirst),
      };
    });
  }

  // AI Search Landing — fires once per session if the current referrer
  // is an AI engine, regardless of first-touch.
  var rhNow = refHost();
  var aiEngine = detectAiEngine(rhNow);
  if (aiEngine) {
    fireOnce('AI Search Landing', function () {
      return { engine: aiEngine, landingKind: detectLandingKind(location.pathname) };
    });
  }

  // Phase G.12 — Experiment Exposure. When the worker stamps
  // data-experiment + data-treatment on <html> via the A/B
  // HTMLRewriter, fire the exposure event once per session per
  // experiment. Bounded cardinality: experiment-name × treatment.
  try {
    var html = document.documentElement;
    var expName = html && html.getAttribute('data-experiment');
    var treatment = html && html.getAttribute('data-treatment');
    if (expName && treatment) {
      var exposureKey = 'exp:' + expName + ':' + treatment;
      if (!sess.exposures[exposureKey]) {
        sess.exposures[exposureKey] = 1;
        safeWrite(STORAGE_SESSION, sess);
        if (typeof window.plausible === 'function') {
          try { window.plausible('Experiment Exposure', { props: { experiment: expName, treatment: treatment } }); } catch (_) {}
        }
      }
    }
  } catch (_) { /* DOM access failure on edge cases */ }

  window.muntin = window.muntin || {};
  window.muntin.firstTouch = function () { return safeRead(STORAGE_FIRST); };
  window.muntin.aiSearchEngine = function () { return detectAiEngine(refHost()); };
  window.muntin.session = function () { return safeRead(STORAGE_SESSION); };
})();

// Phase G.10 (Growth) — newsletter footer form submit. Async fetch
// instead of full-page submit so the success state stays inline.
// On send, the form swaps `data-state="ok"` and the CSS replaces the
// pitch with the "got it. Check your inbox." postscript.
(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  function init() {
    var forms = document.querySelectorAll('.foot-newsletter-form');
    Array.prototype.forEach.call(forms, function (form) {
      // Stamp ts so the silent-200 server gate accepts the submit.
      var tsField = form.querySelector('input[name="ts"]');
      if (tsField) tsField.value = String(Date.now());
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var fd = new FormData(form);
        // URL-encode for the form-body parser on the worker side.
        var params = new URLSearchParams();
        fd.forEach(function (v, k) { params.append(k, v); });
        fetch(form.action, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
          credentials: 'same-origin',
        }).then(function () {
          form.dataset.state = 'ok';
          if (typeof window.plausible === 'function') {
            try { window.plausible('Newsletter Signup', { props: { surface: form.dataset.locale === 'es' ? 'footer-es' : 'footer-en' } }); } catch (_) {}
          }
        }).catch(function () { /* silent — error UI not needed for fire-and-forget */ });
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
