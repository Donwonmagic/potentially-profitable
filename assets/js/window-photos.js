// assets/js/window-photos.js
//
// Phase 3.2 (Window redesign) — photo attachment client.
// Handles file picker + drag-drop + canvas resize + EXIF strip
// + alt-text capture + upload to /api/window/attach.
//
// Loaded by /window/index.html only (not site-wide). Composer
// integrates via window.muntinPhotos.collectAttachIds() at submit
// time — returns the array of successfully-uploaded attachIds.
//
// EXIF strip: re-encodes via canvas. Modern browsers drop EXIF
// metadata on canvas drawImage + toBlob (the canvas is a fresh
// raster; the original metadata never makes it through). Server
// re-strips on ingest as defense-in-depth.

(function () {
  'use strict';

  var locale = (document.body && document.body.getAttribute('data-locale') === 'es') ? 'es' : 'en';

  var COPY = {
    en: {
      uploading: 'Sending the photo…',
      removed: 'Removed.',
      tooLarge: "That photo's too big. Keep it under 5 MB.",
      tooSmall: "That photo didn't come through cleanly.",
      unsupported: 'I can take JPEG, PNG, or WebP — not that format.',
      maxAttachments: 'Max 4 photos per note.',
      sendFirst: "Send a quick line first — I'll attach the photo on the next message.",
      uploadFailed: "Couldn't send that photo. Try again or just describe it.",
      sizeBytes: function (b) {
        if (b < 1024) return b + ' B';
        if (b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
        return (b / 1024 / 1024).toFixed(1) + ' MB';
      },
    },
    es: {
      uploading: 'Enviando la foto…',
      removed: 'Removida.',
      tooLarge: 'Esa foto es muy grande. Que pese menos de 5 MB.',
      tooSmall: 'Esa foto no llegó bien.',
      unsupported: 'Acepto JPEG, PNG, o WebP — ese formato no.',
      maxAttachments: 'Máximo 4 fotos por nota.',
      sendFirst: 'Manda primero una línea — engancho la foto en el siguiente mensaje.',
      uploadFailed: 'No pude enviar esa foto. Intenta otra vez o solo descríbela.',
      sizeBytes: function (b) {
        if (b < 1024) return b + ' B';
        if (b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
        return (b / 1024 / 1024).toFixed(1) + ' MB';
      },
    },
  };
  var copy = COPY[locale];

  var MAX_ATTACHMENTS = 4;
  var MAX_BYTES = 5 * 1024 * 1024;
  var MAX_PIXELS = 2048;

  var els = {
    attach:     document.getElementById('windowAttach'),
    photoBtn:   document.getElementById('windowPhotoBtn'),
    photoInput: document.getElementById('windowPhotoInput'),
    previews:   document.getElementById('windowPreviews'),
    sash:       document.getElementById('windowSash'),
  };

  if (!els.attach || !els.photoInput) return;

  // Internal state — list of { attachId, name, sizeBytes, status }.
  var attachments = [];

  // Probe whether the photo endpoint is enabled. Cheapest way: send
  // an OPTIONS-style ping; the endpoint returns 404 when the flag is
  // off (env.WINDOW_PHOTO_ENABLED !== 'true'). If 404, we leave the
  // attach row hidden — operator never sees the affordance.
  fetch('/api/window/attach', { method: 'POST', credentials: 'same-origin' })
    .then(function (r) {
      // 404 → flag off; 401/409 → flag on, just no auth/cookie yet.
      if (r.status === 404) return false;
      return true;
    })
    .then(function (enabled) {
      if (enabled) els.attach.hidden = false;
    })
    .catch(function () { /* network blip — leave hidden */ });

  // ─── Canvas resize + re-encode (strips EXIF as side effect) ───
  function resizeAndEncode(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, MAX_PIXELS / Math.max(w, h));
        var dw = Math.round(w * scale), dh = Math.round(h * scale);
        var canvas = document.createElement('canvas');
        canvas.width = dw;
        canvas.height = dh;
        var ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('no-canvas')); return; }
        ctx.drawImage(img, 0, 0, dw, dh);
        // Prefer WebP at 0.85 quality; fall back to JPEG if WebP
        // unsupported (older Safari).
        canvas.toBlob(function (blob) {
          if (!blob) {
            // WebP unsupported — try JPEG.
            canvas.toBlob(function (blob2) {
              if (!blob2) reject(new Error('encode-failed'));
              else resolve(blob2);
            }, 'image/jpeg', 0.85);
          } else {
            resolve(blob);
          }
        }, 'image/webp', 0.85);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('image-decode-failed'));
      };
      img.src = url;
    });
  }

  function renderPreview(item) {
    var li = document.createElement('li');
    li.className = 'window-composer__preview';
    if (item.status === 'uploading') li.classList.add('is-uploading');
    if (item.status === 'error') li.classList.add('is-error');
    li.dataset.attachId = item.attachId || '';

    if (item.thumbUrl) {
      var img = document.createElement('img');
      img.src = item.thumbUrl;
      img.alt = '';
      li.appendChild(img);
    }
    var label = document.createElement('span');
    label.className = 'window-composer__preview-label';
    label.textContent = item.name + ' · ' + copy.sizeBytes(item.sizeBytes || 0);
    li.appendChild(label);

    if (item.status !== 'uploading') {
      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'window-composer__preview-remove';
      removeBtn.setAttribute('aria-label', 'Remove photo');
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function () {
        attachments = attachments.filter(function (a) { return a !== item; });
        if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
        renderAll();
      });
      li.appendChild(removeBtn);
    }
    return li;
  }

  function renderAll() {
    if (!els.previews) return;
    while (els.previews.firstChild) els.previews.removeChild(els.previews.firstChild);
    for (var i = 0; i < attachments.length; i++) {
      els.previews.appendChild(renderPreview(attachments[i]));
    }
  }

  function uploadFile(file) {
    if (attachments.length >= MAX_ATTACHMENTS) {
      alert(copy.maxAttachments);
      return;
    }
    var allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.indexOf((file.type || '').toLowerCase()) === -1) {
      alert(copy.unsupported);
      return;
    }
    if (file.size < 16) {
      alert(copy.tooSmall);
      return;
    }
    // Pre-resize size check is on the ORIGINAL bytes; the resized
    // blob is almost always smaller. Hard cap of 25MB on raw input
    // so a rogue uploader can't OOM the canvas.
    if (file.size > 25 * 1024 * 1024) {
      alert(copy.tooLarge);
      return;
    }

    var item = {
      name: file.name || 'photo',
      sizeBytes: file.size,
      status: 'uploading',
      thumbUrl: URL.createObjectURL(file),
      attachId: null,
    };
    attachments.push(item);
    renderAll();

    resizeAndEncode(file)
      .then(function (blob) {
        if (blob.size > MAX_BYTES) throw new Error('too-large-after-resize');
        var fd = new FormData();
        fd.append('file', blob, item.name);
        return fetch('/api/window/attach', {
          method: 'POST',
          credentials: 'same-origin',
          body: fd,
        });
      })
      .then(function (r) {
        return r.json().then(function (j) { return { status: r.status, body: j }; });
      })
      .then(function (res) {
        if (res.status === 200 && res.body && res.body.ok && res.body.attachId) {
          item.attachId = res.body.attachId;
          item.sizeBytes = res.body.sizeBytes || item.sizeBytes;
          item.status = 'ok';
          try {
            window.plausible && window.plausible('Window Attach Photo', { props: { locale: locale } });
          } catch (_) {}
        } else if (res.status === 409 && res.body && res.body.error === 'send-first') {
          item.status = 'error';
          alert(copy.sendFirst);
        } else {
          item.status = 'error';
          alert(copy.uploadFailed + (res.body && res.body.error ? ' (' + res.body.error + ')' : ''));
        }
        renderAll();
      })
      .catch(function (err) {
        item.status = 'error';
        renderAll();
        alert(copy.uploadFailed + ' (' + (err && err.message || 'unknown') + ')');
      });
  }

  if (els.photoBtn) {
    els.photoBtn.addEventListener('click', function () {
      els.photoInput.click();
    });
  }
  if (els.photoInput) {
    els.photoInput.addEventListener('change', function () {
      var files = els.photoInput.files;
      if (!files) return;
      for (var i = 0; i < files.length; i++) {
        uploadFile(files[i]);
      }
      els.photoInput.value = '';
    });
  }

  // Drag-drop on the composer surface (entire .sash for ergonomics).
  if (els.sash) {
    var dropTarget = els.sash;
    dropTarget.addEventListener('dragover', function (e) {
      if (e.dataTransfer && e.dataTransfer.types && Array.prototype.indexOf.call(e.dataTransfer.types, 'Files') !== -1) {
        e.preventDefault();
        els.attach.classList.add('is-dropping');
      }
    });
    dropTarget.addEventListener('dragleave', function () {
      els.attach.classList.remove('is-dropping');
    });
    dropTarget.addEventListener('drop', function (e) {
      els.attach.classList.remove('is-dropping');
      if (!e.dataTransfer || !e.dataTransfer.files) return;
      e.preventDefault();
      var files = e.dataTransfer.files;
      for (var i = 0; i < files.length; i++) {
        uploadFile(files[i]);
      }
    });
  }

  // Public API for window.js submit() to grab the attachIds.
  // Both photo (via attachments array) and voice (via window-voice.js
  // calling _registerAttachment) flow through the same collector.
  window.muntinPhotos = window.muntinPhotos || {};
  window.muntinPhotos.collectAttachIds = function () {
    var out = [];
    for (var i = 0; i < attachments.length; i++) {
      if (attachments[i].status === 'ok' && attachments[i].attachId) {
        out.push(attachments[i].attachId);
      }
    }
    // Voice items registered via _registerAttachment also count.
    if (window.muntinVoiceItems) {
      for (var j = 0; j < window.muntinVoiceItems.length; j++) {
        if (window.muntinVoiceItems[j].attachId) {
          out.push(window.muntinVoiceItems[j].attachId);
        }
      }
    }
    return out;
  };
  window.muntinPhotos.clearAttachments = function () {
    for (var i = 0; i < attachments.length; i++) {
      if (attachments[i].thumbUrl) URL.revokeObjectURL(attachments[i].thumbUrl);
    }
    attachments = [];
    if (window.muntinVoiceItems) window.muntinVoiceItems = [];
    // Clear voice preview chips too.
    if (els.previews) {
      var voiceLis = els.previews.querySelectorAll('li[data-kind="voice"]');
      for (var k = 0; k < voiceLis.length; k++) {
        voiceLis[k].parentNode && voiceLis[k].parentNode.removeChild(voiceLis[k]);
      }
    }
    renderAll();
  };
  window.muntinPhotos._registerAttachment = function (item) {
    window.muntinVoiceItems = window.muntinVoiceItems || [];
    window.muntinVoiceItems.push(item);
  };
  window.muntinPhotos._unregisterAttachment = function (attachId) {
    if (window.muntinVoiceItems) {
      window.muntinVoiceItems = window.muntinVoiceItems.filter(function (v) { return v.attachId !== attachId; });
    }
  };
})();
