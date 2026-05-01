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
      if (r.kind === 'section') {
        html += '<tr class="md-row-section" data-i="' + i + '">' +
          '<td colspan="3"><input type="text" class="md-input" data-field="name" data-i="' + i +
          '" value="' + escHtml(r.name) + '" placeholder="Section name (e.g. Starters)" aria-label="Section name" /></td>' +
          '<td class="md-remove-cell"><button type="button" class="md-remove" data-act="del" data-i="' + i + '" aria-label="Remove section">&times;</button></td>' +
          '</tr>';
      } else {
        html += '<tr data-i="' + i + '">' +
          '<td data-label="Dish"><input type="text" class="md-input" data-field="name" data-i="' + i +
          '" value="' + escHtml(r.name) + '" placeholder="Dish name" aria-label="Dish name" autocomplete="off" /></td>' +
          '<td data-label="Price"><input type="text" inputmode="decimal" class="md-input" data-field="price" data-i="' + i +
          '" value="' + escHtml(r.price) + '" placeholder="$14" aria-label="Price" autocomplete="off" /></td>' +
          '<td data-label="Description"><textarea class="md-input" data-field="desc" data-i="' + i +
          '" rows="1" placeholder="Crisp little gems, buttermilk dressing" aria-label="Description">' + escHtml(r.desc) + '</textarea></td>' +
          '<td class="md-remove-cell"><button type="button" class="md-remove" data-act="del" data-i="' + i + '" aria-label="Remove dish">&times;</button></td>' +
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
  }

  function updateStatus() {
    if (!statusEl) return;
    var dishes   = rows.filter(function (r) { return r.kind === 'dish'; }).length;
    var sections = rows.filter(function (r) { return r.kind === 'section'; }).length;
    statusEl.innerHTML = '<strong>' + dishes + '</strong> dish' + (dishes === 1 ? '' : 'es') +
      ' · <strong>' + sections + '</strong> section' + (sections === 1 ? '' : 's') +
      ' — your menu lives in this browser only.';
  }

  // -------------------- Wire interactions --------------------
  if (rowsEl) {
    rowsEl.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || !t.dataset || !t.dataset.field) return;
      var i = parseInt(t.dataset.i, 10);
      if (!isFinite(i) || !rows[i]) return;
      rows[i][t.dataset.field] = t.value;
    });
    rowsEl.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || t.dataset.act !== 'del') return;
      var i = parseInt(t.dataset.i, 10);
      if (!isFinite(i)) return;
      rows.splice(i, 1);
      render();
    });
  }

  if (addRowBtn) addRowBtn.addEventListener('click', function () {
    rows.push(blankDish());
    render();
    // Focus the new row's name input.
    var inputs = rowsEl.querySelectorAll('input[data-field="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });
  if (stickBtn) stickBtn.addEventListener('click', function () {
    rows.push(blankDish());
    render();
    var inputs = rowsEl.querySelectorAll('input[data-field="name"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  if (addSecBtn) addSecBtn.addEventListener('click', function () {
    rows.push(blankSection());
    render();
    var inputs = rowsEl.querySelectorAll('.md-row-section input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  if (clearBtn) clearBtn.addEventListener('click', function () {
    if (!rows.length) return;
    if (!confirm('Clear every row? This can\'t be undone.')) return;
    rows = [];
    render();
  });

  if (sampleBtn) sampleBtn.addEventListener('click', function () {
    rows = SAMPLE_MENU.map(function (r) { return Object.assign({}, r); });
    render();
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

  // -------------------- Init --------------------
  render();
  renderCtxPill();

  // Subscribe so changes in another tab (e.g. saving from Menu
  // Engineering) refresh the pill without a manual reload.
  if (typeof MuntinContext !== 'undefined' && typeof MuntinContext.subscribe === 'function') {
    MuntinContext.subscribe(renderCtxPill);
  }

})();
