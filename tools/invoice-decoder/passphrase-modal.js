/**
 * Passphrase modal — Phase 7 W1-6.
 *
 * Replaces the genuinely awful `window.prompt()` flow that
 * shipped in Phase 6 W6-3. The audit found:
 *
 *   - no strength meter
 *   - no confirm-input (typos lock the file forever)
 *   - no "we never see this" messaging in-context
 *   - no session memory (prompt repeats every save)
 *   - chars masked by browser default; can't verify they typed
 *     "secret" vs "secrer"
 *
 * This module exposes a single async function MID_PASS.ask({mode})
 * resolving to a passphrase string OR null (operator cancelled).
 *
 *   MID_PASS.ask({ mode: 'create' })   — for first save: requires
 *                                        confirm input + ≥8 chars
 *                                        + heuristic strength
 *                                        meter ≥ medium
 *   MID_PASS.ask({ mode: 'unlock' })   — for decrypt-and-reload:
 *                                        single input, no confirm
 *
 * Heuristic strength meter (no ZXCVBN dependency — keeps the
 * tool's lazy-load surface small): length tiers + character-class
 * count + common-password blocklist. ≥ medium gates the create
 * mode submit. If real-world data shows operators picking weak
 * passphrases despite the meter, swap to ZXCVBN in a follow-up.
 *
 * Privacy posture: zero fetch. Zero localStorage. The passphrase
 * never leaves this module's promise resolution. Module-scope
 * caching for session-memory reuse is W1-7's job; this module
 * just asks and resolves.
 */
