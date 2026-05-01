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
            threshold: results[0].threshold
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
      showStatus(
        tt('Photo ready.', 'Foto lista.'),
        tt(files.length === 1 ? 'Cleaned up. Tap "Read this invoice" to extract every line.' :
                                'Cleaned up ' + files.length + ' pages. Tap "Read this invoice" to extract every line.',
           files.length === 1 ? 'Limpia. Toca "Leer esta factura" para extraer cada línea.' :
                                'Limpias ' + files.length + ' páginas. Toca "Leer esta factura" para extraer cada línea.')
      );
      if (comingEl) comingEl.hidden = false;
      if (readBtn) readBtn.hidden = false;
      if (window.plausible) {
        window.plausible('Invoice Decoder Preprocess', { props: {
          skew_bucket: Math.abs(first.skewAngle) >= 5 ? 'high' : Math.abs(first.skewAngle) >= 1 ? 'low' : 'none',
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
          allLines = allLines.concat(ocrResult.lines || []);
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

  // -------------------- Save flow (B6-3) --------------------
  // The save flow is the only point where this tool issues a
  // network request. The cleartext invoice is encrypted in the
  // browser via MID_ENCRYPT before the POST. The server stores
  // the ciphertext envelope unchanged.
  function pickPassphrase() {
    // Owner sets a passphrase per save. We could cache it per
    // session for follow-up saves, but the first-save explicit
    // ask is the trust moment. ESL-friendly copy avoids "key" /
    // "passphrase" jargon — uses "secret you'll remember".
    var promptText = tt(
      'Pick a secret you\'ll remember (4+ characters). We\'ll use it to lock this invoice. We never see this secret — without it the saved invoice is unreadable, even by us.',
      'Elige un secreto que recuerdes (4+ caracteres). Lo usaremos para bloquear esta factura. Nunca vemos este secreto — sin él, la factura guardada es ilegible, incluso para nosotros.'
    );
    var pp = window.prompt(promptText, '');
    if (!pp || pp.length < 4) return null;
    return pp;
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
      var pp = pickPassphrase();
      if (!pp) return; // owner cancelled — silent.
      setSaveStatus(null, 'busy');
      var payload = buildSavePayload();
      // AAD binds this ciphertext to a logical-id; we use a
      // session-random itemId since the server assigns the real
      // KV id on save. The server can't decrypt anyway, but AAD
      // is good hygiene.
      var aad = 'invoice:' + Date.now() + ':' + Math.random().toString(36).slice(2, 8);
      MID_ENCRYPT.encryptPayload(payload, pp, aad).then(function (envelope) {
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
          if (window.plausible) {
            window.plausible('Invoice Decoder Saved', { props: {
              items_bucket: payload.itemCount < 10 ? '<10' :
                            payload.itemCount < 25 ? '10-24' :
                            payload.itemCount < 50 ? '25-49' : '50+',
              vendor_detected: payload.vendor ? 'true' : 'false'
            } });
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
    showStatus(
      tt('PDF reader landing in Wave B2', 'El lector de PDF llega en B2'),
      tt('We received your PDF (' + (f.name || 'invoice.pdf') + '). The text extractor lands next sprint — until then, try the photo path or the CSV path if your distributor offers one.',
         'Recibimos tu PDF (' + (f.name || 'factura.pdf') + '). El extractor de texto llega en el próximo sprint — por ahora prueba la ruta de foto o la de CSV si tu distribuidor lo ofrece.')
    );
    setProgress(0);
    e.target.value = '';
  });

  if (csvInput) csvInput.addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    setActiveChip('csv');
    showStatus(
      tt('CSV / Excel reader landing in Wave B2', 'El lector de CSV / Excel llega en B2'),
      tt('We received ' + (f.name || 'export.csv') + '. Tabular ingest ships next sprint alongside the OCR loop.',
         'Recibimos ' + (f.name || 'exportacion.csv') + '. La importación tabular llega en el próximo sprint junto con el OCR.')
    );
    setProgress(0);
    e.target.value = '';
  });

})();
