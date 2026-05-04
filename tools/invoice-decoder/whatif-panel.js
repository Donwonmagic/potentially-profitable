/**
 * What-if simulator panel UI (Wave 14.3).
 *
 * Discovery surface for Wave 13.6's MID_WHATIF.simulate. Surfaces a
 * collapsed details element below the insight cards. When opened:
 *
 *   - lists the operator's eligible vendors (≥3 invoices)
 *   - two select boxes: "switch from" / "switch to"
 *   - "Run simulation" button
 *   - results: net monthly delta + winners + losers per stem
 *
 * Hidden when fewer than 2 eligible vendors exist (the simulator
 * needs at least one swap pair to be useful).
 */
(function (root) {
  'use strict';
  if (typeof root === 'undefined' || !root || !root.document) return;

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function _vendorLabel(v) {
    return String(v || '').replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function _fmtUsd(n) {
    var num = Number(n) || 0;
    return (num >= 0 ? '+$' : '−$') + Math.abs(num).toFixed(2);
  }

  function _mount() {
    if (document.getElementById('idWhatIf')) return;
    if (typeof MID_WHATIF === 'undefined') return;
    var vendors = MID_WHATIF.eligibleVendors() || [];
    if (vendors.length < 2) return;
    var anchor = document.getElementById('idInsights') ||
                 document.getElementById('idVendorPulse') ||
                 document.querySelector('.id-parsed') ||
                 document.body;
    var det = document.createElement('details');
    det.id = 'idWhatIf';
    det.className = 'id-whatif';
    det.innerHTML =
      '<summary class="id-whatif-summary">' +
        '<span class="id-whatif-icon" aria-hidden="true">⚖</span> ' +
        'What if I switched vendors?' +
        '<span class="id-whatif-tip">Compare ' + vendors.length + ' vendors in your history</span>' +
      '</summary>' +
      '<div class="id-whatif-body">' +
        '<div class="id-whatif-controls">' +
          '<label>From <select id="idWhatIfFrom">' +
            vendors.map(function (v) { return '<option value="' + _esc(v.vendor) + '">' + _esc(_vendorLabel(v.vendor)) + ' (' + v.count + ')</option>'; }).join('') +
          '</select></label>' +
          '<label>To <select id="idWhatIfTo">' +
            vendors.map(function (v, i) { return '<option value="' + _esc(v.vendor) + '"' + (i === 1 ? ' selected' : '') + '>' + _esc(_vendorLabel(v.vendor)) + ' (' + v.count + ')</option>'; }).join('') +
          '</select></label>' +
          '<button type="button" id="idWhatIfRun" class="id-whatif-run">Run simulation</button>' +
        '</div>' +
        '<div id="idWhatIfResult" class="id-whatif-result" hidden></div>' +
      '</div>';
    anchor.parentNode.insertBefore(det, anchor.nextSibling);

    var fromEl = det.querySelector('#idWhatIfFrom');
    var toEl   = det.querySelector('#idWhatIfTo');
    var runEl  = det.querySelector('#idWhatIfRun');
    var resEl  = det.querySelector('#idWhatIfResult');

    runEl.addEventListener('click', function () {
      var from = fromEl.value, to = toEl.value;
      if (from === to) {
        resEl.hidden = false;
        resEl.innerHTML = '<p class="id-whatif-empty">Pick two different vendors.</p>';
        return;
      }
      var sim = MID_WHATIF.simulate({ fromVendor: from, toVendor: to });
      if (!sim) {
        resEl.hidden = false;
        resEl.innerHTML = '<p class="id-whatif-empty">No overlapping SKUs in the operator\'s history for that pair.</p>';
        return;
      }
      var net = sim.netMonthly;
      var dir = net >= 0 ? 'win' : 'loss';
      var headline = net >= 0
        ? 'Switch saves <strong>' + _fmtUsd(net) + '/mo</strong>'
        : 'Switch costs <strong>' + _fmtUsd(net) + '/mo</strong>';
      var winnersHtml = sim.winners.length
        ? '<ul class="id-whatif-list">' + sim.winners.slice(0, 5).map(function (w) {
            return '<li class="id-whatif-row" data-dir="win">' +
              '<span class="id-whatif-stem">' + _esc(w.stem) + '</span>' +
              '<span class="id-whatif-prices">$' + w.fromMed.toFixed(2) + ' → $' + w.toMed.toFixed(2) + '</span>' +
              '<span class="id-whatif-delta">' + _fmtUsd(w.monthlyDelta) + '/mo</span>' +
            '</li>';
          }).join('') + '</ul>'
        : '';
      var losersHtml = sim.losers.length
        ? '<ul class="id-whatif-list">' + sim.losers.slice(0, 5).map(function (l) {
            return '<li class="id-whatif-row" data-dir="loss">' +
              '<span class="id-whatif-stem">' + _esc(l.stem) + '</span>' +
              '<span class="id-whatif-prices">$' + l.fromMed.toFixed(2) + ' → $' + l.toMed.toFixed(2) + '</span>' +
              '<span class="id-whatif-delta">' + _fmtUsd(l.monthlyDelta) + '/mo</span>' +
            '</li>';
          }).join('') + '</ul>'
        : '';
      resEl.hidden = false;
      resEl.innerHTML =
        '<p class="id-whatif-headline" data-dir="' + dir + '">' + headline + '</p>' +
        (winnersHtml ? '<h4 class="id-whatif-h">Winners (' + sim.winners.length + ')</h4>' + winnersHtml : '') +
        (losersHtml  ? '<h4 class="id-whatif-h">Losers ('  + sim.losers.length  + ')</h4>' + losersHtml  : '') +
        '<p class="id-whatif-disclaimer">Based on median per-unit prices in your history × your last 30 days of order volume from <strong>' + _esc(_vendorLabel(from)) + '</strong>.</p>';
      if (root.plausible) {
        try { root.plausible('Invoice Decoder What-If', { props: { dir: dir } }); } catch (_) {}
      }
    });
  }

  function init() {
    _mount();
    if (root.MuntinContext && typeof root.MuntinContext.subscribe === 'function') {
      root.MuntinContext.subscribe(function (changes) {
        var keys = changes && changes.changedKeys;
        if (!keys || keys.indexOf('skuHistory') !== -1 || keys.indexOf('invoiceTrend') !== -1) {
          var existing = document.getElementById('idWhatIf');
          if (existing) try { existing.parentNode.removeChild(existing); } catch (_) {}
          _mount();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : null);
