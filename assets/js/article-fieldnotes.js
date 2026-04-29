// Phase F.4 (Field Notes) — client-side form lifecycle.
//
// Loaded only on blog articles. Reads the data-fnenabled attribute
// stamped by inject-article-fieldnote-form.mjs; if absent (paused
// state) the script no-ops. Otherwise it:
//   1. Calls /api/auth/me.
//   2. If 200 → reveals the form. Pre-fills name with email's local
//      part. Wires word counter and submit handler.
//   3. If 401 → reveals the sign-in CTA.
//   4. POSTs to /api/submission/create on submit, surfaces specific
//      error codes inline (no modal, no alert).
//
// The form posts standard form-encoded bodies so visitors with JS
// disabled but a session can still submit.

(function () {
  'use strict';

  const root = document.querySelector('.field-notes-submit[data-fnenabled="true"]');
  if (!root) return;

  const locale = root.getAttribute('data-locale') === 'es' ? 'es' : 'en';
  const slug   = root.getAttribute('data-article-slug') || '';
  const form   = root.querySelector('.js-field-notes-form');
  const signin = root.querySelector('.js-field-notes-signin');
  const counter = root.querySelector('.js-field-notes-counter');
  const msg    = root.querySelector('.js-field-notes-msg');
  const nameEl = form && form.querySelector('input[name="authorDisplayName"]');
  const bodyEl = form && form.querySelector('textarea[name="body"]');
  const submitBtn = form && form.querySelector('button[type="submit"]');

  const COPY = {
    en: {
      counter: (n) => `${n} word${n === 1 ? '' : 's'} (need 100–400)`,
      counterOk: (n) => `${n} words ✓`,
      submitting: 'Sending…',
      submit: 'Send to Don',
      success: "Filed. You'll see it in your Workshop as 'pending' — Don gets to it within a week.",
      errors: {
        'word-count-out-of-range': 'Notes must be 100–400 words.',
        'url-not-allowed': 'Notes can only contain plain text — no links, please.',
        'display-name-empty': 'Please add a name to credit your note.',
        'display-name-too-long': 'Name is too long (40 chars max).',
        'display-name-html': 'Name can only contain plain text.',
        'display-name-url': 'Name can only contain plain text.',
        'unknown-article': 'Field notes are not enabled for this article.',
        'invalid-locale': 'Field notes are not enabled for this language.',
        'limit-reached': "You've reached the field-note limit. Try again later.",
        'rate-limited': 'Too many submissions in a short window. Try again in a bit.',
        'forbidden-origin': 'Submission blocked by origin check.',
        'unauthenticated': 'Please sign in to submit a field note.',
        'not-found': 'Field notes are paused right now.',
        'default': "Couldn't send right now. Try again in a moment.",
      },
    },
    es: {
      counter: (n) => `${n} palabra${n === 1 ? '' : 's'} (se necesita 100–400)`,
      counterOk: (n) => `${n} palabras ✓`,
      submitting: 'Enviando…',
      submit: 'Enviar a Don',
      success: "Archivado. Aparecerá en tu Taller como 'pendiente' — Don llega a él en una semana.",
      errors: {
        'word-count-out-of-range': 'El apunte debe tener entre 100 y 400 palabras.',
        'url-not-allowed': 'El apunte solo puede contener texto simple — sin enlaces.',
        'display-name-empty': 'Agrega un nombre para acreditar tu apunte.',
        'display-name-too-long': 'El nombre es demasiado largo (máximo 40 caracteres).',
        'display-name-html': 'El nombre solo puede contener texto simple.',
        'display-name-url': 'El nombre solo puede contener texto simple.',
        'unknown-article': 'Los apuntes no están habilitados para este artículo.',
        'invalid-locale': 'Los apuntes no están habilitados para este idioma.',
        'limit-reached': 'Llegaste al límite de apuntes. Inténtalo de nuevo más tarde.',
        'rate-limited': 'Demasiados envíos en poco tiempo. Inténtalo en un momento.',
        'forbidden-origin': 'Envío bloqueado por verificación de origen.',
        'unauthenticated': 'Inicia sesión para enviar un apunte.',
        'not-found': 'Los apuntes están en pausa.',
        'default': 'No se pudo enviar ahora. Intenta de nuevo en un momento.',
      },
    },
  };

  const copy = COPY[locale];

  function showMsg(text, isError) {
    if (!msg) return;
    msg.textContent = text;
    msg.hidden = false;
    if (isError) msg.classList.add('error'); else msg.classList.remove('error');
  }

  function countWords(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  function updateCounter() {
    if (!counter || !bodyEl) return;
    const n = countWords(bodyEl.value);
    counter.textContent = (n >= 100 && n <= 400) ? copy.counterOk(n) : copy.counter(n);
    counter.classList.toggle('ok', n >= 100 && n <= 400);
  }

  function localPart(email) {
    return String(email || '').split('@')[0] || '';
  }

  fetch('/api/auth/me', { credentials: 'same-origin' })
    .then((r) => r.status === 200 ? r.json() : null)
    .then((j) => {
      if (j && j.email) {
        if (form) {
          form.hidden = false;
          if (signin) signin.hidden = true;
          if (nameEl && !nameEl.value) nameEl.value = localPart(j.email);
          if (bodyEl) bodyEl.addEventListener('input', updateCounter);
          updateCounter();
        }
      } else {
        if (signin) signin.hidden = false;
        if (form) form.hidden = true;
      }
    })
    .catch(() => {
      // Auth check failed (offline, etc): show signin as a safe default.
      if (signin) signin.hidden = false;
      if (form) form.hidden = true;
    });

  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!submitBtn || !bodyEl || !nameEl) return;
      const wc = countWords(bodyEl.value);
      if (wc < 100 || wc > 400) {
        showMsg(copy.errors['word-count-out-of-range'], true);
        return;
      }
      submitBtn.disabled = true;
      const originalLabel = submitBtn.textContent;
      submitBtn.textContent = copy.submitting;
      showMsg('', false);
      msg.hidden = true;

      const fd = new FormData(form);
      const params = new URLSearchParams();
      fd.forEach((v, k) => params.append(k, v));

      fetch('/api/submission/create', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }).then((r) => r.json().then((j) => ({ status: r.status, body: j })))
        .then(({ status, body }) => {
          if (status === 200 && body && body.ok) {
            // Replace form with success copy.
            form.hidden = true;
            showMsg(copy.success, false);
            // Plausible best-effort.
            try {
              if (typeof window !== 'undefined' && typeof window.plausible === 'function') {
                window.plausible('Submission Created', { props: { kind: 'submission', locale } });
              }
            } catch (_) {}
            return;
          }
          const code = (body && body.error) || 'default';
          const errCopy = copy.errors[code] || copy.errors['default'];
          showMsg(errCopy, true);
        })
        .catch(() => {
          showMsg(copy.errors['default'], true);
        })
        .finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }
})();
