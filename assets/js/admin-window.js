// Phase W.3 (The Window) — admin queue + thread view.
//
// One page, hash-routed: #thread=<id>&sub=<sub> shows the thread
// detail view; no hash shows the queue. Mobile-first; thumb-zone
// optimized. Quick-reply chips fetched via the locale-aware
// templates registry (W.1).
//
// Auth + admin gate happens server-side. /api/admin/window/list
// returns 403 to non-admins; this page surfaces the empty-state
// "editor's queue" copy on 403.

(function () {
  'use strict';

  var locale = (document.body.getAttribute('data-locale') === 'es') ? 'es' : 'en';

  var COPY = {
    en: {
      sending: 'Sending…',
      send: 'Send',
      closing: 'Setting down…',
      closeConfirm: 'Set this thread down? Visitor sees the door is still open — they can write again.',
      closed: 'Set down.',
      error: "Couldn't send. Try again.",
      youStamp: 'Visitor',
      donStamp: 'Don',
    },
    es: {
      sending: 'Enviando…',
      send: 'Enviar',
      closing: 'Dejando…',
      closeConfirm: '¿Dejar este hilo? El visitante ve que la puerta sigue abierta — puede escribir otra vez.',
      closed: 'Dejado.',
      error: 'No se pudo enviar. Inténtalo de nuevo.',
      youStamp: 'Visitante',
      donStamp: 'Don',
    },
  };
  var copy = COPY[locale];

  // 5 quick-reply templates, mirrors src/lib/window-templates.js.
  // Locale-aware. Hard-coded here to avoid an extra fetch.
  var QUICK_REPLIES = {
    en: [
      "I'd want to see the site first — drop a URL when you have a sec, and I'll look before I answer.",
      "Yes, that's something I can help with. Want me to scope it properly? I can send a short note back with what it'd take.",
      "Quick yes — that's a {tool} thing. Here's the tool, takes about a minute: {link}",
      "I don't think we're the right fit for this one — but here's the thing I'd actually do in your spot: {thought}.",
      "Need a few days on this — saving it to my desk and I'll come back with a real answer, not a rushed one.",
    ],
    es: [
      'Primero quiero ver el sitio — pásame el enlace cuando puedas y lo reviso antes de responder.',
      'Sí, eso lo puedo hacer. ¿Quieres que lo dimensione bien? Te mando una nota corta con lo que implicaría.',
      'Sí, rápido — eso es cosa de {tool}. Aquí está, te toma como un minuto: {link}',
      'No creo que seamos lo indicado para esto — pero esto es lo que yo haría en tu lugar: {pensamiento}.',
      'Necesito unos días con esto — lo guardo en el escritorio y vuelvo con una respuesta de verdad, no apurada.',
    ],
  };

  var els = {
    listView:    document.getElementById('adminList'),
    list:        document.getElementById('adminWindowList'),
    empty:       document.getElementById('adminWindowEmpty'),
    error:       document.getElementById('adminWindowError'),
    paused:      document.getElementById('adminWindowPaused'),
    forbidden:   document.getElementById('adminWindowForbidden'),
    threadView:  document.getElementById('adminThread'),
    threadEmail: document.getElementById('adminThreadEmail'),
    threadMsgs:  document.getElementById('adminThreadMsgs'),
    threadForm:  document.getElementById('adminThreadForm'),
    threadBody:  document.getElementById('adminThreadBody'),
    threadSend:  document.getElementById('adminThreadSend'),
    threadClose: document.getElementById('adminThreadClose'),
    threadQuick: document.getElementById('adminThreadQuick'),
  };

  function escHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
    });
  }

  function fmtRelative(ts) {
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return locale === 'es' ? 'ahora' : 'now';
    if (s < 3600) return Math.floor(s / 60) + (locale === 'es' ? ' min' : 'm');
    if (s < 86400) return Math.floor(s / 3600) + (locale === 'es' ? ' h' : 'h');
    return Math.floor(s / 86400) + (locale === 'es' ? ' d' : 'd');
  }

  function fmtTime(ts) {
    try {
      return new Date(ts).toLocaleString(locale === 'es' ? 'es-US' : 'en-US', {
        weekday: 'short', hour: 'numeric', minute: '2-digit',
      });
    } catch (_) { return ''; }
  }

  function showEmptyState(which) {
    [els.empty, els.error, els.paused, els.forbidden].forEach(function (n) {
      if (n) n.hidden = (n !== which);
    });
    // Clear any rendered rows.
    if (els.list) {
      var rows = els.list.querySelectorAll('.admin-window__row');
      rows.forEach(function (r) { r.remove(); });
    }
  }

  function renderList(items) {
    if (!els.list) return;
    var rows = els.list.querySelectorAll('.admin-window__row');
    rows.forEach(function (r) { r.remove(); });
    if (!items.length) {
      showEmptyState(els.empty);
      return;
    }
    [els.empty, els.error, els.paused, els.forbidden].forEach(function (n) { if (n) n.hidden = true; });
    items.forEach(function (it) {
      // Phase 1a step 1 (audit B2) — anon entries have it.sub === null
      // and it.kind === 'anon'. Render with anonId in the label and
      // route via &anonId= instead of &sub=. Pre-fix code crashed
      // on .slice of null and killed the whole list.
      var isAnon = it.kind === 'anon' || (!it.sub && it.anonId);
      var idLabel, hashLink;
      if (isAnon) {
        var aid = String(it.anonId || '');
        idLabel = (aid ? aid.slice(0, 12) : 'anon') + '… · anon';
        hashLink = '#thread=' + encodeURIComponent(it.threadId) + '&anonId=' + encodeURIComponent(aid);
      } else {
        var s = String(it.sub || '');
        idLabel = (s ? s.slice(0, 12) : '?') + '…';
        hashLink = '#thread=' + encodeURIComponent(it.threadId) + '&sub=' + encodeURIComponent(s);
      }
      var a = document.createElement('a');
      a.className = 'admin-window__row' + (it.unreadByAdmin ? ' admin-window__row--unread' : '');
      a.href = hashLink;
      a.innerHTML =
        '<div class="admin-window__row-head">' +
          '<span class="admin-window__row-id">' + escHtml(idLabel) + '</span>' +
          '<span class="admin-window__row-time">' + fmtRelative(it.updatedAt) + '</span>' +
        '</div>' +
        '<p class="admin-window__row-status">' + escHtml(it.status) + (it.unreadByAdmin ? ' · unread' : '') + '</p>';
      els.list.appendChild(a);
    });
  }

  function loadList() {
    fetch('/api/admin/window/list', { credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 404) { showEmptyState(els.paused); return null; }
        if (r.status === 403) { showEmptyState(els.forbidden); return null; }
        if (r.status === 401) { window.location.href = '/sign-in/?return=' + encodeURIComponent('/admin/window/'); return null; }
        if (!r.ok) { showEmptyState(els.error); return null; }
        return r.json();
      })
      .then(function (j) {
        if (!j) return;
        renderList(j.items || []);
      })
      .catch(function () { showEmptyState(els.error); });
  }

  function renderThreadMsgs(messages) {
    if (!els.threadMsgs) return;
    els.threadMsgs.innerHTML = '';
    messages.forEach(function (m) {
      var div = document.createElement('div');
      div.className = 'admin-msg admin-msg--' + (m.from === 'don' ? 'don' : 'user');
      var stamp = (m.from === 'don' ? copy.donStamp : copy.youStamp) + ' · ' + fmtTime(m.createdAt);
      div.innerHTML =
        '<p class="admin-msg__stamp">' + escHtml(stamp) + '</p>' +
        '<p class="admin-msg__body">' + escHtml(m.body).replace(/\n/g, '<br>') + '</p>';
      els.threadMsgs.appendChild(div);
    });
    els.threadMsgs.scrollTop = els.threadMsgs.scrollHeight;
  }

  function renderQuickReplies() {
    if (!els.threadQuick) return;
    els.threadQuick.innerHTML = '';
    QUICK_REPLIES[locale].forEach(function (t, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'admin-thread__quick-btn';
      btn.textContent = (i + 1) + '. ' + t.slice(0, 36) + (t.length > 36 ? '…' : '');
      btn.title = t;
      btn.addEventListener('click', function () {
        if (!els.threadBody) return;
        els.threadBody.value = t;
        els.threadBody.focus();
      });
      els.threadQuick.appendChild(btn);
    });
  }

  // Set form/query params from a parsed hash identity. Identity
  // carries either a `sub` (identified) OR an `anonId` (anonymous);
  // never both (server rejects with invalid-body).
  function setIdentityParams(params, identity) {
    if (identity.anonId) params.set('anonId', identity.anonId);
    else if (identity.sub) params.set('sub', identity.sub);
  }

  function identityLabel(identity, threadEmail) {
    if (threadEmail) return threadEmail;
    if (identity.anonId) return identity.anonId.slice(0, 12) + '… · anon';
    if (identity.sub) return identity.sub.slice(0, 20);
    return 'unknown';
  }

  function loadThread(threadId, identity) {
    var params = new URLSearchParams();
    params.set('id', threadId);
    setIdentityParams(params, identity);
    fetch('/api/admin/window/thread?' + params.toString(), { credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 404) { window.location.hash = ''; return null; }
        if (r.status === 403) { showEmptyState(els.forbidden); window.location.hash = ''; return null; }
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (j) {
        if (!j || !j.ok) return;
        if (els.threadEmail) els.threadEmail.textContent = identityLabel(identity, j.thread && j.thread.email);
        renderThreadMsgs(j.messages || []);
        renderQuickReplies();
      });
  }

  function showThreadView(threadId, identity) {
    if (els.listView) els.listView.hidden = true;
    if (els.threadView) els.threadView.hidden = false;
    loadThread(threadId, identity);
  }

  function showListView() {
    if (els.listView) els.listView.hidden = false;
    if (els.threadView) els.threadView.hidden = true;
    loadList();
  }

  // Hash format: `#thread=<id>&sub=<sub>` (identified) OR
  // `#thread=<id>&anonId=<aid>` (anonymous). Returns null on
  // missing threadId or both sub/anonId blank.
  function parseHash() {
    var h = window.location.hash.replace(/^#/, '');
    if (!h) return null;
    var params = new URLSearchParams(h);
    var threadId = params.get('thread');
    var sub = params.get('sub') || null;
    var anonId = params.get('anonId') || null;
    if (!threadId) return null;
    if (!sub && !anonId) return null;
    return { threadId: threadId, sub: sub, anonId: anonId };
  }

  function route() {
    var hashed = parseHash();
    if (hashed) showThreadView(hashed.threadId, hashed);
    else showListView();
  }

  // Send reply.
  if (els.threadForm) {
    els.threadForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var hashed = parseHash();
      if (!hashed || !els.threadBody) return;
      var body = els.threadBody.value.trim();
      if (!body) return;
      els.threadSend.disabled = true;
      var orig = els.threadSend.textContent;
      els.threadSend.textContent = copy.sending;

      var params = new URLSearchParams();
      params.set('threadId', hashed.threadId);
      setIdentityParams(params, hashed);
      params.set('body', body);
      params.set('locale', locale);

      fetch('/api/admin/window/reply', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }).then(function (r) {
        return r.json().then(function (j) { return { status: r.status, body: j }; });
      }).then(function (res) {
        if (res.status === 200 && res.body.ok) {
          els.threadBody.value = '';
          loadThread(hashed.threadId, hashed);
          return;
        }
        alert(copy.error + ' (' + (res.body && res.body.error || 'unknown') + ')');
      }).catch(function () { alert(copy.error); })
        .finally(function () {
          els.threadSend.disabled = false;
          els.threadSend.textContent = orig || copy.send;
        });
    });
  }

  // Close (set down).
  if (els.threadClose) {
    els.threadClose.addEventListener('click', function () {
      var hashed = parseHash();
      if (!hashed) return;
      if (!confirm(copy.closeConfirm)) return;
      var params = new URLSearchParams();
      params.set('threadId', hashed.threadId);
      setIdentityParams(params, hashed);
      fetch('/api/admin/window/close', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }).then(function (r) {
        return r.json().then(function (j) { return { status: r.status, body: j }; });
      }).then(function (res) {
        if (res.status === 200 && res.body.ok) {
          window.location.hash = '';
        } else {
          alert(copy.error);
        }
      }).catch(function () { alert(copy.error); });
    });
  }

  window.addEventListener('hashchange', route);
  route();
})();
