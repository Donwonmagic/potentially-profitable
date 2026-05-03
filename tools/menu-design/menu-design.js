/**
 * Menu Design Suite — Wave A1 (foundation).
 *
 * Owns: dish-list state, mobile card-stack rendering, MuntinContext
 * "We remember" pill, paste-CSV ingest, sample data. No PDF logic
 * yet — that lands in Wave A3.
 *
 * Privacy posture: zero fetch, zero localStorage writes from this
 * file. All state is in-memory; MuntinContext writes happen only
 * when the operator explicitly taps "Use these" (and even then we read,
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
  // Dish rows:    { kind: 'dish', name, price, desc, allergens?, spice? }
  //
  // schemaVersion lives on the persisted draft (state/draft) so v1
  // drafts (lacking allergens) restore cleanly under Object.assign.
  var rows = [];
  var SCHEMA_VERSION = 2;

  // W12-2 + W13-2 — extended dish + section schemas. New per-dish
  // fields (pairing, modifier, halfPrice, badges) and per-section
  // enrichments (blurb, glyph, availability, hero image) all default
  // to empty so existing drafts continue to round-trip. The renderer
  // no-ops on empty values.
  function blankDish() {
    // W14-1 — additive completionist fields:
    //   portion: "8 oz", "2 tacos" (free text)
    //   calories: numeric (FDA-style)
    //   altName / altDesc: multilingual mirror (renders when locale
    //                      switches OR when the operator wants to
    //                      ship a bilingual menu in one PDF)
    return { kind: 'dish', name: '', price: '', desc: '', allergens: [], spice: 0, photo: null,
             pairing: '', modifier: '', halfPrice: '', badges: [],
             portion: '', calories: '', altName: '', altDesc: '' };
  }
  function blankSection(name) {
    return { kind: 'section', name: name || '', blurb: '', glyph: '', availability: '', hero: null };
  }

  // W18 — Dish badge catalog extracted to data/badges.js.
  var DISH_BADGES = (typeof MD_BADGES !== 'undefined' && MD_BADGES.BADGES) || [];
  function badgeById(id) {
    return (typeof MD_BADGES !== 'undefined') ? MD_BADGES.byId(id) : null;
  }

  // W5-1 — track whether the current rows[] are demo (ghost) rows
  // seeded for empty-state anchoring. Cleared by clearGhostRows().
  var __ghostActive = false;

  // -------------------- Allergen catalog --------------------
  // W18 — extracted to data/allergens.js. Read through MD_ALLERGENS
  // global; fall back to an empty list only if the module didn't
  // load (which would already block the page).
  var ALLERGEN_CODES = (typeof MD_ALLERGENS !== 'undefined' && MD_ALLERGENS.CODES) || [];
  function allergenById(id) {
    return (typeof MD_ALLERGENS !== 'undefined') ? MD_ALLERGENS.byId(id) : null;
  }
  function allergenLabel(id) {
    return (typeof MD_ALLERGENS !== 'undefined') ? MD_ALLERGENS.label(id, LOCALE) : id;
  }
  // Aggregate every code present across rows[] — drives the auto-
  // generated key legend at the bottom of the menu.
  function activeAllergenCodes() {
    var seen = {};
    rows.forEach(function (r) {
      if (r.kind !== 'dish' || !Array.isArray(r.allergens)) return;
      r.allergens.forEach(function (c) { if (allergenById(c)) seen[c] = true; });
    });
    return ALLERGEN_CODES.filter(function (a) { return seen[a.id]; }).map(function (a) { return a.id; });
  }

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
  var exportQrBtn = document.getElementById('mdExportQr');
  var largePrintBtn = document.getElementById('mdLargePrint');

  // Locale-detected from <html lang>; affects ES-vs-EN copy in
  // status, theme labels, and overflow warnings. ES theme labels
  // come from MD_THEMES.label_es.
  var LOCALE = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2);
  function tt(en, es) { return LOCALE === 'es' ? es : en; }

  // -------------------- Funnel events (Wave A6 — synthesis plan) -----
  // Bounded-cardinality Plausible events that complete the funnel
  // diagnosis the existing 16 events left undefined. All prop values
  // come from a closed enum so scripts/check-event-prop-cardinality.mjs
  // stays green.
  //
  //   Menu Design Tool Loaded         — first script run; locale prop
  //   Menu Design First Dish          — single-fire per session; trigger
  //                                     prop ∈ paste|template|manual|sample
  //   Menu Design Theme Changed       — user-initiated theme switch
  //                                     (NOT history/draft/template loads)
  //   Menu Design Custom Logo Added   — kind ∈ svg|raster
  //   Menu Design Disclaimer Read     — honesty card in viewport ≥3s
  //   Menu Design Outbound Drop-In    — click any /services/menu-drop-in/ link
  //   Menu Design Outbound Polish     — click any /services/menu-polish/ link
  //   Menu Design Export Failed       — superset of legacy PDF Failed,
  //                                     adds {format, reason}; reason enum
  //                                     ∈ cdn-blocked|cdn-load|oom|
  //                                       font-missing|worker-unsupported|unknown
  //
  // Implementation note: each helper writes the event name as a string
  // literal in a direct `window.plausible(...)` call so the vocabulary
  // scanner at scripts/check-analytics-vocabulary.mjs (regex:
  // /window\.plausible\(/) finds it. A wrapping helper would hide the
  // event names from that scanner.

  var __firstDishFired = false;
  function fireFirstDishOnce(trigger) {
    if (__firstDishFired) return;
    var hasNonBlank = rows.some(function (r) {
      return r && r.kind === 'dish' && (r.name || '').trim() !== '';
    });
    if (!hasNonBlank) return;
    __firstDishFired = true;
    if (window.plausible) {
      try {
        window.plausible('Menu Design First Dish', { props: { trigger: String(trigger || 'manual') } });
      } catch (_) {}
    }
  }

  function fireThemeChanged(themeId) {
    if (window.plausible) {
      try {
        window.plausible('Menu Design Theme Changed', { props: { theme: String(themeId || 'unknown') } });
      } catch (_) {}
    }
  }

  // Fire Tool Loaded immediately — it's the funnel head and must
  // count both no-action loads and full-flow sessions.
  if (window.plausible) {
    try { window.plausible('Menu Design Tool Loaded', { props: { locale: LOCALE } }); } catch (_) {}
  }

  // -------------------- Wave B2 finish — effective disclaimer ---------
  // Resolve the disclaimer text the renderers should emit in the
  // footer. Three-state logic:
  //   1. Operator typed something  → use their text verbatim (always)
  //   2. Menu has ≥1 allergen tag  → auto-fill from regime + locale
  //                                  (synthesis-plan B2 default-on UX)
  //   3. No allergens, no operator text → empty (renderer no-ops)
  //
  // Tolerant of MD_SCHEMA being absent (legacy load path or test
  // harness) — falls back to operator text or empty.
  function hasAnyAllergenTagged() {
    return rows.some(function (r) {
      return r && r.kind === 'dish' && Array.isArray(r.allergens) && r.allergens.length > 0;
    });
  }
  function effectiveDisclaimer() {
    if (meta && typeof meta.disclaimer === 'string' && meta.disclaimer.trim()) {
      return meta.disclaimer;
    }
    if (!hasAnyAllergenTagged()) return '';
    if (typeof MD_SCHEMA === 'undefined' ||
        typeof MD_SCHEMA.autoDisclaimerFor !== 'function') {
      return '';
    }
    var regime = (meta && meta.allergenRegime) || 'us-fda9';
    return MD_SCHEMA.autoDisclaimerFor(regime, LOCALE) || '';
  }

  // A2 state — theme id, logo data-URL, paper size key. Lives in
  // the same closure as rows[] so render() can pull everything.
  var themeId  = 'modern-minimal';
  var paperKey = 'letter';
  var logoUrl  = null;       // data: URL string or SVG-text
  var logoMeta = null;       // { name, w, h } or null
  // W9-3 + W11-3 + W14-2 — menu-level metadata. Renders on the
  // printed deliverable. All fields optional; renderer no-ops on
  // empty. Persists in the draft via meta.* keys.
  var meta = {
    tagline: '', story: '', coverPage: false,
    address: '', hours: '', serviceCharge: '', sourcing: '', disclaimer: '', askYourServer: ''
  };

  // W12-3 — theme customizer state. Each field is null when the
  // operator hasn't customized; otherwise an explicit hex. The
  // PDF + preview applyCustomizer() helper merges these onto the
  // active theme tokens before render. paperTexture flag enables
  // a subtle linen-grain background overlay.
  var customize = { accent: null, paper: null, ink: null, paperTexture: false };

  function applyCustomizer(theme) {
    if (!theme) return theme;
    var out = Object.assign({}, theme);
    // W15 — apply modifiers FIRST (sparse seasonal/daypart/event
    // overrides), then layer the operator's explicit color picks
    // on top so manual overrides always win.
    if (customize.mods && typeof MD_THEMES !== 'undefined' && typeof MD_THEMES.applyModifier === 'function') {
      out = MD_THEMES.applyModifier(out, customize.mods);
    }
    if (customize.accent) out.accent = customize.accent;
    if (customize.paper)  out.paper  = customize.paper;
    if (customize.ink)    out.ink    = customize.ink;
    return out;
  }

  // W7-3 — paperKey migration. Old drafts wrote 'trifold' / 'tabletent';
  // the v2 catalog uses specific keys (trifold-letter-z / table-tent).
  // Returns a known-good key, falling back to 'letter'.
  function migratePaperKey(k) {
    if (typeof MD_PDF === 'undefined' || !MD_PDF.PAPERS) return k;
    if (k === 'trifold')   return 'trifold-letter-z';
    if (k === 'tabletent') return 'table-tent';
    return MD_PDF.PAPERS[k] ? k : 'letter';
  }

  // -------------------- Helpers --------------------
  // W18 — escHtml extracted to infra/dom.js. Read through the
  // global MD_DOM module so a single definition serves the whole
  // tool (was duplicated across 3 files before this wave).
  function escHtml(s) {
    return (typeof MD_DOM !== 'undefined') ? MD_DOM.escHtml(s)
      : String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
  }

  // -------------------- Render --------------------
  function render() {
    if (!rowsEl) return;
    var html = '';
    rows.forEach(function (r, i) {
      var ghostAttr = r.ghost ? ' data-ghost="1"' : '';
      var draggable = r.ghost ? '' : ' draggable="true"';
      // W11-1 — drag handle cell + touch up/down arrows.
      var handleCell = '<td class="md-handle-cell"><button type="button" class="md-handle" data-act="grip" data-i="' + i + '" aria-label="' + tt('Drag to reorder', 'Arrastra para reordenar') + '" tabindex="0">⋮⋮</button></td>';
      var touchUp = i > 0 ? '' : ' disabled';
      var touchDn = i < rows.length - 1 ? '' : ' disabled';
      var touchReorder =
        '<div class="md-touch-reorder" aria-hidden="false">' +
          '<button type="button" data-act="moveup" data-i="' + i + '" aria-label="' + tt('Move up', 'Mover arriba') + '"' + touchUp + '>↑</button>' +
          '<button type="button" data-act="movedn" data-i="' + i + '" aria-label="' + tt('Move down', 'Mover abajo') + '"' + touchDn + '>↓</button>' +
        '</div>';
      if (r.kind === 'section') {
        // W12-2 — section enrichments (blurb / glyph / availability)
        // live behind a "+ details" disclosure so the basic flow
        // stays simple. Each is optional; renderer no-ops on empty.
        var hasSecExtras = !!(r.blurb || r.glyph || r.availability);
        var secExtras =
          '<details class="md-section-extras" data-i="' + i + '"' + (hasSecExtras ? ' open' : '') + '>' +
            '<summary class="md-section-extras-trigger">' +
              tt('Section details', 'Detalles de sección') + ' ' +
              (hasSecExtras ? '<span class="md-section-extras-badge">' + (r.blurb ? '✎ ' : '') + (r.glyph ? r.glyph + ' ' : '') + (r.availability ? '⏱ ' : '') + '</span>' : '') +
            '</summary>' +
            '<div class="md-section-extras-body">' +
              '<div class="md-extra-field">' +
                '<label for="md-sec-blurb-' + i + '">' + tt('Section blurb', 'Descripción de sección') + '</label>' +
                '<input type="text" id="md-sec-blurb-' + i + '" data-field="blurb" data-i="' + i +
                  '" value="' + escHtml(r.blurb || '') + '" placeholder="' +
                  tt('Hand-rolled, made to order', 'Hechos a mano, al momento') + '" />' +
              '</div>' +
              '<div class="md-extra-field">' +
                '<label for="md-sec-glyph-' + i + '">' + tt('Glyph', 'Símbolo') + '</label>' +
                '<input type="text" id="md-sec-glyph-' + i + '" data-field="glyph" data-i="' + i +
                  '" value="' + escHtml(r.glyph || '') + '" placeholder="◆" maxlength="2" />' +
              '</div>' +
              '<div class="md-extra-field">' +
                '<label for="md-sec-avail-' + i + '">' + tt('Availability', 'Disponibilidad') + '</label>' +
                '<input type="text" id="md-sec-avail-' + i + '" data-field="availability" data-i="' + i +
                  '" value="' + escHtml(r.availability || '') + '" placeholder="' +
                  tt('After 5pm · Weekends', 'Después de 5pm · Fines de semana') + '" />' +
              '</div>' +
              '<label class="md-section-specials">' +
                '<input type="checkbox" data-field="specials" data-i="' + i + '"' + (r.specials ? ' checked' : '') + ' />' +
                ' ' + tt('Treat as a "Today\'s specials" callout', 'Tratar como recuadro de "Especiales de hoy"') +
              '</label>' +
              // W13-2 — Hero image per section. Renders as a 4:1 ratio
              // band above the section's dish flow. Optional upload.
              '<div class="md-section-hero">' +
                '<span class="md-section-hero-label">' + tt('Section hero image', 'Imagen hero de sección') + ':</span>' +
                ((r.hero && r.hero.dataUrl)
                  ? '<span class="md-section-hero-thumb"><img src="' + escHtml(r.hero.dataUrl) + '" alt="" /></span>' +
                    '<button type="button" class="md-photo-remove" data-act="hero-remove" data-i="' + i + '" aria-label="' + tt('Remove hero image', 'Quitar imagen') + '">&times;</button>'
                  : '<label class="md-photo-pick">' +
                      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> ' +
                      tt('Add hero image', 'Agregar hero') +
                      '<input type="file" accept="image/png,image/jpeg,image/webp" data-act="hero-pick" data-i="' + i + '" />' +
                    '</label>') +
              '</div>' +
            '</div>' +
          '</details>';
        html += '<tr class="md-row-section" data-i="' + i + '"' + ghostAttr + draggable + '>' +
          handleCell +
          '<td colspan="3"><input type="text" class="md-input" data-field="name" data-i="' + i +
          '" value="' + escHtml(r.name) + '" placeholder="' + tt('Section name (e.g. Starters)', 'Nombre de sección (ej. Entradas)') + '" aria-label="' + tt('Section name', 'Nombre de sección') + '" />' +
          secExtras + touchReorder + '</td>' +
          '<td class="md-remove-cell"><button type="button" class="md-remove" data-act="del" data-i="' + i + '" aria-label="' + tt('Remove section', 'Eliminar sección') + '">&times;</button></td>' +
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
        // W7-2 — allergen dropdown trigger + chip strip + spice stepper.
        // Sits BELOW the description in the same cell so the table
        // stays a 4-column layout. <details> manages its own open/
        // close state; we delegate change events on the checkbox grid.
        var dishAllergens = Array.isArray(r.allergens) ? r.allergens : [];
        var dishSpice = (typeof r.spice === 'number' && r.spice >= 0 && r.spice <= 3) ? r.spice : 0;
        // W19 — render the bespoke SVG glyph instead of the letter
        // monogram inside each chip when the glyph module is loaded.
        var chipsHtml = dishAllergens.map(function (code) {
          var a = allergenById(code); if (!a) return '';
          var lbl = allergenLabel(code);
          var inner = (typeof MD_GLYPHS !== 'undefined' && MD_GLYPHS.has(code))
            ? MD_GLYPHS.inlineSvg(code, { size: 14, title: lbl, strokeWidth: 1.6 })
            : escHtml(code);
          return '<span class="md-chip md-chip-glyph" data-code="' + escHtml(code) + '" title="' + escHtml(lbl) + '" aria-label="' + escHtml(lbl) + '">' + inner + '</span>';
        }).join('');
        var spiceChip = '';
        if (dishSpice > 0) {
          var fire = '';
          for (var sp = 0; sp < dishSpice; sp++) fire += '🌶';
          spiceChip = '<span class="md-chip md-chip-spice" aria-label="' + tt('Spicy level ' + dishSpice, 'Picante nivel ' + dishSpice) + '">' + fire + '</span>';
        }
        var summary = (dishAllergens.length || dishSpice)
          ? tt(dishAllergens.length + ' tag' + (dishAllergens.length === 1 ? '' : 's'),
               dishAllergens.length + ' etiqueta' + (dishAllergens.length === 1 ? '' : 's'))
          : tt('Add allergens / dietary tags', 'Agregar alérgenos / etiquetas dietarias');
        var allergenGrid = ALLERGEN_CODES.map(function (a) {
          var checked = dishAllergens.indexOf(a.id) !== -1 ? ' checked' : '';
          var label = LOCALE === 'es' ? a.label_es : a.label_en;
          var hint  = LOCALE === 'es' ? a.hint_es  : a.hint_en;
          // W19 — bespoke SVG glyph in each option tile, falling back
          // to the letter code if the glyph module isn't loaded.
          var glyphInner = (typeof MD_GLYPHS !== 'undefined' && MD_GLYPHS.has(a.id))
            ? MD_GLYPHS.inlineSvg(a.id, { size: 18, title: label, strokeWidth: 1.6 })
            : escHtml(a.id);
          return '<label class="md-allergen-opt' + (checked ? ' is-on' : '') + '" data-code="' + escHtml(a.id) + '">' +
            '<input type="checkbox" data-act="allergen" data-i="' + i + '" data-code="' + escHtml(a.id) + '"' + checked + ' />' +
            '<span class="md-allergen-glyph md-allergen-glyph-svg" aria-hidden="true">' + glyphInner + '</span>' +
            '<span class="md-allergen-label">' + escHtml(label) +
            (hint ? '<span class="md-allergen-hint">' + escHtml(hint) + '</span>' : '') +
            '</span></label>';
        }).join('');
        var spiceDots = '';
        for (var sd = 1; sd <= 3; sd++) {
          spiceDots += '<button type="button" class="md-spice-dot' + (sd <= dishSpice ? ' is-on' : '') +
            '" data-act="spice" data-i="' + i + '" data-level="' + sd + '" aria-label="' +
            tt('Spice level ' + sd, 'Picante nivel ' + sd) + '" aria-pressed="' + (sd <= dishSpice) + '">🌶</button>';
        }
        // W11-4 — per-dish photo. The thumbnail preview lives inside
        // the allergen popup panel along with the file input. Drives
        // both the live preview and the PDF embed (downscaled to
        // 320px, capped at 80KB before persistence).
        var photoUrl = (r.photo && r.photo.dataUrl) ? r.photo.dataUrl : null;
        var photoTrigger = photoUrl
          ? '<span class="md-photo-thumb-mini" aria-hidden="true"><img src="' + escHtml(photoUrl) + '" alt="" /></span>'
          : '';
        var photoBlock =
          '<div class="md-photo-row">' +
            '<span class="md-photo-label">' + tt('Photo', 'Foto') + ':</span>' +
            (photoUrl
              ? '<span class="md-photo-thumb"><img src="' + escHtml(photoUrl) + '" alt="" /></span><button type="button" class="md-photo-remove" data-act="photo-remove" data-i="' + i + '" aria-label="' + tt('Remove photo', 'Quitar foto') + '">&times;</button>'
              : '<label class="md-photo-pick">' +
                  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> ' +
                  tt('Add a photo', 'Agregar foto') +
                  '<input type="file" accept="image/png,image/jpeg,image/webp" data-act="photo-pick" data-i="' + i + '" />' +
                '</label>'
            ) +
          '</div>';
        var allergenPop =
          '<details class="md-allergen-pop" data-i="' + i + '">' +
            '<summary class="md-allergen-trigger">' +
              '<svg class="md-allergen-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>' +
              '<span class="md-allergen-summary-text">' + escHtml(summary) + '</span>' +
              photoTrigger +
              (chipsHtml ? '<span class="md-allergen-chip-strip">' + chipsHtml + spiceChip + '</span>' : (spiceChip ? '<span class="md-allergen-chip-strip">' + spiceChip + '</span>' : '')) +
            '</summary>' +
            '<div class="md-allergen-panel" role="group" aria-label="' + tt('Allergens, photo, and dietary tags', 'Alérgenos, foto y etiquetas') + '">' +
              '<div class="md-allergen-grid">' + allergenGrid + '</div>' +
              '<div class="md-spice-row">' +
                '<span class="md-spice-label">' + tt('Spice level', 'Nivel de picante') + ':</span>' +
                '<button type="button" class="md-spice-dot md-spice-zero' + (dishSpice === 0 ? ' is-on' : '') +
                  '" data-act="spice" data-i="' + i + '" data-level="0" aria-label="' +
                  tt('No spice', 'Sin picante') + '" aria-pressed="' + (dishSpice === 0) + '">∅</button>' +
                spiceDots +
              '</div>' +
              photoBlock +
              // W13-2 — dish badges (new / chef pick / seasonal / popular).
              // Toggle-pill UI; selected badges render at-a-glance on
              // the live preview + PDF deliverable.
              '<div class="md-badges-row">' +
                '<span class="md-spice-label">' + tt('Badges', 'Etiquetas') + ':</span>' +
                DISH_BADGES.map(function (b) {
                  var on = Array.isArray(r.badges) && r.badges.indexOf(b.id) !== -1;
                  var bLabel = LOCALE === 'es' ? b.label_es : b.label_en;
                  return '<button type="button" class="md-badge-pill' + (on ? ' is-on' : '') +
                    '" data-act="badge" data-i="' + i + '" data-badge="' + escHtml(b.id) + '" aria-pressed="' + on + '">' +
                    '<span class="md-badge-pill-glyph" aria-hidden="true">' + escHtml(b.glyph) + '</span> ' +
                    escHtml(bLabel) + '</button>';
                }).join('') +
              '</div>' +
              // W12-2 — pairing, modifier, half-price fields. All
              // optional; renderer no-ops on empty.
              '<div class="md-extra-fields">' +
                '<div class="md-extra-field">' +
                  '<label for="md-pair-' + i + '">' + tt('Pairing', 'Maridaje') + '</label>' +
                  '<input type="text" id="md-pair-' + i + '" data-field="pairing" data-i="' + i +
                    '" value="' + escHtml(r.pairing || '') + '" placeholder="' +
                    tt('Pair with: Sancerre 2022', 'Marida con: Sancerre 2022') + '" />' +
                '</div>' +
                '<div class="md-extra-field">' +
                  '<label for="md-mod-' + i + '">' + tt('Modifier', 'Modificador') + '</label>' +
                  '<input type="text" id="md-mod-' + i + '" data-field="modifier" data-i="' + i +
                    '" value="' + escHtml(r.modifier || '') + '" placeholder="' +
                    tt('+$3 add chicken · +$2 GF bun', '+$3 con pollo · +$2 pan SG') + '" />' +
                '</div>' +
                '<div class="md-extra-field md-extra-field-half">' +
                  '<label for="md-half-' + i + '">' + tt('Half portion', 'Media porción') + '</label>' +
                  '<input type="text" id="md-half-' + i + '" data-field="halfPrice" data-i="' + i +
                    '" value="' + escHtml(r.halfPrice || '') + '" placeholder="$8" />' +
                '</div>' +
                // W14-1 — portion, calories, altName / altDesc.
                '<div class="md-extra-field md-extra-field-half">' +
                  '<label for="md-port-' + i + '">' + tt('Portion', 'Porción') + '</label>' +
                  '<input type="text" id="md-port-' + i + '" data-field="portion" data-i="' + i +
                    '" value="' + escHtml(r.portion || '') + '" placeholder="' +
                    tt('8 oz · 2 tacos', '8 oz · 2 tacos') + '" />' +
                '</div>' +
                '<div class="md-extra-field md-extra-field-half">' +
                  '<label for="md-cal-' + i + '">' + tt('Calories', 'Calorías') + '</label>' +
                  '<input type="number" id="md-cal-' + i + '" data-field="calories" data-i="' + i +
                    '" value="' + escHtml(r.calories || '') + '" placeholder="' +
                    tt('480', '480') + '" min="0" max="9999" />' +
                '</div>' +
                '<div class="md-extra-field">' +
                  '<label for="md-alt-name-' + i + '">' +
                    (LOCALE === 'es' ? 'Name (English)' : 'Name (Spanish)') +
                  '</label>' +
                  '<input type="text" id="md-alt-name-' + i + '" data-field="altName" data-i="' + i +
                    '" value="' + escHtml(r.altName || '') + '" placeholder="' +
                    (LOCALE === 'es' ? 'House bread' : 'Pan de la casa') + '" />' +
                '</div>' +
                '<div class="md-extra-field">' +
                  '<label for="md-alt-desc-' + i + '">' +
                    (LOCALE === 'es' ? 'Description (English)' : 'Description (Spanish)') +
                  '</label>' +
                  '<input type="text" id="md-alt-desc-' + i + '" data-field="altDesc" data-i="' + i +
                    '" value="' + escHtml(r.altDesc || '') + '" placeholder="' +
                    tt('Translated description', 'Descripción traducida') + '" />' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</details>';

        html += '<tr data-i="' + i + '"' + ghostAttr + draggable + '>' +
          handleCell +
          '<td data-label="' + tt('Dish', 'Plato') + '"><input type="text" class="md-input" data-field="name" data-i="' + i +
          '" value="' + escHtml(r.name) + '" placeholder="' + tt('Dish name', 'Nombre del plato') + '" aria-label="' + tt('Dish name', 'Nombre del plato') + '" autocomplete="off" /></td>' +
          '<td data-label="' + tt('Price', 'Precio') + '"><input type="text" inputmode="decimal" class="md-input" data-field="price" data-i="' + i +
          '" value="' + escHtml(r.price) + '" placeholder="$14" aria-label="' + tt('Price', 'Precio') + '" autocomplete="off" /></td>' +
          '<td data-label="' + tt('Description', 'Descripción') + '" class="md-cell-desc"><textarea class="md-input md-input-desc" data-field="desc" data-i="' + i +
          '" rows="2" placeholder="' + tt('Crisp little gems, buttermilk dressing, parmesan crisp', 'Hojas tiernas, aderezo de buttermilk, parmesano') + '" aria-label="' + tt('Description', 'Descripción') + '">' + escHtml(r.desc) + '</textarea>' +
          allergenPop +
          helpHtml + touchReorder + '</td>' +
          '<td class="md-remove-cell"><button type="button" class="md-remove" data-act="del" data-i="' + i + '" aria-label="' + tt('Remove dish', 'Quitar plato') + '">&times;</button></td>' +
          '</tr>';
      }
    });
    if (!rows.length) {
      // W21 fix #6 — empty-menu copy now respects locale.
      html = '<tr><td colspan="5" style="padding:32px 16px;text-align:center;color:var(--stone);font-size:13.5px;">' +
        tt('Your menu is empty. Tap <strong>Add a dish</strong>, paste a spreadsheet above, or load the sample.',
           'Tu menú está vacío. Toca <strong>Agregar plato</strong>, pega una hoja arriba, o carga la muestra.') +
        '</td></tr>';
    }
    rowsEl.innerHTML = html;
    updateStatus();
    renderPreview();
  }

  function updateStatus() {
    if (!statusEl) return;
    var dishes   = rows.filter(function (r) { return r.kind === 'dish' && !r.ghost; }).length;
    var sections = rows.filter(function (r) { return r.kind === 'section' && !r.ghost; }).length;
    if (LOCALE === 'es') {
      statusEl.innerHTML = '<strong>' + dishes + '</strong> plato' + (dishes === 1 ? '' : 's') +
        ' · <strong>' + sections + '</strong> sección' + (sections === 1 ? '' : 'es') +
        ' — tu menú vive solo en este navegador.';
    } else {
      statusEl.innerHTML = '<strong>' + dishes + '</strong> dish' + (dishes === 1 ? '' : 'es') +
        ' · <strong>' + sections + '</strong> section' + (sections === 1 ? '' : 's') +
        ' — your menu lives in this browser only.';
    }
    // W5-2 — mid-flow encouragement at meaningful milestones.
    maybeEncourage(dishes);
  }

  // ----------------------------------------------------------------
  // W5-2 — mid-flow encouragement toasts.
  //
  // Fires a short, single-line toast at every 5-dish milestone
  // (5, 10, 15, 20). Each milestone fires at most once per session.
  // Throttle: never twice in <8s; max 4 toasts per session. Honors
  // prefers-reduced-motion (no slide-in; quick fade).
  // ----------------------------------------------------------------
  var __encourageHits = {};
  var __encourageLastTs = 0;
  var __encourageCount = 0;
  var ENCOURAGE_MSGS = {
    5:  { en: 'Five dishes already. Most owners stop typing here and lose them — you\'re past that.',
          es: 'Cinco platos ya. La mayoría se atora aquí — tú ya pasaste ese punto.' },
    10: { en: 'Ten dishes — that\'s a real menu. Try a different theme to see how it shifts the feel.',
          es: 'Diez platos — eso ya es un menú de verdad. Prueba otro tema para ver cómo cambia.' },
    15: { en: 'Fifteen dishes. Add a logo if you have one — small touch, big lift on the printable.',
          es: 'Quince platos. Si tienes logo, súbelo — toque pequeño, salto grande en el imprimible.' },
    20: { en: 'Twenty dishes. You\'re in "real menu" territory now — most printable PDFs cap around 30.',
          es: 'Veinte platos. Ya estás en territorio de menú real — la mayoría de PDFs caben hasta 30.' }
  };
  function maybeEncourage(dishCount) {
    var key = ENCOURAGE_MSGS[dishCount] ? dishCount : null;
    if (!key) return;
    if (__encourageHits[key]) return;
    if (__encourageCount >= 4) return;
    var now = Date.now();
    if (now - __encourageLastTs < 8000) return;
    __encourageHits[key] = true;
    __encourageLastTs = now;
    __encourageCount++;
    var msg = ENCOURAGE_MSGS[key];
    surfaceEncouragement(LOCALE === 'es' ? msg.es : msg.en);
    if (window.plausible) {
      try { window.plausible('Menu Design Encouragement', { props: { milestone: String(key) } }); } catch (_) {}
    }
  }
  function surfaceEncouragement(text) {
    var el = document.createElement('div');
    el.className = 'md-encourage';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.textContent = text;
    document.body.appendChild(el);
    // Force reflow so the transition triggers.
    void el.offsetHeight;
    el.classList.add('show');
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }, 2500);
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
      return '<li class="md-theme" role="radio" tabindex="' + (id === themeId ? '0' : '-1') + '" aria-checked="' + (id === themeId) + '" data-active="' + (id === themeId) + '" data-id="' + id + '">' +
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
      fireThemeChanged(themeId);
      renderThemePicker();
      // W12-3 — when changing theme, sync customizer pickers to the
      // new theme's defaults (unless operator has already overridden).
      if (typeof syncCustomizeFromTheme === 'function') syncCustomizeFromTheme();
      renderPreview();
      scheduleSaveDraft();
    });
    // W10-2 — full keyboard support per APG radiogroup pattern.
    // Enter / Space = select; ArrowLeft/Right/Up/Down = move focus
    // and select; Home / End = first / last. Roving tabindex
    // means only the active radio carries tabindex="0".
    themesEl.addEventListener('keydown', function (e) {
      var li = e.target.closest('.md-theme');
      if (!li) return;
      var allLis = Array.prototype.slice.call(themesEl.querySelectorAll('.md-theme'));
      var idx = allLis.indexOf(li);
      var nextIdx = idx;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        themeId = li.dataset.id;
        fireThemeChanged(themeId);
        renderThemePicker();
        renderPreview();
        scheduleSaveDraft();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextIdx = (idx + 1) % allLis.length; }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); nextIdx = (idx - 1 + allLis.length) % allLis.length; }
      else if (e.key === 'Home') { e.preventDefault(); nextIdx = 0; }
      else if (e.key === 'End')  { e.preventDefault(); nextIdx = allLis.length - 1; }
      else return;
      themeId = allLis[nextIdx].dataset.id;
      fireThemeChanged(themeId);
      renderThemePicker();
      renderPreview();
      scheduleSaveDraft();
      // Restore focus to the newly-active radio (renderThemePicker
      // recreates the list).
      var freshLis = themesEl.querySelectorAll('.md-theme');
      if (freshLis[nextIdx]) freshLis[nextIdx].focus();
    });
  }
  // W10-2 — global keyboard shortcuts: Cmd/Ctrl-S = manual save toast,
  // Cmd/Ctrl-D = trigger download, Esc = close any open <details>
  // (allergen popovers, draft banner, paste drawer, meta block).
  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      persistDraft();
      setDownloadMsg(tt('Draft saved.', 'Borrador guardado.'), 'success');
      return;
    }
    if (mod && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      if (downloadBtn && !downloadBtn.disabled) downloadBtn.click();
      return;
    }
    if (e.key === 'Escape') {
      // Close any open details (popovers, banners) — non-destructive.
      var openDetails = document.querySelectorAll('details[open]');
      openDetails.forEach(function (d) {
        if (d.classList.contains('md-allergen-pop') || d.classList.contains('md-meta') ||
            d.classList.contains('md-paste') || d.classList.contains('md-print-checklist')) {
          d.open = false;
        }
      });
    }
  });

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
    // Wave A6 funnel — bounded prop so a returning operator who
    // re-uploads the same logo doesn't double-count (the kind enum
    // collapses both cases). SVG path passes w=h=null so the kind
    // discriminator is the data-URL prefix.
    if (window.plausible) {
      try {
        window.plausible('Menu Design Custom Logo Added', { props: {
          kind: (typeof dataUrl === 'string' && dataUrl.indexOf('data:image/svg') === 0) ? 'svg' : 'raster'
        }});
      } catch (_) {}
    }
    if (logoThumb) {
      logoThumb.innerHTML = '<img src="' + escHtml(dataUrl) + '" alt="" />';
      // W5-5 — small bounce so the operator sees the logo land.
      // Honors prefers-reduced-motion via the CSS rule.
      logoThumb.classList.remove('md-pp-logo-bounce');
      void logoThumb.offsetHeight; // force reflow so the class re-triggers
      logoThumb.classList.add('md-pp-logo-bounce');
      setTimeout(function () {
        if (logoThumb) logoThumb.classList.remove('md-pp-logo-bounce');
      }, 320);
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

  // W18 — downscaleImage extracted to infra/dom.js.
  function downscaleImage(file, maxDim, quality, cb) {
    if (typeof MD_DOM !== 'undefined') return MD_DOM.downscaleImage(file, maxDim, quality, cb);
    return cb && cb(null);
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
        // W13-1 — pre-warm svg2pdf so the first PDF export doesn't
        // pay a 80KB CDN load on the user-initiated click.
        try { if (typeof MD_PDF !== 'undefined' && MD_PDF.preloadSvg2Pdf) MD_PDF.preloadSvg2Pdf(); } catch (_) {}
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

  // -------------------- Paper size (W7-3) --------------------
  // Category-pill + card-grid picker driven by the PAPERS catalog
  // shipped on MD_PDF.PAPERS. Each category renders cards for the
  // papers whose `cat` matches; clicking a card sets paperKey and
  // re-renders. Custom dimensions live in their own panel.
  var paperTabs = document.getElementById('mdPaperTabs');
  var paperCustom = document.getElementById('mdPaperCustom');
  var paperCustomW = document.getElementById('mdPaperCustomW');
  var paperCustomH = document.getElementById('mdPaperCustomH');
  var paperCustomU = document.getElementById('mdPaperCustomUnit');
  var customDims = { w: 8.5, h: 11, unit: 'in' };
  var activePaperCat = 'sheet';

  function renderPaperGrid() {
    if (!paperRow || typeof MD_PDF === 'undefined') return;
    var paperRegistry = MD_PDF.PAPERS || {};
    var keys = Object.keys(paperRegistry);
    var inCat = keys.filter(function (k) {
      var p = paperRegistry[k];
      return (p.cat || 'sheet') === activePaperCat;
    });
    if (activePaperCat === 'custom') {
      paperRow.innerHTML = '';
      if (paperCustom) paperCustom.hidden = false;
      return;
    }
    if (paperCustom) paperCustom.hidden = true;
    paperRow.innerHTML = inCat.map(function (k) {
      var p = paperRegistry[k];
      var checked = (k === paperKey) ? 'true' : 'false';
      // Tiny SVG silhouette (proportional to paper).
      var thumbW = 48; var thumbH = Math.round(thumbW * (p.h / p.w));
      if (thumbH > 32) { thumbH = 32; thumbW = Math.round(thumbH * (p.w / p.h)); }
      // W24-1 — drop the inline width/height; CSS already caps with
      // max-width: 48px / max-height: 32px. Inline attrs prevented
      // the silhouette from scaling down on narrower cards (post
      // W24-1 grid change, paper cards can be < 150px wide).
      var thumb = '<svg class="md-paper-card-thumb" viewBox="0 0 ' + thumbW + ' ' + thumbH + '" aria-hidden="true" style="width:100%;max-width:48px;height:auto"><rect x="0.5" y="0.5" width="' + (thumbW - 1) + '" height="' + (thumbH - 1) + '" fill="#FAF7F2" stroke="#9A958B"/></svg>';
      var orient = p.orient === 'landscape' ? 'LAND' : (p.orient === 'portrait' ? 'PORT' : '');
      var stockLabel = p.stock ? ('<span class="md-paper-card-stock">' + escHtml(p.stock) + '</span>') : '';
      return '<button type="button" class="md-paper-card" role="radio" aria-checked="' + checked + '" data-key="' + escHtml(k) + '">' +
        '<span class="md-paper-card-name">' + escHtml(p.label || k) + '</span>' +
        stockLabel +
        '<span class="md-paper-card-orient" aria-hidden="true">' + orient + '</span>' +
        thumb +
        '</button>';
    }).join('');
  }

  if (paperTabs) {
    paperTabs.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cat]'); if (!t) return;
      activePaperCat = t.dataset.cat;
      var siblings = paperTabs.querySelectorAll('[data-cat]');
      for (var i = 0; i < siblings.length; i++) {
        siblings[i].setAttribute('aria-selected', siblings[i] === t ? 'true' : 'false');
      }
      renderPaperGrid();
    });
  }
  if (paperRow) {
    paperRow.addEventListener('click', function (e) {
      var card = e.target.closest('[data-key]'); if (!card) return;
      paperKey = card.dataset.key;
      var sibs = paperRow.querySelectorAll('[data-key]');
      for (var i = 0; i < sibs.length; i++) sibs[i].setAttribute('aria-checked', sibs[i] === card ? 'true' : 'false');
      renderPreview();
      scheduleSaveDraft();
    });
  }
  function readCustomDims() {
    if (!paperCustomW || !paperCustomH || !paperCustomU) return;
    var w = parseFloat(paperCustomW.value); var h = parseFloat(paperCustomH.value);
    if (!(isFinite(w) && isFinite(h) && w > 0 && h > 0)) return;
    // W21 fix #5 — explicit per-unit clamp. The HTML inputs declare
    // min=2 max=50 but those are unit-relative (an operator who
    // pastes a value or switches unit can land outside the safe
    // range). Mirror resolvePaper()'s 2"-50" bounds in mm/cm/pt too.
    var unit = paperCustomU.value || 'in';
    var bounds = unit === 'mm' ? { min: 50,  max: 1270 }
              : unit === 'cm' ? { min: 5,   max: 127  }
              : unit === 'pt' ? { min: 144, max: 3600 }
              : { min: 2, max: 50 }; // inches default
    if (w < bounds.min || w > bounds.max || h < bounds.min || h > bounds.max) return;
    customDims = { w: w, h: h, unit: unit };
    paperKey = 'custom';
    renderPreview();
    scheduleSaveDraft();
  }
  if (paperCustomW) paperCustomW.addEventListener('input', readCustomDims);
  if (paperCustomH) paperCustomH.addEventListener('input', readCustomDims);
  if (paperCustomU) paperCustomU.addEventListener('change', readCustomDims);

  // Initial render once MD_PDF is available (script loads after PDF
  // module so this runs at end-of-script init).

  // W10-1 — print-vendor mode state + readiness checklist.
  var printVendor = false;
  var printVendorEl = document.getElementById('mdPrintVendor');
  var printChecklistEl = document.getElementById('mdPrintChecklist');
  var printChecklistItems = document.getElementById('mdPrintChecklistItems');
  function renderPrintChecklist() {
    if (!printChecklistItems) return;
    var paperInfo = (typeof MD_PDF !== 'undefined' && MD_PDF.PAPERS) ? MD_PDF.PAPERS[paperKey] : null;
    var paperLabel = (paperInfo && paperInfo.label) || paperKey;
    var dishCount = rows.filter(function (r) { return r.kind === 'dish' && (r.name || '').trim(); }).length;
    var logoDpiState = 'ok';
    var logoDpiNote = 'no logo';
    if (logoUrl && logoMeta && logoMeta.w && logoMeta.h) {
      var maxDim = Math.max(logoMeta.w, logoMeta.h);
      if (maxDim < 600) { logoDpiState = 'warn'; logoDpiNote = 'low DPI (' + logoMeta.w + '×' + logoMeta.h + ') — may print soft'; }
      else { logoDpiNote = 'high DPI (' + logoMeta.w + '×' + logoMeta.h + ')'; }
    }
    var items = [
      { state: 'ok',  text: tt('Paper size: ' + paperLabel,                'Tamaño de papel: ' + paperLabel) },
      { state: 'ok',  text: tt('Bleed: 0.125" all sides',                  'Sangrado: 0.125\" todos los lados') },
      { state: 'ok',  text: tt('Crop marks: enabled',                      'Marcas de corte: activas') },
      { state: 'ok',  text: tt('Color profile: sRGB IEC61966-2.1 (vendor converts to CMYK)',
                                'Perfil de color: sRGB IEC61966-2.1 (el impresor convierte a CMYK)') },
      { state: logoDpiState, text: tt('Logo DPI: ' + logoDpiNote, 'DPI del logo: ' + logoDpiNote) },
      { state: 'ok',  text: tt('Fonts: Fraunces + Inter embedded (or PDF base-14 fallback)',
                                'Tipos: Fraunces + Inter incrustados (o fallback PDF base-14)') },
      { state: 'ok',  text: tt('Dish count: ' + dishCount + ' — paginates cleanly',
                                'Platos: ' + dishCount + ' — pagina limpio') }
    ];
    printChecklistItems.innerHTML = items.map(function (it) {
      return '<li class="' + it.state + '">' + escHtml(it.text) + '</li>';
    }).join('');
  }
  if (printVendorEl) {
    printVendorEl.addEventListener('change', function () {
      printVendor = !!printVendorEl.checked;
      if (printChecklistEl) {
        printChecklistEl.hidden = !printVendor;
        printChecklistEl.open = printVendor;
      }
      if (printVendor) renderPrintChecklist();
      scheduleSaveDraft();
    });
  }

  // W9-3 — menu-level meta input wiring.
  var metaTaglineEl = document.getElementById('mdMetaTagline');
  var metaStoryEl   = document.getElementById('mdMetaStory');
  var metaCoverEl   = document.getElementById('mdMetaCoverPage');
  if (metaTaglineEl) metaTaglineEl.addEventListener('input', function () {
    meta.tagline = metaTaglineEl.value || '';
    schedulePreview();
    scheduleSaveDraft();
  });
  if (metaStoryEl) metaStoryEl.addEventListener('input', function () {
    meta.story = metaStoryEl.value || '';
    schedulePreview();
    scheduleSaveDraft();
  });
  // W11-3 — cover-page toggle. Lives on meta so it persists with
  // the rest of the menu-level metadata.
  if (metaCoverEl) metaCoverEl.addEventListener('change', function () {
    meta.coverPage = !!metaCoverEl.checked;
    scheduleSaveDraft();
  });
  // W14-2 — wire the address/hours/footer fields. Each writes to a
  // meta.* key, debounces preview + draft save.
  var metaFooterFields = [
    ['mdMetaAddress',       'address'],
    ['mdMetaHours',         'hours'],
    ['mdMetaServiceCharge', 'serviceCharge'],
    ['mdMetaSourcing',      'sourcing'],
    ['mdMetaDisclaimer',    'disclaimer'],
    ['mdMetaAskYourServer', 'askYourServer']
  ];
  metaFooterFields.forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    if (!el) return;
    el.addEventListener('input', function () {
      meta[pair[1]] = el.value || '';
      schedulePreview();
      scheduleSaveDraft();
    });
  });

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
    // W12-3 — operator overrides from the customizer panel.
    theme = applyCustomizer(theme);

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
      paper.removeAttribute('data-paper');
      paper.removeAttribute('data-flow');
      paper.style.removeProperty('--paper-aspect');
      paper.style.removeProperty('--paper-margin-pct');
      paper.style.removeProperty('--panels');
      // W24-2 — also strip any leftover sibling pages from the
      // previous render so the empty state is clean.
      var emptyFrame = paper.parentElement;
      if (emptyFrame) {
        emptyFrame.querySelectorAll('.md-preview-paper-extra, .md-page-break, .md-preview-page-num')
          .forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      }
      if (previewMeta) previewMeta.textContent = '';
      if (overflowEl) overflowEl.hidden = true;
      return;
    }

    // Theme tokens → CSS custom properties on the paper element.
    paper.style.setProperty('--paper', theme.paper);
    paper.style.setProperty('--ink', theme.ink);
    paper.style.setProperty('--accent', theme.accent);
    paper.style.setProperty('--muted', theme.muted);
    // W12-3 — paper-texture overlay class
    if (customize.paperTexture) paper.classList.add('md-pp-texture');
    else paper.classList.remove('md-pp-texture');
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
    // W24-2 — apply paper aspect ratio + scaled padding so the
    // preview is shaped like the actual deliverable. Sheet flow
    // (Letter, A4, etc.) gets a portrait/landscape paper-shape;
    // panel flow (trifold, table-tent) gets the unfolded sheet
    // shape and the panel grid is set up via data-flow="panel".
    var paperInfo = (typeof MD_PDF !== 'undefined' && MD_PDF.PAPERS && MD_PDF.PAPERS[paperKey]) || null;
    if (paperInfo) {
      paper.style.setProperty('--paper-aspect', paperInfo.w + '/' + paperInfo.h);
      paper.style.setProperty('--paper-margin-pct',
        String((paperInfo.margin || 48) / paperInfo.w * 100) + '%');
      paper.dataset.paper = paperKey;
      paper.dataset.flow  = paperInfo.flow || 'page';
      if (paperInfo.flow === 'panel') {
        paper.style.setProperty('--panels', String(paperInfo.panels || 1));
      } else {
        paper.style.removeProperty('--panels');
      }
    }
    paper.dataset.logoSlot    = theme.logoSlot;

    // Group rows[] into [section, dish[]] pairs. Dishes before any
    // section header land in an unnamed group at the top.
    var groups = [];
    var current = { name: null, dishes: [], blurb: '', glyph: '', availability: '', specials: false, hero: null };
    rows.forEach(function (r) {
      if (r.kind === 'section') {
        if (current.name !== null || current.dishes.length) groups.push(current);
        current = {
          name: (r.name || '').trim(),
          dishes: [],
          blurb: (r.blurb || '').trim(),
          glyph: (r.glyph || '').trim(),
          availability: (r.availability || '').trim(),
          specials: !!r.specials,
          hero: r.hero || null
        };
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
    // W9-3 — tagline + story render between title and first section.
    if (meta.tagline) {
      html += '<p class="md-pp-tagline">' + escHtml(meta.tagline) + '</p>';
    }
    if (meta.story) {
      html += '<blockquote class="md-pp-story">' + escHtml(meta.story) + '</blockquote>';
    }

    // Two-column theme: render dishes inside grid, sections span both columns.
    var isTwoCol = theme.columns === 2;
    if (isTwoCol) html += '<div class="md-pp-cols" style="grid-template-columns:1fr 1fr">';
    groups.forEach(function (g) {
      // W13-2 — hero band renders before the section header.
      if (g.hero && g.hero.dataUrl) {
        html += '<img class="md-pp-section-hero"' + (isTwoCol ? ' style="grid-column:1/-1"' : '') +
                ' src="' + escHtml(g.hero.dataUrl) + '" alt="" />';
      }
      if (g.name) {
        var sectionClasses = 'md-pp-section' + (g.specials ? ' md-pp-section-specials' : '');
        var glyphPrefix = g.glyph ? '<span class="md-pp-section-glyph" aria-hidden="true">' + escHtml(g.glyph) + '</span> ' : '';
        var availTag = g.availability ? '<span class="md-pp-section-avail">' + escHtml(g.availability) + '</span>' : '';
        html += '<h2 class="' + sectionClasses + '"' + (isTwoCol ? ' style="grid-column:1/-1"' : '') + '>' +
                glyphPrefix + escHtml(g.name) + availTag +
                '</h2>';
        if (g.blurb) {
          html += '<p class="md-pp-section-blurb"' + (isTwoCol ? ' style="grid-column:1/-1"' : '') + '>' + escHtml(g.blurb) + '</p>';
        }
      }
      g.dishes.forEach(function (d) {
        var name  = (d.name || '').trim();
        var price = (d.price || '').trim();
        var desc  = (d.desc || '').trim();
        // W7-2 — render allergen + spice glyphs inline after the
        // dish name. Each chip carries an aria-label so screen
        // readers say "Vegan" not just "V".
        var dAllergens = Array.isArray(d.allergens) ? d.allergens : [];
        var dSpice = (typeof d.spice === 'number' && d.spice > 0) ? d.spice : 0;
        var glyphsHtml = '';
        if (dAllergens.length || dSpice) {
          glyphsHtml = ' <span class="md-pp-glyphs" role="list">';
          dAllergens.forEach(function (code) {
            var a = allergenById(code); if (!a) return;
            var lbl = allergenLabel(code);
            // W19 — bespoke SVG glyph in preview, fallback to letter.
            var inner = (typeof MD_GLYPHS !== 'undefined' && MD_GLYPHS.has(code))
              ? MD_GLYPHS.inlineSvg(code, { size: 14, title: lbl, strokeWidth: 1.4 })
              : escHtml(code);
            glyphsHtml += '<span class="md-pp-glyph md-pp-glyph-svg" role="listitem" aria-label="' + escHtml(lbl) + '">' + inner + '</span>';
          });
          if (dSpice) {
            var fireGlyph = '';
            for (var fg = 0; fg < dSpice; fg++) fireGlyph += '🌶';
            glyphsHtml += '<span class="md-pp-glyph md-pp-glyph-spice" role="listitem" aria-label="' + escHtml(tt('Spicy level ' + dSpice, 'Picante nivel ' + dSpice)) + '">' + fireGlyph + '</span>';
          }
          glyphsHtml += '</span>';
        }
        // W11-4 — dish photo thumbnail
        var thumbHtml = (d.photo && d.photo.dataUrl)
          ? '<span class="md-pp-dish-thumb" aria-hidden="true"><img src="' + escHtml(d.photo.dataUrl) + '" alt="" /></span>'
          : '';
        // W13-2 — dish badges rendered inline before the dish name.
        var badgesHtml = '';
        if (Array.isArray(d.badges) && d.badges.length) {
          badgesHtml = '<span class="md-pp-badges">';
          d.badges.forEach(function (bcode) {
            var b = badgeById(bcode); if (!b) return;
            var bL = LOCALE === 'es' ? b.label_es : b.label_en;
            badgesHtml += '<span class="md-pp-badge" data-badge="' + escHtml(bcode) + '" aria-label="' + escHtml(bL) + '">' + escHtml(b.glyph) + '</span>';
          });
          badgesHtml += '</span>';
        }
        // W12-2 — pairing / modifier / halfPrice render below desc.
        var pairing  = (d.pairing  || '').trim();
        var modifier = (d.modifier || '').trim();
        var halfPrice = (d.halfPrice || '').trim();
        var priceHtml = escHtml(price);
        if (halfPrice) priceHtml += ' <span class="md-pp-half-price">/ ½ ' + escHtml(halfPrice) + '</span>';
        html += '<div class="md-pp-row">';
        html += '<div class="md-pp-name">' + thumbHtml + badgesHtml + escHtml(name) + glyphsHtml + '</div>';
        html += '<div class="md-pp-price">' + priceHtml + '</div>';
        if (desc) html += '<div class="md-pp-desc">' + escHtml(desc) + '</div>';
        // W14-1 — portion + calories rendered as a small muted suffix.
        var portionBits = [];
        if (d.portion)  portionBits.push(escHtml(d.portion));
        if (d.calories) portionBits.push(escHtml(d.calories) + ' cal');
        if (portionBits.length) {
          html += '<div class="md-pp-portion">' + portionBits.join(' &middot; ') + '</div>';
        }
        if (pairing)  html += '<div class="md-pp-pairing">' + escHtml(pairing) + '</div>';
        if (modifier) html += '<div class="md-pp-modifier">' + escHtml(modifier) + '</div>';
        html += '</div>';
      });
    });
    if (isTwoCol) html += '</div>';

    // W14-2 — restaurant contact + footer notes block. Renders before
    // the allergen-key legend so the legal/sourcing/disclaimer copy
    // sits below the menu but above the dietary key.
    var hasFooter = meta.address || meta.hours || meta.serviceCharge || meta.sourcing || meta.disclaimer || meta.askYourServer;
    if (hasFooter) {
      html += '<footer class="md-pp-footer">';
      if (meta.askYourServer) html += '<p class="md-pp-footer-prompt">' + escHtml(meta.askYourServer) + '</p>';
      var contactBits = [];
      if (meta.address) contactBits.push(escHtml(meta.address));
      if (meta.hours)   contactBits.push(escHtml(meta.hours));
      if (contactBits.length) html += '<p class="md-pp-footer-contact">' + contactBits.join(' &middot; ') + '</p>';
      var noteBits = [];
      if (meta.serviceCharge) noteBits.push(escHtml(meta.serviceCharge));
      if (meta.sourcing)      noteBits.push(escHtml(meta.sourcing));
      if (noteBits.length) html += '<p class="md-pp-footer-note">' + noteBits.join(' &middot; ') + '</p>';
      if (meta.disclaimer) html += '<p class="md-pp-footer-disclaimer">' + escHtml(meta.disclaimer) + '</p>';
      html += '</footer>';
    }

    // W7-2 — auto-generated allergen-key legend at the menu footer.
    // Surfaces only when at least one dish carries a code; collects
    // the unique codes used and prints a comma-separated key. The
    // legend respects locale (EN/ES labels).
    var activeCodes = activeAllergenCodes();
    if (activeCodes.length) {
      html += '<div class="md-pp-allergen-key" aria-label="' +
        tt('Allergen and dietary key', 'Clave de alérgenos y dieta') + '">' +
        '<span class="md-pp-allergen-key-label">' +
        tt('Allergen / dietary key', 'Clave de alérgenos / dieta') + ':</span> ';
      activeCodes.forEach(function (code, ai) {
        var a = allergenById(code); if (!a) return;
        var lbl = LOCALE === 'es' ? a.label_es : a.label_en;
        // W19 — render the bespoke SVG in the legend too so editor /
        // preview / PDF all read with the same iconography.
        var inner = (typeof MD_GLYPHS !== 'undefined' && MD_GLYPHS.has(code))
          ? MD_GLYPHS.inlineSvg(code, { size: 14, title: lbl, strokeWidth: 1.5 })
          : escHtml(code);
        html += '<span class="md-pp-allergen-key-item">' +
          '<span class="md-pp-allergen-key-glyph md-pp-allergen-key-glyph-svg">' + inner + '</span>' +
          ' = ' + escHtml(lbl) + '</span>';
        if (ai < activeCodes.length - 1) html += '<span class="md-pp-allergen-key-sep" aria-hidden="true"> · </span>';
      });
      html += '</div>';
    }

    paper.innerHTML = html;
    // W24-2 — clear any leftover sibling pages + page-break shims
    // from the previous render. The frame is the multi-page host.
    var frame = paper.parentElement;
    if (frame) {
      var leftover = frame.querySelectorAll('.md-preview-paper-extra, .md-page-break, .md-preview-page-num');
      leftover.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
    }
    // W24-3 — panel-flow render: split content into N panels mapped
    // by paperInfo.panelMap. front=title+logo, inside-N=dish flow,
    // back=meta-footer / address. Visible fold lines between panels.
    var pages = 1;
    var panelCount = paperInfo && paperInfo.flow === 'panel' ? (paperInfo.panels || 1) : 0;
    if (paperInfo && paperInfo.flow === 'panel' && frame) {
      pages = renderPanelFlow(paper, paperInfo, theme);
    } else if (frame && typeof requestAnimationFrame === 'function') {
      // Sheet flow: split the rendered content into N stacked pages
      // based on actual measured heights. requestAnimationFrame waits
      // one frame so getBoundingClientRect returns settled values.
      requestAnimationFrame(function () {
        try { pages = paginatePreviewDom(paper, frame, paperInfo); }
        catch (_) { pages = 1; }
        updatePreviewMeta(pages, paperInfo, dishes.length);
      });
    }
    // Set the meta chip immediately based on the synchronous estimate;
    // the rAF callback above refines it once the DOM has settled.
    var initialEstimate = estimatePagesQuick(paperInfo, theme, dishes.length);
    updatePreviewMeta(initialEstimate, paperInfo, dishes.length);
    // W24-2 — retire the heuristic overflow warning. Page breaks
    // are now visible in the preview itself; only surface a
    // concrete advisory when a panel-flow paper genuinely can't
    // hold the operator's content.
    if (overflowEl) {
      if (paperInfo && paperInfo.flow === 'panel' && dishes.length > (paperInfo.panels || 6) * 8) {
        overflowEl.hidden = false;
        var ovLabel = paperInfo.label || paperKey;
        overflowEl.textContent = tt(
          "Won't fit one " + ovLabel + ' — try Tabloid or trim ' + Math.max(3, dishes.length - (paperInfo.panels || 6) * 6) + ' dishes.',
          'No cabe en un ' + ovLabel + ' — prueba Tabloide o quita ' + Math.max(3, dishes.length - (paperInfo.panels || 6) * 6) + ' platos.'
        );
      } else {
        overflowEl.hidden = true;
      }
    }
  }

  // W24-2 — quick synchronous page-count estimate (no DOM measurement).
  // Used for the immediate meta-chip update before the rAF refinement.
  function estimatePagesQuick(paperInfo, theme, dishCount) {
    if (!paperInfo) return 1;
    if (paperInfo.flow === 'panel') return paperInfo.panels || 1;
    var perPage = (theme && theme.columns === 2) ? 32 : 18;
    var areaRatio = (paperInfo.w * paperInfo.h) / (612 * 792);
    perPage = Math.max(6, Math.round(perPage * Math.max(0.45, areaRatio)));
    return Math.max(1, Math.ceil(dishCount / perPage));
  }

  // W24-2 — write the meta chip. Sheet flow: "13 dishes · 2 pages".
  // Panel flow: "13 dishes · 6 panels".
  function updatePreviewMeta(countOrPages, paperInfo, dishCount) {
    if (!previewMeta) return;
    var paperLabel = (paperInfo && paperInfo.label) || paperKey;
    if (paperInfo && paperInfo.flow === 'panel') {
      var panels = paperInfo.panels || 1;
      var panelWord = panels === 1 ? tt('panel', 'panel') : tt('panels', 'paneles');
      previewMeta.textContent = paperLabel + ' · ' + dishCount + ' ' + tt('dishes', 'platos') +
        ' · ' + panels + ' ' + panelWord;
    } else {
      var pages = (typeof countOrPages === 'number' ? countOrPages : 1);
      var pageWord = pages === 1 ? tt('page', 'página') : tt('pages', 'páginas');
      previewMeta.textContent = paperLabel + ' · ' + dishCount + ' ' + tt('dishes', 'platos') +
        ' · ' + pages + ' ' + pageWord;
    }
  }

  // W24-2 — DOM-measured page split. After the html is rendered into
  // the first .md-preview-paper, walk children and bin-pack by
  // measured height vs the paper's content-area height. When a child
  // would overflow, start a new .md-preview-paper sibling and insert
  // a .md-page-break shim between. Per-page corner labels are added
  // last. Returns final page count.
  function paginatePreviewDom(paperEl, frame, paperInfo) {
    if (!paperEl || !frame || !paperInfo) return 1;
    var rect = paperEl.getBoundingClientRect();
    if (!rect.width) return 1;
    var paperHeightPx = rect.width * (paperInfo.h / paperInfo.w);
    var paddingPx = rect.width * ((paperInfo.margin || 48) / paperInfo.w);
    var contentAreaH = paperHeightPx - 2 * paddingPx;
    if (contentAreaH <= 0) return 1;

    var children = Array.prototype.slice.call(paperEl.children);
    if (!children.length) {
      addPageNumLabel(paperEl, 1, 1);
      return 1;
    }
    // Measure each child once. Skip absolute-positioned siblings.
    var heights = children.map(function (c) {
      var cs = window.getComputedStyle(c);
      if (cs.position === 'absolute' || cs.position === 'fixed') return 0;
      return c.getBoundingClientRect().height;
    });
    var pageBuckets = [[]];
    var bucketH = 0;
    children.forEach(function (c, idx) {
      var ch = heights[idx];
      if (bucketH + ch > contentAreaH && pageBuckets[pageBuckets.length - 1].length) {
        pageBuckets.push([c]);
        bucketH = ch;
      } else {
        pageBuckets[pageBuckets.length - 1].push(c);
        bucketH += ch;
      }
    });
    if (pageBuckets.length <= 1) {
      addPageNumLabel(paperEl, 1, 1);
      return 1;
    }
    // First bucket stays in paperEl (already there). Move the rest
    // into new sibling .md-preview-paper elements with shims between.
    paperEl.innerHTML = '';
    pageBuckets[0].forEach(function (c) { paperEl.appendChild(c); });
    addPageNumLabel(paperEl, 1, pageBuckets.length);

    var prevSibling = paperEl;
    for (var p = 1; p < pageBuckets.length; p++) {
      var shim = document.createElement('div');
      shim.className = 'md-page-break';
      shim.setAttribute('aria-hidden', 'true');
      shim.innerHTML = '<span>' + escHtml(tt(
        'Page ' + (p + 1) + ' of ' + pageBuckets.length,
        'Página ' + (p + 1) + ' de ' + pageBuckets.length)) + '</span>';
      prevSibling.parentNode.insertBefore(shim, prevSibling.nextSibling);

      var newPaper = paperEl.cloneNode(false);
      newPaper.classList.add('md-preview-paper-extra');
      newPaper.removeAttribute('id');
      pageBuckets[p].forEach(function (c) { newPaper.appendChild(c); });
      shim.parentNode.insertBefore(newPaper, shim.nextSibling);
      addPageNumLabel(newPaper, p + 1, pageBuckets.length);
      prevSibling = newPaper;
    }
    return pageBuckets.length;
  }

  function addPageNumLabel(paperEl, n, total) {
    if (total <= 1 && n === 1) return; // single page; skip label
    var lbl = document.createElement('span');
    lbl.className = 'md-preview-page-num';
    lbl.setAttribute('aria-hidden', 'true');
    lbl.textContent = n + ' / ' + total;
    paperEl.appendChild(lbl);
  }

  // W24-3 — Panel-flow renderer. Distributes the existing rendered
  // children into N panel divs based on paperInfo.panelMap. Front
  // panel gets title + logo; back panel gets meta-footer / address;
  // inside panels get the dish flow split evenly. CSS handles the
  // grid layout (desktop side-by-side, mobile stacked).
  function renderPanelFlow(paperEl, paperInfo, theme) {
    if (!paperEl || !paperInfo) return 1;
    var panels = paperInfo.panels || 1;
    var panelMap = paperInfo.panelMap || [];
    // Snapshot the current children (built by the same html-string
    // composer above). Title + logo + tagline + story go into the
    // front panel; meta-footer + allergen-key into back; everything
    // else (sections + dishes) flows through inside panels.
    var children = Array.prototype.slice.call(paperEl.children);
    var titleNodes  = children.filter(function (c) {
      return c.classList && (
        c.classList.contains('md-pp-logo') ||
        c.classList.contains('md-pp-title') ||
        c.classList.contains('md-pp-tagline') ||
        c.classList.contains('md-pp-story')
      );
    });
    var backNodes = children.filter(function (c) {
      return c.classList && (
        c.classList.contains('md-pp-footer') ||
        c.classList.contains('md-pp-allergen-key')
      );
    });
    var insideNodes = children.filter(function (c) {
      return titleNodes.indexOf(c) === -1 && backNodes.indexOf(c) === -1;
    });
    paperEl.innerHTML = '';
    var insideTotal = panelMap.filter(function (r) {
      return r === 'inside-1' || r === 'inside-2' || r === 'inside-3' || r === 'inside-4' ||
             r === 'inside-L' || r === 'inside-R' || r === 'center' ||
             r === 'side-A' || r === 'side-B' ||
             /^inside/.test(r);
    }).length || 1;
    var perInside = Math.ceil(insideNodes.length / insideTotal);
    var insideIdx = 0;
    var insidePanelN = 0;
    for (var pi = 0; pi < panels; pi++) {
      var role = panelMap[pi] || 'inside-' + pi;
      var panelDiv = document.createElement('div');
      panelDiv.className = 'md-pp-panel';
      panelDiv.dataset.role = role;
      var roleLabel = document.createElement('span');
      roleLabel.className = 'md-pp-panel-role';
      roleLabel.setAttribute('aria-hidden', 'true');
      roleLabel.textContent = panelRoleLabel(role);
      panelDiv.appendChild(roleLabel);
      if (role === 'front') {
        titleNodes.forEach(function (c) { panelDiv.appendChild(c.cloneNode(true)); });
      } else if (role === 'back' || role === 'address') {
        backNodes.forEach(function (c) { panelDiv.appendChild(c.cloneNode(true)); });
      } else if (role === 'tear') {
        // Empty by design — placeholder for coupon / mailing label.
        var note = document.createElement('p');
        note.style.cssText = 'opacity:.4;font-size:.7em;text-align:center;margin-top:30%';
        note.textContent = tt('Tear / mailing panel', 'Panel desprendible / postal');
        panelDiv.appendChild(note);
      } else {
        // Inside-N: take the next slice of inside nodes.
        var slice = insideNodes.slice(insideIdx, insideIdx + perInside);
        insideIdx += perInside;
        insidePanelN++;
        slice.forEach(function (c) { panelDiv.appendChild(c); });
      }
      paperEl.appendChild(panelDiv);
    }
    return panels;
  }

  function panelRoleLabel(role) {
    var en = {
      'front':    'FRONT',
      'back':     'BACK',
      'address':  'ADDRESS',
      'tear':     'TEAR',
      'inside-1': 'INSIDE 1', 'inside-2': 'INSIDE 2', 'inside-3': 'INSIDE 3', 'inside-4': 'INSIDE 4',
      'inside-L': 'INSIDE LEFT', 'inside-R': 'INSIDE RIGHT', 'center': 'CENTER',
      'gate-L':   'GATE LEFT', 'gate-R': 'GATE RIGHT',
      'side-A':   'SIDE A',  'side-B': 'SIDE B'
    };
    var es = {
      'front':    'FRENTE',
      'back':     'REVERSO',
      'address':  'DIRECCIÓN',
      'tear':     'DESPRENDIBLE',
      'inside-1': 'INTERIOR 1', 'inside-2': 'INTERIOR 2', 'inside-3': 'INTERIOR 3', 'inside-4': 'INTERIOR 4',
      'inside-L': 'INTERIOR IZQ', 'inside-R': 'INTERIOR DER', 'center': 'CENTRO',
      'gate-L':   'PORTÓN IZQ', 'gate-R': 'PORTÓN DER',
      'side-A':   'LADO A',   'side-B': 'LADO B'
    };
    return tt(en[role] || role.toUpperCase(), es[role] || role.toUpperCase());
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
  // W22 — draft persistence + safeLs probe extracted to state/draft.js.
  // Keep these constants for back-compat with any helpers that still
  // reference them inline (they alias the same keys).
  var DRAFT_KEY = (typeof MD_DRAFT !== 'undefined') ? MD_DRAFT.DRAFT_KEY : 'mtn:menu-design:draft';
  var LOGO_KEY  = (typeof MD_DRAFT !== 'undefined') ? MD_DRAFT.LOGO_KEY  : 'mtn:menu-design:logo';
  var LOGO_BUDGET = 200 * 1024; // 200KB
  var __saveTimer = null;
  var __saveDraftEnabled = true;

  function safeLs() {
    if (typeof MD_DRAFT !== 'undefined') return MD_DRAFT.safeLs();
    try {
      var probe = '__md_probe__';
      localStorage.setItem(probe, probe); // h8-exempt: storage probe
      localStorage.removeItem(probe);
      return localStorage;
    } catch (_) { return null; }
  }

  // W8-1 — saved-state indicator UI driven by the autosave cycle.
  var savedEl = document.getElementById('mdSaved');
  var savedText = savedEl ? savedEl.querySelector('.md-saved-text') : null;
  var __lastSavedTs = 0;
  function updateSavedIndicator(state) {
    if (!savedEl || !savedText) return;
    savedEl.classList.remove('is-saved', 'is-saving');
    if (state === 'saving') {
      savedEl.classList.add('is-saving');
      savedText.textContent = tt('Saving…', 'Guardando…');
    } else if (state === 'saved') {
      __lastSavedTs = Date.now();
      savedEl.classList.add('is-saved');
      savedText.textContent = tt('Saved just now', 'Guardado ahora');
    } else if (state === 'tick') {
      // Periodic refresh — show "Saved 12s ago" / "Saved 3m ago".
      if (!__lastSavedTs) return;
      savedEl.classList.add('is-saved');
      var ago = Math.max(1, Math.round((Date.now() - __lastSavedTs) / 1000));
      var label;
      if (ago < 60) label = tt('Saved ' + ago + 's ago', 'Guardado hace ' + ago + 's');
      else if (ago < 3600) label = tt('Saved ' + Math.round(ago/60) + 'm ago', 'Guardado hace ' + Math.round(ago/60) + 'm');
      else label = tt('Saved a while ago', 'Guardado hace rato');
      savedText.textContent = label;
    }
  }
  // Periodic refresher every 15s so the "Saved Xs ago" string ages.
  setInterval(function () { updateSavedIndicator('tick'); }, 15000);

  // W8-1 — undo/redo stack. Snapshot rows + key UI state on every
  // committed mutation; cap at 50. Cmd-Z / Cmd-Shift-Z bound at the
  // document keydown handler from W10-2.
  var __undoStack = [];
  var __redoStack = [];
  var UNDO_CAP = 50;
  var undoBtn = document.getElementById('mdUndoBtn');
  var redoBtn = document.getElementById('mdRedoBtn');
  function snapshot() {
    return {
      rows: rows.map(function (r) { return Object.assign({}, r); }),
      themeId: themeId,
      paperKey: paperKey,
      meta: { tagline: meta.tagline, story: meta.story }
    };
  }
  function applySnapshot(snap) {
    if (!snap) return;
    rows = (snap.rows || []).map(function (r) { return Object.assign({}, r); });
    themeId = snap.themeId || themeId;
    paperKey = snap.paperKey || paperKey;
    meta.tagline = (snap.meta && snap.meta.tagline) || '';
    meta.story   = (snap.meta && snap.meta.story)   || '';
    if (metaTaglineEl) metaTaglineEl.value = meta.tagline;
    if (metaStoryEl)   metaStoryEl.value   = meta.story;
    render();
    renderThemePicker();
    renderPaperGrid();
  }
  function pushUndo() {
    if (__ghostActive) return;
    __undoStack.push(snapshot());
    if (__undoStack.length > UNDO_CAP) __undoStack.shift();
    __redoStack.length = 0;
    refreshUndoRedoBtns();
  }
  function refreshUndoRedoBtns() {
    if (undoBtn) undoBtn.disabled = !__undoStack.length;
    if (redoBtn) redoBtn.disabled = !__redoStack.length;
  }
  function doUndo() {
    if (!__undoStack.length) return;
    __redoStack.push(snapshot());
    applySnapshot(__undoStack.pop());
    refreshUndoRedoBtns();
    scheduleSaveDraft();
  }
  function doRedo() {
    if (!__redoStack.length) return;
    __undoStack.push(snapshot());
    applySnapshot(__redoStack.pop());
    refreshUndoRedoBtns();
    scheduleSaveDraft();
  }
  if (undoBtn) undoBtn.addEventListener('click', doUndo);
  if (redoBtn) redoBtn.addEventListener('click', doRedo);
  // Wire Cmd-Z / Cmd-Shift-Z (Z key with mod) to undo/redo. The
  // existing global keydown handler from W10-2 already catches
  // Cmd-S / Cmd-D / Esc — we add Z handling next to it.
  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) doRedo(); else doUndo();
    }
  });

  // ----------------------------------------------------------------
  // W12-4 — Cmd-K command palette. Modal launcher with fuzzy search
  // over registered commands. Linear/Notion pattern; power-user
  // productivity. Trapped focus while open; ESC dismisses; Enter
  // runs the highlighted command; Up/Down navigates.
  // ----------------------------------------------------------------
  var paletteEl = document.getElementById('mdPalette');
  var paletteInput = document.getElementById('mdPaletteInput');
  var paletteList = document.getElementById('mdPaletteList');
  var paletteBackdrop = document.getElementById('mdPaletteBackdrop');
  var paletteActiveIdx = 0;
  var paletteFiltered = [];

  function paletteCommands() {
    return [
      { label: tt('Add a dish',                'Agregar plato'),                run: function () { if (addRowBtn) addRowBtn.click(); }, hot: '⌘ ⇧ A' },
      { label: tt('Add a section',             'Agregar sección'),              run: function () { if (addSecBtn) addSecBtn.click(); } },
      { label: tt('Load sample menu',          'Cargar muestra'),                run: function () { if (sampleBtn) sampleBtn.click(); } },
      { label: tt('Download PDF',              'Descargar PDF'),                run: function () { if (downloadBtn) downloadBtn.click(); }, hot: '⌘ D' },
      { label: tt('Download large-print PDF',  'Descargar PDF letra grande'),   run: function () { if (largePrintBtn) largePrintBtn.click(); } },
      { label: tt('Download high-contrast PDF','Descargar PDF alto contraste'), run: function () { if (highContrastBtn) highContrastBtn.click(); } },
      { label: tt('Export QR menu (HTML + QR)','Exportar menú QR'),              run: function () { if (exportQrBtn) exportQrBtn.click(); } },
      { label: tt('Export plain text + Markdown','Exportar texto plano + Markdown'), run: function () { if (exportTextBtn) exportTextBtn.click(); } },
      { label: tt('Export SSML for TTS',       'Exportar SSML para TTS'),        run: function () { if (exportSsmlBtn) exportSsmlBtn.click(); } },
      { label: tt('Undo',                      'Deshacer'),                      run: function () { doUndo(); }, hot: '⌘ Z' },
      { label: tt('Redo',                      'Rehacer'),                       run: function () { doRedo(); }, hot: '⇧ ⌘ Z' },
      { label: tt('Save draft now',            'Guardar borrador'),              run: function () { persistDraft(); setDownloadMsg(tt('Draft saved.', 'Borrador guardado.'), 'success'); }, hot: '⌘ S' },
      { label: tt('Toggle print-vendor mode',  'Modo imprenta'),                 run: function () { if (printVendorEl) { printVendorEl.checked = !printVendorEl.checked; printVendorEl.dispatchEvent(new Event('change')); } } },
      { label: tt('Toggle paper texture',      'Textura de papel'),              run: function () { if (paperTextureEl) { paperTextureEl.checked = !paperTextureEl.checked; paperTextureEl.dispatchEvent(new Event('change')); } } },
      { label: tt('Toggle cover page',         'Portada'),                       run: function () { if (metaCoverEl) { metaCoverEl.checked = !metaCoverEl.checked; metaCoverEl.dispatchEvent(new Event('change')); } } },
      { label: tt('Clear menu',                'Limpiar menú'),                  run: function () { if (clearBtn) clearBtn.click(); } },
      { label: tt('Open templates',            'Abrir plantillas'),              run: function () { var d = document.querySelector('.md-templates'); if (d) d.open = true; } },
      { label: tt('Search dishes…',            'Buscar platos…'),                run: function () { if (searchEl) searchEl.focus(); } },
      // W12-4 — bulk actions via the palette. Cleaner than adding
      // multi-select checkboxes to already-busy dish rows.
      { label: tt('Bulk: increase all prices by 10%', 'Lote: subir precios 10%'),
        run: function () { bulkPriceAdjust(1.10); } },
      { label: tt('Bulk: increase all prices by 5%', 'Lote: subir precios 5%'),
        run: function () { bulkPriceAdjust(1.05); } },
      { label: tt('Bulk: round all prices to nearest dollar', 'Lote: redondear precios al dólar'),
        run: function () { bulkPriceRound(); } },
      { label: tt('Bulk: tag all dishes as locally sourced', 'Lote: etiquetar todo como local'),
        run: function () { bulkTagAllergen('LO'); } },
      { label: tt('Bulk: clear all photos',     'Lote: quitar todas las fotos'),
        run: function () { bulkClearPhotos(); } }
    ];
  }
  // ----------------------------------------------------------------
  // W12-4 — Bulk-action helpers. Each pushes a single undo snapshot
  // before mutating, so a misfire can be reverted with Cmd-Z.
  // Price parsing is lenient: strips currency symbols, parses the
  // numeric portion, multiplies, then re-prefixes the original
  // currency mark if any.
  // ----------------------------------------------------------------
  function bulkPriceAdjust(multiplier) {
    var changed = 0;
    pushUndo();
    rows.forEach(function (r) {
      if (r.kind !== 'dish' || !r.price) return;
      var match = String(r.price).match(/^([^\d.,-]*)([\d.,-]+)([^\d]*)$/);
      if (!match) return;
      var prefix = match[1] || '';
      var raw    = match[2].replace(/,/g, '');
      var suffix = match[3] || '';
      var n = parseFloat(raw);
      if (!isFinite(n)) return;
      var adjusted = (n * multiplier);
      // Round to 2 decimals, then drop trailing .00 for whole dollars.
      var newStr = (Math.round(adjusted * 100) / 100).toFixed(2).replace(/\.00$/, '');
      r.price = prefix + newStr + suffix;
      changed++;
    });
    render();
    scheduleSaveDraft();
    setDownloadMsg(tt('Updated ' + changed + ' price' + (changed === 1 ? '' : 's') + '.',
                      'Actualizados ' + changed + ' precio' + (changed === 1 ? '' : 's') + '.'), 'success');
  }
  function bulkPriceRound() {
    var changed = 0;
    pushUndo();
    rows.forEach(function (r) {
      if (r.kind !== 'dish' || !r.price) return;
      var match = String(r.price).match(/^([^\d.,-]*)([\d.,-]+)([^\d]*)$/);
      if (!match) return;
      var prefix = match[1] || '';
      var raw    = match[2].replace(/,/g, '');
      var suffix = match[3] || '';
      var n = parseFloat(raw);
      if (!isFinite(n)) return;
      r.price = prefix + Math.round(n) + suffix;
      changed++;
    });
    render();
    scheduleSaveDraft();
    setDownloadMsg(tt('Rounded ' + changed + ' price' + (changed === 1 ? '' : 's') + '.',
                      'Redondeados ' + changed + ' precio' + (changed === 1 ? '' : 's') + '.'), 'success');
  }
  function bulkTagAllergen(code) {
    var changed = 0;
    pushUndo();
    rows.forEach(function (r) {
      if (r.kind !== 'dish' || !r.name) return;
      if (!Array.isArray(r.allergens)) r.allergens = [];
      if (r.allergens.indexOf(code) === -1) {
        r.allergens.push(code);
        changed++;
      }
    });
    render();
    scheduleSaveDraft();
    var label = (function () { var a = allergenById(code); return a ? (LOCALE === 'es' ? a.label_es : a.label_en) : code; })();
    setDownloadMsg(tt(
      'Tagged ' + changed + ' dish' + (changed === 1 ? '' : 'es') + ' as ' + label + '.',
      'Etiquetados ' + changed + ' plato' + (changed === 1 ? '' : 's') + ' como ' + label + '.'
    ), 'success');
  }
  function bulkClearPhotos() {
    var changed = 0;
    pushUndo();
    rows.forEach(function (r) {
      if (r.kind === 'dish' && r.photo) { r.photo = null; changed++; }
    });
    render();
    scheduleSaveDraft();
    setDownloadMsg(tt(
      'Cleared ' + changed + ' photo' + (changed === 1 ? '' : 's') + '.',
      'Quitadas ' + changed + ' foto' + (changed === 1 ? '' : 's') + '.'
    ), 'success');
  }
  function renderPalette(query) {
    if (!paletteList) return;
    var all = paletteCommands();
    var q = (query || '').toLowerCase().trim();
    paletteFiltered = q
      ? all.filter(function (c) { return c.label.toLowerCase().indexOf(q) !== -1; })
      : all;
    paletteActiveIdx = 0;
    paletteList.innerHTML = paletteFiltered.map(function (c, i) {
      return '<li class="md-palette-item' + (i === paletteActiveIdx ? ' is-active' : '') + '" data-i="' + i + '" role="option">' +
        '<span class="md-palette-item-label">' + escHtml(c.label) + '</span>' +
        (c.hot ? '<span class="md-palette-item-shortcut">' + c.hot + '</span>' : '') +
        '</li>';
    }).join('');
  }
  function showPalette() {
    if (!paletteEl) return;
    paletteEl.hidden = false;
    if (paletteInput) { paletteInput.value = ''; paletteInput.focus(); }
    renderPalette('');
  }
  function hidePalette() {
    if (!paletteEl) return;
    paletteEl.hidden = true;
  }
  function runActiveCommand() {
    var cmd = paletteFiltered[paletteActiveIdx];
    if (cmd && typeof cmd.run === 'function') {
      hidePalette();
      try { cmd.run(); } catch (_) {}
    }
  }
  if (paletteInput) {
    paletteInput.addEventListener('input', function () { renderPalette(paletteInput.value); });
    paletteInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); paletteActiveIdx = Math.min(paletteFiltered.length - 1, paletteActiveIdx + 1); refreshActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); paletteActiveIdx = Math.max(0, paletteActiveIdx - 1); refreshActive(); }
      else if (e.key === 'Enter') { e.preventDefault(); runActiveCommand(); }
      else if (e.key === 'Escape') { e.preventDefault(); hidePalette(); }
    });
  }
  function refreshActive() {
    if (!paletteList) return;
    var items = paletteList.querySelectorAll('.md-palette-item');
    items.forEach(function (it, i) {
      it.classList.toggle('is-active', i === paletteActiveIdx);
    });
    var active = items[paletteActiveIdx];
    if (active) active.scrollIntoView({ block: 'nearest' });
  }
  if (paletteList) paletteList.addEventListener('click', function (e) {
    var item = e.target.closest('.md-palette-item'); if (!item) return;
    paletteActiveIdx = parseInt(item.dataset.i, 10);
    runActiveCommand();
  });
  if (paletteBackdrop) paletteBackdrop.addEventListener('click', hidePalette);

  // Cmd-K / Ctrl-K opens the palette.
  // W21 fix #4 — gate behind active-modal check so the palette
  // doesn't stack on top of the celebration overlay, the Vibe quiz,
  // or the first-run cuisine quiz. Two stacked modals trap focus
  // and break Esc behavior.
  function anotherModalOpen() {
    if (document.getElementById('mdCelebrate')) return true;
    var quiz = document.getElementById('mdQuiz');
    if (quiz && !quiz.hidden) return true;
    var vibe = document.getElementById('mdVibeQuiz');
    if (vibe && !vibe.hidden) return true;
    return false;
  }
  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      if (anotherModalOpen()) return; // let the other modal own focus
      e.preventDefault();
      showPalette();
    }
  });

  // W8-1 — search filter. Hides rows whose name+desc don't match.
  // Section headers stay visible if any child dish matches; if not,
  // the section is also hidden so the operator sees a clean filter.
  var searchEl = document.getElementById('mdSearch');
  function applySearchFilter() {
    if (!rowsEl || !searchEl) return;
    var q = (searchEl.value || '').toLowerCase().trim();
    var trs = rowsEl.querySelectorAll('tr[data-i]');
    if (!q) {
      trs.forEach(function (tr) { tr.style.display = ''; });
      return;
    }
    // Determine which sections retain at least one matching dish.
    var keepSections = {};
    var lastSec = null;
    rows.forEach(function (r, i) {
      if (r.kind === 'section') { lastSec = i; return; }
      if (r.kind === 'dish') {
        var hay = ((r.name || '') + ' ' + (r.desc || '')).toLowerCase();
        if (hay.indexOf(q) !== -1) keepSections[lastSec] = true;
      }
    });
    trs.forEach(function (tr) {
      var i = parseInt(tr.dataset.i, 10);
      if (!isFinite(i) || !rows[i]) return;
      var r = rows[i];
      if (r.kind === 'section') {
        tr.style.display = keepSections[i] ? '' : 'none';
      } else {
        var hay = ((r.name || '') + ' ' + (r.desc || '')).toLowerCase();
        tr.style.display = hay.indexOf(q) !== -1 ? '' : 'none';
      }
    });
  }
  if (searchEl) searchEl.addEventListener('input', applySearchFilter);

  function persistDraft() {
    if (!__saveDraftEnabled) return;
    if (__ghostActive) return;        // W5-1: never save demo rows as the operator's draft
    updateSavedIndicator('saving');
    var ls = safeLs();
    if (!ls) { updateSavedIndicator('saved'); return; }
    try {
      // W11-4 — strip dish photos before draft persistence. A 30-
      // dish menu × ~80KB photos would push past the 5MB localStorage
      // budget. Photos are treated as transient session content;
      // operators re-upload on restore. This is the conservative v1
      // trade-off (IndexedDB storage of photos is queued for later).
      var draft = {
        version: SCHEMA_VERSION,
        rows: rows.map(function (r) {
          var copy = Object.assign({}, r);
          if (copy.kind === 'dish' && copy.photo) {
            copy.photo = { name: copy.photo.name || null, w: copy.photo.w || 0, h: copy.photo.h || 0 };
          }
          // W13-2 — same rationale: section hero images aren't
          // persisted in localStorage; metadata only. Operator
          // re-uploads on restore.
          if (copy.kind === 'section' && copy.hero) {
            copy.hero = { name: copy.hero.name || null, w: copy.hero.w || 0, h: copy.hero.h || 0 };
          }
          return copy;
        }),
        themeId: themeId,
        paperKey: paperKey,
        customDims: paperKey === 'custom' ? customDims : null,
        meta: {
          tagline: meta.tagline, story: meta.story, coverPage: meta.coverPage,
          address: meta.address, hours: meta.hours, serviceCharge: meta.serviceCharge,
          sourcing: meta.sourcing, disclaimer: meta.disclaimer, askYourServer: meta.askYourServer
        },
        customize: { accent: customize.accent, paper: customize.paper, ink: customize.ink, paperTexture: customize.paperTexture, mods: customize.mods },
        logoMeta: logoMeta,
        savedAt: Date.now()
      };
      ls.setItem(DRAFT_KEY, JSON.stringify(draft)); // h8-exempt: in-progress menu draft
      if (logoUrl && logoUrl.length <= LOGO_BUDGET) {
        ls.setItem(LOGO_KEY, logoUrl); // h8-exempt: in-progress menu logo
      } else if (!logoUrl) {
        ls.removeItem(LOGO_KEY);
      }
      updateSavedIndicator('saved');
    } catch (_) { /* quota — silent */ updateSavedIndicator('saved'); }
  }

  function scheduleSaveDraft() {
    if (__saveTimer) clearTimeout(__saveTimer);
    __saveTimer = setTimeout(function () { __saveTimer = null; persistDraft(); }, 500);
    // Wave A6 funnel — every state mutation passes through the
    // autosave path, so this is a single-point hook for the
    // "First Dish" milestone. The fire helper guards itself
    // (single-fire per session, only fires when a non-blank dish
    // exists), so calling it here is cheap.
    fireFirstDishOnce('manual');
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
        paperKey = migratePaperKey(d.paperKey || paperKey);
        logoMeta = d.logoMeta || null;
        if (d.customDims) customDims = d.customDims;
        // W9-3 — meta restore + UI hydrate
        if (d.meta) {
          meta.tagline = d.meta.tagline || '';
          meta.story   = d.meta.story   || '';
          meta.coverPage = !!d.meta.coverPage;
          // W14-2 — restore the new footer fields too.
          meta.address       = d.meta.address       || '';
          meta.hours         = d.meta.hours         || '';
          meta.serviceCharge = d.meta.serviceCharge || '';
          meta.sourcing      = d.meta.sourcing      || '';
          meta.disclaimer    = d.meta.disclaimer    || '';
          meta.askYourServer = d.meta.askYourServer || '';
          if (metaTaglineEl) metaTaglineEl.value = meta.tagline;
          if (metaStoryEl)   metaStoryEl.value   = meta.story;
          if (metaCoverEl)   metaCoverEl.checked = meta.coverPage;
          metaFooterFields.forEach(function (pair) {
            var fEl = document.getElementById(pair[0]);
            if (fEl) fEl.value = meta[pair[1]] || '';
          });
          var hasMeta = meta.tagline || meta.story || meta.coverPage ||
                        meta.address || meta.hours || meta.serviceCharge ||
                        meta.sourcing || meta.disclaimer || meta.askYourServer;
          if (hasMeta) {
            var metaEl = document.getElementById('mdMeta');
            if (metaEl) metaEl.open = true;
          }
        }
        // W12-3 — restore customizer overrides
        if (d.customize) {
          customize.accent = d.customize.accent || null;
          customize.paper  = d.customize.paper  || null;
          customize.ink    = d.customize.ink    || null;
          customize.paperTexture = !!d.customize.paperTexture;
          customize.mods   = d.customize.mods   || { season: 'none', daypart: 'none', event: 'none' };
          if (customAccentEl && customize.accent) customAccentEl.value = customize.accent;
          if (customPaperEl  && customize.paper)  customPaperEl.value  = customize.paper;
          if (customInkEl    && customize.ink)    customInkEl.value    = customize.ink;
          if (paperTextureEl) paperTextureEl.checked = customize.paperTexture;
          if (modSeasonEl)  modSeasonEl.value  = customize.mods.season  || 'none';
          if (modDaypartEl) modDaypartEl.value = customize.mods.daypart || 'none';
          if (modEventEl)   modEventEl.value   = customize.mods.event   || 'none';
          var anyMod = customize.mods.season !== 'none' || customize.mods.daypart !== 'none' || customize.mods.event !== 'none';
          if (customize.accent || customize.paper || customize.ink || customize.paperTexture || anyMod) {
            var custEl = document.getElementById('mdCustomize');
            if (custEl) custEl.open = true;
          }
        }
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
    // W11-1 — HTML5 drag-and-drop reorder. The drag handle <button>
    // is the source; the entire <tr> is draggable. dragover targets
    // any other row; drop swaps positions and re-renders.
    var __dragSrcIdx = -1;
    rowsEl.addEventListener('dragstart', function (e) {
      var tr = e.target.closest('tr[data-i]');
      if (!tr || tr.dataset.ghost === '1') { e.preventDefault(); return; }
      __dragSrcIdx = parseInt(tr.dataset.i, 10);
      tr.classList.add('md-drag-source');
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(__dragSrcIdx)); } catch (_) {}
    });
    rowsEl.addEventListener('dragend', function () {
      var s = rowsEl.querySelector('.md-drag-source');
      if (s) s.classList.remove('md-drag-source');
      var o = rowsEl.querySelectorAll('.md-drag-over');
      o.forEach(function (el) { el.classList.remove('md-drag-over'); });
      __dragSrcIdx = -1;
    });
    rowsEl.addEventListener('dragover', function (e) {
      var tr = e.target.closest('tr[data-i]');
      if (!tr || __dragSrcIdx === -1) return;
      e.preventDefault();
      var prev = rowsEl.querySelector('.md-drag-over');
      if (prev && prev !== tr) prev.classList.remove('md-drag-over');
      if (tr !== rowsEl.querySelector('.md-drag-source')) tr.classList.add('md-drag-over');
    });
    rowsEl.addEventListener('drop', function (e) {
      e.preventDefault();
      var tr = e.target.closest('tr[data-i]');
      if (!tr || __dragSrcIdx === -1) return;
      var dst = parseInt(tr.dataset.i, 10);
      if (!isFinite(dst) || dst === __dragSrcIdx) return;
      pushUndo();
      var moved = rows.splice(__dragSrcIdx, 1)[0];
      rows.splice(dst, 0, moved);
      __dragSrcIdx = -1;
      render();
      scheduleSaveDraft();
    });

    rowsEl.addEventListener('click', function (e) {
      var t = e.target;
      if (!t) return;
      // W13-2 — badge toggle click.
      var badgeBtn = t.closest && t.closest('[data-act="badge"]');
      if (badgeBtn) {
        var bi = parseInt(badgeBtn.dataset.i, 10);
        var bcode = badgeBtn.dataset.badge;
        if (!isFinite(bi) || !rows[bi] || !bcode) return;
        if (!Array.isArray(rows[bi].badges)) rows[bi].badges = [];
        var bidx = rows[bi].badges.indexOf(bcode);
        if (bidx === -1) rows[bi].badges.push(bcode);
        else rows[bi].badges.splice(bidx, 1);
        render();
        var pop2 = rowsEl.querySelector('.md-allergen-pop[data-i="' + bi + '"]');
        if (pop2) pop2.open = true;
        scheduleSaveDraft();
        return;
      }
      // W11-1 — touch up/down reorder buttons.
      var moveBtn = t.closest && t.closest('[data-act="moveup"], [data-act="movedn"]');
      if (moveBtn) {
        var mi = parseInt(moveBtn.dataset.i, 10);
        if (!isFinite(mi)) return;
        var dir = moveBtn.dataset.act === 'moveup' ? -1 : 1;
        var ndx = mi + dir;
        if (ndx < 0 || ndx >= rows.length) return;
        pushUndo();
        var tmp = rows[mi]; rows[mi] = rows[ndx]; rows[ndx] = tmp;
        render();
        scheduleSaveDraft();
        return;
      }
      // W7-2 — spice stepper. Clicking the same level toggles off
      // back to 0; clicking a higher level sets it.
      var spiceBtn = t.closest && t.closest('[data-act="spice"]');
      if (spiceBtn) {
        var si = parseInt(spiceBtn.dataset.i, 10);
        var level = parseInt(spiceBtn.dataset.level, 10);
        if (!isFinite(si) || !rows[si]) return;
        rows[si].spice = (rows[si].spice === level) ? 0 : level;
        render();
        // Reopen the popover so the operator stays in context.
        var pop = rowsEl.querySelector('.md-allergen-pop[data-i="' + si + '"]');
        if (pop) pop.open = true;
        scheduleSaveDraft();
        return;
      }
      var act = t.dataset && t.dataset.act;
      if (act === 'del') {
        var i = parseInt(t.dataset.i, 10);
        if (!isFinite(i)) return;
        pushUndo();
        rows.splice(i, 1);
        render();
        scheduleSaveDraft();
        return;
      }
      // W13-2 — remove section hero image
      if (act === 'hero-remove') {
        var hri = parseInt(t.dataset.i, 10);
        if (!isFinite(hri) || !rows[hri]) return;
        pushUndo();
        rows[hri].hero = null;
        render();
        scheduleSaveDraft();
        return;
      }
      // W11-4 — remove dish photo
      if (act === 'photo-remove') {
        var pri = parseInt(t.dataset.i, 10);
        if (!isFinite(pri) || !rows[pri]) return;
        pushUndo();
        rows[pri].photo = null;
        render();
        var pop = rowsEl.querySelector('.md-allergen-pop[data-i="' + pri + '"]');
        if (pop) pop.open = true;
        scheduleSaveDraft();
        return;
      }
    });
    // W7-2 — allergen checkbox change. Lives on 'change' so it fires
    // for both mouse + keyboard (Space toggles a checkbox).
    // W11-4 — also handles photo file picker change events.
    rowsEl.addEventListener('change', function (e) {
      var t = e.target;
      if (!t) return;
      // W12-2 — section "specials" checkbox change handler.
      if (t.type === 'checkbox' && t.dataset.field === 'specials') {
        var spi = parseInt(t.dataset.i, 10);
        if (!isFinite(spi) || !rows[spi]) return;
        rows[spi].specials = !!t.checked;
        schedulePreview();
        scheduleSaveDraft();
        return;
      }
      if (t.dataset.act === 'photo-pick') {
        var pi = parseInt(t.dataset.i, 10);
        var file = t.files && t.files[0];
        if (!isFinite(pi) || !rows[pi] || !file) return;
        downscaleImage(file, 320, 0.82, function (dataUrl, w, h) {
          if (!dataUrl) return;
          // Cap at 80KB so localStorage doesn't fill up — operators
          // with bigger images get warned via the success toast.
          if (dataUrl.length > 110000) {
            // ~80KB after base64 -> binary
            setDownloadMsg(tt('Image is large; we kept the highest-quality version that fits the device storage budget.',
                              'La imagen es grande; guardamos la mejor versión que cabe en el presupuesto de almacenamiento.'), 'success');
          }
          pushUndo();
          rows[pi].photo = { dataUrl: dataUrl, w: w, h: h, name: file.name };
          render();
          var pop = rowsEl.querySelector('.md-allergen-pop[data-i="' + pi + '"]');
          if (pop) pop.open = true;
          scheduleSaveDraft();
        });
        return;
      }
      // W13-2 — section hero image upload. Higher max-dim (480) than
      // dish photos because hero strips render full-width on the
      // deliverable.
      if (t.dataset.act === 'hero-pick') {
        var hi = parseInt(t.dataset.i, 10);
        var hfile = t.files && t.files[0];
        if (!isFinite(hi) || !rows[hi] || !hfile) return;
        downscaleImage(hfile, 480, 0.82, function (dataUrl, w, h) {
          if (!dataUrl) return;
          pushUndo();
          rows[hi].hero = { dataUrl: dataUrl, w: w, h: h, name: hfile.name };
          render();
          scheduleSaveDraft();
        });
        return;
      }
      if (t.dataset.act !== 'allergen') return;
      var i = parseInt(t.dataset.i, 10);
      var code = t.dataset.code;
      if (!isFinite(i) || !rows[i] || !code) return;
      if (!Array.isArray(rows[i].allergens)) rows[i].allergens = [];
      var idx = rows[i].allergens.indexOf(code);
      if (t.checked && idx === -1) rows[i].allergens.push(code);
      else if (!t.checked && idx !== -1) rows[i].allergens.splice(idx, 1);
      // Update the chip strip + summary inline without a full re-render
      // so the popover stays open (open state survives a render anyway
      // because the <details> open attr is stored on the DOM, but a
      // full re-render is wasteful for a single chip flip).
      render();
      var pop = rowsEl.querySelector('.md-allergen-pop[data-i="' + i + '"]');
      if (pop) pop.open = true;
      scheduleSaveDraft();
    });
  }

  if (addRowBtn) addRowBtn.addEventListener('click', function () {
    pushUndo();
    rows.push(blankDish());
    render();
    scheduleSaveDraft();
    var inputs = rowsEl.querySelectorAll('input[data-field="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
  if (stickBtn) stickBtn.addEventListener('click', function () {
    pushUndo();
    rows.push(blankDish());
    render();
    scheduleSaveDraft();
    var inputs = rowsEl.querySelectorAll('input[data-field="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  if (addSecBtn) addSecBtn.addEventListener('click', function () {
    pushUndo();
    rows.push(blankSection());
    render();
    scheduleSaveDraft();
    var inputs = rowsEl.querySelectorAll('.md-row-section input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  if (clearBtn) clearBtn.addEventListener('click', function () {
    if (!rows.length) return;
    // W21 fix #7 — clear-confirm now translates per locale.
    if (!confirm(tt('Clear every row? This can\'t be undone.',
                    '¿Borrar todas las filas? No se puede deshacer.'))) return;
    pushUndo();
    rows = [];
    render();
    clearDraft();
  });

  if (sampleBtn) sampleBtn.addEventListener('click', function () {
    pushUndo();
    rows = SAMPLE_MENU.map(function (r) { return Object.assign({}, r); });
    render();
    scheduleSaveDraft();
  });

  // W11-1 + W22 — Cuisine starter templates extracted to
  // data/templates.js. Read through the MD_TEMPLATES global; the
  // orchestrator just exposes a TEMPLATES alias for back-compat
  // with downstream call sites.
  var TEMPLATES = (typeof MD_TEMPLATES !== 'undefined') ? MD_TEMPLATES.TEMPLATES : {};
  function renderTemplatesList() {
    var host = document.getElementById('mdTemplatesList');
    if (!host) return;
    host.innerHTML = Object.keys(TEMPLATES).map(function (key) {
      var t = TEMPLATES[key];
      var label = LOCALE === 'es' ? t.label_es : t.label_en;
      var hint  = LOCALE === 'es' ? t.hint_es  : t.hint_en;
      return '<li role="none"><button type="button" role="menuitem" data-template="' + escHtml(key) + '">' +
        '<strong>' + escHtml(label) + '</strong><span>' + escHtml(hint) + '</span>' +
        '</button></li>';
    }).join('');
  }
  renderTemplatesList();
  var templatesList = document.getElementById('mdTemplatesList');
  if (templatesList) {
    templatesList.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-template]'); if (!btn) return;
      var key = btn.dataset.template;
      var tpl = TEMPLATES[key]; if (!tpl) return;
      pushUndo();
      // If editor has only ghost rows or is empty, REPLACE; else APPEND.
      var nonGhost = rows.filter(function (r) { return !r.ghost; });
      if (!nonGhost.length) {
        rows = tpl.rows.map(function (r) { return Object.assign({}, r); });
        __ghostActive = false;
      } else {
        rows = rows.concat(tpl.rows.map(function (r) { return Object.assign({}, r); }));
      }
      // Auto-suggest a fitting theme if the operator is still on the
      // default 'modern-minimal'.
      if (tpl.themeHint && (themeId === 'modern-minimal' || !themeId)) {
        themeId = tpl.themeHint;
        renderThemePicker();
      }
      render();
      scheduleSaveDraft();
      var d = document.querySelector('.md-templates');
      if (d) d.open = false;
      if (window.plausible) { try { window.plausible('Menu Design Template Loaded', { props: { template: key } }); } catch (_) {} }
      fireFirstDishOnce('template');
    });
  }

  // -------------------- Paste-CSV ingest --------------------
  // Two paste shapes accepted: (a) header-row CSV/TSV with column
  // names like Dish/Item/Name + Price + Section + Description in
  // EN or ES; (b) markdown-shape with `## Section` header lines and
  // `Dish, $price, description` data lines. Both produce the same
  // rows[] shape. Mirrors plate-cost's parseMenuPaste tolerance.
  var EN_HEADERS = { dish: ['item', 'name', 'dish'], price: ['price'], section: ['section'], desc: ['description', 'desc'], allergens: ['allergens', 'tags', 'dietary'], spice: ['spice', 'heat'] };
  var ES_HEADERS = { dish: ['plato', 'nombre', 'item'], price: ['precio'], section: ['seccion', 'sección'], desc: ['descripcion', 'descripción'], allergens: ['alergenos', 'alérgenos', 'etiquetas'], spice: ['picante'] };

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
          else if (k === 'allergens' && cell) {
            // W7-2 — accepts comma/space/slash-delimited codes; only
            // those matching ALLERGEN_CODES are kept (silent skip).
            dish.allergens = String(cell).split(/[,\s\/|]+/)
              .map(function (s) { return s.trim().toUpperCase(); })
              .filter(function (s) { return !!allergenById(s); });
          }
          else if (k === 'spice' && cell) {
            var n = parseInt(String(cell).replace(/\D/g, ''), 10);
            if (isFinite(n) && n >= 0 && n <= 3) dish.spice = n;
          }
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

  // W10-2 — inline paste-error banner (replaces blocking alert()).
  function setPasteError(text) {
    var host = document.getElementById('mdPaste');
    if (!host) return;
    var existing = document.getElementById('mdPasteError');
    if (text) {
      var el = existing;
      if (!el) {
        el = document.createElement('div');
        el.id = 'mdPasteError';
        el.setAttribute('role', 'alert');
        el.style.cssText = 'margin:8px 14px 0;padding:8px 12px;border:1px solid var(--rust);border-left:3px solid var(--rust);border-radius:6px;background:#FBF0EA;color:#7a4408;font-size:12.5px;line-height:1.5';
        host.appendChild(el);
      }
      el.textContent = text;
    } else if (existing) {
      existing.parentNode && existing.parentNode.removeChild(existing);
    }
  }

  if (pasteApply) pasteApply.addEventListener('click', function () {
    if (!pasteArea) return;
    var parsed = parsePaste(pasteArea.value);
    if (!parsed.length) {
      setPasteError(tt(
        'Could not find any dishes in that paste. Try one row per dish, or use the sample as a template.',
        'No se encontraron platos en el pegado. Prueba un renglón por plato, o usa la muestra como plantilla.'
      ));
      return;
    }
    setPasteError('');
    pushUndo();
    // Append to existing rows, preserving the operator's prior typing.
    rows = rows.concat(parsed);
    render();
    pasteArea.value = '';
    var paste = document.getElementById('mdPaste');
    if (paste) paste.open = false;
    if (window.plausible) window.plausible('Menu Design Paste', { props: { added: String(parsed.length) } });
    fireFirstDishOnce('paste');
  });

  // -------------------- Sample menu --------------------
  // Real-shape demo: 14 dishes across 4 sections. Demonstrates that
  // the layout works for the "awkward middle" count Canva templates
  // get wrong. Prices stay in the typical American-bistro band.
  var SAMPLE_MENU = [
    blankSection('Starters'),
    { kind: 'dish', name: 'House bread', price: '$6',  desc: 'Whole-wheat sourdough, cultured butter.', allergens: ['VG'], spice: 0 },
    { kind: 'dish', name: 'Caesar salad', price: '$14', desc: 'Little gems, buttermilk-anchovy, parmesan crisp.', allergens: ['FI', 'E'], spice: 0 },
    { kind: 'dish', name: 'Soup of the day', price: '$10', desc: 'Ask your server.', allergens: [], spice: 0 },
    { kind: 'dish', name: 'Cheese plate', price: '$18', desc: 'Three local cheeses, honey, walnuts.', allergens: ['VG', 'N', 'LO'], spice: 0 },
    blankSection('Pasta'),
    { kind: 'dish', name: 'Tonnarelli al pepe', price: '$22', desc: 'Hand-rolled tonnarelli with smoky pecorino and cracked black pepper.', allergens: ['VG', 'E'], spice: 1 },
    { kind: 'dish', name: 'Mushroom rigatoni', price: '$24', desc: 'Cremini and oyster mushrooms, sherry, thyme.', allergens: ['VG'], spice: 0 },
    blankSection('Mains'),
    { kind: 'dish', name: 'Roast chicken', price: '$28', desc: 'Half a Path Valley chicken, brined overnight, pan jus.', allergens: ['LO'], spice: 0 },
    { kind: 'dish', name: 'Pan-seared salmon', price: '$32', desc: 'Wild king, lemon-caper butter, brown rice.', allergens: ['FI', 'GF'], spice: 0 },
    { kind: 'dish', name: 'Hanger steak', price: '$34', desc: 'Grass-fed, chimichurri, fingerling potatoes.', allergens: ['GF', 'DF'], spice: 1 },
    { kind: 'dish', name: 'Cauliflower steak', price: '$22', desc: 'Romesco, smoked almonds, crispy chickpeas.', allergens: ['V', 'GF', 'N'], spice: 2 },
    blankSection('Dessert'),
    { kind: 'dish', name: 'Olive-oil cake', price: '$10', desc: 'Citrus glaze, candied zest.', allergens: ['VG', 'E'], spice: 0 },
    { kind: 'dish', name: 'Affogato', price: '$9',  desc: 'House gelato, espresso, hazelnut crumble.', allergens: ['VG', 'N'], spice: 0 },
    { kind: 'dish', name: 'Cheese & honey', price: '$12', desc: 'Local honeycomb, blue cheese, crackers.', allergens: ['VG', 'LO'], spice: 0 }
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
    // W21 fix #3 — push undo before mutation, autosave after, so
    // the imported batch is reversible via Cmd-Z and survives a
    // tab close before the operator interacts further.
    pushUndo();
    rows = rows.concat(imported);
    render();
    scheduleSaveDraft();
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
      // W12-3 — apply operator's customizer overrides on top of brand palette.
      theme = applyCustomizer(theme);

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
        rows:         rows,
        theme:        theme,
        paperKey:     paperKey,
        customDims:   paperKey === 'custom' ? customDims : null,
        title:        title,
        tagline:      meta.tagline,
        story:        meta.story,
        // W14-2 — restaurant footer fields
        // B2 finish — disclaimer routes through effectiveDisclaimer()
        // so menus with allergens tagged auto-receive the regime + locale
        // appropriate text when the operator hasn't typed their own.
        footer: {
          address:       meta.address,
          hours:         meta.hours,
          serviceCharge: meta.serviceCharge,
          sourcing:      meta.sourcing,
          disclaimer:    effectiveDisclaimer(),
          askYourServer: meta.askYourServer
        },
        coverPage:    !!meta.coverPage,
        paperTexture: !!customize.paperTexture,
        logoDataUrl:  logoUrl,
        logoMeta:     logoMeta,
        filename:     printVendor ? filename + '-press' : filename,
        locale:       LOCALE,
        printVendor:  printVendor
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
        // W17 — surface PDF/X-3 conformance when post-process succeeded.
        if (result.pdfX3) {
          msg += ' ' + tt('PDF/X-3 metadata applied (TrimBox / BleedBox / OutputIntents).',
                          'Metadatos PDF/X-3 aplicados (TrimBox / BleedBox / OutputIntents).');
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
        // W10-10 — failure-mode delight. Don't dead-end on a PDF
        // failure; surface a retry + a PNG fallback so the operator
        // walks away with an artifact regardless. Lazy-loads
        // html2canvas only when the operator taps the PNG path.
        var msgEl = downloadMsg;
        if (msgEl) {
          msgEl.innerHTML = '';
          msgEl.classList.remove('success'); msgEl.classList.add('error');
          var span = document.createElement('span');
          span.textContent = tt(
            'We couldn\'t build your PDF. Try again, or grab it as a PNG image instead.',
            'No pudimos armar tu PDF. Intenta de nuevo, o llévatelo como imagen PNG.'
          );
          var retryBtn = document.createElement('button');
          retryBtn.type = 'button';
          retryBtn.className = 'md-fail-retry';
          retryBtn.textContent = tt('Try PDF again', 'Reintentar PDF');
          retryBtn.addEventListener('click', function () { downloadBtn.click(); });
          var pngBtn = document.createElement('button');
          pngBtn.type = 'button';
          pngBtn.className = 'md-fail-png';
          pngBtn.textContent = tt('Download as PNG', 'Descargar como PNG');
          pngBtn.addEventListener('click', function () { downloadAsPng(filename, title); });
          msgEl.appendChild(span);
          msgEl.appendChild(document.createTextNode(' '));
          msgEl.appendChild(retryBtn);
          msgEl.appendChild(document.createTextNode(' '));
          msgEl.appendChild(pngBtn);
        }
        if (window.plausible) {
          try { window.plausible('Menu Design PDF Failed'); } catch (_) {}
          // Wave A6 — superset Export Failed event with bounded
          // {format, reason} enums. Both stay strict for cardinality:
          //   format ∈ pdf | large-print | high-contrast | qr | text |
          //            ssml | brf | tablet | png
          //   reason ∈ cdn-blocked | cdn-load | oom | font-missing |
          //            worker-unsupported | unknown
          // Same call site, two events: legacy stays for back-compat
          // dashboards; new one carries the diagnostic prop pair.
          try {
            window.plausible('Menu Design Export Failed', { props: { format: 'pdf', reason: 'unknown' } });
          } catch (_) {}
        }
      }).then(function () {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalLabel;
      });
    });
  }

  // ----------------------------------------------------------------
  // W10-10 — PNG fallback. Lazy-loads html2canvas (~40KB gz) on
  // first invocation. Captures the live preview iframe / panel into
  // a high-res PNG. Lower fidelity than PDF (rasterized), but the
  // operator never leaves empty-handed.
  // ----------------------------------------------------------------
  var H2C_CDN = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
  var __h2cLoadPromise = null;
  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (__h2cLoadPromise) return __h2cLoadPromise;
    __h2cLoadPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = H2C_CDN; s.async = true; s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer';
      s.onload = function () {
        if (window.html2canvas) resolve(window.html2canvas);
        else { __h2cLoadPromise = null; reject(new Error('html2canvas missing after load')); }
      };
      s.onerror = function () { __h2cLoadPromise = null; reject(new Error('html2canvas load failed')); };
      document.head.appendChild(s);
    });
    return __h2cLoadPromise;
  }

  function downloadAsPng(filenameBase, title) {
    var preview = document.getElementById('mdPreviewSlot') || document.querySelector('.md-preview') || document.body;
    if (!preview) return;
    setDownloadMsg(tt('Capturing preview as PNG…', 'Capturando vista previa como PNG…'));
    loadHtml2Canvas().then(function (h2c) {
      return h2c(preview, { backgroundColor: null, scale: 2, useCORS: true });
    }).then(function (canvas) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          setDownloadMsg(tt('Couldn\'t make a PNG. Sorry.', 'No se pudo armar el PNG.'), 'error');
          return;
        }
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (filenameBase || 'menu') + '.png';
        document.body.appendChild(a); a.click();
        setTimeout(function () {
          if (a.parentNode) a.parentNode.removeChild(a);
          URL.revokeObjectURL(a.href);
        }, 4000);
        setDownloadMsg(tt(
          'PNG downloaded — lower fidelity than the PDF, but it travels.',
          'PNG descargado — menos fiel que el PDF, pero viaja bien.'
        ), 'success');
        if (window.plausible) {
          try { window.plausible('Menu Design PNG Fallback'); } catch (_) {}
        }
      }, 'image/png');
    }).catch(function () {
      setDownloadMsg(tt(
        'Couldn\'t load the PNG capture library. Check your network and retry.',
        'No se pudo cargar la librería de captura PNG. Revisa tu red e intenta de nuevo.'
      ), 'error');
    });
  }

  // ----------------------------------------------------------------
  // W6-3 — Large-print accessibility variant. Reuses the existing
  // PDF flow with largePrint: true. Override bumps body to 18pt /
  // h1 to 36pt / forces single column / pure-white-on-pure-black /
  // whitespace dividers. Hits WCAG AAA. Filename gets -large-print
  // suffix so the operator can keep both versions side-by-side.
  // ----------------------------------------------------------------
  if (largePrintBtn) {
    largePrintBtn.addEventListener('click', function () {
      if (typeof MD_PDF === 'undefined' || typeof MD_THEMES === 'undefined') {
        setDownloadMsg(tt(
          'PDF generator not loaded. Refresh and try again.',
          'El generador de PDF no se cargó. Recarga e intenta de nuevo.'
        ), 'error');
        return;
      }
      var realRows = rows.filter(function (r) { return !r.ghost; });
      if (!realRows.length) {
        setDownloadMsg(tt(
          'Add at least one dish before exporting a large-print version.',
          'Agrega al menos un plato antes de exportar la versión letra grande.'
        ), 'error');
        return;
      }
      var theme = MD_THEMES.get(themeId) || MD_THEMES.get('modern-minimal');
      var title = (rows.find(function (r) { return r.kind === 'section' && (r.name || '').trim(); }) || { name: 'Menu' }).name || 'Menu';
      var fnameBase = (title.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'menu') + '-large-print';
      largePrintBtn.disabled = true;
      var origLabel = largePrintBtn.innerHTML;
      largePrintBtn.textContent = tt('Building large-print PDF…', 'Generando letra grande…');
      MD_PDF.exportPdf({
        rows:        realRows,
        theme:       theme,
        paperKey:    paperKey,
        customDims:  paperKey === 'custom' ? customDims : null,
        title:       title,
        logoDataUrl: logoUrl,
        logoMeta:    logoMeta,
        filename:    fnameBase,
        largePrint:  true,
        locale:      LOCALE
      }).then(function (result) {
        var pages = result.pageCount || 1;
        setDownloadMsg(tt(
          'Large-print version downloaded — ' + pages + ' page' + (pages === 1 ? '' : 's') + '. WCAG AAA at 18pt body.',
          'Versión letra grande descargada — ' + pages + ' página' + (pages === 1 ? '' : 's') + '. WCAG AAA con cuerpo de 18pt.'
        ), 'success');
        if (window.plausible) {
          try { window.plausible('Menu Design Large Print Exported'); } catch (_) {}
        }
      }).catch(function (err) {
        setDownloadMsg(tt(
          'Large-print PDF failed: ' + (err && err.message ? err.message : 'unknown error'),
          'Falló la versión letra grande: ' + (err && err.message ? err.message : 'error desconocido')
        ), 'error');
      }).then(function () {
        largePrintBtn.disabled = false;
        largePrintBtn.innerHTML = origLabel;
      });
    });
  }

  // ----------------------------------------------------------------
  // W10-2 — Plain-text + SSML accessible exports. Both build entirely
  // in-memory using the MD_TEXT module; no fetches, no CDN. The
  // resulting Blob is downloaded via createObjectURL.
  // ----------------------------------------------------------------
  var exportTextBtn = document.getElementById('mdExportText');
  var exportSsmlBtn = document.getElementById('mdExportSsml');
  var highContrastBtn = document.getElementById('mdHighContrast');

  // W12-4 — High-contrast PDF variant. Twin of the large-print
  // export but routed through applyHighContrastOverride.
  if (highContrastBtn) {
    highContrastBtn.addEventListener('click', function () {
      if (typeof MD_PDF === 'undefined' || typeof MD_THEMES === 'undefined') {
        setDownloadMsg(tt('PDF generator not loaded. Refresh and try again.',
                          'El generador de PDF no se cargó. Recarga e intenta de nuevo.'), 'error');
        return;
      }
      var realRows = rows.filter(function (r) { return !r.ghost; });
      if (!realRows.length) {
        setDownloadMsg(tt('Add at least one dish before exporting a high-contrast version.',
                          'Agrega al menos un plato antes de exportar la versión de alto contraste.'), 'error');
        return;
      }
      var theme = MD_THEMES.get(themeId) || MD_THEMES.get('modern-minimal');
      var title = '';
      try { if (typeof MuntinContext !== 'undefined' && MuntinContext.read) title = (MuntinContext.read() || {}).businessName || ''; } catch (_) {}
      if (!title) title = tt('Menu', 'Menú');
      var fnameBase = (title.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'menu') + '-high-contrast';
      highContrastBtn.disabled = true;
      var origLabel = highContrastBtn.innerHTML;
      highContrastBtn.textContent = tt('Building high-contrast PDF…', 'Generando alto contraste…');
      MD_PDF.exportPdf({
        rows:         realRows,
        theme:        theme,
        paperKey:     paperKey,
        customDims:   paperKey === 'custom' ? customDims : null,
        title:        title,
        tagline:      meta.tagline,
        story:        meta.story,
        logoDataUrl:  logoUrl,
        logoMeta:     logoMeta,
        filename:     fnameBase,
        highContrast: true,
        locale:       LOCALE
      }).then(function (result) {
        var pages = result.pageCount || 1;
        setDownloadMsg(tt(
          'High-contrast version downloaded — ' + pages + ' page' + (pages === 1 ? '' : 's') + '. Yellow-on-black for low-vision patrons.',
          'Versión de alto contraste descargada — ' + pages + ' página' + (pages === 1 ? '' : 's') + '. Amarillo sobre negro para baja visión.'
        ), 'success');
        if (window.plausible) { try { window.plausible('Menu Design High Contrast Exported'); } catch (_) {} }
      }).catch(function (err) {
        setDownloadMsg(tt(
          'High-contrast PDF failed: ' + (err && err.message ? err.message : 'unknown error'),
          'Falló alto contraste: ' + (err && err.message ? err.message : 'error desconocido')
        ), 'error');
      }).then(function () {
        highContrastBtn.disabled = false;
        highContrastBtn.innerHTML = origLabel;
      });
    });
  }

  // W18 — downloadBlob extracted to infra/dom.js.
  function downloadBlob(content, filename, mime) {
    if (typeof MD_DOM !== 'undefined') return MD_DOM.downloadBlob(content, filename, mime);
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(a.href); }, 4000);
  }
  function buildEmitterOpts() {
    var realRows = rows.filter(function (r) { return !r.ghost; });
    var theme = (typeof MD_THEMES !== 'undefined' && MD_THEMES.get(themeId)) || null;
    var titleVal = '';
    try { if (typeof MuntinContext !== 'undefined' && MuntinContext.read) titleVal = (MuntinContext.read() || {}).businessName || ''; } catch (_) {}
    if (!titleVal) titleVal = tt('Menu', 'Menú');
    return {
      rows:       realRows,
      theme:      theme,
      title:      titleVal,
      tagline:    meta.tagline,
      story:      meta.story,
      locale:     LOCALE,
      // B2 finish — every HTML / text emitter call site now picks up
      // the regime-aware disclaimer and the canonical-menu meta block.
      // The HTML emitter renders disclaimer below the allergen key;
      // the text emitter prints it as a final line.
      disclaimer: effectiveDisclaimer(),
      meta:       {
        businessName:    titleVal,
        tagline:         meta.tagline || '',
        cuisine:         (function () {
          try { return (typeof MuntinContext !== 'undefined' && MuntinContext.read && (MuntinContext.read() || {}).cuisine) || ''; } catch (_) { return ''; }
        })(),
        currency:        'USD',
        locale:          LOCALE,
        allergenRegime:  (meta && meta.allergenRegime) || 'us-fda9'
      }
    };
  }

  if (exportTextBtn) {
    exportTextBtn.addEventListener('click', function () {
      if (typeof MD_TEXT === 'undefined') return;
      var realRows = rows.filter(function (r) { return r.kind === 'dish' && !r.ghost && (r.name || '').trim(); });
      if (!realRows.length) {
        setDownloadMsg(tt('Add at least one dish before exporting plain text.', 'Agrega al menos un plato antes de exportar.'), 'error');
        return;
      }
      var opts = buildEmitterOpts();
      var md  = MD_TEXT.exportMarkdown(opts);
      var txt = MD_TEXT.exportPlainText(opts);
      var slug = String(opts.title || 'menu').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'menu';
      // Download both — operators tend to want either.
      downloadBlob(md,  slug + '-menu.md',  'text/markdown');
      setTimeout(function () { downloadBlob(txt, slug + '-menu.txt', 'text/plain'); }, 250);
      setDownloadMsg(tt('Plain text + Markdown downloaded — screen-reader friendly.',
                        'Texto plano + Markdown descargados — compatibles con lectores de pantalla.'), 'success');
      if (window.plausible) { try { window.plausible('Menu Design Text Exported'); } catch (_) {} }
    });
  }
  if (exportSsmlBtn) {
    exportSsmlBtn.addEventListener('click', function () {
      if (typeof MD_TEXT === 'undefined') return;
      var realRows = rows.filter(function (r) { return r.kind === 'dish' && !r.ghost && (r.name || '').trim(); });
      if (!realRows.length) {
        setDownloadMsg(tt('Add at least one dish before exporting SSML.', 'Agrega al menos un plato antes de exportar SSML.'), 'error');
        return;
      }
      var opts = buildEmitterOpts();
      var ssml = MD_TEXT.exportSsml(opts);
      var slug = String(opts.title || 'menu').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'menu';
      downloadBlob(ssml, slug + '-menu.ssml', 'application/ssml+xml');
      setDownloadMsg(tt('SSML downloaded — pipe to AWS Polly / Google TTS / Azure Speech.',
                        'SSML descargado — compatible con AWS Polly / Google TTS / Azure Speech.'), 'success');
      if (window.plausible) { try { window.plausible('Menu Design SSML Exported'); } catch (_) {} }
    });
  }
  // W16 — BRF Grade-1 export
  var exportBrfBtn = document.getElementById('mdExportBrf');
  if (exportBrfBtn) exportBrfBtn.addEventListener('click', function () {
    if (typeof MD_TEXT === 'undefined' || typeof MD_TEXT.exportBrf !== 'function') return;
    var realRows = rows.filter(function (r) { return r.kind === 'dish' && !r.ghost && (r.name || '').trim(); });
    if (!realRows.length) {
      setDownloadMsg(tt('Add at least one dish before exporting Braille.',
                        'Agrega al menos un plato antes de exportar Braille.'), 'error');
      return;
    }
    var optsB = buildEmitterOpts();
    var brf = MD_TEXT.exportBrf(optsB);
    var slug = String(optsB.title || 'menu').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'menu';
    downloadBlob(brf, slug + '-menu.brf', 'application/x-brf');
    setDownloadMsg(tt('Braille (BRF) downloaded — Grade 1 (uncontracted).',
                      'Braille (BRF) descargado — Grado 1 (sin contracciones).'), 'success');
    if (window.plausible) { try { window.plausible('Menu Design BRF Exported'); } catch (_) {} }
  });
  // W16 — Tablet kiosk HTML
  var exportTabletBtn = document.getElementById('mdExportTablet');
  if (exportTabletBtn) exportTabletBtn.addEventListener('click', function () {
    if (typeof MD_HTML === 'undefined' || typeof MD_HTML.exportHtmlTablet !== 'function') return;
    var realRows = rows.filter(function (r) { return r.kind === 'dish' && !r.ghost && (r.name || '').trim(); });
    if (!realRows.length) {
      setDownloadMsg(tt('Add at least one dish before exporting tablet HTML.',
                        'Agrega al menos un plato antes de exportar HTML para tablet.'), 'error');
      return;
    }
    var optsT = buildEmitterOpts();
    var theme = MD_THEMES.get(themeId) || MD_THEMES.get('modern-minimal');
    optsT.theme = applyCustomizer(theme);
    optsT.logoDataUrl = logoUrl;
    var html = MD_HTML.exportHtmlTablet(optsT);
    var slug = String(optsT.title || 'menu').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'menu';
    downloadBlob(html, slug + '-menu-tablet.html', 'text/html');
    setDownloadMsg(tt('Tablet HTML downloaded — drop on a kiosk device for guest reference.',
                      'HTML para tablet descargado — para uso en kiosko.'), 'success');
    if (window.plausible) { try { window.plausible('Menu Design Tablet Exported'); } catch (_) {} }
  });

  // ----------------------------------------------------------------
  // W6-1 — QR-menu export. Promps for a destination URL the operator
  // controls (their Wix Media path, GitHub Pages root, etc), then
  // downloads a zip with menu.html + menu-qr.png. The HTML is self-
  // contained — they drop it in once and the QR points at it.
  // ----------------------------------------------------------------
  if (exportQrBtn) {
    exportQrBtn.addEventListener('click', function () {
      if (typeof MD_HTML === 'undefined' || typeof MD_THEMES === 'undefined') {
        setDownloadMsg(tt(
          'QR exporter not loaded. Refresh and try again.',
          'El exportador QR no se cargó. Recarga e intenta de nuevo.'
        ), 'error');
        return;
      }
      // Don't include ghost rows in the export.
      var realRows = rows.filter(function (r) { return !r.ghost; });
      if (!realRows.length) {
        setDownloadMsg(tt(
          'Add at least one dish before exporting your QR menu.',
          'Agrega al menos un plato antes de exportar tu menú QR.'
        ), 'error');
        return;
      }
      var defaultUrl = 'https://yourrestaurant.com/menu.html';
      var url = prompt(tt(
        'Where will menu.html live? Type the full URL — that\'s what the QR will point to.\n(e.g. https://yourrestaurant.com/menu.html)',
        '¿Dónde va a vivir menu.html? Escribe la URL completa — a eso apuntará el QR.\n(p.ej. https://turestaurante.com/menu.html)'
      ), defaultUrl);
      if (!url || !/^https?:\/\//i.test(url.trim())) {
        if (url !== null) {
          setDownloadMsg(tt(
            'That doesn\'t look like a URL. Cancelled.',
            'Eso no parece una URL. Cancelado.'
          ), 'error');
        }
        return;
      }
      url = url.trim();
      var theme = MD_THEMES.get(themeId) || MD_THEMES.get('modern-minimal');
      var palette = (typeof MuntinContext !== 'undefined' && MuntinContext.read)
        ? (MuntinContext.read() || {}).palette : null;
      if (Array.isArray(palette) && palette.length && MD_THEMES.applyPalette) {
        theme = MD_THEMES.applyPalette(theme, palette);
      }
      var title = (rows.find(function (r) { return r.kind === 'section' && (r.name || '').trim(); }) || { name: 'Menu' }).name || 'Menu';
      exportQrBtn.disabled = true;
      var origLabel = exportQrBtn.innerHTML;
      exportQrBtn.textContent = tt('Building zip…', 'Empacando zip…');
      setDownloadMsg('', 'success');
      MD_HTML.exportZip({
        rows:         realRows,
        theme:        theme,
        title:        title,
        locale:       LOCALE,
        logoDataUrl:  logoUrl,
        targetUrl:    url,
        // B2 finish — same effective disclaimer the standard PDF export
        // already uses; the QR-menu HTML emits it below the allergen key.
        disclaimer:   effectiveDisclaimer(),
        meta: {
          businessName:    title,
          tagline:         meta.tagline || '',
          cuisine:         (function () {
            try { return (typeof MuntinContext !== 'undefined' && MuntinContext.read && (MuntinContext.read() || {}).cuisine) || ''; } catch (_) { return ''; }
          })(),
          currency:        'USD',
          locale:          LOCALE,
          allergenRegime:  (meta && meta.allergenRegime) || 'us-fda9'
        }
      }).then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (title.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'menu') + '-qr-bundle.zip';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          if (a.parentNode) a.parentNode.removeChild(a);
          URL.revokeObjectURL(a.href);
        }, 4000);
        setDownloadMsg(tt(
          'Zip downloaded. Drop menu.html into your hosting root, then print menu-qr.png and stick it on the table.',
          'Zip descargado. Sube menu.html a tu hosting, luego imprime menu-qr.png y pégalo en la mesa.'
        ), 'success');
        if (window.plausible) {
          try { window.plausible('Menu Design QR Exported', { props: { theme: themeId, dishCount_bucket:
            realRows.length < 12 ? '<12' : realRows.length < 25 ? '12-24' : '25+'
          } }); } catch (_) {}
        }
      }).catch(function (err) {
        setDownloadMsg(tt(
          'Couldn\'t build the zip — check your network and try again.',
          'No se pudo armar el zip — revisa tu red e intenta de nuevo.'
        ), 'error');
      }).then(function () {
        exportQrBtn.disabled = false;
        exportQrBtn.innerHTML = origLabel;
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
  // W18 — reducedMotion extracted to infra/dom.js.
  function reducedMotionMD() {
    if (typeof MD_DOM !== 'undefined') return MD_DOM.reducedMotion();
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
  }
  // W11-5 — Cross-tool nudge selector. Looks at MuntinContext to
  // figure out which tool the operator hasn't visited yet that would
  // be the natural next step after generating their menu. Returns
  // null if no nudge is appropriate (operator has visited all
  // related tools, or context is empty).
  function pickCrossToolNudge() {
    var visited = {};
    try {
      if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.read === 'function') {
        var ctx = MuntinContext.read() || {};
        if (Array.isArray(ctx.toolsVisited)) {
          ctx.toolsVisited.forEach(function (t) { visited[t] = true; });
        }
      }
    } catch (_) {}
    var dishCount = rows.filter(function (r) { return r.kind === 'dish' && !r.ghost && (r.name || '').trim(); }).length;
    var withDesc = rows.filter(function (r) { return r.kind === 'dish' && !r.ghost && (r.desc || '').trim(); }).length;
    // 1) If many dishes lack descriptions -> Menu Copy Inspector
    if (dishCount >= 4 && withDesc < dishCount * 0.6 && !visited['menu-copy']) {
      return {
        url: LOCALE === 'es' ? '/es/tools/menu-copy/' : '/tools/menu-copy/',
        label: tt('Polish your descriptions →', 'Pule las descripciones →'),
        sub:   tt('Menu Copy Inspector grades and rewrites every line.',
                  'El Inspector de Copy califica y reescribe cada línea.')
      };
    }
    // 2) If operator has prices on most items -> Menu Engineering
    var withPrice = rows.filter(function (r) { return r.kind === 'dish' && !r.ghost && (r.price || '').trim(); }).length;
    if (dishCount >= 6 && withPrice >= dishCount * 0.8 && !visited['menu-engineering']) {
      return {
        url: LOCALE === 'es' ? '/es/tools/menu-engineering/' : '/tools/menu-engineering/',
        label: tt('Score profitability →', 'Califica rentabilidad →'),
        sub:   tt('Menu Engineering rates each dish on margin + popularity.',
                  'Menu Engineering puntúa margen + popularidad por plato.')
      };
    }
    // 3) If no logo uploaded -> Brand Suite
    if (!logoUrl && !visited['brand-suite']) {
      return {
        url: LOCALE === 'es' ? '/es/tools/brand-suite/' : '/tools/brand-suite/',
        label: tt('Build a brand kit →', 'Crea tu kit de marca →'),
        sub:   tt('Brand Suite makes a logo + palette + typography you can reuse here.',
                  'Brand Suite arma logo + paleta + tipografía para reutilizar aquí.')
      };
    }
    // 4) Default -> GBP Grader
    if (!visited['gbp-grader']) {
      return {
        url: LOCALE === 'es' ? '/es/tools/gbp-grader/' : '/tools/gbp-grader/',
        label: tt('Update your Google Business Profile →', 'Actualiza tu Perfil de Google →'),
        sub:   tt('GBP Grader checks if your menu URL + photos are public.',
                  'GBP Grader revisa si tu URL de menú + fotos son públicas.')
      };
    }
    return null;
  }

  function surfaceDownloadCelebration(filename, pages) {
    if (document.getElementById('mdCelebrate')) return;
    var ov = document.createElement('div');
    ov.id = 'mdCelebrate';
    ov.className = 'md-celebrate';
    ov.setAttribute('role', 'status');
    ov.setAttribute('aria-live', 'polite');
    var nudge = pickCrossToolNudge();
    var nudgeHtml = nudge ?
      '<a class="md-celebrate-nudge" href="' + escHtml(nudge.url) + '">' +
        '<span class="md-celebrate-nudge-label">' + escHtml(nudge.label) + '</span>' +
        '<span class="md-celebrate-nudge-sub">' + escHtml(nudge.sub) + '</span>' +
      '</a>' : '';
    ov.innerHTML =
      '<div class="md-celebrate-card">' +
        '<h2>' + tt('Your menu is ready.', 'Tu menú está listo.') + '</h2>' +
        '<p>' + tt(
          pages + (pages === 1 ? ' page' : ' pages') + ' downloaded as ' + filename + '.',
          pages + (pages === 1 ? ' página' : ' páginas') + ' descargadas como ' + filename + '.'
        ) + '</p>' +
        nudgeHtml +
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

  // ----------------------------------------------------------------
  // W11-2 — First-run cuisine quiz. A six-tile card the operator
  // sees on a cold load when no draft exists. Replaces the older
  // ghost-rows + overlay pattern with something cleaner: pick a
  // cuisine -> theme suggested + matching template loaded.
  // Time-to-first-output goal: 90 seconds.
  // ----------------------------------------------------------------
  // W11-2 + W22 — Quiz tile catalog extracted to data/quiz-tiles.js.
  var QUIZ_TILES = (typeof MD_QUIZ !== 'undefined') ? MD_QUIZ.TILES : [];
  function renderQuizTiles() {
    var host = document.getElementById('mdQuizTiles');
    if (!host) return;
    host.innerHTML = QUIZ_TILES.map(function (t) {
      var label = LOCALE === 'es' ? t.label_es : t.label_en;
      var hint  = LOCALE === 'es' ? t.hint_es  : t.hint_en;
      return '<li><button type="button" class="md-quiz-tile" data-cuisine="' + escHtml(t.id) + '">' +
        '<span class="md-quiz-tile-glyph" aria-hidden="true">' + t.glyph + '</span>' +
        '<span class="md-quiz-tile-label">' + escHtml(label) + '</span>' +
        '<span class="md-quiz-tile-hint">' + escHtml(hint) + '</span>' +
        '</button></li>';
    }).join('');
  }
  function showQuizIfFresh() {
    var quizEl = document.getElementById('mdQuiz');
    if (!quizEl) return;
    // Only show on a truly cold load: no rows, no draft, no ctx menu data.
    if (rows.filter(function (r) { return !r.ghost; }).length) return;
    if (loadDraft()) return;
    renderQuizTiles();
    quizEl.hidden = false;
    var skipBtn = document.getElementById('mdQuizSkip');
    if (skipBtn) skipBtn.addEventListener('click', function () {
      quizEl.hidden = true;
      // Fall through to the existing ghost-rows seed for those who
      // skipped — keeps the empty-state visually anchored.
      try {
        if (!rows.length && seedGhostRows()) {
          render();
          renderGhostOverlay();
        }
      } catch (_) {}
    });
    var tilesHost = document.getElementById('mdQuizTiles');
    if (tilesHost) tilesHost.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cuisine]'); if (!btn) return;
      var cuisine = btn.dataset.cuisine;
      var entry = null;
      for (var i = 0; i < QUIZ_TILES.length; i++) if (QUIZ_TILES[i].id === cuisine) { entry = QUIZ_TILES[i]; break; }
      if (!entry) return;
      // Apply theme suggestion immediately.
      themeId = entry.theme;
      // If the tile names a starter template, load it; else seed
      // the standard SAMPLE_MENU as a working starting point.
      if (entry.template && TEMPLATES[entry.template]) {
        rows = TEMPLATES[entry.template].rows.map(function (r) { return Object.assign({}, r); });
      } else {
        rows = SAMPLE_MENU.map(function (r) { return Object.assign({}, r); });
      }
      __ghostActive = false;
      quizEl.hidden = true;
      render();
      renderThemePicker();
      scheduleSaveDraft();
      if (window.plausible) {
        try { window.plausible('Menu Design Quiz Picked', { props: { cuisine: cuisine, theme: entry.theme } }); } catch (_) {}
      }
    });
  }

  // ----------------------------------------------------------------
  // W11-2 — Live theme thumbnails. Replaces the abstract 4-color
  // swatch strip in each theme card with a canvas-rendered mini-
  // preview of the operator's actual rows[] in that theme. Lazily
  // painted on hover/focus via IntersectionObserver-style trigger.
  // ----------------------------------------------------------------
  function paintThemeThumb(canvas, themeRef) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W = canvas.width = canvas.offsetWidth * 2;  // 2x for retina
    var H = canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    var w = canvas.offsetWidth;
    var h = canvas.offsetHeight;
    // Background paper
    ctx.fillStyle = themeRef.paper || '#FAF6EE';
    ctx.fillRect(0, 0, w, h);
    // Title (display family fallback to system)
    var titleFont = (themeRef.id && themeRef.id.indexOf('counter') !== -1) ||
                    /helvetica|inter|sans/.test((themeRef.displayFamily || '').toLowerCase())
      ? 'Inter, system-ui, sans-serif' : 'Georgia, serif';
    ctx.fillStyle = themeRef.ink || '#14161A';
    ctx.font = '600 11px ' + titleFont;
    ctx.textAlign = 'center';
    ctx.fillText('Menu', w / 2, 14);
    // Section header
    ctx.fillStyle = themeRef.accent || '#1F4E5B';
    ctx.font = '600 7.5px ' + titleFont;
    ctx.textAlign = 'center';
    ctx.fillText('STARTERS', w / 2, 30);
    if (themeRef.dividerStyle === 'hand-rule' || themeRef.dividerStyle === 'whitespace') {
      ctx.strokeStyle = themeRef.muted || '#7C6F60';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(w * 0.2, 34); ctx.lineTo(w * 0.8, 34); ctx.stroke();
    } else if (themeRef.dividerStyle === 'box') {
      ctx.strokeStyle = themeRef.ink || '#14161A';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(w * 0.3, 22, w * 0.4, 14);
    }
    // Three dish rows
    var rowsToShow = rows.filter(function (r) { return r.kind === 'dish' && (r.name || '').trim(); }).slice(0, 4);
    if (!rowsToShow.length) {
      rowsToShow = [
        { name: 'Caesar salad',  price: '$14' },
        { name: 'House bread',    price: '$6'  },
        { name: 'Roast chicken',  price: '$28' }
      ];
    }
    var bodyFontPx = '7px ' + titleFont;
    ctx.font = bodyFontPx;
    ctx.fillStyle = themeRef.ink || '#14161A';
    var y = 44;
    rowsToShow.forEach(function (r) {
      var name = String(r.name || '').slice(0, 22);
      ctx.textAlign = 'left';
      ctx.fillText(name, w * 0.08, y);
      if (r.price) {
        ctx.textAlign = 'right';
        ctx.fillText(String(r.price), w * 0.92, y);
      }
      // Leader-dots if theme calls for them
      if (themeRef.priceStyle === 'leader-dots') {
        ctx.strokeStyle = themeRef.muted || '#9A958B';
        ctx.lineWidth = 0.4;
        ctx.setLineDash([0.5, 1.5]);
        var nameW = ctx.measureText(name).width;
        ctx.beginPath();
        ctx.moveTo(w * 0.08 + nameW + 4, y - 1.5);
        var priceW = r.price ? ctx.measureText(String(r.price)).width : 0;
        ctx.lineTo(w * 0.92 - priceW - 4, y - 1.5);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      y += 11;
    });
  }
  function paintAllThemeThumbs() {
    if (typeof MD_THEMES === 'undefined') return;
    var cards = themesEl ? themesEl.querySelectorAll('.md-theme') : [];
    cards.forEach(function (card) {
      if (card.dataset.thumbLoaded === '1') return;
      var id = card.dataset.id;
      var t = MD_THEMES.get(id);
      if (!t) return;
      // Insert canvas if not already
      var canvas = card.querySelector('.md-theme-thumb');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'md-theme-thumb';
        canvas.setAttribute('aria-hidden', 'true');
        card.appendChild(canvas);
      }
      paintThemeThumb(canvas, t);
      card.dataset.thumbLoaded = '1';
    });
  }
  // Schedule thumbnail repaint when rows change (debounced).
  var __thumbTimer = null;
  function scheduleThumbRepaint() {
    if (__thumbTimer) clearTimeout(__thumbTimer);
    __thumbTimer = setTimeout(function () {
      __thumbTimer = null;
      // Force-clear the loaded flag so paintAllThemeThumbs re-renders
      var cards = themesEl ? themesEl.querySelectorAll('.md-theme') : [];
      cards.forEach(function (c) { c.dataset.thumbLoaded = '0'; });
      paintAllThemeThumbs();
    }, 800);
  }
  // Hook into the existing schedulePreview cadence — every 300ms
  // debounce, we also schedule a thumbnail repaint at the longer
  // 800ms cadence so thumbnails follow the operator's edits.
  var __origSchedulePreview = schedulePreview;
  schedulePreview = function () {
    __origSchedulePreview();
    scheduleThumbRepaint();
  };

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
  renderPaperGrid();      // W7-3 — populate the new paper-card picker
  syncCustomizeFromTheme(); // W12-3 — initial customizer pickers in sync
  render();
  renderCtxPill();
  renderHistory();
  // W5-8 — surface "Pick up where you left off" if a draft exists
  // and the operator hasn't started fresh yet. Runs after the
  // initial render so the banner sits above an empty editor.
  try { offerDraftRestore(); } catch (_) {}
  // W12-3 — customizer wiring. Each color picker writes to its
  // override; reset clears all three. The paper-texture flag is
  // an additional class toggled on the preview paper element.
  var customAccentEl = document.getElementById('mdCustomAccent');
  var customPaperEl  = document.getElementById('mdCustomPaper');
  var customInkEl    = document.getElementById('mdCustomInk');
  var customResetEl  = document.getElementById('mdCustomizeReset');
  var paperTextureEl = document.getElementById('mdPaperTexture');

  function syncCustomizeFromTheme() {
    // When the operator switches theme without explicitly overriding
    // a color, sync the picker values to the theme's defaults so
    // the visible "current" matches reality.
    if (typeof MD_THEMES === 'undefined') return;
    var t = MD_THEMES.get(themeId);
    if (!t) return;
    if (customAccentEl && !customize.accent) customAccentEl.value = t.accent || '#1F4E5B';
    if (customPaperEl  && !customize.paper)  customPaperEl.value  = t.paper  || '#FAF6EE';
    if (customInkEl    && !customize.ink)    customInkEl.value    = t.ink    || '#14161A';
  }
  if (customAccentEl) customAccentEl.addEventListener('input', function () {
    customize.accent = customAccentEl.value;
    schedulePreview(); scheduleSaveDraft();
  });
  if (customPaperEl) customPaperEl.addEventListener('input', function () {
    customize.paper = customPaperEl.value;
    schedulePreview(); scheduleSaveDraft();
  });
  if (customInkEl) customInkEl.addEventListener('input', function () {
    customize.ink = customInkEl.value;
    schedulePreview(); scheduleSaveDraft();
  });
  if (customResetEl) customResetEl.addEventListener('click', function () {
    customize.accent = customize.paper = customize.ink = null;
    syncCustomizeFromTheme();
    schedulePreview();
    scheduleSaveDraft();
  });
  if (paperTextureEl) paperTextureEl.addEventListener('change', function () {
    customize.paperTexture = !!paperTextureEl.checked;
    schedulePreview();
    scheduleSaveDraft();
  });

  // W15 — seasonal / daypart / event modifier dropdowns. Each
  // writes to customize.mods and triggers a preview re-render.
  customize.mods = customize.mods || { season: 'none', daypart: 'none', event: 'none' };
  var modSeasonEl  = document.getElementById('mdModSeason');
  var modDaypartEl = document.getElementById('mdModDaypart');
  var modEventEl   = document.getElementById('mdModEvent');
  function wireMod(el, key) {
    if (!el) return;
    el.addEventListener('change', function () {
      customize.mods[key] = el.value || 'none';
      schedulePreview();
      scheduleSaveDraft();
    });
  }
  wireMod(modSeasonEl,  'season');
  wireMod(modDaypartEl, 'daypart');
  wireMod(modEventEl,   'event');

  // W15 — Theme JSON export. Writes a self-contained snapshot of
  // the operator's current theme + customizer overrides + modifiers.
  // Re-importable on a later session via the Import button.
  var themeExportBtn = document.getElementById('mdThemeExport');
  var themeImportInput = document.getElementById('mdThemeImport');
  if (themeExportBtn) themeExportBtn.addEventListener('click', function () {
    var snapshot = {
      version: 1,
      themeId: themeId,
      customize: customize,
      meta: { tagline: meta.tagline, story: meta.story, coverPage: meta.coverPage }
    };
    var blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'menu-theme-' + themeId + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); URL.revokeObjectURL(a.href); }, 4000);
    setDownloadMsg(tt('Theme JSON downloaded.', 'JSON de tema descargado.'), 'success');
  });
  if (themeImportInput) themeImportInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object') return;
        pushUndo();
        if (parsed.themeId && typeof MD_THEMES !== 'undefined' && MD_THEMES.get(parsed.themeId)) {
          themeId = parsed.themeId;
        }
        if (parsed.customize) {
          customize.accent = parsed.customize.accent || null;
          customize.paper  = parsed.customize.paper  || null;
          customize.ink    = parsed.customize.ink    || null;
          customize.paperTexture = !!parsed.customize.paperTexture;
          customize.mods = parsed.customize.mods || { season:'none', daypart:'none', event:'none' };
        }
        if (parsed.meta) {
          meta.tagline = parsed.meta.tagline || '';
          meta.story   = parsed.meta.story   || '';
          meta.coverPage = !!parsed.meta.coverPage;
        }
        // Sync UI
        if (customAccentEl && customize.accent) customAccentEl.value = customize.accent;
        if (customPaperEl  && customize.paper)  customPaperEl.value  = customize.paper;
        if (customInkEl    && customize.ink)    customInkEl.value    = customize.ink;
        if (paperTextureEl) paperTextureEl.checked = customize.paperTexture;
        if (modSeasonEl)  modSeasonEl.value  = customize.mods.season  || 'none';
        if (modDaypartEl) modDaypartEl.value = customize.mods.daypart || 'none';
        if (modEventEl)   modEventEl.value   = customize.mods.event   || 'none';
        if (metaTaglineEl) metaTaglineEl.value = meta.tagline;
        if (metaStoryEl)   metaStoryEl.value   = meta.story;
        if (metaCoverEl)   metaCoverEl.checked = meta.coverPage;
        renderThemePicker();
        renderPreview();
        scheduleSaveDraft();
        setDownloadMsg(tt('Theme imported successfully.', 'Tema importado correctamente.'), 'success');
      } catch (_) {
        setDownloadMsg(tt('Could not parse that JSON.', 'No se pudo leer el JSON.'), 'error');
      }
    };
    reader.readAsText(file);
    themeImportInput.value = '';
  });

  // W15 — Vibe quiz. Maps 4-question radio answers to 3 theme
  // recommendations. Operator picks one, theme is applied + quiz
  // closes.
  var vibeQuizBtn = document.getElementById('mdVibeQuizBtn');
  var vibeQuizEl  = document.getElementById('mdVibeQuiz');
  var vibeQuizCancelEl = document.getElementById('mdVibeQuizCancel');
  var vibeQuizBackdropEl = document.getElementById('mdVibeQuizBackdrop');
  var vibeQuizForm = document.getElementById('mdVibeQuizForm');
  var vibeQuizResults = document.getElementById('mdVibeQuizResults');

  function vibeRecommend(answers) {
    // Heuristic mapping: service+feel+era+cuisine -> 3 ranked themes.
    var pool = [];
    if (answers.cuisine === 'european') {
      if (answers.era === 'traditional') pool.push('trattoria', 'brasserie', 'tapas-rustic');
      else                                pool.push('bistro-paris', 'modern-minimal', 'wine-list-formal');
    } else if (answers.cuisine === 'latin') {
      pool.push('cantina', 'tapas-rustic', 'food-truck');
    } else if (answers.cuisine === 'asian') {
      pool.push('asian-table', 'ramen-counter', 'dim-sum-rose');
    } else {
      // american
      if (answers.service === 'fine')   pool.push('tasting-omakase', 'steakhouse', 'wine-list-formal');
      else if (answers.service === 'counter') pool.push('diner-counter', 'pizza-counter', 'food-truck');
      else                              pool.push('gastropub-oak', 'brewpub-slate', 'modern-minimal');
    }
    if (answers.feel === 'rich') {
      pool = ['steakhouse', 'cocktail-deco', 'brasserie'].concat(pool.filter(function (p) {
        return ['steakhouse','cocktail-deco','brasserie'].indexOf(p) === -1;
      }));
    }
    return pool.slice(0, 3);
  }
  function showVibeQuiz() {
    if (!vibeQuizEl) return;
    vibeQuizEl.hidden = false;
    if (vibeQuizResults) { vibeQuizResults.hidden = true; vibeQuizResults.innerHTML = ''; }
  }
  function hideVibeQuiz() { if (vibeQuizEl) vibeQuizEl.hidden = true; }
  if (vibeQuizBtn) vibeQuizBtn.addEventListener('click', showVibeQuiz);
  if (vibeQuizCancelEl) vibeQuizCancelEl.addEventListener('click', hideVibeQuiz);
  if (vibeQuizBackdropEl) vibeQuizBackdropEl.addEventListener('click', hideVibeQuiz);
  if (vibeQuizForm) vibeQuizForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(vibeQuizForm);
    var answers = {
      service: fd.get('vq-service'),
      feel:    fd.get('vq-feel'),
      era:     fd.get('vq-era'),
      cuisine: fd.get('vq-cuisine')
    };
    var recs = vibeRecommend(answers);
    if (vibeQuizResults && typeof MD_THEMES !== 'undefined') {
      vibeQuizResults.hidden = false;
      vibeQuizResults.innerHTML = '<h3>' + tt('Recommended for you', 'Recomendados para ti') + '</h3><ul>' +
        recs.map(function (id) {
          var t = MD_THEMES.get(id); if (!t) return '';
          var lab = LOCALE === 'es' ? t.label_es : t.label_en;
          var bl  = LOCALE === 'es' ? t.blurb_es : t.blurb_en;
          return '<li><button type="button" data-theme="' + escHtml(id) + '"><strong>' + escHtml(lab) + '</strong> <span>' + escHtml(bl || '') + '</span></button></li>';
        }).join('') + '</ul>';
      vibeQuizResults.querySelectorAll('button[data-theme]').forEach(function (b) {
        b.addEventListener('click', function () {
          themeId = b.dataset.theme;
          fireThemeChanged(themeId);
          renderThemePicker();
          renderPreview();
          scheduleSaveDraft();
          hideVibeQuiz();
        });
      });
    }
  });

  // W11-2 — first-run cuisine quiz takes priority over the older
  // ghost-rows + overlay pattern. Skip path falls through to the
  // ghost-rows path so the empty-state still feels alive.
  try {
    if (!rows.length && !loadDraft()) {
      showQuizIfFresh();
    }
  } catch (_) {}
  // W11-2 — paint theme thumbnails on initial load (the operator's
  // current rows[] = sample on first visit; their actual data on
  // revisit). Defer behind requestIdleCallback when available so
  // page-load isn't blocked.
  try {
    var paintThumbs = function () { paintAllThemeThumbs(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(paintThumbs, { timeout: 1500 });
    else setTimeout(paintThumbs, 200);
  } catch (_) {}

  // Subscribe so changes in another tab (e.g. saving from Menu
  // Engineering) refresh the pill without a manual reload.
  if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.subscribe === 'function') {
    MuntinContext.subscribe(renderCtxPill);
  }

  // -------------------- Wave A6 — outbound CTA tracking ----------
  // Body-level click delegation so any current OR future link to
  // the studio's two productized offers gets tracked without us
  // having to retrofit IDs onto every CTA. Bounded enum on the
  // `surface` prop discriminates which area of the page sourced
  // the click (drawer, footer, honesty, header — closed set).
  function ctaSurfaceFor(el) {
    if (!el) return 'unknown';
    if (el.closest('.md-honesty')) return 'honesty';
    if (el.closest('header, .site-header, .topbar')) return 'header';
    if (el.closest('footer, .site-footer')) return 'footer';
    if (el.closest('.md-toolbar, .md-download-row, .md-export')) return 'toolbar';
    return 'body';
  }

  // Wave B11 — Studio Brief auto-bundler attached to the outbound
  // CTAs. When the operator clicks "Start a polish" or "Start a
  // drop-in" with non-trivial menu content in the editor, we encode
  // the canonical-v3 menu into a base64url URL fragment and append
  // it to the link href. The receiving page (window) will read
  // location.hash and pre-fill the form — no round-trip needed.
  //
  // Privacy posture stays intact: the brief lives in location.hash,
  // which is client-side-only (the fragment never leaves the
  // browser as a query parameter; the operator only "sends" it
  // when they submit the form). Logos are NOT included (size +
  // privacy). Empty-menu sessions skip the fragment entirely.
  function dishCountForBrief() {
    return rows.filter(function (r) { return r && r.kind === 'dish' && (r.name || '').trim() !== ''; }).length;
  }
  function dishCountBucketFor(n) {
    return n < 12 ? '<12' : n < 25 ? '12-24' : n < 40 ? '25-39' : '40+';
  }
  function buildStudioBriefFragment() {
    if (typeof MD_SCHEMA === 'undefined' || typeof MD_BRIEF === 'undefined') return null;
    if (dishCountForBrief() === 0) return null;
    try {
      var v2Shape = {
        rows: rows,
        theme: themeId,
        meta: meta,
        customize: customize,
        customDims: customDims,
        schemaVersion: SCHEMA_VERSION
      };
      var menu = MD_SCHEMA.migrate(v2Shape);
      // Non-mutating disclaimer fill: the canonical menu carries the
      // regime + locale, so we surface the regime-aware default text
      // before the brief is encoded. Operator-typed disclaimer wins.
      menu = MD_SCHEMA.applyAutoDisclaimer(menu);
      return MD_BRIEF.toUrlFragment(menu);
    } catch (_) {
      return null;
    }
  }
  function appendBriefFragmentToHref(a) {
    if (!a) return;
    var brief = buildStudioBriefFragment();
    if (!brief) return;
    var href = a.getAttribute('href') || '';
    // Strip any prior #brief=… so re-clicks pick up fresh state.
    href = href.replace(/(?:#|&)brief=[A-Za-z0-9_-]+/, '');
    var sep = href.indexOf('#') >= 0 ? '&' : '#';
    a.setAttribute('href', href + sep + 'brief=' + brief);
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('/services/menu-drop-in/') >= 0 || href.indexOf('/services/menu-drop-in') === 0) {
      appendBriefFragmentToHref(a);
      if (window.plausible) {
        try {
          window.plausible('Menu Design Outbound Drop-In', { props: {
            surface: ctaSurfaceFor(a),
            locale: LOCALE,
            dishCount_bucket: dishCountBucketFor(dishCountForBrief())
          }});
        } catch (_) {}
      }
      return;
    }
    if (href.indexOf('/services/menu-polish/') >= 0 || href.indexOf('/services/menu-polish') === 0) {
      appendBriefFragmentToHref(a);
      if (window.plausible) {
        try {
          window.plausible('Menu Design Outbound Polish', { props: {
            surface: ctaSurfaceFor(a),
            locale: LOCALE,
            dishCount_bucket: dishCountBucketFor(dishCountForBrief())
          }});
        } catch (_) {}
      }
      return;
    }
  }, { capture: true });

  // -------------------- Wave A6 — disclaimer-read milestone ----------
  // The "What this is, and what it isn't." card is the trust anchor
  // for the privacy + scope claims. Operators who scroll to it and
  // dwell ≥3s are the qualified-for-Polish-tier population. Fires
  // once per session; no props (cardinality-safe).
  (function instrumentDisclaimerRead() {
    if (typeof IntersectionObserver !== 'function') return;
    var card = document.querySelector('.md-honesty');
    if (!card) return;
    var fired = false;
    var dwellTimer = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (fired || dwellTimer) return;
          dwellTimer = setTimeout(function () {
            if (fired) return;
            fired = true;
            if (window.plausible) {
              try { window.plausible('Menu Design Disclaimer Read'); } catch (_) {}
            }
            io.disconnect();
          }, 3000);
        } else {
          if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
        }
      });
    }, { threshold: [0, 0.5, 1] });
    io.observe(card);
  })();

})();
