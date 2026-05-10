// assets/js/window-callback.js
//
// Phase 3.4 (Window redesign) — async voicenote callback shim
// client. Probes /api/window/callback to detect whether
// WINDOW_CALLBACK_ENABLED is on, reveals the chip if so, handles
// form submit. Phase 3.4 ships the SHIM only — Don calls back
// asynchronously with his own voicenote (or text); no live phone
// burden. Plan §4.5.

(function () {
  'use strict';

  var locale = (document.body && document.body.getAttribute('data-locale') === 'es') ? 'es' : 'en';

  var COPY = {
    en: {
      sending: 'Sending…',
      submit: 'Ask for a callback',
      success: "Got it. The request is in your thread above. If something changes, just write back.",
      error: "Couldn't send that request. Try again or just write a regular note.",
      invalidPhone: 'That number doesn’t look right. Try +1 followed by 10 digits, or paste it the way you’d type into your contacts.',
    },
    es: {
      sending: 'Enviando…',
      submit: 'Pedir una llamada',
      success: 'Listo. El pedido está en tu conversación arriba. Si algo cambia, escíbeme.',
      error: 'No pude mandar el pedido. Intenta otra vez o escribe una nota normal.',
      invalidPhone: 'Ese número no se ve bien. Intenta +1 seguido de 10 dígitos.',
    },
  };
  var copy = COPY[locale];

  var els = {
    callback:     document.getElementById('windowCallback'),
    toggle:       document.getElementById('windowCallbackToggle'),
    form:         document.getElementById('windowCallbackForm'),
    phone:        document.getElementById('windowCallbackPhone'),
    msg:          document.getElementById('windowCallbackMsg'),
  };
  if (!els.callback || !els.toggle || !els.form || !els.phone) return;

  // Probe with a no-body POST — the endpoint returns 404 when the
  // flag is off, 400 invalid-body when on. Same probe pattern as
  // window-photos.js / window-voice.js.
  fetch('/api/window/callback', { method: 'POST', credentials: 'same-origin' })
    .then(function (r) {
      if (r.status === 404) return false;
      return true;
    })
    .then(function (enabled) {
      if (enabled) els.callback.hidden = false;
    })
    .catch(function () { /* leave hidden */ });

  // Expand/collapse the form.
  els.toggle.addEventListener('click', function () {
    var expanded = els.toggle.getAttribute('aria-expanded') === 'true';
    els.toggle.setAttribute('aria-expanded', String(!expanded));
    els.form.hidden = expanded;
    if (!expanded) {
      els.phone.focus();
    }
  });

  function showMsg(text, isError) {
    if (!els.msg) return;
    els.msg.textContent = text;
    els.msg.hidden = false;
    if (isError) els.msg.classList.add('error');
    else els.msg.classList.remove('error');
  }

  els.form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var phone = els.phone.value.trim();
    var slot = els.form.querySelector('input[name="slot"]:checked');
    if (!phone) { showMsg(copy.invalidPhone, true); return; }
    if (!slot) return; // browser-level required will catch

    // Light client-side validation: digits + optional + prefix.
    // Server normalizes definitively; we just block the obvious
    // empties.
    var digitsOnly = phone.replace(/[^\d+]/g, '');
    if (digitsOnly.replace(/[^\d]/g, '').length < 7) {
      showMsg(copy.invalidPhone, true);
      return;
    }

    var submitBtn = els.form.querySelector('.window-composer__callback-submit');
    var origLabel = submitBtn ? submitBtn.textContent : copy.submit;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = copy.sending;
    }
    showMsg('', false);
    if (els.msg) els.msg.hidden = true;

    var params = new URLSearchParams();
    params.set('phone', phone);
    params.set('slot', slot.value);
    params.set('locale', locale);
    // If a voice memo was just recorded, attach it as the request's
    // voicenote so Don has context before calling. Voice attachIds
    // flow through the muntinPhotos collector (Phase 3.3 bridge).
    if (window.muntinPhotos && typeof window.muntinPhotos.collectAttachIds === 'function') {
      var ids = window.muntinPhotos.collectAttachIds();
      // Use the first voice attach id only — the callback request is
      // single-message context. Photos aren't relevant here (they're
      // visual; a callback doesn't need a photo).
      var voiceItems = window.muntinVoiceItems || [];
      if (voiceItems.length && voiceItems[0].attachId) {
        params.set('voiceAttachId', voiceItems[0].attachId);
      }
    }

    fetch('/api/window/callback', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
      .then(function (r) {
        return r.json().then(function (j) { return { status: r.status, body: j }; });
      })
      .then(function (res) {
        if (res.status === 200 && res.body && res.body.ok) {
          showMsg(copy.success, false);
          els.form.reset();
          els.form.hidden = true;
          els.toggle.setAttribute('aria-expanded', 'false');
          // Re-fetch the thread so the auto-confirmation message
          // renders without a manual refresh. window.js exposes
          // a loadThread on the body's bound script — simplest is
          // a poll bump via a custom event.
          try {
            window.dispatchEvent(new CustomEvent('muntin:window-thread-changed'));
          } catch (_) {}
          try {
            window.plausible && window.plausible('Window Callback Request', { props: { slot: res.body.slotLabel || 'unknown', locale: locale } });
          } catch (_) {}
        } else if (res.body && res.body.error === 'invalid-phone') {
          showMsg(copy.invalidPhone, true);
        } else {
          showMsg(copy.error + (res.body && res.body.error ? ' (' + res.body.error + ')' : ''), true);
        }
      })
      .catch(function () { showMsg(copy.error, true); })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = origLabel || copy.submit;
        }
      });
  });
})();
