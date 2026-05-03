/**
 * Invoice Decoder — controller (Wave B1).
 *
 * Wires the three input chips (photo / PDF / CSV) to the
 * preprocessing pipeline and shows the cleaned-up image so the
 * owner can verify their shot is good enough before B2's OCR
 * lands. PDF + CSV paths are scaffolded but their parsers ship
 * with B2 — for now they show a "coming next" notice.
 *
 * Privacy posture: zero fetch, zero localStorage writes from this
 * file. The preprocessing pipeline runs entirely in canvas. The
 * check-tool-no-fetch invariant must remain satisfied.
 */
(function () {
  'use strict';

  // -------------------- DOM --------------------
  var photoInput  = document.getElementById('idPhotoInput');
  var pdfInput    = document.getElementById('idPdfInput');
  var csvInput    = document.getElementById('idCsvInput');
  var statusEl    = document.getElementById('idStatus');
  var statusTitle = document.getElementById('idStatusTitle');
  var statusMsg   = document.getElementById('idStatusMsg');
  var progressFill= document.getElementById('idProgressFill');
  var previewEl   = document.getElementById('idPreview');
  var rawImg      = document.getElementById('idRawImg');
  var cleanImg    = document.getElementById('idCleanImg');
  var previewMeta = document.getElementById('idPreviewMeta');
  var comingEl    = document.getElementById('idComing');
  var readBtn     = document.getElementById('idReadBtn');
  var parsedEl    = document.getElementById('idParsed');
  var parsedCount = document.getElementById('idParsedCount');
  var parsedVendor= document.getElementById('idParsedVendor');
  var parsedMeta  = document.getElementById('idParsedMeta');
  var parsedList  = document.getElementById('idParsedList');
  var parsedTotals= document.getElementById('idParsedTotals');

  // Wave-B2 state — captured pages waiting for OCR. Array of
  // { file, aggressive: canvas, gentle: canvas }. Populated when
  // photos are picked + preprocessed; consumed when "Read this
  // invoice" is tapped. Wave B5 will let the user remove pages
  // before reading; for B2 we read all pages in order.
  var pendingPages = [];
  // Wave 8.7 — wire the Privacy Self-Check button.
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || t.id !== 'idSelfCheckRun') return;
      if (typeof MID_SELF_CHECK === 'undefined' || !MID_SELF_CHECK.run) return;
      var out = document.getElementById('idSelfCheckOut');
      if (out) out.innerHTML = '<p class="id-sc-running">Running…</p>';
      MID_SELF_CHECK.run({ fixtureId: 'sysco', includeOcr: false }).then(function (report) {
        if (out) MID_SELF_CHECK.renderReport(report, out);
        if (window.plausible) {
          try { window.plausible('Invoice Decoder Self Check', { props: { ok: report.ok ? 'true' : 'false' } }); } catch (_) {}
        }
      }).catch(function (err) {
        if (out) out.innerHTML = '<p class="id-sc-fail">Self-check failed to run: ' + (err && err.message || 'unknown error') + '</p>';
      });
    });
  }

  // Wave 6.11 — surface the personal-accuracy stat on the verified
  // line once the operator has saved ≥ 3 invoices. Replaces the
  // static "Last verified May 2" copy with their own accuracy.
  function _maybeSurfacePersonalAccuracy() {
    try {
      var el = document.getElementById('idToolVerified');
      if (!el) return;
      if (typeof MID_TELEMETRY === 'undefined' || !MID_TELEMETRY.getPersonalAccuracy) return;
      var saved = MID_TELEMETRY.get('invoicesSaved') || 0;
      if (saved < 3) return;
      var acc = MID_TELEMETRY.getPersonalAccuracy(90);
      if (acc == null) return;
      var pct = Math.round(acc * 100);
      el.textContent = (LOCALE === 'es')
        ? 'En tus últimas ' + Math.min(5, saved) + ' facturas, ' + pct + '% de las filas se leyeron bien la primera vez.'
        : 'On your last ' + Math.min(5, saved) + ' invoices, ' + pct + '% of rows read correctly first time.';
    } catch (_) {}
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _maybeSurfacePersonalAccuracy);
    } else _maybeSurfacePersonalAccuracy();
  }

  // Wave 1.2/1.4 — classification result + profile threaded by the
  // unified dispatcher. 'phone' keeps today's full-cleanup behavior.
  var _activePreprocessProfile = 'phone';
  var _activeClassification = null;
  // Wave 3.4 — quality-gate override state. Set when the operator
  // confirms "read it anyway" on a hopeless photo so the gate doesn't
  // fire again on the same pendingPages.
  var _qualityGateOverridden = false;

  var LOCALE = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2);
  function tt(en, es) { return LOCALE === 'es' ? es : en; }

  // -------------------- Status helpers --------------------
  function showStatus(title, msg, kind) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.classList.remove('error');
    if (kind === 'error') statusEl.classList.add('error');
    if (statusTitle) statusTitle.textContent = title || '';
    if (statusMsg) statusMsg.textContent = msg || '';
  }
  function setProgress(pct) {
    if (progressFill) progressFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
  }
  function hideStatus() { if (statusEl) statusEl.hidden = true; }
  function setActiveChip(input) {
    var chips = document.querySelectorAll('.id-input-chip');
    chips.forEach(function (c) {
      c.dataset.active = (c.dataset.input === input) ? 'true' : 'false';
    });
  }

  // -------------------- Photo handler --------------------
  function handlePhotoFiles(fileList, opts) {
    if (!fileList || !fileList.length) return;
    // Wave 1.2 — accept a classification opts so the preprocess
    // pipeline can pick a profile-aware path (Wave 1.4). Backward
    // compatible: callers without opts still get the default 'phone'
    // pipeline, which is the conservative full-cleanup path.
    opts = opts || {};
    var profile = (opts.classification && opts.classification.preprocessProfile) || 'phone';
    var classification = opts.classification || null;
    // Stash on a closure-visible var so the multi-page reduce loop
    // below can pass it into preprocessFile() without restructuring.
    _activePreprocessProfile = profile;
    _activeClassification = classification;
    if (typeof MID_PREPROCESS === 'undefined') {
      showStatus(
        tt('Preprocess module missing', 'Falta el módulo de preprocesamiento'),
        tt('Refresh the page and try again.', 'Recarga la página e intenta de nuevo.'),
        'error'
      );
      return;
    }
    setActiveChip('photo');
    showStatus(
      tt('Reading the photo…', 'Leyendo la foto…'),
      tt('Cleaning up the image so the next step gets the best shot.',
         'Limpiando la imagen para que el siguiente paso tenga la mejor base.')
    );
    setProgress(8);
    if (previewEl) previewEl.hidden = true;
    if (comingEl) comingEl.hidden = true;

    // For Wave B1 we preview the FIRST page only; multi-page sweep
    // (and per-page status) ships with B2 alongside the OCR loop.
    var file = fileList[0];
    // Wave 5.3 — auto-resize oversized photos via canvas downsample
    // before failing. Operator's own camera-roll image gets handled
    // gracefully without forcing them to manually shrink.
    if (file.size > 12 * 1024 * 1024) {
      showStatus(
        tt('Photo is large — shrinking it for you…', 'Foto grande — la achicamos por ti…'),
        tt('Down-sampling to 6 MP. Most invoices read fine at this resolution.',
           'Reduciendo a 6 MP. La mayoría de facturas se leen bien a esta resolución.')
      );
      try {
        if (typeof MID_PREPROCESS !== 'undefined' && MID_PREPROCESS.fileToCanvas) {
          MID_PREPROCESS.fileToCanvas(file, 1800).then(function (canvas) {
            return new Promise(function (res) {
              canvas.toBlob(function (blob) { res(blob); }, 'image/jpeg', 0.9);
            });
          }).then(function (blob) {
            if (!blob) throw new Error('resize failed');
            var resized = new File([blob], 'resized.jpg', { type: 'image/jpeg' });
            var rest = Array.prototype.slice.call(fileList, 1);
            handlePhotoFiles([resized].concat(rest));
          }).catch(function () {
            showStatus(
              tt('Photo too large', 'Foto muy grande'),
              tt('Auto-resize failed. Try a lower-resolution shot — most invoices read fine at 4–6 MP.',
                 'Falló el auto-redimensionado. Intenta una foto de menor resolución — la mayoría se leen bien con 4–6 MP.'),
              'error'
            );
          });
          return;
        }
      } catch (_) {}
      showStatus(
        tt('Photo too large', 'Foto muy grande'),
        tt('That photo is over 12 MB. Try a lower-resolution shot — most invoices read fine at 4–6 MP.',
           'Esa foto pasa de 12 MB. Intenta con menor resolución — la mayoría de facturas se leen bien con 4–6 MP.'),
        'error'
      );
      return;
    }

    setProgress(15);
    // Show the raw photo (page 1) immediately so the owner sees
    // something while preprocessing runs.
    var firstFile = fileList[0];
    var rawUrl = URL.createObjectURL(firstFile);
    if (rawImg) rawImg.src = rawUrl;

    // Preprocess every page through BOTH presets so Wave-B2 OCR
    // can run multi-pass and take per-line max confidence. Memory
    // ceiling: ~2000px × 2000px × 4 bytes × 2 presets × 8 pages
    // = ~250 MB worst case. Most phones have plenty; if a 12-page
    // burst trips this, we'll add a "process in batches" path in
    // a future polish wave.
    pendingPages = [];
    var files = Array.prototype.slice.call(fileList).slice(0, 8);
    var perFileShare = 80 / files.length;
    var doneFiles = 0;

    files.reduce(function (chain, file, idx) {
      return chain.then(function () {
        // Wave 1.4 — thread the classification's preprocessProfile so
        // 'scanner' / 'screenshot' / 'thermal' inputs skip the cleanup
        // they don't need. 'phone' remains the safe full pipeline.
        return Promise.all([
          MID_PREPROCESS.preprocessFile(file, { preset: 'aggressive', maxEdge: 2000, profile: _activePreprocessProfile }),
          MID_PREPROCESS.preprocessFile(file, { preset: 'gentle',     maxEdge: 2000, profile: _activePreprocessProfile })
        ]).then(function (results) {
          pendingPages.push({
            file: file,
            aggressive: results[0].canvas,
            gentle: results[1].canvas,
            skewAngle: results[0].skewAngle,
            threshold: results[0].threshold,
            // W2-3: store quality metrics so the controller can
            // coach a retake BEFORE OCR runs (pre-empts wasted
            // 30s of OCR time on a blurry shot).
            blurScore: results[0].blurScore,
            bimodalityScore: results[0].bimodalityScore,
            qualityHint: results[0].qualityHint,
            // Wave 2.2 — surface rectification result so the preview
            // meta can report "We straightened the page perspective".
            rectified: !!results[0].rectified,
            rectifyConfidence: results[0].rectifyConfidence || null,
            // Wave 3.3/3.4 — glare metrics for the quality gate.
            glareRatio: results[1].glareRatio || 0,
            glareRepaired: !!results[1].glareRepaired
          });
          doneFiles++;
          setProgress(15 + perFileShare * doneFiles);
          // Keep the on-screen cleaned-image preview pinned to
          // page 1 so the owner has a stable reference.
          if (idx === 0 && cleanImg) {
            cleanImg.src = MID_PREPROCESS.canvasToDataUrl(results[0].canvas);
          }
        });
      });
    }, Promise.resolve()).then(function () {
      var first = pendingPages[0];
      if (previewEl) previewEl.hidden = false;
      if (previewMeta) {
        // Wave 2.2 — when perspective rectification fired we lead
        // with that signal; skew becomes informational.
        var rectLabel = first.rectified
          ? tt('Page perspective fixed · ', 'Perspectiva de página corregida · ')
          : '';
        var skewLabel = Math.abs(first.skewAngle) >= 1
          ? tt('Straightened by ' + first.skewAngle + '° · ', 'Enderezada ' + first.skewAngle + '° · ')
          : (first.rectified ? '' : tt('Already straight · ', 'Ya estaba derecha · '));
        skewLabel = rectLabel + skewLabel;
        var pageNote = files.length > 1
          ? tt(' · ' + files.length + ' pages ready', ' · ' + files.length + ' páginas listas')
          : '';
        previewMeta.innerHTML = '<strong>' + tt('Looks readable.', 'Se ve legible.') + '</strong> ' +
          skewLabel +
          tt('Threshold ' + first.threshold + ' · ' + first.aggressive.width + '×' + first.aggressive.height + ' px' + pageNote,
             'Umbral ' + first.threshold + ' · ' + first.aggressive.width + '×' + first.aggressive.height + ' px' + pageNote) + '. ' +
          tt('If the cleaned version on the right looks blurry or cut off, try a flatter, brighter shot.',
             'Si la versión limpia se ve borrosa o cortada, prueba una foto más plana y brillante.');
      }
      setProgress(100);
      // W2-3: image-quality coaching. When ANY page returns
      // 'blurry' or 'low-contrast', surface a soft chip BEFORE
      // OCR so the operator can retake the photo (pre-empts
      // ~30s of wasted OCR time + ~5min of cleanup-after-the-
      // fact). 'good' pages flow through silently.
      var worstHint = 'good';
      pendingPages.forEach(function (p) {
        if (p.qualityHint === 'blurry') worstHint = 'blurry';
        else if (p.qualityHint === 'low-contrast' && worstHint === 'good') worstHint = 'low-contrast';
      });
      if (worstHint === 'blurry') {
        showStatus(
          tt('This photo looks blurry.', 'Esta foto se ve borrosa.'),
          tt('Reading it anyway will give you ~70% accuracy. A flatter, brighter shot will give you ~95%. Want to retake?',
             'Leerla de todos modos te dará ~70% de precisión. Una foto más plana y brillante te dará ~95%. ¿Quieres re-tomar?')
        );
      } else if (worstHint === 'low-contrast') {
        showStatus(
          tt('Photo ready — but contrast is faded.', 'Foto lista — pero el contraste es bajo.'),
          tt('We\'ll read it, but expect a few extra amber rows to verify. A photo in brighter light reads sharper.',
             'La leeremos, pero espera algunas filas en ámbar para verificar. Una foto con más luz se lee más nítida.')
        );
      } else {
        showStatus(
          tt('Photo ready.', 'Foto lista.'),
          tt(files.length === 1 ? 'Cleaned up. Tap "Read this invoice" to extract every line.' :
                                  'Cleaned up ' + files.length + ' pages. Tap "Read this invoice" to extract every line.',
             files.length === 1 ? 'Limpia. Toca "Leer esta factura" para extraer cada línea.' :
                                  'Limpias ' + files.length + ' páginas. Toca "Leer esta factura" para extraer cada línea.')
        );
      }
      if (comingEl) comingEl.hidden = false;
      if (readBtn) readBtn.hidden = false;
      // Wave 5.5 — persist an abandonment-resume record. We only
      // store metadata (page count, vendor hint), never the raw
      // photo bytes. On next load, onboarding.js offers to resume.
      try {
        if (typeof MID_ONBOARDING !== 'undefined' && MID_ONBOARDING.saveResumeRecord) {
          MID_ONBOARDING.saveResumeRecord({
            pageCount: pendingPages.length,
            qualityHint: worstHint,
            stage: 'preprocessed'
          });
        }
      } catch (_) {}
      if (window.plausible) {
        window.plausible('Invoice Decoder Preprocess', { props: {
          skew_bucket: Math.abs(first.skewAngle) >= 5 ? 'high' : Math.abs(first.skewAngle) >= 1 ? 'low' : 'none',
          quality: worstHint,
          pages: String(files.length)
        } });
      }
    }).catch(function (err) {
      showStatus(
        tt('Could not read this photo.', 'No se pudo leer esta foto.'),
        tt('Try a clearer shot or a PDF if your distributor offers one. ' + (err && err.message ? '(' + err.message + ')' : ''),
           'Prueba una foto más clara o un PDF si tu distribuidor lo ofrece. ' + (err && err.message ? '(' + err.message + ')' : '')),
        'error'
      );
    });
  }

  // Shared helper used by the OCR / PDF / CSV / share-target paths.
  // Runs MID_CATEGORIZE.classify on each row, stamps the standard
  // category fields, then runs MID_PACK_PRICING to attach the
  // pack-aware comparable price (domain-expert layer). Mutates rows
  // in place.
  function classifyRows(rows, opts) {
    if (!Array.isArray(rows)) return;
    opts = opts || {};
    var vendor = opts.vendor || null;
    if (typeof MID_CATEGORIZE !== 'undefined' && MID_CATEGORIZE.classify) {
      // Wave 5.6 — pass a rolling context window into the classifier
      // so the co-occurrence Tier 0.8 can read the previous 5 rows.
      for (var i = 0; i < rows.length; i++) {
        var c = MID_CATEGORIZE.classify(rows[i], { context: rows.slice(Math.max(0, i - 5), i) });
        rows[i].category           = c.category;
        rows[i].categoryConfidence = c.confidence;
        rows[i].categoryTier       = c.tier;
        rows[i].categorySource     = c.source || null;
        rows[i].tags               = c.tags || [];
      }
    }
    // Wave 4.5 — same-vendor SKU memory bias. For amber-name rows,
    // look for a high-confidence stem match in the operator's recent
    // history with the same vendor; when found, raise the name conf
    // and tag the row so the proof flyout can show "biased toward
    // your prior 'Boneless skinless thigh' SKU." Conservative —
    // requires ≥2 prior observations and edit distance ≤ 2.
    if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.findClosestVendorMemory) {
      for (var k = 0; k < rows.length; k++) {
        var r = rows[k];
        if (!r || !r.fieldConf || r.fieldConf.name >= 80) continue;
        if (!r.name || r.name.length < 4) continue;
        try {
          var mem = MID_SKU_HISTORY.findClosestVendorMemory(r.name, vendor);
          if (mem && mem.observations >= 2) {
            // Boost name confidence proportionally to closeness; we
            // don't replace the OCR text outright (operator's prior
            // correction already lives in the learnings module),
            // we just signal trust.
            r.fieldConf.name = Math.min(95, r.fieldConf.name + 12 - mem.distance * 3);
            r._skuMemoryHit = mem;
            r.confidence = Math.min(r.fieldConf.name, r.fieldConf.qty || 80, r.fieldConf.price || 80);
          }
        } catch (_) {}
      }
    }
    // Pack-aware unit pricing (domain-expert layer). Categorization
    // runs first so pack-pricing can disambiguate 'oz' between
    // fl_oz (beverage) and weight-oz (dry-goods).
    if (typeof MID_PACK_PRICING !== 'undefined' && MID_PACK_PRICING.computeComparable) {
      for (var j = 0; j < rows.length; j++) {
        var comp = MID_PACK_PRICING.computeComparable(rows[j]);
        if (comp) rows[j].comparable = comp;
      }
    }
  }

  // -------------------- OCR + parse (Wave B2) --------------------
  // Runs multi-pass OCR on every captured page in sequence, parses
  // the merged line set, then renders the read-only parsed-rows
  // panel. Wave B5 will turn this into the editable verification
  // card-stack with confidence chips and inline editors.
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // W2-5: dedup-key normalizer. Lower-cased, whitespace-collapsed,
  // OCR-noise tolerant (drops the leading/trailing punctuation
  // that frequently flips between page reads). Empty strings
  // return '' so the caller can skip them.
  function normalizeForDedup(s) {
    if (!s) return '';
    var n = String(s).toLowerCase()
      .replace(/[^\w\s]/g, ' ')   // collapse punctuation
      .replace(/\s+/g, ' ')
      .trim();
    return (n.length >= 4) ? n : '';
  }
  function confBand(c) { return c >= 80 ? 'green' : c >= 60 ? 'amber' : 'red'; }
  // Restaurant-real category labels, EN + ES. The lexicon keys
  // are stable identifiers; these are the user-facing strings.
  var CAT_LABEL_EN = {
    protein: 'Protein', seafood: 'Seafood', produce: 'Produce', dairy: 'Dairy',
    'dry-goods': 'Dry goods', 'herbs-spices': 'Herbs & spices',
    paper: 'Paper goods', cleaning: 'Cleaning', beverage: 'Beverage'
  };
  var CAT_LABEL_ES = {
    protein: 'Proteína', seafood: 'Mariscos', produce: 'Verduras', dairy: 'Lácteos',
    'dry-goods': 'Abarrotes', 'herbs-spices': 'Hierbas y especias',
    paper: 'Papel', cleaning: 'Limpieza', beverage: 'Bebidas'
  };
  function catLabel(cat) {
    if (!cat) return tt('uncategorized', 'sin categoría');
    return (LOCALE === 'es' ? CAT_LABEL_ES[cat] : CAT_LABEL_EN[cat]) || cat;
  }

  // Wave 3.4 — should we refuse to OCR this page? Two failure modes:
  //   (a) blurry: laplacian variance < 60 means the photo is out of
  //       focus past the point Tesseract can read it. ~30 sec of
  //       wasted OCR returns mostly garbage.
  //   (b) glared + low-contrast: glareRatio > 0.20 plus low bimodality
  //       means specular highlights swallowed half the page. Inpaint
  //       can't rescue more than ~10% glare; beyond that the operator
  //       needs to retake.
  // Only fires for the 'phone' profile — scanner / thermal / screenshot
  // sources are pre-cleaned and the gate would falsely fire on them.
  function _shouldRefuseOcr(page) {
    if (!page) return false;
    if (_activePreprocessProfile && _activePreprocessProfile !== 'phone') return false;
    var hopelesslyBlurry = (typeof page.blurScore === 'number' && page.blurScore < 60);
    var glaredAndLow = ((page.glareRatio || 0) > 0.20 && (page.bimodalityScore || 0) < 1100);
    return hopelesslyBlurry || glaredAndLow;
  }
  function _showQualityGate(page) {
    var existing = document.getElementById('idQualityGate');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    var why;
    if ((page.blurScore || 0) < 60) {
      why = tt('This photo is too blurry to read cleanly. Tesseract will mostly return garbage on it.',
               'Esta foto está muy borrosa para leerse bien. El motor devolverá basura en su mayoría.');
    } else {
      why = tt('Glare covers about ' + Math.round((page.glareRatio || 0) * 100) + '% of this photo, which destroys the text in those regions.',
               'El reflejo cubre cerca del ' + Math.round((page.glareRatio || 0) * 100) + '% de la foto, lo que destruye el texto en esas zonas.');
    }
    var gate = document.createElement('div');
    gate.id = 'idQualityGate';
    gate.className = 'id-quality-gate';
    gate.setAttribute('role', 'alert');
    gate.innerHTML =
      '<p class="id-qg-title">' + escHtml(tt('This photo won\'t read cleanly — retake?',
                                              '¿Esta foto no se lee bien — la repites?')) + '</p>' +
      '<p class="id-qg-blurb">' + escHtml(why) + ' ' +
        escHtml(tt('A quick retake takes 5 seconds; an OCR pass takes 30+.',
                   'Repetirla toma 5 segundos; un OCR completo toma 30+.')) +
      '</p>' +
      '<div class="id-qg-row">' +
        '<button type="button" class="id-qg-retake" id="idQgRetake">' + escHtml(tt('Retake', 'Repetir')) + '</button>' +
        '<button type="button" class="id-qg-anyway" id="idQgAnyway">' + escHtml(tt('Read it anyway', 'Léelo de todos modos')) + '</button>' +
      '</div>';
    var anchor = document.getElementById('idStatus');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(gate, anchor);
    var retake = gate.querySelector('#idQgRetake');
    var anyway = gate.querySelector('#idQgAnyway');
    if (retake) retake.addEventListener('click', function () {
      // Drain pending pages and prompt for a new file via the unified
      // input. The operator can drop a fresh photo without scroll.
      pendingPages = [];
      try { gate.parentNode && gate.parentNode.removeChild(gate); } catch (_) {}
      var input = document.getElementById('idAnyInput');
      if (input) try { input.click(); } catch (_) {}
    });
    if (anyway) anyway.addEventListener('click', function () {
      _qualityGateOverridden = true;
      try { gate.parentNode && gate.parentNode.removeChild(gate); } catch (_) {}
      readPendingInvoice();
    });
  }

  function readPendingInvoice() {
    if (!pendingPages.length) return;
    if (typeof MID_OCR === 'undefined' || typeof MID_PARSE === 'undefined') {
      showStatus(tt('Reader module missing', 'Falta el módulo lector'),
                 tt('Refresh the page and try again.', 'Recarga la página e intenta de nuevo.'),
                 'error');
      return;
    }
    // Wave 3.4 — quality-gate refusal. If page 1 is hopeless (blurry
    // AND glared, OR very low contrast on a phone profile), surface a
    // "this won't read cleanly — retake?" prompt before burning ~30s
    // of OCR. Operator can override to read anyway. Suppressed once
    // they've already overridden in this session.
    if (!_qualityGateOverridden && _shouldRefuseOcr(pendingPages[0])) {
      _showQualityGate(pendingPages[0]);
      return;
    }
    if (readBtn) {
      readBtn.disabled = true;
      readBtn.innerHTML = tt('Reading…', 'Leyendo…');
    }
    showStatus(
      tt('Reading the invoice…', 'Leyendo the invoice…').replace('the invoice', 'the invoice'),
      tt('First time only: we download the reader (about 4 MB). After this it\'s saved for next time.',
         'Solo la primera vez: bajamos el lector (unos 4 MB). Queda guardado para la próxima.')
    );
    setProgress(2);
    // Wave 5.2 — phase ladder + ETA + rotating tips.
    showPhaseLadder([
      tt('Cleaning up the photo', 'Limpiando la foto'),
      tt('Reading the lines', 'Leyendo las líneas'),
      tt('Sorting into categories', 'Ordenando en categorías'),
      tt('Looking up vendor shape', 'Buscando la forma del proveedor')
    ], pendingPages.length * 12);
    advancePhase(1);
    // Wave 3.4 — skeleton rows so the operator sees structure forming.
    showSkeleton(8);

    var pageShare = 92 / pendingPages.length;
    var doneShare = 0;
    var allLines = [];
    var fullText = '';

    pendingPages.reduce(function (chain, page, pageIdx) {
      return chain.then(function () {
        return MID_OCR.recognizeMultiPass(page.aggressive, page.gentle, {
          lang: 'eng+spa',
          psm: 6,
          onProgress: function (p) {
            setProgress(2 + doneShare + p * pageShare);
            statusMsg.textContent = tt(
              'Reading page ' + (pageIdx + 1) + ' of ' + pendingPages.length + '…',
              'Leyendo página ' + (pageIdx + 1) + ' de ' + pendingPages.length + '…'
            );
          }
        }).then(function (ocrResult) {
          // W2-4: per-line adaptive bbox re-OCR. Lines that came
          // back amber (<70% confidence) and carry a bbox get
          // re-read with PSM 7 + widened whitelist on a tight crop.
          // The multipass result is passed through unchanged when
          // no candidates exist. We feed the gentle preprocessed
          // canvas — both passes share dimensions, gentle keeps
          // text most legible for a single-line read.
          if (typeof MID_OCR.adaptiveReread === 'function') {
            return MID_OCR.adaptiveReread(page.gentle, ocrResult, {
              lang: 'eng+spa',
              threshold: 70
            }).then(function (improved) {
              if (improved && improved.adaptiveStats &&
                  improved.adaptiveStats.improved > 0 &&
                  window.plausible) {
                window.plausible('Invoice Decoder Adaptive Reread', { props: {
                  page: String(pageIdx + 1),
                  reread_bucket: improved.adaptiveStats.reread < 5 ? '<5' :
                                 improved.adaptiveStats.reread < 15 ? '5-14' : '15+',
                  improved_bucket: improved.adaptiveStats.improved < 3 ? '<3' :
                                   improved.adaptiveStats.improved < 8 ? '3-7' : '8+'
                } });
              }
              return improved;
            });
          }
          return ocrResult;
        }).then(function (ocrResult) {
          // W2-5: multi-page footer-repeat dedup. A 2-page Sysco
          // invoice repeats the SYSCO HOUSTON / Customer Number /
          // column-header band on page 2; the previous concat
          // would treat each repeat as a new line and the parser
          // would silently inflate row count. We hash each
          // incoming line and skip when it matches a line already
          // present from an earlier page (whole-document window —
          // header/footer repeats can land anywhere relative to
          // the invoice body).
          var newLines = ocrResult.lines || [];
          if (pageIdx === 0) {
            // First page: trust everything.
            allLines = allLines.concat(newLines);
          } else {
            var seenHashes = new Set();
            allLines.forEach(function (l) { seenHashes.add(normalizeForDedup(l.text)); });
            var droppedRepeats = 0;
            newLines.forEach(function (l) {
              var h = normalizeForDedup(l.text);
              if (h && seenHashes.has(h)) {
                droppedRepeats++;
                return;
              }
              allLines.push(l);
              if (h) seenHashes.add(h);
            });
            if (droppedRepeats > 0 && window.plausible) {
              window.plausible('Invoice Decoder Page Dedup', { props: {
                page: String(pageIdx + 1),
                dropped_bucket: droppedRepeats < 3 ? '<3' : droppedRepeats < 8 ? '3-7' : '8+'
              } });
            }
          }
          fullText += '\n' + (ocrResult.text || '');
          doneShare += pageShare;
        });
      });
    }, Promise.resolve()).then(function () {
      setProgress(96);
      advancePhase(2);  // Wave 5.2 — sorting now
      var parsed = MID_PARSE.parseLines(allLines, fullText);
      // Wave B3 — vendor detection. When detect() crosses
      // threshold the rows get a confidence boost (knowing the
      // column layout removes a chunk of OCR uncertainty) and
      // the result panel shows a "Read as <Vendor>" pill.
      var vendorMatch = null;
      if (typeof MID_VENDORS !== 'undefined' && MID_VENDORS.detectVendor) {
        vendorMatch = MID_VENDORS.detectVendor(fullText);
        // Wave 3.6 — when text-token detection failed, try logo dHash
        // against the cleaned page-1 canvas. Rescues smudged or
        // partially-glared letterheads where the OCR text is too noisy
        // for token matching but the visual logo signature is intact.
        if (!vendorMatch && pendingPages.length && pendingPages[0].gentle &&
            typeof MID_VENDORS.detectVendorByLogo === 'function') {
          try {
            var logoMatch = MID_VENDORS.detectVendorByLogo(pendingPages[0].gentle);
            if (logoMatch) vendorMatch = logoMatch;
          } catch (_) {}
        }
        // Wave 1.7 — fall back to the source-classifier's filename
        // vendorHint when text-token detection didn't cross threshold.
        // This rescues photos where the letterhead OCR'd badly but
        // the operator named the file with the distributor name.
        if (!vendorMatch && _activeClassification && _activeClassification.vendorHint) {
          var registry = MID_VENDORS.REGISTRY || [];
          for (var vi = 0; vi < registry.length; vi++) {
            if (registry[vi].id === _activeClassification.vendorHint) {
              vendorMatch = { id: registry[vi].id, label: registry[vi].label_en, score: 0.5, vendor: registry[vi] };
              break;
            }
          }
        }
        if (vendorMatch) {
          MID_VENDORS.applyVendorBoost(parsed.rows, vendorMatch);
          parsed.vendor = vendorMatch.id;
        }
      }
      // Wave 4.2 evolution — wait for the vendor enrichment fetch so
      // categorize.tier05VendorHints can read the categoryHints (SKU
      // prefix maps, class-code maps) from the per-vendor JSON.
      // Falls through with no enrichment when fetch fails or when no
      // vendor matched. Cache-first; subsequent invoices from the
      // same vendor see no delay.
      var enrichmentPromise = (vendorMatch && MID_VENDORS.loadEnrichment)
        ? MID_VENDORS.loadEnrichment(vendorMatch.id)
        : Promise.resolve(null);
      return enrichmentPromise.then(function (enrichment) {
        // Wave 4.2 evolution — apply per-vendor line grammar
        // patterns (tax / discount line classification) BEFORE
        // categorization. This keeps tax-coded rows out of the
        // ingredient-categorization pipeline and routes them to the
        // right GL on accountant export.
        if (enrichment && typeof MID_VENDOR_RUNTIME !== 'undefined' &&
            MID_VENDOR_RUNTIME.applyLineGrammar) {
          try { MID_VENDOR_RUNTIME.applyLineGrammar(parsed.rows, enrichment); } catch (_) {}
        }
      // Wave B4 — classify every parsed row. Stamps category +
      // categoryConfidence + categoryTier on each row so the
      // verification UX (B5) can render chips, group totals, and
      // sort review priority.
      classifyRows(parsed.rows);
      advancePhase(3);  // Wave 5.2 — vendor lookup done
      // Wave 5.3 — preserve raw OCR text so the operator can debug
      // when the parsed-row count is unexpectedly low.
      parsed._rawOcrText = fullText;
      renderParsed(parsed);
      clearPhaseLadder();
      setProgress(100);
      hideStatus();
      if (window.plausible) {
        window.plausible('Invoice Decoder Read', { props: {
          rows_bucket: parsed.rows.length < 10 ? '<10' :
                       parsed.rows.length < 25 ? '10-24' :
                       parsed.rows.length < 50 ? '25-49' : '50+',
          vendor_detected: parsed.vendor ? 'true' : 'false',
          delta_known: parsed.deltaPct != null ? 'true' : 'false'
        } });
      }
      });   // close enrichmentPromise.then
    }).catch(function (err) {
      clearPhaseLadder();
      showStatus(
        tt('OCR failed', 'OCR falló'),
        tt('The reader couldn\'t process this image. ' + (err && err.message ? '(' + err.message + ')' : ''),
           'El lector no pudo procesar esta imagen. ' + (err && err.message ? '(' + err.message + ')' : '')),
        'error'
      );
      // Wave 5.3 — actionable error recovery. Tesseract CDN failures
      // tend to be the most common one; offer a retry path + the
      // manual-entry fallback so the operator isn't stuck.
      renderErrorActions(err);
    }).then(function () {
      if (readBtn) {
        readBtn.disabled = false;
        readBtn.innerHTML = tt('Read this invoice', 'Leer esta factura');
      }
    });
  }

  // Wave 5.3 — error-recovery action buttons. Renders inside the
  // status panel; each button gives the operator a clear next step.
  function renderErrorActions(err) {
    if (!statusEl) return;
    var existing = document.getElementById('idErrorActions');
    if (existing) existing.parentNode.removeChild(existing);
    var wrap = document.createElement('div');
    wrap.id = 'idErrorActions';
    wrap.className = 'id-error-actions';
    var msg = String(err && err.message || '');
    var isCdnFail = /Tesseract|network|fetch/i.test(msg);
    var html = '';
    if (isCdnFail) {
      html += '<button type="button" id="idRetryReader">' + escHtml(tt('Retry reader', 'Reintentar lector')) + '</button>';
    }
    html += '<button type="button" id="idTypeManually">' + escHtml(tt('Type one row manually', 'Escribir un renglón a mano')) + '</button>';
    html += '<button type="button" id="idShowRawOcr">' + escHtml(tt('Show raw OCR', 'Ver OCR crudo')) + '</button>';
    wrap.innerHTML = html;
    var rawHost = document.createElement('pre');
    rawHost.id = 'idRawOcr';
    rawHost.className = 'id-raw-ocr';
    rawHost.textContent = (lastReadParsed && lastReadParsed._rawOcrText) || tt('(no raw text yet — run a read first)', '(sin texto crudo todavía)');
    statusEl.appendChild(wrap);
    statusEl.appendChild(rawHost);
    var retryBtn = document.getElementById('idRetryReader');
    if (retryBtn) retryBtn.addEventListener('click', function () { readPendingInvoice(); });
    var manualBtn = document.getElementById('idTypeManually');
    if (manualBtn) manualBtn.addEventListener('click', function () {
      // Synthesize a single empty row the operator can edit into.
      var stub = {
        rows: [{
          name: '', qty: 1, unit: 'ea', unitPrice: 0, lineTotal: 0,
          confidence: 50, fieldConf: { name: 50, qty: 50, price: 50, category: 50 },
          raw: '', kind: 'item'
        }],
        vendor: null, totalParsed: null, sumParsed: 0, deltaPct: null, mathFix: null,
        kindCounts: { item: 1 }, _manualEntry: true
      };
      renderParsed(stub);
      hideStatus();
    });
    var rawBtn = document.getElementById('idShowRawOcr');
    if (rawBtn) rawBtn.addEventListener('click', function () {
      rawHost.classList.toggle('show');
    });
  }

  // -------------------- Inline editors (B5-2) --------------------
  // Tap any cell → it becomes an input. Blur or Enter commits the
  // change back to parsedRowsState; the row's confidence is bumped
  // to 100 (owner-confirmed) and the chip flips green. The row's
  // category becomes editable via a native <select> driven by
  // CAT_LABEL_EN/ES so iOS / Android present the system picker.
  var parsedRowsState = []; // Live array the user is editing.

  function commitCellEdit(rowIdx, field, value) {
    if (!parsedRowsState[rowIdx]) return;
    var row = parsedRowsState[rowIdx];
    // Wave 5.3 — disputes against the auto-confirm tier. If this row
    // was auto-confirmed (live or shadow), an operator edit is a
    // false positive that throttles the auto-confirm gate.
    try {
      if ((row.autoConfirm || row._shadowAutoConfirm) &&
          typeof MID_AUTO_CONFIRM !== 'undefined' &&
          MID_AUTO_CONFIRM.recordDispute) {
        MID_AUTO_CONFIRM.recordDispute(row);
      }
    } catch (_) {}
    // Wave 5.1 — bump the manual-corrections counter (drives
    // personal-accuracy stat).
    try {
      if (typeof MID_TELEMETRY !== 'undefined' && MID_TELEMETRY.bump) {
        MID_TELEMETRY.bump('manualCorrections', 1);
      }
    } catch (_) {}
    if (field === 'name')      row.name = String(value).trim();
    else if (field === 'qty')  row.qty = parseFloat(value) || 0;
    else if (field === 'unitPrice' || field === 'lineTotal') row[field] = parseFloat(value) || 0;
    else if (field === 'category') {
      row.category = value || null;
      row.categoryConfidence = 100; // owner-confirmed
      // W7-8 — record this override so the same SKU on a future
      // invoice classifies correctly without owner intervention.
      if (typeof MID_LEARNINGS !== 'undefined' && MID_LEARNINGS.recordOverride && row.name) {
        try { MID_LEARNINGS.recordOverride(row.name, value); } catch (_) {}
      }
    }
    // Owner-touched rows flip to confirmed at full confidence.
    row.confidence = 100;
    row.ownerConfirmed = true;
    // Wave 3.4 — color-rise animation on the row that just got
    // confirmed; rerenderRows wipes the DOM so we mark the row idx
    // and apply the class on the next render.
    __riseIdx = rowIdx;
    rerenderRows();
  }
  var __riseIdx = -1;

  // W4-1 — verification filter state. After fresh OCR we land on
  // 'needReview' so the operator's eyes go straight to amber/red
  // rows instead of scanning all 47 lines. Last-chosen filter
  // persists across sessions via MuntinContext so a power user can
  // change their default once and have it stick.
  var __activeFilter = (function () {
    try {
      if (typeof MuntinContext === 'undefined') return 'needReview';
      var stored = MuntinContext.get('invoiceDecoder');
      if (stored && typeof stored.defaultFilter === 'string') return stored.defaultFilter;
    } catch (_) {}
    return 'needReview';
  })();
  var __activeCategory = '';

  // ----------------------------------------------------------------
  // W4-5 — verify-speed Plausible metric.
  //
  // Defends the "review takes 90 seconds" claim publicly. We start
  // the timer the first time renderParsed populates rows and stop
  // when the active filter (default 'needReview') first transitions
  // to empty. Bucketed: <60s | 60-180s | 180-360s | 360s+. Fires
  // exactly once per OCR session.
  // ----------------------------------------------------------------
  var __verifyStartTs = 0;
  var __verifyFired = false;
  function markVerifyStart() {
    __verifyStartTs = Date.now();
    __verifyFired = false;
  }
  function maybeFireVerifySpeed(visibleCount) {
    if (__verifyFired || !__verifyStartTs) return;
    if (__activeFilter !== 'needReview') return;
    if (visibleCount > 0) return;
    var elapsed = Math.round((Date.now() - __verifyStartTs) / 1000);
    var bucket = elapsed < 60 ? '<60s' :
                 elapsed < 180 ? '60-180s' :
                 elapsed < 360 ? '180-360s' : '360s+';
    __verifyFired = true;
    if (window.plausible) {
      try { window.plausible('Invoice Decoder Verify Speed', { props: { bucket: bucket } }); } catch (_) {}
    }
    // Surface the celebratory "all reviewed" state inline so the
    // operator sees they actually finished — not just an empty list.
    if (parsedList && parsedRowsState.length) {
      var done = document.createElement('li');
      done.className = 'id-parsed-empty id-parsed-done';
      done.innerHTML = '<strong>' +
        tt('All amber rows reviewed in ' + elapsed + 's.', 'Todas las amber revisadas en ' + elapsed + 's.') +
        '</strong> ' +
        tt('Save this invoice now to keep it.', 'Guarda esta factura para conservarla.');
      parsedList.appendChild(done);
    }
  }

  function applyRowFilter(rows) {
    return rows.filter(function (r) {
      if (r.ignored) return false; // W4-3: swipe-left removes from view
      if (__activeCategory && r.category !== __activeCategory) return false;
      if (__activeFilter === 'all') return true;
      var band = confBand(r.confidence);
      if (__activeFilter === 'needReview') return (band !== 'green') && !r.ownerConfirmed;
      if (__activeFilter === 'confirmed') return !!r.ownerConfirmed || band === 'green';
      if (__activeFilter === 'red')       return band === 'red';
      return true;
    });
  }

  // Wave 2.4 — smart-order sort. Riskiest rows first:
  //   risk = (1 - minFieldConfidence) × max(lineTotal, 1) ×
  //          (categoryFallback ? 1.4 : 1) × (anomaly ? 1.6 : 1)
  // Toggle persisted via MuntinContext.invoiceDecoder.sortByRisk.
  var __sortByRisk = (function () {
    try {
      if (typeof MuntinContext === 'undefined') return false;
      var stored = MuntinContext.get('invoiceDecoder');
      return !!(stored && stored.sortByRisk);
    } catch (_) { return false; }
  })();
  function setSortByRisk(on) {
    __sortByRisk = !!on;
    try {
      if (typeof MuntinContext !== 'undefined' && MuntinContext.merge) {
        MuntinContext.merge({ invoiceDecoder: { sortByRisk: __sortByRisk } });
      }
    } catch (_) {}
  }
  function applySmartSort(visible) {
    if (!__sortByRisk) return visible;
    function risk(r) {
      var fc = r.fieldConf || { name: r.confidence, qty: r.confidence, price: r.confidence, category: r.categoryConfidence || r.confidence };
      var minConf = Math.min(fc.name, fc.qty, fc.price, fc.category);
      var weight = Math.max(r.lineTotal || 0, 1);
      var fallbackBoost = r.categoryTier === 'heuristic' || r.categoryTier === 'fuzzy' ? 1.4 : 1;
      var anomalyBoost = 1;
      try {
        if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.summarizeRow) {
          var s = MID_SKU_HISTORY.summarizeRow(r);
          if (s && s.isAnomaly) anomalyBoost = 1.6;
        }
      } catch (_) {}
      return (1 - minConf / 100) * weight * fallbackBoost * anomalyBoost;
    }
    return visible.slice().sort(function (a, b) { return risk(b) - risk(a); });
  }

  // Wave 1.1 — toggleable mini-history sparkline under a row.
  function toggleRowHistory(rowEl, idx) {
    if (!rowEl || !isFinite(idx)) return;
    var existing = rowEl.querySelector('.id-row-history');
    if (existing) { existing.parentNode.removeChild(existing); return; }
    if (typeof MID_SKU_HISTORY === 'undefined' || !MID_SKU_HISTORY.lookupHistory) return;
    var row = parsedRowsState[idx];
    if (!row) return;
    var history = MID_SKU_HISTORY.lookupHistory(row);
    if (!history.length) return;
    var values = history.slice().reverse().map(function (h) { return h.unitPrice; });
    var sparkSvg = '';
    try {
      if (typeof MuntinSparkline !== 'undefined' && MuntinSparkline.render) {
        sparkSvg = MuntinSparkline.render(values, {
          width: 200, height: 40,
          ariaLabel: tt('Price history for ' + row.name, 'Histórico de precio para ' + row.name)
        });
      }
    } catch (_) {}
    var wrap = document.createElement('div');
    wrap.className = 'id-row-history';
    var lastN = history.slice(0, 5).map(function (h) {
      var d = new Date(h.ts);
      return '<li><span>' + d.toLocaleDateString() + '</span> · $' + h.unitPrice.toFixed(4) + (h.unit ? '/' + h.unit : '') + (h.vendor ? ' · ' + h.vendor : '') + '</li>';
    }).join('');
    wrap.innerHTML =
      '<p class="id-row-history-label"><strong>' +
      escHtml(tt('Last ' + history.length + ' observations', 'Últimas ' + history.length + ' observaciones')) +
      '</strong></p>' +
      sparkSvg +
      '<ul class="id-row-history-list">' + lastN + '</ul>' +
      '<button type="button" class="id-row-history-contract" data-idx="' + idx + '">' +
      escHtml(tt('Set contract price', 'Fijar precio de contrato')) + '</button>';
    rowEl.appendChild(wrap);
  }

  // Wave 5.2 — anomaly-collapse rendering. Quiet "everything-looks-fine"
  // rows collapse into a single summary line so the operator only
  // eyeballs vocal (amber / anomaly / fallback / not-yet-confirmed)
  // rows. Toggleable per session (`__expandedQuiet`) so power users
  // can demand the full list. Default ON; preserves J/K cycling and
  // bulk-confirm behavior (those iterate parsedRowsState directly).
  var __expandedQuiet = false;
  function _mathBalancedHint() {
    // Soft signal: when the parser flagged a math fix, the invoice
    // doesn't balance. Operators see every row in that case so a
    // hidden mis-OCR'd $200 line can be caught.
    return !_currentMathFix;
  }
  function _isQuietRow(r) {
    if (!r) return false;
    if (r.ignored) return false;
    if (r.kind && r.kind !== 'item') return false;
    if (!r.fieldConf) return false;
    var minConf = Math.min(r.fieldConf.name || 0, r.fieldConf.qty || 0,
                           r.fieldConf.price || 0, r.fieldConf.category || 80);
    if (minConf < 90) return false;
    if (r.categoryTier === 'fallback') return false;
    // Anomaly: medianDelta > 15% AND ≥ 3 history observations.
    try {
      if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.summarizeRow) {
        var s = MID_SKU_HISTORY.summarizeRow(r);
        if (s && s.medianDelta != null && Math.abs(s.medianDelta) >= 15 && s.observations >= 3) return false;
      }
    } catch (_) {}
    return true;
  }
  function _partitionRows(rows) {
    var quiet = [], vocal = [];
    rows.forEach(function (r) {
      if (_isQuietRow(r)) quiet.push(r);
      else vocal.push(r);
    });
    return { quiet: quiet, vocal: vocal };
  }
  function _quietSummaryHtml(quietCount) {
    if (!quietCount) return '';
    return '<li class="id-row-quiet-summary" id="idQuietSummary" tabindex="0" role="button" aria-expanded="false">' +
      '<span class="id-quiet-glyph" aria-hidden="true">✓</span>' +
      '<span class="id-quiet-text">' +
        escHtml(tt(quietCount + ' rows confirmed automatically (tap to expand)',
                   quietCount + ' filas confirmadas automáticamente (toca para expandir)')) +
      '</span>' +
    '</li>';
  }

  function rerenderRows() {
    if (!parsedList) return;
    var visible = applyRowFilter(parsedRowsState);
    visible = applySmartSort(visible);
    if (!visible.length && parsedRowsState.length) {
      parsedList.innerHTML = '<li class="id-parsed-empty">' +
        tt('No rows match this filter — switch to "All" to see everything.',
           'Ningún renglón coincide — cambia a "Todas" para ver todo.') +
        '</li>';
    } else {
      // Wave 5.2 — only collapse quiet rows when the operator hasn't
      // explicitly expanded AND the math reconciles AND the active
      // filter isn't 'confirmed' (where seeing them is the point).
      var quietGate = !__expandedQuiet &&
                      (__activeFilter !== 'confirmed') &&
                      (__activeFilter !== 'all' || true) && // collapse on every filter except 'confirmed'
                      _mathBalancedHint();
      var rows = visible;
      var quietHtml = '';
      if (quietGate) {
        var part = _partitionRows(visible);
        if (part.quiet.length >= 5) {  // not worth collapsing fewer than 5
          rows = part.vocal;
          quietHtml = _quietSummaryHtml(part.quiet.length);
        }
      }
      parsedList.innerHTML = quietHtml + rows.map(function (r) {
        return rowToHtml(r, parsedRowsState.indexOf(r));
      }).join('');
      // Wave 3.4 — color-rise on the just-edited row.
      if (__riseIdx !== -1) {
        var riseEl = parsedList.querySelector('[data-idx="' + __riseIdx + '"]');
        if (riseEl) riseEl.classList.add('is-confirmed-rise');
        __riseIdx = -1;
      }
    }
    // W4-5 — fire verify-speed metric when needReview filter empties.
    maybeFireVerifySpeed(visible.length);
    updateFilterChipCounts();
    // Re-emit summary count.
    if (parsedMeta) {
      var bands = { green: 0, amber: 0, red: 0 };
      parsedRowsState.forEach(function (r) { bands[confBand(r.confidence)]++; });
      var needReview = bands.amber + bands.red;
      parsedMeta.textContent = tt(
        needReview > 0 ? bands.green + ' ready · ' + needReview + ' need review' : 'all ' + bands.green + ' look good',
        needReview > 0 ? bands.green + ' listas · ' + needReview + ' requieren revisión' : 'las ' + bands.green + ' se ven bien'
      );
    }
    // B5-3: re-emit the total-verification banner against the
    // LIVE parsed-sum so owner edits are reflected in the
    // delta-vs-printed-total reading.
    rerenderTotals();
  }

  function updateFilterChipCounts() {
    var bar = document.getElementById('idFilterBar');
    if (!bar) return;
    var counts = { all: 0, needReview: 0, confirmed: 0, red: 0 };
    parsedRowsState.forEach(function (r) {
      counts.all++;
      var band = confBand(r.confidence);
      if (band === 'red') counts.red++;
      if ((band !== 'green') && !r.ownerConfirmed) counts.needReview++;
      else                                          counts.confirmed++;
    });
    Array.prototype.forEach.call(bar.querySelectorAll('.id-filter-chip'), function (chip) {
      var k = chip.getAttribute('data-filter');
      var c = chip.querySelector('.id-filter-count');
      if (c) c.textContent = counts[k] != null ? counts[k] : 0;
      var selected = (k === __activeFilter);
      chip.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
    // Populate the per-category select.
    var sel = document.getElementById('idFilterCat');
    if (sel) {
      var seen = {};
      parsedRowsState.forEach(function (r) {
        if (r.category) seen[r.category] = (seen[r.category] || 0) + 1;
      });
      var cats = Object.keys(seen).sort();
      // Preserve existing selection if still present.
      var prev = sel.value || __activeCategory || '';
      sel.innerHTML = '<option value="">' +
        tt('All categories', 'Todas las categorías') +
        '</option>' + cats.map(function (k) {
          return '<option value="' + escHtml(k) + '"' + (k === prev ? ' selected' : '') + '>' +
            escHtml(catLabel(k)) + ' (' + seen[k] + ')</option>';
        }).join('');
    }
  }

  function setActiveFilter(name) {
    if (name === __activeFilter) return;
    __activeFilter = name;
    try {
      if (typeof MuntinContext !== 'undefined' && MuntinContext.merge) {
        MuntinContext.merge({ invoiceDecoder: { defaultFilter: name } });
      }
    } catch (_) {}
    rerenderRows();
    if (window.plausible) {
      try { window.plausible('Invoice Decoder Filter Used', { props: { filter: name } }); } catch (_) {}
    }
  }

  // ----------------------------------------------------------------
  // W4-3 — touch swipe gestures on mobile.
  //
  // Right > 60px → confirm row (green flash, slide off, ownerConfirmed=true).
  // Left  > 60px → ignore row (red flash, slide off, 4s undo toast).
  //
  // Vanilla touch events; ~80 lines, no dependency. Honors
  // prefers-reduced-motion (skips the slide-off; jumps to end-state).
  // Pointer events are passive on touchmove so the browser can scroll
  // when the gesture is mostly vertical.
  // ----------------------------------------------------------------
  var __swipeWired = false;
  function wireSwipeGestures() {
    if (__swipeWired || !parsedList) return;
    __swipeWired = true;
    var SWIPE_THRESHOLD = 60;
    var FRICTION_START  = 30;
    var startX = 0, startY = 0, currentX = 0, rowEl = null, locked = null;

    parsedList.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      var t = e.touches[0];
      var li = t.target.closest && t.target.closest('.id-parsed-row');
      if (!li) return;
      // Don't start a swipe when the operator is already inside an
      // editable input (cell-edit mode).
      if (li.querySelector('input,select')) return;
      startX = t.clientX; startY = t.clientY; rowEl = li; locked = null;
      currentX = 0;
    }, { passive: true });

    parsedList.addEventListener('touchmove', function (e) {
      if (!rowEl || e.touches.length !== 1) return;
      var t = e.touches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      if (locked == null) {
        if (Math.abs(dy) > Math.abs(dx) + 4) { locked = 'vertical'; rowEl = null; return; }
        if (Math.abs(dx) > 6) locked = 'horizontal';
      }
      if (locked !== 'horizontal') return;
      currentX = dx;
      // Friction past FRICTION_START so the row doesn't slide all
      // the way off-screen on a flick.
      var visual = Math.abs(dx) <= FRICTION_START ? dx :
        (dx > 0 ? FRICTION_START + (dx - FRICTION_START) * 0.4
                : -FRICTION_START + (dx + FRICTION_START) * 0.4);
      rowEl.style.transform = 'translateX(' + visual + 'px)';
      rowEl.style.background = dx > 30 ? 'rgba(31,158,85,.10)' :
                                dx < -30 ? 'rgba(178,92,42,.10)' : '';
    }, { passive: true });

    parsedList.addEventListener('touchend', function () {
      if (!rowEl) return;
      var idx = parseInt(rowEl.getAttribute('data-idx'), 10);
      var dx = currentX;
      rowEl.style.transition = 'transform .18s ease, background .18s ease';
      if (dx > SWIPE_THRESHOLD) {
        rowEl.style.transform = 'translateX(120%)';
        rowEl.style.background = 'rgba(31,158,85,.18)';
        setTimeout(function () { confirmRowAt(idx); }, 160);
      } else if (dx < -SWIPE_THRESHOLD) {
        rowEl.style.transform = 'translateX(-120%)';
        rowEl.style.background = 'rgba(178,92,42,.18)';
        setTimeout(function () { ignoreRowAt(idx); }, 160);
      } else {
        rowEl.style.transform = '';
        rowEl.style.background = '';
      }
      rowEl = null; locked = null; currentX = 0;
    });
  }

  function confirmRowAt(idx) {
    var r = parsedRowsState[idx];
    if (!r) return;
    r.ownerConfirmed = true;
    r.confidence = 100;
    rerenderRows();
    if (window.plausible) {
      try { window.plausible('Invoice Decoder Row Confirmed', { props: { via: 'swipe' } }); } catch (_) {}
    }
  }

  function ignoreRowAt(idx) {
    var r = parsedRowsState[idx];
    if (!r) return;
    r.ignored = true;
    rerenderRows();
    surfaceUndoToast(idx);
    if (window.plausible) {
      try { window.plausible('Invoice Decoder Row Ignored', { props: { via: 'swipe' } }); } catch (_) {}
    }
  }

  var __toastEl = null;
  var __toastTimer = null;
  function surfaceUndoToast(idx) {
    if (__toastTimer) clearTimeout(__toastTimer);
    if (!__toastEl) {
      __toastEl = document.createElement('div');
      __toastEl.className = 'id-undo-toast';
      __toastEl.setAttribute('role', 'status');
      __toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(__toastEl);
    }
    __toastEl.innerHTML = '';
    var span = document.createElement('span');
    span.textContent = tt('Row removed.', 'Renglón quitado.');
    var btn  = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tt('Undo', 'Deshacer');
    btn.addEventListener('click', function () {
      var r = parsedRowsState[idx];
      if (r) { r.ignored = false; rerenderRows(); }
      hideToast();
    });
    __toastEl.appendChild(span);
    __toastEl.appendChild(btn);
    __toastEl.classList.add('show');
    __toastTimer = setTimeout(hideToast, 4000);
  }
  function hideToast() {
    if (__toastEl) __toastEl.classList.remove('show');
    if (__toastTimer) { clearTimeout(__toastTimer); __toastTimer = null; }
  }

  // ----------------------------------------------------------------
  // W4-4 — keyboard shortcuts for the verification flow.
  //
  //   Y / Space  → confirm focused row (alias for "yes, looks right")
  //   N          → flag (ignore + undo toast)
  //   J / ↓      → next visible row
  //   K / ↑      → previous visible row
  //   1-9        → set category on focused row
  //   /          → focus the per-category filter
  //   Escape     → blur active editor; close cell editor
  //
  // Active when focus is anywhere on the parsed list. Ignored when
  // focus is in a text input / textarea / select to avoid eating the
  // operator's typing during cell-edit.
  // ----------------------------------------------------------------
  var __kbWired = false;
  // Map of digit-key → category. Stable order matches the categorize
  // module's primary buckets so the muscle-memory carries across
  // sessions.
  var KB_CATS = ['protein', 'produce', 'dairy', 'seafood', 'beverage', 'paper', 'cleaning', 'dry-goods', 'herbs-spices'];

  function focusedRowIdx() {
    var active = document.activeElement;
    if (!active || !active.closest) return -1;
    var li = active.closest('.id-parsed-row');
    if (!li) return -1;
    var idx = parseInt(li.getAttribute('data-idx'), 10);
    return isNaN(idx) ? -1 : idx;
  }

  function focusRowByIdx(idx) {
    if (!parsedList) return false;
    var li = parsedList.querySelector('[data-idx="' + idx + '"]');
    if (!li) return false;
    var first = li.querySelector('[data-edit]');
    (first || li).focus();
    li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return true;
  }

  function visibleRowIndices() {
    if (!parsedList) return [];
    var lis = parsedList.querySelectorAll('.id-parsed-row');
    var out = [];
    Array.prototype.forEach.call(lis, function (li) {
      var idx = parseInt(li.getAttribute('data-idx'), 10);
      if (!isNaN(idx)) out.push(idx);
    });
    return out;
  }

  function nextVisible(curIdx, dir) {
    var arr = visibleRowIndices();
    if (!arr.length) return -1;
    var pos = arr.indexOf(curIdx);
    if (pos === -1) return arr[0];
    var next = pos + dir;
    if (next < 0 || next >= arr.length) return arr[Math.max(0, Math.min(arr.length - 1, next))];
    return arr[next];
  }

  function wireKeyboardShortcuts() {
    if (__kbWired) return;
    __kbWired = true;
    document.addEventListener('keydown', function (e) {
      // Only act when the result panel is in scope.
      if (!parsedEl || parsedEl.hidden) return;
      var t = e.target;
      var inEditor = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT');
      // The "/" shortcut focuses the filter even outside the result
      // panel — global discoverability for power users.
      if (e.key === '/' && !inEditor) {
        var sel = document.getElementById('idFilterCat');
        if (sel) { e.preventDefault(); sel.focus(); }
        return;
      }
      // Inside an editor → only Escape escapes.
      if (inEditor) {
        if (e.key === 'Escape') {
          t.blur();
        }
        return;
      }
      // Global single-key shortcuts.
      var idx = focusedRowIdx();
      if (idx === -1) {
        // No row focused → J / K still navigate (start from first).
        if (e.key === 'j' || e.key === 'k' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          var arr = visibleRowIndices();
          if (arr.length) { e.preventDefault(); focusRowByIdx(arr[0]); }
        }
        return;
      }
      // Row in scope → handle shortcuts.
      var key = e.key.toLowerCase();
      if (key === 'y' || e.key === ' ') {
        e.preventDefault(); confirmRowAt(idx);
        var nxt = nextVisible(idx, 1);
        if (nxt !== -1 && nxt !== idx) setTimeout(function () { focusRowByIdx(nxt); }, 0);
      } else if (key === 'n') {
        e.preventDefault(); ignoreRowAt(idx);
        var nxt2 = nextVisible(idx, 1);
        if (nxt2 !== -1) setTimeout(function () { focusRowByIdx(nxt2); }, 0);
      } else if (key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault(); var n = nextVisible(idx, 1); if (n !== -1) focusRowByIdx(n);
      } else if (key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault(); var p = nextVisible(idx, -1); if (p !== -1) focusRowByIdx(p);
      } else if (e.key >= '1' && e.key <= '9') {
        var ci = parseInt(e.key, 10) - 1;
        var cat = KB_CATS[ci];
        if (cat) {
          e.preventDefault();
          commitCellEdit(idx, 'category', cat);
          if (window.plausible) {
            try { window.plausible('Invoice Decoder Category Set', { props: { via: 'keyboard' } }); } catch (_) {}
          }
        }
      }
    });
  }

  // Wire filter chips + per-category select once the bar is in DOM.
  function wireFilterBar() {
    var bar = document.getElementById('idFilterBar');
    if (!bar || bar.dataset.wired === '1') return;
    bar.dataset.wired = '1';
    bar.addEventListener('click', function (e) {
      var chip = e.target && e.target.closest && e.target.closest('.id-filter-chip');
      if (!chip) return;
      setActiveFilter(chip.getAttribute('data-filter') || 'all');
    });
    var sel = document.getElementById('idFilterCat');
    if (sel) {
      sel.addEventListener('change', function () {
        __activeCategory = sel.value || '';
        rerenderRows();
      });
    }
  }

  // Live total reconciliation — printed invoice total (extracted
  // by the parser at OCR time) vs. the current sum of editable
  // rows. >5% delta → amber warning; missing printed total →
  // grey "couldn't verify yourself" line.
  //
  // Wave 1.3 — when math is off, also render a candidate-fix card
  // beneath the totals line so the operator can fix it in one tap.
  // Wave 3.2 — plain-language microcopy ("Numbers don't match").
  var lastPrintedTotal = null;
  function rerenderTotals() {
    if (!parsedTotals) return;
    var sum = parsedRowsState.reduce(function (a, r) { return a + (r.lineTotal || 0); }, 0);
    sum = +sum.toFixed(2);
    if (lastPrintedTotal != null) {
      var delta = Math.abs((sum - lastPrintedTotal) / lastPrintedTotal) * 100;
      var deltaWarn = delta > 5;
      parsedTotals.classList.toggle('warn', !!deltaWarn);
      parsedTotals.innerHTML = tt(
        '<strong>Read sum:</strong> $' + sum.toFixed(2) + ' · <strong>Printed:</strong> $' + lastPrintedTotal.toFixed(2) +
          ' (' + delta.toFixed(1) + '% off) — ' +
          (deltaWarn ? 'numbers don\'t match. Check them.' : 'looks consistent.'),
        '<strong>Suma leída:</strong> $' + sum.toFixed(2) + ' · <strong>Impreso:</strong> $' + lastPrintedTotal.toFixed(2) +
          ' (' + delta.toFixed(1) + '% de diferencia) — ' +
          (deltaWarn ? 'los números no cuadran. Revísalos.' : 'se ve consistente.')
      );
      // Candidate-fix card — only when delta exceeds 1¢.
      try {
        if (deltaWarn && typeof MID_PARSE !== 'undefined' && MID_PARSE.suggestMathFix) {
          var fix = MID_PARSE.suggestMathFix(parsedRowsState, lastPrintedTotal);
          renderMathFixCard(fix);
        } else {
          renderMathFixCard(null);
        }
      } catch (_) {}
    } else {
      parsedTotals.classList.remove('warn');
      parsedTotals.innerHTML = tt(
        '<strong>Read sum:</strong> $' + sum.toFixed(2) + ' — no printed total to compare against. Sanity-check yourself.',
        '<strong>Suma leída:</strong> $' + sum.toFixed(2) + ' — sin total impreso para comparar. Revísalo tú.'
      );
      renderMathFixCard(null);
    }
    parsedTotals.hidden = false;
  }

  // Wave 1.3 — math fix card. Renders inside #idMathFix when active,
  // hidden otherwise. Buttons: "Apply this fix" for digit-flip,
  // "Re-OCR last rows" for missing-line, "I'll fix it manually" always.
  // Wave 2.3 — track the active math-fix candidate at module scope so
  // the per-row renderer can decorate the offending row with an
  // inline single-tap accept-fix chip alongside the top card. Both
  // affordances share the same handler.
  var _currentMathFix = null;
  function renderMathFixCard(fix) {
    _currentMathFix = (fix && fix.kind === 'digit-flip' && typeof fix.rowIdx === 'number') ? fix : null;
    var host = document.getElementById('idMathFix');
    if (!host) return;
    if (!fix) { host.hidden = true; host.innerHTML = ''; return; }
    var html = '<div class="id-mathfix-inner">';
    html += '<p class="id-mathfix-msg">' + escHtml(fix.message);
    if (fix.kind === 'digit-flip' && typeof fix.rowIdx === 'number') {
      html += '</p><p class="id-mathfix-actions">' +
        '<button type="button" class="id-mathfix-apply" data-row="' + fix.rowIdx + '" data-to="' + fix.to + '">' +
        escHtml(tt('Apply this fix', 'Aplicar este arreglo')) + '</button>' +
        '<button type="button" class="id-mathfix-dismiss">' + escHtml(tt("I'll fix it manually", 'Lo arreglo a mano')) + '</button>' +
        '</p>';
    } else if (fix.kind === 'rounding') {
      html += '</p><p class="id-mathfix-actions">' +
        '<button type="button" class="id-mathfix-dismiss">' + escHtml(tt('Got it', 'Entendido')) + '</button>' +
        '</p>';
    } else {
      html += '</p><p class="id-mathfix-actions">' +
        '<button type="button" class="id-mathfix-dismiss">' + escHtml(tt("I'll fix it manually", 'Lo arreglo a mano')) + '</button>' +
        '</p>';
    }
    html += '</div>';
    host.innerHTML = html;
    host.hidden = false;
    var apply = host.querySelector('.id-mathfix-apply');
    if (apply) {
      apply.addEventListener('click', function () {
        var rIdx = parseInt(apply.getAttribute('data-row'), 10);
        var to = parseFloat(apply.getAttribute('data-to'));
        if (isFinite(rIdx) && isFinite(to)) {
          commitCellEdit(rIdx, 'lineTotal', to);
          if (window.plausible) {
            try { window.plausible('Invoice Decoder Math Fix Applied', { props: { kind: 'digit-flip' } }); } catch (_) {}
          }
        }
      });
    }
    var dismiss = host.querySelector('.id-mathfix-dismiss');
    if (dismiss) {
      dismiss.addEventListener('click', function () {
        host.hidden = true;
        host.innerHTML = '';
      });
    }
  }

  // Wave 5.5 — one-tap "this looks right" summary panel. Two CTAs:
  //   Save as is — accept all current state, save (passphrase still
  //                gated since the encrypted save is real).
  //   Trust all  — auto-confirms remaining unconfirmed rows AND
  //                triggers Save. Disabled when math doesn't reconcile
  //                or any row is anomalous; the disabled copy explains.
  function renderTrustSummary(parsed) {
    var host = document.getElementById('idTrustSummary');
    if (!host) return;
    if (!parsed || !parsed.rows || !parsed.rows.length) { host.hidden = true; return; }
    var rows = parsed.rows;
    var lineCount = rows.length;
    var sum = (parsed.sumParsed || rows.reduce(function (s, r) {
      return s + (typeof r.lineTotal === 'number' ? r.lineTotal : 0);
    }, 0));
    var bands = { green: 0, amber: 0, red: 0 };
    rows.forEach(function (r) { bands[confBand(r.confidence)]++; });
    var anomalyCount = 0;
    var maxAnomaly = 0;
    try {
      if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.summarizeRow) {
        rows.forEach(function (r) {
          var s = MID_SKU_HISTORY.summarizeRow(r);
          if (s && s.medianDelta != null && Math.abs(s.medianDelta) >= 15 && s.observations >= 3) {
            anomalyCount++;
            if (Math.abs(s.medianDelta) > maxAnomaly) maxAnomaly = Math.abs(s.medianDelta);
          }
        });
      }
    } catch (_) {}
    var mathBalanced = !(parsed.mathFix && parsed.mathFix.kind === 'digit-flip');
    var trustAllOk = mathBalanced && bands.red === 0 && anomalyCount === 0;
    var trustAllReason = '';
    if (!mathBalanced) trustAllReason = tt('math doesn\'t reconcile yet', 'la suma aún no cuadra');
    else if (bands.red) trustAllReason = tt(bands.red + ' red row' + (bands.red === 1 ? '' : 's'),
                                              bands.red + ' renglón' + (bands.red === 1 ? '' : 'es') + ' rojo' + (bands.red === 1 ? '' : 's'));
    else if (anomalyCount) trustAllReason = tt(anomalyCount + ' price anomal' + (anomalyCount === 1 ? 'y' : 'ies'),
                                                  anomalyCount + ' anomalía' + (anomalyCount === 1 ? '' : 's') + ' de precio');
    var summary = tt(
      lineCount + ' lines · $' + sum.toFixed(2) + ' · ' + bands.green + ' high-confidence, ' + (bands.amber + bands.red) + ' need review' +
        (mathBalanced ? ' · math balances ✓' : ' · math off') +
        (anomalyCount ? ' · ' + anomalyCount + ' anomal' + (anomalyCount === 1 ? 'y' : 'ies') + ' vs your baseline' : ''),
      lineCount + ' renglones · $' + sum.toFixed(2) + ' · ' + bands.green + ' alta confianza, ' + (bands.amber + bands.red) + ' a revisar' +
        (mathBalanced ? ' · suma cuadra ✓' : ' · suma no cuadra') +
        (anomalyCount ? ' · ' + anomalyCount + ' anomalía' + (anomalyCount === 1 ? '' : 's') : '')
    );
    host.innerHTML =
      '<p class="id-ts-line">' + escHtml(summary) + '</p>' +
      '<div class="id-ts-row">' +
        '<button type="button" class="id-ts-saveas" id="idTsSaveAs">' +
          escHtml(tt('Save as is', 'Guardar como está')) +
        '</button>' +
        '<button type="button" class="id-ts-trustall" id="idTsTrustAll" ' + (trustAllOk ? '' : 'disabled') +
          (trustAllOk ? '' : ' title="' + escHtml(tt('Trust all needs: ', 'Confiar todo necesita: ') + trustAllReason) + '"') + '>' +
          escHtml(tt('Trust all', 'Confiar todo')) +
        '</button>' +
      '</div>' +
      (trustAllOk ? '' :
        '<p class="id-ts-disabled-reason">' +
          escHtml(tt('Trust all not available — ', 'Confiar todo no disponible — ') + trustAllReason + tt('. Review or fix, then save.', '. Revisa o arregla, luego guarda.')) +
        '</p>');
    host.hidden = false;
    var saveAs = host.querySelector('#idTsSaveAs');
    var trustAll = host.querySelector('#idTsTrustAll');
    if (saveAs) saveAs.addEventListener('click', function () {
      // Wave 5.1 — bump bulk-confirm counter.
      try {
        if (typeof MID_TELEMETRY !== 'undefined' && MID_TELEMETRY.bump) MID_TELEMETRY.bump('bulkConfirms', 1);
      } catch (_) {}
      _triggerSaveButton();
    });
    if (trustAll && trustAllOk) trustAll.addEventListener('click', function () {
      // Confirm every remaining unconfirmed non-ignored row at high
      // confidence, then trigger the same save flow.
      parsedRowsState.forEach(function (r) {
        if (r.ignored) return;
        if (!r.ownerConfirmed) {
          r.ownerConfirmed = true;
          r.confidence = Math.max(95, r.confidence || 0);
        }
      });
      try {
        if (typeof MID_TELEMETRY !== 'undefined' && MID_TELEMETRY.bump) MID_TELEMETRY.bump('trustAlls', 1);
      } catch (_) {}
      rerenderRows();
      _triggerSaveButton();
    });
  }
  function _triggerSaveButton() {
    var saveBtn = document.getElementById('idSaveBtn');
    if (saveBtn) try { saveBtn.click(); } catch (_) {}
  }

  // Wave 2.3 — Vendor Pulse Strip. One line per visible invoice:
  //   "Sysco · Tue Apr 28 · 41 lines · $1,842.10"
  //   then up to three pill-deltas (top movers via sku-history).
  function renderVendorPulse(parsed) {
    var host = document.getElementById('idVendorPulse');
    if (!host) return;
    if (!parsed || !parsed.rows || !parsed.rows.length) { host.hidden = true; return; }
    var vendor = parsed.vendor ? parsed.vendor.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : tt('No vendor detected', 'Sin proveedor');
    var date = new Date().toLocaleDateString();
    var sumStr = '$' + (parsed.sumParsed || 0).toFixed(2);
    var pills = '';
    try {
      if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.topMovers) {
        var movers = MID_SKU_HISTORY.topMovers(parsed.rows, { max: 3, minPct: 5 });
        movers.forEach(function (m) {
          var sign = m.deltaPct > 0 ? '+' : '';
          var dir = m.deltaPct > 0 ? 'up' : 'down';
          pills += '<span class="id-pulse-pill" data-dir="' + dir + '">' +
            escHtml(m.name) + ' ' + escHtml(sign + m.deltaPct.toFixed(1) + '%') +
            '</span>';
        });
      }
    } catch (_) {}
    if (!pills) {
      pills = '<span class="id-pulse-empty">' +
        escHtml(tt('First invoice from this vendor — saving starts your baseline.', 'Primera factura de este proveedor — al guardar empieza tu base.')) +
        '</span>';
    }
    // Volume-weighted invoice drift (domain-expert layer). When a
    // quorum of rows have history, surface "this invoice is up
    // 8% ($112 over baseline)" — the actual operator question.
    var driftLine = '';
    try {
      if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.computeInvoiceDrift) {
        var drift = MID_SKU_HISTORY.computeInvoiceDrift(parsed.rows);
        if (drift && drift.ratedRows >= 3 && Math.abs(drift.totalDriftPct) >= 1) {
          var dr = drift.totalDriftPct > 0 ? 'up' : 'down';
          var sign = drift.totalDriftDollars >= 0 ? '+' : '−';
          var absD = Math.abs(drift.totalDriftDollars).toFixed(2);
          driftLine = '<div class="id-pulse-drift" data-dir="' + dr + '">' +
            escHtml(tt(
              'This invoice ' + (drift.totalDriftPct > 0 ? 'up' : 'down') + ' ' +
                Math.abs(drift.totalDriftPct).toFixed(1) + '% vs your baseline ' +
                '(' + sign + '$' + absD + ' across ' + drift.ratedRows + ' rows with history)',
              'Esta factura ' + (drift.totalDriftPct > 0 ? 'sube' : 'baja') + ' ' +
                Math.abs(drift.totalDriftPct).toFixed(1) + '% vs tu base ' +
                '(' + sign + '$' + absD + ' en ' + drift.ratedRows + ' renglones con historial)'
            )) +
          '</div>';
        }
      }
    } catch (_) {}
    // Wave 2.2 — surface a one-tap reconciliation note when this
    // invoice overcharges vs. the operator's contracts.
    var contractLine = '';
    try {
      if (typeof MID_CONTRACT_WATCH !== 'undefined' && MID_CONTRACT_WATCH.buildOveragesFor) {
        var ov = MID_CONTRACT_WATCH.buildOveragesFor(parsed.rows);
        if (ov && ov.count) {
          var label = vendor && vendor !== tt('No vendor detected', 'Sin proveedor') ? vendor : tt('Vendor', 'Proveedor');
          contractLine =
            '<div class="id-pulse-contract">' +
              '<span class="id-pulse-contract-msg">' +
                escHtml(tt(
                  label + ' overcharged $' + ov.total.toFixed(2) + ' on ' + ov.count + ' line' + (ov.count === 1 ? '' : 's') + ' vs. your contract.',
                  label + ' nos cobró de más $' + ov.total.toFixed(2) + ' en ' + ov.count + ' línea' + (ov.count === 1 ? '' : 's') + ' vs. tu contrato.'
                )) +
              '</span>' +
              '<button type="button" class="id-pulse-contract-btn" id="idCopyReconNote">' +
                escHtml(tt('Copy reconciliation note', 'Copiar nota de conciliación')) +
              '</button>' +
            '</div>';
        }
      }
    } catch (_) {}
    host.innerHTML =
      '<div class="id-pulse-row">' +
        '<span class="id-pulse-vendor">' + escHtml(vendor) + '</span>' +
        '<span class="id-pulse-meta">· ' + escHtml(date) + ' · ' +
          (parsed.rows.length) + ' ' + escHtml(tt('lines', 'líneas')) + ' · ' + escHtml(sumStr) +
        '</span>' +
      '</div>' +
      driftLine +
      contractLine +
      '<div class="id-pulse-pills">' + pills + '</div>';
    host.hidden = false;
    // Wire the copy button. Single click → builds + copies the note,
    // briefly flips label to "Copied ✓" so the operator gets feedback.
    var copyBtn = document.getElementById('idCopyReconNote');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        try {
          var note = MID_CONTRACT_WATCH.buildNoteFor({
            rows: parsed.rows,
            vendor: vendor,
            locale: LOCALE,
            dateLabel: date
          });
          if (!note) return;
          MID_CONTRACT_WATCH.copyToClipboard(note).then(function (ok) {
            if (!ok) return;
            var orig = copyBtn.textContent;
            copyBtn.textContent = tt('Copied ✓', 'Copiado ✓');
            setTimeout(function () { copyBtn.textContent = orig; }, 2000);
            if (window.plausible) {
              try { window.plausible('Invoice Decoder Recon Note Copied'); } catch (_) {}
            }
          });
        } catch (_) {}
      });
    }
  }

  // Wave 4.3 — render the "save this layout?" prompt when the
  // auto-learner has accumulated 3+ observations of a previously-
  // unrecognized letterhead. Operator types a friendly name, taps
  // Save, and the template lands in MuntinContext.learnedVendors
  // for use on the next invoice.
  function renderLearnVendorPrompt(fullText) {
    var host = document.getElementById('idLearnVendor');
    if (!host) return;
    if (typeof MID_AUTOLEARN === 'undefined') return;
    var ready = MID_AUTOLEARN.shouldPromptToLearn(fullText);
    if (!ready) { host.hidden = true; host.innerHTML = ''; return; }
    var sample = (ready.samples && ready.samples[0] && ready.samples[0].topLines && ready.samples[0].topLines[0]) || '';
    host.innerHTML =
      '<p class="id-learn-msg"><strong>' +
        escHtml(tt('We\'ve seen 3 invoices from this vendor.', 'Hemos visto 3 facturas de este proveedor.')) +
      '</strong> ' +
        escHtml(tt('Save this layout so the next one parses cleaner.', 'Guarda este formato para que el próximo se lea mejor.')) +
      '</p>' +
      '<p class="id-learn-sample">' + escHtml(sample) + '</p>' +
      '<form class="id-learn-form" id="idLearnForm">' +
        '<label for="idLearnLabel" class="visually-hidden">' + escHtml(tt('Vendor name', 'Nombre del proveedor')) + '</label>' +
        '<input type="text" id="idLearnLabel" class="id-learn-input" maxlength="60" ' +
          'placeholder="' + escHtml(tt('e.g. My Local Produce Co', 'ej. Mi Verdulería Local')) + '" />' +
        '<button type="submit" class="id-learn-save">' + escHtml(tt('Save layout', 'Guardar formato')) + '</button>' +
        '<button type="button" class="id-learn-dismiss" id="idLearnDismiss">' + escHtml(tt('Not yet', 'Aún no')) + '</button>' +
      '</form>';
    host.hidden = false;
    var form = document.getElementById('idLearnForm');
    var input = document.getElementById('idLearnLabel');
    var dis = document.getElementById('idLearnDismiss');
    if (form && input) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var label = (input.value || '').trim();
        if (!label) { input.focus(); return; }
        try {
          var template = MID_AUTOLEARN.buildLearnedTemplate(MID_AUTOLEARN.normalize(fullText), ready.samples, label);
          if (template && MID_AUTOLEARN.saveLearnedTemplate(template)) {
            host.innerHTML = '<p class="id-learn-msg id-learn-msg--saved"><strong>' +
              escHtml(tt('Saved as ' + label, 'Guardado como ' + label)) + '.</strong> ' +
              escHtml(tt('Next invoice from this vendor will be auto-detected.',
                         'La próxima factura de este proveedor se detectará sola.')) +
              '</p>';
            if (window.plausible) {
              try { window.plausible('Invoice Decoder Vendor Learned'); } catch (_) {}
            }
            setTimeout(function () { host.hidden = true; }, 4000);
          } else {
            input.focus();
          }
        } catch (_) {}
      });
    }
    if (dis) {
      dis.addEventListener('click', function () { host.hidden = true; });
    }
  }

  // Wave 2.6 — margin-impact callout in the handoff panel.
  function renderMarginImpact(parsed) {
    var host = document.getElementById('idMarginImpact');
    if (!host) return;
    var impacts = [];
    try {
      if (typeof MID_MARGIN !== 'undefined' && MID_MARGIN.computeImpacts) {
        impacts = MID_MARGIN.computeImpacts(parsed.rows || [], { minPp: 0.5 });
      }
    } catch (_) {}
    if (!impacts.length) { host.hidden = true; host.innerHTML = ''; return; }
    var top = impacts.slice(0, 3);
    var lines = top.map(function (i) {
      var sign = i.deltaPp > 0 ? '+' : '';
      var dir = i.deltaPp > 0 ? 'up' : 'down';
      return '<li class="id-margin-line" data-dir="' + dir + '"><strong>' + escHtml(i.dishName) + '</strong> ' +
        escHtml(sign + i.deltaPp.toFixed(1) + ' pp') + ' (' + escHtml(i.oldPct.toFixed(1) + '% → ' + i.newPct.toFixed(1) + '%') + ')</li>';
    }).join('');
    host.innerHTML =
      '<p class="id-margin-label">' + escHtml(tt('Margin shift on saved dishes', 'Cambio de margen en platos guardados')) + '</p>' +
      '<ul class="id-margin-list">' + lines + '</ul>';
    host.hidden = false;
  }

  // Wave 2.5 — confidence glyph (shape + color, not color alone).
  // Colorblind users and monochrome printers still parse meaning.
  function confGlyph(band) {
    if (band === 'green') return '<svg class="id-row-glyph" data-band="green" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6.5" fill="#E6F4EC" stroke="#1f6e3a" stroke-width="1"/><path d="M3.8 7.2 L6 9.4 L10.2 5" stroke="#1f6e3a" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    if (band === 'amber') return '<svg class="id-row-glyph" data-band="amber" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6.5" fill="#FFFBEC" stroke="#9A6A12" stroke-width="1"/><path d="M7 3.4 V8" stroke="#9A6A12" stroke-width="1.6" stroke-linecap="round"/><circle cx="7" cy="10.3" r="0.85" fill="#9A6A12"/></svg>';
    if (band === 'red')   return '<svg class="id-row-glyph" data-band="red" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6.5" fill="#FCE0DA" stroke="#7a2419" stroke-width="1"/><path d="M4.5 4.5 L9.5 9.5 M9.5 4.5 L4.5 9.5" stroke="#7a2419" stroke-width="1.5" stroke-linecap="round"/></svg>';
    return '';
  }

  // Wave 1.7 — per-field dot. Filled / half / empty maps to the
  // field's confidence band. Hover/long-press surfaces a rationale.
  function fieldDot(label, conf, rationale) {
    var band = confBand(conf || 0);
    var ttip = rationale || (label + ': ' + Math.round(conf || 0) + '%');
    return '<span class="id-field-dot" data-field="' + escHtml(label) + '" data-band="' + band + '" title="' + escHtml(ttip) + '" aria-label="' + escHtml(ttip) + '"></span>';
  }

  // Wave 1.7 + 2.5 + 1.1 + 1.2 — full reimagined row layout.
  function rowToHtml(r, idx) {
    var qtyParts = [];
    if (r.qty != null) qtyParts.push(r.qty);
    if (r.unit) qtyParts.push(r.unit);
    var qtyText = qtyParts.length ? qtyParts.join(' ') : '';
    var priceText = r.lineTotal != null ? '$' + r.lineTotal.toFixed(2) : '';
    var chip = r.category
      ? '<span class="id-parsed-cat" data-cat="' + escHtml(r.category) + '">' + escHtml(catLabel(r.category)) + '</span>'
      : '<span class="id-parsed-cat id-parsed-cat-none" data-cat="none">' + tt('uncategorized', 'sin categoría') + '</span>';
    var band = confBand(r.confidence);
    var glyph = confGlyph(band);

    // Per-field dots (Wave 1.7).
    var fc = r.fieldConf || { name: r.confidence, qty: r.confidence, price: r.confidence, category: r.categoryConfidence || r.confidence };
    var dots =
      fieldDot(tt('name', 'nombre'), fc.name, tt('Name read', 'Lectura del nombre')) +
      fieldDot(tt('qty', 'cant.'), fc.qty, tt('Quantity', 'Cantidad')) +
      fieldDot(tt('price', 'precio'), fc.price, tt('Price', 'Precio')) +
      fieldDot(tt('category', 'categoría'), r.categoryConfidence || fc.category, tt('Category', 'Categoría'));

    // Wave 1.1 — per-row drift / anomaly chip from sku-history.
    var driftChip = '';
    var anomalyAttr = '';
    try {
      if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.summarizeRow) {
        var s = MID_SKU_HISTORY.summarizeRow(r);
        if (s && s.medianDelta != null && s.observations >= 3) {
          var sign = s.medianDelta > 0 ? '+' : '';
          var dir = s.medianDelta > 0 ? 'up' : (s.medianDelta < 0 ? 'down' : 'flat');
          var drClass = s.isAnomaly ? 'id-row-drift id-row-drift--anomaly' : 'id-row-drift';
          // Pack-aware tooltip: when summarizeRow used the
          // comparable price (basis === 'pack'), surface the unit
          // so the operator sees "vs your typical $/oz" instead of
          // the generic "vs your typical." This is the operator's
          // actual purchasing question.
          var basisLabel;
          if (s.basis === 'pack' && s.comparableUnit && typeof MID_PACK_PRICING !== 'undefined') {
            var unitDisp = ({
              'fl_oz': tt('per fl oz', 'por oz líq'),
              'oz':    tt('per oz', 'por oz'),
              'lb':    tt('per lb', 'por lb'),
              'kg':    tt('per kg', 'por kg'),
              'l':     tt('per l',  'por litro'),
              'ct':    tt('per ct', 'por unidad')
            })[s.comparableUnit] || tt('per unit', 'por unidad');
            basisLabel = sign + s.medianDelta.toFixed(1) + '% ' + unitDisp + ' ' +
                         tt('vs your typical ($' + s.comparablePrice + ' median)',
                            'vs tu típico ($' + s.comparablePrice + ' mediana)');
          } else {
            basisLabel = sign + s.medianDelta.toFixed(1) + '% ' + tt('vs your typical', 'vs tu típico');
          }
          driftChip = '<span class="' + drClass + '" data-dir="' + dir + '" title="' + escHtml(basisLabel) + '">' + escHtml(sign + s.medianDelta.toFixed(1) + '%') + '</span>';
          if (s.isAnomaly) anomalyAttr = ' data-anomaly="true"';
        }
      }
    } catch (_) {}

    // Wave 1.2 — contract-price overcharge badge.
    // Pack-aware: when checkRow returned a 'comparable' basis, the
    // tooltip surfaces the per-unit delta in the comparable unit so
    // operators see "Over $0.05/lb on your contract" instead of the
    // ambiguous "$0.05/unit."
    var contractBadge = '';
    try {
      if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.checkRow) {
        var ck = MID_SKU_HISTORY.checkRow(r);
        if (ck && ck.isOver) {
          var unitWord = tt('unit', 'unidad');
          if (ck.basis === 'comparable' && ck.actualComparableUnit) {
            unitWord = ({
              'fl_oz': tt('fl oz', 'oz líq'),
              'oz':    'oz', 'lb': 'lb', 'kg': 'kg', 'l': tt('l', 'litro'), 'ct': tt('ct', 'unidad')
            })[ck.actualComparableUnit] || unitWord;
          }
          contractBadge = '<span class="id-row-contract id-row-contract--over" title="' +
            escHtml(tt('Over your contract by $' + ck.diffPerUnit.toFixed(4) + '/' + unitWord +
                       ' (overcharge ~$' + ck.overcharge.toFixed(2) + ' on this line)',
                       'Sobre el contrato por $' + ck.diffPerUnit.toFixed(4) + '/' + unitWord +
                       ' (sobreprecio ~$' + ck.overcharge.toFixed(2) + ' en esta línea)')) +
            '">⚠ ' + escHtml(tt('over contract', 'sobre contrato')) + '</span>';
        }
      }
    } catch (_) {}

    // Cross-vendor savings chip (domain-expert layer). Surfaced
    // when the operator's history shows ≥2 vendors selling the
    // same stem and the cheapest charges noticeably less than the
    // current row's vendor. Operators see "buy from X — saves
    // 22% per fl oz" inline.
    var crossVendorChip = '';
    try {
      if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.compareAcrossVendors && r.comparable) {
        var cmp = MID_SKU_HISTORY.compareAcrossVendors(r);
        if (cmp && cmp.length >= 2) {
          var cheapestVendor = cmp[0];
          var currentRowVendor = r.vendorDetected || null;
          if (currentRowVendor && cheapestVendor.vendor !== currentRowVendor) {
            var thisOne = cmp.find(function (x) { return x.vendor === currentRowVendor; });
            if (thisOne && thisOne.gapPctVsCheapest >= 8) {
              var unitDispCV = ({
                'fl_oz': tt('per fl oz', 'por oz líq'), 'oz': tt('per oz', 'por oz'),
                'lb': tt('per lb', 'por lb'), 'kg': tt('per kg', 'por kg'),
                'l': tt('per l', 'por litro'), 'ct': tt('per ct', 'por unidad')
              })[cheapestVendor.comparableUnit] || tt('per unit', 'por unidad');
              var label = tt(
                'Saves ' + thisOne.gapPctVsCheapest.toFixed(0) + '% ' + unitDispCV +
                  ' if you buy from ' + cheapestVendor.vendor +
                  ' ($' + cheapestVendor.medianComparable + ' vs $' + thisOne.medianComparable + ' here)',
                'Ahorra ' + thisOne.gapPctVsCheapest.toFixed(0) + '% ' + unitDispCV +
                  ' si lo compras a ' + cheapestVendor.vendor +
                  ' ($' + cheapestVendor.medianComparable + ' vs $' + thisOne.medianComparable + ' aquí)'
              );
              crossVendorChip = '<span class="id-row-crossvendor" title="' + escHtml(label) +
                '">↓ ' + escHtml(cheapestVendor.vendor) + ' ' +
                escHtml('-' + thisOne.gapPctVsCheapest.toFixed(0) + '%') + '</span>';
            }
          }
        }
      }
    } catch (_) {}

    // Substitution detection (domain-expert layer). When the row's
    // own stem has ≤2 prior observations but a similar stem with
    // ≥3 observations exists at a comparable per-unit price, hint
    // that this looks like a sub for what the operator usually
    // buys. Conservative — only fires on high-similarity matches.
    var subChip = '';
    try {
      if (typeof MID_SUBSTITUTION !== 'undefined' && MID_SUBSTITUTION.detectSubstitution) {
        var sub = MID_SUBSTITUTION.detectSubstitution(r);
        if (sub && sub.similarity >= 0.55) {
          subChip = '<span class="id-row-sub" title="' + escHtml(tt(
            'Looks like a substitute for "' + sub.candidateStem + '" — you usually buy that one (' + sub.observations + ' prior orders, $' + sub.medianComparable + '/' + sub.comparableUnit + ')',
            'Parece sustitución de "' + sub.candidateStem + '" — usualmente compras esa (' + sub.observations + ' órdenes previas, $' + sub.medianComparable + '/' + sub.comparableUnit + ')'
          )) + '">↻ ' + escHtml(tt('looks like sub', 'parece sub')) + '</span>';
        }
      }
    } catch (_) {}

    // Wave 1.5 / 2.5 — kind tag for non-item lines. Wave 2.5 adds
    // an explicit 'return' kind separate from 'credit' so accountant
    // export can map each to a different GL account.
    var kindTag = '';
    if (r.kind && r.kind !== 'item') {
      var kindLabel = {
        credit:    tt('credit', 'crédito'),
        return:    tt('return', 'devolución'),
        deposit:   tt('deposit', 'depósito'),
        surcharge: tt('surcharge', 'recargo'),
        backorder: tt('backorder', 'pendiente')
      }[r.kind] || r.kind;
      kindTag = '<span class="id-row-kind" data-kind="' + escHtml(r.kind) + '">' + escHtml(kindLabel) + '</span>';
    }

    // Wave 4.5 — "auto-applied" trust chip when the categorization
    // came from a previous operator override. Surfaces tier + source
    // (direct, stem, bilingual) so the operator knows where the
    // signal came from.
    var learnedChip = '';
    if (r.categoryTier === 'learned') {
      var src = r.categorySource || 'direct';
      var lbl = src === 'bilingual'
        ? tt('auto · ES/EN match', 'auto · coincidencia ES/EN')
        : src === 'stem'
        ? tt('auto · pack variant', 'auto · variante de empaque')
        : tt('auto · your prior fix', 'auto · tu corrección previa');
      learnedChip = '<span class="id-row-learned" data-source="' + escHtml(src) + '" title="' + escHtml(lbl) + '">' + escHtml(lbl) + '</span>';
    }

    // Visible Y/N quick action buttons (Wave 3.1 — keyboard-or-pointer).
    var actions = '<span class="id-row-actions" role="group" aria-label="' + escHtml(tt('Row actions', 'Acciones del renglón')) + '">' +
      '<button type="button" class="id-row-act id-row-act-yes" data-act="confirm" data-idx="' + idx + '" aria-label="' + escHtml(tt('Confirm row', 'Confirmar renglón')) + '" title="Y">✓</button>' +
      '<button type="button" class="id-row-act id-row-act-no"  data-act="ignore"  data-idx="' + idx + '" aria-label="' + escHtml(tt('Flag and remove', 'Marcar y quitar')) + '" title="N">✕</button>' +
      '</span>';

    // Wave 2.3 — inline math-fix chip on the row the math-reconciliation
    // engine flagged. One-tap accept commits the lineTotal correction
    // exactly like the top-card button.
    var mathFixChip = '';
    if (_currentMathFix && _currentMathFix.rowIdx === idx && typeof _currentMathFix.to === 'number') {
      mathFixChip = '<button type="button" class="id-row-mathfix" data-mathfix-row="' + idx + '" data-mathfix-to="' + _currentMathFix.to + '" title="' +
        escHtml(tt('Tap to accept the math fix on this row', 'Toca para aceptar el arreglo en este renglón')) + '">' +
        escHtml(tt('Use $' + _currentMathFix.to.toFixed(2) + ' ✓', 'Usar $' + _currentMathFix.to.toFixed(2) + ' ✓')) +
        '</button>';
    }

    return '<li class="id-parsed-row" data-conf="' + band + '" data-kind="' + escHtml(r.kind || 'item') + '" data-idx="' + idx + '"' + anomalyAttr + ' title="' + escHtml(r.raw || '') + '">' +
      '<span class="id-row-glyph-cell" aria-hidden="true">' + glyph + '</span>' +
      '<span class="id-parsed-name" data-edit="name" tabindex="0" role="button">' +
        escHtml(r.name) + chip + learnedChip + kindTag + driftChip + contractBadge + crossVendorChip + subChip + mathFixChip +
      '</span>' +
      '<span class="id-parsed-qty"  data-edit="qty"  tabindex="0" role="button">' + escHtml(qtyText) + '</span>' +
      '<span class="id-parsed-price" data-edit="lineTotal" tabindex="0" role="button">' + escHtml(priceText) + '</span>' +
      '<span class="id-row-fielddots" aria-label="' + escHtml(tt('Per-field confidence', 'Confianza por campo')) + '">' + dots + '</span>' +
      actions +
    '</li>';
  }

  // Click delegation — turn a span into an <input> on tap.
  if (parsedList) {
    parsedList.addEventListener('click', function (e) {
      // Wave 5.2 — expand the quiet summary into full rows.
      var qs = e.target.closest && e.target.closest('#idQuietSummary');
      if (qs) {
        e.preventDefault();
        __expandedQuiet = true;
        rerenderRows();
        return;
      }
      // Wave 2.3 — inline math-fix chip on the offending row.
      var mfBtn = e.target.closest && e.target.closest('.id-row-mathfix');
      if (mfBtn) {
        e.preventDefault();
        e.stopPropagation();
        var mfIdx = parseInt(mfBtn.getAttribute('data-mathfix-row'), 10);
        var mfTo = parseFloat(mfBtn.getAttribute('data-mathfix-to'));
        if (isFinite(mfIdx) && isFinite(mfTo)) {
          commitCellEdit(mfIdx, 'lineTotal', mfTo);
          if (window.plausible) {
            try { window.plausible('Invoice Decoder Math Fix Applied', { props: { kind: 'inline-row' } }); } catch (_) {}
          }
        }
        return;
      }
      // Wave 3.1 — visible Y/N action buttons (per-pointer alt to swipe).
      var actBtn = e.target.closest && e.target.closest('.id-row-act');
      if (actBtn) {
        e.preventDefault();
        var actIdx = parseInt(actBtn.getAttribute('data-idx'), 10);
        if (!isFinite(actIdx)) return;
        if (actBtn.getAttribute('data-act') === 'confirm') confirmRowAt(actIdx);
        else if (actBtn.getAttribute('data-act') === 'ignore') ignoreRowAt(actIdx);
        return;
      }
      // Wave 1.1 — tapping the drift chip opens the row's mini-history.
      var drift = e.target.closest && e.target.closest('.id-row-drift');
      if (drift) {
        e.preventDefault();
        var rowEl = drift.closest('.id-parsed-row');
        if (rowEl) toggleRowHistory(rowEl, parseInt(rowEl.dataset.idx, 10));
        return;
      }
      var span = e.target.closest && e.target.closest('[data-edit]');
      if (!span) return;
      // Don't restart edit when user clicked the chip inside the name span.
      if (e.target !== span && (e.target.classList.contains('id-parsed-cat') || e.target.classList.contains('id-parsed-conf'))) {
        // Special case: tap the category chip → open category picker.
        var rowEl = e.target.closest('.id-parsed-row');
        if (e.target.classList.contains('id-parsed-cat') && rowEl) {
          openCategoryPicker(rowEl, parseInt(rowEl.dataset.idx, 10));
        }
        return;
      }
      var rowEl = span.closest('.id-parsed-row');
      if (!rowEl) return;
      var rowIdx = parseInt(rowEl.dataset.idx, 10);
      if (!isFinite(rowIdx)) return;
      var field = span.dataset.edit;
      var current = parsedRowsState[rowIdx] && parsedRowsState[rowIdx][field === 'lineTotal' ? 'lineTotal' : field];
      var input = document.createElement('input');
      input.type = (field === 'qty' || field === 'lineTotal') ? 'text' : 'text';
      if (field === 'qty' || field === 'lineTotal') input.inputMode = 'decimal';
      input.value = current != null ? String(current) : '';
      input.className = 'id-parsed-input';
      input.setAttribute('aria-label', tt('Edit ' + field, 'Editar ' + field));
      span.innerHTML = '';
      span.appendChild(input);
      input.focus();
      input.select();
      var done = function () {
        commitCellEdit(rowIdx, field, input.value);
      };
      input.addEventListener('blur', done);
      input.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { input.value = current != null ? String(current) : ''; input.blur(); }
      });
    });
  }

  function openCategoryPicker(rowEl, rowIdx) {
    if (!isFinite(rowIdx)) return;
    var nameSpan = rowEl.querySelector('.id-parsed-name');
    var chip = nameSpan && nameSpan.querySelector('.id-parsed-cat');
    if (!chip) return;
    var select = document.createElement('select');
    select.className = 'id-parsed-cat-select';
    select.setAttribute('aria-label', tt('Category', 'Categoría'));
    var cats = ['protein', 'seafood', 'produce', 'dairy', 'dry-goods', 'herbs-spices', 'paper', 'cleaning', 'beverage'];
    var current = parsedRowsState[rowIdx] && parsedRowsState[rowIdx].category;
    var blank = document.createElement('option');
    blank.value = '';
    blank.textContent = tt('— uncategorized —', '— sin categoría —');
    if (!current) blank.selected = true;
    select.appendChild(blank);
    cats.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c;
      o.textContent = catLabel(c);
      if (current === c) o.selected = true;
      select.appendChild(o);
    });
    chip.replaceWith(select);
    select.focus();
    select.addEventListener('change', function () {
      commitCellEdit(rowIdx, 'category', select.value);
    });
    select.addEventListener('blur', function () {
      // No commit on blur unless they changed it; rerender restores chip.
      if (select.value === (current || '')) rerenderRows();
    });
  }

  // ============================================================
  // Wave 3.4 — skeleton-row loader. Renders 8 placeholder rows in
  // the parsed list while OCR runs so the operator sees structure
  // forming, not a spinner of doom. Cleared on first real render.
  // ============================================================
  function showSkeleton(count) {
    if (!parsedList) return;
    if (parsedEl) parsedEl.hidden = false;
    var n = Math.max(3, Math.min(12, count || 8));
    var html = '';
    for (var i = 0; i < n; i++) {
      html += '<li class="id-parsed-skel" aria-hidden="true">' +
        '<span></span>' +
        '<span class="id-parsed-skel-bar id-parsed-skel-bar--md"></span>' +
        '<span class="id-parsed-skel-bar id-parsed-skel-bar--xs"></span>' +
        '<span class="id-parsed-skel-bar id-parsed-skel-bar--sm"></span>' +
        '</li>';
    }
    parsedList.innerHTML = html;
  }

  // ============================================================
  // Wave 5.2 — phase ladder + ETA + tip carousel during the wait.
  // The status panel renders a four-step ladder; the active phase
  // pulses, completed phases get a check, the tip carousel rotates
  // every 6s with restaurant-flavored pro-tips.
  // ============================================================
  var TIPS_EN = [
    'Did you know? PDFs read in 1s instead of 30. Ask your distributor to email you one.',
    'You can paste a CSV from Sysco\'s order-history page directly — skip the photo entirely.',
    'Tap a row to edit — your corrections train the categorizer for next time.',
    'Y / N / J / K / 1-9 keyboard shortcuts speed up review on a laptop.',
    'Switch tabs while we work — a Workshop badge will pop up when ready.'
  ];
  var TIPS_ES = [
    '¿Sabías? Los PDF se leen en 1s en lugar de 30. Pide a tu distribuidor que te envíe uno.',
    'Puedes pegar un CSV de la página de historial de órdenes de Sysco — sáltate la foto.',
    'Toca un renglón para editar — tus correcciones entrenan al categorizador.',
    'Y / N / J / K / 1-9 son atajos de teclado que aceleran la revisión.',
    'Cambia de pestaña mientras trabajamos — verás una insignia en Workshop cuando esté listo.'
  ];
  var __tipTimer = null;
  function showPhaseLadder(phaseLabels, etaSeconds) {
    if (!statusEl) return;
    var ladderId = 'idPhaseLadder';
    var existing = document.getElementById(ladderId);
    if (existing) existing.parentNode.removeChild(existing);
    var ul = document.createElement('ul');
    ul.id = ladderId;
    ul.className = 'id-phase-ladder';
    phaseLabels.forEach(function (lbl, i) {
      var li = document.createElement('li');
      li.dataset.state = i === 0 ? 'active' : 'pending';
      li.textContent = lbl;
      ul.appendChild(li);
    });
    statusEl.appendChild(ul);
    if (etaSeconds && etaSeconds > 0) {
      var p = document.createElement('p');
      p.id = 'idPhaseEta';
      p.className = 'id-phase-eta';
      p.textContent = tt('about ' + etaSeconds + 's left', 'unos ' + etaSeconds + 's restantes');
      statusEl.appendChild(p);
    }
    // Tip carousel.
    var tipEl = document.createElement('div');
    tipEl.className = 'id-tip-carousel';
    tipEl.id = 'idTipCarousel';
    statusEl.appendChild(tipEl);
    var tips = LOCALE === 'es' ? TIPS_ES : TIPS_EN;
    var tipIdx = Math.floor(Math.random() * tips.length);
    var rotate = function () {
      tipEl.innerHTML = '<strong>' + tt('Tip:', 'Sugerencia:') + '</strong> ' + tips[tipIdx % tips.length];
      tipIdx++;
    };
    rotate();
    if (__tipTimer) clearInterval(__tipTimer);
    __tipTimer = setInterval(rotate, 6000);
  }
  function advancePhase(idx) {
    var ladder = document.getElementById('idPhaseLadder');
    if (!ladder) return;
    var lis = ladder.querySelectorAll('li');
    for (var i = 0; i < lis.length; i++) {
      if (i < idx) lis[i].dataset.state = 'done';
      else if (i === idx) lis[i].dataset.state = 'active';
      else lis[i].dataset.state = 'pending';
    }
  }
  function clearPhaseLadder() {
    var ladder = document.getElementById('idPhaseLadder');
    if (ladder) ladder.parentNode.removeChild(ladder);
    var eta = document.getElementById('idPhaseEta');
    if (eta) eta.parentNode.removeChild(eta);
    var tip = document.getElementById('idTipCarousel');
    if (tip) tip.parentNode.removeChild(tip);
    if (__tipTimer) { clearInterval(__tipTimer); __tipTimer = null; }
  }

  // Wave 4.6 — keep the latest parsed object so the accountant
  // export can read vendor + savedAt without round-tripping through
  // the saved envelope.
  var lastReadParsed = null;

  // Wave 5 — expose renderParsed to onboarding.js so the sample
  // demo can drive the live pipeline without re-implementing it.
  if (typeof window !== 'undefined') {
    window.MID_DECODER_RENDER = function (parsed) { renderParsed(parsed); };
  }

  // ============================================================
  // Wave 6.8 — PWA deeplinks + Web Share Target intake.
  //
  // ?shared=<token> — service worker stashed an incoming share in
  //   /tools/invoice-decoder/_shared_inbox/<token>. We pull it back
  //   out (as a Blob), sniff its MIME, and route into the existing
  //   photo / PDF / CSV handlers. Same code paths as a direct file
  //   pick, so the entire downstream pipeline is reused.
  //
  // ?action=photo — manifest shortcut that opens the camera. Fires
  //   a click on the photo input so the OS file/camera picker
  //   appears immediately. (iOS won't trigger the camera without a
  //   user gesture; on those browsers the click no-ops gracefully.)
  // ============================================================
  function handlePwaIntents() {
    if (typeof URLSearchParams === 'undefined') return;
    var params = new URLSearchParams(window.location.search || '');
    var sharedToken = params.get('shared');
    if (sharedToken && sharedToken !== 'error' && typeof caches !== 'undefined') {
      // Wave 1.8 — page-side reader for the Web Share Target. We pull
      // the stashed file back out of the SW cache, reconstruct a File,
      // and hand it to the *unified* dispatcher. That gives us:
      //   - identical routing (PDF / image / CSV) as a direct drop
      //   - the source-classifier banner ("scanned PDF detected…")
      //   - profile-aware preprocess (Wave 1.4)
      //   - inline password prompt for protected PDFs (Wave 1.5)
      // No special-casing per type here.
      var stashUrl = '/tools/invoice-decoder/_shared_inbox/' + sharedToken;
      caches.open('id-share-inbox').then(function (cache) {
        return cache.match(stashUrl).then(function (resp) {
          if (!resp) return;
          return resp.blob().then(function (blob) {
            var name = 'shared-invoice';
            try {
              var hdr = resp.headers.get('X-Mid-Shared-Name');
              if (hdr) name = decodeURIComponent(hdr);
            } catch (_) {}
            var file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
            dispatchUnifiedFile(file);
            // Clean up the stashed file so a back/forward navigation
            // doesn't re-trigger the share. Notify the SW for parity.
            try {
              if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_SHARE_INBOX' });
              }
            } catch (_) {}
            return cache.delete(stashUrl);
          });
        });
      }).catch(function () { /* missing or expired share; user re-shares */ });
      // Strip ?shared= from the URL so a refresh doesn't re-trigger.
      try {
        history.replaceState({}, '', window.location.pathname);
      } catch (_) {}
      if (window.plausible) {
        try { window.plausible('Invoice Decoder Share Received'); } catch (_) {}
      }
    } else if (sharedToken === 'error') {
      showStatus(
        tt('Couldn\'t read the shared file', 'No se pudo leer el archivo compartido'),
        tt('Try sharing it again, or pick the file directly with the photo or PDF buttons above.',
           'Intenta compartirlo de nuevo o selecciónalo con los botones arriba.'),
        'error'
      );
      try { history.replaceState({}, '', window.location.pathname); } catch (_) {}
    }
    // ?action=photo — open the photo picker.
    if (params.get('action') === 'photo' && photoInput) {
      try { photoInput.click(); } catch (_) {}
      try { history.replaceState({}, '', window.location.pathname); } catch (_) {}
    }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handlePwaIntents);
    } else {
      handlePwaIntents();
    }
  }

  function renderParsed(parsed) {
    lastReadParsed = parsed;
    // Wave 5 — record that the operator has run something so the
    // first-run banner stops showing on subsequent visits.
    try {
      if (typeof MID_ONBOARDING !== 'undefined' && MID_ONBOARDING.markFirstRun) {
        MID_ONBOARDING.markFirstRun();
      }
    } catch (_) {}
    // Wave 5.3 — auto-confirm shadow-then-on. Run the predicate
    // before render so the row badges and counters reflect it. Math
    // gate: if the parser flagged a fix, all auto-confirms hold.
    try {
      if (typeof MID_AUTO_CONFIRM !== 'undefined' && MID_AUTO_CONFIRM.applyAutoConfirm) {
        var mathBalanced = !(parsed.mathFix && parsed.mathFix.kind === 'digit-flip');
        var mathFixSet = {};
        if (parsed.mathFix && typeof parsed.mathFix.rowIdx === 'number') {
          mathFixSet[parsed.mathFix.rowIdx] = true;
        }
        var ac = MID_AUTO_CONFIRM.applyAutoConfirm(parsed.rows, {
          vendor: parsed.vendor || null,
          mathBalanced: mathBalanced,
          mathFixRowSet: mathFixSet
        });
        parsed._autoConfirm = ac;
      }
    } catch (_) {}
    if (!parsedEl || !parsedList) return;
    if (!parsed.rows.length) {
      parsedList.innerHTML = '<li class="id-parsed-empty">' +
        tt('Couldn\'t find any line items. Try a sharper photo or your distributor\'s PDF if available.',
           'No se encontraron partidas. Intenta con una foto más nítida o el PDF de tu distribuidor si lo tienes.') +
        '</li>';
      parsedEl.hidden = false;
      return;
    }
    if (parsedCount) {
      parsedCount.textContent = parsed.rows.length + ' ' + tt(parsed.rows.length === 1 ? 'item' : 'items',
                                                              parsed.rows.length === 1 ? 'partida' : 'partidas');
    }
    if (parsedVendor) {
      if (parsed.vendor) {
        parsedVendor.hidden = false;
        var label = parsed.vendor.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        parsedVendor.textContent = tt('Read as ' + label, 'Leído como ' + label);
      } else {
        parsedVendor.hidden = true;
      }
    }
    if (parsedMeta) {
      // Count summary by confidence band — owner instantly sees
      // how many lines need their eyes (amber + red) vs ready
      // to flow through (green).
      var bands = { green: 0, amber: 0, red: 0 };
      parsed.rows.forEach(function (r) { bands[confBand(r.confidence)]++; });
      var needReview = bands.amber + bands.red;
      var labelEn = needReview > 0
        ? bands.green + ' ready · ' + needReview + ' need review'
        : 'all ' + bands.green + ' look good';
      var labelEs = needReview > 0
        ? bands.green + ' listas · ' + needReview + ' requieren revisión'
        : 'las ' + bands.green + ' se ven bien';
      parsedMeta.textContent = tt(labelEn, labelEs);
    }
    // Wave B5 — adopt the parsed rows into the live editable state
    // and re-render through rowToHtml. The state array is what the
    // save flow (B6) will encrypt + persist.
    parsedRowsState = parsed.rows.map(function (r) { return Object.assign({}, r); });
    lastPrintedTotal = (typeof parsed.totalParsed === 'number') ? parsed.totalParsed : null;
    // W4-5 — start the verify-speed clock. Stops when needReview
    // filter first empties.
    markVerifyStart();
    // W4-1 — reveal + wire the filter chip bar; rerenderRows now
    // applies the active filter so the operator lands on amber rows
    // instead of staring down the full 47.
    var filterBar = document.getElementById('idFilterBar');
    if (filterBar) {
      filterBar.hidden = false;
      wireFilterBar();
    }
    // Wave 2.4 — sort toggle.
    var sortToggle = document.getElementById('idSortToggle');
    if (sortToggle && !sortToggle.dataset.wired) {
      sortToggle.dataset.wired = '1';
      var sortLbl = sortToggle.querySelector('.id-sort-toggle-label');
      var refresh = function () {
        sortToggle.setAttribute('aria-pressed', __sortByRisk ? 'true' : 'false');
        if (sortLbl) sortLbl.textContent = __sortByRisk
          ? tt('Riskiest first', 'Más riesgo primero')
          : tt('Order seen', 'En orden');
      };
      refresh();
      sortToggle.addEventListener('click', function () {
        setSortByRisk(!__sortByRisk);
        refresh();
        rerenderRows();
      });
    }
    // W4-3 — wire touch swipe gestures on the parsed list. Idempotent.
    wireSwipeGestures();
    // W4-4 — wire keyboard shortcuts (Y/N, J/K, 1-9, /). Idempotent.
    wireKeyboardShortcuts();
    // rerenderRows handles list innerHTML, filter chip counts, the
    // band summary, and the totals banner.
    rerenderRows();
    parsedEl.hidden = false;
    if (comingEl) comingEl.hidden = true;
    // B5-4 — reveal the sticky bulk-action bar once we have rows.
    var bulkBarEl = document.getElementById('idBulkbar');
    if (bulkBarEl) bulkBarEl.hidden = !parsedRowsState.length;
    // W3-7 — render the differentiator strip above the result panel
    // exactly once. Pulls chipLabel + a one-sentence framing from
    // MuntinDifferentiators (single source of truth, see W1-9).
    renderDiffStripOnce();
    // Wave 2.3 — vendor pulse strip with this invoice's top movers.
    renderTrustSummary(parsed);
    renderVendorPulse(parsed);
    // Wave 2.6 — margin-impact callout if Plate Cost dishes exist.
    renderMarginImpact(parsed);
    // Wave 4.3 — auto-learn observation. When no vendor matched
    // (neither a hard-coded one nor a previously-learned one),
    // record a fingerprint of the letterhead so a 3rd unrecognized
    // run can trigger the "save this layout?" prompt.
    try {
      if (typeof MID_AUTOLEARN !== 'undefined' && MID_AUTOLEARN.recordObservation) {
        if (!parsed.vendor) {
          var fullText = (parsed && parsed._rawOcrText) || '';
          if (fullText) {
            MID_AUTOLEARN.recordObservation(fullText, parsed.rows || [], parsed.totalParsed || null);
            renderLearnVendorPrompt(fullText);
          }
        }
      }
    } catch (_) {}
    // Wave 2.7 — diff-strip volume gating: only render when drift is
    // material (≥15% per cost-trend's threshold). Otherwise hide.
    var diffStrip = document.getElementById('idDiffStrip');
    if (diffStrip && typeof MuntinCostTrend !== 'undefined' && MuntinCostTrend.detectDrift) {
      try {
        var trend = (typeof MuntinContext !== 'undefined' && MuntinContext.readTrend) ? MuntinContext.readTrend() : [];
        var drifts = MuntinCostTrend.detectDrift(trend, { thresholdPct: 15 });
        diffStrip.dataset.magnitude = drifts.length ? 'high' : 'low';
        if (!drifts.length) diffStrip.hidden = true;
      } catch (_) {}
    }
  }

  function renderDiffStripOnce() {
    var strip = document.getElementById('idDiffStrip');
    if (!strip || strip.dataset.rendered === '1') return;
    if (typeof MuntinDifferentiators === 'undefined') return;
    var data = MuntinDifferentiators.vsAlternative('invoice-decoder', LOCALE);
    if (!data) return;
    var chip = document.createElement('span');
    chip.className = 'id-diff-strip-chip';
    chip.textContent = data.chipLabel || tt('vs paid alternatives', 'vs alternativas pagadas');
    var text = document.createElement('span');
    text.className = 'id-diff-strip-text';
    text.innerHTML = '<strong>' +
      tt('Restaurant-grade and your data stays yours.',
         'Calidad de restaurante y tus datos siguen siendo tuyos.') + '</strong> ' +
      tt('No subscription, no benchmark dataset, no ML training on your costs.',
         'Sin suscripción, sin set de benchmark, sin entrenar IA con tus costos.');
    strip.appendChild(chip);
    strip.appendChild(text);
    strip.hidden = false;
    strip.dataset.rendered = '1';
  }

  if (readBtn) readBtn.addEventListener('click', readPendingInvoice);

  // -------------------- Bulk actions (B5-4) --------------------
  var bulkBar     = document.getElementById('idBulkbar');
  var bulkConfirm = document.getElementById('idBulkConfirm');
  var bulkSave    = document.getElementById('idBulkSave');

  // -------------------- Cross-tool handoffs (B6-4) --------------------
  // After a successful save, surface three one-tap handoff buttons
  // to the rest of the suite. Each opens the target tool with a
  // URL fragment the target's own decoder consumes — no server
  // round-trip, no leak via referrer (referrerpolicy:no-referrer
  // already on the page). The handoff fragment shape mirrors the
  // existing tools/_shared/url-fragment.js encoders.
  // ============================================================
  // Wave 6.3 second half — multi-device pairing flow.
  //
  // Asks the operator for a friendly device label, generates a
  // 24-word pair token, adds a `paired-device` wrap to the envelope
  // via MID_PAIRING.addDevice, re-saves the envelope to the server
  // (one extra POST), then surfaces the token via MID_PASS
  // .showRecoveryPhrase (reusing the same word-grid + copy/print
  // affordances). Operator transcribes the token to Device B and
  // unlocks via the existing recovery-phrase path.
  // ============================================================
  function runPairingFlow(envelope, passphrase, aad, payload) {
    if (typeof MID_PAIRING === 'undefined' || !MID_PAIRING.addDevice) return;
    var label = window.prompt(
      tt('What\'s a name for the device you\'re pairing? (e.g. "My Laptop")',
         '¿Qué nombre le pones al dispositivo que vas a vincular? (ej. "Mi Laptop")'),
      tt('My laptop', 'Mi laptop')
    );
    if (!label) return;
    label = String(label).trim().slice(0, 60);
    if (!label) return;
    MID_PAIRING.addDevice(envelope, passphrase, label).then(function (result) {
      if (!result || !result.envelope || !result.token) return;
      // Re-save the envelope with the new wrap. The server stores
      // ciphertext only — the new wrap is just a few hundred extra
      // bytes added to the existing envelope.
      var body = new FormData();
      body.set('kind',    'invoice-decoder');
      body.set('title',   tt('Invoice', 'Factura') + ' · ' + payload.itemCount + ' ' + tt('items', 'partidas'));
      body.set('aad',     aad);
      body.set('payload', JSON.stringify({
        envelope:  result.envelope,
        aad:       aad,
        items:     payload.itemCount,
        parsedSum: payload.parsedSum
      }));
      return fetch('/api/workbench/save', { // h8-exempt:workshop-save — same encrypted-only POST, adds paired-device wrap
        method:      'POST',
        credentials: 'same-origin',
        body:        body
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function () {
        // Show the token to the operator. We reuse showRecoveryPhrase
        // because the UX shape (24-word grid + copy/print) is the
        // same — just relabel the heading via a wrapper helper.
        if (typeof MID_PASS !== 'undefined' && MID_PASS.showRecoveryPhrase) {
          return MID_PASS.showRecoveryPhrase(result.token).then(function () {
            if (window.plausible) {
              try { window.plausible('Invoice Decoder Device Paired'); } catch (_) {}
            }
          });
        }
      });
    }).catch(function () {
      alert(tt('Pairing failed. Try again — or write to Don if it keeps happening.',
               'Falló la vinculación. Intenta de nuevo — o escríbele a Don si sigue pasando.'));
    });
  }

  function renderHandoffPanel(payload) {
    var host = document.getElementById('idHandoff');
    if (!host) return;
    if (!payload || !payload.items || !Array.isArray(parsedRowsState)) return;

    var localePrefix = LOCALE === 'es' ? '/es' : '';
    // 1) Plate Cost ingestion — only protein/produce/dairy/seafood/
    //    herbs-spices flow as candidate ingredients (paper / cleaning
    //    / beverage are pricing inputs but not recipe ingredients).
    var ingredientCats = { protein: 1, produce: 1, dairy: 1, seafood: 1, 'herbs-spices': 1 };
    var ingredientRows = parsedRowsState.filter(function (r) {
      return r.category && ingredientCats[r.category] && r.name && r.unitPrice != null;
    }).slice(0, 30);
    var pcFrag = ingredientRows.map(function (r) {
      return [r.name, (r.unitPrice || 0).toFixed(2), r.qty || 1, r.unit || 'lb']
        .map(encodeURIComponent).join(';');
    }).join('|');
    var pcUrl = localePrefix + '/tools/plate-cost/#ingredients=' + pcFrag;

    // 2) Margin Math — feed a food-cost-to-revenue ratio when the
    //    user has weekly revenue elsewhere. We just send the
    //    parsed sum as a hint; Margin Math has its own revenue
    //    input so it computes the ratio there.
    var mmUrl = localePrefix + '/tools/margin-math/#foodCostHint=' +
      encodeURIComponent((payload.parsedSum || 0).toFixed(2));

    // 3) Menu Engineering — pre-fill the period's food-cost %
    //    nudge if the user adds revenue. Same pattern as MM.
    var meUrl = localePrefix + '/tools/menu-engineering/#foodCostHint=' +
      encodeURIComponent((payload.parsedSum || 0).toFixed(2));

    host.innerHTML =
      '<p class="id-handoff-label">' + tt('Now flow it into the rest of your toolkit', 'Ahora, llévala al resto de tu suite') + '</p>' +
      '<div class="id-handoff-row">' +
        '<a class="id-handoff-btn" href="' + pcUrl + '">' +
          '<strong>' + tt('Plate Cost', 'Costo del Plato') + ' →</strong>' +
          '<span>' + tt('Drop in ' + ingredientRows.length + ' ingredients', 'Pasar ' + ingredientRows.length + ' ingredientes') + '</span>' +
        '</a>' +
        '<a class="id-handoff-btn" href="' + mmUrl + '">' +
          '<strong>' + tt('Margin Math', 'Matemática de Margen') + ' →</strong>' +
          '<span>' + tt('Run a margin check', 'Correr un chequeo de margen') + '</span>' +
        '</a>' +
        '<a class="id-handoff-btn" href="' + meUrl + '">' +
          '<strong>' + tt('Menu Engineering', 'Menu Engineering') + ' →</strong>' +
          '<span>' + tt('Update food-cost %', 'Actualizar % de costo') + '</span>' +
        '</a>' +
      '</div>' +
      // Wave 2.6 margin-impact mount lives inside the handoff panel.
      '<div id="idMarginImpact" class="id-margin-impact" hidden></div>' +
      // Wave 4.6 — accountant export drawer. One-tap CSV/IIF for
      // the operator's bookkeeper. Generated entirely client-side.
      '<details class="id-export-drawer">' +
        '<summary>' + tt('Export for your accountant', 'Exportar para tu contador') + '</summary>' +
        '<p class="id-export-blurb">' +
          tt('One-click CSV your accountant imports into the four most-common platforms. Your data never leaves your device.',
             'CSV de un clic que tu contador importa en las cuatro plataformas más comunes. Tus datos no salen de tu dispositivo.') +
        '</p>' +
        '<div class="id-export-row">' +
          '<button type="button" class="id-export-btn" data-fmt="qbo">QuickBooks Online</button>' +
          '<button type="button" class="id-export-btn" data-fmt="qbd">QuickBooks Desktop</button>' +
          '<button type="button" class="id-export-btn" data-fmt="xero">Xero</button>' +
          '<button type="button" class="id-export-btn" data-fmt="contpaqi">ContPaqi / Aspel</button>' +
          '<button type="button" class="id-export-btn" data-fmt="generic">' + tt('Generic ledger CSV', 'CSV genérico') + '</button>' +
        '</div>' +
      '</details>';
    host.hidden = false;
    // Wave 2.6 — recompute margin impact now that the host exists.
    if (typeof renderMarginImpact === 'function') {
      try { renderMarginImpact({ rows: parsedRowsState }); } catch (_) {}
    }
  }

  // -------------------- Save flow (B6-3) --------------------
  // The save flow is the only point where this tool issues a
  // network request. The cleartext invoice is encrypted in the
  // browser via MID_ENCRYPT before the POST. The server stores
  // the ciphertext envelope unchanged.
  function pickPassphrase() {
    // W1-6: returns a Promise<string|null> from MID_PASS.ask. The
    // synchronous window.prompt path was retired — too many trust-
    // breaking gaps (no strength meter, no confirm field, no in-
    // context "we never see this" framing). Callers must `await`
    // or `.then(pp => ...)`. Falls back to null when the modal
    // module didn't load (extremely rare; loaded via HTML script
    // tag at page start, same as encrypt.js).
    if (typeof MID_PASS === 'undefined' || !MID_PASS.ask) {
      return Promise.resolve(null);
    }
    // W1-7: memory-aware path. First save in a session asks
    // normally; subsequent saves within 30 min surface the
    // "Use same secret as before?" confirm chip instead of the
    // full passphrase modal. Tab close / 30-min idle / explicit
    // logout (W3-6) all wipe the cache.
    var fn = MID_PASS.askWithMemory || MID_PASS.ask;
    return fn({ mode: 'create' });
  }

  function buildSavePayload() {
    // Slim shape — never raw OCR text or image bytes. Caps each
    // field below the 50KB-per-row Workshop budget.
    var rows = parsedRowsState.map(function (r) {
      return {
        name: String(r.name || '').slice(0, 80),
        qty: r.qty,
        unit: r.unit,
        unitPrice: r.unitPrice,
        lineTotal: r.lineTotal,
        category: r.category,
        confidence: r.confidence,
        ownerConfirmed: !!r.ownerConfirmed
      };
    });
    var sum = rows.reduce(function (a, r) { return a + (r.lineTotal || 0); }, 0);
    return {
      version: 1,
      vendor: rows.length && parsedRowsState[0].vendorDetected ? parsedRowsState[0].vendorDetected : null,
      items: rows,
      itemCount: rows.length,
      parsedSum: +sum.toFixed(2),
      printedTotal: lastPrintedTotal,
      savedAt: Date.now()
    };
  }

  function setSaveStatus(text, kind) {
    if (!bulkSave) return;
    if (text) bulkSave.title = text;
    if (kind === 'busy') {
      bulkSave.disabled = true;
      bulkSave.textContent = tt('Saving…', 'Guardando…');
    } else if (kind === 'error') {
      bulkSave.disabled = false;
      bulkSave.textContent = tt('Save to my Workshop →', 'Guardar en mi Taller →');
    } else if (kind === 'ok') {
      bulkSave.disabled = false;
      bulkSave.textContent = tt('Saved ✓ — save another?', '¡Guardada! — ¿guardar otra?');
    } else {
      bulkSave.disabled = false;
      bulkSave.textContent = tt('Save to my Workshop →', 'Guardar en mi Taller →');
    }
  }

  if (bulkSave) {
    // Enable the button as soon as we have rows.
    var origRerender = rerenderRows;
    rerenderRows = function () {
      origRerender();
      if (bulkSave) bulkSave.disabled = !parsedRowsState.length;
    };

    bulkSave.addEventListener('click', function () {
      if (!parsedRowsState.length) return;
      if (typeof MID_ENCRYPT === 'undefined' || !MID_ENCRYPT.encryptPayload) {
        alert(tt('Encryption module missing. Refresh and try again.',
                 'Falta el módulo de encriptación. Recarga e intenta de nuevo.'));
        return;
      }
      // W1-6: pickPassphrase now returns a Promise (modal-driven).
      // W3-1: capture the envelope + aad in this closure so the
      // proof flyout can show the real ciphertext after success.
      var savedEnvelope = null;
      var savedAad = null;
      // Wave 6.3 — capture the passphrase in the save closure so the
      // post-save recovery-phrase setup can call MID_ENCRYPT.addWrap
      // without re-prompting. We never expose this to globals.
      var savedPassphrase = null;
      pickPassphrase().then(function (pp) {
        if (!pp) return; // owner cancelled — silent.
        savedPassphrase = pp;
        setSaveStatus(null, 'busy');
        var payload = buildSavePayload();
        // AAD binds this ciphertext to a logical-id; we use a
        // session-random itemId since the server assigns the real
        // KV id on save. The server can't decrypt anyway, but AAD
        // is good hygiene.
        var aad = 'invoice:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
        savedAad = aad;
        return MID_ENCRYPT.encryptPayload(payload, pp, aad).then(function (envelope) {
        savedEnvelope = envelope;
        var body = new URLSearchParams();
        body.set('kind', 'invoice-decoder');
        body.set('title', tt('Invoice', 'Factura') + ' · ' + payload.itemCount + ' ' + tt('items', 'partidas'));
        // Wrap envelope in a payload field the workbench expects.
        // Server does NOT decrypt — it just stores the envelope.
        body.set('payload', JSON.stringify({ envelope: envelope, aad: aad, items: payload.itemCount, parsedSum: payload.parsedSum }));
        return fetch('/api/workbench/save', { // h8-exempt:workshop-save — encrypted ciphertext only; user-initiated
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });
      }).then(function (r) {
        if (r.status === 401) {
          // Anonymous owner — point to sign-in.
          window.location.href = '/sign-in/?returnTo=' + encodeURIComponent(location.pathname);
          return null;
        }
        if (!r.ok) throw new Error('save failed (' + r.status + ')');
        return r.json();
      }).then(function (j) {
        if (!j) return;
        if (j.ok) {
          setSaveStatus(null, 'ok');
          // Wave 5.1 — bump the invoicesSaved + per-row counters so
          // the auto-confirm gate and personal-accuracy stat see this.
          try {
            if (typeof MID_TELEMETRY !== 'undefined' && MID_TELEMETRY.bump) {
              MID_TELEMETRY.bump('invoicesSaved', 1);
              MID_TELEMETRY.bump('rowsTotal', payload.itemCount || 0);
              var asis = parsedRowsState.filter(function (r) {
                return r.ownerConfirmed && !r._wasEdited;
              }).length;
              MID_TELEMETRY.bump('rowsConfirmedAsIs', asis);
            }
          } catch (_) {}
          // Wave 6.11 — refresh the personal-accuracy stat now that
          // counters moved.
          try { _maybeSurfacePersonalAccuracy(); } catch (_) {}
          // Wave 1.9 — fire the queue-advance event so a multi-file
          // intake moves to the next invoice automatically once this
          // one is saved.
          try {
            window.dispatchEvent(new CustomEvent('mid:invoice-saved', {
              detail: { aad: aad, vendor: payload.vendor || null, itemCount: payload.itemCount }
            }));
          } catch (_) {}
          // W4-7 — push a 12-deep ring-buffer entry into invoiceTrend
          // so Cost Pulse / Plate Cost stale-banner / Margin Math
          // food-cost-band can read trend deltas without re-decrypting
          // the server-side envelopes. Aggregates only (no item names,
          // no SKUs, no raw OCR).
          try {
            if (typeof MuntinContext !== 'undefined' &&
                typeof MuntinContext.pushTrendEntry === 'function') {
              var totalsByCategory = {};
              parsedRowsState.forEach(function (r) {
                if (r.ignored) return;
                if (!r.category || r.lineTotal == null) return;
                totalsByCategory[r.category] = +(((totalsByCategory[r.category] || 0) + r.lineTotal).toFixed(2));
              });
              MuntinContext.pushTrendEntry({
                vendor:           payload.vendor || null,
                savedAt:          payload.savedAt,
                totalsByCategory: totalsByCategory,
                parsedSum:        payload.parsedSum,
                itemCount:        payload.itemCount
              });
            }
          } catch (_) {}
          // Wave 1.1 — record per-SKU price observations so the next
          // invoice can show drift chips and the vendor pulse strip
          // can compute top movers. Aggregates only (price/qty/unit
          // by stem); no row text, no descriptions, no raw OCR.
          try {
            if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.recordObservations) {
              MID_SKU_HISTORY.recordObservations(parsedRowsState, payload.vendor || null);
            }
          } catch (_) {}
          // Wave 5.6 — accuracy sample: confirmed-without-edit ratio.
          try {
            if (typeof MID_ONBOARDING !== 'undefined') {
              var firstReadOk = parsedRowsState.filter(function (r) {
                return !r.ownerConfirmed && confBand(r.confidence) === 'green';
              }).length;
              var rate = parsedRowsState.length ? (firstReadOk / parsedRowsState.length) : 0;
              MID_ONBOARDING.recordAccuracySample(rate);
              MID_ONBOARDING.recordSave();
              MID_ONBOARDING.clearResumeRecord();
            }
          } catch (_) {}
          // W3-4 (was B6-4): write a slim summary so Plate Cost can
          // pre-fill its ingredient grid; Menu Engineering surfaces a
          // rolling food-cost % suggestion; Margin Math reads the
          // category totals. The earlier shape wrote these rows to
          // localStorage in plaintext, contradicting the privacy
          // claim. Now wrapped via MID_DEVICE_KEY (per-device AES-GCM)
          // so the localStorage value is opaque ciphertext — readers
          // call MuntinContext.readInvoiceItems() which decrypts.
          try {
            if (typeof MuntinContext !== 'undefined' &&
                typeof MuntinContext.writeInvoiceItems === 'function') {
              var slim = parsedRowsState.slice(0, 50).map(function (r) {
                return {
                  name: String(r.name || '').slice(0, 60),
                  qty: r.qty,
                  unit: r.unit,
                  unitPrice: r.unitPrice,
                  category: r.category,
                  source: payload.vendor || null,
                  parsedAt: payload.savedAt
                };
              });
              MuntinContext.writeInvoiceItems(slim).catch(function () {
                // Never fall back to plaintext on failure — that
                // would silently re-introduce the contradiction.
                // The handoff just doesn't happen this run; the
                // server-side encrypted envelope still saved fine.
              });
            }
          } catch (_) {}
          renderHandoffPanel(payload);
          if (window.plausible) {
            window.plausible('Invoice Decoder Saved', { props: {
              items_bucket: payload.itemCount < 10 ? '<10' :
                            payload.itemCount < 25 ? '10-24' :
                            payload.itemCount < 50 ? '25-49' : '50+',
              vendor_detected: payload.vendor ? 'true' : 'false'
            } });
          }
          // W3-2: reveal the network-walkthrough Measure button.
          // Reads performance.getEntriesByType('resource') for the
          // /api/workbench/save POST and reports actual bytes — gives
          // the operator a concrete, real number when they expand
          // the verify-it-yourself disclosure.
          try {
            var verifyBtn = document.getElementById('idVerifyMeasureBtn');
            var verifyOut = document.getElementById('idVerifyMeasureOut');
            if (verifyBtn && !verifyBtn.dataset.wired) {
              verifyBtn.hidden = false;
              verifyBtn.dataset.wired = '1';
              verifyBtn.addEventListener('click', function () {
                var entries = [];
                try {
                  entries = (performance.getEntriesByType('resource') || [])
                    .filter(function (e) { return e.name && e.name.indexOf('/api/workbench/save') !== -1; });
                } catch (_) {}
                if (!entries.length) {
                  verifyOut.textContent = tt(
                    'No /api/workbench/save entry found yet — try again after a save.',
                    'Aún no hay entrada /api/workbench/save — intenta después de guardar.'
                  );
                  return;
                }
                var last = entries[entries.length - 1];
                var bytes = last.encodedBodySize || last.transferSize || 0;
                verifyOut.textContent = tt(
                  '✓ POST /api/workbench/save · ' + bytes + ' bytes on the wire · status: encrypted ciphertext',
                  '✓ POST /api/workbench/save · ' + bytes + ' bytes en la red · estado: ciphertext encriptado'
                );
              });
            }
          } catch (_) {}
          // W3-1: surface the proof flyout. Shows the actual
          // ciphertext, the actual outgoing POST shape, and a
          // try-to-break demo that uses MID_ENCRYPT.decryptPayload
          // against operator-typed wrong passphrases. Privacy
          // claim becomes verifiable from the UI, not a footnote.
          if (savedEnvelope && typeof MID_PROOF !== 'undefined' && MID_PROOF.show) {
            try {
              var sampleNames = parsedRowsState.slice(0, 3).map(function (r) {
                var bits = [String(r.name || '').slice(0, 40)];
                if (r.lineTotal != null) bits.push('$' + r.lineTotal.toFixed(2));
                return bits.join(' · ');
              });
              MID_PROOF.show({
                envelope: savedEnvelope,
                payload: { itemCount: payload.itemCount, sampleNames: sampleNames },
                decrypt: function (env, tryPp) {
                  return MID_ENCRYPT.decryptPayload(env, tryPp, savedAad);
                },
                // Wave 6.3 second half — give the proof flyout a
                // pairing handler. The flyout shows a "Pair another
                // device" button only when this callback is present
                // (i.e., we have an unlocked passphrase + envelope
                // in scope). Operator clicks → openPairingModal()
                // generates a labeled 24-word token, calls addDevice,
                // re-saves the envelope, displays the token.
                openPairing: function () {
                  if (savedEnvelope && savedPassphrase &&
                      typeof MID_PAIRING !== 'undefined' && MID_PAIRING.addDevice) {
                    runPairingFlow(savedEnvelope, savedPassphrase, savedAad, payload);
                  }
                }
              });
            } catch (_) { /* flyout is purely decorative — never block save */ }
          }
          // Wave 6.3 — offer the recovery-phrase setup AFTER the
          // save has succeeded. We only ask the very first time:
          // once the operator sets up a recovery phrase OR explicitly
          // skips, we don't pester. The recovery wrap is added to
          // the existing envelope via MID_ENCRYPT.addWrap, then
          // re-saved. Failures are non-fatal — the original save
          // already succeeded, the operator can try again later.
          try {
            if (savedEnvelope && savedEnvelope.v === 2 &&
                typeof MID_RECOVERY !== 'undefined' &&
                typeof MID_PASS !== 'undefined' && MID_PASS.showRecoveryPhrase &&
                savedPassphrase) {
              var alreadyHasRecovery = (savedEnvelope.wraps || []).some(function (w) { return w.kind === 'recovery'; });
              var alreadyOffered = !!(MID_RECOVERY.readGenerated && MID_RECOVERY.readGenerated());
              if (!alreadyHasRecovery && !alreadyOffered) {
                MID_RECOVERY.generatePhrase().then(function (phrase) {
                  return MID_PASS.showRecoveryPhrase(phrase).then(function (confirmed) {
                    if (!confirmed) {
                      // Operator dismissed; mark "offered" so we don't
                      // re-prompt every save. They can re-trigger from
                      // a future settings panel.
                      MID_RECOVERY.markGenerated();
                      return;
                    }
                    return MID_ENCRYPT.addWrap(savedEnvelope, savedPassphrase, phrase, 'recovery').then(function (newEnv) {
                      // Re-save the envelope with the additional wrap.
                      var retryBody = new FormData();
                      retryBody.set('kind', 'invoice-decoder');
                      retryBody.set('title', tt('Invoice', 'Factura') + ' · ' + payload.itemCount + ' ' + tt('items', 'partidas'));
                      retryBody.set('aad', savedAad);
                      retryBody.set('payload', JSON.stringify({ envelope: newEnv, aad: savedAad, items: payload.itemCount, parsedSum: payload.parsedSum }));
                      return fetch('/api/workbench/save', { // h8-exempt:workshop-save — same encrypted-only POST, now adds recovery wrap
                        method: 'POST',
                        credentials: 'same-origin',
                        body: retryBody
                      }).then(function (r) { return r.ok ? r.json() : null; }).then(function () {
                        MID_RECOVERY.markGenerated();
                        if (window.plausible) {
                          try { window.plausible('Invoice Decoder Recovery Set'); } catch (_) {}
                        }
                      });
                    });
                  });
                }).catch(function () { /* never block on recovery setup */ });
              }
            }
          } catch (_) {}
        } else {
          throw new Error(j.error || 'unknown server error');
        }
        }).catch(function (err) {
          setSaveStatus(null, 'error');
          alert(tt('Save failed: ' + (err.message || 'unknown error'),
                   'Falló el guardado: ' + (err.message || 'error desconocido')));
        });
      });
    });
  }

  // Wave 2.4 — bulk-confirm with live count + 5s wide undo.
  // The button label always shows the live count of un-confirmed
  // non-red rows. Click captures a snapshot, applies the bulk move,
  // then surfaces a wide banner with a 5-second countdown bar; the
  // operator can revert in one tap.
  function refreshBulkCount() {
    var lbl = document.getElementById('idBulkCount');
    if (!lbl) return;
    var cnt = 0;
    parsedRowsState.forEach(function (r) {
      if (r.ignored) return;
      var band = confBand(r.confidence);
      if (band !== 'red' && !r.ownerConfirmed) cnt++;
    });
    lbl.textContent = cnt;
    var btn = document.getElementById('idBulkConfirm');
    if (btn) {
      btn.disabled = cnt === 0;
      btn.setAttribute('aria-label', tt('Confirm ' + cnt + ' remaining rows as-is', 'Confirmar ' + cnt + ' renglones restantes tal cual'));
    }
  }
  // Hook into the existing rerenderRows call sequence by patching
  // updateFilterChipCounts (always called from rerenderRows).
  var __origUpdateChipCounts = updateFilterChipCounts;
  updateFilterChipCounts = function () {
    __origUpdateChipCounts();
    refreshBulkCount();
  };

  function showBulkUndo(message, undoFn) {
    var host = document.getElementById('idBulkUndo');
    var msg = document.getElementById('idBulkUndoMsg');
    var btn = document.getElementById('idBulkUndoBtn');
    var fill = document.getElementById('idBulkUndoFill');
    if (!host || !msg || !btn || !fill) return;
    if (host.__timer) clearTimeout(host.__timer);
    host.hidden = false;
    msg.textContent = message;
    fill.style.transition = 'none';
    fill.style.width = '100%';
    // Force reflow then animate the fill.
    void fill.offsetWidth;
    fill.style.transition = 'width 5000ms linear';
    fill.style.width = '0%';
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.textContent = tt('Undo', 'Deshacer');
    newBtn.addEventListener('click', function () {
      try { undoFn(); } catch (_) {}
      host.hidden = true;
    });
    host.__timer = setTimeout(function () { host.hidden = true; }, 5000);
  }

  if (bulkConfirm) {
    bulkConfirm.addEventListener('click', function () {
      // Snapshot every row's prior state for one-shot undo.
      var snapshot = parsedRowsState.map(function (r) {
        return { confidence: r.confidence, ownerConfirmed: !!r.ownerConfirmed };
      });
      // Confirm every non-red, un-confirmed row. Red rows are
      // intentionally NOT batched — they need individual review.
      var moved = 0;
      parsedRowsState.forEach(function (r) {
        if (r.ignored) return;
        if (confBand(r.confidence) === 'red') return;
        if (r.ownerConfirmed) return;
        r.confidence = 100;
        r.ownerConfirmed = true;
        moved++;
      });
      rerenderRows();
      if (moved > 0) {
        showBulkUndo(
          tt('Confirmed ' + moved + ' rows. ', 'Confirmados ' + moved + ' renglones. '),
          function () {
            parsedRowsState.forEach(function (r, i) {
              if (snapshot[i]) {
                r.confidence = snapshot[i].confidence;
                r.ownerConfirmed = snapshot[i].ownerConfirmed;
              }
            });
            rerenderRows();
          }
        );
      }
      if (window.plausible && moved > 0) {
        window.plausible('Invoice Decoder Bulk Confirm', { props: {
          count_bucket: moved < 5 ? '<5' : moved < 15 ? '5-14' : '15+'
        } });
      }
    });
  }

  // Wave 1.1 — contract-set button delegated handler.
  if (parsedList) {
    parsedList.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.id-row-history-contract');
      if (!btn) return;
      var idx = parseInt(btn.getAttribute('data-idx'), 10);
      if (!isFinite(idx)) return;
      var row = parsedRowsState[idx];
      if (!row) return;
      var defaultPrice = (typeof row.unitPrice === 'number')
        ? row.unitPrice
        : (row.lineTotal && row.qty ? row.lineTotal / row.qty : 0);
      var promptStr = tt(
        'Set your contract price for "' + row.name + '" (per unit)',
        'Fija el precio de contrato para "' + row.name + '" (por unidad)'
      );
      var typed = window.prompt(promptStr, defaultPrice ? defaultPrice.toFixed(4) : '');
      if (typed == null) return;
      var v = parseFloat(typed);
      if (!isFinite(v) || v <= 0) return;
      try {
        if (typeof MID_SKU_HISTORY !== 'undefined' && MID_SKU_HISTORY.setContract) {
          MID_SKU_HISTORY.setContract(row.name, v, { vendor: row.vendorDetected || null, unit: row.unit });
        }
        rerenderRows();
        if (window.plausible) {
          try { window.plausible('Invoice Decoder Contract Set'); } catch (_) {}
        }
      } catch (_) {}
    });
  }

  // Wave 4.6 — accountant CSV export drawer wiring. The five buttons
  // live in the post-save handoff panel; clicking generates and
  // downloads the matching format entirely client-side.
  function buildAccountantInvoice() {
    var totalsByCategory = {};
    parsedRowsState.forEach(function (r) {
      if (r.ignored || !r.category || r.lineTotal == null) return;
      totalsByCategory[r.category] = +(((totalsByCategory[r.category] || 0) + r.lineTotal).toFixed(2));
    });
    return {
      vendor:           (lastReadParsed && lastReadParsed.vendor) || null,
      savedAt:          Date.now(),
      totalsByCategory: totalsByCategory,
      parsedSum:        parsedRowsState.reduce(function (a, r) { return a + (r.lineTotal || 0); }, 0),
      rows:             parsedRowsState.filter(function (r) { return !r.ignored; })
    };
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.id-export-btn');
    if (!btn) return;
    var fmt = btn.getAttribute('data-fmt');
    if (!fmt || typeof MID_ACCOUNTANT === 'undefined') return;
    e.preventDefault();
    try {
      var inv = buildAccountantInvoice();
      var artifact = MID_ACCOUNTANT.exportInvoice(fmt, inv, {});
      MID_ACCOUNTANT.download(artifact);
      if (window.plausible) {
        try { window.plausible('Invoice Decoder Accountant Export', { props: { format: fmt } }); } catch (_) {}
      }
    } catch (err) {
      alert(tt('Export failed: ' + (err && err.message ? err.message : 'unknown error'),
               'Falló la exportación: ' + (err && err.message ? err.message : 'error desconocido')));
    }
  });


  if (photoInput) photoInput.addEventListener('change', function (e) {
    handlePhotoFiles(e.target.files);
    e.target.value = '';
  });

  // Wave A — content-aware intake. The unified upload box at the top
  // of the tool accepts any supported file type; this dispatcher
  // sniffs each file (MIME + extension) and routes it to the right
  // pipeline. Multi-file drops process the first matching item now;
  // a follow-up wave will queue the rest.
  // Wave 1.2 — delegate the looksLike* sniffs to the source classifier
  // module so they share one source of truth. Module exposes synchronous
  // helpers for cheap dispatch and an async classify() for full signals.
  function _looksLikeCsv(f) {
    if (typeof MID_SOURCE_CLASSIFIER !== 'undefined') return MID_SOURCE_CLASSIFIER.looksLikeCsv(f);
    var n = String(f && f.name || '').toLowerCase();
    if (/\.(csv|tsv|xlsx|xls)$/.test(n)) return true;
    var t = String(f && f.type || '').toLowerCase();
    return t === 'text/csv' || t === 'text/tab-separated-values' ||
      t === 'application/vnd.ms-excel' ||
      t === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  function _looksLikePdf(f) {
    if (typeof MID_SOURCE_CLASSIFIER !== 'undefined') return MID_SOURCE_CLASSIFIER.looksLikePdf(f);
    var t = String(f && f.type || '').toLowerCase();
    if (t === 'application/pdf') return true;
    return /\.pdf$/i.test(String(f && f.name || ''));
  }
  function _looksLikeImage(f) {
    if (typeof MID_SOURCE_CLASSIFIER !== 'undefined') return MID_SOURCE_CLASSIFIER.looksLikeImage(f);
    var t = String(f && f.type || '').toLowerCase();
    if (t.indexOf('image/') === 0) return true;
    return /\.(jpe?g|png|heic|heif|webp|tiff?|bmp|gif)$/i.test(String(f && f.name || ''));
  }
  // Wave 1.2 — async classification before routing, so processPdfFile
  // and handlePhotoFiles can pick a profile-aware preprocess path
  // (Wave 1.4) and so we can surface honest "we see a ScanSnap PDF"
  // coaching to the operator.
  function dispatchUnifiedFile(file) {
    if (!file) return;
    var coarse = (typeof MID_SOURCE_CLASSIFIER !== 'undefined')
      ? MID_SOURCE_CLASSIFIER.classifySync(file)
      : { kind: _looksLikePdf(file) ? 'pdf-hybrid' : (_looksLikeCsv(file) ? 'tabular' : (_looksLikeImage(file) ? 'image-phone' : 'unknown')) };
    if (coarse.kind === 'unknown') {
      showStatus(
        tt('We don\'t recognize this file type.', 'No reconocemos este tipo de archivo.'),
        tt('Try a photo (JPG/PNG/HEIC), a PDF, or a CSV / Excel export.',
           'Prueba una foto (JPG/PNG/HEIC), un PDF, o un CSV / Excel.'),
        'error'
      );
      return;
    }
    var classifyP = (typeof MID_SOURCE_CLASSIFIER !== 'undefined')
      ? MID_SOURCE_CLASSIFIER.classify(file).catch(function () { return coarse; })
      : Promise.resolve(coarse);
    classifyP.then(function (result) {
      _surfaceClassificationHint(result);
      if (result.kind === 'tabular' || _looksLikeCsv(file)) {
        processCsvFile(file);
      } else if (/^pdf-/.test(result.kind) || _looksLikePdf(file)) {
        processPdfFile(file, { classification: result });
      } else if (/^image-/.test(result.kind) || _looksLikeImage(file)) {
        handlePhotoFiles([file], { classification: result });
      }
    });
  }
  // Surface a small honest banner when the classifier identifies a
  // scanner producer (ScanSnap, Adobe Scan, ...) or a screenshot —
  // the operator immediately sees we recognize their input. Banner
  // is informational; never blocks routing.
  function _surfaceClassificationHint(c) {
    if (!c || !c.scannerHint && !/^(image-screenshot|image-scanner|image-thermal)$/.test(c.kind || '')) return;
    var msg = '';
    if (c.scannerHint) {
      msg = tt('We see this is a scanned PDF (' + c.scannerHint + ') — reading the scanned pages.',
               'Vemos que es un PDF escaneado (' + c.scannerHint + ') — leyendo las páginas escaneadas.');
    } else if (c.kind === 'image-screenshot') {
      msg = tt('Looks like a screenshot — skipping photo cleanup so it stays sharp.',
               'Parece una captura — saltando la limpieza de foto para mantenerla nítida.');
    } else if (c.kind === 'image-scanner') {
      msg = tt('Flatbed-scanner image detected — using the fast path.',
               'Imagen de escáner detectada — usando la vía rápida.');
    } else if (c.kind === 'image-thermal') {
      msg = tt('Thermal/receipt image detected — tuning for narrow paper.',
               'Imagen de recibo térmico detectada — ajustando para papel estrecho.');
    }
    if (!msg) return;
    try {
      var hintEl = document.getElementById('idClassifyHint');
      if (!hintEl) {
        hintEl = document.createElement('p');
        hintEl.id = 'idClassifyHint';
        hintEl.className = 'id-classify-hint';
        hintEl.setAttribute('role', 'status');
        hintEl.setAttribute('aria-live', 'polite');
        var anchor = document.getElementById('idStatus');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(hintEl, anchor);
      }
      hintEl.textContent = msg;
      hintEl.hidden = false;
    } catch (_) {}
  }
  function dispatchUnifiedFileList(fileList) {
    if (!fileList || !fileList.length) return;
    var files = Array.prototype.slice.call(fileList);
    // If all files are images, keep them together so multi-page photo
    // capture (a typical use case) flows through handlePhotoFiles in
    // one go. Otherwise dispatch the first file and surface a coaching
    // chip about the rest — the queue lands in a follow-up.
    var allImages = files.every(_looksLikeImage);
    if (allImages) {
      // Classify the first image so the rest get the same profile.
      var firstClassifyP = (typeof MID_SOURCE_CLASSIFIER !== 'undefined')
        ? MID_SOURCE_CLASSIFIER.classify(files[0]).catch(function () { return null; })
        : Promise.resolve(null);
      firstClassifyP.then(function (c) {
        _surfaceClassificationHint(c);
        handlePhotoFiles(files, { classification: c });
      });
      return;
    }
    // Wave 1.9 — multi-file queue. Process the first file now; queue
    // the rest. Each saved invoice fires `mid:invoice-saved`, which
    // advances the queue. Skip / Stop buttons drain it.
    _enqueueFiles(files.slice(1));
    dispatchUnifiedFile(files[0]);
    _renderQueueStrip();
  }

  // Wave 1.9 — intake queue state + UI helpers.
  var _intakeQueue = [];
  function _enqueueFiles(files) {
    if (!files || !files.length) return;
    Array.prototype.push.apply(_intakeQueue, files);
  }
  function _drainQueue() { _intakeQueue.length = 0; _renderQueueStrip(); }
  function _renderQueueStrip() {
    var qEl = document.getElementById('idQueue');
    var msg = document.getElementById('idQueueMsg');
    if (!qEl) return;
    if (!_intakeQueue.length) {
      qEl.hidden = true;
      return;
    }
    qEl.hidden = false;
    var nextName = String(_intakeQueue[0] && _intakeQueue[0].name || 'next file').replace(/[<>&]/g, '');
    if (msg) msg.textContent = tt(
      _intakeQueue.length + ' more in this batch — next: "' + nextName + '" after you save this one.',
      _intakeQueue.length + ' más en este lote — sigue: "' + nextName + '" cuando guardes ésta.'
    );
  }
  function _advanceQueueAfterSave() {
    if (!_intakeQueue.length) {
      _renderQueueStrip();
      return;
    }
    var next = _intakeQueue.shift();
    _renderQueueStrip();
    // Small delay so the proof flyout / save toast can settle visibly
    // before the next file kicks off OCR.
    setTimeout(function () { dispatchUnifiedFile(next); }, 1200);
  }
  // Listen for the save event fired in the encryptPayload chain above.
  if (typeof window !== 'undefined') {
    window.addEventListener('mid:invoice-saved', _advanceQueueAfterSave);
  }
  // Wire the queue-strip buttons.
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t) return;
      if (t.id === 'idQueueSkip' && _intakeQueue.length) {
        _intakeQueue.shift();
        _renderQueueStrip();
        // Skipping the *current* in-flight invoice is operator-pacing;
        // we just remove the next-up entry. If the operator wants to
        // skip the *current* invoice, they can hit Stop.
      } else if (t.id === 'idQueueCancel') {
        _drainQueue();
      }
    });
  }
  // Wave 1.9 — folder picker. Hidden on touch UAs (iOS Safari and
  // many mobile browsers ignore webkitdirectory and silently no-op
  // the picker, which is more confusing than not showing the button
  // at all).
  if (typeof navigator !== 'undefined') {
    var ua = navigator.userAgent || '';
    var isTouch = /iPhone|iPad|iPod|Android|Mobile/i.test(ua);
    var folderBtn = document.getElementById('idFolderBtn');
    var folderInput = document.getElementById('idFolderInput');
    if (folderBtn && folderInput && !isTouch) {
      try { folderInput.setAttribute('webkitdirectory', ''); } catch (_) {}
      try { folderInput.setAttribute('directory', ''); } catch (_) {}
      folderBtn.hidden = false;
      folderBtn.addEventListener('click', function () { folderInput.click(); });
      folderInput.addEventListener('change', function (e) {
        // Filter to recognized types so the queue doesn't choke on
        // .DS_Store / Thumbs.db / random metadata files.
        var raw = Array.prototype.slice.call(e.target.files || []);
        var filtered = raw.filter(function (f) {
          return _looksLikePdf(f) || _looksLikeImage(f) || _looksLikeCsv(f);
        });
        if (!filtered.length) {
          showStatus(
            tt('No invoice files in that folder.', 'No hay archivos de factura en esa carpeta.'),
            tt('Looking for PDF, JPG/PNG, HEIC, CSV, or Excel files.',
               'Buscamos PDF, JPG/PNG, HEIC, CSV o Excel.'),
            'error'
          );
          return;
        }
        dispatchUnifiedFileList(filtered);
        e.target.value = '';
      });
    }
  }
  // Hook the new unified dropzone input. Backward compat: the
  // original photo / pdf / csv inputs and chips still work as before.
  var anyInput = document.getElementById('idAnyInput');
  if (anyInput) {
    anyInput.addEventListener('change', function (e) {
      dispatchUnifiedFileList(e.target.files);
      e.target.value = '';
    });
  }
  // Drag-and-drop on the dropzone label. The native <label> click
  // already opens the OS picker; we just intercept drop events.
  var dropEl = document.getElementById('idDropzone');
  if (dropEl) {
    var dragHover = function (on) {
      try { dropEl.dataset.dragging = on ? 'true' : 'false'; } catch (_) {}
    };
    dropEl.addEventListener('dragenter', function (e) { e.preventDefault(); dragHover(true); });
    dropEl.addEventListener('dragover',  function (e) { e.preventDefault(); dragHover(true); });
    dropEl.addEventListener('dragleave', function (e) { e.preventDefault(); dragHover(false); });
    dropEl.addEventListener('drop', function (e) {
      e.preventDefault();
      dragHover(false);
      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length) {
        dispatchUnifiedFileList(dt.files);
      }
    });
  }
  // Clipboard paste — Ctrl+V a screenshot anywhere on the tool page
  // routes through the same intake. Scoped to ignore pastes inside
  // text inputs / contenteditable so we don't hijack normal typing.
  document.addEventListener('paste', function (e) {
    var ae = document.activeElement;
    if (ae) {
      var tag = (ae.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || ae.isContentEditable) return;
    }
    var cd = e.clipboardData;
    if (!cd || !cd.files || !cd.files.length) return;
    e.preventDefault();
    dispatchUnifiedFileList(cd.files);
  });

  // Wave 2.1 — intercept the photo chip click. When the live capture
  // coach is supported (HTTPS + getUserMedia available + camera
  // grantable) we open it INSTEAD of the OS file/camera picker. The
  // coach gives the operator a real-time edge-overlay + coaching
  // prompts before capture; on "Done" we feed its captured Files
  // into the same handlePhotoFiles pipeline. On unsupported browsers,
  // permission denied, or operator dismissal, we fall through to the
  // native picker by clicking photoInput directly.
  var photoChip = document.querySelector('.id-input-chip[data-input="photo"]');
  if (photoChip && photoInput && typeof MID_CAPTURE_COACH !== 'undefined' && MID_CAPTURE_COACH.isSupported && MID_CAPTURE_COACH.isSupported()) {
    photoChip.addEventListener('click', function (e) {
      // Don't intercept clicks on the inner <input> — that's the
      // browser's own file-picker bubble; let it proceed normally.
      // We're after the label-click that bubbles up here.
      if (e.target === photoInput) return;
      // Don't intercept when the operator already opened a picker
      // (modifier keys, right-click, etc).
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      e.stopPropagation();
      MID_CAPTURE_COACH.open().then(function (files) {
        if (files && files.length) {
          handlePhotoFiles(files);
          if (window.plausible) {
            try { window.plausible('Invoice Decoder Coach Done', { props: { pages: files.length } }); } catch (_) {}
          }
        } else {
          // Operator dismissed or permission denied. Fall back to
          // the native picker so they can still pick from camera roll.
          if (photoInput) {
            try { photoInput.click(); } catch (_) {}
          }
        }
      });
    }, { capture: true });
  }

  // -------------------- PDF + CSV (B2 will wire fully) --------------------
  // Extracted to a named function so the unified-intake dispatcher
  // (Wave A) can route a sniffed PDF here without going through a
  // synthetic <input> change event. The original pdfInput change
  // listener simply forwards.
  function processPdfFile(f, opts) {
    if (!f) return;
    opts = opts || {};
    var classification = opts.classification || null;
    var password = opts.password || null;
    setActiveChip('pdf');
    if (typeof MID_PDF_EXTRACT === 'undefined' || !MID_PDF_EXTRACT.extractPdf) {
      showStatus(
        tt('PDF reader unavailable.', 'Lector de PDF no disponible.'),
        tt('Refresh the page and try again. If the problem persists, fall back to the photo path.',
           'Recarga la página e intenta de nuevo. Si el problema persiste, usa la ruta de foto.'),
        'error'
      );
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      showStatus(
        tt('PDF too large.', 'PDF muy grande.'),
        tt('That PDF is over 25 MB. Most distributor invoices are under 5 MB — re-export from the portal or trim to invoice-only pages.',
           'Ese PDF pasa de 25 MB. La mayoría de facturas pesan menos de 5 MB — re-exporta del portal o deja solo las páginas de la factura.'),
        'error'
      );
      return;
    }
    showStatus(
      tt('Reading the PDF…', 'Leyendo el PDF…'),
      tt('Extracting the text layer. PDFs from Sysco / US Foods / GFS / Restaurant Depot are >99% accurate without any OCR.',
         'Extrayendo la capa de texto. Los PDF de Sysco / US Foods / GFS / Restaurant Depot son >99% precisos sin OCR.')
    );
    setProgress(15);

    MID_PDF_EXTRACT.extractPdf(f, password ? { password: password } : undefined).then(function (result) {
      setProgress(70);
      if (result.imageOnly) {
        // Image-only PDF (scan with no text layer — typical of
        // ScanSnap and other desktop scanners). Until Wave A landed
        // we gave up here and pushed the operator to the photo path.
        // We now rasterize each page to a JPEG and feed the array
        // through handlePhotoFiles, which already runs the full
        // preprocess + multi-pass OCR pipeline on photo-source pages.
        if (!MID_PDF_EXTRACT.rasterizeImageOnlyPdf) {
          showStatus(
            tt('This PDF is a scanned image, not a text document.',
               'Este PDF es una imagen escaneada, no un documento de texto.'),
            tt('No text layer to read. Try the photo path with each page snapped separately, or ask your distributor to send a text-based PDF.',
               'No hay capa de texto. Usa la ruta de foto con cada página por separado, o pide a tu distribuidor un PDF basado en texto.'),
            'error'
          );
          return;
        }
        showStatus(
          tt('Scanned PDF — reading each page like a photo…',
             'PDF escaneado — leyendo cada página como una foto…'),
          tt('No text layer here, so we render every page on this device and run the same OCR we use for camera shots. Nothing leaves your tab.',
             'Sin capa de texto, así que renderizamos cada página en este dispositivo y aplicamos el mismo OCR de las fotos. Nada sale de tu pestaña.')
        );
        setProgress(35);
        return MID_PDF_EXTRACT.rasterizeImageOnlyPdf(f, {
          password: password,
          onProgress: function (idx, total /*, phase */) {
            // Show smooth progress between 35–65% across rasterization.
            try {
              var pct = 35 + Math.round((idx / total) * 30);
              setProgress(pct);
            } catch (_) {}
          }
        }).then(function (raster) {
          if (!raster || !raster.files || !raster.files.length) {
            showStatus(
              tt('Could not read this scanned PDF.', 'No se pudo leer este PDF escaneado.'),
              tt('Try splitting it into smaller files, or use the photo path on each page.',
                 'Prueba dividirlo en archivos más pequeños, o usa la ruta de foto por página.'),
              'error'
            );
            return;
          }
          if (raster.truncated) {
            // Soft warning surfaced AFTER kickoff so the operator
            // sees that we're processing the first 8 pages rather
            // than blocking the whole flow.
            setTimeout(function () {
              try {
                showStatus(
                  tt('Processing the first 8 pages of this scan.',
                     'Procesando las primeras 8 páginas de este escaneo.'),
                  tt('Long scans can run a phone out of memory. Split the PDF and drop the rest after this batch is reviewed.',
                     'Los escaneos largos pueden agotar la memoria del teléfono. Divide el PDF y suelta el resto después de revisar este lote.')
                );
              } catch (_) {}
            }, 1500);
          }
          // Hand off to the existing photo pipeline. handlePhotoFiles
          // already enforces an 8-page cap, so the rasterize cap and
          // photo cap line up. Wave 1.4 — pass profile='scanner' since
          // rasterized PDF pages are by definition flat, even, and
          // straight, so they skip illumination/Sauvola/perspective.
          handlePhotoFiles(raster.files, {
            classification: {
              kind: 'image-scanner',
              preprocessProfile: 'scanner',
              vendorHint: classification && classification.vendorHint || null,
              scannerHint: classification && classification.scannerHint || null,
              confidence: 1.0,
              signals: classification && classification.signals || {}
            }
          });
        }).catch(function (err) {
          showStatus(
            tt('Could not read this scanned PDF.', 'No se pudo leer este PDF escaneado.'),
            (err && err.message) ? err.message :
              tt('Try splitting it into smaller files, or use the photo path on each page.',
                 'Prueba dividirlo en archivos más pequeños, o usa la ruta de foto por página.'),
            'error'
          );
        });
      }
      // Feed the extracted lines straight to MID_PARSE.parseLines
      // and the existing render pipeline. Same flow as photo OCR
      // EXCEPT we skip multi-pass OCR + adaptive re-read since
      // the source is authoritative.
      var parsed = MID_PARSE.parseLines(result.lines, result.fullText);
      // Apply the filename-derived vendor hint when the text
      // doesn't contain a clear letterhead match.
      var vMatch = null;
      if (typeof MID_VENDORS !== 'undefined' && MID_VENDORS.detectVendor) {
        vMatch = MID_VENDORS.detectVendor(result.fullText);
        if (!vMatch && result.vendorHint) {
          // Synthetic vMatch shape so applyVendorBoost has what it needs.
          var registry = MID_VENDORS.REGISTRY;
          for (var i = 0; i < registry.length; i++) {
            if (registry[i].id === result.vendorHint) {
              vMatch = { id: registry[i].id, label: registry[i].label_en, score: 0.5, vendor: registry[i] };
              break;
            }
          }
        }
        if (vMatch) {
          MID_VENDORS.applyVendorBoost(parsed.rows, vMatch);
          parsed.vendor = vMatch.id;
        }
      }
      classifyRows(parsed.rows);
      // Wave 4.3 — preserve PDF text so auto-learn can fingerprint
      // unrecognized vendors from the PDF path too.
      parsed._rawOcrText = result.fullText || '';
      setProgress(95);
      renderParsed(parsed);
      hideStatus();
      if (window.plausible) {
        window.plausible('Invoice Decoder PDF Extract', { props: {
          rows_bucket: parsed.rows.length < 10 ? '<10' :
                       parsed.rows.length < 25 ? '10-24' :
                       parsed.rows.length < 50 ? '25-49' : '50+',
          pages: String(result.pages),
          vendor_detected: vMatch ? 'true' : 'false'
        } });
      }
    }).catch(function (err) {
      // Wave 1.5 — protected PDF? Surface an inline password prompt
      // and retry. Password lives only in this closure, never
      // persisted, never logged.
      if (err && err.code === 'PDF_PASSWORD_REQUIRED') {
        _promptPdfPassword(f).then(function (pw) {
          if (pw == null) {
            showStatus(
              tt('Locked PDF — cancelled.', 'PDF protegido — cancelado.'),
              tt('Drop the file again with the password if you change your mind.',
                 'Suelta el archivo de nuevo con la contraseña si cambias de idea.'),
              'error'
            );
            return;
          }
          processPdfFile(f, { classification: classification, password: pw });
        });
        return;
      }
      showStatus(
        tt('Could not read this PDF.', 'No se pudo leer este PDF.'),
        (err && err.message) ? err.message :
          tt('Try a different file or the photo path.', 'Prueba con otro archivo o la ruta de foto.'),
        'error'
      );
    });
  }
  // Wave 1.5 — inline PDF password prompt. Resolves to the entered
  // password (string) or null on cancel. The password is captured
  // into this Promise scope and dropped after `getDocument` resolves;
  // never written to localStorage / sessionStorage / IndexedDB / DOM
  // attributes. The prompt is rendered above #idStatus, removed on
  // resolve, and tab-cycle-trapped while open.
  function _promptPdfPassword(file) {
    return new Promise(function (resolve) {
      try {
        var existing = document.getElementById('idPdfPwForm');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      } catch (_) {}
      var form = document.createElement('form');
      form.id = 'idPdfPwForm';
      form.className = 'id-pdf-pw';
      form.setAttribute('role', 'dialog');
      form.setAttribute('aria-label', tt('Enter PDF password', 'Introduce la contraseña del PDF'));
      var fname = file && file.name ? String(file.name).replace(/[<>&"']/g, '') : 'this PDF';
      form.innerHTML =
        '<p class="id-pdf-pw-title">' +
          tt('This PDF is locked', 'Este PDF está protegido') +
        '</p>' +
        '<p class="id-pdf-pw-blurb">' +
          tt('Enter the password to read “' + fname + '”. The password stays in memory for this read and is then discarded.',
             'Introduce la contraseña para leer “' + fname + '”. La contraseña queda solo en memoria para esta lectura y luego se descarta.') +
        '</p>' +
        '<input type="password" class="id-pdf-pw-input" id="idPdfPwInput" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" required />' +
        '<div class="id-pdf-pw-row">' +
          '<button type="submit" class="id-pdf-pw-submit">' + tt('Unlock', 'Desbloquear') + '</button>' +
          '<button type="button" class="id-pdf-pw-cancel">' + tt('Cancel', 'Cancelar') + '</button>' +
        '</div>';
      var anchor = document.getElementById('idStatus');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(form, anchor);
      else document.body.appendChild(form);
      var input = form.querySelector('#idPdfPwInput');
      var cancelBtn = form.querySelector('.id-pdf-pw-cancel');
      try { input.focus(); } catch (_) {}
      function cleanup() {
        try { form.parentNode && form.parentNode.removeChild(form); } catch (_) {}
      }
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var pw = input.value;
        // Best-effort wipe of the input value before we drop the
        // reference. It still lives in the resolved Promise scope
        // until pdfjsLib.getDocument finishes consuming it.
        try { input.value = ''; } catch (_) {}
        cleanup();
        resolve(pw);
      });
      cancelBtn.addEventListener('click', function () {
        try { input.value = ''; } catch (_) {}
        cleanup();
        resolve(null);
      });
      form.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape') {
          try { input.value = ''; } catch (_) {}
          cleanup();
          resolve(null);
        }
      });
    });
  }
  if (pdfInput) pdfInput.addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (f) processPdfFile(f);
    e.target.value = '';
  });

  function processCsvFile(f) {
    if (!f) return;
    setActiveChip('csv');
    if (typeof MID_CSV_EXTRACT === 'undefined' || !MID_CSV_EXTRACT.extractFile) {
      showStatus(
        tt('CSV / Excel reader unavailable.', 'Lector de CSV / Excel no disponible.'),
        tt('Refresh the page and try again.', 'Recarga la página e intenta de nuevo.'),
        'error'
      );
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      showStatus(
        tt('CSV / Excel file too large.', 'Archivo CSV / Excel muy grande.'),
        tt('That file is over 10 MB. Distributor exports are typically <2 MB; trim or re-export from the portal.',
           'Pasa de 10 MB. Las exportaciones suelen pesar <2 MB; recórtala o re-expórtala del portal.'),
        'error'
      );
      return;
    }
    showStatus(
      tt('Reading ' + (f.name || 'your file') + '…', 'Leyendo ' + (f.name || 'tu archivo') + '…'),
      tt('Mapping columns to invoice fields. Distributor CSV / XLSX exports are 100% accurate — zero OCR.',
         'Mapeando columnas a campos de factura. Las exportaciones CSV / XLSX son 100% precisas — sin OCR.')
    );
    setProgress(20);

    MID_CSV_EXTRACT.extractFile(f).then(function (parsed) {
      setProgress(70);
      if (parsed && parsed._noHeaders) {
        showStatus(
          tt('Couldn\'t find a header row in this file.', 'No se encontró una fila de encabezados.'),
          tt('We need at least 2 of these columns named in the first row: Item / Qty / Unit / Price / Total. Re-export with column headers, or fall back to the photo path.',
             'Necesitamos al menos 2 de estas columnas nombradas en la primera fila: Producto / Cantidad / Unidad / Precio / Total. Re-exporta con encabezados, o usa la ruta de foto.'),
          'error'
        );
        return;
      }
      // Filename vendor hint (CSV often lacks a vendor letterhead).
      var vMatch = null;
      var vendorHint = MID_CSV_EXTRACT.vendorHintFromFilename(f.name);
      if (vendorHint && typeof MID_VENDORS !== 'undefined') {
        var registry = MID_VENDORS.REGISTRY;
        for (var i = 0; i < registry.length; i++) {
          if (registry[i].id === vendorHint) {
            vMatch = { id: registry[i].id, label: registry[i].label_en, score: 0.5, vendor: registry[i] };
            break;
          }
        }
        if (vMatch) {
          MID_VENDORS.applyVendorBoost(parsed.rows, vMatch);
          parsed.vendor = vMatch.id;
        }
      }
      classifyRows(parsed.rows);
      setProgress(95);
      renderParsed(parsed);
      hideStatus();
      if (window.plausible) {
        window.plausible('Invoice Decoder CSV Extract', { props: {
          rows_bucket: parsed.rows.length < 10 ? '<10' :
                       parsed.rows.length < 25 ? '10-24' :
                       parsed.rows.length < 50 ? '25-49' : '50+',
          format: f.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : 'csv',
          vendor_detected: vMatch ? 'true' : 'false'
        } });
      }
    }).catch(function (err) {
      showStatus(
        tt('Could not read this file.', 'No se pudo leer este archivo.'),
        (err && err.message) ? err.message : tt('Try the photo path or re-export the file.', 'Usa la ruta de foto o re-exporta el archivo.'),
        'error'
      );
    });
  }
  if (csvInput) csvInput.addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (f) processCsvFile(f);
    e.target.value = '';
  });

  // -------------------- Reload-and-decrypt (W1-5 BLOCKER fix) --------------------
  // Phase 6 W6-3 shipped saved-invoice encryption with NO path
  // to read it back through the tool. The encrypted file became
  // a write-only black hole. This sprint closes that loop.
  //
  // Trigger: query string `?reload=<itemId>` from a Workshop card
  // (added in W1-8) or a manually-pasted link. Flow:
  //
  //   1. Fetch encrypted envelope from /api/workbench/get?id=
  //   2. Open MID_PASS.ask({mode:'unlock'}) for the passphrase
  //   3. MID_ENCRYPT.decryptPayload(envelope, pp, aad)
  //   4. On success: hydrate parsedRowsState[] from items, render
  //      verification panel as if a fresh OCR completed
  //   5. On failure: passphrase-mismatch error, retry up to 5x
  //      per 10-min window
  function handleReloadParam() {
    var id = (function () {
      try {
        var u = new URL(location.href);
        return u.searchParams.get('reload');
      } catch (_) { return null; }
    })();
    if (!id) return;
    if (typeof MID_ENCRYPT === 'undefined' || !MID_ENCRYPT.decryptPayload) return;
    if (typeof MID_PASS === 'undefined' || !MID_PASS.ask) return;

    // Hide the upload UI — we're reading a saved file, not parsing a new one.
    var inputsEl = document.getElementById('idInputs');
    if (inputsEl) inputsEl.style.display = 'none';
    if (statusEl) {
      showStatus(
        tt('Loading your saved invoice…', 'Cargando tu factura guardada…'),
        tt('Fetching the encrypted file. The next step asks for your secret to unlock it.',
           'Descargando el archivo encriptado. El siguiente paso pide tu secreto para desbloquear.')
      );
      setProgress(20);
    }

    // h8-exempt:workshop-save — same as the save POST; this is the
    // matching read-back GET, also user-initiated, also returns
    // ciphertext only.
    fetch('/api/workbench/get?id=' + encodeURIComponent(id), { // h8-exempt:workshop-save
      credentials: 'same-origin'
    }).then(function (r) {
      if (r.status === 401) {
        window.location.href = '/sign-in/?returnTo=' + encodeURIComponent(location.pathname + location.search);
        return null;
      }
      if (!r.ok) throw new Error('fetch failed (' + r.status + ')');
      return r.json();
    }).then(function (j) {
      if (!j || !j.ok || !j.item || !j.item.payload) {
        throw new Error(tt('Saved file not found or unreadable.',
                           'Archivo guardado no encontrado o ilegible.'));
      }
      var saved;
      try { saved = JSON.parse(j.item.payload); } catch (_) { saved = null; }
      if (!saved || !saved.envelope) {
        throw new Error(tt('Saved file format unknown.', 'Formato de archivo desconocido.'));
      }
      setProgress(60);
      return promptAndDecrypt(saved.envelope, saved.aad || '', 0);
    }).catch(function (err) {
      if (statusEl) {
        showStatus(
          tt('Could not load your saved invoice.', 'No se pudo cargar la factura guardada.'),
          err && err.message ? err.message : tt('Try again or return to your Workshop.',
                                                 'Intenta de nuevo o regresa a tu Taller.'),
          'error'
        );
      }
    });
  }

  // Helper: prompt for passphrase, attempt decrypt, retry on
  // failure up to 5 times per 10-minute window. The retry counter
  // is in-tab only (not server-enforced) — pure UX speed bump.
  var __decryptAttempts = [];
  function promptAndDecrypt(envelope, aad, attemptIdx) {
    var now = Date.now();
    __decryptAttempts = __decryptAttempts.filter(function (t) { return t > now - 600000; });
    if (__decryptAttempts.length >= 5) {
      if (statusEl) {
        showStatus(
          tt('Too many wrong tries.', 'Demasiados intentos fallidos.'),
          tt('Take 10 minutes and try again — the saved file is still safe, but we slow down to protect it.',
             'Espera 10 minutos e intenta de nuevo — el archivo está a salvo, pero te frenamos para protegerlo.'),
          'error'
        );
      }
      return Promise.resolve(null);
    }
    return MID_PASS.ask({ mode: 'unlock' }).then(function (pp) {
      if (!pp) {
        if (statusEl) {
          showStatus(
            tt('Cancelled. Your saved invoice is still locked.', 'Cancelado. Tu factura sigue bloqueada.'),
            tt('Tap a Workshop card again to retry, or close this tab.',
               'Toca una tarjeta del Taller para reintentar, o cierra esta pestaña.')
          );
        }
        return null;
      }
      return MID_ENCRYPT.decryptPayload(envelope, pp, aad).then(function (payload) {
        // Success — hydrate state and render verification panel.
        hideStatus();
        if (!payload || !Array.isArray(payload.items)) {
          throw new Error(tt('Decrypted but the format looks wrong.',
                             'Desencriptado, pero el formato se ve mal.'));
        }
        parsedRowsState = payload.items.slice();
        lastPrintedTotal = (typeof payload.printedTotal === 'number') ? payload.printedTotal : null;
        // Re-use the existing render path. parsedEl, parsedList,
        // parsedMeta etc. all read from parsedRowsState.
        if (parsedEl) parsedEl.hidden = false;
        if (parsedList) parsedList.innerHTML = parsedRowsState.map(rowToHtml).join('');
        rerenderTotals();
        var bulkBarEl = document.getElementById('idBulkbar');
        if (bulkBarEl) bulkBarEl.hidden = false;
        // Banner: this is a reloaded file, not a fresh scan.
        var banner = document.createElement('div');
        banner.style.cssText = 'margin:14px 0 0;padding:12px 16px;background:#E6F4EC;border:1px solid #c4e3cf;border-left:3px solid var(--status-good,#1f9d55);border-radius:8px;font-size:13px;color:#1f6e3a';
        banner.innerHTML = '<strong>' + tt('Unlocked.', 'Desbloqueada.') + '</strong> ' +
          tt('This is your saved invoice. Edit it the same way you would after a fresh scan; save again to overwrite, or close to leave it as-is.',
             'Esta es tu factura guardada. Edítala igual que después de un escaneo fresco; guarda de nuevo para sobreescribir, o cierra para dejarla igual.');
        if (parsedEl && parsedEl.parentNode) {
          parsedEl.parentNode.insertBefore(banner, parsedEl);
        }
        if (window.plausible) window.plausible('Invoice Decoder Unlocked');
        return payload;
      }).catch(function () {
        __decryptAttempts.push(Date.now());
        if (statusEl) {
          showStatus(
            tt('That secret didn\'t unlock the file.', 'Ese secreto no abrió el archivo.'),
            tt('Try again — make sure caps lock is off. ' +
               (5 - __decryptAttempts.length) + ' tries left before a 10-minute cooldown.',
               'Intenta de nuevo — revisa que mayúsculas no esté activo. Quedan ' +
               (5 - __decryptAttempts.length) + ' intentos antes del enfriamiento de 10 min.'),
            'error'
          );
        }
        // Re-prompt automatically.
        return promptAndDecrypt(envelope, aad, attemptIdx + 1);
      });
    });
  }

  // ----------------------------------------------------------------
  // W4-8 — drift banner above the parsed panel.
  //
  // When MuntinContext has at least 2 trend entries, run the drift
  // detector. If any category drifted >15% vs the rolling median,
  // render a banner above the result panel naming the worst offender
  // and pointing at a coaching hint. Operator can dismiss it (per-
  // session). Banner re-renders only when MuntinContext changes
  // (cross-tab subscribe).
  // ----------------------------------------------------------------
  function renderDriftBanner() {
    if (typeof MuntinCostTrend === 'undefined') return;
    if (typeof MuntinContext === 'undefined') return;
    var host = document.getElementById('idDriftBanner');
    if (!host) {
      host = document.createElement('div');
      host.id = 'idDriftBanner';
      host.className = 'id-drift-banner';
      host.hidden = true;
      // Mount above the result panel.
      if (parsedEl && parsedEl.parentNode) {
        parsedEl.parentNode.insertBefore(host, parsedEl);
      }
    }
    var trend = MuntinContext.readTrend();
    if (!trend || trend.length < 2) { host.hidden = true; return; }
    var drifts = MuntinCostTrend.detectDrift(trend, { thresholdPct: 15, weeks: 4 });
    if (!drifts.length) { host.hidden = true; return; }
    var top = drifts[0];
    var sign = top.direction === 'up' ? '+' : '';
    var hint = MuntinCostTrend.hintForDrift(top.category, top.direction, LOCALE);
    host.hidden = false;
    host.innerHTML = '';
    var head = document.createElement('strong');
    head.textContent = tt(
      catLabel(top.category) + ' moved ' + sign + top.deltaPct + '% vs your last few invoices.',
      catLabel(top.category) + ' se movió ' + sign + top.deltaPct + '% vs tus últimas facturas.'
    );
    var body = document.createElement('span');
    body.textContent = ' ' + hint;
    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'id-drift-dismiss';
    dismiss.setAttribute('aria-label', tt('Dismiss', 'Cerrar'));
    dismiss.textContent = '×';
    dismiss.addEventListener('click', function () { host.hidden = true; });
    host.appendChild(head);
    host.appendChild(body);
    host.appendChild(dismiss);
  }
  try { renderDriftBanner(); } catch (_) {}

  // ----------------------------------------------------------------
  // W4-9 — per-category sparkline strip below the result panel.
  //
  // When >=3 trend entries exist, render a strip showing each
  // category's spend trajectory across the trend (oldest → newest)
  // with a delta% chip. Below 3 saves we render the honest line
  // "Each invoice stands alone — for trends across weeks, save 2
  // more invoices."
  // ----------------------------------------------------------------
  function renderTrendSparklines() {
    if (typeof MuntinSparkline === 'undefined') return;
    if (typeof MuntinContext === 'undefined') return;
    var host = document.getElementById('idTrendStrip');
    if (!host) {
      host = document.createElement('div');
      host.id = 'idTrendStrip';
      host.className = 'id-trend-strip';
      host.hidden = true;
      if (parsedEl && parsedEl.parentNode) {
        parsedEl.parentNode.appendChild(host);
      }
    }
    var trend = MuntinContext.readTrend();
    host.innerHTML = '';
    if (!trend || trend.length < 3) {
      if (trend && trend.length >= 1) {
        host.hidden = false;
        host.innerHTML = '<p class="id-trend-empty">' + tt(
          'Each invoice stands alone — for trends across weeks, save ' + (3 - trend.length) +
            ' more ' + (3 - trend.length === 1 ? 'invoice' : 'invoices') + '.',
          'Cada factura es independiente — para ver tendencias entre semanas, guarda ' +
            (3 - trend.length) + ' factura' + (3 - trend.length === 1 ? '' : 's') + ' más.'
        ) + '</p>';
      } else {
        host.hidden = true;
      }
      return;
    }
    // Build per-category series oldest-first (trend is newest-first).
    var ordered = trend.slice().reverse();
    var perCat = {};
    ordered.forEach(function (e) {
      Object.keys(e.totalsByCategory || {}).forEach(function (k) {
        (perCat[k] = perCat[k] || []).push(e.totalsByCategory[k]);
      });
    });
    var labelMap = {};
    Object.keys(perCat).forEach(function (k) { labelMap[k] = catLabel(k); });
    host.hidden = false;
    var heading = document.createElement('p');
    heading.className = 'id-trend-heading';
    heading.innerHTML = '<strong>' +
      tt('Across your last ' + trend.length + ' invoices',
         'En tus últimas ' + trend.length + ' facturas') +
      '</strong>';
    host.appendChild(heading);
    var stripWrap = document.createElement('div');
    stripWrap.innerHTML = MuntinSparkline.renderCategoryStrip(perCat, {
      locale: LOCALE,
      labelMap: labelMap
    });
    host.appendChild(stripWrap);
  }
  try { renderTrendSparklines(); } catch (_) {}

  // W3-3 — render comparison-vs-vendors table from MuntinDifferentiators.
  // Static HTML can't host this without locale duplication, so we
  // render once at boot into the #idCompareMount placeholder. The
  // <details> element keeps it collapsed so the honesty card doesn't
  // grow tall on initial paint.
  function renderCompareTable() {
    var mount = document.getElementById('idCompareMount');
    if (!mount || typeof MuntinDifferentiators === 'undefined') return;
    var data = MuntinDifferentiators.vsAlternative('invoice-decoder', LOCALE);
    if (!data || !Array.isArray(data.comparisonRows)) return;
    var det = document.createElement('details');
    det.className = 'id-compare';
    var sum = document.createElement('summary');
    sum.appendChild(document.createTextNode(
      tt('How this compares to Restaurant365, MarginEdge, Plate IQ',
         'Cómo se compara con Restaurant365, MarginEdge, Plate IQ')
    ));
    var badge = document.createElement('span');
    badge.className = 'id-compare-badge';
    badge.textContent = data.chipLabel || tt('vs paid alternatives', 'vs alternativas pagadas');
    sum.appendChild(badge);
    det.appendChild(sum);

    var table = document.createElement('table');
    table.className = 'id-compare-table';
    var thead = document.createElement('thead');
    var trh = document.createElement('tr');
    var hAxis  = document.createElement('th'); hAxis.textContent  = tt('What you care about', 'Lo que te importa');
    var hOurs  = document.createElement('th'); hOurs.textContent  = tt('This tool', 'Esta herramienta');
    var hThem  = document.createElement('th'); hThem.textContent  = (data.alternatives || []).join(' / ') || tt('Paid tools', 'Herramientas pagadas');
    trh.appendChild(hAxis); trh.appendChild(hOurs); trh.appendChild(hThem);
    thead.appendChild(trh);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    data.comparisonRows.forEach(function (r) {
      var tr = document.createElement('tr');
      var tdA = document.createElement('td'); tdA.className = 'id-compare-axis';   tdA.textContent = r.axis   || '';
      var tdO = document.createElement('td'); tdO.className = 'id-compare-ours';   tdO.textContent = r.ours   || '';
      var tdT = document.createElement('td'); tdT.className = 'id-compare-theirs'; tdT.textContent = r.theirs || '';
      tr.appendChild(tdA); tr.appendChild(tdO); tr.appendChild(tdT);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    det.appendChild(table);

    if (data.framing) {
      var foot = document.createElement('p');
      foot.className = 'id-compare-foot';
      foot.textContent = data.framing;
      det.appendChild(foot);
    }

    mount.appendChild(det);

    // Plausible — engagement signal. Fires only when the operator
    // actively expands the disclosure.
    det.addEventListener('toggle', function () {
      if (det.open && window.plausible) {
        try { window.plausible('Invoice Decoder Comparison Opened'); } catch (_) {}
      }
    });
  }

  try { renderCompareTable(); } catch (_) {}

  // Run on page load.
  handleReloadParam();
  // W3-4 — one-shot scrub of any plaintext invoiceItems left over
  // from earlier saves (pre-encrypted-handoff). No-op when MID_DEVICE_KEY
  // hasn't loaded yet or there's nothing to scrub.
  if (typeof MID_DEVICE_KEY !== 'undefined' &&
      typeof MID_DEVICE_KEY.migratePlaintextInvoiceItems === 'function') {
    try { MID_DEVICE_KEY.migratePlaintextInvoiceItems(); } catch (_) {}
  }

})();
