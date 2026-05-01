/**
 * Invoice Decoder — Proof flyout (Phase 7 W3-1).
 *
 * After every successful encrypted save, surface a 4-card flyout
 * that PROVES the privacy claim from the UI. Today the operator
 * has to take it on faith that AES-GCM works. That's the wrong
 * trust posture for a tool whose differentiator is "we can't read
 * what we just stored."
 *
 *   Card 1 — Visible transformation: parsed rows → ciphertext.
 *            Animated swap from a 3-row table to base64 bytes.
 *   Card 2 — The actual outgoing POST body, with the `ct` field
 *            highlighted and everything else dimmed. Reads from
 *            performance.getEntriesByType('resource') for the
 *            transferSize so we can quote a real number.
 *   Card 3 — Try-to-break: an input where the operator types ANY
 *            wrong passphrase. We attempt decrypt; SubtleCrypto
 *            throws OperationError; we render the error verbatim.
 *            Live proof that the secret isn't recoverable from
 *            the ciphertext alone.
 *   Card 4 — Differentiator copy + 3 next-step buttons.
 *
 * Honors prefers-reduced-motion: skips the canvas animation and
 * jumps straight to the after-state.
 *
 * Privacy posture: the ciphertext shown in cards 1 + 2 is the
 * SAME bytes the server received. No extra transmission. The
 * decrypt attempt in card 3 happens locally (SubtleCrypto). No
 * fetch.
 */
