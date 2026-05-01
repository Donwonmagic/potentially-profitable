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
.midpass-recover{margin:14px 0 0;padding:12px 14px;font-size:12px;color:var(--ink-soft,#5C6470);line-height:1.55;background:#fbf5e8;border:1px solid #ebd9b6;border-radius:8px}\
.midpass-recover-lead{margin:0 0 8px;color:var(--ink,#14161A);font-size:12.5px}\
.midpass-recover-lead strong{color:var(--ink,#14161A)}\
.midpass-recover-action{margin:0 0 6px;font-weight:500;color:var(--ink,#14161A)}\
.midpass-pm-links{display:flex;flex-wrap:wrap;gap:6px}\
.midpass-pm{font-size:12px;padding:5px 10px;border:1px solid var(--line,#dcd2bf);border-radius:6px;text-decoration:none;color:var(--ink,#14161A);background:#fff;font-weight:500}\
.midpass-pm:hover{background:var(--ink,#14161A);color:#fff;border-color:var(--ink,#14161A)}\
.midpass-input--recovery{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;line-height:1.6;letter-spacing:0;padding:10px 12px;resize:vertical;min-height:88px}\
.midpass-recovery-link{margin:8px 0 0;font-size:12.5px}\
.midpass-link{color:var(--accent,#1F6F6A);text-decoration:underline;cursor:pointer}\
.midpass-link:hover{color:var(--ink,#14161A)}\
.midpass-card--recovery{max-width:560px}\
.midpass-words{list-style:none;margin:14px 0 18px;padding:14px 16px;background:#FFF6E5;border:1px solid #E8C97A;border-radius:8px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px 14px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:14px;line-height:1.4}\
@media(max-width:540px){.midpass-words{grid-template-columns:repeat(2,1fr)}}\
.midpass-word{display:flex;align-items:baseline;gap:6px}\
.midpass-word-n{font-size:11px;color:var(--ink-soft,#5C6470);min-width:18px;font-variant-numeric:tabular-nums}\
.midpass-word-w{color:var(--ink,#14161A);font-weight:500}\
.midpass-secondary{padding:9px 14px;border:1px solid var(--ink-soft,#5C6470);border-radius:999px;background:#fff;color:var(--ink,#14161A);font:inherit;font-size:13px;font-weight:500;cursor:pointer}\
.midpass-secondary:hover{border-color:var(--accent,#1F6F6A);color:var(--accent,#1F6F6A)}\
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

      // Wave 6.3 — recovery-phrase mode is a sub-state of unlock that
      // shows a 24-word textarea instead of a password input.
      var subMode = opts.subMode === 'recovery' ? 'recovery' : null;

      var title = mode === 'create'
        ? tt('Pick a secret to lock this invoice', 'Elige un secreto para bloquear esta factura')
        : (subMode === 'recovery'
            ? tt('Type your 24-word recovery phrase', 'Escribe tu frase de recuperación de 24 palabras')
            : tt('Unlock your saved invoice', 'Desbloquea tu factura guardada'));
      var body = mode === 'create'
        ? tt('Pick something memorable. We never see it. Without it, your saved invoice is unreadable — even by us.',
             'Elige algo que recuerdes. Nunca lo vemos. Sin él, tu factura guardada queda ilegible — incluso para nosotros.')
        : (subMode === 'recovery'
            ? tt('Paste the recovery phrase you saved when you first locked this invoice. Lowercase, single spaces; we accept any whitespace.',
                 'Pega la frase de recuperación que guardaste al bloquear esta factura. Minúsculas, espacios sencillos; aceptamos cualquier espaciado.')
            : tt('Type the secret you used when you saved this invoice.',
                 'Escribe el secreto que usaste cuando guardaste esta factura.'));

      var html = '<div class="midpass-card">' +
        '<p class="midpass-eyebrow">' + (mode === 'create'
          ? tt('Encrypt before save', 'Encriptar antes de guardar')
          : tt('Decrypt to read', 'Desencriptar para leer')) + '</p>' +
        '<h2 id="midpass-title" class="midpass-title">' + title + '</h2>' +
        '<p class="midpass-body">' + body + '</p>' +
        '<div class="midpass-row">' +
          '<label class="midpass-label" for="midpass-input">' +
            (subMode === 'recovery' ? tt('Recovery phrase', 'Frase de recuperación') : tt('Your secret', 'Tu secreto')) +
          '</label>' +
          (subMode === 'recovery'
            ? '<textarea id="midpass-input" class="midpass-input midpass-input--recovery" rows="4" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + tt('twenty-four lowercase words separated by spaces', 'veinticuatro palabras en minúsculas separadas por espacios') + '"></textarea>'
            : '<input id="midpass-input" class="midpass-input" type="password" autocomplete="new-password" autocapitalize="off" autocorrect="off" spellcheck="false" />') +
          (subMode === 'recovery' ? '' : '<button type="button" class="midpass-reveal" data-act="reveal" aria-pressed="false">' + tt('show', 'ver') + '</button>') +
          (mode === 'create' ? '<button type="button" class="midpass-generate" id="midpass-generate" aria-label="' + tt('Generate a memorable passphrase', 'Generar una contraseña memorable') + '">' + tt('Suggest one', 'Sugerir una') + '</button>' : '') +
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
        // Wave 6.3 — recovery-phrase escape hatch on unlock.
        (mode === 'unlock'
          ? '<p class="midpass-recovery-link">' +
              (subMode === 'recovery'
                ? '<a href="#" id="midpass-use-passphrase" class="midpass-link">' +
                    tt('Use my passphrase instead', 'Usar mi contraseña en su lugar') +
                  '</a>'
                : '<a href="#" id="midpass-use-recovery" class="midpass-link">' +
                    tt('Forgot it? Use your 24-word recovery phrase', '¿La olvidaste? Usa tu frase de recuperación de 24 palabras') +
                  '</a>') +
            '</p>'
          : '') +
        '<div class="midpass-actions">' +
          '<button type="button" class="midpass-cancel" data-act="cancel">' + tt('Cancel', 'Cancelar') + '</button>' +
          '<button type="button" class="midpass-submit" data-act="submit" disabled>' +
            (mode === 'create'
              ? tt('Lock & save', 'Bloquear y guardar')
              : (subMode === 'recovery' ? tt('Unlock with recovery phrase', 'Desbloquear con la frase') : tt('Unlock', 'Desbloquear'))) +
          '</button>' +
        '</div>' +
        (mode === 'create'
          ? '<div class="midpass-recover">' +
              '<p class="midpass-recover-lead"><strong>' +
                tt('If you forget this secret, your saved invoice is unrecoverable.',
                   'Si olvidas este secreto, la factura guardada queda irrecuperable.') +
              '</strong> ' +
                tt('Even we can\'t help — the math we use means there\'s no master key on our end.',
                   'Ni siquiera nosotros podemos ayudarte — la matemática que usamos no tiene llave maestra de nuestro lado.') +
              '</p>' +
              '<p class="midpass-recover-action">' +
                tt('Save it in a password manager:', 'Guárdalo en un gestor de contraseñas:') +
              '</p>' +
              '<div class="midpass-pm-links">' +
                '<a class="midpass-pm" href="https://bitwarden.com/help/" target="_blank" rel="noopener noreferrer">Bitwarden</a>' +
                '<a class="midpass-pm" href="https://support.1password.com/" target="_blank" rel="noopener noreferrer">1Password</a>' +
                '<a class="midpass-pm" href="https://support.apple.com/guide/iphone/keep-passwords-passkeys-and-codes-secure-iphd5d8daf4f/ios" target="_blank" rel="noopener noreferrer">iCloud ' + tt('Keychain', 'Llaveros') + '</a>' +
              '</div>' +
            '</div>'
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
        } else if (subMode === 'recovery') {
          // Wave 6.3 — recovery phrase: enable submit when the input
          // has at least 12 word-like tokens (we'll let the unlock
          // attempt itself bounce a bad phrase rather than block at
          // input-time, since whitespace forgiveness matters).
          var tokens = String(pp || '').trim().split(/\s+/).filter(Boolean);
          submit.disabled = tokens.length < 12;
          errorEl.textContent = tokens.length === 0
            ? ''
            : (tokens.length < 24
                ? tt(tokens.length + ' of 24 words typed', tokens.length + ' de 24 palabras')
                : (tokens.length === 24 ? '' : tt('Too many words; recovery phrase is 24', 'Demasiadas palabras; la frase tiene 24')));
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

      // Wave 6.3 — toggle between passphrase and recovery sub-modes.
      // We close the current modal and re-open with the alternate
      // sub-mode; the operator's progress isn't preserved across the
      // switch (there's nothing meaningful to preserve — the inputs
      // are different shapes).
      var switchToRecovery = back.querySelector('#midpass-use-recovery');
      var switchToPass     = back.querySelector('#midpass-use-passphrase');
      if (switchToRecovery) {
        switchToRecovery.addEventListener('click', function (e) {
          e.preventDefault();
          document.removeEventListener('keydown', trapKeys);
          try { back.remove(); } catch (_) {}
          // Re-open in recovery sub-mode; the new modal resolves
          // this same outer Promise via its own cleanup() call.
          ask({ mode: 'unlock', subMode: 'recovery' }).then(resolve);
        });
      }
      if (switchToPass) {
        switchToPass.addEventListener('click', function (e) {
          e.preventDefault();
          document.removeEventListener('keydown', trapKeys);
          try { back.remove(); } catch (_) {}
          ask({ mode: 'unlock' }).then(resolve);
        });
      }
      // Wave 5.4 — passphrase generator: 4 random words + a number
      // suffix from a 64-word EN+ES list. Operator can keep it,
      // tweak it, or generate again. Words are intentionally simple
      // so the operator can rehearse them out loud.
      var GEN_WORDS_EN = ['apple','river','quiet','tiger','garden','copper','meadow','silver','candle','lantern','harbor','willow','marble','pepper','cobalt','feather','autumn','velvet','nebula','sapphire','octopus','citrus','cinnamon','marigold','penguin','lighthouse','pumpkin','blueberry','timber','clover','salmon','almond','cobra','bramble','ginger','beacon','thunder','ember','frost','breeze','horizon','glacier','mosaic','peridot','tangerine','obsidian','tundra','quartz','blossom','radiance','chestnut','dahlia','jasmine','rosewood','seafoam','ironwood','sandstone','dewdrop','ironclad','lotus','prism','solstice','equinox','vesper'];
      var GEN_WORDS_ES = ['manzana','rio','silencio','tigre','jardin','cobre','prado','plata','vela','farol','bahia','sauce','marmol','pimienta','cobalto','pluma','otono','terciopelo','nebula','zafiro','pulpo','citrus','canela','cempasuchil','pinguino','faro','calabaza','arandano','viga','trebol','salmon','almendra','cobra','zarza','jengibre','baliza','trueno','ascua','escarcha','brisa','horizonte','glaciar','mosaico','peridoto','mandarina','obsidiana','tundra','cuarzo','flor','radiancia','castano','dalia','jazmin','palorrosa','espuma','hierro','arenisca','rocio','blindado','loto','prisma','solsticio','equinoccio','vespertino'];
      var generate = document.getElementById('midpass-generate');
      if (generate) {
        generate.addEventListener('click', function () {
          var words = (locale() === 'es') ? GEN_WORDS_ES : GEN_WORDS_EN;
          var pick = [];
          for (var i = 0; i < 4; i++) pick.push(words[Math.floor(Math.random() * words.length)]);
          var phrase = pick.join('-') + (Math.floor(Math.random() * 90) + 10);
          input.value = phrase;
          if (confirm) confirm.value = phrase;
          input.type = 'text';
          if (confirm) confirm.type = 'text';
          reveal.setAttribute('aria-pressed', 'true');
          reveal.textContent = tt('hide', 'ocultar');
          update();
          input.focus();
          input.select();
        });
      }
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

  // ---------------------------------------------------------------
  // Wave 6.3 — show-recovery-phrase modal. Surfaced AFTER a
  // successful save when the operator hasn't generated a recovery
  // phrase yet. Returns Promise<phrase|null>: the operator either
  // confirms they wrote the phrase down (resolves with the phrase
  // so the controller can dual-wrap) or dismisses (resolves null).
  // ---------------------------------------------------------------
  function showRecoveryPhrase(phrase) {
    injectCss();
    return new Promise(function (resolve) {
      var back = document.createElement('div');
      back.className = 'midpass-back';
      back.setAttribute('role', 'dialog');
      back.setAttribute('aria-modal', 'true');
      back.setAttribute('aria-labelledby', 'midpass-recovery-title');
      var words = String(phrase || '').split(' ').filter(Boolean);
      var grid = words.map(function (w, i) {
        return '<li class="midpass-word"><span class="midpass-word-n">' + (i + 1) + '</span>' +
               '<span class="midpass-word-w">' + w + '</span></li>';
      }).join('');
      back.innerHTML =
        '<div class="midpass-card midpass-card--recovery">' +
          '<p class="midpass-eyebrow">' + tt('Recovery phrase', 'Frase de recuperación') + '</p>' +
          '<h2 id="midpass-recovery-title" class="midpass-title">' +
            tt('Save these 24 words somewhere safe', 'Guarda estas 24 palabras en un lugar seguro') +
          '</h2>' +
          '<p class="midpass-body">' +
            tt('If you forget your passphrase, this phrase unlocks your saved invoices. We never see it. Write it down on paper, store it in a password manager, or do both.',
               'Si olvidas tu contraseña, esta frase desbloquea tus facturas. Nunca la vemos. Escríbela en papel, guárdala en un gestor de contraseñas, o ambas.') +
          '</p>' +
          '<ol class="midpass-words">' + grid + '</ol>' +
          '<div class="midpass-actions">' +
            '<button type="button" class="midpass-cancel" id="midpass-recovery-skip">' +
              tt('Not yet', 'Aún no') +
            '</button>' +
            '<button type="button" class="midpass-secondary" id="midpass-recovery-copy">' +
              tt('Copy to clipboard', 'Copiar al portapapeles') +
            '</button>' +
            '<button type="button" class="midpass-secondary" id="midpass-recovery-print">' +
              tt('Print', 'Imprimir') +
            '</button>' +
            '<button type="button" class="midpass-submit" id="midpass-recovery-confirm">' +
              tt("I've saved it — lock with recovery", 'Guardada — bloquear con recuperación') +
            '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(back);

      var cleanup = function (val) {
        try { back.remove(); } catch (_) {}
        resolve(val);
      };
      back.querySelector('#midpass-recovery-skip').addEventListener('click', function () {
        cleanup(null);
      });
      back.querySelector('#midpass-recovery-confirm').addEventListener('click', function () {
        cleanup(phrase);
      });
      back.querySelector('#midpass-recovery-copy').addEventListener('click', function () {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(phrase);
          } else {
            // Fallback for older browsers — select+copy via temp textarea.
            var ta = document.createElement('textarea');
            ta.value = phrase;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
        } catch (_) {}
      });
      back.querySelector('#midpass-recovery-print').addEventListener('click', function () {
        // Open a small print-only window with the phrase formatted.
        try {
          var w = window.open('', 'recovery-print', 'width=520,height=720');
          if (!w) return;
          w.document.write('<title>Recovery phrase</title>' +
            '<style>body{font-family:ui-monospace,monospace;font-size:14px;padding:24px;line-height:1.6}h1{font-size:18px}ol{padding-left:28px}li{padding:2px 0}</style>' +
            '<h1>Invoice Decoder — recovery phrase</h1>' +
            '<p>Keep this paper somewhere safe. Anyone with these 24 words can unlock your saved invoices.</p>' +
            '<ol>' + words.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ol>' +
            '<p style="margin-top:24px;font-size:11px;color:#666">Generated ' + new Date().toLocaleString() + '</p>' +
            '<script>window.onload=function(){window.print()}</' + 'script>');
          w.document.close();
        } catch (_) {}
      });
    });
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
    showRecoveryPhrase: showRecoveryPhrase,
    _COMMON_BLOCKLIST: COMMON_BLOCKLIST
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_PASS = api;
})(typeof window !== 'undefined' ? window : null);
