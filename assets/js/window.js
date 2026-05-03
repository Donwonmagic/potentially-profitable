// Phase W.3 (The Window) — visitor-side script.
//
// Drives /window/ (and /es/window/). Detects auth, fetches the
// thread, renders messages with the editorial muntin layout,
// polls /api/window/poll for new messages, and submits new
// messages to /api/window/append. Falls back to "On a brief
// pause" copy when the API returns 404 (flag off).
//
// No external dependencies; ~6KB minified.

(function () {
  'use strict';

  var locale = (document.body.getAttribute('data-locale') === 'es') ? 'es' : 'en';

  var COPY = {
    en: {
      youStamp: 'you',
      donStamp: 'Don',
      sending: 'Sending…',
      sent: 'Sent it. Don has the note.',
      error: "Couldn't send right now. Try again in a moment.",
      errorBodyTooLong: 'A bit long — keep it under 4,000 characters.',
      errorBodyEmpty: 'Write something first.',
      errorRateLimited: 'Slow down a moment — wait 60 seconds and try again.',
      errorDayCap: "You've reached the daily limit. Try again tomorrow.",
      errorAuth: 'Sign in to send your note.',
      errorPaused: 'The Window is on a brief pause.',
      readReceipt: function (rel) { return 'Don opened this · ' + rel; },
      donActive: 'Don is around · last seen ',
      counterFmt: function (n) { return n + ' / 4000'; },
      submitLabel: 'Send it over',
    },
    es: {
      youStamp: 'tú',
      donStamp: 'Don',
      sending: 'Enviando…',
      sent: 'Enviado. Don lo tiene.',
      error: 'No se pudo enviar ahora. Intenta de nuevo en un momento.',
      errorBodyTooLong: 'Un poco largo — mantenlo en menos de 4,000 caracteres.',
      errorBodyEmpty: 'Escribe algo primero.',
      errorRateLimited: 'Un momento — espera 60 segundos e inténtalo de nuevo.',
      errorDayCap: 'Llegaste al límite diario. Inténtalo mañana.',
      errorAuth: 'Inicia sesión para enviar tu nota.',
      errorPaused: 'La Ventana está en pausa breve.',
      readReceipt: function (rel) { return 'Don lo leyó · ' + rel; },
      donActive: 'Don está cerca · visto ',
      counterFmt: function (n) { return n + ' / 4000'; },
      submitLabel: 'Enviar a Don',
    },
  };
  var copy = COPY[locale];

  var els = {
    paused:     document.getElementById('windowPaused'),
    hero:       document.getElementById('windowHero'),
    pulse:      document.getElementById('windowPulse'),
    thread:     document.getElementById('windowThread'),
    threadEmpty: document.getElementById('windowThreadEmpty'),
    composer:   document.getElementById('windowComposer'),
    form:       document.getElementById('windowForm'),
    body:       document.getElementById('windowBody'),
    counter:    document.getElementById('windowCounter'),
    submit:     document.getElementById('windowSubmit'),
    msg:        document.getElementById('windowMsg'),
    onramps:    document.getElementById('windowOnramps'),
    signin:     document.getElementById('windowSignin'),
    // Phase-2 redesign — optional context inputs above the textarea.
    // Prepended into the body on submit so the worker's payload
    // schema is unchanged. Persisted in localStorage so a returning
    // operator doesn't retype.
    name:       document.getElementById('windowName'),
    restaurant: document.getElementById('windowRestaurant'),
    site:       document.getElementById('windowSite'),
  };

  var CONTEXT_STORAGE_KEY = 'md_window_context_v1';

  function loadContextFromStorage() {
    try {
      var raw = localStorage.getItem(CONTEXT_STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (els.name && saved.name) els.name.value = saved.name;
      if (els.restaurant && saved.restaurant) els.restaurant.value = saved.restaurant;
      if (els.site && saved.site) els.site.value = saved.site;
    } catch (_) { /* localStorage may be unavailable; ignore */ }
  }

  function persistContextToStorage() {
    try {
      var snap = {
        name:       els.name ? els.name.value.trim() : '',
        restaurant: els.restaurant ? els.restaurant.value.trim() : '',
        site:       els.site ? els.site.value.trim() : '',
      };
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(snap));
    } catch (_) { /* ignore */ }
  }

  function buildBodyWithContext(rawBody) {
    // Prepend the optional context fields as a single header block
    // above the message. Skipped fields produce no line. Trailing
    // blank line + horizontal rule separate the context from the
    // message body so Don's inbox view is scannable.
    var pieces = [];
    if (els.name && els.name.value.trim()) {
      pieces.push('From: ' + els.name.value.trim());
    }
    if (els.restaurant && els.restaurant.value.trim()) {
      pieces.push('Restaurant: ' + els.restaurant.value.trim());
    }
    if (els.site && els.site.value.trim()) {
      pieces.push('Current site: ' + els.site.value.trim());
    }
    if (!pieces.length) return rawBody;
    return pieces.join('\n') + '\n---\n' + rawBody;
  }

  var state = {
    authed: false,
    threadId: null,
    lastMsgIds: new Set(),
    lastUpdatedAt: 0,
    pollTimer: null,
    activeTimer: null,
    paused: false,
  };

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function fmtTime(ts) {
    try {
      var d = new Date(ts);
      return d.toLocaleString(locale === 'es' ? 'es-US' : 'en-US', {
        weekday: 'short', hour: 'numeric', minute: '2-digit',
      });
    } catch (_) { return ''; }
  }

  function fmtRelative(ts) {
    var diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return locale === 'es' ? 'hace un momento' : 'just now';
    if (diffSec < 3600) return Math.floor(diffSec / 60) + (locale === 'es' ? ' min atrás' : 'm ago');
    if (diffSec < 86400) return Math.floor(diffSec / 3600) + (locale === 'es' ? 'h atrás' : 'h ago');
    return Math.floor(diffSec / 86400) + (locale === 'es' ? 'd atrás' : 'd ago');
  }

  function showPaused() {
    state.paused = true;
    if (els.paused) els.paused.hidden = false;
    if (els.hero) els.hero.hidden = true;
    if (els.composer) els.composer.hidden = true;
    if (els.thread) els.thread.hidden = true;
  }

  function showSignin() {
    if (els.signin) els.signin.hidden = false;
    if (els.composer) {
      els.body.disabled = false;
      els.submit.disabled = false;
    }
  }

  function showMsg(text, isError) {
    if (!els.msg) return;
    els.msg.textContent = text;
    els.msg.hidden = false;
    if (isError) els.msg.classList.add('error');
    else els.msg.classList.remove('error');
  }

  function hideMsg() {
    if (!els.msg) return;
    els.msg.hidden = true;
    els.msg.classList.remove('error');
  }

  function renderMessages(messages) {
    if (!els.thread) return;
    if (!messages.length) {
      els.threadEmpty.hidden = false;
      return;
    }
    els.threadEmpty.hidden = true;
    if (els.hero) els.hero.classList.add('window-hero--collapsed');

    // Append only new messages. Track ids we've already rendered.
    var freshAdded = false;
    var lastDayBucket = '';
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      if (state.lastMsgIds.has(m.id)) continue;
      state.lastMsgIds.add(m.id);

      // Day-break separator if calendar day changed.
      var d = new Date(m.createdAt);
      var dayKey = d.toDateString();
      if (dayKey !== lastDayBucket) {
        lastDayBucket = dayKey;
        var dayLabel = d.toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
        });
        var sep = document.createElement('div');
        sep.className = 'window-daybreak';
        sep.innerHTML = '<span class="window-daybreak__label">— ' + escHtml(dayLabel) + ' —</span>';
        els.thread.insertBefore(sep, els.threadEmpty);
      }

      var msgEl = document.createElement('div');
      msgEl.className = 'window-msg window-msg--' + (m.from === 'don' ? 'don' : 'you');
      msgEl.setAttribute('data-id', m.id);
      // The first paint should NOT animate (avoids a wave of reveals
      // on initial load). Subsequent fresh messages get data-fresh.
      if (state.firstRenderDone) {
        msgEl.setAttribute('data-fresh', 'true');
        freshAdded = true;
      }
      var stamp = (m.from === 'don' ? copy.donStamp : copy.youStamp) + ' · ' + fmtTime(m.createdAt);
      msgEl.innerHTML =
        '<p class="window-msg__stamp"><em>' + escHtml(stamp) + '</em></p>' +
        '<p class="window-msg__body">' + escHtml(m.body).replace(/\n/g, '<br>') + '</p>';
      els.thread.insertBefore(msgEl, els.threadEmpty);
    }
    state.firstRenderDone = true;

    // Auto-scroll to the bottom on fresh messages.
    if (freshAdded || messages.length === state.lastMsgIds.size) {
      els.thread.scrollTop = els.thread.scrollHeight;
    }
  }

  function loadThread() {
    return fetch('/api/window/thread', { credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 404) { showPaused(); throw new Error('paused'); }
        if (r.status === 401) { showSignin(); throw new Error('unauth'); }
        if (!r.ok) throw new Error('thread-failed');
        return r.json();
      })
      .then(function (j) {
        if (!j || !j.ok) return;
        if (j.thread) {
          state.threadId = j.thread.id;
          state.lastUpdatedAt = j.thread.updatedAt;
        }
        renderMessages(j.messages || []);
      });
  }

  function pollOnce() {
    if (state.paused) return;
    fetch('/api/window/poll', { credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 404) { showPaused(); return null; }
        if (r.status === 401) { showSignin(); return null; }
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (j) {
        if (!j || !j.ok || !j.hasThread) return;
        if (j.updatedAt && j.updatedAt > state.lastUpdatedAt) {
          state.lastUpdatedAt = j.updatedAt;
          loadThread().catch(function () { /* silent */ });
        }
      })
      .catch(function () { /* silent */ });
  }

  function pollActive() {
    if (state.paused) return;
    fetch('/api/window/active')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.lastSeen || !els.pulse) return;
        var hoursAgo = (Date.now() - j.lastSeen) / 3600000;
        if (hoursAgo < 4) {
          els.pulse.hidden = false;
          els.pulse.title = copy.donActive + fmtRelative(j.lastSeen);
        } else {
          els.pulse.hidden = true;
        }
      })
      .catch(function () { /* silent */ });
  }

  function startPolling() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(function () {
      if (document.hidden) return;
      pollOnce();
    }, 5000);
    if (state.activeTimer) clearInterval(state.activeTimer);
    state.activeTimer = setInterval(pollActive, 60000);
    pollActive();
  }

  function submit(ev) {
    ev.preventDefault();
    if (state.paused) { showMsg(copy.errorPaused, true); return; }
    var rawBody = els.body.value.trim();
    if (!rawBody) { showMsg(copy.errorBodyEmpty, true); return; }
    var bodyWithContext = buildBodyWithContext(rawBody);
    if (bodyWithContext.length > 4000) { showMsg(copy.errorBodyTooLong, true); return; }
    hideMsg();
    persistContextToStorage();
    els.submit.disabled = true;
    els.body.disabled = true;
    var origLabel = els.submit.textContent;
    els.submit.textContent = copy.sending;

    var params = new URLSearchParams();
    params.set('body', bodyWithContext);

    fetch('/api/window/append', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }).then(function (r) {
      return r.json().then(function (j) { return { status: r.status, body: j }; });
    }).then(function (res) {
      if (res.status === 200 && res.body.ok) {
        els.body.value = '';
        updateCounter();
        showMsg(copy.sent, false);
        // Re-fetch thread to render the new message.
        return loadThread();
      }
      // Map server error codes.
      var code = (res.body && res.body.error) || 'default';
      var text = copy.error;
      if (code === 'rate-limited') text = copy.errorRateLimited;
      else if (code === 'day-cap-reached') text = copy.errorDayCap;
      else if (code === 'body-too-long') text = copy.errorBodyTooLong;
      else if (code === 'body-too-short' || code === 'body-required') text = copy.errorBodyEmpty;
      else if (code === 'unauthenticated') { showSignin(); return; }
      else if (code === 'not-found') { showPaused(); return; }
      showMsg(text, true);
    }).catch(function () {
      showMsg(copy.error, true);
    }).finally(function () {
      els.submit.disabled = false;
      els.body.disabled = false;
      els.submit.textContent = origLabel || copy.submitLabel;
    });
  }

  function updateCounter() {
    if (!els.counter || !els.body) return;
    els.counter.textContent = copy.counterFmt(els.body.value.length);
  }

  function bindOnramps() {
    if (!els.onramps) return;
    els.onramps.querySelectorAll('.window-onramp').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prepend = btn.getAttribute('data-prepend') || '';
        if (els.body) {
          els.body.value = prepend + (els.body.value || '');
          els.body.focus();
          // Place cursor at end.
          var end = els.body.value.length;
          els.body.setSelectionRange(end, end);
          updateCounter();
        }
      });
    });
  }

  // Boot: check auth, then either load thread or show signin.
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (r) {
      if (r.status === 200) {
        state.authed = true;
        return loadThread();
      }
      // 401 / 404: visitor isn't signed in. Show signin CTA but
      // keep the composer interactive — submission flow handles
      // the redirect on first send.
      showSignin();
    })
    .catch(function () { /* network error: show signin */ showSignin(); })
    .finally(function () {
      startPolling();
    });

  if (els.form) els.form.addEventListener('submit', submit);
  if (els.body) els.body.addEventListener('input', updateCounter);
  bindOnramps();
  // Phase-2 redesign — boot the optional context fields.
  loadContextFromStorage();
})();
