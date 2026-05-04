/**
 * Briefing Card action layer (Wave C).
 *
 * Each Finding's CTA button maps to a one-tap workflow that produces
 * an artifact (clipboard, CSV, opened panel) AND/OR mutates a piece
 * of MuntinContext (watch, dismissal, expected suppression). All
 * reversible within 30s via the existing showBulkUndo banner.
 *
 *   MID_BRIEFING_ACTIONS.dispatch(findingId, btn)
 *   MID_BRIEFING_ACTIONS.showWhy(findingId)
 *
 * Eight actions:
 *   copy-dispute, switch-vendor, mark-expected, track,
 *   share-accountant, accept-fix, view-evidence, dismiss
 *
 * The cta.label on each Finding hints which action to dispatch; we
 * also walk back to the Finding's `kind` so a generic "View
 * evidence" works on any finding.
 *
 * Privacy: every artifact is local. Clipboard writes only;
 * never auto-sends. Plausible events bucketed (no PII).
 *
 * Wave A authors the Finding shape + CTA. Wave B renders. Wave C
 * (this module) executes.
 */
(function (root) {
  'use strict';

  function _es() {
    try { return (document.documentElement.lang || 'en').toLowerCase().slice(0, 2) === 'es'; }
    catch (_) { return false; }
  }
  function tt(en, es) { return _es() ? es : en; }

  function _ctx() { return root && root.MuntinContext; }
  function _undo(message, undoFn) {
    if (root && root.MID_DECODER_UNDO) {
      root.MID_DECODER_UNDO(message, undoFn, { ttl: 30000 });
    }
  }
  function _plausible(props) {
    if (root && root.plausible) {
      try { root.plausible('Invoice Decoder Briefing Action', { props: props }); } catch (_) {}
    }
  }
  function _toneClass(vendor) {
    if (!vendor) return 'unknown';
    var v = String(vendor).toLowerCase();
    if (/sysco|usf|us\s*foods|gfs|pfg|sygma|cheney|kehe|baldor|veritiv/.test(v)) return 'enterprise';
    if (/unfi|kpc|cooperative|coop/.test(v)) return 'cooperative';
    return 'small-distributor';
  }
  function _bucket(n) {
    var x = Math.abs(+n || 0);
    if (x < 25) return '<25';
    if (x < 100) return '25-99';
    if (x < 250) return '100-249';
    if (x < 1000) return '250-999';
    return '1000+';
  }

  // ---------- Finding lookup ----------
  // The renderer hands back the Finding id; we need the Finding back
  // for its evidence + cta payload. Synthesis result is stashed by
  // briefing-card on the host element so we can read it without
  // re-running synth.
  function _allFindings() {
    var host = document.getElementById('idBriefing');
    if (!host) return [];
    var brief = host.__brief;
    if (!brief) return [];
    var fs = brief.findings || [];
    if (Array.isArray(brief.positives)) fs = fs.concat(brief.positives);
    return fs;
  }
  function _findById(id) {
    var fs = _allFindings();
    for (var i = 0; i < fs.length; i++) {
      if (fs[i] && fs[i].id === id) return fs[i];
    }
    return null;
  }

  // ---------- Clipboard ----------
  function _copy(text) {
    if (!text || typeof text !== 'string') return Promise.resolve(false);
    if (root && root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      return root.navigator.clipboard.writeText(text).then(function () { return true; })
        .catch(function () { return _fallbackCopy(text); });
    }
    return Promise.resolve(_fallbackCopy(text));
  }
  function _fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (_) { return false; }
  }

  // ---------- Email/SMS templates ----------
  // Three tone classes per finding kind. Operator-owned: every output
  // is a plain-text artifact placed in the clipboard; nothing auto-sent.
  function _disputeTemplate(f) {
    var es = _es();
    var c = (f && f.evidence) || {};
    var vendor = (f && f.vendor) || c.vendor || tt('Vendor', 'Proveedor');
    var name   = (f && f.stem) || tt('item', 'producto');
    var over   = (typeof c.overcharge === 'number') ? c.overcharge.toFixed(2) : '';
    var actual = c.actualPrice != null ? c.actualPrice : '';
    var contr  = c.contractPrice != null ? c.contractPrice : '';
    var unit   = c.actualComparableUnit || c.contractComparableUnit || (es ? 'unidad' : 'unit');
    var tone   = _toneClass(vendor);

    if (tone === 'small-distributor') {
      // SMS-shaped, terse.
      return es
        ? 'Hola — la factura de hoy cobró $' + actual + '/' + unit +
          ' por ' + name + ', el contrato es $' + contr + '/' + unit +
          ' (sobrecargo $' + over + '). ¿Pueden ajustarlo? Gracias.'
        : 'Hi — today\'s invoice billed $' + actual + '/' + unit +
          ' for ' + name + ', contract is $' + contr + '/' + unit +
          ' (overcharge $' + over + '). Can you adjust? Thanks.';
    }
    // Enterprise + cooperative get full email shape.
    var subjEN = 'Subject: Contract reconciliation — ' + name + ' overcharge $' + over;
    var subjES = 'Asunto: Reconciliación de contrato — sobrecargo de $' + over + ' en ' + name;
    var bodyEN =
      'Hi,\n\n' +
      vendor + ' billed ' + name + ' at $' + actual + '/' + unit +
      ' on the latest invoice — our contract is $' + contr + '/' + unit +
      ' (overcharge $' + over + ').\n\n' +
      'Please issue a credit memo or adjust the next delivery. Thank you.';
    var bodyES =
      'Hola,\n\n' +
      vendor + ' facturó ' + name + ' a $' + actual + '/' + unit +
      ' en la factura más reciente — nuestro contrato es $' + contr + '/' + unit +
      ' (sobrecargo de $' + over + ').\n\n' +
      'Por favor emitan una nota de crédito o ajusten la próxima entrega. Gracias.';
    var sigEN = (tone === 'cooperative') ? '\n\nAppreciate the partnership.\n— Operator' : '\n\n— Operator';
    var sigES = (tone === 'cooperative') ? '\n\nGracias por la asociación.\n— Operador'    : '\n\n— Operador';
    return (es ? subjES + '\n\n' + bodyES + sigES : subjEN + '\n\n' + bodyEN + sigEN);
  }

  function _accountantTemplate(f) {
    var es = _es();
    var c = (f && f.evidence) || {};
    if (es) {
      return 'Asunto: FYI — costo de comida cambió en este pedido\n\n' +
        'Hola,\n\n' +
        'Para tu revisión: ' + (f.message || 'cambio detectado en costo') + '.\n\n' +
        'Detalle: ' + ((f.why && f.why.formula) || '') + '\n\n' +
        'Adjunto el CSV de las líneas afectadas para que lo importes a tu sistema contable.\n\n' +
        '— Operador';
    }
    return 'Subject: FYI — food cost moved on this invoice\n\n' +
      'Hi,\n\n' +
      'Wanted to flag for your review: ' + (f.message || 'cost change detected') + '.\n\n' +
      'Detail: ' + ((f.why && f.why.formula) || '') + '\n\n' +
      'Attached CSV is the affected lines for your accounting import.\n\n' +
      '— Operator';
  }

  function _vendorSwitchTemplate(f) {
    var es = _es();
    var ev = (f && f.evidence) || {};
    var stems = Array.isArray(ev.stems) ? ev.stems : [];
    var lines = stems.slice(0, 5).map(function (s) {
      return '- ' + s.stem + ': $' + (s.monthlyDelta || 0).toFixed(2) + (es ? '/mes' : '/mo');
    }).join('\n');
    if (es) {
      return 'Cambio guardado: ' + ev.from + ' → ' + ev.to + '\n\n' +
        'Ahorro estimado: $' + Math.round(ev.monthlyDelta || 0) + '/mes\n\n' +
        'Top SKUs:\n' + lines + '\n\n' +
        'Volveré a revisar en la próxima factura de ' + ev.to + ' y te diré si se cumplió.';
    }
    return 'Switch saved: ' + ev.from + ' → ' + ev.to + '\n\n' +
      'Estimated savings: $' + Math.round(ev.monthlyDelta || 0) + '/month\n\n' +
      'Top SKUs:\n' + lines + '\n\n' +
      'I\'ll re-check this on the next ' + ev.to + ' invoice and tell you if reality matched.';
  }

  // ---------- MuntinContext writes ----------
  function _appendActionLog(entry) {
    var c = _ctx();
    if (!c || typeof c.read !== 'function' || typeof c.merge !== 'function') return;
    try {
      var data = c.read() || {};
      var log = Array.isArray(data.actionLog) ? data.actionLog.slice() : [];
      log.unshift(Object.assign({ ts: Date.now() }, entry));
      if (log.length > 50) log = log.slice(0, 50);
      c.merge({ actionLog: log });
    } catch (_) {}
  }
  function _setDismissal(findingId) {
    var c = _ctx();
    if (!c || typeof c.merge !== 'function') return;
    try {
      var data = c.read() || {};
      var map = Object.assign({}, data.findingDismissals || {});
      map[findingId] = Date.now();
      c.merge({ findingDismissals: map });
    } catch (_) {}
  }
  function _undoDismissal(findingId) {
    var c = _ctx();
    if (!c || typeof c.merge !== 'function') return;
    try {
      var data = c.read() || {};
      var map = Object.assign({}, data.findingDismissals || {});
      delete map[findingId];
      c.merge({ findingDismissals: map });
    } catch (_) {}
  }
  function _setExpected(fingerprint, scope) {
    var c = _ctx();
    if (!c || typeof c.merge !== 'function') return;
    var ttl = scope === 'season' ? 90 * 86400000 :
              scope === 'invoice' ? 86400000 :
              365 * 86400000;
    try {
      var data = c.read() || {};
      var map = Object.assign({}, data.expectedFindings || {});
      map[fingerprint] = { until: Date.now() + ttl, scope: scope };
      c.merge({ expectedFindings: map });
    } catch (_) {}
  }
  function _addWatch(watch) {
    var c = _ctx();
    if (!c || typeof c.merge !== 'function') return;
    try {
      var data = c.read() || {};
      var list = Array.isArray(data.watches) ? data.watches.slice() : [];
      list.push(Object.assign({ id: 'w_' + Date.now(), createdAt: Date.now() }, watch));
      c.merge({ watches: list });
    } catch (_) {}
  }
  function _setPendingSwitch(stem, payload) {
    var c = _ctx();
    if (!c || typeof c.merge !== 'function') return;
    try {
      var data = c.read() || {};
      var map = Object.assign({}, data.pendingSwitches || {});
      map[stem] = Object.assign({ savedAt: Date.now(), expiresAt: Date.now() + 45 * 86400000 }, payload);
      c.merge({ pendingSwitches: map });
    } catch (_) {}
  }
  function _fingerprint(f) {
    return [f.kind, f.vendor || '', f.stem || '', f.category || ''].join(':');
  }

  // ---------- Action handlers ----------

  function _flashLabel(btn, label) {
    if (!btn) return;
    var orig = btn.textContent;
    btn.textContent = label;
    btn.disabled = true;
    setTimeout(function () { btn.textContent = orig; btn.disabled = false; }, 1800);
  }
  function _hideRow(findingId) {
    var row = document.querySelector('[data-finding-id="' + findingId + '"]');
    if (row && row.parentNode) row.parentNode.removeChild(row);
  }

  function _doCopyDispute(f, btn) {
    var text = _disputeTemplate(f);
    _copy(text).then(function (ok) {
      if (ok) _flashLabel(btn, tt('Copied ✓', 'Copiado ✓'));
    });
    _appendActionLog({ kind: 'copy-dispute', findingId: f.id, vendor: _toneClass(f.vendor) });
    _plausible({ action: 'copy-dispute', tone: _toneClass(f.vendor), bucket: _bucket(f.dollarImpact) });
    _undo(tt('Dispute note copied. Undo?', 'Nota copiada. ¿Deshacer?'), function () {});
  }

  function _doSwitchVendor(f, btn) {
    var ev = (f && f.evidence) || {};
    if (Array.isArray(ev.stems)) {
      ev.stems.forEach(function (s) {
        _setPendingSwitch(s.stem, {
          fromVendor: ev.from, toVendor: ev.to,
          savedDelta: s.monthlyDelta || 0,
          verifyOn: 'next-invoice-of-toVendor'
        });
      });
    }
    _setDismissal(f.id);
    _appendActionLog({ kind: 'switch-vendor', findingId: f.id, from: ev.from, to: ev.to });
    _plausible({ action: 'switch-vendor', bucket: _bucket(f.dollarImpact) });
    if (root && root.MID_WHATIF_PANEL && root.MID_WHATIF_PANEL.openWith) {
      root.MID_WHATIF_PANEL.openWith({ from: ev.from, to: ev.to });
    } else {
      // Fallback: copy the vendor-switch template so the operator has
      // something to act on even without the panel.
      _copy(_vendorSwitchTemplate(f));
    }
    _flashLabel(btn, tt('Saved ✓', 'Guardado ✓'));
    _undo(tt('Switch plan saved. Undo?', 'Plan de cambio guardado. ¿Deshacer?'), function () {
      _undoDismissal(f.id);
    });
  }

  function _doMarkExpected(f, btn) {
    _setExpected(_fingerprint(f), 'season');
    _setDismissal(f.id);
    _appendActionLog({ kind: 'mark-expected', findingId: f.id, scope: 'season' });
    _plausible({ action: 'mark-expected', scope: 'season' });
    _hideRow(f.id);
    _undo(tt('Marked as expected for the season. Undo?', 'Marcado como esperado por la temporada. ¿Deshacer?'), function () {
      _undoDismissal(f.id);
    });
  }

  function _doTrack(f, btn) {
    _addWatch({
      kind:           f.kind === 'price-drift' ? 'price-drift' : f.kind,
      stem:           f.stem || null,
      vendor:         f.vendor || null,
      threshold:      0.05,
      fireOn:         'next-invoice-of-vendor',
      ttl:            90 * 86400000,
      seedDollarImpact: Math.abs(f.dollarImpact || 0)
    });
    _appendActionLog({ kind: 'track', findingId: f.id });
    _plausible({ action: 'track', kind: f.kind });
    _flashLabel(btn, tt('Tracking ✓', 'Siguiendo ✓'));
    _undo(tt('Watch saved. Undo?', 'Alerta guardada. ¿Deshacer?'), function () {
      // Pop the watch we just added.
      var c = _ctx();
      if (!c) return;
      try {
        var data = c.read() || {};
        var list = Array.isArray(data.watches) ? data.watches.slice() : [];
        list.pop();
        c.merge({ watches: list });
      } catch (_) {}
    });
  }

  function _doShareAccountant(f, btn) {
    var emailBody = _accountantTemplate(f);
    _copy(emailBody);
    if (root && root.MID_ACCOUNTANT && typeof root.MID_ACCOUNTANT.exportGenericLedger === 'function') {
      try {
        var rows = (root.parsedRowsState || []).filter(function (r) { return r && !r.ignored; });
        var csv = root.MID_ACCOUNTANT.exportGenericLedger({ rows: rows, vendor: f.vendor });
        if (csv && root.MID_ACCOUNTANT.download) root.MID_ACCOUNTANT.download(csv, 'briefing-share.csv');
      } catch (_) {}
    }
    _appendActionLog({ kind: 'share-accountant', findingId: f.id });
    _plausible({ action: 'share-accountant', kind: f.kind });
    _flashLabel(btn, tt('Copied & saved ✓', 'Copiado y guardado ✓'));
    _undo(tt('Email copied + CSV saved. Undo?', 'Email copiado + CSV guardado. ¿Deshacer?'), function () {});
  }

  function _doAcceptFix(f, btn) {
    var p = (f.cta && f.cta.payload) || {};
    if (typeof p.rowIdx !== 'number' || typeof p.to !== 'number') {
      _flashLabel(btn, tt('No fix payload', 'Sin datos'));
      return;
    }
    if (root && root.parsedRowsState && root.parsedRowsState[p.rowIdx]) {
      var row = root.parsedRowsState[p.rowIdx];
      var prev = { lineTotal: row.lineTotal, ownerConfirmed: row.ownerConfirmed, confidence: row.confidence };
      row.lineTotal = p.to;
      row.ownerConfirmed = true;
      row.confidence = 100;
      if (root.MID_DECODER_RERENDER) root.MID_DECODER_RERENDER();
      _appendActionLog({ kind: 'accept-fix', findingId: f.id });
      _plausible({ action: 'accept-fix', kind: f.kind });
      _flashLabel(btn, tt('Applied ✓', 'Aplicado ✓'));
      _undo(tt('Math fix applied. Undo?', 'Corrección aplicada. ¿Deshacer?'), function () {
        row.lineTotal = prev.lineTotal;
        row.ownerConfirmed = prev.ownerConfirmed;
        row.confidence = prev.confidence;
        if (root.MID_DECODER_RERENDER) root.MID_DECODER_RERENDER();
      });
    }
  }

  function _doViewEvidence(f, btn) {
    showWhy(f.id);
  }

  function _doDismiss(f, btn) {
    _setDismissal(f.id);
    _hideRow(f.id);
    _appendActionLog({ kind: 'dismiss', findingId: f.id });
    _plausible({ action: 'dismiss', kind: f.kind });
    _undo(tt('Dismissed. Undo?', 'Descartado. ¿Deshacer?'), function () {
      _undoDismissal(f.id);
    });
  }

  // ---------- Public ----------

  // Map a Finding to the action it should run when its CTA is tapped.
  function _actionFor(f) {
    if (!f) return _doViewEvidence;
    if (f.cta && f.cta.label) {
      var lc = String(f.cta.label).toLowerCase();
      if (/copy|enviar nota|copiar/.test(lc) && f.kind === 'contract-overcharge') return _doCopyDispute;
      if (/switch|cambio|see switch plan|ver plan/.test(lc))                       return _doSwitchVendor;
      if (/mark|expected|esperado/.test(lc))                                       return _doMarkExpected;
      if (/track|history|historial|see history|seguir|ver historial/.test(lc))    return f.kind === 'price-drift' ? _doTrack : _doViewEvidence;
      if (/flag for review|marcar/.test(lc))                                       return _doTrack;
      if (/share|compartir|accountant|contador|adjust price|ajustar/.test(lc))    return _doShareAccountant;
      if (/apply fix|aplicar/.test(lc))                                            return _doAcceptFix;
      if (/compare vendor|comparar/.test(lc))                                      return _doSwitchVendor;
      if (/what changed|qué cambió/.test(lc))                                      return _doViewEvidence;
    }
    return _doViewEvidence;
  }

  function dispatch(findingId, btn) {
    var f = _findById(findingId);
    if (!f) return;
    var action = _actionFor(f);
    try { action(f, btn); } catch (e) {
      if (root && root.console) root.console.error('Briefing action error:', e);
    }
  }

  function showWhy(findingId) {
    var f = _findById(findingId);
    if (!f) return;
    if (root && root.MID_PROOF && typeof root.MID_PROOF.show === 'function') {
      try { root.MID_PROOF.show({ finding: f, why: f.why, evidence: f.evidence }); return; }
      catch (_) {}
    }
    // Fallback: alert with the formula.
    var msg = (f.why && f.why.formula) || f.message || tt('No evidence available.', 'Sin evidencia.');
    if (root && root.alert) root.alert(msg);
  }

  // Stash the synth result on the host so dispatch can read it later.
  function attachBrief(host, brief) {
    if (!host) return;
    host.__brief = brief;
  }

  var api = {
    dispatch:    dispatch,
    showWhy:     showWhy,
    attachBrief: attachBrief,
    _disputeTemplate:     _disputeTemplate,
    _accountantTemplate:  _accountantTemplate,
    _vendorSwitchTemplate: _vendorSwitchTemplate,
    _toneClass: _toneClass,
    _bucket:    _bucket
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_BRIEFING_ACTIONS = api;
})(typeof window !== 'undefined' ? window : null);