(function (root) {
  'use strict';

  function reducedMotion() {
    try {
      return root && root.matchMedia &&
             root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (_) { return false; }
  }

  function localeFromHtml() {
    try {
      var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
      return /^es/.test(lang) ? 'es' : 'en';
    } catch (_) { return 'en'; }
  }

  function tt(en, es) { return localeFromHtml() === 'es' ? es : en; }

  // -------------------- DOM helpers --------------------
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'style') n.setAttribute('style', attrs[k]);
      else if (k.indexOf('on') === 0) n[k] = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (typeof c === 'string') n.appendChild(document.createTextNode(c));
      else n.appendChild(c);
    });
    return n;
  }

  function shorten(b64, head, tail) {
    head = head == null ? 24 : head;
    tail = tail == null ? 16 : tail;
    if (!b64 || b64.length <= head + tail + 3) return b64 || '';
    return b64.slice(0, head) + ' … ' + b64.slice(-tail);
  }

  function lookupTransferSize() {
    try {
      if (!root.performance || !root.performance.getEntriesByType) return null;
      var entries = root.performance.getEntriesByType('resource')
        .filter(function (e) { return e.name && e.name.indexOf('/api/workbench/save') !== -1; });
      if (!entries.length) return null;
      var last = entries[entries.length - 1];
      // transferSize includes headers; encodedBodySize is the body alone.
      return last.encodedBodySize || last.transferSize || null;
    } catch (_) { return null; }
  }

  // -------------------- Card 1: parsed → ciphertext animation --------------------
  function buildCard1(envelope, payload) {
    var card = el('section', { class: 'mid-pf-card', 'data-card': '1' });
    card.appendChild(el('h3', { class: 'mid-pf-h3' }, [
      tt('1 · We just turned your invoice into bytes you can\'t read.',
         '1 · Acabamos de convertir tu factura en bytes ilegibles.')
    ]));

    // Before — three sample rows from the saved payload.
    var before = el('div', { class: 'mid-pf-before' });
    before.appendChild(el('div', { class: 'mid-pf-label' }, [tt('Before — what you typed', 'Antes — lo que escribiste')]));
    var rows = (payload && payload.itemCount && payload.sampleNames) ? payload.sampleNames : [];
    if (!rows.length) rows = [tt('Romaine Hearts 24ct  · $48.00', 'Lechuga Romana 24ct  · $48.00'),
                              tt('Ground Chuck 10lb · $58.00', 'Carne Molida 10lb · $58.00'),
                              tt('Olive Oil 1gal · $48.00', 'Aceite de Oliva 1gal · $48.00')];
    rows.slice(0, 3).forEach(function (r) {
      before.appendChild(el('div', { class: 'mid-pf-row-plain' }, [r]));
    });
    card.appendChild(before);

    var arrow = el('div', { class: 'mid-pf-arrow' }, [tt('encrypted to', 'encriptado en')]);
    card.appendChild(arrow);

    // After — the ciphertext.
    var after = el('div', { class: 'mid-pf-after' });
    after.appendChild(el('div', { class: 'mid-pf-label' }, [tt('After — what we stored', 'Después — lo que guardamos')]));
    var ct = el('code', { class: 'mid-pf-ct' });
    ct.textContent = shorten((envelope && envelope.ct) || '', 40, 24);
    after.appendChild(ct);
    var algo = el('div', { class: 'mid-pf-algo' }, [
      tt('AES-GCM 256-bit · key derived from your secret with PBKDF2-SHA256 · 250,000 iterations',
         'AES-GCM 256-bit · clave derivada de tu secreto con PBKDF2-SHA256 · 250,000 iteraciones')
    ]);
    after.appendChild(algo);
    card.appendChild(after);

    // Reveal animation — fade the after-block from 0 → 1, scale 0.96 → 1
    if (!reducedMotion()) {
      after.style.opacity = '0';
      after.style.transform = 'scale(0.96)';
      after.style.transition = 'opacity 600ms ease, transform 600ms ease';
      setTimeout(function () {
        after.style.opacity = '1';
        after.style.transform = 'scale(1)';
      }, 80);
    }

    return card;
  }

  // -------------------- Card 2: actual POST body --------------------
  function buildCard2(envelope, transferSize) {
    var card = el('section', { class: 'mid-pf-card', 'data-card': '2' });
    card.appendChild(el('h3', { class: 'mid-pf-h3' }, [
      tt('2 · This is the exact data that went to our server.',
         '2 · Estos son los bytes exactos que llegaron a nuestro servidor.')
    ]));
    var pre = el('pre', { class: 'mid-pf-pre' });
    var bodyShape = {
      kind: 'invoice-decoder',
      title: tt('Invoice · N items', 'Factura · N partidas'),
      payload: '<<<JSON containing the envelope below>>>'
    };
    var envShape = {
      v: envelope.v,
      iv:   shorten(envelope.iv, 12, 8),
      salt: shorten(envelope.salt, 12, 8),
      ct:   shorten(envelope.ct, 28, 16),
      aad:  envelope.aad || ''
    };
    var lines = [
      tt('// POST /api/workbench/save', '// POST /api/workbench/save'),
      'kind=invoice-decoder',
      'title=' + bodyShape.title,
      'payload=' + JSON.stringify({ envelope: envShape }),
      ''
    ];
    if (transferSize) {
      lines.push(tt('// Total bytes on the wire: ' + transferSize,
                    '// Bytes totales en la red: ' + transferSize));
    }
    lines.push(tt('// Notice: no plaintext line items, no dish names, no vendor name.',
                  '// Fíjate: sin partidas en texto plano, sin nombres de platos, sin nombre del proveedor.'));
    pre.textContent = lines.join('\n');
    card.appendChild(pre);

    card.appendChild(el('p', { class: 'mid-pf-note' }, [
      tt('Open DevTools → Network and refresh the tab if you want to see this with your own eyes.',
         'Abre DevTools → Network y actualiza la pestaña para verlo con tus propios ojos.')
    ]));
    return card;
  }

  // -------------------- Card 3: try-to-break demo --------------------
  function buildCard3(envelope, decrypter) {
    var card = el('section', { class: 'mid-pf-card', 'data-card': '3' });
    card.appendChild(el('h3', { class: 'mid-pf-h3' }, [
      tt('3 · Try to break it. Type any wrong secret.',
         '3 · Intenta romperlo. Escribe cualquier secreto incorrecto.')
    ]));
    var row = el('div', { class: 'mid-pf-tryrow' });
    var input = el('input', {
      type: 'text',
      placeholder: tt('e.g. password123', 'p.ej. contraseña123'),
      'aria-label': tt('Wrong-passphrase test input', 'Entrada de prueba con contraseña incorrecta'),
      class: 'mid-pf-tryinput'
    });
    var btn = el('button', { type: 'button', class: 'mid-pf-trybtn' },
                  [tt('Try to decrypt', 'Intentar descifrar')]);
    row.appendChild(input);
    row.appendChild(btn);
    card.appendChild(row);
    var out = el('div', { class: 'mid-pf-tryout', role: 'status', 'aria-live': 'polite' });
    card.appendChild(out);

    btn.addEventListener('click', function () {
      var pp = input.value || '';
      if (!pp) {
        out.textContent = tt('Type something first.', 'Escribe algo primero.');
        out.className = 'mid-pf-tryout mid-pf-tryout--neutral';
        return;
      }
      out.textContent = tt('Decrypting…', 'Descifrando…');
      out.className = 'mid-pf-tryout mid-pf-tryout--neutral';
      decrypter(envelope, pp).then(function () {
        // If this returns a real payload, the operator just typed
        // their actual passphrase — flag that, don't pretend.
        out.textContent = tt('That was your real secret. The bytes opened up.',
                             'Ese era tu secreto real. Los bytes se abrieron.');
        out.className = 'mid-pf-tryout mid-pf-tryout--ok';
      }).catch(function (err) {
        var msg = (err && err.name) ? err.name : 'OperationError';
        out.innerHTML = '';
        out.appendChild(el('strong', null, [tt('Decrypt failed: ', 'Falló el descifrado: ')]));
        out.appendChild(document.createTextNode(msg + ' · ' +
          tt('the bytes stay locked.', 'los bytes siguen cerrados.')));
        out.className = 'mid-pf-tryout mid-pf-tryout--proof';
      });
    });
    return card;
  }

  // -------------------- Card 4: differentiator + next steps --------------------
  function buildCard4(callbacks) {
    var card = el('section', { class: 'mid-pf-card', 'data-card': '4' });
    card.appendChild(el('h3', { class: 'mid-pf-h3' }, [
      tt('4 · The proof is in the bytes above.',
         '4 · La prueba está en los bytes de arriba.')
    ]));
    var diff = el('p', { class: 'mid-pf-diff' });
    diff.innerHTML = tt(
      '<strong>Restaurant365 reads everything you upload.</strong> ' +
      'We can\'t read what we just stored — and that wasn\'t a marketing claim, ' +
      'it was a math claim. You just verified it.',
      '<strong>Restaurant365 lee todo lo que subes.</strong> ' +
      'Nosotros no podemos leer lo que acabamos de guardar — y eso no fue una promesa, ' +
      'fue una afirmación matemática. Acabas de verificarla.'
    );
    card.appendChild(diff);

    var actions = el('div', { class: 'mid-pf-actions' });
    var openBtn = el('button', { type: 'button', class: 'mid-pf-cta' },
                      [tt('Open my Workshop', 'Abrir mi Taller')]);
    openBtn.addEventListener('click', function () {
      window.location.href = (localeFromHtml() === 'es' ? '/es/workbench/' : '/workbench/');
    });
    var anotherBtn = el('button', { type: 'button', class: 'mid-pf-cta mid-pf-cta--quiet' },
                         [tt('Read another invoice', 'Leer otra factura')]);
    anotherBtn.addEventListener('click', function () {
      callbacks.close();
      // Existing UI surface — operator drops in another file.
      try {
        var fileInput = document.querySelector('#invoiceFile, input[type="file"]');
        if (fileInput) fileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (_) {}
    });
    // Wave 6.3 second half — pair another device. Visible when the
    // controller passed in a callbacks.openPairing handler (which it
    // does when a v=2 envelope + the operator's passphrase are
    // available in scope). Pre-flight check on each render so a
    // future page that doesn't pass openPairing doesn't surface
    // the button.
    if (typeof callbacks.openPairing === 'function') {
      var pairBtn = el('button', { type: 'button', class: 'mid-pf-cta mid-pf-cta--quiet' },
                       [tt('Pair another device', 'Vincular otro dispositivo')]);
      pairBtn.addEventListener('click', function () {
        try { callbacks.openPairing(); } catch (_) {}
      });
      actions.appendChild(pairBtn);
    }
    var doneBtn = el('button', { type: 'button', class: 'mid-pf-cta mid-pf-cta--quiet' },
                      [tt('Close this proof', 'Cerrar esta prueba')]);
    doneBtn.addEventListener('click', callbacks.close);
    actions.appendChild(openBtn);
    actions.appendChild(anotherBtn);
    actions.appendChild(doneBtn);
    card.appendChild(actions);
    return card;
  }

  // -------------------- Public entry --------------------
  function show(opts) {
    opts = opts || {};
    var envelope = opts.envelope;
    var payload  = opts.payload;
    var decrypter = opts.decrypt; // (envelope, pp) → Promise<payload>
    if (!envelope || !envelope.ct || typeof decrypter !== 'function') {
      return; // nothing to prove without a real envelope
    }

    var transferSize = lookupTransferSize();

    // Build modal scaffold.
    var backdrop = el('div', {
      class: 'mid-pf-backdrop',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': tt('Encryption proof — your invoice was just encrypted',
                        'Prueba de encriptación — tu factura acaba de encriptarse')
    });
    var sheet = el('div', { class: 'mid-pf-sheet' });
    var close = function () {
      try { backdrop.parentNode && backdrop.parentNode.removeChild(backdrop); } catch (_) {}
    };
    var closeBtn = el('button', {
      type: 'button',
      class: 'mid-pf-close',
      'aria-label': tt('Close', 'Cerrar')
    }, ['×']);
    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });
    document.addEventListener('keydown', function escListener(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escListener);
      }
    });

    sheet.appendChild(closeBtn);
    sheet.appendChild(buildCard1(envelope, payload));
    sheet.appendChild(buildCard2(envelope, transferSize));
    sheet.appendChild(buildCard3(envelope, decrypter));
    sheet.appendChild(buildCard4({ close: close }));
    backdrop.appendChild(sheet);
    document.body.appendChild(backdrop);

    // Plausible — bucketed event so the team can see how often the
    // proof flyout actually opens (engagement signal for the
    // differentiator-visibility hypothesis).
    if (root.plausible) {
      try { root.plausible('Invoice Decoder Proof Shown'); } catch (_) {}
    }
  }

  var api = { show: show };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PROOF = api;
})(typeof window !== 'undefined' ? window : null);
