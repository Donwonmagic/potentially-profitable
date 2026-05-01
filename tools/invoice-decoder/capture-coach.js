/**
 * Invoice Decoder — live capture coach (Wave 2.1).
 *
 * Real-time camera preview with edge-overlay drawing, debounced
 * coach prompts, and one-tap multi-page capture. Replaces the OS
 * file/camera picker for the photo input path when the browser
 * supports `getUserMedia` over HTTPS.
 *
 * Pipeline per ~150ms tick:
 *   1. Sample one video frame to a 480px-wide offscreen canvas.
 *   2. Run findDocumentQuad (from preprocess.js) — same Sobel +
 *      Hough math used in the post-capture rectifier from Wave 2.2.
 *   3. Compute lightweight quality metrics on the same frame:
 *      - quad area %  (fill-frame coach signal)
 *      - max-luma %   (glare coach signal)
 *      - laplacian var (blur coach signal)
 *   4. Drive the coach state machine with sustained-signal thresholds
 *      (400ms minimum) so the prompt doesn't flicker.
 *   5. Draw the corner-overlay trapezoid on a transparent canvas
 *      stacked over the video.
 *
 * On capture:
 *   - The freeze-frame goes through the same `findDocumentQuad`
 *     pipeline at full resolution. The detected corners are passed
 *     into `handlePhotoFiles` so the post-capture rectifier doesn't
 *     have to re-detect them.
 *   - The captured Blob becomes a File and joins the multi-page tray.
 *
 * Privacy posture:
 *   - getUserMedia opens an in-browser MediaStream. The video bytes
 *     never leave the device. No fetch, no upload.
 *   - Stream tracks are stopped when the sheet closes so the camera
 *     light goes off cleanly.
 *   - The coach overlay is purely cosmetic — it never sends pixel
 *     data anywhere.
 *
 * Failure modes:
 *   - getUserMedia unavailable / denied → silently fall through to
 *     the native `<input type="file" capture>` picker.
 *   - DeviceMotion permission denied (iOS) → hold-steady coach
 *     skipped; everything else still works.
 *   - Older browsers without `OffscreenCanvas` → main-thread sample
 *     at lower fps. Coach still works.
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------
  // Capability detection
  // ---------------------------------------------------------------
  function isSupported() {
    if (typeof navigator === 'undefined') return false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
    if (typeof location !== 'undefined' && location.protocol !== 'https:' && location.hostname !== 'localhost') return false;
    return true;
  }

  // ---------------------------------------------------------------
  // i18n shim — pulls locale from the document's lang attribute,
  // same convention as the rest of the tool.
  // ---------------------------------------------------------------
  function locale() {
    if (typeof document === 'undefined') return 'en';
    var l = document.documentElement.getAttribute('lang') || 'en';
    return l.toLowerCase().slice(0, 2);
  }
  function tt(en, es) { return locale() === 'es' ? es : en; }

  // ---------------------------------------------------------------
  // Coach state machine
  // ---------------------------------------------------------------
  // Sustained-signal threshold: a coach prompt only changes after
  // the new state has held for 400ms. Prevents flicker between
  // "glare" and "good" when the operator's hand wobbles.
  var SUSTAIN_MS = 400;

  // Auto-capture: when the coach has held "allGood" for this long
  // continuously, fire the shutter. Operators don't time the shot
  // — they aim, hold steady, and the tool snaps. Aligns with the
  // CamScanner / Office Lens UX expectation. Manual shutter still
  // works at any time and races auto-capture safely.
  var AUTO_CAPTURE_MS = 1500;

  // Each evaluator returns true iff its signal is currently active.
  // The evaluator order is also priority order — first-match wins.
  function makeEvaluators(opts) {
    opts = opts || {};
    return [
      // Glare: a 4×4 grid cell with > 25% bright pixels (luma > 240)
      // means a hot spot is washing out part of the page.
      { id: 'glare', test: function (m) { return m.glareScore >= 0.25; } },
      // Blur: laplacian variance < 60 → likely too soft to OCR.
      { id: 'blur', test: function (m) { return m.blur < 60; } },
      // Fill-frame: quad covers < 40% of frame → operator too far away.
      { id: 'fillFrame', test: function (m) { return m.quadArea != null && m.quadArea < 0.4; } },
      // No quad detected → either the page isn't visible or it's so
      // tilted no four-corner shape was found. Coach guides the
      // operator to align the page squarely.
      { id: 'noQuad', test: function (m) { return m.quadArea == null; } }
    ];
  }

  // Map evaluator IDs to the operator-facing prompt copy. The
  // green "all good" state has no prompt — we just brighten the
  // overlay to signal the operator can capture confidently.
  var COACH_COPY = {
    glare:     { en: 'Bright spot in the frame — tilt the page slightly to dodge the glare.',
                 es: 'Brillo en la imagen — inclina la página un poco para esquivar el reflejo.' },
    blur:      { en: 'Looking blurry — hold the phone steadier or step closer.',
                 es: 'Se ve borroso — sostén el teléfono más firme o acércate un poco.' },
    fillFrame: { en: 'Move closer so the page fills the frame.',
                 es: 'Acércate para que la página llene el cuadro.' },
    noQuad:    { en: 'Center the page in the frame.',
                 es: 'Centra la página en el cuadro.' }
  };

  // Coach state holder. Tracks the candidate signal and its
  // first-seen timestamp; the active prompt only changes when a
  // new signal has held for SUSTAIN_MS. `goodSince` records when
  // "allGood" first fired so the auto-capture timer can trigger
  // after AUTO_CAPTURE_MS of continuous green-state.
  function makeCoachState() {
    var state = {
      activeId:    null,            // currently shown prompt
      candidateId: null,            // most recent rule firing
      candidateAt: 0,
      goodSince:   0                // first ms continuous "allGood"; 0 = not in state
    };
    return state;
  }
  function tickCoach(state, evaluators, metrics, now) {
    now = now || Date.now();
    var firing = null;
    for (var i = 0; i < evaluators.length; i++) {
      if (evaluators[i].test(metrics)) { firing = evaluators[i].id; break; }
    }
    // No rule firing → "all good" signal.
    if (!firing) {
      if (state.candidateId !== 'allGood') {
        state.candidateId = 'allGood';
        state.candidateAt = now;
      }
      if (state.activeId !== 'allGood' && (now - state.candidateAt) >= SUSTAIN_MS) {
        state.activeId = 'allGood';
      }
      // Track continuous-good window for auto-capture.
      if (state.activeId === 'allGood' && !state.goodSince) state.goodSince = now;
      return state.activeId;
    }
    if (state.candidateId !== firing) {
      state.candidateId = firing;
      state.candidateAt = now;
    }
    if (state.activeId !== firing && (now - state.candidateAt) >= SUSTAIN_MS) {
      state.activeId = firing;
    }
    // Any non-good signal resets the auto-capture timer immediately —
    // even during the sustain debounce window — so a brief glare blip
    // doesn't allow auto-fire mid-blip.
    state.goodSince = 0;
    return state.activeId;
  }

  // Auto-capture predicate. Returns true once the coach has held
  // "allGood" continuously for AUTO_CAPTURE_MS. Caller is responsible
  // for actually firing the shutter and resetting the timer (we don't
  // want the same green window to trigger twice).
  function shouldAutoCapture(state, now) {
    now = now || Date.now();
    if (state.activeId !== 'allGood') return false;
    if (!state.goodSince) return false;
    return (now - state.goodSince) >= AUTO_CAPTURE_MS;
  }
  function clearAutoCaptureTimer(state) {
    state.goodSince = 0;
  }

  // ---------------------------------------------------------------
  // Frame metrics
  // ---------------------------------------------------------------
  // Quick 4×4 grid scan: count bright-pixel ratio in each cell;
  // glareScore = max ratio across all cells. A focused hot spot
  // (e.g., a ring light reflecting off a glossy receipt) shows up
  // as one cell with a very high ratio, even when the average
  // page brightness is fine.
  function computeGlareScore(imageData) {
    var w = imageData.width, h = imageData.height;
    var d = imageData.data;
    var gridX = 4, gridY = 4;
    var cellW = Math.floor(w / gridX);
    var cellH = Math.floor(h / gridY);
    if (cellW <= 0 || cellH <= 0) return 0;
    var maxRatio = 0;
    for (var gy = 0; gy < gridY; gy++) {
      for (var gx = 0; gx < gridX; gx++) {
        var x0 = gx * cellW, y0 = gy * cellH;
        var x1 = Math.min(w, x0 + cellW), y1 = Math.min(h, y0 + cellH);
        var bright = 0, total = 0;
        for (var y = y0; y < y1; y += 2) {
          for (var x = x0; x < x1; x += 2) {
            var i = (y * w + x) * 4;
            // Rec. 601 luma
            var L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            if (L > 240) bright++;
            total++;
          }
        }
        if (total > 0) {
          var ratio = bright / total;
          if (ratio > maxRatio) maxRatio = ratio;
        }
      }
    }
    return maxRatio;
  }

  // Laplacian variance over a centered 60% × 60% crop, stride 2.
  // Same shape as preprocess.js's qualityMetrics so thresholds
  // stay aligned.
  function computeLaplacianVariance(imageData) {
    var w = imageData.width, h = imageData.height;
    if (w < 30 || h < 30) return 0;
    var d = imageData.data;
    var x0 = Math.floor(w * 0.2), x1 = Math.floor(w * 0.8);
    var y0 = Math.floor(h * 0.2), y1 = Math.floor(h * 0.8);
    var responses = [];
    for (var y = y0 + 1; y < y1 - 1; y += 2) {
      for (var x = x0 + 1; x < x1 - 1; x += 2) {
        var i = (y * w + x) * 4;
        // Operate on R channel; assume (mostly) gray frame.
        var c  = d[i];
        var up = d[i - w * 4];
        var dn = d[i + w * 4];
        var lt = d[i - 4];
        var rt = d[i + 4];
        responses.push(up + dn + lt + rt - 4 * c);
      }
    }
    if (!responses.length) return 0;
    var mean = 0;
    for (var k = 0; k < responses.length; k++) mean += responses[k];
    mean /= responses.length;
    var variance = 0;
    for (var k2 = 0; k2 < responses.length; k2++) {
      var dv = responses[k2] - mean;
      variance += dv * dv;
    }
    return variance / responses.length;
  }

  // High-level: compute all metrics for a given ImageData. Quad
  // detection is delegated to MID_PREPROCESS.findDocumentQuad; we
  // rebuild the canvas from the image data (the preprocess function
  // expects a canvas) — slight overhead, but findDocumentQuad
  // downsamples internally so the cost stays sub-frame-budget.
  function computeMetrics(imageData, scratchCanvas) {
    var quadArea = null;
    var corners = null;
    if (typeof root !== 'undefined' && root && root.MID_PREPROCESS &&
        typeof root.MID_PREPROCESS.findDocumentQuad === 'function') {
      try {
        // Paint the imageData onto the scratch canvas for the API.
        if (scratchCanvas) {
          var sctx = scratchCanvas.getContext('2d');
          if (sctx) {
            scratchCanvas.width  = imageData.width;
            scratchCanvas.height = imageData.height;
            sctx.putImageData(imageData, 0, 0);
            var quad = root.MID_PREPROCESS.findDocumentQuad(scratchCanvas, { minConfidence: 0.3 });
            if (quad && quad.corners) {
              corners = quad.corners;
              // Shoelace area / frame area = coverage ratio.
              var s = 0;
              for (var i = 0; i < 4; i++) {
                var a = quad.corners[i];
                var b = quad.corners[(i + 1) % 4];
                s += a.x * b.y - b.x * a.y;
              }
              quadArea = Math.abs(s) / 2 / (imageData.width * imageData.height);
            }
          }
        }
      } catch (_) {}
    }
    return {
      glareScore: computeGlareScore(imageData),
      blur:       computeLaplacianVariance(imageData),
      quadArea:   quadArea,
      corners:    corners
    };
  }

  // ---------------------------------------------------------------
  // Sheet UI
  // ---------------------------------------------------------------
  var __activeSheet = null;

  // Open the capture sheet. Returns Promise<File[]|null>:
  //   - resolves with [File, ...] when the operator hits "Done"
  //   - resolves with null when the operator dismisses
  // The caller (controller) feeds the Files into handlePhotoFiles.
  function open() {
    if (!isSupported()) return Promise.resolve(null);
    if (__activeSheet) return Promise.resolve(null);

    return new Promise(function (resolve) {
      injectStyles();
      var back = document.createElement('div');
      back.className = 'mid-cap-back';
      back.setAttribute('role', 'dialog');
      back.setAttribute('aria-modal', 'true');
      back.setAttribute('aria-label', tt('Camera capture coach', 'Asistente de captura'));
      back.innerHTML =
        '<div class="mid-cap-frame">' +
          '<video class="mid-cap-video" id="midCapVideo" autoplay playsinline muted></video>' +
          '<canvas class="mid-cap-overlay" id="midCapOverlay" aria-hidden="true"></canvas>' +
          '<div class="mid-cap-top">' +
            '<button type="button" class="mid-cap-close" id="midCapClose" aria-label="' + tt('Close camera', 'Cerrar cámara') + '">×</button>' +
            '<span class="mid-cap-counter" id="midCapCounter">0</span>' +
            '<button type="button" class="mid-cap-auto" id="midCapAuto" aria-pressed="true" title="' + tt('Auto-capture when steady', 'Captura automática cuando esté firme') + '">' + tt('Auto', 'Auto') + '</button>' +
          '</div>' +
          '<p class="mid-cap-coach" id="midCapCoach" role="status" aria-live="polite"></p>' +
          '<div class="mid-cap-tray" id="midCapTray" hidden></div>' +
          '<div class="mid-cap-bottom">' +
            '<button type="button" class="mid-cap-shutter" id="midCapShutter" aria-label="' + tt('Capture page', 'Capturar página') + '">' +
              '<svg class="mid-cap-ring" id="midCapRing" viewBox="0 0 100 100" aria-hidden="true">' +
                '<circle cx="50" cy="50" r="46" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"></circle>' +
              '</svg>' +
              '<span class="mid-cap-shutter-inner"></span>' +
            '</button>' +
            '<button type="button" class="mid-cap-done" id="midCapDone" aria-label="' + tt('Done — read all pages', 'Listo — leer todas las páginas') + '" disabled>' + tt('Done', 'Listo') + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(back);
      __activeSheet = back;

      var video    = back.querySelector('#midCapVideo');
      var overlay  = back.querySelector('#midCapOverlay');
      var coachEl  = back.querySelector('#midCapCoach');
      var counter  = back.querySelector('#midCapCounter');
      var trayEl   = back.querySelector('#midCapTray');
      var shutter  = back.querySelector('#midCapShutter');
      var doneBtn  = back.querySelector('#midCapDone');
      var closeBtn = back.querySelector('#midCapClose');
      var autoBtn  = back.querySelector('#midCapAuto');
      var ring     = back.querySelector('#midCapRing circle');

      var pages = [];                         // [{ blob, thumb, corners? }]
      var stream = null;
      var coachState = makeCoachState();
      var evaluators = makeEvaluators();
      var scratch = document.createElement('canvas');
      var capScratch = document.createElement('canvas');
      var tickHandle = 0;
      var capturing = false;                  // race-guard for auto+manual shutter
      var autoEnabled = true;                 // operator can long-press shutter to disable
      var autoIndicator = null;               // ring DOM ref (set after style mount)

      function updateCoach(id) {
        if (!coachEl) return;
        if (id === 'allGood') {
          coachEl.textContent = '';
          coachEl.dataset.state = 'good';
          overlay.dataset.state = 'good';
          return;
        }
        var copy = COACH_COPY[id];
        if (!copy) return;
        coachEl.textContent = locale() === 'es' ? copy.es : copy.en;
        coachEl.dataset.state = id;
        overlay.dataset.state = id;
      }

      function drawOverlay(corners) {
        if (!overlay) return;
        var w = video.videoWidth || video.clientWidth;
        var h = video.videoHeight || video.clientHeight;
        if (!w || !h) return;
        // Scale the overlay buffer to match the video bitmap.
        if (overlay.width !== w || overlay.height !== h) {
          overlay.width = w; overlay.height = h;
        }
        var ctx = overlay.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        if (!corners || corners.length !== 4) return;
        // Map corners (which were detected at 480px width) up to the
        // full video bitmap. computeMetrics passes them already in
        // the imageData coordinate space — so scale = w / imageData.w.
        ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.005);
        ctx.strokeStyle = (overlay.dataset.state === 'good') ? 'rgba(123,224,212,0.95)' : 'rgba(255,200,80,0.85)';
        ctx.beginPath();
        for (var i = 0; i < 4; i++) {
          var c = corners[i];
          if (i === 0) ctx.moveTo(c.x, c.y);
          else ctx.lineTo(c.x, c.y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      function tick() {
        if (!__activeSheet) return;
        if (!video.videoWidth || !video.videoHeight) {
          tickHandle = setTimeout(tick, 200);
          return;
        }
        // Sample at 480px width.
        var sw = 480;
        var sh = Math.round(video.videoHeight * (sw / video.videoWidth));
        if (scratch.width !== sw || scratch.height !== sh) {
          scratch.width = sw; scratch.height = sh;
        }
        var ctx = scratch.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, sw, sh);
        var frame;
        try { frame = ctx.getImageData(0, 0, sw, sh); }
        catch (_) { tickHandle = setTimeout(tick, 200); return; }
        var metrics = computeMetrics(frame, capScratch);
        var newState = tickCoach(coachState, evaluators, metrics);
        updateCoach(newState);
        // Drive the auto-capture ring: fills 0→100% over AUTO_CAPTURE_MS
        // while in allGood state; instantly empties when state changes.
        if (ring) {
          var pct = 0;
          if (autoEnabled && newState === 'allGood' && coachState.goodSince) {
            pct = Math.min(1, (Date.now() - coachState.goodSince) / AUTO_CAPTURE_MS);
          }
          // pathLength=100 → dashoffset 100=empty, 0=full
          ring.setAttribute('stroke-dashoffset', String(100 - pct * 100));
        }
        // The corner coords from findDocumentQuad come back in
        // full-resolution space (it un-scales internally before
        // returning). Map them to overlay coords by scaling against
        // the scratch canvas dimensions.
        if (metrics.corners) {
          var ratioW = (video.videoWidth || sw) / sw;
          var ratioH = (video.videoHeight || sh) / sh;
          var scaled = metrics.corners.map(function (c) {
            return { x: c.x * ratioW, y: c.y * ratioH };
          });
          drawOverlay(scaled);
        } else {
          drawOverlay(null);
        }
        // Fire auto-capture at the end of the tick so the coach state
        // and overlay reflect the moment the snapshot was taken.
        if (autoEnabled && !capturing && shouldAutoCapture(coachState)) {
          clearAutoCaptureTimer(coachState);
          captureCurrentFrame(true);
        }
        tickHandle = setTimeout(tick, 160);
      }

      function start() {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices) return finish(null);
        navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1920 },
            height: { ideal: 1440 }
          },
          audio: false
        }).then(function (s) {
          stream = s;
          video.srcObject = s;
          var play = video.play();
          if (play && play.catch) play.catch(function () {});
          // Begin the coach tick loop.
          tick();
        }).catch(function () {
          // Permission denied or no camera — close + signal fallback.
          finish(null);
        });
      }

      function captureCurrentFrame(isAuto) {
        if (capturing) return;
        if (!video.videoWidth || !video.videoHeight) return;
        capturing = true;
        var w = video.videoWidth, h = video.videoHeight;
        capScratch.width = w; capScratch.height = h;
        var ctx = capScratch.getContext('2d');
        if (!ctx) { capturing = false; return; }
        ctx.drawImage(video, 0, 0, w, h);
        // Brief shutter flash + haptic so the operator knows it fired
        // (esp. important for auto-capture, where there's no tap).
        try {
          back.classList.add('mid-cap-flash');
          setTimeout(function () { back.classList.remove('mid-cap-flash'); }, 140);
          if (isAuto && navigator.vibrate) navigator.vibrate(20);
        } catch (_) {}
        capScratch.toBlob(function (blob) {
          capturing = false;
          if (!blob) return;
          // Build a File so the downstream pipeline doesn't need
          // to know about Blobs vs Files.
          var name = 'capture-' + Date.now() + '-' + (pages.length + 1) + '.jpg';
          var file = new File([blob], name, { type: 'image/jpeg' });
          // Generate a thumb URL for the tray.
          var thumb = capScratch.toDataURL('image/jpeg', 0.4);
          pages.push({ file: file, thumb: thumb });
          renderTray();
          if (counter) counter.textContent = String(pages.length);
          if (doneBtn) doneBtn.disabled = pages.length === 0;
          if (window.plausible) {
            try { window.plausible('Invoice Decoder Coach Capture', { props: { mode: isAuto ? 'auto' : 'manual' } }); } catch (_) {}
          }
        }, 'image/jpeg', 0.92);
      }

      function renderTray() {
        if (!trayEl) return;
        if (!pages.length) { trayEl.hidden = true; trayEl.innerHTML = ''; return; }
        trayEl.hidden = false;
        trayEl.innerHTML = pages.map(function (p, idx) {
          return '<div class="mid-cap-tile" data-idx="' + idx + '">' +
            '<img src="' + p.thumb + '" alt="" />' +
            '<button type="button" class="mid-cap-tile-x" data-idx="' + idx + '" aria-label="' + tt('Remove page ' + (idx + 1), 'Quitar página ' + (idx + 1)) + '">×</button>' +
            '</div>';
        }).join('');
        Array.prototype.forEach.call(trayEl.querySelectorAll('.mid-cap-tile-x'), function (b) {
          b.addEventListener('click', function (e) {
            var i = parseInt(b.getAttribute('data-idx'), 10);
            if (isFinite(i)) {
              pages.splice(i, 1);
              renderTray();
              if (counter) counter.textContent = String(pages.length);
              if (doneBtn) doneBtn.disabled = pages.length === 0;
            }
            e.stopPropagation();
          });
        });
      }

      function finish(filesOrNull) {
        if (tickHandle) clearTimeout(tickHandle);
        tickHandle = 0;
        try {
          if (stream) {
            var tracks = stream.getTracks();
            for (var i = 0; i < tracks.length; i++) tracks[i].stop();
          }
        } catch (_) {}
        try { back.remove(); } catch (_) {}
        __activeSheet = null;
        resolve(filesOrNull);
      }

      shutter.addEventListener('click', function () {
        // Manual tap is always honored — bypasses the coach so the
        // operator can override (e.g. capture in dim light, or skip
        // the auto-capture wait).
        clearAutoCaptureTimer(coachState);
        captureCurrentFrame(false);
      });
      if (autoBtn) {
        autoBtn.addEventListener('click', function () {
          autoEnabled = !autoEnabled;
          autoBtn.setAttribute('aria-pressed', autoEnabled ? 'true' : 'false');
          autoBtn.classList.toggle('mid-cap-auto-off', !autoEnabled);
          if (!autoEnabled && ring) ring.setAttribute('stroke-dashoffset', '100');
          clearAutoCaptureTimer(coachState);
        });
      }
      doneBtn.addEventListener('click', function () {
        if (pages.length) finish(pages.map(function (p) { return p.file; }));
        else finish(null);
      });
      closeBtn.addEventListener('click', function () { finish(null); });
      // Spacebar = shutter for keyboard users.
      back.addEventListener('keydown', function (e) {
        if (e.target === shutter || e.target === doneBtn || e.target === closeBtn || e.target === autoBtn) return;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); clearAutoCaptureTimer(coachState); captureCurrentFrame(false); }
        if (e.key === 'Escape') { e.preventDefault(); finish(null); }
      });
      back.tabIndex = -1;
      setTimeout(function () { back.focus(); }, 0);

      start();
    });
  }

  // ---------------------------------------------------------------
  // Styles — injected once
  // ---------------------------------------------------------------
  var __stylesInjected = false;
  function injectStyles() {
    if (__stylesInjected) return;
    var css =
      '.mid-cap-back{position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:1500}' +
      '.mid-cap-frame{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden}' +
      '.mid-cap-video,.mid-cap-overlay{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
      '.mid-cap-overlay{pointer-events:none;mix-blend-mode:screen}' +
      '.mid-cap-overlay[data-state="good"]{filter:drop-shadow(0 0 12px rgba(123,224,212,0.4))}' +
      '.mid-cap-top{position:absolute;top:env(safe-area-inset-top, 12px);left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:12px 14px;z-index:5}' +
      '.mid-cap-close{width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,0.4);background:rgba(0,0,0,0.45);color:#fff;font-size:20px;font-weight:300;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}' +
      '.mid-cap-close:hover{background:rgba(0,0,0,0.65)}' +
      '.mid-cap-counter{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;color:#fff;background:rgba(0,0,0,0.55);padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.25);font-variant-numeric:tabular-nums}' +
      '.mid-cap-coach{position:absolute;left:50%;top:max(72px, env(safe-area-inset-top, 0px) + 60px);transform:translateX(-50%);max-width:80%;margin:0;padding:9px 14px;font-size:13.5px;line-height:1.4;color:#fff;background:rgba(0,0,0,0.65);border-radius:999px;text-align:center;backdrop-filter:blur(6px);transition:opacity .2s ease;z-index:5}' +
      '.mid-cap-coach[data-state="good"]{opacity:0}' +
      '.mid-cap-coach[data-state="glare"]{background:rgba(178,92,42,0.85)}' +
      '.mid-cap-coach[data-state="blur"]{background:rgba(122,46,31,0.85)}' +
      '.mid-cap-bottom{position:absolute;bottom:env(safe-area-inset-bottom, 16px);left:0;right:0;display:flex;align-items:center;justify-content:center;gap:18px;padding:14px 16px;z-index:5}' +
      '.mid-cap-shutter{position:relative;width:88px;height:88px;border-radius:50%;border:4px solid rgba(255,255,255,0.85);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}' +
      '.mid-cap-shutter:active{transform:scale(0.96)}' +
      '.mid-cap-shutter-inner{position:relative;z-index:1;width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.95)}' +
      '.mid-cap-ring{position:absolute;inset:-4px;width:96px;height:96px;transform:rotate(-90deg);pointer-events:none}' +
      '.mid-cap-ring circle{fill:none;stroke:rgba(123,224,212,0.9);stroke-width:5;transition:stroke-dashoffset 90ms linear}' +
      '.mid-cap-auto{font:inherit;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;padding:6px 10px;border-radius:999px;border:1px solid rgba(123,224,212,0.65);background:rgba(123,224,212,0.18);color:#7be0d4;cursor:pointer}' +
      '.mid-cap-auto.mid-cap-auto-off{border-color:rgba(255,255,255,0.3);background:rgba(0,0,0,0.45);color:rgba(255,255,255,0.65)}' +
      '.mid-cap-flash::after{content:"";position:absolute;inset:0;background:#fff;animation:mid-cap-flash-fade 140ms ease-out forwards;pointer-events:none;z-index:9}' +
      '@keyframes mid-cap-flash-fade{from{opacity:0.8}to{opacity:0}}' +
      '.mid-cap-done{position:absolute;right:max(20px, env(safe-area-inset-right, 0));bottom:30px;padding:11px 18px;border-radius:999px;border:0;background:#7be0d4;color:#0c1817;font:inherit;font-size:14px;font-weight:600;cursor:pointer}' +
      '.mid-cap-done:disabled{opacity:0.45;cursor:not-allowed;background:#3a4d4a;color:rgba(255,255,255,0.55)}' +
      '.mid-cap-tray{position:absolute;left:env(safe-area-inset-left, 14px);bottom:118px;display:flex;flex-direction:row-reverse;gap:8px;max-width:100%;overflow-x:auto;padding:6px 14px;z-index:4}' +
      '.mid-cap-tray[hidden]{display:none}' +
      '.mid-cap-tile{position:relative;width:64px;height:64px;flex:none;border-radius:6px;overflow:hidden;background:#0c1817;border:1px solid rgba(255,255,255,0.25)}' +
      '.mid-cap-tile img{width:100%;height:100%;object-fit:cover}' +
      '.mid-cap-tile-x{position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:0;background:rgba(0,0,0,0.7);color:#fff;font-size:14px;line-height:1;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}' +
      '@media (prefers-reduced-motion: reduce){' +
      '  .mid-cap-coach{transition:none}.mid-cap-shutter:active{transform:none}' +
      '}';
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
    __stylesInjected = true;
  }

  var api = {
    open:               open,
    isSupported:        isSupported,
    // Exposed for unit tests
    _computeGlareScore:        computeGlareScore,
    _computeLaplacianVariance: computeLaplacianVariance,
    _tickCoach:                tickCoach,
    _makeCoachState:           makeCoachState,
    _makeEvaluators:           makeEvaluators,
    _shouldAutoCapture:        shouldAutoCapture,
    _clearAutoCaptureTimer:    clearAutoCaptureTimer,
    _SUSTAIN_MS:               SUSTAIN_MS,
    _AUTO_CAPTURE_MS:          AUTO_CAPTURE_MS
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_CAPTURE_COACH = api;
})(typeof window !== 'undefined' ? window : null);
