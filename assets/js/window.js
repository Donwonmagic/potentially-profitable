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
      // Phase 1b — PII pre-write gate. Polite redirect to email
      // for credit cards / SSNs / passwords. Don's KV isn't PCI scope.
      errorPii: "I don't take card numbers, passwords, or SSNs through the Window — email me directly at don@muntin.digital or call.",
      // Phase 1a step 2.2 — stale anon cookie pointing at a thread
      // that's been migrated to identified storage. Operator should
      // sign in to recover continuity.
      errorClaimed: 'This conversation has moved to your account — sign in to keep going.',
      readReceipt: function (rel) { return 'Don opened this · ' + rel; },
      donActive: 'Don is around · last seen ',
      counterFmt: function (n) { return n + ' / 4000'; },
      submitLabel: 'Send it over',
      // Phase 8.2 — daily-cap half-success (note still filed, plan §8.2).
      sentDayCapped: "I've got a stack today. Your note is filed for tomorrow morning.",
      // Phase 8.1 — auto-pause states (plan §8.1).
      pauseSoft: "Don is on the floor this week — slower than usual. I'll get to your note within 2 business days, sometimes faster.",
      pauseHard: 'Don is buried — try again Monday, or email don@muntin.digital for emergencies.',
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
      errorPii: 'No acepto números de tarjeta, contraseñas, ni SSN por La Ventana — escríbeme directo a don@muntin.digital o llámame.',
      errorClaimed: 'Esta conversación se mudó a tu cuenta — inicia sesión para continuar.',
      readReceipt: function (rel) { return 'Don lo leyó · ' + rel; },
      donActive: 'Don está cerca · visto ',
      counterFmt: function (n) { return n + ' / 4000'; },
      submitLabel: 'Enviar a Don',
      // Phase 8.2 — daily-cap half-success (note still filed, plan §8.2).
      sentDayCapped: 'Tengo una pila hoy. Tu nota queda para mañana en la mañana.',
      // Phase 8.1 — auto-pause states (plan §8.1).
      pauseSoft: 'Don está en el piso esta semana — más lento de lo normal. Llegaré a tu nota en un par de días hábiles, a veces antes.',
      pauseHard: 'Don está hasta el cuello — intenta de nuevo el lunes, o escribe a don@muntin.digital para urgencias.',
    },
  };
  var copy = COPY[locale];

  var els = {
    paused:     document.getElementById('windowPaused'),
    hero:       document.getElementById('windowHero'), // legacy — Phase 2.1 removed; null is fine
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
    // Phase-2 redesign — optional context inputs (now inside <details>).
    // Prepended into the body on submit so the worker's payload
    // schema is unchanged. Persisted in localStorage so a returning
    // operator doesn't retype.
    name:       document.getElementById('windowName'),
    restaurant: document.getElementById('windowRestaurant'),
    site:       document.getElementById('windowSite'),
    contextDetails: document.getElementById('windowContextDetails'),
    // Phase 2.1 additions — pre-rendered, JS reveals/wires.
    crisis:     document.getElementById('windowCrisis'),
    mic:        document.getElementById('windowMic'),
    currents:   document.getElementById('windowCurrents'),
    sash:       document.getElementById('windowSash'),
  };

  var CONTEXT_STORAGE_KEY = 'md_window_context_v1';
  var CRISIS_DEBOUNCE_MS = 600;

  // Phase 2.2 — crisis-keyword detection (composer-side mirror of
  // server-side detectCrisisTier in src/lib/window.js). Tier 1 only:
  // the operator-facing referral line reveals BEFORE send so resources
  // land before the decision to send to Don. Tier 2 is server-only
  // (admin-internal flag).
  //
  // Keep this list narrow — false positives are acceptable (the line
  // is just a quiet referral; it doesn't block send) but the line
  // shouldn't fire on poetic figures of speech. Mirrors plan §3.12.
  var CRISIS_TIER1_KEYWORDS = [
    'kill myself', 'kill my self',
    'end my life', 'end it all',
    "can't keep going", 'cant keep going',
    "can't go on", 'cant go on',
    'hurt myself', 'harm myself',
    'suicide', 'suicidal',
    'suicidio', 'suicida',
    'quitarme la vida', 'quitar la vida',
    'acabar con todo', 'acabar conmigo',
    'no aguanto más', 'no aguanto mas',
  ];

  function detectClientCrisis(body) {
    if (typeof body !== 'string' || !body) return false;
    var lower = body.toLowerCase();
    for (var i = 0; i < CRISIS_TIER1_KEYWORDS.length; i++) {
      if (lower.indexOf(CRISIS_TIER1_KEYWORDS[i]) !== -1) return true;
    }
    return false;
  }

  // Phase 2.2 — chip-keyed artifact map for the success-state contextual
  // link. The chip the operator clicked tells us roughly what they're
  // here for; the success state hands them one specific reading while
  // they wait for Don's reply. Plan §3.7 + §9.1.
  var CHIP_ARTIFACTS = {
    en: {
      'not-sure': { url: '/learn/start-here/', label: "While you wait — here's where I'd start." },
      'not-ready': { url: '/glossary/audit/', label: "While you wait — what an audit actually does." },
      'new-site':  { url: '/studio/', label: 'While you wait — the room I work in.' },
      'audit':     { url: '/tools/storefront-health/', label: 'While you wait — run the free storefront check.' },
      'care':      { url: '/studio/care-plan-light/', label: 'While you wait — what Care Plan covers.' },
      'else':      { url: '/blog/', label: "While you wait — what I've been writing about." },
      _default:    { url: '/blog/', label: "While you wait — what I've been writing about." },
    },
    es: {
      'not-sure': { url: '/es/learn/start-here/', label: 'Mientras esperas — por dónde yo empezaría.' },
      'not-ready': { url: '/es/glossary/audit/', label: 'Mientras esperas — qué hace un diagnóstico.' },
      'new-site':  { url: '/es/studio/', label: 'Mientras esperas — el local en el que trabajo.' },
      'audit':     { url: '/es/tools/storefront-health/', label: 'Mientras esperas — corre el chequeo gratis.' },
      'care':      { url: '/es/studio/care-plan-light/', label: 'Mientras esperas — qué cubre el Plan.' },
      'else':      { url: '/es/blog/', label: 'Mientras esperas — sobre qué he estado escribiendo.' },
      _default:    { url: '/es/blog/', label: 'Mientras esperas — sobre qué he estado escribiendo.' },
    },
  };

  // Track which chip the operator last tapped (or null when they
  // typed without clicking a chip). Keyed off the position so the
  // CHIP_ARTIFACTS lookup is stable even if chip copy changes.
  var lastChipKey = null;

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
    // Topic param: smart-next CTAs in articles pass ?topic=<slug>; if
    // present, surface it as a "Topic" header so Don can sort/filter
    // by which article the inquiry came from. Silently ignored when
    // absent — keeps backward compatibility with direct /window/ entries.
    var topic = readTopicParam();
    if (topic) {
      pieces.push('Topic: ' + topic);
    }
    if (!pieces.length) return rawBody;
    return pieces.join('\n') + '\n---\n' + rawBody;
  }

  // Phase G — Window topic routing. Reads `?topic=<slug>` from the
  // URL (set by smart-next CTAs in /blog/<slug>/index.html templates),
  // returns the human-readable slug for inclusion in the outbound
  // message header. Defensive: returns null on missing or malformed
  // values so existing direct entries (no topic) keep working.
  function readTopicParam() {
    try {
      var params = new URLSearchParams(window.location.search);
      var raw = params.get('topic');
      if (!raw) return null;
      // Slug allowlist: lowercase letters, numbers, hyphens, max 120
      // chars. Anything else is dropped silently — keeps junk out of
      // the operator inbox without surfacing an error to the visitor.
      if (!/^[a-z0-9-]{1,120}$/.test(raw)) return null;
      return raw;
    } catch (_) { return null; }
  }

  var state = {
    authed: false,
    threadId: null,
    lastMsgIds: new Set(),
    lastUpdatedAt: 0,
    pollTimer: null,
    activeTimer: null,
    paused: false,
    // Phase 8.1 — true while a level-2 auto-pause has disabled the
    // composer, so a later level-0 poll knows to re-enable it.
    autoPauseDisabled: false,
    // True between submit and response so an auto-pause poll firing
    // mid-send doesn't re-enable the composer underneath the request.
    sending: false,
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

  // Phase 8.1 — auto-pause half-states from /api/window/active.autoPauseLevel.
  // 0 = normal (no-op). 1 = soft: a non-blocking advisory; composer stays
  // usable. 2 = disabled: composer turned off and the operator is routed to
  // email — the pauseHard copy carries don@muntin.digital as the emergency
  // lane (plan §8.1). Called from pollActive on init AND every 60s, so it
  // must be idempotent and recover: level 0/1 re-enable a previously
  // disabled composer. Only an explicit level 2 disables (a fetch failure
  // is silent → composer stays usable).
  function applyAutoPause(level) {
    if (level >= 2) {
      if (els.body) { els.body.disabled = true; els.body.setAttribute('aria-disabled', 'true'); }
      if (els.submit) els.submit.disabled = true;
      state.autoPauseDisabled = true;
      showMsg(copy.pauseHard, false);
    } else if (level === 1) {
      // Soft: advisory only, composer usable. If we'd previously hard-
      // disabled (level 2 → 1 recovery), re-enable now.
      if (state.autoPauseDisabled) {
        if (els.body) { els.body.disabled = false; els.body.removeAttribute('aria-disabled'); }
        if (els.submit && !state.sending) els.submit.disabled = false;
        state.autoPauseDisabled = false;
      }
      showMsg(copy.pauseSoft, false);
    } else {
      // Level 0 — healthy. Audit D: actively recover from a prior
      // disable/advisory. Only undo what auto-pause itself set, and don't
      // fight an in-flight send (state.sending) or the paused state.
      if (state.autoPauseDisabled) {
        if (els.body) { els.body.disabled = false; els.body.removeAttribute('aria-disabled'); }
        if (els.submit && !state.sending) els.submit.disabled = false;
        state.autoPauseDisabled = false;
        hideMsg();
      }
    }
  }

  function showPaused() {
    state.paused = true;
    if (els.paused) els.paused.hidden = false;
    if (els.hero) els.hero.hidden = true;
    if (els.composer) els.composer.hidden = true;
    if (els.thread) els.thread.hidden = true;
    // Hide the whole sash frame too — otherwise the "On a brief pause"
    // panel renders alongside the residual sash (portrait, reply-time
    // line, escape-hatch sill), a confusing dual state whose "reply
    // within 4 hours" copy contradicts the paused message.
    if (els.sash) els.sash.hidden = true;
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
    // Clear any inline styles set by Phase 2.2's showSuccessState so
    // a subsequent error/info message renders cleanly.
    els.msg.style.background = '';
    els.msg.style.borderLeft = '';
    els.msg.style.color = '';
    els.msg.textContent = text;
    els.msg.hidden = false;
    if (isError) els.msg.classList.add('error');
    else els.msg.classList.remove('error');
  }

  function hideMsg() {
    if (!els.msg) return;
    els.msg.hidden = true;
    els.msg.classList.remove('error');
    els.msg.style.background = '';
    els.msg.style.borderLeft = '';
    els.msg.style.color = '';
  }

  // Phase 3.5 — render a single attachment row inline. Photos use
  // <img src="/api/window/attach/<id>"> (worker-proxied download).
  // Voice uses <audio> + transcript (when available) + a "Delete
  // transcript" button (visitor-side privacy affordance per plan §11.6).
  function renderAttachment(att) {
    var div = document.createElement('div');
    div.className = 'window-msg__attachment window-msg__attachment--' + att.kind;
    div.dataset.attachId = att.id;
    if (att.kind === 'photo') {
      var img = document.createElement('img');
      img.src = '/api/window/attach/' + encodeURIComponent(att.id);
      img.alt = att.altText || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      div.appendChild(img);
      if (att.altText) {
        var altCap = document.createElement('p');
        altCap.className = 'window-msg__attachment-caption';
        altCap.textContent = att.altText;
        div.appendChild(altCap);
      }
    } else if (att.kind === 'voice') {
      // Phase 3.6 — tombstone branch. Hard-deleted voice notes have
      // no R2 object on reload, so don't render <audio> (it would
      // just 404). Show only the "Voice note deleted." marker.
      if (att.deleted || att.transcriptDeleted) {
        var deletedNote = document.createElement('p');
        deletedNote.className = 'window-msg__attachment-transcript window-msg__attachment-transcript--deleted';
        deletedNote.textContent = locale === 'es' ? 'Nota de voz borrada.' : 'Voice note deleted.';
        div.appendChild(deletedNote);
        return div;
      }

      var audio = document.createElement('audio');
      audio.src = '/api/window/attach/' + encodeURIComponent(att.id);
      audio.controls = true;
      audio.preload = 'none';
      div.appendChild(audio);

      // Inline transcript (default-on per plan §6.3 — WCAG 1.2.1
      // accessible alternative to audio-only).
      if (att.transcript) {
        var trans = document.createElement('p');
        trans.className = 'window-msg__attachment-transcript';
        trans.textContent = att.transcript;
        div.appendChild(trans);
      }

      // Delete-voice-note affordance on the visitor's own thread.
      // Phase 3.6: HARD-deletes R2 audio + tombstones the KV row
      // (plan §2.9). Available regardless of transcript status —
      // operator may want to delete a voice note before the
      // transcript backfill drains.
      if (state.threadIsAnon || state.authed) {
        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'window-msg__attachment-delete-transcript';
        delBtn.textContent = locale === 'es' ? 'Borrar la nota de voz' : 'Delete voice note';
        delBtn.addEventListener('click', function () {
          if (!confirm(locale === 'es'
            ? '¿Borrar la nota de voz? El audio y la transcripción se borran ahora mismo.'
            : 'Delete the voice note? The audio and transcript are deleted right now.'
          )) return;
          delBtn.disabled = true;
          var p = new URLSearchParams();
          p.set('attachId', att.id);
          fetch('/api/window/attach/voice-delete', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: p.toString(),
          })
            .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
            .then(function (res) {
              if (res.status === 200 && res.body && res.body.ok) {
                // Replace the entire attachment block with a tombstone
                // (audio is gone — the <audio> element shouldn't render).
                while (div.firstChild) div.removeChild(div.firstChild);
                var marker = document.createElement('p');
                marker.className = 'window-msg__attachment-transcript window-msg__attachment-transcript--deleted';
                marker.textContent = locale === 'es' ? 'Nota de voz borrada.' : 'Voice note deleted.';
                div.appendChild(marker);
              } else {
                delBtn.disabled = false;
                alert(locale === 'es' ? 'No se pudo borrar.' : "Couldn't delete.");
              }
            })
            .catch(function () {
              delBtn.disabled = false;
              alert(locale === 'es' ? 'No se pudo borrar.' : "Couldn't delete.");
            });
        });
        div.appendChild(delBtn);
      }
    }
    return div;
  }

  function renderMessages(messages, attachmentsByMsgId) {
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

      // Phase 3.5 — render attachments (photos + voice) inline.
      // Built via DOM (textContent) to honor plan §5.6 rule 11
      // (operator-derived strings: transcript + altText must NOT
      // pass through innerHTML).
      var attaches = attachmentsByMsgId && attachmentsByMsgId[m.id] ? attachmentsByMsgId[m.id] : null;
      if (attaches && attaches.length) {
        var attachWrap = document.createElement('div');
        attachWrap.className = 'window-msg__attachments';
        for (var ai = 0; ai < attaches.length; ai++) {
          attachWrap.appendChild(renderAttachment(attaches[ai]));
        }
        msgEl.appendChild(attachWrap);
      }

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
          state.threadIsAnon = !!j.anon;
        }
        renderMessages(j.messages || [], j.attachmentsByMsgId || {});
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
        if (!j) return;
      // Phase 8.1 — apply auto-pause level before the breathing-dot logic
      // (which early-returns when lastSeen is absent).
      applyAutoPause(j.autoPauseLevel || 0);
      if (!j.lastSeen || !els.pulse) return;
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

  // Phase 4 — /now/ presence line. One-shot fetch on init (the widget
  // changes on weekly cadence; per-page-load is plenty). When the
  // server returns show=true, the now line takes over and the
  // currents fallback is hidden. When show=false (private, stale,
  // or flag off), the currents fallback stays visible. The endpoint
  // 404s when WINDOW_NOW_ENABLED is off — no error logged. Plan §4.4.
  function loadNow() {
    var nowEl = document.getElementById('windowNow');
    var currentsEl = document.getElementById('windowCurrents');
    if (!nowEl) return;
    fetch('/api/window/now?locale=' + encodeURIComponent(locale), { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.ok || !j.show || !j.text) return;
        // Phase 5+ audit (Issue 3 LOW): unhide the live region before
        // mutating textContent so the polite announcement fires.
        nowEl.dataset.mode = j.mode || 'fuzz';
        nowEl.hidden = false;
        nowEl.textContent = j.text;
        if (currentsEl) currentsEl.hidden = true;
      })
      .catch(function () { /* widget off or network blip — fallback stays visible */ });
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
    // Phase 3.2 — thumb-only path (plan §3.6): allow empty body when
    // attachments are present. The server enforces the same rule
    // (handleWindowAppend), so this is just UX — no point letting the
    // visitor submit an empty form when no attachment is selected.
    var attachIds = (window.muntinPhotos && typeof window.muntinPhotos.collectAttachIds === 'function')
      ? window.muntinPhotos.collectAttachIds()
      : [];
    if (!rawBody && attachIds.length === 0) {
      showMsg(copy.errorBodyEmpty, true);
      return;
    }
    var bodyWithContext = buildBodyWithContext(rawBody);
    if (bodyWithContext.length > 4000) { showMsg(copy.errorBodyTooLong, true); return; }
    hideMsg();
    persistContextToStorage();
    state.sending = true;
    els.submit.disabled = true;
    els.body.disabled = true;
    var origLabel = els.submit.textContent;
    els.submit.textContent = copy.sending;
    // Expose the in-flight state to assistive tech (the visible label
    // change alone isn't announced). Cleared on success/error below.
    els.submit.setAttribute('aria-busy', 'true');

    var params = new URLSearchParams();
    params.set('body', bodyWithContext);
    if (attachIds.length) {
      params.set('attach_ids', attachIds.join(','));
    }
    // Cross-site origin tag (plan §W): the hidden #windowSource field is
    // set by applySource() from ?source=. Submit it so a NEW thread is
    // stamped with where the operator came from. Backend allowlists it.
    var srcEl = document.getElementById('windowSource');
    if (srcEl && srcEl.value) {
      params.set('source', srcEl.value);
    }

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
        // Phase 3.2 — clear photo previews after successful send so a
        // follow-up message starts clean. Attachments are now linked
        // to the prior msg server-side; the client state can drop them.
        if (window.muntinPhotos && typeof window.muntinPhotos.clearAttachments === 'function') {
          window.muntinPhotos.clearAttachments();
        }
        // Phase 2.2 — success state with artifact + contextual link
        // (replaces the prior "Sent it. Don has the note." line).
        // Plan §3.7. The crisis line stays visible if it was up
        // before send (so the resources travel with the operator
        // into the wait).
        showSuccessState(res.body && res.body.dayCapped);
        // Reset chip-key tracking so a follow-up send doesn't
        // mis-route to the prior chip's artifact.
        lastChipKey = null;
        // Differentiate anon vs identified sends so the Phase 1a
        // anonymous-first lift is measurable. Server returns
        // `anon:true` when the response was minted on the anon
        // path; identified responses don't carry that flag.
        // See docs/window-redesign-plan.md §9.6.
        try {
          var sendKind = (res.body && res.body.anon) ? 'anon' : 'identified';
          // Cross-site origin tag (plan §W): record where the operator
          // arrived from so we can compare Ledger vs on-site send rates.
          var sendSrcEl = document.getElementById('windowSource');
          var sendSource = (sendSrcEl && sendSrcEl.value) ? sendSrcEl.value : 'direct';
          window.plausible && window.plausible('Window Send', { props: { kind: sendKind, locale: locale, source: sendSource } });
        } catch (_) { /* analytics blocked or not loaded; do nothing */ }
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
      else if (code === 'pii-blocked') text = copy.errorPii;
      else if (code === 'thread-claimed-please-signin') { text = copy.errorClaimed; showSignin(); }
      else if (code === 'unauthenticated') { showSignin(); return; }
      else if (code === 'not-found') { showPaused(); return; }
      // Phase 2 audit followup — measurement event per plan §9.6.
      // Single Window Error event with code prop covers what plan-§9.6
      // listed as window-day-cap, window-rate-limit, window-pii-blocked,
      // window-thread-claimed (one event + cohort split, easier to
      // query in Plausible than 5+ separate events).
      try {
        window.plausible && window.plausible('Window Error', { props: { code: code, locale: locale } });
      } catch (_) { /* ignore */ }
      showMsg(text, true);
    }).catch(function () {
      showMsg(copy.error, true);
    }).finally(function () {
      state.sending = false;
      els.submit.disabled = false;
      els.body.disabled = false;
      els.submit.textContent = origLabel || copy.submitLabel;
      els.submit.removeAttribute('aria-busy');
      // If auto-pause had hard-disabled the composer, the unconditional
      // re-enable above would briefly undo it; the next pollActive tick
      // (≤60s) re-applies the level. Re-assert immediately to avoid the gap.
      if (state.autoPauseDisabled) {
        if (els.body) els.body.disabled = true;
        if (els.submit) els.submit.disabled = true;
      }
    });
  }

  function updateCounter() {
    if (!els.counter || !els.body) return;
    els.counter.textContent = copy.counterFmt(els.body.value.length);
    // Phase 2.1 spec — counter only renders at >87.5% of cap (>3500
    // chars). Below that, it stays hidden so the row is uncluttered.
    var threshold = Math.floor(4000 * 0.875);
    els.counter.hidden = els.body.value.length < threshold;
  }

  // Phase 2.2 — chip-key derivation for the success-state artifact.
  // Reads from the chip's class list / data attribute; falls back to
  // position. Deliberately not coupled to chip copy.
  function chipKeyFor(btn) {
    if (!btn) return null;
    var data = btn.getAttribute('data-chip-key');
    if (data) return data;
    // Fallback: derive from position in the onramp row.
    var siblings = els.onramps ? els.onramps.querySelectorAll('.window-onramp') : [];
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] === btn) {
        return ['not-sure', 'not-ready', 'new-site', 'audit', 'care', 'else'][i] || 'else';
      }
    }
    return 'else';
  }

  function bindOnramps() {
    if (!els.onramps) return;
    els.onramps.querySelectorAll('.window-onramp').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prepend = btn.getAttribute('data-prepend') || '';
        // Track for the success-state artifact lookup.
        lastChipKey = chipKeyFor(btn);
        // Phase 2 audit followup — measurement event per plan §9.6.
        try {
          window.plausible && window.plausible('Window Chip', { props: { key: lastChipKey || 'unknown', locale: locale } });
        } catch (_) { /* ignore */ }
        if (els.body) {
          els.body.value = prepend + (els.body.value || '');
          els.body.focus();
          // Place cursor at end.
          var end = els.body.value.length;
          els.body.setSelectionRange(end, end);
          updateCounter();
          maybeShowCrisis();
        }
      });
    });
  }

  // Phase 2.2 — composer-side crisis line, debounced 600ms after the
  // last keystroke. Reveals when Tier-1 keywords appear; hides when
  // they're deleted. Never blocks send. Plan §3.12.
  var crisisDebounceTimer = null;
  var crisisFiredThisSession = false;
  function maybeShowCrisis() {
    if (!els.crisis || !els.body) return;
    if (crisisDebounceTimer) clearTimeout(crisisDebounceTimer);
    crisisDebounceTimer = setTimeout(function () {
      var hit = detectClientCrisis(els.body.value);
      var wasHidden = els.crisis.hidden;
      els.crisis.hidden = !hit;
      // Phase 2 audit followup — fire Plausible once per session
      // when the line first reveals. Subsequent reveals (operator
      // deletes + re-types the keyword) don't re-fire. No PII —
      // we don't send the keyword or the body. Plan §9.6.
      if (hit && wasHidden && !crisisFiredThisSession) {
        crisisFiredThisSession = true;
        try {
          window.plausible && window.plausible('Window Crisis Flag', { props: { surface: 'composer-line', locale: locale } });
        } catch (_) { /* ignore */ }
      }
    }, CRISIS_DEBOUNCE_MS);
  }

  // Phase 2.2 — new success state. Replaces the v3-pre 2.5s
  // reveal-fade-restore (audit and conversion review both flagged
  // it as breaking the iMessage loop). Inline confirmation that
  // stays. The "Drop your email" upgrade is gone — the email
  // arrives because Don replies; the page does not need to ask.
  // Plan §3.7 + §3.11.
  function showSuccessState(dayCapped) {
    if (!els.msg) return;
    var locale_ = locale;
    var artifactMap = CHIP_ARTIFACTS[locale_] || CHIP_ARTIFACTS.en;
    var artifact = artifactMap[lastChipKey || '_default'] || artifactMap._default;
    var thanks = locale_ === 'es'
      ? 'Eso cuesta. Gracias por escribir.'
      : 'That took something. Thank you for writing.';

    // Clear + style the message area + build content via DOM
    // (no innerHTML on operator-derived content; this content is
    // page-authored so it's safe but we keep the textContent
    // discipline as house style — plan §5.6 rule 11 textContent-only).
    while (els.msg.firstChild) els.msg.removeChild(els.msg.firstChild);
    els.msg.classList.remove('error');
    els.msg.style.background = 'var(--cream-2)';
    els.msg.style.borderLeft = '3px solid var(--teal)';
    els.msg.style.color = 'var(--ink)';

    var thanksLine = document.createElement('span');
    thanksLine.style.display = 'block';
    thanksLine.style.fontWeight = '500';
    thanksLine.textContent = thanks;
    els.msg.appendChild(thanksLine);

    // Phase 8.2 — daily-cap half-success. The note IS filed (server still
    // 200s); this line just sets the "tomorrow morning" expectation.
    if (dayCapped) {
      var cappedLine = document.createElement('span');
      cappedLine.style.display = 'block';
      cappedLine.style.marginTop = '6px';
      cappedLine.style.color = 'var(--ink-soft)';
      cappedLine.textContent = copy.sentDayCapped;
      els.msg.appendChild(cappedLine);
    }

    var artifactLine = document.createElement('span');
    artifactLine.style.display = 'block';
    artifactLine.style.marginTop = '8px';
    artifactLine.style.fontStyle = 'italic';
    artifactLine.style.fontSize = '13px';
    var link = document.createElement('a');
    link.href = artifact.url;
    link.textContent = artifact.label;
    link.style.color = 'var(--teal)';
    link.style.fontWeight = '500';
    artifactLine.appendChild(link);
    els.msg.appendChild(artifactLine);

    els.msg.hidden = false;
    // Move focus to the confirmation so keyboard/SR users land on the
    // thank-you + "while you wait" link instead of the now-empty
    // textarea. role="status" on #windowMsg still announces the text.
    try {
      els.msg.setAttribute('tabindex', '-1');
      els.msg.focus({ preventScroll: false });
    } catch (_) { /* focus may throw on detached node; non-critical */ }
  }

  // Boot: check auth, then either load identified thread or fall
  // through to the anon path. Phase 1b — no auto-showSignin on 401:
  // the composer is fully interactive without a session (anon-first).
  // The signin section reveals only via explicit affordances (Phase 2
  // success-state upgrade) or via legacy 'unauthenticated' error
  // codes when WINDOW_ANON_ENABLED is off.
  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then(function (r) {
      if (r.status === 200) {
        state.authed = true;
        return loadThread();
      }
      // 401 / 404: visitor isn't signed in. Try to load the anon
      // thread (the cookie may exist from a prior visit); if no
      // thread, the composer renders empty and the visitor can
      // start fresh.
      return loadThread();
    })
    .catch(function () { /* network error: leave the composer open */ })
    .finally(function () {
      startPolling();
    });

  if (els.form) els.form.addEventListener('submit', submit);
  if (els.body) {
    els.body.addEventListener('input', function () {
      updateCounter();
      maybeShowCrisis();
    });
  }
  bindOnramps();
  // Phase-2 redesign — boot the optional context fields.
  loadContextFromStorage();
  // Phase 4 — fire one-shot fetch for the /now/ presence line.
  loadNow();

  // Phase 3.4 — listen for satellite scripts (window-callback.js,
  // future window-now.js) that mutate the thread on the server and
  // need the visitor's view to re-render without a manual refresh.
  window.addEventListener('muntin:window-thread-changed', function () {
    loadThread();
  });

  // Phase 2 audit followup — fire Window Claimed when the operator
  // arrives via Don's reply-email magic link (handleAuthVerify
  // redirects to /window/?claimed=1 on success). Plan §9.6.
  (function detectClaimedReturn() {
    try {
      var search = new URLSearchParams(window.location.search || '');
      if (search.get('claimed') === '1') {
        window.plausible && window.plausible('Window Claimed', { props: { locale: locale } });
      }
    } catch (_) { /* ignore */ }
  })();

  // Phase W — Ledger handoff. Visitors routed from Muntin Ledger
  // arrive with ?source=ledger. Record the source on the hidden
  // #windowSource field so it serializes with the form submission,
  // and reveal the warm welcome line for Ledger arrivals. Mirrors
  // the readTopicParam() slug-allowlist style: never trust the URL.
  // Defensive null-guards throughout — this script runs site-wide
  // via the bundle, so the elements exist only on /window/.
  (function applySource() {
    var search;
    try { search = new URLSearchParams(location.search || ''); }
    catch (_) { return; }
    var raw = search.get('source') || '';
    // Sanitize to a short safe slug: lowercase, strip to [a-z0-9-],
    // cap at 24 chars. Empty after sanitizing → nothing to record.
    var cleanSource = raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
    if (!cleanSource) return;
    var sourceEl = document.getElementById('windowSource');
    if (sourceEl) sourceEl.value = cleanSource;
    if (cleanSource === 'ledger') {
      var l = document.getElementById('windowFromLedger');
      if (l) l.hidden = false;
    }
  })();

  // Phase 2.4 — handoff prefill receiver. URL convention:
  //   /window/?topic=<key>&prefill=<base64-encoded text>
  // where <key> is one of: audit, gbp, storefront-health, sheet:plate-cost,
  // glossary:<term>, blog:<slug>, or any string the source page uses.
  // The receiver:
  //   - pre-populates the textarea with the decoded finding
  //   - sets lastChipKey to the chip whose data-chip-key matches `topic`
  //     (so the success-state artifact routes correctly)
  //   - reveals the optional context <details> if a URL is in the prefill
  //   - never auto-submits — the operator still hits Send
  // Plan §4.2.
  (function applyPrefill() {
    if (!els.body) return;
    var search;
    try { search = new URLSearchParams(window.location.search || ''); }
    catch (_) { return; }
    var topic = search.get('topic') || '';
    var prefillRaw = search.get('prefill') || '';
    if (!prefillRaw) {
      // Topic alone (without prefill) just sets the chip key for
      // routing, e.g. /window/?topic=audit from a footer link.
      if (topic) {
        var topicKeyMap = { audit: 'audit', 'storefront-health': 'audit', care: 'care', 'care-plan': 'care', 'new-site': 'new-site', 'not-sure': 'not-sure', 'not-ready': 'not-ready' };
        if (topicKeyMap[topic]) lastChipKey = topicKeyMap[topic];
      }
      return;
    }
    // Decode base64-url-safe → UTF-8.
    var decoded;
    try {
      var b64 = prefillRaw.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      decoded = decodeURIComponent(escape(atob(b64)));
    } catch (_) {
      // Treat as plain URL-decoded text; sanitize length.
      try { decoded = decodeURIComponent(prefillRaw); } catch (__) { decoded = prefillRaw; }
    }
    if (typeof decoded !== 'string') return;
    // Cap at MAX_MSG_LENGTH so a malformed param doesn't blow up the textarea.
    if (decoded.length > 4000) decoded = decoded.slice(0, 4000);
    els.body.value = decoded;
    updateCounter();
    maybeShowCrisis();
    // Topic → chip-key mapping (mirrors CHIP_ARTIFACTS keys).
    var topicKeyMap2 = { audit: 'audit', 'storefront-health': 'audit', care: 'care', 'care-plan': 'care', 'new-site': 'new-site', 'not-sure': 'not-sure', 'not-ready': 'not-ready' };
    if (topicKeyMap2[topic]) lastChipKey = topicKeyMap2[topic];
    // Reveal context details so the operator sees the URL/restaurant
    // fields without having to hunt for them.
    if (els.contextDetails && !els.contextDetails.open) {
      els.contextDetails.open = true;
    }
    // Plausible event: the prefill landed cleanly. Lets us measure
    // tool-result handoff conversion rate per plan §9.6.
    try {
      window.plausible && window.plausible('Window Prefill', { props: { topic: topic || 'unknown', locale: locale } });
    } catch (_) { /* ignore */ }
  })();
})();
