/**
 * Plate Cost — invoice-stale recipe banner + per-row ghost chips
 * (Waves 10.5 + 10.6).
 *
 * Two surfaces, both powered by data the Invoice Decoder writes at
 * save time:
 *
 *   (a) Stale banner — cold-load read of MuntinContext.recipeStaleQueue.
 *       If queue has entries, surface "5 recipes have ingredient
 *       prices that changed in your last Sysco invoice. [Review]"
 *       Operator can accept-all (apply all updates) or dismiss
 *       (write to skuMatchLearnings so the same false-positive
 *       doesn't recur).
 *
 *   (b) Per-row ghost chips — sync read of
 *       MuntinContext.latestSkuByStem(). For each Plate Cost row
 *       whose ingredient name matches a known stem with > 1% delta,
 *       render an inline "Sysco Apr 28: $4.20/lb (yours: $3.80) [Update]"
 *       chip. One tap commits the new price.
 *
 * Render-order discipline (audit finding #27):
 *   - Stale banner renders first (sync, no decrypt).
 *   - Existing W9-1 "Pull from last invoice" CTA renders second
 *     (async readInvoiceItems decrypt).
 *
 * Schema additions (Wave 10.7) on each recipe row:
 *   - _boundStem        — the operator-confirmed stem this row maps to
 *   - _apPriceSource    — 'manual' | 'invoice:<aad>' (defaults to manual
 *                         on pre-schema-change recipes — defensive)
 *   - _apPricePrev      — last operator-typed price (1-cycle undo)
 *
 * Privacy posture: pure read of plaintext aggregates already in
 * MuntinContext. No fetch, no decrypt for the stale banner. The
 * existing W9-1 pull path keeps the async decrypt for full row text.
 */
