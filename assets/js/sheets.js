/*
 * Operator Sheets — page-level wiring.
 *
 * Per-sheet logic registers itself by calling
 * window.SheetPage.register({ slug, collect, recalc, save }).
 * This script wires the action buttons (Print / Download CSV / Copy /
 * Save) to the registered handlers and falls back to generic form
 * collection when a sheet hasn't registered its own collect().
 *
 * Recalc runs on input/change events with a 60 ms debounce and
 * delegates to the sheet's recalc(state) callback. The state shape
 * is whatever the sheet's collect() returns.
 */
(function () {
  'use strict';

  if (window.SheetPage) return;

  var registry = {};

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
    if (page !== slug) return; // wrong page; another sheet's script

    var spec = registry[slug];
    var collect = (spec && spec.collect) || genericCollect;
    var recalc  = spec && spec.recalc;
    var save    = spec && spec.save;

    // Recalc on input.
    var fieldsRoot = document.getElementById('sheet-fields') || document.getElementById('sheet-form');
    if (recalc && fieldsRoot) {
      var t = null;
      var run = function () {
        if (t) clearTimeout(t);
        t = setTimeout(function () {
          try { recalc(collect()); } catch (e) { /* swallow per-sheet errors */ }
        }, 60);
      };
      fieldsRoot.addEventListener('input', run);
      fieldsRoot.addEventListener('change', run);
      // Initial paint after fragments load
      run();
    }

    // Bind action buttons.
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

    // Workbench save — opt-in. Reveals the auth-gated panel when the
    // visitor is signed in. Save handler defers to per-sheet save() if
    // registered; otherwise sends the generic collect() rows as the
    // payload.
    var savePanel = document.querySelector('.mm-save[data-kind="sheet"]');
    if (savePanel) {
      // Reveal panel for authenticated users only — fire-and-forget.
      try {
        fetch('/api/auth/me', { credentials: 'same-origin' }).then(function (r) {
          if (r && r.status === 200) savePanel.hidden = false;
        }).catch(function () { /* anonymous; keep hidden */ });
      } catch (_) { /* ignore */ }

      var saveBtn = savePanel.querySelector('.js-sheet-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          var prev = saveBtn.textContent;
          saveBtn.disabled = true;
          var payload = save ? save(collect()) : { slug: slug, rows: collect() };
          var title = (document.querySelector('h1') || {}).textContent || slug;
          fetch('/api/workbench/save', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind: 'sheet',
              title: title.replace(/\s+/g, ' ').trim().slice(0, 200),
              payload: Object.assign({ slug: slug, savedAt: new Date().toISOString() }, payload || {}),
            }),
          }).then(function (r) {
            if (r && r.ok) {
              saveBtn.textContent = saveBtn.dataset.savedLabel || 'Saved';
              setTimeout(function () { saveBtn.textContent = prev; saveBtn.disabled = false; }, 1800);
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

  window.SheetPage = { register: register };
})();
