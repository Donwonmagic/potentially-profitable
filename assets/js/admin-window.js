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
      voiceDeleted: 'Voice note deleted.',
      callbackHeading: 'Callback requested',
      callbackTapReveal: 'Tap to reveal phone',
      callbackVoiceLabel: 'Voice memo attached',
      callbackVoiceDeleted: 'Voice memo attached — deleted.',
      callbackRequestedAt: 'Requested',
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
      voiceDeleted: 'Nota de voz borrada.',
      callbackHeading: 'Llamada solicitada',
      callbackTapReveal: 'Toca para revelar el número',
      callbackVoiceLabel: 'Nota de voz adjunta',
      callbackVoiceDeleted: 'Nota de voz adjunta — borrada.',
      callbackRequestedAt: 'Solicitada',
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
      // Cross-site origin chip (plan §W): show where the thread came
      // from when it carries a source tag (e.g. "from Ledger"). Title-
      // case the known sources; fall back to the raw slug otherwise.
      var SOURCE_LABELS = { ledger: 'Ledger', digital: 'muntin.digital', blog: 'Blog', tool: 'Tool' };
      var sourceChip = '';
      if (it.source) {
        var srcLabel = SOURCE_LABELS[it.source] || it.source;
        sourceChip = '<span class="admin-window__row-source" data-source="' + escHtml(it.source) + '">from ' + escHtml(srcLabel) + '</span>';
      }
      a.innerHTML =
        '<div class="admin-window__row-head">' +
          '<span class="admin-window__row-id">' + escHtml(idLabel) + '</span>' +
          '<span class="admin-window__row-time">' + fmtRelative(it.updatedAt) + '</span>' +
        '</div>' +
        '<p class="admin-window__row-status">' + escHtml(it.status) + (it.unreadByAdmin ? ' · unread' : '') + sourceChip + '</p>';
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

  // Phase 3.6b — admin-side attachment renderer. Mirrors the visitor
  // renderer in window.js but without the "Delete voice note"
  // affordance (admin doesn't delete the visitor's voice notes;
  // tombstones surface via the deleted flag on reload). Photos and
  // voice are rendered inline; tombstoned voice notes show only
  // the "Voice note deleted." marker (R2 object is gone — would
  // 404 if we tried to play it).
  function renderAttachment(att) {
    var div = document.createElement('div');
    div.className = 'admin-msg__attachment admin-msg__attachment--' + att.kind;
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
        altCap.className = 'admin-msg__attachment-caption';
        altCap.textContent = att.altText;
        div.appendChild(altCap);
      }
    } else if (att.kind === 'voice') {
      if (att.deleted || att.transcriptDeleted) {
        var marker = document.createElement('p');
        marker.className = 'admin-msg__attachment-transcript admin-msg__attachment-transcript--deleted';
        marker.textContent = copy.voiceDeleted;
        div.appendChild(marker);
        return div;
      }
      var audio = document.createElement('audio');
      audio.src = '/api/window/attach/' + encodeURIComponent(att.id);
      audio.controls = true;
      audio.preload = 'none';
      div.appendChild(audio);
      if (att.transcript) {
        var trans = document.createElement('p');
        trans.className = 'admin-msg__attachment-transcript';
        trans.textContent = att.transcript;
        div.appendChild(trans);
      }
    }
    return div;
  }

  // Phase 3.6b — callbacks panel. Renders at the top of the thread,
  // above messages, so Don sees actionable callbacks before
  // scrolling the conversation. Phone is masked-by-default (***-***-1234)
  // with a tap-to-reveal affordance — keeps cleartext phone numbers
  // out of casual shoulder-surf range while still being one tap away
  // when Don's ready to dial. Plan §11.6.
  function renderCallbacks(callbacks) {
    if (!callbacks || !callbacks.length) return null;
    var wrap = document.createElement('div');
    wrap.className = 'admin-callbacks';
    callbacks.forEach(function (cb) {
      var card = document.createElement('div');
      card.className = 'admin-callbacks__card';

      var heading = document.createElement('p');
      heading.className = 'admin-callbacks__heading';
      heading.textContent = copy.callbackHeading + ' · ' + (cb.slotLabel || cb.slotKey || '');
      card.appendChild(heading);

      // Phone — masked by default. Tap reveals the full E.164.
      var phoneRow = document.createElement('p');
      phoneRow.className = 'admin-callbacks__phone';
      var phoneBtn = document.createElement('button');
      phoneBtn.type = 'button';
      phoneBtn.className = 'admin-callbacks__phone-btn';
      phoneBtn.textContent = (cb.phoneMasked || '***') + ' · ' + copy.callbackTapReveal;
      var revealed = false;
      phoneBtn.addEventListener('click', function () {
        if (revealed) return;
        revealed = true;
        // Replace masked text with a tel: link so Don can tap to dial
        // on mobile. The full phone is fetched lazily — the API only
        // ever returns the masked form to avoid casual log leakage.
        if (cb.phoneE164) {
          phoneBtn.textContent = '';
          var link = document.createElement('a');
          link.href = 'tel:' + cb.phoneE164;
          link.textContent = cb.phoneE164;
          link.className = 'admin-callbacks__phone-link';
          phoneBtn.appendChild(link);
        } else {
          phoneBtn.textContent = cb.phoneMasked || '***';
        }
      });
      phoneRow.appendChild(phoneBtn);
      card.appendChild(phoneRow);

      // Optional voice memo attached to the callback. Phase 3.6
      // audit (Section 3 MED): the voice attachment may have been
      // deleted between request and dial — in that case render a
      // "Voice memo deleted" marker instead of an <audio> control
      // that would 404 on play.
      if (cb.voiceAttachId) {
        if (cb.voiceDeleted) {
          var deletedLabel = document.createElement('p');
          deletedLabel.className = 'admin-callbacks__voice-label admin-callbacks__voice-label--deleted';
          deletedLabel.textContent = copy.callbackVoiceDeleted;
          card.appendChild(deletedLabel);
        } else {
          var voiceLabel = document.createElement('p');
          voiceLabel.className = 'admin-callbacks__voice-label';
          voiceLabel.textContent = copy.callbackVoiceLabel;
          card.appendChild(voiceLabel);
          var voiceAudio = document.createElement('audio');
          voiceAudio.src = '/api/window/attach/' + encodeURIComponent(cb.voiceAttachId);
          voiceAudio.controls = true;
          voiceAudio.preload = 'none';
          card.appendChild(voiceAudio);
        }
      }

      var meta = document.createElement('p');
      meta.className = 'admin-callbacks__meta';
      meta.textContent = copy.callbackRequestedAt + ' ' + fmtTime(cb.requestedAt);
      card.appendChild(meta);

      wrap.appendChild(card);
    });
    return wrap;
  }

  function renderThreadMsgs(messages, attachmentsByMsgId, callbacks) {
    if (!els.threadMsgs) return;
    els.threadMsgs.innerHTML = '';

    // Callbacks panel (when present) renders above the message log.
    var cbPanel = renderCallbacks(callbacks);
    if (cbPanel) els.threadMsgs.appendChild(cbPanel);

    messages.forEach(function (m) {
      var div = document.createElement('div');
      div.className = 'admin-msg admin-msg--' + (m.from === 'don' ? 'don' : 'user');
      var stamp = (m.from === 'don' ? copy.donStamp : copy.youStamp) + ' · ' + fmtTime(m.createdAt);
      // Plan §5.6 rule 11: operator-derived strings (transcript,
      // altText, message body) MUST NOT pass through innerHTML.
      // The static frame uses innerHTML; attachments build via DOM
      // (textContent inside renderAttachment).
      div.innerHTML =
        '<p class="admin-msg__stamp">' + escHtml(stamp) + '</p>' +
        '<p class="admin-msg__body">' + escHtml(m.body).replace(/\n/g, '<br>') + '</p>';

      var attaches = attachmentsByMsgId && attachmentsByMsgId[m.id] ? attachmentsByMsgId[m.id] : null;
      if (attaches && attaches.length) {
        var attachWrap = document.createElement('div');
        attachWrap.className = 'admin-msg__attachments';
        attaches.forEach(function (a) {
          attachWrap.appendChild(renderAttachment(a));
        });
        div.appendChild(attachWrap);
      }

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
        renderThreadMsgs(j.messages || [], j.attachmentsByMsgId || {}, j.callbacks || []);
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

  // Phase 4 — /now/ widget editor. Sits in the queue view (admin
  // /admin/window/index.html). On <details> open, fetch the current
  // row + populate the form. On submit, POST to /api/admin/window/now
  // and refresh the summary line. Plan §4.4.
  (function adminNow() {
    var nowDetails = document.getElementById('adminNow');
    var nowForm    = document.getElementById('adminNowForm');
    var nowCurrent = document.getElementById('adminNowCurrent');
    var nowMsg     = document.getElementById('adminNowMsg');
    if (!nowDetails || !nowForm || !nowCurrent) return;

    function describeCurrent(row) {
      if (!row) return locale === 'es'
        ? 'Sin estado actual. Establece uno abajo.'
        : 'No current state. Set one below.';
      var ageMs = Date.now() - (row.updatedAt || 0);
      var ageH  = Math.round(ageMs / 3600000);
      var stale = ageMs > 14 * 24 * 60 * 60 * 1000;
      var parts = [];
      parts.push((locale === 'es' ? 'Privacidad: ' : 'Privacy: ') + row.privacy);
      if (row.privacy === 'fuzz' || row.privacy === 'precise') {
        var fuzzShown = locale === 'es' ? (row.fuzzTextEs || row.fuzzText || '—') : (row.fuzzText || '—');
        parts.push((locale === 'es' ? 'Fuzz: ' : 'Fuzz: ') + fuzzShown);
      }
      if (row.privacy === 'precise') {
        var preciseShown = locale === 'es' ? (row.preciseTextEs || row.preciseText || '—') : (row.preciseText || '—');
        parts.push((locale === 'es' ? 'Preciso: ' : 'Precise: ') + preciseShown);
      }
      parts.push((locale === 'es' ? 'Actualizado hace ' : 'Updated ') + ageH + 'h' + (locale === 'es' ? '' : ' ago'));
      if (stale) parts.push(locale === 'es' ? '(antiguo — oculto)' : '(stale — hidden)');
      return parts.join(' · ');
    }

    function populate(row) {
      var byId = function (id) { return document.getElementById(id); };
      if (!row) return;
      if (byId('adminNowPrivacy'))       byId('adminNowPrivacy').value = row.privacy || 'fuzz';
      if (byId('adminNowFuzzText'))      byId('adminNowFuzzText').value = row.fuzzText || '';
      if (byId('adminNowFuzzTextEs'))    byId('adminNowFuzzTextEs').value = row.fuzzTextEs || '';
      if (byId('adminNowPreciseText'))   byId('adminNowPreciseText').value = row.preciseText || '';
      if (byId('adminNowPreciseTextEs')) byId('adminNowPreciseTextEs').value = row.preciseTextEs || '';
      if (byId('adminNowShift'))         byId('adminNowShift').value = row.shift || '';
    }

    function loadCurrent() {
      fetch('/api/admin/window/now', { credentials: 'same-origin' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !j.ok) {
            nowCurrent.textContent = locale === 'es' ? 'No se pudo cargar.' : "Couldn't load.";
            return;
          }
          nowCurrent.textContent = describeCurrent(j.now);
          if (j.now) populate(j.now);
        })
        .catch(function () {
          nowCurrent.textContent = locale === 'es' ? 'No se pudo cargar.' : "Couldn't load.";
        });
    }

    nowDetails.addEventListener('toggle', function () {
      if (nowDetails.open) loadCurrent();
    });

    nowForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fd = new FormData(nowForm);
      var p = new URLSearchParams();
      fd.forEach(function (v, k) { p.set(k, String(v)); });
      var submitBtn = document.getElementById('adminNowSubmit');
      if (submitBtn) submitBtn.disabled = true;
      if (nowMsg) nowMsg.textContent = locale === 'es' ? 'Guardando…' : 'Saving…';
      fetch('/api/admin/window/now', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: p.toString(),
      })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          if (res.status === 200 && res.body && res.body.ok) {
            if (nowMsg) nowMsg.textContent = locale === 'es' ? 'Guardado.' : 'Saved.';
            if (res.body.now) {
              nowCurrent.textContent = describeCurrent(res.body.now);
              populate(res.body.now);
            }
            try {
              window.plausible && window.plausible('Window Now Edit', { props: { privacy: res.body.now && res.body.now.privacy } });
            } catch (_) {}
          } else {
            if (nowMsg) nowMsg.textContent = locale === 'es'
              ? 'Error: ' + ((res.body && res.body.error) || 'desconocido')
              : 'Error: ' + ((res.body && res.body.error) || 'unknown');
          }
        })
        .catch(function () {
          if (nowMsg) nowMsg.textContent = locale === 'es' ? 'Error de red.' : 'Network error.';
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  })();
})();
