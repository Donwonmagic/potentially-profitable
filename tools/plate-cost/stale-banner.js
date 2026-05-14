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
    if (!queue.length) { host.hidden = true; while (host.firstChild) host.removeChild(host.firstChild); return; }
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
    // Phase 3 hardening — escHtml already applies; setHTML adds a
    // try/catch around the assignment so a render throw renders an
    // empty (hidden) host instead of leaving the section blank.
    var bannerHtml =
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
    if (root.MuntinSafeHtml && root.MuntinSafeHtml.setHTML) {
      root.MuntinSafeHtml.setHTML(host, bannerHtml, { onError: function () { host.hidden = true; } });
    } else {
      host.innerHTML = bannerHtml;
    }
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
      while (host.firstChild) host.removeChild(host.firstChild);
      if (root.plausible) {
        try { root.plausible('Plate Cost Stale Accept', { props: { mode: 'all', count_bucket: queue.length < 5 ? '<5' : queue.length < 12 ? '5-11' : '12+' } }); } catch (_) {}
      }
    });
    if (dismiss) dismiss.addEventListener('click', function () {
      _recordSkuMatchLearnings(queue, 'reject-all');
      root.MuntinContext.clearRecipeStaleQueue();
      host.hidden = true;
      while (host.firstChild) host.removeChild(host.firstChild);
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
    var expandedHtml =
      '<div class="pc-stale pc-stale-expanded">' +
        '<p class="pc-stale-msg"><strong>Review ingredient updates</strong> from your last invoice. Apply each individually, or accept all.</p>' +
        '<ul class="pc-stale-list">' + list + '</ul>' +
        '<div class="pc-stale-actions">' +
          '<button type="button" class="pc-stale-acceptall" id="pcStaleAcceptAll">Accept all remaining</button>' +
          '<button type="button" class="pc-stale-dismiss" id="pcStaleDismiss">Dismiss the rest</button>' +
        '</div>' +
      '</div>';
    if (root.MuntinSafeHtml && root.MuntinSafeHtml.setHTML) {
      root.MuntinSafeHtml.setHTML(host, expandedHtml, { onError: function () { host.hidden = true; } });
    } else {
      host.innerHTML = expandedHtml;
    }
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
        while (host.firstChild) host.removeChild(host.firstChild);
      } else if (t.id === 'pcStaleDismiss') {
        var rest = root.MuntinContext.readRecipeStaleQueue();
        _recordSkuMatchLearnings(rest, 'reject-all');
        root.MuntinContext.clearRecipeStaleQueue();
        host.hidden = true;
        while (host.firstChild) host.removeChild(host.firstChild);
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

  // ---- 10.13 vendor-swap chips ----
  // For each row whose bound (or auto-matchable) stem has ≥2 vendors
  // with comparable history, surface a "↓ cheaper at {vendor} (-X%)"
  // chip when the gap exceeds 8%. One-tap opens an inline tooltip
  // with the "would save $/week, $/month" math (covers/week defaults
  // to a conservative 70 unless the operator has typed a coversPerWeek
  // value into the Plate Cost portions field).
  function renderVendorSwapChips() {
    if (typeof root.MuntinCrossVendor === 'undefined' || typeof root.MuntinSkuMatch === 'undefined') return;
    if (typeof root.MuntinContext === 'undefined' || typeof root.MuntinContext.latestSkuByStem !== 'function') return;
    var rows = document.querySelectorAll('[data-pc-row]');
    if (!rows.length) return;
    var portionsEl = document.getElementById('pcPortions');
    var portions = parseFloat(portionsEl && portionsEl.value) || 1;
    var coversPerWeek = portions * 7;     // assumption: 1 batch/day per portion
    var latest = root.MuntinContext.latestSkuByStem();
    var stems = Object.keys(latest);
    if (!stems.length) return;
    Array.prototype.forEach.call(rows, function (rowEl) {
      if (rowEl.querySelector('.pc-vswap-chip')) return;
      var apInput = rowEl.querySelector('[data-field="apPrice"]');
      var ingInput = rowEl.querySelector('[data-field="ingredient"]');
      var apUnitInput = rowEl.querySelector('[data-field="apUnit"]');
      var usedQtyInput = rowEl.querySelector('[data-field="usedQty"]');
      var usedUnitInput = rowEl.querySelector('[data-field="usedUnit"]');
      if (!apInput || !ingInput || !usedQtyInput || !usedUnitInput) return;
      var name = String(ingInput.value || '').trim();
      if (!name) return;
      var match = root.MuntinSkuMatch.classify(name, stems);
      if (!match || (match.tier !== 'auto' && match.tier !== 'propose')) return;
      var info = latest[match.stem];
      if (!info || !info.vendor) return;
      var rows2 = root.MuntinCrossVendor.compare({ name: name });
      if (!rows2 || rows2.length < 2) return;
      var cheapest = rows2[0];
      if (cheapest.vendor === info.vendor) return;     // already on cheapest
      var current = rows2.find(function (r) { return r.vendor === info.vendor; });
      if (!current || current.gapPctVsCheapest < 8) return;
      var portionQty = parseFloat(usedQtyInput.value) || 0;
      var portionUnit = usedUnitInput.value || apUnitInput.value || '';
      var saving = root.MuntinCrossVendor.projectMonthlySaving({
        name: name,
        currentVendor: info.vendor,
        targetVendor: cheapest.vendor,
        portionQty: portionQty,
        portionUnit: portionUnit,
        coversPerWeek: coversPerWeek
      });
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pc-vswap-chip';
      var label = '↓ ' + cheapest.vendor + ' −' + current.gapPctVsCheapest.toFixed(0) + '%';
      btn.textContent = label;
      var savingStr = saving
        ? (' — saves $' + Math.abs(saving.savingPerMonth).toFixed(0) + '/mo at ' + Math.round(coversPerWeek) + ' covers/wk')
        : '';
      btn.title = 'Cheaper at ' + cheapest.vendor + savingStr + '. Tap to copy as a comparison note.';
      btn.addEventListener('click', function () {
        if (!saving) return;
        var note = 'Switching ' + name + ' from ' + info.vendor + ' to ' + cheapest.vendor +
                   ' projects $' + Math.abs(saving.savingPerMonth).toFixed(2) + '/mo savings (' +
                   '$' + Math.abs(saving.savingPerPortion).toFixed(4) + '/portion × ~' + Math.round(coversPerWeek) + ' covers/wk).';
        try { navigator.clipboard && navigator.clipboard.writeText(note); } catch (_) {}
        btn.textContent = '✓ copied';
        setTimeout(function () { btn.textContent = label; }, 1800);
        if (root.plausible) {
          try { root.plausible('Invoice Decoder Vendor Switch ROI', { props: { dir: 'copy' } }); } catch (_) {}
        }
      });
      apInput.parentNode.insertBefore(btn, apInput.nextSibling);
    });
  }

  // ---- 10.14 match-health line ----
  // Surfaces the operator-owned-learning compounding moat in a single
  // line: "29 of 47 ingredients bound to invoices. [Match the rest]"
  // The "Match the rest" walk picks the highest-priority unbound row
  // (largest typed apPrice × usage) and scrolls + focuses it.
  function renderMatchHealth() {
    var line = $('pcMatchHealth');
    if (!line) return;
    var rows = document.querySelectorAll('[data-pc-row]');
    if (!rows.length || typeof root.MuntinContext === 'undefined' ||
        typeof root.MuntinContext.latestSkuByStem !== 'function') {
      line.hidden = true;
      return;
    }
    var latest = root.MuntinContext.latestSkuByStem();
    var stems = Object.keys(latest);
    if (!stems.length || typeof root.MuntinSkuMatch === 'undefined') {
      line.hidden = true;
      return;
    }
    var bound = 0, total = 0;
    var unbound = [];
    Array.prototype.forEach.call(rows, function (rowEl) {
      var ingInput = rowEl.querySelector('[data-field="ingredient"]');
      var apInput  = rowEl.querySelector('[data-field="apPrice"]');
      if (!ingInput) return;
      var name = String(ingInput.value || '').trim();
      if (!name) return;
      total++;
      // Bound = explicit boundStem on the row, OR auto-tier match
      // against history.
      var explicit = rowEl.getAttribute('data-bound-stem');
      if (explicit) { bound++; return; }
      var match = root.MuntinSkuMatch.classify(name, stems);
      if (match && match.tier === 'auto') { bound++; return; }
      var apPrice = parseFloat(apInput && apInput.value) || 0;
      unbound.push({ rowEl: rowEl, name: name, priority: apPrice });
    });
    if (!total) { line.hidden = true; return; }
    var pct = Math.round((bound / total) * 100);
    // Phase 3 hardening — build as DOM nodes; bound/total/pct are
    // numbers we control, but the pattern is now consistent with
    // the rest of the suite (no innerHTML on dynamic content).
    while (line.firstChild) line.removeChild(line.firstChild);
    line.appendChild(document.createTextNode(bound + ' of ' + total + ' ingredients bound to invoices (' + pct + '%).'));
    if (unbound.length) {
      var matchBtn = document.createElement('button');
      matchBtn.type = 'button';
      matchBtn.className = 'pc-match-rest';
      matchBtn.id = 'pcMatchRest';
      matchBtn.textContent = 'Match the rest';
      line.appendChild(document.createTextNode(' '));
      line.appendChild(matchBtn);
    } else {
      var ok = document.createElement('span');
      ok.className = 'pc-match-allgood';
      ok.textContent = 'all linked ✓';
      line.appendChild(document.createTextNode(' '));
      line.appendChild(ok);
    }
    line.hidden = false;
    var btn = $('pcMatchRest');
    if (btn) btn.addEventListener('click', function () {
      unbound.sort(function (a, b) { return b.priority - a.priority; });
      var first = unbound[0];
      if (!first) return;
      try { first.rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
      var ing = first.rowEl.querySelector('[data-field="ingredient"]');
      if (ing) try { ing.focus(); ing.select && ing.select(); } catch (_) {}
    });
  }

  function init() {
    renderStaleBanner();
    // Defer ghost chips until rows have rendered.
    setTimeout(function () {
      renderGhostChips();
      renderVendorSwapChips();
      renderMatchHealth();
    }, 200);
    // Re-render chips on rerender events surfaced by Plate Cost.
    if (typeof root.addEventListener === 'function') {
      root.addEventListener('mid:plate-cost-rerender', function () {
        setTimeout(function () {
          renderGhostChips();
          renderVendorSwapChips();
          renderMatchHealth();
        }, 50);
      });
    }
    // Cross-tab sync — when the queue is updated, refresh.
    if (root.MuntinContext && typeof root.MuntinContext.subscribe === 'function') {
      root.MuntinContext.subscribe(function () {
        renderStaleBanner();
        setTimeout(function () {
          renderGhostChips();
          renderVendorSwapChips();
          renderMatchHealth();
        }, 50);
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
    renderGhostChips: renderGhostChips,
    renderVendorSwapChips: renderVendorSwapChips,
    renderMatchHealth: renderMatchHealth
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.PlateCostStaleBanner = api;
})(typeof window !== 'undefined' ? window : null);
