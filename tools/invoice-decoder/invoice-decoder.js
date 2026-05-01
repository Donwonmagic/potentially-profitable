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

    setProgress(20);
    // Show the raw photo immediately so the owner sees something
    // while preprocessing runs.
    var rawUrl = URL.createObjectURL(file);
    if (rawImg) rawImg.src = rawUrl;

    // Run aggressive preset (clean / hi-contrast scans). The B2
    // multi-pass OCR will run both presets — for B1's preview we
    // show the aggressive result since it's the most common
    // invoice shape and the cleanest rendering.
    MID_PREPROCESS.preprocessFile(file, { preset: 'aggressive', maxEdge: 2000 })
      .then(function (result) {
        setProgress(80);
        var cleanedUrl = MID_PREPROCESS.canvasToDataUrl(result.canvas);
        if (cleanImg) cleanImg.src = cleanedUrl;
        if (previewEl) previewEl.hidden = false;
        if (previewMeta) {
          var skewLabel = Math.abs(result.skewAngle) >= 1
            ? tt('Straightened by ' + result.skewAngle + '° · ', 'Enderezada ' + result.skewAngle + '° · ')
            : tt('Already straight · ', 'Ya estaba derecha · ');
          previewMeta.innerHTML = '<strong>' + tt('Looks readable.', 'Se ve legible.') + '</strong> ' +
            skewLabel +
            tt('Threshold ' + result.threshold + ' · ' + result.canvas.width + '×' + result.canvas.height + ' px',
               'Umbral ' + result.threshold + ' · ' + result.canvas.width + '×' + result.canvas.height + ' px') + '. ' +
            tt('If the cleaned version on the right looks blurry or cut off, try a flatter, brighter shot.',
               'Si la versión limpia se ve borrosa o cortada, prueba una foto más plana y brillante.');
        }
        setProgress(100);
        showStatus(
          tt('Photo ready.', 'Foto lista.'),
          tt('Cleaned up. The line-by-line reader (Wave B2) will turn this into editable rows.',
             'Limpia. El lector línea por línea (Wave B2) la convertirá en filas editables.')
        );
        if (comingEl) comingEl.hidden = false;
        if (window.plausible) {
          window.plausible('Invoice Decoder Preprocess', { props: {
            preset: 'aggressive',
            skew_bucket: Math.abs(result.skewAngle) >= 5 ? 'high' : Math.abs(result.skewAngle) >= 1 ? 'low' : 'none',
            pages: String(fileList.length)
          } });
        }
      })
      .catch(function (err) {
        showStatus(
          tt('Could not read this photo.', 'No se pudo leer esta foto.'),
          tt('Try a clearer shot or a PDF if your distributor offers one. ' + (err && err.message ? '(' + err.message + ')' : ''),
             'Prueba una foto más clara o un PDF si tu distribuidor lo ofrece. ' + (err && err.message ? '(' + err.message + ')' : '')),
          'error'
        );
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
