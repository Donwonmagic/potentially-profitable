/**
 * Studio Brief auto-bundler — Wave B11 of the empowerment plan.
 *
 * Takes a canonical v3 menu (from tools/_shared/menu-schema.js) and
 * produces a structured brief Don can open in /window/ to start a
 * Polish ($249) or Drop-in ($1,500) engagement without round-trips.
 *
 * Three output forms, each suitable for a different transport:
 *
 *   summarize(menu) → object
 *     A scannable JS object with sections, counts, dish-level
 *     diagnostics rolled up. Drives both the human and machine
 *     forms below.
 *
 *   toMarkdown(menu) → string
 *     A short Markdown brief the operator reads before clicking
 *     "Start a menu drop-in." Surfaces whatever cross-tool data
 *     the canonical menu carries (foodCost from menu-engineering,
 *     copyDiagnostic from menu-copy) so Don walks into a project
 *     pre-briefed.
 *
 *   toUrlFragment(menu) → string
 *     Base64url-encoded compact JSON suitable for stuffing into
 *     a URL hash, e.g. /window/?topic=menu-polish#brief=<...>.
 *     The receiving page (window) reads location.hash, decodes,
 *     and pre-fills the form. Privacy posture preserved: the
 *     payload never hits the network as a query parameter (the
 *     hash is client-side only by design); the operator chooses
 *     to send it by submitting the form.
 *
 * Privacy: pure synchronous data transformation. Zero fetch, zero
 * localStorage, zero side effects. Logos are NEVER embedded in
 * the brief — too large for a URL fragment, and Don has the
 * separate "send your logo to studio@..." path for that.
 *
 * UMD-ish loader: attaches MD_BRIEF on window in browser; exports
 * via module.exports in Node tests.
 */
