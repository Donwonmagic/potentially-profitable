// Phase 2 (Workshop) — shared Save-to-Workbench helper.
//
// Each free tool that wants Save-to-Workbench follows the same
// recipe: cache /api/auth/me on load, expose a Save button that
// POSTs to /api/workbench/save, fall back to a "Sign in to save"
// link for anonymous visitors, handle 401 + 409 + network errors,
// then rehydrate from ?saved=<id> on page load.
//
// The first five tools (SEO grader, speed test, mobile check,
// schema check, GBP grader) ship with this logic inlined per-file.
// This module extracts the pattern so future tools — and the
// remaining 9 calculator-only tools (margin-math, plate-cost,
// photo-brief, brand-suite, menu-engineering, menu-copy,
// open-hours, search-ideas, tech-stack) — can add Save with ~10
// lines of glue instead of ~80.
//
// Usage from a tool:
//
//   <script src="/assets/workbench-save.js?v=..."></script>
//   ... tool's own IIFE renders results into #pcResult ...
//   const wb = MuntinWorkbench.attach({
//     elements: {
//       box:  '#pcSave',
//       btn:  '#pcSaveBtn',
//       link: '#pcSaveLink',
//       text: '#pcSaveText',
//       msg:  '#pcSaveMsg',
//     },
//     locale: 'en',                  // 'en' | 'es'
//     kind:   'plate',               // closed enum from src/lib/workbench.js
//     titleFor: function (p) { return 'Plate cost — ' + (p.dishName || 'untitled'); },
//     onRehydrate: function (payload) { renderResult(payload); },
//     workbenchUrl: '/workbench/',
//     signinUrl:    '/sign-in/?returnTo=%2Ftools%2Fplate-cost%2F',
//   });
//
//   // After every render of a fresh result:
//   wb.showAffordance(payload);
//
// The helper handles auth-state caching, button/link toggling,
// the POST /api/workbench/save call, locale-aware error copy,
// and ?saved=<id> rehydration on page load. Tools only own the
// kind, the title, and what to do with a rehydrated payload.

