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
      limitReached:   'Llegaste al límite de items guardados. Elimina algunos en /es/workbench/ primero.',
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
          authState.signedIn = false;
          if (btn)  btn.hidden  = true;
          if (link) link.hidden = false;
          if (text) text.textContent = copy.sessionExpired;
          if (btn)  btn.disabled = false;
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
            try { history.replaceState(null, '', window.location.pathname); } catch (_) {}
          }).catch(function (err) {
            if (err && err.message === 'redirect') return;
            // Quiet fall-through — leave the form alone.
          });
        }
      } catch (_) { /* old browser */ }
    }

    return {
      showAffordance: showAffordance,
      markSaved: markSaved,
      isSignedIn: function () { return authState.signedIn; },
    };
  }

  global.MuntinWorkbench = {
    attach: attach,
    // Expose for tests / future locales.
    _COPY: COPY,
  };
})(typeof window !== 'undefined' ? window : globalThis);