(function (root) {
  'use strict';

  // ---------- helpers ----------
  function toNumber(s) {
    if (s == null) return NaN;
    if (typeof s === 'number') return s;
    var cleaned = String(s).replace(/[^\d.,\-]/g, '').replace(/,/g, '');
    return parseFloat(cleaned);
  }

  function uniq(arr) { return Array.from(new Set(arr)); }

  function priceRange(dishes) {
    var prices = dishes.map(function (d) { return toNumber(d.price); }).filter(function (n) { return isFinite(n); });
    if (!prices.length) return null;
    var min = Math.min.apply(null, prices);
    var max = Math.max.apply(null, prices);
    var avg = prices.reduce(function (a, b) { return a + b; }, 0) / prices.length;
    return { min: min, max: max, avg: Math.round(avg * 100) / 100, count: prices.length };
  }

  // Wave studio-quality — locale-aware money formatting that mirrors
  // the orchestrator's formatPriceDisplay so the studio brief Don
  // receives carries the operator's chosen currency notation.
  // Supports the same 8 currencies the meta-panel selector exposes.
  function fmtMoney(n, currency) {
    if (n == null || !isFinite(n)) return '—';
    var c = (currency || 'USD').toUpperCase();
    if (c === 'EUR') return n.toFixed(2) + ' €';     // symbol after, narrow space
    if (c === 'GBP') return '£' + n.toFixed(2);
    if (c === 'JPY') return '¥' + Math.round(n);     // yen has no decimals
    if (c === 'CHF') return 'CHF ' + n.toFixed(2);
    return '$' + n.toFixed(2);                       // USD / CAD / MXN / AUD default
  }

  // ---------- summarize ----------
  /**
   * @param {object} menu canonical v3 menu
   * @returns {object} brief summary suitable for rendering or transport
   */
  function summarize(menu) {
    if (!menu || typeof menu !== 'object') menu = { meta: {}, sections: [], dishes: [] };
    var meta = menu.meta || {};
    var theme = menu.theme || {};
    var sections = menu.sections || [];
    var dishes = menu.dishes || [];
    var currency = meta.currency || 'USD';

    // Per-section roll-up
    var bySection = sections
      .slice()
      .sort(function (a, b) { return (a.position || 0) - (b.position || 0); })
      .map(function (s) {
        var sd = dishes.filter(function (d) { return d.sectionId === s.id; });
        var pr = priceRange(sd);
        return {
          id: s.id,
          name: s.name || '(unnamed)',
          dishCount: sd.length,
          priceRange: pr,
          allergensUsed: uniq(sd.flatMap(function (d) { return Array.isArray(d.allergens) ? d.allergens : []; }))
        };
      });

    // Cross-tool diagnostic roll-ups
    var dishesWithFoodCost = dishes.filter(function (d) { return typeof d.foodCost === 'number' && isFinite(d.foodCost); });
    var dishesWithCopyDiag = dishes.filter(function (d) { return d.copyDiagnostic && typeof d.copyDiagnostic === 'object'; });

    var foodCostRollup = null;
    if (dishesWithFoodCost.length) {
      var ratios = dishesWithFoodCost
        .map(function (d) {
          var p = toNumber(d.price);
          return (isFinite(p) && p > 0) ? (d.foodCost / p) : NaN;
        })
        .filter(function (r) { return isFinite(r); });
      foodCostRollup = {
        dishCount: dishesWithFoodCost.length,
        coverage: dishesWithFoodCost.length / Math.max(1, dishes.length),
        avgRatio: ratios.length ? ratios.reduce(function (a, b) { return a + b; }, 0) / ratios.length : null
      };
    }

    var copyDiagRollup = null;
    if (dishesWithCopyDiag.length) {
      var scores = dishesWithCopyDiag
        .map(function (d) { return d.copyDiagnostic.score; })
        .filter(function (n) { return typeof n === 'number' && isFinite(n); });
      copyDiagRollup = {
        dishCount: dishesWithCopyDiag.length,
        coverage: dishesWithCopyDiag.length / Math.max(1, dishes.length),
        avgScore: scores.length ? Math.round((scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) * 10) / 10 : null
      };
    }

    var allergensUsed = uniq(dishes.flatMap(function (d) { return Array.isArray(d.allergens) ? d.allergens : []; }));
    var dietaryUsed = uniq(dishes.flatMap(function (d) { return Array.isArray(d.dietary) ? d.dietary : []; }));

    return {
      v: 1,
      generatedAt: Date.now(),
      business: {
        name: meta.businessName || '',
        tagline: meta.tagline || '',
        cuisine: meta.cuisine || '',
        locale: meta.locale || 'en',
        currency: currency,
        address: meta.address || '',
        allergenRegime: meta.allergenRegime || ''
      },
      counts: {
        sections: sections.length,
        dishes: dishes.length,
        allergens: allergensUsed.length,
        dietary: dietaryUsed.length
      },
      sections: bySection,
      priceRange: priceRange(dishes),
      allergensUsed: allergensUsed,
      dietaryUsed: dietaryUsed,
      theme: {
        id: theme.id || '',
        accent: theme.accent || '',
        paper: theme.paper || '',
        ink: theme.ink || '',
        mods: theme.mods || {},
        customDims: theme.customDims || null
      },
      diagnostics: {
        foodCost: foodCostRollup,
        copy: copyDiagRollup
      },
      source: menu.source || { tool: 'menu-design', updatedAt: Date.now(), transitionFrom: '' }
    };
  }

  // ---------- toMarkdown ----------
  function toMarkdown(menu) {
    var s = summarize(menu);
    var lines = [];
    var biz = s.business.name || '(unnamed restaurant)';
    var tag = s.business.tagline ? ' — ' + s.business.tagline : '';

    lines.push('# Studio brief: ' + biz + tag);
    lines.push('');
    lines.push('Auto-bundled from the Menu Design Suite. The operator hasn\'t');
    lines.push('typed any of this twice — every field below comes from the');
    lines.push('canonical menu they were already working on.');
    lines.push('');

    // Snapshot block
    lines.push('## At a glance');
    lines.push('- Sections: **' + s.counts.sections + '**');
    lines.push('- Dishes: **' + s.counts.dishes + '**');
    if (s.priceRange) {
      lines.push('- Price range: **' + fmtMoney(s.priceRange.min, s.business.currency) +
                 '** to **' + fmtMoney(s.priceRange.max, s.business.currency) +
                 '** (avg ' + fmtMoney(s.priceRange.avg, s.business.currency) + ')');
    }
    if (s.business.cuisine) lines.push('- Cuisine: **' + s.business.cuisine + '**');
    if (s.business.locale)  lines.push('- Locale: **' + s.business.locale + '**');
    if (s.business.allergenRegime) lines.push('- Allergen regime: **' + s.business.allergenRegime + '**');
    lines.push('');

    // Theme + customization block
    lines.push('## Theme + brand');
    lines.push('- Theme: **' + (s.theme.id || '(none picked)') + '**');
    if (s.theme.accent) lines.push('- Accent: `' + s.theme.accent + '`');
    if (s.theme.paper)  lines.push('- Paper: `' + s.theme.paper + '`');
    if (s.theme.ink)    lines.push('- Ink: `' + s.theme.ink + '`');
    var mods = s.theme.mods || {};
    var modBits = [];
    if (mods.season)  modBits.push('season=' + mods.season);
    if (mods.daypart) modBits.push('daypart=' + mods.daypart);
    if (mods.event)   modBits.push('event=' + mods.event);
    if (modBits.length) lines.push('- Modifiers: ' + modBits.join(', '));
    if (s.theme.customDims) {
      lines.push('- Custom paper: ' + JSON.stringify(s.theme.customDims));
    }
    lines.push('');

    // Per-section block
    if (s.sections.length) {
      lines.push('## Sections');
      s.sections.forEach(function (sec) {
        var pr = sec.priceRange
          ? ' — ' + fmtMoney(sec.priceRange.min, s.business.currency) + ' to ' + fmtMoney(sec.priceRange.max, s.business.currency)
          : '';
        lines.push('- **' + sec.name + '** (' + sec.dishCount + ' dish' + (sec.dishCount === 1 ? '' : 'es') + ')' + pr);
      });
      lines.push('');
    }

    // Allergens / dietary
    if (s.allergensUsed.length || s.dietaryUsed.length) {
      lines.push('## Allergen + dietary footprint');
      if (s.allergensUsed.length) lines.push('- Allergens used: ' + s.allergensUsed.map(function (c) { return '`' + c + '`'; }).join(', '));
      if (s.dietaryUsed.length)   lines.push('- Dietary tags: ' + s.dietaryUsed.map(function (c) { return '`' + c + '`'; }).join(', '));
      lines.push('');
    }

    // Cross-tool diagnostics if present
    if (s.diagnostics.foodCost) {
      lines.push('## Profitability (from Menu Engineering)');
      var fc = s.diagnostics.foodCost;
      lines.push('- Cost data on **' + fc.dishCount + '** of ' + s.counts.dishes + ' dishes (' + Math.round(fc.coverage * 100) + '% coverage)');
      if (fc.avgRatio != null) {
        lines.push('- Avg food-cost ratio: **' + Math.round(fc.avgRatio * 1000) / 10 + '%**');
      }
      lines.push('');
    }
    if (s.diagnostics.copy) {
      lines.push('## Copy diagnostics (from Menu Copy Inspector)');
      var c = s.diagnostics.copy;
      lines.push('- Diagnostics on **' + c.dishCount + '** of ' + s.counts.dishes + ' dishes (' + Math.round(c.coverage * 100) + '% coverage)');
      if (c.avgScore != null) {
        lines.push('- Avg copy score: **' + c.avgScore + '** / 100');
      }
      lines.push('');
    }

    // Provenance
    lines.push('## Provenance');
    lines.push('- Bundled at: ' + new Date(s.generatedAt).toISOString());
    lines.push('- Source tool: `' + s.source.tool + '`');
    if (s.source.transitionFrom) lines.push('- Schema migrated from: `' + s.source.transitionFrom + '`');
    lines.push('');

    return lines.join('\n');
  }

  // ---------- URL-fragment transport ----------
  // Compact base64url so the brief survives round-trips through
  // mailto:, hashchange events, and copy/paste. Operator-readable
  // brief travels via toMarkdown(); this is the machine surface.
  function _toBase64Url(json) {
    if (typeof Buffer !== 'undefined') {
      // Node path
      return Buffer.from(json, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    // Browser path
    var bytes = new TextEncoder().encode(json);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin)
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function _fromBase64Url(b64u) {
    var b64 = b64u.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf8');
    }
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function toUrlFragment(menu) {
    return _toBase64Url(JSON.stringify(summarize(menu)));
  }
  function fromUrlFragment(frag) {
    try {
      return JSON.parse(_fromBase64Url(frag));
    } catch (_) {
      return null;
    }
  }

  var api = {
    summarize: summarize,
    toMarkdown: toMarkdown,
    toUrlFragment: toUrlFragment,
    fromUrlFragment: fromUrlFragment,
    // exported for tests
    _toBase64Url:   _toBase64Url,
    _fromBase64Url: _fromBase64Url,
    _toNumber:      toNumber,
    _priceRange:    priceRange
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MD_BRIEF = api;
})(typeof window !== 'undefined' ? window : null);
