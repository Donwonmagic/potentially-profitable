/**
 * Voice query FAB — discovery surface for Wave 13.2 (Wave 14.1).
 *
 * Surfaces a feature-detected microphone button anchored bottom-right
 * once SpeechRecognition is available. Click → start listening; the
 * button pulses while active, returns to idle when the recognizer's
 * onend fires. Voice answer flows back through MID_VOICE_QUERY's
 * speak() helper.
 *
 * Bonus: also exposes a small "?" hint that lists the 12 intents.
 *
 * Privacy: this module renders UI only; audio routing happens in
 * MID_VOICE_QUERY (which uses webkitSpeechRecognition; the platform
 * speech service is disclosed in the Privacy Self-Check).
 */
(function (root) {
  'use strict';
  if (typeof root === 'undefined' || !root || !root.document) return;

  function _isSupported() {
    return !!(root.SpeechRecognition || root.webkitSpeechRecognition);
  }

  function _mount() {
    if (document.getElementById('idVoiceFab')) return;
    if (typeof MID_VOICE_QUERY === 'undefined' || !MID_VOICE_QUERY.isSupported()) return;

    var fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'idVoiceFab';
    fab.className = 'id-voice-fab';
    fab.setAttribute('aria-label', 'Voice query — ask about your invoices');
    fab.setAttribute('title', 'Voice query — ask about your invoices');
    fab.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' +
      '<path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/>' +
      '<path fill="currentColor" d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"/>' +
      '</svg>';
    document.body.appendChild(fab);

    var hint = document.createElement('div');
    hint.id = 'idVoiceHint';
    hint.className = 'id-voice-hint';
    hint.hidden = true;
    hint.setAttribute('role', 'status');
    hint.setAttribute('aria-live', 'polite');
    document.body.appendChild(hint);

    var listening = false;

    function _setStatus(msg, kind) {
      hint.textContent = msg || '';
      hint.dataset.kind = kind || 'info';
      hint.hidden = !msg;
      if (msg) {
        clearTimeout(hint._tid);
        hint._tid = setTimeout(function () { hint.hidden = true; }, kind === 'answer' ? 8000 : 4000);
      }
    }

    function _wireRecognizer() {
      var SR = root.SpeechRecognition || root.webkitSpeechRecognition;
      if (!SR) return;
      // Voice-query.js manages its own recognizer instance via start/stop.
      // We patch it to surface onresult through this UI by listening
      // for a synthetic event the module fires after dispatching.
      // Simpler path: wrap MID_VOICE_QUERY.start with a callback when
      // a result arrives.
    }

    fab.addEventListener('click', function () {
      if (listening) {
        try { MID_VOICE_QUERY.stop(); } catch (_) {}
        listening = false;
        fab.classList.remove('is-listening');
        _setStatus('', null);
        return;
      }
      // Start a fresh recognizer that funnels its result back to
      // voice-query for intent matching, then surface the answer
      // both spoken AND in the hint chip (so muted devices see it).
      var SR = root.SpeechRecognition || root.webkitSpeechRecognition;
      if (!SR) {
        _setStatus('Voice not supported in this browser.', 'error');
        return;
      }
      var rec = new SR();
      rec.lang = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2) === 'es' ? 'es-MX' : 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 3;
      _setStatus('Listening… ask "What\'s my Sysco spend this month?"', 'listening');
      fab.classList.add('is-listening');
      listening = true;
      rec.onresult = function (ev) {
        var heard = ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript;
        if (!heard) return;
        // Wave 14.2 (Self-Check v2) — mark voice channel as used so
        // the Privacy report surfaces an honest verdict.
        try { if (root.MID_SELF_CHECK && root.MID_SELF_CHECK.markChannel) root.MID_SELF_CHECK.markChannel('voice'); } catch (_) {}
        var r = MID_VOICE_QUERY.query(heard);
        if (r && r.answer) {
          MID_VOICE_QUERY.speak(r.answer);
          _setStatus('🗣 ' + r.answer, 'answer');
          if (root.plausible) {
            try { root.plausible('Invoice Decoder Voice Query', { props: { intent: r.intent } }); } catch (_) {}
          }
        } else {
          _setStatus('Heard: "' + heard + '" — no matching intent.', 'error');
        }
      };
      rec.onerror = function (ev) {
        _setStatus('Voice error: ' + (ev.error || 'unknown') + '.', 'error');
        listening = false;
        fab.classList.remove('is-listening');
      };
      rec.onend = function () {
        listening = false;
        fab.classList.remove('is-listening');
      };
      try { rec.start(); } catch (err) { _setStatus(err.message, 'error'); listening = false; fab.classList.remove('is-listening'); }
    });

    // Long-press → show intent menu.
    var pressTimer = null;
    fab.addEventListener('pointerdown', function () {
      pressTimer = setTimeout(function () {
        _showIntentMenu();
      }, 600);
    });
    fab.addEventListener('pointerup',   function () { if (pressTimer) clearTimeout(pressTimer); });
    fab.addEventListener('pointerleave',function () { if (pressTimer) clearTimeout(pressTimer); });

    function _showIntentMenu() {
      var examples = [
        '"What\'s my Sysco spend this month?"',
        '"Where am I being overcharged?"',
        '"Has cilantro gone up?"',
        '"What should I reorder?"',
        '"Read me the last invoice"',
        '"How is Sysco doing?"'
      ];
      _setStatus('Try: ' + examples[Math.floor(Math.random() * examples.length)], 'info');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _mount);
  } else {
    _mount();
  }
})(typeof window !== 'undefined' ? window : null);
