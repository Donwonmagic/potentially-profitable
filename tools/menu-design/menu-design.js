/**
 * Menu Design Suite — Wave A1 (foundation).
 *
 * Owns: dish-list state, mobile card-stack rendering, MuntinContext
 * "We remember" pill, paste-CSV ingest, sample data. No PDF logic
 * yet — that lands in Wave A3.
 *
 * Privacy posture: zero fetch, zero localStorage writes from this
 * file. All state is in-memory; MuntinContext writes happen only
 * when the user explicitly taps "Use these" (and even then we read,
 * not write — Wave A3 starts writing menuHistory). The build-time
 * check-tool-no-fetch.mjs invariant must remain satisfied.
 */
(function () {
  'use strict';

  // -------------------- State --------------------
  // Single source of truth: an ordered array of either dish rows or
  // section header rows. The render function projects this into the
  // grid; every interaction mutates this array, then re-renders.
  // Section rows: { kind: 'section', name: string }
  // Dish rows:    { kind: 'dish', name, price, desc }
  var rows = [];

  function blankDish() { return { kind: 'dish', name: '', price: '', desc: '' }; }
  function blankSection(name) { return { kind: 'section', name: name || '' }; }

  // W5-1 — track whether the current rows[] are demo (ghost) rows
  // seeded for empty-state anchoring. Cleared by clearGhostRows().
  var __ghostActive = false;

  // -------------------- DOM --------------------
  var rowsEl    = document.getElementById('mdRows');
  var addRowBtn = document.getElementById('mdAddRow');
  var addSecBtn = document.getElementById('mdAddSection');
  var sampleBtn = document.getElementById('mdSample');
  var clearBtn  = document.getElementById('mdClear');
  var stickBtn  = document.getElementById('mdStick');
  var pasteArea = document.getElementById('mdPasteArea');
  var pasteApply= document.getElementById('mdPasteApply');
  var statusEl  = document.getElementById('mdStatus');
  var ctxEl     = document.getElementById('mdCtx');
  var ctxChips  = document.getElementById('mdCtxChips');
  var ctxUse    = document.getElementById('mdCtxUse');
  // A2 additions:
  var themesEl  = document.getElementById('mdThemes');
  var logoInput = document.getElementById('mdLogoInput');
  var logoThumb = document.getElementById('mdLogoThumb');
  var logoLine  = document.getElementById('mdLogoLine');
  var logoWarn  = document.getElementById('mdLogoWarn');
  var paperRow  = document.getElementById('mdPaperRow');
  var paper     = document.getElementById('mdPaper');
  var previewMeta = document.getElementById('mdPreviewMeta');
  var overflowEl  = document.getElementById('mdOverflow');
  var downloadBtn = document.getElementById('mdDownload');
  var downloadMsg = document.getElementById('mdDownloadMsg');

  // Locale-detected from <html lang>; affects ES-vs-EN copy in
  // status, theme labels, and overflow warnings. ES theme labels
  // come from MD_THEMES.label_es.
  var LOCALE = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2);
  function tt(en, es) { return LOCALE === 'es' ? es : en; }

  // A2 state — theme id, logo data-URL, paper size key. Lives in
  // the same closure as rows[] so render() can pull everything.
  var themeId  = 'modern-minimal';
  var paperKey = 'letter';
  var logoUrl  = null;       // data: URL string or SVG-text
  var logoMeta = null;       // { name, w, h } or null

  // -------------------- Helpers --------------------
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // -------------------- Render --------------------
  function render() {
    if (!rowsEl) return;
    var html = '';
    rows.forEach(function (r, i) {
      var ghostAttr = r.ghost ? ' data-ghost="1"' : '';
      if (r.kind === 'section') {
        html += '<tr class="md-row-section" data-i="' + i + '"' + ghostAttr + '>' +
          '<td colspan="3"><input type="text" class="md-input" data-field="name" data-i="' + i +
          '" value="' + escHtml(r.name) + '" placeholder="Section name (e.g. Starters)" aria-label="Section name" /></td>' +
          '<td class="md-remove-cell"><button type="button" class="md-remove" data-act="del" data-i="' + i + '" aria-label="Remove section">&times;</button></td>' +
          '</tr>';
      } else {
        // "Need help describing?" link — only shows when the dish
        // has a name BUT no description yet. One-tap routes to
        // Menu Copy Inspector with name + price prefilled. No AI
        // here; this honors the plan's "tool-stays-one-job" stance.
        var helpHtml = '';
        if ((r.name || '').trim() && !(r.desc || '').trim()) {
          var ml = LOCALE === 'es' ? '/es/tools/menu-copy/' : '/tools/menu-copy/';
          var frag = '#name=' + encodeURIComponent(r.name) + (r.price ? '&price=' + encodeURIComponent(r.price) : '');
          helpHtml = '<a class="md-help-desc" href="' + ml + frag + '" target="_blank" rel="noopener">' +
            tt('Need help describing? Open Menu Copy Inspector →', '¿Ayuda para describir? Abrir Inspector de Copy →') +
            '</a>';
        }
        html += '<tr data-i="' + i + '"' + ghostAttr + '>' +
          '<td data-label="' + tt('Dish', 'Plato') + '"><input type="text" class="md-input" data-field="name" data-i="' + i +
          '" value="' + escHtml(r.name) + '" placeholder="' + tt('Dish name', 'Nombre del plato') + '" aria-label="' + tt('Dish name', 'Nombre del plato') + '" autocomplete="off" /></td>' +
          '<td data-label="' + tt('Price', 'Precio') + '"><input type="text" inputmode="decimal" class="md-input" data-field="price" data-i="' + i +
          '" value="' + escHtml(r.price) + '" placeholder="$14" aria-label="' + tt('Price', 'Precio') + '" autocomplete="off" /></td>' +
          '<td data-label="' + tt('Description', 'Descripción') + '"><textarea class="md-input" data-field="desc" data-i="' + i +
          '" rows="1" placeholder="' + tt('Crisp little gems, buttermilk dressing', 'Hojas tiernas, aderezo de buttermilk') + '" aria-label="' + tt('Description', 'Descripción') + '">' + escHtml(r.desc) + '</textarea>' +
          helpHtml + '</td>' +
          '<td class="md-remove-cell"><button type="button" class="md-remove" data-act="del" data-i="' + i + '" aria-label="' + tt('Remove dish', 'Quitar plato') + '">&times;</button></td>' +
          '</tr>';
      }
    });
    if (!rows.length) {
      html = '<tr><td colspan="4" style="padding:32px 16px;text-align:center;color:var(--stone);font-size:13.5px;">' +
        'Your menu is empty. Tap <strong>Add a dish</strong>, paste a spreadsheet above, or load the sample.' +
        '</td></tr>';
    }
    rowsEl.innerHTML = html;
    updateStatus();
    renderPreview();
  }

  function updateStatus() {
    if (!statusEl) return;
    var dishes   = rows.filter(function (r) { return r.kind === 'dish'; }).length;
    var sections = rows.filter(function (r) { return r.kind === 'section'; }).length;
    if (LOCALE === 'es') {
      statusEl.innerHTML = '<strong>' + dishes + '</strong> plato' + (dishes === 1 ? '' : 's') +
        ' · <strong>' + sections + '</strong> sección' + (sections === 1 ? '' : 'es') +
        ' — tu menú vive solo en este navegador.';
    } else {
      statusEl.innerHTML = '<strong>' + dishes + '</strong> dish' + (dishes === 1 ? '' : 'es') +
        ' · <strong>' + sections + '</strong> section' + (sections === 1 ? '' : 's') +
        ' — your menu lives in this browser only.';
    }
  }

  // -------------------- Theme picker --------------------
  function renderThemePicker() {
    if (!themesEl || typeof MD_THEMES === 'undefined') return;
    var ids = MD_THEMES.list();
    themesEl.innerHTML = ids.map(function (id) {
      var t = MD_THEMES.get(id);
      var label = LOCALE === 'es' ? t.label_es : t.label_en;
      var blurb = LOCALE === 'es' ? t.blurb_es : t.blurb_en;
      var swatches = [t.paper, t.ink, t.accent, t.muted].map(function (c) {
        return '<span style="background:' + c + '"></span>';
      }).join('');
      return '<li class="md-theme" role="radio" tabindex="0" aria-checked="' + (id === themeId) + '" data-active="' + (id === themeId) + '" data-id="' + id + '">' +
        '<p class="md-theme-name">' + escHtml(label) + '</p>' +
        '<p class="md-theme-blurb">' + escHtml(blurb) + '</p>' +
        '<div class="md-theme-swatches">' + swatches + '</div>' +
        '</li>';
    }).join('');
  }

  if (themesEl) {
    themesEl.addEventListener('click', function (e) {
      var li = e.target.closest('.md-theme');
      if (!li) return;
      themeId = li.dataset.id;
      renderThemePicker();
      renderPreview();
      scheduleSaveDraft();
    });
    themesEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var li = e.target.closest('.md-theme');
      if (!li) return;
      e.preventDefault();
      themeId = li.dataset.id;
      renderThemePicker();
      renderPreview();
      scheduleSaveDraft();
    });
  }

  // -------------------- Logo upload --------------------
  function setLogoWarn(msg) {
    if (!logoWarn) return;
    if (!msg) { logoWarn.hidden = true; logoWarn.textContent = ''; return; }
    logoWarn.hidden = false;
    logoWarn.textContent = msg;
  }

  function applyLogo(dataUrl, name, w, h) {
    logoUrl = dataUrl;
    logoMeta = { name: name, w: w, h: h };
    if (logoThumb) {
      logoThumb.innerHTML = '<img src="' + escHtml(dataUrl) + '" alt="" />';
    }
    if (logoLine) logoLine.textContent = name;
    // Low-res chip — fine for letter, may pixelate at A3.
    if (w && h && Math.max(w, h) < 400) {
      setLogoWarn(tt(
        'Low-res logo (' + w + '×' + h + ') — fine for letter-size print, may pixelate on A3 or trifold.',
        'Logo de baja resolución (' + w + '×' + h + ') — sirve para tamaño carta, puede pixelarse en A3 o tríptico.'
      ));
    } else {
      setLogoWarn('');
    }
    renderPreview();
    scheduleSaveDraft();
  }

  function readLogoFile(file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setLogoWarn(tt(
        'Logo over 4 MB — too large to embed in a print PDF. Try compressing first.',
        'El logo pasa de 4 MB — muy grande para un PDF imprimible. Comprímelo primero.'
      ));
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      var dataUrl = String(reader.result);
      // SVG: read as text + embed without rasterizing.
      if (file.type === 'image/svg+xml') {
        applyLogo(dataUrl, file.name, null, null);
        return;
      }
      // Raster: load to inspect dimensions, then keep as data URL.
      var img = new Image();
      img.onload = function () { applyLogo(dataUrl, file.name, img.naturalWidth, img.naturalHeight); };
      img.onerror = function () {
        setLogoWarn(tt('Could not read this image. Try a PNG or JPG.', 'No se pudo leer la imagen. Prueba PNG o JPG.'));
      };
      img.src = dataUrl;
    };
    reader.onerror = function () {
      setLogoWarn(tt('Could not read this image.', 'No se pudo leer la imagen.'));
    };
    reader.readAsDataURL(file);
  }

  if (logoInput) {
    logoInput.addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      readLogoFile(file);
      // Reset input value so re-selecting the same file fires change.
      e.target.value = '';
    });
  }

  // -------------------- Paper size --------------------
  if (paperRow) {
    paperRow.addEventListener('change', function (e) {
      if (e.target && e.target.name === 'md-paper') {
        paperKey = e.target.value;
        renderPreview();
        scheduleSaveDraft();
      }
    });
  }

  // -------------------- Live preview --------------------
  // The preview is rendered with CSS variables set on the .md-preview-paper
  // element from the active theme. Theme tokens map cleanly to CSS custom
  // properties (--paper, --ink, --accent, --muted, --bodyFamily,
  // --displayFamily, --h1px). The Wave-A3 PDF renderer reads the same
  // theme object so on-screen and on-paper render from identical sources.
  function renderPreview() {
    if (!paper) return;
    if (typeof MD_THEMES === 'undefined') return;
    var theme = MD_THEMES.get(themeId) || MD_THEMES.get('modern-minimal');
    if (!theme) return;
    // If a brand palette is in MuntinContext, honor it (accent + muted only).
    try {
      if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.read === 'function') {
        var ctx = MuntinContext.read() || {};
        if (Array.isArray(ctx.palette) && ctx.palette.length) theme = MD_THEMES.applyPalette(theme, ctx.palette);
      }
    } catch (_) {}

    // Empty state.
    var dishes = rows.filter(function (r) { return r.kind === 'dish' && (r.name || '').trim(); });
    if (!dishes.length) {
      paper.innerHTML = '<div class="md-preview-empty">' +
        tt('Add a dish (or load the sample) to see your menu render here.',
           'Añade un plato (o carga la muestra) para ver tu menú aquí.') +
        '</div>';
      paper.removeAttribute('style');
      paper.removeAttribute('data-divider');
      paper.removeAttribute('data-price');
      paper.removeAttribute('data-cols');
      paper.removeAttribute('data-section-case');
      paper.removeAttribute('data-logo-slot');
      if (previewMeta) previewMeta.textContent = '';
      if (overflowEl) overflowEl.hidden = true;
      return;
    }

    // Theme tokens → CSS custom properties on the paper element.
    paper.style.setProperty('--paper', theme.paper);
    paper.style.setProperty('--ink', theme.ink);
    paper.style.setProperty('--accent', theme.accent);
    paper.style.setProperty('--muted', theme.muted);
    paper.style.setProperty('--bodyFamily', theme.bodyFamily);
    paper.style.setProperty('--displayFamily', theme.displayFamily);
    paper.style.setProperty('--h1px', theme.h1Pt + 'px');
    paper.style.setProperty('--h2px', theme.h2Pt + 'px');
    paper.style.setProperty('--bodypx', theme.bodyPt + 'px');
    paper.style.setProperty('--descpx', theme.descPt + 'px');
    paper.dataset.divider     = theme.dividerStyle;
    paper.dataset.price       = theme.priceStyle;
    paper.dataset.cols        = String(theme.columns);
    paper.dataset.sectionCase = theme.sectionCase;
    paper.dataset.logoSlot    = theme.logoSlot;

    // Group rows[] into [section, dish[]] pairs. Dishes before any
    // section header land in an unnamed group at the top.
    var groups = [];
    var current = { name: null, dishes: [] };
    rows.forEach(function (r) {
      if (r.kind === 'section') {
        if (current.name !== null || current.dishes.length) groups.push(current);
        current = { name: (r.name || '').trim(), dishes: [] };
      } else if ((r.name || '').trim()) {
        current.dishes.push(r);
      }
    });
    if (current.name !== null || current.dishes.length) groups.push(current);

    var html = '';
    if (logoUrl) {
      html += '<img class="md-pp-logo" src="' + escHtml(logoUrl) + '" alt="" />';
    }
    // Title from MuntinContext.businessName if present, else generic.
    var title = '';
    try {
      if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.read === 'function') {
        var ctx2 = MuntinContext.read() || {};
        title = (ctx2.businessName || '').trim();
      }
    } catch (_) {}
    if (!title) title = tt('Menu', 'Menú');
    html += '<h1 class="md-pp-title">' + escHtml(title) + '</h1>';

    // Two-column theme: render dishes inside grid, sections span both columns.
    var isTwoCol = theme.columns === 2;
    if (isTwoCol) html += '<div class="md-pp-cols" style="grid-template-columns:1fr 1fr">';
    groups.forEach(function (g) {
      if (g.name) {
        html += '<h2 class="md-pp-section"' + (isTwoCol ? ' style="grid-column:1/-1"' : '') + '>' + escHtml(g.name) + '</h2>';
      }
      g.dishes.forEach(function (d) {
        var name  = (d.name || '').trim();
        var price = (d.price || '').trim();
        var desc  = (d.desc || '').trim();
        html += '<div class="md-pp-row">';
        html += '<div class="md-pp-name">' + escHtml(name) + '</div>';
        html += '<div class="md-pp-price">' + escHtml(price) + '</div>';
        if (desc) html += '<div class="md-pp-desc">' + escHtml(desc) + '</div>';
        html += '</div>';
      });
    });
    if (isTwoCol) html += '</div>';

    paper.innerHTML = html;

    if (previewMeta) {
      var paperLabel = paperKey === 'a4' ? 'A4' : paperKey === 'half-page' ? tt('Half-page', 'Media') : tt('Letter', 'Carta');
      previewMeta.textContent = paperLabel + ' · ' + dishes.length + ' ' + tt('dishes', 'platos');
    }

    // Heuristic overflow warn — purely advisory at A2; PDF renderer
    // does the real flow check in Wave A3. Trigger when dish count
    // > a threshold for the chosen theme + paper.
    var threshold = (theme.columns === 2) ? 32 : 18;
    if (paperKey === 'half-page') threshold = Math.round(threshold * 0.55);
    if (overflowEl) {
      if (dishes.length > threshold) {
        overflowEl.hidden = false;
        overflowEl.textContent = tt(
          'Your menu has ' + dishes.length + ' dishes — likely two pages on ' + paperLabel + '. The PDF will paginate cleanly when you export.',
          'Tu menú tiene ' + dishes.length + ' platos — probablemente dos páginas en ' + paperLabel + '. El PDF paginará limpio al exportar.'
        );
      } else {
        overflowEl.hidden = true;
      }
    }
  }

  // -------------------- Wire interactions --------------------
  // Debounce live-preview re-render so each keystroke during fast
  // typing doesn't recompute layout — matches the 300ms cadence
  // mentioned in the cohesive plan's A2 spec.
  var previewTimer = null;
  function schedulePreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(function () { previewTimer = null; renderPreview(); }, 300);
  }

  // ----------------------------------------------------------------
  // W5-8 — per-keystroke autosave + draft restore.
  //
  // A menu in progress is the operator's typed work — losing it on a
  // tab close ranks among the worst trust failures a tool can have.
  // We debounce 500ms then write a slim draft to localStorage. Logo
  // data URL is stored separately because it can be large; we cap it
  // at 200KB before write to avoid blowing the 5MB localStorage
  // budget.
  //
  // On boot, if a draft exists AND rows[] is empty, surface a
  // dismissable "Pick up where you left off?" affordance instead of
  // overwriting silently.
  // ----------------------------------------------------------------
  var DRAFT_KEY = 'mtn:menu-design:draft';
  var LOGO_KEY  = 'mtn:menu-design:logo';
  var LOGO_BUDGET = 200 * 1024; // 200KB
  var __saveTimer = null;
  var __saveDraftEnabled = true;

  function safeLs() {
    try {
      var probe = '__md_probe__';
      localStorage.setItem(probe, probe); // h8-exempt: storage probe
      localStorage.removeItem(probe);
      return localStorage;
    } catch (_) { return null; }
  }

  function persistDraft() {
    if (!__saveDraftEnabled) return;
    if (__ghostActive) return;        // W5-1: never save demo rows as the operator's draft
    var ls = safeLs();
    if (!ls) return;
    try {
      var draft = {
        rows: rows.map(function (r) { return Object.assign({}, r); }),
        themeId: themeId,
        paperKey: paperKey,
        logoMeta: logoMeta,
        savedAt: Date.now()
      };
      ls.setItem(DRAFT_KEY, JSON.stringify(draft)); // h8-exempt: in-progress menu draft
      if (logoUrl && logoUrl.length <= LOGO_BUDGET) {
        ls.setItem(LOGO_KEY, logoUrl); // h8-exempt: in-progress menu logo
      } else if (!logoUrl) {
        ls.removeItem(LOGO_KEY);
      }
    } catch (_) { /* quota — silent */ }
  }

  function scheduleSaveDraft() {
    if (__saveTimer) clearTimeout(__saveTimer);
    __saveTimer = setTimeout(function () { __saveTimer = null; persistDraft(); }, 500);
  }

  function loadDraft() {
    var ls = safeLs();
    if (!ls) return null;
    try {
      var raw = ls.getItem(DRAFT_KEY); // h8-exempt: read draft
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || !Array.isArray(d.rows)) return null;
      return d;
    } catch (_) { return null; }
  }

  function clearDraft() {
    var ls = safeLs();
    if (!ls) return;
    try { ls.removeItem(DRAFT_KEY); ls.removeItem(LOGO_KEY); } catch (_) {}
  }

  function offerDraftRestore() {
    var d = loadDraft();
    if (!d || !Array.isArray(d.rows) || !d.rows.length) return;
    if (rows.length) return;  // operator already started fresh
    if (!statusEl) return;
    var ls = safeLs();
    var savedLogo = ls ? ls.getItem(LOGO_KEY) : null; // h8-exempt: read logo draft
    var ageMin = Math.max(1, Math.round((Date.now() - (d.savedAt || 0)) / 60000));
    var hostId = 'mdDraftBanner';
    if (document.getElementById(hostId)) return;
    var banner = document.createElement('div');
    banner.id = hostId;
    banner.className = 'md-draft-banner';
    banner.innerHTML =
      '<span>' + tt(
        'You started a menu ' + ageMin + ' min ago. ',
        'Empezaste un menú hace ' + ageMin + ' min. '
      ) + '<strong>' + d.rows.length + ' ' + tt(
        d.rows.length === 1 ? 'row' : 'rows', d.rows.length === 1 ? 'renglón' : 'renglones'
      ) + '</strong>' + tt(' saved.', ' guardado.') + '</span>' +
      '<div class="md-draft-actions">' +
        '<button type="button" data-act="restore">' + tt('Pick up where I left off', 'Continuar donde lo dejé') + '</button>' +
        '<button type="button" data-act="discard" class="md-draft-discard">' + tt('Start fresh', 'Empezar de nuevo') + '</button>' +
      '</div>';
    statusEl.parentNode.insertBefore(banner, statusEl);
    banner.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'restore') {
        __saveDraftEnabled = false;  // pause autosave during hydrate
        rows = d.rows.map(function (r) { return Object.assign({}, r); });
        themeId = d.themeId || themeId;
        paperKey = d.paperKey || paperKey;
        logoMeta = d.logoMeta || null;
        if (savedLogo) { logoUrl = savedLogo; }
        render();
        renderPreview();
        __saveDraftEnabled = true;
        banner.parentNode.removeChild(banner);
        if (window.plausible) {
          try { window.plausible('Menu Design Draft Restored'); } catch (_) {}
        }
      } else if (act === 'discard') {
        clearDraft();
        banner.parentNode.removeChild(banner);
      }
    });
  }

  if (rowsEl) {
    rowsEl.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.dataset || !t.dataset.field) return;
      var i = parseInt(t.dataset.i, 10);
      if (!isFinite(i) || !rows[i]) return;
      // W5-1 — first keystroke on a ghost row clears the entire
      // demo and lets the operator's typing land on a fresh blank.
      if (rows[i].ghost) {
        var typedField = t.dataset.field;
        var typedValue = t.value;
        clearGhostRows();
        rows.push(blankDish());
        var newIdx = rows.length - 1;
        rows[newIdx][typedField] = typedValue;
        render();
        // Restore focus + caret on the freshly-rendered input.
        var fresh = rowsEl.querySelector('[data-field="' + typedField + '"][data-i="' + newIdx + '"]');
        if (fresh) {
          fresh.focus();
          try {
            var pos = typedValue.length;
            if (fresh.setSelectionRange) fresh.setSelectionRange(pos, pos);
          } catch (_) {}
        }
        scheduleSaveDraft();
        return;
      }
      rows[i][t.dataset.field] = t.value;
      schedulePreview();
      scheduleSaveDraft();    // W5-8
    });
    rowsEl.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || t.dataset.act !== 'del') return;
      var i = parseInt(t.dataset.i, 10);
      if (!isFinite(i)) return;
      rows.splice(i, 1);
      render();
      scheduleSaveDraft();    // W5-8
    });
  }

  if (addRowBtn) addRowBtn.addEventListener('click', function () {
    rows.push(blankDish());
    render();
    scheduleSaveDraft();
    var inputs = rowsEl.querySelectorAll('input[data-field="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
  if (stickBtn) stickBtn.addEventListener('click', function () {
    rows.push(blankDish());
    render();
    scheduleSaveDraft();
    var inputs = rowsEl.querySelectorAll('input[data-field="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  if (addSecBtn) addSecBtn.addEventListener('click', function () {
    rows.push(blankSection());
    render();
    scheduleSaveDraft();
    var inputs = rowsEl.querySelectorAll('.md-row-section input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  if (clearBtn) clearBtn.addEventListener('click', function () {
    if (!rows.length) return;
    if (!confirm('Clear every row? This can\'t be undone.')) return;
    rows = [];
    render();
    clearDraft();
  });

  if (sampleBtn) sampleBtn.addEventListener('click', function () {
    rows = SAMPLE_MENU.map(function (r) { return Object.assign({}, r); });
    render();
    scheduleSaveDraft();
  });

  // -------------------- Paste-CSV ingest --------------------
  // Two paste shapes accepted: (a) header-row CSV/TSV with column
  // names like Dish/Item/Name + Price + Section + Description in
  // EN or ES; (b) markdown-shape with `## Section` header lines and
  // `Dish, $price, description` data lines. Both produce the same
  // rows[] shape. Mirrors plate-cost's parseMenuPaste tolerance.
  var EN_HEADERS = { dish: ['item', 'name', 'dish'], price: ['price'], section: ['section'], desc: ['description', 'desc'] };
  var ES_HEADERS = { dish: ['plato', 'nombre', 'item'], price: ['precio'], section: ['seccion', 'sección'], desc: ['descripcion', 'descripción'] };

  function detectDelim(text) {
    var firstLine = (text.split(/\r?\n/)[0] || '');
    var tabs = (firstLine.match(/\t/g) || []).length;
    var commas = (firstLine.match(/,/g) || []).length;
    return tabs > commas ? '\t' : ',';
  }

  function splitCSVLine(line, delim) {
    // Tiny CSV parser supporting quoted cells; sufficient for paste.
    var out = [];
    var cur = '';
    var inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQ = false; }
        else { cur += ch; }
      } else {
        if (ch === '"') inQ = true;
        else if (ch === delim) { out.push(cur); cur = ''; }
        else cur += ch;
      }
    }
    out.push(cur);
    return out.map(function (s) { return s.trim(); });
  }

  function mapHeader(name) {
    var n = String(name || '').toLowerCase().trim();
    var all = [EN_HEADERS, ES_HEADERS];
    for (var L = 0; L < all.length; L++) {
      var H = all[L];
      for (var k in H) {
        if (H[k].indexOf(n) !== -1) return k;
      }
    }
    return null;
  }

  function parsePaste(text) {
    if (!text || !text.trim()) return [];
    var out = [];
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    var delim = detectDelim(text);
    var headerIdx = null;
    if (lines[0]) {
      var first = splitCSVLine(lines[0], delim);
      var mapped = first.map(mapHeader);
      // Header row only if at least 2 cells map to our known fields.
      if (mapped.filter(function (m) { return m; }).length >= 2) {
        headerIdx = mapped;
        lines = lines.slice(1);
      }
    }
    lines.forEach(function (raw) {
      var line = raw.trim();
      // Markdown-shape section: "## Starters"
      var secMatch = line.match(/^\s*#{1,3}\s+(.+)$/);
      if (secMatch) {
        out.push(blankSection(secMatch[1].trim()));
        return;
      }
      var cells = splitCSVLine(line, delim);
      var dish = blankDish();
      if (headerIdx) {
        cells.forEach(function (cell, idx) {
          var k = headerIdx[idx];
          if (!k) return;
          if (k === 'dish')    dish.name = cell;
          else if (k === 'price')   dish.price = cell;
          else if (k === 'desc')    dish.desc = cell;
          else if (k === 'section' && cell) out.push(blankSection(cell));
        });
      } else {
        // Positional: name, price, description.
        dish.name  = cells[0] || '';
        dish.price = cells[1] || '';
        dish.desc  = cells[2] || '';
      }
      // Skip if the row has no name AND no price — likely a blank line or noise.
      if ((dish.name || '').trim() || (dish.price || '').trim()) out.push(dish);
    });
    return out;
  }

  if (pasteApply) pasteApply.addEventListener('click', function () {
    if (!pasteArea) return;
    var parsed = parsePaste(pasteArea.value);
    if (!parsed.length) {
      alert('Could not find any dishes in that paste. Try one row per dish, or use the sample as a template.');
      return;
    }
    // Append to existing rows, preserving the user's prior typing.
    rows = rows.concat(parsed);
    render();
    pasteArea.value = '';
    var paste = document.getElementById('mdPaste');
    if (paste) paste.open = false;
    if (window.plausible) window.plausible('Menu Design Paste', { props: { added: String(parsed.length) } });
  });

  // -------------------- Sample menu --------------------
  // Real-shape demo: 14 dishes across 4 sections. Demonstrates that
  // the layout works for the "awkward middle" count Canva templates
  // get wrong. Prices stay in the typical American-bistro band.
  var SAMPLE_MENU = [
    blankSection('Starters'),
    { kind: 'dish', name: 'House bread', price: '$6',  desc: 'Whole-wheat sourdough, cultured butter.' },
    { kind: 'dish', name: 'Caesar salad', price: '$14', desc: 'Little gems, buttermilk-anchovy, parmesan crisp.' },
    { kind: 'dish', name: 'Soup of the day', price: '$10', desc: 'Ask your server.' },
    { kind: 'dish', name: 'Cheese plate', price: '$18', desc: 'Three local cheeses, honey, walnuts.' },
    blankSection('Pasta'),
    { kind: 'dish', name: 'Tonnarelli al pepe', price: '$22', desc: 'Hand-rolled tonnarelli with smoky pecorino and cracked black pepper.' },
    { kind: 'dish', name: 'Mushroom rigatoni', price: '$24', desc: 'Cremini and oyster mushrooms, sherry, thyme.' },
    blankSection('Mains'),
    { kind: 'dish', name: 'Roast chicken', price: '$28', desc: 'Half a Path Valley chicken, brined overnight, pan jus.' },
    { kind: 'dish', name: 'Pan-seared salmon', price: '$32', desc: 'Wild king, lemon-caper butter, brown rice.' },
    { kind: 'dish', name: 'Hanger steak', price: '$34', desc: 'Grass-fed, chimichurri, fingerling potatoes.' },
    { kind: 'dish', name: 'Cauliflower steak', price: '$22', desc: 'Romesco, smoked almonds, crispy chickpeas.' },
    blankSection('Dessert'),
    { kind: 'dish', name: 'Olive-oil cake', price: '$10', desc: 'Citrus glaze, candied zest.' },
    { kind: 'dish', name: 'Affogato', price: '$9',  desc: 'House gelato, espresso, hazelnut crumble.' },
    { kind: 'dish', name: 'Cheese & honey', price: '$12', desc: 'Local honeycomb, blue cheese, crackers.' }
  ];

  // ----------------------------------------------------------------
  // W5-1 — ghost preview empty state.
  //
  // First impression problem: a Menu Design Suite with an empty
  // editor + empty preview is "I don't know what this thing does."
  // We seed the editor with SAMPLE_MENU clones flagged ghost=true
  // and a floating overlay that says "this is a demo — tap any
  // dish to start your real menu." The first input/click on a
  // ghost row clears ALL ghost rows in one move so the operator
  // never has to delete demo rows individually.
  // ----------------------------------------------------------------
  function seedGhostRows() {
    if (rows.length) return false;     // operator already has work
    if (loadDraft())  return false;    // draft will be offered
    rows = SAMPLE_MENU.map(function (r) {
      return Object.assign({}, r, { ghost: true });
    });
    __ghostActive = true;
    return true;
  }

  function clearGhostRows() {
    if (!__ghostActive) return;
    rows = rows.filter(function (r) { return !r.ghost; });
    __ghostActive = false;
    var ov = document.getElementById('mdGhostOverlay');
    if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    render();
    if (window.plausible) {
      try { window.plausible('Menu Design Ghost Cleared'); } catch (_) {}
    }
  }

  function renderGhostOverlay() {
    if (!__ghostActive) return;
    if (document.getElementById('mdGhostOverlay')) return;
    if (!rowsEl || !rowsEl.parentNode) return;
    var ov = document.createElement('div');
    ov.id = 'mdGhostOverlay';
    ov.className = 'md-ghost-overlay';
    ov.innerHTML = '<strong>' +
      tt('This is a demo.', 'Esto es una demostración.') +
      '</strong> ' +
      tt('Tap any dish or "Start fresh" to begin your real menu — the demo will clear instantly.',
         'Toca cualquier plato o "Empezar de nuevo" para iniciar tu menú real — la demo se borra al instante.') +
      ' <button type="button" data-act="ghost-start" class="md-ghost-start">' +
      tt('Start fresh', 'Empezar de nuevo') + '</button>';
    rowsEl.parentNode.insertBefore(ov, rowsEl);
    ov.addEventListener('click', function (e) {
      if (e.target && e.target.getAttribute('data-act') === 'ghost-start') {
        clearGhostRows();
      }
    });
  }

  // -------------------- "We remember" pill (MuntinContext) --------------------
  // Read-only at A1 — surfaces what other tools have already saved
  // about this operator. The "Use these" button hydrates the form
  // from MuntinContext.dishes (if present), MuntinContext.cuisine
  // (used in Wave A2 to pre-select theme), and MuntinContext.palette
  // (Wave A2 theme color override). At A1 we apply only dishes.
  function renderCtxPill() {
    if (!ctxEl || !ctxChips) return;
    if (typeof MuntinContext === 'undefined' || typeof MuntinContext.read !== 'function') return;
    var ctx;
    try { ctx = MuntinContext.read() || {}; } catch (_) { ctx = {}; }
    var parts = [];
    if (ctx.cuisine) parts.push({ label: 'Cuisine', value: ctx.cuisine });
    if (ctx.neighborhood || ctx.city) parts.push({ label: 'Neighborhood', value: ctx.neighborhood || ctx.city });
    if (Array.isArray(ctx.dishes) && ctx.dishes.length) parts.push({ label: 'Dishes', value: ctx.dishes.length + ' from prior tools' });
    if (Array.isArray(ctx.palette) && ctx.palette.length) parts.push({ label: 'Palette', swatches: ctx.palette.slice(0, 5) });
    if (!parts.length) {
      ctxEl.hidden = true;
      return;
    }
    ctxChips.innerHTML = parts.map(function (p) {
      if (p.swatches) {
        var dots = p.swatches.map(function (h) {
          var hh = String(h || '').replace(/^#/, '');
          if (!/^[0-9a-fA-F]{3,8}$/.test(hh)) return '';
          return '<span style="background:#' + hh + '"></span>';
        }).join('');
        return '<li class="md-ctx-chip"><span style="font-weight:600;color:var(--stone)">' + escHtml(p.label) + ':</span><span class="md-ctx-chip-dot">' + dots + '</span></li>';
      }
      return '<li class="md-ctx-chip"><span style="font-weight:600;color:var(--stone)">' + escHtml(p.label) + ':</span> ' + escHtml(p.value) + '</li>';
    }).join('');
    ctxEl.hidden = false;
    // If there are no dishes we have nothing to merge — hide button.
    if (ctxUse) ctxUse.hidden = !(Array.isArray(ctx.dishes) && ctx.dishes.length);
  }

  if (ctxUse) ctxUse.addEventListener('click', function () {
    if (typeof MuntinContext === 'undefined') return;
    var ctx;
    try { ctx = MuntinContext.read() || {}; } catch (_) { ctx = {}; }
    if (!Array.isArray(ctx.dishes) || !ctx.dishes.length) return;
    var imported = ctx.dishes.slice(0, 80).map(function (d) {
      return {
        kind: 'dish',
        name: String(d.name || '').slice(0, 80),
        price: (typeof d.price === 'number') ? ('$' + d.price.toFixed(0)) : String(d.price || ''),
        desc: ''
      };
    });
    rows = rows.concat(imported);
    render();
    if (window.plausible) window.plausible('Menu Design Ctx Used', { props: { dishes: String(imported.length) } });
  });

  // -------------------- Last 3 menus (Wave A4) --------------------
  // Slim history persisted to MuntinContext.menuHistory after each
  // download. No dish names, no prices — just theme/paper/count/date.
  // Renders below the download CTA when at least one menu has been
  // generated.
  function renderHistory() {
    var host = document.getElementById('mdHistory');
    if (!host) return;
    var history = [];
    try {
      if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.read === 'function') {
        history = (MuntinContext.read() || {}).menuHistory || [];
      }
    } catch (_) {}
    if (!Array.isArray(history) || !history.length) {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    var rows = history.slice(0, 3).map(function (h) {
      var theme = (typeof MD_THEMES !== 'undefined' && MD_THEMES.get(h.themeId)) || null;
      var themeLabel = theme ? (LOCALE === 'es' ? theme.label_es : theme.label_en) : (h.themeId || '—');
      var paperLabel = h.paperKey === 'a4' ? 'A4' : h.paperKey === 'half-page' ? tt('Half-page', 'Media página') : tt('Letter', 'Carta');
      var when = '';
      try {
        var d = new Date(h.generatedAt || 0);
        when = d.toLocaleDateString(LOCALE === 'es' ? 'es' : 'en-US', { month: 'short', day: 'numeric' });
      } catch (_) { when = ''; }
      return '<li class="md-hist-row">' +
        '<span class="md-hist-theme">' + escHtml(themeLabel) + '</span>' +
        '<span class="md-hist-meta">' + escHtml(paperLabel) + ' · ' + (h.dishCount || 0) + ' ' + tt('dishes', 'platos') +
        ' · ' + (h.pages || 1) + ' ' + tt(h.pages === 1 ? 'page' : 'pages', h.pages === 1 ? 'página' : 'páginas') +
        (when ? ' · ' + escHtml(when) : '') +
        '</span></li>';
    }).join('');
    host.innerHTML =
      '<p class="md-hist-label">' + tt('Last 3 menus you generated', 'Últimos 3 menús generados') + '</p>' +
      '<ul class="md-hist-list">' + rows + '</ul>' +
      '<p class="md-hist-note">' + tt(
        "This tool doesn't track results over time — a menu is a one-time artifact, not a metric.",
        'Esta herramienta no mide resultados con el tiempo — un menú es un artefacto único, no una métrica.'
      ) + '</p>';
    host.hidden = false;
  }

  // -------------------- Download (Wave A3) --------------------
  // Button is enabled at all times — even with zero dishes. The
  // PDF renderer handles the empty case (it'll emit a one-page
  // "Menu" title and exit gracefully). Empty-state UX still
  // surfaces a status message, but we don't gate the artifact —
  // owners want a tangible download in their hand.
  function setDownloadMsg(text, kind) {
    if (!downloadMsg) return;
    downloadMsg.classList.remove('error', 'success');
    if (kind) downloadMsg.classList.add(kind);
    downloadMsg.textContent = text || '';
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', function () {
      if (typeof MD_PDF === 'undefined' || typeof MD_THEMES === 'undefined') {
        setDownloadMsg(tt('PDF library failed to load. Refresh the page and try again.',
                          'No se pudo cargar la biblioteca PDF. Recarga la página e intenta de nuevo.'), 'error');
        return;
      }
      var dishes = rows.filter(function (r) { return r.kind === 'dish' && (r.name || '').trim(); });
      if (!dishes.length) {
        setDownloadMsg(tt('Add at least one dish before downloading.', 'Añade al menos un plato antes de descargar.'), 'error');
        return;
      }
      var theme = MD_THEMES.get(themeId) || MD_THEMES.get('modern-minimal');
      try {
        if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.read === 'function') {
          var ctxDl = MuntinContext.read() || {};
          if (Array.isArray(ctxDl.palette) && ctxDl.palette.length) theme = MD_THEMES.applyPalette(theme, ctxDl.palette);
        }
      } catch (_) {}

      var title = '';
      try {
        if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.read === 'function') {
          title = (MuntinContext.read() || {}).businessName || '';
        }
      } catch (_) {}
      if (!title) title = tt('Menu', 'Menú');

      // Filename: businessName-menu-yyyy-mm-dd.pdf, fallback "menu".
      var slug = String(title || 'menu').toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'menu';
      var ymd = (function () {
        var d = new Date();
        return d.getFullYear() + '-' +
          String(d.getMonth() + 1).padStart(2, '0') + '-' +
          String(d.getDate()).padStart(2, '0');
      })();
      var filename = slug + '-menu-' + ymd;

      downloadBtn.disabled = true;
      var originalLabel = downloadBtn.innerHTML;
      downloadBtn.innerHTML = tt('Building PDF…', 'Generando PDF…');
      setDownloadMsg('');

      MD_PDF.exportPdf({
        rows:        rows,
        theme:       theme,
        paperKey:    paperKey,
        title:       title,
        logoDataUrl: logoUrl,
        logoMeta:    logoMeta,
        filename:    filename
      }).then(function (result) {
        var pages = result.pageCount || 1;
        var msg = tt(
          'Downloaded — ' + pages + ' page' + (pages === 1 ? '' : 's') + '. Your menu lives only in this browser.',
          'Descargado — ' + pages + ' página' + (pages === 1 ? '' : 's') + '. Tu menú vive solo en este navegador.'
        );
        if (result.droppedSvgLogo) {
          msg += ' ' + tt('SVG logo couldn\'t be embedded; export a PNG to include it.',
                          'El logo SVG no se pudo incluir; exporta un PNG para añadirlo.');
        }
        setDownloadMsg(msg, 'success');
        // Wave A4: persist a slim history row to MuntinContext.menuHistory
        // (capped at 3 most recent) so returning visits can show "Last
        // 3 menus you generated." No raw dish names persisted — only
        // theme id, paper key, and a count (privacy posture intact).
        try {
          if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.merge === 'function') {
            var prior = (MuntinContext.read() || {}).menuHistory;
            if (!Array.isArray(prior)) prior = [];
            prior.unshift({
              themeId: themeId,
              paperKey: paperKey,
              dishCount: dishes.length,
              pages: pages,
              generatedAt: Date.now()
            });
            MuntinContext.merge({ menuHistory: prior.slice(0, 3) });
            renderHistory();
          }
        } catch (_) {}
        if (window.plausible) window.plausible('Menu Design Downloaded', { props: {
          theme: themeId, paper: paperKey, pages: String(pages),
          dishCount_bucket: dishes.length < 12 ? '<12' : dishes.length < 25 ? '12-24' : dishes.length < 40 ? '25-39' : '40+'
        } });
        // W5-7 — peak-end celebration moment. Replaces the bare
        // success toast. Honors prefers-reduced-motion.
        try { surfaceDownloadCelebration(filename, pages); } catch (_) {}
      }).catch(function (err) {
        setDownloadMsg(tt(
          'PDF generation failed: ' + (err && err.message ? err.message : 'unknown error'),
          'Falló la generación del PDF: ' + (err && err.message ? err.message : 'error desconocido')
        ), 'error');
      }).then(function () {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalLabel;
      });
    });
  }

  // ----------------------------------------------------------------
  // W5-7 — download-moment celebration (peak-end engineering).
  //
  // Replaces the bare success-toast with a 3-second fullscreen
  // overlay + a 40-particle confetti canvas. Three follow-up cards
  // slide in: print-from-Mac / email-to-printer / share-with-team.
  //
  // Honors prefers-reduced-motion (skips the canvas, fades in/out).
  // Auto-dismisses after 4s; click anywhere to dismiss earlier.
  // ----------------------------------------------------------------
  function reducedMotionMD() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }
  function surfaceDownloadCelebration(filename, pages) {
    if (document.getElementById('mdCelebrate')) return;
    var ov = document.createElement('div');
    ov.id = 'mdCelebrate';
    ov.className = 'md-celebrate';
    ov.setAttribute('role', 'status');
    ov.setAttribute('aria-live', 'polite');
    ov.innerHTML =
      '<div class="md-celebrate-card">' +
        '<h2>' + tt('Your menu is ready.', 'Tu menú está listo.') + '</h2>' +
        '<p>' + tt(
          pages + (pages === 1 ? ' page' : ' pages') + ' downloaded as ' + filename + '.',
          pages + (pages === 1 ? ' página' : ' páginas') + ' descargadas como ' + filename + '.'
        ) + '</p>' +
        '<div class="md-celebrate-actions">' +
          '<button type="button" data-act="print">' + tt('Print from your Mac/PC', 'Imprimir desde tu Mac/PC') + '</button>' +
          '<button type="button" data-act="email">' + tt('Email to your printer', 'Enviar por correo a tu impresor') + '</button>' +
          '<button type="button" data-act="dismiss">' + tt('Close', 'Cerrar') + '</button>' +
        '</div>' +
      '</div>' +
      (reducedMotionMD() ? '' : '<canvas class="md-celebrate-canvas"></canvas>');
    document.body.appendChild(ov);
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
      if (act === 'dismiss' || e.target === ov) { close(); return; }
      if (act === 'print') {
        // Open the freshly-downloaded file in a new tab — operators
        // can use the browser print dialog from there. We don't have
        // a handle on the blob URL anymore (it's already revoked by
        // jsPDF's save flow), so we surface guidance instead.
        ov.querySelector('.md-celebrate-card').innerHTML =
          '<h2>' + tt('Print on a Mac', 'Imprimir en Mac') + '</h2>' +
          '<p>' + tt(
            'Open ' + filename + ' in Preview (it\'s in your Downloads). Press ⌘P. Pick "Letter" paper. Print.',
            'Abre ' + filename + ' en Preview (está en Descargas). Presiona ⌘P. Elige "Carta". Imprime.'
          ) + '</p>' +
          '<button type="button" data-act="dismiss" class="md-celebrate-back">' +
          tt('Got it', 'Entendido') + '</button>';
      } else if (act === 'email') {
        var subject = encodeURIComponent(tt('Menu PDF for printing', 'PDF de menú para imprimir'));
        var body = encodeURIComponent(tt(
          'Hi — please print 100 copies of the attached menu (' + filename + ') on 24-lb letter paper. Bleeds: none. Thanks.',
          'Hola — por favor imprime 100 copias del menú adjunto (' + filename + ') en papel carta 24-lb. Sin sangrado. Gracias.'
        ));
        window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
        close();
      }
    });
    setTimeout(close, 4500);
    if (!reducedMotionMD()) startConfetti(ov.querySelector('.md-celebrate-canvas'));
  }

  // ~40 particles, ~2.5s playtime. Uses requestAnimationFrame and
  // stops on its own; doesn't keep the canvas alive after the tail
  // particle settles.
  function startConfetti(canvas) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width = window.innerWidth;
    var H = canvas.height = window.innerHeight;
    var COLORS = ['#1F4E5B', '#7A2E1F', '#C29B5E', '#3E6B6F', '#9F2D1F', '#FAF6EE'];
    var parts = [];
    for (var i = 0; i < 42; i++) {
      parts.push({
        x: W / 2 + (Math.random() - 0.5) * 160,
        y: H * 0.35,
        vx: (Math.random() - 0.5) * 8,
        vy: -8 - Math.random() * 4,
        c: COLORS[i % COLORS.length],
        rot: Math.random() * Math.PI,
        rotV: (Math.random() - 0.5) * 0.2,
        life: 0,
        maxLife: 100 + Math.random() * 30
      });
    }
    var raf;
    function frame() {
      ctx.clearRect(0, 0, W, H);
      var alive = false;
      parts.forEach(function (p) {
        p.life++;
        if (p.life > p.maxLife) return;
        alive = true;
        p.vy += 0.3;
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-4, -3, 8, 6);
        ctx.restore();
      });
      if (alive) raf = requestAnimationFrame(frame);
      else if (raf) cancelAnimationFrame(raf);
    }
    raf = requestAnimationFrame(frame);
  }

  // -------------------- Init --------------------
  // Theme suggestion from cuisine context. Applies once on first
  // load only — owner can flip themes after; we don't override
  // their choice on a re-render.
  try {
    if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.read === 'function' && typeof MD_THEMES !== 'undefined') {
      var ctxInit = MuntinContext.read() || {};
      if (ctxInit.cuisine) {
        var suggested = MD_THEMES.suggestTheme(ctxInit.cuisine);
        if (suggested && MD_THEMES.get(suggested)) themeId = suggested;
      }
    }
  } catch (_) {}

  renderThemePicker();
  render();
  renderCtxPill();
  renderHistory();
  // W5-8 — surface "Pick up where you left off" if a draft exists
  // and the operator hasn't started fresh yet. Runs after the
  // initial render so the banner sits above an empty editor.
  try { offerDraftRestore(); } catch (_) {}
  // W5-1 — if no draft exists and the editor is still empty after
  // restore-offer, seed ghost preview rows. First keystroke clears.
  try {
    if (!rows.length && !loadDraft()) {
      if (seedGhostRows()) {
        render();
        renderGhostOverlay();
      }
    }
  } catch (_) {}

  // Subscribe so changes in another tab (e.g. saving from Menu
  // Engineering) refresh the pill without a manual reload.
  if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.subscribe === 'function') {
    MuntinContext.subscribe(renderCtxPill);
  }

})();
