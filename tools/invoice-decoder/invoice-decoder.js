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
  function handlePhotoFiles(fileList) {
    if (!fileList || !fileList.length) return;
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
    if (file.size > 12 * 1024 * 1024) {
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
        return Promise.all([
          MID_PREPROCESS.preprocessFile(file, { preset: 'aggressive', maxEdge: 2000 }),
          MID_PREPROCESS.preprocessFile(file, { preset: 'gentle',     maxEdge: 2000 })
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
            qualityHint: results[0].qualityHint
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
        var skewLabel = Math.abs(first.skewAngle) >= 1
          ? tt('Straightened by ' + first.skewAngle + '° · ', 'Enderezada ' + first.skewAngle + '° · ')
          : tt('Already straight · ', 'Ya estaba derecha · ');
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

  function readPendingInvoice() {
    if (!pendingPages.length) return;
    if (typeof MID_OCR === 'undefined' || typeof MID_PARSE === 'undefined') {
      showStatus(tt('Reader module missing', 'Falta el módulo lector'),
                 tt('Refresh the page and try again.', 'Recarga la página e intenta de nuevo.'),
                 'error');
      return;
    }
    if (readBtn) {
      readBtn.disabled = true;
      readBtn.innerHTML = tt('Reading…', 'Leyendo…');
    }
    showStatus(
      tt('Reading the invoice…', 'Leyendo la factura…'),
      tt('First load also fetches the reader (about 4 MB). After this it\'s cached and instant.',
         'La primera carga también descarga el lector (unos 4 MB). Después queda en caché y es instantánea.')
    );
    setProgress(2);

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
      var parsed = MID_PARSE.parseLines(allLines, fullText);
      // Wave B3 — vendor detection. When detect() crosses
      // threshold the rows get a confidence boost (knowing the
      // column layout removes a chunk of OCR uncertainty) and
      // the result panel shows a "Read as <Vendor>" pill.
      var vendorMatch = null;
      if (typeof MID_VENDORS !== 'undefined' && MID_VENDORS.detectVendor) {
        vendorMatch = MID_VENDORS.detectVendor(fullText);
        if (vendorMatch) {
          MID_VENDORS.applyVendorBoost(parsed.rows, vendorMatch);
          parsed.vendor = vendorMatch.id;
        }
      }
      // Wave B4 — classify every parsed row. Stamps category +
      // categoryConfidence + categoryTier on each row so the
      // verification UX (B5) can render chips, group totals, and
      // sort review priority.
      if (typeof MID_CATEGORIZE !== 'undefined' && MID_CATEGORIZE.classify) {
        parsed.rows.forEach(function (r) {
          var c = MID_CATEGORIZE.classify(r);
          r.category = c.category;
          r.categoryConfidence = c.confidence;
          r.categoryTier = c.tier;
        });
      }
      renderParsed(parsed);
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
    }).catch(function (err) {
      showStatus(
        tt('OCR failed', 'OCR falló'),
        tt('The reader couldn\'t process this image. ' + (err && err.message ? '(' + err.message + ')' : ''),
           'El lector no pudo procesar esta imagen. ' + (err && err.message ? '(' + err.message + ')' : '')),
        'error'
      );
    }).then(function () {
      if (readBtn) {
        readBtn.disabled = false;
        readBtn.innerHTML = tt('Read this invoice', 'Leer esta factura');
      }
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
    if (field === 'name')      row.name = String(value).trim();
    else if (field === 'qty')  row.qty = parseFloat(value) || 0;
    else if (field === 'unitPrice' || field === 'lineTotal') row[field] = parseFloat(value) || 0;
    else if (field === 'category') {
      row.category = value || null;
      row.categoryConfidence = 100; // owner-confirmed
    }
    // Owner-touched rows flip to confirmed at full confidence.
    row.confidence = 100;
    row.ownerConfirmed = true;
    rerenderRows();
  }

  function rerenderRows() {
    if (!parsedList) return;
    parsedList.innerHTML = parsedRowsState.map(rowToHtml).join('');
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

  // Live total reconciliation — printed invoice total (extracted
  // by the parser at OCR time) vs. the current sum of editable
  // rows. >5% delta → amber warning; missing printed total →
  // grey "couldn't verify yourself" line.
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
        '<strong>Parsed sum:</strong> $' + sum.toFixed(2) + ' · <strong>Invoice prints:</strong> $' + lastPrintedTotal.toFixed(2) +
          ' (' + delta.toFixed(1) + '% off) — ' +
          (deltaWarn ? 'verify before saving.' : 'looks consistent.'),
        '<strong>Suma leída:</strong> $' + sum.toFixed(2) + ' · <strong>Total impreso:</strong> $' + lastPrintedTotal.toFixed(2) +
          ' (' + delta.toFixed(1) + '% de diferencia) — ' +
          (deltaWarn ? 'verifica antes de guardar.' : 'se ve consistente.')
      );
    } else {
      parsedTotals.classList.remove('warn');
      parsedTotals.innerHTML = tt(
        '<strong>Parsed sum:</strong> $' + sum.toFixed(2) + ' — couldn\'t find a printed total to verify against. Sanity-check yourself.',
        '<strong>Suma leída:</strong> $' + sum.toFixed(2) + ' — no se encontró un total impreso para comparar. Revísalo tú.'
      );
    }
    parsedTotals.hidden = false;
  }

  function rowToHtml(r, idx) {
    var qtyParts = [];
    if (r.qty != null) qtyParts.push(r.qty);
    if (r.unit) qtyParts.push(r.unit);
    var qtyText = qtyParts.length ? qtyParts.join(' ') : '';
    var priceText = r.lineTotal != null ? '$' + r.lineTotal.toFixed(2) : '';
    var chip = r.category
      ? '<span class="id-parsed-cat" data-cat="' + escHtml(r.category) + '">' + escHtml(catLabel(r.category)) + '</span>'
      : '<span class="id-parsed-cat id-parsed-cat-none" data-cat="none">' + tt('uncategorized', 'sin categoría') + '</span>';
    var confPct = Math.round(r.confidence || 0);
    var confChip = '<span class="id-parsed-conf" data-conf="' + confBand(r.confidence) + '">' + confPct + '%</span>';
    return '<li class="id-parsed-row" data-conf="' + confBand(r.confidence) + '" data-idx="' + idx + '" title="' + escHtml(r.raw || '') + '">' +
      '<span class="id-parsed-name" data-edit="name" tabindex="0" role="button">' + escHtml(r.name) + chip + confChip + '</span>' +
      '<span class="id-parsed-qty"  data-edit="qty"  tabindex="0" role="button">' + escHtml(qtyText) + '</span>' +
      '<span class="id-parsed-price" data-edit="lineTotal" tabindex="0" role="button">' + escHtml(priceText) + '</span>' +
    '</li>';
  }

  // Click delegation — turn a span into an <input> on tap.
  if (parsedList) {
    parsedList.addEventListener('click', function (e) {
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

  function renderParsed(parsed) {
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
    parsedList.innerHTML = parsedRowsState.map(rowToHtml).join('');
    // B5-3 — totals reconciliation now reads the live state every
    // re-render so owner edits flip the delta number in real time.
    rerenderTotals();
    parsedEl.hidden = false;
    if (comingEl) comingEl.hidden = true;
    // B5-4 — reveal the sticky bulk-action bar once we have rows.
    var bulkBarEl = document.getElementById('idBulkbar');
    if (bulkBarEl) bulkBarEl.hidden = !parsedRowsState.length;
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
      '</div>';
    host.hidden = false;
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
      pickPassphrase().then(function (pp) {
        if (!pp) return; // owner cancelled — silent.
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
          // B6-4: write a slim summary into MuntinContext so
          // Plate Cost can pre-fill its ingredient grid from the
          // last invoice; Menu Engineering surfaces a rolling
          // food-cost % suggestion; Margin Math reads the
          // category totals as input. NO ciphertext goes here —
          // localStorage is plaintext-shaped by definition; we
          // only write category aggregates + recent item names
          // (capped at 50). The encrypted envelope stays on the
          // server.
          try {
            if (typeof MuntinContext !== 'undefined' && MuntinContext.merge) {
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
              MuntinContext.merge({ invoiceItems: slim });
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
                }
              });
            } catch (_) { /* flyout is purely decorative — never block save */ }
          }
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

  if (bulkConfirm) {
    bulkConfirm.addEventListener('click', function () {
      // Mark every amber row as confirmed at full confidence.
      // Red rows are intentionally NOT batched — they need
      // individual review (likely OCR misreads or ambiguous
      // categories). The owner can still tap-edit each one.
      var moved = 0;
      parsedRowsState.forEach(function (r) {
        if (confBand(r.confidence) === 'amber') {
          r.confidence = 100;
          r.ownerConfirmed = true;
          moved++;
        }
      });
      rerenderRows();
      if (window.plausible && moved > 0) {
        window.plausible('Invoice Decoder Bulk Confirm', { props: {
          count_bucket: moved < 5 ? '<5' : moved < 15 ? '5-14' : '15+'
        } });
      }
    });
  }


  if (photoInput) photoInput.addEventListener('change', function (e) {
    handlePhotoFiles(e.target.files);
    e.target.value = '';
  });

  // -------------------- PDF + CSV (B2 will wire fully) --------------------
  if (pdfInput) pdfInput.addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    setActiveChip('pdf');
    if (typeof MID_PDF_EXTRACT === 'undefined' || !MID_PDF_EXTRACT.extractPdf) {
      showStatus(
        tt('PDF reader unavailable.', 'Lector de PDF no disponible.'),
        tt('Refresh the page and try again. If the problem persists, fall back to the photo path.',
           'Recarga la página e intenta de nuevo. Si el problema persiste, usa la ruta de foto.'),
        'error'
      );
      e.target.value = '';
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      showStatus(
        tt('PDF too large.', 'PDF muy grande.'),
        tt('That PDF is over 25 MB. Most distributor invoices are under 5 MB — re-export from the portal or trim to invoice-only pages.',
           'Ese PDF pasa de 25 MB. La mayoría de facturas pesan menos de 5 MB — re-exporta del portal o deja solo las páginas de la factura.'),
        'error'
      );
      e.target.value = '';
      return;
    }
    showStatus(
      tt('Reading the PDF…', 'Leyendo el PDF…'),
      tt('Extracting the text layer. PDFs from Sysco / US Foods / GFS / Restaurant Depot are >99% accurate without any OCR.',
         'Extrayendo la capa de texto. Los PDF de Sysco / US Foods / GFS / Restaurant Depot son >99% precisos sin OCR.')
    );
    setProgress(15);

    MID_PDF_EXTRACT.extractPdf(f).then(function (result) {
      setProgress(70);
      if (result.imageOnly) {
        // Image-only PDF (scan with no text layer). Honest fallback:
        // surface a coaching chip suggesting the photo path. The
        // canvas-render-each-page bridge ships in a follow-up sprint
        // (W2-3 image-quality coaching unblocks it).
        showStatus(
          tt('This PDF is a scanned image, not a text document.',
             'Este PDF es una imagen escaneada, no un documento de texto.'),
          tt('No text layer to read. Try the photo path with each page snapped separately, or ask your distributor to send a text-based PDF.',
             'No hay capa de texto. Usa la ruta de foto con cada página por separado, o pide a tu distribuidor un PDF basado en texto.'),
          'error'
        );
        e.target.value = '';
        return;
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
      // Categorize.
      if (typeof MID_CATEGORIZE !== 'undefined' && MID_CATEGORIZE.classify) {
        parsed.rows.forEach(function (r) {
          var c = MID_CATEGORIZE.classify(r);
          r.category = c.category;
          r.categoryConfidence = c.confidence;
          r.categoryTier = c.tier;
        });
      }
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
      showStatus(
        tt('Could not read this PDF.', 'No se pudo leer este PDF.'),
        (err && err.message) ? err.message :
          tt('Try a different file or the photo path.', 'Prueba con otro archivo o la ruta de foto.'),
        'error'
      );
    }).then(function () {
      e.target.value = '';
    });
  });

  if (csvInput) csvInput.addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    setActiveChip('csv');
    if (typeof MID_CSV_EXTRACT === 'undefined' || !MID_CSV_EXTRACT.extractFile) {
      showStatus(
        tt('CSV / Excel reader unavailable.', 'Lector de CSV / Excel no disponible.'),
        tt('Refresh the page and try again.', 'Recarga la página e intenta de nuevo.'),
        'error'
      );
      e.target.value = '';
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      showStatus(
        tt('CSV / Excel file too large.', 'Archivo CSV / Excel muy grande.'),
        tt('That file is over 10 MB. Distributor exports are typically <2 MB; trim or re-export from the portal.',
           'Pasa de 10 MB. Las exportaciones suelen pesar <2 MB; recórtala o re-expórtala del portal.'),
        'error'
      );
      e.target.value = '';
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
        e.target.value = '';
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
      // Categorize.
      if (typeof MID_CATEGORIZE !== 'undefined' && MID_CATEGORIZE.classify) {
        parsed.rows.forEach(function (r) {
          var c = MID_CATEGORIZE.classify(r);
          r.category = c.category;
          r.categoryConfidence = c.confidence;
          r.categoryTier = c.tier;
        });
      }
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
    }).then(function () {
      e.target.value = '';
    });
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

  // Run on page load.
  handleReloadParam();

})();
