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
      var meanConf = Math.round(parsed.rows.reduce(function (a, r) { return a + r.confidence; }, 0) / parsed.rows.length);
      parsedMeta.textContent = tt('Average confidence ' + meanConf + '%', 'Confianza promedio ' + meanConf + '%');
    }
    parsedList.innerHTML = parsed.rows.map(function (r) {
      var qtyParts = [];
      if (r.qty != null) qtyParts.push(r.qty);
      if (r.unit) qtyParts.push(r.unit);
      var qtyText = qtyParts.length ? qtyParts.join(' ') : '';
      var priceText = r.lineTotal != null ? '$' + r.lineTotal.toFixed(2) : '';
      return '<li class="id-parsed-row" data-conf="' + confBand(r.confidence) + '" title="' + escHtml(r.raw) + '">' +
        '<span class="id-parsed-name">' + escHtml(r.name) + '</span>' +
        '<span class="id-parsed-qty">' + escHtml(qtyText) + '</span>' +
        '<span class="id-parsed-price">' + escHtml(priceText) + '</span>' +
      '</li>';
    }).join('');
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
