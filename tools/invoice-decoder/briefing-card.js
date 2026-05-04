/**
 * Briefing Card renderer (Wave B).
 *
 * Consumes MID_DECISION_BRIEF.synthesize() output and renders a
 * single ranked card at #idBriefing. Replaces the wall-of-eight-
 * cards that #idInsights / #idVendorPulse / #idTrustSummary used
 * to compose into independently.
 *
 * Each finding: severity glyph (28×28), one-line message, optional
 * sub-line evidence, primary or secondary action button.
 *
 * Visual rules:
 *   - Top finding gets the only filled-teal primary button.
 *   - Critical (math-fix / large contract overcharge) is always primary.
 *   - Ranks 2–N are ghost-bordered secondaries.
 *   - Ranks 4–N collapse behind a "+N more — $X total" toggle.
 *   - Green path: 44px single line "Looks clean — math balances".
 *
 * Action dispatch: each button click forwards to MID_BRIEFING_ACTIONS
 * (Wave C). Until that loads, click is a no-op + console.warn.
 *
 * Privacy: pure DOM render of MID_DECISION_BRIEF output. No fetch.
 */
(function (root) {
  'use strict';

  function _es() {
    try { return (document.documentElement.lang || 'en').toLowerCase().slice(0, 2) === 'es'; }
    catch (_) { return false; }
  }
  function tt(en, es) { return _es() ? es : en; }

  function _glyphFor(severity) {
    if (severity === 'critical') return '!';
    if (severity === 'warn')     return '~';
    if (severity === 'positive') return '↗';
    if (severity === 'ok')       return '✓';
    return '•';
  }

  function _toneFor(severity) {
    if (severity === 'critical') return 'alert';
    if (severity === 'warn')     return 'warn';
    if (severity === 'positive') return 'positive';
    if (severity === 'ok')       return 'ok';
    return 'info';
  }

  function _topTone(findings) {
    if (!findings.length) return 'info';
    var sevRank = { critical: 4, warn: 3, info: 2, positive: 1 };
    var top = findings.slice().sort(function (a, b) {
      return (sevRank[b.severity] || 0) - (sevRank[a.severity] || 0);
    })[0];
    return _toneFor(top.severity);
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Compose a sub-line under the message. Pulls structured fields from
  // why.inputs when available; falls back to formula.
  function _subLine(f) {
    if (!f.why) return '';
    var i = f.why.inputs || {};
    if (f.kind === 'contract-overcharge' && i.contractPrice != null && i.actualPrice != null) {
      var unit = i.contractComparableUnit || i.actualComparableUnit || 'u';
      return tt(
        'contract $' + i.contractPrice + '/' + unit + ' · billed $' + i.actualPrice + '/' + unit,
        'contrato $' + i.contractPrice + '/' + unit + ' · facturado $' + i.actualPrice + '/' + unit
      );
    }
    if (f.kind === 'price-drift' && i.observations && i.median90) {
      return tt(
        'last ' + i.observations + ' invoices avg $' + i.median90,
        'últimas ' + i.observations + ' facturas, prom. $' + i.median90
      );
    }
    if (f.kind === 'forecast-anomaly' && i.median != null) {
      return tt(
        'vendor median $' + i.median + ' over ' + (f.why.sampleSize || 0) + ' invoices',
        'mediana proveedor $' + i.median + ' en ' + (f.why.sampleSize || 0) + ' facturas'
      );
    }
    if (f.kind === 'vendor-switch' && f.evidence && Array.isArray(f.evidence.stems)) {
      return tt(
        f.evidence.stems.length + ' SKUs · top: ' + (f.evidence.stems[0] && f.evidence.stems[0].stem),
        f.evidence.stems.length + ' SKUs · top: ' + (f.evidence.stems[0] && f.evidence.stems[0].stem)
      );
    }
    if (f.kind === 'supplier-health' && i.stats) {
      return tt(
        'backorder ' + i.stats.backorderRate + '% · price CV ' + i.stats.priceCV + '%',
        'faltantes ' + i.stats.backorderRate + '% · variación ' + i.stats.priceCV + '%'
      );
    }
    if (f.kind === 'shrinkage' && i.recentCount != null) {
      return tt(
        'z-score ' + i.z + ' · $' + i.dollarExposure + ' exposure',
        'z-score ' + i.z + ' · $' + i.dollarExposure + ' expuesto'
      );
    }
    return f.why.formula || '';
  }

  function _findingToHtml(f, isPrimary) {
    var tone = _toneFor(f.severity);
    var btnClass = 'id-brief-action';
    if (isPrimary) {
      btnClass += f.severity === 'critical' ? ' id-brief-action--alert' : ' id-brief-action--primary';
    }
    var ctaLabel = (f.cta && f.cta.label) || tt('View evidence', 'Ver evidencia');
    var sub = _subLine(f);
    return '' +
      '<li class="id-brief-row" data-finding-id="' + _esc(f.id) + '">' +
        '<span class="id-brief-glyph" data-tone="' + tone + '" aria-hidden="true">' + _esc(_glyphFor(f.severity)) + '</span>' +
        '<div class="id-brief-body">' +
          '<p class="id-brief-msg">' + _esc(f.message) + '</p>' +
          (sub ? '<p class="id-brief-sub">' + _esc(sub) + '</p>' : '') +
          '<div class="id-brief-action-row">' +
            '<button type="button" class="' + btnClass + '" data-brief-cta="' + _esc(f.id) + '">' +
              _esc(ctaLabel) +
            '</button>' +
            '<button type="button" class="id-brief-evidence" data-brief-evidence="' + _esc(f.id) + '">' +
              tt('Why?', '¿Por qué?') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</li>';
  }

  // Default green-path message (used when synth says ok-to-save).
  function _greenPathHtml(positives) {
    var head = '<header class="id-briefing-head">' + _esc(tt('Today\'s briefing', 'Resumen de hoy')) + '</header>';
    var msg = '<p class="id-brief-green">' +
      '<strong>' + _esc(tt('Looks clean.', 'Se ve bien.')) + '</strong> ' +
      _esc(tt('Math balances, nothing off your baseline. Save to lock it in.',
              'La suma cuadra, nada fuera de tu base. Guarda para registrarlo.')) +
      '</p>';
    var pos = '';
    if (positives && positives.length) {
      pos = '<ul class="id-briefing-list">' +
        positives.slice(0, 1).map(function (p) { return _findingToHtml(p, false); }).join('') +
        '</ul>';
    }
    return head + msg + pos;
  }

  // Render MID_DECISION_BRIEF output into #idBriefing.
  function render(host, briefResult) {
    if (!host || !briefResult) return;
    // Stash the result so the action layer (Wave C) can resolve a
    // findingId back to its full Finding object on click.
    host.__brief = briefResult;
    if (root && root.MID_BRIEFING_ACTIONS && root.MID_BRIEFING_ACTIONS.attachBrief) {
      root.MID_BRIEFING_ACTIONS.attachBrief(host, briefResult);
    }
    if (briefResult.state === 'ok-to-save') {
      host.dataset.tone = 'ok';
      host.innerHTML = _greenPathHtml(briefResult.positives);
      host.hidden = false;
      return;
    }
    var findings = briefResult.findings || [];
    if (!findings.length) { host.hidden = true; return; }

    host.dataset.tone = _topTone(findings);
    var visible = findings.slice(0, 3);
    var hidden  = findings.slice(3);
    var totalHiddenDollar = hidden.reduce(function (s, f) {
      return s + Math.abs(f.dollarImpact || 0);
    }, 0);

    var head = '<header class="id-briefing-head">' +
      '<span>' + _esc(tt('Today\'s briefing', 'Resumen de hoy')) + '</span>' +
      '<span>' + findings.length + ' ' + (findings.length === 1
        ? _esc(tt('finding', 'hallazgo'))
        : _esc(tt('findings', 'hallazgos'))) +
      '</span>' +
      '</header>';

    // Rank 1 always gets primary; critical findings remain primary if rank > 1
    // is also critical (handled by _findingToHtml class assignment via flag).
    var primaryIdx = 0;
    var alertIdx = findings.findIndex(function (f) { return f.severity === 'critical'; });
    if (alertIdx > 0) primaryIdx = alertIdx;

    var listHtml = '<ul class="id-briefing-list">' +
      visible.map(function (f, i) { return _findingToHtml(f, i === primaryIdx); }).join('') +
      '</ul>';

    var moreHtml = '';
    if (hidden.length) {
      var moreLabel = '+' + hidden.length + ' ' + _esc(tt('more', 'más')) +
        ' — $' + totalHiddenDollar.toFixed(0) + ' ' + _esc(tt('total exposure', 'exposición total'));
      moreHtml =
        '<button type="button" class="id-brief-more" data-brief-toggle="more" aria-expanded="false">' +
          moreLabel +
        '</button>' +
        '<ul class="id-brief-extra" id="idBriefingExtra" hidden>' +
          hidden.map(function (f) { return _findingToHtml(f, false); }).join('') +
        '</ul>';
    }

    host.innerHTML = head + listHtml + moreHtml;
    host.hidden = false;
    _wireEventDelegation(host);
  }

  function _wireEventDelegation(host) {
    if (host.__briefingWired) return;
    host.__briefingWired = true;
    host.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.matches) return;

      // "+N more" toggle
      if (t.matches('[data-brief-toggle="more"]')) {
        var extra = host.querySelector('#idBriefingExtra');
        if (extra) {
          var showing = !extra.hidden;
          extra.hidden = showing;
          t.setAttribute('aria-expanded', showing ? 'false' : 'true');
        }
        return;
      }

      // Why? evidence button
      var evBtn = t.closest && t.closest('[data-brief-evidence]');
      if (evBtn) {
        var fid = evBtn.getAttribute('data-brief-evidence');
        if (root && root.MID_BRIEFING_ACTIONS && root.MID_BRIEFING_ACTIONS.showWhy) {
          root.MID_BRIEFING_ACTIONS.showWhy(fid);
        }
        return;
      }

      // Primary or secondary CTA
      var ctaBtn = t.closest && t.closest('[data-brief-cta]');
      if (ctaBtn) {
        var fid2 = ctaBtn.getAttribute('data-brief-cta');
        if (root && root.MID_BRIEFING_ACTIONS && root.MID_BRIEFING_ACTIONS.dispatch) {
          root.MID_BRIEFING_ACTIONS.dispatch(fid2, ctaBtn);
        } else {
          if (root && root.console) root.console.warn('Briefing action layer not loaded yet:', fid2);
        }
        return;
      }
    });
  }

  // Convenience entry point: take a parsed result and render. Caller
  // passes `parsedResult.rows` and the matched `vendor` id.
  function renderFromParsed(parsed, vendor) {
    var host = document.getElementById('idBriefing');
    if (!host) return null;
    var DB = root && root.MID_DECISION_BRIEF;
    if (!DB || typeof DB.synthesize !== 'function') { host.hidden = true; return null; }
    var rows = (parsed && parsed.rows) || [];
    var brief = DB.synthesize(rows, parsed, vendor);
    render(host, brief);
    return brief;
  }

  var api = {
    render:           render,
    renderFromParsed: renderFromParsed,
    _findingToHtml:   _findingToHtml,
    _greenPathHtml:   _greenPathHtml
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MID_BRIEFING_CARD = api;
})(typeof window !== 'undefined' ? window : null);