(function (global) {
  'use strict';

  // Locale-aware copy. Adding a third locale: append the same
  // keys here and pass `locale` from the calling tool.
  var COPY = {
    en: {
      idleSignedIn:   'Save this result to the Workshop so it follows you across devices.',
      idleAnonymous:  'Sign in to save this result so it follows you across devices.',
      saveLabel:      'Save to the Workshop',
      signinLabel:    'Sign in to save',
      savedSuccess:   '✓ Saved to the Workshop.',
      sessionExpired: 'Your session expired. Sign in to save this result.',
      limitReached:   'You’ve reached the saved-items limit. Delete some in the Workshop first.',
      genericError:   'Could not save. Try again in a moment.',
      networkError:   'Could not reach the server. Try again in a moment.',
      postSavePtr:    'Your saved items live in the Workshop. Open it to manage them.',
      rehydrateNote:  'Loaded from the Workshop. Run a fresh result above to update it.',
    },
    es: {
      idleSignedIn:   'Guarda este resultado en tu Taller para que te siga entre dispositivos.',
      idleAnonymous:  'Accede para guardar este resultado y que te siga entre dispositivos.',
      saveLabel:      'Guardar en mi Taller',
      signinLabel:    'Acceder para guardar',
      savedSuccess:   '✓ Guardado en tu Taller.',
      sessionExpired: 'Tu sesión venció. Accede para guardar este resultado.',
      limitReached:   'Llegaste al límite de items guardados. Elimina algunos en el Taller primero.',
      genericError:   'No se pudo guardar. Inténtalo de nuevo en un momento.',
      networkError:   'No pudimos conectar con el servidor. Intenta de nuevo en un momento.',
      postSavePtr:    'Tus items guardados viven en /es/workbench/. Abre El Taller para gestionarlos.',
      rehydrateNote:  'Cargado desde tu Taller. Vuelve a calcular arriba para actualizarlo.',
    }
  };

  function $(sel) { return document.querySelector(sel); }

  function attach(opts) {
    if (!opts || !opts.elements) return null;
    var box  = typeof opts.elements.box  === 'string' ? $(opts.elements.box)  : opts.elements.box;
    var btn  = typeof opts.elements.btn  === 'string' ? $(opts.elements.btn)  : opts.elements.btn;
    var link = typeof opts.elements.link === 'string' ? $(opts.elements.link) : opts.elements.link;
    var text = typeof opts.elements.text === 'string' ? $(opts.elements.text) : opts.elements.text;
    var msg  = typeof opts.elements.msg  === 'string' ? $(opts.elements.msg)  : opts.elements.msg;

    var locale = (opts.locale === 'es') ? 'es' : 'en';
    var copy   = COPY[locale];
    var kind   = String(opts.kind || '').trim();
    var titleFor     = typeof opts.titleFor === 'function' ? opts.titleFor : function () { return kind; };
    var onSaved      = typeof opts.onSaved === 'function' ? opts.onSaved : function () {};
    var onRehydrate  = typeof opts.onRehydrate === 'function' ? opts.onRehydrate : null;
    var workbenchUrl = opts.workbenchUrl || (locale === 'es' ? '/es/workbench/' : '/workbench/');
    var signinUrl    = opts.signinUrl    || (locale === 'es' ? '/es/sign-in/?returnTo=' + encodeURIComponent(workbenchUrl) : '/sign-in/?returnTo=' + encodeURIComponent(workbenchUrl));

    if (!kind) {
      console.warn('[workbench-save] kind is required');
      return null;
    }

    var authState = { checked: false, signedIn: false };
    var lastSavePayload = null;

    // Cache /api/auth/me once on init so the affordance reveal
    // doesn't pay the round-trip on every render.
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(function (r) { authState = { checked: true, signedIn: r.status === 200 }; })
      .catch(function ()  { authState = { checked: true, signedIn: false }; });

    // Phase 3B (mobile UX) — magic-link round-trip survival.
    //
    // Anonymous flow today: user fills form → clicks "Sign in to save"
    // → /sign-in/ → magic-link email → opens link in Mail.app → Safari
    // opens a new tab back at the tool URL → form is empty because the
    // navigation discarded all in-memory state.
    //
    // Fix: on sign-in-link click, snapshot lastSavePayload to
    // localStorage keyed by tool kind + path. On every tool page load,
    // check for a recent (≤ 1 hour) prefill and rehydrate via
    // onRehydrate(). One-shot: the key is deleted on consume so a
    // refresh doesn't re-fire.
    var PREFILL_KEY  = 'mw.prefill.' + kind;
    var PREFILL_TTL  = 60 * 60 * 1000; // one hour
    function snapshotPrefill() {
      if (!lastSavePayload) return;
      try {
        localStorage.setItem(PREFILL_KEY, JSON.stringify({
          ts:      Date.now(),
          path:    window.location.pathname,
          payload: lastSavePayload,
        }));
      } catch (_) { /* quota / private mode */ }
    }
    function consumePrefill() {
      if (!onRehydrate) return;
      var raw;
      try { raw = localStorage.getItem(PREFILL_KEY); } catch (_) { return; }
      if (!raw) return;
      try { localStorage.removeItem(PREFILL_KEY); } catch (_) {}
      var snap;
      try { snap = JSON.parse(raw); } catch (_) { return; }
      if (!snap || typeof snap !== 'object') return;
      if (typeof snap.ts !== 'number' || (Date.now() - snap.ts) > PREFILL_TTL) return;
      // Path scoping: only rehydrate if we're on the same tool URL we
      // left from. Different tools share the same kind under the
      // namespace (e.g. two URL-fetch graders), and a prefill from
      // tool A shouldn't fire on tool B.
      if (snap.path && snap.path !== window.location.pathname) return;
      try { onRehydrate(snap.payload); } catch (err) {
        console.warn('[workbench-save] onRehydrate (prefill) threw', err);
      }
    }

    function setMsg(textVal, isError) {
      if (!msg) return;
      if (!textVal) { msg.hidden = true; msg.textContent = ''; msg.classList.remove('error'); return; }
      msg.textContent = textVal;
      if (isError) msg.classList.add('error'); else msg.classList.remove('error');
      msg.hidden = false;
    }

    function showAffordance(payload) {
      lastSavePayload = payload || null;
      if (!box) return;
      setMsg('', false);
      box.hidden = false;
      if (authState.signedIn) {
        if (btn)  btn.hidden  = false;
        if (link) link.hidden = true;
        if (text) text.textContent = copy.idleSignedIn;
      } else {
        if (btn)  btn.hidden  = true;
        if (link) link.hidden = false;
        if (text) text.textContent = copy.idleAnonymous;
      }
    }

    function markSaved() {
      if (btn)  btn.hidden = true;
      if (link) link.hidden = true;
      if (text) text.textContent = copy.postSavePtr;
      setMsg(copy.savedSuccess, false);
      // Phase 3 (Workshop) — adoption analytics. Bucketed kind + locale,
      // no PII. Fires once per successful save across every helper-using
      // tool, so adoption per kind is observable without per-tool wiring.
      try {
        if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
          window.plausible('Workbench Save', { props: { kind: kind, locale: locale } });
        }
      } catch (_) { /* analytics is best-effort */ }
    }

    function markRehydrated() {
      if (!box) return;
      box.hidden = false;
      if (btn)  btn.hidden = true;
      if (link) link.hidden = true;
      if (text) text.textContent = copy.rehydrateNote;
      setMsg('', false);
      try {
        if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
          window.plausible('Workbench Open Saved', { props: { kind: kind, locale: locale } });
        }
      } catch (_) { /* analytics is best-effort */ }
    }

    function attemptSave() {
      if (!lastSavePayload) return;
      if (btn) btn.disabled = true;
      var body = {
        kind: kind,
        title: titleFor(lastSavePayload),
        payload: lastSavePayload,
      };
      fetch('/api/workbench/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      }).then(function (r) {
        if (r.ok) {
          return r.json().catch(function () { return {}; }).then(function (data) {
            markSaved();
            try { onSaved(data && data.id ? data.id : null); } catch (_) {}
          });
        }
        if (r.status === 401) {
          // Bug B2.1 — fully re-render the affordance via
          // showAffordance() so that subsequent renders (the user
          // re-runs the tool) see the now-anonymous state instead
          // of the stale signedIn=true cached at attach time. After
          // showAffordance restores the idle layout, set the
          // session-expired cue via setMsg so the user sees what
          // happened — text on the affordance reverted to the
          // generic "Sign in to save" line.
          authState.signedIn = false;
          if (btn) btn.disabled = false;
          showAffordance(lastSavePayload);
          setMsg(copy.sessionExpired, true);
          return;
        }
        return r.json().catch(function () { return {}; }).then(function (data) {
          var line = (data && data.error === 'limit-reached') ? copy.limitReached : copy.genericError;
          setMsg(line, true);
          if (btn) btn.disabled = false;
        });
      }).catch(function () {
        setMsg(copy.networkError, true);
        if (btn) btn.disabled = false;
      });
    }

    if (btn) btn.addEventListener('click', attemptSave);

    // Phase 3B (mobile UX) — snapshot lastSavePayload to localStorage
    // when the anonymous user clicks the sign-in link, so the magic-
    // link round-trip can rehydrate the form on return. Deliberately
    // a regular click handler (not a form-action interceptor) so we
    // never block navigation; if snapshot fails (quota / private
    // mode) the user just lands on /sign-in/ as today.
    if (link) link.addEventListener('click', snapshotPrefill);

    // Phase 3B — on init, see if a recent magic-link round-trip left
    // a prefill in localStorage. Fires before the ?saved= rehydrate
    // path so a /tools/X/?saved=Y URL still wins (server-side payload
    // beats client-side form snapshot).
    consumePrefill();

    // Rehydrate from ?saved=<id> if present.
    if (onRehydrate) {
      try {
        var sp = new URLSearchParams(window.location.search || '');
        var savedId = sp.get('saved');
        if (savedId) {
          fetch('/api/workbench/get?id=' + encodeURIComponent(savedId), {
            credentials: 'same-origin',
          }).then(function (r) {
            if (r.status === 401) {
              window.location.href = signinUrl;
              throw new Error('redirect');
            }
            if (!r.ok) throw new Error('not-found');
            return r.json();
          }).then(function (data) {
            if (!data || !data.ok || !data.item) return;
            var p = data.item.payload || {};
            try { onRehydrate(p); } catch (err) {
              console.warn('[workbench-save] onRehydrate threw', err);
              return;
            }
            lastSavePayload = p;
            markRehydrated();
            // Phase D — strip BOTH ?saved= and ?intent= / ?from= on
            // rehydrate so a refresh doesn't re-trigger or re-fire
            // analytics. handleIntent below also strips on its
            // standalone path.
            try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
          }).catch(function (err) {
            if (err && err.message === 'redirect') return;
            // Quiet fall-through — leave the form alone.
          });
        }
      } catch (_) { /* old browser */ }
    }

    // Phase D — auto-honor intent= URL params via the shared
    // readIntent() helper exposed on the global namespace. Tools
    // that use attach() get this call for free; tools that ship
    // their own inline save flow can call MuntinWorkbench.readIntent
    // with their own element refs.
    readIntent({ box: box, text: text, kind: kind, locale: locale });

    return {
      showAffordance: showAffordance,
      markSaved: markSaved,
      isSignedIn: function () { return authState.signedIn; },
    };
  }

  // Phase D (intent= URL convention) — public helper that any
  // tool can call to honor an intent= URL param after its result
  // is rendered. Closed enum: watch | save | share | compare.
  // Unknown values silently ignored (forward-compat).
  //
  // The "watch panel" is whatever box element the tool exposes —
  // typically the same `box` it gates on signed-in. Making box
  // visible signposts the Save → Watch path (Watch attaches to a
  // save in the Workshop list).
  //
  //   MuntinWorkbench.readIntent({
  //     box:    document.getElementById('seoSave'),
  //     text:   document.getElementById('seoSaveText'),  // optional
  //     kind:   'seo',
  //     locale: 'en',
  //   });
  //
  // Strips ?intent= and ?from= from the URL via history.replaceState
  // after consumption so refreshes don't re-trigger and analytics
  // dedupe.
  function readIntent(opts) {
    opts = opts || {};
    var box    = (typeof opts.box  === 'string') ? document.querySelector(opts.box)  : opts.box;
    var text   = (typeof opts.text === 'string') ? document.querySelector(opts.text) : opts.text;
    var kind   = opts.kind   || 'unknown';
    var locale = opts.locale || (document.documentElement.lang === 'es' ? 'es' : 'en');
    var intent, from;
    try {
      var sp = new URLSearchParams(window.location.search || '');
      intent = sp.get('intent');
      from   = sp.get('from');
    } catch (_) { return; }
    if (!intent) return;
    var INTENTS = ['watch', 'save', 'share', 'compare'];
    if (INTENTS.indexOf(intent) === -1) return;
    try {
      var preserve = new URLSearchParams(window.location.search || '');
      preserve.delete('intent');
      preserve.delete('from');
      var qs = preserve.toString();
      history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
    } catch (_) { /* ignore */ }
    setTimeout(function () {
      if (intent === 'watch') {
        if (!box) return;
        box.hidden = false;
        var WATCHABLE = { audit:1, seo:1, gbp:1, mobile:1, schema:1, speed:1, 'storefront-health':1 };
        if (!WATCHABLE[kind] && text) {
          text.textContent = locale === 'es'
            ? 'Esta herramienta no se puede vigilar en una agenda. Guárdala en su lugar.'
            : "This tool can't be watched on a schedule. Save instead.";
        }
        try { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {}
        try {
          if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
            window.plausible('Workbench Watch Open', { props: { kind: kind, locale: locale, from: from || 'unknown' } });
          }
        } catch (_) { /* analytics best-effort */ }
      }
      // Other intents (save/share/compare) are reserved; tools may
      // opt in by reading window.location.search themselves.
    }, 0);
  }

  global.MuntinWorkbench = {
    attach: attach,
    readIntent: readIntent,
    // Expose for tests / future locales.
    _COPY: COPY,
  };
})(typeof window !== 'undefined' ? window : globalThis);
