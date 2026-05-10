// assets/js/window-voice.js
//
// Phase 3.3 (Window redesign) — voice memo client.
// MediaRecorder-based: tap mic → record → tap stop → preview → upload.
// Same attach-id contract as window-photos.js: collected on submit
// via window.muntinPhotos.collectAttachIds() (the array merges photo
// + voice attach ids transparently from the server's perspective).
//
// Plan §5.2 + §6.3. BIPA-conservative — voice retention is 30d
// (server enforces); the privacy disclosure shows on first record.
//
// Codec strategy: prefer Opus in WebM where supported (Chrome,
// Firefox, Edge desktop + Android); fall back to AAC in MP4 for
// Safari iOS 14.5+ and macOS. The server accepts both.

(function () {
  'use strict';

  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return; // No support — leave the mic disabled.
  }

  var locale = (document.body && document.body.getAttribute('data-locale') === 'es') ? 'es' : 'en';

  var COPY = {
    en: {
      ariaRecord: 'Record a voice note',
      ariaStop: 'Stop recording',
      tapToStop: 'Listening. Tap to stop.',
      lengthCap: 'Ten seconds left — wrap it up.',
      privacyOnce: "I'll keep voice notes for 30 days, then they're gone. The transcript stays in your thread.",
      micBlocked: "Your phone won't let me use the mic. No problem — type your note, or email don@muntin.digital.",
      uploadFailed: "Couldn't send that voice note. Try again or just type it.",
      uploading: 'Sending the voice note…',
      sizeS: function (s) { return s + 's'; },
    },
    es: {
      ariaRecord: 'Grabar una nota de voz',
      ariaStop: 'Detener grabación',
      tapToStop: 'Escuchando. Toca para parar.',
      lengthCap: 'Diez segundos — termina.',
      privacyOnce: 'Guardo las notas de voz 30 días y luego se borran. La transcripción se queda en tu conversación.',
      micBlocked: 'Tu teléfono no me deja usar el micrófono. Sin problema — escribe tu nota, o envía un correo a don@muntin.digital.',
      uploadFailed: 'No pude enviar esa nota de voz. Intenta otra vez o escríbela.',
      uploading: 'Enviando la nota de voz…',
      sizeS: function (s) { return s + 's'; },
    },
  };
  var copy = COPY[locale];

  var DURATION_DEFAULT_MS = 60 * 1000;
  var DURATION_HARD_MS    = 90 * 1000;
  var COUNTDOWN_WARN_MS   = 10 * 1000;
  var PRIVACY_DISCLOSED_KEY = 'md_window_voice_disclosed_v1';

  var els = {
    mic:        document.getElementById('windowMic'),
    attach:     document.getElementById('windowAttach'),
    previews:   document.getElementById('windowPreviews'),
  };
  if (!els.mic || !els.attach || !els.previews) return;

  // Probe the same /api/window/attach endpoint used by photos.
  // If WINDOW_VOICE_ENABLED is on, the endpoint accepts voice MIMEs;
  // we test by sending an empty multipart with no file (returns
  // 400 no-file when the gate is on, 404 when off). Reuse the
  // photo-probe response if window-photos.js already detected the
  // gate is on for at least one modality.
  fetch('/api/window/attach', { method: 'POST', credentials: 'same-origin' })
    .then(function (r) {
      if (r.status === 404) return false;
      return true;
    })
    .then(function (enabled) {
      if (enabled) {
        els.mic.hidden = false;
        els.mic.disabled = false;
        els.mic.removeAttribute('disabled');
        els.mic.setAttribute('aria-label', copy.ariaRecord);
        els.mic.title = copy.ariaRecord;
      }
    })
    .catch(function () { /* leave hidden */ });

  // Choose the recorder MIME the browser actually supports.
  function pickMimeType() {
    var candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
    ];
    for (var i = 0; i < candidates.length; i++) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(candidates[i])) {
        return candidates[i];
      }
    }
    return null; // browser will use its default
  }

  var state = {
    recorder: null,
    stream: null,
    chunks: [],
    startedAt: 0,
    timer: null,
    timeoutId: null,
    warnTimeoutId: null,
    item: null,  // preview state
    mime: null,
  };

  function showPrivacyOnce() {
    try {
      if (localStorage.getItem(PRIVACY_DISCLOSED_KEY) === '1') return;
      // Inline the disclosure as a status above the mic the first
      // time the user clicks record. Stays present until they
      // dismiss; future records skip.
      var p = document.createElement('p');
      p.style.fontSize = '12px';
      p.style.fontStyle = 'italic';
      p.style.color = 'var(--stone)';
      p.style.margin = '6px 0 0';
      p.textContent = copy.privacyOnce;
      els.attach.appendChild(p);
      localStorage.setItem(PRIVACY_DISCLOSED_KEY, '1');
    } catch (_) { /* localStorage may be blocked; harmless */ }
  }

  function setRecordingUI(on) {
    if (on) {
      els.mic.classList.add('is-recording');
      els.mic.setAttribute('aria-label', copy.ariaStop);
      els.mic.title = copy.tapToStop;
    } else {
      els.mic.classList.remove('is-recording');
      els.mic.setAttribute('aria-label', copy.ariaRecord);
      els.mic.title = copy.ariaRecord;
    }
  }

  function startRecording() {
    if (state.recorder) return;
    showPrivacyOnce();
    var mime = pickMimeType();
    state.mime = mime;
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        state.stream = stream;
        try {
          state.recorder = mime
            ? new MediaRecorder(stream, { mimeType: mime })
            : new MediaRecorder(stream);
        } catch (err) {
          // Fallback: no mime arg.
          state.recorder = new MediaRecorder(stream);
        }
        state.chunks = [];
        state.startedAt = Date.now();
        state.recorder.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) state.chunks.push(e.data);
        };
        state.recorder.onstop = function () {
          var blob = new Blob(state.chunks, { type: state.mime || 'audio/webm' });
          var durationMs = Date.now() - state.startedAt;
          uploadVoice(blob, durationMs);
          // Release mic.
          if (state.stream) {
            state.stream.getTracks().forEach(function (t) { t.stop(); });
            state.stream = null;
          }
          state.recorder = null;
          state.chunks = [];
          setRecordingUI(false);
        };
        state.recorder.start();
        setRecordingUI(true);

        // Hard stop at 90s.
        state.timeoutId = setTimeout(function () {
          if (state.recorder && state.recorder.state === 'recording') {
            state.recorder.stop();
          }
        }, DURATION_HARD_MS);

        // Warn at (default - 10s).
        state.warnTimeoutId = setTimeout(function () {
          if (els.mic) els.mic.title = copy.lengthCap;
        }, DURATION_DEFAULT_MS - COUNTDOWN_WARN_MS);
      })
      .catch(function () {
        alert(copy.micBlocked);
      });
  }

  function stopRecording() {
    if (state.recorder && state.recorder.state === 'recording') {
      state.recorder.stop();
    }
    if (state.timeoutId) { clearTimeout(state.timeoutId); state.timeoutId = null; }
    if (state.warnTimeoutId) { clearTimeout(state.warnTimeoutId); state.warnTimeoutId = null; }
  }

  function uploadVoice(blob, durationMs) {
    if (!blob || blob.size < 100) return;
    var item = {
      name: 'voice-' + Math.round(durationMs / 1000) + 's',
      sizeBytes: blob.size,
      durationMs: durationMs,
      status: 'uploading',
      attachId: null,
    };
    // Reuse the photo previews list — the previews UI is shared.
    var li = document.createElement('li');
    li.className = 'window-composer__preview is-uploading';
    li.dataset.kind = 'voice';
    var label = document.createElement('span');
    label.className = 'window-composer__preview-label';
    label.textContent = copy.sizeS(Math.round(durationMs / 1000)) + ' · ' + copy.uploading;
    li.appendChild(label);
    els.previews.appendChild(li);

    var fd = new FormData();
    fd.append('file', blob, item.name);
    fd.append('durationMs', String(durationMs));
    fetch('/api/window/attach', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    })
      .then(function (r) {
        return r.json().then(function (j) { return { status: r.status, body: j }; });
      })
      .then(function (res) {
        li.classList.remove('is-uploading');
        if (res.status === 200 && res.body && res.body.ok && res.body.attachId) {
          item.attachId = res.body.attachId;
          item.status = 'ok';
          // Hand the attachId to the photos collector so submit() picks
          // it up uniformly.
          if (window.muntinPhotos && typeof window.muntinPhotos._registerAttachment === 'function') {
            window.muntinPhotos._registerAttachment(item);
          } else {
            // Fall back: store on a shared array.
            window.muntinVoiceItems = window.muntinVoiceItems || [];
            window.muntinVoiceItems.push(item);
          }
          li.dataset.attachId = item.attachId;
          label.textContent = copy.sizeS(Math.round(durationMs / 1000));
          // Remove button.
          var rm = document.createElement('button');
          rm.type = 'button';
          rm.className = 'window-composer__preview-remove';
          rm.setAttribute('aria-label', 'Remove voice note');
          rm.textContent = '×';
          rm.addEventListener('click', function () {
            li.parentNode && li.parentNode.removeChild(li);
            // Mark removed in shared store.
            if (window.muntinPhotos && typeof window.muntinPhotos._unregisterAttachment === 'function') {
              window.muntinPhotos._unregisterAttachment(item.attachId);
            }
            if (window.muntinVoiceItems) {
              window.muntinVoiceItems = window.muntinVoiceItems.filter(function (v) { return v.attachId !== item.attachId; });
            }
          });
          li.appendChild(rm);
          try {
            window.plausible && window.plausible('Window Attach Voice', { props: { locale: locale, durationSec: Math.round(durationMs / 1000) } });
          } catch (_) {}
        } else {
          li.classList.add('is-error');
          label.textContent = copy.uploadFailed;
        }
      })
      .catch(function () {
        li.classList.remove('is-uploading');
        li.classList.add('is-error');
        label.textContent = copy.uploadFailed;
      });
  }

  els.mic.addEventListener('click', function () {
    if (state.recorder && state.recorder.state === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  });

  // Keyboard: space/enter on mic toggles record (matches the
  // <button> default — explicit handler not needed, but document
  // here that the contract is "real button, no custom roles").
})();