(function (root) {
  'use strict';

  if (typeof root === 'undefined' || !root || !root.document) return;

  // ---- helpers ----
  function $(id) { return document.getElementById(id); }
  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function fmtUnit(unit) {
    return ({
      'fl_oz': 'fl oz', 'fl-oz': 'fl oz', 'fl oz': 'fl oz',
      'lb': 'lb', 'kg': 'kg', 'oz': 'oz', 'gal': 'gal',
      'l': 'L', 'liter': 'L', 'ct': 'ct', 'each': 'each'
    })[String(unit || '').toLowerCase()] || unit || '';
  }
  function fmtPrice(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '?';
    if (Math.abs(n) >= 1) return '$' + n.toFixed(2);
    return '$' + n.toFixed(4).replace(/\.?0+$/, '');
  }
  function fmtRelDate(ts) {
    var d = new Date(ts || Date.now());
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ---- 10.5 stale banner ----
  function renderStaleBanner() {
    var host = $('pcStaleBanner');
    if (!host) return;
    if (typeof root.MuntinContext === 'undefined' || typeof root.MuntinContext.readRecipeStaleQueue !== 'function') {
      host.hidden = true;
      return;
    }
    var queue = root.MuntinContext.readRecipeStaleQueue();
    if (!queue.length) { host.hidden = true; host.innerHTML = ''; return; }
    // Group by dish for the headline count.
    var dishes = {};
    queue.forEach(function (e) { if (e && e.dish) dishes[e.dish] = true; });
    var dishCount = Object.keys(dishes).length;
    var biggestVendor = null, biggestCount = 0;
    var byVendor = {};
    queue.forEach(function (e) {
      var v = e && e.vendor;
      if (!v) return;
      byVendor[v] = (byVendor[v] || 0) + 1;
      if (byVendor[v] > biggestCount) { biggestCount = byVendor[v]; biggestVendor = v; }
    });
    var vendorLabel = biggestVendor
      ? (biggestVendor.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }))
      : 'last';
    host.innerHTML =
      '<div class="pc-stale">' +
        '<p class="pc-stale-msg">' +
          '<strong>' + dishCount + ' recipe' + (dishCount === 1 ? '' : 's') + '</strong> ' +
          'have ingredient prices that changed in your ' + escHtml(vendorLabel) + ' invoice (' +
          queue.length + ' update' + (queue.length === 1 ? '' : 's') + ' total).' +
        '</p>' +
        '<div class="pc-stale-actions">' +
          '<button type="button" class="pc-stale-review" id="pcStaleReview">Review changes</button>' +
          '<button type="button" class="pc-stale-acceptall" id="pcStaleAcceptAll">Accept all</button>' +
          '<button type="button" class="pc-stale-dismiss" id="pcStaleDismiss">Dismiss</button>' +
        '</div>' +
      '</div>';
    host.hidden = false;
    var review = $('pcStaleReview');
    var acceptAll = $('pcStaleAcceptAll');
    var dismiss = $('pcStaleDismiss');
    if (review) review.addEventListener('click', function () {
      _expandStaleList(host, queue);
    });
    if (acceptAll) acceptAll.addEventListener('click', function () {
      _applyStaleEntries(queue);
      root.MuntinContext.clearRecipeStaleQueue();
      host.hidden = true;
      host.innerHTML = '';
      if (root.plausible) {
        try { root.plausible('Plate Cost Stale Accept', { props: { mode: 'all', count_bucket: queue.length < 5 ? '<5' : queue.length < 12 ? '5-11' : '12+' } }); } catch (_) {}
      }
    });
    if (dismiss) dismiss.addEventListener('click', function () {
      _recordSkuMatchLearnings(queue, 'reject-all');
      root.MuntinContext.clearRecipeStaleQueue();
      host.hidden = true;
      host.innerHTML = '';
    });
  }

  function _expandStaleList(host, queue) {
    var list = queue.map(function (e, i) {
      var oldP = (e.oldPerBaseUnit != null) ? fmtPrice(e.oldPerBaseUnit) : '—';
      var newP = fmtPrice(e.newPerBaseUnit);
      var unit = '/' + fmtUnit(e.baseUnit);
      var deltaTag = '';
      if (typeof e.deltaPct === 'number') {
        var sign = e.deltaPct > 0 ? '+' : '';
        deltaTag = ' <span class="pc-stale-delta" data-dir="' + (e.deltaPct > 0 ? 'up' : 'down') + '">' + sign + e.deltaPct.toFixed(1) + '%</span>';
      }
      return '<li class="pc-stale-row">' +
        '<span class="pc-stale-row-dish">' + escHtml(e.dish) + ' · ' + escHtml(e.ingredient) + '</span>' +
        '<span class="pc-stale-row-prices">' + escHtml(oldP) + unit + ' → ' + escHtml(newP) + unit + deltaTag + '</span>' +
        '<button type="button" class="pc-stale-row-accept" data-idx="' + i + '">Apply</button>' +
        '<button type="button" class="pc-stale-row-skip" data-idx="' + i + '">Skip</button>' +
      '</li>';
    }).join('');
    host.innerHTML =
      '<div class="pc-stale pc-stale-expanded">' +
        '<p class="pc-stale-msg"><strong>Review ingredient updates</strong> from your last invoice. Apply each individually, or accept all.</p>' +
        '<ul class="pc-stale-list">' + list + '</ul>' +
        '<div class="pc-stale-actions">' +
          '<button type="button" class="pc-stale-acceptall" id="pcStaleAcceptAll">Accept all remaining</button>' +
          '<button type="button" class="pc-stale-dismiss" id="pcStaleDismiss">Dismiss the rest</button>' +
        '</div>' +
      '</div>';
    host.addEventListener('click', function _onClick(ev) {
      var t = ev.target;
      if (!t) return;
      var rowIdx = parseInt(t.getAttribute('data-idx') || '-1', 10);
      if (t.classList.contains('pc-stale-row-accept') && rowIdx >= 0) {
        _applyStaleEntries([queue[rowIdx]]);
        root.MuntinContext.ackRecipeStaleEntries(function (e) {
          return e && e.dish === queue[rowIdx].dish && e.stem === queue[rowIdx].stem;
        });
        var li = t.closest('.pc-stale-row');
        if (li && li.parentNode) li.parentNode.removeChild(li);
      } else if (t.classList.contains('pc-stale-row-skip') && rowIdx >= 0) {
        _recordSkuMatchLearnings([queue[rowIdx]], 'reject');
        root.MuntinContext.ackRecipeStaleEntries(function (e) {
          return e && e.dish === queue[rowIdx].dish && e.stem === queue[rowIdx].stem;
        });
        var li2 = t.closest('.pc-stale-row');
        if (li2 && li2.parentNode) li2.parentNode.removeChild(li2);
      } else if (t.id === 'pcStaleAcceptAll') {
        var remaining = root.MuntinContext.readRecipeStaleQueue();
        _applyStaleEntries(remaining);
        root.MuntinContext.clearRecipeStaleQueue();
        host.hidden = true;
        host.innerHTML = '';
      } else if (t.id === 'pcStaleDismiss') {
        var rest = root.MuntinContext.readRecipeStaleQueue();
        _recordSkuMatchLearnings(rest, 'reject-all');
        root.MuntinContext.clearRecipeStaleQueue();
        host.hidden = true;
        host.innerHTML = '';
      }
    }, true);
  }

  // Apply stale entries: walk current recipe rows, find matches by
  // dish + bound stem (or fuzzy name match), update apPrice and stamp
  // _apPriceSource. Surfaces the recipe in the operator's view.
  function _applyStaleEntries(entries) {
    if (!entries || !entries.length) return;
    if (!root.PlateCost || !root.PlateCost.applyStaleUpdates) {
      // Plate Cost controller exposes applyStaleUpdates as the
      // documented entry point; if missing, log and skip.
      return;
    }
    root.PlateCost.applyStaleUpdates(entries);
    if (root.plausible) {
      try { root.plausible('Plate Cost Stale Accept', { props: { mode: 'each', count_bucket: entries.length < 5 ? '<5' : entries.length < 12 ? '5-11' : '12+' } }); } catch (_) {}
    }
  }

  // Wave 10.5 — record dismissals so the same false-positive match
  // doesn't recur. Stored as { stem, dish, decision, ts } in
  // MuntinContext.skuMatchLearnings (capped at SKU_MATCH_LEARNINGS_CAP).
  function _recordSkuMatchLearnings(entries, decision) {
    if (!entries || !entries.length) return;
    if (typeof root.MuntinContext === 'undefined') return;
    var current = root.MuntinContext.read() || {};
    var arr = Array.isArray(current.skuMatchLearnings) ? current.skuMatchLearnings.slice() : [];
    var now = Date.now();
    entries.forEach(function (e) {
      if (!e || !e.stem) return;
      arr.unshift({ stem: e.stem, dish: e.dish || null, decision: decision, ts: now });
    });
    var cap = (root.MuntinContext.STORAGE_BUDGET && root.MuntinContext.STORAGE_BUDGET.SKU_MATCH_LEARNINGS_CAP) || 100;
    if (arr.length > cap) arr = arr.slice(0, cap);
    root.MuntinContext.merge({ skuMatchLearnings: arr });
  }

  // ---- 10.6 ghost chips ----
  // Renders a dashed-border chip beside any recipe-row ingredient
  // whose bound (or auto-matchable) stem has a > 1% comparable price
  // delta vs the current row's apPrice. One-tap accept commits.
  //
  // The Plate Cost controller calls renderGhostChips() after each
  // rerenderRows; chip lifetime ends on next rerender.
  function renderGhostChips() {
    if (typeof root.MuntinContext === 'undefined' || typeof root.MuntinContext.latestSkuByStem !== 'function') return;
    if (typeof root.MuntinStem === 'undefined' || typeof root.MuntinSkuMatch === 'undefined') return;
    var latest = root.MuntinContext.latestSkuByStem();
    var stems = Object.keys(latest);
    if (!stems.length) return;
    var rows = document.querySelectorAll('[data-pc-row]');
    Array.prototype.forEach.call(rows, function (rowEl) {
      // Skip if a ghost chip is already rendered.
      if (rowEl.querySelector('.pc-ghost-chip')) return;
      var apInput = rowEl.querySelector('[data-field="apPrice"]');
      var ingInput = rowEl.querySelector('[data-field="ingredient"]');
      if (!apInput || !ingInput) return;
      var name = String(ingInput.value || '').trim();
      if (!name) return;
      var currentPrice = parseFloat(apInput.value);
      var match = root.MuntinSkuMatch.classify(name, stems);
      // Auto + propose tiers both render the chip. Manual tier we
      // skip (operator hasn't confirmed the match yet).
      if (!match || (match.tier !== 'auto' && match.tier !== 'propose')) return;
      var info = latest[match.stem];
      if (!info) return;
      // Cross-family safety: don't propose if invoice baseUnit doesn't
      // match the row's apUnit family.
      var apUnitInput = rowEl.querySelector('[data-field="apUnit"]');
      var apUnit = apUnitInput ? apUnitInput.value : '';
      if (apUnit && root.MuntinPortionBridge && !root.MuntinPortionBridge.unitsCompatible(info.baseUnit, apUnit)) return;
      // Compute delta. Convert if needed.
      var newApPrice = info.perBaseUnit;
      if (apUnit && root.MuntinPortionBridge) {
        var oneBaseInApUnit = root.MuntinPortionBridge.convertQuantity(1, info.baseUnit, apUnit);
        if (oneBaseInApUnit && oneBaseInApUnit > 0) {
          newApPrice = info.perBaseUnit / oneBaseInApUnit;
        }
      }
      var delta = (currentPrice && currentPrice > 0)
                    ? (newApPrice - currentPrice) / currentPrice
                    : null;
      if (delta != null && Math.abs(delta) < 0.01) return;     // < 1% drift, no chip
      var vendorLabel = info.vendor
        ? (info.vendor.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }))
        : 'Last invoice';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pc-ghost-chip';
      btn.setAttribute('data-stem', match.stem);
      btn.setAttribute('data-new-price', newApPrice.toFixed(4));
      btn.setAttribute('data-source', 'invoice:' + (info.ts || ''));
      btn.title = 'Tap to update — ' + vendorLabel + ' on ' + fmtRelDate(info.ts);
      var sign = (delta != null && delta > 0) ? '+' : (delta != null ? '−' : '');
      var deltaText = (delta != null) ? ' (' + sign + Math.abs(delta * 100).toFixed(0) + '%)' : '';
      btn.textContent = vendorLabel + ' ' + fmtRelDate(info.ts) + ': ' + fmtPrice(newApPrice) + '/' + fmtUnit(apUnit || info.baseUnit) + deltaText;
      btn.addEventListener('click', function (ev) {
        ev.preventDefault();
        if (!root.PlateCost || !root.PlateCost.acceptGhostUpdate) return;
        root.PlateCost.acceptGhostUpdate({
          rowEl: rowEl,
          newApPrice: newApPrice,
          apUnit: apUnit,
          boundStem: match.stem,
          source: 'invoice:' + (info.ts || '')
        });
        if (root.plausible) {
          try { root.plausible('Plate Cost Ghost Update', { props: { tier: match.tier } }); } catch (_) {}
        }
      });
      // Insert after the apPrice input.
      apInput.parentNode.insertBefore(btn, apInput.nextSibling);
    });
  }

  function init() {
    renderStaleBanner();
    // Defer ghost chips until rows have rendered.
    setTimeout(renderGhostChips, 200);
    // Re-render ghosts on rerender events surfaced by Plate Cost.
    if (typeof root.addEventListener === 'function') {
      root.addEventListener('mid:plate-cost-rerender', function () {
        setTimeout(renderGhostChips, 50);
      });
    }
    // Cross-tab sync — when the queue is updated, refresh.
    if (root.MuntinContext && typeof root.MuntinContext.subscribe === 'function') {
      root.MuntinContext.subscribe(function () {
        renderStaleBanner();
        setTimeout(renderGhostChips, 50);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public helpers for tests / Plate Cost controller hooks.
  var api = {
    renderStaleBanner: renderStaleBanner,
    renderGhostChips: renderGhostChips
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.PlateCostStaleBanner = api;
})(typeof window !== 'undefined' ? window : null);
