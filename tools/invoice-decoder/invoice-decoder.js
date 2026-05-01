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
    parsedList.innerHTML = parsedRowsState.map(rowToHtml).join('');
    if (parsedTotals) {
      if (parsed.totalParsed != null) {
        var deltaWarn = parsed.deltaPct != null && parsed.deltaPct > 5;
        parsedTotals.classList.toggle('warn', !!deltaWarn);
        var deltaTxt = parsed.deltaPct != null ? ' (' + parsed.deltaPct.toFixed(1) + '% off)' : '';
        var deltaTxtEs = parsed.deltaPct != null ? ' (' + parsed.deltaPct.toFixed(1) + '% de diferencia)' : '';
        parsedTotals.innerHTML = tt(
          '<strong>Parsed sum:</strong> $' + parsed.sumParsed.toFixed(2) + ' · <strong>Invoice prints:</strong> $' + parsed.totalParsed.toFixed(2) + deltaTxt +
            (deltaWarn ? ' — verify before saving.' : ' — looks consistent.'),
          '<strong>Suma leída:</strong> $' + parsed.sumParsed.toFixed(2) + ' · <strong>Total impreso:</strong> $' + parsed.totalParsed.toFixed(2) + deltaTxtEs +
            (deltaWarn ? ' — verifica antes de guardar.' : ' — se ve consistente.')
        );
        parsedTotals.hidden = false;
      } else {
        parsedTotals.innerHTML = tt(
          '<strong>Parsed sum:</strong> $' + parsed.sumParsed.toFixed(2) + ' — couldn\'t find a printed total to verify against. Sanity-check yourself.',
          '<strong>Suma leída:</strong> $' + parsed.sumParsed.toFixed(2) + ' — no se encontró un total impreso para comparar. Revísalo tú.'
        );
        parsedTotals.classList.remove('warn');
        parsedTotals.hidden = false;
      }
    }
    parsedEl.hidden = false;
    if (comingEl) comingEl.hidden = true;
  }

  if (readBtn) readBtn.addEventListener('click', readPendingInvoice);

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
