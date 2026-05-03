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

    // Recalc on input.
    if (recalc && fieldsRoot) {
      var t = null;
      var run = function () {
        if (t) clearTimeout(t);
        t = setTimeout(function () {
          try { recalc(collect()); } catch (e) { /* swallow per-sheet errors */ }
          updateProgress();
          updateClearLinks();
        }, 60);
      };
      fieldsRoot.addEventListener('input', run);
      fieldsRoot.addEventListener('change', run);
      run(); // initial paint
    }

    // B11 — progress: render once on boot, refresh on input.
    updateProgress();
    // B10 — per-fieldset Clear links (hidden until section touched).
    installClearLinks();
    updateClearLinks();
    // B10 — Reset button two-tap confirm replacement.
    installResetConfirm();

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
  // B11 · Progress strip — counts non-empty fieldsets, names the next.
  // ─────────────────────────────────────────────────────────────────

  function fieldsetIsTouched(fs) {
    var inputs = fs.querySelectorAll('input, select, textarea');
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

  window.SheetPage = { register: register };
})();
