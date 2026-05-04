/*
 * Operator Sheets — page-level wiring.
 *
 * Per-sheet logic registers itself by calling
 * window.SheetPage.register({ slug, collect, recalc, save }).
 * This script wires the action buttons (Print / Download CSV / Copy /
 * Save) to the registered handlers and falls back to generic form
 * collection when a sheet hasn't registered its own collect().
 *
 * Phase B additions (Operator Sheets refinement plan):
 *   B10 — recovery: two-tap reset + per-fieldset clear + undo
 *   B11 — progress: under-H1 progress strip ("3 of 5 sections done")
 *   B13 — keyboard: Cmd+S download CSV, Cmd+Enter save
 *   B6  — sparkline of prior saves (authed only)
 *
 * Recalc runs on input/change events with a 60ms debounce and
 * delegates to the sheet's recalc(state) callback.
 */
(function () {
  'use strict';

  if (window.SheetPage) return;

  var registry = {};
  var undoStack = []; // each entry: { restore: function() }
  var resetConfirmTimer = null;

  function register(spec) {
    if (!spec || !spec.slug) return;
    registry[spec.slug] = spec;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { boot(spec.slug); });
    } else {
      boot(spec.slug);
    }
  }

  function genericCollect() {
    var form = document.getElementById('sheet-fields');
    if (form) return window.SheetCsv.collectFormRows(form);
    var table = document.querySelector('.sheet-row-table');
    if (table) return window.SheetCsv.collectTableRows(table);
    return [['Field', 'Value']];
  }

  function boot(slug) {
    var page = document.body && document.body.dataset && document.body.dataset.sheetSlug;
    if (page !== slug) return;

    var spec = registry[slug];
    var collect = (spec && spec.collect) || genericCollect;
    var recalc  = spec && spec.recalc;

    var fieldsRoot = document.getElementById('sheet-fields') || document.getElementById('sheet-form');

    // B3 — local autosave drafts. The form snapshot writes to
    // localStorage on the same debounced input listener that fires
    // recalc; on boot, if a draft exists, surface a quiet "Picked up
    // your draft" line above the form.
    var locale = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
    var draftKey = 'muntin.sheet-draft.' + slug + '.' + locale;
    if (fieldsRoot) installDraftPrompt(fieldsRoot, draftKey, locale);

    // Recalc on input.
    if (recalc && fieldsRoot) {
      var t = null;
      var run = function () {
        if (t) clearTimeout(t);
        t = setTimeout(function () {
          try { recalc(collect()); } catch (e) { /* swallow per-sheet errors */ }
          updateProgress();
          updateClearLinks();
          // B3 — write draft after every input, debounced with the
          // same 60ms cadence as recalc.
          saveDraft(fieldsRoot, draftKey);
        }, 60);
      };
      fieldsRoot.addEventListener('input', run);
      fieldsRoot.addEventListener('change', run);
      run(); // initial paint
    } else if (fieldsRoot) {
      // No recalc registered (paper-first sheet) — still autosave on input.
      var t2 = null;
      fieldsRoot.addEventListener('input', function () {
        if (t2) clearTimeout(t2);
        t2 = setTimeout(function () { saveDraft(fieldsRoot, draftKey); updateProgress(); updateClearLinks(); }, 60);
      });
    }

    // B11 — progress: render once on boot, refresh on input.
    updateProgress();
    // B10 — per-fieldset Clear links (hidden until section touched).
    installClearLinks();
    updateClearLinks();
    // B10 — Reset button two-tap confirm replacement.
    installResetConfirm();
    // B7 — URL-param prefill. Reads ?prefill=key:value,key:value and
    // ?prefill_source=<slug> on boot, stamps matching form fields, and
    // surfaces a dismissable banner above the form. The values go to
    // input.value (not innerHTML), so this is safe against XSS by
    // construction. Capped at 30 fields and 2048 chars total.
    if (fieldsRoot) applyUrlPrefill(fieldsRoot, locale);

    // Action buttons.
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest && ev.target.closest('[data-sheet-action]');
      if (!btn) return;
      var action = btn.dataset.sheetAction;
      if (action === 'print') {
        ev.preventDefault();
        window.SheetCsv.print();
      } else if (action === 'download-csv') {
        ev.preventDefault();
        var rows = collect();
        var fname = slug + '-' + new Date().toISOString().slice(0, 10) + '.csv';
        window.SheetCsv.download(rows, fname);
      } else if (action === 'copy') {
        ev.preventDefault();
        var rows2 = collect();
        var text  = window.SheetCsv.toClipboardText(rows2);
        window.SheetCsv.copyToClipboard(text, btn);
      }
    });

    // B13 — keyboard shortcuts. ⌘P falls through to native print.
    document.addEventListener('keydown', function (ev) {
      var meta = ev.metaKey || ev.ctrlKey;
      if (!meta) return;
      if (ev.key === 's' || ev.key === 'S') {
        // ⌘S → Download CSV (override the browser save-page action).
        ev.preventDefault();
        var rows = collect();
        var fname = slug + '-' + new Date().toISOString().slice(0, 10) + '.csv';
        window.SheetCsv.download(rows, fname);
      } else if (ev.key === 'Enter') {
        // ⌘↵ → Save to Workshop, only if the panel is visible.
        var btn = document.querySelector('.mm-save:not([hidden]) .js-sheet-save');
        if (btn) {
          ev.preventDefault();
          btn.click();
        }
      }
    });

    // Workbench save — opt-in.
    var savePanel = document.querySelector('.mm-save[data-kind="sheet"]');
    if (savePanel) {
      try {
        fetch('/api/auth/me', { credentials: 'same-origin' }).then(function (r) {
          if (r && r.status === 200) {
            savePanel.hidden = false;
            // B6 — fetch prior history + render sparkline above the save panel.
            renderHistorySparkline(slug, savePanel);
          }
        }).catch(function () { /* anonymous; keep hidden */ });
      } catch (_) { /* ignore */ }

      var saveBtn = savePanel.querySelector('.js-sheet-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          var prev = saveBtn.textContent;
          saveBtn.disabled = true;
          var spec = registry[slug];
          var customSave = spec && spec.save;
          var inputs = collectInputsObject();
          var outputs = collectOutputsObject();
          // Versioned payload (Phase B2). v:1 carries inputs+outputs
          // separately so the Workshop dashboard rollup (B8) can read
          // structured outputs without re-parsing CSV rows. v-absent
          // saves remain readable; the slug→metric mapper has a
          // fallback branch.
          var payload = customSave
            ? customSave(collect())
            : { v: 1, slug: slug, inputs: inputs, outputs: outputs, savedAt: new Date().toISOString() };
          var title = (document.querySelector('h1') || {}).textContent || slug;
          fetch('/api/workbench/save', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind: 'sheet',
              title: title.replace(/\s+/g, ' ').trim().slice(0, 200),
              payload: payload,
            }),
          }).then(function (r) {
            if (r && r.ok) {
              saveBtn.textContent = saveBtn.dataset.savedLabel || 'Saved';
              setTimeout(function () { saveBtn.textContent = prev; saveBtn.disabled = false; }, 1800);
              // Refresh sparkline so the new save shows up immediately.
              renderHistorySparkline(slug, savePanel);
            } else {
              saveBtn.textContent = saveBtn.dataset.failedLabel || 'Save failed';
              setTimeout(function () { saveBtn.textContent = prev; saveBtn.disabled = false; }, 1800);
            }
          }).catch(function () {
            saveBtn.textContent = saveBtn.dataset.failedLabel || 'Save failed';
            setTimeout(function () { saveBtn.textContent = prev; saveBtn.disabled = false; }, 1800);
          });
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // B7 · URL-param prefill receiver. The Workshop hand-off (and any
  // future stepping-stone link) constructs a prefill URL; this reads
  // it on boot, stamps matching form fields, marks them with
  // data-prefilled="1", and surfaces a banner the operator can dismiss.
  // Safety: keys must match /^[a-zA-Z0-9_]{1,40}$/, values capped at
  // 200 chars, total at 30 fields / 2048 chars. Values are written via
  // input.value (never innerHTML), so XSS is not in scope.
  // ─────────────────────────────────────────────────────────────────

  var PREFILL_COPY = {
    en: {
      banner: function (n, source) { return 'Prefilled ' + n + ' field' + (n === 1 ? '' : 's') + (source ? ' from your saved ' + source : '') + '.'; },
      clear:  'Clear and start fresh',
    },
    es: {
      banner: function (n, source) { return 'Pre-llenamos ' + n + ' campo' + (n === 1 ? '' : 's') + (source ? ' de tu ' + source + ' guardada' : '') + '.'; },
      clear:  'Limpiar y empezar de cero',
    },
  };

  function applyUrlPrefill(fieldsRoot, locale) {
    var search;
    try { search = window.location.search || ''; } catch (_) { return; }
    if (!search || search.length > 2048) return;
    var params = new URLSearchParams(search);
    var raw = params.get('prefill');
    if (!raw) return;
    var sourceSlug  = (params.get('prefill_source') || '').trim();
    var sourceLabel = (params.get('prefill_label')  || '').trim().slice(0, 80) || sourceSlug;

    var form = fieldsRoot.querySelector('#sheet-fields') || (fieldsRoot.id === 'sheet-fields' ? fieldsRoot : null);
    if (!form) return;

    var pairs = raw.split(',').slice(0, 30);
    var filled = 0;
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      var idx = pair.indexOf(':');
      if (idx < 1) continue;
      var name  = pair.slice(0, idx);
      var valueRaw = pair.slice(idx + 1);
      if (!/^[a-zA-Z0-9_]{1,40}$/.test(name)) continue;
      var value;
      try { value = decodeURIComponent(valueRaw); } catch (_) { continue; }
      if (value.length > 200) continue;
      var field = form.elements && form.elements.namedItem(name);
      if (!field) continue;
      // namedItem can return a RadioNodeList; we only handle scalars.
      if (field.length != null && field.tagName == null) continue;
      if (field.type === 'checkbox' || field.type === 'radio') {
        var v = value.toLowerCase();
        // Accept the values collectInputsObject() emits ('yes'/'no')
        // alongside generic truthy strings.
        field.checked = (v === '1' || v === 'true' || v === 'on' || v === 'yes');
      } else {
        field.value = value;
      }
      field.dataset.prefilled = '1';
      filled++;
    }
    if (filled === 0) return;

    showPrefillBanner(form, filled, sourceLabel, locale);
    // Trigger recalc + draft save.
    form.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function showPrefillBanner(form, count, sourceLabel, locale) {
    var copy = PREFILL_COPY[locale] || PREFILL_COPY.en;
    var existing = document.getElementById('sheet-prefill-banner');
    if (existing) existing.remove();
    var banner = document.createElement('div');
    banner.id = 'sheet-prefill-banner';
    banner.className = 'sheet-prefill-banner';
    banner.setAttribute('role', 'status');
    var msg = document.createElement('span');
    msg.className = 'sheet-prefill-banner__msg';
    msg.textContent = copy.banner(count, sourceLabel);
    banner.appendChild(msg);
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'sheet-prefill-banner__clear';
    clearBtn.textContent = copy.clear;
    clearBtn.addEventListener('click', function () {
      // Strip the prefilled values, drop the banner, and rewrite the URL
      // without prefill params so a refresh starts truly fresh.
      var prefilled = form.querySelectorAll('[data-prefilled="1"]');
      for (var i = 0; i < prefilled.length; i++) {
        var el = prefilled[i];
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
        el.removeAttribute('data-prefilled');
      }
      banner.remove();
      try {
        var u = new URL(window.location.href);
        u.searchParams.delete('prefill');
        u.searchParams.delete('prefill_source');
        u.searchParams.delete('prefill_label');
        window.history.replaceState({}, '', u.pathname + (u.search || '') + u.hash);
      } catch (_) { /* ignore */ }
      form.dispatchEvent(new Event('input', { bubbles: true }));
    });
    banner.appendChild(clearBtn);
    // Insert before the form.
    form.parentNode.insertBefore(banner, form);
  }


    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) return true;
      } else if (el.value && String(el.value).trim() !== '') {
        return true;
      }
    }
    return false;
  }

  function fieldsetLegendText(fs) {
    var leg = fs.querySelector('legend');
    if (!leg) return '';
    // Strip the inline "clear section" link's text if present.
    var clone = leg.cloneNode(true);
    var btn = clone.querySelector('.sheet-clear-section');
    if (btn) btn.remove();
    return (clone.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function updateProgress() {
    var strip = document.getElementById('sheet-progress');
    if (!strip) return;
    var fields = document.getElementById('sheet-fields');
    if (!fields) { strip.hidden = true; return; }
    var fieldsets = fields.querySelectorAll('fieldset');
    if (fieldsets.length < 2) { strip.hidden = true; return; }
    var done = 0;
    var nextLabel = null;
    var doneLabels = [];
    for (var i = 0; i < fieldsets.length; i++) {
      var fs = fieldsets[i];
      var label = fieldsetLegendText(fs);
      if (fieldsetIsTouched(fs)) {
        done++;
        doneLabels.push(label);
      } else if (!nextLabel) {
        nextLabel = label;
      }
    }
    var total = fieldsets.length;
    if (done === 0) { strip.hidden = true; return; }
    strip.hidden = false;
    var doneSummary = doneLabels.length <= 3
      ? doneLabels.join(', ')
      : doneLabels.slice(0, 2).join(', ') + ', + ' + (doneLabels.length - 2) + ' more';
    if (done === total) {
      strip.innerHTML = '<strong>' + total + ' of ' + total + ' sections</strong> done — ready to print or save.';
    } else if (nextLabel) {
      strip.innerHTML = '<strong>' + done + ' of ' + total + ' sections</strong> · ' + escapeHtml(doneSummary) + ' done. <span class="sheet-progress__next">Next: ' + escapeHtml(nextLabel) + '.</span>';
    } else {
      strip.innerHTML = '<strong>' + done + ' of ' + total + ' sections</strong> · ' + escapeHtml(doneSummary) + ' done.';
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // B10 · Per-fieldset clear — small ghost link in the legend, only
  // visible when the section is touched. Pushes an undo entry.
  // ─────────────────────────────────────────────────────────────────

  function installClearLinks() {
    var fields = document.getElementById('sheet-fields');
    if (!fields) return;
    var fieldsets = fields.querySelectorAll('fieldset');
    for (var i = 0; i < fieldsets.length; i++) {
      var fs = fieldsets[i];
      var leg = fs.querySelector('legend');
      if (!leg || leg.querySelector('.sheet-clear-section')) continue;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sheet-clear-section';
      btn.hidden = true;
      btn.textContent = 'Clear this section';
      btn.addEventListener('click', clearFieldset.bind(null, fs));
      leg.appendChild(btn);
    }
  }

  function updateClearLinks() {
    var fields = document.getElementById('sheet-fields');
    if (!fields) return;
    var fieldsets = fields.querySelectorAll('fieldset');
    for (var i = 0; i < fieldsets.length; i++) {
      var fs = fieldsets[i];
      var btn = fs.querySelector('.sheet-clear-section');
      if (!btn) continue;
      btn.hidden = !fieldsetIsTouched(fs);
    }
  }

  function snapshotFormState(form) {
    var state = {};
    var els = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.name) continue;
      var key = el.name + '__' + el.type;
      if (el.type === 'checkbox' || el.type === 'radio') {
        state[key] = !!el.checked;
      } else {
        state[key] = el.value;
      }
    }
    return state;
  }

  function restoreFormState(form, state) {
    var els = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.name) continue;
      var key = el.name + '__' + el.type;
      if (!(key in state)) continue;
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = !!state[key];
      } else {
        el.value = state[key];
      }
    }
    form.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function clearFieldset(fs) {
    var fields = document.getElementById('sheet-fields');
    if (!fields) return;
    var snapshot = snapshotFormState(fields);
    var label = fieldsetLegendText(fs);
    var inputs = fs.querySelectorAll('input, select, textarea');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = false;
      } else if (el.tagName === 'SELECT' && el.options.length) {
        el.selectedIndex = 0;
      } else {
        el.value = '';
      }
    }
    fields.dispatchEvent(new Event('input', { bubbles: true }));
    pushUndo(function () { restoreFormState(fields, snapshot); }, 'Cleared the ' + label + ' section.');
  }

  // ─────────────────────────────────────────────────────────────────
  // B10 · Reset button two-tap confirm.
  // ─────────────────────────────────────────────────────────────────

  function installResetConfirm() {
    var resetBtn = document.querySelector('.mm-actions [type="reset"]');
    if (!resetBtn) return;
    // Move from <button type=reset> → controlled handler with inline confirm.
    resetBtn.type = 'button';
    resetBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      var fields = document.getElementById('sheet-fields');
      if (!fields) return;
      // No-op if the form is already empty.
      if (!hasAnyValue(fields)) return;
      showResetConfirm(resetBtn, fields);
    });
  }

  function hasAnyValue(form) {
    var els = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) return true;
      } else if (el.value && String(el.value).trim() !== '') {
        return true;
      }
    }
    return false;
  }

  function showResetConfirm(resetBtn, form) {
    var existing = document.querySelector('.sheet-reset-confirm');
    if (existing) existing.remove();
    var wrap = document.createElement('span');
    wrap.className = 'sheet-reset-confirm';
    wrap.innerHTML = 'Clear everything? <button type="button" data-confirm="yes">Yes, clear</button> <button type="button" data-confirm="no">Cancel</button>';
    resetBtn.style.display = 'none';
    resetBtn.parentNode.insertBefore(wrap, resetBtn.nextSibling);
    wrap.querySelector('[data-confirm="yes"]').addEventListener('click', function () {
      var snapshot = snapshotFormState(form);
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else if (el.tagName === 'SELECT' && el.options.length) el.selectedIndex = 0;
        else el.value = '';
      });
      form.dispatchEvent(new Event('input', { bubbles: true }));
      // B3 — Reset is one of the two ways the draft clears (the
      // other is "Start fresh" on the prompt). Workshop save does
      // NOT clear the draft — the operator may want to keep typing.
      var slug = document.body && document.body.dataset && document.body.dataset.sheetSlug;
      if (slug && window.__sheetDraft) {
        var loc = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
        window.__sheetDraft.clear('muntin.sheet-draft.' + slug + '.' + loc);
      }
      wrap.remove();
      resetBtn.style.display = '';
      pushUndo(function () { restoreFormState(form, snapshot); }, 'Cleared the sheet.');
    });
    wrap.querySelector('[data-confirm="no"]').addEventListener('click', function () {
      wrap.remove();
      resetBtn.style.display = '';
    });
    if (resetConfirmTimer) clearTimeout(resetConfirmTimer);
    resetConfirmTimer = setTimeout(function () {
      if (wrap.parentNode) {
        wrap.remove();
        resetBtn.style.display = '';
      }
    }, 8000);
  }

  // ─────────────────────────────────────────────────────────────────
  // B10 · Undo snackbar — 8s timeout, plain text.
  // ─────────────────────────────────────────────────────────────────

  function pushUndo(restore, msg) {
    if (typeof restore !== 'function') return;
    var existing = document.querySelector('.sheet-undo-bar');
    if (existing) existing.remove();
    var bar = document.createElement('div');
    bar.className = 'sheet-undo-bar';
    bar.setAttribute('role', 'status');
    bar.innerHTML = escapeHtml(msg) + ' <button type="button">Undo</button>';
    document.body.appendChild(bar);
    var done = false;
    var btn = bar.querySelector('button');
    btn.addEventListener('click', function () {
      if (done) return;
      done = true;
      restore();
      bar.remove();
    });
    setTimeout(function () {
      if (!done && bar.parentNode) bar.remove();
    }, 8000);
  }

  // ─────────────────────────────────────────────────────────────────
  // B6 · Prior-saves sparkline (authed only).
  // ─────────────────────────────────────────────────────────────────

  function renderHistorySparkline(slug, savePanel) {
    if (!window.SheetViz) return;
    var host = savePanel.querySelector('.sheet-history');
    if (!host) return;
    fetch('/api/workbench/sheet-history?slug=' + encodeURIComponent(slug), {
      credentials: 'same-origin',
    }).then(function (r) {
      // The endpoint may not exist yet; degrade gracefully.
      if (!r || !r.ok) { host.hidden = true; return null; }
      return r.json();
    }).then(function (data) {
      if (!data || !Array.isArray(data.values) || data.values.length < 2) { host.hidden = true; return; }
      var sparkline = window.SheetViz.sparkline(data.values, {
        band: data.band || 'idle',
        label: 'Last ' + data.values.length + ' saves trend',
      });
      var label = data.label || ('Last ' + data.values.length + ' saves');
      host.innerHTML =
        '<div class="sheet-viz sheet-viz--inline">' +
        '<span class="sheet-viz__label">' + escapeHtml(label) + '</span>' +
        sparkline +
        '</div>';
      host.hidden = false;
    }).catch(function () { host.hidden = true; });
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────

  function collectInputsObject() {
    var form = document.getElementById('sheet-fields');
    if (!form) return {};
    var out = {};
    var els = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.name || el.disabled) continue;
      if (el.type === 'checkbox') out[el.name] = el.checked ? 'yes' : 'no';
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.value;
    }
    return out;
  }

  function collectOutputsObject() {
    var nodes = document.querySelectorAll('[data-output]');
    var out = {};
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var key = n.dataset.output;
      if (!key) continue;
      // Try to pull a numeric value from the textContent if the node
      // looks numeric (drops $, %, commas); else store the text.
      var raw = (n.textContent || '').trim();
      var num = parseFloat(raw.replace(/[$,%\s]/g, ''));
      out[key] = isFinite(num) && /[0-9]/.test(raw) ? num : raw;
    }
    return out;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // B3 · Local autosave drafts.
  //
  // Drafts stay on the device. They clear on Reset, on explicit
  // "Start fresh" from the prompt, and on a successful Workshop save.
  //
  // Voice canon:
  //   IN:  "Picked up your draft from Saturday 8:42pm. [Start fresh]"
  //   OUT: "Auto-saved ✓ Your work is safe!"
  //
  // The "Saturday" link points at /security/ so the curious operator
  // can verify in one tap that drafts never leave the device.
  // ─────────────────────────────────────────────────────────────────

  var DRAFT_COPY = {
    en: {
      pickedUp: 'Picked up your draft from ',
      startFresh: 'Start fresh',
      verifyLink: 'Stays on your device.',
      verifyHref: '/security/',
      quotaWarning: 'Your browser is out of room for drafts. The current sheet still saves on type.',
    },
    es: {
      pickedUp: 'Recogí tu borrador de ',
      startFresh: 'Empezar de cero',
      verifyLink: 'Se queda en tu dispositivo.',
      verifyHref: '/es/security/',
      quotaWarning: 'Tu navegador se quedó sin espacio para borradores. La hoja actual sigue guardándose al escribir.',
    },
  };

  function formatDraftStamp(ts, loc) {
    if (!ts) return '';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    var weekday = d.toLocaleString(loc === 'es' ? 'es-US' : 'en-US', { weekday: 'long' });
    var hours = d.getHours();
    var ampm = hours >= 12 ? 'pm' : 'am';
    var hh = ((hours + 11) % 12) + 1;
    var mm = String(d.getMinutes()).padStart(2, '0');
    return weekday + ' ' + hh + ':' + mm + ampm;
  }

  function installDraftPrompt(form, key, locale) {
    var draft = readDraft(key);
    if (!draft || !draft.state) return;
    var c = DRAFT_COPY[locale];
    var stamp = formatDraftStamp(draft.savedAt, locale);
    var prompt = document.createElement('div');
    prompt.className = 'sheet-draft-prompt';
    prompt.style.cssText = 'margin:-8px 0 18px;padding:10px 14px;border:1px solid var(--line,#E5DFD2);border-left:3px solid var(--teal,#1F4E5B);border-radius:var(--r-sm,6px);background:var(--cream-2,#F3EEE3);font-size:13.5px;line-height:1.5;color:var(--ink-soft,#2A2D33);display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;';
    var msg = document.createElement('span');
    msg.innerHTML = c.pickedUp + '<strong>' + escapeHtml(stamp || 'earlier') + '</strong>.';
    var startFresh = document.createElement('button');
    startFresh.type = 'button';
    startFresh.textContent = c.startFresh;
    startFresh.style.cssText = 'background:transparent;border:0;padding:0;font:inherit;color:var(--rust,#B8541A);text-decoration:underline;text-underline-offset:2px;cursor:pointer;font-weight:500;';
    var verify = document.createElement('a');
    verify.href = c.verifyHref;
    verify.textContent = c.verifyLink;
    verify.style.cssText = 'color:var(--stone,#6B6B6B);font-size:12px;margin-left:auto;text-decoration:underline;text-underline-offset:2px;';
    prompt.appendChild(msg);
    prompt.appendChild(startFresh);
    prompt.appendChild(verify);
    var hero = document.querySelector('.mm-hero');
    var insertAfter = document.querySelector('.mm-card.mm-live');
    if (insertAfter && insertAfter.parentNode) {
      insertAfter.parentNode.insertBefore(prompt, insertAfter);
    } else if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(prompt, hero.nextSibling);
    } else {
      form.parentNode && form.parentNode.insertBefore(prompt, form);
    }
    // Restore values without firing a save loop.
    silentRestore(form, draft.state);
    startFresh.addEventListener('click', function () {
      clearDraft(key);
      // Clear all fields without snapshotting (we just discarded the draft).
      form.querySelectorAll('input, select, textarea').forEach(function (el) {
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else if (el.tagName === 'SELECT' && el.options.length) el.selectedIndex = 0;
        else el.value = '';
      });
      form.dispatchEvent(new Event('input', { bubbles: true }));
      prompt.remove();
    });
  }

  function silentRestore(form, state) {
    var els = form.querySelectorAll('input, select, textarea');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.name) continue;
      var key = el.name + '__' + el.type;
      if (!(key in state)) continue;
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = !!state[key];
      else el.value = state[key];
    }
    form.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function readDraft(key) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || obj.v !== 1) return null;
      return obj;
    } catch (_) { return null; }
  }

  function saveDraft(form, key) {
    if (!form || !key) return;
    if (!hasAnyValue(form)) {
      // Form is empty; clear any stale draft so the prompt doesn't
      // surface on the next visit.
      clearDraft(key);
      return;
    }
    var state = snapshotFormState(form);
    var payload = { v: 1, savedAt: new Date().toISOString(), state: state };
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      // Quota exceeded or storage disabled. Surface a non-blocking
      // notice exactly once per page load.
      if (!window.__sheetDraftQuotaWarned) {
        window.__sheetDraftQuotaWarned = true;
        var loc = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
        var msg = DRAFT_COPY[loc].quotaWarning;
        var notice = document.createElement('div');
        notice.style.cssText = 'margin:8px 0;padding:8px 12px;border:1px solid var(--line-dark,#C9C2B6);background:var(--cream-2,#F3EEE3);font-size:12.5px;color:var(--ink-soft,#2A2D33);';
        notice.textContent = msg;
        var card = document.querySelector('.mm-card.mm-live');
        if (card && card.parentNode) card.parentNode.insertBefore(notice, card);
      }
    }
  }

  function clearDraft(key) {
    try { window.localStorage.removeItem(key); } catch (_) { /* ignore */ }
  }

  // Expose draft helpers so the Reset confirm and Workshop save flows
  // can invalidate the local copy after their own clears.
  window.__sheetDraft = { clear: clearDraft };

  window.SheetPage = { register: register };
})();