(function (root) {
  'use strict';

  // Top-100 common-passwords blocklist (truncated). When the
  // input matches case-insensitively, force strength to "weak"
  // even if length + classes would otherwise score higher.
  // Sourced from public NIST + breach-corpus aggregations.
  var COMMON_BLOCKLIST = new Set([
    'password', 'password1', '12345678', '123456789', 'qwerty',
    'letmein', 'welcome', 'monkey', '1234567890', 'football',
    'abc123', 'iloveyou', 'admin', 'login', 'hello', 'master',
    'qwertyuiop', 'sunshine', 'princess', 'dragon', 'shadow',
    'hottie', 'starwars', 'whatever', 'flower', 'jordan23',
    'killer', 'soccer', 'family', 'mustang', 'passw0rd',
    'asdfghjkl', '1q2w3e4r', 'baseball', 'restaurant', 'kitchen'
  ]);

  function classifyStrength(pp) {
    if (!pp) return { score: 0, label: 'empty', labelEs: 'vacío' };
    var len = pp.length;
    var classes = 0;
    if (/[a-z]/.test(pp)) classes++;
    if (/[A-Z]/.test(pp)) classes++;
    if (/[0-9]/.test(pp)) classes++;
    if (/[^A-Za-z0-9]/.test(pp)) classes++;

    // Common-password short-circuit.
    if (COMMON_BLOCKLIST.has(pp.toLowerCase())) {
      return { score: 1, label: 'weak — too common', labelEs: 'débil — muy común' };
    }

    // Length tier dominates; classes tier breaks ties.
    var lengthScore;
    if      (len < 4)  lengthScore = 0;
    else if (len < 8)  lengthScore = 1;
    else if (len < 12) lengthScore = 2;
    else if (len < 16) lengthScore = 3;
    else               lengthScore = 4;

    var classScore;
    if      (classes <= 1) classScore = 1;
    else if (classes === 2) classScore = 2;
    else if (classes === 3) classScore = 3;
    else                    classScore = 4;

    var score = Math.min(4, Math.max(lengthScore, classScore - 1));

    var labels  = ['too short', 'weak', 'medium', 'strong', 'very strong'];
    var labelsEs= ['muy corto', 'débil', 'medio',  'fuerte', 'muy fuerte'];
    return { score: score, label: labels[score], labelEs: labelsEs[score] };
  }

  // Detect locale from <html lang>. Identical pattern to the
  // controller's `tt()` helper.
  function locale() {
    return (typeof document !== 'undefined' && document.documentElement
      && document.documentElement.getAttribute('lang') === 'es') ? 'es' : 'en';
  }
  function tt(en, es) { return locale() === 'es' ? es : en; }

  // CSS injected once on first ask(). Tool-prefixed .midpass-* so
  // it doesn't leak into other surfaces.
  var CSS = '\
.midpass-back{position:fixed;inset:0;background:rgba(20,22,26,0.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;backdrop-filter:blur(4px)}\
.midpass-card{width:100%;max-width:480px;background:var(--white,#FFF);border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,0.30);padding:28px 28px 24px;font:inherit}\
.midpass-eyebrow{font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--teal,#1F4E5B);margin:0 0 8px}\
.midpass-title{font-family:var(--font-display,Georgia);font-size:22px;font-weight:500;color:var(--ink,#14161A);margin:0 0 6px;line-height:1.2}\
.midpass-body{font-size:14px;color:var(--ink-soft,#5C6470);margin:0 0 18px;line-height:1.55}\
.midpass-row{position:relative;margin:0 0 12px}\
.midpass-label{display:block;font-size:12px;font-weight:600;color:var(--ink,#14161A);margin:0 0 6px;letter-spacing:0.02em}\
.midpass-input{width:100%;padding:12px 44px 12px 14px;border:1px solid var(--line-dark,#C8C2B6);border-radius:8px;font:inherit;font-size:15px;color:var(--ink,#14161A);background:var(--white,#FFF);box-sizing:border-box;letter-spacing:0.04em}\
.midpass-input:focus{outline:2px solid color-mix(in srgb,var(--teal,#1F4E5B) 35%,transparent);outline-offset:1px;border-color:var(--teal,#1F4E5B)}\
.midpass-reveal{position:absolute;right:8px;top:30px;padding:6px 10px;border:0;background:transparent;cursor:pointer;color:var(--ink-soft,#5C6470);font-size:12px;font-weight:600;border-radius:4px}\
.midpass-reveal:hover{background:var(--cream-2,#F2EEE5);color:var(--ink,#14161A)}\
.midpass-meter{display:flex;gap:4px;margin:6px 0 0}\
.midpass-meter span{flex:1;height:5px;background:var(--line,#E8E2D6);border-radius:999px;transition:background 200ms}\
.midpass-meter[data-score="1"] span:nth-child(-n+1),\
.midpass-meter[data-score="2"] span:nth-child(-n+2),\
.midpass-meter[data-score="3"] span:nth-child(-n+3),\
.midpass-meter[data-score="4"] span:nth-child(-n+4){background:var(--teal,#1F4E5B)}\
.midpass-meter[data-score="1"] span:nth-child(-n+1){background:#B25C2A}\
.midpass-meter[data-score="2"] span:nth-child(-n+2){background:#C89A3C}\
.midpass-meter-label{font-size:11.5px;color:var(--ink-soft,#5C6470);margin:4px 0 0;font-variant-caps:all-small-caps;letter-spacing:0.06em}\
.midpass-trust{margin:14px 0 18px;padding:10px 12px;background:var(--cream-2,#F2EEE5);border-left:3px solid var(--teal,#1F4E5B);border-radius:6px;font-size:12.5px;color:var(--ink-soft,#5C6470);line-height:1.5}\
.midpass-trust strong{color:var(--ink,#14161A)}\
.midpass-actions{display:flex;gap:10px;justify-content:flex-end}\
.midpass-cancel{padding:10px 16px;border:1px solid var(--line-dark,#C8C2B6);border-radius:999px;background:transparent;font:inherit;font-size:14px;font-weight:500;color:var(--ink,#14161A);cursor:pointer}\
.midpass-cancel:hover{background:var(--cream-2,#F2EEE5)}\
.midpass-submit{padding:10px 22px;border:0;border-radius:999px;background:var(--ink,#14161A);font:inherit;font-size:14px;font-weight:600;color:var(--cream,#FAF6EE);cursor:pointer}\
.midpass-submit:hover{background:var(--teal,#1F4E5B)}\
.midpass-submit[disabled]{opacity:0.45;cursor:not-allowed}\
.midpass-error{margin:6px 0 0;font-size:12px;color:var(--rust,#B25C2A);min-height:1em}\
.midpass-recover{margin:14px 0 0;font-size:11.5px;color:var(--ink-soft,#5C6470);line-height:1.5}\
';

  var __cssInjected = false;
  function injectCss() {
    if (__cssInjected) return;
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    __cssInjected = true;
  }

  // Returns a Promise<string|null>. mode: 'create' | 'unlock'.
  function ask(opts) {
    opts = opts || {};
    var mode = opts.mode === 'unlock' ? 'unlock' : 'create';
    injectCss();

    return new Promise(function (resolve) {
      var back = document.createElement('div');
      back.className = 'midpass-back';
      back.setAttribute('role', 'dialog');
      back.setAttribute('aria-modal', 'true');
      back.setAttribute('aria-labelledby', 'midpass-title');

      var title = mode === 'create'
        ? tt('Pick a secret to lock this invoice', 'Elige un secreto para bloquear esta factura')
        : tt('Unlock your saved invoice', 'Desbloquea tu factura guardada');
      var body = mode === 'create'
        ? tt('Pick something memorable. We never see it. Without it, your saved invoice is unreadable — even by us.',
             'Elige algo que recuerdes. Nunca lo vemos. Sin él, tu factura guardada queda ilegible — incluso para nosotros.')
        : tt('Type the secret you used when you saved this invoice.',
             'Escribe el secreto que usaste cuando guardaste esta factura.');

      var html = '<div class="midpass-card">' +
        '<p class="midpass-eyebrow">' + (mode === 'create'
          ? tt('Encrypt before save', 'Encriptar antes de guardar')
          : tt('Decrypt to read', 'Desencriptar para leer')) + '</p>' +
        '<h2 id="midpass-title" class="midpass-title">' + title + '</h2>' +
        '<p class="midpass-body">' + body + '</p>' +
        '<div class="midpass-row">' +
          '<label class="midpass-label" for="midpass-input">' + tt('Your secret', 'Tu secreto') + '</label>' +
          '<input id="midpass-input" class="midpass-input" type="password" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false" />' +
          '<button type="button" class="midpass-reveal" data-act="reveal" aria-pressed="false">' + tt('show', 'ver') + '</button>' +
          (mode === 'create' ? '<div class="midpass-meter" data-score="0"><span></span><span></span><span></span><span></span></div>' +
                               '<p class="midpass-meter-label" id="midpass-meter-label">' + tt('strength: empty', 'fuerza: vacío') + '</p>' : '') +
        '</div>' +
        (mode === 'create'
          ? '<div class="midpass-row">' +
              '<label class="midpass-label" for="midpass-confirm">' + tt('Type it again', 'Escríbelo de nuevo') + '</label>' +
              '<input id="midpass-confirm" class="midpass-input" type="password" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false" />' +
            '</div>'
          : '') +
        '<p class="midpass-trust">🔒 <strong>' + tt('We never see this secret.', 'Nunca vemos este secreto.') + '</strong> ' +
          tt('SubtleCrypto runs in your browser. The server stores opaque ciphertext — we cannot decrypt it.',
             'SubtleCrypto corre en tu navegador. El servidor guarda solo ciphertext opaco — no podemos desencriptarlo.') + '</p>' +
        '<p class="midpass-error" id="midpass-error"></p>' +
        '<div class="midpass-actions">' +
          '<button type="button" class="midpass-cancel" data-act="cancel">' + tt('Cancel', 'Cancelar') + '</button>' +
          '<button type="button" class="midpass-submit" data-act="submit" disabled>' +
            (mode === 'create' ? tt('Lock & save', 'Bloquear y guardar') : tt('Unlock', 'Desbloquear')) +
          '</button>' +
        '</div>' +
        (mode === 'create'
          ? '<p class="midpass-recover">' + tt(
              'Forget your secret? Your saved invoice becomes unrecoverable. Save the secret in a password manager.',
              '¿Olvidas el secreto? La factura guardada queda irrecuperable. Guárdalo en un gestor de contraseñas.'
            ) + '</p>'
          : '') +
        '</div>';
      back.innerHTML = html;
      document.body.appendChild(back);
      var input    = back.querySelector('#midpass-input');
      var confirm  = back.querySelector('#midpass-confirm');
      var meter    = back.querySelector('.midpass-meter');
      var meterLbl = back.querySelector('#midpass-meter-label');
      var errorEl  = back.querySelector('#midpass-error');
      var submit   = back.querySelector('[data-act="submit"]');
      var cancel   = back.querySelector('[data-act="cancel"]');
      var reveal   = back.querySelector('[data-act="reveal"]');
      var trapKeys = function (e) {
        if (e.key === 'Escape') { cleanup(null); }
        if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName === 'INPUT') {
          e.preventDefault();
          attemptSubmit();
        }
      };
      function update() {
        var pp = input.value;
        if (mode === 'create') {
          var s = classifyStrength(pp);
          meter.dataset.score = String(s.score);
          var lbl = locale() === 'es' ? s.labelEs : s.label;
          meterLbl.textContent = tt('strength: ', 'fuerza: ') + lbl;
          var ok = pp.length >= 8 && s.score >= 2 && confirm.value === pp;
          submit.disabled = !ok;
          if (pp.length >= 1 && pp.length < 8) errorEl.textContent = tt('At least 8 characters.', 'Al menos 8 caracteres.');
          else if (pp.length >= 8 && s.score < 2) errorEl.textContent = tt('Pick something stronger — mix letters, numbers, or symbols.', 'Elige algo más fuerte — mezcla letras, números o símbolos.');
          else if (confirm.value && confirm.value !== pp) errorEl.textContent = tt('The two entries don\'t match yet.', 'Los dos no coinciden aún.');
          else errorEl.textContent = '';
        } else {
          submit.disabled = pp.length < 1;
          errorEl.textContent = '';
        }
      }
      function attemptSubmit() {
        if (submit.disabled) return;
        var pp = input.value;
        cleanup(pp);
      }
      function cleanup(value) {
        document.removeEventListener('keydown', trapKeys);
        try { back.remove(); } catch (_) {}
        // Wipe the inputs to make sure we don't leak via the DOM tree.
        try { input.value = ''; if (confirm) confirm.value = ''; } catch (_) {}
        resolve(value);
      }
      input.addEventListener('input', update);
      if (confirm) confirm.addEventListener('input', update);
      submit.addEventListener('click', attemptSubmit);
      cancel.addEventListener('click', function () { cleanup(null); });
      back.addEventListener('click', function (e) { if (e.target === back) cleanup(null); });
      reveal.addEventListener('click', function () {
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        if (confirm) confirm.type = input.type;
        reveal.textContent = showing ? tt('show', 'ver') : tt('hide', 'ocultar');
        reveal.setAttribute('aria-pressed', String(!showing));
      });
      document.addEventListener('keydown', trapKeys);
      // Defer focus so iOS Safari opens the keyboard reliably.
      setTimeout(function () { input.focus(); }, 30);
    });
  }

  // -------------------- W1-7: session-memory cache --------------------
  // Module-scope (NEVER localStorage / sessionStorage). 30-min
  // idle expiry refreshes on every successful use. The audit
  // found that retyping the passphrase on every save was real
  // friction; this cache means: tap Save → first save asks →
  // tap Save again within 30 min → re-uses without asking.
  //
  // Exposed surface:
  //   MID_PASS.askWithMemory({mode}) — uses cache when fresh,
  //     re-prompts on miss + checkbox "Use this same secret as
  //     before? [Yes, save] [Different secret]" affordance after
  //     first save.
  //   MID_PASS.remember(pp) — explicit set (called by askWithMemory
  //     on successful resolve)
  //   MID_PASS.forget() — clears cache (called by W3-6 logout
  //     hook + by clear-on-beforeunload)
  //   MID_PASS.hasMemory() — whether a fresh entry exists right
  //     now (drives the "Use same secret as before" checkbox)
  //
  // Critically: the cache holds the cleartext passphrase in a
  // module-scope variable. It IS in JS memory; it is NOT in
  // any persistent store. Tab close = cache gone. 30 min idle
  // = cache gone. Explicit forget() = cache gone.
  var __ppMemory = null;
  var __ppExpiresAt = 0;
  var IDLE_MS = 30 * 60 * 1000;

  function hasMemory() {
    if (!__ppMemory) return false;
    if (Date.now() > __ppExpiresAt) { __ppMemory = null; return false; }
    return true;
  }
  function remember(pp) {
    if (typeof pp !== 'string' || pp.length < 8) return;
    __ppMemory = pp;
    __ppExpiresAt = Date.now() + IDLE_MS;
  }
  function forget() {
    __ppMemory = null;
    __ppExpiresAt = 0;
  }
  function askWithMemory(opts) {
    opts = opts || {};
    // Cache hit + create-mode + opts.allowReuse !== false →
    // surface a confirm chip first; on accept, refresh expiry
    // and resolve with the cached value.
    if (opts.allowReuse !== false && hasMemory() && opts.mode === 'create') {
      return askReuseConfirmation().then(function (decision) {
        if (decision === 'reuse') {
          __ppExpiresAt = Date.now() + IDLE_MS; // refresh expiry on re-use
          return __ppMemory;
        }
        if (decision === 'cancel') return null;
        // 'different' → fall through to a fresh ask.
        return ask(opts).then(function (fresh) {
          if (fresh) remember(fresh);
          return fresh;
        });
      });
    }
    // No cache OR unlock mode: just ask. On success, remember
    // (so the *next* save can reuse).
    return ask(opts).then(function (fresh) {
      if (fresh && opts.mode === 'create') remember(fresh);
      return fresh;
    });
  }
  // Tiny inline confirmation modal — NOT the full passphrase
  // input; just a yes/no chip. Lives at the same z-index as the
  // main modal, dismissable.
  function askReuseConfirmation() {
    injectCss();
    return new Promise(function (resolve) {
      var back = document.createElement('div');
      back.className = 'midpass-back';
      back.setAttribute('role', 'dialog');
      back.setAttribute('aria-modal', 'true');
      back.innerHTML = '<div class="midpass-card">' +
        '<p class="midpass-eyebrow">' + tt('Use same secret?', '¿Usar el mismo secreto?') + '</p>' +
        '<h2 class="midpass-title">' + tt('Lock with the same secret as before?', '¿Bloquear con el mismo secreto que antes?') + '</h2>' +
        '<p class="midpass-body">' + tt(
          'You set a secret a few minutes ago. Use it again so you don\'t have to retype, or pick a different one for this invoice.',
          'Pusiste un secreto hace unos minutos. Úsalo de nuevo para no retipear, o elige uno diferente para esta factura.'
        ) + '</p>' +
        '<p class="midpass-trust">🔒 <strong>' + tt('Still on your device.', 'Sigue en tu dispositivo.') + '</strong> ' +
        tt('The secret never left your browser. We just remembered it for the next 30 minutes.',
           'El secreto nunca salió del navegador. Solo lo recordamos por los próximos 30 minutos.') + '</p>' +
        '<div class="midpass-actions">' +
          '<button type="button" class="midpass-cancel" data-act="different">' + tt('Different secret', 'Secreto diferente') + '</button>' +
          '<button type="button" class="midpass-submit" data-act="reuse">' + tt('Yes, use it', 'Sí, úsalo') + '</button>' +
        '</div>' +
        '</div>';
      document.body.appendChild(back);
      function cleanup(decision) {
        try { back.remove(); } catch (_) {}
        resolve(decision);
      }
      back.addEventListener('click', function (e) {
        if (e.target === back) return cleanup('cancel');
        var act = e.target && e.target.dataset && e.target.dataset.act;
        if (act === 'reuse') cleanup('reuse');
        else if (act === 'different') cleanup('different');
      });
      var trapKeys = function (e) { if (e.key === 'Escape') { document.removeEventListener('keydown', trapKeys); cleanup('cancel'); } };
      document.addEventListener('keydown', trapKeys);
    });
  }

  // Forget on tab close. Also called by W3-6 logout hook +
  // clear-on-logout flow.
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', forget);
  }

  // Surface the strength function so encrypt.js (or tests) can
  // sanity-check programmatically without rendering the modal.
  var api = {
    ask: ask,
    askWithMemory: askWithMemory,
    remember: remember,
    forget: forget,
    hasMemory: hasMemory,
    classifyStrength: classifyStrength,
    _COMMON_BLOCKLIST: COMMON_BLOCKLIST
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PASS = api;
})(typeof window !== 'undefined' ? window : null);
